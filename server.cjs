// Ultra-minimal server — just serves the static index.html
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
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
};

const indexHtml = fs.readFileSync(path.join(__dirname, 'index.html'), 'utf8');

const server = http.createServer((req, res) => {
  // Health check
  if (req.url === '/api/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    return res.end(JSON.stringify({ status: 'ok', service: 'theveil' }));
  }

  // Try to serve from public dir
  const publicPath = path.join(__dirname, 'public', req.url);
  if (req.url !== '/' && fs.existsSync(publicPath)) {
    const ext = path.extname(publicPath);
    res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
    return fs.createReadStream(publicPath).pipe(res);
  }

  // Everything else -> index.html
  res.writeHead(200, { 'Content-Type': 'text/html' });
  res.end(indexHtml);
});

server.listen(PORT, () => {
  console.log(`[TheVeil] Serving on port ${PORT}`);
});
