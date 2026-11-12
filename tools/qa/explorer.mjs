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
// Inventario real: Categoría (2), Género (6, el único grupo que se pliega), Editorial (4); la hoja no trae formato, así que no hay grupo Formato.
const fl = await ev(`(async () => { const ex = document.getElementById('explorer'); const btn = ex.querySelector('[data-cat-filters-btn]'); const w = x => new Promise(r => setTimeout(r, x));
  const idle = { text: btn.textContent.trim(), label: btn.getAttribute('aria-label') };
  btn.click(); await w(400);
  // Filtros plegados (Hick): cada grupo abre con 5 opciones como máximo y su propio «Ver las N»; al abrirlo el botón no se mueve, conserva el foco y el scroll no cambia.
  const shownOpts = g => [...g.querySelectorAll('.cat-opt')].filter(o => o.getBoundingClientRect().height > 0).length;
  const groups = () => [...ex.querySelectorAll('.cat-group')].map(g => { const b = g.querySelector('[data-expand]'); return { legend: g.querySelector('legend').textContent, opts: shownOpts(g), btn: b?.textContent, exp: b?.getAttribute('aria-expanded'), ctl: !!b && !!document.getElementById(b.getAttribute('aria-controls')), h: b ? Math.round(b.getBoundingClientRect().height) : null }; });
  const folded = groups();
  const more = ex.querySelector('[data-expand="g"]'); more.scrollIntoView({ block: 'center' }); await w(200);
  const before = { top: Math.round(more.getBoundingClientRect().top), scroll: ex.scrollTop };
  more.focus(); more.click(); await w(300);
  const moreNow = ex.querySelector('[data-expand="g"]');
  const opened = { groups: groups(), top: Math.round(moreNow.getBoundingClientRect().top), scroll: ex.scrollTop, focus: document.activeElement === moreNow };
  const foot = ex.querySelector('.cat-filters-foot'); const fr = foot.getBoundingClientRect();
  const sticky = { pos: getComputedStyle(foot).position, bottom: Math.round(fr.bottom), vh: innerHeight, panel: Math.round(foot.parentElement.getBoundingClientRect().bottom), text: foot.textContent.trim() };
  const labels = [...[...ex.querySelectorAll('.cat-group')].find(g => g.querySelector('legend').textContent === 'Género').querySelectorAll('label')].map(l => l.firstChild.textContent); // con el grupo abierto: todos
  ex.querySelector('[data-expand="g"]').click(); await w(300); // vuelve a plegar Género (el panel se pintó de nuevo: otro botón)
  const refolded = groups().find(g => g.legend === 'Género');
  const folding = { folded, before, opened, sticky, refolded, legends: [...ex.querySelectorAll('.cat-group legend')].map(l => l.textContent), sorts: [...ex.querySelectorAll('[data-cat-sort] option')].map(o => o.value) };
  const genres = [...ex.querySelectorAll('.cat-group')].find(g => g.querySelector('legend').textContent === 'Género');
  const cb = genres.querySelector('input[type=checkbox]'); cb.click(); await w(500);
  const again = [...ex.querySelectorAll('.cat-group')].find(g => g.querySelector('legend').textContent === 'Género'); again.querySelectorAll('input[type=checkbox]')[1].click(); await w(500); // el panel se vuelve a pintar tras cada filtro
  const active = { text: btn.textContent.trim(), label: btn.getAttribute('aria-label') };
  for (let i = 0; i < 6 && ex.querySelector('[data-chip-dim]'); i++) { ex.querySelector('[data-chip-dim]').click(); await w(300); }
  return { idle, active, back: btn.textContent.trim(), labels, folding };
})()`);
{ const f = fl.folding; const g = f.folded.find(x => x.legend === 'Género'), og = f.opened.groups.find(x => x.legend === 'Género');
  ck('móvil: el panel de filtros abre con 5 opciones como máximo por grupo (≤ 20 en total) y un «Ver los N» propio (aria-expanded, aria-controls, ≥ 44 px) solo en el grupo que pasa de 5 (Género)', f.folded.every(x => x.opts <= 5 && (x.btn === undefined || (/^Ver l[oa]s \d+ /.test(x.btn) && x.exp === 'false' && x.ctl && x.h >= 44))) && f.folded.reduce((n, x) => n + x.opts, 0) <= 20 && f.folded.filter(x => x.btn).length === 1 && g.btn === 'Ver los 6 géneros' && f.folded.filter(x => !x.btn).every(x => x.opts >= 2), JSON.stringify(f.folded));
  ck('móvil: grupos solo con datos de la hoja (Categoría, Género, Editorial: sin Formato vacío) y sin «Más recientes» (no hay años)', JSON.stringify(f.legends) === '["Categoría","Género","Editorial"]' && f.folded.find(x => x.legend === 'Editorial').opts === 4 && JSON.stringify(f.sorts) === '["rel","az","autor"]', JSON.stringify({ legends: f.legends, sorts: f.sorts }));
  ck('móvil: «Ver los 6 géneros» despliega el grupo sin mover el botón ni el scroll y con el foco en él; pasa a «Ver menos géneros» (aria-expanded=true)', og.opts === 6 && og.btn === 'Ver menos géneros' && og.exp === 'true' && f.opened.focus && f.opened.top === f.before.top && f.opened.scroll === f.before.scroll, JSON.stringify({ og, before: f.before, top: f.opened.top, scroll: f.opened.scroll, focus: f.opened.focus }));
  ck('móvil: el grupo vuelve a plegarse a 5 y «Ver N títulos» sigue pegado al pie (o al final del panel, si el panel cabe en la pantalla)', f.refolded.opts === 5 && f.refolded.exp === 'false' && f.refolded.btn === 'Ver los 6 géneros' && f.sticky.pos === 'sticky' && f.sticky.bottom <= f.sticky.vh + 1 && f.sticky.bottom >= Math.min(f.sticky.vh, f.sticky.panel) - 1 && /^Ver \d+ títulos?$/.test(f.sticky.text), JSON.stringify({ refolded: f.refolded, sticky: f.sticky })); }
