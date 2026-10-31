// Comprobaciones de la maqueta B.4: node --test check.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { buildMessage, ctaText, waUrl, openingStatus, monterreyNow, TOPICS } from './app.js';
import { score, filterBooks, sortBooks, facetCounts, suggest, relatedBooks, bookMessage, bookWaUrl, norm } from './catalog.js';

const here = p => new URL(p, import.meta.url);
const html = await readFile(here('./index.html'), 'utf8');
const css = await readFile(here('./style.css'), 'utf8');
const prov = JSON.parse(await readFile(here('./assets/provenance.json'), 'utf8'));
const data = JSON.parse(await readFile(here('./assets/data/catalog.json'), 'utf8'));

test('mensajes por tema y por título', () => {
  assert.equal(buildMessage('poesia'), 'Hola, me gustaría preguntar por libros de poesía. ¿Qué me recomiendan?');
  assert.equal(buildMessage('libre'), 'Hola, estoy buscando un libro y no sé por dónde empezar. ¿Me ayudan a elegir?');
  assert.equal(buildMessage('poesia', '  Pedro Páramo  '), 'Hola, estoy buscando «Pedro Páramo». ¿Me pueden confirmar si lo tienen?');
  assert.equal(Array.from(buildMessage('ensayo', 'x'.repeat(400)).match(/«(.*)»/)[1]).length, 160);
  assert.equal(ctaText('infantil'), 'Preguntar por literatura infantil');
  assert.equal(ctaText('narrativa', 'Rulfo'), 'Preguntar por este libro');
});

test('enlace de WhatsApp codifica acentos y ampersand', () => {
  const url = new URL(waUrl(buildMessage('ensayo', 'Paz & Fuentes')));
  assert.equal(url.origin + url.pathname, 'https://wa.me/528180875940');
  assert.equal(url.searchParams.get('text'), 'Hola, estoy buscando «Paz & Fuentes». ¿Me pueden confirmar si lo tienen?');
});

test('estado de apertura: límites de horario', () => {
  assert.equal(openingStatus({ day: 4, mins: 12 * 60 }).open, true);
  assert.equal(openingStatus({ day: 4, mins: 11 * 60 }).open, true);
  assert.equal(openingStatus({ day: 4, mins: 11 * 60 - 1 }).short, 'Cerrado · abre hoy 11:00');
  assert.match(openingStatus({ day: 4, mins: 19 * 60 + 30 }).short, /Cierra pronto/);
  assert.equal(openingStatus({ day: 4, mins: 20 * 60 }).short, 'Cerrado · abre mañana 11:00');
  assert.equal(openingStatus({ day: 6, mins: 21 * 60 }).short, 'Cerrado · abre el lunes 11:00');
  assert.equal(openingStatus({ day: 0, mins: 12 * 60 }).short, 'Cerrado · abre mañana 11:00');
  assert.deepEqual(monterreyNow(new Date('2026-10-29T18:00:00Z')), { day: 4, mins: 12 * 60 });
});

test('catálogo: búsqueda por título, autor, ISBN y editorial, sin acentos', () => {
  const books = data.books;
  assert.equal(books.length, 500);
  const any = books.find(b => b.n);
  assert.ok(filterBooks(books, { q: any.n }).some(b => b.id === any.id), 'ISBN');
  assert.ok(filterBooks(books, { q: norm(any.t).toUpperCase() }).some(b => b.id === any.id), 'título en mayúsculas');
  const withAuthor = books.find(b => b.a !== 'Autor no indicado');
  assert.ok(filterBooks(books, { q: withAuthor.a.split(' ')[0] }).some(b => b.id === withAuthor.id), 'autor');
  assert.ok(filterBooks(books, { q: books.find(b => b.p).p }).length > 0, 'editorial');
  assert.equal(filterBooks(books, { q: 'zzzxqv' }).length, 0);
  assert.equal(score(any, ''), 1);
});

test('catálogo: filtros combinados, conteo de facetas y orden', () => {
  const books = data.books;
  const k = new Set(['fiction']);
  const fic = filterBooks(books, { k });
  assert.ok(fic.length > 0 && fic.every(b => b.k === 'fiction'));
  const both = filterBooks(books, { k: new Set(['fiction']), f: new Set(['Tapa dura']) });
  assert.ok(both.every(b => b.k === 'fiction' && b.f === 'Tapa dura'));
  const counts = facetCounts(books, { k }, 'f');
  assert.equal([...counts.values()].reduce((a, b) => a + b, 0), fic.length, 'las facetas suman el resultado');
  const own = facetCounts(books, { k }, 'k');
  assert.equal(own.size, 2, 'la faceta propia no se filtra a sí misma');
  const az = sortBooks(books, 'az');
  assert.ok(az.every((b, i) => i === 0 || az[i - 1].t.localeCompare(b.t, 'es') <= 0));
  const recent = sortBooks(books, 'new');
  assert.ok((recent[0].y || 0) >= (recent[recent.length - 1].y || 0));
});

