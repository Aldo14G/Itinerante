// Ficha móvil y sin JavaScript (navegacion-desplegables, ronda 2: CR-15, CR-18, QA1-03).
// Uso: node tools/qa/ficha.mjs URL [DIR]   (necesita Chrome; DIR recibe capturas). Sale con 1 si algo falla.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const DIR = process.argv[3];
const port = 10400 + Math.floor(Math.random() * 90);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-f-'))}`, 'about:blank'], { stdio: 'ignore' });
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
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
const click = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const press = async (key, code, vk) => { for (const type of ['rawKeyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk }); };
const shot = async name => { if (!DIR) return; const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(DIR, name), Buffer.from(r.result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable');

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);

// CR-15: con un clic real en la tarjeta 2 del carrusel, el borde inferior de «Cómo llegar» queda dentro de la ventana y la hoja no se desplaza.
for (const [w, h] of [[360, 740], [375, 667], [320, 640], [390, 844]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: URL_ }); await sleep(1500);
  await ev(`localStorage.clear()`);
  await send('Page.navigate', { url: URL_ }); await sleep(4500);
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
  await sleep(2500); await ev(`scrollBy(0, 1)`); await sleep(800);
  const p = await ev(`(() => { const r = document.querySelectorAll('[data-rail] .rail-item .card')[1].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  await click(...p); await sleep(1800);
  const m = await ev(`(() => {
    const d = document.querySelector('#cat-drawer'); const r = d.querySelector('[data-d-visit]').getBoundingClientRect(); const sc = d.querySelector('[data-d-scroll]');
    const note = d.querySelector('.drawer-note');
    return { open: d.open, bottom: Math.round(r.bottom), scroll: sc.scrollTop, hover: document.documentElement.scrollWidth > innerWidth || sc.scrollWidth > sc.clientWidth,
      note: note.textContent.trim(), seal: !!d.querySelector('.drawer-seal, .drawer-tag, .tag'), focus: document.activeElement.getAttribute('aria-label') };
  })()`);
  ck(`${w}x${h}: «Cómo llegar» dentro del primer pliegue (borde ${m.bottom} <= ${h - 8}), hoja sin desplazar, sin desborde`, m.open && m.bottom <= h - 8 && m.scroll === 0 && !m.hover, JSON.stringify(m));
  ck(`${w}x${h}: sin sello ni rótulo, la nota dice quién confirma y el foco inicial va en Cerrar`, !m.seal && m.note === 'La librería confirma existencia y precio.' && m.focus === 'Cerrar ficha', JSON.stringify(m));
  await shot(`ficha-m${w}x${h}.png`);
  await press('Escape', 'Escape', 27); await sleep(900);
  ck(`${w}x${h}: Escape cierra y libera el scroll`, await ev(`!document.querySelector('#cat-drawer').open && !document.documentElement.classList.contains('sheet-open')`));
}

// QA1-03: sin JavaScript, la barra inferior (con la casilla «Más») no se muestra y los capítulos son alcanzables desde la cabecera (Novedades necesita JavaScript: ni su sección ni su enlace existen).
await send('Emulation.setScriptExecutionDisabled', { value: true });
await send('Page.navigate', { url: URL_ }); await sleep(2500);
const nj = await ev(`(() => ({ js: document.documentElement.classList.contains('js'), more: getComputedStyle(document.querySelector('.tabbar')).display,
  links: [...document.querySelectorAll('.hdr-nav a')].map(a => { const r = a.getBoundingClientRect(); return [a.getAttribute('href'), r.width > 0 && r.right > 0 && r.left < innerWidth, Math.round(r.height)]; }) }))()`);
ck('sin JavaScript: la barra inferior con la casilla «Más» no se muestra', nj.js === false && nj.more === 'none', JSON.stringify(nj));
ck('sin JavaScript: Catálogo, Eventos y Visita son alcanzables (>= 44 px de alto) y Novedades, que necesita JavaScript, no se ofrece', nj.links.filter(l => l[1]).map(l => l[0]).join() === '#libros,#cartelera,#visita' && nj.links.filter(l => l[1]).every(l => l[2] >= 44) && nj.links.some(l => l[0] === '#novedades' && !l[1]), JSON.stringify(nj));
await shot('nojs-390-top.png');

ck('sin errores de consola', errs.length === 0, errs.join(' | '));
for (const r of out) console.log(r.join(' '));
const bad = out.filter(r => r[0] === '✗').length;
console.log(bad ? `FALLAN ${bad}` : 'todo bien');
try { ws.close(); chrome.kill(); } catch {}
process.exit(bad ? 1 : 0);
