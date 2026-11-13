// Piso de oficio (Impeccable, craft-floor): titulares dentro de la escala, interletra, medida de lectura, cejas sobre titulares,
// aire de los titulares, controles nativos y superficies del navegador. Uso: node tools/qa/piso.mjs URL
// Falla (salida 1) con: titular > 6rem fuera del mundo comprometido, interletra < -0.04em, medida > 78ch o una ceja sobre un titular.
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Uso: node tools/qa/piso.mjs URL'); process.exit(2); }
const port = 9900 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'piso-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'la página lanzó al evaluar'); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');

// Ya no hay rótulo gigante ni marquesina (sistema «Itinerante Líquido»): ningún texto queda fuera del tope de 6rem.
const WORLD = ':not(*)';
const AUDIT = `(() => {
  const vis = el => { const c = getComputedStyle(el); const r = el.getBoundingClientRect(); return c.display !== 'none' && c.visibility !== 'hidden' && r.width > 0 && r.height > 0 && !el.closest('dialog:not([open]), [hidden], [inert]'); };
  const sel = el => (el.id ? '#' + el.id : typeof el.className === 'string' && el.className.trim() ? el.tagName.toLowerCase() + '.' + el.className.trim().split(/\\s+/).slice(0, 2).join('.') : el.tagName.toLowerCase());
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  const out = { grandes: [], tracking: [], medida: [], cejas: [], aire: [], nativos: [], entradas: {} };
  for (const el of [...document.querySelectorAll('header *, main *, footer *')].filter(vis)) {
    if (![...el.childNodes].some(n => n.nodeType === 3 && n.textContent.trim().length > 1)) continue;
    const c = getComputedStyle(el); const fs = parseFloat(c.fontSize);
    if (fs > 6 * rem + 0.5 && !el.closest(${JSON.stringify(WORLD)})) out.grandes.push(sel(el) + ' ' + Math.round(fs) + 'px');
    const ls = parseFloat(c.letterSpacing); if (!Number.isNaN(ls) && ls / fs < -0.0405) out.tracking.push(sel(el) + ' ' + (ls / fs).toFixed(3) + 'em');
    if (['P', 'LI', 'DD'].includes(el.tagName)) { const probe = document.createElement('span'); probe.textContent = '0'; probe.style.cssText = 'position:absolute;visibility:hidden;font:inherit;letter-spacing:inherit'; el.append(probe); const ch = probe.getBoundingClientRect().width; probe.remove();
      const range = document.createRange(); range.selectNodeContents(el); const rects = [...range.getClientRects()]; const wide = Math.max(0, ...rects.map(x => x.width)); if (rects.length > 1 && ch > 0 && wide / ch > 78) out.medida.push(sel(el) + ' ' + Math.round(wide / ch) + 'ch'); }
    if (/^H[1-4]$/.test(el.tagName)) { const prev = el.previousElementSibling; if (prev && vis(prev) && !/^H[1-6]$/.test(prev.tagName)) { const pc = getComputedStyle(prev); const pfs = parseFloat(pc.fontSize); if (pfs <= 14 && (pc.textTransform === 'uppercase' || parseFloat(pc.letterSpacing) / pfs > 0.05) && prev.textContent.trim().length < 40) out.cejas.push(sel(prev) + ' «' + prev.textContent.trim() + '» sobre ' + sel(el)); } }
  }
  for (const h of document.querySelectorAll('main h2')) { if (!vis(h)) continue; const r = h.getBoundingClientRect(); let prev = h.previousElementSibling; while (prev && !vis(prev)) prev = prev.previousElementSibling; let next = h.nextElementSibling; while (next && !vis(next)) next = next.nextElementSibling;
    const box = h.closest('section, .cat'); const above = prev ? r.top - prev.getBoundingClientRect().bottom : (box ? r.top - box.getBoundingClientRect().top : NaN); const below = next ? next.getBoundingClientRect().top - r.bottom : NaN; if (below > above) out.aire.push(sel(h) + ' arriba ' + Math.round(above) + ' < abajo ' + Math.round(below)); }
  for (const i of document.querySelectorAll('input[type=checkbox], input[type=radio], input[type=range], progress')) { const c = getComputedStyle(i); if (c.appearance !== 'none' && c.opacity !== '0' && c.accentColor === 'auto') out.nativos.push(sel(i)); }
  for (const el of document.querySelectorAll('[data-reveal]')) { const k = el.dataset.reveal || 'simple'; out.entradas[k] = (out.entradas[k] || 0) + 1; }
  out.seleccion = getComputedStyle(document.documentElement, '::selection').backgroundColor; out.barras = getComputedStyle(document.documentElement).scrollbarColor; out.acento = getComputedStyle(document.documentElement).accentColor;
  return out; })()`;

let fails = 0;
for (const [name, w, h, mobile] of [['ESCRITORIO 1280×800', 1280, 800, false], ['MÓVIL 390×844', 390, 844, true]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });
  await send('Page.navigate', { url: URL_ }); await sleep(4000);
  const H = await ev(`document.documentElement.scrollHeight`);
  for (let y = 0; y < H; y += Math.round(h * 0.7)) { await ev(`scrollTo(0, ${y})`); await sleep(180); }
  await ev(`scrollTo(0, 0)`); await sleep(500);
  const r = await ev(AUDIT);
  console.log(`\n=== ${name}`);
  const line = (label, list, fatal) => { const u = [...new Set(list)]; if (u.length && fatal) fails += u.length; console.log(`${u.length ? (fatal ? '✗' : '·') : '✓'} ${label}: ${u.length ? '\n    ' + u.slice(0, 12).join('\n    ') : 'ninguno'}`); };
  line('titulares por encima de 6rem (fuera del cartón de título y la marquesina)', r.grandes, true);
  line('interletra por debajo de -0.04em', r.tracking, true);
  line('medida de lectura por encima de 78ch', r.medida, true);
  line('cejas o antetítulos sobre un titular', r.cejas, true);
  line('titulares con menos aire arriba que abajo', r.aire, false);
  line('controles nativos sin accent-color', r.nativos, false);
  console.log(`· entradas data-reveal: ${JSON.stringify(r.entradas)} · selección ${r.seleccion} · barras ${r.barras} · acento ${r.acento}`);
}
console.log(`\nPISO DE OFICIO: ${fails ? `FALLAN ${fails}` : 'todo dentro del piso'}`);
ws.close(); chrome.kill();
process.exit(fails ? 1 : 0);
