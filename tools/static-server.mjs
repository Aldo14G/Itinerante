import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { pathToFileURL } from 'node:url';

const defaultRoot = process.cwd();
const defaultPort = Number(process.argv[2] || 8080);
const defaultBackendOrigin = process.env.ITI_IA_BACKEND_ORIGIN || 'http://127.0.0.1:3000';
export const DEFAULT_PROXY_TIMEOUT_MS = 90_000;
const configuredProxyTimeoutMs = Number(process.env.ITI_IA_PROXY_TIMEOUT_MS);
const proxyTimeoutMs = Number.isFinite(configuredProxyTimeoutMs) && configuredProxyTimeoutMs > 0
  ? Math.max(DEFAULT_PROXY_TIMEOUT_MS, configuredProxyTimeoutMs)
  : DEFAULT_PROXY_TIMEOUT_MS;

const contentTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm'
};

const immutableExtensions = new Set(['.css', '.js', '.png', '.jpg', '.jpeg', '.webp', '.svg', '.mp4', '.webm']);

function cacheHeaders(filePath) {
  if (filePath.endsWith('index.html')) return { 'Cache-Control': 'no-cache' };
  if (immutableExtensions.has(extname(filePath))) {
    return { 'Cache-Control': 'public, max-age=31536000, immutable' };
  }
  return {};
}

function backendUrl(origin, requestUrl) {
  const queryStart = requestUrl.indexOf('?');
  const pathname = queryStart === -1 ? requestUrl : requestUrl.slice(0, queryStart);
  const search = queryStart === -1 ? '' : requestUrl.slice(queryStart);
  return `${origin}${pathname}${search}`;
}

function normalizeBackendOrigin(value) {
  const url = new URL(value);
  if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password || url.pathname !== '/' || url.search || url.hash) {
    throw new Error('ITI_IA_BACKEND_ORIGIN must be an http(s) origin');
  }
  return url.origin;
}

function resolveRequestPath(root, requestUrl) {
  const pathname = decodeURIComponent(requestUrl.split('?')[0]);
  const localPath = pathname === '/' ? 'index.html' : pathname.replace(/^\/+/, '');
  const filePath = resolve(root, localPath);
  const insideRoot = filePath === root || filePath.startsWith(root + sep);
  return insideRoot ? filePath : null;
}

function isApiRequest(requestUrl) {
  const pathname = requestUrl.split('?')[0];
  if (!pathname.startsWith('/api/')) return false;
  return true;
}

function hasPathTraversal(requestUrl) {
  const pathname = requestUrl.split('?')[0];
  return decodeURIComponent(pathname).split('/').includes('..');
}

async function readBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks);
}

function responseHeaders(headers) {
  const result = {};
  for (const [key, value] of headers) {
    if (!['connection', 'keep-alive', 'transfer-encoding', 'upgrade'].includes(key.toLowerCase())) result[key] = value;
  }
  return result;
}

function forwardHeaders(headers, backendOrigin) {
  const result = {};
  for (const [key, value] of Object.entries(headers)) {
    const lower = key.toLowerCase();
    if (['host', 'connection', 'keep-alive', 'transfer-encoding', 'content-length'].includes(lower)) continue;
    result[key] = value;
  }
  result['host'] = new URL(backendOrigin).host;
  return result;
}

async function proxyApiRequest(request, response, backendOrigin, timeoutMs) {
  try {
    const body = !['GET', 'HEAD'].includes(request.method) ? await readBody(request) : undefined;
    const upstream = await fetch(backendUrl(backendOrigin, request.url), {
      method: request.method,
      headers: forwardHeaders(request.headers, backendOrigin),
      body,
      signal: AbortSignal.timeout(timeoutMs),
      ...(body ? { duplex: 'half' } : {})
    });
    response.writeHead(upstream.status, responseHeaders(upstream.headers));
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch (error) {
    const timedOut = error?.name === 'TimeoutError' || error?.name === 'AbortError';
    response.writeHead(timedOut ? 503 : 502, { 'content-type': 'application/json; charset=utf-8' });
    response.end(JSON.stringify({ error: { message: timedOut ? 'El backend no respondió a tiempo.' : 'El backend no está disponible.' } }));
  }
}

export function createPreviewServer({ root = defaultRoot, port = defaultPort, backendOrigin = defaultBackendOrigin, timeoutMs = proxyTimeoutMs } = {}) {
  const upstreamOrigin = normalizeBackendOrigin(backendOrigin);
  const server = createServer(async (request, response) => {
    try {
      if (hasPathTraversal(request.url)) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }
      if (isApiRequest(request.url)) {
        await proxyApiRequest(request, response, upstreamOrigin, timeoutMs);
        return;
      }

      const filePath = resolveRequestPath(root, request.url);
      if (!filePath) {
        response.writeHead(403);
        response.end('Forbidden');
        return;
      }

      const file = await stat(filePath);
      if (!file.isFile()) throw new Error('Not a file');
      const headers = {
        'Content-Type': contentTypes[extname(filePath)] || 'application/octet-stream',
        'Accept-Ranges': 'bytes',
        'Content-Length': file.size,
        ...cacheHeaders(filePath),
      };
      let start = 0;
      let end = file.size - 1;
      const range = request.headers.range;
      if (range) {
        const match = /^bytes=(\d*)-(\d*)$/.exec(range);
        if (match && (match[1] || match[2])) {
          start = match[1] ? Number(match[1]) : Math.max(0, file.size - Number(match[2]));
          end = match[1] && match[2] ? Math.min(Number(match[2]), end) : end;
        }
        if (!match || !(match[1] || match[2]) || !Number.isSafeInteger(start)
          || !Number.isSafeInteger(end) || start > end || start >= file.size) {
          response.writeHead(416, { 'Content-Range': `bytes */${file.size}` });
          response.end();
          return;
        }
        headers['Content-Range'] = `bytes ${start}-${end}/${file.size}`;
        headers['Content-Length'] = end - start + 1;
      }
      response.writeHead(range ? 206 : 200, headers);
      if (request.method === 'HEAD' || file.size === 0) response.end();
      else {
        const stream = createReadStream(filePath, { start, end });
        stream.on('error', () => response.destroy());
        response.on('close', () => stream.destroy());
        stream.pipe(response);
      }
    } catch (error) {
      if (error instanceof URIError) {
        response.writeHead(400);
        response.end('Bad request');
        return;
      }
      response.writeHead(404);
      response.end('Not found');
    }
  });

  return server;
}

const invokedPath = process.argv[1] ? pathToFileURL(resolve(process.argv[1])).href : '';
if (import.meta.url === invokedPath) {
  const server = createPreviewServer();
  const shutdown = () => server.close(() => process.exit(0));
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  server.listen(defaultPort, '127.0.0.1', () => {
    console.log(`Preview running at http://127.0.0.1:${defaultPort}/`);
  });
}
