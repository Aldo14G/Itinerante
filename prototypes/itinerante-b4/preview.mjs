// Servidor local de la maqueta B.4: solo sirve la interfaz y sus recursos, con la CSP que tendría en producción.
import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep, posix } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('.', import.meta.url)));
const port = Number(process.env.PORT || 8094);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.woff2': 'font/woff2'
};
const PAGES = new Set(['/index.html', '/tokens.css', '/style.css', '/app.js', '/catalog.js', '/motion.js']);
const CSP = "default-src 'self'; script-src 'self'; style-src 'self'; font-src 'self'; img-src 'self' data: blob:; connect-src 'self'; media-src 'self'; object-src 'none'; base-uri 'self'; form-action 'none'; frame-ancestors 'self'";
const allowed = path => PAGES.has(path) || (path.startsWith('/assets/') && !path.endsWith('provenance.json') && !path.endsWith('sources.json') && extname(path) in types && !path.endsWith('.txt'));

createServer(async (req, res) => {
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
    res.writeHead(200, {
      'Content-Type': types[extname(file)], 'Content-Length': info.size, 'Cache-Control': 'no-cache',
      'Content-Security-Policy': CSP, 'X-Content-Type-Options': 'nosniff', 'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    if (req.method === 'HEAD') return res.end();
    createReadStream(file).on('error', () => res.destroy()).pipe(res);
  } catch { fail(404, 'No encontrado'); }
}).listen(port, '127.0.0.1', () => console.log(`Maqueta B.4: http://127.0.0.1:${port}/`));
