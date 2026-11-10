// Carrusel de libros (capa 1 de Libros): colecciones, teclado, progreso, ficha y foco, a 390, 360 y 1280.
// Robusto con la máquina cargada (QA1-04): ev() devuelve un valor definido o lanza un error legible (nunca un TypeError
// «of undefined» en el script), y las esperas son por condición con tope en vez de pausas fijas. Si una pantalla aborta,
// se anota como ✗ con el motivo y se sigue con la siguiente; el código de salida es ≠ 0 si algo falló.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Uso: node tools/qa/rail.mjs URL'); process.exit(2); }
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
const AFTER_CHIP = `async chip => { const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); const tr = r.querySelector('[data-rail-track]');
  await __itiQa.until(() => v.getAttribute('aria-label').includes(chip.textContent.trim()) && !tr.hasAttribute('aria-busy') && tr.children.length > 0, 8000, 'colección ' + chip.textContent);
  await __itiQa.stable(() => tr.children.length); }`;

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['móvil 360', 360, 740, true], ['escritorio', 1280, 800, false]]) {
  errs.length = 0;
  try {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }); // maxTouchPoints 0 es un error de CDP (antes se ignoraba en silencio)
    await send('Page.navigate', { url: URL_ });
    await waitFor(`document.readyState === 'complete' && document.querySelector('[data-rail]') && document.documentElement.classList.contains('js')`, 'la página cargada', 30000);
    await ev(HELPERS);
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
        chips: [...r.querySelectorAll('.rail-chip')].map(c => c.textContent),
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
        out.push({ col: chip.textContent, shown: b.width > 0 && b.height > 0 && getComputedStyle(n).visibility === 'visible' && !n.closest('[hidden]'), lines: range.getClientRects().length, note: n.textContent, seal: !!r.querySelector('[data-rail-seal], .rail-seal') || /Datos de muestra|no es inventario/.test(document.body.innerText), above: b.bottom <= r.querySelector('[data-rail-viewport]').getBoundingClientRect().top + 1 });
      }
      return out;
    })()`);
    ck(name + ': con las 4 colecciones la nota de la colección se ve, en una línea, antes del carrusel, cambia con cada una y no hay sello de muestra', seal.length === 4 && seal.every(s => s.shown && s.lines === 1 && !s.seal && s.above && s.note && !/inventario|muestra/i.test(s.note)) && new Set(seal.map(s => s.note)).size === 4, JSON.stringify(seal));
    // Una sola taxonomía a la vista: elegir un tema de consulta marca la colección equivalente y el estado activo es el mismo.
    // El tema sin equivalente (Poesía) no debe cambiar nada: se le da un tope corto para «cambiar» y se comprueba que no lo hizo.
    const link = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const t = document.querySelector('.topic[data-topic="cronica"]');
      const on = () => r.querySelector('.rail-chip[aria-checked=true]').textContent;
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
    ck(name + ': sin errores de consola', !errs.length, errs.join(' | '));
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    writeFileSync(`rail-${name}.jpg`, Buffer.from(shot.result.data, 'base64'));
  } catch (e) {
    ck(name + ': la pantalla abortó', false, `${e.message}${errs.length ? ' | consola: ' + errs.join(' | ') : ''}`);
  }
}
for (const l of out) console.log(l.join(' '));
const bad = out.filter(l => l[0] === '✗').length;
console.log('FALLAN', bad, 'de', out.length);
chrome.kill();
process.exit(bad ? 1 : 0);
