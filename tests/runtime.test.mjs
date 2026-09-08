import { strict as assert } from 'node:assert';
import { readFile } from 'node:fs/promises';
import { createServer as createHttpServer, request as httpRequest } from 'node:http';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { createPreviewServer, DEFAULT_PROXY_TIMEOUT_MS } from '../tools/static-server.mjs';
import { createDevStack } from '../tools/dev-with-dataconnect.mjs';
import { catalogDataset, TEST_CATALOG_DATASET } from '../src/config/catalog-mode.js';

function listen(server) {
  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(0, '127.0.0.1', () => resolve(server.address().port));
  });
}

function close(server) {
  return new Promise((resolve, reject) => server.close(error => error ? reject(error) : resolve()));
}

function rawStatus(port, path) {
  return new Promise((resolve, reject) => {
    const request = httpRequest({ hostname: '127.0.0.1', port, path }, response => {
      response.resume();
      response.on('end', () => resolve(response.statusCode));
    });
    request.once('error', reject);
    request.end();
  });
}

test('preview serves seekable media ranges, HEAD, suffixes and invalid ranges', async t => {
  const preview = createPreviewServer();
  const port = await listen(preview);
  t.after(() => close(preview));
  const path = '/images/cinematic/runtime/bg-walkthrough-desktop.mp4';
  const bytes = await readFile(new URL(`..${path}`, import.meta.url));
  const head = await fetch(`http://127.0.0.1:${port}${path}`, { method: 'HEAD' });
  assert.equal(head.headers.get('content-length'), String(bytes.length));
  assert.equal((await head.arrayBuffer()).byteLength, 0);
  for (const [range, start, end] of [['bytes=0-1023', 0, 1023], ['bytes=-128', bytes.length - 128, bytes.length - 1], [`bytes=${bytes.length - 20}-`, bytes.length - 20, bytes.length - 1]]) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { headers: { Range: range } });
    assert.equal(response.status, 206);
    assert.equal(response.headers.get('content-range'), `bytes ${start}-${end}/${bytes.length}`);
    assert.deepEqual(Buffer.from(await response.arrayBuffer()), bytes.subarray(start, end + 1));
  }
  for (const range of ['bytes=999999999-', 'bytes=20-1', 'bytes=-0', 'bytes=wat', 'bytes=0-1,3-4']) {
    const response = await fetch(`http://127.0.0.1:${port}${path}`, { headers: { Range: range } });
    assert.equal(response.status, 416);
  }
});

test('preview proxies same-origin /api/ requests with method, body, content type, and status', async t => {
  let received;
  const backend = createHttpServer((request, response) => {
    const chunks = [];
    request.on('data', chunk => chunks.push(chunk));
    request.on('end', () => {
      received = {
        method: request.method,
        url: request.url,
        contentType: request.headers['content-type'],
        body: Buffer.concat(chunks).toString(),
      };
      response.writeHead(201, { 'content-type': 'application/json' });
      response.end(JSON.stringify({ ok: true }));
    });
  });
  const backendPort = await listen(backend);
  const preview = createPreviewServer({ backendOrigin: `http://127.0.0.1:${backendPort}` });
  const previewPort = await listen(preview);
  t.after(async () => {
    await close(preview);
    await close(backend);
  });

  const response = await fetch(`http://127.0.0.1:${previewPort}/api/catalog?limit=2`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ query: 'poesía' }),
  });

  assert.equal(response.status, 201);
  assert.equal(response.headers.get('content-type'), 'application/json');
  assert.deepEqual(await response.json(), { ok: true });
  assert.deepEqual(received, {
    method: 'POST',
    url: '/api/catalog?limit=2',
    contentType: 'application/json',
    body: JSON.stringify({ query: 'poesía' }),
  });
});

test('preview keeps proxy scope closed and rejects decoded path traversal', async t => {
  const backend = createHttpServer((request, response) => {
    response.writeHead(200);
    response.end('backend should not receive this path');
  });
  const backendPort = await listen(backend);
  const preview = createPreviewServer({ backendOrigin: `http://127.0.0.1:${backendPort}` });
  const previewPort = await listen(preview);
  t.after(async () => {
    await close(preview);
    await close(backend);
  });

  const nonApi = await fetch(`http://127.0.0.1:${previewPort}/api`);
  assert.equal(nonApi.status, 404);
  assert.equal(await rawStatus(previewPort, '/api/%2e%2e/package.json'), 403);
});

