import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const port = 10200 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-x-'))}`, 'about:blank'], { stdio: 'ignore' });
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
const ck = (n, ok, d = '') => { out.push([ok ? '✓' : '✗', n, ok ? '' : d]); console.log(ok ? '✓' : '✗', n, ok ? '' : String(d).slice(0, 300)); };
const realClick = async sel => {
  const p = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); e.scrollIntoView({ block: 'center' }); const r = e.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  await sleep(250);
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: p[0], y: p[1], button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: p[0], y: p[1], button: 'left', clickCount: 1 });
};
const waitFor = async (expr, tries = 40) => { for (let i = 0; i < tries; i++) { if (await ev(expr)) return true; await sleep(200); } return false; };

// ---------- MÓVIL ----------
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url: URL_ });
await sleep(4500);
const H0 = await ev(`document.documentElement.scrollHeight`);
for (let y = 0; y < H0; y += 500) { await ev(`scrollTo(0, ${y})`); await sleep(160); }
await ev(`scrollTo(0, 0)`); await sleep(500);
const len = await ev(`(() => { const r = document.getElementById('libros').getBoundingClientRect(); return { libros: Math.round(r.height), screens: +(r.height / innerHeight).toFixed(1), page: +(document.documentElement.scrollHeight / innerHeight).toFixed(1) }; })()`);
ck('móvil: Libros ya no es una rejilla interminable (≤ 3.5 pantallas; antes 8.4)', len.screens <= 3.5, JSON.stringify(len));
const tz = await ev(`(() => { const ex = document.getElementById('explorer'); const b = document.querySelector('[data-ex-open]'); const r = b.getBoundingClientRect(); return { exOpen: ex.open, exDisplay: getComputedStyle(ex).display, btnH: Math.round(r.height), btnW: Math.round(r.width) }; })()`);
ck('móvil: el diálogo está cerrado y el campo de búsqueda mide ≥ 44px', tz.exOpen === false && tz.exDisplay === 'none' && tz.btnH >= 44, JSON.stringify(tz));

await ev(`scrollTo(0, document.querySelector('[data-ex-open]').getBoundingClientRect().top + scrollY - 200)`); await sleep(1500); await ev(`scrollBy(0, 1)`); await sleep(500);
const y0 = await ev(`scrollY`);
await ev(`document.querySelector('[data-ex-open]').click()`);
await waitFor(`document.getElementById('explorer').open`);
await sleep(1200);
const op = await ev(`(() => { const ex = document.getElementById('explorer'); const r = ex.getBoundingClientRect(); return { open: ex.open, modal: ex.matches(':modal'), full: [Math.round(r.width), Math.round(r.height)], lock: document.documentElement.classList.contains('explorer-open'), hash: location.hash, focus: document.activeElement.getAttribute('data-ex-close') !== null, cards: ex.querySelectorAll('button.card').length, input: !!ex.querySelector('[data-cat-q]') }; })()`);
ck('móvil: abre a pantalla completa como diálogo modal con foco en cerrar y el scroll bloqueado', op.open && op.modal && op.full[0] === 390 && op.full[1] === 844 && op.lock && op.focus && op.input && op.cards > 0, JSON.stringify(op));
ck('móvil: la URL refleja la hoja (#explorar) para que «atrás» la cierre', op.hash === '#explorar');

// Plantilla: la cabecera fija de Explorar lleva solo el titular (sin sellos), en una sola línea a 390, 360 y 320 px.
for (const w of [390, 360, 320]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: 800, deviceScaleFactor: 1, mobile: true }); await sleep(500);
  const sl = await ev(`(() => { const ex = document.getElementById('explorer'); const s = ex.querySelector('.ex-top .ex-title'); const top = ex.querySelector('.ex-top').getBoundingClientRect(); const b = s.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(s); const close = ex.querySelector('[data-ex-close]').getBoundingClientRect(); return { text: s.textContent.trim(), seal: !!ex.querySelector('[data-cat-seal], .ex-seal'), lines: range.getClientRects().length, inTop: b.top >= top.top && b.bottom <= top.bottom + 1, right: Math.round(b.right), closeLeft: Math.round(close.left), vis: getComputedStyle(s).visibility, sw: document.documentElement.scrollWidth, cw: document.documentElement.clientWidth, topH: Math.round(top.height) }; })()`);
  ck(`móvil ${w}: la cabecera de Explorar lleva solo «Explorar el catálogo» en una línea, sin sello, sin cortarse ni chocar con cerrar`, sl.text === 'Explorar el catálogo' && !sl.seal && sl.lines === 1 && sl.inTop && sl.right <= sl.closeLeft && sl.vis === 'visible' && sl.sw === sl.cw, JSON.stringify(sl));
  if (w === 390) { const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync('explorer-movil-sello-390.jpg', Buffer.from(shot.result.data, 'base64')); }
  if (w === 360) { const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync('explorer-movil-sello-360.jpg', Buffer.from(shot.result.data, 'base64')); }
}
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true }); await sleep(500);

