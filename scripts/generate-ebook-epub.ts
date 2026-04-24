import fs from 'fs';
import path from 'path';
import archiver from 'archiver';

const inputMd = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-PROFESSIONAL.md');
const outputEpub = path.join(process.cwd(), 'attached_assets', 'Through-The-Veil-EBOOK.epub');

interface Chapter {
  id: string;
  title: string;
  content: string;
  level: number;
}

function sanitizeId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .substring(0, 50);
}

function sanitizeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function parseMarkdownToChapters(content: string): Chapter[] {
  const lines = content.split('\n');
  const chapters: Chapter[] = [];
  let currentChapter: Chapter | null = null;
  let currentContent: string[] = [];
  let chapterIndex = 0;

  for (const line of lines) {
    if (line.startsWith('# ') && !line.startsWith('## ')) {
      if (currentChapter) {
        currentChapter.content = currentContent.join('\n');
        chapters.push(currentChapter);
      }
      chapterIndex++;
      const title = line.replace(/^# /, '').trim();
      currentChapter = {
        id: `chapter-${chapterIndex}-${sanitizeId(title)}`,
        title: title,
        content: '',
        level: 1
      };
      currentContent = [];
    } else if (currentChapter) {
      currentContent.push(line);
    }
  }

  if (currentChapter) {
    currentChapter.content = currentContent.join('\n');
    chapters.push(currentChapter);
  }

  return chapters;
}

function markdownToHtml(markdown: string, chapters: Chapter[]): string {
  let html = markdown;
  
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  
  html = html.replace(/\[→ Concordance: ([^\]]+)\]/g, (match, term) => {
    const termId = sanitizeId(term);
    return `<a href="concordance.xhtml#${termId}" class="concordance-link">[→ ${sanitizeHtml(term)}]</a>`;
  });
  
  html = html.replace(/\[→ Chapter (\d+)([^\]]*)\]/g, (match, num, rest) => {
    return `<a href="#chapter-${num}" class="chapter-link">[→ Chapter ${num}${sanitizeHtml(rest)}]</a>`;
  });
  
  html = html.replace(/\*\[Key references: ([^\]]+) → Concordance\]\*/g, (match, refs) => {
    const terms = refs.split(',').map((t: string) => t.trim());
    const links = terms.map((term: string) => {
      const termId = sanitizeId(term);
      return `<a href="concordance.xhtml#${termId}">${sanitizeHtml(term)}</a>`;
    }).join(', ');
    return `<p class="key-refs"><em>Key references: ${links} → Concordance</em></p>`;
  });
  
  const lines = html.split('\n');
  const processedLines: string[] = [];
  let inList = false;
  let inParagraph = false;
  
  for (const line of lines) {
    const trimmed = line.trim();
    
    if (trimmed === '---') {
      if (inList) {
        processedLines.push('</ul>');
        inList = false;
      }
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push('<hr/>');
      continue;
    }
    
    if (trimmed.startsWith('- ')) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      if (!inList) {
        processedLines.push('<ul>');
        inList = true;
      }
      processedLines.push(`<li>${trimmed.substring(2)}</li>`);
      continue;
    }
    
    if (inList && !trimmed.startsWith('- ')) {
      processedLines.push('</ul>');
      inList = false;
    }
    
    if (trimmed.startsWith('<h') || trimmed.startsWith('<hr') || trimmed.startsWith('<p class="key-refs"')) {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      processedLines.push(trimmed);
      continue;
    }
    
    if (trimmed === '') {
      if (inParagraph) {
        processedLines.push('</p>');
        inParagraph = false;
      }
      continue;
    }
    
    if (!inParagraph) {
      processedLines.push('<p>');
      inParagraph = true;
    }
    processedLines.push(trimmed);
  }
  
  if (inParagraph) processedLines.push('</p>');
  if (inList) processedLines.push('</ul>');
  
  return processedLines.join('\n');
}

function generateChapterXhtml(chapter: Chapter, chapters: Chapter[]): string {
  const bodyHtml = markdownToHtml(chapter.content, chapters);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>${sanitizeHtml(chapter.title)}</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <section epub:type="chapter" id="${chapter.id}">
    <h1>${sanitizeHtml(chapter.title)}</h1>
    ${bodyHtml}
  </section>
</body>
</html>`;
}

function generateConcordanceXhtml(markdown: string): string {
  const concordanceMatch = markdown.match(/## COMPREHENSIVE CONCORDANCE([\s\S]*?)(?=## Language Inversions|$)/);
  if (!concordanceMatch) return '';
  
  let concordanceContent = concordanceMatch[1];
  
  concordanceContent = concordanceContent.replace(/\*\*([^*]+)\*\*/g, (match, term) => {
    const termId = sanitizeId(term.split('(')[0].trim());
    return `<dt id="${termId}"><strong>${sanitizeHtml(term)}</strong></dt>`;
  });
  
  concordanceContent = concordanceContent.replace(/^- (.+)$/gm, '<dd>$1</dd>');
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Concordance</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <section epub:type="glossary" id="concordance">
    <h1>Comprehensive Concordance</h1>
    <dl class="concordance">
      ${concordanceContent}
    </dl>
  </section>
</body>
</html>`;
}

