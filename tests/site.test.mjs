// Comprobaciones del sitio (modelo B.4 «Función de la casa», en la raíz del repo): node --test tests/site.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync } from 'node:fs';
import { readFile, access, readdir } from 'node:fs/promises';
import { pickBooks, stopIcon, STOP_ICON, trailProgress, readTrail, writeTrail, TRAIL_KEY } from '../rail.js';
import { toggleSaved, isSaved, savedIds, clearSaved, listMessage, listWaUrl, MAX_SAVED } from '../saved.js';
import { buildMessage, ctaText, waUrl, openingStatus, monterreyNow, TOPICS } from '../app.js';
import { newsPlan, newsEntries, isNew, validDay, statusLine, hintLine, NEWS_SIZE, NEW_DAYS } from '../news.js';
import { readInterest, shareName, initFeed, eventBadge, NO_DATE } from '../feed.js';
import { KINDS, validKind } from '../tag.js';
import { PAGE_SIZE, TONES, GENRE_ES, genreLabel, coverTone, coverTones, coverLayout, COVER_LAYOUTS, score, filterBooks, sortBooks, facetCounts, facetView, FACET_LIMIT, suggest, relatedBooks, bookMessage, bookWaUrl, norm } from '../catalog.js';

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
  assert.equal([...html.matchAll(/<a href="#[a-z]+" data-hint="[^"]+"(?: data-news-link)?><span>/g)].length, 4, 'los cuatro capítulos de la cabecera traen pista');
  assert.equal([...html.matchAll(/class="card-item card--sk"/g)].length, PAGE_SIZE, 'un esqueleto por tarjeta de la primera página');
  assert.ok(/--card-h: 150cqw;/.test(css) && /:is\(\.rail-item, \.card-item\) > \.card \{ min-height: var\(--card-h\)/.test(css), 'tarjeta y esqueleto comparten una sola regla de alto');
  assert.ok(!/class="sk-line/.test(/data-rail-track[\s\S]*?<\/ul>/.exec(html)[0]) && !/class="card-item card--sk"[^>]*><span class="card"><span class="cover"><\/span><span class="sk-line/.test(html), 'el esqueleto de tarjeta es solo la portada: el título y el autor van dentro de ella');
  assert.ok(/data-rail-chips>(<span class="sk-chip" aria-hidden="true"><\/span>){3,}<\/div>/.test(html), 'el esqueleto del carrusel reserva la fila de paradas');
  assert.ok(/\.rail-stop, \.sk-chip \{ flex: 0 0 var\(--stop\); height: calc\(var\(--stop\) \+ var\(--lip\) \+ var\(--space-2\) \+ var\(--name-h\)\); \}/.test(css) && !/(^|\n)\.sk-chip \{[^}]*(width|height):/.test(css + mobileCss), 'el esqueleto de la parada y la parada real comparten una sola regla de caja: no hay salto al pintar');
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
  assert.ok(/data-hint="6 temas"><span>Catálogo<\/span>/.test(html), 'la pista de Catálogo es corta («6 temas»), como la de los demás capítulos');
  assert.ok(/data-hint="Lo último" data-news-link><span>Novedades<\/span>/.test(html), 'la pista de Novedades no lleva cifra: el conteo depende de cada persona');
});

test('filetes: horario como filas técnicas, sin cruces de registro (CR0-06), botones con canto (sin barrido ni doble filete) y cita atribuida', () => {
  assert.ok(/--hair: 0\.5px/.test(tokensCss) && /min-resolution: 2dppx/.test(tokensCss), 'filete de 0.5 px en pantallas densas');
  assert.ok(/class="visit-side" data-rules/.test(html), 'la columna del horario entra con data-rules y sin cruces de registro (CR0-06)');
  assert.ok(!/\.rx::(before|after)/.test(css) && !/class="[^"]*\brx\b/.test(html), 'ninguna cruz de registro: el «+» es solo «abrir» y «cerrar»');
  // Sistema táctil: la respuesta del botón es el canto que se cierra al presionar; ya no hay barrido de relleno, doble filete ni vibración de celuloide.
  assert.ok(!/\.btn[\w-]*::before/.test(css + mobileCss) && !/--sweep/.test(css + mobileCss) && !/@keyframes celluloid/.test(css), 'sin barrido de color ni filetes animados en los botones');
  assert.ok(/:active:not\(:disabled\) \{ translate: 0 var\(--lip\); --ctl-lip: 0px; \}/.test(css), 'al presionar, el control baja lo que mide el canto y el canto se cierra');
  assert.ok(/\.hours \{[^}]*border: var\(--edge-w\) solid var\(--edge-soft\); border-radius: var\(--radius-card\)/.test(css) && /\.hours th, \.hours td \{\s*border-bottom: 0;\s*background: linear-gradient\(var\(--edge-soft\), var\(--edge-soft\)\) left bottom \/ 100% var\(--edge-w\) no-repeat;/.test(css), 'el horario es una tarjeta y su filete se dibuja fila por fila');
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

test('móvil: barra inferior acoplada con cinco casillas con nombre, iconos en el sprite y hoja de estilos solo móvil', () => {
  const nav = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  const hrefs = [...nav.matchAll(/href="#([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(hrefs, ['inicio', 'libros', 'cartelera', 'novedades'], 'las casillas siguen el orden de la página; los id no cambian');
  const names = [...nav.matchAll(/<span class="tab-lb">([^<]+)/g)].map(m => m[1]);
  assert.deepEqual(names, ['Inicio', 'Catálogo', 'Eventos', 'Novedades', 'Más'], 'cinco casillas con nombre');
  for (const m of nav.matchAll(/<use href="#(t-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta el icono ${m[1]}`);
  assert.equal(new Set([...nav.matchAll(/<use href="#(t-[a-z]+)"/g)].map(m => m[1])).size, 5, 'cada casilla tiene su propio icono');
  assert.ok(/<symbol id="t-novedades" viewBox="0 0 24 24">/.test(html), 'Novedades tiene icono propio en el sprite, en la misma caja de 24 px');
  assert.ok(/<link rel="stylesheet" href="mobile\.css" media="\(max-width: 760px\)">/.test(html));
  assert.ok(/aria-label="Secciones"/.test(nav) && !/role="tablist"/.test(nav), 'navegación por anclas, no tablist');
  assert.deepEqual([...nav.matchAll(/<a href="#([a-z]+)" aria-current="location"/g)].map(m => m[1]), ['inicio'], 'la página carga en Inicio: su casilla nace marcada y el scroll-spy la corrige');
  // Acoplada al borde inferior, de lado a lado, blanca, borde superior de 2 px, sin sombra ni desenfoque (no flota).
  const flat = mobileCss.replace(/\/\*[\s\S]*?\*\//g, '').replaceAll('\n', ' ');
  const bar = flat.match(/(?:^|\})\s*(\.tabbar \{[^}]*\})/)[1];
  assert.ok(/position: fixed;[^}]*inset: auto 0 0 0;/.test(bar) && /height: calc\(var\(--tabbar-h\) \+ env\(safe-area-inset-bottom\)\);/.test(bar) && /padding: 0 var\(--space-1\) env\(safe-area-inset-bottom\);/.test(bar), 'acoplada: de lado a lado, alto --tabbar-h más el área segura');
  assert.ok(/background: var\(--glass-solid\); border-top: var\(--edge-w\) solid var\(--edge-soft\);/.test(bar) && !/border-radius|box-shadow|width: fit-content|margin-inline: auto/.test(bar), 'blanca con borde superior de 2 px --edge-soft; ya no es una píldora flotante');
  assert.ok(!/\.tabbar[^{}]*\{[^}]*backdrop-filter: blur/.test(flat), 'la barra inferior es opaca y no lleva desenfoque: sobre un fondo opaco sería adorno sin efecto');
  assert.ok(/display: grid; grid-auto-flow: column; grid-auto-columns: minmax\(0, 1fr\);/.test(bar), 'casillas iguales, sean cinco o cuatro (sin novedades)');
  const label = flat.match(/\.tab-lb \{[^}]*\}/)[0];
  assert.ok(!/clip|1px|overflow: hidden|position: absolute/.test(label) && /font: 800 min\(var\(--fs-0\), 3\.2vw\)\/1\.1 var\(--f-display\)/.test(label), 'el nombre de cada casilla se ve siempre (12 px; a 320 px baja con el ancho para caber)');
  assert.ok(/\.tabbar a, \.tab-menu \{[^}]*min-width: 0; height: 100%;/.test(flat), 'el objetivo táctil es la casilla entera: un quinto del ancho por todo el alto de la barra (≥ 48 px)');
  // Novedades: casilla que no existe sin entradas, con punto (oculto) y su texto para lectores.
  assert.ok(/<a href="#novedades" data-news-link><span class="tab-ic"><svg aria-hidden="true"><use href="#t-novedades"\/><\/svg><span class="tab-dot" data-news-dot hidden><\/span><\/span><span class="tab-lb">Novedades<span class="sr-only" data-news-sr><\/span><\/span><\/a>/.test(nav), 'casilla de Novedades: punto oculto de salida y texto «, N sin ver» para lectores de pantalla (el aviso no es solo color)');
  assert.ok(/\.tab-dot \{[^}]*background: var\(--terra-deep\); box-shadow: 0 0 0 var\(--edge-w\) var\(--glass-solid\); \}/.test(flat) && /\.tab-badge\[hidden\], \.tab-dot\[hidden\] \{ display: none; \}/.test(flat), 'punto --terra-deep con filete blanco');
  assert.ok(/\.motion \.tab-dot \{ animation: pick-pop var\(--dur-fast\) var\(--spring\); \}/.test(flat), 'el punto aparece con el rebote corto solo con movimiento (la clase motion no existe con «reducir movimiento»)');
  assert.ok(!/backdrop-filter:[^;]*\n?[^;]*\.entry-canvas/.test(mobileCss));
});

test('móvil: hoja «Más» con lo que la barra no tiene, filas táctiles y destinos reales', async () => {
  const dlg = html.match(/<dialog class="sheet-menu"[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<nav class="tabbar"[\s\S]*?<button class="tab-menu" type="button" data-menu-open aria-expanded="false" aria-controls="sheet-menu"><span class="tab-ic"><svg aria-hidden="true"><use href="#t-menu"\/><\/svg><span class="tab-badge" data-saved-dot hidden aria-hidden="true"><\/span><\/span><span class="tab-lb">Más<\/span><\/button>\s*<\/nav>/.test(html) && !/hdr-more/.test(html + css + mobileCss), '«Más» es la quinta casilla de la barra (con nombre, aria-expanded y aria-controls) y lleva el conteo de Mi lista; no hay hamburguesa en la cabecera');
  assert.ok(/aria-labelledby="sheet-menu-title"/.test(dlg) && /<h2 class="sm-title" id="sheet-menu-title">Más<\/h2>/.test(dlg) && /data-sm-close/.test(dlg), 'diálogo titulado «Más» con botón de cierre');
  const order = [...dlg.matchAll(/<(?:a|button) class="sm-row"[^>]*>[\s\S]*?<span class="sm-lb">([^<]+)/g)].map(m => m[1]);
  assert.deepEqual(order, ['Mi lista', 'Buscar en el catálogo', 'La casa', 'Visita'], 'solo lo que la barra no tiene: Mi lista, el buscador, La casa y Visita');
  for (const id of ['inicio', 'libros', 'cartelera', 'novedades']) assert.ok(!dlg.includes(`href="#${id}"`), `#${id} ya está en la barra: no se repite en la hoja`);
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(!/aria-expanded|sm-group|sm-sub|sm-caret|data-topic-go|data-bill-go/.test(dlg) && !/sm-group|setGroup|topicGo|billGo/.test(app) && !/\.sm-sub|\.sm-caret|\.sm-group/.test(mobileCss), 'sin acordeones ni atajos a temas o propuestas: cada fila lleva a su destino');
  const foot = dlg.match(/<div class="sm-foot">[\s\S]*?<\/div>/)[0];
  assert.equal((foot.match(/btn--tungsten/g) || []).length, 1, 'una sola acción primaria en la hoja');
  assert.ok(/class="btn btn--tungsten"[^>]*google\.com\/maps[^>]*>\s*<span>Cómo llegar/.test(foot) && /class="btn btn--ghost sm-wa"[^>]*wa\.me[^>]*aria-label="Escribir por WhatsApp"/.test(foot) && !/sm-social/.test(foot) && /\.sm-foot \{ display: grid; grid-template-columns: minmax\(0, 1fr\) 48px;/.test(mobileCss), '«Cómo llegar» es el primario y WhatsApp el secundario (botón de icono con nombre accesible); el pie es una sola fila y las redes van al final de la lista');
  assert.ok(/<div class="sm-card">\s*<a class="sm-row" href="#visita">[\s\S]*?<p class="sm-status" data-status>[\s\S]*?data-status-long[\s\S]*?<dl class="sm-hours"><dt>Lunes a sábado<\/dt><dd>11:00–20:00<\/dd><dt>Domingo<\/dt><dd>Cerrado<\/dd><\/dl>/.test(dlg), 'Visita: tarjeta con la fila que lleva a la sección y, a la vista, el estado de hoy y el horario');
  assert.ok(/<a class="sm-row" href="#visita">[\s\S]*?<small class="sm-meta">Matamoros 421, Centro<\/small>/.test(dlg), 'la fila de Visita lleva la dirección');
  assert.ok(/\.sm-card \{[^}]*border: var\(--edge-w\) solid var\(--edge-soft\); border-radius: var\(--radius-card\); \}/.test(mobileCss), 'el grupo de Visita es una tarjeta (radio de tarjeta, borde suave)');
  assert.equal((dlg.match(/Cómo llegar/g) || []).length, 1, '«Cómo llegar» aparece una sola vez en la hoja (el botón primario del pie)');
  const social = dlg.match(/<ul class="sm-social" aria-label="Redes">[\s\S]*?<\/ul>/)[0];
  assert.deepEqual([...social.matchAll(/<a class="sm-link" href="https:\/\/www\.(instagram|facebook)\.com[^"]*" target="_blank" rel="noopener noreferrer">/g)].map(m => m[1]), ['instagram', 'facebook'], 'redes como dos chips (el control en compacto), enlaces externos seguros');
  for (const m of dlg.matchAll(/href="#([a-z]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), `destino #${m[1]} inexistente`);
  for (const m of dlg.matchAll(/<use href="#([it]-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta el icono ${m[1]}`);
  assert.ok(/\.sm-row \{[^}]*min-height: 56px/.test(mobileCss) && /\.sm-link \{[^}]*min-height: var\(--target-coarse\)/.test(mobileCss), 'filas de 56 px (control táctil) y chips de 44 px');
});

test('cartelera móvil: cada tarjeta lleva su foto (el pie de antes es su alt), la procedencia registrada, y los puntos coinciden', () => {
  const items = [...html.matchAll(/<details class="bill-item"[\s\S]*?<\/details>/g)].map(m => m[0]);
  assert.equal(items.length, 3);
  for (const it of items) {
    assert.match(it, /class="bill-card-fig"/);
    const caption = it.match(/data-caption="([^"]+)"/)[1];
    assert.ok(it.includes(`<img class="bill-card-img" src="assets/img/`) && it.includes(` alt="${caption}" `), 'la foto de la tarjeta se describe con el pie del escenario (sin rótulo de procedencia)');
    assert.ok(!/bill-card-cap/.test(it), 'el pie ya no es una tercera insignia sobre la foto');
    assert.match(it, /^<details class="bill-item"[^>]*data-kind="(real|ai)"/, 'la procedencia viaja como dato');
  }
  assert.equal([...html.matchAll(/<div class="bill-dots"[^>]*>([\s\S]*?)<\/div>/g)][0][1].match(/<i>/g).length, items.length);
});

test('tonos claros: las secciones de lectura usan blanco y bruma y el pie el tono profundo, con contraste suficiente', async () => {
  // CR1-05: la cita y el llamado comparten el blanco (light) en móvil y escritorio. Con el orden nuevo (La casa → Catálogo → Eventos → Novedades) el Catálogo va en blanco
  // entre la bruma de La casa y el turquesa de Eventos, y Novedades en bruma entre el turquesa y el blanco del cierre.
  const expected = { 'id="inicio"': 'light', 'class="manifesto"': 'light', 'id="casa"': 'mist', 'id="libros"': 'light', 'id="catalogo"': 'light', 'id="novedades"': 'mist', 'class="quote"': 'light', 'class="call"': 'light' };
  for (const [sel, tone] of Object.entries(expected)) {
    const tag = html.match(new RegExp(`<(?:section|div|figure)[^>]*${sel}[^>]*>`))[0];
    assert.ok(tag.includes(`data-tone="${tone}"`) && (sel === 'id="catalogo"' || sel === 'class="quote"' || /data-theme="paper"/.test(tag)), `${sel} sin tono ${tone}`);
  }
  assert.ok(/<footer class="ftr" data-tone="deep">/.test(html));
  assert.ok(!/\.quote \{[^}]*border-top/.test(css), 'sin filete solitario antes de la cita: la separa el cambio de tono (bruma de Novedades → blanco)');
  assert.ok(/\.cat \{[^}]*border-top: var\(--edge-w\) solid var\(--edge-soft\);/.test(css), 'dentro del Catálogo (blanco sobre blanco) la capa de exploración se separa con su filete');
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
  assert.ok(!/at-top/.test(mobileCss) && /\.entry-copy \{[^}]*padding-bottom: calc\(env\(safe-area-inset-bottom\) \+ var\(--tabbar-h\) \+ var\(--space-5\)\)/.test(mobileCss.replaceAll('\n', ' ')), 'la barra inferior está desde la primera vista y el perfil le reserva su sitio: lo último del perfil queda 24 px por encima');
  assert.ok(/\.tabbar \{[^}]*transition: translate var\(--dur-base\) var\(--ease-out\), visibility var\(--dur-base\);/.test(mobileCss.replaceAll('\n', ' ')) && /html\.sheet-open \.tabbar \{ translate: 0 100%; \}/.test(mobileCss), 'la barra sale hacia abajo, animada, cuando una hoja ocupa la pantalla');
  assert.ok(!/\.tabbar a\[aria-current="location"\][^{}]*\{[^}]*(width|height|padding|margin|font)[^-]/.test(mobileCss.replace(/\/\*[\s\S]*?\*\//g, '').replaceAll('\n', ' ')), 'la casilla activa no cambia de tamaño ni mueve nada: solo color, relleno y borde interior');
  assert.ok(/html:not\(\.js\) \.tabbar \{ display: none; \}/.test(mobileCss), 'sin JavaScript la barra inferior no tapa los destacados: la cabecera ya trae los cuatro enlaces');
  assert.ok(/\.hdr-brand, \.bill-foot a \{ min-height: 44px; \}/.test(mobileCss) && /\(min-width: 360px\) \{ \.hdr-brand span \{ white-space: nowrap; \} \}/.test(mobileCss), 'marca de la cabecera y enlace del pie de Cartelera de 44 px en móvil; nombre en un renglón desde 360 px');
  assert.ok(!/at-top/.test(await readFile(new URL('../assets/js/boot.js', import.meta.url), 'utf8')) && !/at-top/.test(await readFile(new URL('../app.js', import.meta.url), 'utf8')), 'ya no existe el estado at-top: la barra no se esconde en la primera vista');
  // R01: bajo el perfil nada se maqueta hasta acercarse; cada sección lleva la altura de su contenido para que el largo y las anclas no se muevan.
  for (const sel of ['manifesto', 'house', 'bill', 'books', 'news', 'quote', 'call', 'visit', 'ftr']) {
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
  const ids = block => [...block.matchAll(/href="#([a-z]+)"/g)].map(m => m[1]);
  const labels = block => [...block.matchAll(/<span(?: class="tab-lb")?>([^<]+)<\/?span/g)].map(m => m[1]);
  const desktopNav = html.match(/<nav class="hdr-nav"[\s\S]*?<\/nav>/)[0];
  const compactMenu = html.match(/<div class="menu" id="menu"[\s\S]*?<\/nav>/)[0];
  const tabbar = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  for (const [name, block] of [['cabecera', desktopNav], ['menú compacto', compactMenu]]) {
    assert.deepEqual(ids(block), ['libros', 'cartelera', 'novedades', 'visita'], `${name}: los capítulos en el orden de la página`);
    assert.deepEqual(labels(block), ['Catálogo', 'Eventos', 'Novedades', 'Visita'], `${name}: los mismos nombres visibles`);
    assert.ok(/<a href="#novedades"[^>]*data-news-link/.test(block), `${name}: el enlace a Novedades desaparece sin entradas`);
  }
  assert.deepEqual(ids(tabbar), ['inicio', 'libros', 'cartelera', 'novedades'], 'barra inferior: mismos capítulos y orden; Visita vive en «Más»');
  assert.deepEqual(labels(tabbar).slice(1, 4), ['Catálogo', 'Eventos', 'Novedades'], 'barra inferior: los mismos nombres');
  assert.ok(/<h2 id="books-title" class="h2">Catálogo /.test(libros) && /<h2 id="bill-title" class="h2">Eventos <em>y talleres<\/em><\/h2>/.test(html) && /<h2 id="news-title" class="h2">Novedades<\/h2>/.test(html), 'los titulares de capítulo dicen el nombre con el que se llega a ellos');
  assert.ok(/<a class="sm-row" href="#catalogo">[\s\S]*?<span class="sm-lb">Buscar en el catálogo/.test(html) && !/class="sm-link" href="#catalogo"/.test(html), 'el menú lateral llega al catálogo con una fila propia (no escondida dentro de Libros)');
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

// ---------- Recorrido, eventos y filtros (sistema táctil) ----------
test('recorrido: las colecciones son paradas de un radiogroup, cada una con su icono (con respaldo) y su nombre', async () => {
  const railJs = await readFile(here('./rail.js'), 'utf8');
  const cols = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8')).collections;
  const symbols = new Set([...html.matchAll(/<symbol id="([a-z0-9-]+)"/g)].map(m => m[1]));
  assert.ok(/<div class="rail-chips" role="radiogroup" aria-label="Colección" data-rail-chips>/.test(html), 'la fila sigue siendo un radiogroup con nombre');
  assert.ok(/btn\.setAttribute\('role', 'radio'\)/.test(railJs) && /btn\.setAttribute\('aria-checked', 'false'\)/.test(railJs) && /wrap\.setAttribute\('role', 'presentation'\)/.test(railJs), 'cada parada es un botón role="radio" con aria-checked; su envoltura no entra al árbol de accesibilidad');
  assert.ok(/make\('span', 'rail-chip-name', col\.titulo\)/.test(railJs), 'el nombre de la colección va dentro del botón: es su nombre accesible');
  assert.ok(/\{ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 \}\[e\.key\]/.test(railJs) && /c\.tabIndex = c === e\.target \? 0 : -1/.test(railJs) && /c\.tabIndex = i \? -1 : 0/.test(railJs), 'flechas y un solo punto de tabulación (roving tabindex)');
  // Icono propio por colección, del sprite; sin `icono` (o con uno que no existe) cae al genérico.
  for (const c of cols) {
    assert.ok(typeof c.icono === 'string' && symbols.has(c.icono), `${c.id}: su icono (${c.icono}) está en el sprite`);
    assert.equal(stopIcon(c, id => symbols.has(id)), c.icono);
  }
  assert.equal(new Set(cols.map(c => c.icono)).size, cols.length, 'un icono distinto por colección');
  assert.ok(symbols.has(STOP_ICON) && symbols.has('i-check'), 'el genérico y la marca de «hojeada» están en el sprite');
  assert.equal(stopIcon({ id: 'nueva', titulo: 'Poesía' }), STOP_ICON, 'una colección nueva sin icono sigue siendo solo un objeto en el JSON');
  assert.equal(stopIcon({ icono: 'c-no-existe' }, id => symbols.has(id)), STOP_ICON, 'un icono que no está en el sprite cae al genérico');
  for (const bad of ['', 3, null, 'c libro', '"><svg', 'C-LIBRO']) assert.equal(stopIcon({ icono: bad }), STOP_ICON, `icono inválido (${JSON.stringify(bad)})`);
  // Dibujos propios en el lenguaje del sprite: 24 px, solo trazos y rellenos sin color propio.
  for (const id of [...cols.map(c => c.icono), STOP_ICON, 'i-check']) {
    const sym = html.match(new RegExp(`<symbol id="${id}" viewBox="0 0 24 24">([\\s\\S]*?)</symbol>`));
    assert.ok(sym && !/(fill|stroke)="(?!none")[^"]*"|<image|href=|style=/.test(sym[1]), `${id}: símbolo de 24 px sin colores ni recursos propios`);
  }
  // Forma: control redondo de 64 px (la piel es la del control), nombre en la familia redonda, línea punteada con tramo --terra para lo hojeado.
  const flat = css.replaceAll('\n', ' ');
  assert.ok(/\.rail-chips \{\s*--stop: 64px;/.test(flat) && /\.rail-chip \{[^}]*width: var\(--stop\); height: var\(--stop\); padding: 0; border-radius: 50%;\s*font: 800 var\(--fs-1\)\/1\.25 var\(--f-display\);/.test(flat), 'parada redonda de 64 px con el nombre en --f-display 800');
  assert.ok(/\.rail-chip \{ font-size: var\(--fs-0\); \}/.test(mobileCss), 'en teléfono el nombre baja a --fs-0');
  assert.ok(/\.rail-chips \{[^}]*overflow-x: auto;/.test(flat) && /\.rail-chips \{ --per: 4; --pitch: clamp\(72px, calc\(\(100vw - var\(--gutter\) - var\(--stop\) \/ 2\) \/ var\(--per\)\), 128px\);/.test(mobileCss) && /@media \(max-width: 359px\) \{ \.rail-chips \{ --per: 3; \} \}/.test(mobileCss) && /@media \(min-width: 360px\) \{ \.rail-chips:has\(> :nth-child\(4\):last-child\) \{ --pitch: clamp\(72px, calc\(\(100vw - 2 \* var\(--gutter\) - var\(--stop\)\) \/ 3\), 128px\); \} \}/.test(mobileCss), 'la fila se desplaza si no caben, dejando media parada a la vista; el paso nunca baja de 72 px (8 px entre discos)');
  assert.ok(/\.rail-chips > :nth-child\(even\) \{ margin-top: var\(--zig\); \}/.test(css) && /\.rail-chips \{ --zig: var\(--space-5\); \}/.test(mobileCss), 'zigzag por nth-child (sin estilos en línea), corto en teléfono');
  assert.ok(/\.rail-stop:not\(:last-child\)::after \{[^}]*radial-gradient\(circle closest-side, var\(--edge\) 75%, transparent\)/.test(flat) && /\.rail-stop\.is-seen::after \{ background: linear-gradient\(var\(--terra\), var\(--terra\)\)/.test(flat), 'línea punteada en --edge; el tramo de una parada hojeada, en --terra');
  assert.ok(/\.rail-stop\.is-seen \.rail-chip-done \{ display: inline-grid; \}/.test(css) && /make\('span', 'badge rail-chip-done'\)/.test(railJs) && /icon\('i-check'\)/.test(railJs), 'la parada hojeada lleva la insignia con la marca de verificación');
  assert.ok(!/style\.|setProperty/.test(railJs.slice(railJs.indexOf('export function stopNode'), railJs.indexOf('// La ficha vive en el catálogo'))), 'ninguna parada lleva estilos puestos desde JS');
});

test('recorrido: progreso local y verdadero, con almacenamiento tolerante y sin puntos, rachas ni recompensas', async () => {
  const railJs = await readFile(here('./rail.js'), 'utf8');
  const ids = ['a', 'b', 'c', 'd'];
  assert.deepEqual(trailProgress(ids, []), { done: 0, total: 4, complete: false, text: '0 de 4 paradas hojeadas' });
  assert.deepEqual(trailProgress(ids, ['b']), { done: 1, total: 4, complete: false, text: '1 de 4 paradas hojeadas' });
  assert.deepEqual(trailProgress(ids, ['b', 'b', 'zz', 'a']), { done: 2, total: 4, complete: false, text: '2 de 4 paradas hojeadas' }, 'lo guardado de colecciones que ya no existen no cuenta, ni lo repetido');
  assert.deepEqual(trailProgress(ids, new Set(['d', 'c', 'b', 'a'])), { done: 4, total: 4, complete: true, text: 'Ya hojeaste las 4 colecciones.' });
  assert.deepEqual(trailProgress(['a'], ['a']), { done: 1, total: 1, complete: true, text: 'Ya hojeaste la colección.' });
  assert.equal(trailProgress(['a'], []).text, '0 de 1 parada hojeada');
  assert.equal(trailProgress([], ['a']).complete, false, 'sin colecciones no hay nada que completar');
  // Almacenamiento: sin él, bloqueado, roto o lleno, el recorrido sigue (dura la visita).
  assert.ok(/const store = \(\) => \{ try \{ return globalThis\.localStorage/.test(railJs), 'el almacenamiento va en try/catch');
  assert.deepEqual(readTrail(), [], 'sin almacenamiento');
  assert.equal(writeTrail(['a']), true, 'sin almacenamiento no lanza');
  Object.defineProperty(globalThis, 'localStorage', { get() { throw new Error('bloqueado'); }, configurable: true });
  assert.deepEqual(readTrail(), [], 'almacenamiento bloqueado');
  assert.equal(writeTrail(['a']), true, 'bloqueado al escribir: no lanza');
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => '["suspenso", 3, null, "memorias"]', setItem() { throw new Error('lleno'); } }, configurable: true });
  assert.deepEqual(readTrail(), ['suspenso', 'memorias'], 'ignora lo que no es texto');
  assert.equal(writeTrail(['a']), false, 'lleno: no lanza y avisa a quien llama');
  const mem = new Map();
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: k => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) }, configurable: true });
  writeTrail(['ciencia-ficcion', 'suspenso']);
  assert.deepEqual(JSON.parse(mem.get(TRAIL_KEY)), ['ciencia-ficcion', 'suspenso']);
  assert.deepEqual(readTrail(), ['ciencia-ficcion', 'suspenso'], 'lo guardado vuelve en la siguiente visita');
  Object.defineProperty(globalThis, 'localStorage', { value: { getItem: () => '{rota' }, configurable: true });
  assert.deepEqual(readTrail(), [], 'JSON roto');
  delete globalThis.localStorage;
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon/.test(railJs.replace(/loadSample|loadCollections/g, '')), 'el progreso no se envía a ningún lado');
  // Marcado: barra de progreso nativa con nombre, texto, salida al completar y una sola región viva.
  const rail = html.match(/<div class="rail" data-rail[\s\S]*?data-rail-live><\/p>\s*<\/div>/)[0];
  assert.ok(/<progress class="rail-trail-bar" max="4" value="0" aria-label="Paradas hojeadas" data-rail-trail-bar><\/progress>/.test(rail), 'barra de progreso nativa con nombre accesible');
  assert.ok(/<span data-rail-trail-text><\/span> <a class="rail-trail-all" href="#catalogo" data-rail-trail-all hidden>Ver todo el catálogo<\/a>/.test(rail), 'el texto del progreso y, oculta hasta completar, la salida al catálogo');
  assert.ok(rail.indexOf('data-rail-chips') < rail.indexOf('rail-trail-bar') && rail.indexOf('rail-trail-bar') < rail.indexOf('data-rail-note') && rail.indexOf('data-rail-note') < rail.indexOf('data-rail-viewport'), 'orden: paradas, progreso, nota, carrusel');
  assert.equal((rail.match(/aria-live=/g) || []).length, 1, 'una sola región viva en el carrusel');
  assert.ok(/live\.textContent = `\$\{col\.titulo\}: \$\{list\.length\} libros\. \$\{trail\.text\}/.test(railJs), 'al elegir una parada la región viva dice la colección y el progreso');
  assert.ok(/trailBar\.value = p\.done;/.test(railJs) && /trailBar\.setAttribute\('aria-valuetext', p\.text\)/.test(railJs) && /trailAll\.hidden = !p\.complete;/.test(railJs), 'la barra, su texto y la salida salen del mismo cálculo');
  // Cuándo cuenta: al elegirla y pintarse su carrusel; la que no se eligió con un toque, cuando el carrusel está a la vista (no al cargar).
  assert.ok(/if \(!id \|\| seen\.has\(id\) \|\| !\(chosen \|\| inView\)\) return false;/.test(railJs) && /markSeen\(col\.id, announce\);/.test(railJs) && /new IntersectionObserver\(entries => \{\s*inView = entries\[entries\.length - 1\]\.isIntersecting;\s*if \(markSeen\(painted\)\) paintTrail\(\);/.test(railJs), 'la parada inicial cuenta cuando el carrusel entra en pantalla');
  assert.ok(railJs.indexOf('painted = col.id;') > railJs.indexOf('track.replaceChildren(...cards.slice(0, FIRST_CHUNK));'), 'una parada elegida cuenta cuando su carrusel ya se pintó');
  // Sin altura que salte: el renglón del progreso reserva su alto y la salida del pie se oculta sin quitar su caja.
  assert.ok(/\.rail-trail \{[^}]*min-height: var\(--target-coarse\); \}/.test(css) && /\.rail-trail \{ grid-template-columns: minmax\(0, 1fr\); grid-template-rows: auto minmax\(var\(--target-coarse\), auto\); \}/.test(mobileCss) && /\.rail\.is-complete \.rail-all \{ visibility: hidden; \}/.test(css), 'completar el recorrido no mueve el carrusel');
  // Verdad: nada de mecánicas de juego ni cifras inventadas.
  const visible = [html.replace(/<!--[\s\S]*?-->/g, ''), railJs.replace(/\/\/[^\n]*/g, '')].join('\n');
  assert.ok(!/\b(puntos?|puntaje|vidas?|rachas?|retos?|niveles|nivel \d|medallas?|logros?|trofeos?|confeti|XP|recompensas?)\b/i.test(visible.replace(/punto de (encuentro|tabulación)/gi, '')), 'sin puntos, vidas, rachas, retos ni confeti');
  // Rebote solo por toque: lo pone pickPop en el manejador, nunca el pintado.
  const motionJs = await readFile(here('./motion.js'), 'utf8');
  const [feedJs, savedJs] = await Promise.all(['feed.js', 'saved.js'].map(f => readFile(here('./' + f), 'utf8')));
  assert.ok(/export function pickPop\(el\) \{\s*if \(typeof document === 'undefined' \|\| !document\.documentElement\.classList\.contains\('motion'\)\) return;\s*el\.classList\.add\('is-pop'\);\s*el\.addEventListener\('animationend', \(\) => el\.classList\.remove\('is-pop'\), \{ once: true \}\);/.test(motionJs), 'pickPop: solo con movimiento, y la clase se retira al terminar');
  assert.equal((railJs.match(/pickPop\(/g) || []).length, 1, 'el recorrido rebota en un solo sitio');
  assert.ok(/const choose = chip => \{\s*if \(chip\.dataset\.id === current\) return;\s*pickPop\(chip\);/.test(railJs), 'la parada rebota al elegirla con un toque o con el teclado');
  assert.ok(/if \(at < 0\) pickPop\(btn\);/.test(feedJs) && !/pickPop/.test(feedJs.slice(feedJs.indexOf('function paintInterest'), feedJs.indexOf('export function toggleInterest'))), '«Me interesa» rebota al tocar, no al pintar lo guardado');
  assert.ok(/if \(res\.on\) pickPop\(save\);/.test(savedJs) && !/pickPop/.test(savedJs.slice(savedJs.indexOf('function paint(btn)'), savedJs.indexOf('export function saveButton'))), 'guardar rebota al tocar, no al pintar lo guardado');
});

test('eventos: insignias de tipo y de estado; la fecha solo sale de data-fecha, en español y con el día de Monterrey', () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  const tipo = { circulo: 'Lectura', ajedrez: 'Juego', taller: 'Taller' };
  for (const [block, id] of items) {
    assert.ok(block.includes(`<span class="bill-badges"><span class="badge" data-bill-type>${tipo[id]}</span><span class="badge badge--quiet" data-bill-when>${NO_DATE}</span></span>`), `${id}: insignia de tipo «${tipo[id]}» e insignia de estado «${NO_DATE}»`);
    assert.equal((block.match(/class="badge/g) || []).length, 2, `${id}: dos insignias, no más`);
    assert.ok(!/data-fecha=/.test(block.match(/^<details[^>]*>/)[0]), `${id}: hoy ninguna propuesta tiene fecha confirmada`);
  }
  assert.ok(/data-fecha="AAAA-MM-DD"/.test(html.match(/<!-- Fecha confirmada:[^>]*-->/)[0]), 'el marcado dice cómo se pone una fecha real');
  assert.equal(NO_DATE, 'Propuesta · sin fecha');
  const now = new Date('2026-11-11T18:00:00Z'); // mediodía del 11 de noviembre en Monterrey
  for (const bad of [undefined, null, '', 'pronto', '2026-13-01', '2026-02-31', '21/11/2026', '2026-11-21T25:00', '2026-11-21 18:00']) {
    assert.deepEqual(eventBadge(bad, now), { kind: 'propuesta', text: NO_DATE }, `sin fecha válida (${bad}) sigue siendo una propuesta`);
  }
  assert.deepEqual(eventBadge('2026-11-21', now), { kind: 'fecha', text: 'Sáb 21 nov', date: '2026-11-21' });
  assert.deepEqual(eventBadge('2026-11-21T18:30', now), { kind: 'fecha', text: 'Sáb 21 nov · 18:30', date: '2026-11-21' });
  assert.deepEqual(eventBadge('2027-01-09', now), { kind: 'fecha', text: 'Sáb 9 ene 2027', date: '2027-01-09' }, 'otro año lleva el año');
  assert.deepEqual(eventBadge('2026-11-11', now), { kind: 'hoy', text: 'Hoy', date: '2026-11-11' });
  assert.deepEqual(eventBadge('2026-11-11T19:00', now), { kind: 'hoy', text: 'Hoy · 19:00', date: '2026-11-11' });
  assert.deepEqual(eventBadge('2026-11-10', now), { kind: 'propuesta', text: NO_DATE }, 'una fecha que ya pasó no se anuncia');
  // El día es el de Monterrey, no el del reloj del visitante ni UTC: a las 23:30 del 11 en Monterrey ya es 12 en UTC.
  const late = new Date('2026-11-12T05:30:00Z');
  assert.equal(eventBadge('2026-11-11', late).kind, 'hoy');
  assert.equal(eventBadge('2026-11-12', late).text, 'Jue 12 nov');
  assert.ok(!/\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(html.match(/<section id="cartelera"[\s\S]*?<\/section>/)[0]), 'ninguna fecha escrita a mano en el capítulo');
  // La insignia callada es para lo no confirmado; lo confirmado usa la insignia común.
  assert.ok(/\.badge--quiet \{ background: var\(--stone\); color: var\(--bone\); \}/.test(css), 'insignia callada con colores del tono');
  // initFeed pinta el estado desde el atributo.
  const mk = fecha => { const el = { textContent: '', quiet: null, classList: { toggle(c, on) { el.quiet = on; } } }; return { dataset: { fecha }, querySelector: () => el, el }; };
  const future = `${new Date().getUTCFullYear() + 1}-06-15`;
  const cards = [mk(undefined), mk(future), mk('2020-01-01')];
  globalThis.document = { querySelectorAll: sel => (sel === '.bill-item' ? cards : []) };
  try { initFeed(); } finally { delete globalThis.document; }
  assert.deepEqual(cards.map(c => [c.el.textContent === NO_DATE, c.el.quiet]), [[true, true], [false, false], [true, true]], 'sin atributo o con fecha vencida: «Propuesta · sin fecha»; con fecha vigente, la fecha en la insignia común');
  assert.match(cards[1].el.textContent, /^(Lun|Mar|Mié|Jue|Vie|Sáb|Dom) 15 jun \d{4}$/);
});

test('filtros de Explorar: cada grupo muestra como máximo 5 opciones y un «Ver las N» / «Ver menos» propio', async () => {
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  const entries = [['a', 30], ['b', 20], ['c', 10], ['d', 9], ['e', 8], ['f', 7], ['g', 6], ['h', 1]];
  const vals = list => list.map(([v]) => v);
  assert.equal(FACET_LIMIT, 5);
  let v = facetView(entries.slice(0, 5));
  assert.ok(!v.foldable && v.top.length === 5 && v.rest.length === 0, 'con 5 o menos no hay nada que plegar');
  v = facetView(entries);
  assert.deepEqual([vals(v.top), v.rest.length, v.total, v.foldable], [['a', 'b', 'c', 'd', 'e'], 0, 8, true], 'plegado: las 5 con más títulos');
  v = facetView(entries, new Set(['h', 'g']));
  assert.deepEqual(vals(v.top), ['a', 'b', 'c', 'g', 'h'], 'las marcadas siempre a la vista; el resto por conteo, sin cambiar el orden');
  v = facetView(entries, new Set(['a']));
  assert.deepEqual(vals(v.top), ['a', 'b', 'c', 'd', 'e'], 'marcar una opción visible no mueve nada');
  v = facetView(entries, new Set(['a', 'b', 'c', 'f', 'g', 'h']));
  assert.deepEqual(vals(v.top), ['a', 'b', 'c', 'f', 'g', 'h'], 'si hay más de 5 marcadas se ven todas');
  v = facetView(entries, new Set(['h']), true);
  assert.deepEqual([vals(v.top), vals(v.rest)], [['a', 'b', 'c', 'd', 'e'], ['f', 'g', 'h']], 'abierto: las primeras arriba y el resto bajo el botón, sin reordenar');
  // Con los datos reales: ningún grupo plegado pasa de 5 y ninguno pierde opciones al abrirse.
  const sample = JSON.parse(await readFile(here('./assets/data/catalog.json'), 'utf8')).books;
  let shown = 0;
  for (const dim of ['k', 'g', 'f', 'p']) {
    const all = [...facetCounts(sample, {}, dim).entries()].filter(([x]) => x).sort((a, b) => b[1] - a[1]);
    const closed = facetView(all), open = facetView(all, new Set(), true);
    assert.ok(closed.top.length <= FACET_LIMIT && closed.rest.length === 0, `${dim}: plegado, 5 como máximo`);
    assert.equal(open.top.length + open.rest.length, all.length, `${dim}: abierto, todas`);
    shown += closed.top.length;
  }
  assert.ok(shown <= 20, `el panel abre con ${shown} opciones a la vista (antes ~25)`);
  // El botón: uno por grupo plegable, con aria-expanded y aria-controls, entre las primeras opciones y el resto; el foco se queda en él.
  assert.ok(/el\('button', \{ type: 'button', class: 'cat-more-facets', 'data-expand': g\.dim, 'aria-expanded': String\(open\), 'aria-controls': restId \}, open \? g\.less : g\.all\(view\.total\)\)/.test(catalog), 'botón con aria-expanded y aria-controls por grupo');
  assert.ok(/el\('div', \{ class: 'cat-rest', id: restId, hidden: !open \}, view\.rest\.map\(option\)\)/.test(catalog), 'lo que despliega aparece debajo del botón: el botón no cambia de sitio');
  for (const label of ['Ver los ${n} géneros', 'Ver menos géneros', 'Ver las ${n} editoriales', 'Ver menos editoriales', 'Ver los ${n} formatos', 'Ver menos formatos']) assert.ok(catalog.includes(label), `rótulo «${label}»`);
  assert.ok(/if \(state\.open\.has\(dim\)\) state\.open\.delete\(dim\); else state\.open\.add\(dim\);\s*renderFilters\(\);\s*filtersEl\.querySelector\(`\[data-expand="\$\{dim\}"\]`\)\?\.focus\(\{ preventScroll: true \}\);/.test(catalog), 'al abrir o plegar el foco se conserva en el botón y el scroll no se mueve');
  assert.ok(/\(document\.getElementById\(cb\.id\) \?\? filtersEl\.querySelector\(`\[data-expand="\$\{cb\.dataset\.dim\}"\]`\)\)\?\.focus\(\{ preventScroll: true \}\)/.test(catalog), 'si la casilla desmarcada deja de verse, el foco pasa al botón de su grupo');
  assert.ok(!/expandG|limit: (99|10|8)/.test(catalog), 'ya no hay un límite distinto por grupo ni un único grupo desplegable');
});

test('fuentes: sources.json lista solo archivos que existen y que fonts.css declara (sin la cursiva que nunca se alojó)', async () => {
  const sources = JSON.parse(await readFile(here('./assets/fonts/sources.json'), 'utf8'));
  const fontsCss = await readFile(here('./assets/fonts/fonts.css'), 'utf8');
  assert.ok(sources.fonts.length >= 2);
  for (const f of sources.fonts) {
    assert.ok(existsSync(here(`./assets/fonts/${f.file}`)), `${f.file} existe`);
    assert.ok(fontsCss.includes(`url(./${f.file})`) && new RegExp(`font-family: '${f.family}';\\s*font-style: ${f.style};`).test(fontsCss), `${f.file} tiene su @font-face (${f.family}, ${f.style})`);
  }
  const woff = (await readdir(here('./assets/fonts'))).filter(n => n.endsWith('.woff2')).sort();
  assert.deepEqual(woff, sources.fonts.map(f => f.file).sort(), 'ni archivos sin registrar ni registros sin archivo');
  assert.ok(!/font-style: italic/.test(css + mobileCss + fontsCss), 'el sitio no usa cursivas: no hace falta alojar una');
});

test('ficha: «Cómo llegar» es la acción primaria, WhatsApp confirma, y el recuadro es legible en el tono claro', () => {
  const ask = html.match(/<div class="drawer-ask">[\s\S]*?<\/div>/)[0];
  assert.ok(ask.indexOf('data-d-visit') > -1 && ask.indexOf('data-d-visit') < ask.indexOf('data-d-cta'), 'la visita va antes que WhatsApp');
  assert.ok(/data-d-visit href="https:\/\/www\.google\.com\/maps\/dir\//.test(ask) && /btn btn--tungsten" data-d-visit/.test(ask), 'visita como botón principal');
  assert.ok(/btn btn--line-ink" data-d-cta/.test(ask), 'WhatsApp como acción secundaria');
  const askRule = css.match(/\.drawer-ask \{[^}]*\}/)[0];
  assert.ok(/border: var\(--edge-w\) solid var\(--edge-soft\); border-radius: var\(--radius-card\)/.test(askRule) && !/background|var\(--bone\)/.test(askRule), 'el recuadro es una tarjeta sobre el papel de la ficha (borde suave, sin fondo propio): no toma --bone, que en el tono claro es tinta');
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

test('sin JavaScript la barra con el botón «Más» no se muestra y los capítulos siguen en la cabecera (QA1-03)', () => {
  assert.ok(/html:not\(\.js\) \.tabbar \{ display: none; \}/.test(mobileCss), 'la barra inferior (y su botón «Más») se oculta sin la clase js de boot.js');
  assert.ok(/html:not\(\.js\) \.hdr-nav a \{[^}]*min-height: var\(--target-coarse\)/.test(mobileCss), 'enlaces de capítulo de 44 px sin JavaScript');
  const nav = html.match(/<nav class="hdr-nav"[\s\S]*?<\/nav>/)[0];
  for (const id of ['libros', 'cartelera', 'visita']) assert.ok(new RegExp(`<a href="#${id}" data-hint="[^"]+"><span>`).test(nav), `enlace a #${id} en la cabecera, sin condición`);
  assert.ok(/html:not\(\.has-news\) :is\(\.news, \[data-news-link\]\)/.test(css), 'sin JavaScript no hay clase has-news: ni la sección de Novedades (que necesita JS) ni su enlace se muestran');
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
  assert.ok(!/\.hdr-list \{ display: none; \}/.test(mobileCss) && /\.hdr-list \{[^}]*min-width: 44px/.test(mobileCss) && /\.hdr-list \{[^}]*min-height: var\(--target-coarse\)/.test(css), 'U03: en móvil el chip de la cabecera se ve con libros guardados (objetivo de 44 px) y no se oculta');
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

const HOY = '2026-11-11'; // las pruebas de fechas no dependen del reloj
const entry = (i, llegada) => ({ id: data.books[i].id, llegada });

test('Novedades: sin entradas válidas el plan no muestra nada, ni siquiera todo el catálogo', () => {
  const sinDatos = [{ meta: SAMPLE_META }, { meta: SAMPLE_META, novedades: {} }, { meta: SAMPLE_META, novedades: { entradas: [] } }, { novedades: { entradas: [{ id: 'no-existe', llegada: '2026-11-01' }, { id: 'tampoco', llegada: '2026-11-02' }] } },
    { novedades: { entradas: 'x' } }, { novedades: { entradas: [{ llegada: '2026-11-01' }, null, 'libro', { id: 7, llegada: '2026-11-01' }] } }, { novedades: { entradas: [entry(0, '2026-12-24')] } }, { novedades: { ids: [] } }, { novedades: { ids: ['no-existe'] } }, null, undefined];
  for (const d of sinDatos) {
    const plan = newsPlan(data.books, d, { hoy: HOY });
    assert.equal(plan.show, false, JSON.stringify(d)?.slice(0, 80));
    assert.deepEqual(plan.books, [], 'sin entradas no se arma ninguna tarjeta');
    assert.equal(plan.n, 0, 'sin entradas no hay nada que contar');
  }
});

test('Novedades: las entradas de ejemplo son 12 libros del catálogo de prueba, con fecha válida, variados y recientes', async () => {
  const shipped = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  const list = shipped.novedades.entradas;
  assert.ok(!('ids' in shipped.novedades) && shipped.novedades.titulo === 'Recién llegados', 'la fuente es `entradas` ({ id, llegada }); se conserva `titulo`');
  assert.ok(!shipped.collections.some(c => /novedades/i.test(c.id)), 'el carrusel de libros no recibe la colección de Novedades');
  assert.equal(list.length, 12, '12 entradas de ejemplo');
  const byId = new Map(data.books.map(b => [b.id, b]));
  for (const e of list) {
    assert.deepEqual(Object.keys(e).sort(), ['id', 'llegada'], 'cada renglón es { id, llegada }');
    assert.ok(byId.has(e.id), `el id existe en la muestra que carga el sitio: ${e.id}`);
    assert.ok(validDay(e.llegada), `fecha real AAAA-MM-DD: ${e.llegada}`);
    assert.ok(e.llegada >= '2026-10-05' && e.llegada <= '2026-11-10', `fecha de ejemplo dentro del tramo: ${e.llegada}`);
  }
  assert.equal(new Set(list.map(e => e.id)).size, 12, 'sin repetidos');
  assert.ok(new Set(list.map(e => byId.get(e.id).g)).size >= 10 && new Set(list.map(e => byId.get(e.id).k)).size === 2, 'variados en género, con ficción y no ficción');
  const plan = newsPlan(data.books, shipped, { hoy: HOY });
  assert.equal(plan.books.length, 12, 'las 12 se muestran');
  assert.ok(plan.n >= 4 && plan.n <= 5, `entre 4 y 5 llegaron en los 14 días previos al ${HOY} (${plan.n})`);
  assert.deepEqual(plan.ids, [...list].sort((a, b) => (a.llegada < b.llegada ? 1 : -1)).map(e => e.id), 'lo más reciente primero');
  assert.deepEqual(newsPlan(null, shipped, { hoy: HOY }).nuevos, plan.nuevos, 'el conteo temprano (sin catálogo) coincide con el de la tira');
});

test('Novedades: «nuevo» es lo que llegó después de la última visita; en la primera, lo de las dos últimas semanas', () => {
  assert.equal(NEW_DAYS, 14);
  // fechas reales
  for (const ok of ['2026-11-10', '2024-02-29', '2026-01-01']) assert.equal(validDay(ok), true, ok);
  for (const bad of ['2026-02-30', '2026-13-01', '2026-11-1', '10/11/2026', '', null, undefined, 20261110, '2026-11-10T00:00']) assert.equal(validDay(bad), false, String(bad));
  // primera visita (sin `visto`, o sin almacenamiento): los últimos 14 días, contando hoy
  assert.equal(isNew('2026-11-11', { hoy: HOY }), true, 'hoy');
  assert.equal(isNew('2026-10-29', { hoy: HOY }), true, 'hace 13 días');
  assert.equal(isNew('2026-10-28', { hoy: HOY }), false, 'hace 14 días ya no');
  assert.equal(isNew('2026-10-05', { hoy: HOY }), false);
  assert.equal(isNew('2026-10-29', { visto: null, hoy: HOY }), true, 'sin fecha guardada se comporta como primera visita');
  assert.equal(isNew('2026-10-29', { visto: 'ayer', hoy: HOY }), true, 'una fecha guardada ilegible se trata como primera visita');
  // visita de regreso: solo lo que llegó después de la última vez que vio Novedades
  assert.equal(isNew('2026-11-06', { visto: '2026-11-05', hoy: HOY }), true);
  assert.equal(isNew('2026-11-05', { visto: '2026-11-05', hoy: HOY }), false, 'lo que llegó el día de la visita ya se vio');
  assert.equal(isNew('2026-11-10', { visto: '2026-11-10', hoy: HOY }), false, 'aunque esté dentro de las dos semanas');
  assert.equal(isNew('2026-09-01', { visto: '2026-08-01', hoy: HOY }), true, 'de regreso no hay tope de dos semanas: cuenta todo lo posterior a la visita');
  assert.equal(isNew(null, { hoy: HOY }), false, 'una entrada sin fecha nunca es nueva');
  assert.equal(isNew('2026-02-30', { hoy: HOY }), false);
  // orden y limpieza de la lista
  const raw = { novedades: { entradas: [entry(0, '2026-10-20'), entry(1, '2026-11-09'), entry(2, '2026-10-20'), entry(1, '2026-11-01'), entry(3, '2026-11-30'), { id: data.books[4].id }, entry(5, 'pronto'), entry(6, '2026-11-11')] } };
  assert.deepEqual(newsEntries(raw, HOY), [entry(6, '2026-11-11'), entry(1, '2026-11-09'), entry(0, '2026-10-20'), entry(2, '2026-10-20'), { id: data.books[4].id, llegada: null }, { id: data.books[5].id, llegada: null }],
    'lo más reciente primero; a igual fecha, el orden del JSON; sin repetidos; lo que aún no llega espera su día; sin fecha válida, al final');
  assert.deepEqual(newsEntries({ novedades: { ids: [data.books[1].id, data.books[0].id] } }, HOY), [{ id: data.books[1].id, llegada: null }, { id: data.books[0].id, llegada: null }], 'compatibilidad: la clave antigua `ids` se acepta sin fecha, en su orden');
  // plan: libros, nuevos y línea de estado
  const first = newsPlan(data.books, raw, { hoy: HOY });
  assert.deepEqual(first.books.map(b => b.id), [6, 1, 0, 2, 4, 5].map(i => data.books[i].id), 'los libros salen en el orden de las entradas');
  assert.deepEqual(first.nuevos, [data.books[6].id, data.books[1].id]);
  assert.ok(first.show && first.n === 2 && first.primera === true && first.estado === '2 llegaron en las últimas dos semanas' && first.titulo === 'Recién llegados');
  const back = newsPlan(data.books, raw, { hoy: HOY, visto: '2026-11-09' });
  assert.ok(back.n === 1 && back.primera === false && back.estado === '1 llegó desde tu última visita', JSON.stringify(back.estado));
  assert.equal(newsPlan(data.books, raw, { hoy: HOY, visto: '2026-10-01' }).estado, '4 llegaron desde tu última visita');
  const seen = newsPlan(data.books, raw, { hoy: HOY, visto: HOY });
  assert.ok(seen.show && seen.n === 0 && seen.estado === 'Ya viste todo lo que ha llegado' && seen.books.length === 6, 'sin pendientes la sección sigue, sin insignias');
  assert.equal(newsPlan(data.books, { novedades: { entradas: [entry(0, '2026-10-20'), { id: 'no-existe', llegada: '2026-11-10' }] } }, { hoy: HOY }).n, 0, 'un id que no existe en el catálogo no cuenta ni se muestra');
  assert.equal(newsPlan(data.books, { novedades: { entradas: data.books.slice(0, 40).map((b, i) => ({ id: b.id, llegada: `2026-10-${String(i % 28 + 1).padStart(2, '0')}` })) } }, { hoy: HOY }).books.length, NEWS_SIZE, 'tope de 12');
  assert.ok(!('note' in first) && !('llegadas' in first), 'el plan no trae rótulo de muestra ni fechas para imprimir');
  // textos
  assert.equal(statusLine(1, true), '1 llegó en las últimas dos semanas');
  assert.equal(statusLine(3, false), '3 llegaron desde tu última visita');
  assert.equal(statusLine(0, false), 'Ya viste todo lo que ha llegado');
  assert.equal(statusLine(0, true), 'Lo más reciente que ha llegado a la casa', 'en una primera visita sin llegadas recientes no se afirma que la persona ya lo vio');
  assert.equal(hintLine(4, false), '4 novedades desde tu visita');
  assert.equal(hintLine(1, false), '1 novedad desde tu visita');
  assert.equal(hintLine(5, true), '5 novedades recientes');
  assert.equal(hintLine(1, true), '1 novedad reciente');
});

test('Novedades: capítulo propio, reservado sin saltos, ausente sin entradas y sin fechas impresas', async () => {
  const [news, boot, app] = await Promise.all(['news.js', 'assets/js/boot.js', 'app.js'].map(f => readFile(here(`./${f}`), 'utf8')));
  const markup = html.match(/\n {4}<section id="novedades"[\s\S]*?\n {4}<\/section>/)[0];
  assert.ok(/<section id="novedades" class="news" data-news data-tone="mist" data-theme="paper" aria-labelledby="news-title">/.test(markup) && !/\bhidden\b/.test(markup.match(/<section[^>]*>/)[0]), 'sección de primer nivel con su tono y su tema para la cabecera');
  const libros = html.match(/<section id="libros"[\s\S]*?\n {4}<\/section>/)[0];
  assert.ok(!libros.includes('novedades') && !libros.includes('data-news'), 'Novedades salió de dentro de Libros');
  assert.ok(/<h2 id="news-title" class="h2">Novedades<\/h2>\s*<p class="news-status" data-news-status><\/p>/.test(markup) && /\.news-status \{[^}]*min-height: 1lh;/.test(css), 'titular de capítulo y línea de estado con su renglón reservado');
  assert.equal((markup.match(/class="rail-item card--sk"/g) || []).length, 5, 'la tira reserva su forma con esqueletos, como el carrusel');
  assert.ok(/role="region" aria-roledescription="carrusel"[^>]*tabindex="0" data-news-viewport/.test(markup) && /data-news-prev disabled aria-label="Novedades anteriores"/.test(markup) && /data-news-next disabled aria-label="Novedades siguientes"/.test(markup), 'carrusel con foco, progreso y flechas con nombre');
  // Existencia: una clase en <html>, puesta antes del primer render, y los atributos hidden que pone news.js.
  assert.ok(/html:not\(\.has-news\) :is\(\.news, \[data-news-link\]\), \.news\[hidden\], \[data-news-link\]\[hidden\] \{ display: none; \}/.test(css), 'sin has-news (sin JS o sin entradas) no existen ni la sección ni sus enlaces');
  assert.ok(/localStorage\.getItem\('iti-news-estado'\)/.test(boot) && /if \(news !== 'n'\) \{ r\.classList\.add\('has-news'\); if \(news !== 's'\) r\.classList\.add\('news-hint'\); \}/.test(boot) && boot.indexOf("classList.add('has-news')") < boot.indexOf("matchMedia('(prefers-reduced-motion: reduce)')"), 'boot.js reserva sección y control con lo que dejó la visita anterior, también con movimiento reducido');
  assert.ok(/const STATE_KEY = 'iti-news-estado';/.test(news) && /const SEEN_KEY = 'iti-news-visto';/.test(news), 'news.js escribe la misma clave que lee boot.js');
  const links = [...html.matchAll(/<a[^>]*href="#novedades"[^>]*>/g)].map(m => m[0]);
  assert.equal(links.length, 4, 'cuatro entradas a la sección: cabecera, menú compacto, casilla de la barra y control del inicio');
  assert.ok(links.every(l => /data-news-link|data-news-cta hidden/.test(l)), 'todas desaparecen sin entradas');
  // Control del inicio: secundario, oculto de salida, con su sitio reservado solo bajo news-hint.
  const copy = html.match(/<div class="entry-copy"[\s\S]*?<\/section>/)[0];
  assert.ok(/<div class="entry-meta">\s*<ul class="entry-facts"[\s\S]*?<\/ul>\s*<a class="btn btn--sm btn--ghost entry-news" href="#novedades" data-news-cta hidden><span class="entry-news-dot" aria-hidden="true"><\/span><span data-news-cta-text><\/span>/.test(copy) && copy.indexOf('entry-news') > copy.indexOf('btn--tungsten'), 'control secundario después de «Cómo llegar», con texto propio (el punto es decorativo)');
  assert.ok(/\.entry-news \{ display: none; flex: none; \}\s*\.news-hint \.entry-news \{ display: inline-flex; visibility: hidden; \}\s*\.news-hint \.entry-news:not\(\[hidden\]\) \{ visibility: visible; \}/.test(css), 'sin reserva no ocupa sitio; con reserva lo ocupa invisible hasta que llega el conteo: nada salta');
  assert.ok(/\.entry-meta \{ display: contents; \}\s*\.news-hint \.entry-copy \{ grid-template-areas: "av name" "av facts" "row row" "news news"; \}\s*\.entry-news \{ grid-area: news; min-height: 48px; \}/.test(mobileCss), 'en móvil el control baja al pie del perfil, bajo «Cómo llegar», de 48 px; sin reserva la retícula no deja hueco');
  assert.ok(/root\.classList\.toggle\('news-hint'/.test(news) && /new IntersectionObserver\(es => \{\s*if \(es\.some\(e => e\.isIntersecting\)\) return;/.test(news), 'si la reserva no coincide, se corrige con el inicio fuera de la vista');
  // Carga: módulo ligero para el conteo temprano; carrusel y catálogo solo al pintar la tira.
  assert.ok(!/^import [^;]*(rail|catalog|saved)\.js/m.test(news) && /import\('\.\/rail\.js'\), import\('\.\/catalog\.js'\)/.test(news), 'news.js no arrastra el catálogo para contar');
  assert.ok(/newsPlan\(null, await loadCollections\(\)/.test(news) && /loadNews\(\)\.then\(m => m\.initNewsCount\(\)\)/.test(app) && /loadNews\(\)\.then\(m => m\.initNews\(\{ ensureCatalog: bootCatalog, isMotion \}\)\)/.test(app), 'el conteo se pide pronto (solo collections.json) y la tira al acercarse');
  assert.ok(app.indexOf('m.initNewsCount()') > app.indexOf('const posterReady'), 'el conteo va después de la foto y las fuentes: no compite con el primer render');
  // «Visto»: almacenamiento siempre protegido; se guarda con la sección en pantalla y lo visible cambia al salir.
  for (const line of news.split('\n').filter(l => /getItem|setItem/.test(l))) assert.ok(/try \{/.test(line) && /catch/.test(line), `localStorage siempre en try/catch: ${line.trim().slice(0, 60)}`);
  const watch = news.slice(news.indexOf('function watchSeen'), news.indexOf('export async function initNews'));
  assert.ok(/new IntersectionObserver/.test(watch) && /intersectionRatio >= 0\.5/.test(watch) && /setTimeout\(\(\) => \{[^}]*writeSeen\(isoDay\(\)\);[^}]*\}, DUR\('scene'\)\)/.test(watch), 'se guarda cuando la sección está en pantalla de verdad, un momento (duración de token)');
  assert.ok(watch.indexOf('if (!e.isIntersecting && seen)') > 0 && watch.indexOf(".badge-new').forEach(b => b.remove())") > watch.indexOf('if (!e.isIntersecting && seen)'), 'las insignias se retiran solo al salir de la sección, no mientras se miran');
  // Insignia «Nuevo» y verdad: dentro del botón (nombre accesible), turquesa profundo con blanco; la fecha no se imprime.
  assert.ok(/li\.querySelector\('\.card'\)\.prepend\(badge\(\)\)/.test(news) && /b\.textContent = 'Nuevo';/.test(news), '«Nuevo» va dentro del botón de la tarjeta: entra en su nombre accesible');
  assert.ok(/\.badge-new \{[^}]*background: var\(--terra-deep\); color: var\(--white\);/.test(css.replaceAll('\n', ' ')) && /\.motion \.news\.is-in \.badge-new \{ animation: pick-pop var\(--dur-fast\) var\(--spring\); \}/.test(css), 'insignia en turquesa profundo con texto blanco; rebote solo con movimiento');
  assert.ok(!/toLocale|Intl\.|datetime|<time/.test(news) && !/\.llegada\b|\bllegada:/.test(news.slice(news.indexOf('// Interfaz (solo navegador)'))), 'la fecha de llegada no llega a la interfaz: solo ordena y decide «Nuevo»');
  assert.ok(/rail\.bookCard\(b, tones\[i\]\)/.test(news) && /rail\.wireBookOpen\(track, ensureCatalog\)/.test(news), 'misma tarjeta, guardar y ficha que el carrusel de colecciones');
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
  assert.equal(actions.length, 3);
  assert.ok(/btn--tungsten/.test(actions[0][1]) && /google\.com\/maps/.test(actions[0][2]) && /Cómo llegar/.test(actions[0][3]), 'primaria: Cómo llegar');
  assert.ok(/btn--ghost/.test(actions[1][1]) && /wa\.me/.test(actions[1][2]) && /Pregunta por un libro/.test(actions[1][3]), 'WhatsApp existe como secundaria (escritorio)');
  assert.ok(/btn--sm btn--ghost entry-news/.test(actions[2][1]) && !/tungsten/.test(actions[2][1]) && actions[2][2] === '#novedades' && /data-news-cta hidden/.test(actions[2][0]), 'el control de novedades es secundario y nace oculto: en la primera vista sigue habiendo una sola primaria');
  assert.ok(/\.entry-actions \.btn--ghost \{ display: none; \}/.test(mobileCss) && /\.entry-actions \{ grid-template-columns: 1fr; \}/.test(mobileCss), 'en móvil «Escribir» sale de la primera vista (Hick: <= 6 acciones); WhatsApp queda en la cabecera al desplazar, Cartelera, Libros y Visita');
  assert.ok(!/only-phone|hide-phone/.test(html + css + mobileCss), 'sin variantes de texto solo móvil');
  assert.ok(!/class="hl\b|hl-item|data-story/.test(html) && !/\.hl\b|\.hl-|\.story|\.stories/.test(css + mobileCss), 'sin destacados ni visor de historias: ni marcado ni estilos (decisión del 2026-11-11)');
  assert.ok(/\.profile-av \{ display: none; \}/.test(css) && /grid-template-areas: "av name" "av facts" "row row";/.test(mobileCss), 'el perfil es solo móvil y su retícula no reserva fila de destacados');
  assert.ok(/\.js \.hdr:not\(\.is-solid\) :is\(\.hdr-brand, \.hdr-wa\) \{ opacity: 0; visibility: hidden; \}/.test(mobileCss), 'al inicio la cabecera va vacía sobre la foto (el menú vive en la barra inferior); sin JS la marca sigue visible');
});

test('Eventos y talleres: foto, «Me interesa» y «Compartir» locales, sin contadores ni fechas', async () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  assert.equal(items.length, 3);
  for (const [block, id] of items) {
    assert.ok(/<img class="bill-card-img"[^>]* alt="[^"]+"/.test(block), `${id}: foto con texto alternativo`);
    assert.ok(new RegExp(`<button class="act" type="button" data-interest="${id}" data-title="[^"]+" aria-pressed="false">`).test(block), `${id}: «Me interesa» con aria-pressed`);
    assert.ok(new RegExp(`<button class="act act--icon" type="button" data-share="${id}" data-title="([^"]+)" aria-label="Compartir «\\1»">`).test(block), `${id}: «Compartir» es un control de icono cuyo nombre lleva el título`);
    assert.ok(!/\d+\s*(me gusta|likes?|reseñas)|★/i.test(block), `${id}: sin señales sociales inventadas`);
  }
  for (const id of ['i-heart', 'i-share']) assert.ok(html.includes(`<symbol id="${id}"`), `icono ${id}`);
  assert.ok(/\.act \{[^}]*min-height: var\(--target-coarse\)/.test(css.replaceAll('\n', ' ')) && /:where\(\.act, \.save, \.motion-btn\)\[aria-pressed="true"\][^{]*\{\s*--ctl-bg: var\(--pick-fill\); --ctl-edge: var\(--terra\); --ctl-ink: var\(--pick-ink\);/.test(css) && /:where\(\.act, \.save\)\[aria-pressed="true"\] \.ic \{ fill: currentColor; \}/.test(css), 'botones de ≥ 44 px con estado: «elegido» (menta, borde --terra, tinta --pick-ink) y el icono relleno');
  assert.ok(/html:not\(\.js\) \.bill-acts \.act \{ display: none; \}/.test(css) && !/html:not\(\.js\) \.bill-acts \{/.test(css), 'sin JavaScript no se muestran los botones que no funcionan; la consulta por WhatsApp, que es un enlace, sigue');
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

test('tarjeta de evento: foto → insignias → título → frase → descripción → acciones, sin números de interacción, y cada acción nombra su propuesta', async () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  assert.equal(items.length, 3);
  const buttons = [];
  for (const [block, id] of items) {
    const order = [/class="bill-card-img"/, /class="bill-badges"/, /class="bill-title"/, /class="bill-sub"/, /<p>/, /class="bill-acts"/, /data-interest=/, /data-share=/, /class="btn btn--line-ink bill-wa"/].map(re => block.search(re));
    assert.ok(order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1])), `${id}: el DOM va de la foto a las insignias, el título, la frase, la descripción y las tres acciones (${order})`);
    assert.ok(!/bill-post-head|bill-post-who|bill-av|bill-cap/.test(block), `${id}: sin encabezado de red social ni título repetido (las insignias ya dicen qué es)`);
    const pick = re => block.match(re)[1];
    assert.equal((block.match(/class="bill-title"/g) || []).length, 1, `${id}: el título está una sola vez`);
    assert.equal(pick(/data-share="[a-z]+" data-title="([^"]+)"/), pick(/class="bill-title">([^<]+)</), `${id}: «Compartir» lleva el título`);
    assert.equal(pick(/data-interest="[a-z]+" data-title="([^"]+)"/), pick(/class="bill-title">([^<]+)</), `${id}: «Me interesa» lleva el título`);
    assert.ok(block.includes(`aria-label="Preguntar por WhatsApp: ${pick(/class="bill-title">([^<]+)</)}"><span>Preguntar por WhatsApp</span>`), `${id}: la consulta dice «Preguntar por WhatsApp» y su nombre accesible lleva el título (empieza por el texto visible)`);
    assert.ok(/<a class="btn btn--line-ink bill-wa" href="https:\/\/wa\.me\/528180875940\?text=Hola%2C%20me%20interesa/.test(block), `${id}: WhatsApp es secundaria y conserva su mensaje`);
    assert.ok(!/btn--tungsten/.test(block), `${id}: ninguna acción de la tarjeta es primaria`);
    assert.ok(!/\b\d+\s*(me gusta|likes?|reseñas|personas|interesad)/i.test(block.replace(/<[^>]+>/g, ' ')), `${id}: sin contadores ni números de interacción`);
    buttons.push({ dataset: { title: pick(/data-share="[a-z]+" data-title="([^"]+)"/) }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } });
  }
  const bill = html.match(/<section id="cartelera"[\s\S]*?<\/section>/)[0];
  assert.equal((bill.match(/btn--tungsten/g) || []).length, 1, '«Cómo llegar» sigue siendo la única primaria del capítulo');
  // initFeed de verdad, sobre un DOM mínimo: cada botón «Compartir» queda con un nombre distinto que empieza por la acción (WCAG 2.5.3)
  globalThis.document = { querySelectorAll: sel => (sel === '[data-share]' ? buttons : []) };
  try { initFeed(); } finally { delete globalThis.document; }
  const names = buttons.map(b => b.attrs['aria-label']);
  assert.equal(new Set(names).size, 3, `tres nombres distintos: ${names}`);
  assert.deepEqual(names, ['Compartir «Círculo de lectura»', 'Compartir «Ajedrez en la casa»', 'Compartir «Taller de escritura»']);
  assert.equal(shareName(''), 'Compartir «esta propuesta»');
  // escritorio no ve la foto de tarjeta (va en el escenario); móvil y escritorio comparten título, frase e insignias (una sola copia)
  assert.ok(/\.bill-card-fig, \.bill-dots \{ display: none; \}/.test(css), 'la foto de tarjeta y los puntos son solo de móvil');
  assert.ok(!/\.bill-(title|sub)[^{]*\{[^}]*display: none/.test(css + mobileCss), 'el título y la frase no se ocultan en ningún tamaño');
  assert.ok(/\.act--icon \{ flex: none; width: 48px; padding: 0; border-radius: 50%; \}/.test(css) && /\.bill-acts > \* \{ min-height: 48px; \}/.test(css) && /\.bill-wa \{ font-size: var\(--fs-1\); \}/.test(css), 'las tres acciones miden 48 px; «Compartir» es un círculo y WhatsApp no lleva letra mayor que la primaria');
  assert.ok(/@media \(max-height: 700px\) \{ \.bill-card-img \{ aspect-ratio: 16 \/ 9; \} \}/.test(mobileCss), 'tope contra el alto: en ventanas bajas la foto se acorta para que la tarjeta quepa con sus acciones');
  assert.ok(/html:not\(\.js\) \.bill-item summary \{ pointer-events: auto; \}/.test(mobileCss), 'sin JavaScript las tarjetas móviles se pueden abrir (nadie las abre por la persona)');
  assert.ok(/\.bill-foot a, \.rail-trail-all \{ position: relative; white-space: nowrap; \}/.test(css) && /\.bill-foot a::after, \.rail-trail-all::after \{ content: ""; position: absolute; inset: calc\(-1 \* var\(--space-3\)\) 0; \}/.test(css) && !/\.bill-foot a[^{]*\{[^}]*inline-flex/.test(css + mobileCss), 'el enlace a Instagram es texto en línea con 44 px de objetivo: no deja un renglón alto');
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
  assert.ok(/nav\.dataset\.more = nav\.scrollTop \+ nav\.clientHeight < nav\.scrollHeight/.test(app) && /\.sm-nav\[data-more="1"\] \{ mask-image: linear-gradient\(to bottom, var\(--black\) calc\(100% - var\(--space-7\)\), transparent\); \}/.test(mobileCss), 'hoja «Más»: el pie de la lista se funde cuando hay más abajo');
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
  assert.ok(/\.cat \{ padding-top: var\(--space-6\); padding-bottom: var\(--space-6\); \}/.test(mobileCss) && /\.books > \.cat \{ margin-top: var\(--space-6\); \}/.test(mobileCss), 'tras el buscador un solo escalón de ritmo, el de capa (64 px con el margen), no el de capítulo');
  for (const rule of ['.books-head', '.cat-head', '.composer', '.bill-head']) {
    const m = css.match(new RegExp(`${rule.replace('.', '\.')} \{[^}]*\}`));
    assert.ok(m && !/vh/.test(m[0]), `${rule} sin clamp(vh)`);
  }
});

test('largo móvil: los capítulos, la cita y el pie usan --sec-sm (96 px entre bloques); Cartelera junta «Me interesa» y «Compartir»', () => {
  assert.ok(/\.quote \{ padding-block: var\(--sec-sm\) var\(--space-5\); \}/.test(mobileCss) && /\.ftr \{ padding-top: var\(--sec-sm\); \}/.test(mobileCss), 'la cita abre con --sec-sm y cierra con 24 px: comparte fondo con el llamado');
  assert.ok(/\.rail \{ margin-bottom: var\(--space-6\); \}/.test(mobileCss) && /\.ask \{ margin-top: var\(--space-6\); \}/.test(mobileCss) && /\.books-head, \.bill-head, \.news-head \{ margin-bottom: var\(--space-5\); \}/.test(mobileCss), 'tres escalones: capítulo 96 px, capa 64 px, titular a contenido 24 px');
  assert.ok(/\.bill-card-img \{ width: 100%; aspect-ratio: 4 \/ 3;/.test(mobileCss), 'la foto de la publicación va en 4:3: la tarjeta cabe en la ventana útil con sus acciones');
  assert.ok(/\.manifesto, \.bill, \.news \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss) && /\.books \{ padding-top: var\(--sec-sm\); \}/.test(mobileCss) && /\.visit \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'CR-14: entre dos capítulos la suma de rellenos no pasa de 96 px');
  assert.ok(/\.house-pin \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'la tira de La casa no pone el relleno por la altura de la pantalla');
  assert.ok(/\.bill-acts \.act \{ flex: 1 1 auto/.test(mobileCss));
});

test('titulares móviles (CR-14): un escalón por nivel, de la escala de tokens, y sin marquesina ni dirección repetida', async () => {
  const appSrc = await readFile(here('./app.js'), 'utf8');
  // Sistema táctil: capítulo = --fs-6 en móvil (el suelo del clamp; 4vw no lo supera hasta 900 px) y hasta --fs-7 en escritorio; capa interna = --fs-5. Un escalón por nivel y sin regla por capítulo.
  const flatCss = css.replaceAll('\n', ' ');
  assert.ok(/\.h2 \{[^}]*font: 900 clamp\(var\(--fs-6\), 4vw, var\(--fs-7\)\)\/1\.1 var\(--f-display\);[^}]*letter-spacing: -0\.01em/.test(flatCss), 'titular de capítulo: familia redonda, peso 900, interlínea 1.1, de --fs-6 a --fs-7');
  assert.ok(!/\.h2[^{]*\{[^}]*font-size/.test(css + mobileCss), 'los cuatro capítulos comparten ese escalón: ninguna regla cambia el tamaño por capítulo ni por tramo');
  assert.ok(/\.call-title \{[^}]*font: 900 clamp\(var\(--fs-6\), 4vw, var\(--fs-7\)\)\/1\.1 var\(--f-display\)/.test(flatCss) && !/\.call-title \{[^}]*font-size/.test(mobileCss), 'el llamado usa el mismo escalón que los capítulos');
  assert.ok(/\.layer-title \{[^}]*font: 900 var\(--fs-5\)\/1\.1 var\(--f-display\)/.test(flatCss), 'la capa interna queda un escalón abajo (--fs-5, 28 px)');
  assert.ok(/--fs-7: 3rem;/.test(tokensCss) && /--fs-6: 2\.25rem;/.test(tokensCss) && /--fs-5: 1\.75rem;/.test(tokensCss));
  assert.ok(/\.marquee \{ display: none; \}/.test(mobileCss) && /\.visit \.h2 em \{ display: none; \}/.test(mobileCss), 'la dirección «Matamoros 421» no se repite en móvil (marquesina y subtítulo de Visita)');
  assert.ok(/\.visit \{ padding-block: var\(--sec-sm\); \}/.test(mobileCss), 'Visita cierra con 48 px en móvil (48 + 48 del pie = 96, el tope)');
  assert.ok(/@media \(min-width: 1600px\) \{ \.visit \{ grid-template-columns: minmax\(0, 1fr\) 560px; \} \}/.test(css), 'desde 1600 px la columna del horario y la foto de Visita se fija en 560 px');
  assert.ok(/shown = rows\.some\(r => r\.row\.offsetWidth > 0\)/.test(appSrc) && /if \(!shown\) return false;/.test(appSrc), 'la marquesina oculta no se anima');
  assert.ok(/\.call-body \{ padding: 0 var\(--gutter\); \}/.test(mobileCss) && /\.call \{ padding-block: var\(--space-5\) var\(--sec-sm\); \}/.test(mobileCss), 'el llamado sin aire muerto: 24 px tras la cita, --sec-sm abajo y sin clamp(vh)');
});

test('cierre móvil (CR-10): dirección con «Cómo llegar» de texto, redes y correo en una fila, «Pausar el movimiento» discreto', () => {
  const ftr = html.slice(html.indexOf('<footer'), html.indexOf('</footer>'));
  assert.ok(/class="ftr-id"[\s\S]*Mariano Matamoros Pte\. 421[\s\S]*<a class="ftr-route" href="https:\/\/www\.google\.com\/maps\/dir[^"]*"[^>]*><span>Cómo llegar<\/span>/.test(ftr), 'la dirección y «Cómo llegar» juntos');
  assert.ok(!/class="(?:[^"]* )?btn[ "]/.test(ftr), 'el pie no tiene botones (la primaria vive en cada capítulo)');
  const links = ftr.match(/<ul class="ftr-links">[\s\S]*?<\/ul>/)[0];
  assert.deepEqual([...links.matchAll(/<span>([^<]+)<\/span>/g)].map(m => m[1]), ['Instagram', 'Facebook', 'WhatsApp', 'Correo'], 'redes y correo en la misma lista');
  assert.ok(/\.ftr-links \{ flex-wrap: wrap; justify-content: space-between; gap: var\(--space-2\); \}/.test(mobileCss), 'una sola fila a tamaño normal (lo mide el arnés a 320 px); con el texto ampliado los enlaces bajan de renglón en vez de cortarse');
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
  const pickRule = css.replaceAll('\n', ' ').match(/:where\(\.rail-chip, \.topic\)\[aria-checked="true"\][^{]*\{[^}]*\}/)[0];
  assert.ok(/--ctl-bg: var\(--pick-fill\); --ctl-edge: var\(--terra\); --ctl-ink: var\(--pick-ink\);/.test(pickRule), 'el tema activo y la colección activa comparten el código de «elegido» (menta, borde y canto --terra, tinta --pick-ink) en una sola regla');
  assert.ok(!/\.(topic|rail-chip)\[aria-checked="true"\][^{]*\{[^}]*(--ctl-|background|border|box-shadow|(?<![-\w])color\s*:)/.test(css + mobileCss), 'ninguna regla aparte redefine los colores del estado activo de temas o colecciones, ni en móvil ni en escritorio');
  assert.deepEqual([...css.matchAll(/\.rail-chip\[aria-checked="true"\][^{]*\{([^}]*)\}/g)].map(m => m[1].trim()), ['scale: 1.1;', 'fill: currentColor;', 'scale: calc(1 / 1.1);'], 'la parada actual solo suma tamaño (scale, sin mover a las vecinas) y el icono relleno');
  assert.ok(!/\[aria-(checked|pressed|expanded|current)="[a-z]+"\][^{]*\{[^}]*background: var\(--(tungsten|terra-deep|terra)\)/.test(css + mobileCss), 'ningún estado activo lleva relleno turquesa: el turquesa profundo relleno (--terra-deep) queda para «Cómo llegar»');
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
  assert.ok(/font: 900 var\(--fs-5\)\/[\d.]+ var\(--f-display\)/.test(rule) && fs5 >= 28, 'el nombre usa el escalón de 28 px en la familia redonda, peso 900');
  assert.ok(!/text-transform|font-stretch/.test(rule), 'sin mayúsculas forzadas ni condensar, como los titulares de hoja');
  assert.ok(!/color:|text-shadow|filter|animation|background/.test(rule), 'sin color ni efecto nuevo');
  assert.ok(/\.entry-lede \{[^}]*font: \d+ var\(--fs-body\)\/[\d.]+ var\(--f-sans\)/.test(css), 'el párrafo de entrada usa el token de texto (antes un valor continuo: 16.3–19.5 px)');
  const lede = Number(tokensCss.match(/--fs-body: ([\d.]+)rem/)[1]) * 16;
  assert.ok(fs5 > lede, `el nombre (${fs5} px) es mayor que el párrafo (${lede} px)`);
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

test('acomodo responsive: cromo fijo bajo, casillas fijas en la barra y tramos por alto de ventana', async () => {
  const [appJs, catalogJs, savedJs] = await Promise.all(['app.js', 'catalog.js', 'saved.js'].map(f => readFile(here('./' + f), 'utf8')));
  const flat = mobileCss.replaceAll('\n', ' ');
  assert.ok(/--tabbar-h: 56px;/.test(tokensCss) && /:root \{ --hdr-h: 56px; \}/.test(mobileCss), 'barra y cabecera de 56 px: el cromo fijo queda bajo un quinto de la ventana a 320×640');
  assert.ok(/\.tabbar \{[^}]*grid-auto-columns: minmax\(0, 1fr\);/.test(flat) && !/\.tabbar a\[aria-current="location"\] \{[^}]*padding:/.test(flat), 'casillas del mismo ancho: la activa no empuja a sus vecinas');
  assert.ok(/@media \(max-height: 420px\) \{\s*:root \{ --tabbar-h: 52px; \}\s*\.hdr \{ position: absolute; \}\s*\}/.test(flat) && /@media \(max-height: 420px\) and \(min-width: 480px\) \{\s*\.tabbar a, \.tab-menu \{ flex-direction: row;/.test(flat), 'ventanas bajas: la cabecera deja de ser fija y la barra se ciñe (el nombre junto al icono si hay ancho)');
  assert.ok(/#casa, #libros, #cartelera, #novedades, #visita \{ scroll-margin-top: calc\(-1 \* \(var\(--hdr-h\) \+ 8px\)\); \}/.test(mobileCss) && /dropHeaderForJump/.test(appJs), 'el salto desde la barra o la hoja deja el capítulo al borde de la ventana y la cabecera oculta');
  assert.ok(!/\/\*[^*]*\{ display: flex; gap: 4px; margin: 4px 0 8px; \}/.test(mobileCss) && /\n\.house-meter \{ display: none; \}/.test(mobileCss) && /\n\.still \{ scroll-snap-align: center; \}/.test(mobileCss), 'las reglas de la tira de La casa no quedan dentro de un comentario sin cerrar');
  assert.ok(/@media \(orientation: landscape\) and \(max-height: 500px\) \{[^@]*\.entry, \.entry-stage, \.motion \.entry-stage \{ min-height: 320px; \}/.test(flat), 'teléfono en horizontal: el inicio cabe en la ventana');
  assert.ok(/@media \(min-width: 761px\) and \(max-height: 520px\) \{[^@]*min-height: 340px;[^@]*\.wordmark \{ display: none; \}/.test(css.replaceAll('\n', ' ')), 'ventana baja con maquetación de escritorio: el inicio cabe y el rótulo gigante se retira');
  assert.ok(/@media \(min-width: 1728px\) \{ :root \{ --gutter: calc\(\(100vw - 1632px\) \/ 2\); \}/.test(css), 'tope de contenido de 1632 px en pantallas muy anchas');
  assert.ok(/@media \(min-width: 761px\) and \(max-width: 1023px\) \{[^@]*\.ftr-row \{ grid-template-columns: minmax\(0, 1fr\) auto; \}/.test(css.replaceAll('\n', ' ')), 'tableta: el pie no encima la dirección sobre los enlaces');
  assert.ok(/\.wordmark, \.wordmark \*, \.ftr-mark, \.ftr-mark \* \{ transition-property: none !important; \}/.test(css), 'con movimiento reducido el rótulo se mide sin transición: no sale cortado');
  const tall = '(max-width: 760px), (max-width: 1023px) and (orientation: portrait)';
  assert.ok(html.includes(`<source media="${tall}" srcset="assets/img/inicio-sala-m.webp"`) && html.includes(`fetchpriority="high" media="${tall}">`) && html.includes('fetchpriority="high" media="(min-width: 1024px), (min-width: 761px) and (orientation: landscape)">'), 'la tableta vertical recibe la foto vertical del inicio, y cada precarga coincide con su fuente');
  assert.ok(/data-cat-filters-done/.test(catalogJs) && /\.explorer \.cat-filters-foot \{ position: sticky; bottom: calc\(-1 \* var\(--space-9\)\);/.test(mobileCss), 'el panel de filtros de Explorar tiene salida fija a los resultados');
  assert.ok(/data-saved-dot/.test(savedJs), 'la casilla «Más» lleva el conteo de Mi lista');
});

test('sistema táctil: una sola piel de control, un solo código de «elegido», tarjetas planas, familia redonda y sin Bodoni', async () => {
  const strip = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replaceAll('\n', ' ');
  const flat = strip(css), flatAll = strip(css + mobileCss);
  const owners = re => [...flatAll.matchAll(re)].map(m => m[1].trim().replace(/^@media[^{]*\{\s*/, ''));
  // Control: una sola regla de piel, sin peso de selector, que cubre todas las piezas que se tocan.
  const skin = flat.match(/:where\(\.btn, [^)]*\) \{[^}]*\}/)[0];
  for (const piece of ['.btn', '.rail-chip', '.topic', '.cat-chip', '.act', '.save', '.rail-btn', '.drawer-close', '.ml-close', '.ml-remove', '.sm-close', '.ex-close', '.hdr-wa', '.hdr-list', '.menu-btn', '.cat-filters-btn', '.cat-sort select', '.cat-bar input[type="search"]', '.composer input', '.explore-open', '.sm-row', '.sm-link', '.motion-btn', '.toast-action']) {
    assert.ok(skin.slice(0, skin.indexOf('{')).includes(piece), `${piece} comparte la piel del control`);
  }
  assert.ok(/--ctl-bg: var\(--night\); --ctl-edge: var\(--edge\); --ctl-ink: var\(--bone\); --ctl-lip: var\(--lip\);/.test(skin), 'reposo: fondo del tono, borde --edge y tinta del tono');
  assert.ok(/border: var\(--edge-w\) solid var\(--ctl-edge\); border-radius: var\(--radius-ctl\);/.test(skin) && /box-shadow: 0 var\(--ctl-lip\) 0 var\(--ctl-edge\)/.test(skin), 'radio de control, borde de 2 px y canto por box-shadow');
  assert.ok(/margin: 0 0 var\(--lip\);/.test(skin), 'el margen inferior reserva el canto: nada lo recorta y al presionar no empuja a los vecinos');
  assert.ok(/transition: translate var\(--dur-instant\) var\(--ease-out\), box-shadow var\(--dur-instant\) var\(--ease-out\)/.test(skin), 'presionar responde con --dur-instant');
  assert.ok(/:active:not\(:disabled\) \{ translate: 0 var\(--lip\); --ctl-lip: 0px; \}/.test(flat) && !/:active[^{]*\{[^}]*scale:/.test(flatAll), 'presionado = baja con translate y cierra el canto; ninguna pieza cambia de tamaño');
  const lip = Number(tokensCss.match(/--lip: (\d+)px/)[1]), edgeW = Number(tokensCss.match(/--edge-w: (\d+)px/)[1]);
  assert.ok(lip === 4 && edgeW === 2 && /--radius-ctl: 16px/.test(tokensCss) && /--radius-card: 20px/.test(tokensCss) && /--radius-cover: 12px/.test(tokensCss), 'medidas de la norma: canto 4, borde 2, radios 16 / 20 / 12');
  // Un solo código de «elegido».
  const pick = flat.match(/:where\(\.rail-chip, \.topic\)\[aria-checked="true"\][^{]*\{[^}]*\}/)[0];
  assert.ok(/:where\(\.act, \.save, \.motion-btn\)\[aria-pressed="true"\]/.test(pick) && /:where\(\.cat-filters-btn\)\[aria-expanded="true"\]/.test(pick) && /:where\(\.cat-chip\)/.test(pick), 'chips, «Me interesa», guardar, el filtro abierto y los filtros puestos comparten la regla');
  assert.ok(/--ctl-bg: var\(--pick-fill\); --ctl-edge: var\(--terra\); --ctl-ink: var\(--pick-ink\);/.test(pick), 'relleno menta, borde y canto --terra, tinta --pick-ink');
  assert.ok(!/color: var\(--white\); background: var\(--terra\)/.test(flatAll) && !/background: var\(--terra\); color: var\(--white\)/.test(flatAll), 'ya no existe la cápsula turquesa sólida con texto blanco');
  assert.deepEqual(owners(/([^{}]+)\{[^{}]*background: var\(--terra-deep\)/g).sort(), ['.badge-new', '.btn--tungsten', '.entry-news-dot', '.progress', '.tab-dot'], 'el único relleno turquesa profundo de un control es la primaria; lo comparten la línea de progreso y los avisos de novedad que fija la norma (insignia «Nuevo» y puntos)');
  assert.ok(/\.tabbar a\[aria-current="location"\]::before \{ background: var\(--pick-fill\); box-shadow: inset 0 0 0 var\(--edge-w\) var\(--terra\); \}/.test(mobileCss) && /\.tabbar a\[aria-current="location"\] \{ color: var\(--pick-ink\); \}/.test(mobileCss) && /\.tabbar a\[aria-current="location"\] \.tab-ic svg \{ fill: currentColor;/.test(mobileCss), 'casilla activa con el mismo código (relleno menta, borde --terra, icono relleno, nombre en --pick-ink), sin cambiar sus dimensiones');
  assert.ok(!/\.sm-row\[aria-expanded/.test(mobileCss), 'la hoja «Más» ya no tiene acordeones: no queda un estado «abierto» que pintar');
  assert.ok(/\.cat-opt input:checked \+ label::before \{ background: var\(--pick-fill\); border-color: var\(--terra\); \}/.test(css) && /\.cat-opt input:checked \+ label \{ color: var\(--pick-ink\)/.test(css), 'casilla marcada con el mismo código');
  assert.ok(/<nav class="tabbar" data-tone="light"/.test(html) && /<section id="cartelera" class="bill" data-tone="light"/.test(html) && /<section id="visita" class="visit" data-tone="light"/.test(html), 'la barra, Cartelera y Visita resuelven borde y «elegido» con los tokens del tono claro');
  // Contraste de bordes y de «elegido» en cada tono (WCAG 1.4.11 y 1.4.3).
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const b4 = JSON.parse(await readFile(here('./design/tokens.json'), 'utf8')).themes.b4;
  for (const [name, t] of Object.entries(b4.tones)) {
    assert.ok(ratio(t.edge, t.night) >= 3, `${name}: borde de control ≥ 3:1 sobre el fondo (${ratio(t.edge, t.night).toFixed(2)})`);
    assert.ok(ratio(t['pick-ink'], t['pick-fill']) >= 4.5, `${name}: tinta de «elegido» ≥ 4.5:1 sobre su relleno`);
    assert.ok(ratio(b4.color.terra, t.night) >= 3, `${name}: el borde --terra de lo elegido delimita la pieza, ≥ 3:1 sobre el fondo del tono (${ratio(b4.color.terra, t.night).toFixed(2)})`);
  }
  assert.ok(ratio(b4.color.edge, b4.color.paper) >= 3, 'cromo blanco de la cabecera (fuera de todo tono): el borde --edge de :root mide ≥ 3:1 sobre blanco');
  assert.ok(ratio(b4.color.white, b4.color['terra-deep']) >= 4.5 && ratio(b4.color.white, b4.color.terra) >= 4.5, 'primaria: texto blanco ≥ 4.5:1 en reposo y con el cursor encima');
  // Canto, no sombra difusa: --elev-* solo en lo que flota.
  assert.deepEqual(owners(/([^{}]+)\{[^{}]*var\(--elev-/g).sort(), ['.cat-suggest', '.drawer', '.mylist', '.sheet-menu', '.toast'], 'sombras difusas solo en hojas, aviso y la lista de sugerencias; la barra inferior está acoplada y ya no flota');
  assert.ok(/\.cover \{[^}]*border-radius: var\(--radius-cover\); box-shadow: 0 var\(--lip\) 0 var\(--edge-soft\)/.test(flat) && /\.card:active \.cover, \.card\[data-opening\] \.cover \{ translate: 0 var\(--lip\); box-shadow: 0 0 0 var\(--edge-soft\); \}/.test(flat), 'portada: radio de 12 px, canto suave y baja al presionar');
  assert.ok(/\.card \{[^}]*padding: 0 0 var\(--lip\);[^}]*contain-intrinsic-size: auto calc\(var\(--card-h\) \+ var\(--lip\)\)/.test(flat), 'la tarjeta reserva el canto de la portada dentro de su caja (content-visibility recorta lo que sale)');
  for (const card of ['.bill-item', '.note', '.hours', '.cat-group', '.drawer-facts', '.drawer-ask', '.mylist']) {
    const rule = flat.match(new RegExp(String.raw`(?:^|\})\s*${card.replace('.', String.raw`\.`)} \{[^}]*\}`))[0];
    assert.ok(/border: var\(--edge-w\) solid var\(--edge-soft\); border-radius: var\(--radius-card\)/.test(rule), `${card}: tarjeta con radio --radius-card y borde --edge-soft`);
  }
  // Insignias.
  const badge = flat.match(/:where\(\.tab-badge, [^{]*\{[^}]*\}/)[0];
  assert.ok(/\.cat-n/.test(badge) && /\.bill-stage figcaption/.test(badge) && /\.badge[,)]/.test(badge) && /\.hours tr\.is-today th::after/.test(badge), '«Hoy», conteos, insignias de tipo y estado y pies de foto tipo etiqueta comparten la insignia');
  assert.ok(/border-radius: var\(--radius-pill\); background: var\(--pick-fill\); color: var\(--pick-ink\);/.test(badge) && /font: 800 var\(--fs-0\)\/1 var\(--f-display\)/.test(badge), 'insignia: píldora menta sin canto, 12 px en la familia redonda');
  assert.ok(/\.badge-new/.test(badge), '«Nuevo» es una insignia más de la misma regla (solo cambia relleno y tinta)');
  // Tipografía: familia redonda en titulares y controles, sin mayúsculas forzadas ni condensar; Archivo para el texto corrido y las portadas.
  assert.deepEqual(owners(/([^{}]+)\{[^{}]*text-transform: uppercase/g).sort(), ['.cover-title', '.hours tr.is-today th::after', '.wordmark, .ftr-mark'], 'mayúsculas solo en el rótulo «ITINERANTE», la insignia «Hoy» y las portadas (objetos)');
  assert.deepEqual(owners(/([^{}]+)\{[^{}]*font-stretch/g), ['.cover-title'], 'la condensada queda solo en las portadas tipográficas');
  assert.ok(/\.wordmark, \.ftr-mark \{[^}]*font-family: var\(--f-display\);\s*font-weight: 900;/.test(flat), 'el rótulo va en la familia redonda');
  for (const sel of ['.btn', '.rail-chip', '.topic', '.act', '.cat-chip', '.sm-row', '.sm-link', '.ml-title', '.sm-title', '.ex-title', '.bill-title', '.rail-trail-text', '.drawer h3', '.topic-name', '.manifesto-text', '.hdr-nav a', '.composer-field label', '.cat-bar label']) {
    const rule = flatAll.match(new RegExp(String.raw`(?:^|\})\s*${sel.replace('.', String.raw`\.`)} \{[^}]*\}`));
    assert.ok(rule && /font: (800|900) [^;]*var\(--f-display\)/.test(rule[0]), `${sel} en la familia redonda (800 o 900)`);
  }
  assert.ok(/\.h2 em, \.h2 \.ln-em, \.layer-title em, \.call-title em \{[^}]*font-weight: 800;\s*color: var\(--tungsten\);/.test(flat) && /\.manifesto-text em \{ font-style: normal; font-weight: 800; color: var\(--tungsten\); \}/.test(flat), 'el énfasis de los titulares: misma familia, peso 800, acento del tono');
  assert.ok(/--f-display: "Nunito"/.test(tokensCss) && !/--f-serif/.test(tokensCss), 'token de la familia redonda; el de la serif ya no existe');
  const fontsCss = await readFile(here('./assets/fonts/fonts.css'), 'utf8');
  const sources = await readFile(here('./assets/fonts/sources.json'), 'utf8');
  assert.ok(!/bodoni|f-serif/i.test(html + css + mobileCss + tokensCss + fontsCss + sources + JSON.stringify(prov)), 'Bodoni Moda retirada de marcado, estilos, tokens, fuentes y procedencia');
  assert.ok(!existsSync(here('./assets/fonts/bodoni-moda-italic-latin.woff2')) && !existsSync(here('./assets/fonts/OFL-bodonimoda.txt')), 'sin el archivo de Bodoni ni su licencia');
  assert.ok(existsSync(here('./assets/fonts/nunito-normal-latin.woff2')) && existsSync(here('./assets/fonts/OFL-nunito.txt')) && /font-family: 'Nunito'/.test(fontsCss), 'Nunito alojada con su licencia');
  assert.ok(html.includes('<link rel="preload" href="assets/fonts/nunito-normal-latin.woff2" as="font" type="font/woff2" crossorigin>') && html.includes('<link rel="preload" href="assets/fonts/archivo-normal-latin.woff2" as="font" type="font/woff2" crossorigin>'), 'se precargan las dos familias que pintan la primera vista');
  // Movimiento: rebote corto del icono al elegir, solo con movimiento.
  assert.ok(/@keyframes pick-pop \{ 50% \{ scale: 1\.12; \} \}/.test(flat) && /\.motion \.is-pop > :is\(\.ic, \.badge\) \{ animation: pick-pop var\(--dur-fast\) var\(--spring\); \}/.test(flat), 'rebote 1 → 1.12 → 1 con --spring y --dur-fast');
  assert.ok(/prefers-reduced-motion: reduce\) \{\s*\.motion \.is-pop > :is\(\.ic, \.badge\) \{ animation: none; \}/.test(flat), 'con «reducir movimiento» no hay rebote');
  assert.ok(!/\[aria-(pressed|checked)="true"\][^{]*\{[^}]*animation/.test(flatAll), 'el rebote no cuelga del estado: un guardado o un «Me interesa» restaurado al pintar no rebota');
  const appSrc = await readFile(here('./app.js'), 'utf8');
  assert.ok(!/data-magnetic/.test(html + appSrc) && !/--mx|--my/.test(css + appSrc), 'los botones ya no se desplazan tras el cursor: la única respuesta es hundirse');
});

// ---------------------------------------------------------------------------------------------
// Navegación y orden de la página (sistema táctil, 2026-11-11)

test('orden de la página: Inicio → manifiesto → La casa → Catálogo → Eventos y talleres → Novedades → llamado → Visita → pie, con los mismos id y tonos vecinos distintos', () => {
  const main = html.slice(html.indexOf('<main id="contenido">'), html.indexOf('</main>'));
  const blocks = [...main.matchAll(/\n {4}<(section|div|figure)([^>]*)>/g)].map(m => {
    const attrs = m[2];
    const id = (attrs.match(/\bid="([a-z]+)"/) || [])[1];
    const cls = (attrs.match(/\bclass="([a-z -]+)"/) || [])[1]?.split(' ')[0];
    return { key: id ? `#${id}` : `.${cls}`, tone: (attrs.match(/data-tone="([a-z]+)"/) || [])[1], theme: (attrs.match(/data-theme="([a-z]+)"/) || [])[1], cls };
  }).filter(b => b.key !== '#catalogo'); // #catalogo es la capa de exploración dentro de #libros (su sangría en el archivo es histórica)
  assert.deepEqual(blocks.map(b => b.key), ['#inicio', '.manifesto', '#casa', '#libros', '.wipe', '#cartelera', '#novedades', '.quote', '.call', '#visita'], 'bloques de primer nivel de <main>, en orden');
  assert.ok(html.indexOf('<footer class="ftr"') > html.indexOf('id="visita"'), 'el pie cierra');
  for (const id of ['inicio', 'casa', 'libros', 'catalogo', 'cartelera', 'novedades', 'visita']) assert.equal([...html.matchAll(new RegExp(`\\sid="${id}"`, 'g'))].length, 1, `#${id} existe una sola vez (los id no cambian)`);
  const libros = html.match(/<section id="libros"[\s\S]*?\n {4}<\/section>/)[0];
  assert.ok(libros.includes('id="catalogo"') && libros.indexOf('data-rail-chips') < libros.indexOf('id="ask-title"') && libros.indexOf('id="ask-title"') < libros.indexOf('id="catalogo"'), 'el Catálogo conserva sus capas en orden: colecciones, consulta y exploración');
  // Fondo real de cada bloque: Eventos pinta el campo turquesa sobre su tono claro; el resto, el fondo de su tono.
  const fill = b => (b.cls === 'bill' ? 'turq' : b.tone);
  const byKey = Object.fromEntries(blocks.map(b => [b.key, b]));
  const chapters = ['#casa', '#libros', '#cartelera', '#novedades', '.quote'];
  assert.deepEqual(chapters.map(k => fill(byKey[k])), ['mist', 'light', 'turq', 'mist', 'light'], 'La casa en bruma, Catálogo en blanco, Eventos en turquesa, Novedades en bruma y el cierre en blanco');
  for (let i = 1; i < chapters.length; i++) assert.notEqual(fill(byKey[chapters[i]]), fill(byKey[chapters[i - 1]]), `${chapters[i - 1]} y ${chapters[i]} no comparten fondo`);
  assert.equal(byKey['.wipe'].tone, byKey['#libros'].tone, 'la cortinilla arranca en el fondo del capítulo que deja (Catálogo) y termina en el turquesa de Eventos');
  assert.ok(/\.motion \.wipe \+ \.bill \{ padding-top: var\(--sec-sm\); \}/.test(css) && /<div class="wipe"[^>]*><div class="wipe-grid" data-wipe-grid><\/div><\/div>\s*<!--[^>]*-->\s*<section id="cartelera"/.test(html), 'la cortinilla sigue justo antes de Eventos');
  // La cabecera copia el tema de lo que pasa debajo.
  assert.deepEqual(blocks.map(b => b.theme), ['paper', 'paper', 'paper', 'paper', 'turq', 'turq', 'paper', 'paper', 'paper', 'paper'], 'cada bloque declara el tema que copia la cabecera');
  // Ritmo: Novedades usa los mismos escalones que los demás capítulos.
  assert.ok(/\.news \{[^}]*padding: var\(--sec-md\) var\(--gutter\); background: var\(--night\); \}/.test(css), 'Novedades: relleno de capítulo y fondo de su tono');
});

test('scroll-spy: Inicio abarca la entrada, el manifiesto y La casa; cada capítulo marca su casilla y su enlace; Visita no marca casilla y «Más» nunca es un lugar', async () => {
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(app.includes("const zones = [['#inicio', '#casa'], ['#libros'], ['#cartelera'], ['#novedades'], ['#visita']].map("), 'zonas en el orden de la página; Inicio va de #inicio al final de #casa');
  assert.ok(/zones\.filter\(z => z\.from\.offsetHeight && z\.to\.offsetHeight\)/.test(app), 'una sección que no existe (Novedades sin entradas) no tiene zona');
  assert.ok(/navLinks\.forEach\(a => \{ if \(a\.getAttribute\('href'\) === hash\) a\.setAttribute\('aria-current', 'true'\); else a\.removeAttribute\('aria-current'\); \}\);/.test(app) && /tabLinks\.forEach\(a => \{ if \(a\.getAttribute\('href'\) === hash\) a\.setAttribute\('aria-current', 'location'\); else a\.removeAttribute\('aria-current'\); \}\);/.test(app), 'la marca va por destino (href), no por posición: sirve con cuatro o cinco casillas');
  const tabbar = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  assert.ok(!/href="#visita"/.test(tabbar) && !/aria-current/.test(tabbar.match(/<button class="tab-menu"[\s\S]*?<\/button>/)[0]) && !/tab-menu[^;]*aria-current/.test(app), 'en Visita y el pie la barra no marca ninguna casilla; «Más» abre una hoja y no se marca');
  assert.ok(/tabLinks\.forEach\(a => a\.addEventListener\('click', dropHeaderForJump\)\);/.test(app), 'al saltar desde una casilla la cabecera no tapa el titular');
});
