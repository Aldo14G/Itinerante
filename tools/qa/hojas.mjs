// Hojas, avisos y entradas raras: lo que la auditoría de los 20 principios (2026-11-16) encontró y ningún otro script veía.
// Uso: node tools/qa/hojas.mjs URL   (Playwright, como guias.mjs: PLAYWRIGHT_PATH, «playwright» instalado o /opt/node-tools; sin él sale con 2)
//
//  H1 · una hoja que se cierra no vuelve a verse, por ninguna vía (×, Escape, «atrás»), y desaparece a tiempo:
//       con × en ≤ dur-base + un cuadro; con Escape o «atrás» en ≤ 300 ms.
//  H2 · una hoja del teléfono no rebota al abrir (pico sobre su posición final ≤ 1 px) y queda asentada en ≤ dur-base + 60 ms.
//  A1 · el aviso («Guardado en Mi lista.», «Enlace copiado.», «Se descargó el evento para tu calendario.») queda dentro de la ventana y, en
//       el teléfono, sobre la barra inferior. «Compartir» y «Añadir al calendario» de un evento solo existen con un evento con fecha: se miden
//       con un evento de prueba que inyecta esta herramienta (no está en el repo).
//  A2 · el marcador guardado sobre la portada se distingue de su disco (≥ 3:1) con vidrio y en gama media (`data-glass="lite"`).
//  P1 · con `localStorage` bloqueado (leerlo lanza) el carrusel del Catálogo sigue ahí y «Catálogo» de la barra inferior aterriza.
//  T1 · la rejilla que se repinta al filtrar termina dentro de dur-lenta contada desde el clic (2026-11-17: antes con 50 ms de holgura; medía 714).
//  A3 · (2026-11-17) al cerrar la ficha con × el aviso «Guardado en Mi lista.» deja de verse en el mismo fotograma (≤ 1) en que empieza la salida:
//       no queda suelto sobre la portada mientras la hoja sale.
//  F1 · (2026-11-17) «Ver los N anteriores» / «Ver menos» de Eventos anteriores, en el teléfono: tras desplegar y tras plegar, el botón (con el
//       foco) queda entero en la ventana, ≥ 8 px sobre la barra inferior y bajo la cabecera.
// Sale con 1 si algo falla.
import { existsSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

let pw = null;
for (const ruta of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { const m = await import(ruta.startsWith('/') ? pathToFileURL(ruta).href : ruta); pw = m.default?.chromium ? m.default : m; if (pw?.chromium) break; pw = null; } catch { /* la siguiente */ }
}
if (!pw) { console.error('hojas.mjs: no encuentro Playwright (PLAYWRIGHT_PATH=/ruta/a/playwright/index.js)'); process.exit(2); }
const CHROME = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const sleep = ms => new Promise(r => setTimeout(r, ms));

const PERFILES = {
  iphone: { viewport: { width: 393, height: 659 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  d1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
const NUCLEOS = n => `Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => ${n} }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => ${n} });`;
const SIN_ALMACEN = `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } });`;

const res = [];
const ok = (regla, cond, texto) => { res.push({ regla, ok: Boolean(cond), texto }); console.log(`${cond ? '✓' : '✗'} ${regla} ${texto}`); };

// Evento de prueba (dentro de cinco días, hora de Monterrey): da un destacado con «Añadir al calendario» y «Compartir».
const enDias = n => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + n * 86_400_000));
// Nueve eventos anteriores (F1): seis a la vista y «Ver los 9 anteriores». Texto de prueba, no son eventos reales.
const ANTERIORES_DE_PRUEBA = { eventos: Array.from({ length: 9 }, (_, i) => ({ id: `prueba-anterior-${i + 1}`, tipo: 'Lectura', titulo: `Evento anterior de prueba ${i + 1}`, fecha: enDias(-(7 + i * 9)), hora: '18:00', fin: null, con: 'Persona de prueba', descripcion: 'Texto de prueba del arnés. No es un evento real.', imagen: 'assets/img/cartelera-1.webp', alt: 'La sala central', reserva: null })) };
const EVENTO_DE_PRUEBA = { eventos: [{ id: 'prueba-hojas', tipo: 'Lectura', titulo: 'Evento de prueba', fecha: enDias(5), hora: '18:57', fin: null, con: null, descripcion: 'Texto de prueba del arnés. No es un evento real.', imagen: 'assets/img/cartelera-1.webp', alt: 'La sala central', reserva: null }] };
async function abrir(perfil, init, { eventos = null } = {}) {
  const browser = await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars'] });
  const context = await browser.newContext({ ...PERFILES[perfil], locale: 'es-MX', timezoneId: 'America/Monterrey', permissions: ['clipboard-read', 'clipboard-write'] });
  if (init) await context.addInitScript(init);
  if (eventos) await context.route('**/assets/data/eventos.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(eventos) }));
  const page = await context.newPage();
  await page.goto(URL_, { waitUntil: 'load' });
  await sleep(1800);
  const dur = await page.evaluate(() => { const cs = getComputedStyle(document.documentElement); const n = k => parseFloat(cs.getPropertyValue(k)); return { base: n('--dur-base'), lenta: n('--dur-lenta'), motion: document.documentElement.classList.contains('motion'), glass: document.documentElement.dataset.glass || 'vidrio' }; });
  return { browser, page, dur };
}
const tap = async (page, perfil, sel, dx = 0.5, dy = 0.5) => { const b = await page.locator(sel).first().boundingBox(); const x = b.x + b.width * dx, y = b.y + b.height * dy; if (PERFILES[perfil].hasTouch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
const centrar = async (page, sel, espera = 2600) => { await page.evaluate(s => document.querySelector(s).scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await sleep(espera); };
// Muestrea una hoja cuadro a cuadro desde el evento `evt` durante `ms`.
const seguir = (page, sel, evt, ms = 900) => page.evaluate(([s, e, m]) => new Promise(done => {
  const el = document.querySelector(s); const muestras = [];
  const on = () => { const t0 = performance.now(); const tick = () => { const t = performance.now() - t0; const r = el.getBoundingClientRect(); const cs = getComputedStyle(el); muestras.push({ t: Math.round(t), y: +r.y.toFixed(1), h: +r.height.toFixed(1), vis: r.height > 0 && cs.display !== 'none' && +cs.opacity > 0.01 && r.top < innerHeight - 1 && r.bottom > 0 }); if (t < m) requestAnimationFrame(tick); else done(muestras); }; requestAnimationFrame(tick); };
  addEventListener(e, on, { capture: true, once: true });
}), [sel, evt, ms]);
const cierre = m => { const oculto = m.find(x => !x.vis)?.t ?? null; return { oculto, reaparece: oculto !== null && m.some(x => x.t > oculto && x.vis) }; };
const apertura = m => { const v = m.filter(x => x.h > 0); const fin = v.at(-1); return { pico: +(fin.y - Math.min(...v.map(x => x.y))).toFixed(1), asentada: v.findLast(x => Math.abs(x.y - fin.y) > 0.5)?.t ?? 0 }; };
const aviso = page => page.evaluate(() => { const t = document.querySelector('.toast'); if (!t) return null; const b = t.getBoundingClientRect(); const tb = document.querySelector('.tabbar')?.getBoundingClientRect(); return { texto: t.textContent.trim().slice(0, 40), y: Math.round(b.top), dentro: b.height > 0 && b.top >= 0 && b.bottom <= innerHeight, sobreBarra: tb && tb.height ? Math.round(tb.top - b.bottom) : null }; });
const marcador = page => page.evaluate(() => {
  const lum = c => { const [r, g, b] = c.match(/[\d.]+/g).slice(0, 3).map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const s = document.querySelector('.rail-item.is-centro .save'); const cs = getComputedStyle(s); const a = lum(cs.backgroundColor), b = lum(cs.color);
  return { pulsado: s.getAttribute('aria-pressed'), fondo: cs.backgroundColor, icono: cs.color, contraste: +((Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05)).toFixed(2) };
});

// ---- Teléfono, con vidrio (8 núcleos) y en gama media (4) ----
for (const nucleos of [8, 4]) {
  const perfil = 'iphone';
  const { browser, page, dur } = await abrir(perfil, NUCLEOS(nucleos));
  const modo = `iPhone 16 · ${dur.glass}`;
  ok('E0', dur.motion, `${modo}: la página corre con movimiento (html.motion)`);
  await centrar(page, '.c3d--portada');
  await tap(page, perfil, '.rail-item.is-centro .save'); await sleep(700);
  const a = await aviso(page);
  ok('A1', a?.dentro && a.sobreBarra >= 8, `${modo}: aviso tras guardar desde la página en y ${a?.y} (dentro: ${a?.dentro}; ${a?.sobreBarra} px sobre la barra inferior)`);
  const mk = await marcador(page);
  ok('A2', mk.pulsado === 'true' && mk.contraste >= 3, `${modo}: marcador guardado ${mk.contraste}:1 (${mk.icono} sobre ${mk.fondo})`);
  if (nucleos === 8) {
    await sleep(4600);
    for (const [nombre, cerrar, evt, tope] of [['×', () => tap(page, perfil, '[data-d-close]'), 'click', dur.base + 50], ['Escape', () => page.keyboard.press('Escape'), 'keydown', 300], ['«atrás»', () => page.evaluate(() => history.back()), 'popstate', 300]]) {
      const pa = seguir(page, '#cat-drawer', 'click', 700);
      await tap(page, perfil, '.rail-item.is-centro .card .cover', 0.5, 0.3);
      const ab = apertura(await pa); await sleep(700);
      if (nombre === '×') ok('H2', ab.pico <= 1 && ab.asentada <= dur.base + 60, `${modo}: la ficha abre sin rebote (pico ${ab.pico} px, asentada a los ${ab.asentada} ms)`);
      const pc = seguir(page, '#cat-drawer', evt, 900);
      await cerrar();
      const c = cierre(await pc);
      ok('H1', c.oculto !== null && c.oculto <= tope && !c.reaparece, `${modo}: ficha con ${nombre}: deja de verse a los ${c.oculto} ms (tope ${tope}); reaparece: ${c.reaparece}`);
      await sleep(500);
    }
    await centrar(page, '[data-ex-open]', 800);
    for (const [nombre, cerrar, evt, tope] of [['×', () => tap(page, perfil, '[data-ex-close]'), 'click', dur.base + 50], ['«atrás»', () => page.evaluate(() => history.back()), 'popstate', 300]]) {
      const pa = seguir(page, '#explorer', 'click', 700);
      await tap(page, perfil, '[data-ex-open]');
      const ab = apertura(await pa); await sleep(1200);
      if (nombre === '×') ok('H2', ab.pico <= 1 && ab.asentada <= dur.base + 60, `${modo}: Explorar abre sin rebote (pico ${ab.pico} px, asentada a los ${ab.asentada} ms)`);
      const pc = seguir(page, '#explorer', evt, 900);
      await cerrar();
      const c = cierre(await pc);
      ok('H1', c.oculto !== null && c.oculto <= tope && !c.reaparece, `${modo}: Explorar con ${nombre}: deja de verse a los ${c.oculto} ms (tope ${tope}); reaparece: ${c.reaparece}`);
      await sleep(600);
    }
    const pa = seguir(page, '#mylist', 'click', 700);
    await tap(page, perfil, '.tab-list');
    const ab = apertura(await pa); await sleep(700);
    ok('H2', ab.pico <= 1 && ab.asentada <= dur.base + 60, `${modo}: Mi lista abre sin rebote (pico ${ab.pico} px, asentada a los ${ab.asentada} ms)`);
    const pc = seguir(page, '#mylist', 'click', 900);
    await tap(page, perfil, '[data-ml-close]');
    const c = cierre(await pc);
    ok('H1', c.oculto !== null && c.oculto <= dur.base + 50 && !c.reaparece, `${modo}: Mi lista con ×: deja de verse a los ${c.oculto} ms; reaparece: ${c.reaparece}`);
  }
  await browser.close();
}

// ---- Teléfono con el almacenamiento bloqueado ----
{
  const { browser, page } = await abrir('iphone', SIN_ALMACEN);
  const t = await page.locator('.tabbar a[href="#libros"]').boundingBox();
  await page.touchscreen.tap(t.x + t.width / 2, t.y + t.height / 2); await sleep(3000);
  const r = await page.evaluate(() => ({ oculto: document.querySelector('[data-rail]')?.hidden ?? true, chips: document.querySelectorAll('.rail-chip').length, central: Boolean(document.querySelector('.rail-item.is-centro')), y: Math.round(scrollY) }));
  ok('P1', !r.oculto && r.chips >= 1 && r.central && r.y > 0, `localStorage bloqueado: carrusel ${r.oculto ? 'oculto' : 'presente'}, ${r.chips} chips, pieza central: ${r.central}; «Catálogo» aterriza en y ${r.y}`);
  await browser.close();
}

// ---- Escritorio ----
{
  const perfil = 'd1440';
  const { browser, page, dur } = await abrir(perfil, NUCLEOS(8), { eventos: EVENTO_DE_PRUEBA });
  await page.evaluate(() => document.querySelector('#cat-grid').scrollIntoView({ block: 'start', behavior: 'instant' })); await sleep(2800);
  await page.evaluate(() => scrollBy(0, -160)); await sleep(500);
  const p = page.evaluate(() => new Promise(done => { addEventListener('click', () => { const t0 = performance.now(); let fin = 0; const n = new Set(); const tick = () => { const t = performance.now() - t0; const a = document.getAnimations().filter(x => x.constructor.name === 'Animation' && x.playState === 'running'); a.forEach(x => n.add(x)); if (a.length) fin = t; if (t < 1200) requestAnimationFrame(tick); else done({ tarjetas: n.size, fin: Math.round(fin) }); }; requestAnimationFrame(tick); }, { capture: true, once: true }); }));
  const f = await page.locator('.cat-opt label').first().boundingBox();
  await page.mouse.click(f.x + 14, f.y + f.height / 2);
  const g = await p;
  ok('T1', g.tarjetas > 0 && g.fin <= dur.lenta, `1440: la rejilla al filtrar (${g.tarjetas} tarjetas) termina a los ${g.fin} ms desde el clic (tope ${dur.lenta})`);
  await centrar(page, '#cartelera .ev-prox');
  await tap(page, perfil, '.ev-prox [data-share]'); await sleep(700);
  const a = await aviso(page);
  ok('A1', a?.dentro && /Enlace copiado/.test(a?.texto || ''), `1440: aviso tras «Compartir» un evento en y ${a?.y} (dentro: ${a?.dentro}; «${a?.texto}»)`);
  await sleep(4600);
  const descarga = page.waitForEvent('download', { timeout: 5000 }).catch(() => null);
  await tap(page, perfil, '.ev-prox [data-ev-cal]'); await sleep(700);
  const d = await descarga, ac = await aviso(page);
  ok('A1', ac?.dentro && /calendario/.test(ac?.texto || '') && d?.suggestedFilename() === 'prueba-hojas.ics', `1440: aviso tras «Añadir al calendario» en y ${ac?.y} (dentro: ${ac?.dentro}; «${ac?.texto}»); se descargó ${d ? d.suggestedFilename() : 'nada'}`);
  await sleep(4600);
  await centrar(page, '.c3d--portada');
  await tap(page, perfil, '.rail-item.is-centro .card .cover', 0.5, 0.3); await sleep(900);
  const pc = seguir(page, '#cat-drawer', 'click', 900);
  await tap(page, perfil, '[data-d-close]');
  const c = cierre(await pc);
  ok('H1', c.oculto !== null && c.oculto <= dur.base + 50 && !c.reaparece, `1440: ficha con ×: deja de verse a los ${c.oculto} ms; reaparece: ${c.reaparece}`);
  await browser.close();
}

// ---- Teléfono: el aviso al cerrar la ficha (A3) ----
{
  const perfil = 'iphone';
  const { browser, page } = await abrir(perfil, NUCLEOS(8));
  await centrar(page, '.c3d--portada');
  await tap(page, perfil, '.rail-item.is-centro .card .cover', 0.5, 0.3); await sleep(900);
  await tap(page, perfil, '#cat-drawer [data-d-save]'); await sleep(600);
  const abierto = await page.evaluate(() => { const t = document.querySelector('.toast'); return Boolean(t?.matches(':popover-open')); });
  const p = page.evaluate(() => new Promise(done => { const out = []; addEventListener('click', () => { const t0 = performance.now(); const tick = () => { const t = performance.now() - t0; const a = document.querySelector('.toast'); const b = a?.getBoundingClientRect(); const cs = a ? getComputedStyle(a) : null; const d = document.querySelector('#cat-drawer').getBoundingClientRect(); out.push({ t: Math.round(t), aviso: Boolean(a && a.matches(':popover-open') && b.height > 0 && cs.display !== 'none' && +cs.opacity > 0.01 && cs.visibility !== 'hidden'), y: b ? Math.round(b.top) : null, hoja: d.height > 0 && d.top < innerHeight - 1 }); if (t < 700) requestAnimationFrame(tick); else done(out); }; requestAnimationFrame(tick); }, { capture: true, once: true }); }));
  await tap(page, perfil, '[data-d-close]');
  const m = await p;
  const visto = m.filter(x => x.aviso);
  const i = m.findIndex(x => !x.aviso);
  ok('A3', abierto && i >= 0 && i <= 1 && !m.slice(i).some(x => x.aviso), `iPhone 16: aviso abierto antes de cerrar: ${abierto}; al cerrar la ficha con × deja de verse en el fotograma ${i} (${i >= 0 ? m[i].t : '—'} ms); fotogramas con el aviso a la vista: ${visto.length}${visto.length ? ` (hasta los ${visto.at(-1).t} ms, en y ${visto.at(-1).y})` : ''}`);
  await browser.close();
}

// ---- Teléfono: «Ver los N anteriores» y «Ver menos» fuera de la barra inferior (F1) ----
for (const reduce of [false, true]) {
  const perfil = 'iphone';
  const browser = await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars'] });
  const context = await browser.newContext({ ...PERFILES[perfil], locale: 'es-MX', timezoneId: 'America/Monterrey', reducedMotion: reduce ? 'reduce' : 'no-preference' });
  await context.route('**/assets/data/eventos.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(ANTERIORES_DE_PRUEBA) }));
  const page = await context.newPage();
  await page.goto(URL_, { waitUntil: 'load' }); await sleep(3600);
  await centrar(page, '#cartelera .ev-fold', 1200);
  const lugar = () => page.evaluate(() => { const b = document.querySelector('#cartelera .ev-fold'); const r = b.getBoundingClientRect(); const tb = document.querySelector('.tabbar').getBoundingClientRect(); const hd = document.querySelector('.hdr').getBoundingClientRect(); return { txt: b.textContent.trim(), exp: b.getAttribute('aria-expanded'), foco: document.activeElement === b, top: Math.round(r.top), bottom: Math.round(r.bottom), barra: Math.round(tb.top), cabecera: Math.round(hd.bottom), filas: [...document.querySelectorAll('#ev-pasados > li')].filter(li => !li.hidden).length }; });
  for (const paso of ['desplegar', 'plegar']) {
    await tap(page, perfil, '#cartelera .ev-fold'); await sleep(1000);
    const r = await lugar();
    ok('F1', r.foco && r.top >= r.cabecera && r.bottom <= r.barra - 8, `iPhone 16${reduce ? ' (movimiento reducido)' : ''}, tras ${paso} (${r.filas} filas, «${r.txt}», aria-expanded ${r.exp}): el botón en y ${r.top}–${r.bottom}; la barra inferior empieza en ${r.barra} y la cabecera termina en ${r.cabecera}; foco en el botón: ${r.foco}`);
  }
  await browser.close();
}

const fallan = res.filter(r => !r.ok).length;
console.log(`\nHOJAS: ${res.length - fallan}/${res.length} comprobaciones bien. FALLAN ${fallan}`);
process.exit(fallan ? 1 : 0);
