// Comprobaciones del sitio (B.4 con el sistema «Itinerante Líquido», en la raíz del repo): node --test tests/site.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { readFile, access, readdir } from 'node:fs/promises';
import { pickBooks, chipNode, askLabel, askMessage, askUrl, coverflowPose, nearestIndex, captionOf, CF_GIRO } from '../rail.js';
import { toggleSaved, isSaved, savedIds, clearSaved, listMessage, listWaUrl, MAX_SAVED } from '../saved.js';
import { openingStatus, monterreyNow } from '../app.js';
import { newsPlan, newsEntries, isNew, validDay, statusLine, hintLine, isoDay, NEWS_SIZE, NEW_DAYS } from '../news.js';
import { shareName, initFeed, eventBadge, NO_DATE } from '../feed.js';
import { KINDS, validKind } from '../tag.js';
import { PAGE_SIZE, TONES, GENRE_ES, genreLabel, imageCover, coverFallback, priceLabel, splitTitle, titleSize, bookShareData, shareBook, coverTone, coverTones, coverLayout, COVER_LAYOUTS, score, filterBooks, sortBooks, facetCounts, facetView, FACET_LIMIT, FACET_FOLD_AT, suggest, relatedBooks, bookMessage, bookWaUrl, norm } from '../catalog.js';

const repo = new URL('../', import.meta.url);
const here = p => new URL(p, repo);
const readFileSync_ = p => readFileSync(new URL(p, repo), 'utf8');
const html = await readFile(here('./index.html'), 'utf8');
const css = await readFile(here('./style.css'), 'utf8');
const tokensCss = await readFile(here('./tokens.css'), 'utf8');
const mobileCss = await readFile(here('./mobile.css'), 'utf8');
const prov = JSON.parse(await readFile(here('./assets/provenance.json'), 'utf8'));
const data = JSON.parse(await readFile(here('./assets/data/catalog.json'), 'utf8'));
const portadas = JSON.parse(await readFile(here('./data/portadas.json'), 'utf8'));
const book = id => { const b = data.books.find(x => x.id === id); assert.ok(b, `el inventario trae ${id}`); return b; };
// ISBN-13: dígito de control (pesos 1 y 3 alternados).
const isbnOk = n => /^97[89]\d{10}$/.test(n) && (10 - [...n.slice(0, 12)].reduce((t, d, i) => t + Number(d) * (i % 2 ? 3 : 1), 0) % 10) % 10 === Number(n[12]);
// Medidas de un WebP (VP8, VP8L o VP8X) leídas de la cabecera, para comparar con cw/ch del catálogo.
function webpSize(buf) {
  assert.equal(buf.toString('ascii', 0, 4), 'RIFF'); assert.equal(buf.toString('ascii', 8, 12), 'WEBP');
  const kind = buf.toString('ascii', 12, 16);
  if (kind === 'VP8 ') return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff];
  if (kind === 'VP8L') { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >> 14) & 0x3fff) + 1]; }
  if (kind === 'VP8X') return [buf.readUIntLE(24, 3) + 1, buf.readUIntLE(27, 3) + 1];
  throw new Error(`WebP desconocido: ${kind}`);
}
// DOM mínimo para probar las portadas sin navegador: lo justo que usan imageCover y coverFallback.
function fakeDocument() {
  class El {
    constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.parent = null; this.attrs = {}; this.dataset = {}; this.cls = new Set(); this.textContent = ''; }
    get className() { return [...this.cls].join(' '); }
    set className(v) { this.cls = new Set(String(v).split(/\s+/).filter(Boolean)); }
    get classList() { const c = this.cls; return { add: (...x) => x.forEach(v => c.add(v)), remove: (...x) => x.forEach(v => c.delete(v)), contains: v => c.has(v) }; }
    setAttribute(k, v) { this.attrs[k] = String(v); }
    getAttribute(k) { return this.attrs[k] ?? null; }
    append(...kids) { for (const k of kids) { k.parent = this; this.children.push(k); } }
    remove() { if (this.parent) this.parent.children = this.parent.children.filter(c => c !== this); this.parent = null; }
    closest(sel) { const c = sel.slice(1); for (let n = this; n; n = n.parent) if (n.cls.has(c)) return n; return null; }
    querySelectorAll(sel) { const c = sel.slice(1), out = []; const walk = n => n.children.forEach(k => { if (k.cls.has(c)) out.push(k); walk(k); }); walk(this); return out; }
  }
  return { createElement: tag => new El(tag) };
}

// ---------------------------------------------------------------------------------------------
// Sistema «Itinerante Líquido» (vigente desde 2026-11-13): tokens, letra, controles, navegación, hojas y secciones.

