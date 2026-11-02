import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const port = 10100 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-v-'))}`, 'about:blank'], { stdio: 'ignore' });
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
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) errs.push('EVAL ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result?.result?.value; };
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['escritorio', 1280, 800, false]]) {
  errs.length = 0;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Page.navigate', { url: URL_ });
  await sleep(1500);
  await ev(`localStorage.clear()`);
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
  await sleep(2500); await ev(`scrollBy(0, 1)`); await sleep(800);

  const st = await ev(`(() => {
    const b = [...document.querySelectorAll('[data-rail] .save')];
    const small = b.filter(x => { const r = x.getBoundingClientRect(); return r.width > 0 && (r.width < 44 || r.height < 44); }).length;
    return { n: b.length, pressed: b.filter(x => x.getAttribute('aria-pressed') === 'true').length, label: b[0]?.getAttribute('aria-label'), small, menuCount: document.querySelector('#sheet-menu [data-saved-count]')?.textContent, badgeHidden: document.querySelector('.hdr-list')?.hidden };
  })()`);
  ck(name + ': cada libro del carrusel tiene botón de guardar de 44px con nombre', st.n === 12 && st.pressed === 0 && /^Guardar «/.test(st.label) && st.small === 0, JSON.stringify(st));
  ck(name + ': lista vacía al inicio', st.menuCount === 'Vacía' && st.badgeHidden === true, JSON.stringify(st));

  // guardar dos libros con clic real
  const pos = await ev(`(() => { const b = document.querySelectorAll('[data-rail] .save'); return [0, 1].map(i => { const r = b[i].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }); })()`);
  for (const [x, y] of pos) {
    await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
    await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x, y, button: 'left', clickCount: 1 });
    await sleep(500);
  }
  const sv = await ev(`(() => ({ ls: JSON.parse(localStorage.getItem('iti-saved-v1') || '[]').length, pressed: document.querySelectorAll('[data-rail] .save[aria-pressed=true]').length, label: document.querySelector('[data-rail] .save[aria-pressed=true]')?.getAttribute('aria-label'), toast: document.querySelector('.toast')?.matches(':popover-open'), toastText: document.querySelector('.toast')?.textContent, count: document.querySelector('#sheet-menu [data-saved-count]')?.textContent, badge: document.querySelector('.hdr-list') ? !document.querySelector('.hdr-list').hidden : null }))()`);
  ck(name + ': guardar persiste en el dispositivo y actualiza etiquetas, aviso y conteo', sv.ls === 2 && sv.pressed === 2 && /^Quitar «/.test(sv.label) && sv.toast === true && /Ver mi lista/.test(sv.toastText) && sv.count === '2 libros', JSON.stringify(sv));
  if (!mobile) ck('escritorio: el chip de la cabecera aparece con el conteo', sv.badge === true && (await ev(`document.querySelector('.hdr-list [data-saved-n]').textContent`)) === '2');

  // persistencia al recargar
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  ck(name + ': la lista sobrevive a recargar', (await ev(`JSON.parse(localStorage.getItem('iti-saved-v1') || '[]').length`)) === 2 && (await ev(`document.querySelector('#sheet-menu [data-saved-count]')?.textContent`)) === '2 libros');

  // abrir Mi lista desde el aviso o el menú
  if (mobile) { await ev(`document.querySelector('.hdr-more').click()`); await sleep(800); await ev(`document.querySelector('#sheet-menu [data-open-mylist]').click()`); }
  else { await ev(`document.querySelector('.hdr-list').click()`); }
  await sleep(1500);
  const ml = await ev(`(() => {
    const d = document.getElementById('mylist');
    const items = [...d.querySelectorAll('.ml-item')];
    const wa = d.querySelector('[data-ml-wa]');
    return { open: d.open, modal: d.matches(':modal'), items: items.length, first: items[0]?.querySelector('strong')?.textContent, waHidden: wa.hidden, wa: decodeURIComponent(wa.href).split('+').join(' '), visit: d.querySelector('[data-ml-visit]').href.includes('maps/dir'), lock: document.documentElement.classList.contains('sheet-open'), focus: document.activeElement.className, menuOpen: document.getElementById('sheet-menu').open };
  })()`);
  ck(name + ': Mi lista abre como hoja modal con 2 libros, Cómo llegar y WhatsApp', ml.open && ml.modal && ml.items === 2 && ml.visit && !ml.waHidden && /Hola, pienso visitarlos/.test(ml.wa) && ml.wa.includes('1. «') && ml.wa.includes('2. «') && ml.lock && /ml-close/.test(ml.focus) && !ml.menuOpen, JSON.stringify(ml));
  // quitar uno desde la hoja
  await ev(`document.querySelector('[data-ml-remove]').click()`); await sleep(800);
  ck(name + ': quitar desde la hoja actualiza la lista', (await ev(`document.querySelectorAll('#mylist .ml-item').length`)) === 1 && (await ev(`JSON.parse(localStorage.getItem('iti-saved-v1')).length`)) === 1);
  await ev(`document.querySelector('[data-ml-remove]').click()`); await sleep(800);
  const empty = await ev(`(() => ({ empty: !document.querySelector('[data-ml-empty]').hidden, waHidden: document.querySelector('[data-ml-wa]').hidden }))()`);
  ck(name + ': lista vacía muestra el estado vacío y oculta WhatsApp', empty.empty && empty.waHidden, JSON.stringify(empty));
  await key('Escape', 'Escape', 27); await sleep(700);
  ck(name + ': Escape cierra y libera el scroll', (await ev(`!document.getElementById('mylist').open && !document.documentElement.classList.contains('sheet-open')`)));

  // guardar desde la ficha
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`); await sleep(2500); await ev(`scrollBy(0, 1)`); await sleep(800);
  for (let i = 0; i < 30 && !(await ev(`!!document.querySelector('[data-rail] button.card[data-id]')`)); i++) await sleep(300);
  await ev(`document.querySelector('[data-rail] button.card').click()`);
  for (let i = 0; i < 40; i++) { await sleep(200); if (await ev(`document.getElementById('cat-drawer')?.open`)) break; }
  await sleep(1000);
  console.log('DIAG', name, JSON.stringify(await ev(`({ drawerOpen: document.getElementById('cat-drawer')?.open, ready: document.getElementById('catalogo').dataset.ready, state: document.getElementById('catalogo').dataset.state, status: document.querySelector('[data-cat-status]')?.textContent, modalOpen: [...document.querySelectorAll('dialog[open]')].map(d => d.id), popovers: [...document.querySelectorAll(':popover-open')].length })`)), JSON.stringify(errs));
  const fi = await ev(`(() => { const b = document.querySelector('[data-d-save]'); const r = b.getBoundingClientRect(); return { id: !!b.dataset.saveId, pressed: b.getAttribute('aria-pressed'), text: b.textContent.trim(), h: Math.round(r.height), msg: document.querySelector('[data-d-msg]').textContent }; })()`);
  ck(name + ': la ficha trae su botón de guardar (≥44px)', fi.id && fi.pressed === 'false' && /Guardar en mi lista/.test(fi.text) && fi.h >= 44, JSON.stringify(fi));
  await ev(`document.querySelector('[data-d-save]').click()`); await sleep(600);
  const fi2 = await ev(`(() => ({ pressed: document.querySelector('[data-d-save]').getAttribute('aria-pressed'), text: document.querySelector('[data-d-save]').textContent.trim(), toastOpen: document.querySelector('.toast')?.matches(':popover-open'), toastInTop: document.querySelector('.toast')?.matches(':popover-open') }))()`);
  ck(name + ': guardar desde la ficha se refleja y el aviso se ve sobre la hoja modal', fi2.pressed === 'true' && /Guardado en mi lista/.test(fi2.text) && fi2.toastOpen, JSON.stringify(fi2));
  ck(name + ': sin errores de consola', !errs.length, errs.join(' | '));
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`saved-${name}.jpg`, Buffer.from(shot.result.data, 'base64'));
}
for (const l of out) console.log(l.join(' '));
console.log('FALLAN', out.filter(l => l[0] === '✗').length, 'de', out.length);
chrome.kill();
process.exit(0);
