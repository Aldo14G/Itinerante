// Barrido de contraste de texto en todos los estados: secciones, menú, acordeones, ficha, Mi lista y Explorar.
// Uso: node tools/qa/contrast.mjs http://127.0.0.1:PORT/   (sale con código 1 si hay fallos)
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Falta la URL'); process.exit(2); }
const port = 10300 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-c-'))}`, 'about:blank'], { stdio: 'ignore' });
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

// Se inyecta una sola vez por documento: devuelve los textos visibles con contraste insuficiente.
const SWEEP = `window.__sweep = (label) => {
  const num = c => c.match(/[0-9.]+/g).map(Number);
  const lum = c => { const k = c.startsWith('color(') ? 1 : 255; const [r, g, b] = num(c).slice(0, 3).map(v => v / k).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const p = lum(a), q = lum(b); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); };
  const alpha = c => { const m = num(c); return m.length > 3 ? m[3] : 1; };
  const blend = (top, bottom) => { const k = s => (s.startsWith('color(') ? 255 : 1); const a = alpha(top); const t = num(top).slice(0, 3).map(v => v * k(top)); const b = num(bottom).slice(0, 3).map(v => v * k(bottom)); return 'rgb(' + t.map((v, i) => v * a + b[i] * (1 - a)).join(',') + ')'; };
  const bgOf = el => { const layers = []; for (let e = el; e; e = e.parentElement) { const c = getComputedStyle(e).backgroundColor; if (alpha(c) > 0) { layers.push(c); if (alpha(c) >= 0.99) break; } } let out = 'rgb(255,255,255)'; for (const c of layers.reverse()) out = blend(c, out); return out; };
  const bad = [];
  document.querySelectorAll('body *').forEach(e => {
    if (e.closest('.cover, [inert], [hidden], .sprite, noscript, script, style')) return;
    if (![...e.childNodes].some(n => n.nodeType === 3 && n.textContent.trim())) return;
    const cs = getComputedStyle(e); const r = e.getBoundingClientRect();
    if (cs.visibility === 'hidden' || cs.display === 'none' || r.width === 0 || r.height === 0 || Number(cs.opacity) < 0.5) return;
    if (r.bottom < 0 || r.top > innerHeight || r.right < 0 || r.left > innerWidth) return;
    if (e.closest('.hdr, .tabbar, .toast')) return; // su fondo es un pseudoelemento o vidrio: lo juzga el crítico con capturas
    if (e.closest('.entry-media, .entry-beat, .house-pin .still-img')) return; // texto sobre foto: lo juzga el crítico con capturas (el texto del tema ya va debajo de la foto y se mide aquí)
    const big = parseFloat(cs.fontSize) >= 24 || (parseFloat(cs.fontSize) >= 18.66 && Number(cs.fontWeight) >= 700);
    const bg = bgOf(e); const rr = ratio(cs.color, bg);
    if (rr < (big ? 3 : 4.5)) bad.push({ state: label, el: (e.className && String(e.className).split(' ')[0]) || e.tagName, text: e.textContent.trim().slice(0, 28), ratio: +rr.toFixed(2), fg: cs.color, bg });
  });
  return bad;
};
// Portadas: título y autor frente a cada parada del degradado.
window.__covers = () => {
  const num = c => c.match(/[0-9.]+/g).map(Number);
  const lum = c => { const k = c.startsWith('color(') ? 1 : 255; const [r, g, b] = num(c).slice(0, 3).map(v => v / k).map(v => v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
  const ratio = (a, b) => { const p = lum(a), q = lum(b); return (Math.max(p, q) + 0.05) / (Math.min(p, q) + 0.05); };
  const bad = [];
  document.querySelectorAll('.cover--blank').forEach(c => {
    const stops = (getComputedStyle(c).backgroundImage.match(/rgba?\\([^)]*\\)|color\\(srgb[^)]*\\)/g) || []);
    for (const sel of ['.cover-title', '.cover-author']) {
      const n = c.querySelector(sel); if (!n) continue; const fg = getComputedStyle(n).color;
      const worst = Math.min(...stops.map(s => ratio(fg, s)));
      if (stops.length && worst < (sel === '.cover-title' ? 3 : 4.5)) bad.push({ state: 'portada', el: sel, text: n.textContent.slice(0, 20), ratio: +worst.toFixed(2) });
    }
  });
  return bad;
};`;