test('preview returns bounded upstream errors instead of hanging', async t => {
  const backend = createHttpServer(() => {});
  const backendPort = await listen(backend);
  const preview = createPreviewServer({ backendOrigin: `http://127.0.0.1:${backendPort}`, timeoutMs: 25 });
  const previewPort = await listen(preview);
  t.after(async () => {
    await close(preview);
    await close(backend);
  });

  const response = await fetch(`http://127.0.0.1:${previewPort}/api/slow`);
  assert.equal(response.status, 503);
  assert.match(await response.text(), /no respondió a tiempo/i);
});

test('preview reserves an LLM-friendly default timeout while allowing test overrides', () => {
  assert.ok(DEFAULT_PROXY_TIMEOUT_MS >= 90_000);
});

test('demo stack starts emulator, backend, and preview with shared local configuration', () => {
  const calls = [];
  const children = [];
  const spawnProcess = (command, args, options) => {
    const child = {
      pid: children.length + 1,
      exitCode: null,
      signalCode: null,
      kill(signal) { this.signalCode = signal; },
      once() {},
      on() {},
    };
    calls.push({ command, args, options });
    children.push(child);
    return child;
  };

  const stack = createDevStack({
    spawnProcess,
    terminateProcess: child => child.kill('SIGTERM'),
    env: { BASE: 'yes' },
  });
  assert.equal(calls.length, 3);
  assert.equal(calls[0].command, process.execPath);
  assert.deepEqual(calls[0].args, ['scripts/local-stack.mjs']);
  assert.equal(calls[0].options.env.LOCAL_STACK_KEEP, '1');
  assert.match(calls[1].args.join(' '), /next dev --turbopack --hostname 127.0.0.1 --port 3000/);
  assert.match(calls[2].args.join(' '), /tools[\\/]static-server\.mjs 8080/);
  for (const call of calls) {
    assert.equal(call.options.env.DATA_CONNECT_EMULATOR_HOST, '127.0.0.1:9399');
    assert.equal(call.options.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST, 'http://127.0.0.1:9399');
  }
  assert.equal(calls[2].options.env.ITI_IA_BACKEND_ORIGIN, 'http://127.0.0.1:3000');

  stack.shutdown();
  assert.deepEqual(children.map(({ signalCode }) => signalCode), ['SIGTERM', 'SIGTERM', 'SIGTERM']);
});

test('catalog mode selects local fixtures only when Data Connect is emulated', () => {
  assert.equal(catalogDataset({ DATA_CONNECT_EMULATOR_HOST: '127.0.0.1:9399' }), TEST_CATALOG_DATASET);
  assert.equal(catalogDataset({ FIREBASE_DATA_CONNECT_EMULATOR_HOST: 'http://127.0.0.1:9399' }), TEST_CATALOG_DATASET);
  assert.equal(catalogDataset({ ITI_IA_DATASET: 'inventory', DATA_CONNECT_EMULATOR_HOST: '127.0.0.1:9399' }), 'inventory');
  assert.equal(catalogDataset({}), 'inventory');
});

test('Firebase Data Connect lets the server SDK consume its emulator URL once', async () => {
  const source = await readFile(fileURLToPath(new URL('../src/config/data-connect.ts', import.meta.url)), 'utf8');
  assert.doesNotMatch(source, /else if \(process\.env\.DATA_CONNECT_EMULATOR_HOST\)/);
});

test('Iti IA eval is fixture-only and references existing catalog records', async () => {
  const [evalSet, catalog] = await Promise.all([
    readFile(fileURLToPath(new URL('../data/iti-ia.eval.json', import.meta.url)), 'utf8').then(JSON.parse),
    readFile(fileURLToPath(new URL('../data/books.amazon-test.json', import.meta.url)), 'utf8').then(JSON.parse),
  ]);
  const slugs = new Set(catalog.books.map(({ slug }) => slug));
  assert.equal(evalSet.mode, 'test');
  assert.equal(evalSet.cases.length, 5);
  assert.equal(evalSet.assertions.stockQty, 0);
  assert.equal(evalSet.assertions.neverClaimInventory, true);
  assert.ok(evalSet.cases.every(({ expectedSlugs }) => expectedSlugs.every(slug => slugs.has(slug))));
});
