// Móvil con sensación de red social (U03), Novedades (U04) y una sola acción primaria (U01/D10).
// node feed.mjs <url> [outDir]   Sale con código ≠ 0 si algo falla.
//  1. Primera vista (390x844): perfil (nombre, estado, dirección, «Cómo llegar» como única acción de contacto) y ≥ 3 destacados visibles; ≤ 6 acciones visibles en 390x844, 360x740 y 375x667 (U02/D11); «Escribir» (WhatsApp) reaparece en la cabecera al desplazar.
//  2. Cada destacado abre una historia: modal, foco en el cierre, rótulo de procedencia en cada foto, flechas, Escape y «atrás» cierran, el foco vuelve.
//  3. Cartelera como publicaciones: encabezado → foto → acciones → texto (DOM y pantalla), «Me interesa» (aria-pressed, persistente) y «Compartir» (Web Share y respaldo de copiar) de ≥ 44 px, con nombre accesible propio.
//  4. Novedades: sin datos no queda ningún nodo visible ni espacio; con ids se pinta sin avisos de muestra.
//  5. Barrido de acciones primarias en 390x844 y 1280x800: a lo sumo una por pantalla, siempre «Cómo llegar», y ningún WhatsApp mayor que ella.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const out = process.argv[3] || '.';
mkdirSync(out, { recursive: true });
const port = 9600 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-feed-'))}`, '--hide-scrollbars', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); let problems = [];
let override = null; // cuerpo alterno de collections.json
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') problems.push(`LOG ${m.params.entry.text} ${m.params.entry.url || ''}`);
  if (m.method === 'Fetch.requestPaused') {
    const { requestId } = m.params;
    if (override) send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(override)).toString('base64') });
    else send('Fetch.continueRequest', { requestId });
  }
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) { problems.push('EVAL ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return undefined; } return r.result?.result?.value; };
const shot = async n => writeFileSync(join(out, n), Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 })).result.data, 'base64'));
const mouse = async (x, y) => { for (const type of ['mouseMoved', 'mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1, buttons: type === 'mousePressed' ? 1 : 0 }); };
const clickSel = async (sel, nth = 0) => {
  const p = await ev(`(()=>{const e=document.querySelectorAll(${JSON.stringify(sel)})[${nth}]; if(!e) return null; e.scrollIntoView({block:'center'}); const b=e.getBoundingClientRect(); return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
  if (!p) return false;
  await sleep(250); await mouse(p.x, p.y); return true;
};
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*collections.json*' }] });

const report = [];
const check = (area, name, ok, detail = '') => { report.push({ area, name, ok: !!ok, detail: ok ? '' : String(detail) }); };
async function open(w, h, { mobile = true, wait = 4000, reset = false } = {}) {
  problems = [];
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] });
  await send('Page.navigate', { url: 'about:blank' });
  await send('Page.navigate', { url: URL_ });
  await sleep(wait);
  if (reset) { await ev(`localStorage.clear()`); }
}

// ---------- 1. Perfil y destacados en la primera vista ----------
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
const first = await ev(`(()=>{
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const q = s => document.querySelector(s);
  const act = [...document.querySelectorAll('a[href], button')].filter(e => vis(e) && !e.closest('[aria-hidden="true"], [hidden]'));
  const hl = [...document.querySelectorAll('.hl-item')].map(a => ({ vis: vis(a), r: a.getBoundingClientRect().toJSON(), name: a.textContent.trim() }));
  const cta = q('.entry-actions a:first-child'), wa = q('.entry-actions a:last-child');
  return {
    name: q('.entry-title').getBoundingClientRect().height > 10 && q('.entry-title').textContent.trim(),
    status: q('.entry-status [data-status-text]').textContent.trim(), statusVis: vis(q('.entry-status')),
    address: /Mariano Matamoros Pte\\. 421/.test(q('.entry-facts').textContent) && vis(q('.entry-facts li:last-child')),
    avatar: vis(q('.profile-av')),
    cta: { txt: cta.innerText.trim(), cls: cta.className, h: cta.getBoundingClientRect().height, vis: vis(cta) },
    wa: { txt: wa.innerText.trim(), cls: wa.className, h: wa.getBoundingClientRect().height, vis: vis(wa) },
    hl, tab: q('.tabbar').getBoundingClientRect().top >= innerHeight - 1, brandHidden: !vis(q('.hdr-brand')),
    actions: act.map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20))
  };
})()`);
await shot('01-perfil-390x844.jpg');
check('perfil', 'nombre, estado de hoy, dirección y avatar visibles', first.name && /Itinerante/.test(first.name) && first.statusVis && /Abierto|Cerrad|Cierra/.test(first.status) && first.address && first.avatar, JSON.stringify(first).slice(0, 400));
check('perfil', '«Cómo llegar» primaria de ≥ 44 px y «Escribir» fuera de la primera vista (D11)', first.cta.vis && /^Cómo llegar/.test(first.cta.txt) && /btn--tungsten/.test(first.cta.cls) && first.cta.h >= 44 && !first.wa.vis && !first.actions.some(a => /Escribir|Pregunta por un libro/.test(a)), JSON.stringify([first.cta, first.wa]));
const hlVisible = first.hl.filter(h => h.vis);
check('destacados', '≥ 3 destacados visibles en la primera vista, de ≥ 44 px', hlVisible.length >= 3 && first.hl.every(h => h.r.width >= 44 && h.r.height >= 44), JSON.stringify(first.hl));
check('primera vista', `acciones visibles en la primera vista (${first.actions.length}): barra inferior y marca esperan al desplazamiento`, first.tab && first.brandHidden && first.actions.length <= 6, JSON.stringify(first.actions));
for (const [vw, vh] of [[360, 740], [375, 667]]) {
  await open(vw, vh, { reset: true });
  const n = await ev(`[...document.querySelectorAll('a[href], button')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"], [hidden], [inert]'); }).map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 14))`);
  check('primera vista', `${vw}x${vh}: ${n.length} acciones visibles (≤ 6)`, n.length <= 6, JSON.stringify(n));
}
await open(390, 844, { reset: true });
await ev(`scrollTo(0, 700)`); await sleep(700);
const hdrWa = await ev(`(()=>{ const a = document.querySelector('.hdr-wa'); const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { vis: r.width > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.9, w: r.width, href: a.href }; })()`);
check('perfil', 'al desplazar, WhatsApp está en la cabecera (≥ 44 px)', hdrWa.vis && hdrWa.w >= 44 && /wa\.me\/528180875940/.test(hdrWa.href), JSON.stringify(hdrWa));
await open(390, 844, { reset: true });
check('consola', 'sin errores de consola en la primera vista', !problems.length, problems.join(' | '));

// ---------- 2. Cada destacado abre una historia ----------
for (let n = 0; n < 4; n++) {
  await open(390, 844);
  const meta = await ev(`(()=>{const a=document.querySelectorAll('.hl-item')[${n}]; return {key:a.dataset.story, label:a.querySelector('.hl-lb').firstChild.textContent.trim()}})()`);
  const A = `historia ${meta.label}`;
  await clickSel('.hl-item', n);
  await sleep(700);
  const s = await ev(`(()=>{const d=document.querySelector('dialog.story'); if(!d) return null; const q=x=>d.querySelector(x);
    return {open:d.open, modal:d.matches(':modal'), label:d.getAttribute('aria-label'), active:document.activeElement.className, sheet:document.documentElement.classList.contains('sheet-open'),
      bars:d.querySelectorAll('.stories i').length, tag:q('.story-cap .tag')?.textContent, tagCls:q('.story-cap .tag')?.className, title:q('.story-t')?.textContent, imgOk:q('.story-img').naturalWidth>0,
      cta:q('.story-foot .btn--tungsten')?.textContent.trim(), prim:d.querySelectorAll('.btn--tungsten').length,
      close:Math.round(q('.story-close').getBoundingClientRect().width), next:q('.story-nav--next').getBoundingClientRect().toJSON()}})()`);
  check(A, 'abre como modal con foco en el cierre y el scroll bloqueado', s && s.open && s.modal && /story-close/.test(s.active) && s.sheet && /Historia/.test(s.label) && s.close >= 44, JSON.stringify(s));
  check(A, 'cada foto carga con su título y sin rótulo de procedencia', s && !s.tag && s.title && s.imgOk && s.bars >= 2, JSON.stringify(s));
  check(A, 'una sola acción primaria en la hoja y es «Cómo llegar»', s && s.prim === 1 && /^Cómo llegar/.test(s.cta), JSON.stringify(s));
  if (n === 0) await shot('02-historia-casa.jpg');
  // recorre todas las fotos con la flecha: sin rótulo, y el progreso coincide con la barra
  const walk = await ev(`(async()=>{const d=document.querySelector('dialog.story'); const out=[]; const total=d.querySelectorAll('.stories i').length;
    for(let i=0;i<total;i++){ const t=d.querySelector('.story-cap .tag'); out.push({i, tag:t?.textContent, seen:d.querySelectorAll('.stories i.is-seen').length, live:d.querySelector('[aria-live]').textContent});
      if(i<total-1){ d.dispatchEvent(new KeyboardEvent('keydown',{key:'ArrowRight',bubbles:true})); await new Promise(r=>setTimeout(r,60)); } }
    return out})()`);
  check(A, `recorre ${walk.length} fotos sin rótulo, con progreso y aviso para lectores`, walk.length >= 2 && walk.every((w, i) => !w.tag && !/Recreación IA|Foto real/.test(w.live) && w.seen === i + 1 && new RegExp(`Foto ${i + 1} de ${walk.length}`).test(w.live)), JSON.stringify(walk));
  // Escape cierra y el foco vuelve al destacado
  await key('Escape', 'Escape', 27); await sleep(500);
  const e1 = await ev(`({open:!!document.querySelector('dialog.story')?.open, sheet:document.documentElement.classList.contains('sheet-open'), lock:getComputedStyle(document.documentElement).overflow, focus:document.activeElement.dataset.story, seen:document.querySelectorAll('.hl-item')[${n}].classList.contains('is-seen'), url:location.hash})`);
  check(A, 'Escape cierra, libera el scroll y el foco vuelve al destacado', !e1.open && !e1.sheet && e1.focus === meta.key && e1.seen && e1.url === '', JSON.stringify(e1));
  // botón de cierre y «atrás»
  await clickSel('.hl-item', n); await sleep(600);
  await clickSel('dialog.story .story-close'); await sleep(500);
  const e2 = await ev(`({open:!!document.querySelector('dialog.story')?.open, sheet:document.documentElement.classList.contains('sheet-open'), focus:document.activeElement.dataset.story, len:history.length})`);
  check(A, 'el botón de cierre cierra y devuelve el foco', !e2.open && !e2.sheet && e2.focus === meta.key, JSON.stringify(e2));
  await clickSel('.hl-item', n); await sleep(600);
  await ev(`history.back()`); await sleep(700);
  const e3 = await ev(`({open:!!document.querySelector('dialog.story')?.open, sheet:document.documentElement.classList.contains('sheet-open'), path:location.pathname})`);
  check(A, '«atrás» cierra la historia sin salir del sitio', !e3.open && !e3.sheet && /\/$|index\.html$/.test(e3.path), JSON.stringify(e3));
  check(A, 'sin errores de consola', !problems.length, problems.join(' | '));
}

// ---------- 3. Cartelera como publicaciones ----------
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
const posts = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s); const i = q('[data-interest]'), s = q('[data-share]');
  const rect = e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  return { id: it.dataset.id, photo: !!q('.bill-card-img'), tag: q('.bill-card-cap .tag')?.textContent, cap: q('.bill-card-cap')?.textContent.trim(), title: q('.bill-title')?.textContent, interest: i && rect(i), share: s && rect(s), pressed: i?.getAttribute('aria-pressed'), iTxt: i?.textContent.trim(), sTxt: s?.textContent.trim() }; })`);
check('cartelera', '3 publicaciones con foto, pie sin rótulo, título, «Me interesa» y «Compartir» de ≥ 44 px', posts.length === 3 && posts.every(p => p.photo && !p.tag && p.cap && !/Recreación IA|Foto real/.test(p.cap) && p.title && p.iTxt === 'Me interesa' && p.sTxt === 'Compartir' && p.interest[1] >= 44 && p.interest[0] >= 44 && p.share[1] >= 44 && p.share[0] >= 44 && p.pressed === 'false'), JSON.stringify(posts));
// Publicación reconocible (CR-13): encabezado → foto → acciones → texto, tanto en el DOM como en la pantalla; el título se ve una sola vez.
const order = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s); const els = ['.bill-post-head', '.bill-card-img', '.bill-acts', '.bill-cap', '.bill-detail > p'].map(q);
  const dom = els.every((e, i) => e && (i === 0 || (els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)));
  const tops = els.map(e => e ? Math.round(e.getBoundingClientRect().top) : null); const vis = tops.every((t, i) => t !== null && (i === 0 || t >= tops[i - 1]));
  return { id: it.dataset.id, dom, vis, tops, who: q('.bill-post-who')?.textContent.trim(), once: [...it.querySelectorAll('.bill-title, .bill-cap-t')].filter(e => e.getBoundingClientRect().height > 0).length }; })`);