const tokensJson = JSON.parse(await readFile(here('./design/tokens.json'), 'utf8'));
const LQ = tokensJson.themes.liquido;
const flat = s => s.replace(/\/\*[\s\S]*?\*\//g, '').replace(/\s+/g, ' ');
const cssFlat = flat(css);
const mobileFlat = flat(mobileCss);
const rule = (src, sel) => { const i = src.indexOf(`${sel} {`); assert.ok(i >= 0, `existe la regla ${sel}`); return src.slice(i, src.indexOf('}', i) + 1); };
// Contraste WCAG con canal alfa: el color de arriba se compone sobre el de abajo.
const rgba = hex => { const h = hex.replace('#', ''); return [0, 2, 4, 6].map(i => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255)).map((v, i) => (i === 3 ? v / 255 : v)); };
const over = (top, under) => { const [r, g, b, a] = rgba(top); const [R, G, B] = rgba(under); const m = (x, y) => Math.round(x * a + y * (1 - a)); return '#' + [m(r, R), m(g, G), m(b, B)].map(v => v.toString(16).padStart(2, '0')).join(''); };
const lumOf = hex => { const [r, g, b] = rgba(hex).slice(0, 3).map(c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
const contrast = (a, b) => { const [x, y] = [lumOf(a), lumOf(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

test('preguntar por la colección: rótulo y mensaje con el nombre del chip, y el enlace de WhatsApp codifica acentos y ampersand', () => {
  assert.equal(askLabel({ titulo: 'Poesía' }), 'Preguntar por poesía');
  assert.equal(askMessage({ titulo: 'Poesía' }), 'Hola, me gustaría preguntar por libros de poesía. ¿Qué me recomiendan?');
  const url = new URL(askUrl({ titulo: 'Ensayo & crónica' }));
  assert.equal(url.origin + url.pathname, 'https://wa.me/528180875940');
  assert.equal(url.searchParams.get('text'), 'Hola, me gustaría preguntar por libros de ensayo & crónica. ¿Qué me recomiendan?');
  // El marcado trae ya el enlace de la primera colección (sin esperar a rail.js) y el de «sin rumbo fijo», con su mensaje.
  const first = JSON.parse(readFileSync_('assets/data/collections.json')).collections[0];
  const ask = html.match(/<a class="btn btn--secundario" data-rail-ask href="([^"]+)"[^>]*><span data-rail-ask-label>([^<]+)<\/span>/);
  assert.ok(ask, 'el botón «Preguntar por {colección}» va bajo el carrusel');
  assert.equal(new URL(ask[1]).searchParams.get('text'), askMessage(first));
  assert.equal(ask[2], askLabel(first));
  const libre = html.match(/<a class="rail-libre" href="([^"]+)"[^>]*>([^<]+)<\/a>/);
  assert.ok(libre && libre[2] === 'Pide una recomendación por WhatsApp', 'el enlace de recomendación sin rumbo fijo');
  assert.equal(new URL(libre[1]).searchParams.get('text'), 'Hola, estoy buscando un libro y no sé por dónde empezar. ¿Me ayudan a elegir?');
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
  const ids = q => filterBooks(books, { q }).map(b => b.id);
  assert.deepEqual(ids('hipercodex'), ['hipercodex-emmanuel-vizcaya'], 'título sin acento');
  assert.deepEqual(ids('HIPERCÓDEX'), ['hipercodex-emmanuel-vizcaya'], 'título en mayúsculas y con acento');
  assert.deepEqual(ids('Lomelí'), ['perorata-luis-felipe-lomeli'], 'autor con acento');
  assert.deepEqual(ids('lomeli'), ['perorata-luis-felipe-lomeli'], 'autor sin acento');
  assert.deepEqual(ids('hojas fabre'), ['las-hojas-de-fabre-jesus-ferreiro'], 'todas las palabras deben aparecer');
  const fabre = book('las-hojas-de-fabre-jesus-ferreiro');
  assert.ok(isbnOk(fabre.n), 'el ISBN de la prueba es válido');
  assert.deepEqual(ids(fabre.n), [fabre.id], 'ISBN completo');
  assert.deepEqual(ids(fabre.n.slice(0, 12)), [fabre.id], 'ISBN a medias');
  const abismos = books.filter(b => b.p === 'Abismos Casa Editorial').map(b => b.id);
  assert.ok(abismos.length >= 10, 'Abismos Casa Editorial trae una buena parte del inventario');
  assert.deepEqual(ids('Abismos').sort(), abismos.sort(), 'editorial: exactamente sus libros');
  assert.deepEqual(ids('capitulo siete').sort(), books.filter(b => b.p === 'Capítulo Siete').map(b => b.id).sort(), 'editorial sin acento');
  assert.equal(filterBooks(books, { q: 'zzzxqv' }).length, 0);
  assert.equal(filterBooks(books, { q: 'Project Hail Mary' }).length, 0, 'nada del catálogo de prueba');
  const example = html.match(/<input id="cat-q"[^>]*placeholder="Ej\.: ([^"]+)"/)[1];
  assert.ok(filterBooks(books, { q: example }).length > 0, `el ejemplo del buscador (« ${example} ») encuentra un libro del inventario`);
  assert.equal(score(fabre, ''), 1);
  assert.ok(score(book('perorata-luis-felipe-lomeli'), 'perorata') > score(book('perorata-luis-felipe-lomeli'), 'lomeli'), 'el título pesa más que el autor');
});
test('catálogo: filtros combinados, conteo de facetas y orden', async () => {
  const books = data.books;
  const k = new Set(['literatura']);
  const lit = filterBooks(books, { k });
  assert.ok(lit.length > 0 && lit.every(b => b.k === 'literatura'));
  const both = filterBooks(books, { k: new Set(['literatura']), p: new Set(['Capítulo Siete']) });
  assert.ok(both.length > 0 && both.every(b => b.k === 'literatura' && b.p === 'Capítulo Siete'));
  const poesia = filterBooks(books, { g: new Set(['poesia']), p: new Set(['Capítulo Siete', 'Abismos Casa Editorial']) });
  assert.ok(poesia.length > 0 && poesia.every(b => b.g === 'poesia' && ['Capítulo Siete', 'Abismos Casa Editorial'].includes(b.p)), 'dentro de un grupo, cualquiera de las marcadas');
  const counts = facetCounts(books, { k }, 'p');
  assert.equal([...counts.values()].reduce((a, b) => a + b, 0), lit.length, 'las facetas suman el resultado');
  const own = facetCounts(books, { k }, 'k');
  assert.deepEqual([...own.keys()].filter(Boolean).sort(), ['literatura', 'pensamiento'], 'la faceta propia no se filtra a sí misma');
  assert.equal([...facetCounts(books, {}, 'g').keys()].filter(Boolean).length, Object.keys(data.subgenres).length, 'cada género del inventario es una opción');
  // La hoja no trae formato ni año: el grupo Formato no tiene opciones (renderFilters lo omite) y «Más recientes» no se ofrece.
  assert.equal([...facetCounts(books, {}, 'f').keys()].filter(Boolean).length, 0, 'sin formatos en la hoja');
  assert.ok(books.every(b => b.f == null && b.y == null && b.pg == null), 'nada se inventa: formato, año y páginas quedan en null');
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/\.filter\(\(\[v\]\) => v\)/.test(catalog) && /if \(!entries\.length\) continue;/.test(catalog), 'un grupo sin opciones no se dibuja (ni los valores vacíos)');
  assert.ok(!/data-cat-sort|cat-sort|Más recientes/.test(html + catalog), 'sin selector «Ordenar» (retirado el 2026-11-13): A–Z y, con búsqueda, relevancia');
  const az = sortBooks(books, 'az');
  assert.ok(az.every((b, i) => i === 0 || az[i - 1].t.localeCompare(b.t, 'es') <= 0));
  const byAuthor = sortBooks(books, 'autor');
  assert.ok(byAuthor.every((b, i) => i === 0 || byAuthor[i - 1].a.localeCompare(b.a, 'es') <= 0));
  assert.deepEqual(sortBooks(books, 'new').map(b => b.id), az.map(b => b.id), 'sin años, «recientes» no inventa un orden');
  const rel = sortBooks(filterBooks(books, { q: 'noche' }), 'rel', 'noche');
  assert.ok(rel.length >= 2 && rel.every((b, i) => i === 0 || score(rel[i - 1], 'noche') >= score(b, 'noche')), 'relevancia de mayor a menor');
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
  const sinGenero = data.books.find(x => !x.g);
  assert.ok(sinGenero, 'el inventario trae un libro sin género (fila incompleta de la hoja)');
  assert.deepEqual(relatedBooks(data.books, sinGenero), [], 'sin género no hay relacionados');
  assert.equal(bookMessage(sinGenero), `Hola, ¿tienen «${sinGenero.t}» de ${sinGenero.a}? Vi el título en su sitio.`, 'sin ISBN el mensaje no lo menciona');
});
test('catálogo: es el inventario de la librería (41 títulos), sin repetidos, con ISBN válidos, portadas registradas y nada de la muestra', async () => {
  assert.equal(data.meta.kind, 'inventario');
  assert.equal(data.books.length, 41);
  assert.equal(data.meta.count, 41);
  assert.equal(data.meta.currency, 'MXN');
  assert.ok(!('label' in data.meta), 'el inventario no lleva rótulo de muestra');
  const ids = data.books.map(b => b.id);
  assert.equal(new Set(ids).size, ids.length, 'ningún id repetido');
  assert.ok(ids.every(id => /^[a-z0-9]+(-[a-z0-9]+)*$/.test(id) && id.length <= 60), 'ids estables: minúsculas, sin acentos, hasta 60 caracteres');
  const isbns = data.books.map(b => b.n).filter(Boolean);
  assert.equal(new Set(isbns).size, isbns.length, 'ningún ISBN repetido');
  assert.ok(isbns.length >= 38, `casi todo el inventario trae ISBN (${isbns.length})`);
  for (const b of data.books) {
    assert.ok(b.n === null || isbnOk(b.n), `${b.id}: ISBN-13 con dígito de control inválido (${b.n})`);
    assert.ok(typeof b.t === 'string' && b.t.trim() && typeof b.a === 'string' && b.a.trim(), `${b.id}: título y autor`);
    assert.equal(b.lg, 'es');
    assert.ok(b.g === null || Object.hasOwn(data.subgenres, b.g), `${b.id}: género fuera del diccionario`);
    assert.ok(b.k === null || Object.hasOwn(data.categories, b.k), `${b.id}: categoría fuera del diccionario`);
    assert.ok(b.g === null || data.subgenres[b.g].c === b.k, `${b.id}: el género y la categoría coinciden`);
    assert.ok(b.pr === null || (Number.isInteger(b.pr) && b.pr > 0 && b.pr < 5000), `${b.id}: precio en pesos (${b.pr})`);
    assert.ok(b.s === null || (typeof b.s === 'string' && b.s.length >= 40), `${b.id}: sinopsis`);
    assert.ok(!('priceMxnCents' in b) && !('stockQty' in b) && !('stock' in b), `${b.id}: la existencia no se publica (se confirma por WhatsApp)`);
  }
  // Portadas: archivo local, registrado con su fuente, con las medidas reales (la tarjeta reserva su forma con width/height).
  const conPortada = data.books.filter(b => b.c);
  assert.equal(data.meta.covers, conPortada.length);
  assert.ok(conPortada.length >= 30, `la mayoría trae portada real (${conPortada.length})`);
  for (const b of conPortada) {
    assert.equal(b.c, `assets/img/portadas/${b.id}.webp`, `${b.id}: ruta de portada`);
    assert.ok(existsSync(here(`./${b.c}`)), `${b.id}: la portada existe en disco`);
    const reg = portadas[b.id];
    assert.ok(reg && ['Goodreads', 'Amazon'].includes(reg.fuente) && /^https:\/\//.test(reg.url) && reg.revisada, `${b.id}: portada registrada en data/portadas.json con fuente, URL y revisión`);
    assert.equal(reg.isbn ?? null, b.n, `${b.id}: el registro de la portada es del mismo ISBN`);
    assert.deepEqual(webpSize(await readFile(here(`./${b.c}`))), [b.cw, b.ch], `${b.id}: cw/ch son las medidas del archivo`);
    assert.ok(b.cw <= 600 && b.ch / b.cw > 1 && b.ch / b.cw < 2, `${b.id}: portada vertical de 600 px como máximo (${b.cw}×${b.ch})`);
  }
  for (const b of data.books.filter(x => !x.c)) assert.ok(b.cw === null && b.ch === null && !portadas[b.id], `${b.id}: sin portada no hay medidas ni registro`);
  const files = await readdir(here('./assets/img/portadas'));
  assert.deepEqual(files.sort(), conPortada.map(b => `${b.id}.webp`).sort(), 'ninguna portada huérfana en assets/img/portadas');
  assert.deepEqual(Object.keys(portadas).sort(), conPortada.map(b => b.id).sort(), 'data/portadas.json no registra libros que no estén en el catálogo');
  // Nada del catálogo de prueba (CSV de Amazon) queda en lo que carga el sitio.
  const titles = new Set(data.books.map(b => b.t));
  for (const t of ['The Let Them Theory', 'Project Hail Mary', 'Lessons in Chemistry', 'The Midnight Library', 'Spare']) assert.ok(!titles.has(t), `título de la muestra: ${t}`);
  assert.ok(!ids.some(id => id.startsWith('libro-')) && !Object.keys(data.subgenres).some(g => /^(non-)?fiction-/.test(g)), 'ni ids ni géneros de la muestra');
  const inv = JSON.parse(await readFile(here('./data/inventario-itinerante.json'), 'utf8'));
  assert.equal(inv.filas.length, data.books.length, 'la copia fiel de la hoja tiene un renglón por libro');
  assert.deepEqual(inv.filas.map(f => f.titulo), data.books.map(b => b.t), 'mismo orden y mismos títulos que la hoja');
});
test('recursos referenciados existen', async () => {
  const refs = [...html.matchAll(/(?:src|href)="(assets\/[^"]+)"/g)].map(m => m[1]);
  for (const b of data.books) if (b.c) refs.push(b.c); // b.c ya es la ruta desde la raíz (assets/img/portadas/…)
  for (const ref of new Set(refs)) await access(here(`./${ref}`));
});
test('procedencia: todo raster de assets/img y la secuencia tiene origen registrado; ningún rótulo se imprime', async () => {
  const kind = new Map();
  prov.real.forEach(f => kind.set(f.file, 'real'));
  prov.aiRecreation.forEach(f => kind.set(f.file, 'ai'));
  prov.brand.forEach(f => kind.set(f.file, 'brand'));
  const entries = await readdir(here('./assets/img'), { withFileTypes: true });
  for (const f of entries.filter(e => e.isFile())) assert.ok(kind.has(`img/${f.name}`), `sin procedencia: img/${f.name}`);
  assert.deepEqual(entries.filter(e => e.isDirectory()).map(e => e.name), ['portadas'], 'la única subcarpeta de assets/img es la de portadas');
  // Portadas de los libros: no son fotos de la casa; cada una registrada con su fuente (las mismas de data/portadas.json).
  assert.equal(prov.covers.dir, 'img/portadas/');
  assert.equal(prov.covers.registry, 'data/portadas.json');
  assert.match(prov.covers.rule, /Goodreads/);
  const covers = new Map(prov.covers.files.map(f => [f.file, f]));
  const onDisk = await readdir(here('./assets/img/portadas'));
  assert.equal(covers.size, onDisk.length, 'una entrada por portada');
  for (const f of onDisk) {
    const reg = covers.get(`img/portadas/${f}`);
    assert.ok(reg, `portada sin procedencia: img/portadas/${f}`);
    const src = portadas[reg.book];
    assert.ok(src && reg.source === src.fuente && reg.url === src.url && reg.isbn === (src.isbn ?? null), `img/portadas/${f}: la procedencia coincide con data/portadas.json`);
    assert.ok(!kind.has(`img/portadas/${f}`), 'una portada no se registra como foto de la casa');
  }
  assert.ok(!('sampleData' in prov) && /inventario-itinerante\.json/.test(prov.catalogData.origin), 'el origen del catálogo es la hoja de la librería');
  assert.equal(prov.aiRecreation.length, 0, 'no quedan recreaciones: todas las imágenes son fotografías de la casa');
  assert.ok(![...kind.keys()].some(k => k.startsWith('seq')) && !existsSync(here('./assets/seq')) && !existsSync(here('./assets/seq-m')), 'la secuencia de fotogramas generada se retiró');
  assert.ok(/<img class="entry-poster" src="assets\/img\/03-home-sala-central\.webp"/.test(html) && /srcset="assets\/img\/inicio-sala-m\.webp"/.test(html) && !/<section id="inicio"[^>]*data-seq/.test(html), 'el inicio es una fotografía fija (sin data-seq no hay recorrido por fotogramas)');
  assert.ok(!/data-kind="ai"/.test(html) && !/TOPICS|topic-layer/.test(html + readFileSync_('app.js')), 'el marcado declara solo fotografías (los temas de «Pregúntanos» se retiraron el 2026-11-13)');
  const stills = [...html.matchAll(/<li class="still">([\s\S]*?)<\/li>/g)].map(m => m[1]);
  assert.equal(stills.length, 6);
  for (const s of stills) {
    const file = s.match(/assets\/(img\/[^"]+)"/)[1];
    assert.ok(s.includes(`<figcaption data-kind="${kind.get(file) === 'real' ? 'real' : 'ai'}">`), `procedencia incorrecta en el marcado: ${file}`);
  }
  for (const f of ['libro-narrativa', 'libro-poesia', 'libro-ensayo', 'libro-cronica', 'libro-infantil', 'libro-libre']) if (existsSync(here(`./assets/img/${f}.webp`))) assert.equal(kind.get(`img/${f}.webp`), 'real', `la foto de estante ${f} (sin uso desde el 2026-11-13) sigue registrada como real`);
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
test('curaduría: sin relleno de maqueta ni elementos retirados', () => {
  for (const gone of ['entry-clock', 'entry-chapters', 'entry-bar', 'bill-state', 'ftr-fine', 'Higgsfield', 'Maqueta B.4', 'marquee', 'manifesto', 'wordmark', 'ftr-mark', 'class="wipe', 'class="progress', 'house-meter', 'class="stories', 'data-hint', 'sheet-menu', 'tab-menu', 'scenes-desktop',
    // Retirados el 2026-11-13 (crítica minimalista): cita, llamado, antetítulos, «Pregúntanos», recorrido, tarjeta que voltea, modo redes, «Me interesa», «Ordenar», «Categoría».
    'class="quote', 'class="call', 'call-title', 'sec-rotulo', 'class="ask', 'class="topic', 'data-composer', 'book-query', 'rail-trail', 'rail-stop', 'cf-progreso', 'rail-all', 'card-voltear', 'i-flip', 'data-d-redes', 'class="redes', 'data-interest', 'Me interesa', 'i-heart', 'data-cat-sort', 'ftr-id', 'ftr-route', 'bill-foot', 'bill-sub', 'cat-lede', 'Dominio público'])
    assert.ok(!html.includes(gone), `sigue en el marcado: ${gone}`);
  assert.ok(!existsSync(here('./scenes-desktop.js')) && !existsSync(here('./tools/qa/desk.mjs')), 'el módulo de escritorio (fotogramas y cortinilla) se retiró con su arnés');
  const labels = [...html.matchAll(/class="bill-detail">[\s\S]*?class="btn btn--secundario bill-wa"[^>]*aria-label="([^"]+)"/g)].map(m => m[1].trim());
  assert.equal(labels.length, 3);
  assert.equal(new Set(labels).size, labels.length, 'los CTA de Cartelera son distintos');
});
test('curaduría: los esqueletos ocupan el lugar exacto del contenido y no se animan', async () => {
  assert.equal([...html.matchAll(/class="card-item card--sk"/g)].length, Math.min(PAGE_SIZE, data.books.length), 'un esqueleto por tarjeta de la primera página (hoy, los 41 títulos)');
  assert.ok(/\.rail-item \{ --card-h: 150cqw; \}/.test(css) && /\.card-item \{ --card-h: calc\(150cqw \+ 80px\); \}/.test(css) && /:is\(\.rail-item, \.card-item\) \.card \{ min-height: var\(--card-h\)/.test(css), 'tarjeta y esqueleto comparten una sola regla de alto');
  assert.ok(!/class="sk-line/.test(/data-rail-track[\s\S]*?<\/ul>/.exec(html)[0]), 'el esqueleto del carrusel es solo la portada');
  assert.ok(/class="card-item card--sk" aria-hidden="true"><span class="card"><span class="cover"><\/span><span class="card-t">&nbsp;<\/span><span class="card-m">&nbsp;<\/span><\/span><\/li>/.test(html) && /\.card-t \{[^}]*min-height: 2lh;/.test(css), 'el esqueleto de la rejilla lleva los renglones del título (dos, reservados) y de «autor · precio»');
  assert.ok(/data-rail-chips>(<span class="sk-chip" aria-hidden="true"><\/span>){3,}<\/div>/.test(html), 'el esqueleto del carrusel reserva la fila de chips');
  const reserved = html.match(/data-rail-chips>((?:<span class="sk-chip" aria-hidden="true"><\/span>)+)<\/div>/)[1].split('sk-chip').length - 1;
  assert.equal(reserved, JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8')).collections.length, 'un chip de esqueleto por colección');
  assert.ok(/\.sk-chip \{[^}]*height: var\(--alto-md\);[^}]*border-radius: var\(--radio-pildora\)/.test(css), 'el esqueleto del chip es la misma píldora de 48 px: la fila no cambia de alto al pintar');
  assert.ok(/data-cat-grid aria-busy="true"/.test(html));
  assert.ok(/\.card--sk/.test(css));
  assert.ok(!/sk-sweep/.test(css + mobileCss), 'los esqueletos no se animan (una sola regla para móvil y escritorio)');
  assert.ok(!/(sk-line|card--sk|still-img|frame-clip|topic-layer|bill-layer)[^{}]*::before[^{}]*\{[^}]*animation/.test(css + mobileCss), 'ningún esqueleto ni marco de foto declara animación');
});
test('tokens: el CSS generado está al día y style.css no redeclara colores en :root', () => {
  assert.ok(html.indexOf('href="tokens.css"') < html.indexOf('href="style.css"'), 'tokens.css va antes que style.css');
  assert.ok(!/:root\s*\{[^}]*--(night|bone|tungsten|turq|terra|paper)\b/.test(css), 'colores solo en tokens.css');
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
  const rows = suggest(data.books, 'car').filter(s => s.kind === 'Autor');
  assert.ok(rows.length >= 3, `varios autores con «car» (${rows.length})`);
  const starts = s => { const a = norm(s.text); return a.startsWith('car') || a.includes(' car'); };
  const firstMid = rows.findIndex(s => !starts(s));
  assert.ok(firstMid > 0, 'hay prefijos (Carlos) y al menos una coincidencia interna (Huáscar) que prueban el orden');
  assert.ok(rows.slice(firstMid).every(s => !starts(s)), 'ningún prefijo detrás de una coincidencia interna');
  assert.ok(rows.some(s => s.text === 'Huáscar Robles'), 'la coincidencia interna se encuentra sin acento');
  assert.deepEqual(suggest(data.books, 'lomeli').filter(s => s.kind === 'Autor').map(s => s.text), ['Luis Felipe Lomelí'], 'el autor se sugiere con su acento original');
  assert.ok(suggest(data.books, 'abismos').some(s => s.kind === 'Editorial' && s.text === 'Abismos Casa Editorial'), 'la editorial también se sugiere');
});
test('portadas: una sola familia visual, con el tono por categoría y por título', async () => {
  const warm = new Set(TONES.fiction), cool = new Set(TONES['non-fiction']);
  const family = b => (b.k === 'literatura' ? warm : cool); // una fila sin categoría cae a la familia fría, como coverTone
  assert.deepEqual([...warm, ...cool].sort(), [0, 1, 2, 3, 4, 5, 6, 7, 8, 9], 'diez tonos, cada uno en una sola familia');
  assert.equal(TONES.literatura, TONES.fiction, 'literatura usa la familia cálida');
  assert.equal(TONES.pensamiento, TONES['non-fiction'], 'pensamiento usa la familia fría');
  assert.ok(Object.keys(data.categories).every(k => TONES[k]), 'toda categoría del inventario tiene familia (ninguna cae por descuido a la de respaldo)');
  for (const b of data.books) {
    assert.ok(b.c === null || /^assets\/img\/portadas\/[a-z0-9-]+\.webp$/.test(b.c), `${b.id}: la portada es un WebP local (nunca SVG ni URL externa)`);
    assert.ok(family(b).has(coverTone(b)), `tono fuera de su familia: ${b.id}`);
  }
  const a = data.books.find(b => b.k === 'literatura');
  assert.equal(coverTone(a), coverTone({ ...a }), 'el mismo libro da siempre el mismo tono');
  assert.equal(coverTone(a), coverTone({ ...a, g: 'otro-genero' }), 'el tono sale del título, no del género');
  // La familia grande (literatura) usa sus cinco tonos; la pequeña (pensamiento, unos pocos títulos) al menos tres.
  const used = k => new Set(data.books.filter(b => b.k === k).map(coverTone));
  assert.deepEqual([...used('literatura')].sort(), [...warm].sort(), 'literatura usa sus cinco tonos');
  assert.ok(used('pensamiento').size >= 3, `pensamiento usa ${used('pensamiento').size} tonos (mínimo 3)`);
  // Cada colección del carrusel muestra al menos tres tonos distintos, cada portada en la familia de su libro.
  const { collections } = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  for (const col of collections) {
    const books = pickBooks(data.books, col);
    assert.ok(books.length >= 8 && books.length <= 12, `${col.id}: entre 8 y 12 libros (${books.length})`);
    const tones = new Set(books.map(coverTone));
    assert.ok(tones.size >= 3, `${col.id}: ${tones.size} tonos (mínimo 3)`);
    books.forEach(b => assert.ok(family(b).has(coverTone(b)), `${col.id}: tono de ${b.id} fuera de su familia`));
  }
});
test('portadas: en cada colección no hay vecinas del mismo tono, ningún tono pasa de ⌈n/5⌉ + 1 y la composición varía', async () => {
  const { collections } = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  assert.equal(collections.length, 3);
  const warm = new Set(TONES.fiction), cool = new Set(TONES['non-fiction']);
  const family = b => (b.k === 'literatura' ? warm : cool); // una fila sin categoría cae a la familia fría, como coverTone
  const light = new Set([6, 7, 8, 9]);
  for (const col of collections) {
    const books = pickBooks(data.books, col);
    const all = filterBooks(data.books, { q: '', k: new Set(col.filtro.k ?? []), g: new Set(col.filtro.g ?? []), f: new Set(), p: new Set(col.filtro.p ?? []) });
    assert.equal(books.length, Math.min(12, all.length), `${col.id}: todos los libros de su filtro, hasta 12`);
    const tones = coverTones(books);
    assert.equal(tones.length, books.length);
    for (let i = 1; i < tones.length; i++) assert.notEqual(tones[i], tones[i - 1], `${col.id}: las portadas ${i} y ${i + 1} repiten tono`);
    const count = new Map();
    for (const t of tones) count.set(t, (count.get(t) ?? 0) + 1);
    const cap = Math.ceil(books.length / 5) + 1;
    assert.ok(Math.max(...count.values()) <= cap, `${col.id}: un tono pasa de ${cap} de ${books.length} (${[...count]})`);
    assert.ok(count.size >= 3, `${col.id}: ${count.size} tonos (mínimo 3)`);
    assert.ok(tones.some(t => light.has(t)) && tones.some(t => !light.has(t)), `${col.id}: mezcla portadas claras y oscuras (no un muro de marrones)`);
    assert.ok(!tones.slice(3).every((t, i) => t === tones[i]), `${col.id}: el reparto no es un ciclo estricto de periodo 3`);
    for (let i = 2; i < tones.length; i++) assert.ok(tones[i] !== tones[i - 2], `${col.id}: las portadas ${i - 1} y ${i + 1} repiten tono (A-B-A)`);
    tones.forEach((t, i) => assert.ok(family(books[i]).has(t), `${col.id}: tono ${t} fuera de la familia de ${books[i].id}`));
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
test('portada real: la imagen va sin alt, título y autor como texto oculto (nombre accesible) y, si falla, vuelve la tipográfica', async () => {
  const fabre = book('las-hojas-de-fabre-jesus-ferreiro');
  const prev = globalThis.document;
  globalThis.document = fakeDocument();
  try {
    const holder = imageCover(fabre, 3);
    assert.ok(holder.cls.has('cover') && holder.cls.has('cover--img') && holder.cls.has('tone-3') && holder.dataset.coverTone === 3, 'portada con su tono (fondo mientras carga y respaldo)');
    const [img, t, a] = holder.children;
    assert.equal(img.tagName, 'IMG');
    assert.equal(img.src, fabre.c);
    assert.equal(img.alt, '', 'la imagen es decorativa: el nombre lo da el texto');
    assert.equal(img.loading, 'lazy');
    assert.equal(img.decoding, 'async');
    assert.deepEqual([img.width, img.height], [fabre.cw, fabre.ch], 'medidas reales: la tarjeta no salta al cargar');
    assert.deepEqual([t.textContent, a.textContent], [fabre.t, fabre.a], 'título y autor dentro de la portada');
    assert.ok(t.cls.has('cover-title') && t.cls.has('sr-only') && a.cls.has('cover-author') && a.cls.has('sr-only'), 'ocultos a la vista, no al lector de pantalla');
    assert.ok(t.getAttribute('aria-hidden') === null && a.getAttribute('aria-hidden') === null, 'en la tarjeta son el nombre accesible del botón');
    const quiet = imageCover(fabre, 3, { named: false, eager: true });
    assert.equal(quiet.children[0].loading, 'eager');
    assert.ok(quiet.children.slice(1).every(s => s.getAttribute('aria-hidden') === 'true'), 'en la ficha (con encabezado propio) el texto de la portada no se repite al lector');
    const noSize = imageCover({ ...fabre, cw: null, ch: null }, 3).children[0];
    assert.ok(noSize.width === undefined && noSize.height === undefined, 'sin medidas no se inventan');
    // Si la imagen falla: tipográfica, con el texto a la vista, sin imagen; una segunda llamada no hace nada.
    coverFallback(img);
    assert.ok(holder.cls.has('cover--blank') && !holder.cls.has('cover--img'), 'vuelve a la portada tipográfica');
    assert.ok(!holder.children.some(c => c.tagName === 'IMG'), 'la imagen rota sale');
    assert.ok(holder.children.every(c => !c.cls.has('sr-only')), 'título y autor a la vista');
    assert.equal(img.dataset.failed, '1');
    coverFallback(img);
    assert.equal(holder.children.length, 2, 'idempotente');
  } finally {
    globalThis.document = prev;
  }
  const [cat, rail] = await Promise.all(['catalog.js', 'rail.js'].map(f => readFile(here(`./${f}`), 'utf8')));
  assert.ok(/document\.addEventListener\('error', e => \{ if \(e\.target instanceof HTMLImageElement && e\.target\.closest\('\.cover--img'\)\) coverFallback\(e\.target\); \}, true\)/.test(cat), 'un solo oyente (en captura) atiende las portadas rotas de la rejilla, el carrusel, Novedades y la ficha');
  assert.ok(/return b\.c \? imageCover\(b, tone, \{ named \}\) : blankCover/.test(cat) && /if \(b\.c\) cover = imageCover\(b, tone\);/.test(rail), 'rejilla, ficha y carrusel usan la portada real cuando existe');
  assert.ok(/\.cover--img img \{ position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; object-position: 50% 0; \}/.test(css) && /\.cover \{[^}]*aspect-ratio: 2 \/ 3;/.test(css), 'la imagen llena la portada 2:3 sin deformarla (object-fit) y, si sobra alto, se recorta abajo: el título de la portada queda a la vista');
  assert.ok(/\.sr-only \{[^}]*clip: rect\(0 0 0 0\)/.test(css), 'sr-only existe');
});
test('ficha: sinopsis y precio de la hoja de la librería; sin dato, sin renglón', async () => {
  // Títulos del inventario: subtítulo tras «: » en su renglón y un escalón menos para los largos (ninguna palabra partida a 320 px; tools/qa/ficha.mjs lo mide).
  assert.deepEqual(splitTitle('Hipercódex: Ensayo poético hiperbólico'), { main: 'Hipercódex', sub: 'Ensayo poético hiperbólico' });
  assert.deepEqual(splitTitle('¿Cuánto ha visto el hombre?'), { main: '¿Cuánto ha visto el hombre?', sub: '' });
  assert.deepEqual(splitTitle(': raro'), { main: ': raro', sub: '' }, 'sin título antes de los dos puntos no hay subtítulo');
  assert.equal(titleSize('Polvo'), 'base');
  assert.equal(titleSize('Hipercódex', 'Ensayo poético hiperbólico'), 'long', '«Hipercódex:» con su signo ya no cabe');
  assert.equal(titleSize('Acaso un descubrimiento a mitad de la noche'), 'long');
  assert.equal(titleSize('Las hojas de Fabre'), 'base');
  assert.equal(titleSize('Rito de iniciación'), 'long', 'una palabra de 10 letras ya no cabe a 28 px en 150 px');
  const catSrc = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/h\.replaceChildren\(\`\$\{main\}: \`, el\('span', \{ class: 'drawer-sub' \}, sub\)\)/.test(catSrc) && /h\.classList\.toggle\('is-long', titleSize\(main, sub\) === 'long'\)/.test(catSrc), 'el encabezado sigue siendo el título completo (nombre del diálogo) con el subtítulo dentro');
  assert.ok(/\.drawer h3\.is-long \{ font-size: clamp\(17px, 12\.5cqi, 22px\); \}/.test(mobileCss) && /\.drawer-head \{[^}]*container-type: inline-size;/.test(css), 'el título largo se mide contra su columna, entre dos escalones de la escala (Headline y Title 2)');
  assert.equal(priceLabel(250), '$250 MXN');
  assert.equal(priceLabel(1200), '$1,200 MXN', 'miles con coma (es-MX)');
  assert.equal(priceLabel(null), null);
  assert.equal(priceLabel(undefined), null);
  assert.equal(priceLabel(0), null, 'un cero no es un precio');
  assert.equal(priceLabel('250'), null, 'solo números');
  const drawer = html.match(/<dialog[^>]*id="cat-drawer"[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<dl class="drawer-facts" data-d-facts><\/dl>\s*<div class="drawer-about" data-d-synopsis-wrap hidden>\s*<h4>Sinopsis<\/h4>\s*<p class="drawer-synopsis" data-d-synopsis><\/p>\s*<\/div>\s*<div class="drawer-ask">[\s\S]*?<\/div>\s*<div class="drawer-related"/.test(drawer), 'la sinopsis, con su encabezado, va bajo la ficha técnica y antes del mensaje y de «Del mismo género», oculta hasta que haya texto');
  assert.ok(!/order: \d/.test(rule(cssFlat, '.drawer-facts')) && drawer.indexOf('drawer-foot') > drawer.indexOf('data-d-related'), 'el orden visual es el del documento; las acciones («Preguntar por WhatsApp», «Cómo llegar») van fijas al pie, siempre en el primer pliegue');
  const cat = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/\$\('\[data-d-synopsis\]', drawer\)\.textContent = b\.s \|\| '';/.test(cat) && /\$\('\[data-d-synopsis-wrap\]', drawer\)\.hidden = !b\.s;/.test(cat), 'sinopsis del libro; sin sinopsis el bloque (y su encabezado) no ocupa sitio');
  assert.ok(/\.\.\.row\('Editorial', b\.p\), \.\.\.row\('Precio', priceLabel\(b\.pr\)\)/.test(cat) && /function row\(k, v\) \{ return v \? /.test(cat), 'precio justo después de la editorial; sin precio, sin renglón');
  assert.ok(/\.drawer-synopsis \{ max-width: 68ch; margin: 0; font: var\(--t-cuerpo\); color: var\(--tinta\); \}/.test(cssFlat) && /\.drawer \{[^}]*color: var\(--tinta\);[^}]*background: var\(--vidrio-hoja\);/.test(cssFlat), 'sinopsis en Body con medida de lectura y la tinta sobre el vidrio de hoja');
  assert.ok(!/[Ee]xistencia|[Dd]isponible|[Aa]gotado|stockQty/.test(cat), 'la ficha no promete existencias');
  assert.ok(data.books.filter(b => b.s).length >= 35 && data.books.filter(b => b.pr).length >= 40, 'casi todo el inventario trae sinopsis y precio');
});
test('portadas: la ficha repite el tono de la tarjeta pulsada y la composición vive en CSS', async () => {
  const [cat, rail, news] = await Promise.all(['catalog.js', 'rail.js', 'news.js'].map(f => readFile(here(`./${f}`), 'utf8')));
  assert.ok(/data-cover-tone/.test(cat) && /dataset\.coverTone/.test(cat) && /dataset\.coverTone/.test(rail), 'la tarjeta guarda su tono');
  assert.ok(/openBook\(id, \{ trigger, tone \} = \{\}\)/.test(cat) && /cover\(b, tone\)/.test(cat), 'la ficha usa el tono recibido');
  assert.ok(/iti:open-book[\s\S]{0,160}tone: toneOf\(card\)/.test(rail), 'el carrusel manda el tono con la petición');
  assert.ok(/coverTones\(list\)/.test(rail) && /coverTones\(plan\.books\)/.test(news), 'carrusel y Novedades reparten tonos por lista');
  for (let i = 1; i < COVER_LAYOUTS; i++) assert.ok(css.includes(`[data-cover-layout="${i}"]`), `falta la composición ${i}`);
  assert.ok(!/data-cover-layout[^{}]*\{[^}]*(color|background)\s*:/.test(css), 'la composición no toca color');
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
    for (const ok of ['/', '/index.html', '/tokens.css', '/style.css', '/mobile.css', '/app.js', '/catalog.js', '/motion.js', '/Logo.png', '/Logo.webp', '/assets/data/catalog.json', '/assets/js/boot.js', '/assets/fonts/fonts.css', '/assets/fonts/inter-latin-opsz-normal.woff2']) {
      assert.equal(await status(ok), 200, ok);
    }
    for (const no of ['/package.json', '/tests/site.test.mjs', '/docs/B4-README.md', '/design/tokens.json', '/src/ai/iti-ia.ts', '/worker/index.ts', '/data/taxonomy.controlled.json', '/node_modules/tsx/package.json', '/_archive/models/higgsfield-d599d36a/index.html', '/assets/provenance.json', '/assets/fonts/sources.json', '/assets/fonts/OFL-inter.txt', '/scenes-desktop.js', '/assets/..%5C..%5Cpackage.json', '/assets/%2e%2e/package.json']) {
      assert.equal(await status(no), 404, no);
    }
    const res = await fetch(`${base}/index.html`);
    assert.match(res.headers.get('content-security-policy'), /default-src 'self'/);
    assert.equal(res.headers.get('content-encoding'), 'gzip', 'comprime el texto como Cloudflare');
  } finally { server.closeAllConnections(); await new Promise(r => server.close(r)); }
});
test('carrusel de libros: marcado accesible, sin autoplay, publicable y alimentado por colecciones', async () => {
  const rail = html.match(/<div class="rail" data-rail[\s\S]*?data-rail-live><\/p>\s*<\/div>/)[0];
  assert.ok(/data-rail-viewport[^>]*role="region"[^>]*aria-roledescription="carrusel"/.test(rail) || /role="region" aria-roledescription="carrusel"[^>]*data-rail-viewport/.test(rail), 'región con rol de carrusel');
  assert.ok(/aria-label="Libro anterior"/.test(rail) && /aria-label="Libro siguiente"/.test(rail) && !/data-rail-viewport[^>]*tabindex|tabindex[^>]*data-rail-viewport/.test(rail), 'flechas con nombre; la parada de tabulador es la portada del centro (no la ventana del carrusel)');
  assert.ok(/aria-live="polite" data-rail-live/.test(rail), 'aviso al cambiar de colección');
  assert.ok(/html:not\(\.js\) \.rail \{?[^}]*display: none|\.rail\[hidden\], html:not\(\.js\) \.rail \{ display: none; \}/.test(css), 'sin JS no se muestra');
  assert.ok(/scroll-snap-type: x mandatory/.test(css) && !/rail[^{]*\{[^}]*animation/.test(css), 'snap y sin animación automática');
  assert.ok(/<div class="cf-pie">\s*<button class="btn btn--secundario btn--icono rail-btn"[^>]*data-rail-prev/.test(rail) && !/\.rail-ctrl/.test(css), 'flechas de 48 px a los lados del título del libro del centro, en todo ancho (alternativa de un toque al deslizar, WCAG 2.5.7)');
  const app = await readFile(new URL('../app.js', import.meta.url), 'utf8');
  assert.ok(/import\('\.\/rail\.js'\)/.test(app) && !/^import .*rail\.js/m.test(app), 'se carga bajo demanda');
  const railJs = await readFile(new URL('../rail.js', import.meta.url), 'utf8');
  assert.ok(/card\.focus\(\{ preventScroll: true \}\)/.test(railJs) && /n\.querySelector\('\.card'\)\.tabIndex = k === i \? 0 : -1/.test(railJs), 'teclado: las flechas mueven el centro y el foco (sin que el navegador desplace la portada enfocada por su cuenta)');
  const cols = JSON.parse(await readFile(new URL('../assets/data/collections.json', import.meta.url), 'utf8'));
  const sample = JSON.parse(await readFile(new URL('../assets/data/catalog.json', import.meta.url), 'utf8'));
  assert.equal(cols.meta.kind, 'inventario');
  assert.ok(!('label' in cols.meta), 'sin rótulo de muestra');
  assert.deepEqual(cols.collections.map(c => c.id), ['narrativa', 'poesia', 'ensayo'], 'tres colecciones del inventario');
  for (const c of cols.collections) {
    const list = pickBooks(sample.books, c);
    assert.ok(list.length >= 3 && list.length <= 12, `${c.id}: entre 3 y 12 libros (una parada con uno o dos no es colección)`);
    assert.ok(list.every(b => (c.filtro.g ?? []).includes(b.g)), `${c.id}: solo libros de sus géneros`);
    assert.deepEqual(list.map(b => b.t), [...list.map(b => b.t)].sort((a, b) => a.localeCompare(b, 'es')), `${c.id}: orden determinista por título`);
  }
  const ids = [sample.books[7].id, sample.books[3].id, 'no-existe', sample.books[9].id];
  assert.deepEqual(pickBooks(sample.books, { ids }).map(b => b.id), [ids[0], ids[1], ids[3]], 'una lista curada respeta el orden y omite lo que no existe');
  assert.equal(pickBooks(sample.books, { ids: sample.books.map(b => b.id) }).length, 12, 'tope de 12');
});

// ---------- Recorrido, eventos y filtros (sistema táctil) ----------
test('chips de colección (crítica minimalista del 2026-11-13): una fila Narrativa · Poesía · Ensayo sobre el carrusel, sin recorrido, progreso ni palomitas de «hojeada»', async () => {
  const railJs = await readFile(here('./rail.js'), 'utf8');
  const cols = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8')).collections;
  assert.deepEqual(cols.map(c => c.titulo), ['Narrativa', 'Poesía', 'Ensayo'], 'tres colecciones, en el orden de la fila');
  assert.ok(cols.every(c => !('icono' in c) && !('tema' in c)), 'sin icono de parada ni tema de «Pregúntanos»: una colección es su nombre, su nota y su filtro');
  assert.ok(/<div class="rail-chips" role="radiogroup" aria-label="Colección" data-rail-chips>/.test(html), 'la fila es un radiogroup con nombre');
  assert.ok(/make\('button', 'chip rail-chip', col\.titulo\)/.test(railJs) && /btn\.setAttribute\('role', 'radio'\)/.test(railJs) && /btn\.setAttribute\('aria-checked', 'false'\)/.test(railJs), 'cada chip es un botón role="radio" cuyo texto es su nombre');
  assert.ok(/\{ ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 \}\[e\.key\]/.test(railJs) && /c\.tabIndex = c === e\.target \? 0 : -1/.test(railJs) && /c\.tabIndex = i \? -1 : 0/.test(railJs), 'flechas y un solo punto de tabulación (roving tabindex)');
  assert.ok(/\.chip\[aria-checked="true"\]::before \{/.test(css) && /\.chip, \.cat-filters-btn, \.cat-chip \{[^}]*min-height: var\(--alto-md\);/.test(css), 'chip de 48 px; el elegido, primario con la palomita (forma y color)');
  // Lo retirado no vuelve: ni el recorrido (paradas, conectores, progreso, «N de M paradas hojeadas», clave iti-recorrido-v1) ni los temas.
  for (const gone of ['trailProgress', 'iti-recorrido-v1', 'paradas hojeadas', 'stopNode', 'rail-stop', 'rail-chip-done', 'iti:topic', 'cf-progreso', 'dotsEl']) assert.ok(!railJs.includes(gone) && !html.includes(gone), `retirado: ${gone}`);
  assert.ok(!/rail-stop|rail-trail|--stop|--zig|\.topic\b|topic-layer|composer|cf-progreso|rail-all/.test(css + mobileCss), 'sin CSS del recorrido, de «Pregúntanos», de los puntos ni de «Ver todo el catálogo»');
  // Bajo el carrusel: «Preguntar por {colección}» cambia con el chip en el mismo fotograma; una sola región viva anuncia la colección.
  assert.ok(/ask\.href = askUrl\(col\);/.test(railJs) && /askLabelEl\.textContent = askLabel\(col\);/.test(railJs) && railJs.indexOf('ask.href = askUrl(col)') < railJs.indexOf('await afterPaint()'), 'el botón de pregunta sigue al chip antes de repintar las portadas');
  const rail = html.match(/<div class="rail" data-rail[\s\S]*?data-rail-live><\/p>\s*<\/div>/)[0];
  assert.equal((rail.match(/aria-live=/g) || []).length, 1, 'una sola región viva en el carrusel');
  assert.ok(rail.indexOf('data-rail-chips') < rail.indexOf('data-rail-note') && rail.indexOf('data-rail-note') < rail.indexOf('data-rail-viewport') && rail.indexOf('data-rail-viewport') < rail.indexOf('cf-pie') && rail.indexOf('cf-pie') < rail.indexOf('data-rail-ask'), 'orden: chips, nota, carrusel, pie del libro, preguntar');
  assert.ok(/live\.textContent = `\$\{col\.titulo\}: \$\{list\.length\} libros\.`/.test(railJs), 'al elegir un chip la región viva dice la colección y cuántos libros trae');
  const visible = [html.replace(/<!--[\s\S]*?-->/g, ''), railJs.replace(/\/\/[^\n]*/g, '')].join('\n');
  assert.ok(!/\b(puntos?|puntaje|rachas?|retos?|niveles|medallas?|logros?|recompensas?)\b/i.test(visible.replace(/punto de (encuentro|tabulación)/gi, '')), 'sin mecánicas de juego');
  // Rebote solo por toque y solo al guardar (pickPop); ni chips ni Eventos lo usan.
  const motionJs = await readFile(here('./motion.js'), 'utf8');
  const [feedJs, savedJs] = await Promise.all(['feed.js', 'saved.js'].map(f => readFile(here('./' + f), 'utf8')));
  assert.ok(/export function pickPop\(el\) \{\s*if \(typeof document === 'undefined' \|\| !document\.documentElement\.classList\.contains\('motion'\)\) return;\s*el\.classList\.add\('is-pop'\);/.test(motionJs), 'pickPop: solo con movimiento');
  assert.ok(!/pickPop/.test(railJs + feedJs), 'ni los chips ni Eventos rebotan');
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
  assert.ok(/\.badge--quiet \{ background: var\(--fondo-3\); color: var\(--tinta-2\); \}/.test(css), 'insignia callada (fondo-3 con tinta-2, ≥ 4.5:1 en ambos temas)');
  // initFeed pinta el estado desde el atributo.
  const mk = fecha => { const el = { textContent: '', quiet: null, classList: { toggle(c, on) { el.quiet = on; } } }; return { dataset: { fecha }, querySelector: () => el, el }; };
  const future = `${new Date().getUTCFullYear() + 1}-06-15`;
  const cards = [mk(undefined), mk(future), mk('2020-01-01')];
  globalThis.document = { querySelectorAll: sel => (sel === '.bill-item' ? cards : []) };
  try { initFeed(); } finally { delete globalThis.document; }
  assert.deepEqual(cards.map(c => [c.el.textContent === NO_DATE, c.el.quiet]), [[true, true], [false, false], [true, true]], 'sin atributo o con fecha vencida: «Propuesta · sin fecha»; con fecha vigente, la fecha en la insignia común');
  assert.match(cards[1].el.textContent, /^(Lun|Mar|Mié|Jue|Vie|Sáb|Dom) 15 jun \d{4}$/);
});
test('filtros de Explorar: Género y Editorial (sin «Categoría»); un grupo solo se pliega desde 8 opciones, a 5, con su «Ver las N» / «Ver menos»', async () => {
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  const entries = [['a', 30], ['b', 20], ['c', 10], ['d', 9], ['e', 8], ['f', 7], ['g', 6], ['h', 1]];
  const vals = list => list.map(([v]) => v);
  assert.equal(FACET_LIMIT, 5);
  assert.equal(FACET_FOLD_AT, 8);
  let v = facetView(entries.slice(0, 7));
  assert.ok(!v.foldable && v.top.length === 7 && v.rest.length === 0, 'con 7 o menos no hay nada que plegar (los 6 géneros, todos a la vista)');
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
  for (const dim of ['g', 'f', 'p']) {
    const all = [...facetCounts(sample, {}, dim).entries()].filter(([x]) => x).sort((a, b) => b[1] - a[1]);
    const closed = facetView(all), open = facetView(all, new Set(), true);
    assert.ok(closed.top.length <= FACET_FOLD_AT - 1 && closed.rest.length === 0, `${dim}: plegado, 7 como máximo`);
    if (all.length < FACET_FOLD_AT) assert.equal(closed.top.length, all.length, `${dim}: con menos de 8 opciones, todas a la vista`);
    assert.equal(open.top.length + open.rest.length, all.length, `${dim}: abierto, todas`);
    shown += closed.top.length;
  }
  assert.ok(shown <= 12, `el panel abre con ${shown} opciones a la vista (6 géneros y 4 editoriales)`);
  assert.ok(!/label: 'Categoría'/.test(catalog) && !/row\('Categoría'/.test(catalog), 'sin el grupo «Categoría» (sale del género) ni su fila en la ficha (retirados el 2026-11-13)');
  // El botón: uno por grupo plegable, con aria-expanded y aria-controls, entre las primeras opciones y el resto; el foco se queda en él.
  assert.ok(/el\('button', \{ type: 'button', class: 'cat-more-facets', 'data-expand': g\.dim, 'aria-expanded': String\(open\), 'aria-controls': restId \}, open \? g\.less : g\.all\(view\.total\)\)/.test(catalog), 'botón con aria-expanded y aria-controls por grupo');
  assert.ok(/el\('div', \{ class: 'cat-rest', id: restId, hidden: !open \}, view\.rest\.map\(option\)\)/.test(catalog), 'lo que despliega aparece debajo del botón: el botón no cambia de sitio');
  for (const label of ['Ver los ${n} géneros', 'Ver menos géneros', 'Ver las ${n} editoriales', 'Ver menos editoriales', 'Ver los ${n} formatos', 'Ver menos formatos']) assert.ok(catalog.includes(label), `rótulo «${label}»`);
  assert.ok(!catalog.includes('Ver las ${n} categorías'), 'sin rótulos de Categoría');
  assert.ok(/if \(state\.open\.has\(dim\)\) state\.open\.delete\(dim\); else state\.open\.add\(dim\);\s*renderFilters\(\);\s*filtersEl\.querySelector\(`\[data-expand="\$\{dim\}"\]`\)\?\.focus\(\{ preventScroll: true \}\);/.test(catalog), 'al abrir o plegar el foco se conserva en el botón y el scroll no se mueve');
  assert.ok(/\(document\.getElementById\(cb\.id\) \?\? filtersEl\.querySelector\(`\[data-expand="\$\{cb\.dataset\.dim\}"\]`\)\)\?\.focus\(\{ preventScroll: true \}\)/.test(catalog), 'si la casilla desmarcada deja de verse, el foco pasa al botón de su grupo');
  assert.ok(!/expandG|limit: (99|10)/.test(catalog), 'ya no hay un límite distinto por grupo ni un único grupo desplegable');
});
test('fuentes: sources.json lista solo archivos que existen y que fonts.css declara (sin la cursiva que nunca se alojó)', async () => {
  const sources = JSON.parse(await readFile(here('./assets/fonts/sources.json'), 'utf8'));
  const fontsCss = await readFile(here('./assets/fonts/fonts.css'), 'utf8');
  assert.ok(sources.fonts.length >= 1 && sources.fonts.every(f => /OFL/.test(f.license)), 'cada fuente con su licencia OFL');
  for (const f of sources.fonts) {
    assert.ok(existsSync(here(`./assets/fonts/${f.file}`)), `${f.file} existe`);
    assert.ok(fontsCss.includes(`url(./${f.file})`) && new RegExp(`font-family: '${f.family}';\\s*font-style: ${f.style};`).test(fontsCss), `${f.file} tiene su @font-face (${f.family}, ${f.style})`);
  }
  const woff = (await readdir(here('./assets/fonts'))).filter(n => n.endsWith('.woff2')).sort();
  assert.deepEqual(woff, sources.fonts.map(f => f.file).sort(), 'ni archivos sin registrar ni registros sin archivo');
  assert.ok(!/font-style: italic/.test(css + mobileCss + fontsCss), 'el sitio no usa cursivas: no hace falta alojar una');
});
test('paleta: los campos de color a ancho completo no superan el croma del turquesa del logo; los acentos, un poco más', async () => {
  const lq = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8')).themes.liquido;
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
  const fills = {};
  for (const k of ['fondo', 'fondo-2', 'fondo-3', 'superficie', 'menta', 'turquesa']) for (const t of ['light', 'dark']) fills[`${k} (${t})`] = lq.color[k][t];
  for (let i = 0; i < 10; i++) fills[`portada ${i}`] = lq.portada[`cover-${i}-a`]; // las portadas son campos de color: mismo límite que las paredes
  for (const [name, hex] of Object.entries(fills)) assert.ok(chroma(hex) <= FILL_MAX, `${name} ${hex}: croma ${chroma(hex).toFixed(3)} > ${FILL_MAX}`);
  const accents = {};
  for (const k of ['primario', 'primario-presionado', 'turquesa-texto', 'en-menta', 'foco', 'abierto']) for (const t of ['light', 'dark']) accents[`${k} (${t})`] = lq.color[k][t];
  for (const [name, hex] of Object.entries(accents)) assert.ok(chroma(hex) <= ACCENT_MAX, `${name} ${hex}: croma ${chroma(hex).toFixed(3)} > ${ACCENT_MAX}`);
  // Ningún token de color opaco (ambos temas y portadas) pasa del límite de acentos.
  const all = [...Object.entries(lq.color).flatMap(([k, v]) => [[`${k} (claro)`, v.light], [`${k} (oscuro)`, v.dark]]), ...Object.entries(lq.portada)];
  for (const [name, hex] of all.filter(([, v]) => /^#[0-9a-f]{6}$/i.test(v))) assert.ok(chroma(hex) <= ACCENT_MAX, `token ${name} ${hex}: croma ${chroma(hex).toFixed(3)} > ${ACCENT_MAX}`);
});
test('portadas: el autor y el título se leen sobre el campo plano de cada portada', async () => {
  const tk = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8')).themes.liquido.portada;
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
  const tk = JSON.parse(await readFile(new URL('../design/tokens.json', import.meta.url), 'utf8')).themes.liquido.portada;
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
  for (const sel of ['house', 'bill', 'books', 'news', 'visit', 'cat']) {
    const r = rule(cssFlat, `.${sel}`);
    assert.ok(/var\(--(sec|space-\d+)\)/.test(r) && !/clamp\([^)]*vh/.test(r), `.${sel} usa el ritmo de la escala y no el alto de la pantalla`);
  }
  assert.ok(/@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{ transition-duration: 0\.01ms !important/.test(css), 'regla general de movimiento reducido');
  assert.ok(!/animation:[^;]*infinite/.test(css + mobileCss), 'nada anima en reposo para siempre (el punto «abierto» ya no late)');
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
  assert.equal([...html.matchAll(/data-open-mylist/g)].length, 3, 'entradas desde la barra (escritorio), el menú y la barra inferior');
  assert.equal([...html.matchAll(/<span data-saved-count>Vacía<\/span>/g)].length, 3, 'cada entrada lleva el conteo en texto');
  assert.ok(/class="save save--wide save--icono" data-d-save[^>]*aria-pressed="false"/.test(html), 'la ficha trae su botón de guardar');
  const savedSrc = await readFile(here('./saved.js'), 'utf8');
  assert.ok(/document\.querySelectorAll\('\[data-saved-count\]'\)\.forEach\(el => \{ el\.textContent = countText\(n\); \}\);/.test(savedSrc) && /document\.querySelectorAll\('\[data-saved-dot\]'\)\.forEach\(el => \{ el\.hidden = n === 0; el\.textContent = n \? String\(n\) : ''; \}\);/.test(savedSrc), 'U03: lo guardado no se pierde de vista: el disco del conteo aparece con libros y el nombre accesible dice cuántos («Mi lista, 3 libros»)');
  assert.ok(/\.count-badge\[hidden\] \{ display: none; \}/.test(css), 'sin libros guardados no hay disco');
  const ex = html.match(/<dialog class="explorer" id="explorer"[\s\S]*?\n {6}<\/dialog>/)[0];
  assert.ok(/data-cat-q/.test(ex) && /data-cat-grid/.test(ex) && /data-cat-filters/.test(ex) && /data-ex-close/.test(ex) && /aria-labelledby="explorer-title"/.test(ex), 'el explorador contiene búsqueda, filtros y rejilla');
  assert.ok(!/id="cat-drawer"/.test(ex), 'la ficha NO va dentro del explorador (un diálogo dentro de otro cerrado no se muestra)');
  assert.ok(/<a class="explore-open" href="#catalogo" data-ex-open><svg class="ic" aria-hidden="true"><use href="#i-search"\/><\/svg><span>Buscar en el catálogo<\/span><\/a>/.test(html), '«Buscar en el catálogo» es un enlace a #catalogo: en el teléfono abre la hoja, en escritorio baja a la rejilla');
  assert.ok(html.indexOf('data-ex-open') < html.indexOf('data-rail-chips') && html.indexOf('data-ex-open') > html.indexOf('id="books-title"'), 'la búsqueda va justo bajo el titular del Catálogo, antes de los chips');
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
  assert.ok(!/setMenu|pushSheet/.test(app) && /openDialog\(dlg, \{ defer: true \}\)/.test(app), 'un solo menú para todo ancho, abierto por openDialog: también responde a «atrás» y a Escape');
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
test('Novedades: sin entradas válidas no hay llegadas que contar (ni punto ni control; la tira es el catálogo completo, ver shelfPlan)', () => {
  const sinDatos = [{ meta: SAMPLE_META }, { meta: SAMPLE_META, novedades: {} }, { meta: SAMPLE_META, novedades: { entradas: [] } }, { novedades: { entradas: [{ id: 'no-existe', llegada: '2026-11-01' }, { id: 'tampoco', llegada: '2026-11-02' }] } },
    { novedades: { entradas: 'x' } }, { novedades: { entradas: [{ llegada: '2026-11-01' }, null, 'libro', { id: 7, llegada: '2026-11-01' }] } }, { novedades: { entradas: [entry(0, '2026-12-24')] } }, { novedades: { ids: [] } }, { novedades: { ids: ['no-existe'] } }, null, undefined];
  for (const d of sinDatos) {
    const plan = newsPlan(data.books, d, { hoy: HOY });
    assert.equal(plan.show, false, JSON.stringify(d)?.slice(0, 80));
    assert.deepEqual(plan.books, [], 'sin entradas no se arma ninguna tarjeta');
    assert.equal(plan.n, 0, 'sin entradas no hay nada que contar');
  }
});
test('Novedades: toda entrada que exista es un libro real con fecha válida; con la lista vacía no hay llegadas ni «Nuevo»', async () => {
  const shipped = JSON.parse(await readFile(here('./assets/data/collections.json'), 'utf8'));
  const list = shipped.novedades.entradas;
  assert.ok(Array.isArray(list), 'la fuente es una lista');
  assert.ok(!('ids' in shipped.novedades) && shipped.novedades.titulo === 'Recién llegados', 'la fuente es `entradas` ({ id, llegada }); se conserva `titulo`');
  assert.ok(!shipped.collections.some(c => /novedades/i.test(c.id)), 'el carrusel de libros no recibe la colección de Novedades');
  const byId = new Map(data.books.map(b => [b.id, b]));
  for (const e of list) {
    assert.deepEqual(Object.keys(e).sort(), ['id', 'llegada'], 'cada renglón es { id, llegada }');
    assert.ok(byId.has(e.id), `el id es un libro del inventario: ${e.id}`);
    assert.ok(validDay(e.llegada), `fecha real AAAA-MM-DD: ${e.llegada}`);
    assert.ok(e.llegada <= isoDay(), `no se anuncia una llegada futura: ${e.llegada}`);
  }
  assert.equal(new Set(list.map(e => e.id)).size, list.length, 'sin repetidos');
  assert.ok(!list.some(e => e.id.startsWith('libro-')), 'no quedan las entradas de ejemplo del catálogo de prueba');
  const plan = newsPlan(data.books, shipped, { hoy: HOY });
  if (list.length) {
    assert.equal(plan.show, true);
    assert.deepEqual(plan.ids, newsEntries(shipped, HOY).filter(e => byId.has(e.id)).slice(0, NEWS_SIZE).map(e => e.id), 'lo más reciente primero, hasta NEWS_SIZE');
  } else {
    // Hoy: la librería no ha registrado fechas de llegada. Sin entradas no hay llegadas, ni conteo temprano, ni «Nuevo»: no hay sección.
    assert.equal(plan.show, false, 'sin entradas no hay llegadas que contar');
    assert.deepEqual([plan.books, plan.ids, plan.n], [[], [], 0]);
    assert.equal(newsPlan(null, shipped, { hoy: HOY }).show, false, 'el conteo temprano (sin catálogo) tampoco muestra nada');
    assert.match(shipped.meta.nota, /vac[ií]a mientras la librer[ií]a no registre fechas de llegada/, 'la nota del JSON dice cómo activarla');
  }
  // Lo que hace la interfaz sin llegadas (crítica minimalista del 2026-11-13): no existen la sección, su enlace de la barra, su fila del menú ni el control.
  const news = await readFile(here('./news.js'), 'utf8');
  const apply = news.slice(news.indexOf('function apply('), news.indexOf('export function initNewsCount'));
  assert.ok(/root\.classList\.toggle\('has-news', plan\.show\);/.test(apply) && /if \(section\) section\.hidden = !plan\.show;/.test(apply) && /\[data-news-link\]'\)\.forEach\(l => \{ l\.hidden = !plan\.show; \}\)/.test(apply), 'sin llegadas no hay sección ni enlaces (barra, menú)');
  assert.ok(/writeState\(!plan\.show \? 'n' : n \? 'p' : 's'\)/.test(apply), 'lo recordado distingue «sin llegadas» (n) de «todas vistas» (s) y «con pendientes» (p)');
  assert.ok(/html:not\(\.has-news\) :is\(\.news, \[data-news-link\]\)/.test(css), 'sin has-news la sección y sus enlaces no se pintan (tampoco sin JavaScript)');
  assert.ok(!/shelfPlan|STATUS_ALL|Todo el catálogo, de la A a la Z/.test(news + html), 'Novedades ya no cae al catálogo de la A a la Z');
  assert.ok(/\[data-news-dot\]'\)\.forEach\(d => \{ d\.hidden = n === 0; \}\)/.test(apply) && /cta\.hidden = n === 0;/.test(apply), 'sin novedades: ni punto en la casilla ni control en el inicio');
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
test('Novedades: capítulo propio que solo existe con llegadas registradas; tira que «Ver todo» despliega, sin huecos reservados ni fechas impresas', async () => {
  const [news, boot, app] = await Promise.all(['news.js', 'assets/js/boot.js', 'app.js'].map(f => readFile(here(`./${f}`), 'utf8')));
  const markup = html.match(/\n {4}<section id="novedades"[\s\S]*?\n {4}<\/section>/)[0];
  assert.ok(/<section id="novedades" class="news" data-news aria-labelledby="news-title">/.test(markup) && !/\bhidden\b/.test(markup.match(/<section[^>]*>/)[0]), 'sección de primer nivel');
  const libros = html.match(/<section id="libros"[\s\S]*?\n {4}<\/section>/)[0];
  assert.ok(!libros.includes('novedades') && !libros.includes('data-news'), 'Novedades salió de dentro de Libros');
  // Cabecera (CarruselNovedades): titular, «Ver todo» plano de 44 px con aria-expanded y aria-controls, y la línea de estado ya escrita (sin salto).
  assert.ok(/<h2 id="news-title" class="h2">Novedades<\/h2>\s*<button class="btn btn--plano btn--sm news-toggle" type="button" aria-expanded="false" aria-controls="news-list" data-news-toggle disabled>Ver todo<\/button>/.test(markup), '«Ver todo» junto al titular: plano de 44 px, con aria-expanded y aria-controls; deshabilitado hasta que llega la tira');
  assert.ok(markup.includes('<p class="news-status" data-news-status></p>') && /\.news-status \{[^}]*min-height: 1lh;/.test(css), 'la línea de estado reserva su renglón: no salta al llegar el conteo');
  assert.ok(/<ul class="news-list" id="news-list" aria-label="Libros recién llegados" data-news-track aria-busy="true">/.test(markup) && (markup.match(/class="news-item card--sk"/g) || []).length === 5, 'la tira reserva su forma con esqueletos');
  assert.ok(/\.news-list \{[^}]*grid-auto-flow: column; grid-auto-columns: var\(--nov-w\);[^}]*overscroll-behavior-x: contain; scroll-snap-type: x mandatory;[^}]*touch-action: manipulation;/.test(cssFlat) && /\.news \{ --nov-w: 120px;/.test(css) && /\.news \{ --nov-w: 152px; \}/.test(css), 'tira de 120 px (152 desde 768) con imán, sin arrastrar la página al llegar al borde');
  assert.ok(/\.news\.is-open \.news-list \{ grid-auto-flow: row;[^}]*grid-template-columns: repeat\(auto-fill, minmax\(96px, 1fr\)\);/.test(css), 'desplegada: rejilla de 96 px como mínimo (3 columnas a 390, 2 a 320)');
  // Existencia: solo con llegadas. boot.js la pone antes del primer render si la visita anterior las vio (s o p); news.js lo confirma con el JSON.
  assert.ok(/html:not\(\.has-news\) :is\(\.news, \[data-news-link\]\), \.news\[hidden\], \[data-news-link\]\[hidden\] \{ display: none; \}/.test(css), 'sin has-news (sin llegadas o sin JavaScript) no existen ni la sección ni sus enlaces');
  assert.ok(/localStorage\.getItem\('iti-news-estado'\)/.test(boot) && /if \(news === 's' \|\| news === 'p'\) r\.classList\.add\('has-news'\);\s*if \(news === 'p'\) r\.classList\.add\('news-hint'\);/.test(boot) && !/^\s*r\.classList\.add\('has-news'\);/m.test(boot) && boot.indexOf("classList.add('has-news')") < boot.indexOf("matchMedia('(prefers-reduced-motion: reduce)')"), 'boot.js: la sección solo si la visita anterior encontró llegadas; el renglón del control del inicio solo si quedaron sin ver (en una primera visita, nada)');
  assert.ok(/const STATE_KEY = 'iti-news-estado';/.test(news) && /const SEEN_KEY = 'iti-news-visto';/.test(news), 'news.js escribe la misma clave que lee boot.js');
  const links = [...html.matchAll(/<a[^>]*href="#novedades"[^>]*>/g)].map(m => m[0]);
  assert.equal(links.length, 3, 'tres entradas a la sección: la barra de escritorio, la fila del menú y el control del inicio');
  // Control del inicio: secundario, oculto de salida, con su sitio reservado solo bajo news-hint.
  const copy = html.match(/<div class="entry-copy"[\s\S]*?<\/section>/)[0];
  assert.ok(/<a class="btn btn--secundario entry-news" href="#novedades" data-news-cta hidden><span class="entry-news-dot" aria-hidden="true"><\/span><span data-news-cta-text><\/span>/.test(copy) && copy.indexOf('entry-news') > copy.indexOf('btn--primario'), 'control secundario (48 px) después de «Cómo llegar», con texto propio (el punto es decorativo)');
  assert.ok(/\.entry-news \{ display: none; margin-top: var\(--space-4\); \}\s*\.news-hint \.entry-news \{ display: inline-flex; visibility: hidden; \}\s*\.news-hint \.entry-news:not\(\[hidden\]\) \{ visibility: visible; \}/.test(css), 'sin reserva no ocupa sitio; con reserva lo ocupa invisible hasta que llega el conteo: nada salta');
  assert.ok(/root\.classList\.toggle\('news-hint'/.test(news) && /new IntersectionObserver\(es => \{\s*if \(es\.some\(e => e\.isIntersecting\)\) return;/.test(news), 'si la reserva no coincide, se corrige con el inicio fuera de la vista');
  // Carga: módulo ligero para el conteo temprano; el catálogo solo al pintar la tira.
  assert.ok(!/^import [^;]*(rail|catalog|saved)\.js/m.test(news) && /import\('\.\/catalog\.js'\)/.test(news), 'news.js no arrastra el catálogo para contar');
  assert.ok(/newsPlan\(null, await loadCollections\(\)/.test(news) && /loadNews\(\)\.then\(m => m\.initNewsCount\(\)\)/.test(app) && /loadNews\(\)\.then\(m => m\.initNews\(\{ ensureCatalog: bootCatalog, isMotion \}\)\)/.test(app), 'el conteo se pide pronto (solo collections.json) y la tira al acercarse');
  assert.ok(app.indexOf('m.initNewsCount()') > app.indexOf('const posterReady'), 'el conteo va después de la foto y las fuentes: no compite con el primer render');
  for (const line of news.split('\n').filter(l => /getItem|setItem/.test(l))) assert.ok(/try \{/.test(line) && /catch/.test(line), `localStorage siempre en try/catch: ${line.trim().slice(0, 60)}`);
  const watch = news.slice(news.indexOf('function watchSeen'), news.indexOf('export async function initNews'));
  assert.ok(/new IntersectionObserver/.test(watch) && /intersectionRatio >= 0\.5/.test(watch) && /setTimeout\(\(\) => \{[^}]*writeSeen\(isoDay\(\)\);[^}]*\}, DUR\('scene'\)\)/.test(watch), 'se guarda cuando la sección está en pantalla de verdad, un momento (duración de token)');
  assert.ok(watch.indexOf('if (!e.isIntersecting && seen)') > 0 && watch.indexOf(".badge-new').forEach(b => b.remove())") > watch.indexOf('if (!e.isIntersecting && seen)'), 'las insignias se retiran solo al salir de la sección, no mientras se miran');
  // Cada libro es un solo botón (portada, título y autor); «Nuevo» va dentro (nombre accesible) y solo para llegadas con fecha.
  assert.ok(/const btn = make\('button', 'news-book'\);/.test(news) && /if \(nuevo\) btn\.append\(badge\(\)\);/.test(news) && /make\('span', 'badge-new', 'Nuevo'\)/.test(news) && /newsItem\(b, tones\[i\], fresh\.has\(b\.id\), i, cat\)/.test(news) && /plan = newsPlan\(sample\.books, data,/.test(news), '«Nuevo» dentro del botón del libro, solo para las llegadas que newsPlan marca');
  assert.ok(/\.badge-new \{[^}]*background: var\(--primario\); color: var\(--en-primario\);/.test(cssFlat) && /\.motion \.news\.is-in \.badge-new \{ animation: il-pop var\(--dur-base\) var\(--curva-resorte\); \}/.test(css), 'insignia «Nuevo» en primario; rebote solo con movimiento');
  assert.ok(!/toLocale|datetime|<time/.test(news) && !/Intl\.|\.llegada\b|\bllegada:/.test(news.slice(news.indexOf('// Interfaz (solo navegador)'))), 'la fecha de llegada no llega a la interfaz: solo ordena y decide «Nuevo»');
  assert.equal(isoDay(new Date('2026-11-12T05:30:00Z')), '2026-11-11', '«visto» y «hoy» se cuentan en el día de Monterrey (23:30 del 11 allá), no en el del dispositivo');
  // «Ver todo» / «Ver menos»: aria-expanded, el foco se queda en el botón, FLIP solo con transform y altura interpolada; sin movimiento, al instante.
  const toggle = news.slice(news.indexOf('export function wireToggle'), news.indexOf('function watchSeen'));
  assert.ok(/toggle\.setAttribute\('aria-expanded', String\(open\)\);/.test(toggle) && /toggle\.textContent = open \? 'Ver menos' : 'Ver todo';/.test(toggle) && !/\.focus\(/.test(toggle), '«Ver todo» ↔ «Ver menos» con aria-expanded; el foco no se mueve del botón');
  assert.ok(/if \(!motion\) return;/.test(toggle) && toggle.indexOf('if (!motion) return;') < toggle.indexOf('.animate(') && /n\.animate\(\[\{ transform: `translate\(\$\{dx\}px, \$\{dy\}px\)` \}, \{ transform: 'none' \}\], \{ duration, easing \}\)/.test(toggle) && /duration = DUR\('base'\), easing = EASE\(\)/.test(toggle), 'FLIP en dur-base con curva-salida, solo transform; sin movimiento el cambio es inmediato');
  assert.ok(/list\.scrollLeft = 0;/.test(toggle) && /section\.scrollIntoView\(\{ block: 'start'/.test(toggle), '«Ver menos» regresa la tira al principio y, si la sección quedó arriba, la trae a la vista');
  // Abrir: la misma ficha del catálogo (sin «modo redes»), después de pintar; al cerrar, el foco vuelve al libro.
  assert.ok(/confirmThen\(book,/.test(news) && /detail: \{ id: book\.dataset\.id, tone: toneOf\(book\) \}/.test(news) && !/redes/.test(news) && /book\.isConnected && book\.focus\(\{ preventScroll: true \}\)/.test(news), 'el libro abre la ficha única y recupera el foco al cerrarla');
});
test('Novedades sin entradas no existe; con una entrada aparece sola con su llegada y «Nuevo» (nunca el catálogo de la A a la Z)', () => {
  const shipped = JSON.parse(readFileSync_('assets/data/collections.json'));
  const empty = { ...shipped, novedades: { ...shipped.novedades, entradas: [] } };
  for (const visto of [null, '2026-11-01', HOY]) {
    const plan = newsPlan(data.books, empty, { hoy: HOY, visto });
    assert.deepEqual([plan.show, plan.books, plan.n], [false, [], 0], 'sin entradas: ni sección, ni libros, ni «Nuevo»');
  }
  const one = { ...shipped, novedades: { ...shipped.novedades, entradas: [entry(4, '2026-11-10')] } };
  const plan = newsPlan(data.books, one, { hoy: HOY });
  assert.equal(plan.show, true, 'con una entrada la sección existe');
  assert.deepEqual(plan.books.map(b => b.id), [data.books[4].id], 'la tira es solo esa llegada: no se rellena con el resto del catálogo');
  assert.deepEqual(plan.nuevos, [data.books[4].id], 'llegó hace tres días: en una primera visita es «Nuevo»');
  assert.equal(plan.estado, '1 llegó en las últimas dos semanas');
  assert.equal(newsPlan(null, one, { hoy: HOY }).show, true, 'el conteo temprano (sin catálogo) ya sabe que hay sección');
  assert.equal(newsPlan(data.books, one, { hoy: HOY, visto: HOY }).n, 0, 'de regreso, lo ya visto no es «Nuevo» (la sección sigue)');
  assert.equal(newsPlan(data.books, { novedades: { entradas: [{ id: 'no-existe', llegada: '2026-11-09' }] } }, { hoy: HOY }).show, false, 'una entrada que no es un libro del inventario no basta para mostrar la sección');
  assert.equal(newsPlan(data.books, { novedades: { entradas: [entry(7, '2026-12-24')] } }, { hoy: HOY }).show, false, 'una llegada futura espera su día');
});
test('carrusel 3D (CarruselPortadas): la portada del centro de frente, las vecinas giran hasta 52°; con movimiento reducido queda plano, sin giro', async () => {
  const railJs = await readFile(here('./rail.js'), 'utf8');
  assert.equal(CF_GIRO, 52);
  assert.equal(tokensJson.scales.profundidad['giro-carrusel'], '52deg', 'el giro máximo es un token');
  assert.ok(tokensCss.includes('--perspectiva-carrusel: 900px;') && tokensCss.includes('--perspectiva-carrusel-ancha: 1200px;') && tokensCss.includes('--perspectiva-tarjeta: 1000px;'), 'perspectivas en tokens.css');
  const c = coverflowPose(0, { w: 172 });
  assert.ok(/rotateY\(0\.00deg\)/.test(c.transform) && c.opacity === 1 && c.zIndex === 100 && !c.hidden, 'la del centro, de frente y encima');
  const r = coverflowPose(1, { w: 172 }), l = coverflowPose(-1, { w: 172 });
  assert.ok(/rotateY\(-52\.00deg\)/.test(r.transform) && /rotateY\(52\.00deg\)/.test(l.transform), 'cada vecina gira hacia el centro');
  assert.ok(/translateZ\(-/.test(r.transform) && r.zIndex < 100 && /translateX\(-/.test(r.transform) && /translateX\(\d/.test(l.transform), 'se hunden y se enciman hacia el centro');
  assert.ok(Math.abs(parseFloat(/rotateY\((-?[\d.]+)deg\)/.exec(coverflowPose(0.5, { w: 172 }).transform)[1])) === 26, 'el giro sigue a la distancia: a media portada, la mitad');
  assert.ok(coverflowPose(3).hidden && coverflowPose(-7).hidden && coverflowPose(10).transform === coverflowPose(3).transform, 'lo lejano ni se ve ni se toca');
  for (const d of [-2.4, -1, -0.5, 0, 0.5, 1, 2]) {
    const f = coverflowPose(d, { flat: true, w: 172 });
    assert.ok(/^scale\(0?\.?\d/.test(f.transform) && !/rotate|translate/.test(f.transform), `movimiento reducido (d = ${d}): sin giro ni profundidad (${f.transform})`);
  }
  assert.equal(coverflowPose(1, { flat: true }).transform, 'scale(0.880)', 'plano: las vecinas al 88 %');
  assert.ok([0, 1, 2, -2].every(d => coverflowPose(d).opacity === 1 && coverflowPose(d, { flat: true }).opacity === 1) && coverflowPose(2.3).opacity < 1, 'hasta dos portadas del centro, enteras (el texto de una portada no pierde contraste); más allá se desvanecen');
  assert.ok(/const flat = !isMotion\(\);/.test(railJs) && /coverflowPose\(\(centers\[i\] - mid\) \/ width, \{ flat, giro, w: width \}\)/.test(railJs), 'la pose sale del desplazamiento y de la preferencia de movimiento (también «Pausar el movimiento»)');
  assert.ok(/viewport\.addEventListener\('scroll', request, \{ passive: true \}\)/.test(railJs) && /requestAnimationFrame\(paint\)/.test(railJs) && /getPropertyValue\('--giro-carrusel'\)/.test(railJs), 'una pose por fotograma, con el giro del token');
  assert.equal(nearestIndex([86, 258, 430], 300), 1, 'el centro es la portada más cercana');
  assert.deepEqual(captionOf({ t: 'Hipercódex: Ensayo poético hiperbólico', a: 'Emmanuel Vizcaya' }, '$250 MXN'), { title: 'Hipercódex', author: 'Emmanuel Vizcaya', price: '$250 MXN' }, 'bajo el carrusel: título (sin subtítulo), autor y precio de la hoja');
  // Desliz nativo con imán al centro; perspectiva en la ventana (punto de fuga fijo) y 3D conservado en la pista.
  assert.ok(/\.rail-viewport \{[^}]*overscroll-behavior-x: contain; scroll-snap-type: x mandatory;[^}]*perspective: var\(--perspectiva-carrusel\); touch-action: manipulation;/.test(cssFlat), 'ventana: imán, sin arrastrar la página y con su perspectiva');
  assert.ok(/\.rail-track \{[^}]*padding: 0 calc\(50% - var\(--cf-w\) \/ 2\);[^}]*transform-style: preserve-3d; \}/.test(cssFlat) && /\.rail-item \{ flex: 0 0 var\(--cf-w\); scroll-snap-align: center;/.test(css) && /\.rail \{ --cf-w: clamp\(148px, 44vw, 240px\); \}/.test(css), 'portadas del 44 % del ancho (148–240 px) centradas por el imán');
  // Toque y teclado: una vecina viene al centro; la del centro abre la ficha. Una sola parada de tabulador; ← → Inicio Fin.
  assert.ok(/item\.classList\.contains\('is-centro'\)\) return;\s*e\.stopImmediatePropagation\(\);/.test(railJs) && /wireBookOpen\(track, ensureCatalog\)/.test(railJs), 'tocar una vecina la trae al centro; tocar la del centro abre la ficha (iti:open-book)');
  assert.ok(/\{ ArrowRight: actual \+ 1, ArrowLeft: actual - 1, Home: 0, End: items\.length - 1 \}\[e\.key\]/.test(railJs), 'teclado: ← → Inicio y Fin');
  assert.ok(/\.rail-item:not\(\.is-centro\) \.save \{ opacity: 0; visibility: hidden; \}/.test(css), 'Guardar solo sobre la portada del centro');
  const rail = html.match(/<div class="rail" data-rail[\s\S]*?data-rail-live><\/p>\s*<\/div>/)[0];
  assert.ok(/<div class="cf-texto" data-rail-caption><p class="cf-titulo" data-rail-title><\/p><p class="cf-meta" data-rail-meta><\/p><\/div>/.test(rail), 'título y «autor · precio» del libro del centro');
  assert.ok(/if \(say === i\) \{ say = -1; live\.textContent =/.test(railJs), 'con flechas o teclado, el libro que llega al centro se anuncia en la única región viva');
});
test('tarjeta de la rejilla (TarjetaLibro): portada que abre la ficha y «Guardar» encima; debajo el título (2 renglones) y «autor · precio» de la hoja; sin reverso ni giro', async () => {
  const cat = await readFile(here('./catalog.js'), 'utf8');
  const saved = await readFile(here('./saved.js'), 'utf8');
  const card = cat.slice(cat.indexOf('function card(b)'), cat.indexOf('let results = [];'));
  assert.ok(/el\('button', \{ type: 'button', class: 'card', 'data-id': b\.id, 'aria-haspopup': 'dialog' \}, cover\(b, tones\.get\(b\.id\), true, false\), el\('span', \{ class: 'card-t' \}, b\.t\), meta\)/.test(card), 'un solo botón: portada, título y «autor · precio» (su nombre accesible es lo que se lee)');
  assert.ok(/el\('span', \{ class: 'card-pr', 'data-fuente': 'hoja' \}, price\)/.test(card) && /const price = priceLabel\(b\.pr\);/.test(card) && /b\.a \? '\\u00a0· ' : ''/.test(card), '«autor · $250 MXN»: el precio es el de la hoja y va marcado');
  assert.ok(/return el\('li', \{ class: 'card-item' \}, btn, saveButton\(b\)\);/.test(card), '«Guardar» flota sobre la portada');
  for (const gone of ['card-voltear', 'card-giro', 'card-reverso', 'data-card-flip', 'data-card-open', 'flipCard', 'is-volteada', 'Voltear', 'inert']) assert.ok(!cat.includes(gone), `retirado: ${gone}`);
  assert.ok(!/card-giro|card-cara|card-reverso|card-voltear|rev-t|save--reverso/.test(css), 'sin CSS de la tarjeta que voltea');
  assert.ok(!/reverso|saveShort/.test(saved), '«Guardar» ya no tiene variante de reverso ni rótulo corto');
  assert.ok(/\.card-t \{[^}]*-webkit-line-clamp: 2;[^}]*min-height: 2lh;[^}]*font: var\(--t-subtitulo\); font-weight: 600;/.test(css), 'título en Subheadline semibold, dos renglones (reservados: las filas no saltan)');
  assert.ok(/\.card-m \{[^}]*font: var\(--t-nota-pie\);/.test(css) && /\.card-pr \{ white-space: nowrap;/.test(css), '«autor · precio» en Footnote; el precio no se parte ni se corta');
  assert.ok(/const t = id && grid\.querySelector\(`\.card\[data-id="\$\{id\}"\]`\);/.test(cat), 'al cerrar la ficha el foco vuelve a la tarjeta');
});
test('ficha única (sin «modo redes»): «Preguntar por WhatsApp», Guardar y Compartir (iconos) y «Cómo llegar»; Compartir usa la hoja del teléfono o copia el enlace', async () => {
  const cat = await readFile(here('./catalog.js'), 'utf8');
  const app = await readFile(here('./app.js'), 'utf8');
  const actions = html.match(/<div class="drawer-actions">[\s\S]*?<\/div>/)[0];
  const order = ['data-d-cta', 'data-d-save', 'data-d-share', 'data-d-visit'].map(k => actions.indexOf(k));
  assert.ok(order.every((x, i) => x >= 0 && (!i || x > order[i - 1])), 'WhatsApp, Guardar, Compartir y «Cómo llegar», en ese orden');
  assert.ok(/<button type="button" class="btn btn--secundario btn--lg btn--icono" data-d-share aria-label="Compartir este libro"><svg class="ic" aria-hidden="true"><use href="#i-share"\/><\/svg><\/button>/.test(actions), 'Compartir: botón de icono de 56 px con nombre accesible');
  assert.ok(!/data-d-redes|class="redes"|data-d-red-|data-modo/.test(html + cat) && !/\.redes|\.red\b|data-modo/.test(css), 'sin modo redes: Instagram y Facebook siguen en el menú y el pie, no en la ficha');
  assert.ok(!/redes/.test(cat.slice(cat.indexOf('function openBook')) + app), 'nadie abre la ficha con un modo distinto');
  assert.ok(/\$\('\[data-d-share\]', drawer\)\.setAttribute\('aria-label', `Compartir «\$\{b\.t\}»`\)/.test(cat), 'el nombre accesible de Compartir lleva el título del libro');
  assert.ok(/\.drawer-actions \{ display: grid; grid-template-columns: auto auto minmax\(0, 1fr\); gap: var\(--space-3\); \}/.test(css) && /\.drawer-actions \[data-d-cta\] \{ grid-column: 1 \/ -1; \}/.test(css), 'WhatsApp a todo el ancho; debajo Guardar, Compartir y «Cómo llegar» (también a 320 px, sin partir rótulos)');
  const b = book('las-hojas-de-fabre-jesus-ferreiro');
  const wa = new URL(bookWaUrl(b));
  assert.ok(wa.href.startsWith('https://wa.me/528180875940?text=') && wa.searchParams.get('text').includes(`«${b.t}» de ${b.a}`), 'WhatsApp prellenado con título y autor');
  const share = bookShareData(b, 'https://itinerante.example/#libros');
  assert.deepEqual(share.url, `https://itinerante.example/#libro-${b.id}`, 'el enlace lleva a la ficha del libro');
  assert.ok(share.text.includes(`«${b.t}» de ${b.a}`) && !/disponible|en existencia|\$\d/i.test(share.text), 'texto sin promesa de existencia ni precio');
  const said = [];
  let got = null;
  assert.equal(await shareBook(b, { nav: { share: async d => { got = d; } }, href: 'https://x.example/', say: t => said.push(t) }), 'compartido');
  assert.ok(got && got.url === `https://x.example/#libro-${b.id}` && !said.length, 'con Web Share se abre la hoja del teléfono');
  let copied = null;
  const abort = Object.assign(new Error('x'), { name: 'AbortError' });
  assert.equal(await shareBook(b, { nav: { share: async () => { throw abort; }, clipboard: { writeText: async t => { copied = t; } } }, href: 'https://x.example/', say: t => said.push(t) }), 'cancelado');
  assert.equal(copied, null, 'cancelar la hoja no copia nada');
  assert.equal(await shareBook(b, { nav: { clipboard: { writeText: async t => { copied = t; } } }, href: 'https://x.example/', say: t => said.push(t) }), 'copiado');
  assert.ok(copied === `https://x.example/#libro-${b.id}` && said.at(-1) === 'Enlace copiado.', 'sin Web Share se copia el enlace y se avisa');
  assert.equal(await shareBook(b, { nav: { clipboard: { writeText: async () => { throw new Error('no'); } } }, href: 'https://x.example/', say: t => said.push(t) }), 'sin copiar');
  assert.ok(/Copia la dirección/.test(said.at(-1)), 'si tampoco se puede copiar, se dice qué hacer');
  assert.ok(/\/\^#libro-\(\[a-z0-9-\]\+\)\$\/\.exec\(location\.hash\)/.test(app) && /detail: \{ id: m\[1\] \}/.test(app), 'un enlace compartido (#libro-<id>) abre la ficha de su libro');
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
test('Eventos y talleres: foto, «Preguntar por WhatsApp» y «Compartir» local; sin «Me interesa», contadores ni fechas inventadas', async () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  assert.equal(items.length, 3);
  for (const [block, id] of items) {
    assert.ok(/<img class="bill-card-img"[^>]* alt="[^"]+"/.test(block), `${id}: foto con texto alternativo`);
    assert.ok(!/data-interest|Me interesa|i-heart/.test(block), `${id}: sin «Me interesa» (retirado el 2026-11-13: no servía a nadie)`);
    assert.ok(new RegExp(`<button class="btn btn--vidrio btn--icono act act--icon" type="button" data-share="${id}" data-title="([^"]+)" aria-label="Compartir «\\1»">`).test(block), `${id}: «Compartir» es un control de icono cuyo nombre lleva el título`);
    assert.ok(!/\d+\s*(me gusta|likes?|reseñas)|★/i.test(block), `${id}: sin señales sociales inventadas`);
  }
  assert.ok(html.includes('<symbol id="i-share"') && !html.includes('<symbol id="i-heart"'), 'el corazón salió del sprite con «Me interesa»');
  assert.ok(/html:not\(\.js\) \.bill-acts \.act \{ display: none; \}/.test(css) && !/html:not\(\.js\) \.bill-acts \{/.test(css), 'sin JavaScript no se muestra Compartir; la consulta por WhatsApp, que es un enlace, sigue');
  const feed = await readFile(here('./feed.js'), 'utf8');
  assert.ok(/navigator\.share/.test(feed) && /AbortError/.test(feed) && /clipboard\.writeText/.test(feed), 'Web Share con respaldo de copiar enlace; cancelar no copia');
  assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|localStorage|toggleInterest|readInterest|iti-b4-interes/.test(feed), 'Eventos no guarda ni envía nada');
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(/e\.target\.closest\('\[data-share\]'\)/.test(app) && !/data-interest/.test(app), 'el único control de la tarjeta que carga feed.js es Compartir');
});
test('tarjeta de evento: foto → insignias → título → frase → descripción → acciones, sin números de interacción, y cada acción nombra su propuesta', async () => {
  const items = [...html.matchAll(/<details class="bill-item"[^>]*data-id="([a-z]+)"[\s\S]*?<\/details>/g)];
  assert.equal(items.length, 3);
  const buttons = [];
  for (const [block, id] of items) {
    const order = [/class="bill-card-img"/, /class="bill-badges"/, /class="bill-title"/, /<p>/, /class="bill-acts"/, /class="btn btn--secundario bill-wa"/, /data-share=/].map(re => block.search(re));
    assert.ok(order.every((n, i) => n >= 0 && (i === 0 || n > order[i - 1])), `${id}: el DOM va de la foto a las insignias, el título, la descripción y las dos acciones (${order})`);
    assert.ok(!/bill-sub/.test(block), `${id}: sin subtítulo que repita la descripción`);
    assert.ok(!/bill-post-head|bill-post-who|bill-av|bill-cap/.test(block), `${id}: sin encabezado de red social ni título repetido (las insignias ya dicen qué es)`);
    const pick = re => block.match(re)[1];
    assert.equal((block.match(/class="bill-title"/g) || []).length, 1, `${id}: el título está una sola vez`);
    assert.equal(pick(/data-share="[a-z]+" data-title="([^"]+)"/), pick(/class="bill-title">([^<]+)</), `${id}: «Compartir» lleva el título`);
    assert.ok(block.includes(`aria-label="Preguntar por WhatsApp: ${pick(/class="bill-title">([^<]+)</)}"><span>Preguntar por WhatsApp</span>`), `${id}: la consulta dice «Preguntar por WhatsApp» y su nombre accesible lleva el título (empieza por el texto visible)`);
    assert.ok(/<a class="btn btn--secundario bill-wa" href="https:\/\/wa\.me\/528180875940\?text=Hola%2C%20me%20interesa/.test(block), `${id}: WhatsApp es la acción secundaria de la tarjeta y conserva su mensaje`);
    assert.ok(!/btn--primario/.test(block), `${id}: ninguna acción de la tarjeta es primaria`);
    assert.ok(!/\b\d+\s*(me gusta|likes?|reseñas|personas|interesad)/i.test(block.replace(/<[^>]+>/g, ' ')), `${id}: sin contadores ni números de interacción`);
    buttons.push({ dataset: { title: pick(/data-share="[a-z]+" data-title="([^"]+)"/) }, attrs: {}, setAttribute(k, v) { this.attrs[k] = v; } });
  }
  const bill = html.match(/<section id="cartelera"[\s\S]*?<\/section>/)[0];
  assert.equal((bill.match(/btn--primario/g) || []).length, 0, 'ninguna primaria en Eventos: «Cómo llegar» está en Visita, a una pantalla');
  // initFeed de verdad, sobre un DOM mínimo: cada botón «Compartir» queda con un nombre distinto que empieza por la acción (WCAG 2.5.3)
  globalThis.document = { querySelectorAll: sel => (sel === '[data-share]' ? buttons : []) };
  try { initFeed(); } finally { delete globalThis.document; }
  const names = buttons.map(b => b.attrs['aria-label']);
  assert.equal(new Set(names).size, 3, `tres nombres distintos: ${names}`);
  assert.deepEqual(names, ['Compartir «Círculo de lectura»', 'Compartir «Ajedrez en la casa»', 'Compartir «Taller de escritura»']);
  assert.equal(shareName(''), 'Compartir «esta propuesta»');
  // móvil y escritorio comparten foto, título, frase e insignias (una sola copia); los puntos son del carrusel del teléfono
  assert.ok(/\.bill-card-fig \{ display: block; \}/.test(cssFlat) && /\.bill-dots \{ display: none; \}/.test(cssFlat), 'la foto va en la tarjeta en todo ancho; los puntos, solo en el teléfono');
  assert.ok(!/\.bill-(title|sub)[^{]*\{[^}]*display: none/.test(css + mobileCss), 'el título y la frase no se ocultan en ningún tamaño');
  assert.ok(/\.btn--icono \{ width: var\(--alto\); padding: 0; \}/.test(cssFlat) && /\.bill-acts \.bill-wa \{ flex: 1 1 auto; white-space: nowrap; \}/.test(cssFlat) && /\.bill-acts \.act--icon \{ position: absolute; z-index: 1; top: var\(--space-3\); right: var\(--space-3\); \}/.test(cssFlat) && /\.bill-item \{ position: relative;/.test(cssFlat), 'las dos acciones miden 48 px: WhatsApp a todo el ancho sin partir su rótulo; «Compartir», círculo de vidrio sobre la esquina de la foto');
  assert.ok(/@media \(max-height: 700px\) \{ \.bill-card-img \{ aspect-ratio: 16 \/ 9; \} \}/.test(mobileCss), 'tope contra el alto: en ventanas bajas la foto se acorta para que la tarjeta quepa con sus acciones');
  assert.ok(/html:not\(\.js\) \.bill-item summary \{ pointer-events: auto; \}/.test(mobileCss), 'sin JavaScript las tarjetas móviles se pueden abrir (nadie las abre por la persona)');
  assert.ok(/\.sec-texto a \{ position: relative; white-space: nowrap; color: var\(--turquesa-texto\); \}/.test(css) && /\.sec-texto a::after \{ content: ""; position: absolute; inset: calc\(-1 \* var\(--space-4\)\) 0; \}/.test(css), 'el enlace a Instagram de la entradilla es texto en línea con 44 px de objetivo: no deja un renglón alto');
  // La falta de fecha se dice una vez en la entradilla (con dónde se anuncian las fechas) y en la insignia de cada tarjeta; sin pie ni subtítulos.
  assert.ok(/<p class="sec-texto">Aún sin fecha\. Las fechas se anuncian en <a href="https:\/\/www\.instagram\.com\/libreriaitineranteymasmty\/"[^>]*>Instagram<svg/.test(bill) && !/bill-foot|propuestas para la agenda/.test(bill), 'entradilla «Aún sin fecha. Las fechas se anuncian en Instagram.»; sin el pie que lo repetía');
  assert.equal((bill.match(/data-bill-when>Propuesta · sin fecha</g) || []).length, 3, 'la insignia de estado se queda en cada tarjeta (se comparte sola y cambia a la fecha confirmada)');
});
test('INP: los botones confirman primero y la hoja se abre o se cierra después de pintar', async () => {
  const [motion, sheets, rail, cat, app] = await Promise.all(['motion.js', 'sheets.js', 'rail.js', 'catalog.js', 'app.js'].map(f => readFile(here(f), 'utf8')));
  assert.ok(/export function afterPaint/.test(motion) && /requestAnimationFrame\(\(\) => setTimeout\(run, 0\)\)/.test(motion), 'afterPaint cede el hilo hasta después del fotograma');
  assert.ok(!/setTimeout\([^)]*,\s*\[1-9]d*\)/.test(motion), 'motion.js no escribe milisegundos a mano');
  assert.ok(/export function closeDialog/.test(sheets) && /is-closing/.test(sheets), 'el cierre desde un botón empieza a salir antes del cierre real');
  const closeFn = sheets.slice(sheets.indexOf('export function closeDialog'));
  assert.ok(closeFn.indexOf("classList.add('is-filling')") > closeFn.indexOf('afterPaint(exited)') && closeFn.indexOf('dlg.close()') > closeFn.indexOf("classList.add('is-filling')"), 'el cierre desde un botón omite el contenido de la hoja ya salida antes de close() (tareas < 200 ms con CPU 4x)');
  assert.ok(/\.explorer\.is-closing \{ opacity: 0;/.test(mobileCss), 'Explorar define su salida (fundido) en CSS');
  assert.ok(/export async function confirmThen/.test(motion) && /data-opening/.test(motion), 'una sola guarda «marcar, pintar, abrir»');
  assert.ok(/confirmThen\(opener/.test(app) && /closeDialog\(dlg\)/.test(app), 'el menú abre y cierra después de pintar');
  assert.ok(/confirmThen\(card/.test(rail) && /confirmThen\(c,/.test(cat), 'la tarjeta confirma el toque y la ficha se abre después');
  assert.ok(!/hasAttribute\('data-opening'\)|dataset\.opening/.test(app + rail + cat), 'ninguna pieza lleva su propia guarda de doble toque');
  assert.ok(/closeDialog\(drawer\)/.test(cat), 'la ficha se cierra por closeDialog');
  assert.ok(/\.menu\.is-closing \.menu-hoja/.test(css) && /\.drawer\.is-closing, \.mylist\.is-closing/.test(css) && /\.motion \.drawer\.is-closing, \.motion \.mylist\.is-closing/.test(mobileCss), 'cada hoja define su salida en CSS');
  assert.ok(/if \(!immediate\) await afterPaint\(\);\s*if \(mine !== paintId\) return;/.test(rail), 'el chip confirma ya y las portadas se cambian después de pintar (gana el último toque)');
  // Explorar y Mi lista también confirman primero (su INP era toda la apertura: 250-540 ms con CPU 4x)
  const savedSrc = await readFile(here('saved.js'), 'utf8');
  assert.ok(/if \(phone\.matches\) \{ e\.preventDefault\(\); confirmThen\(a, openExplorer\); \}/.test(app) && /closeDialog\(explorer\)/.test(app), 'Explorar (desde «Buscar en el catálogo» o cualquier enlace a #catalogo) abre y cierra después de pintar');
  const openEx = /const openExplorer = async \(\) => \{[\s\S]*?\n      \};/.exec(app)[0];
  assert.ok(openEx.indexOf('await openDialog(explorer') < openEx.indexOf('bootCatalog()') && !/await bootCatalog/.test(openEx), 'Explorar abre la hoja con sus esqueletos antes de pedir el catálogo: la respuesta no espera a la red');
  assert.ok(/\.menu-hoja \{[^}]*overflow-y: auto; overscroll-behavior: contain;/.test(cssFlat), 'menú: si no cabe (320 × 640), la hoja se desplaza sola, sin mover la página');
  assert.ok(/confirmThen\(opener, openList\)/.test(savedSrc) && /closeDialog\(dlg\)/.test(savedSrc), 'Mi lista abre y cierra después de pintar');
  // El fondo no se tapa (content-visibility: hidden en los bloques de la página): se pidió revertirlo, ver DESIGN.md «Fondo tras la hoja»
  assert.ok(!/is-behind/.test(css + mobileCss) && !/\buncover\b|contentVisibility/.test(sheets), 'sheets.js no oculta la página tras la hoja');
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
test('Catálogo simple (2026-11-13): titular → «Buscar en el catálogo» → chips → carrusel → «Preguntar por {colección}»; la rejilla de escritorio, debajo', () => {
  const libros = html.match(/<section id="libros"[\s\S]*?\n {4}<\/section>/)[0];
  assert.equal((libros.match(/class="h2"/g) || []).length, 1, 'un solo H2 visual en el capítulo');
  assert.equal((libros.match(/<h2[\s>]/g) || []).length, 1, 'un solo h2 en el marcado');
  const chips = [...libros.matchAll(/role="radiogroup"[^>]*aria-label="([^"]+)"/g)].map(m => m[1]);
  assert.deepEqual(chips, ['Colección'], 'una sola fila de chips: la de colección (los temas de «Pregúntanos» se retiraron)');
  const at = k => libros.indexOf(k);
  const order = ['id="books-title"', 'data-ex-open', 'data-rail-chips', 'data-rail-viewport', 'data-rail-ask', 'class="rail-libre"', 'id="catalogo"', 'class="books-foot"'].map(at);
  assert.ok(order.every((x, i) => x >= 0 && (!i || x > order[i - 1])), `orden: titular, búsqueda, chips, carrusel, preguntar, recomendación, rejilla, cierre (${order})`);
  assert.ok(!/class="ask"|data-topic|data-composer|book-query|ask-title|topic-stage|rail-all|cat-lede/.test(libros), 'sin «Pregúntanos» (foto del tema, redactor, Crónica e Infantil), sin «Ver todo el catálogo» y sin entradilla de Explora');
  assert.ok(!/<p\b/.test(libros.match(/<div class="books-head">[\s\S]*?<\/div>/)[0]), 'la cabecera es el titular y la búsqueda: sin entradilla');
  assert.ok(/<h3 id="rail-title" class="sr-only">/.test(libros), 'el carrusel conserva su nombre accesible sin segundo titular visible');
  assert.ok(/\.books-head \{[^}]*justify-items: start/.test(css) && !/\.books-head \{[^}]*text-align: (right|center)/.test(css), 'titulares alineados a la izquierda en escritorio y móvil');
  assert.ok(/\.explore-open \{[^}]*display: flex;[^}]*min-height: var\(--alto-md\);/.test(cssFlat) && /\.explore-open \{ width: 100%; \}/.test(mobileCss), 'la búsqueda tiene cara de campo de 48 px en todo ancho; a lo ancho en el teléfono');
  assert.ok(/\.cat-head \{ position: absolute; width: 1px; height: 1px;/.test(mobileCss) && /\.books > \.cat \{ margin: 0; padding: 0; border: 0; \}/.test(mobileCss), 'en el teléfono «Explora el catálogo» es solo la hoja: su titular queda para lectores de pantalla y no deja hueco');
  assert.ok(/data-open-mylist/.test(html) && /href="#catalogo"/.test(libros), 'siguen las rutas a Explorar y a Mi lista');
});
test('cierre de Libros: una frase y «Cómo llegar» en el mismo bloque, sin vacío tras el buscador ni rellenos con vh', () => {
  const foot = html.match(/<div class="books-foot">[\s\S]*?<\/div>/)[0];
  assert.ok(/<p>[^<]+<\/p>/.test(foot) && (foot.match(/btn--primario/g) || []).length === 1, 'frase + una sola primaria');
  assert.ok(/\.books-foot \{ padding-block: var\(--space-8\); \}/.test(mobileCss), 'tras las preguntas un solo escalón de ritmo, el de capa (32 px), no el de capítulo');
  for (const rule of ['.books-head', '.cat-head', '.sec-head']) {
    const m = css.match(new RegExp(`${rule.replace('.', '\.')} \{[^}]*\}`));
    assert.ok(m && !/vh/.test(m[0]), `${rule} sin clamp(vh)`);
  }
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
  assert.ok(/\.rail-note \{ min-height: 1lh;/.test(css), 'la línea de la nota se reserva: el carrusel no salta al pintar');
});
test('géneros: todo género del inventario se lee en español (del propio dato) y uno sin nombre cae al id', async () => {
  const ids = new Set(data.books.map(b => b.g).filter(Boolean));
  assert.deepEqual([...ids].sort(), Object.keys(data.subgenres).sort(), 'el diccionario del catálogo trae justo los géneros en uso');
  assert.ok(ids.size >= 5, 'el inventario trae varios géneros');
  for (const id of ids) {
    const original = data.subgenres[id]?.n;
    assert.ok(original, `${id}: el dato trae su nombre`);
    const label = genreLabel(id, original);
    assert.equal(label, original, `${id}: el nombre del inventario ya está en español y se usa tal cual`);
    assert.ok(!/\b(Fiction|Poetry|Essay|Non-?fiction|Memoir|History)\b/i.test(label), `${id}: etiqueta con inglés: ${label}`);
  }
  assert.equal(genreLabel('ensayo-poesia', data.subgenres['ensayo-poesia'].n), 'Ensayo y poesía');
  assert.equal(genreLabel('nuevo-genero', 'New Genre'), 'New Genre', 'sin traducción: el nombre original');
  assert.equal(genreLabel('nuevo-genero'), 'nuevo-genero', 'sin traducción ni nombre: el id');
  assert.equal(genreLabel('toString', 'Original'), 'Original', 'un id como propiedad heredada no rompe');
  assert.ok(Object.keys(GENRE_ES).every(id => data.subgenres[id]), 'el diccionario de presentación no trae ids que el inventario no tiene');
  assert.ok(Object.values(data.categories).every(n => /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ ]+$/.test(n)), 'las categorías también vienen en español');
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/g: id => genreLabel\(id, data\.subgenres\[id\]\?\.n\)/.test(catalog), 'barra Género, chips y ficha comparten la misma etiqueta');
});
test('Libros: una sola taxonomía a la vista (los chips de colección; sin temas aparte) y «Filtros» sin el total del catálogo', async () => {
  assert.ok(/\.chip\[aria-checked="true"\], \.cat-filters-btn\[aria-expanded="true"\], \.cat-chip \{ background: var\(--primario\); color: var\(--en-primario\); \}/.test(cssFlat), 'el chip elegido usa el código de lo elegido (primario)');
  assert.ok(/\.chip\[aria-checked="true"\]::before/.test(cssFlat), 'lo elegido no depende solo del color (palomita)');
  assert.ok(!/\.chip\[aria-checked="true"\][^{]*\{[^}]*background/.test(mobileFlat), 'el teléfono no redefine los colores del estado activo');
  const app = await readFile(here('./app.js'), 'utf8');
  const railJs = await readFile(here('./rail.js'), 'utf8');
  assert.ok(!/iti:topic|TOPICS/.test(app + railJs), 'Narrativa, Poesía y Ensayo salen una sola vez: sin temas de consulta sincronizados con las colecciones');
  const catalog = await readFile(here('./catalog.js'), 'utf8');
  assert.ok(/data-cat-filters-count\]', root\)\.textContent = n \? String\(n\) : ''/.test(catalog) && !/filters-count[^\n]*results\.length/.test(catalog), 'el botón no muestra el total del catálogo');
  assert.ok(/Filtros <span data-cat-filters-count><\/span>/.test(html), 'sin filtros activos el botón dice «Filtros» a secas');
});
test('arranque (R01): tramos cortos, hora de Monterrey en reposo y medidas de descendientes solo con la sección a la vista', async () => {
  const appSrc = await readFile(here('./app.js'), 'utf8');
  // content-visibility: auto (móvil) se salta el subárbol de las secciones fuera de pantalla; pedir su geometría al arrancar lo maqueta.
  // Al arrancar solo se miden las secciones (zonas del scroll-spy); los titulares se parten en reposo y solo los que aún no se ven.
  const zones = appSrc.slice(appSrc.indexOf('const measureZones'), appSrc.indexOf('function spy()'));
  assert.ok(/z\.from\.offsetHeight && z\.to\.offsetHeight/.test(zones) && !/querySelector|\$\(/.test(zones), 'el scroll-spy mide solo las secciones, no sus descendientes');
  assert.ok(/async function boot\(\)/.test(appSrc) && (appSrc.match(/await yieldNow\(\)/g) || []).length >= 6, 'boot() cede el hilo entre secciones');
  assert.ok(/requestIdleCallback \|\| \(cb => setTimeout\(cb, 300\)\)\)\(updateStatus/.test(appSrc), 'la hora de Monterrey (Intl) no corre en la tarea de arranque');
  assert.ok(!/fitOnly|fitWord/.test(appSrc), 'ya no hay rótulo que ajustar al ancho');
});

// ---------------------------------------------------------------------------------------------
// Navegación y orden de la página (sistema táctil, 2026-11-11)


test('tokens Líquido: claro por omisión y oscuro con prefers-color-scheme, mismos nombres, escalas de Apple HIG y sin restos del sistema táctil', () => {
  const C = LQ.color;
  for (const k of ['fondo', 'fondo-2', 'fondo-3', 'superficie', 'tinta', 'tinta-2', 'linea', 'linea-fuerte', 'turquesa', 'en-turquesa', 'turquesa-texto', 'primario', 'en-primario', 'primario-presionado', 'menta', 'en-menta', 'vidrio', 'vidrio-hoja', 'vidrio-luz', 'velo', 'foco', 'abierto', 'cerrado']) {
    assert.ok(C[k] && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(C[k].light) && /^#[0-9a-f]{6}([0-9a-f]{2})?$/i.test(C[k].dark), `${k}: valor claro y oscuro`);
    assert.ok(tokensCss.includes(`--${k}: ${C[k].light};`) && tokensCss.includes(`    --${k}: ${C[k].dark};`), `${k}: en :root (claro) y en el bloque oscuro`);
  }
  assert.equal(C.turquesa.light, '#7ac4b4', 'el turquesa del logo, exacto');
  assert.ok(/@media \(prefers-color-scheme: dark\) \{\s*:root \{/.test(tokensCss) && /color-scheme: light dark;/.test(tokensCss), 'tema automático según el teléfono, sin selector manual');
  assert.ok(/<meta name="theme-color" content="#ffffff" media="\(prefers-color-scheme: light\)">/.test(html) && /<meta name="theme-color" content="#0b1d1b" media="\(prefers-color-scheme: dark\)">/.test(html), 'la barra del navegador sigue al tema');
  // Escala tipográfica de Apple HIG en px CSS; ningún texto de lectura bajo 15 px y ninguno bajo 11.
  const T = tokensJson.scales.type;
  const want = { 'titulo-grande': '34px/41px', 'titulo-1': '28px/34px', 'titulo-2': '22px/28px', 'titulo-3': '20px/25px', titular: '17px/22px', cuerpo: '17px/22px', llamada: '16px/21px', subtitulo: '15px/20px', 'nota-pie': '13px/18px', 'leyenda-1': '12px/16px', 'leyenda-2': '11px/13px', boton: '17px/22px', 'boton-chico': '15px/20px', chip: '15px/20px', pestana: '12px/16px', campo: '17px/22px' };
  for (const [k, v] of Object.entries(want)) assert.equal(`${T[k].size}/${T[k].line}`, v, `${k}: ${v}`);
  assert.ok(parseFloat(T.campo.size) >= 16, 'campos con letra ≥ 16 px (Safari no acerca la página)');
  assert.ok(tokensCss.includes('--t-cuerpo: 400 17px/22px var(--font-texto);') && tokensCss.includes('--t-titulo-grande: 700 34px/41px var(--font-display);'), 'cada estilo es un token font completo');
  // Espaciado de 4 px, radios 12/20/28/píldora (+ portada 6), controles 44/48/56, barras 44/49, márgenes 16/20/32.
  assert.ok(Object.values(tokensJson.scales.space).every(v => v % 4 === 0), 'escala de 4 px');
  assert.deepEqual(tokensJson.scales.radius, { 'radio-sm': '12px', 'radio-md': '20px', 'radio-lg': '28px', 'radio-pildora': '9999px', 'radio-portada': '6px' });
  assert.deepEqual(tokensJson.scales.control, { 'alto-sm': '44px', 'alto-md': '48px', 'alto-lg': '56px' });
  assert.equal(tokensJson.scales.medidas['alto-barra-nav'], '44px');
  assert.equal(tokensJson.scales.medidas['alto-barra-inferior'], '49px');
  assert.deepEqual(['margen-movil', 'margen-movil-amplio', 'margen-escritorio'].map(k => tokensJson.scales.medidas[k]), ['16px', '20px', '32px']);
  assert.ok(/:root \{ --seguro-x: max\(env\(safe-area-inset-left, 0px\), env\(safe-area-inset-right, 0px\)\); --margen: max\(var\(--margen-movil\), var\(--seguro-x\)\);/.test(css) && /@media \(min-width: 376px\) \{ :root \{ --margen: max\(var\(--margen-movil-amplio\), var\(--seguro-x\)\); \} \}/.test(css) && /@media \(min-width: 1024px\) \{ :root \{ --margen: max\(var\(--margen-escritorio\), var\(--seguro-x\)\);/.test(css), 'márgenes de Apple HIG: 16 hasta 375 px → 20 (376 px) → 32 (1024 px), nunca menos que el área segura (muesca en horizontal)');
  assert.ok(/-webkit-text-size-adjust: 100%;\s*text-size-adjust: 100%;/.test(css) && /a, button, summary, label, select, input \{ -webkit-tap-highlight-color: transparent; touch-action: manipulation; \}/.test(css), 'Safari y Chromium: sin agrandar el texto al girar, sin destello gris al tocar y sin espera de doble toque (el zoom con dos dedos sigue)');
  assert.ok(/\.explore-open \{[^}]*font: var\(--t-campo\)/.test(cssFlat), '«Buscar en el catálogo» usa la letra de campo (17 px), como el buscador');
  // Movimiento: duraciones y curvas del sistema.
  assert.deepEqual(tokensJson.scales.duration, { 'dur-instantanea': '120ms', 'dur-rapida': '240ms', 'dur-base': '400ms', 'dur-lenta': '700ms', 'escalon-linea': '60ms' });
  assert.equal(tokensJson.scales.easing['curva-resorte'], 'linear(0, 0.42 8%, 0.86 16%, 1.04 26%, 1.05 32%, 0.99 46%, 1.002 62%, 1)');
  // Sombras solo para lo que flota, con valor por tema.
  for (const k of ['sombra-flotante', 'sombra-hoja', 'sombra-portada', 'luz-vidrio', 'anillo-foco']) assert.ok(LQ.shadow[k].light && LQ.shadow[k].dark, `${k} por tema`);
  // Nada del sistema táctil ni de los tonos por sección.
  const all = css + mobileCss + tokensCss;
  for (const gone of ['--lip', '--edge', '--pick-fill', '--pick-ink', '--terra', '--night', '--bone', '--tungsten', '--f-display', '--f-sans', '--fs-', '--ctl-', '--radius-', '--sec-sm', '--sec-md', '--gutter', '--glass-', '--elev-', '[data-tone', 'data-theme']) assert.ok(!all.includes(gone), `ya no existe ${gone}`);
  assert.ok(!/data-tone|data-theme=/.test(html), 'el marcado no lleva tonos por sección: el tema es uno y cambia con el teléfono');
  assert.ok(!/:root\s*\{[^}]*--(fondo|tinta|primario|menta|vidrio)\b/.test(css + mobileCss), 'colores solo en tokens.css');
});

test('contraste Líquido: texto ≥ 4.5:1 y bordes, iconos y foco ≥ 3:1 en ambos temas, también sobre el peor vidrio', () => {
  const C = LQ.color;
  for (const tema of ['light', 'dark']) {
    const v = k => C[k][tema];
    const worst = tema === 'light' ? '#000000' : '#ffffff'; // lo peor que puede pasar detrás del vidrio
    const fondos = { fondo: v('fondo'), 'fondo-2': v('fondo-2'), 'fondo-3': v('fondo-3'), superficie: v('superficie'), vidrio: over(v('vidrio'), worst), 'vidrio-hoja': over(v('vidrio-hoja'), worst) };
    for (const [nombre, bg] of Object.entries(fondos)) {
      assert.ok(contrast(v('tinta'), bg) >= 4.5, `${tema}: tinta sobre ${nombre} (${contrast(v('tinta'), bg).toFixed(2)})`);
      assert.ok(contrast(v('tinta-2'), bg) >= 4.5, `${tema}: tinta-2 sobre ${nombre} (${contrast(v('tinta-2'), bg).toFixed(2)})`);
      assert.ok(contrast(v('linea-fuerte'), bg) >= 3, `${tema}: borde de control sobre ${nombre}`);
      assert.ok(contrast(v('foco'), bg) >= 3, `${tema}: anillo de foco sobre ${nombre}`);
    }
    for (const nombre of ['fondo', 'fondo-2', 'fondo-3', 'superficie']) assert.ok(contrast(v('turquesa-texto'), fondos[nombre]) >= 4.5, `${tema}: turquesa-texto sobre ${nombre}`);
    assert.ok(contrast(v('turquesa-texto'), v('menta')) >= 4.5, `${tema}: turquesa-texto sobre menta`);
    assert.ok(contrast(v('en-primario'), v('primario')) >= 4.5 && contrast(v('en-primario'), v('primario-presionado')) >= 4.5, `${tema}: texto del primario`);
    assert.ok(contrast(v('en-menta'), v('menta')) >= 4.5, `${tema}: texto del secundario`);
    assert.ok(contrast(v('en-turquesa'), v('turquesa')) >= 4.5, `${tema}: texto sobre turquesa`);
    assert.ok(contrast(v('abierto'), v('fondo')) >= 3 && contrast(v('cerrado'), v('fondo')) >= 3, `${tema}: puntos de estado ≥ 3:1`);
    assert.ok(contrast(v('tinta-2'), v('fondo-3')) >= 4.5 && contrast(v('en-menta'), v('menta')) >= 4.5, `${tema}: insignias (callada y de tipo)`);
  }
  // Sobre vidrio en claro el turquesa no es texto (3.7:1 en el peor caso): la barra y el menú usan tinta.
  for (const [src, sel] of [[css, '.hdr-nav a {'], [css, '.menu-row {'], [mobileCss, '.tabbar a, .tab-list {'], [css, '.hdr-brand {']]) {
    const r = src.slice(src.indexOf(sel));
    assert.ok(/color: var\(--tinta\)/.test(r.slice(0, r.indexOf('}'))), `${sel} en tinta sobre vidrio`);
  }
});

test('vidrio: solo en lo que flota, con respaldo opaco sin backdrop-filter, con transparencia reducida, con contraste alto y en gama media', () => {
  const glassy = ['.hdr', '.tabbar', '.menu-hoja', '.btn--vidrio', '.drawer', '.mylist', '.toast', '.menu-close', '.save:not(.save--wide)', '.ex-top'];
  const list = glassy.join(', ');
  assert.ok(css.includes(`@supports not ((backdrop-filter: blur(1px)) or (-webkit-backdrop-filter: blur(1px))) {\n  ${list} { background: var(--superficie) !important; }`), 'sin soporte de backdrop-filter: superficie opaca');
  assert.ok(css.includes(`@media (prefers-reduced-transparency: reduce) {\n  ${list} { background: var(--superficie) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; }`), 'transparencia reducida: opaco y sin desenfoque');
  assert.ok(css.includes(`@media (prefers-contrast: more) {\n  ${list} { background: var(--superficie) !important; -webkit-backdrop-filter: none !important; backdrop-filter: none !important; outline: 2px solid var(--linea-fuerte); }`), 'contraste alto: opaco con borde de 2 px linea-fuerte');
  assert.ok(css.includes(`html[data-glass="lite"] :is(${list}) { background: var(--superficie); -webkit-backdrop-filter: none; backdrop-filter: none; }`), 'gama media (boot.js: data-glass="lite"): opaco, sin desenfoque');
  // Cada pieza de vidrio lleva su filtro y la luz del borde; las bandas, tarjetas y campos no.
  for (const [src, sel] of [[css, '.hdr'], [mobileCss, '.tabbar'], [css, '.menu-hoja'], [css, '.drawer'], [css, '.mylist'], [css, '.btn--vidrio']]) {
    const r = rule(flat(src), sel);
    assert.ok(/background: var\(--vidrio(-hoja)?\)/.test(r) && /backdrop-filter: var\(--filtro-vidrio(-hoja)?\)/.test(r), `${sel}: vidrio con su desenfoque`);
  }
  for (const sel of ['.bill-item', '.hours', '.cat-group', '.note', '.house', '.bill', '.visit', '.ftr', '.entry-media']) {
    const at = cssFlat.indexOf(`${sel} {`);
    assert.ok(at < 0 || !/backdrop-filter|var\(--vidrio/.test(cssFlat.slice(at, cssFlat.indexOf('}', at))), `${sel} no es vidrio (no flota)`);
  }
  assert.ok(/<script src="assets\/js\/boot\.js"><\/script>/.test(html) && /r\.dataset\.glass = 'lite'/.test(readFileSync_('assets/js/boot.js')), 'boot.js marca la gama media antes del primer render');
});

test('letra: la del sistema de Apple con Inter variable alojada (OFL) como respaldo; sin Nunito ni Archivo', async () => {
  assert.equal(LQ.font['font-texto'], '-apple-system, BlinkMacSystemFont, "SF Pro Text", "Inter", system-ui, sans-serif');
  assert.equal(LQ.font['font-display'], '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Inter", system-ui, sans-serif');
  const fontsCss = await readFile(here('./assets/fonts/fonts.css'), 'utf8');
  assert.ok(/font-family: 'Inter';\s*font-style: normal;\s*font-weight: 100 900;\s*font-display: swap;\s*src: url\(\.\/inter-latin-opsz-normal\.woff2\) format\('woff2'\);\s*unicode-range: U\+0000-00FF/.test(fontsCss), 'Inter variable (tamaño óptico y peso), solo el subconjunto latino');
  assert.ok(existsSync(here('./assets/fonts/OFL-inter.txt')) && /SIL Open Font License/.test(readFileSync_('assets/fonts/OFL-inter.txt')), 'licencia OFL junto al archivo');
  const files = (await readdir(here('./assets/fonts'))).sort();
  assert.deepEqual(files, ['OFL-inter.txt', 'fonts.css', 'inter-latin-opsz-normal.woff2', 'sources.json'], 'ni Nunito ni Archivo ni sus licencias');
  assert.ok(/<link rel="preload" href="assets\/fonts\/inter-latin-opsz-normal\.woff2" as="font" type="font\/woff2" crossorigin>/.test(html) && !/nunito|archivo/i.test(html + css + mobileCss + tokensCss), 'una sola fuente precargada; ningún rastro de las anteriores');
  assert.ok(!/font-family:\s*(?!var\()/.test(cssFlat + mobileFlat), 'toda familia sale de los tokens');
});

test('botón (Boton): píldora de 48 px; 44 solo en línea y en las barras, 56 en las acciones principales; cuatro variantes', () => {
  const btn = rule(cssFlat, '.btn');
  assert.ok(/--alto: var\(--alto-md\); --pad: var\(--space-5\);/.test(btn) && /min-height: var\(--alto\); min-width: var\(--alto\);/.test(btn) && /border-radius: var\(--radio-pildora\);/.test(btn) && /font: var\(--t-boton\);/.test(btn), '48 px en píldora con el rótulo Headline (17 px)');
  assert.ok(/\.btn--sm \{ --alto: var\(--alto-sm\); --pad: var\(--space-4\); font: var\(--t-boton-chico\);/.test(cssFlat) && /\.btn--lg \{ --alto: var\(--alto-lg\); --pad: var\(--space-6\); \}/.test(cssFlat), '44 px con 15 px y 56 px');
  assert.ok(/\.btn--primario \{ background: var\(--primario\); color: var\(--en-primario\); \}/.test(cssFlat) && /\.btn--secundario \{ background: var\(--menta\); color: var\(--en-menta\); \}/.test(cssFlat) && /\.btn--plano \{ background: transparent; color: var\(--turquesa-texto\); \}/.test(cssFlat), 'primario turquesa profundo, secundario menta (sin borde), plano en texto');
  assert.ok(/\.btn:active \{ transform: scale\(0\.97\); transition-timing-function: var\(--curva-resorte\); \}/.test(cssFlat) && /\.btn:focus-visible \{ outline: 2px solid transparent; outline-offset: 2px; box-shadow: var\(--anillo-foco\); \}/.test(cssFlat), 'responde al toque con escala (no con canto) y el foco es el anillo del sistema');
  assert.ok(!/translate: 0 var\(--lip\)|box-shadow: 0 var\(--ctl-lip\)|::before[^{]*\{[^}]*--sweep/.test(cssFlat + mobileFlat), 'sin canto ni barrido');
  // Clases viejas retiradas del marcado y de JS.
  const js = ['catalog.js', 'rail.js', 'news.js', 'saved.js', 'feed.js', 'app.js'].map(readFileSync_).join('\n');
  for (const gone of ['btn--tungsten', 'btn--ghost', 'btn--line-ink', 'sm-row', 'sm-link', 'tab-menu']) assert.ok(!html.includes(gone) && !js.includes(gone) && !css.includes(gone) && !mobileCss.includes(gone), `ya no existe ${gone}`);
  // Alternado: el secundario elegido toma el primario y el icono se rellena.
  assert.ok(/\.btn--secundario\[aria-pressed="true"\], \.save--wide\[aria-pressed="true"\] \{ background: var\(--primario\); color: var\(--en-primario\); \}/.test(cssFlat) && /\.save\[aria-pressed="true"\] \.ic \{ fill: currentColor; fill-opacity: 0\.25; \}/.test(cssFlat), 'el estado elegido se marca con color y con el icono relleno');
});

test('una sola acción primaria por vista: «Cómo llegar» en la página y el menú, «Preguntar por WhatsApp» en la ficha', async () => {
  const all = [...html.matchAll(/<a class="([^"]*\bbtn\b[^"]*)"[^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/g)];
  const primary = all.filter(m => /btn--primario/.test(m[1]));
  const drawer = html.match(/<dialog class="drawer"[\s\S]*?<\/dialog>/)[0];
  for (const m of primary) {
    if (drawer.includes(m[0])) { assert.ok(/wa\.me/.test(m[2]) && /Preguntar por WhatsApp/.test(m[3]), 'en la ficha la primaria es la consulta por WhatsApp'); continue; }
    assert.ok(/google\.com\/maps\/dir/.test(m[2]) && /Cómo llegar/.test(m[3]), `fuera de la ficha la primaria es «Cómo llegar»: ${m[3].slice(0, 40)}`);
  }
  assert.ok(primary.length >= 7, 'barra, menú, Mi lista, inicio, Catálogo, ficha y Visita');
  for (const [name, block] of [['menú', html.match(/<dialog class="menu"[\s\S]*?<\/dialog>/)[0]], ['Mi lista', html.match(/<dialog class="mylist"[\s\S]*?<\/dialog>/)[0]], ['ficha', drawer], ['inicio', html.match(/<section id="inicio"[\s\S]*?<\/section>/)[0]], ['Visita', html.match(/<section id="visita"[\s\S]*?<\/section>/)[0]]]) {
    assert.equal((block.match(/btn--primario/g) || []).length, 1, `${name}: un solo primario`);
  }
  for (const m of all.filter(m => /wa\.me/.test(m[2]) && !drawer.includes(m[0]))) assert.ok(!/btn--primario/.test(m[1]), `fuera de la ficha WhatsApp es secundario: ${m[1]}`);
  assert.ok(/hdr\.classList\.toggle\('has-primary'/.test(await readFile(here('./app.js'), 'utf8')) && /\$\$\('main \.btn--primario'\)\.forEach\(b => primaryIo\.observe\(b\)\)/.test(await readFile(here('./app.js'), 'utf8')) && /\.hdr\.has-primary \.hdr-cta \{ opacity: 0; visibility: hidden; \}/.test(cssFlat), 'la primaria de la barra cede cuando hay otra a la vista');
  assert.ok(/<div class="books-foot">[\s\S]*?class="btn btn--primario btn--lg"[^>]*>\s*<span>Cómo llegar/.test(html), 'al pie del Catálogo, «Cómo llegar» de 56 px');
  assert.ok(!/btn--primario/.test(html.match(/<section id="cartelera"[\s\S]*?<\/section>/)[0]), 'Eventos no lleva primaria: Visita, con la suya, está a una pantalla (a lo sumo una primaria a la vista, feed.mjs)');
});

test('barra de navegación (MenuHamburguesa): vidrio de 44 px más el área segura, marca y ☰; secciones desde 1101 px; Mi lista y «Cómo llegar» desde 761', () => {
  const hdr = html.match(/<header class="hdr" data-hdr>[\s\S]*?<\/header>/)[0];
  assert.ok(/<a class="hdr-brand" href="#inicio" aria-label="Librería Itinerante y Más, inicio">\s*<img src="assets\/img\/logo-96\.webp" width="40" height="40" alt="">/.test(hdr), 'marca con el logo de 40 px y nombre accesible');
  const nav = hdr.match(/<nav class="hdr-nav"[\s\S]*?<\/nav>/)[0];
  assert.deepEqual([...nav.matchAll(/<a href="#([a-z]+)"[^>]*>([^<]+)/g)].map(m => [m[1], m[2]]), [['libros', 'Catálogo'], ['cartelera', 'Eventos'], ['novedades', 'Novedades'], ['visita', 'Visita']], 'las secciones en el orden de la página');
  assert.ok(/<a href="#novedades" data-news-link>/.test(nav), 'Novedades desaparece sin entradas');
  assert.ok(/<button class="btn btn--plano btn--sm hdr-list" type="button" data-open-mylist>[\s\S]*?<span>Mi lista<\/span><span class="count-badge" data-saved-dot hidden aria-hidden="true"><\/span><span class="sr-only">, <span data-saved-count>Vacía<\/span><\/span><\/button>/.test(hdr), 'Mi lista con su conteo (visible y en texto para lectores)');
  assert.ok(/<a class="btn btn--primario hdr-cta" href="https:\/\/www\.google\.com\/maps\/dir\//.test(hdr), '«Cómo llegar» en la barra, de 48 px: ninguna consulta por WhatsApp (48 o 56) a la vista es mayor que la primaria');
  assert.ok(/<a href="#novedades" data-news-link>Novedades<span class="news-dot" data-news-dot hidden aria-hidden="true"><\/span><span class="sr-only" data-news-sr><\/span><\/a>/.test(nav) && /<span>Novedades<span class="sr-only" data-news-sr><\/span><\/span><span class="news-dot" data-news-dot hidden aria-hidden="true"><\/span>/.test(html), 'Novedades sin ver: punto en su enlace y en su fila del menú, con «, N sin ver» en texto');
  assert.ok(/<button class="menu-btn" type="button" data-menu-open aria-expanded="false" aria-controls="menu" aria-label="Abrir menú"><span class="menu-lines" aria-hidden="true"><span><\/span><span><\/span><span><\/span><\/span><\/button>/.test(hdr), '☰ con aria-expanded, aria-controls y nombre');
  const bar = rule(cssFlat, '.hdr');
  assert.ok(/position: sticky; top: 0;/.test(bar) && /height: var\(--hdr-h\); padding: env\(safe-area-inset-top, 0px\) var\(--margen\) 0;/.test(bar), 'pegada arriba, alto de barra más el área segura');
  assert.ok(/--hdr-h: calc\(var\(--alto-barra-nav\) \+ env\(safe-area-inset-top, 0px\)\);/.test(css), 'en el teléfono mide 44 (alto-barra-nav) más el área segura');
  assert.ok(/\.hdr\.is-solid \{ box-shadow: var\(--luz-vidrio\), var\(--sombra-flotante\); \}/.test(cssFlat), 'al desplazar flota: luz y sombra');
  assert.ok(/\.menu-btn \{[^}]*width: var\(--alto-sm\); height: var\(--alto-sm\);/.test(cssFlat), '☰ de 44 × 44 (control de la barra)');
  assert.ok(/\[aria-expanded="true"\] > \.menu-lines span:nth-child\(1\) \{ transform: translateY\(6px\) rotate\(45deg\); \}/.test(cssFlat) && /\[aria-expanded="true"\] > \.menu-lines span:nth-child\(3\) \{ transform: translateY\(-6px\) rotate\(-45deg\); \}/.test(cssFlat), 'las líneas se cruzan en ×');
  assert.ok(/\.hdr-nav \{ display: none;/.test(cssFlat) && /@media \(min-width: 1101px\) \{\s*\.hdr-nav \{ display: flex; \}\s*\.hdr-nav \+ \.hdr-end \{ margin-inline-start: 0; \}\s*\.hdr-nav \+ \.hdr-end \.menu-btn \{ display: none; \}/.test(css), 'desde 1101 px las secciones sustituyen al ☰ (de 761 a 1100, el ☰)');
  assert.ok(/\.hdr-list, \.hdr-cta \{ display: none; \}/.test(mobileCss), 'en el teléfono: marca y ☰ (Mi lista va en la barra inferior)');
  assert.ok(/\.hdr-nav a\[aria-current="true"\] \{ background: var\(--menta\); color: var\(--en-menta\); \}/.test(cssFlat) && /\.hdr-nav a \{[^}]*min-height: var\(--alto-sm\);/.test(cssFlat), 'el destino actual lleva la pastilla menta; enlaces de 44 px');
});

test('menú (MenuHamburguesa): hoja de vidrio con todas las secciones, Mi lista, el horario de hoy, «Cómo llegar», WhatsApp y redes', () => {
  const dlg = html.match(/<dialog class="menu" id="menu" aria-labelledby="menu-title">[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<h2 class="sr-only" id="menu-title">Menú<\/h2>/.test(dlg), 'diálogo con título');
  assert.ok(/<button class="menu-btn menu-close" type="button" data-menu-close aria-expanded="true" aria-label="Cerrar menú">/.test(dlg), 'el × queda en el sitio del ☰, por encima de la hoja');
  const rows = [...dlg.matchAll(/<(?:a|button) class="menu-row"[^>]*>\s*<span>([^<]+)/g)].map(m => m[1]);
  assert.deepEqual(rows, ['Inicio', 'Catálogo', 'Eventos y talleres', 'Novedades', 'La casa', 'Visita', 'Mi lista'], 'todas las secciones y Mi lista');
  const hrefs = [...dlg.matchAll(/class="menu-row" href="#([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(hrefs, ['inicio', 'libros', 'cartelera', 'novedades', 'casa', 'visita']);
  for (const id of hrefs) assert.ok(html.includes(`id="${id}"`), `destino #${id}`);
  assert.ok(/<li data-news-link><a class="menu-row" href="#novedades">/.test(dlg), 'Novedades desaparece sin entradas');
  assert.ok(/<button class="menu-row" type="button" data-open-mylist><span>Mi lista<span class="sr-only">, <span data-saved-count>Vacía<\/span><\/span><\/span><span class="count-badge" data-saved-dot hidden aria-hidden="true"><\/span>/.test(dlg), 'Mi lista con su conteo');
  assert.ok(/<p class="menu-horario" data-status><span class="status-dot" aria-hidden="true"><\/span><span data-status-text>/.test(dlg) && /<p class="menu-semana">Lun–sáb · 11:00–20:00 · Domingo cerrado<\/p>/.test(dlg) && !/data-status-long/.test(dlg), 'el estado corto de hoy («Abierto ahora · hasta 20:00») y debajo la semana: la hora no se repite');
  assert.ok(/<a class="btn btn--primario btn--lg" href="https:\/\/www\.google\.com\/maps\/dir\/[^"]*"[^>]*><span>Cómo llegar<\/span>/.test(dlg) && /<a class="btn btn--secundario btn--lg btn--icono" href="https:\/\/wa\.me\/528180875940[^"]*"[^>]*aria-label="Preguntar por WhatsApp">/.test(dlg), '«Cómo llegar» primario de 56 y WhatsApp secundario de icono 56 × 56');
  assert.deepEqual([...dlg.matchAll(/href="https:\/\/www\.(instagram|facebook)\.com[^"]*" target="_blank" rel="noopener noreferrer"/g)].map(m => m[1]), ['instagram', 'facebook'], 'Instagram y Facebook (los del pie)');
  assert.ok(!/aria-expanded="false"|<details/.test(dlg), 'sin acordeones');
  assert.ok(/\.menu-row \{[^}]*min-height: var\(--alto-lg\);[^}]*font: var\(--t-titulo-2\);/.test(cssFlat), 'filas de 56 px con el nombre en Title 2');
  assert.ok(/\.menu-row\[aria-current="true"\] \{ background: var\(--menta\); color: var\(--en-menta\); \}/.test(cssFlat), 'la sección actual en menta');
  assert.ok(/\.menu::backdrop \{ background: var\(--velo\); \}/.test(cssFlat), 'detrás, el velo (solo opacidad)');
  assert.ok(/@media \(min-width: 761px\) \{ \.menu-hoja \{ left: auto; width: 380px;/.test(cssFlat), 'desde 761 px es un panel de 380 px a la derecha');
  assert.ok(/\.menu-lista li:nth-child\(2\) \{ --i: 1; \}/.test(cssFlat) && /transition-delay: calc\(var\(--i, 0\) \* var\(--escalon-linea\) \/ 2\);/.test(cssFlat) && !/style\.setProperty\('--i'/.test(readFileSync_('app.js')), 'las filas entran en cascada (30 ms) sin estilos puestos desde JS');
  assert.ok(!/id="sheet-menu"|class="sheet-menu"|<div class="menu"/.test(html), 'un solo menú para teléfono y tableta: se retiraron la hoja «Más» y el menú de tableta');
});

test('menú: abre después de pintar, atrapa el foco, Escape y «atrás» lo cierran y elegir una sección lleva el foco a su título', async () => {
  const app = await readFile(here('./app.js'), 'utf8');
  const fn = app.slice(app.indexOf('(function menu() {'), app.indexOf('})();', app.indexOf('(function menu() {')));
  assert.ok(/opener\.setAttribute\('aria-expanded', 'true'\);/.test(fn) && /confirmThen\(opener, async \(\) => \{[\s\S]*?await openDialog\(dlg, \{ defer: true \}\);/.test(fn), 'el ☰ se vuelve × en el fotograma del toque y la hoja (showModal: foco atrapado, página inerte) abre después de pintar');
  assert.ok(/opener\.setAttribute\('aria-label', 'Cerrar menú'\)/.test(fn) && /opener\.setAttribute\('aria-label', 'Abrir menú'\)/.test(fn), 'el nombre del botón cambia entre «Abrir menú» y «Cerrar menú»');
  assert.ok(/\$\('\.menu-row', dlg\)\.focus\(\{ preventScroll: true \}\)/.test(fn), 'al abrir, el foco va a la primera sección');
  assert.ok(/\$\('\[data-menu-close\]', dlg\)\.addEventListener\('click', close\)/.test(fn) && /if \(e\.target === dlg\) return close\(\);/.test(fn) && /const close = \(\) => closeDialog\(dlg\);/.test(fn), 'el × y el velo cierran por closeDialog (sale primero, cierra después)');
  assert.ok(/navigateFromSheet\(href\)/.test(fn) && /h\.focus\(\{ preventScroll: true \}\)/.test(fn) && /else opener\.focus\(\{ preventScroll: true \}\)/.test(fn), 'al elegir una sección el foco va a su titular; si no, vuelve al ☰');
  // Escape y «atrás»: los da el diálogo modal y sheets.js (openDialog registra la hoja en el historial).
  const sheets = await readFile(here('./sheets.js'), 'utf8');
  assert.ok(/export function openDialog\(dlg[\s\S]*?dlg\.showModal\(\);[\s\S]*?pushSheet\(\{ \.\.\.opts, dlg, close: \(\) => dlg\.close\(\) \}\)/.test(sheets), 'showModal + entrada de historial: Escape y «atrás» cierran');
  assert.ok(/\.menu\.is-closing \.menu-hoja, \.menu\.is-closing::backdrop \{ opacity: 0; \}/.test(cssFlat), 'el menú define su salida en CSS (closeDialog)');
  assert.ok(/const menu = document\.getElementById\('menu'\);/.test(readFileSync_('saved.js')), 'Mi lista cierra el menú antes de abrirse');
});

test('barra inferior (BarraInferior): cápsula de vidrio de 49 px con Inicio, Catálogo y Mi lista; la pastilla menta marca el destino actual', () => {
  const nav = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  assert.ok(/aria-label="Accesos"/.test(nav) && !/role="tablist"/.test(nav), 'navegación con nombre, no tablist');
  assert.deepEqual([...nav.matchAll(/<a href="#([a-z]+)"/g)].map(m => m[1]), ['inicio', 'libros'], 'dos destinos de la página');
  assert.deepEqual([...nav.matchAll(/<span class="tab-lb">([^<]+)/g)].map(m => m[1]), ['Inicio', 'Catálogo', 'Mi lista'], 'tres casillas con nombre siempre visible');
  assert.ok(/<button class="tab-list" type="button" data-open-mylist><span class="tab-ic-box"><svg class="tab-ic" aria-hidden="true"><use href="#i-mark"\/><\/svg><span class="count-badge" data-saved-dot hidden aria-hidden="true"><\/span><\/span><span class="tab-lb">Mi lista<span class="sr-only">, <span data-saved-count>Vacía<\/span><\/span><\/span><\/button>/.test(nav), 'Mi lista abre su hoja y lleva el conteo (en texto para lectores de pantalla)');
  assert.deepEqual([...nav.matchAll(/<a href="#([a-z]+)" aria-current="location"/g)].map(m => m[1]), ['inicio'], 'la página carga en Inicio; el scroll-spy corrige');
  for (const m of nav.matchAll(/<use href="#([it]-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `icono ${m[1]} en el sprite`);
  const bar = rule(mobileFlat, '.tabbar');
  assert.ok(/position: fixed; left: 50%; bottom: calc\(env\(safe-area-inset-bottom, 0px\) \+ var\(--space-2\)\);/.test(bar) && /translate: -50% 0;/.test(bar), 'flota centrada 8 px sobre el área segura');
  assert.ok(/height: var\(--alto-barra-inferior\);/.test(bar) && /grid-template-columns: repeat\(3, var\(--tab-w\)\);/.test(bar) && /--tab-w: 76px;/.test(bar), '49 px de alto y tres casillas de 76 px (228 px: cabe a 320)');
  assert.ok(/border-radius: var\(--radio-pildora\);/.test(bar) && /box-shadow: var\(--luz-vidrio\), var\(--sombra-flotante\);/.test(bar), 'cápsula de vidrio que flota');
  assert.ok(/\.tabbar a, \.tab-list \{[^}]*height: var\(--alto-barra-inferior\);/.test(mobileFlat), 'cada casilla ocupa el alto completo: objetivo de 76 × 49 sin huecos');
  assert.ok(/\.tabbar-pastilla \{[^}]*background: var\(--menta\);[^}]*translate: calc\(var\(--tab-i\) \* var\(--tab-w\)\) 0; transition: translate var\(--dur-base\) var\(--curva-resorte\)/.test(mobileFlat) && /\.tabbar:has\(> a:nth-of-type\(2\)\[aria-current\]\) \{ --tab-i: 1; \}/.test(mobileFlat), 'la pastilla se desliza con el resorte, solo con CSS');
  assert.ok(/\.tabbar:not\(:has\(\[aria-current\]\)\) \.tabbar-pastilla \{ opacity: 0; \}/.test(mobileFlat), 'sin destino actual (Eventos, Visita, pie) no hay pastilla');
  assert.ok(/\.tabbar a\[aria-current\] \.tab-ic \{ fill: currentColor; fill-opacity: 0\.18; stroke-width: 2\.1;/.test(mobileFlat) && /\.tabbar a\[aria-current\] \{ color: var\(--en-menta\); \}/.test(mobileFlat), 'lo actual no depende solo del color: icono relleno y trazo más grueso');
  assert.ok(!/\.tabbar a\[aria-current\][^{]*\{[^}]*(?<![-\w])(width|height|padding|margin|font)\s*:/.test(mobileFlat), 'la casilla actual no cambia de tamaño');
  assert.ok(/html\.sheet-open \.tabbar \{ translate: -50% calc\(100% \+ var\(--space-6\)\); opacity: 0; \}/.test(mobileFlat), 'con una hoja abierta la barra baja y se oculta');
  assert.ok(/\.ftr \{ padding-bottom: calc\(var\(--alto-barra-inferior\) \+ env\(safe-area-inset-bottom, 0px\) \+ var\(--space-8\)\); \}/.test(mobileFlat), 'el final de la página deja libre la barra más el área segura');
  assert.ok(/\.tabbar \{ display: none; \}/.test(cssFlat) && /<link rel="stylesheet" href="mobile\.css" media="\(max-width: 760px\)">/.test(html), 'solo en el teléfono');
  assert.ok(/html:not\(\.js\) \.tabbar \{ display: none; \}/.test(mobileFlat), 'sin JavaScript no se muestra (Mi lista lo necesita)');
});

test('scroll-spy: Inicio abarca la entrada y La casa; cada capítulo marca su enlace y su fila; la barra inferior solo Inicio y Catálogo', async () => {
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(/const zones = \[\['#inicio', '#casa'\], \['#libros'\], \['#cartelera'\], \['#novedades'\], \['#visita'\]\]/.test(app), 'zonas en el orden de la página; Inicio abarca La casa');
  assert.ok(/const navLinks = \$\$\('\.hdr-nav a, \.menu-row\[href\]'\);/.test(app) && /a\.setAttribute\('aria-current', 'true'\)/.test(app), 'la barra de escritorio y el menú marcan su destino');
  assert.ok(/const tabLinks = \$\$\('\.tabbar a'\);/.test(app) && /a\.setAttribute\('aria-current', 'location'\)/.test(app), 'la barra inferior marca con aria-current');
  assert.ok(/z\.from\.offsetHeight && z\.to\.offsetHeight/.test(app), 'una sección que no existe (Novedades sin entradas) no tiene zona');
  assert.ok(/addEventListener\('scroll', kick, \{ passive: true \}\)/.test(app) && /requestAnimationFrame\(spy\)/.test(app), 'una sola lectura por fotograma, con escucha pasiva');
  assert.ok(!/is-hidden|scenes-desktop|houseScene|marqueeScene|manifestoScene|wipeScene|fitWord/.test(app), 'ya no hay escenas de scroll ni barra que se esconde');
});

test('hojas (FichaLibro): ficha y Mi lista suben desde abajo en el teléfono y son diálogos en escritorio, con las acciones fijas al pie', () => {
  const drawer = html.match(/<dialog class="drawer" id="cat-drawer" aria-labelledby="d-title">[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<div class="drawer-body" data-d-scroll>[\s\S]*<\/div>\s*<div class="drawer-foot">\s*<div class="drawer-actions">/.test(drawer), 'el cuerpo se desplaza y el pie con las acciones queda fijo');
  const foot = drawer.slice(drawer.indexOf('<div class="drawer-foot">'));
  assert.ok(/<a class="btn btn--primario btn--lg" data-d-cta href="https:\/\/wa\.me\/528180875940"[^>]*><span>Preguntar por WhatsApp<\/span>/.test(foot), 'primaria de la ficha: «Preguntar por WhatsApp», 56 px');
  assert.ok(/<button type="button" class="save save--wide save--icono" data-d-save aria-pressed="false"><svg class="ic" aria-hidden="true"><use href="#i-mark"\/><\/svg><span data-save-label>Guardar en mi lista<\/span><\/button>/.test(foot), 'Guardar al pie, botón de icono cuyo nombre es el rótulo');
  assert.ok(/<a class="btn btn--secundario btn--lg" data-d-visit href="https:\/\/www\.google\.com\/maps\/dir\//.test(foot), '«Cómo llegar» secundario de 56 px');
  assert.ok(/<p class="drawer-note">La librería confirma si lo tienen\.<\/p>/.test(foot) && !/y el precio|existencia y precio/.test(html), 'la nota dice quién confirma la existencia (el precio ya es de la hoja de la librería)');
  assert.ok(/<button type="button" class="btn btn--vidrio btn--icono drawer-close" data-d-close aria-label="Cerrar ficha">/.test(drawer), 'cerrar: botón de vidrio de 48 px');
  assert.ok(/\.drawer \{[^}]*width: min\(680px, calc\(100% - var\(--space-16\)\)\);[^}]*border-radius: var\(--radio-lg\);[^}]*background: var\(--vidrio-hoja\);[^}]*box-shadow: var\(--luz-vidrio\), var\(--sombra-hoja\);/.test(cssFlat), 'escritorio: diálogo de hasta 680 px, vidrio de hoja');
  assert.ok(/\.drawer, \.mylist \{ inset: auto 0 0 0; width: 100%; margin: 0; border-radius: var\(--radio-lg\) var\(--radio-lg\) 0 0; \}/.test(mobileFlat) && /\.drawer \{ height: calc\(100dvh - var\(--space-12\)\); \}/.test(mobileFlat), 'teléfono: hoja inferior hasta 48 px del borde de arriba');
  assert.ok(/\.drawer-body \{ grid-template-columns: 38% minmax\(0, 1fr\);/.test(mobileFlat) && /\.drawer-head \{ grid-column: 2;/.test(cssFlat), 'portada al 38 % y datos a su lado');
  assert.ok(/\.drawer-foot \{ padding: var\(--space-3\) var\(--margen\) calc\(var\(--space-3\) \+ env\(safe-area-inset-bottom, 0px\)\); \}/.test(mobileFlat), 'el pie respeta el área segura');
  assert.ok(/\.drawer::backdrop, \.mylist::backdrop \{ background: var\(--velo\); \}/.test(cssFlat), 'detrás, el velo (medido con INP, ver DESIGN.md)');
  assert.ok(/@starting-style \{ \.motion \.drawer\[open\], \.motion \.mylist\[open\] \{ transform: translateY\(100%\); opacity: 1; \} \}/.test(mobileFlat) && /\.motion \.drawer\.is-closing, \.motion \.mylist\.is-closing \{ transform: translateY\(100%\); opacity: 1; \}/.test(mobileFlat), 'sube desde abajo y sale hacia abajo; con movimiento reducido se funde');
  const ml = html.match(/<dialog class="mylist" id="mylist" aria-labelledby="mylist-title">[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<div class="ml-body">[\s\S]*<\/div>\s*<div class="ml-actions">/.test(ml) && /data-ml-visit/.test(ml.slice(ml.indexOf('ml-actions'))), 'Mi lista: cuerpo que se desplaza y acciones al pie');
  assert.ok(/La librería confirma si los tienen\./.test(ml), 'Mi lista dice quién confirma');
});

test('Inicio: foto real de la sala, nombre, estado de hoy y «Cómo llegar» de 56 px, sin texto sobre la foto', () => {
  const sec = html.match(/<section id="inicio" class="entry" aria-labelledby="entry-title">[\s\S]*?<\/section>/)[0];
  assert.ok(/<h1 id="entry-title" class="entry-title">Librería Itinerante <span class="entry-title-mas">y Más<\/span><\/h1>/.test(sec), 'el nombre es el h1 (Large Title)');
  assert.ok(/<p class="entry-status" data-status><span class="status-dot" aria-hidden="true"><\/span><span data-status-text>/.test(sec), 'estado de hoy con su punto y la palabra');
  assert.ok(/<div class="entry-actions">\s*<a class="btn btn--primario btn--lg" href="https:\/\/www\.google\.com\/maps\/dir\/[^"]*"[^>]*><span>Cómo llegar<\/span>/.test(sec), '«Cómo llegar» primario de 56 px');
  assert.ok(/<a class="btn btn--secundario btn--lg" href="https:\/\/wa\.me\/528180875940/.test(sec), 'la consulta por WhatsApp es secundaria, del mismo grupo (56)');
  assert.ok(/<figure class="entry-media">\s*<picture><source media="\(max-width: 760px\)" srcset="assets\/img\/inicio-sala-m\.webp" width="648" height="864"><img class="entry-poster" src="assets\/img\/03-home-sala-central\.webp" width="1080" height="608" alt="[^"]+" fetchpriority="high"/.test(sec), 'foto real: vertical en el teléfono y la sala central en escritorio, con alt y prioridad alta');
  assert.ok(sec.indexOf('entry-copy') < sec.indexOf('entry-media'), 'el texto va antes que la foto: nada se escribe encima de la foto');
  assert.ok(/\.entry-media \{[^}]*overflow: hidden; border-radius: var\(--radio-lg\);/.test(cssFlat) && !/entry-shade|entry-canvas|entry-beat|wordmark|profile-av/.test(html + css + mobileCss), 'foto limpia con radio-lg, sin velos, lienzo de fotogramas ni rótulo gigante');
  assert.ok(/\.entry-title \{ margin: 0; font: var\(--t-titulo-grande\); letter-spacing: var\(--ls-titulo-grande\); text-wrap: balance; \}/.test(cssFlat) && /\.entry-title \{ font-size: clamp\(34px, 3\.2vw \+ 2px, 56px\);/.test(cssFlat), 'Large Title en el teléfono; en escritorio crece hasta display (56)');
  assert.ok(/<link rel="preload" href="assets\/img\/inicio-sala-m\.webp" as="image" type="image\/webp" fetchpriority="high" media="\(max-width: 760px\)">/.test(html) && /<link rel="preload" href="assets\/img\/03-home-sala-central\.webp" as="image" type="image\/webp" fetchpriority="high" media="\(min-width: 761px\)">/.test(html), 'la foto del inicio se precarga, una por tamaño');
  assert.ok(/<a class="btn btn--secundario entry-news" href="#novedades" data-news-cta hidden>/.test(sec) && sec.indexOf('entry-news') > sec.indexOf('btn--primario'), 'el control de novedades es secundario y va después de «Cómo llegar»');
});

test('secciones: encabezado (EncabezadoSeccion) sin antetítulo, «Nombre *frase*» y entradilla; bandas fondo / fondo-2 alternas; ritmo 48 / 64', () => {
  const heads = { casa: 'La casa <em>no es una tienda de paso</em>', cartelera: 'Eventos y talleres <em>en la casa</em>', visita: 'Visita <em>los libros se eligen mejor en persona</em>' };
  for (const [id, h] of Object.entries(heads)) {
    const sec = html.match(new RegExp(`<section id="${id}"[\\s\\S]*?</section>`))[0];
    assert.ok(new RegExp(`<header class="sec-head" data-revelar>\\s*<h2 id="[a-z]+-title" class="h2">${h}</h2>`).test(sec), `#${id}: el titular abre la sección y lleva su nombre («Nombre *frase*»)`);
  }
  assert.ok(!/sec-rotulo/.test(html + css + mobileCss), 'sin antetítulos sobre los titulares (retirados el 2026-11-13; piso.mjs los marca)');
  assert.ok(/\.h2 \{ margin: 0; font: var\(--t-titulo-1\); letter-spacing: var\(--ls-titulo-1\); text-wrap: balance;/.test(cssFlat) && /@media \(min-width: 761px\) \{ \.h2 \{ font-size: clamp\(28px, 1\.25vw \+ 18px, 40px\);/.test(cssFlat), 'Title 1 que crece hasta 40 en escritorio');
  assert.ok(/\.sec-texto \{ margin: var\(--space-3\) 0 0; max-width: 60ch; font: var\(--t-cuerpo\); color: var\(--tinta-2\); \}/.test(cssFlat), 'entradilla en Body, tinta-2, 60 caracteres');
  const fills = ['.house', '.books', '.bill', '.news', '.visit', '.ftr'].map(s => rule(cssFlat, s).match(/background: var\(--(fondo(?:-2)?)\)/)?.[1]);
  assert.deepEqual(fills, ['fondo-2', 'fondo', 'fondo-2', 'fondo', 'fondo', 'fondo-2'], 'La casa → Catálogo → Eventos → (Novedades, si hay llegadas) → Visita → pie: sin Novedades, todos los vecinos son de fondo distinto');
  assert.ok(/--margen: max\(var\(--margen-movil\), var\(--seguro-x\)\); --sec: var\(--space-12\);/.test(css) && /--sec: var\(--space-16\);/.test(css), 'aire entre secciones: 48 en móvil, 64 en escritorio');
  for (const sel of ['.house', '.bill', '.books', '.news', '.visit']) assert.ok(/var\(--sec\)/.test(rule(cssFlat, sel)) && !/vh/.test(rule(cssFlat, sel)), `${sel}: ritmo de la escala, no del alto de la pantalla`);
  assert.ok(!/\.(marquee|wipe|progress|manifesto|house-meter|stories|ftr-mark|wordmark)\b/.test(css + mobileCss) && !/class="(marquee|wipe|progress|manifesto|house-meter|stories|ftr-mark)/.test(html), 'se retiraron la marquesina, la cortinilla, la barra de progreso, el manifiesto suelto, el medidor de La casa y el rótulo gigante del pie');
});

test('movimiento: titulares por línea, revelado de imagen y respuesta al toque, todo con tokens y apagado con «reducir movimiento»', async () => {
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(/function splitHeading\(h\)/.test(app) && /words\.forEach\(w => \{ const t = w\.offsetTop;/.test(app) && /line\.className = 'linea';/.test(app) && /inner\.className = 'linea-in';/.test(app), 'el titular se parte en sus líneas reales (medidas en pantalla)');
  assert.ok(/if \(el\.getBoundingClientRect\(\)\.top < innerHeight\) return;/.test(app) && /el\.dataset\.revelar = 'listo';/.test(app) && /if \(!isMotion\(\) \|\| !\('IntersectionObserver' in window\)\) return;/.test(app), 'solo lo que no se ve y solo con movimiento: nada visible se oculta');
  assert.ok(/unsplit\(\); revealAll\(\);/.test(app) && /h\.innerHTML = h\.dataset\.src;/.test(app), 'si cambia el ancho, los titulares vuelven a su texto');
  assert.ok(/\(window\.requestIdleCallback \|\| \(cb => setTimeout\(cb, 300\)\)\)\(prepareReveals/.test(app), 'se prepara en reposo, después del primer render');
  assert.ok(/\.motion \[data-revelar="listo"\] \.linea-in \{ transform: translateY\(105%\); transition: transform var\(--dur-lenta\) var\(--curva-salida\); transition-delay: calc\(var\(--i, 0\) \* var\(--escalon-linea\)\); \}/.test(cssFlat), 'cada línea sube con dur-lenta y 60 ms de escalón');
  assert.ok(/\.linea:nth-child\(2\) \{ --i: 1; \}/.test(cssFlat) && !/setProperty\('--i'/.test(app), 'el escalón sale de nth-child, sin estilos en línea');
  assert.ok(/\.motion :is\(\.still-img, \.frame-clip\)\[data-revelar="listo"\] \{ clip-path: inset\(6% 6% 6% 6% round var\(--radio-lg\)\);/.test(cssFlat) && /img \{ transform: scale\(1\.06\); transition: transform calc\(var\(--dur-lenta\) \* 1\.6\) var\(--curva-salida\); \}/.test(cssFlat), 'la imagen se abre desde un recorte del 6 % y baja de 1.06 a 1');
  assert.ok(/@media \(prefers-reduced-motion: reduce\) \{\s*\*, \*::before, \*::after \{ transition-duration: 0\.01ms !important;[^}]*animation-duration: 0\.01ms !important;/.test(css) && /\.btn:active, \.menu-btn:active, \.chip:active[^{]*\{ transform: none; \}/.test(cssFlat), 'reducir movimiento: sin desplazamientos ni escalas, el color sí responde');
  assert.ok(/\.btn:active \{ transform: scale\(0\.97\)/.test(cssFlat) && /\.chip:active, \.cat-filters-btn:active, \.cat-chip:active \{ transform: scale\(0\.96\); \}/.test(cssFlat) && /\.tabbar a:active, \.tab-list:active \{ transform: scale\(0\.94\); \}/.test(mobileFlat), 'botones 0.97, chips 0.96, casillas 0.94');
  const motionJs = await readFile(here('./motion.js'), 'utf8');
  assert.ok(/'dur-instant': 'dur-instantanea'/.test(motionJs) && /EASE = \(\) => token\('curva-salida'\)/.test(motionJs), 'motion.js lee los tokens nuevos (los nombres cortos siguen sirviendo)');
  for (const m of (css + mobileCss).matchAll(/(transition|animation)(?:-duration)?:\s*([^;]+);/g)) {
    if (/0\.01ms|none/.test(m[2])) continue;
    assert.ok(!/\b\d+(\.\d+)?m?s\b/.test(m[2].replace(/calc\([^)]*\)/g, '').replace(/var\([^)]*\)/g, '')), `duración escrita a mano: ${m[0].slice(0, 80)}`);
  }
});

test('controles: 48 estándar, 44 en línea y en las barras, 56 principales; chips y campo de búsqueda del sistema; ≥ 8 px entre vecinos', () => {
  assert.ok(/\.chip, \.cat-filters-btn, \.cat-chip \{[^}]*min-height: var\(--alto-md\);[^}]*border-radius: var\(--radio-pildora\); background: var\(--fondo-3\);[^}]*font: var\(--t-chip\);/.test(cssFlat), 'chips de 48 px en fondo-3 con Subheadline medium');
  assert.ok(/\.chip\[aria-checked="true"\], \.cat-filters-btn\[aria-expanded="true"\], \.cat-chip \{ background: var\(--primario\); color: var\(--en-primario\); \}/.test(cssFlat) && /\.chip\[aria-checked="true"\]::before \{ content: "";[^}]*mask: url\("data:image\/svg\+xml/.test(cssFlat), 'chip elegido en primario con la palomita: la forma acompaña al color');
  assert.ok(/\.cat-bar input\[type="search"\] \{[^}]*min-height: var\(--alto-md\);[^}]*border-radius: var\(--radio-pildora\); background: var\(--fondo-3\);[^}]*font: var\(--t-campo\);/.test(cssFlat), 'campo de 48 px en píldora, letra de 17 px');
  assert.ok(/\.cat-bar input\[type="search"\]:focus \{ background: var\(--fondo\); box-shadow: inset 0 0 0 2px var\(--linea-fuerte\);/.test(cssFlat), 'con foco: fondo de la página y borde linea-fuerte');
  assert.ok(/\.rail-chips \{ display: flex; flex-wrap: wrap; gap: var\(--space-2\); \}/.test(cssFlat) && /\.entry-actions \{[^}]*gap: var\(--space-3\);/.test(cssFlat) && /\.drawer-actions \{[^}]*gap: var\(--space-3\);/.test(cssFlat) && /\.menu-acciones \{[^}]*gap: var\(--space-3\);/.test(cssFlat), '8 px entre vecinos, 12 dentro de un grupo de acciones');
  assert.ok(/\.save \{[^}]*width: var\(--alto-sm\); height: var\(--alto-sm\);[^}]*background: var\(--vidrio\);/.test(cssFlat), 'Guardar sobre la portada: vidrio de 44 (flota sobre una imagen)');
  assert.ok(/\.ml-remove \{[^}]*width: var\(--alto-md\); height: var\(--alto-md\);/.test(cssFlat) && /\.menu-row \{[^}]*min-height: var\(--alto-lg\);/.test(cssFlat), 'quitar de la lista 48, filas del menú 56');
  const qa = readFileSync_('tools/qa/controles.mjs');
  assert.ok(/const SCALE = \[44, 48, 56\];/.test(qa) && /best < 8/.test(qa) && /\[15, 17\]/.test(qa), 'el arnés mide la escala 44 / 48 / 56, 8 px entre vecinos y rótulos de 15 o 17 px');
});

test('Eventos y talleres: tarjetas abiertas (foto, insignias, título, frase, descripción, acciones); carrusel en el teléfono y rejilla en escritorio', async () => {
  const app = await readFile(here('./app.js'), 'utf8');
  assert.ok(/items\.forEach\(d => \{ d\.open = true; \$\('summary', d\)\.tabIndex = -1; \}\);/.test(app), 'todas abiertas: el resumen no pliega nada');
  assert.equal([...html.matchAll(/<details class="bill-item"[^>]*\bopen>/g)].length, 3, 'sin JavaScript también se leen las tres');
  assert.ok(!/<details class="bill-item"[^>]*name=/.test(html), 'sin acordeón exclusivo');
  assert.ok(/\.bill-track \{ display: grid; grid-template-columns: repeat\(3, minmax\(0, 1fr\)\);/.test(cssFlat) && /\.bill-track \{ display: flex;[^}]*scroll-snap-type: x mandatory;/.test(mobileFlat), 'rejilla en escritorio, carrusel con imán en el teléfono');
  assert.ok(/\.bill-item \{ position: relative; overflow: hidden; border-radius: var\(--radio-md\); background: var\(--superficie\);/.test(cssFlat) && /\.bill \{[^}]*background: var\(--fondo-2\);/.test(cssFlat), 'tarjeta de superficie con radio-md, sin sombra (apoyada en la banda fondo-2)');
  assert.ok(/\.badge, \.badge-new, \.hours tr\.is-today th::after \{[^}]*border-radius: var\(--radio-pildora\); background: var\(--menta\); color: var\(--en-menta\);/.test(cssFlat) && /\.badge--quiet \{ background: var\(--fondo-3\); color: var\(--tinta-2\); \}/.test(cssFlat), 'insignia de tipo en menta y la de estado (no confirmado) callada');
  assert.ok(/\.bill-dots \{ display: none; \}/.test(cssFlat) && /\.bill-dots i\.is-on \{ opacity: 1; scale: 1\.4; background: var\(--primario\); \}/.test(mobileFlat), 'puntos solo en el teléfono');
  assert.ok(!/bill-stage|bill-layer|bill-ic|data-bill-stage/.test(html + css + mobileCss + app), 'se retiraron el escenario de fotos y el acordeón de escritorio');
});

test('Visita y pie: horario como lista agrupada con «Hoy», acciones de 56 y redes en botones de 44', () => {
  const visit = html.match(/<section id="visita"[\s\S]*?<\/section>/)[0];
  assert.ok(/<table class="hours">\s*<caption>Horario habitual<\/caption>/.test(visit) && /<tr data-days="1 2 3 4 5 6"><th scope="row">Lunes a sábado<\/th><td>11:00–20:00<\/td><\/tr>/.test(visit) && /<tr data-days="0"><th scope="row">Domingo<\/th><td>Cerrado<\/td><\/tr>/.test(visit), 'dos filas reales; sin JavaScript se lee igual');
  assert.ok(/\.hours \{[^}]*border-radius: var\(--radio-md\); background: var\(--fondo-2\);/.test(cssFlat) && /\.hours tr \+ tr :is\(th, td\) \{ border-top: 1px solid var\(--linea\); \}/.test(cssFlat) && /\.hours tr\.is-today th::after \{ content: "Hoy";/.test(cssFlat), 'lista agrupada con filete entre filas; hoy lleva su insignia');
  assert.ok(/<div class="visit-actions">\s*<a class="btn btn--primario btn--lg"[\s\S]*?<a class="btn btn--secundario btn--lg"[^>]*><span>Preguntar por WhatsApp<\/span>/.test(visit), '«Cómo llegar» y «Preguntar por WhatsApp», 56 px');
  const ftr = html.match(/<footer class="ftr">[\s\S]*?<\/footer>/)[0];
  assert.deepEqual([...ftr.matchAll(/<li><a class="btn btn--plano btn--sm" href="([^"]+)"/g)].map(m => m[1].split(/[/?]/)[2] || m[1].slice(0, 6)), ['www.instagram.com', 'www.facebook.com', 'wa.me', 'mailto'], 'redes y correo como botones de 44');
  assert.ok(/<button class="btn btn--plano btn--sm motion-btn" type="button" data-motion-toggle aria-pressed="false">Pausar el movimiento<\/button>/.test(ftr), '«Pausar el movimiento», discreto');
  assert.ok(!/maps\/dir|ftr-brand|Matamoros/.test(ftr), 'el pie no repite la marca, la dirección ni «Cómo llegar»: Visita, justo encima, ya los trae');
  assert.ok(!/<blockquote|Cervantes/.test(html), 'sin la cita de Cervantes (retirada el 2026-11-13)');
  assert.ok(!/<section class="call"/.test(html) && /<h2 id="visit-title" class="h2">Visita <em>los libros se eligen mejor en persona<\/em><\/h2>/.test(visit), 'el llamado se fundió con el titular de Visita');
});

test('sin JavaScript: no se ofrece lo que no funciona (☰, Mi lista, barra inferior, buscador) y las secciones quedan en la barra', () => {
  assert.ok(/html:not\(\.js\) :is\(\.menu-btn, \.hdr-list, \.explore-open, \.motion-btn, \.cat-bar, \.cat-layout\) \{ display: none; \}/.test(cssFlat), 'paridad: lo que depende de JS se oculta');
  assert.ok(/html:not\(\.js\) \.hdr-nav \{ display: flex; order: 3; flex-basis: 100%;/.test(cssFlat), 'las secciones se muestran en la barra en cualquier ancho');
  assert.ok(/html:not\(\.js\) \.tabbar \{ display: none; \}/.test(mobileFlat));
  assert.ok(/html:not\(\.has-news\) :is\(\.news, \[data-news-link\]\)/.test(css), 'sin JavaScript no hay Novedades ni su enlace');
  assert.ok(/<noscript>[\s\S]*wa\.me/.test(html));
});

test('icono y logotipo: sprite de trazo de 24 px (los del sistema) y el logotipo cuadrado entero, con radio-sm', () => {
  for (const id of ['i-ne', 'i-chat', 'i-mark', 'i-close', 'i-pin', 'i-ig', 'i-fb', 't-casa', 't-libros', 't-chevron', 'i-share', 'i-search', 'i-prev', 'i-next']) assert.ok(new RegExp(`<symbol id="${id}" viewBox="0 0 24 24">`).test(html), `icono ${id}`);
  for (const m of html.matchAll(/<use href="#([a-z]-[a-z-]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta ${m[1]}`);
  for (const gone of ['i-heart', 'i-flip', 'i-check', 'c-libro', 'c-ensayo', 'c-memorias']) assert.ok(!html.includes(`<symbol id="${gone}"`), `el sprite ya no trae ${gone} (sin uso desde el 2026-11-13)`);
  assert.ok(/\.ic \{ width: 24px; height: 24px; flex: none; fill: none; stroke: currentColor; stroke-width: 1\.8; stroke-linecap: round; stroke-linejoin: round; \}/.test(cssFlat), 'trazo 1.8, puntas redondas, color del texto');
  assert.ok(/\.hdr-brand img \{ width: 40px; height: 40px; flex: none; border-radius: var\(--radio-sm\); \}/.test(cssFlat), 'el logotipo cuadrado se ve entero (cuadrado redondeado, no círculo)');
  assert.ok(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html.replace(/<!--[\s\S]*?-->/g, '')), 'sin emojis');
});

test('orden de la página: Inicio → La casa → Catálogo → Eventos y talleres → Novedades (solo con llegadas) → Visita → pie, con los mismos id', () => {
  const at = s => html.indexOf(s);
  const order = ['<section id="inicio"', '<section id="casa"', '<section id="libros"', '<section id="cartelera"', '<section id="novedades"', '<section id="visita"', '<footer class="ftr"'].map(at);
  assert.ok(order.every((n, i) => n > 0 && (i === 0 || n > order[i - 1])), `orden ${order}`);
  assert.ok(/<h2 id="books-title" class="h2">Catálogo /.test(html) && /<h2 id="news-title" class="h2">Novedades<\/h2>/.test(html) && /<h2 id="bill-title" class="h2">Eventos y talleres /.test(html) && /<h2 id="house-title" class="h2">La casa /.test(html) && /<h2 id="visit-title" class="h2">Visita /.test(html), 'los titulares empiezan con el nombre con el que se llega a ellos');
  assert.equal([...html.matchAll(/<section[^>]*id="catalogo"/g)].length, 0, 'el catálogo es una capa dentro de #libros');
});

test('crítica minimalista (2026-11-13): textos cortos y un solo rótulo por cosa (inicio, Explora, estado vacío, Mi lista, aviso, WhatsApp, pies de foto)', async () => {
  const [cat, saved, app] = await Promise.all(['catalog.js', 'saved.js', 'app.js'].map(f => readFile(here('./' + f), 'utf8')));
  // P13: la entradilla del inicio, a la mitad.
  assert.ok(/<p class="entry-lede">Libros, café y talleres en una casa de piedra del centro de Monterrey\.<\/p>/.test(html), 'entradilla del inicio de una frase');
  // P14: Explora sin entradilla; una sola forma de nombrar la búsqueda (el ISBN sigue funcionando sin anunciarse).
  assert.ok(/<label for="cat-q">Título, autor o editorial<\/label>/.test(html) && /placeholder="Ej\.: Lomelí"/.test(html) && !/cat-lede|Buscar título, autor o ISBN/.test(html), 'botón «Buscar en el catálogo», etiqueta «Título, autor o editorial», ejemplo «Ej.: Lomelí»');
  const fabre = book('las-hojas-de-fabre-jesus-ferreiro');
  assert.deepEqual(filterBooks(data.books, { q: fabre.n }).map(b => b.id), [fabre.id], 'buscar por ISBN sigue funcionando');
  // P16: los 41 títulos en una sola página, con «41 títulos» / «N títulos».
  assert.ok(PAGE_SIZE >= data.books.length, `una página cabe todo el inventario (${PAGE_SIZE} ≥ ${data.books.length}): sin «Ver N más»`);
  assert.ok(/n === 1 \? '1 título' : `\$\{n\} títulos`/.test(cat) && !/Mostrando \$\{slice\.length\} de \$\{results\.length\}/.test(cat), 'el estado dice «41 títulos» (o «N títulos» al filtrar)');
  // P18: estado vacío con una sola frase visible; la línea de estado solo la anuncia.
  assert.ok(/'No hay títulos con esa combinación\.'/.test(cat) && /status\.classList\.toggle\('sr-only', !n\);/.test(cat) && !/Ningún título coincide/.test(cat), 'sin resultados se ve una sola frase («No hay títulos con esa combinación.»)');
  assert.ok(/<div class="cat-empty" data-cat-empty hidden>\s*<p>No hay títulos con esa combinación\.<\/p>/.test(html));
  // P21: Mi lista y su aviso, más cortos; la nota de dispositivo y confirmación se queda.
  assert.ok(/data-ml-empty hidden>Aún no guardas libros\. Toca el marcador de un libro para anotarlo\.<\/p>/.test(html) && /<p class="ml-note">Se guarda solo en este dispositivo\. La librería confirma si los tienen\.<\/p>/.test(html), 'Mi lista vacía en una frase; la nota de verdad sigue');
  assert.ok(/toast\('Guardado en Mi lista\.'\)/.test(saved) && !/tu lista para la visita/.test(saved), 'el aviso usa el mismo nombre que la pestaña: «Guardado en Mi lista.»');
  // P23: un solo rótulo genérico para WhatsApp; los específicos conservan su objeto; el pie dice «WhatsApp».
  const labels = [...html.matchAll(/href="https:\/\/wa\.me\/[^"]*"[^>]*>(?:<svg[^>]*><use[^>]*\/><\/svg>)?<span[^>]*>([^<]+)<\/span>/g)].map(m => m[1]);
  assert.ok(!labels.some(l => /^(Pedir informes|Pregúntanos por WhatsApp|Pregunta por un libro|Escribir por WhatsApp)$/.test(l)) && !/Escribir por WhatsApp|Pedir informes|Pregúntanos por WhatsApp/.test(html), `sin rótulos viejos: ${labels.join(' · ')}`);
  assert.ok(new Set(labels).size <= 5 && labels.every(l => /^(Preguntar por WhatsApp|Preguntar por un libro|Preguntar por narrativa|Enviar mi lista por WhatsApp|WhatsApp)$/.test(l)), `rótulos: genérico «Preguntar por WhatsApp», específicos con su objeto y «WhatsApp» en el pie (${[...new Set(labels)].join(' · ')})`);
  assert.ok(/aria-label="Preguntar por WhatsApp"><svg class="ic" aria-hidden="true"><use href="#i-chat"/.test(html), 'el botón de icono del menú se nombra igual');
  // P20: los pies de foto de La casa dicen solo el nombre del cuarto (el alt describe la foto).
  const caps = [...html.matchAll(/<li class="still">[\s\S]*?<figcaption data-kind="real">([\s\S]*?)<\/figcaption>/g)].map(m => m[1]);
  assert.equal(caps.length, 6);
  assert.ok(caps.every(c => /^<b>[^<]+<\/b>$/.test(c)), 'cada pie es solo el nombre del cuarto');
  assert.ok([...html.matchAll(/<li class="still">[\s\S]*?alt="([^"]{20,})"/g)].length === 6, 'el alt de cada foto se queda');
  // P22: el horario del menú no repite la hora; P9 y P10: «Cómo llegar» en Inicio, menú, Mi lista, cierre del Catálogo, ficha y Visita (y la barra).
  assert.equal((html.match(/<span>Cómo llegar<\/span>/g) || []).length, 7, '7 «Cómo llegar» (antes 8: el del pie se fue)');
  assert.ok(!/data-ex-open\)\?\.addEventListener\('click'/.test(app), '«Buscar en el catálogo» no lleva un manejador aparte: es un enlace a #catalogo');
});
