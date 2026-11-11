// Comprobaciones del sitio (modelo B.4 «Función de la casa», en la raíz del repo): node --test tests/site.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, access, readdir } from 'node:fs/promises';
import { pickBooks } from '../rail.js';
import { toggleSaved, isSaved, savedIds, clearSaved, listMessage, listWaUrl, MAX_SAVED } from '../saved.js';
import { buildMessage, ctaText, waUrl, openingStatus, monterreyNow, TOPICS } from '../app.js';
import { newsPlan, NEWS_SIZE } from '../news.js';
import { readInterest, shareName, initFeed } from '../feed.js';
import { KINDS, validKind } from '../tag.js';
import { PAGE_SIZE, TONES, GENRE_ES, genreLabel, coverTone, coverTones, coverLayout, COVER_LAYOUTS, score, filterBooks, sortBooks, facetCounts, suggest, relatedBooks, bookMessage, bookWaUrl, norm } from '../catalog.js';

const repo = new URL('../', import.meta.url);
const here = p => new URL(p, repo);
const html = await readFile(here('./index.html'), 'utf8');
const css = await readFile(here('./style.css'), 'utf8');
const tokensCss = await readFile(here('./tokens.css'), 'utf8');
const mobileCss = await readFile(here('./mobile.css'), 'utf8');
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
  for (const b of data.books) if (b.c) refs.push(`assets/${b.c}`);
  for (const ref of new Set(refs)) await access(here(`./${ref}`));
});

