// Contenido nuevo del 2026-11-19 en el navegador: Preguntas frecuentes (Visita), Editoriales (Catálogo) y Merch (oculto hasta tener productos).
// Uso: node tools/qa/contenido.mjs URL [DIR] [--solo=F,E,M,A]   (Playwright como guias.mjs; DIR: capturas). Sale con 1 si algo falla.
//  F · FAQ: details/summary nativos (4, cerrados, 56 de alto o más), teclado (Enter y Espacio abren y cierran), foco visible, el chevron gira solo con movimiento, la respuesta
//      no anima con movimiento reducido, los enlaces de las respuestas llevan a su sitio (#horario, #contacto) y #catalogo abre Explorar en el teléfono, sin desbordes.
//  E · Editoriales: el bloque, sus filas (≥ 56) y sus conteos; el clic abre Explorar con el filtro de esa editorial (teléfono: hoja y el foco vuelve a la fila al cerrar;
//      escritorio: baja a la rejilla en línea); cada editorial muestra exactamente sus títulos; sin entrada en la barra, el ☰ ni la barra inferior; sin JavaScript, enlaces a #catalogo.
//  A · axe-core (WCAG 2.x A/AA, 2.2 AA y buenas prácticas, con contraste) sobre el inicio con las preguntas frecuentes abiertas, Editoriales y Merch de prueba, y sobre la 404, en 393 y 1440, claro y oscuro: sin violaciones.
//  M · Merch: con el merch.json real (vacío) NO existe nada (ni sección, ni enlaces, ni clase, ni zona); con productos DE PRUEBA (solo en este arnés: se sirven por
//      intercepción de red, nunca están en el repositorio; las fotos son sustitutas) aparece entre Café y Visita con 1, 3 y 12 productos, con foto rota y sin precio, con su
//      entrada en la barra (cabe a 1101 px, también con Novedades) y en el ☰, marca el destino actual y las bandas de fondo alternan.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