// «Filtros» no promete el total del catálogo: sin filtros activos va a secas; con filtros, el número de activos. Géneros en español (CR-07).
// Inventario real: Género (6, todos a la vista: un grupo solo se pliega desde 8) y Editorial (4). Sin «Categoría» (sale del género), sin
// Formato (la hoja no lo trae) y sin selector «Ordenar» (retirados el 2026-11-13).
const fl = await ev(`(async () => { const ex = document.getElementById('explorer'); const btn = ex.querySelector('[data-cat-filters-btn]'); const w = x => new Promise(r => setTimeout(r, x));
  const idle = { text: btn.textContent.trim(), label: btn.getAttribute('aria-label') };
  btn.click(); await w(400);
  const shownOpts = g => [...g.querySelectorAll('.cat-opt')].filter(o => o.getBoundingClientRect().height > 0).length;
  const groups = [...ex.querySelectorAll('.cat-group')].map(g => ({ legend: g.querySelector('legend').textContent, opts: shownOpts(g), all: g.querySelectorAll('.cat-opt').length, fold: !!g.querySelector('[data-expand]') }));
  const foot = ex.querySelector('.cat-filters-foot'); const fr = foot.getBoundingClientRect();
  const sticky = { pos: getComputedStyle(foot).position, bottom: Math.round(fr.bottom), vh: innerHeight, panel: Math.round(foot.parentElement.getBoundingClientRect().bottom), text: foot.textContent.trim() };
  const labels = [...[...ex.querySelectorAll('.cat-group')].find(g => g.querySelector('legend').textContent === 'Género').querySelectorAll('label')].map(l => l.firstChild.textContent);
  const genres = [...ex.querySelectorAll('.cat-group')].find(g => g.querySelector('legend').textContent === 'Género');
  const cb = genres.querySelector('input[type=checkbox]'); cb.click(); await w(500);
  const again = [...ex.querySelectorAll('.cat-group')].find(g => g.querySelector('legend').textContent === 'Género'); again.querySelectorAll('input[type=checkbox]')[1].click(); await w(500); // el panel se vuelve a pintar tras cada filtro
  const active = { text: btn.textContent.trim(), label: btn.getAttribute('aria-label') };
  for (let i = 0; i < 6 && ex.querySelector('[data-chip-dim]'); i++) { ex.querySelector('[data-chip-dim]').click(); await w(300); }
  return { idle, active, back: btn.textContent.trim(), labels, groups, sticky, sort: !!ex.querySelector('[data-cat-sort], .cat-sort') };
})()`);
ck('móvil: filtros Género (6) y Editorial (4), todas las opciones a la vista (nada que plegar con menos de 8), sin Categoría, Formato ni «Ordenar»', JSON.stringify(fl.groups.map(g => g.legend)) === '["Género","Editorial"]' && fl.groups.every(g => g.opts === g.all && !g.fold) && fl.groups[0].opts === 6 && fl.groups[1].opts === 4 && !fl.sort, JSON.stringify(fl.groups));
ck('móvil: «Ver N títulos» queda pegado al pie (o al final del panel, si el panel cabe en la pantalla)', fl.sticky.pos === 'sticky' && fl.sticky.bottom <= fl.sticky.vh + 1 && fl.sticky.bottom >= Math.min(fl.sticky.vh, fl.sticky.panel) - 1 && /^Ver \d+ títulos?$/.test(fl.sticky.text), JSON.stringify(fl.sticky));
const EN = /Science Fiction|Middle Grade|Self-Help|Fiction\b|Romance\b(?!\s+(contempor|oscuro|paranormal|juvenil|y fantas))|Thriller|Mystery|History\b|Memoir|Parenting|True Crime|Business|Cooking|Health|Politics|Productivity|Spirituality|Biography|Fantasy|Horror|Dystopian|Graphic Novel/;
ck('móvil: el botón dice «Filtros» sin número, con 2 filtros «Filtros 2» y vuelve a «Filtros» al limpiar (nunca el total, 41)', fl.idle.text === 'Filtros' && fl.idle.label === 'Filtros' && fl.active.text === 'Filtros 2' && /2 activos/.test(fl.active.label) && fl.back === 'Filtros' && !/41/.test(JSON.stringify(fl.idle) + fl.active.text), JSON.stringify({ ...fl, labels: undefined }));
ck('móvil: la barra Género lleva los 6 géneros del inventario en español, sin inglés', fl.labels.length === 6 && !fl.labels.some(l => EN.test(l)) && ['Narrativa', 'Poesía', 'Ensayo', 'Divulgación', 'Ensayo y poesía', 'Ensayo y narrativa'].every(l => fl.labels.includes(l)), JSON.stringify(fl.labels));

