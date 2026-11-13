// Ritmo vertical y maquetación: relleno de cada sección, espacio real entre contenido, pantallas por capítulo y uso de grid/flex.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const port = 9950 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-p-'))}`, 'about:blank'], { stdio: 'ignore' });
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

for (const [name, w, h, mobile] of [['MÓVIL 390×844', 390, 844, true], ['ESCRITORIO 1280×800', 1280, 800, false]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  // se recorre para que todo se renderice y se midan alturas reales
  const H = await ev(`document.documentElement.scrollHeight`);
  for (let y = 0; y < H; y += Math.round(h * 0.7)) { await ev(`scrollTo(0, ${y})`); await sleep(220); }
  await ev(`scrollTo(0, 0)`); await sleep(600);
  const data = await ev(`(() => {
    const g = n => Math.round(parseFloat(n) || 0);
    const secs = [...document.querySelectorAll('main > section, main > figure, footer.ftr')];
    const vh = innerHeight; const out = [];
    secs.forEach(s => {
      const cs = getComputedStyle(s); const r = s.getBoundingClientRect();
      const kids = [...s.children].filter(k => k.getBoundingClientRect().height > 0);
      const first = kids[0] && kids[0].getBoundingClientRect(); const last = kids.at(-1) && kids.at(-1).getBoundingClientRect();
      out.push({ id: s.id || s.className.split(' ')[0], bg: getComputedStyle(s).backgroundColor, h: Math.round(r.height), screens: +(r.height / vh).toFixed(1), pt: g(cs.paddingTop), pb: g(cs.paddingBottom), pi: g(cs.paddingLeft), gapTop: first ? Math.round(first.top - r.top) : 0, gapBottom: last ? Math.round(r.bottom - last.bottom) : 0, display: cs.display });
    });
    const used = {};
    document.querySelectorAll('body *').forEach(e => { const d = getComputedStyle(e).display; if (d === 'grid' || d === 'flex' || d === 'inline-flex' || d === 'inline-grid') used[d] = (used[d] || 0) + 1; });
    const gutter = g(getComputedStyle(document.querySelector('.bill')).paddingLeft);
    const offGrid = new Set();
    secs.forEach(s => { const cs = getComputedStyle(s); [cs.paddingTop, cs.paddingBottom].forEach(v => { const n = parseFloat(v); if (n && Math.round(n) % 4 !== 0) offGrid.add(s.id || s.className.split(' ')[0] + ':' + Math.round(n)); }); });
    return { out, used, gutter, offGrid: [...offGrid], total: document.documentElement.scrollHeight, vh };
  })()`);
  console.log(`\n=== ${name} · alto total ${data.total}px = ${(data.total / data.vh).toFixed(1)} pantallas · margen lateral ${data.gutter}px`);
  console.log('capítulo'.padEnd(14), 'tono'.padEnd(6), 'alto'.padStart(6), 'pant.'.padStart(6), 'pad-sup'.padStart(8), 'pad-inf'.padStart(8), 'aire-arriba'.padStart(12), 'aire-abajo'.padStart(11), 'layout');
  for (const s of data.out) console.log(String(s.id).padEnd(14), String(s.bg).slice(0, 18).padEnd(18), String(s.h).padStart(6), String(s.screens).padStart(6), String(s.pt).padStart(8), String(s.pb).padStart(8), String(s.gapTop).padStart(12), String(s.gapBottom).padStart(11), s.display);
  console.log('uso de layout (nº de contenedores):', JSON.stringify(data.used));
  console.log('rellenos fuera de la cuadrícula de 4px:', data.offGrid.length ? data.offGrid.join(', ') : 'ninguno');
}
chrome.kill();
process.exit(0);
