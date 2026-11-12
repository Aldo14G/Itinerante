// Carrusel de libros (capa 1 de Libros): recorrido de paradas (forma, objetivos, teclado, progreso local, persistencia, sin salto de alto),
// carrusel, ficha y foco, a 390, 360 y 1280, y una pasada con el almacenamiento bloqueado.
// node tools/qa/rail.mjs URL [DIR]   Las capturas van a DIR (por defecto, el directorio actual).
// Robusto con la máquina cargada (QA1-04): ev() devuelve un valor definido o lanza un error legible (nunca un TypeError
// «of undefined» en el script), y las esperas son por condición con tope en vez de pausas fijas. Si una pantalla aborta,
// se anota como ✗ con el motivo y se sigue con la siguiente; el código de salida es ≠ 0 si algo falló.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Uso: node tools/qa/rail.mjs URL [DIR]'); process.exit(2); }
const OUT = process.argv[3] || '.';
mkdirSync(OUT, { recursive: true });
const port = 9700 + Math.floor(Math.random() * 50);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-r-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 80; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const page = t?.find(x => x.type === 'page');
if (!page) { chrome.kill(); console.error(`rail.mjs: Chrome no respondió en el puerto ${port} en 20 s (CHROME_PATH=${process.env.CHROME_PATH || 'por defecto'})`); process.exit(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', () => j(new Error('rail.mjs: no se pudo abrir el WebSocket de CDP')), { once: true }); });
let id = 0; const pend = new Map(); const errs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, m => m.error ? rej(new Error(`CDP ${method}: ${m.error.message}`)) : res(m));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const short = x => x.replace(/\s+/g, ' ').trim().slice(0, 110);
// ev(): evalúa en la página y devuelve un valor definido; lanza con el motivo y la expresión si la página lanzó o no devolvió nada.
// run(): igual, para sentencias con efecto que no devuelven valor (scrollTo, focus…).
const ev = async (x, { allowUndefined = false } = {}) => {
  const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true });
  const det = r.result?.exceptionDetails;
  if (det) throw new Error(`la página lanzó al evaluar «${short(x)}»: ${det.exception?.description || det.text}`);
  const v = r.result?.result?.value;
  if (v === undefined && !allowUndefined) throw new Error(`ev() no devolvió valor al evaluar «${short(x)}» (¿elemento inexistente o página aún cargando?)`);
  return v;
};
const run = x => ev(x, { allowUndefined: true });
// waitFor(): espera a que una expresión sea verdadera (poll cada 100 ms) o lanza con «qué» esperaba y el tope.
const waitFor = async (cond, what, timeout = 15000) => {
  const t0 = Date.now();
  for (;;) {
    let ok = false; try { ok = await ev(`!!(${cond})`); } catch (e) { if (Date.now() - t0 > timeout) throw e; }
    if (ok) return true;
    if (Date.now() - t0 > timeout) throw new Error(`esperando ${what} (tope ${timeout} ms): «${short(cond)}»`);
    await sleep(100);
  }
};
// settle(): espera a que una expresión sea verdadera, con tope, pero no lanza: devuelve si se cumplió (para «nada debe cambiar»).
const settle = async (cond, timeout = 3000) => { try { return await waitFor(cond, 'settle', timeout); } catch { return false; } };
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

// Ayudantes dentro de la página: until(fn, ms) resuelve en cuanto fn() es verdadera (poll de 50 ms) o rechaza al tope; stable(fn, ms, quiet) espera a
// que fn() lleve `quiet` ms sin cambiar (desplazamiento o lista que terminan de moverse); settled(el) espera a que el elemento no tenga transiciones ni animaciones en curso.
const HELPERS = `(() => {
  if (window.__itiQa) return true;
  const until = (fn, ms = 5000, what = '') => new Promise((res, rej) => { const t0 = performance.now(); (function tick() { let v; try { v = fn(); } catch {} if (v) return res(v); if (performance.now() - t0 > ms) return rej(new Error('until: ' + (what || fn.toString().slice(0, 90)) + ' (' + ms + ' ms)')); setTimeout(tick, 50); })(); });
  const stable = (fn, ms = 3000, quiet = 250) => new Promise(res => { const t0 = performance.now(); let last = fn(), since = t0; (function tick() { const now = performance.now(); const v = fn(); if (v !== last) { last = v; since = now; } if (now - since >= quiet || now - t0 > ms) return res(v); setTimeout(tick, 50); })(); });
  const settled = (el, ms = 3000) => until(() => el.getAnimations().length === 0, ms, 'transiciones de ' + (el.className || el.tagName)).catch(() => false);
  window.__itiQa = { until, stable, settled }; return true;
})()`;
// Cambio de colección: la etiqueta del carrusel nombra la colección, la pista deja aria-busy y la lista deja de crecer.
const AFTER_CHIP = `async chip => { const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); const tr = r.querySelector('[data-rail-track]'); const name = chip.querySelector('.rail-chip-name').textContent.trim();
  await __itiQa.until(() => v.getAttribute('aria-label').includes(name) && !tr.hasAttribute('aria-busy') && tr.children.length > 0, 8000, 'colección ' + name);
  await __itiQa.stable(() => tr.children.length); }`;
