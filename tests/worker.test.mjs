import { strict as assert } from 'node:assert';
import test from 'node:test';
import worker from '../worker/index.ts';

const ORIGIN = 'https://itinerante.example';
const call = (path, init = {}, env = {}) => worker.fetch(new Request(ORIGIN + path, init), env);
const post = (body, headers = {}, env = {}) => call('/api/ai/iti-ia', {
  method: 'POST',
  headers: { origin: ORIGIN, 'content-type': 'application/json', 'x-forwarded-for': '203.0.113.7', ...headers },
  body: JSON.stringify(body),
}, env);
const ask = text => ({ data: { messages: [{ role: 'user', content: [{ text }] }] } });

test('/api/catalog: contrato, orden y honestidad de datos de prueba', async () => {
  const res = await call('/api/catalog?limit=5');
  assert.equal(res.status, 200);
  assert.equal(res.headers.get('cache-control'), 'no-store');
  const body = await res.json();
  assert.equal(body.mode, 'test');
  assert.equal(body.books.length, 5);
  assert.ok(body.total >= 400);
  assert.ok(body.facets.categories.length && body.facets.subgenres.length);
  assert.ok(body.vocabulary.categories.length);
  assert.ok(body.books.every(book => book.isTestData === true && !('searchText' in book)));
});

test('/api/catalog: límite máximo, filtros, búsqueda y vocabulario controlado', async () => {
  const big = await (await call('/api/catalog?limit=500')).json();
  assert.equal(big.books.length, 60);
  const bad = await call('/api/catalog?category=no-existe');
  assert.equal(bad.status, 400);
  const err = await bad.json();
  assert.equal(err.error.code, 'unknown-category');
  assert.ok(err.vocabulary.categories.length);
  const all = await (await call('/api/catalog?limit=1')).json();
  const slug = all.vocabulary.categories[0].slug;
  const filtered = await (await call(`/api/catalog?category=${slug}&limit=60`)).json();
  assert.ok(filtered.books.every(book => book.category.slug === slug));
  const found = await (await call('/api/catalog?q=misterio&limit=10')).json();
  assert.ok(found.total > 0 && found.total <= all.total);
});

test('/api/catalog: solo GET y rutas desconocidas', async () => {
  assert.equal((await call('/api/catalog', { method: 'POST' })).status, 405);
  assert.equal((await call('/api/otra')).status, 404);
});

test('Iti IA: origen, tamaño, método y cuerpo inválido', async () => {
  assert.equal((await post(ask('novela de misterio'), { origin: 'https://evil.example' })).status, 403);
  assert.equal((await post(ask('novela de misterio'), { 'content-length': '9000' })).status, 413);
  assert.equal((await call('/api/ai/iti-ia')).status, 405);
  const bad = await call('/api/ai/iti-ia', { method: 'POST', headers: { origin: ORIGIN }, body: 'no json' });
  assert.equal(bad.status, 400);
  assert.equal((await post({ data: { messages: [] } })).status, 400);
});

test('Iti IA: límite de Cloudflare por IP y global responde 429', async () => {
  const deny = { limit: async () => ({ success: false }) };
  const allow = { limit: async () => ({ success: true }) };
  const ip = await post(ask('poesía'), {}, { IA_PER_IP: deny, IA_GLOBAL: allow });
  assert.equal(ip.status, 429);
  assert.equal(ip.headers.get('retry-after'), '60');
  assert.equal((await post(ask('poesía'), {}, { IA_PER_IP: allow, IA_GLOBAL: deny })).status, 429);
  let key;
  await post(ask('poesía'), {}, { IA_PER_IP: { limit: async o => { key = o.key; return { success: true }; } }, IA_GLOBAL: allow });
  assert.equal(key, '203.0.113.7');
  // Con cf-connecting-ip (lo fija Cloudflare) el x-forwarded-for falsificado no cambia la clave del límite.
  await post(ask('poesía'), { 'cf-connecting-ip': '198.51.100.20', 'x-forwarded-for': '1.2.3.4' }, { IA_PER_IP: { limit: async o => { key = o.key; return { success: true }; } }, IA_GLOBAL: allow });
  assert.equal(key, '198.51.100.20');
});

test('Iti IA: sin GEMINI_API_KEY recomienda con ranking local y rotula datos de prueba', async () => {
  const res = await post(ask('quiero una novela de misterio'));
  assert.equal(res.status, 200);
  const { result } = await res.json();
  const tool = result[0].content.find(part => part.toolRequest)?.toolRequest;
  assert.equal(tool.name, 'recommendBooks');
  const books = tool.input.recommendedBooks;
  assert.ok(books.length >= 1 && books.length <= 3);
  assert.ok(books.every(book => book.isTestData === true && book.sourceLabel && !book.whatsappPrefill));
});

test('Iti IA: consulta corta pide aclaración y el modelo solo reordena slugs reales', async () => {
  const short = await (await post(ask('a'))).json();
  assert.equal(short.result[0].content[0].toolRequest.name, 'askQuestion');

  const realFetch = globalThis.fetch;
  let asked = 0;
  globalThis.fetch = async (url, init) => {
    asked++;
    assert.match(String(url), /generativelanguage\.googleapis\.com/);
    assert.equal(new Headers(init.headers).get('x-goog-api-key'), 'k');
    return Response.json({ candidates: [{ content: { parts: [{ text: JSON.stringify({ slugs: ['no-existe-en-candidatos'] }) }] } }] });
  };
  try {
    const res = await (await post(ask('quiero una novela de misterio'), {}, { GEMINI_API_KEY: 'k' })).json();
    const books = res.result[0].content.find(part => part.toolRequest).toolRequest.input.recommendedBooks;
    assert.ok(books.length >= 1, 'un slug inventado por el modelo no vacía la respuesta');
    assert.equal(asked, 1);
    globalThis.fetch = async () => new Response('x', { status: 500 });
    const fallback = await post(ask('quiero una novela de misterio'), {}, { GEMINI_API_KEY: 'k', ITI_IA_FALLBACK_MODEL: 'otro' });
    assert.equal(fallback.status, 200);
  } finally {
    globalThis.fetch = realFetch;
  }
});

test('Iti IA: un cuerpo grande sin content-length (chunked) también se rechaza', async () => {
  const big = new ReadableStream({ start(c) { c.enqueue(new TextEncoder().encode('x'.repeat(5000))); c.enqueue(new TextEncoder().encode('x'.repeat(5000))); c.close(); } });
  const res = await worker.fetch(new Request(ORIGIN + '/api/ai/iti-ia', { method: 'POST', headers: { origin: ORIGIN }, body: big, duplex: 'half' }), {});
  assert.equal(res.status, 413);
});