const EN = /Science Fiction|Middle Grade|Self-Help|Fiction\b|Romance\b(?!\s+(contempor|oscuro|paranormal|juvenil|y fantas))|Thriller|Mystery|History\b|Memoir|Parenting|True Crime|Business|Cooking|Health|Politics|Productivity|Spirituality|Biography|Fantasy|Horror|Dystopian|Graphic Novel/;
ck('móvil: el botón dice «Filtros» sin número, con 2 filtros «Filtros 2» y vuelve a «Filtros» al limpiar (nunca el total, 41)', fl.idle.text === 'Filtros' && fl.idle.label === 'Filtros' && fl.active.text === 'Filtros 2' && /2 activos/.test(fl.active.label) && fl.back === 'Filtros' && !/41/.test(JSON.stringify(fl.idle) + fl.active.text), JSON.stringify({ ...fl, labels: undefined }));
ck('móvil: la barra Género lleva los 6 géneros del inventario en español, sin inglés', fl.labels.length === 6 && !fl.labels.some(l => EN.test(l)) && ['Narrativa', 'Poesía', 'Ensayo', 'Divulgación', 'Ensayo y poesía', 'Ensayo y narrativa'].every(l => fl.labels.includes(l)), JSON.stringify(fl.labels));

// búsqueda dentro de la hoja
const se = await ev(`(async () => { const ex = document.getElementById('explorer'); const q = ex.querySelector('[data-cat-q]'); q.focus(); q.value = 'noche'; q.dispatchEvent(new Event('input', { bubbles: true })); await new Promise(r => setTimeout(r, 1200));
  const cards = [...ex.querySelectorAll('button.card')];
  // nombre accesible del botón: el texto de la portada (real u tipográfica); la imagen real va sin alt
  return { cards: cards.length, status: ex.querySelector('[data-cat-status]').textContent, names: cards.map(c => c.textContent.replace(/\\s+/g, ' ').trim()), imgs: cards.map(c => c.querySelector('img')?.getAttribute('alt') ?? null), real: cards.filter(c => c.querySelector('.cover--img')).length }; })()`);