check('cartelera', 'orden del DOM y de la pantalla: encabezado → foto → acciones → texto; «Itinerante · propuesta»; el título se ve una sola vez', order.length === 3 && order.every(o => o.dom && o.vis && o.who === 'Itinerante · propuesta' && o.once === 1), JSON.stringify(order));
// Nombres accesibles (árbol de accesibilidad del navegador): los tres «Compartir» y los tres «Me interesa» llevan el título de su publicación.
await send('Accessibility.enable');
const ax = (await send('Accessibility.getFullAXTree')).result.nodes.filter(n => n.role?.value === 'button' && /^(Compartir|Me interesa)/.test(n.name?.value || '')).map(n => n.name.value);
const shareNames = ax.filter(n => n.startsWith('Compartir')), likeNames = ax.filter(n => n.startsWith('Me interesa'));
check('cartelera', 'árbol de accesibilidad: 3 «Compartir» con nombres distintos que llevan el título (y 3 «Me interesa» igual)', shareNames.length === 3 && new Set(shareNames).size === 3 && shareNames.every(n => /^Compartir «.+»$/.test(n)) && likeNames.length === 3 && new Set(likeNames).size === 3, JSON.stringify(ax));
await ev(`document.querySelector('.bill-item').scrollIntoView({block:'start'}); scrollBy(0, 120)`); await sleep(600);
await shot('03-cartelera-publicacion.jpg');
await clickSel('[data-interest]', 0); await sleep(500);
const p1 = await ev(`({pressed:document.querySelector('[data-interest]').getAttribute('aria-pressed'), stored:localStorage.getItem('iti-b4-interes-v1'), toast:document.querySelector('.toast')?.textContent})`);
check('cartelera', '«Me interesa» marca aria-pressed, se guarda en este dispositivo y avisa que no se envía nada', p1.pressed === 'true' && /circulo/.test(p1.stored) && /No enviamos nada/.test(p1.toast || ''), JSON.stringify(p1));
await open(390, 844); await sleep(800);
const p2 = await ev(`document.querySelector('[data-interest]').getAttribute('aria-pressed')`);
check('cartelera', '«Me interesa» persiste al recargar', p2 === 'true', p2);
await clickSel('[data-interest]', 0); await sleep(400);
const p3 = await ev(`({pressed:document.querySelector('[data-interest]').getAttribute('aria-pressed'), stored:localStorage.getItem('iti-b4-interes-v1')})`);
check('cartelera', '«Me interesa» se quita con otro toque', p3.pressed === 'false' && p3.stored === '[]', JSON.stringify(p3));
// Web Share
await ev(`window.__shared = null; navigator.share = async d => { window.__shared = d; }`);
await clickSel('[data-share]', 1); await sleep(500);
const sh = await ev(`window.__shared`);
check('cartelera', '«Compartir» usa Web Share con título y enlace a #cartelera', sh && /Ajedrez en la casa/.test(sh.title) && /#cartelera$/.test(sh.url) && !/\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(sh.text), JSON.stringify(sh));
// respaldo: copiar enlace
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__copied = t; } }, configurable: true })`);
await clickSel('[data-share]', 2); await sleep(500);
const cp = await ev(`({copied:window.__copied, toast:document.querySelector('.toast')?.textContent})`);
check('cartelera', '«Compartir» sin Web Share copia el enlace y avisa', /#cartelera$/.test(cp.copied || '') && /Enlace copiado/.test(cp.toast || ''), JSON.stringify(cp));
// AbortError no copia
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }, configurable: true })`);
await clickSel('[data-share]', 0); await sleep(400);
check('cartelera', 'cancelar la hoja de compartir no copia nada', (await ev(`window.__copied`)) === null);
check('cartelera', 'sin errores de consola', !problems.length, problems.join(' | '));
// sin números ni reseñas inventadas en el feed
const feedText = await ev(`[...document.querySelectorAll('.hl, .profile-av, .bill-acts, .entry-copy, .news')].map(e => e.innerText).join(' ')`);
check('verdad', 'sin contadores, reseñas, precios ni fechas inventadas en perfil, destacados y publicaciones', !/(\\d+\\s*(me gusta|likes?|seguidores|reseñas|opiniones|vistas))|★|\\$\\s?\\d|\\bmás leídos\\b|\\bagotad/i.test(feedText || ''), feedText);

