// Barrido responsive: en cada ancho y orientación comprueba que no haya desborde horizontal, texto cortado ni pie encimado,
// y que «Cómo llegar» y el párrafo del inicio queden dentro de la primera vista (bajo la cabecera y sobre la barra inferior).
// Informa además el cromo fijo (cabecera + barra) como porcentaje del alto. Uso: node tools/qa/responsive.mjs URL
// Falla (salida 1) con cualquiera de las comprobaciones o con errores de consola. Corre con «reducir movimiento» (como el resto del arnés).
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Uso: node tools/qa/responsive.mjs URL'); process.exit(2); }
const port = 9940 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'resp-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); const consoleErrors = []; let tag = '';
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') consoleErrors.push(`${tag}: ${m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text}`);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') consoleErrors.push(`${tag}: ${m.params.args.map(a => a.value ?? a.description).join(' ')}`);
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'la página lanzó al evaluar'); return r.result.result.value; };
await send('Page.enable'); await send('Runtime.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

// Anchos a 800 px de alto (cada quiebre del CSS y sus vecinos), teléfonos en horizontal y tabletas en ambas orientaciones.
const SIZES = [
  ...[320, 344, 360, 375, 390, 412, 430, 480, 540, 600, 700, 760, 761, 768, 820, 900, 1024, 1100, 1101, 1180, 1280, 1366, 1440, 1600, 1727, 1728, 1920, 2560].map(w => [w, 800]),
  [320, 640], [360, 740], [390, 844], [430, 932], [667, 375], [740, 360], [844, 390], [932, 430], [768, 1024], [820, 1180], [1024, 768], [1180, 820], [1920, 1080], [2560, 1440],
];

const FIRST = `(() => {
  const vis = e => e && e.getClientRects().length;
  const hdr = document.querySelector('.hdr').getBoundingClientRect();
  const bar = document.querySelector('.tabbar'); const barTop = vis(bar) ? bar.getBoundingClientRect().top : innerHeight;
  const cta = document.querySelector('.entry-actions .btn--primario').getBoundingClientRect();
  const lede = document.querySelector('.entry-lede').getBoundingClientRect();
  const top = Math.max(0, hdr.bottom) - 2;
  return { cta: [Math.round(cta.top), Math.round(cta.bottom)], ctaOk: cta.top >= top && cta.bottom <= barTop, ledeOk: lede.top >= top && lede.bottom <= barTop,
    cromo: +((((['fixed', 'sticky'].includes(getComputedStyle(document.querySelector('.hdr')).position)) ? hdr.height : 0) + (innerHeight - barTop)) / innerHeight * 100).toFixed(1) };
})()`;
const WALK = `(async () => { const h = innerHeight, H = document.documentElement.scrollHeight; for (let y = 0; y < H; y += h * 0.8) { scrollTo(0, y); await new Promise(r => setTimeout(r, 70)); } await new Promise(r => setTimeout(r, 400)); })()`;
const PAGE = `(() => {
  const de = document.documentElement; const vis = e => e && e.getClientRects().length;
  const name = e => (typeof e.className === 'string' && e.className.trim() ? e.tagName.toLowerCase() + '.' + e.className.trim().split(/\\s+/)[0] : e.tagName.toLowerCase());
  // Los carruseles se desplazan en horizontal a propósito: lo que vive dentro de ellos no cuenta como desborde.
  const SCROLLERS = '.house-track, .rail-viewport, .rail-chips, .bill-track, .cat-suggest, .news-list'; // .news-list: la tira de Novedades (plegada)
  const wide = [...document.querySelectorAll('main *, .ftr *')].filter(e => { const r = e.getBoundingClientRect(); return r.width > 0 && r.right > innerWidth + 1 && !e.closest(SCROLLERS) && getComputedStyle(e).position !== 'fixed'; }).slice(0, 3).map(name);
  const idr = document.querySelector('.motion-btn').getBoundingClientRect(); const lk = document.querySelector('.ftr-links').getBoundingClientRect(); // el pie: redes y correo, y «Pausar el movimiento»
  const cut = [...document.querySelectorAll('h1, h2, h3, .btn, .chip, .cf-titulo, .cf-meta, .badge, .act, .hdr-brand, .tab-lb, .menu-row')].filter(e => vis(e) && !e.matches('.sr-only') && !e.closest('dialog:not([open]), [hidden]') && e.scrollWidth > e.clientWidth + 2 && getComputedStyle(e).overflow !== 'visible').slice(0, 3).map(e => name(e) + ' «' + e.textContent.trim().slice(0, 16) + '»');
  return { pantallas: +(de.scrollHeight / innerHeight).toFixed(1), desborde: de.scrollWidth > innerWidth, wide,
    pie: !(idr.bottom <= lk.top + 1 || idr.right <= lk.left + 1 || lk.bottom <= idr.top + 1 || lk.right <= idr.left + 1), cut, contenido: Math.round(document.querySelector('.books-head').getBoundingClientRect().width) };
})()`;

const fails = []; const rows = [];
for (const [w, h] of SIZES) {
  tag = `${w}×${h}`;
  const mobile = w <= 820 || h <= 430;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await send('Page.navigate', { url: URL_ }); await sleep(900);
  for (let i = 0; i < 30; i++) { if (await ev(`document.readyState === 'complete' && !!document.querySelector('.entry-lede')`)) break; await sleep(150); }
  await sleep(350);
  const f = await ev(FIRST);
  await ev(WALK);
  const p = await ev(PAGE);
  const bad = [];
  if (p.desborde) bad.push('desborde horizontal');
  if (p.wide.length) bad.push('se sale del ancho: ' + p.wide.join(', '));
  if (p.cut.length) bad.push('texto cortado: ' + p.cut.join(', '));
  if (p.pie) bad.push('pie encimado («Pausar el movimiento» sobre los enlaces)');
  if (!f.ctaOk) bad.push(`«Cómo llegar» fuera de la primera vista (y ${f.cta.join('–')})`);
  if (!f.ledeOk) bad.push('párrafo del inicio fuera de la primera vista');
  if (bad.length) fails.push(`${tag} → ${bad.join('; ')}`);
  rows.push(`${bad.length ? '✗' : '✓'} ${tag.padEnd(10)} ${String(p.pantallas).padStart(5)} pantallas · cromo fijo ${String(f.cromo).padStart(4)} % · «Cómo llegar» y ${f.cta.join('–').padEnd(9)} · contenido ${String(p.contenido).padStart(4)} px`);
}
ws.close(); chrome.kill();
console.log(rows.join('\n'));
if (consoleErrors.length) console.log('\nErrores de consola:\n' + consoleErrors.slice(0, 8).join('\n'));
if (fails.length) console.log('\n' + fails.join('\n'));
console.log(`\nRESPONSIVE: ${SIZES.length - fails.length}/${SIZES.length} tamaños sin defectos${consoleErrors.length ? `, ${consoleErrors.length} errores de consola` : ''}`);
process.exit(fails.length || consoleErrors.length ? 1 : 0);