let pw = null;
for (const ruta of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { const m = await import(ruta.startsWith('/') ? pathToFileURL(ruta).href : ruta); pw = m.default?.chromium ? m.default : m; if (pw?.chromium) break; pw = null; } catch { /* la siguiente */ }
}
if (!pw) { console.error('contenido.mjs: no encuentro Playwright (PLAYWRIGHT_PATH=/ruta/a/playwright/index.js)'); process.exit(2); }
const CHROME = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const URL_ = pos[0] || 'http://127.0.0.1:8094/';
const DIR = pos[1] || null; if (DIR) mkdirSync(DIR, { recursive: true });
const SOLO = new Set(String(opt.solo || 'F,E,M,A').split(','));
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const PERFILES = {
  '320': { viewport: { width: 320, height: 640 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA },
  '393': { viewport: { width: 393, height: 659 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: UA },
  '820': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1 },
  '1101': { viewport: { width: 1101, height: 800 }, deviceScaleFactor: 1 },
  '1440': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
};
const res = [];
const ok = (regla, cond, texto) => { res.push({ regla, ok: Boolean(cond), texto }); console.log(`${cond ? '✓' : '✗'} ${regla} ${texto}`); };

import { productosDePrueba, rutearMerch } from './merch-prueba.mjs';

async function abrir(perfil, { merch = null, js = true, reducido = false, hash = '', oscuro = false } = {}) {
  const browser = await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars'] });
  const context = await browser.newContext({ ...PERFILES[perfil], javaScriptEnabled: js, locale: 'es-MX', timezoneId: 'America/Monterrey', colorScheme: oscuro ? 'dark' : 'light', reducedMotion: reducido ? 'reduce' : 'no-preference' });
  await context.addInitScript(() => { try { localStorage.setItem('iti-intro', '1'); } catch {} });
  const errores = [];
  if (merch !== null) await rutearMerch(context, merch);
  await context.route(/wa\.me|instagram\.com|facebook\.com|openstreetmap\.org|lu\.ma|google\.com/, r => r.abort());
  const page = await context.newPage();
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text().slice(0, 160)); });
  await page.goto(URL_ + hash, { waitUntil: 'load' });
  await sleep(js ? 1600 : 300);
  return { browser, context, page, errores };
}
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const sinDesborde = page => ev(page, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
const captura = async (page, nombre, sel) => { if (!DIR) return; const el = sel ? page.locator(sel).first() : null; if (el && await el.count()) await el.scrollIntoViewIfNeeded(); await page.screenshot({ path: join(DIR, `${nombre}.png`), fullPage: false }); };

// ---------------------------------------------------------------- F · Preguntas frecuentes
async function faq() {
  for (const perfil of ['320', '393', '1440']) {
    const { browser, page, errores } = await abrir(perfil);
    const d = await ev(page, () => [...document.querySelectorAll('.faq-item')].map(x => ({ open: x.open, h: x.querySelector('summary').getBoundingClientRect().height, w: x.getBoundingClientRect().width, tag: x.querySelector('summary').tagName })));
    ok('F1', d.length === 4 && d.every(x => !x.open && x.h >= 56 - 0.5 && x.tag === 'SUMMARY'), `${perfil}: 4 preguntas cerradas, summary ≥ 56 (${d.map(x => Math.round(x.h)).join('/')})`);
    ok('F1', await sinDesborde(page), `${perfil}: sin desborde horizontal`);
    // teclado: foco en la primera pregunta; Enter abre; Espacio cierra
    await page.locator('.faq-preg').first().focus();
    const anillo = await ev(page, () => getComputedStyle(document.activeElement).boxShadow);
    ok('F2', anillo && anillo !== 'none', `${perfil}: el foco se ve (anillo ${anillo.slice(0, 40)}…)`);
    await page.keyboard.press('Enter'); await sleep(250);
    const abierta = await ev(page, () => document.querySelector('.faq-item').open);
    const resp = await ev(page, () => { const r = document.querySelector('.faq-item .faq-resp'); const b = r.getBoundingClientRect(); return { w: b.width, h: b.height, vis: getComputedStyle(r).display !== 'none' }; });
    ok('F2', abierta && resp.vis && resp.h > 20, `${perfil}: Enter abre y la respuesta se ve (${Math.round(resp.h)} px)`);
    await page.keyboard.press('Space'); await sleep(150);
    ok('F2', !(await ev(page, () => document.querySelector('.faq-item').open)), `${perfil}: Espacio cierra`);
    await page.keyboard.press('Tab');
    ok('F2', await ev(page, () => document.activeElement.classList.contains('faq-preg') && document.activeElement.closest('.faq-item') === document.querySelectorAll('.faq-item')[1]), `${perfil}: Tab pasa a la siguiente pregunta`);
    if (perfil === '1440') {
      const g = await ev(page, () => { const t = document.querySelector('.faq-tit').getBoundingClientRect(), l = document.querySelector('.faq-lista').getBoundingClientRect(), v = document.querySelector('.visit-arrival figcaption').getBoundingClientRect(), f = document.querySelector('.ftr').getBoundingClientRect(); return { tl: t.left, tt: t.top, ll: l.left, lt: l.top, vb: v.bottom, ltop: l.top, fb: f.top, lb: l.bottom, cr: document.querySelector('.visit-arrival .frame-clip').getBoundingClientRect().left }; });
      ok('F3', Math.abs(g.ll - g.cr) <= 1, `1440: la lista empieza en la columna 7, donde la foto (${Math.round(g.ll)} = ${Math.round(g.cr)})`);
      ok('F3', Math.abs(g.lt - g.tt) <= 1, `1440: titular y lista comparten la línea de arriba (Δ ${Math.round(g.lt - g.tt)})`);
      ok('F3', Math.abs(g.lt - g.vb - 48) <= 1, `1440: del pie de la foto a las preguntas hay 48 (${Math.round(g.lt - g.vb)})`);
    } else {
      const g = await ev(page, () => { const l = document.querySelector('.faq-tit').getBoundingClientRect(), foto = document.querySelector('.visit-arrival figcaption').getBoundingClientRect(); return l.top - foto.bottom; });
      ok('F3', Math.abs(g - 32) <= 1, `${perfil}: de la foto a las preguntas hay 32 (${Math.round(g)})`);
    }
    ok('F4', errores.length === 0, `${perfil}: sin errores en consola (${errores.join(' | ').slice(0, 100)})`);
    if (perfil === '393' || perfil === '1440') { await page.evaluate(() => document.querySelectorAll('.faq-item').forEach(x => { x.open = true; })); await captura(page, `faq-${perfil}-abierta`, '#faq-title'); }
    await browser.close();
  }
  // movimiento: con él, el chevron tiene transición y la respuesta entra con animación; con «reducir movimiento», ninguna de las dos
  for (const reducido of [false, true]) {
    const { browser, page } = await abrir('393', { reducido });
    await page.evaluate(() => { document.querySelector('.faq-item').scrollIntoView(); document.querySelector('.faq-item').open = true; }); // a la vista: en el teléfono Visita usa content-visibility y fuera de ella no recalcula estilos
    await page.waitForFunction(() => /matrix\(-1, 0, 0, -1/.test(getComputedStyle(document.querySelector('.faq-chev')).transform), null, { timeout: 4000 }).catch(() => {}); // la transición del chevron (dur-rapida) termina
    const m = await ev(page, () => { const it = document.querySelector('.faq-item'); const c = getComputedStyle(it.querySelector('.faq-chev')), r = getComputedStyle(it.querySelector('.faq-resp')); return { motion: document.documentElement.classList.contains('motion'), tc: c.transitionDuration, an: r.animationName, giro: c.transform }; });
    if (!reducido) ok('F5', m.motion && m.tc !== '0s' && m.an === 'faq-entra', `con movimiento: el chevron transiciona (${m.tc}) y la respuesta entra (${m.an})`);
    else ok('F5', !m.motion && (m.tc === '0s' || /^0(\.0+)?m?s/.test(m.tc) || m.tc === '1e-05s') && (m.an === 'none' || m.an === ''), `con «reducir movimiento»: ni transición ni animación (${m.tc}, ${m.an})`);
    ok('F5', /matrix\(-1, 0, 0, -1/.test(m.giro), `${reducido ? 'reducido' : 'con movimiento'}: abierta, el chevron está girado (${m.giro.slice(0, 30)}…)`);
    await browser.close();
  }
  // enlaces de las respuestas
  {
    const { browser, page } = await abrir('393');
    await page.evaluate(() => document.querySelectorAll('.faq-item').forEach(x => { x.open = true; }));
    await page.locator('.faq-resp a[href="#horario"]').click(); await sleep(900);
    const h = await ev(page, () => { const b = document.querySelector('#horario').getBoundingClientRect(); return { t: b.top, b: b.bottom, vh: innerHeight }; });
    ok('F6', h.t >= 0 && h.b <= h.vh, `393: «horario habitual» lleva a su tabla, entera a la vista (${Math.round(h.t)}–${Math.round(h.b)})`);
    await page.locator('.faq-resp a[href="#contacto"]').click(); await sleep(900);
    ok('F6', await ev(page, () => document.querySelector('#ftr-title').getBoundingClientRect().top < innerHeight), '393: «Contacto» lleva al pie');
    await page.locator('.faq-resp a[href="#catalogo"]').scrollIntoViewIfNeeded().catch(() => {});
    await page.evaluate(() => document.querySelector('#faq-libro').scrollIntoView({ block: 'center' }));
    await page.locator('.faq-resp a[href="#catalogo"]').click(); await sleep(900);
    ok('F6', await ev(page, () => document.querySelector('#explorer').open && document.querySelector('#explorer').matches(':modal')), '393: «catálogo» abre la hoja Explorar (como «Buscar en el catálogo»)');
    await browser.close();
  }
  // sin JavaScript
  {
    const { browser, page } = await abrir('393', { js: false });
    await page.locator('.faq-preg').first().click(); await sleep(150);
    ok('F7', await ev(page, () => document.querySelector('.faq-item').open && document.querySelector('.faq-resp').getBoundingClientRect().height > 20), 'sin JavaScript: la pregunta se abre y su respuesta se lee (details nativo)');
    await browser.close();
  }
}

// ---------------------------------------------------------------- E · Editoriales
async function editoriales() {
  const catalogo = JSON.parse(readFileSync(join(root, 'assets/data/catalog.json'), 'utf8')).books;
  const esperado = Object.entries(catalogo.reduce((m, b) => { if (b.p) m[b.p] = (m[b.p] || 0) + 1; return m; }, {})).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], 'es'));
  for (const perfil of ['320', '393', '820', '1440']) {
    const { browser, page, errores } = await abrir(perfil);
    const filas = await ev(page, () => [...document.querySelectorAll('.edit-fila')].map(a => ({ n: a.dataset.editorial, h: a.parentElement.getBoundingClientRect().height, txt: a.textContent.replace(/\s+/g, ' ').trim() })));
    ok('E1', filas.length === esperado.length && filas.every((f, i) => f.n === esperado[i][0] && f.txt.includes(`${esperado[i][1]} ${esperado[i][1] === 1 ? 'título' : 'títulos'}`)), `${perfil}: ${filas.length} filas con sus conteos (${filas.map(f => f.txt).join(' | ')})`);
    ok('E1', filas.every(f => f.h >= 56 - 0.5), `${perfil}: cada fila mide ≥ 56 (${filas.map(f => Math.round(f.h)).join('/')})`);
    ok('E1', await sinDesborde(page), `${perfil}: sin desborde horizontal`);
    const chrome = await ev(page, () => [...document.querySelectorAll('.hdr-nav a, .menu-row, .tabbar a')].map(a => a.getAttribute('href')));
    ok('E2', !chrome.some(h => /editorial/i.test(h || '')) && chrome.every(h => h !== '#editoriales'), `${perfil}: sin entrada nueva en la barra, el ☰ ni la barra inferior (${chrome.length} enlaces)`);
    ok('E9', errores.length === 0, `${perfil}: sin errores en consola`);
    await browser.close();
  }
  // teléfono: clic → Explorar con el filtro → Escape → el foco vuelve a la fila
  {
    const { browser, page } = await abrir('393');
    const [nombre, n] = esperado[2]; // la tercera (Iridiscencias o la que toque)
    const fila = page.locator(`.edit-fila[data-editorial="${nombre}"]`);
    await fila.scrollIntoViewIfNeeded(); await fila.click(); await sleep(1800);
    const e = await ev(page, nombre => { const ex = document.querySelector('#explorer'); return { abierta: ex.open && ex.matches(':modal'), estado: document.querySelector('[data-cat-status]').textContent, tarjetas: document.querySelectorAll('[data-cat-grid] > li:not([hidden]):not(.card--sk)').length, chips: [...document.querySelectorAll('[data-cat-chips] li')].map(x => x.textContent.trim()), sel: [...document.querySelectorAll('#cat-filters input:checked')].map(i => i.parentElement.textContent.trim()) }; }, nombre);
    ok('E3', e.abierta, `393: «${nombre}» abre la hoja Explorar`);
    ok('E3', e.tarjetas === n && e.estado.includes(String(n)), `393: la rejilla trae exactamente sus ${n} títulos (${e.tarjetas}; «${e.estado}»)`);
    ok('E3', e.chips.some(c => c.includes(nombre)) || e.sel.some(c => c.includes(nombre)), `393: el filtro Editorial queda aplicado y visible (${e.chips.join(', ')})`);
    await captura(page, 'editoriales-393-explorar');
    await page.keyboard.press('Escape'); await sleep(900);
    ok('E4', await ev(page, nombre => document.activeElement?.dataset?.editorial === nombre, nombre), `393: al cerrar la hoja, el foco vuelve a la fila «${nombre}»`);
    // reabrir con otra editorial reemplaza el filtro (no se acumulan) y quita la búsqueda
    const otra = esperado[0][0];
    await page.locator(`.edit-fila[data-editorial="${otra}"]`).click(); await sleep(1500);
    const e2 = await ev(page, () => ({ tarjetas: document.querySelectorAll('[data-cat-grid] > li:not([hidden]):not(.card--sk)').length, chips: [...document.querySelectorAll('[data-cat-chips] li')].map(x => x.textContent.trim()) }));
    ok('E3', e2.tarjetas === esperado[0][1] && e2.chips.length === 1, `393: otra editorial reemplaza al filtro anterior (${e2.tarjetas} títulos; chips: ${e2.chips.join(', ')})`);
    await browser.close();
  }
  // escritorio y tableta: baja a la rejilla en línea, filtra, y cada editorial da exactamente sus títulos
  for (const perfil of ['1440', '820']) {
    const { browser, page } = await abrir(perfil);
    for (const [nombre, n] of esperado) {
      await page.locator(`.edit-fila[data-editorial="${nombre}"]`).scrollIntoViewIfNeeded();
      await page.locator(`.edit-fila[data-editorial="${nombre}"]`).click(); await sleep(1100);
      const r = await ev(page, () => { const c = document.querySelector('#catalogo').getBoundingClientRect(), h = document.querySelector('[data-hdr]').getBoundingClientRect(); return { top: c.top, hdr: h.bottom, tarjetas: [...document.querySelectorAll('[data-cat-grid] > li')].filter(li => !li.hidden && !li.classList.contains('card--sk')).length, estado: document.querySelector('[data-cat-status]').textContent, foco: document.activeElement?.matches('[data-cat-status]'), q: document.querySelector('[data-cat-q]').value, modal: document.querySelector('#explorer').matches(':modal') }; });
      ok('E5', r.tarjetas === n && r.estado.includes(String(n)) && !r.modal, `${perfil}: «${nombre}» → ${r.tarjetas} títulos (esperados ${n}; «${r.estado}»), rejilla en línea`);
      ok('E5', r.top >= r.hdr - 20 && r.top <= r.hdr + 40 && r.foco, `${perfil}: «${nombre}»: la capa Explorar queda bajo la barra (${Math.round(r.top - r.hdr)} px) y el foco va al estado de resultados`);
    }
    await captura(page, `editoriales-${perfil}-filtrado`);
    await browser.close();
  }
  // sin JavaScript: enlaces a #catalogo
  {
    const { browser, page } = await abrir('393', { js: false });
    const hrefs = await ev(page, () => [...document.querySelectorAll('.edit-fila')].map(a => a.getAttribute('href')));
    ok('E6', hrefs.length === esperado.length && hrefs.every(h => h === '#catalogo'), 'sin JavaScript: cada editorial es un enlace a #catalogo');
    await browser.close();
  }
}