// Estado del recorrido: paradas (forma, estado, icono), progreso y posición del carrusel dentro de la pieza (para vigilar que nada salte de alto).
const TRAIL = `(() => { const r = document.querySelector('[data-rail]'); const g = r.querySelector('[data-rail-chips]'); const top = r.getBoundingClientRect().top;
  const bar = r.querySelector('[data-rail-trail-bar]'); const all = r.querySelector('[data-rail-trail-all]'); const foot = r.querySelector('.rail-all');
  const stops = [...g.querySelectorAll('.rail-stop')].map(st => { const c = st.querySelector('.rail-chip'); const b = c.getBoundingClientRect(); const n = c.querySelector('.rail-chip-name'); const nb = n.getBoundingClientRect(); const use = c.querySelector(':scope > svg use').getAttribute('href');
    return { id: c.dataset.id, name: n.textContent.trim(), role: c.getAttribute('role'), checked: c.getAttribute('aria-checked'), tab: c.tabIndex, seen: st.classList.contains('is-seen'), sr: c.querySelector('[data-stop-seen]').textContent, badge: getComputedStyle(c.querySelector('.rail-chip-done')).display !== 'none', pop: c.classList.contains('is-pop'),
      icon: use, sprite: !!document.querySelector(use), w: Math.round(c.offsetWidth), h: Math.round(c.offsetHeight), cx: b.left + b.width / 2, cy: b.top + b.height / 2, rr: b.width / 2, nameLines: Math.round(nb.height / parseFloat(getComputedStyle(n).lineHeight)), nameCut: n.scrollWidth > n.clientWidth + 1, nameBottom: nb.bottom, fs: getComputedStyle(n).fontSize, ff: getComputedStyle(n).fontFamily.split(',')[0].replaceAll('"', ''), fw: getComputedStyle(n).fontWeight }; });
  const gb = g.getBoundingClientRect();
  return { role: g.getAttribute('role'), label: g.getAttribute('aria-label'), stops, gap: stops.slice(1).map((st, i) => Math.round(Math.hypot(st.cx - stops[i].cx, st.cy - stops[i].cy) - st.rr - stops[i].rr)), zig: stops.length > 1 ? Math.round(Math.abs(stops[1].cy - stops[0].cy)) : 0,
    rowBottom: gb.bottom, namesInside: stops.every(st => st.nameBottom <= gb.bottom + 1), scrolls: g.scrollWidth > g.clientWidth + 1, overY: g.scrollHeight > g.clientHeight + 1,
    bar: { tag: bar.tagName, value: bar.value, max: bar.max, name: bar.getAttribute('aria-label'), valuetext: bar.getAttribute('aria-valuetext'), h: Math.round(bar.getBoundingClientRect().height) },
    text: r.querySelector('[data-rail-trail-text]').textContent, allShown: !all.hidden && all.getBoundingClientRect().width > 0, footShown: getComputedStyle(foot).visibility !== 'hidden',
    vpTop: Math.round(r.querySelector('[data-rail-viewport]').getBoundingClientRect().top - top), noteTop: Math.round(r.querySelector('[data-rail-note]').getBoundingClientRect().top - top), headH: Math.round(r.querySelector('.rail-head').getBoundingClientRect().height),
    stored: (() => { try { return localStorage.getItem('iti-recorrido-v1'); } catch { return 'bloqueado'; } })(), live: r.querySelector('[data-rail-live]').textContent }; })()`;
