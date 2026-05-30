// Static server + lightweight Veil e-reader API
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 5000;

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.pdf': 'application/pdf',
  '.epub': 'application/epub+zip',
  '.md': 'text/markdown',
  '.webmanifest': 'application/manifest+json',
};

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

// Load reader page if it exists
let readerHtml = '';
try {
  readerHtml = fs.readFileSync(path.join(__dirname, 'reader.html'), 'utf8');
} catch(e) {
  readerHtml = indexHtml; // fallback
}

// Parse the ebook markdown into volumes/chapters
let cachedVolumes = null;
function getVolumes() {
  if (cachedVolumes) return cachedVolumes;
  const mdPaths = [
    path.join(__dirname, 'public', 'through-the-veil.md'),
    path.join(__dirname, 'client', 'public', 'through-the-veil.md'),
  ];
  let md = '';
  for (const p of mdPaths) {
    if (fs.existsSync(p)) { md = fs.readFileSync(p, 'utf8'); break; }
  }
  if (!md) return [];

  const lines = md.split('\n');
  const chapters = [];
  let current = null;
  let content = [];
  let currentPart = '';

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (/^# PART [IVXLC]+[-]?[A-Z]?:/i.test(line) || /^# PART (ONE|TWO|THREE|FOUR|FIVE|SIX|SEVEN|EIGHT|NINE|TEN|ELEVEN|TWELVE)[-]?[A-Z]?:/i.test(line)) {
      currentPart = line.replace(/^# /, '').trim();
      continue;
    }
    const chapterMatch = line.match(/^# (CHAPTER \d+[A-Z]?:.+)$/i);
    const appendixMatch = line.match(/^# (APPENDIX[^:]*:.*)$/i) || line.match(/^# (APPENDIX.*)$/i);

    if (chapterMatch || appendixMatch) {
      if (current) { current.content = content.join('\n').trim(); chapters.push(current); }
      const title = (chapterMatch ? chapterMatch[1] : appendixMatch[1]).trim();
      const id = 'ch-' + title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/-+/g, '-').substring(0, 50);
      if (appendixMatch && !currentPart.includes('APPENDIX')) currentPart = 'APPENDIX: Reference Materials';
      current = { id, title, content: '', partTitle: currentPart };
      content = [];
      continue;
    }
    if (/^## TABLE OF CONTENTS/i.test(line)) {
      while (i < lines.length - 1 && !/^# PART/i.test(lines[i + 1])) i++;
      continue;
    }
    if (current) content.push(line);
  }
  if (current) { current.content = content.join('\n').trim(); chapters.push(current); }

  // Group by part
  const partMap = new Map();
  for (const ch of chapters) {
    const part = ch.partTitle || 'Main Content';
    if (!partMap.has(part)) partMap.set(part, []);
    partMap.get(part).push(ch);
  }

  const volumes = [];
  let vi = 0;
  for (const [partTitle, partChapters] of partMap.entries()) {
    if (partChapters.length === 0) continue;
    volumes.push({
      id: 'volume-' + vi,
      title: partTitle,
      subtitle: partChapters.length + ' chapter' + (partChapters.length > 1 ? 's' : ''),
      chapters: partChapters,
    });
    vi++;
  }
  cachedVolumes = volumes;
  return volumes;
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url, 'http://localhost');

  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') { res.writeHead(204); return res.end(); }

  // Health
  if (url.pathname === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'theveil' }));
  }

  // Veil TOC API
  if (url.pathname === '/api/veil/toc') {
    const volumes = getVolumes();
    const tocData = volumes.map(v => ({
      id: v.id,
      title: v.title,
      subtitle: v.subtitle,
      chapters: v.chapters.map(c => ({ id: c.id, title: c.title, partTitle: c.partTitle })),
    }));
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify(tocData));
  }

  // Veil chapter API
  const chapterMatch = url.pathname.match(/^\/api\/veil\/chapter\/(\d+)\/(\d+)$/);
  if (chapterMatch) {
    const volumes = getVolumes();
    const vi = parseInt(chapterMatch[1]);
    const ci = parseInt(chapterMatch[2]);
    if (vi < volumes.length && ci < volumes[vi].chapters.length) {
      const ch = volumes[vi].chapters[ci];
      res.writeHead(200, { 'Content-Type': 'application/json' });
      return res.end(JSON.stringify({ id: ch.id, title: ch.title, content: ch.content, partTitle: ch.partTitle }));
    }
    res.writeHead(404, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ error: 'Chapter not found' }));
  }

  // PDF download
  if (url.pathname === '/api/veil/pdf') {
    const pdfPaths = [
      path.join(__dirname, 'public', 'assets', 'Through-The-Veil-EBOOK.pdf'),
      path.join(__dirname, 'client', 'public', 'assets', 'Through-The-Veil-EBOOK.pdf'),
    ];
    for (const p of pdfPaths) {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        res.writeHead(200, {
          'Content-Type': 'application/pdf',
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment; filename="Through-The-Veil.pdf"',
        });
        return fs.createReadStream(p).pipe(res);
      }
    }
    res.writeHead(404); return res.end('PDF not found');
  }

  // EPUB download
  if (url.pathname === '/api/veil/epub') {
    const epubPaths = [
      path.join(__dirname, 'public', 'assets', 'Through-The-Veil-EBOOK.epub'),
      path.join(__dirname, 'client', 'public', 'assets', 'Through-The-Veil-EBOOK.epub'),
    ];
    for (const p of epubPaths) {
      if (fs.existsSync(p)) {
        const stat = fs.statSync(p);
        res.writeHead(200, {
          'Content-Type': 'application/epub+zip',
          'Content-Length': stat.size,
          'Content-Disposition': 'attachment; filename="Through-The-Veil.epub"',
        });
        return fs.createReadStream(p).pipe(res);
      }
    }
    res.writeHead(404); return res.end('EPUB not found');
  }

  // Reader page
  if (url.pathname === '/veil/read' || url.pathname === '/veil/read/') {
    res.writeHead(200, { 'Content-Type': 'text/html' });
    return res.end(readerHtml);
  }

  // Static files from public dirs
  const tryPaths = [
    path.join(__dirname, 'public', url.pathname),
    path.join(__dirname, 'client', 'public', url.pathname),
  ];
  for (const filePath of tryPaths) {
    if (url.pathname !== '/' && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath);
      res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
      return fs.createReadStream(filePath).pipe(res);
    }
  }

  // Fallback -> index.html
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(indexHtml);
});

server.listen(PORT, () => {
  console.log(`[TheVeil] Serving on port ${PORT}`);
  const volumes = getVolumes();
  const totalChapters = volumes.reduce((sum, v) => sum + v.chapters.length, 0);
  console.log(`[TheVeil] Loaded ${totalChapters} chapters across ${volumes.length} volumes`);
});
