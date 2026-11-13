// INP con CPU limitada: clics reales (Input.dispatchMouseEvent) en el menú ☰ (abrir/cerrar, con velo), Mi lista (abrir/cerrar), chip del carrusel, guardar, ficha, flecha de Eventos, chip y flecha de Café,
// carrusel 3D, «Buscar en el catálogo» (la hoja Explorar con los 41 títulos) y la ficha desde la rejilla.
// Uso: node tools/qa/inp.mjs URL [corridas=3] [cpu=4] [ancho=390] [alto=844]
// Cada corrida carga la página en frío. Mide con PerformanceObserver `event` (durationThreshold 16 ms, interacciones con
// interactionId; el INP de una interacción es la mayor duración de sus eventos) y `long-animation-frame` / `longtask`.
// Sale con código 1 si alguna interacción pasa de 200 ms o hay una tarea larga > 200 ms provocada por un clic.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const [URL_, RUNS = '3', CPU = '4', W = '390', H = '844'] = process.argv.slice(2);
const port = 9750 + Math.floor(Math.random() * 40);
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-inp-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); const errs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');

const click = async sel => {
  const p = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!p) throw new Error('no existe ' + sel);
  await sleep(300);
  const q = await ev(`(() => { const r = document.querySelector(${JSON.stringify(sel)}).getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  await ev('window.__mark = performance.now()');
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: q.x, y: q.y });
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: q.x, y: q.y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: q.x, y: q.y, button: 'left', clickCount: 1 });
};
// «Siguiente» de un Carrusel3D: la flecha con puntero fino; con toque no hay flechas (norma del 2026-11-13) y se toca la parte visible de la vecina.
const siguiente = async (btn, c3d) => {
  if (await ev(`getComputedStyle(document.querySelector(${JSON.stringify(btn)})).display !== 'none'`)) return click(btn);
  const p = await ev(`(() => { const c = document.querySelector(${JSON.stringify(c3d)}); c.scrollIntoView({ block: 'center' }); const it = c.querySelector('.c3d-item.is-centro').nextElementSibling; const r = it.querySelector('.cf-pose').getBoundingClientRect(); return { x: Math.min(r.right, innerWidth) - 12, y: r.top + r.height / 2 }; })()`);
  await sleep(300);
  await ev('window.__mark = performance.now()');
  for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x: p.x, y: p.y, button: 'left', clickCount: 1 });
};
// Entradas de `event` e `long-*` posteriores a la marca, agrupadas por interacción.
const collect = async () => ev(`(() => {
  const m = window.__mark; const ev = window.__ev.filter(e => e.startTime >= m - 5 && e.interactionId);
  const by = new Map(); ev.forEach(e => by.set(e.interactionId, Math.max(by.get(e.interactionId) || 0, e.duration)));
  const loaf = window.__loaf.filter(e => e.startTime >= m - 5).map(e => Math.round(e.duration));
  const detail = window.__loaf.filter(e => e.startTime >= m - 5 && e.duration > 100).map(e => ({ d: Math.round(e.duration), js: Math.round(e.renderStart - e.startTime), style: Math.round(e.styleAndLayoutStart ? e.startTime + e.duration - e.styleAndLayoutStart : 0), scripts: e.scripts.map(s => s.invokerType + ':' + (s.sourceFunctionName || s.invoker) + '@' + (s.sourceURL || '').split('/').pop() + ':' + s.sourceCharPosition + ' ' + Math.round(s.duration)) }));
  const lt = window.__lt.filter(e => e.startTime >= m - 5).map(e => Math.round(e.duration));
  return { inp: Math.round(Math.max(0, ...by.values())), loaf, lt, detail };
})()`);
const INSTALL = `
  window.__ev = []; window.__loaf = []; window.__lt = [];
  const add = (type, arr, opts = {}) => { try { new PerformanceObserver(l => arr.push(...l.getEntries())).observe({ type, buffered: true, ...opts }); } catch {} };
  add('event', window.__ev, { durationThreshold: 16 }); add('long-animation-frame', window.__loaf); add('longtask', window.__lt);
`;

const steps = [
  ['menú abrir', async () => { await click('[data-menu-open]'); }],
  ['menú cerrar', async () => { await click('[data-menu-close]'); }],
  ['Mi lista abrir', async () => { await click('.tabbar [data-open-mylist]'); }],
  ['Mi lista cerrar', async () => { await sleep(600); await click('[data-ml-close]'); }],
  ['chip carrusel', async () => { await ev(`document.querySelector('[data-rail]').scrollIntoView()`); await sleep(2500); await click('.rail-chip:not([aria-checked=true])'); }],
  ['guardar', async () => { await click('.rail-item.is-centro .save'); }],
  ['ficha abrir', async () => { await click('.rail-item.is-centro .card'); }],
  ['ficha cerrar', async () => { await sleep(600); await click('[data-d-close]'); }],
  // Carrusel 3D: la flecha (con toque, la vecina de la derecha) y el toque en una vecina mueven el centro (el giro se pinta por fotograma).
  ['carrusel flecha', async () => { await sleep(600); await siguiente('[data-rail-next]', '[data-rail-c3d]'); }],
  ['carrusel vecina', async () => { await click('.rail-item.is-centro + .rail-item .card'); }],
  // Eventos y Café (Carrusel3D, variantes evento y carta): la flecha mueve el centro y la fila de acciones lo sigue; el chip «Té» cambia la carta.
  ['eventos flecha', async () => { await ev(`document.querySelector('[data-bill-c3d]').scrollIntoView({ block: 'center' })`); await sleep(2500); await siguiente('[data-bill-next]', '[data-bill-c3d]'); }],
  ['café chip', async () => { await ev(`document.querySelector('[data-cafe-c3d]').scrollIntoView({ block: 'center' })`); await sleep(2500); await click('.cafe-chip:not([aria-checked=true])'); }],
  ['café flecha', async () => { await sleep(600); await siguiente('[data-cafe-next]', '[data-cafe-c3d]'); }],
  // Explorar con los 41 títulos sin paginar (hoja en el teléfono, en línea en escritorio): abrir la búsqueda y abrir y cerrar la ficha de una tarjeta.
  ['Explorar abrir', async () => { if (+W < 761) { await ev(`document.getElementById('libros').scrollIntoView()`); await sleep(800); await click('[data-ex-open]'); } else { await ev(`document.getElementById('catalogo').scrollIntoView()`); await sleep(1200); await click('[data-ex-open]'); } }],
  ['rejilla ficha', async () => { await sleep(2500); await click('#explorer .card-item:nth-child(5) .card'); }],
  ['rejilla ficha cerrar', async () => { await sleep(600); await click('[data-d-close]'); }],
  ['Explorar cerrar', async () => { await sleep(600); if (+W < 761) await click('[data-ex-close]'); else throw new Error('omitir'); }],
];

const rows = [];
await send('Emulation.setDeviceMetricsOverride', { width: +W, height: +H, deviceScaleFactor: 1, mobile: +W < 761 });
await send('Emulation.setTouchEmulationEnabled', +W < 761 ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
for (let run = 1; run <= +RUNS; run++) {
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  await send('Page.navigate', { url: URL_ });
  await sleep(4000);
  await ev(INSTALL);
  await send('Emulation.setCPUThrottlingRate', { rate: +CPU });
  // La carga inicial (decodificar fotogramas, módulos diferidos) compite con el clic: se espera a que la página quede en reposo
  // (1.5 s sin tareas largas, hasta 20 s) y a que el carrusel y el catálogo estén listos, como cuando alguien lee antes de tocar.
  await ev(`document.querySelector('[data-rail]').scrollIntoView()`);
  for (let i = 0; i < 40; i++) {
    await sleep(500);
    const quiet = await ev(`(() => { const last = Math.max(0, ...window.__lt.map(e => e.startTime + e.duration)); const ready = document.querySelector('[data-rail]')?.classList.contains('is-ready') && document.getElementById('catalogo')?.dataset.state === 'ready'; return ready && performance.now() - last > 1500; })()`);
    if (quiet) break;
  }
  await ev(`scrollTo(0, 0)`); await sleep(500);
  for (const [name, fn] of steps) {
    if (+W >= 1101 && name.startsWith('menú')) continue; // desde 1101 px las secciones van en la barra (sin ☰)
    if (+W >= 761 && name.startsWith('Mi lista')) continue; // la barra inferior es solo del teléfono
    try { await fn(); await sleep(1800); const r = await collect(); rows.push({ run, name, ...r }); }
    catch (e) { if (String(e.message) !== 'omitir') rows.push({ run, name, error: String(e.message || e) }); } // «Explorar cerrar» solo existe en el teléfono
  }
}
const fails = [];
for (const r of rows) {
  const worst = Math.max(0, ...(r.loaf || []), ...(r.lt || []));
  console.log(`${r.run} ${r.name.padEnd(14)} ${r.error ? 'ERROR ' + r.error : `INP ${String(r.inp).padStart(4)} ms  LoAF ${JSON.stringify(r.loaf)}  longtask ${JSON.stringify(r.lt)}`}`);
  if (process.env.INP_DETAIL) for (const d of r.detail || []) console.log('     ', JSON.stringify(d));
  if (r.error || r.inp > 200 || (r.name === 'ficha abrir' && Math.max(0, ...(r.lt || [])) > 200)) fails.push(r);
}
console.log(errs.length ? 'ERRORES: ' + errs.join(' | ') : 'sin errores de JavaScript');
console.log(fails.length ? `FALLA: ${fails.length} interacciones sobre 200 ms` : 'OK: INP <= 200 ms en todas');
chrome.kill();
process.exit(fails.length ? 1 : 0);
