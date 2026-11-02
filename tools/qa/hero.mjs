// Contraste real del texto sobre la foto del hero móvil, medido con píxeles (contrast.mjs omite el texto sobre foto).
// node hero.mjs <url> [outDir]   Escribe hero-<ancho>x<alto>.jpg y sale con código ≠ 0 si alguna línea baja de 4.5:1.
// Método: se captura la página con el texto del párrafo transparente; los píxeles bajo cada línea se comparan con el color
// del texto (peor caso = el píxel de fondo más cercano al color del texto; p5 = el 5 % peor).
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const out = process.argv[3] || '.';
mkdirSync(out, { recursive: true });
const SELECTORS = (process.env.HERO_SELECTORS || '.entry-lede').split(',');
const port = 9500 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-hero-'))}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => (await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');

const lum = ([r, g, b]) => { const f = c => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };

let fail = 0;
const rows = [];
for (const [w, h] of [[375, 667], [360, 640], [320, 640], [390, 844]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: true });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  writeFileSync(join(out, `hero-${w}x${h}.jpg`), Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: 80 })).result.data, 'base64'));
  for (const sel of SELECTORS) {
    // Líneas del párrafo: un rectángulo por línea (Range sobre el texto), en píxeles de la ventana.
    const info = await ev(`(() => {
      const el = document.querySelector(${JSON.stringify(sel)}); if (!el) return null;
      const range = document.createRange(); range.selectNodeContents(el);
      const rects = [...range.getClientRects()].filter(r => r.width > 2 && r.height > 2).sort((a, b) => a.top - b.top);
      const lines = [];
      for (const r of rects) { const l = lines.at(-1); if (l && Math.abs(l.top - r.top) < r.height * 0.5) { l.left = Math.min(l.left, r.left); l.right = Math.max(l.right, r.right); } else lines.push({ top: r.top, bottom: r.bottom, left: r.left, right: r.right }); }
      const cs = getComputedStyle(el);
      el.dataset.keepColor = el.style.color; el.style.color = 'transparent'; el.style.textShadow = 'none';
      return { color: cs.color.match(/[\\d.]+/g).slice(0, 3).map(Number), lines, vh: innerHeight };
    })()`);
    if (!info) { rows.push({ w, h, sel, error: 'no existe' }); fail++; continue; }
    await sleep(150);
    const png = (await send('Page.captureScreenshot', { format: 'png' })).result.data;
    await ev(`(() => { const el = document.querySelector(${JSON.stringify(sel)}); el.style.color = el.dataset.keepColor || ''; el.style.textShadow = ''; })()`);
    // Los píxeles se leen en la propia página (data: está permitido por la CSP y no ensucia el canvas).
    const px = await ev(`(async () => {
      const img = new Image(); img.src = 'data:image/png;base64,${png}'; await img.decode();
      const c = document.createElement('canvas'); c.width = img.naturalWidth; c.height = img.naturalHeight;
      const x = c.getContext('2d', { willReadFrequently: true }); x.drawImage(img, 0, 0);
      return ${JSON.stringify(info.lines)}.map(l => {
        const x0 = Math.max(0, Math.floor(l.left)), y0 = Math.max(0, Math.floor(l.top)), x1 = Math.min(c.width, Math.ceil(l.right)), y1 = Math.min(c.height, Math.ceil(l.bottom));
        const d = x.getImageData(x0, y0, Math.max(1, x1 - x0), Math.max(1, y1 - y0)).data, out = [];
        for (let i = 0; i < d.length; i += 4) out.push([d[i], d[i + 1], d[i + 2]]);
        return out;
      });
    })()`);
    const tl = lum(info.color);
    const lines = px.map((pixels, i) => {
      const rs = pixels.map(p => ratio(tl, lum(p))).sort((a, b) => a - b);
      const vis = info.lines[i].bottom <= info.vh + 1 && info.lines[i].top >= 0;
      return { n: i + 1, visible: vis, min: +rs[0].toFixed(2), p5: +rs[Math.floor(rs.length * 0.05)].toFixed(2), median: +rs[Math.floor(rs.length / 2)].toFixed(2) };
    });
    const first = lines[0], last = lines.at(-1);
    const ok = lines.every(l => l.min >= 4.5);
    if (!ok) fail++;
    rows.push({ w, h, sel, lineas: lines.length, primera: first, ultima: last, peor: Math.min(...lines.map(l => l.min)), ok });
  }
}
for (const r of rows) console.log(r.error ? `${r.w}x${r.h} ${r.sel}: ${r.error}` : `${r.ok ? 'ok   ' : 'FALLA'} ${r.w}x${r.h} ${r.sel}  ${r.lineas} líneas  1ª min ${r.primera.min} p5 ${r.primera.p5} med ${r.primera.median}${r.primera.visible ? '' : ' (fuera de la pantalla)'}  última min ${r.ultima.min} p5 ${r.ultima.p5} med ${r.ultima.median}${r.ultima.visible ? '' : ' (fuera de la pantalla)'}  peor ${r.peor}`);
console.log(fail ? `${fail} medición(es) bajo 4.5:1` : 'Contraste del hero >= 4.5:1 en todos los tamaños');
chrome.kill();
process.exit(fail ? 1 : 0);