// búsqueda dentro de la hoja
const se = await ev(`(async () => { const ex = document.getElementById('explorer'); const q = ex.querySelector('[data-cat-q]'); q.focus(); q.value = 'noche'; q.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 1200));
  const cards = [...ex.querySelectorAll('button.card')];
  // nombre accesible del botón: el texto de la portada (real u tipográfica); la imagen real va sin alt
  return { cards: cards.length, status: ex.querySelector('[data-cat-status]').textContent, names: cards.map(c => c.textContent.replace(/\\s+/g, ' ').trim()), imgs: cards.map(c => c.querySelector('img')?.getAttribute('alt') ?? null), real: cards.filter(c => c.querySelector('.cover--img')).length }; })()`);
ck('móvil: buscar «noche» dentro de la hoja filtra el catálogo (3 de 41: «3 títulos»), con tarjetas nombradas por título, autor y precio', se.cards === 3 && se.status === '3 títulos' && se.real === 2 && se.imgs.filter(a => a !== null).every(a => a === '') && se.names.some(n => n.includes('El lugar de la noche') && n.includes('David Ornelas')) && se.names.some(n => n.includes('Las noches rotas')), JSON.stringify(se));

// ficha encima de la hoja
await realClick('#explorer button.card');
await waitFor(`document.getElementById('cat-drawer').open`);
await sleep(900);
const fi = await ev(`({ drawer: document.getElementById('cat-drawer').open, explorer: document.getElementById('explorer').open, lockEx: document.documentElement.classList.contains('explorer-open'), lockSheet: document.documentElement.classList.contains('sheet-open') })`);
ck('móvil: la ficha abre encima de la hoja y ambas mantienen el bloqueo', fi.drawer && fi.explorer && fi.lockEx && fi.lockSheet, JSON.stringify(fi));
await key('Escape', 'Escape', 27); await sleep(900);
const fb = await ev(`({ drawer: document.getElementById('cat-drawer').open, explorer: document.getElementById('explorer').open, lockEx: document.documentElement.classList.contains('explorer-open'), sheet: document.documentElement.classList.contains('sheet-open'), focusInEx: document.getElementById('explorer').contains(document.activeElement) })`);
ck('móvil: al cerrar la ficha se vuelve a la hoja, que sigue bloqueando el scroll', !fb.drawer && fb.explorer && fb.lockEx && !fb.sheet && fb.focusInEx, JSON.stringify(fb));

// botón «atrás»
//console.log('pre-back', await ev(`JSON.stringify({ h: location.href, len: history.length, st: history.state })`));
await ev(`history.back()`); await sleep(1800);
//console.log('post-back', await ev(`JSON.stringify({ h: location.href, len: history.length, st: history.state })`), JSON.stringify(errs));
const bk = await ev(`({ open: document.getElementById('explorer').open, lock: document.documentElement.classList.contains('explorer-open'), hash: location.hash, y: Math.round(scrollY) })`);
ck('móvil: «atrás» cierra la hoja, quita el bloqueo y deja la URL limpia', bk.open === false && bk.lock === false && bk.hash === '' && Math.abs(bk.y - y0) < 120, JSON.stringify({ ...bk, y0 }));