// ---------- 4. Novedades ----------
const sample = JSON.parse(readFileSync(new URL('../../assets/data/catalog.json', import.meta.url), 'utf8')).books;
const realData = JSON.parse(readFileSync(new URL('../../assets/data/collections.json', import.meta.url), 'utf8'));
const hiddenState = () => ev(`(()=>{ const s = document.querySelector('#novedades'); const links = [...document.querySelectorAll('[data-news-link]')]; const r = s.getBoundingClientRect();
  const vis = [s, ...links, ...s.querySelectorAll('*')].filter(e => { const b = e.getBoundingClientRect(); return b.width > 0 || b.height > 0; });
  return { hidden: s.hidden, display: getComputedStyle(s).display, h: Math.round(r.height), cards: s.querySelectorAll('.rail-item').length, links: links.map(l => ({ hidden: l.hidden, w: Math.round(l.getBoundingClientRect().width) })), visibleNodes: vis.length, ready: s.dataset.ready, siblingGap: s.previousElementSibling && Math.round(s.getBoundingClientRect().top - s.previousElementSibling.getBoundingClientRect().bottom) }; })()`);
for (const [label, data] of [['sin la clave', realData], ['con ids vacíos', { ...realData, novedades: { titulo: 'Recién llegados', ids: [] } }], ['con ids que no existen', { ...realData, novedades: { ids: ['no-existe-1', 'no-existe-2'] } }]]) {
  override = data;
  await open(390, 844, { wait: 2500 });
  await ev(`document.querySelector('.rail').scrollIntoView()`); await sleep(2500);
  const st = await hiddenState();
  check('novedades', `${label}: no queda ningún nodo visible ni espacio vertical`, st.hidden && st.display === 'none' && st.h === 0 && st.cards === 0 && st.links.every(l => l.hidden && l.w === 0) && st.visibleNodes === 0 && st.ready === '1', JSON.stringify(st));
}
const ids = sample.slice(10, 17).map(b => b.id);
override = { ...realData, novedades: { titulo: 'Recién llegados', ids } };
await open(390, 844, { wait: 2500 });
await ev(`document.querySelector('.rail').scrollIntoView()`); await sleep(2500);
const withData = await ev(`(()=>{ const s = document.querySelector('#novedades'); const r = s.getBoundingClientRect(); 
  return { hidden: s.hidden, cards: s.querySelectorAll('.rail-item').length, h: Math.round(r.height), note: /Datos de muestra|no es inventario/.test(s.innerText), badge: s.querySelectorAll('.badge-new').length, title: s.querySelector('h3').textContent, links: [...document.querySelectorAll('[data-news-link]')].map(l => l.hidden), ids: [...s.querySelectorAll('.card')].map(c => c.dataset.id), text: s.innerText }; })()`);