test('procedencia: todo raster de assets/img y la secuencia tiene origen registrado; ningún rótulo se imprime', async () => {
  const kind = new Map();
  prov.real.forEach(f => kind.set(f.file, 'real'));
  prov.aiRecreation.forEach(f => kind.set(f.file, 'ai'));
  prov.brand.forEach(f => kind.set(f.file, 'brand'));
  for (const f of await readdir(here('./assets/img'))) assert.ok(kind.has(`img/${f}`), `sin procedencia: img/${f}`);
  assert.equal(prov.aiRecreation.length, 0, 'no quedan recreaciones: todas las imágenes son fotografías de la casa');
  assert.ok(![...kind.keys()].some(k => k.startsWith('seq')) && !existsSync(here('./assets/seq')) && !existsSync(here('./assets/seq-m')), 'la secuencia de fotogramas generada se retiró');
  assert.ok(/<img class="entry-poster" src="assets\/img\/03-home-sala-central\.webp"/.test(html) && /srcset="assets\/img\/inicio-sala-m\.webp"/.test(html) && !/<section id="inicio"[^>]*data-seq/.test(html), 'el inicio es una fotografía fija (sin data-seq no hay recorrido por fotogramas)');
  assert.ok(!/data-kind="ai"/.test(html) && Object.values(TOPICS).every(t => t.kind === 'real'), 'marcado y temas declaran solo fotografías');
  const stills = [...html.matchAll(/<li class="still">([\s\S]*?)<\/li>/g)].map(m => m[1]);
  assert.equal(stills.length, 6);
  for (const s of stills) {
    const file = s.match(/assets\/(img\/[^"]+)"/)[1];
    assert.ok(s.includes(`<figcaption data-kind="${kind.get(file) === 'real' ? 'real' : 'ai'}">`), `procedencia incorrecta en el marcado: ${file}`);
  }
  for (const [k, t] of Object.entries(TOPICS)) assert.equal(t.kind, kind.get(`img/${t.img}`), `procedencia del tema ${k}`);
  assert.ok(!/Recreación IA|Foto real|Imagen ilustrativa|class="tag\b/.test(html), 'la procedencia es un dato (data-kind): la página no imprime rótulos');
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

test('curaduría: sin relleno de maqueta ni elementos retirados', () => {
  for (const gone of ['entry-clock', 'entry-chapters', 'entry-bar', 'bill-state', 'ftr-fine', 'Higgsfield', 'Maqueta B.4', 'marquee-row--rev', 'manifesto-photo--b'])
    assert.ok(!html.includes(gone), `sigue en el marcado: ${gone}`);
  assert.equal([...html.matchAll(/class="marquee-row/g)].length, 1, 'una sola fila de marquesina');
  assert.ok(!/id="call-title"[\s\S]*?<\/section>/.exec(html)[0].includes('class="btn '), 'el llamado no repite las acciones de la Visita');
  const labels = [...html.matchAll(/class="bill-detail">[\s\S]*?class="btn btn--line-ink"[^>]*>([^<]+)</g)].map(m => m[1].trim());
  assert.equal(new Set(labels).size, labels.length, 'los CTA de Cartelera son distintos');
});

test('curaduría: los textos de navegación traen pista y los esqueletos ocupan el lugar', () => {
  assert.equal([...html.matchAll(/<a href="#[a-z]+" data-hint="[^"]+"><span>/g)].length, 4);
  assert.equal([...html.matchAll(/class="card-item card--sk"/g)].length, PAGE_SIZE, 'un esqueleto por tarjeta de la primera página');
  assert.ok(/--card-h: 150cqw;/.test(css) && /:is\(\.rail-item, \.card-item\) > \.card \{ min-height: var\(--card-h\)/.test(css), 'tarjeta y esqueleto comparten una sola regla de alto');
  assert.ok(!/class="sk-line/.test(/data-rail-track[\s\S]*?<\/ul>/.exec(html)[0]) && !/class="card-item card--sk"[^>]*><span class="card"><span class="cover"><\/span><span class="sk-line/.test(html), 'el esqueleto de tarjeta es solo la portada: el título y el autor van dentro de ella');
  assert.ok(/data-rail-chips>(<span class="sk-chip" aria-hidden="true"><\/span>){3,}<\/div>/.test(html), 'el esqueleto del carrusel reserva la fila de chips');
  assert.ok(/data-cat-grid aria-busy="true"/.test(html));
  assert.ok(/\.card--sk/.test(css));
  assert.ok(!/sk-sweep/.test(css + mobileCss), 'los esqueletos no se animan (una sola regla para móvil y escritorio)');
  assert.ok(!/(sk-line|card--sk|still-img|frame-clip|topic-layer|bill-layer)[^{}]*::before[^{}]*\{[^}]*animation/.test(css + mobileCss), 'ningún esqueleto ni marco de foto declara animación');
  assert.ok(/content: attr\(data-hint\) \/ ""/.test(css), 'la pista no debe entrar al nombre accesible');
  assert.ok(/\.hdr-nav a:focus-visible > span, \.ftr-links a:focus-visible > span \{ background-size: 100% 1px; \}/.test(css) && /\.hdr-nav a:hover > span, \.ftr-links a:hover > span \{ background-size: 100% 1px; \}/.test(css), 'el filete se pinta bajo el rótulo con el cursor y con el foco de teclado');
  assert.ok(!/\.hdr-nav a:(hover|focus-visible) > span[^{]*\{[^}]*(opacity|translate)/.test(css), 'el rótulo no se mueve ni se oculta: la pista no sustituye el texto (CR0-09)');
  assert.ok(/\.hdr-nav a::before, \.ftr-links a::before \{[^}]*align-self: end; font: 500 var\(--fs-0\)\/1 var\(--f-sans\);[^}]*opacity: 0; translate: 0 calc\(100% \+ var\(--ul-gap\)\);/.test(css) && /\.hdr-nav a:hover::before, \.ftr-links a:hover::before \{ opacity: 1; translate: 0 calc\(100% \+ var\(--ul-gap\) \+ var\(--space-1\)\); \}/.test(css) && !/\.(hdr-nav|ftr-links) a:focus-visible::before/.test(css), 'la pista es un subtítulo pequeño bajo el filete, colocado con translate (no mueve la fila) y solo con el cursor (el anillo de foco la cortaría)');
  assert.ok(/\.hdr-nav a \{ --pad: calc\(\(var\(--target-coarse\) - var\(--fs-1\)\) \/ 2\); --ul-gap: 6px;[^}]*margin-inline: calc\(-1 \* var\(--space-1\)\); padding: var\(--pad\) var\(--space-1\);/.test(css), 'enlaces de capítulo de 44 px en escritorio');
  assert.ok(!/\.hdr-nav a::after|\.ftr-links a::after/.test(css) && /\.hdr-nav a > span, \.ftr-links a > span, \.hdr-nav a::before, \.ftr-links a::before \{\s*grid-area: 1 \/ 1;/.test(css) && /\.hdr-nav a > span, \.ftr-links a > span \{\s*display: inline-block; padding-bottom: var\(--ul-gap\); margin-bottom: calc\(-1 \* var\(--ul-gap\)\);\s*background: linear-gradient\(currentColor, currentColor\) left bottom \/ 0 1px no-repeat;/.test(css) && /\.hdr-nav a\[aria-current="true"\] > span \{ background-size: 100% 1px; \}/.test(css), 'el filete se pinta bajo el rótulo y mide lo que mide la palabra, no la celda; la pista no lleva filete');
  assert.ok(/\(forced-colors: active\) \{[^]*?\.hdr-nav a\[aria-current="true"\] > span, \.hdr-nav a:hover > span, \.hdr-nav a:focus-visible > span[^{]*\{ text-decoration: underline/.test(css), 'con colores forzados el filete es un subrayado real');
  assert.ok(/\.hdr-nav a, \.ftr-links a \{ position: relative; display: grid; justify-items: start; align-items: center; \}/.test(css) && !/\.hdr-nav a::before, \.ftr-links a::before \{[^}]*position: absolute/.test(css), 'etiqueta y pista comparten celda: el enlace mide la más ancha y la pista no pisa al vecino');
  assert.ok(!/\.ftr-links a \{[^}]*display: inline-(block|flex)/.test(mobileCss + css) && !/html:not\(\.js\) \.hdr-nav a \{[^}]*display: inline-flex/.test(mobileCss), 'móvil y sin JavaScript no deshacen la retícula del enlace');
  assert.ok(/data-hint="6 temas"><span>Libros<\/span>/.test(html), 'la pista de Libros es corta («6 temas»), como la de los demás capítulos');
});

test('filetes: horario como filas técnicas, sin cruces de registro (CR0-06), botones de doble filete y cita atribuida', () => {
  assert.ok(/--hair: 0\.5px/.test(tokensCss) && /min-resolution: 2dppx/.test(tokensCss), 'filete de 0.5 px en pantallas densas');
  assert.ok(/class="visit-side" data-rules/.test(html), 'la columna del horario entra con data-rules y sin cruces de registro (CR0-06)');
  assert.ok(!/\.rx::(before|after)/.test(css) && !/class="[^"]*\brx\b/.test(html), 'ninguna cruz de registro: el «+» es solo «abrir» y «cerrar»');
  assert.ok(/\.btn--ghost::before, \.btn--line::before, \.btn--line-ink::before/.test(css));
  assert.ok(/@keyframes celluloid/.test(css) && /prefers-reduced-motion: no-preference/.test(css));
  const quote = html.match(/<figure class="quote[\s\S]*?<\/figure>/)[0];
  assert.match(quote, /Miguel de Cervantes/);
  assert.match(quote, /Dominio público/);
  assert.equal([...quote.matchAll(/<blockquote>/g)].length, 1, 'una sola cita');
});


test('tokens: el CSS generado está al día y style.css no redeclara colores en :root', () => {
  assert.ok(html.indexOf('href="tokens.css"') < html.indexOf('href="style.css"'), 'tokens.css va antes que style.css');
  assert.ok(!/:root\s*\{[^}]*--(night|bone|tungsten|turq|terra|paper)/.test(css), 'colores solo en tokens.css');
  assert.match(tokensCss, /GENERADO por scripts\/build-tokens\.mjs/);
});

test('referencia SP: fila «Ver los N resultados» en la búsqueda y documento de la extracción', async () => {
  const catalogSrc = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/sg-all/.test(catalogSrc) && /Ver los \$\{total\} resultados/.test(catalogSrc));
  assert.ok(/\.sg-all/.test(css));
  const doc = await readFile(here('./docs/REFERENCIA-SP-CATALOGO.md'), 'utf8');
  assert.match(doc, /No se importa ningún dato/);
});

test('sugerencias: los autores que empiezan por la consulta van antes que las coincidencias a mitad de palabra', () => {
  const rows = suggest(data.books, 'fre').filter(s => s.kind === 'Autor');
  assert.ok(rows.length >= 2);
  const starts = s => { const a = norm(s.text); return a.startsWith('fre') || a.includes(' fre'); };
  const firstMid = rows.findIndex(s => !starts(s));
  assert.ok(firstMid === -1 || rows.slice(firstMid).every(s => !starts(s)), 'ningún prefijo detrás de una coincidencia interna');
});

test('portadas: una sola familia visual, con el tono por categoría y por título', async () => {
  const warm = new Set(TONES.fiction), cool = new Set(TONES['non-fiction']);
  assert.deepEqual([...warm, ...cool].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'diez tonos, cada uno en una sola familia');
  for (const b of data.books) {
    assert.equal(b.c ?? null, null, 'ya no hay SVG de portada');
    assert.ok((b.k === 'fiction' ? warm : cool).has(coverTone(b)), `tono fuera de su familia: ${b.g}`);
  }
  const a = data.books.find(b => b.k === 'fiction');
  assert.equal(coverTone(a), coverTone({ ...a }), 'el mismo libro da siempre el mismo tono');
  assert.equal(coverTone(a), coverTone({ ...a, g: 'otro-genero' }), 'el tono sale del título, no del género');
  // Cada familia usa sus cinco tonos (oscuros y claros) en todo el catálogo...
  for (const [k, family] of [['fiction', warm], ['non-fiction', cool]]) {
    const used = new Set(data.books.filter(b => b.k === k).map(coverTone));
    assert.deepEqual([...used].sort(), [...family].sort(), `la familia ${k} usa sus cinco tonos`);
  }
  // ...y cada colección de 12 del carrusel (un solo género) muestra al menos tres tonos distintos.
  const { collections } = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  for (const col of collections) {
    const books = pickBooks(data.books, col);
    assert.equal(books.length, 12, `${col.id}: 12 libros`);
    const tones = new Set(books.map(coverTone));
    assert.ok(tones.size >= 3, `${col.id}: ${tones.size} tonos (mínimo 3)`);
    const family = books[0].k === 'fiction' ? warm : cool;
    for (const t of tones) assert.ok(family.has(t), `${col.id}: tono ${t} fuera de su familia`);
  }
});

test('portadas: en cada colección de 12 no hay vecinas del mismo tono, ninguno pasa de 5 y la composición varía', async () => {
  const { collections } = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  assert.equal(collections.length, 4);
  const warm = new Set(TONES.fiction), cool = new Set(TONES['non-fiction']);
  const light = new Set([6, 7, 8, 9]);
  for (const col of collections) {
    const books = pickBooks(data.books, col);
    assert.equal(books.length, 12, `${col.id}: 12 libros`);
    const tones = coverTones(books);
    assert.equal(tones.length, 12);
    for (let i = 1; i < tones.length; i++) assert.notEqual(tones[i], tones[i - 1], `${col.id}: las portadas ${i} y ${i + 1} repiten tono`);
    const count = new Map();
    for (const t of tones) count.set(t, (count.get(t) ?? 0) + 1);
    assert.ok(Math.max(...count.values()) <= 5, `${col.id}: un tono pasa de 5 de 12 (${[...count]})`);
    assert.ok(count.size >= 3, `${col.id}: ${count.size} tonos (mínimo 3)`);
    assert.ok(tones.some(t => light.has(t)) && tones.some(t => !light.has(t)), `${col.id}: mezcla portadas claras y oscuras (no un muro de marrones)`);
    assert.ok(!tones.slice(3).every((t, i) => t === tones[i]), `${col.id}: el reparto no es un ciclo estricto de periodo 3`);
    for (let i = 2; i < tones.length; i++) assert.ok(tones[i] !== tones[i - 2], `${col.id}: las portadas ${i - 1} y ${i + 1} repiten tono (A-B-A)`);
    const family = books[0].k === 'fiction' ? warm : cool;
    for (const t of tones) assert.ok(family.has(t), `${col.id}: tono ${t} fuera de su familia`);
    assert.deepEqual(coverTones(books), tones, `${col.id}: el reparto es estable`);
    assert.deepEqual(coverTones(books.map(b => ({ ...b }))), tones, `${col.id}: el mismo libro da el mismo tono en la misma lista`);
    const layouts = new Set(books.map(coverLayout));
    assert.ok(layouts.size >= 3, `${col.id}: ${layouts.size} composiciones (mínimo 3)`);
    for (const l of layouts) assert.ok(Number.isInteger(l) && l >= 0 && l < COVER_LAYOUTS);
  }
  // Con listas arbitrarias del catálogo (ventanas de 12) las vecinas tampoco repiten.
  for (let from = 0; from + 12 <= data.books.length; from += 7) {
    const tones = coverTones(data.books.slice(from, from + 12));
    for (let i = 1; i < tones.length; i++) assert.notEqual(tones[i], tones[i - 1], `ventana ${from}: vecinas repiten tono`);
  }
  assert.deepEqual(coverTones([]), []);
  assert.deepEqual(coverTones([data.books[0]]), [coverTone(data.books[0])]);
});

test('portadas: la ficha repite el tono de la tarjeta pulsada y la composición vive en CSS', async () => {
  const [cat, rail, news] = await Promise.all(['catalog.js', 'rail.js', 'news.js'].map(f => readFile(here(`./${f}`), 'utf8')));
  assert.ok(/data-cover-tone/.test(cat) && /dataset\.coverTone/.test(cat) && /dataset\.coverTone/.test(rail), 'la tarjeta guarda su tono');
  assert.ok(/openBook\(id, \{ trigger, tone \}/.test(cat) && /cover\(b, tone\)/.test(cat), 'la ficha usa el tono recibido');
  assert.ok(/iti:open-book[\s\S]{0,160}tone: toneOf\(card\)/.test(rail), 'el carrusel manda el tono con la petición');
  assert.ok(/coverTones\(list\)/.test(rail) && /coverTones\(plan\.books\)/.test(news), 'carrusel y Novedades reparten tonos por lista');
  for (let i = 1; i < COVER_LAYOUTS; i++) assert.ok(css.includes(`[data-cover-layout="${i}"]`), `falta la composición ${i}`);
  assert.ok(!/data-cover-layout[^{}]*\{[^}]*(color|background)\s*:/.test(css), 'la composición no toca color');
});

test('móvil: barra inferior con una pestaña por sección, iconos en el sprite y hoja de estilos solo móvil', () => {
  const nav = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  const hrefs = [...nav.matchAll(/href="#([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(hrefs, ['casa', 'cartelera', 'libros', 'visita']);
  for (const m of nav.matchAll(/<use href="#(t-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta el icono ${m[1]}`);
  assert.ok(/<link rel="stylesheet" href="mobile\.css" media="\(max-width: 760px\)">/.test(html));
  assert.ok(/aria-label="Secciones"/.test(nav) && !/role="tablist"/.test(nav), 'navegación por anclas, no tablist');
  assert.ok(/prefers-reduced-transparency: reduce/.test(mobileCss) && !/\.tabbar \{[^}]*backdrop-filter: blur/.test(mobileCss), 'la barra inferior es opaca y no lleva desenfoque: sobre un fondo opaco sería adorno sin efecto');
  assert.ok(!/backdrop-filter:[^;]*\n?[^;]*\.entry-canvas/.test(mobileCss));
});

test('móvil: menú lateral con categorías desplegables accesibles y destinos reales', () => {
  const dlg = html.match(/<dialog class="sheet-menu"[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<nav class="tabbar"[\s\S]*?<button class="tab-menu" type="button" data-menu-open aria-expanded="false" aria-controls="sheet-menu">[\s\S]*?<span class="tab-lb">Menú<\/span><\/button>\s*<\/nav>/.test(html) && !/hdr-more/.test(html + css + mobileCss), 'el botón del menú vive en la barra inferior (quinto botón, con nombre, aria-expanded y aria-controls); ya no hay hamburguesa en la cabecera');
  assert.ok(/aria-labelledby="sheet-menu-title"/.test(dlg) && /data-sm-close/.test(dlg), 'diálogo con título y botón de cierre');
  const rows = [...dlg.matchAll(/<button class="sm-row"[^>]*aria-expanded="false"[^>]*aria-controls="([a-z-]+)"/g)].map(m => m[1]);
  assert.deepEqual(rows, ['sm-cartelera', 'sm-libros', 'sm-visita'], 'acordeones en el orden de la barra inferior; Horarios vive dentro de Visita');
  const order = [...dlg.matchAll(/<(?:a|button) class="sm-row"[^>]*>[\s\S]*?<span class="sm-lb">([^<]+)/g)].map(m => m[1]);
  assert.deepEqual(order, ['La casa', 'Cartelera', 'Libros', 'Visita', 'Mi lista'], 'mismo orden y nombres que la cabecera y la barra; Mi lista aparte al final');
  const bar = [...html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0].matchAll(/<span class="tab-lb">([^<]+)/g)].map(m => m[1]);
  assert.deepEqual(bar, [...order.slice(0, 4), 'Menú'], 'la barra inferior lleva los cuatro capítulos en el mismo orden que el menú y, al final, el botón Menú');
  const foot = dlg.match(/<div class="sm-foot">[\s\S]*?<\/div>/)[0];
  assert.equal((foot.match(/btn--tungsten/g) || []).length, 1, 'una sola acción primaria en el menú');
  assert.ok(/class="btn btn--tungsten"[^>]*google\.com\/maps[^>]*>\s*<span>Cómo llegar/.test(foot) && /class="btn btn--ghost"[^>]*wa\.me[\s\S]*Escribir por WhatsApp/.test(foot), '«Cómo llegar» es el primario y WhatsApp el secundario');
  assert.ok(/id="sm-visita"[\s\S]*?<dl class="sm-hours"><dt>Lunes a sábado<\/dt><dd>11:00–20:00<\/dd><dt>Domingo<\/dt><dd>Cerrado/.test(dlg), 'Horarios dentro de Visita');
  assert.equal((dlg.match(/Cómo llegar/g) || []).length, 1, '«Cómo llegar» aparece una sola vez en el menú (el botón primario del pie)');
  assert.ok(!/Horario y dirección/.test(dlg), 'Visita no repite el horario con un enlace');
  for (const id of rows) assert.ok(new RegExp(`id="${id}" inert`).test(dlg), `${id} plegado e inerte`);
  for (const m of dlg.matchAll(/href="#([a-z]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), `destino #${m[1]} inexistente`);
  for (const m of dlg.matchAll(/data-topic-go="([a-z]+)"/g)) assert.ok(html.includes(`data-topic="${m[1]}"`), `tema ${m[1]} inexistente`);
  for (const m of dlg.matchAll(/<use href="#(t-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta el icono ${m[1]}`);
  assert.ok(/Lunes a s&aacute;bado|Lunes a sábado/.test(dlg) && /Domingo<\/dt><dd>Cerrado/.test(dlg), 'horario real');
  assert.ok(/grid-template-rows: 0fr/.test(mobileCss) && /min-height: 48px/.test(mobileCss), 'despliegue sin saltos y filas de 48 px');
});

test('cartelera móvil: cada tarjeta lleva su foto con pie y procedencia registrada, y los puntos coinciden', () => {
  const items = [...html.matchAll(/<details class="bill-item"[\s\S]*?<\/details>/g)].map(m => m[0]);
  assert.equal(items.length, 3);
  for (const it of items) {
    assert.match(it, /class="bill-card-fig"/);
    assert.match(it, /<span class="bill-card-cap">[^<]+<\/span>/, 'pie de foto sin rótulo');
    assert.match(it, /^<details class="bill-item"[^>]*data-kind="(real|ai)"/, 'la procedencia viaja como dato');
  }
  assert.equal([...html.matchAll(/<div class="bill-dots"[^>]*>([\s\S]*?)<\/div>/g)][0][1].match(/<i>/g).length, items.length);
});

test('tonos claros: las secciones de lectura usan blanco y bruma y el pie el tono profundo, con contraste suficiente', async () => {
  // CR1-05: la cita y el llamado comparten el blanco (light) en móvil y escritorio: el cambio bruma → blanco los separa de Libros sin filete.
  const expected = { 'id="inicio"': 'light', 'class="manifesto"': 'light', 'id="casa"': 'mist', 'id="libros"': 'mist', 'id="catalogo"': 'light', 'class="quote"': 'light', 'class="call"': 'light' };
  for (const [sel, tone] of Object.entries(expected)) {
    const tag = html.match(new RegExp(`<(?:section|div|figure)[^>]*${sel}[^>]*>`))[0];
    assert.ok(tag.includes(`data-tone="${tone}"`) && (sel === 'id="catalogo"' || sel === 'class="quote"' || /data-theme="paper"/.test(tag)), `${sel} sin tono ${tone}`);
  }
  assert.ok(/<footer class="ftr" data-tone="deep">/.test(html));
  assert.ok(!/\.quote \{[^}]*border-top/.test(css), 'sin filete solitario entre Libros y la cita: separa el cambio de tono');
  assert.ok(/\.quote blockquote \{[^}]*margin: 0; max-width: 50rem/.test(css.replaceAll('\n', ' ')), 'la cita va a la izquierda, como el llamado, en ambos tamaños');
  assert.ok(!/\.call \{[^}]*background/.test(mobileCss) && /\.call \{ background: var\(--night\); color: var\(--bone\)/.test(css), 'el llamado toma el fondo del tono (blanco) en móvil y escritorio');
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const tokens = JSON.parse(await readFile(here('./design/tokens.json'), 'utf8')).themes.b4.tones;
  for (const [name, t] of Object.entries(tokens)) {
    assert.ok(ratio(t.bone, t.night) >= 7, `${name}: texto sobre fondo`);
    assert.ok(ratio(t['bone-dim'], t.night) >= 4.5, `${name}: texto atenuado`);
    if (name !== 'deep') for (const k of ['tungsten', 'tungsten-hi', 'turq', 'terra-light']) assert.ok(ratio(t[k], t.night) >= 4.5, `${name}: ${k} sobre fondo`);
  }
  assert.ok(/\[data-tone="light"\]/.test(tokensCss) && /\[data-tone="mist"\]/.test(tokensCss) && /\[data-tone="deep"\]/.test(tokensCss));
});

test('portadas y cabecera: tinta fija sobre superficies oscuras, también dentro de tonos claros', async () => {
  assert.ok(/\.cover--blank \.cover-title \{ color: var\(--cover-ink\); \}/.test(css) && /\.cover-author \{[^}]*var\(--cover-ink-dim\)/.test(css), 'portadas con tinta propia');
  assert.ok(/--cover-ink: #f8f8f8/.test(tokensCss) && /--cover-ink-dim: #cfe3df/.test(tokensCss));
  assert.ok(!/html\[data-glass="lite"\] \.hdr::before \{[^}]*background/.test(css), 'lite no pisa el tinte por sección de la cabecera');
  assert.ok(!/entry-credit/.test(html + css + mobileCss), 'el hero no lleva crédito ni rótulo sobre la foto');
  assert.ok(!/at-top/.test(mobileCss) && /\.entry-copy \{[^}]*padding-bottom: calc\(env\(safe-area-inset-bottom\) \+ var\(--tabbar-h\) \+ var\(--space-7\)\)/.test(mobileCss.replaceAll('\n', ' ')), 'la barra inferior está desde la primera vista y el perfil le reserva su sitio: «Cómo llegar» queda por encima');
  assert.ok(/\.tabbar \{[^}]*width: fit-content;[^}]*margin-inline: auto;/.test(mobileCss.replaceAll('\n', ' ')) && /\.tabbar \{[^}]*box-shadow: var\(--elev-2\);/.test(mobileCss.replaceAll('\n', ' ')) && /\.tabbar \{[^}]*transition: translate var\(--dur-base\) var\(--spring\), visibility var\(--dur-base\);/.test(mobileCss.replaceAll('\n', ' ')), 'barra inferior centrada (no ocupa el ancho), con sombra suave de token y salida animada cuando una hoja ocupa la pantalla');
  assert.ok(/\.tab-lb \{[^}]*clip-path: inset\(50%\)/.test(mobileCss) && /\.tabbar a\[aria-current="location"\] \.tab-lb \{ position: static;/.test(mobileCss) && /\.tabbar a, \.tab-menu \{[^}]*min-width: 48px; height: 48px;/.test(mobileCss.replaceAll('\n', ' ')), 'solo iconos de 48 px; el nombre existe siempre para lectores y se ve en la pestaña activa');
  assert.ok(/html:not\(\.js\) \.tabbar \{ display: none; \}/.test(mobileCss), 'sin JavaScript la barra inferior no tapa los destacados: la cabecera ya trae los cuatro enlaces');
  assert.ok(/\.hdr-brand, \.bill-foot a \{ min-height: 44px; \}/.test(mobileCss) && /\(min-width: 360px\) \{ \.hdr-brand span \{ white-space: nowrap; \} \}/.test(mobileCss), 'marca de la cabecera y enlace del pie de Cartelera de 44 px en móvil; nombre en un renglón desde 360 px');
  assert.ok(!/at-top/.test(await readFile(new URL('../assets/js/boot.js', import.meta.url), 'utf8')) && !/at-top/.test(await readFile(new URL('../app.js', import.meta.url), 'utf8')), 'ya no existe el estado at-top: la barra no se esconde en la primera vista');
  // R01: bajo el perfil nada se maqueta hasta acercarse; cada sección lleva la altura de su contenido para que el largo y las anclas no se muevan.
  for (const sel of ['manifesto', 'house', 'bill', 'books', 'quote', 'call', 'visit', 'ftr']) {
    assert.ok(new RegExp(String.raw`\.${sel} \{ content-visibility: auto; contain-intrinsic-size: auto \d+px; \}`).test(mobileCss), `.${sel} con content-visibility: auto y altura estimada (móvil)`);
  }
  assert.ok(!/\.entry[^{]*\{[^}]*content-visibility/.test(mobileCss), 'el perfil (LCP) nunca se salta');
});

test('cita sin filetes, barra inferior opaca (móvil)', async () => {
  const quoteCss = css.slice(css.indexOf('.quote {'), css.indexOf('.quote cite'));
  assert.ok(!/blockquote::before/.test(quoteCss) && !/clip-path/.test(quoteCss) && !/linear-gradient/.test(quoteCss), 'la cita es tipografía sola: sin filetes por renglón ni animación decorativa');
  assert.ok(!/@keyframes/.test(quoteCss) && !/--q-h/.test(quoteCss));
  assert.ok(!/blockquote::before/.test(css), 'ninguna regla vieja de los filetes de la cita');
  const tint = Number(tokensCss.match(/--glass-tint: rgb\(255 255 255 \/ ([0-9.]+)\)/)[1]);
  const solid = Number(tokensCss.match(/--glass-solid: rgb\(255 255 255 \/ ([0-9.]+)\)/)[1]);
  assert.ok(tint >= 0.96 && solid >= 0.98, `la barra no deja ver contenido bajo las etiquetas (tinte ${tint}, sólido ${solid})`);
});

test('división de app.js: el módulo de escritorio existe, se sirve, se importa bajo demanda y falla sin romper la página', async () => {
  const app = await readFile(here('./app.js'), 'utf8');
  const preview = await readFile(here('./tools/preview-site.mjs'), 'utf8');
  await access(here('./scenes-desktop.js'));
  assert.ok(/import\('\.\/scenes-desktop\.js'\)/.test(app) && !/^import .*scenes-desktop/m.test(app), 'import dinámico, no estático');
  assert.ok(preview.includes("'/scenes-desktop.js'"), 'el servidor de vista previa lo permite');
  assert.ok(/desktopFailed/.test(app) && /console\.error\('No se pudo cargar scenes-desktop/.test(app), 'degradación si falla la carga');
  assert.ok(/vw = innerWidth;[\s\S]{0,200}loadDesktop\(\)/.test(app), 'el cambio de ancho actualiza vw antes de decidir');
  const mod = await readFile(here('./scenes-desktop.js'), 'utf8');
  assert.ok(/export function createEntryScene/.test(mod) && /export function createWipeScene/.test(mod));
});


test('el sitio raíz es el único: no hay otro *.html en la raíz y el sitio anterior no se publica', async () => {
  const pages = (await readdir(repo)).filter(f => /\.html?$/i.test(f));
  assert.deepEqual(pages, ['index.html'], 'un solo HTML en la raíz');
  assert.ok(!/higgsfield-site|assets\/css\/|assets\/js\/(?!boot\.js)|images\//.test(html), 'index.html no referencia recursos del sitio anterior');
  // Ni la lista de permitidos de Cloudflare/Firebase ni el servidor de vista previa incluyen el archivo histórico.
  const gitignore = await readFile(here('./.gitignore'), 'utf8');
  assert.match(gitignore, /^_archive\/$/m, '_archive/ queda fuera de git');
  const firebase = JSON.parse(await readFile(here('./firebase.json'), 'utf8'));
  assert.ok(firebase.hosting.ignore.includes('_archive/**'), 'Firebase Hosting ignora _archive/');
  for (const f of ['./scripts/prepare-public.mjs', './wrangler.jsonc', './tools/preview-site.mjs']) {
    const code = (await readFile(here(f), 'utf8')).replace(/^\s*\/\/.*$/gm, '');
    assert.ok(!code.includes('_archive'), `${f} no publica _archive`);
  }
});

test('servidor de vista previa: lista de permitidos del sitio, sin código, pruebas ni datos', async () => {
  const { createSiteServer } = await import('../tools/preview-site.mjs');
  const server = createSiteServer();
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  const base = `http://127.0.0.1:${server.address().port}`;
  const status = async path => (await fetch(base + path, { headers: { 'accept-encoding': 'identity' } })).status;
  try {
    for (const ok of ['/', '/index.html', '/tokens.css', '/style.css', '/mobile.css', '/app.js', '/catalog.js', '/motion.js', '/scenes-desktop.js', '/Logo.png', '/Logo.webp', '/assets/data/catalog.json', '/assets/js/boot.js', '/assets/fonts/fonts.css']) {
      assert.equal(await status(ok), 200, ok);
    }
    for (const no of ['/package.json', '/tests/site.test.mjs', '/docs/B4-README.md', '/design/tokens.json', '/src/ai/iti-ia.ts', '/worker/index.ts', '/data/taxonomy.controlled.json', '/node_modules/tsx/package.json', '/_archive/models/higgsfield-d599d36a/index.html', '/assets/provenance.json', '/assets/fonts/sources.json', '/assets/fonts/OFL-archivo.txt', '/assets/..%5C..%5Cpackage.json', '/assets/%2e%2e/package.json']) {
      assert.equal(await status(no), 404, no);
    }
    const res = await fetch(`${base}/index.html`);
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('content-encoding'), 'gzip', 'comprime el texto como Cloudflare');
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
});

test('Libros y Catálogo son un solo capítulo: tres capas, un punto de entrada y los mismos nombres en toda la navegación', () => {
  const libros = html.match(/<section id="libros"[\s\S]*?\n {4}<\/section>/)[0];
  assert.ok(libros.includes('data-topic="narrativa"') && libros.includes('data-composer'), 'capa de temas y consulta dentro de Libros');
  assert.ok(/<div id="catalogo" class="cat"[^>]*role="region"[^>]*aria-labelledby="cat-title"/.test(libros), 'el catálogo es una región dentro de Libros');
  assert.ok(/<h3 id="cat-title"/.test(libros), 'jerarquía: h2 del capítulo y h3 de la muestra');
  assert.equal([...html.matchAll(/<section[^>]*id="catalogo"/g)].length, 0, 'no queda una sección de Catálogo aparte');
  assert.ok(html.indexOf('class="quote') > html.indexOf('id="catalogo"'), 'la cita va después del capítulo, no lo parte');
  const names = block => [...block.matchAll(/href="#([a-z]+)"/g)].map(m => m[1]).filter(id => ['casa', 'cartelera', 'libros', 'visita', 'catalogo'].includes(id));
  const desktopNav = html.match(/<nav class="hdr-nav"[\s\S]*?<\/nav>/)[0];
  const phoneMenu = html.match(/<div class="menu" id="menu"[\s\S]*?<\/nav>/)[0];
  const tabbar = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  for (const [name, block] of [['cabecera', desktopNav], ['menú', phoneMenu], ['barra inferior', tabbar]]) {
    assert.deepEqual(names(block), ['casa', 'cartelera', 'libros', 'visita'], `${name}: cuatro capítulos con los mismos nombres`);
  }
  assert.ok(/class="sm-link" href="#catalogo">Buscar en el catálogo/.test(html), 'el menú lateral llega al catálogo desde Libros');
});

test('progreso de lectura: barra fija decorativa, ligada al scroll y sin JS', () => {
  assert.ok(/<div class="progress" aria-hidden="true"><\/div>/.test(html), 'barra decorativa fuera del árbol de accesibilidad');
  assert.ok(/@supports \(animation-timeline: scroll\(\)\)[\s\S]{0,120}animation-timeline: scroll\(root block\)/.test(css), 'animación ligada al scroll con detección de soporte');
  assert.ok(/\.progress \{[^}]*transform: scaleX\(0\)/.test(css), 'sin soporte la barra queda en cero');
  assert.ok(/@keyframes progress-fill/.test(css));
});

test('carrusel de libros: marcado accesible, sin autoplay, publicable y alimentado por colecciones', async () => {
  const rail = html.match(/<div class="rail" data-rail[\s\S]*?data-rail-live><\/p>\s*<\/div>/)[0];
  assert.ok(/data-rail-viewport[^>]*role="region"[^>]*aria-roledescription="carrusel"/.test(rail) || /role="region" aria-roledescription="carrusel"[^>]*data-rail-viewport/.test(rail), 'región con rol de carrusel');
  assert.ok(/tabindex="0"/.test(rail) && /aria-label="Libros anteriores"/.test(rail) && /aria-label="Libros siguientes"/.test(rail), 'foco y botones con nombre');
  assert.ok(/aria-live="polite" data-rail-live/.test(rail), 'aviso al cambiar de colección');
  assert.ok(/html:not\(\.js\) \.rail \{?[^}]*display: none|\.rail\[hidden\], html:not\(\.js\) \.rail \{ display: none; \}/.test(css), 'sin JS no se muestra');
  assert.ok(/scroll-snap-type: x mandatory/.test(css) && !/rail[^{]*\{[^}]*animation/.test(css), 'snap y sin animación automática');
  assert.ok(/\(hover: hover\) and \(pointer: fine\) \{ \.rail-ctrl \{ display: flex; \}/.test(css), 'flechas solo con puntero fino');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.ok(/import\('\.\/rail\.js'\)/.test(app) && !/^import .*rail\.js/m.test(app), 'se carga bajo demanda');
  const railJs = await readFile(new URL('../rail.js', import.meta.url), 'utf8');
  assert.ok(/track\.addEventListener\('focusin'[\s\S]{0,500}scrollPaddingInlineStart[\s\S]{0,300}viewport\.scrollBy\(\{ left: b\.left - v\.left - pad, behavior: isMotion\(\)/.test(railJs), 'Tab: la tarjeta enfocada que asoma recortada se alinea dentro del carrusel');
  const cols = JSON.parse(await readFile(new URL('../assets/data/collections.json', import.meta.url), 'utf8'));
  const sample = JSON.parse(await readFile(new URL('../assets/data/catalog.json', import.meta.url), 'utf8'));
  assert.equal(cols.meta.kind, 'sample');
  for (const c of cols.collections) {
    const list = pickBooks(sample.books, c);
    assert.ok(list.length > 0 && list.length <= 12, `${c.id}: entre 1 y 12 libros`);
    assert.deepEqual(list.map(b => b.t), [...list.map(b => b.t)].sort((a, b) => a.localeCompare(b, 'es')), `${c.id}: orden determinista por título`);
  }
  const ids = [sample.books[7].id, sample.books[3].id, 'no-existe', sample.books[9].id];
  assert.deepEqual(pickBooks(sample.books, { ids }).map(b => b.id), [ids[0], ids[1], ids[3]], 'una lista curada respeta el orden y omite lo que no existe');
  assert.equal(pickBooks(sample.books, { ids: sample.books.map(b => b.id) }).length, 12, 'tope de 12');
});

test('ficha: «Cómo llegar» es la acción primaria, WhatsApp confirma, y el recuadro es legible en el tono claro', () => {
  const ask = html.match(/<div class="drawer-ask">[\s\S]*?<\/div>/)[0];
  assert.ok(ask.indexOf('data-d-visit') > -1 && ask.indexOf('data-d-visit') < ask.indexOf('data-d-cta'), 'la visita va antes que WhatsApp');
  assert.ok(/data-d-visit href="https:\/\/www\.google\.com\/maps\/dir\//.test(ask) && /btn btn--tungsten" data-d-visit/.test(ask), 'visita como botón principal');
  assert.ok(/btn btn--line-ink" data-d-cta/.test(ask), 'WhatsApp como acción secundaria');
  assert.ok(/\.drawer-ask \{[^}]*background: color-mix\(in srgb, var\(--white\)/.test(css), 'fondo claro propio: no hereda --bone, que en el tono claro es tinta');
  assert.ok(/^Hola, ¿tienen «X»/.test(bookMessage({ t: 'X', a: 'Y' })) && /Vi el título en su sitio\.$/.test(bookMessage({ t: 'X', a: 'Y' })), 'el mensaje pregunta si lo tienen: no afirma existencia');
});

test('ficha móvil: portada y datos en dos columnas para que «Cómo llegar» quede en el primer pliegue; sin sello ni rótulo (CR-15)', () => {
  assert.ok(/<div class="drawer-head">[\s\S]*?data-d-save[\s\S]*?<\/div>/.test(html) && !/drawer-tag/.test(html + css + mobileCss), 'título, autor y Guardar van juntos junto a la portada, sin rótulo encima');
  assert.ok(/\.drawer-head \{ display: contents; \}/.test(css), 'en escritorio el grupo no cambia la ficha');
  assert.ok(/\.drawer-body \{[^}]*grid-template-columns: 40% minmax\(0, 1fr\)/.test(mobileCss) && /\.drawer-head \{[^}]*grid-column: 2/.test(mobileCss), 'móvil: portada a 40 % y datos al lado');
  assert.ok(/\.drawer-body > \* \{ grid-column: 1 \/ -1; \}/.test(mobileCss), 'el resto de la ficha ocupa el ancho completo');
  const note = html.match(/<p class="drawer-note">[\s\S]*?<\/p>/)[0];
  assert.equal(note, '<p class="drawer-note">La librería confirma existencia y precio.</p>', 'la nota de la ficha solo dice lo que sirve: quién confirma existencia y precio');
});

test('sin JavaScript la barra con el botón del menú no se muestra y los cuatro capítulos siguen en la cabecera (QA1-03)', () => {
  assert.ok(/html:not\(\.js\) \.tabbar \{ display: none; \}/.test(mobileCss), 'la barra inferior (y su botón de menú) se oculta sin la clase js de boot.js');
  assert.ok(/html:not\(\.js\) \.hdr-nav a \{[^}]*min-height: var\(--target-coarse\)/.test(mobileCss), 'enlaces de capítulo de 44 px sin JavaScript');
  const nav = html.match(/<nav class="hdr-nav"[\s\S]*?<\/nav>/)[0];
  for (const id of ['casa', 'cartelera', 'libros', 'visita']) assert.ok(nav.includes(`href="#${id}"`), `enlace a #${id} en la cabecera`);
});

test('paleta: los campos de color a ancho completo no superan el croma del turquesa del logo; los acentos, un poco más', async () => {
  const tk = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8')).themes.b4;
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const chroma = hex => {
    const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16)));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
    const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
    const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    return Math.hypot(1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.782771766 * m - 0.8086757660 * s);
  };
  const FILL_MAX = 0.09; // el turquesa del logo (#7ac4b4) mide 0.078: ningún campo lo supera; lo rústico de la casa queda en las fotos
  const ACCENT_MAX = 0.11;
  const fills = { 'blanco': tk.tones.light.night, 'bruma': tk.tones.mist.night, 'profundo': tk.tones.deep.night, 'turquesa (Cartelera)': tk.color.turq, 'turquesa (llamado)': tk.color.tungsten, 'papel': tk.color.paper };
  for (let i = 0; i < 10; i++) fills[`portada ${i}`] = tk.color[`cover-${i}-a`]; // las portadas son campos de color: mismo límite que las paredes
  for (const [name, hex] of Object.entries(fills)) assert.ok(chroma(hex) <= FILL_MAX, `${name} ${hex}: croma ${chroma(hex).toFixed(3)} > ${FILL_MAX}`);
  const accents = { 'primaria (blanco)': tk.tones.light.tungsten, 'primaria (bruma)': tk.tones.mist.tungsten, 'turquesa texto (blanco)': tk.tones.light.turq, 'turquesa texto (bruma)': tk.tones.mist.turq, 'estado abierto': tk.color.open };
  for (const [name, hex] of Object.entries(accents)) assert.ok(chroma(hex) <= ACCENT_MAX, `${name} ${hex}: croma ${chroma(hex).toFixed(3)} > ${ACCENT_MAX}`);
  // Ningún token de color hexadecimal (base, portadas, estado abierto/cerrado ni tonos) pasa del límite de acentos.
  const all = [...Object.entries(tk.color), ...Object.entries(tk.tones).flatMap(([t, o]) => Object.entries(o).map(([k, v]) => [`${t}.${k}`, v]))];
  for (const [name, hex] of all.filter(([, v]) => /^#[0-9a-f]{6}$/i.test(v))) assert.ok(chroma(hex) <= ACCENT_MAX, `token ${name} ${hex}: croma ${chroma(hex).toFixed(3)} > ${ACCENT_MAX}`);
  assert.equal(tk.color['turq-base'], tk.color.turq, 'la cortinilla termina exactamente en el color de Cartelera');
});

test('portadas: el autor y el título se leen sobre el campo plano de cada portada', async () => {
  const tk = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8')).themes.b4.color;
  const lum = hex => { const [r, g, b] = [1, 3, 5].map(i => { const c = parseInt(hex.slice(i, i + 2), 16) / 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  // Diez portadas: 0 a 5 oscuras (tinta clara común) y 6 a 9 claras (tinta oscura propia, `cover-N-ink` y `cover-N-ink-dim`).
  for (let i = 0; i < 10; i++) {
    const own = i >= 6;
    const ink = own ? tk[`cover-${i}-ink`] : tk['cover-ink'], dim = own ? tk[`cover-${i}-ink-dim`] : tk['cover-ink-dim'];
    assert.ok(!own || (ink && dim), `cover-${i} trae su propia tinta`);
    const bg = tk[`cover-${i}-a`];
    assert.ok(ratio(dim, bg) >= 4.5, `autor sobre cover-${i}-a: ${ratio(dim, bg).toFixed(2)}:1`);
    assert.ok(ratio(ink, bg) >= 4.5, `título sobre cover-${i}-a: ${ratio(ink, bg).toFixed(2)}:1`);
    assert.equal(tk[`cover-${i}-b`], undefined, `cover-${i} es un campo plano: sin segunda parada`);
    assert.ok(css.includes(`.tone-${i} { background: var(--cover-${i}-a); }`), `tone-${i} es un campo plano con el token de su portada (sin degradado)`);
    assert.ok(!/\.cover--blank \{[^}]*gradient/.test(css), 'la portada base tampoco lleva degradado');
    if (own) assert.ok(css.includes(`.tone-${i} { --cover-ink: var(--cover-${i}-ink); --cover-ink-dim: var(--cover-${i}-ink-dim); }`), `tone-${i} usa su tinta`);
  }
});

test('portadas: las dos familias son frías o neutras (turquesa, azul, gris): nada rústico fuera de las fotos', async () => {
  // El logo es turquesa (tono OKLCH 179). Las portadas van de turquesa a azul (150 a 255) o son neutras (croma < 0.02):
  // lo cálido y rústico (madera, ladrillo, ocre) queda en las fotos de la casa.
  const tk = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8')).themes.b4.color;
  const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const hue = hex => {
    const [r, g, b] = [1, 3, 5].map(i => lin(parseInt(hex.slice(i, i + 2), 16)));
    const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b), m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b), s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
    const a = 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, bb = 0.0259040371 * l + 0.782771766 * m - 0.808675766 * s;
    return { c: Math.hypot(a, bb), h: (Math.atan2(bb, a) * 180 / Math.PI + 360) % 360 };
  };
  for (const i of [...TONES.fiction, ...TONES['non-fiction']]) {
    const { c, h } = hue(tk[`cover-${i}-a`]);
    assert.ok(c < 0.02 || (h >= 150 && h <= 255), `portada ${i}: tono ${h.toFixed(0)} fuera de la familia fría (150 a 255)`);
  }
});

test('ritmo y movimiento: relleno de secciones con la escala de 4 px y movimiento reducido sin desplazamientos', () => {
  assert.ok(/--sec-sm: var\(--space-7\); --sec-md: var\(--space-9\)/.test(css) && /--sec-sm: var\(--space-8\); --sec-md: var\(--space-10\)/.test(css), 'dos pasos de ritmo, móvil y escritorio');
  for (const sel of ['manifesto', 'bill', 'books', 'quote', 'visit', 'ftr', 'cat', 'call']) {
    const rule = css.match(new RegExp(`\.${sel} \{[^}]*\}`))[0];
    assert.ok(/var\(--sec-(sm|md)\)/.test(rule) && !/clamp\([^)]*vh/.test(rule), `.${sel} usa el ritmo de la escala y no el alto de la pantalla`);
  }
  assert.ok(/@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{ transition-duration: 0\.01ms !important/.test(css), 'regla general de movimiento reducido');
  assert.ok(/\*:not\(\.progress\)/.test(css), 'la barra de progreso (ligada al scroll) queda fuera');
  const ping = css.match(/animation: ping ([^;]*);/)[1];
  assert.ok(/^var\(--dur-scene\) var\(--ease-out\) \d+(?!\d)/.test(ping), 'el pulso del punto «abierto» usa la duración del token tal cual (sin calc ni multiplicador)');
  assert.ok(!/calc\(|infinite/.test(ping), 'el pulso es finito: nada anima en reposo para siempre');
});

test('Mi lista: guardar, quitar, tope y mensaje de WhatsApp informativo', () => {
  clearSaved();
  assert.deepEqual(savedIds(), []);
  assert.deepEqual(toggleSaved('a'), { ok: true, on: true });
  toggleSaved('b');
  assert.deepEqual(savedIds(), ['b', 'a'], 'lo más reciente primero');
  assert.equal(isSaved('a'), true);
  assert.deepEqual(toggleSaved('a'), { ok: true, on: false });
  assert.deepEqual(savedIds(), ['b']);
  clearSaved();
  for (let i = 0; i < MAX_SAVED; i++) toggleSaved(`id-${i}`);
  assert.deepEqual(toggleSaved('uno-mas'), { ok: false, on: false, full: true }, 'tope de la lista');
  assert.equal(savedIds().length, MAX_SAVED);
  clearSaved();
  const books = Array.from({ length: 15 }, (_, i) => ({ t: `Título ${i + 1}`, a: i === 0 ? 'Autor no indicado' : `Autora ${i + 1}` }));
  const msg = listMessage(books);
  assert.ok(msg.startsWith('Hola, pienso visitarlos pronto.') && msg.includes('1. «Título 1»\n') &&!msg.includes('Autor no indicado'), 'mensaje informativo sin autor genérico');
  assert.ok(msg.includes('12. «Título 12»') && !msg.includes('13. ') && msg.includes('…y 3 más.'), 'tope de 12 títulos con aviso del resto');
  assert.ok(!/precio|\$|oferta|reserv|apart/i.test(msg), 'no promete precio ni apartado');
  const url = new URL(listWaUrl(books));
  assert.equal(url.origin + url.pathname, 'https://wa.me/528180875940');
  assert.ok(url.href.length < 2000, 'el enlace cabe en un mensaje');
});

test('Mi lista y Explorar: marcado accesible, entradas coherentes y publicación', async () => {
  const dlg = html.match(/<dialog class="mylist"[\s\S]*?<\/dialog>/)[0];
  assert.ok(/aria-labelledby="mylist-title"/.test(dlg) && /data-ml-close/.test(dlg) && /data-ml-visit href="https:\/\/www\.google\.com\/maps\/dir\//.test(dlg), 'hoja con título, cierre y Cómo llegar');
  assert.ok(/data-ml-wa[^>]*hidden/.test(dlg) && /data-ml-empty[^>]*hidden/.test(dlg), 'WhatsApp y estado vacío arrancan ocultos');
  assert.ok(/class="sm-row" type="button" data-open-mylist/.test(html) && /data-saved-count/.test(html) && /class="hdr-list"[^>]*data-saved-badge[^>]*hidden/.test(html), 'entradas desde el menú y la cabecera');
  assert.ok(/class="save save--wide" data-d-save[^>]*aria-pressed="false"/.test(html), 'la ficha trae su botón de guardar');
  const savedSrc = await readFile(here('./saved.js'), 'utf8');
  assert.ok(!/\.hdr-list \{ display: none; \}/.test(mobileCss) && /\.hdr-list \{[^}]*min-width: 44px; min-height: 44px/.test(mobileCss), 'U03: en móvil el chip de la cabecera se ve con libros guardados (objetivo de 44 px) y no se oculta');
  assert.ok(/\.hdr-list\[hidden\] \{ display: none; \}/.test(css), 'sin libros guardados el chip desaparece');
  assert.ok(/setAttribute\('aria-label', `Mi lista, \$\{countText\(n\)\}`\)/.test(savedSrc), 'el chip lleva el conteo en su nombre accesible («Mi lista, 3 libros»)');
  const ex = html.match(/<dialog class="explorer" id="explorer"[\s\S]*?\n {6}<\/dialog>/)[0];
  assert.ok(/data-cat-q/.test(ex) && /data-cat-grid/.test(ex) && /data-cat-filters/.test(ex) && /data-ex-close/.test(ex) && /aria-labelledby="explorer-title"/.test(ex), 'el explorador contiene búsqueda, filtros y rejilla');
  assert.ok(!/id="cat-drawer"/.test(ex), 'la ficha NO va dentro del explorador (un diálogo dentro de otro cerrado no se muestra)');
  assert.ok(/data-ex-open aria-controls="explorer"/.test(html));
  assert.ok(/\.explorer:modal \{[^}]*position: fixed; inset: 0/.test(mobileCss) && /html\.explorer-open \{ overflow: hidden; \}/.test(css), 'hoja a pantalla completa y scroll bloqueado');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.ok(/openDialog\(explorer, \{ lock: 'explorer-open', url: '#explorar', defer: true \}\)/.test(app), 'Explorar se abre por el módulo de hojas, con su entrada #explorar y el contenido en otra tarea');
  assert.ok(/import\('\.\/saved\.js'\)/.test(app) && !/^import .*saved\.js/m.test(app), 'Mi lista se carga en reposo');
  const prepare = await readFile(new URL('../scripts/prepare-public.mjs', import.meta.url), 'utf8');
  const preview = await readFile(new URL('../tools/preview-site.mjs', import.meta.url), 'utf8');
  for (const f of ['sample.js', 'saved.js', 'rail.js', 'sheets.js']) { assert.ok(prepare.includes(`"${f}"`), `${f} se publica`); assert.ok(preview.includes(`'/${f}'`), `${f} se sirve en la vista previa`); }
  assert.ok(/\.toast \{[^}]*width: max-content/.test(css) && /popover = 'manual'/.test(await readFile(new URL('../saved.js', import.meta.url), 'utf8')), 'el aviso va en la capa superior y no se parte');
});


test('hojas: un solo módulo lleva el historial y el bloqueo de scroll (menú, Mi lista, ficha, Explorar)', async () => {
  const read = f => readFile(new URL(`../${f}`, import.meta.url), 'utf8');
  const [sheets, app, cat, saved] = await Promise.all(['sheets.js', 'app.js', 'catalog.js', 'saved.js'].map(read));
  // el comportamiento de sheets.js (contador de bloqueo, «atrás») se prueba en tests/sheets.test.mjs; aquí, quién usa qué
  // nadie más toca las clases de bloqueo ni empuja historial por su cuenta
  for (const [name, src] of Object.entries({ app, cat, saved })) {
    assert.ok(!/classList\.(add|remove)\('(sheet-open|explorer-open)'\)/.test(src), `${name}: el bloqueo de scroll es de sheets.js`);
    assert.ok(!/history\.pushState/.test(src), `${name}: el historial es de sheets.js`);
  }
  assert.ok(/openDialog\(dlg[,)]/.test(app) && /openDialog\(drawer[,)]/.test(cat) && /openDialog\(dlg[,)]/.test(saved), 'menú, ficha y Mi lista se abren por openDialog');
  // menú y ficha abren en dos tareas (INP): showModal con el contenido en espera y el diseño del contenido después
  assert.ok(/openDialog\(dlg, \{ defer: true \}\)/.test(app) && /openDialog\(drawer, \{ defer: true \}\)/.test(cat), 'menú y ficha abren con defer');
  assert.ok(/classList\.add\('is-filling'\)/.test(sheets) && /classList\.remove\('is-filling'\)/.test(sheets), 'sheets.js pone y quita is-filling');
  const css = await read('style.css');
  assert.ok(/\.is-filling > \* \{ content-visibility: hidden; \}/.test(css), 'el contenido en espera no se maqueta (content-visibility: hidden)');
  assert.ok(/pushSheet\(\{ close: \(\) => setMenu\(false\), lock: null \}\)/.test(app), 'el menú de tableta también responde a «atrás»');
  // el aviso vive dentro de la hoja modal abierta (lo que queda fuera de un modal es inerte y no se podría tocar «Ver mi lista»)
  assert.ok(/topDialog\(\) \|\| document\.body/.test(saved), 'el aviso se mueve a la hoja modal');
  // escritorio: Explorar en línea no enfoca el campo ni desplaza la página al cargar (show() ejecuta los pasos de enfoque)
  assert.ok(/explorer\.open = true/.test(app) && !/explorer\.show\(\)/.test(app), 'Explorar en línea se abre sin enfocar');
});

// ---------------------------------------------------------------------------------------------
// Móvil tipo red social, Novedades y una sola acción primaria (agente ux-movil-feed)

const SAMPLE_META = { kind: 'sample', label: 'Datos de muestra · no es inventario' };

test('Novedades: sin datos el plan no muestra nada, ni siquiera todo el catálogo', async () => {
  const shipped = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  assert.deepEqual(shipped.novedades.ids, [], 'el listado real llegará después: hoy la colección está vacía');
  assert.ok(!shipped.collections.some(c => /novedades/i.test(c.id)), 'el carrusel de libros no recibe la colección de Novedades');
  const sinDatos = [shipped, { meta: SAMPLE_META }, { meta: SAMPLE_META, novedades: {} }, { meta: SAMPLE_META, novedades: { ids: [] } }, { meta: SAMPLE_META, novedades: { ids: ['no-existe', 'tampoco'] } }, { novedades: { ids: 'x' } }, null, undefined];
  for (const d of sinDatos) {
    const plan = newsPlan(data.books, d);
    assert.equal(plan.show, false, JSON.stringify(d)?.slice(0, 60));
    assert.deepEqual(plan.books, [], 'sin ids no se arma ninguna tarjeta (pickBooks sin ids devolvería todo el catálogo)');
  }
});

test('Novedades: con ids se muestra en el orden dado, sin avisos', () => {
  const [a, b, c] = [data.books[5], data.books[2], data.books[9]];
  const plan = newsPlan([a, b, c], { meta: SAMPLE_META, novedades: { titulo: 'Recién llegados', ids: [c.id, 'no-existe', b.id, a.id] } });
  assert.equal(plan.show, true);
  assert.deepEqual(plan.books.map(x => x.id), [c.id, b.id, a.id], 'orden de la lista; omite lo que no existe');
  assert.ok(!('note' in plan), 'el plan no trae rótulo de muestra');
  // tope
  assert.equal(newsPlan(data.books, { meta: SAMPLE_META, novedades: { ids: data.books.slice(0, 40).map(x => x.id) } }).books.length, NEWS_SIZE);
});

test('Novedades: nace oculta en el documento y con un solo enlace', () => {
  const markup = html.match(/<section id="novedades"[\s\S]*?<\/section>/)[0];
  assert.ok(/<section id="novedades" class="news rail" data-news[^>]*\bhidden>/.test(markup), 'nace oculta (sin JS y sin datos no existe)');
  assert.ok(/<li data-news-link hidden><a class="sm-link" href="#novedades">/.test(html), 'el enlace del menú nace oculto');
  assert.equal([...html.matchAll(/href="#novedades"/g)].length, 1, 'un solo enlace a la sección');
});

test('Novedades: nada se presenta como ranking ni como inventario', async () => {
  const files = await Promise.all(['index.html', 'app.js', 'news.js', 'feed.js', 'rail.js', 'catalog.js', 'saved.js'].map(f => readFile(here(`./${f}`), 'utf8')));
  for (const [i, src] of files.entries()) assert.ok(!/m[aá]s le[ií]dos|lo m[aá]s preguntado|best ?seller|m[aá]s vendid/i.test(src), `ranking inventado en el archivo ${i}`);
  const news = await readFile(here('./news.js'), 'utf8');
  assert.ok(!/Datos de muestra|no es inventario/.test(news), 'Novedades no imprime avisos de muestra');
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(/import\('\.\/news\.js'\)/.test(app) && !/^import .*news\.js/m.test(app), 'Novedades se carga bajo demanda');
  const prepare = await readFile(here('./scripts/prepare-public.mjs'), 'utf8');
  const preview = await readFile(here('./tools/preview-site.mjs'), 'utf8');
  for (const f of ['feed.js', 'news.js']) { assert.ok(prepare.includes(`"${f}"`), `${f} se publica`); assert.ok(preview.includes(`'/${f}'`), `${f} se sirve en la vista previa`); }
});

test('perfil móvil: nombre, estado, dirección, «Cómo llegar» como única acción de la primera vista, sin burbujas de historias', () => {
  const copy = html.match(/<div class="entry-copy"[\s\S]*?<\/section>/)[0];
  assert.ok(/class="profile-av" src="assets\/img\/logo-96\.webp"[^>]*alt=""/.test(copy), 'avatar decorativo con el logo');
  assert.ok(/<h1 id="entry-title"[\s\S]*Librería Itinerante <i>y Más<\/i>/.test(copy), 'el h1 es el nombre del perfil');
  assert.ok(/data-status-text/.test(copy) && /Mariano Matamoros Pte\. 421/.test(copy), 'estado en vivo y dirección');
  assert.ok(/Pte\. 421&nbsp;·&nbsp;Centro<\/li>/.test(copy) && /\.entry-facts li:has\(> \.ic\) \{ align-items: start; \}/.test(mobileCss) && /\.entry-facts li:has\(> \.ic\) > \.ic \{ margin-top: 2px; margin-top: calc\(\(1lh - 1em\) \/ 2\); \}/.test(mobileCss), 'si la dirección parte en dos líneas, «421 · Centro» va junto y el pin se queda en la primera línea');
  const actions = [...copy.matchAll(/<a class="(btn [^"]*)"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  assert.equal(actions.length, 2);
  assert.ok(/btn--tungsten/.test(actions[0][1]) && /google\.com\/maps/.test(actions[0][2]) && /Cómo llegar/.test(actions[0][3]), 'primaria: Cómo llegar');
  assert.ok(/btn--ghost/.test(actions[1][1]) && /wa\.me/.test(actions[1][2]) && /Pregunta por un libro/.test(actions[1][3]), 'WhatsApp existe como secundaria (escritorio)');
  assert.ok(/\.entry-actions \.btn--ghost \{ display: none; \}/.test(mobileCss) && /\.entry-actions \{ grid-template-columns: 1fr; \}/.test(mobileCss), 'en móvil «Escribir» sale de la primera vista (Hick: <= 6 acciones); WhatsApp queda en la cabecera al desplazar, Cartelera, Libros y Visita');
  assert.ok(!/only-phone|hide-phone/.test(html + css + mobileCss), 'sin variantes de texto solo móvil');
  assert.ok(!/class="hl\b|hl-item|data-story/.test(html) && !/\.hl\b|\.hl-|\.story|\.stories/.test(css + mobileCss), 'sin destacados ni visor de historias: ni marcado ni estilos (decisión del 2026-11-11)');
  assert.ok(/\.profile-av \{ display: none; \}/.test(css) && /grid-template-areas: "av name" "av facts" "row row";/.test(mobileCss), 'el perfil es solo móvil y su retícula no reserva fila de destacados');
  assert.ok(/\.js \.hdr:not\(\.is-solid\) :is\(\.hdr-brand, \.hdr-wa\) \{ opacity: 0; visibility: hidden; \}/.test(mobileCss), 'al inicio la cabecera va vacía sobre la foto (el menú vive en la barra inferior); sin JS la marca sigue visible');
});

test('Cartelera como publicaciones: foto, pie, «Me interesa» y «Compartir» locales, sin contadores ni fechas', async () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  assert.equal(items.length, 3);
  for (const [block, id] of items) {
    assert.ok(/<img class="bill-card-img"/.test(block) && /<span class="bill-card-cap">[^<]+<\/span>/.test(block), `${id}: foto y pie`);
    assert.ok(new RegExp(`<button class="act" type="button" data-interest="${id}" data-title="[^"]+" aria-pressed="false">`).test(block), `${id}: «Me interesa» con aria-pressed`);
    assert.ok(new RegExp(`<button class="act" type="button" data-share="${id}" data-title="[^"]+">`).test(block), `${id}: «Compartir»`);
    assert.ok(!/\d+\s*(me gusta|likes?|reseñas)|★/i.test(block), `${id}: sin señales sociales inventadas`);
  }
  for (const id of ['i-heart', 'i-share']) assert.ok(html.includes(`<symbol id="${id}"`), `icono ${id}`);
  assert.ok(/\.act \{[^}]*min-height: var\(--target-coarse\)/.test(css.replaceAll('\n', ' ')) && /\.act\[aria-pressed="true"\]/.test(css), 'botones de ≥ 44 px con estado');
  assert.ok(/html:not\(\.js\) \.bill-acts \{ display: none; \}/.test(css), 'sin JavaScript no se muestran botones que no funcionan');
  const feed = await readFile(here('./feed.js'), 'utf8');
  assert.ok(/navigator\.share/.test(feed) && /AbortError/.test(feed) && /clipboard\.writeText/.test(feed), 'Web Share con respaldo de copiar enlace; cancelar no copia');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(feed), '«Me interesa» no envía nada');
  assert.ok(/const store = \(\) => \{ try \{ return globalThis\.localStorage/.test(feed), 'el almacenamiento va en try/catch');
  // lectura tolerante del almacenamiento
  assert.deepEqual(readInterest(), [], 'sin almacenamiento');
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('bloqueado'); }, configurable: true });
  assert.deepEqual(readInterest(), [], 'almacenamiento bloqueado');
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => '["circulo", 3, null, "taller"]' }, configurable: true });
  assert.deepEqual(readInterest(), ['circulo', 'taller'], 'ignora lo que no es texto');
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => '{rota' }, configurable: true });
  assert.deepEqual(readInterest(), [], 'JSON roto');
  delete globalThis.localStorage;
});

test('publicaciones de Cartelera (CR-13, QA1-05): encabezado → foto → acciones → texto, sin números de interacción, y cada «Compartir» nombra su publicación', async () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  assert.equal(items.length, 3);
  const buttons = [];
  for (const [block, id] of items) {
    const order = [/class="bill-post-head"/, /class="bill-card-img"/, /class="bill-acts"/, /class="bill-cap"/, /<p>/].map(re => block.search(re));
    assert.ok(order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1])), `${id}: el DOM va de encabezado a foto, acciones y texto (${order})`);
    assert.ok(/<span class="bill-post-who"><b>Itinerante<\/b> · propuesta<\/span>/.test(block) && /<img class="bill-av" src="assets\/img\/logo-96\.webp"[^>]*alt=""/.test(block), `${id}: avatar y «Itinerante · propuesta»`);
    const pick = re => block.match(re)[1];
    assert.equal(pick(/class="bill-cap-t">([^<]+)</), pick(/class="bill-title">([^<]+)</), `${id}: el título del pie es el del acordeón`);
    assert.equal(pick(/class="bill-cap-s">([^<]+)</), pick(/class="bill-sub">([^<]+)</), `${id}: la frase del pie es la del acordeón`);
    assert.equal(pick(/data-share="[a-z]+" data-title="([^"]+)"/), pick(/class="bill-title">([^<]+)</), `${id}: «Compartir» lleva el título`);
    assert.ok(!/\b\d+\s*(me gusta|likes?|reseñas|personas|interesad)/i.test(block.replace(/<[^>]+>/g, ' ')), `${id}: sin contadores ni números de interacción`);
    buttons.push({ dataset: { title: pick(/data-share="[a-z]+" data-title="([^"]+)"/) }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } });
  }
  // initFeed de verdad, sobre un DOM mínimo: cada botón «Compartir» queda con un nombre distinto y con el texto visible dentro (WCAG 2.5.3)
  globalThis.document = { querySelectorAll: sel => (sel === '[data-share]' ? buttons : []) };
  try { initFeed(); } finally { delete globalThis.document; }
  const names = buttons.map(b => b.attrs['aria-label']);
  assert.equal(new Set(names).size, 3, `tres nombres distintos: ${names}`);
  assert.deepEqual(names, ['Compartir «Círculo de lectura»', 'Compartir «Ajedrez en la casa»', 'Compartir «Taller de escritura»']);
  assert.ok(names.every(n => n.startsWith('Compartir')), 'el nombre empieza por el texto visible');
  assert.equal(shareName(''), 'Compartir «esta propuesta»');
  // escritorio no ve el encabezado ni el pie móvil; móvil no repite el título del acordeón
  assert.ok(/\.bill-card-fig, \.bill-dots, \.bill-post-head, \.bill-cap \{ display: none; \}/.test(css), 'solo móvil');
  assert.ok(/\.bill-item summary \.bill-title, \.bill-item summary \.bill-sub \{ display: none; \}/.test(mobileCss), 'en móvil el título se lee una sola vez');
});

test('una sola acción primaria («Cómo llegar») con la misma clase y WhatsApp siempre secundario', async () => {
  const all = [...html.matchAll(/<a class="([^"]*\bbtn\b[^"]*)"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const primary = all.filter(m => /btn--tungsten/.test(m[1]));
  assert.ok(primary.length >= 9, 'cabecera, menú, hoja, Mi lista, hero, Cartelera, Libros, ficha y Visita');
  for (const m of primary) {
    assert.ok(/google\.com\/maps\/dir/.test(m[2]), `la primaria siempre abre la ruta: ${m[2].slice(0, 50)}`);
    assert.ok(/Cómo llegar/.test(m[3]), `la primaria siempre dice «Cómo llegar»: ${m[3].slice(0, 40)}`);
  }
  for (const m of all.filter(m => /wa\.me/.test(m[2]))) assert.ok(!/btn--tungsten|btn--xl/.test(m[1]), `WhatsApp es secundario: ${m[1]}`);
  for (const gone of ['btn--light', 'btn--night', 'btn--ink', 'btn--xl']) assert.ok(!html.includes(gone) && !css.includes(`.${gone}`) && !mobileCss.includes(`.${gone}`), `ya no existe ${gone}`);
  assert.ok(/\.btn--tungsten \{ background: var\(--terra-deep\); color: var\(--white\)/.test(css), 'un solo color para la primaria, sobre cualquier fondo');
  // al pie de Cartelera y de Libros hay «Cómo llegar»
  assert.ok(/class="btn btn--tungsten bill-visit"[^>]*>\s*<span>Cómo llegar/.test(html), 'pie de Cartelera');
  assert.ok(/<div class="books-foot">[\s\S]*?class="btn btn--tungsten"[^>]*>\s*<span>Cómo llegar/.test(html), 'pie de Libros');
  // Libros: la consulta por WhatsApp es secundaria y no más grande que la primaria
  assert.ok(/class="btn btn--line-ink" data-book-cta/.test(html), 'la consulta de Libros es un botón de línea');
  assert.ok(/hdr\.classList\.toggle\('has-primary'/.test(await readFile(here('./app.js'), 'utf8')) && /\.hdr\.has-primary \.hdr-cta \{ opacity: 0; visibility: hidden; \}/.test(css), 'la primaria de la cabecera cede cuando hay otra a la vista');
});

test('INP: los botones confirman primero y la hoja se abre o se cierra después de pintar', async () => {
  const [motion, sheets, rail, cat, app] = await Promise.all(['motion.js', 'sheets.js', 'rail.js', 'catalog.js', 'app.js'].map(f => readFile(here(f), 'utf8')));
  assert.ok(/export function afterPaint/.test(motion) && /requestAnimationFrame\(\(\) => setTimeout\(run, 0\)\)/.test(motion), 'afterPaint cede el hilo hasta después del fotograma');
  assert.ok(!/setTimeout\([^)]*,\s*\[1-9]d*\)/.test(motion), 'motion.js no escribe milisegundos a mano');
  assert.ok(/export function closeDialog/.test(sheets) && /is-closing/.test(sheets), 'el cierre desde un botón empieza a salir antes del cierre real');
  const closeFn = sheets.slice(sheets.indexOf('export function closeDialog'));
  assert.ok(closeFn.indexOf("classList.add('is-filling')") > closeFn.indexOf('afterPaint(exited)') && closeFn.indexOf('dlg.close()') > closeFn.indexOf("classList.add('is-filling')"), 'el cierre desde un botón omite el contenido de la hoja ya salida antes de close() (tareas < 200 ms con CPU 4x)');
  assert.ok(/\.motion \.explorer\.is-closing/.test(mobileCss), 'Explorar define su salida (fundido) en CSS');
  assert.ok(/export async function confirmThen/.test(motion) && /data-opening/.test(motion), 'una sola guarda «marcar, pintar, abrir»');
  assert.ok(/confirmThen\(opener/.test(app) && /closeDialog\(dlg\)/.test(app), 'el menú lateral abre y cierra después de pintar');
  assert.ok(/confirmThen\(card/.test(rail) && /confirmThen\(c,/.test(cat), 'la tarjeta confirma el toque y la ficha se abre después');
  assert.ok(!/hasAttribute\('data-opening'\)|dataset\.opening/.test(app + rail + cat), 'ninguna pieza lleva su propia guarda de doble toque');
  assert.ok(/closeDialog\(drawer\)/.test(cat), 'la ficha se cierra por closeDialog');
  assert.ok(/\.motion \.sheet-menu\.is-closing/.test(mobileCss) && /\.motion \.drawer\.is-closing/.test(css) && /\.motion \.drawer\.is-closing/.test(mobileCss), 'cada hoja define su salida en CSS');
  assert.ok(/FIRST_CHUNK/.test(rail) && /if \(mine !== paintId\) return;/.test(rail), 'el chip confirma ya y las tarjetas se cambian después, por tandas');
  // Explorar y Mi lista también confirman primero (su INP era toda la apertura: 250-540 ms con CPU 4x)
  const savedSrc = await readFile(here('saved.js'), 'utf8');
  assert.ok(/confirmThen\(e\.currentTarget, openExplorer\)/.test(app) && /closeDialog\(explorer\)/.test(app), 'Explorar abre y cierra después de pintar');
  const openEx = /const openExplorer = async \(\) => \{[\s\S]*?\n      \};/.exec(app)[0];
  assert.ok(openEx.indexOf('await openDialog(explorer') < openEx.indexOf('bootCatalog()') && !/await bootCatalog/.test(openEx), 'Explorar abre la hoja con sus esqueletos antes de pedir el catálogo: la respuesta no espera a la red');
  assert.ok(/nav\.dataset\.more = nav\.scrollTop \+ nav\.clientHeight < nav\.scrollHeight/.test(app) && /sub\.scrollIntoView\(\{ block: 'nearest'/.test(app) && /\.sm-nav\[data-more="1"\] \{ mask-image: linear-gradient\(to bottom, var\(--black\) calc\(100% - var\(--space-7\)\), transparent\); \}/.test(mobileCss), 'menú lateral: el acordeón abierto queda a la vista y el pie de la lista se funde cuando hay más abajo');
  assert.ok(/confirmThen\(opener, openList\)/.test(savedSrc) && /closeDialog\(dlg\)/.test(savedSrc), 'Mi lista abre y cierra después de pintar');
  // El fondo no se tapa (content-visibility: hidden en los bloques de la página): se pidió revertirlo, ver DESIGN.md «Fondo tras la hoja»
  assert.ok(!/is-behind/.test(css + mobileCss) && !/\buncover\b|contentVisibility/.test(sheets), 'sheets.js no oculta la página tras la hoja');
});

test('barra inferior: el vidrio es lo bastante opaco para que no se vea contenido bajo las etiquetas', () => {
  const m = tokensCss.match(/--glass-tint:\s*rgb\(\d+ \d+ \d+ \/ ([\d.]+)\)/);
  assert.ok(m && Number(m[1]) >= 0.92, 'glass-tint con opacidad >= 0.92');
});

test('horario de Visita: dos filas (lunes a sábado y domingo), hoy se marca por día y sin JavaScript se lee igual', async () => {
  const table = html.match(/<table class="hours">[\s\S]*?<\/table>/)[0];
  const rows = [...table.matchAll(/<tr data-days="([0-6 ]+)"><th scope="row">([^<]+)<\/th><td>([^<]+)<\/td><\/tr>/g)];
  assert.deepEqual(rows.map(r => [r[1], r[2], r[3]]), [['1 2 3 4 5 6', 'Lunes a sábado', '11:00–20:00'], ['0', 'Domingo', 'Cerrado']], 'dos filas con el horario real');
  assert.equal((table.match(/11:00–20:00/g) || []).length, 1, 'el horario no se repite fila por fila');
  const days = rows.flatMap(r => r[1].split(' ')).sort();
  assert.deepEqual(days, ['0', '1', '2', '3', '4', '5', '6'], 'cada día cae en una sola fila: hoy siempre se marca una');
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(/tr\.dataset\.days\.split\(' '\)\.includes\(String\(now\.day\)\)/.test(app), 'is-today sale de la lista de días de la fila');
});

test('Libros: un solo titular grande, una sola fila de chips al inicio, el carrusel como respuesta y lo demás debajo', () => {
  const libros = html.match(/<section id="libros"[\s\S]*?\n {4}<\/section>/)[0];
  assert.equal((libros.match(/class="h2"/g) || []).length, 1, 'un solo H2 visual en el capítulo');
  assert.equal((libros.match(/<h2[\s>]/g) || []).length, 1, 'un solo h2 en el marcado');
  assert.ok(!/class="[^"]*h2[^"]*"/.test(libros.replace(/class="h2"/, '')), 'las capas internas usan layer-title, no h2');
  const chips = [...libros.matchAll(/role="radiogroup"[^>]*aria-label="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(chips, ['Colección', 'Elige un tema de lectura'], 'primero la elección de colección; los temas son la capa de consulta de abajo');
  const at = k => libros.indexOf(k);
  assert.ok(at('id="books-title"') < at('data-rail-chips') && at('data-rail-chips') < at('data-rail-viewport') && at('data-rail-viewport') < at('id="ask-title"'), 'orden: titular, chips, carrusel, consulta');
  assert.ok(at('id="ask-title"') < at('data-topic="narrativa"') && at('data-composer') < at('id="catalogo"'), 'temas y consulta de WhatsApp debajo del carrusel y antes de la muestra');
  assert.ok(/<h3 id="rail-title" class="sr-only">/.test(libros), 'el carrusel conserva su nombre accesible sin segundo titular visible');
  assert.ok(/\.books-head \{[^}]*justify-items: start[^}]*text-align: left/.test(css) && !/\.books-head \{[^}]*text-align: right/.test(css), 'titulares alineados a la izquierda en escritorio y móvil');
  assert.ok(/data-ex-open/.test(libros) && /data-open-mylist/.test(html) && /href="#catalogo"/.test(libros), 'siguen las rutas a Explorar y a Mi lista');
});

test('cierre de Libros: una frase y «Cómo llegar» en el mismo bloque, sin vacío tras el buscador ni rellenos con vh', () => {
  const foot = html.match(/<div class="books-foot">[\s\S]*?<\/div>/)[0];
  assert.ok(/<p>[^<]+<\/p>/.test(foot) && (foot.match(/btn--tungsten/g) || []).length === 1, 'frase + una sola primaria');
  assert.ok(/\.cat \{ padding-bottom: var\(--sec-sm\); \}/.test(mobileCss), 'tras el buscador un solo escalón de ritmo');
  for (const rule of ['.books-head', '.cat-head', '.composer', '.bill-head']) {
    const m = css.match(new RegExp(`${rule.replace('.', '\.')} \{[^}]*\}`));
    assert.ok(m && !/vh/.test(m[0]), `${rule} sin clamp(vh)`);
  }
});

test('largo móvil: los capítulos, la cita y el pie usan --sec-sm (96 px entre bloques); Cartelera junta «Me interesa» y «Compartir»', () => {
  assert.ok(/\.quote \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss) && /\.ftr \{ padding-top: var\(--sec-sm\); \}/.test(mobileCss));
  assert.ok(/\.manifesto, \.bill \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss) && /\.books \{ padding-top: var\(--sec-sm\); \}/.test(mobileCss) && /\.visit \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'CR-14: entre dos capítulos la suma de rellenos no pasa de 96 px');
  assert.ok(/\.house-pin \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'la tira de La casa no pone el relleno por la altura de la pantalla');
  assert.ok(/\.bill-acts \.act \{ flex: 1 1 auto/.test(mobileCss));
});

test('titulares móviles (CR-14): un escalón por nivel, de la escala de tokens, y sin marquesina ni dirección repetida', async () => {
  const appSrc = await readFile(here('./app.js'), 'utf8');
  assert.ok(/\.h2, \.house-head \.h2, \.bill-head \.h2 \{ font-size: var\(--fs-7\); \}/.test(mobileCss), 'los cuatro capítulos comparten --fs-7');
  assert.ok(/\.call-title \{ font-size: var\(--fs-6\); \}/.test(mobileCss), 'el llamado usa --fs-6, como las capas internas');
  assert.ok(/\.layer-title \{[^}]*clamp\(2\.25rem, 3\.4vw, 3\.5rem\)/.test(css.replaceAll('\n', ' ')), 'la capa interna llega a 36 px (= --fs-6) en móvil');
  assert.ok(/--fs-7: 3rem;/.test(tokensCss) && /--fs-6: 2\.25rem;/.test(tokensCss));
  assert.ok(/\.marquee \{ display: none; \}/.test(mobileCss) && /\.visit \.h2 em \{ display: none; \}/.test(mobileCss), 'la dirección «Matamoros 421» no se repite en móvil (marquesina y subtítulo de Visita)');
  assert.ok(/\.visit \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'Visita cierra con 48 px en móvil (48 + 48 del pie = 96, el tope)');
  assert.ok(/@media \(min-width: 1600px\) \{ \.visit \{ grid-template-columns: minmax\(0, 1fr\) 560px; \} \}/.test(css), 'desde 1600 px la columna del horario y la foto de Visita se fija en 560 px');
  assert.ok(/shown = rows\.some\(r => r\.row\.offsetWidth > 0\)/.test(appSrc) && /if \(!shown\) return false;/.test(appSrc), 'la marquesina oculta no se anima');
  assert.ok(/\.call-body \{ padding: 0 var\(--gutter\); \}/.test(mobileCss) && /\.call \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'el llamado sin aire muerto: --sec-sm y sin clamp(vh)');
});

test('cierre móvil (CR-10): dirección con «Cómo llegar» de texto, redes y correo en una fila, «Pausar el movimiento» discreto', () => {
  const ftr = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
  assert.ok(/class="ftr-id"[\s\S]*Mariano Matamoros Pte\. 421[\s\S]*<a class="ftr-route" href="https:\/\/www\.google\.com\/maps\/dir[^"]*"[^>]*><span>Cómo llegar<\/span>/.test(ftr), 'la dirección y «Cómo llegar» juntos');
  assert.ok(!/class="(?:[^"]* )?btn[ "]/.test(ftr), 'el pie no tiene botones (la primaria vive en cada capítulo)');
  const links = ftr.match(/<ul class="ftr-links">[\s\S]*?<\/ul>/)[0];
  assert.deepEqual([...links.matchAll(/<span>([^<]+)<\/span>/g)].map(m => m[1]), ['Instagram', 'Facebook', 'WhatsApp', 'Correo'], 'redes y correo en la misma lista');
  assert.ok(/\.ftr-links \{ flex-wrap: nowrap; justify-content: space-between;/.test(mobileCss), 'una sola fila: el correo no queda huérfano');
  assert.ok(/\.ftr-links a \{[^}]*min-height: var\(--target-coarse\)/.test(mobileCss) && /\.motion-btn \{[^}]*min-height: var\(--target-coarse\)/.test(mobileCss) && /\.ftr-route \{[^}]*min-height: var\(--target-coarse\)/.test(css), 'objetivos de 44 px');
  const mb = mobileCss.match(/\.motion-btn \{[^}]*\}/)[0];
  assert.ok(/border: 0/.test(mb) && /text-decoration: underline/.test(mb) && !/background:|border-radius: 999/.test(mb), '«Pausar el movimiento» es un enlace de texto, no un botón de contorno');
  assert.ok(/data-motion-toggle aria-pressed="false">Pausar el movimiento</.test(ftr), 'conserva su función y su copy');
});

test('avatar del perfil (CR-12): el logotipo cuadrado se ve entero (cuadrado redondeado, no círculo)', () => {
  for (const sel of ['profile-av']) {
    const rule = mobileCss.match(new RegExp(`\\.${sel} \\{[^}]*\\}`))[0];
    assert.ok(/border-radius: var\(--radius-3\)/.test(rule) && !/50%/.test(rule), `.${sel}: sin recorte circular`);
  }
  assert.ok(JSON.stringify(prov).includes('img/logo-96.webp'), 'el logo es un asset local con procedencia');
});

test('plantilla: sin sellos de muestra ni rótulos de procedencia a la vista; la nota de la colección sigue aparte', async () => {
  const rail = html.match(/<div class="rail" data-rail[\s\S]*?data-rail-live><\/p>\s*<\/div>/)[0];
  assert.ok(/<p class="rail-note" data-rail-note><\/p>/.test(rail), 'la nota nace vacía (la llena la colección)');
  const railJs = await readFile(here('./rail.js'), 'utf8');
  assert.ok(/noteEl\.textContent = col\.nota/.test(railJs), 'al cambiar de colección solo se reescribe la nota');
  assert.ok(!/noteEl\.hidden/.test(railJs), 'la nota no se oculta');
  const cols = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  assert.ok(cols.collections.length >= 2 && cols.collections.every(c => c.nota && !/inventario|muestra/i.test(c.nota)), 'las notas de colección no hablan de inventario ni de muestra');
  const names = ['index.html', 'app.js', 'feed.js', 'rail.js', 'catalog.js', 'saved.js', 'news.js', 'tag.js'];
  const files = await Promise.all(names.map(f => readFile(here(`./${f}`), 'utf8')));
  for (const [i, src] of files.entries()) assert.ok(!/Datos de muestra|Registro de muestra|no es inventario|Recreación IA|Foto real|Imagen ilustrativa|Hecho con IA/i.test(src), `aviso de maqueta en ${names[i]}`);
  assert.ok(!/rail-seal|cat-seal|ex-seal|drawer-seal|drawer-tag|hl-kind|entry-credit|tag--ai|tag--real/.test(html + css + mobileCss), 'sin sellos ni rótulos en el marcado ni en los estilos');
  assert.ok(!/\bmuestra\b/i.test(html.replace(/<!--[\s\S]*?-->/g, '')), 'el texto visible habla del catálogo, no de una muestra');
  assert.ok(/\.rail-info \[data-rail-note\] \{ min-height: 1lh; \}/.test(css), 'la línea de la nota se reserva: el carrusel no salta al pintar');
});

test('géneros: todo género de la muestra tiene etiqueta en español y uno sin traducción cae al valor original', async () => {
  const ids = new Set(data.books.map(b => b.g));
  assert.ok(ids.size >= 40, 'la muestra trae decenas de géneros');
  for (const id of ids) {
    const original = data.subgenres[id]?.n;
    assert.ok(original, `${id}: el dato trae su nombre original`);
    assert.ok(Object.hasOwn(GENRE_ES, id), `${id}: sin etiqueta en español`);
    const label = genreLabel(id, original);
    assert.notEqual(label, original, `${id}: sigue en inglés (${original})`);
    assert.ok(!/\b(Science Fiction|Middle Grade|Self-Help|Fiction|Thriller|Memoir|History)\b/.test(label), `${id}: etiqueta con inglés: ${label}`);
  }
  assert.equal(genreLabel('fiction-science-fiction', 'Science Fiction'), 'Ciencia ficción');
  assert.equal(genreLabel('fiction-middle-grade', 'Middle Grade'), 'Para preadolescentes');
  assert.equal(genreLabel('non-fiction-self-help', 'Self-Help'), 'Superación personal');
  assert.equal(genreLabel('nuevo-genero', 'New Genre'), 'New Genre', 'sin traducción: el nombre original');
  assert.equal(genreLabel('nuevo-genero'), 'nuevo-genero', 'sin traducción ni nombre: el id');
  assert.equal(genreLabel('toString', 'Original'), 'Original', 'un id como propiedad heredada no rompe');
  assert.ok(Object.keys(GENRE_ES).every(id => data.subgenres[id]), 'el diccionario no trae ids que la muestra no tiene');
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/g: id => genreLabel\(id, data\.subgenres\[id\]\?\.n\)/.test(catalog), 'barra Género, chips y ficha comparten la misma etiqueta');
});

test('Libros: una sola taxonomía a la vista (mismo estado activo, tema ligado a colección) y «Filtros» sin el total de la muestra', async () => {
  assert.ok(/\.topic\[aria-checked="true"\], \.topic\[aria-checked="true"\]:focus-visible \{[^}]*color: var\(--white\); background: var\(--terra\)/.test(mobileCss), 'el tema activo usa la cápsula turquesa (--terra) con texto blanco');
  assert.ok(/\.rail-chip\[aria-checked="true"\] \{[^}]*color: var\(--white\); background: var\(--terra\)/.test(mobileCss), 'el chip de colección activo usa la misma cápsula');
  assert.ok(!/\.topic\[aria-checked="true"\][^{]*\{[^}]*background: var\(--(tungsten|terra-deep)\)/.test(mobileCss), 'el turquesa profundo relleno (--terra-deep) queda para «Cómo llegar»');
  const cols = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  const temas = cols.collections.map(c => c.tema).filter(Boolean);
  assert.ok(temas.length >= 2 && temas.every(t => Object.hasOwn(TOPICS, t) && t !== 'libre'), 'cada `tema` de colección es un tema de consulta real');
  const app = await readFile(here('./app.js'), 'utf8');
  const railJs = await readFile(here('./rail.js'), 'utf8');
  assert.ok(/new CustomEvent\('iti:topic'/.test(app) && /addEventListener\('iti:topic'/.test(railJs), 'elegir un tema marca la colección equivalente');
  assert.ok(/const col = cols\.find\(c => c\.tema === tema\)/.test(railJs) && /show\(col\.id, false\)/.test(railJs), 'sin colección equivalente no se toca el carrusel');
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/data-cat-filters-count\]', root\)\.textContent = n \? String\(n\) : ''/.test(catalog) && !/filters-count[^\n]*results\.length/.test(catalog), 'el botón no muestra el total de la muestra');
  assert.ok(/Filtros <span data-cat-filters-count><\/span>/.test(html), 'sin filtros activos el botón dice «Filtros» a secas');
});

test('perfil móvil: el nombre de la librería tiene escala display (28 px), mayor que el párrafo, sin color ni efecto nuevo', () => {
  const fs5 = Number(tokensCss.match(/--fs-5: ([\d.]+)rem/)[1]) * 16;
  const rule = mobileCss.match(/\.entry-title \{[^}]*\}/)[0];
  assert.ok(/font: \d+ var\(--fs-5\)\/[\d.]+ var\(--f-sans\)/.test(rule) && fs5 >= 28, 'el nombre usa el escalón de 28 px');
  assert.ok(/text-transform: uppercase/.test(rule) && /font-stretch: \d+%/.test(rule), 'mayúsculas en condensada, como los titulares de hoja');
  assert.ok(!/color:|text-shadow|filter|animation|background/.test(rule), 'sin color ni efecto nuevo');
  const lede = Number(css.match(/\.entry-lede \{[^}]*font: \d+ clamp\([^,]+, [^,]+, ([\d.]+)rem\)/)[1]) * 16;
  assert.ok(fs5 > lede, `el nombre (${fs5} px) es mayor que el párrafo (hasta ${lede} px)`);
});

test('arranque (R01): tramos cortos, hora de Monterrey en reposo y medidas de descendientes solo con la sección a la vista', async () => {
  const appSrc = await readFile(here('./app.js'), 'utf8');
  // content-visibility: auto (móvil) se salta el subárbol de las secciones fuera de pantalla; pedir su geometría al arrancar lo maqueta.
  for (const scene of ['manifestoScene', 'houseScene', 'marqueeScene']) {
    const body = appSrc.slice(appSrc.indexOf(`function ${scene}()`));
    const src = body.slice(0, body.indexOf('\n  }\n'));
    assert.ok(/inner = false|inner = pinned/.test(src) && /measureInner\(\)|measureLoose\(\)/.test(src), `${scene}: el descendiente se mide con la sección a la vista`);
  }
  assert.ok(/async function boot\(\)/.test(appSrc) && (appSrc.match(/await yieldNow\(\)/g) || []).length >= 8, 'boot() cede el hilo entre secciones');
  assert.ok(/requestIdleCallback \|\| \(cb => setTimeout\(cb, 300\)\)\)\(updateStatus/.test(appSrc), 'la hora de Monterrey (Intl) no corre en la tarea de arranque');
  assert.ok(!/fitOnly/.test(appSrc), 'el nombre se ajusta una sola vez al arrancar (entry.measure ya lo hace)');
});