// Escape y botón cerrar
await ev(`document.querySelector('[data-ex-open]').click()`); await waitFor(`document.getElementById('explorer').open`); await sleep(700);
await key('Escape', 'Escape', 27); await sleep(1000);
const es = await ev(`({ open: document.getElementById('explorer').open, hash: location.hash, focus: document.activeElement.hasAttribute('data-ex-open') })`);
ck('móvil: Escape cierra, limpia la URL y devuelve el foco al campo de búsqueda', es.open === false && es.hash === '' && es.focus, JSON.stringify(es));
await ev(`document.querySelector('[data-ex-open]').click()`); await waitFor(`document.getElementById('explorer').open`); await sleep(700);
await ev(`document.querySelector('[data-ex-close]').click()`); await sleep(1000);
ck('móvil: el botón cerrar también cierra', (await ev(`!document.getElementById('explorer').open && location.hash === ''`)));

// Estado vacío: una sola frase visible (la línea de estado solo la anuncia a lectores de pantalla).
await ev(`document.querySelector('[data-ex-open]').click()`); await waitFor(`document.getElementById('explorer').open`); await sleep(900);
const vacio = await ev(`(async () => { const ex = document.getElementById('explorer'); const q = ex.querySelector('[data-cat-q]'); q.value = 'zzzxqv'; q.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 600));
  const st = ex.querySelector('[data-cat-status]'); const e = ex.querySelector('[data-cat-empty]'); const vis = el => { const r = el.getBoundingClientRect(); return r.width > 1 && r.height > 1; };
  const out = { status: st.textContent, statusSeen: vis(st), empty: !e.hidden && vis(e), phrase: e.querySelector('p').textContent, actions: [...e.querySelectorAll('.btn')].map(b => b.textContent.trim()) };
  q.value = ''; q.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 400)); out.reset = st.textContent; return out; })()`);
ck('móvil: sin resultados se ve una sola frase («No hay títulos con esa combinación.») con sus dos salidas; el estado solo la anuncia', vacio.empty && !vacio.statusSeen && vacio.status === vacio.phrase && vacio.phrase === 'No hay títulos con esa combinación.' && JSON.stringify(vacio.actions) === '["Limpiar búsqueda y filtros","Preguntar por WhatsApp"]' && vacio.reset === '41 títulos', JSON.stringify(vacio));
await ev(`document.querySelector('[data-ex-close]').click()`); await sleep(900);
// «Buscar en el catálogo», arriba del capítulo, abre la hoja (el antiguo «Ver todo el catálogo» bajo el carrusel se retiró).
await ev(`scrollTo(0, document.getElementById('libros').getBoundingClientRect().top + scrollY)`); await sleep(1500);
const top = await ev(`(() => { const h = document.getElementById('books-title').getBoundingClientRect(); const b = document.querySelector('[data-ex-open]').getBoundingClientRect(); return { dist: Math.round(b.top - h.bottom), text: document.querySelector('[data-ex-open]').textContent.trim(), allLink: !!document.querySelector('.rail-all') }; })()`);
ck('móvil: «Buscar en el catálogo» va justo bajo el titular (≤ 40 px) y no queda «Ver todo el catálogo»', top.dist >= 0 && top.dist <= 40 && top.text === 'Buscar en el catálogo' && !top.allLink, JSON.stringify(top));
await realClick('[data-ex-open]');
ck('móvil: «Buscar en el catálogo» abre la hoja', await waitFor(`document.getElementById('explorer').open`));
await ev(`document.querySelector('[data-ex-close]').click()`); await sleep(900);
await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(800);
await ev(`document.querySelector('#menu a[href="#libros"]').click()`);
ck('móvil: «Catálogo» del menú cierra la hoja y lleva al capítulo (con el buscador a la mano), sin abrir Explorar por su cuenta', await waitFor(`!document.getElementById('menu').open && !document.getElementById('explorer').open && Math.abs(document.getElementById('libros').getBoundingClientRect().top) < 120`));
ck('móvil: sin errores de consola', !errs.length, errs.join(' | '));
{ const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync('explorer-movil-cerrado.jpg', Buffer.from(shot.result.data, 'base64')); }
await ev(`scrollTo(0, document.querySelector('[data-ex-open]').getBoundingClientRect().top + scrollY - 300)`); await sleep(1200);
await ev(`document.querySelector('[data-ex-open]').click()`); await waitFor(`document.getElementById('explorer').open`); await sleep(1200);
{ const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync('explorer-movil-abierto.jpg', Buffer.from(shot.result.data, 'base64')); }

