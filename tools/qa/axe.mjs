// Auditoría automática de accesibilidad con axe-core (WCAG 2.x A/AA y buenas prácticas) en los estados principales:
// inicio en móvil y escritorio, menú lateral, hoja Explorar, Mi lista y ficha. Falla (código 1) con violaciones serias o críticas.
// Uso: node tools/qa/axe.mjs http://127.0.0.1:PORT/   (CHROME_PATH cambia el navegador; AXE_ALL=1 lista también las moderadas y leves)
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Falta la URL'); process.exit(2); }
const axeSource = readFileSync(createRequire(import.meta.url).resolve('axe-core/axe.min.js'), 'utf8');
const port = 10500 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-axe-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text); return r.result?.result?.value; };
await send('Page.enable'); await send('Runtime.enable');

const TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'];
const RUN = (exclude) => `axe.run({ include: [['body']], exclude: ${JSON.stringify(exclude)} }, { runOnly: { type: 'tag', values: ${JSON.stringify(TAGS)} }, resultTypes: ['violations'] }).then(r => JSON.stringify(r.violations.map(v => ({ id: v.id, impact: v.impact, help: v.help, n: v.nodes.length, first: v.nodes[0] && v.nodes[0].target.join(' ') }))))`;
const states = [];
async function audit(label, exclude = []) {
  await sleep(600);
  if ((await ev('typeof window.axe')) === 'undefined') await ev(axeSource + '; true');
  const v = JSON.parse(await ev(RUN(exclude)));
  states.push({ label, violations: v });
}
async function open(w, h, mobile) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Page.navigate', { url: URL_ }); await sleep(3500);
  if (!(await ev(`!!document.querySelector('main') && document.querySelectorAll('section').length > 3`))) { console.error('La página no cargó en ' + URL_ + ': no se audita una página vacía.'); chrome.kill(); process.exit(2); }
}
const waitFor = async (expr, tries = 40) => { for (let i = 0; i < tries; i++) { if (await ev(expr)) return true; await sleep(200); } return false; };

const MANIFESTO = [['.manifesto']]; // sus palabras entran al 17 % y llegan al 100 % con el scroll: se audita aparte, con el bloque centrado en la ventana (ahí debe estar todo revelado; app.js manifestoScene)
await open(390, 844, true);
await audit('móvil 390: inicio', MANIFESTO);
await ev(`(() => { const t = document.querySelector('.manifesto-text'); const r = t.getBoundingClientRect(); scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); })()`); await sleep(400); await ev(`scrollBy(0, 1)`); await sleep(1500);
await audit('móvil 390: manifiesto revelado');
await ev(`document.querySelector('.hdr-more').click()`); await waitFor(`document.getElementById('sheet-menu').open`); await sleep(700);
await ev(`document.querySelector('#sheet-menu .sm-group:nth-of-type(3) .sm-row').click()`); await sleep(500);
await audit('móvil 390: menú lateral con Libros abierto');
await ev(`document.getElementById('sheet-menu').close()`); await sleep(500);
await ev(`document.querySelector('[data-ex-open]').scrollIntoView()`); await sleep(1200);
await ev(`document.querySelector('[data-ex-open]').click()`); await waitFor(`document.getElementById('explorer').open`); await waitFor(`document.querySelector('#explorer [data-cat-grid]').getAttribute('aria-busy') === null`, 60); await sleep(600);
await audit('móvil 390: hoja Explorar con el catálogo');
await ev(`document.querySelector('#explorer button.card').click()`); await waitFor(`document.getElementById('cat-drawer') && document.getElementById('cat-drawer').open`); await sleep(800);
await audit('móvil 390: ficha sobre Explorar');
await ev(`document.getElementById('cat-drawer').close(); document.getElementById('explorer').close()`); await sleep(600);
await ev(`document.querySelector('[data-open-mylist]') ? (document.querySelector('.hdr-more').click(), true) : false`); await waitFor(`document.getElementById('sheet-menu').open`); await sleep(500);
await ev(`document.querySelector('[data-open-mylist]').click()`); await waitFor(`document.getElementById('mylist').open`, 30); await sleep(800);
await audit('móvil 390: Mi lista (vacía)');

await open(1280, 800, false);
await audit('escritorio 1280: inicio', MANIFESTO);
await ev(`(() => { const t = document.querySelector('.manifesto-text'); const r = t.getBoundingClientRect(); scrollTo(0, scrollY + r.top + r.height / 2 - innerHeight / 2); })()`); await sleep(400); await ev(`scrollBy(0, 1)`); await sleep(1500);
await audit('escritorio 1280: manifiesto revelado');
await ev(`document.getElementById('catalogo').scrollIntoView()`); await waitFor(`document.querySelector('#catalogo [data-cat-grid]').getAttribute('aria-busy') === null`, 60); await sleep(800);
await audit('escritorio 1280: catálogo en línea', MANIFESTO);
await ev(`document.querySelector('#catalogo button.card').click()`); await waitFor(`document.getElementById('cat-drawer') && document.getElementById('cat-drawer').open`); await sleep(800);
await audit('escritorio 1280: ficha', MANIFESTO);

let serious = 0;
for (const s of states) {
  const bad = s.violations.filter(v => ['serious', 'critical'].includes(v.impact));
  const rest = s.violations.filter(v => !['serious', 'critical'].includes(v.impact));
  serious += bad.length;
  console.log(`${bad.length ? '✗' : '✓'} ${s.label}: ${bad.length} serias/críticas, ${rest.length} moderadas/leves`);
  for (const v of bad) console.log(`    ✗ ${v.id} (${v.impact}) ×${v.n} · ${v.help} · ${v.first}`);
  if (process.env.AXE_ALL) for (const v of rest) console.log(`    ~ ${v.id} (${v.impact}) ×${v.n} · ${v.help} · ${v.first}`);
}
console.log('FALLAN', serious, 'violaciones serias o críticas en', states.length, 'estados');
chrome.kill();
process.exit(serious ? 1 : 0);
