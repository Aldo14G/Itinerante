// Servidor local del sitio (raíz del repo): solo sirve la interfaz y sus recursos, con la CSP que tendría en producción.
// Lista de permitidos: no expone node_modules, tests, docs, design, src, worker, data ni _archive.
// Uso: node tools/preview-site.mjs  (PORT=8094 por defecto)
import { createServer } from 'node:http';
import { createReadStream, readFileSync } from 'node:fs';
import { gzipSync } from 'node:zlib';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep, posix } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const root = resolve(fileURLToPath(new URL('..', import.meta.url)));
const defaultPort = Number(process.env.PORT || 8094);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.png': 'image/png', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};
const gz = new Map();
export const PAGES = new Set(['/index.html', '/tokens.css', '/style.css', '/mobile.css', '/app.js', '/catalog.js', '/motion.js', '/rail.js', '/feed.js', '/news.js', '/sample.js', '/tag.js','/saved.js', '/sheets.js', '/Logo.png', '/Logo.webp']);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'";
export const allowed = path => !/[\\\0]/.test(path) && (PAGES.has(path) || (path.startsWith('/assets/') && !path.endsWith('provenance.json') && !path.endsWith('sources.json') && extname(path) in types && !path.endsWith('.txt')));

export function createSiteServer() {
  return createServer(async (req, res) => {
    const fail = (code, msg) => { res.writeHead(code, { 'Content-Type': 'text/plain; charset=utf-8' }).end(msg); };
    if (req.method !== 'GET' && req.method !== 'HEAD') return fail(405, 'Método no permitido');
    let path;
    try {
      path = posix.normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname));
    } catch { return fail(400, 'Solicitud inválida'); }
    if (path.endsWith('/')) path += 'index.html';
    const file = resolve(root, `.${path}`);
    if (!allowed(path) || !file.startsWith(root + sep)) return fail(404, 'No encontrado');
    try {
      const info = await stat(file);
      if (!info.isFile()) return fail(404, 'No encontrado');
      const headers = {
        'Content-Type': types[extname(file)], 'Content-Length': info.size, 'Cache-Control': 'no-cache',
        'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin'
      };
      // Texto comprimido, como lo serviria Cloudflare; así las mediciones de red se parecen a producción.
      if (/(?:html|css|javascript|json|svg)/.test(headers['Content-Type']) && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
        const key = `${file}:${info.mtimeMs}`;
        if (!gz.has(key)) gz.set(key, gzipSync(readFileSync(file)));
        const body = gz.get(key);
        res.writeHead(200, { ...headers, 'Content-Encoding': 'gzip', 'Content-Length': body.length, Vary: 'Accept-Encoding' });
        return res.end(req.method === 'HEAD' ? undefined : body);
      }
      res.writeHead(200, headers);
      if (req.method === 'HEAD') return res.end();
      createReadStream(file).on('error', () => res.destroy()).pipe(res);
    } catch { fail(404, 'No encontrado'); }
  });
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  createSiteServer().listen(defaultPort, '127.0.0.1', () => console.log(`Sitio: http://127.0.0.1:${defaultPort}/`));
}