ck('móvil: buscar «noche» dentro de la hoja filtra el catálogo (3 de 41), con portadas reales y tipográficas nombradas por título y autor', se.cards === 3 && /Mostrando 3 de 3 títulos/.test(se.status) && se.real === 2 && se.imgs.filter(a => a !== null).every(a => a === '') && se.names.some(n => n.includes('El lugar de la noche') && n.includes('David Ornelas')) && se.names.some(n => n.includes('Las noches rotas')), JSON.stringify(se));

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

// «Ver todo el catálogo» y hoja «Más»
await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`); await sleep(2500); await ev(`scrollBy(0, 1)`); await sleep(500);
await ev(`document.querySelector('.rail-all').click()`);
ck('móvil: «Ver todo el catálogo» abre la hoja', await waitFor(`document.getElementById('explorer').open`));
await ev(`document.querySelector('[data-ex-close]').click()`); await sleep(900);
await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(800);
await ev(`document.querySelector('#sheet-menu a[href="#catalogo"]').click()`);
ck('móvil: «Buscar en el catálogo» de la hoja «Más» la cierra y abre Explorar', await waitFor(`document.getElementById('explorer').open && !document.getElementById('sheet-menu').open`));
await ev(`document.querySelector('[data-ex-close]').click()`); await sleep(900);
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
ck('escritorio: el explorador está abierto en línea (no modal), sin botón ni cabecera de hoja', dk.open && !dk.modal && dk.pos === 'static' && dk.btn === 'none' && dk.top === 'none' && dk.w > 900, JSON.stringify(dk));
await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY)`); await sleep(2000);
const dc = await ev(`(async () => { const ex = document.getElementById('explorer'); for (let i = 0; i < 30 && !ex.querySelector('button.card'); i++) await new Promise(r => setTimeout(r, 200)); return { cards: ex.querySelectorAll('button.card').length, filters: ex.querySelectorAll('.cat-group').length, status: ex.querySelector('[data-cat-status]').textContent, more: ex.querySelector('[data-cat-more]').textContent }; })()`);
ck('escritorio: el catálogo carga en línea con 24 tarjetas (de 41) y filtros', dc.cards === 24 && dc.filters === 3 && /Mostrando 24 de 41 títulos/.test(dc.status) && /Ver 17 más · quedan 17/.test(dc.more), JSON.stringify(dc));
// Portadas reales: ninguna rota, cada una con la forma de la tarjeta (sin deformar ni empujar la fila) y el texto oculto como nombre.
const pc = await ev(`(async () => { const ex = document.getElementById('explorer'); ex.querySelector('[data-cat-more]').click(); await new Promise(r => setTimeout(r, 400));
  const imgs = [...ex.querySelectorAll('.cover--img img')];
  for (const i of imgs) i.loading = 'eager';
  await Promise.all(imgs.map(i => i.decode().catch(() => {})));
  const covers = [...ex.querySelectorAll('button.card .cover')].map(c => c.getBoundingClientRect());
  const ratio = covers.map(r => +(r.height / r.width).toFixed(2));
  return { cards: ex.querySelectorAll('button.card').length, imgs: imgs.length, broken: imgs.filter(i => !i.complete || !i.naturalWidth).map(i => i.src), blank: ex.querySelectorAll('.cover--blank').length, ratios: [...new Set(ratio)], fit: [...new Set(imgs.map(i => getComputedStyle(i).objectFit))], fills: imgs.every(i => { const a = i.getBoundingClientRect(), b = i.parentElement.getBoundingClientRect(); return Math.abs(a.width - b.width) < 1 && Math.abs(a.height - b.height) < 1; }), named: [...ex.querySelectorAll('button.card')].every(c => c.textContent.trim().length > 3), more: ex.querySelector('[data-cat-more]').hidden }; })()`);
ck('escritorio: las 41 tarjetas (32 con portada real, 9 tipográficas), ninguna imagen rota, todas con la misma forma y la foto llenando la portada (object-fit: cover)', pc.cards === 41 && pc.imgs === 32 && pc.blank === 9 && !pc.broken.length && pc.ratios.length === 1 && JSON.stringify(pc.fit) === '["cover"]' && pc.fills && pc.named && pc.more === true, JSON.stringify(pc));
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
