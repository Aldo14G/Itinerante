// Esqueletos y estabilidad de maquetación: ¿el contenido ocupa el lugar exacto del esqueleto? CLS durante la carga diferida.
// Uso: node tools/qa/skeleton.mjs http://127.0.0.1:PORT/   (código 1 si algún criterio falla)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Falta la URL'); process.exit(2); }
const port = 10400 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-k-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__cls = 0; window.__shifts = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) { window.__cls += e.value; window.__shifts.push([Math.round(e.startTime), +e.value.toFixed(4), (e.sources || []).map(s => (s.node && (s.node.className || s.node.tagName)) + '').slice(0, 2).join(',')]); } }).observe({ type: 'layout-shift', buffered: true });` });

const out = [];
const ck = (n, ok, d = '') => { out.push(ok); console.log(ok ? '✓' : '✗', n, ok ? '' : String(d).slice(0, 320)); };

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['escritorio', 1280, 800, false]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  // 1) Estado de esqueleto, antes de que la sección se acerque
  const before = await ev(`(() => {
    const r = document.querySelector('[data-rail]'); const sk = r.querySelector('.rail-item.card--sk'); const sc = sk && sk.querySelector('.cover');
    const g = document.querySelector('[data-cat-grid]'); const gk = g.querySelector('.card--sk');
    const num = c => c.match(/[0-9.]+/g).map(Number);
    return {
      railH: (r => Math.round(r.querySelector('.rail-ask').getBoundingClientRect().bottom - r.querySelector('.rail-head').getBoundingClientRect().top))(r), railSkW: sk && Math.round(sk.getBoundingClientRect().width), railSkH: sk && Math.round(sk.getBoundingClientRect().height), railN: r.querySelectorAll('.rail-item').length,
      skColor: sc && getComputedStyle(sc).backgroundColor, skAnim: sc && getComputedStyle(sc, '::before').animationName,
      gridSkN: g.querySelectorAll('.card--sk').length, gridSkH: gk && Math.round(gk.getBoundingClientRect().height), gridSkW: gk && Math.round(gk.getBoundingClientRect().width)
    };
  })()`);
  ck(`${name}: el carrusel tiene esqueletos con el ancho de una tarjeta real`, before.railN >= 5 && before.railSkW > 100, JSON.stringify(before));
  if (mobile) ck('móvil: los esqueletos no se animan (cuesta un recálculo de estilo por fotograma)', before.skAnim === 'none', before.skAnim);
  // 2) Carga del carrusel: ¿cambia de alto?
  await ev(`window.__cls = 0; window.__shifts = []`);
  await ev(`scrollTo(0, document.querySelector('[data-rail] .rail-head').getBoundingClientRect().top + scrollY - 120)`); // en escritorio .rail es display: contents (A6): se mide de la cabecera del carrusel a «Preguntar por…»
  for (let i = 0; i < 40 && !(await ev(`document.querySelector('[data-rail]').classList.contains('is-ready')`)); i++) await sleep(250);
  await sleep(800);
  const after = await ev(`(() => { const r = document.querySelector('[data-rail]'); const it = r.querySelector('.rail-item.is-centro'); /* carrusel 3D: la del centro va de frente, sin giro ni escala */ return { railH: (r => Math.round(r.querySelector('.rail-ask').getBoundingClientRect().bottom - r.querySelector('.rail-head').getBoundingClientRect().top))(r), itW: Math.round(it.getBoundingClientRect().width), itH: Math.round(it.getBoundingClientRect().height), cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 4) }; })()`);
  ck(`${name}: al cargar el carrusel el alto no salta (±8 px)`, Math.abs(after.railH - before.railH) <= 8, `esqueleto ${before.railH}px → real ${after.railH}px`);
  ck(`${name}: la tarjeta real ocupa el ancho y el alto del esqueleto (±8 px)`, Math.abs(after.itW - before.railSkW) <= 8 && Math.abs(after.itH - before.railSkH) <= 8, `esqueleto ${before.railSkW}×${before.railSkH} → real ${after.itW}×${after.itH}`);
  ck(`${name}: CLS durante la carga del carrusel ≤ 0.02`, after.cls <= 0.02, JSON.stringify(after.shifts));
  // 3) Catálogo: en escritorio va en línea; en móvil vive en la hoja
  if (!mobile) {
    await ev(`window.__cls = 0; window.__shifts = []`);
    await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY - 100)`);
    for (let i = 0; i < 40 && !(await ev(`document.querySelectorAll('[data-cat-grid] button.card').length > 0`)); i++) await sleep(250);
    await sleep(800);
    const cat = await ev(`(() => { const g = document.querySelector('[data-cat-grid]'); const c = g.querySelector('button.card'); return { gridH: Math.round(g.getBoundingClientRect().height), cardH: Math.round(c.getBoundingClientRect().height), cardW: Math.round(c.getBoundingClientRect().width), cls: +window.__cls.toFixed(4), shifts: window.__shifts.slice(0, 4) }; })()`);
    ck('escritorio: CLS durante la carga del catálogo ≤ 0.05', cat.cls <= 0.05, JSON.stringify(cat));
    ck('escritorio: la tarjeta real mide lo mismo que el esqueleto (±8 px de alto y ancho)', Math.abs(cat.cardH - before.gridSkH) <= 8 && Math.abs(cat.cardW - before.gridSkW) <= 8, `esqueleto ${before.gridSkW}×${before.gridSkH} → real ${cat.cardW}×${cat.cardH}`);
    ck('escritorio: el esqueleto reserva tantas tarjetas como la primera página (24)', before.gridSkN >= 24, `${before.gridSkN} esqueletos antes de 24 tarjetas reales; la rejilla pasó a ${cat.gridH}px`);
  }
}
console.log(out.every(Boolean) ? 'ESQUELETOS: todo en orden' : `ESQUELETOS: ${out.filter(x => !x).length} fallos`);
chrome.kill();
process.exit(out.every(Boolean) ? 0 : 1);