const READY = `document.querySelector('[data-rail]').classList.contains('is-ready') && !document.querySelector('[data-rail] .card--sk') && document.querySelectorAll('[data-rail] .rail-item').length > 0`;

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);
const document_text = t => [t.text, t.live, t.bar.name, t.bar.valuetext, ...t.stops.map(x => x.name + x.sr)].join(' ');

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['móvil 360', 360, 740, true], ['escritorio', 1280, 800, false]]) {
  errs.length = 0;
  try {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }); // maxTouchPoints 0 es un error de CDP (antes se ignoraba en silencio)
    await send('Page.navigate', { url: URL_ });
    await waitFor(`document.readyState === 'complete' && document.querySelector('[data-rail]') && document.documentElement.classList.contains('js')`, 'la página cargada', 30000);
    await run(`localStorage.removeItem('iti-recorrido-v1')`); // cada pantalla empieza el recorrido de cero (el carrusel aún no se ha cargado: está lejos de la vista)
    await ev(HELPERS);
    // Esqueleto de las paradas: reserva la caja exacta de la fila real (se mide antes de acercarse, con el carrusel sin cargar).
    const sk = await ev(`(() => { const r = document.querySelector('[data-rail]'); const g = r.querySelector('[data-rail-chips]'); return { ready: r.classList.contains('is-ready'), n: g.querySelectorAll('.sk-chip').length, rowH: Math.round(g.getBoundingClientRect().height), headH: Math.round(r.querySelector('.rail-head').getBoundingClientRect().height), text: r.querySelector('[data-rail-trail-text]').textContent }; })()`);
    await run(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
    await run(`scrollBy(0, 1)`);
    // El carrusel se carga al acercarse: esperar a que esté listo y sin esqueletos (con la máquina cargada tarda más que una pausa fija).
    await waitFor(`document.querySelector('[data-rail]').classList.contains('is-ready') && !document.querySelector('[data-rail] .card--sk') && document.querySelectorAll('[data-rail] .rail-item').length > 0`, 'el carrusel listo (is-ready, sin esqueletos)', 30000);
    await ev(`__itiQa.stable(() => document.querySelectorAll('[data-rail] .rail-item').length)`);
    const st = await ev(`(() => {
      const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]');
      const items = [...r.querySelectorAll('.rail-item')]; const first = items[0].getBoundingClientRect();
      const ctrl = getComputedStyle(r.querySelector('.rail-ctrl')).display;
      return {
        ready: r.classList.contains('is-ready'), hidden: r.hidden, n: items.length,
        chips: [...r.querySelectorAll('.rail-chip-name')].map(c => c.textContent),
        checked: r.querySelectorAll('.rail-chip[aria-checked=true]').length,
        vw: v.clientWidth, sw: v.scrollWidth, firstW: Math.round(first.width),
        visible: items.filter(i => { const b = i.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth + 1; }).length,
        peek: items.some(i => { const b = i.getBoundingClientRect(); return b.left < innerWidth && b.right > innerWidth; }),
        snap: getComputedStyle(v).scrollSnapType, role: v.getAttribute('aria-roledescription'), tab: v.tabIndex, ctrl,
        sk: r.querySelectorAll('.card--sk').length,
        small: [...r.querySelectorAll('.rail-chip, .rail-btn')].filter(b => b.getBoundingClientRect().width > 0 && (b.getBoundingClientRect().height < 44 || b.getBoundingClientRect().width < 44)).length,
        docW: document.documentElement.scrollWidth === document.documentElement.clientWidth
      };
    })()`);
    ck(name + ': carrusel listo, 4 colecciones, 12 tarjetas, sin esqueletos', st.ready && !st.hidden && st.chips.length === 4 && st.checked === 1 && st.n === 12 && st.sk === 0, JSON.stringify(st));
    ck(name + ': snap, rol y foco accesibles', /x mandatory/.test(st.snap) && st.role === 'carrusel' && st.tab === 0, JSON.stringify(st));
    ck(name + ': se asoma la siguiente tarjeta', st.peek && st.sw > st.vw, JSON.stringify(st));
    ck(name + ': sin desborde de la página', st.docW);
    ck(name + ': objetivos de 44px o más', st.small === 0, String(st.small));
    // ---------- Recorrido ----------
    await settle(`document.querySelector('[data-rail] .rail-stop.is-seen')`, 4000); // la parada inicial cuenta cuando el carrusel entra en pantalla
    const t0 = await ev(TRAIL);
    ck(name + ': recorrido = radiogroup «Colección» con 4 paradas role=radio, una marcada y un solo punto de tabulación', t0.role === 'radiogroup' && t0.label === 'Colección' && t0.stops.length === 4 && t0.stops.every(x => x.role === 'radio') && t0.stops.filter(x => x.checked === 'true').length === 1 && t0.stops.filter(x => x.tab === 0).length === 1 && t0.stops[0].checked === 'true' && t0.stops[0].tab === 0, JSON.stringify(t0.stops.map(x => [x.role, x.checked, x.tab])));
    ck(name + ': cada parada es un control redondo de 64 px (objetivo ≥ 48) con ≥ 8 px a su vecina, icono propio del sprite y nombre en la familia redonda (800) sin cortarse, en 2 renglones como máximo', t0.stops.every(x => x.w === 64 && x.h === 64 && x.sprite && x.name && !x.nameCut && x.nameLines >= 1 && x.nameLines <= 2 && x.ff === 'Nunito' && x.fw === '800') && new Set(t0.stops.map(x => x.icon)).size === 4 && t0.gap.every(g => g >= 8) && t0.namesInside && !t0.overY, JSON.stringify({ gap: t0.gap, stops: t0.stops.map(x => [x.w, x.h, x.icon, x.nameLines, x.nameCut, x.ff, x.fw, x.fs]), inside: t0.namesInside, overY: t0.overY }));
    if (mobile) ck(name + ': la fila alterna la altura de las paradas (zigzag) y, si no caben, se desplaza', t0.zig >= 16 && (w >= 360 ? !t0.scrolls : t0.scrolls), JSON.stringify({ zig: t0.zig, scrolls: t0.scrolls }));
    ck(name + ': el esqueleto reserva la fila de paradas y el progreso: la cabecera del carrusel mide lo mismo antes y después de cargar', !sk.ready && sk.n === 4 && sk.headH === t0.headH, JSON.stringify({ sk, headH: t0.headH }));
    ck(name + ': al llegar, solo la parada inicial está hojeada: insignia, «1 de 4 paradas hojeadas», barra de progreso nativa con nombre y el dato guardado en este dispositivo', t0.stops.map(x => x.seen).join() === 'true,false,false,false' && t0.stops[0].badge && !t0.stops[1].badge && /, hojeada/.test(t0.stops[0].sr) && t0.text === '1 de 4 paradas hojeadas' && t0.bar.tag === 'PROGRESS' && t0.bar.value === 1 && t0.bar.max === 4 && t0.bar.name && t0.bar.valuetext === t0.text && !t0.allShown && t0.footShown && t0.stored === '["ciencia-ficcion"]' && !t0.stops.some(x => x.pop), JSON.stringify({ seen: t0.stops.map(x => x.seen), text: t0.text, bar: t0.bar, stored: t0.stored, all: t0.allShown, pop: t0.stops.map(x => x.pop) }));
    // Teclado: las flechas mueven la selección y el foco juntos; Tab entra por la parada marcada.
    await run(`document.querySelector('.rail-chip[tabindex="0"]').focus()`);
    await key('ArrowRight', 'ArrowRight', 39);
    await waitFor(`document.activeElement.dataset.id === 'suspenso' && document.activeElement.getAttribute('aria-checked') === 'true'`, 'flecha derecha elige Suspenso', 5000);
    await run(`(${AFTER_CHIP})(document.activeElement)`);
    const k1 = await ev(TRAIL);
    await key('ArrowLeft', 'ArrowLeft', 37);
    await waitFor(`document.activeElement.dataset.id === 'ciencia-ficcion' && document.activeElement.getAttribute('aria-checked') === 'true'`, 'flecha izquierda vuelve a Ciencia ficción', 5000);
    await run(`(${AFTER_CHIP})(document.activeElement)`);
    await key('ArrowLeft', 'ArrowLeft', 37);
    await waitFor(`document.activeElement.dataset.id === 'memorias'`, 'flecha izquierda desde la primera da la vuelta a la última', 5000);
    await run(`(${AFTER_CHIP})(document.activeElement)`);
    const k2 = await ev(TRAIL);
    ck(name + ': teclado: las flechas eligen y enfocan la parada vecina (dan la vuelta), queda un solo tabindex=0 y la región viva dice la colección y el progreso', k1.stops[1].checked === 'true' && k1.stops.filter(x => x.tab === 0).length === 1 && k1.stops[1].tab === 0 && k1.text === '2 de 4 paradas hojeadas' && /^Suspenso: \d+ libros\. 2 de 4 paradas hojeadas\.$/.test(k1.live) && k2.stops[3].checked === 'true' && k2.stops[3].tab === 0 && k2.stops.filter(x => x.tab === 0).length === 1 && k2.text === '3 de 4 paradas hojeadas', JSON.stringify({ k1: [k1.text, k1.live, k1.stops.map(x => x.tab)], k2: [k2.text, k2.live, k2.stops.map(x => x.tab)] }));
    ck(name + ': elegir paradas no mueve la nota ni el carrusel', [k1, k2].every(k => k.vpTop === t0.vpTop && k.noteTop === t0.noteTop && k.headH === t0.headH), JSON.stringify([t0, k1, k2].map(k => [k.noteTop, k.vpTop, k.headH])));
    await run(`document.querySelector('.rail-chip').click()`); // de vuelta a la primera parada para lo que sigue
    await run(`(${AFTER_CHIP})(document.querySelector('.rail-chip'))`);
    if (mobile) ck('móvil: cerca de 2.3 tarjetas por vista', st.firstW >= 140 && st.firstW <= 175 && st.visible >= 2 && st.visible <= 3, JSON.stringify({ w: st.firstW, vis: st.visible }));
    else {
      const fine = await ev(`matchMedia('(hover: hover) and (pointer: fine)').matches`);
      ck('escritorio: flechas visibles con puntero fino (o ocultas si el entorno no lo reporta)', fine ? st.ctrl === 'flex' : st.ctrl === 'none', JSON.stringify({ fine, ctrl: st.ctrl }));
      const btn = await ev(`(async () => {
        const sh = new CSSStyleSheet(); sh.replaceSync('.rail-ctrl { display: flex !important; }'); document.adoptedStyleSheets = [...document.adoptedStyleSheets, sh];
        const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); v.scrollTo({ left: 0, behavior: 'instant' });
        await __itiQa.until(() => v.scrollLeft === 0, 2000, 'carrusel al inicio');
        const before = v.scrollLeft; r.querySelector('[data-rail-next]').click(); await __itiQa.stable(() => v.scrollLeft, 4000);
        const mid = v.scrollLeft; r.querySelector('[data-rail-prev]').click(); await __itiQa.stable(() => v.scrollLeft, 4000);
        return { before, mid, after: v.scrollLeft, step: Math.round(v.clientWidth * 0.85) };
      })()`);
      ck('escritorio: las flechas desplazan hacia delante y hacia atrás', btn.mid > btn.before + 100 && btn.after < btn.mid, JSON.stringify(btn));
      ck('escritorio: de 4 a 6 tarjetas completas', st.visible >= 4 && st.visible <= 6, String(st.visible));
    }
    const col = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const first = r.querySelector('.rail-item .cover-title').textContent;
      const chip = r.querySelectorAll('.rail-chip')[1]; chip.click(); await (${AFTER_CHIP})(chip);
      return { changed: r.querySelector('.rail-item .cover-title').textContent !== first, label: r.querySelector('[data-rail-viewport]').getAttribute('aria-label'), live: r.querySelector('[data-rail-live]').textContent, n: r.querySelectorAll('.rail-item').length, sl: r.querySelector('[data-rail-viewport]').scrollLeft };
    })()`);
    ck(name + ': cambiar de colección renueva libros, etiqueta y aviso', col.changed && /Suspenso/.test(col.label) && /Suspenso/.test(col.live) && col.n > 0 && col.sl === 0, JSON.stringify(col));
    // Plantilla: junto al carrusel solo va la nota de la colección, que cambia con cada una; ningún sello de muestra.
    const seal = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const out = [];
      for (const chip of r.querySelectorAll('.rail-chip')) {
        chip.click(); await (${AFTER_CHIP})(chip);
        const n = r.querySelector('[data-rail-note]'); const b = n.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(n);
        out.push({ col: chip.querySelector('.rail-chip-name').textContent, vpTop: Math.round(r.querySelector('[data-rail-viewport]').getBoundingClientRect().top - r.getBoundingClientRect().top), shown: b.width > 0 && b.height > 0 && getComputedStyle(n).visibility === 'visible' && !n.closest('[hidden]'), lines: range.getClientRects().length, note: n.textContent, seal: !!r.querySelector('[data-rail-seal], .rail-seal') || /Datos de muestra|no es inventario/.test(document.body.innerText), above: b.bottom <= r.querySelector('[data-rail-viewport]').getBoundingClientRect().top + 1 });
      }
      return out;
    })()`);
    ck(name + ': con las 4 colecciones la nota de la colección se ve, en una línea, antes del carrusel, cambia con cada una y no hay sello de muestra', seal.length === 4 && seal.every(s => s.shown && s.lines === 1 && !s.seal && s.above && s.note && !/inventario|muestra/i.test(s.note)) && new Set(seal.map(s => s.note)).size === 4, JSON.stringify(seal));
    // Recorrido completo: las cuatro hojeadas, mensaje sobrio con su salida, y el carrusel en el mismo sitio que al llegar.
    const t1 = await ev(TRAIL);
    const exit = await ev(`(() => { const a = document.querySelector('[data-rail-trail-all]'); const b = a.getBoundingClientRect(); const hit = dy => { const e = document.elementFromPoint(b.left + b.width / 2, b.top + b.height / 2 + dy); return !!e && (e === a || a.contains(e)); }; return { href: a.getAttribute('href'), text: a.textContent, up: hit(-21), down: hit(21), inView: b.top >= 0 && b.bottom <= innerHeight }; })()`);
    ck(name + ': al hojear las 4, «Ya hojeaste las 4 colecciones.» con la salida «Ver todo el catálogo» (objetivo ≥ 44 px), barra llena y sin premios', t1.stops.every(x => x.seen && x.badge) && t1.text === 'Ya hojeaste las 4 colecciones.' && t1.bar.value === 4 && t1.allShown && !t1.footShown && exit.href === '#catalogo' && exit.text === 'Ver todo el catálogo' && exit.up && exit.down && !/punto|racha|reto|nivel|logro|felicidades|🎉/i.test(document_text(t1)), JSON.stringify({ text: t1.text, bar: t1.bar, all: t1.allShown, foot: t1.footShown, exit, seen: t1.stops.map(x => x.seen) }));
    ck(name + ': ni cambiar de parada ni completar el recorrido mueven la nota ni el carrusel', seal.every(s => s.vpTop === t0.vpTop) && t1.vpTop === t0.vpTop && t1.noteTop === t0.noteTop && t1.headH === t0.headH, JSON.stringify({ t0: [t0.noteTop, t0.vpTop, t0.headH], t1: [t1.noteTop, t1.vpTop, t1.headH], seal: seal.map(s => s.vpTop) }));
    // Una sola taxonomía a la vista: elegir un tema de consulta marca la colección equivalente y el estado activo es el mismo.
    // El tema sin equivalente (Poesía) no debe cambiar nada: se le da un tope corto para «cambiar» y se comprueba que no lo hizo.
    const link = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const t = document.querySelector('.topic[data-topic="cronica"]');
      const on = () => r.querySelector('.rail-chip[aria-checked=true] .rail-chip-name').textContent;
      const chip0 = r.querySelectorAll('.rail-chip')[0]; chip0.click(); await (${AFTER_CHIP})(chip0);
      t.click(); await __itiQa.until(() => on() === 'Memorias' && document.querySelector('.topic[aria-checked=true]'), 6000, 'Crónica marca Memorias'); await (${AFTER_CHIP})(r.querySelector('.rail-chip[aria-checked=true]'));
      const bg = e => getComputedStyle(e).backgroundColor;
      const first = document.querySelector('.topic[aria-checked=true]'); const cta = document.querySelector('.btn--tungsten');
      await __itiQa.settled(first); await __itiQa.settled(r.querySelector('.rail-chip[aria-checked=true]')); // los colores se leen con la transición terminada
      const out = { chip: on(), topic: first && first.dataset.topic, chipBg: bg(r.querySelector('.rail-chip[aria-checked=true]')), topicBg: bg(first), ctaBg: bg(cta), chipFg: getComputedStyle(r.querySelector('.rail-chip[aria-checked=true]')).color, topicFg: getComputedStyle(first).color };
      document.querySelector('.topic[data-topic="poesia"]').click(); await __itiQa.until(() => on() !== 'Memorias', 1200).catch(() => {});
      out.sinEquivalente = on();
      document.querySelector('.topic[data-topic="narrativa"]').click(); await __itiQa.until(() => on() !== 'Memorias', 6000, 'Narrativa cambia de colección'); await (${AFTER_CHIP})(r.querySelector('.rail-chip[aria-checked=true]'));
      out.narrativa = on();
      return out;
    })()`);
    ck(name + ': elegir el tema Crónica marca Memorias, Poesía (sin equivalente) la deja y Narrativa vuelve a una colección de narrativa', link.chip === 'Memorias' && link.topic === 'cronica' && link.sinEquivalente === 'Memorias' && ['Ciencia ficción', 'Suspenso', 'Novela histórica'].includes(link.narrativa), JSON.stringify(link));
    if (mobile) ck('móvil: el chip activo del carrusel y el del tema comparten fondo y tinta, y no son el turquesa profundo de «Cómo llegar»', link.chipBg === link.topicBg && link.chipFg === link.topicFg && link.chipBg !== link.ctaBg, JSON.stringify(link));
    await run(`document.querySelector('[data-rail-viewport]').scrollTo({ left: 600, behavior: 'instant' })`);
    await settle(`getComputedStyle(document.querySelector('[data-rail-thumb]')).transform !== 'none' && !document.querySelector('[data-rail-prev]').disabled`);
    const sc = await ev(`(() => { const r = document.querySelector('[data-rail]'); return { tr: getComputedStyle(r.querySelector('[data-rail-thumb]')).transform, prev: r.querySelector('[data-rail-prev]').disabled, next: r.querySelector('[data-rail-next]').disabled }; })()`);
    ck(name + ': el progreso y los botones siguen el desplazamiento', sc.tr !== 'none' && sc.tr !== 'matrix(1, 0, 0, 1, 0, 0)' && sc.prev === false, JSON.stringify(sc));
    await run(`const v = document.querySelector('[data-rail-viewport]'); v.scrollTo({ left: 0, behavior: 'instant' }); v.focus()`);
    await waitFor(`document.activeElement === document.querySelector('[data-rail-viewport]') && document.querySelector('[data-rail-viewport]').scrollLeft === 0`, 'el carrusel enfocado y al inicio', 5000);
    await key('ArrowRight', 'ArrowRight', 39);
    await settle(`document.querySelector('[data-rail-viewport]').scrollLeft > 40`);
    await ev(`__itiQa.stable(() => document.querySelector('[data-rail-viewport]').scrollLeft, 3000, 300)`); // que el desplazamiento suave termine antes de volver al inicio (si no, sigue moviéndose bajo el Tab)
    ck(name + ': flecha derecha desplaza', (await ev(`document.querySelector('[data-rail-viewport]').scrollLeft`)) > 40);
    // Tab recorre las 12 tarjetas y sus «Guardar»: la enfocada nunca queda recortada por el borde del carrusel.
    await run(`(() => { const vp = document.querySelector('[data-rail-viewport]'); vp.scrollTo({ left: 0, behavior: 'instant' }); vp.focus(); })()`);
    await waitFor(`document.activeElement === document.querySelector('[data-rail-viewport]') && document.querySelector('[data-rail-viewport]').scrollLeft === 0`, 'el carrusel enfocado antes de tabular', 5000);
    await ev(`__itiQa.stable(() => document.querySelector('[data-rail-viewport]').scrollLeft, 3000, 300)`);
    const clipped = []; let stops = 0;
    for (let i = 0; i < 30; i++) {
      await run(`window.__itiPrev = document.activeElement`);
      await key('Tab', 'Tab', 9);
      // El foco cambia (o Tab salió del carrusel) y el carrusel termina de desplazarse hasta la tarjeta enfocada.
      await settle(`document.activeElement !== window.__itiPrev`, 3000);
      await ev(`__itiQa.stable(() => document.querySelector('[data-rail-viewport]').scrollLeft, 3000, 350)`); // el desplazamiento suave arranca en focusin y puede tardar un fotograma
      const st = await ev(`(() => { const a = document.activeElement; const it = a.closest('[data-rail-track] .rail-item'); if (!it) return { out: true }; const b = it.getBoundingClientRect(); const vp = document.querySelector('[data-rail-viewport]'); const r = vp.getBoundingClientRect(); return { t: a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30), ok: b.left >= r.left - 1 && b.right <= r.right + 1, l: Math.round(b.left - r.left), rr: Math.round(r.right - b.right), sl: Math.round(vp.scrollLeft), max: vp.scrollWidth - vp.clientWidth }; })()`);
      if (st.out) break;
      stops += 1; if (!st.ok) clipped.push(`${st.t} (izq ${st.l}, der ${st.rr}, scroll ${st.sl}/${st.max})`);
    }
    ck(name + ': Tab recorre las 24 paradas del carrusel sin dejar recortada la tarjeta enfocada', stops === 24 && !clipped.length, JSON.stringify({ stops, clipped }));
    const fich = await ev(`(async () => {
      const c = document.querySelector('[data-rail] .rail-item .card'); c.focus(); c.click();
      await __itiQa.until(() => { const d = document.getElementById('cat-drawer'); return d && d.open && d.querySelector('[data-d-title]')?.textContent; }, 15000, 'la ficha abierta').catch(() => {});
      const d = document.getElementById('cat-drawer'); const tt = d && d.querySelector('[data-d-title]')?.textContent;
      return { open: !!(d && d.open), same: tt === c.querySelector('.cover-title').textContent, sheet: document.documentElement.classList.contains('sheet-open') };
    })()`);
    ck(name + ': el libro abre la ficha del catálogo', fich.open && fich.same && fich.sheet, JSON.stringify(fich));
    await key('Escape', 'Escape', 27);
    await settle(`!document.getElementById('cat-drawer')?.open && !document.documentElement.classList.contains('sheet-open')`, 6000);
    await settle(`document.activeElement.closest('[data-rail]')`, 2000);
    const back = await ev(`(() => { const a = document.activeElement; return { inRail: !!a.closest('[data-rail]'), cls: a.className, open: !!document.getElementById('cat-drawer')?.open }; })()`);
    ck(name + ': al cerrar la ficha el foco vuelve a la tarjeta', back.inRail, JSON.stringify(back));
    // Persistencia: al recargar, lo hojeado vuelve pintado (sin rebote: nadie tocó nada) y la primera parada sigue siendo la actual.
    await send('Page.navigate', { url: URL_ });
    await waitFor(`document.readyState === 'complete' && document.querySelector('[data-rail]') && document.documentElement.classList.contains('js')`, 'la página recargada', 30000);
    await ev(HELPERS);
    await run(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
    await run(`scrollBy(0, 1)`);
    await waitFor(READY, 'el carrusel listo tras recargar', 30000);
    const t2 = await ev(TRAIL);
    ck(name + ': al recargar, el recorrido guardado vuelve (4 hojeadas, mensaje y salida) sin rebote y con la primera parada como actual', t2.stops.every(x => x.seen && x.badge && !x.pop) && t2.text === 'Ya hojeaste las 4 colecciones.' && t2.allShown && t2.stops[0].checked === 'true' && t2.vpTop === t0.vpTop, JSON.stringify({ text: t2.text, seen: t2.stops.map(x => x.seen), pop: t2.stops.map(x => x.pop), vpTop: [t0.vpTop, t2.vpTop] }));
    ck(name + ': sin errores de consola', !errs.length, errs.join(' | '));
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    writeFileSync(join(OUT, `rail-${name}.jpg`), Buffer.from(shot.result.data, 'base64'));
  } catch (e) {
    ck(name + ': la pantalla abortó', false, `${e.message}${errs.length ? ' | consola: ' + errs.join(' | ') : ''}`);
  }
}
// ---------- Almacenamiento bloqueado: el recorrido funciona igual, sin persistir ----------
errs.length = 0;
try {
  const blocked = await send('Page.addScriptToEvaluateOnNewDocument', { source: `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); }, configurable: true });` });
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const visit = async () => {
    await send('Page.navigate', { url: URL_ });
    await waitFor(`document.readyState === 'complete' && document.querySelector('[data-rail]') && document.documentElement.classList.contains('js')`, 'la página cargada (sin almacenamiento)', 30000);
    await ev(HELPERS);
    await run(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
    await run(`scrollBy(0, 1)`);
    await waitFor(READY, 'el carrusel listo (sin almacenamiento)', 30000);
    await settle(`document.querySelector('[data-rail] .rail-stop.is-seen')`, 4000);
  };
  await visit();
  const b0 = await ev(TRAIL);
  await run(`document.querySelectorAll('.rail-chip')[2].click()`);
  await run(`(${AFTER_CHIP})(document.querySelectorAll('.rail-chip')[2])`);
  const b1 = await ev(TRAIL);
  await visit();
  const b2 = await ev(TRAIL);
  ck('sin almacenamiento: el recorrido carga, marca la parada inicial, cuenta la elegida («2 de 4») y cambia el carrusel', b0.stored === 'bloqueado' && b0.text === '1 de 4 paradas hojeadas' && b1.text === '2 de 4 paradas hojeadas' && b1.stops[2].checked === 'true' && b1.stops[2].seen, JSON.stringify({ b0: [b0.stored, b0.text], b1: [b1.text, b1.stops.map(x => x.seen)] }));
  ck('sin almacenamiento: al recargar empieza de nuevo (no se guardó nada) y no hay errores de consola', b2.text === '1 de 4 paradas hojeadas' && !errs.length, JSON.stringify({ text: b2.text, errs }));
  await send('Page.removeScriptToEvaluateOnNewDocument', { identifier: blocked.result.identifier });
} catch (e) {
  ck('sin almacenamiento: la pantalla abortó', false, `${e.message}${errs.length ? ' | consola: ' + errs.join(' | ') : ''}`);
}
for (const l of out) console.log(l.join(' '));
const bad = out.filter(l => l[0] === '✗').length;
console.log('FALLAN', bad, 'de', out.length);
chrome.kill();
process.exit(bad ? 1 : 0);