// ---------------------------------------------------------------- M · Merch
async function merch() {
  // M1: con el merch.json real (vacío) no existe nada
  for (const perfil of ['393', '1440']) {
    const { browser, page, errores } = await abrir(perfil);
    const v = await ev(page, () => ({ sec: !!document.querySelector('#merch, [data-merch]'), links: document.querySelectorAll('a[href="#merch"]').length, cls: document.documentElement.classList.contains('has-merch'), txt: /merch/i.test(document.body.innerText), zonas: [...document.querySelectorAll('[aria-current]')].some(a => /merch/i.test(a.getAttribute('href') || '')) }));
    ok('M1', !v.sec && v.links === 0 && !v.cls && !v.txt && !v.zonas, `${perfil}: con productos vacíos no hay sección, enlaces, clase ni texto de merch (${JSON.stringify(v)})`);
    await page.evaluate(() => document.querySelector('#visita').scrollIntoView()); await sleep(500);
    ok('M1', await ev(page, () => document.querySelector('#visita').nextElementSibling === null || true) && await sinDesborde(page), `${perfil}: sin desborde`);
    ok('M1', errores.length === 0, `${perfil}: sin errores en consola`);
    await browser.close();
  }
  // M1b: merch.json con productos inválidos solamente = vacío
  {
    const { browser, page } = await abrir('393', { merch: [{ id: 'X Y', nombre: 'mal' }, { id: 'sin-nombre', tipo: 'x' }, null, 42] });
    ok('M1', !(await ev(page, () => !!document.querySelector('#merch') || document.querySelectorAll('a[href="#merch"]').length > 0)), 'productos todos inválidos: tampoco aparece nada');
    await browser.close();
  }
  for (const n of [1, 3, 12]) {
    const prods = productosDePrueba(n);
    for (const perfil of ['320', '393', '820', '1440']) {
      const { browser, page, errores } = await abrir(perfil, { merch: prods });
      await page.evaluate(() => document.querySelector('#merch')?.scrollIntoView()); await sleep(1200); // las fotos son diferidas: se piden al acercarse
      await page.evaluate(() => document.querySelectorAll('.merch-card').forEach(c => c.scrollIntoView({ block: 'center' }))); await sleep(900);
      const m = await ev(page, () => {
        const s = document.querySelector('#merch'), c = document.querySelector('#cafe'), v = document.querySelector('#visita');
        const cards = [...document.querySelectorAll('.merch-card')];
        const r0 = cards[0]?.getBoundingClientRect();
        const cols = new Set(cards.map(x => Math.round(x.getBoundingClientRect().left))).size;
        return {
          sec: !!s, orden: !!(s && c && v && (c.compareDocumentPosition(s) & Node.DOCUMENT_POSITION_FOLLOWING) && (s.compareDocumentPosition(v) & Node.DOCUMENT_POSITION_FOLLOWING)), n: cards.length, cols,
          cls: document.documentElement.classList.contains('has-merch'),
          nav: [...document.querySelectorAll('.hdr-nav a')].map(a => a.getAttribute('href')), menu: [...document.querySelectorAll('.menu-row')].map(a => a.getAttribute('href')), tab: [...document.querySelectorAll('.tabbar a')].map(a => a.getAttribute('href')),
          h1: document.querySelectorAll('h1').length, titulo: s?.querySelector('h2')?.textContent.replace(/\s+/g, ' ').trim(),
          cuadrada: cards.map(x => { const f = x.querySelector('.merch-foto').getBoundingClientRect(); return Math.abs(f.width - f.height) <= 1; }).every(Boolean),
          fotos: cards.map(x => ({ img: !!x.querySelector('img'), ic: !!x.querySelector('.merch-ic') })),
          precios: cards.map(x => x.querySelector('.merch-precio')?.textContent ?? null), tipos: cards.map(x => x.querySelector('.merch-tipo')?.textContent ?? null),
          hrefs: cards.map(x => decodeURIComponent(x.getAttribute('href'))), blank: cards.every(x => x.target === '_blank' && /noopener/.test(x.rel)),
          acciones: cards.map(x => x.querySelector('.merch-accion').textContent.trim()), texto: s ? s.innerText : '', ancho: r0 ? r0.width : 0,
          acY: cards.map(x => Math.round(x.querySelector('.merch-accion').getBoundingClientRect().bottom)), cardB: cards.map(x => Math.round(x.getBoundingClientRect().bottom)), cardT: cards.map(x => Math.round(x.getBoundingClientRect().top))
        };
      });
      const esperadoCols = perfil === '1440' ? 4 : perfil === '820' ? 3 : 2;
      ok('M2', m.sec && m.orden && m.n === n, `${n} · ${perfil}: la sección existe entre Café y Visita con ${m.n} tarjetas`);
      ok('M2', m.cols === Math.min(n, esperadoCols), `${n} · ${perfil}: ${m.cols} columnas (norma ${esperadoCols})`);
      ok('M2', m.cls && m.nav.includes('#merch') && m.menu.includes('#merch') && !m.tab.includes('#merch'), `${n} · ${perfil}: entrada en el ☰ (${m.menu.includes('#merch')}) y en la barra de escritorio (${m.nav.includes('#merch')}); ninguna en la barra inferior (${m.tab.join(' ')})`);
      ok('M2', m.h1 === 1 && /Merch/.test(m.titulo), `${n} · ${perfil}: un solo h1; titular «${m.titulo}»`);
      if (perfil === '1440') {
        const { lefts, L, W } = await ev(page, () => { const g = document.querySelector('.merch-grid').getBoundingClientRect(); return { lefts: [...document.querySelectorAll('.merch-card')].slice(0, 4).map(c => c.getBoundingClientRect().left), L: g.left, W: g.width }; }), col = (W - 11 * 32) / 12;   // las columnas de la propia rejilla de la página (clientWidth: sin barra de desplazamiento)
        ok('M2', lefts.length === Math.min(n, 4) && lefts.every((x, i) => Math.abs(x - (L + i * 3 * (col + 32))) <= 1), `${n} · 1440: cada tarjeta empieza en una línea de la rejilla de 12 (columnas 1, 4, 7 y 10; ${lefts.map(Math.round).join(', ')})`);
      }
      ok('M2', m.cuadrada, `${n} · ${perfil}: la foto de cada tarjeta es cuadrada`);
      ok('M3', m.hrefs.every((h, i) => h.startsWith('https://wa.me/528180875940?text=Hola, quiero consultar la disponibilidad de «') && h.includes(prods[i].nombre) && (prods[i].precio === null ? !/\$/.test(h) : h.includes(`$${prods[i].precio} MXN`))) && m.blank, `${n} · ${perfil}: cada tarjeta es un enlace a WhatsApp con su producto y su precio (sin precio, sin «$») en otra pestaña`);
      ok('M3', m.acciones.every(a => a === 'Consultar disponibilidad'), `${n} · ${perfil}: el botón de cada tarjeta es «Consultar disponibilidad»`);
      ok('M3', m.precios.every((p, i) => (prods[i].precio === null ? p === null : p === `$${prods[i].precio} MXN`)), `${n} · ${perfil}: precios impresos solo si los hay (${m.precios.map(p => p ?? '—').join(' ')})`);
      ok('M3', !/\bnull\b|undefined|NaN/.test(m.texto), `${n} · ${perfil}: ningún «null», «undefined» ni «NaN» impreso`);
      ok('M3', !/\bdisponible\b|existencia|en stock|gratis|agotad/i.test(m.texto.replace(/Consultar disponibilidad/g, '').replace(/consultar su disponibilidad/g, '')), `${n} · ${perfil}: ningún texto afirma existencias`);
      ok('M3', m.tipos.every((t, i) => t === (prods[i].disponibilidad === 'encargo' ? `${prods[i].tipo} · Por encargo` : prods[i].tipo)), `${n} · ${perfil}: «Por encargo» solo donde la librería lo dice (${m.tipos.join(' | ')})`);
      if (n === 12) {
        const rotas = m.fotos.map((f, i) => [prods[i].foto, f]).filter(([, f]) => !f.img); // sin <img>: foto null o foto rota (404 → se retira)
        ok('M4', m.fotos[1] && !m.fotos[1].img && m.fotos[1].ic, `${perfil}: la foto rota (404) se retira y queda el icono de la tarjeta`);
        ok('M4', m.fotos[4] && !m.fotos[4].img && m.fotos[4].ic && rotas.length >= 2, `${perfil}: un producto sin foto lleva el icono (${rotas.length} tarjetas sin foto)`);
        // la acción queda al pie, alineada con las demás de su fila
        const filas = {}; m.cardT.forEach((t, i) => { (filas[t] ||= []).push(i); });
        ok('M5', Object.values(filas).every(ix => new Set(ix.map(i => m.acY[i])).size === 1 && new Set(ix.map(i => m.cardB[i])).size === 1), `${perfil}: la acción de cada tarjeta se alinea con las de su fila`);
      }
      ok('M2', await sinDesborde(page), `${n} · ${perfil}: sin desborde horizontal`);
      ok('M9', errores.length === 0, `${n} · ${perfil}: sin errores en consola (${errores.join(' | ').slice(0, 100)})`);
      if (n === 12 && (perfil === '393' || perfil === '1440')) await captura(page, `merch-${perfil}-12`, '#merch');
      if (n === 3 && (perfil === '393' || perfil === '1440')) await captura(page, `merch-${perfil}-3`, '#merch');
      if (n === 1 && perfil === '393') await captura(page, 'merch-393-1', '#merch');
      await browser.close();
    }
  }
  // M6: destino actual, teclado y llegada por el ☰ / la barra
  {
    const { browser, page } = await abrir('1440', { merch: productosDePrueba(3) });
    await page.evaluate(() => document.querySelector('#merch').scrollIntoView()); await sleep(600);
    const cur = await ev(page, () => [...document.querySelectorAll('.hdr-nav a[aria-current]')].map(a => a.getAttribute('href')));
    ok('M6', cur.length === 1 && cur[0] === '#merch', `1440: al estar en Merch, la barra marca Merch (${cur})`);
    await page.evaluate(() => document.querySelector('#visita').scrollIntoView()); await sleep(500);
    ok('M6', (await ev(page, () => [...document.querySelectorAll('.hdr-nav a[aria-current]')].map(a => a.getAttribute('href')))).join() === '#visita', '1440: y en Visita, Visita');
    await page.locator('.hdr-nav a[href="#merch"]').click(); await sleep(900);
    const t = await ev(page, () => ({ top: document.querySelector('#merch-title').getBoundingClientRect().top, hdr: document.querySelector('[data-hdr]').getBoundingClientRect().bottom }));
    ok('M6', Math.abs(t.top - t.hdr - 24) <= 12, `1440: el enlace de la barra lleva a Merch con el titular a ~24 px de la barra (${Math.round(t.top - t.hdr)})`);
    await page.keyboard.press('Shift+Tab'); await page.locator('.merch-card').first().focus(); await page.keyboard.press('Shift+Tab'); await page.keyboard.press('Tab'); // modalidad de teclado: :focus-visible
    ok('M6', (await ev(page, () => getComputedStyle(document.activeElement).boxShadow)) !== 'none', '1440: una tarjeta enfocada muestra el anillo');
    await browser.close();
  }
  {
    const { browser, page } = await abrir('393', { merch: productosDePrueba(3) });
    await page.locator('[data-menu-open]').click(); await sleep(900);
    const filas = await ev(page, () => [...document.querySelectorAll('.menu-row')].filter(a => a.getBoundingClientRect().height > 0).map(a => a.textContent.trim()));
    ok('M7', filas.join('|') === 'Inicio|Catálogo|Eventos y talleres|Café y té|Merch|La casa|Visita', `393: el ☰ trae Merch después de Café y té (${filas.join(' · ')})`);
    await page.locator('.menu-row[href="#merch"]').click(); await sleep(1400);
    const t = await ev(page, () => ({ top: document.querySelector('#merch-title').getBoundingClientRect().top, hdr: document.querySelector('[data-hdr]').getBoundingClientRect().bottom, cerrado: !document.querySelector('#menu').open }));
    ok('M7', t.cerrado && Math.abs(t.top - t.hdr - 24) <= 12, `393: el ☰ lleva a Merch con el titular a ~24 px de la cabecera (${Math.round(t.top - t.hdr)})`);
    await browser.close();
  }
  // M8: la barra de escritorio cabe a 1101 px con Merch, también con Novedades (peor caso: siete entradas)
  for (const conNovedades of [false, true]) {
    const { browser, page } = await abrir('1101', { merch: productosDePrueba(3) });
    if (conNovedades) { await page.evaluate(() => { document.documentElement.classList.add('has-news'); document.querySelectorAll('[data-news-link]').forEach(l => { l.hidden = false; }); }); await sleep(300); }
    const b = await ev(page, () => {
      const r = e => e.getBoundingClientRect(), nav = document.querySelector('.hdr-nav'), links = [...nav.querySelectorAll('a')].filter(a => r(a).width > 0), brand = r(document.querySelector('.hdr-brand')), fin = r(document.querySelector('.hdr-end'));
      return { n: links.length, hs: links.map(a => Math.round(r(a).height)), l: Math.round(r(nav).left), r: Math.round(r(nav).right), brandR: Math.round(brand.right), finL: Math.round(fin.left), ancho: document.documentElement.scrollWidth, nombres: links.map(a => a.textContent.trim()), solapa: links.some((a, i) => i && r(a).left < r(links[i - 1]).right - 0.5), listaH: Math.round(r(document.querySelector('.hdr-list')).height), ctaR: Math.round(r(document.querySelector('.hdr-cta')).right), listaL: Math.round(r(document.querySelector('.hdr-list')).left), finR: Math.round(fin.right), navCentro: Math.round((r(nav).left + r(nav).right) / 2), eje: Math.round(innerWidth / 2) };
    });
    ok('M8', b.listaH <= 48 && b.ctaR <= b.listaL && b.finR <= 1101, `1101${conNovedades ? ' con Novedades' : ''}: «Mi lista» en un renglón (${b.listaH} px) y «Cómo llegar» no la pisa (${b.ctaR} ≤ ${b.listaL}); las acciones terminan en ${b.finR}; centro de las secciones ${b.navCentro} (eje ${b.eje})`);
    ok('M8', b.n === (conNovedades ? 6 : 5) && b.hs.every(h => h <= 48) && !b.solapa && b.l >= b.brandR + 8 - 0.5 && b.r <= b.finL - 8 + 0.5 && b.ancho <= 1101, `1101${conNovedades ? ' con Novedades' : ''}: ${b.n} entradas (${b.nombres.join(', ')}) caben: marca ${b.brandR} < barra ${b.l}–${b.r} < acciones ${b.finL}; ninguna se parte`);
    await captura(page, `merch-1101${conNovedades ? '-novedades' : ''}`);
    await browser.close();
  }
  // M10: bandas de fondo: Café, Merch, Visita y el pie nunca repiten fondo con su vecino (sin y con Novedades)
  for (const conNovedades of [false, true]) {
    const { browser, page } = await abrir('393', { merch: productosDePrueba(3) });
    if (conNovedades) { await page.evaluate(() => document.documentElement.classList.add('has-news')); await sleep(200); }
    const bg = await ev(page, () => ['#cafe', '#merch', '#visita', '.ftr'].map(s => getComputedStyle(document.querySelector(s)).backgroundColor));
    ok('M10', bg[0] !== bg[1] && bg[1] !== bg[2] && bg[2] !== bg[3], `bandas${conNovedades ? ' con Novedades' : ''}: Café ≠ Merch ≠ Visita ≠ pie (${bg.join(' | ')})`);
    const listas = await ev(page, () => [['.visit', '.hours'], ['.visit', '.faq-lista'], ['.ftr', '.ftr-links']].map(([a, b]) => [getComputedStyle(document.querySelector(a)).backgroundColor, getComputedStyle(document.querySelector(b)).backgroundColor]));
    ok('M10', listas.every(([a, b]) => a !== b), `bandas${conNovedades ? ' con Novedades' : ''}: el horario, las preguntas y la lista del pie no se funden con su banda`);
    await browser.close();
  }
  // tema oscuro: legible
  {
    const { browser, page } = await abrir('393', { merch: productosDePrueba(3), oscuro: true });
    await captura(page, 'merch-393-oscuro', '#merch');
    ok('M11', await sinDesborde(page), 'oscuro: sin desborde');
    await browser.close();
  }
}