check('novedades', 'con ids se pinta la tira en el orden dado, sin aviso de muestra y sin «Nuevo» inventado', !withData.hidden && withData.cards === ids.length && JSON.stringify(withData.ids) === JSON.stringify(ids) && !withData.note && withData.badge === 0 && /Recién\s*llegados/i.test(withData.title) && withData.links.every(h => !h) && !/más leídos/i.test(withData.text), JSON.stringify(withData).slice(0, 500));
await ev(`document.querySelector('#novedades').scrollIntoView()`); await sleep(600);
await shot('04-novedades.jpg');
// «Nuevo» solo con el dato: la fecha de llegada vive en el registro del libro y se prueba en la prueba unitaria; aquí se confirma que sin dato no hay insignia.
check('novedades', 'sin fecha de llegada en los registros no aparece «Nuevo»', (await ev(`document.querySelectorAll('#novedades .badge-new').length`)) === 0);
check('consola', 'sin errores de consola con Novedades', !problems.length, problems.join(' | '));
override = null;

// ---------- 5. Barrido de acciones primarias ----------
async function sweep(w, h, mobile) {
  await open(w, h, { mobile });
  await ev(`document.querySelector('.rail')?.scrollIntoView(); document.querySelector('#catalogo')?.scrollIntoView()`); await sleep(2500);
  await ev(`scrollTo(0,0)`); await sleep(800);
  const total = await ev(`document.documentElement.scrollHeight`);
  const bad = [], seen = [];
  for (let y = 0; y < total; y += Math.round(h * 0.5)) {
    await ev(`scrollTo(0, ${y})`); await sleep(260);
    const r = await ev(`(()=>{
      const vis = e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[hidden], [inert]'); };
      const prim = [...document.querySelectorAll('.btn--tungsten')].filter(vis);
      const wa = [...document.querySelectorAll('a[href*="wa.me"].btn, a[href*="wa.me"].btn--sm')].filter(vis);
      const size = e => ({ h: Math.round(e.getBoundingClientRect().height), fs: parseFloat(getComputedStyle(e).fontSize) });
      return { y: scrollY, prim: prim.map(p => ({ t: p.innerText.trim(), ...size(p) })), wa: wa.map(a => ({ t: a.innerText.trim(), ...size(a) })) };
    })()`);
    seen.push(r);
    if (r.prim.length > 1 || r.prim.some(p => !/^Cómo llegar/.test(p.t)) || r.wa.some(a => r.prim.length && (a.h > Math.min(...r.prim.map(p => p.h)) || a.fs > Math.min(...r.prim.map(p => p.fs))))) bad.push(r);
  }
  return { bad, sections: seen.length, withPrimary: seen.filter(s => s.prim.length).length };
}
for (const [w, h, mobile] of [[390, 844, true], [1280, 800, false]]) {
  const s = await sweep(w, h, mobile);
  check('primaria', `${w}x${h}: a lo sumo una acción primaria por pantalla, siempre «Cómo llegar», y ningún WhatsApp mayor (${s.sections} pantallas, ${s.withPrimary} con primaria)`, !s.bad.length, JSON.stringify(s.bad).slice(0, 600));
}
// hojas abiertas: menú, Mi lista, ficha y Explorar (móvil)
await open(390, 844, { wait: 3500 });
const sheets = [];
const sheetPrim = async (name, opener) => {
  await opener(); await sleep(900);
  const r = await ev(`(()=>{ const d=[...document.querySelectorAll('dialog')].find(x=>x.open && x.matches(':modal')); if(!d) return null;
    const vis = e => { const b = e.getBoundingClientRect(); return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden' && !e.closest('[inert]'); };
    const prim = [...d.querySelectorAll('.btn--tungsten')].filter(vis); const wa = [...d.querySelectorAll('a[href*="wa.me"]')].filter(vis);
    const h = e => Math.round(e.getBoundingClientRect().height);
    return { id: d.id || d.className, prim: prim.map(p => p.innerText.trim()), maxPrim: Math.max(0, ...prim.map(h)), maxWa: Math.max(0, ...wa.map(h)) }; })()`);
  sheets.push({ name, ...r });
  await key('Escape', 'Escape', 27); await sleep(600);
};
await sheetPrim('menú', () => clickSel('.hdr-more'));
await sheetPrim('Mi lista', async () => { await ev(`localStorage.setItem('iti-saved-v1', JSON.stringify(['${sample[0].id}']))`); await ev(`document.querySelector('[data-open-mylist]')?.click?.()`); });
await sheetPrim('historia', () => clickSel('.hl-item', 0));
await ev(`scrollTo(0,0)`);
await sheetPrim('Explorar', async () => { await ev(`document.querySelector('[data-ex-open]').scrollIntoView({block:'center'})`); await sleep(500); await clickSel('[data-ex-open]'); await sleep(2000); });
check('primaria', 'hojas abiertas (menú, Mi lista, historia): una sola primaria «Cómo llegar» y ningún WhatsApp mayor', sheets.filter(s => s.id).every(s => s.prim.length <= 1 && s.prim.every(t => /^Cómo llegar/.test(t)) && s.maxWa <= (s.maxPrim || Infinity)) && sheets.filter(s => ['menú', 'historia'].includes(s.name)).every(s => s.id && s.prim.length === 1), JSON.stringify(sheets));
check('consola', 'sin errores de consola en el barrido', !problems.length, problems.join(' | '));

const failed = report.filter(r => !r.ok);
for (const r of report) console.log(`${r.ok ? 'ok   ' : 'FALLA'} [${r.area}] ${r.name}${r.ok ? '' : '\n        ' + r.detail.slice(0, 700)}`);
console.log(`\n${report.length - failed.length}/${report.length} comprobaciones`);
chrome.kill();
process.exit(failed.length ? 1 : 0);