test('catálogo: sugerencias, relacionados y mensaje de ficha', () => {
  const books = data.books;
  const b = books.find(x => x.n);
  assert.deepEqual(suggest(books, 'a'), []);
  assert.ok(suggest(books, norm(b.t).slice(0, 5)).length > 0);
  assert.ok(suggest(books, b.n.slice(0, 6)).some(s => s.kind === 'ISBN'));
  const rel = relatedBooks(books, b);
  assert.ok(rel.length <= 3 && rel.every(r => r.g === b.g && r.id !== b.id));
  assert.match(bookMessage(b), new RegExp(`«${b.t.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}»`));
  assert.equal(new URL(bookWaUrl(b)).searchParams.get('text'), bookMessage(b));
});

test('datos de muestra: sin precios ni existencias', () => {
  assert.equal(data.meta.kind, 'sample');
  assert.match(data.meta.label, /no es inventario/i);
  for (const b of data.books) assert.ok(!('priceMxnCents' in b) && !('stockQty' in b));
});

test('recursos referenciados existen', async () => {
  const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m => m[1]);
  refs.push(...Object.values(TOPICS).map(t => `assets/img/${t.img}`));
  for (let i = 1; i <= 145; i++) refs.push(`assets/seq/f${String(i).padStart(3, '0')}.webp`);
  for (let i = 1; i <= 73; i++) refs.push(`assets/seq-m/m${String(i).padStart(3, '0')}.webp`);
  for (const b of data.books) if (b.c) refs.push(`assets/${b.c}`);
  for (const ref of new Set(refs)) await access(here(`./${ref}`));
});

test('procedencia: todo raster de assets/img y la secuencia tiene origen y rótulo', async () => {
  const kind = new Map();
  prov.real.forEach(f => kind.set(f.file, 'real'));
  prov.aiRecreation.forEach(f => kind.set(f.file, 'ai'));
  prov.brand.forEach(f => kind.set(f.file, 'brand'));
  for (const f of await readdir(here('./assets/img'))) assert.ok(kind.has(`img/${f}`), `sin procedencia: img/${f}`);
  assert.ok([...kind.keys()].some(k => k.startsWith('seq/')) && [...kind.keys()].some(k => k.startsWith('seq-m/')));
  const stills = [...html.matchAll(/<li class="still">([\s\S]*?)<\/li>/g)].map(m => m[1]);
  assert.equal(stills.length, 7);
  for (const s of stills) {
    const file = s.match(/assets\/(img\/[^"]+)"/)[1];
    assert.ok(s.includes(kind.get(file) === 'real' ? 'tag--real' : 'tag--ai'), `rótulo incorrecto: ${file}`);
  }
  for (const [k, t] of Object.entries(TOPICS)) assert.equal(t.kind, kind.get(`img/${t.img}`), `rótulo de tema ${k}`);
});

test('marcado compatible con la CSP de producción', () => {
  assert.ok(!/<script(?![^>]*\bsrc=)(?![^>]*type="application\/ld\+json")[^>]*>/i.test(html), 'script en línea');
  assert.ok(!/\son[a-z]+\s*=/i.test(html), 'manejador en línea');
  assert.ok(!/\sstyle\s*=/i.test(html), 'estilo en línea');
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  assert.match(csp, /script-src 'self'(;|$)/);
  assert.match(csp, /font-src 'self'/);
  assert.ok(!/https?:\/\//.test(csp), 'la CSP no permite orígenes externos');
  assert.ok(html.indexOf('Content-Security-Policy') < html.indexOf('rel="preload"'), 'la CSP va antes de las precargas');
});

test('integridad del documento: ids únicos, anclas y referencias ARIA válidas', () => {
  const ids = [...html.matchAll(/\sid="([^"]+)"/g)].map(m => m[1]);
  assert.equal(new Set(ids).size, ids.length, 'ids duplicados');
  for (const m of html.matchAll(/href="#([^"]+)"/g)) assert.ok(ids.includes(m[1]), `ancla rota #${m[1]}`);
  for (const m of html.matchAll(/aria-(?:labelledby|controls|describedby)="([^"]+)"/g)) for (const id of m[1].split(/\s+/)) assert.ok(ids.includes(id), `ARIA apunta a #${id}`);
  assert.equal([...html.matchAll(/<h1[\s>]/g)].length, 1);
  assert.ok(html.indexOf('<h1') < html.indexOf('entry-lede'), 'el h1 precede al texto del hero');
});

test('paridad sin JavaScript: lo que depende de JS se oculta bajo html:not(.js)', () => {
  assert.match(css, /html:not\(\.js\) :is\([^)]*\.menu-btn[^)]*\.topics[^)]*\.cat-layout/);
  assert.ok(/<noscript>[\s\S]*wa\.me/.test(html));
});