// ---------------------------------------------------------------- A · axe-core
async function axeNuevo() {
  const axeSource = readFileSync(createRequire(join(root, 'package.json')).resolve('axe-core/axe.min.js'), 'utf8');
  const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
  for (const perfil of ['393', '1440']) for (const oscuro of [false, true]) for (const caso of ['inicio', '404']) {
    const { browser, context, page } = await abrir(perfil, { merch: caso === 'inicio' ? productosDePrueba(12) : null, oscuro });
    if (caso === '404') await page.goto(new URL('/no/existe/ruta', URL_).href);
    else {
      await page.evaluate(() => { for (const e of document.querySelectorAll('*')) if (getComputedStyle(e).contentVisibility !== 'visible') e.style.contentVisibility = 'visible'; document.querySelectorAll('.faq-item').forEach(d => { d.open = true; }); document.querySelectorAll('.merch-card').forEach(a => a.scrollIntoView({ block: 'center' })); });
      await sleep(1500);
    }
    await page.evaluate(axeSource);
    const v = await page.evaluate(tags => axe.run({ include: [['body']] }, { runOnly: { type: 'tag', values: tags }, resultTypes: ['violations'] }).then(r => r.violations.map(x => ({ id: x.id, impact: x.impact, n: x.nodes.length, el: x.nodes.slice(0, 2).map(n => n.target.join(' ')) }))), TAGS);
    ok('A1', v.length === 0, `${caso} · ${perfil} · ${oscuro ? 'oscuro' : 'claro'}: axe ${v.length ? JSON.stringify(v) : 'sin violaciones'}`);
    await context.close(); await browser.close();
  }
}

if (SOLO.has('F')) await faq();
if (SOLO.has('E')) await editoriales();
if (SOLO.has('M')) await merch();
if (SOLO.has('A')) await axeNuevo();
const fallos = res.filter(r => !r.ok);
console.log(`\n${res.length - fallos.length}/${res.length} comprobaciones en verde${fallos.length ? `; FALLAN ${fallos.length}: ${[...new Set(fallos.map(f => f.regla))].join(', ')}` : ''}`);
process.exit(fallos.length ? 1 : 0);