// ---------- ESCRITORIO ----------
errs.length = 0;
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await send('Emulation.setTouchEmulationEnabled', { enabled: false });
await send('Page.navigate', { url: URL_ });
await sleep(4500);
const dk = await ev(`(() => { const ex = document.getElementById('explorer'); const b = document.querySelector('[data-ex-open]'); const r = ex.getBoundingClientRect(); const cs = getComputedStyle(ex); return { open: ex.open, modal: ex.matches(':modal'), pos: cs.position, btn: getComputedStyle(b).display, top: getComputedStyle(ex.querySelector('.ex-top')).display, w: Math.round(r.width) }; })()`);
ck('escritorio: el explorador está abierto en línea (no modal), sin cabecera de hoja; «Buscar en el catálogo» arriba del capítulo lleva a él', dk.open && !dk.modal && dk.pos === 'static' && dk.btn === 'flex' && dk.top === 'none' && dk.w > 900, JSON.stringify(dk));
await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY)`); await sleep(2000);
const dc = await ev(`(async () => { const ex = document.getElementById('explorer'); for (let i = 0; i < 30 && !ex.querySelector('button.card'); i++) await new Promise(r => setTimeout(r, 200)); return { cards: ex.querySelectorAll('button.card').length, filters: ex.querySelectorAll('.cat-group').length, status: ex.querySelector('[data-cat-status]').textContent, moreHidden: ex.querySelector('[data-cat-more]').hidden }; })()`);
ck('escritorio: el catálogo carga en línea con los 41 títulos en el marcado («41 títulos», sin «Ver más») y dos grupos de filtros', dc.cards === 41 && dc.filters === 2 && dc.status === '41 títulos' && dc.moreHidden, JSON.stringify(dc));
// Rejilla plegada (2026-11-13): dos filas y «Ver los 41 títulos», que despliega en su sitio; «Ver menos» la pliega sin mover el botón y el foco
// se queda en él; con una búsqueda, los resultados completos y sin botón.
const foldState = `(() => { const g = document.querySelector('[data-cat-grid]'); const b = document.querySelector('[data-cat-fold]'); const cols = getComputedStyle(g).gridTemplateColumns.split(' ').length;
  return { cols, visible: [...g.children].filter(li => li.getBoundingClientRect().height > 0).length, hidden: b.hidden, text: b.textContent, expanded: b.getAttribute('aria-expanded'), controls: b.getAttribute('aria-controls'), top: Math.round(b.getBoundingClientRect().top), focus: document.activeElement === b, h: Math.round(b.getBoundingClientRect().height) }; })()`;
const f0 = await ev(foldState);
ck('escritorio: plegada, la rejilla muestra dos filas (2 × columnas) y «Ver los 41 títulos» (48 px, aria-expanded="false", aria-controls="cat-grid")', f0.visible === 2 * f0.cols && !f0.hidden && f0.text === 'Ver los 41 títulos' && f0.expanded === 'false' && f0.controls === 'cat-grid' && f0.h === 48, JSON.stringify(f0));
await ev(`document.querySelector('[data-cat-fold]').focus(); document.querySelector('[data-cat-fold]').click()`); await sleep(500);
const f1 = await ev(foldState);
ck('escritorio: «Ver los 41 títulos» despliega los 41 en su sitio; el botón dice «Ver menos», aria-expanded="true" y conserva el foco', f1.visible === 41 && f1.text === 'Ver menos' && f1.expanded === 'true' && f1.focus, JSON.stringify(f1));
await ev(`document.querySelector('[data-cat-fold]').scrollIntoView({ block: 'center' })`); await sleep(300);
const f1b = await ev(foldState);
await ev(`document.querySelector('[data-cat-fold]').click()`); await sleep(500);
const f2 = await ev(foldState);
ck('escritorio: «Ver menos» vuelve a dos filas sin mover el botón bajo el cursor (±2 px) y el foco sigue en él', f2.visible === 2 * f2.cols && f2.text === 'Ver los 41 títulos' && f2.expanded === 'false' && f2.focus && Math.abs(f2.top - f1b.top) <= 2, JSON.stringify({ antes: f1b.top, despues: f2 }));
await ev(`(() => { const i = document.getElementById('cat-q'); i.value = 'a'; i.dispatchEvent(new Event('input', { bubbles: true })); })()`); await sleep(900);
const f3 = await ev(`(() => ({ ...${foldState}, status: document.querySelector('[data-cat-status]').textContent }))()`);
ck('escritorio: con una búsqueda los resultados van completos y sin botón', f3.hidden && f3.visible === parseInt(f3.status, 10) && f3.visible > 2 * f3.cols, JSON.stringify(f3));
await ev(`(() => { const i = document.getElementById('cat-q'); i.value = ''; i.dispatchEvent(new Event('input', { bubbles: true })); document.activeElement.blur(); })()`); await sleep(900);
const f4 = await ev(foldState);
ck('escritorio: al borrar la búsqueda vuelve a dos filas', f4.visible === 2 * f4.cols && !f4.hidden, JSON.stringify(f4));
await ev(`document.querySelector('[data-cat-fold]').click()`); await sleep(500); // desplegada para revisar las 41 portadas
// Portadas reales: ninguna rota, cada una con la forma de la tarjeta (sin deformar ni empujar la fila) y el texto oculto como nombre.
const pc = await ev(`(async () => { const ex = document.getElementById('explorer');
  const imgs = [...ex.querySelectorAll('.cover--img img')];
  for (const i of imgs) i.loading = 'eager';
  await Promise.all(imgs.map(i => i.decode().catch(() => {})));
  const covers = [...ex.querySelectorAll('button.card .cover')].map(c => c.getBoundingClientRect());
  const ratio = covers.map(r => +(r.height / r.width).toFixed(2));
  return { cards: ex.querySelectorAll('button.card').length, imgs: imgs.length, broken: imgs.filter(i => !i.complete || !i.naturalWidth).map(i => i.src), blank: ex.querySelectorAll('.cover--blank').length, ratios: [...new Set(ratio)], fit: [...new Set(imgs.map(i => getComputedStyle(i).objectFit))], fills: imgs.every(i => { const a = i.getBoundingClientRect(), b = i.parentElement.getBoundingClientRect(); return Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1; }), named: [...ex.querySelectorAll('button.card')].every(c => c.textContent.trim().length > 3), cards2: [...ex.querySelectorAll('.card-item')].every(li => { const t = li.querySelector('.card-t'), m = li.querySelector('.card-m'), p = li.querySelector('.card-pr'); return t && m && t.scrollWidth <= t.clientWidth + 1 && m.scrollWidth <= m.clientWidth + 1 && (!p || p.getClientRects().length === 1) && !li.querySelector('.card-voltear, .card-reverso'); }), more: ex.querySelector('[data-cat-more]').hidden }; })()`);
ck('escritorio: las 41 tarjetas (32 con portada real, 9 tipográficas), ninguna imagen rota, todas con la misma forma y la foto llenando la portada (object-fit: cover); debajo título y «autor · precio» sin cortar y sin «Voltear»', pc.cards === 41 && pc.imgs === 32 && pc.blank === 9 && !pc.broken.length && pc.ratios.length === 1 && JSON.stringify(pc.fit) === '["cover"]' && pc.fills && pc.named && pc.cards2 && pc.more === true, JSON.stringify(pc));
{ const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 }); writeFileSync('explorer-escritorio.jpg', Buffer.from(shot.result.data, 'base64')); }
// cambiar de escritorio a móvil sin recargar
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await sleep(1500);
const rs = await ev(`({ open: document.getElementById('explorer').open, lock: document.documentElement.classList.contains('explorer-open') })`);
ck('escritorio→móvil sin recargar: el explorador se cierra y no deja bloqueo', rs.open === false && rs.lock === false, JSON.stringify(rs));
await send('Emulation.setDeviceMetricsOverride', { width: 1280, height: 800, deviceScaleFactor: 1, mobile: false });
await sleep(1500);
ck('móvil→escritorio sin recargar: el explorador vuelve a quedar abierto en línea', await ev(`document.getElementById('explorer').open && !document.getElementById('explorer').matches(':modal')`));
ck('escritorio: sin errores de consola', !errs.length, errs.join(' | '));

for (const l of out) console.log(l.join(' '));
console.log('FALLAN', out.filter(l => l[0] === '✗').length, 'de', out.length);
chrome.kill();
process.exit(0);