const fails = [];
const wait = (expr, n = 40) => (async () => { for (let i = 0; i < n; i++) { if (await ev(expr)) return true; await sleep(200); } return false; })();
const sweep = async label => { const r = await ev(`window.__sweep(${JSON.stringify(label)})`); fails.push(...(r || [])); };

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['escritorio', 1280, 800, false]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Page.navigate', { url: URL_ });
  await sleep(1200);
  await ev(`localStorage.setItem('iti-saved-v1', JSON.stringify([]))`);
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  await ev(SWEEP);
  // recorrido por la página
  const H = await ev(`document.documentElement.scrollHeight`);
  for (let y = 0; y <= H; y += Math.round(h * 0.7)) { await ev(`scrollTo(0, ${y})`); await sleep(500); await sweep(`${name}: y=${y}`); }
  // el carrusel y la muestra cargan al acercarse: se vuelve a barrer
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 100)`); await sleep(2500); await sweep(`${name}: carrusel`);
  fails.push(...((await ev(`window.__covers()`)) || []));
  // guardar un libro para tener la lista con contenido
  await ev(`document.querySelector('[data-rail] .save')?.click()`); await sleep(600); await sweep(`${name}: aviso`);
  // ficha
  await ev(`document.querySelector('[data-rail] button.card')?.click()`);
  if (await wait(`document.getElementById('cat-drawer')?.open`)) { await sleep(900); await sweep(`${name}: ficha`); await ev(`document.getElementById('cat-drawer').close()`); await sleep(500); }
  // menú móvil y acordeones
  if (mobile) {
    await ev(`document.querySelector('.hdr-more').click()`); await sleep(800); await sweep(`${name}: menú`);
    const groups = await ev(`[...document.querySelectorAll('#sheet-menu .sm-row[aria-controls]')].map(b => b.getAttribute('aria-controls'))`);
    for (const g of groups) { await ev(`document.querySelector('#sheet-menu [aria-controls="${g}"]').click()`); await sleep(500); await sweep(`${name}: menú ${g}`); }
    await ev(`document.querySelector('#sheet-menu [data-open-mylist]').click()`); await sleep(1500); await sweep(`${name}: Mi lista`);
    await ev(`document.getElementById('mylist').close()`); await sleep(600);
    await ev(`scrollTo(0, document.querySelector('[data-ex-open]').getBoundingClientRect().top + scrollY - 200)`); await sleep(1200);
    await ev(`document.querySelector('[data-ex-open]').click()`);
    if (await wait(`document.getElementById('explorer')?.open`)) { await sleep(1500); await sweep(`${name}: Explorar`); await ev(`document.getElementById('explorer').close()`); await sleep(600); }
  } else {
    await ev(`document.querySelector('.hdr-list')?.click()`); await sleep(1200); await sweep(`${name}: Mi lista`);
    await ev(`document.getElementById('mylist')?.close()`); await sleep(500);
  }
}
const seen = new Map();
for (const f of fails) { const k = `${f.el}|${f.text}|${f.state.split(':')[0]}`; if (!seen.has(k) || seen.get(k).ratio > f.ratio) seen.set(k, f); }
const list = [...seen.values()].sort((a, b) => a.ratio - b.ratio);
console.log(list.length ? `CONTRASTE: ${list.length} fallos` : 'CONTRASTE: todos los textos visibles cumplen (4.5:1 normal, 3:1 grande)');
for (const f of list.slice(0, 40)) console.log(`✗ [${f.state}] ${f.el} «${f.text}» ${f.ratio}:1 ${f.fg || ''} sobre ${f.bg || ''}`);
chrome.kill();
process.exit(list.length ? 1 : 0);
