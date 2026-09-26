// Local stand-in for `vercel dev` (no Vercel login needed). Mirrors vercel.json:
//   * static files from public/ with cleanUrls (/login → login.html)
//   * /api/<group>/<route> → api/<group>.js with ?__route=<route>
// Usage: node --env-file=.env.local scripts/dev-server.js   (PORT defaults to 3000)
import http from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), '..');
const publicDir = path.join(root, 'public');
const port = Number(process.env.PORT || 3000);
const GROUPS = new Set(['public', 'auth', 'admin', 'track']);

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.avif': 'image/avif', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8', '.webmanifest': 'application/manifest+json',
};

async function serveStatic(req, res, pathname) {
  const candidates = pathname.endsWith('/')
    ? [path.join(pathname, 'index.html')]
    : [pathname, `${pathname}.html`, path.join(pathname, 'index.html')];
  for (const rel of candidates) {
    const file = path.normalize(path.join(publicDir, rel));
    if (!file.startsWith(publicDir)) break; // path traversal guard
    try {
      if ((await stat(file)).isFile()) {
        res.writeHead(200, { 'Content-Type': TYPES[path.extname(file).toLowerCase()] || 'application/octet-stream' });
        return res.end(await readFile(file));
      }
    } catch { /* try next */ }
  }
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
  res.end('404 Not Found');
}

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const match = url.pathname.match(/^\/api\/([a-z]+)(?:\/(.*))?$/);
  if (match && GROUPS.has(match[1])) {
    const [, group, route = ''] = match;
    if (route) url.searchParams.set('__route', route);
    req.url = `/api/${group}${url.search}`;
    try {
      const mod = await import(`${pathToFileURL(path.join(root, 'api', `${group}.js`)).href}?t=${Date.now()}`);
      return await mod.default(req, res);
    } catch (err) {
      console.error(err);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      return res.end('dev-server: handler failed to load');
    }
  }
  return serveStatic(req, res, decodeURIComponent(url.pathname));
});

server.listen(port, () => console.log(`dev-server on http://localhost:${port}`));
