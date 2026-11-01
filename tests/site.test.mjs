// Comprobaciones del sitio (modelo B.4 «Función de la casa», en la raíz del repo): node --test tests/site.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile, access, readdir } from 'node:fs/promises';
import { buildMessage, ctaText, waUrl, openingStatus, monterreyNow, TOPICS } from '../app.js';
import { coverTone, score, filterBooks, sortBooks, facetCounts, suggest, relatedBooks, bookMessage, bookWaUrl, norm } from '../catalog.js';

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
  assert.equal(stills.length, 6);
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

test('curaduría: sin relleno de maqueta ni elementos retirados', () => {
  for (const gone of ['entry-clock', 'entry-chapters', 'entry-bar', 'bill-state', 'ftr-fine', 'Higgsfield', 'Maqueta B.4', 'marquee-row--rev', 'manifesto-photo--b'])
    assert.ok(!html.includes(gone), `sigue en el marcado: ${gone}`);
  assert.equal([...html.matchAll(/class="marquee-row/g)].length, 1, 'una sola fila de marquesina');
  assert.ok(!/id="call-title"[\s\S]*?<\/section>/.exec(html)[0].includes('class="btn '), 'el llamado no repite las acciones de la Visita');
  const labels = [...html.matchAll(/class="bill-detail">[\s\S]*?class="btn btn--ink"[^>]*>([^<]+)</g)].map(m => m[1].trim());
  assert.equal(new Set(labels).size, labels.length, 'los CTA de Cartelera son distintos');
});

test('curaduría: los textos de navegación traen pista y los esqueletos ocupan el lugar', () => {
  assert.equal([...html.matchAll(/<a href="#[a-z]+" data-hint="[^"]+"><span>/g)].length, 5);
  assert.equal([...html.matchAll(/class="card card--sk"/g)].length, 12);
  assert.ok(/data-cat-grid aria-busy="true"/.test(html));
  assert.ok(/\.card--sk/.test(css) && /@keyframes sk-sweep/.test(css));
  assert.ok(/content: attr\(data-hint\) \/ ""/.test(css), 'la pista no debe entrar al nombre accesible');
  assert.ok(/\.hdr-nav a:focus-visible::after/.test(css), 'el foco de teclado iguala al hover');
});

test('filetes: horario como filas técnicas, cruces de registro, botones de doble filete y cita atribuida', () => {
  assert.ok(/--hair: 0\.5px/.test(tokensCss) && /min-resolution: 2dppx/.test(tokensCss), 'filete de 0.5 px en pantallas densas');
  assert.ok(/class="visit-side rx" data-rules/.test(html));
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

test('portadas: una sola familia visual, con el tono por categoría y género', () => {
  const warm = new Set([1, 2, 5]), cool = new Set([0, 3, 4]);
  for (const b of data.books) {
    assert.equal(b.c ?? null, null, 'ya no hay SVG de portada');
    assert.ok((b.k === 'fiction' ? warm : cool).has(coverTone(b)), `tono fuera de su familia: ${b.g}`);
  }
  const a = data.books.find(b => b.k === 'fiction');
  assert.equal(coverTone(a), coverTone({ ...a, t: 'otro' }), 'el mismo género da el mismo tono');
});

test('móvil: barra inferior con una pestaña por sección, iconos en el sprite y hoja de estilos solo móvil', () => {
  const nav = html.match(/<nav class="tabbar"[\s\S]*?<\/nav>/)[0];
  const hrefs = [...nav.matchAll(/href="#([a-z]+)"/g)].map(m => m[1]);
  assert.deepEqual(hrefs, ['casa', 'cartelera', 'libros', 'catalogo', 'visita']);
  for (const m of nav.matchAll(/<use href="#(t-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta el icono ${m[1]}`);
  assert.ok(/<link rel="stylesheet" href="mobile\.css" media="\(max-width: 760px\)">/.test(html));
  assert.ok(/aria-label="Secciones"/.test(nav) && !/role="tablist"/.test(nav), 'navegación por anclas, no tablist');
  assert.ok(/prefers-reduced-transparency: reduce/.test(mobileCss) && /@supports \(\(-webkit-backdrop-filter/.test(mobileCss), 'vidrio con degradación');
  assert.ok(!/backdrop-filter:[^;]*\n?[^;]*\.entry-canvas/.test(mobileCss));
});

test('móvil: menú lateral con categorías desplegables accesibles y destinos reales', () => {
  const dlg = html.match(/<dialog class="sheet-menu"[\s\S]*?<\/dialog>/)[0];
  assert.ok(/<button class="hdr-more"[^>]*aria-expanded="false"[^>]*aria-controls="sheet-menu"/.test(html), 'botón del menú con aria-expanded y aria-controls');
  assert.ok(/aria-labelledby="sheet-menu-title"/.test(dlg) && /data-sm-close/.test(dlg), 'diálogo con título y botón de cierre');
  const rows = [...dlg.matchAll(/<button class="sm-row"[^>]*aria-expanded="false"[^>]*aria-controls="([a-z-]+)"/g)].map(m => m[1]);
  assert.deepEqual(rows, ['sm-visita', 'sm-horarios', 'sm-libros', 'sm-cartelera']);
  for (const id of rows) assert.ok(new RegExp(`id="${id}" inert`).test(dlg), `${id} plegado e inerte`);
  for (const m of dlg.matchAll(/href="#([a-z]+)"/g)) assert.ok(html.includes(`id="${m[1]}"`), `destino #${m[1]} inexistente`);
  for (const m of dlg.matchAll(/data-topic-go="([a-z]+)"/g)) assert.ok(html.includes(`data-topic="${m[1]}"`), `tema ${m[1]} inexistente`);
  for (const m of dlg.matchAll(/<use href="#(t-[a-z]+)"/g)) assert.ok(html.includes(`<symbol id="${m[1]}"`), `falta el icono ${m[1]}`);
  assert.ok(/Lunes a s&aacute;bado|Lunes a sábado/.test(dlg) && /Domingo<\/dt><dd>Cerrado/.test(dlg), 'horario real');
  assert.ok(/grid-template-rows: 0fr/.test(mobileCss) && /min-height: 48px/.test(mobileCss), 'despliegue sin saltos y filas de 48 px');
});

test('cartelera móvil: cada tarjeta lleva su foto con rótulo de procedencia y los puntos coinciden', () => {
  const items = [...html.matchAll(/<details class="bill-item"[\s\S]*?<\/details>/g)].map(m => m[0]);
  assert.equal(items.length, 3);
  for (const it of items) {
    assert.match(it, /class="bill-card-fig"/);
    assert.match(it, /<span class="tag tag--(real|ai)">(Foto real|Recreación IA)<\/span>/);
  }
  assert.equal([...html.matchAll(/<div class="bill-dots"[^>]*>([\s\S]*?)<\/div>/g)][0][1].match(/<i>/g).length, items.length);
});

test('tonos claros: las secciones de lectura usan cal y el pie ladrillo, con contraste suficiente', async () => {
  const expected = { 'id="inicio"': 'light', 'class="manifesto"': 'light', 'id="casa"': 'sand', 'id="libros"': 'sand', 'id="catalogo"': 'light' };
  for (const [sel, tone] of Object.entries(expected)) {
    const tag = html.match(new RegExp(`<section[^>]*${sel}[^>]*>`))[0];
    assert.ok(tag.includes(`data-tone="${tone}"`) && /data-theme="paper"/.test(tag), `${sel} sin tono ${tone}`);
  }
  assert.ok(/<footer class="ftr" data-tone="brick">/.test(html));
  const lum = hex => { const c = [1, 3, 5].map(i => parseInt(hex.slice(i, i + 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4)); return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]; };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };
  const tokens = JSON.parse(await readFile(here('./design/tokens.json'), 'utf8')).themes.b4.tones;
  for (const [name, t] of Object.entries(tokens)) {
    assert.ok(ratio(t.bone, t.night) >= 7, `${name}: texto sobre fondo`);
    assert.ok(ratio(t['bone-dim'], t.night) >= 4.5, `${name}: texto atenuado`);
    if (name !== 'brick') for (const k of ['tungsten', 'tungsten-hi', 'turq', 'terra-light']) assert.ok(ratio(t[k], t.night) >= 4.5, `${name}: ${k} sobre fondo`);
  }
  assert.ok(/\[data-tone="light"\]/.test(tokensCss) && /\[data-tone="sand"\]/.test(tokensCss) && /\[data-tone="brick"\]/.test(tokensCss));
});

test('portadas y cabecera: tinta fija sobre superficies oscuras, también dentro de tonos claros', () => {
  assert.ok(/\.cover--blank \.cover-title \{ color: var\(--cover-ink\); \}/.test(css) && /\.cover-author \{[^}]*var\(--cover-ink-dim\)/.test(css), 'portadas con tinta propia');
  assert.ok(/--cover-ink: #f1e8d8/.test(tokensCss) && /--cover-ink-dim: #b8aa95/.test(tokensCss));
  assert.ok(!/html\[data-glass="lite"\] \.hdr::before \{[^}]*background/.test(css), 'lite no pisa el tinte por sección de la cabecera');
  assert.ok(/\.entry-credit \{[^}]*background: color-mix/.test(css.replaceAll('\n', ' ')), 'crédito del hero sobre chip sólido');
  assert.ok(/\.entry-copy \{ padding-bottom: calc\(var\(--tabbar-h\)/.test(mobileCss), 'el hero reserva espacio para la barra inferior');
  assert.ok(!/\.manifesto, \.bill, \.books, \.cat[^{]*\{ content-visibility/.test(mobileCss), 'secciones destino de anclas sin content-visibility');
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