function generateStyles(): string {
  return `
body {
  font-family: Georgia, "Times New Roman", serif;
  font-size: 1em;
  line-height: 1.6;
  margin: 1em;
  color: #1a1a1a;
}

h1 {
  font-size: 1.5em;
  font-weight: bold;
  margin-top: 0;
  margin-bottom: 1em;
  page-break-before: always;
  page-break-after: avoid;
}

h2 {
  font-size: 1.2em;
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.5em;
  page-break-after: avoid;
}

h3 {
  font-size: 1.1em;
  font-weight: bold;
  margin-top: 1em;
  margin-bottom: 0.5em;
}

p {
  margin: 0.5em 0;
  text-align: justify;
  text-indent: 1.5em;
}

p:first-of-type {
  text-indent: 0;
}

.key-refs {
  text-indent: 0;
  font-style: italic;
  margin-bottom: 1em;
  border-left: 3px solid #666;
  padding-left: 1em;
}

ul {
  margin: 0.5em 0;
  padding-left: 2em;
}

li {
  margin: 0.25em 0;
}

a {
  color: #2a5db0;
  text-decoration: none;
}

a:hover {
  text-decoration: underline;
}

.concordance-link {
  font-size: 0.9em;
  color: #666;
}

hr {
  border: none;
  border-top: 1px solid #ccc;
  margin: 2em 0;
}

.concordance dt {
  font-weight: bold;
  margin-top: 1.5em;
  margin-bottom: 0.25em;
}

.concordance dd {
  margin-left: 1.5em;
  margin-bottom: 0.25em;
}

blockquote {
  margin: 1em 2em;
  font-style: italic;
  border-left: 3px solid #999;
  padding-left: 1em;
}

em {
  font-style: italic;
}

strong {
  font-weight: bold;
}

section[epub|type="chapter"] {
  page-break-before: always;
}
`;
}

function generateContainerXml(): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles>
    <rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/>
  </rootfiles>
</container>`;
}

function generateContentOpf(chapters: Chapter[]): string {
  const manifestItems = chapters.map((ch, i) => 
    `    <item id="chapter${i + 1}" href="${ch.id}.xhtml" media-type="application/xhtml+xml"/>`
  ).join('\n');
  
  const spineItems = chapters.map((ch, i) => 
    `    <itemref idref="chapter${i + 1}"/>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="BookId">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="BookId">urn:uuid:through-the-veil-2024</dc:identifier>
    <dc:title>Through The Veil: Unraveling the Tapestry of Lies?</dc:title>
    <dc:creator>Jason Andrews</dc:creator>
    <dc:language>en</dc:language>
    <dc:subject>Spirituality</dc:subject>
    <dc:description>A chronological exploration of hidden patterns across history.</dc:description>
    <meta property="dcterms:modified">${new Date().toISOString().split('T')[0]}T00:00:00Z</meta>
  </metadata>
  <manifest>
    <item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>
    <item id="styles" href="styles.css" media-type="text/css"/>
    <item id="concordance" href="concordance.xhtml" media-type="application/xhtml+xml"/>
${manifestItems}
  </manifest>
  <spine>
${spineItems}
    <itemref idref="concordance"/>
  </spine>
</package>`;
}

function generateNavXhtml(chapters: Chapter[]): string {
  const tocItems = chapters.map(ch => 
    `      <li><a href="${ch.id}.xhtml">${sanitizeHtml(ch.title)}</a></li>`
  ).join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops">
<head>
  <meta charset="UTF-8"/>
  <title>Table of Contents</title>
  <link rel="stylesheet" type="text/css" href="styles.css"/>
</head>
<body>
  <nav epub:type="toc" id="toc">
    <h1>Table of Contents</h1>
    <ol>
${tocItems}
      <li><a href="concordance.xhtml">Concordance</a></li>
    </ol>
  </nav>
</body>
</html>`;
}

async function generateEpub() {
  console.log('Reading markdown...');
  const markdown = fs.readFileSync(inputMd, 'utf-8');
  
  console.log('Parsing chapters...');
  const chapters = parseMarkdownToChapters(markdown);
  console.log(`Found ${chapters.length} chapters`);
  
  console.log('Creating EPUB...');
  
  const tempDir = path.join(process.cwd(), 'temp-epub');
  const metaInfDir = path.join(tempDir, 'META-INF');
  const oebpsDir = path.join(tempDir, 'OEBPS');
  
  fs.mkdirSync(metaInfDir, { recursive: true });
  fs.mkdirSync(oebpsDir, { recursive: true });
  
  fs.writeFileSync(path.join(tempDir, 'mimetype'), 'application/epub+zip');
  fs.writeFileSync(path.join(metaInfDir, 'container.xml'), generateContainerXml());
  fs.writeFileSync(path.join(oebpsDir, 'content.opf'), generateContentOpf(chapters));
  fs.writeFileSync(path.join(oebpsDir, 'nav.xhtml'), generateNavXhtml(chapters));
  fs.writeFileSync(path.join(oebpsDir, 'styles.css'), generateStyles());
  fs.writeFileSync(path.join(oebpsDir, 'concordance.xhtml'), generateConcordanceXhtml(markdown));
  
  for (const chapter of chapters) {
    const xhtml = generateChapterXhtml(chapter, chapters);
    fs.writeFileSync(path.join(oebpsDir, `${chapter.id}.xhtml`), xhtml);
  }
  
  const output = fs.createWriteStream(outputEpub);
  const archive = archiver('zip', { zlib: { level: 9 } });
  
  archive.pipe(output);
  
  archive.file(path.join(tempDir, 'mimetype'), { name: 'mimetype', store: true });
  archive.directory(metaInfDir, 'META-INF');
  archive.directory(oebpsDir, 'OEBPS');
  
  await archive.finalize();
  
  await new Promise<void>((resolve, reject) => {
    output.on('close', () => {
      fs.rmSync(tempDir, { recursive: true, force: true });
      const stats = fs.statSync(outputEpub);
      console.log(`EPUB saved: ${outputEpub}`);
      console.log(`Size: ${(stats.size / 1024).toFixed(0)} KB`);
      console.log(`Chapters: ${chapters.length}`);
      resolve();
    });
    output.on('error', reject);
  });
}

generateEpub().catch(console.error);
