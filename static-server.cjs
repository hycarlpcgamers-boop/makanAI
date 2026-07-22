const http = require('http');
const fs = require('fs');
const path = require('path');

const root = __dirname;
const port = Number(process.argv[2] || 8000);
const mime = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.txt': 'text/plain; charset=utf-8'
};

const server = http.createServer((req, res) => {
  try {
    const requestUrl = new URL(req.url, `http://${req.headers.host || '127.0.0.1'}`);
    let pathname = decodeURIComponent(requestUrl.pathname);
    if (pathname === '/') pathname = '/index.html';

    const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
    let filePath = path.join(root, safePath);
    if (!filePath.startsWith(root)) {
      res.writeHead(403).end('Forbidden');
      return;
    }

    fs.stat(filePath, (statErr, stat) => {
      if (!statErr && stat.isDirectory()) filePath = path.join(filePath, 'index.html');
      fs.readFile(filePath, (err, data) => {
        if (err) {
          fs.readFile(path.join(root, 'index.html'), (fallbackErr, fallback) => {
            if (fallbackErr) {
              res.writeHead(404, {'Content-Type':'text/plain; charset=utf-8'}).end('Not found');
              return;
            }
            res.writeHead(200, {'Content-Type':'text/html; charset=utf-8','Cache-Control':'no-cache'}).end(fallback);
          });
          return;
        }
        const ext = path.extname(filePath).toLowerCase();
        res.writeHead(200, {
          'Content-Type': mime[ext] || 'application/octet-stream',
          'Cache-Control': ext === '.html' ? 'no-cache' : 'public, max-age=3600'
        });
        res.end(data);
      });
    });
  } catch (error) {
    res.writeHead(500, {'Content-Type':'text/plain; charset=utf-8'}).end('Server error');
  }
});

server.listen(port, '127.0.0.1', () => {
  console.log(`MakanAI running at http://127.0.0.1:${port}/`);
  console.log('Keep this window open. Press Ctrl+C to stop.');
});
