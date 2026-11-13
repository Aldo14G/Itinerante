// Móvil con sensación de red social (U03), Novedades (U04) y una sola acción primaria (U01/D10).
// node feed.mjs <url> [outDir]   Sale con código ≠ 0 si algo falla.
//  1. Primera vista (390x844): inicio (nombre, estado, dirección, «Cómo llegar» de 56 px como única acción de contacto), sin burbujas de historias, con la barra de navegación (marca y ☰) y la barra inferior de vidrio (Inicio, Catálogo, Mi lista); ≤ 6 destinos distintos a la vista en 390x844, 360x740 y 375x667 (U02/D11; la casilla Novedades y el control «N novedades…» llevan al mismo sitio y cuentan como uno); «Escribir» (WhatsApp) reaparece en la cabecera al desplazar.
//  3. Eventos y talleres: cada tarjeta va foto → insignias (tipo y estado) → título → descripción → acciones (DOM y pantalla); «Preguntar por WhatsApp» (secundario,
//     ocupa el renglón) y «Compartir» (control de icono; Web Share y respaldo de copiar), de 48 px y con nombre accesible propio; sin «Me interesa» (retirado el
//     2026-11-13); la tarjeta cabe en el alto útil (entre la barra de navegación y la barra inferior, con 12 px de holgura) a 320×640, 360×640, 360×740, 375×667 y
//     390×844; el estado sale de data-fecha.
//  4. Novedades (CarruselNovedades): sin llegadas válidas no existen la sección, su enlace de la barra, su fila del menú ni el control del inicio; con llegadas, la tira
//     son solo esas (lo más reciente primero) y «Nuevo» solo en lo reciente; «Ver todo» / «Ver menos» (aria-expanded, foco quieto, rejilla de 3 columnas a 390 y 2 a
//     320); cada libro abre la ficha única (WhatsApp prellenado, Guardar, Compartir con respaldo de copiar, «Cómo llegar»; foco de vuelta al libro; enlace #libro-<id>).
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
// La lista de Novedades que se publica está vacía (la librería aún no registra fechas de llegada): la primera vista y Eventos se miden con
// siete libros del inventario y fechas relativas a hoy (tres recientes), como se verá cuando haya llegadas. El estado vacío se mide en el punto 4.
{
  const books = JSON.parse(readFileSync(new URL('../../assets/data/catalog.json', import.meta.url), 'utf8')).books;
  const ago = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
  override = { ...JSON.parse(readFileSync(new URL('../../assets/data/collections.json', import.meta.url), 'utf8')), novedades: { titulo: 'Recién llegados', entradas: books.slice(10, 17).map((b, i) => ({ id: b.id, llegada: ago([1, 3, 20, 2, 30, 35, 40][i]) })) } };
}

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
// Visita de regreso con llegadas sin ver (iti-news-estado = p): boot.js reserva el renglón del control del inicio desde el primer render.
await ev(`localStorage.setItem('iti-news-estado', 'p')`);
await open(390, 844);
const first = await ev(`(()=>{
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const q = s => document.querySelector(s);
  const act = [...document.querySelectorAll('a[href], button')].filter(e => vis(e) && !e.closest('[aria-hidden="true"], [hidden]'));
  const hl = document.querySelectorAll('.hl, .hl-item, [data-story], dialog.story').length;
  const cta = q('.entry-actions a:first-child'), wa = q('.entry-actions a:last-child'), menu = q('[data-menu-open]');
  return {
    name: q('.entry-title').getBoundingClientRect().height > 10 && q('.entry-title').textContent.trim(),
    status: q('.entry-status [data-status-text]').textContent.trim(), statusVis: vis(q('.entry-status')),
    address: /Mariano Matamoros Pte\\.\\s421/.test(q('.entry-address').textContent) && vis(q('.entry-address')),
    avatar: vis(q('.hdr-brand img')),
    cta: { txt: cta.innerText.trim(), cls: cta.className, h: cta.getBoundingClientRect().height, vis: vis(cta) },
    wa: { txt: wa.innerText.trim(), cls: wa.className, h: wa.getBoundingClientRect().height, vis: vis(wa) },
    hl, tab: vis(q('.tabbar')), tabTop: Math.round(q('.tabbar').getBoundingClientRect().top), ctaBottom: Math.round(cta.getBoundingClientRect().bottom),
    news: (() => { const n = q('[data-news-cta]'); const r = n.getBoundingClientRect(); return { vis: vis(n), txt: n.innerText.trim(), cls: n.className, h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }; })(),
    tabItems: [...document.querySelectorAll('.tabbar a, .tab-list')].filter(vis).map(e => { const r = e.getBoundingClientRect(); const l = e.querySelector('.tab-lb'); const lr = l.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), l.firstChild.textContent.trim(), lr.height > 8 && lr.width > 8 && lr.left >= r.left && lr.right <= r.right && getComputedStyle(l).clipPath === 'none', e.querySelector('svg use').getAttribute('href')]; }),
    barBox: (() => { const r = q('.tabbar').getBoundingClientRect(); const cs = getComputedStyle(q('.tabbar')); return [Math.round(r.left), Math.round(innerWidth - r.right), Math.round(innerHeight - r.bottom), Math.round(r.height), Math.round(r.width), cs.boxShadow !== 'none', parseFloat(cs.borderTopLeftRadius) >= r.height / 2, document.documentElement.dataset.glass === 'lite' ? 'lite' : cs.backdropFilter]; })(), brand: vis(q('.hdr-brand')), menu: vis(menu) && Math.round(menu.getBoundingClientRect().height),
    dests: [...new Set(act.map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))],
    actions: act.map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20))
  };
})()`);
await shot('01-perfil-390x844.jpg');
check('perfil', 'nombre, estado de hoy, dirección y logotipo visibles', first.name && /Itinerante/.test(first.name) && first.statusVis && /Abierto|Cerrad|Cierra/.test(first.status) && first.address && first.avatar, JSON.stringify(first).slice(0, 400));
check('perfil', '«Cómo llegar» primaria de 56 px y la consulta por WhatsApp fuera de la primera vista del teléfono (D11; vive en el menú)', first.cta.vis && /^Cómo llegar/.test(first.cta.txt) && /btn--primario/.test(first.cta.cls) && first.cta.h === 56 && !first.wa.vis && !first.actions.some(a => /Escribir|Pregunta por un libro/.test(a)), JSON.stringify([first.cta, first.wa]));
check('primera vista', 'sin burbujas de historias: ni destacados ni visor', first.hl === 0, String(first.hl));
const lastBottom = first.news.vis ? first.news.bottom : first.ctaBottom;
check('barra inferior', 'a la vista desde la primera pantalla: cápsula de vidrio de 49 × 228 px, centrada, 8 px sobre el borde, con sombra y desenfoque (opaca en gama media)', first.tab && Math.abs(first.barBox[0] - first.barBox[1]) <= 1 && first.barBox[2] === 8 && first.barBox[3] === 49 && first.barBox[4] === 228 && first.barBox[5] && first.barBox[6] && /blur|lite/.test(first.barBox[7]), JSON.stringify(first.barBox));
check('barra inferior', 'no tapa «Cómo llegar» ni el control de novedades (≥ 8 px de aire)', first.tabTop >= lastBottom + 8, JSON.stringify([first.tabTop, first.ctaBottom, first.news]));
check('barra inferior', 'tres casillas iguales de 76 × 49 px con icono propio y nombre a la vista: Inicio, Catálogo y Mi lista', first.tabItems.length === 3 && first.tabItems.every(t => t[0] === 76 && t[1] === 49 && t[3]) && first.tabItems.map(t => t[2]).join('|') === 'Inicio|Catálogo|Mi lista' && new Set(first.tabItems.map(t => t[4])).size === 3, JSON.stringify(first.tabItems));
check('inicio', 'control de novedades bajo «Cómo llegar»: secundario (no primaria), táctil (≥ 48 px) y con el conteo en su texto', first.news.vis && first.news.top >= first.ctaBottom && first.news.h >= 48 && !/primario/.test(first.news.cls) && /^\d+ novedad(es)? recientes?$/.test(first.news.txt), JSON.stringify(first.news));
check('primera vista', `destinos distintos en la primera vista (${first.dests.length} ≤ 6; ${first.actions.length} controles: la marca y el ☰, «Cómo llegar», el control de novedades y la barra inferior)`, first.tab && first.brand && first.menu === 44 && first.dests.length <= 6 && first.actions.length <= 7, JSON.stringify(first.actions));
for (const [vw, vh] of [[360, 740], [375, 667]]) {
  await open(vw, vh, { reset: true });
  const n = await ev(`[...new Set([...document.querySelectorAll('a[href], button')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"], [hidden], [inert]'); }).map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))]`);
  check('primera vista', `${vw}x${vh}: ${n.length} destinos distintos a la vista (≤ 6)`, n.length <= 6, JSON.stringify(n));
}
await open(390, 844, { reset: true });
await ev(`scrollTo(0, 700)`); await sleep(700);
const hdrWa = await ev(`(()=>{ const h = document.querySelector('.hdr').getBoundingClientRect(); const m = document.querySelector('[data-menu-open]').getBoundingClientRect(); const wa = document.querySelector('#menu a[href*="wa.me"]'); return { top: Math.round(h.top), h: Math.round(h.height), menu: [Math.round(m.width), Math.round(m.height)], wa: !!wa && /wa\\.me\\/528180875940/.test(wa.href) && wa.getAttribute('aria-label') === 'Preguntar por WhatsApp' }; })()`);
check('perfil', 'al desplazar, la barra de navegación sigue arriba (44 px) con el ☰ de 44 × 44, y WhatsApp está en el menú', hdrWa.top === 0 && hdrWa.h === 44 && hdrWa.menu.join() === '44,44' && hdrWa.wa, JSON.stringify(hdrWa));
await open(390, 844, { reset: true });
check('consola', 'sin errores de consola en la primera vista', !problems.length, problems.join(' | '));

// ---------- 3. Cartelera como publicaciones ----------
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(600); // fuera de pantalla, content-visibility omite el texto (innerText vacío)
const posts = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s); const s = q('[data-share]');
  const rect = e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  const wa = q('.bill-wa'); const badges = [...it.querySelectorAll('.bill-badges .badge')]; const img = q('.bill-card-img').getBoundingClientRect();
  return { id: it.dataset.id, photo: !!q('.bill-card-img'), alt: q('.bill-card-img').alt, ratio: +(img.width / img.height).toFixed(2), badges: badges.map(b => b.textContent.trim()), onPhoto: badges.every(b => { const r = b.getBoundingClientRect(); return r.top >= img.bottom && r.left >= img.left && r.right <= img.right; }), badgeFs: badges.map(b => getComputedStyle(b).fontSize).join(),
    title: q('.bill-title')?.textContent, interest: it.querySelectorAll('[data-interest]').length, share: s && rect(s), wa: wa && rect(wa), waTxt: wa?.innerText.trim(), waHref: wa?.href, waCls: wa?.className, sTxt: s?.textContent.trim(), sIcon: !!s?.querySelector('svg'), sRound: getComputedStyle(s).borderRadius, onPhoto: (() => { const a = s.getBoundingClientRect(); return a.top >= img.top && a.bottom <= img.bottom && a.right <= img.right && a.left >= img.left; })(), full: Math.round(wa.getBoundingClientRect().width) === Math.round(q('.bill-acts').getBoundingClientRect().width), sCls: s.className }; })`);
const TIPOS = { circulo: 'Lectura', ajedrez: 'Juego', taller: 'Taller' };
check('eventos', '3 tarjetas con foto 4:3 descrita, título y dos insignias bajo la foto (el texto no va sobre la foto): el tipo (Lectura, Juego, Taller) y «Propuesta · sin fecha»', posts.length === 3 && posts.every(p => p.photo && p.alt && !/Recreación IA|Foto real/.test(p.alt) && Math.abs(p.ratio - 1.33) < 0.03 && p.title && p.badges.length === 2 && p.badges[0] === TIPOS[p.id] && p.badges[1] === 'Propuesta · sin fecha' && p.onPhoto && p.badgeFs === '12px,12px'), JSON.stringify(posts.map(p => [p.id, p.alt, p.ratio, p.badges, p.onPhoto, p.badgeFs])));
check('eventos', 'dos acciones de 48 px: «Preguntar por WhatsApp» (secundario, a todo el ancho, con su mensaje) y «Compartir» (botón de icono de vidrio, redondo de 48 × 48, sobre la esquina de la foto); sin «Me interesa»', posts.every(p => p.interest === 0 && p.sTxt === '' && p.sIcon && parseFloat(p.sRound) >= 24 && p.share.join() === '48,48' && p.onPhoto && p.full && /btn--vidrio/.test(p.sCls) && p.waTxt === 'Preguntar por WhatsApp' && /btn--secundario/.test(p.waCls) && p.wa[1] === 48 && p.wa[0] >= 160 && /wa\.me\/528180875940\?text=Hola/.test(p.waHref)), JSON.stringify(posts.map(p => [p.id, p.interest, p.sTxt, p.share, p.wa, p.waTxt, p.onPhoto, p.full])));
// Tarjeta de evento: foto → insignias → título → frase → descripción → acciones, tanto en el DOM como en la pantalla; el título está una sola vez y ya no hay encabezado de red social.
const order = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s); const els = ['.bill-card-img', '.bill-badges', '.bill-title', '.bill-detail > p', '.bill-acts'].map(q);
  const dom = els.every((e, i) => e && (i === 0 || (els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)));
  const tops = els.map(e => e ? Math.round(e.getBoundingClientRect().top) : null); const vis = tops.every((t, i) => t !== null && (i === 0 || t >= tops[i - 1]));
  return { id: it.dataset.id, dom, vis, tops, head: it.querySelectorAll('.bill-post-head, .bill-post-who, .bill-cap').length, once: [...it.querySelectorAll('.bill-title')].filter(e => e.getBoundingClientRect().height > 0).length, titles: it.querySelectorAll('.bill-title').length }; })`);
check('eventos', 'orden del DOM y de la pantalla: foto → insignias → título → descripción → acciones (sin subtítulo); sin encabezado «Itinerante · propuesta»; el título está y se ve una sola vez', order.length === 3 && order.every(o => o.dom && o.vis && o.head === 0 && o.once === 1 && o.titles === 1), JSON.stringify(order));
// Nombres accesibles (árbol de accesibilidad del navegador): cada «Compartir» y «Preguntar por WhatsApp» lleva el título de su propuesta.
await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(600); // Eventos ya no queda junto al inicio: el árbol de accesibilidad se lee con el capítulo a la vista (fuera de pantalla, content-visibility lo omite)
await send('Accessibility.enable');
const axNodes = (await send('Accessibility.getFullAXTree')).result.nodes;
const ax = axNodes.filter(n => n.role?.value === 'button' && /^(Compartir|Me interesa)/.test(n.name?.value || '')).map(n => n.name.value);
const shareNames = ax.filter(n => n.startsWith('Compartir')), likeNames = ax.filter(n => n.startsWith('Me interesa'));
const waNames = axNodes.filter(n => n.role?.value === 'link' && /^Preguntar por WhatsApp/.test(n.name?.value || '')).map(n => n.name.value);
check('eventos', 'árbol de accesibilidad: 3 «Compartir» con nombres distintos que llevan el título (y 3 «Preguntar por WhatsApp» igual); ningún «Me interesa»', shareNames.length === 3 && new Set(shareNames).size === 3 && shareNames.every(n => /^Compartir «.+»$/.test(n)) && likeNames.length === 0 && waNames.filter(n => n.includes(':')).length === 3 && new Set(waNames.filter(n => n.includes(':'))).size === 3, JSON.stringify([...ax, ...waNames]));
// Estado de la propuesta: sale de data-fecha (hora de Monterrey); sin atributo, «Propuesta · sin fecha».
const when = await ev(`(async () => { const m = await import(new URL('feed.js', document.baseURI).href); const it = document.querySelector('.bill-item'); const b = it.querySelector('[data-bill-when]'); const read = () => ({ text: b.textContent, quiet: b.classList.contains('badge--quiet') });
  const out = { base: read() }; it.dataset.fecha = '2099-05-02'; m.initFeed(); out.fecha = read(); it.dataset.fecha = '2099-05-02T18:30'; m.initFeed(); out.hora = read(); it.dataset.fecha = '2001-01-01'; m.initFeed(); out.pasada = read(); delete it.dataset.fecha; m.initFeed(); out.sin = read(); return out; })()`);
check('eventos', 'la insignia de estado sale de data-fecha: fecha vigente en español («Sáb 2 may 2099», con hora si la trae) en la insignia común; sin atributo o con fecha pasada, «Propuesta · sin fecha»', when && when.base.text === 'Propuesta · sin fecha' && when.base.quiet && when.fecha.text === 'Sáb 2 may 2099' && !when.fecha.quiet && when.hora.text === 'Sáb 2 may 2099 · 18:30' && when.pasada.text === 'Propuesta · sin fecha' && when.pasada.quiet && when.sin.text === 'Propuesta · sin fecha' && when.sin.quiet, JSON.stringify(when));
// La tarjeta cabe en el alto útil: entre la barra de navegación y la barra inferior (su alto más 8 px de aire), con 12 px de holgura, desde 320×640.
for (const [vw, vh] of [[320, 640], [360, 640], [360, 740], [375, 667], [390, 844]]) {
  await open(vw, vh, { reset: true, wait: 2500 });
  await ev(`document.querySelector('.bill-track').scrollIntoView({ block: 'center' })`); await sleep(900);
  const fit = await ev(`(() => { const hdr = document.querySelector('.hdr').getBoundingClientRect().height, tab = innerHeight - document.querySelector('.tabbar').getBoundingClientRect().top; const cards = [...document.querySelectorAll('.bill-item')].map(c => Math.round(c.getBoundingClientRect().height));
    const c = document.querySelector('.bill-item'); const acts = c.querySelector('.bill-acts').getBoundingClientRect(), box = c.getBoundingClientRect();
    return { util: innerHeight - hdr - tab, cards, actsInside: acts.bottom <= box.bottom, cut: [...c.querySelectorAll('.bill-title, .bill-detail > p, .bill-acts > *')].filter(e => e.scrollWidth > e.clientWidth + 1).length, over: document.documentElement.scrollWidth > innerWidth }; })()`);
  const tallest = Math.max(...fit.cards);
  check('eventos', `${vw}×${vh}: la tarjeta (${tallest} px) cabe en el alto útil (${fit.util} px) con ≥ 12 px de holgura (${(tallest / fit.util).toFixed(2)}×), sin texto cortado`, tallest <= fit.util - 12 && fit.actsInside && fit.cut === 0 && !fit.over, JSON.stringify(fit));
}
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
await ev(`document.querySelector('.bill-item').scrollIntoView({block:'start'}); scrollBy(0, 120)`); await sleep(600);
await shot('03-cartelera-publicacion.jpg');
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
check('verdad', 'sin contadores, reseñas, precios ni fechas inventadas en perfil y publicaciones', !/(\\d+\\s*(me gusta|likes?|seguidores|reseñas|opiniones|vistas))|★|\\$\\s?\\d|\\bmás leídos\\b|\\bagotad/i.test(feedText || ''), feedText);

// ---------- 4. Novedades (CarruselNovedades): solo existe con llegadas registradas; «Nuevo» solo en lo reciente ----------
const sample = JSON.parse(readFileSync(new URL('../../assets/data/catalog.json', import.meta.url), 'utf8')).books;
const realData = JSON.parse(readFileSync(new URL('../../assets/data/collections.json', import.meta.url), 'utf8'));
// Fechas relativas a hoy (fecha local, como en news.js): la comprobación no caduca con el calendario.
const dayAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const newsState = () => ev(`(()=>{ const s = document.querySelector('#novedades'); const links = [...document.querySelectorAll('[data-news-link]')]; const r = s.getBoundingClientRect();
  const shown = e => { const b = e.getBoundingClientRect(); return (b.width > 0 || b.height > 0) && getComputedStyle(e).visibility !== 'hidden'; };
  const cta = document.querySelector('[data-news-cta]'), dots = [...document.querySelectorAll('[data-news-dot]')], t = s.querySelector('[data-news-toggle]');
  const books = [...s.querySelectorAll('button.news-book')];
  return { hidden: s.hidden, display: getComputedStyle(s).display, h: Math.round(r.height), cards: books.length, links: links.map(l => ({ hidden: l.hidden, w: Math.round(l.getBoundingClientRect().width) })),
    tabs: [...document.querySelectorAll('.tabbar a, .tab-list')].filter(shown).map(t => t.querySelector('.tab-lb').firstChild.textContent.trim()),
    dot: dots.length === 2 && dots.every(d => !d.hidden), sr: document.querySelector('[data-news-sr]').textContent, cta: shown(cta) ? cta.innerText.trim() : null, hasNews: document.documentElement.classList.contains('has-news'), hint: document.documentElement.classList.contains('news-hint'),
    status: s.querySelector('[data-news-status]').textContent, badges: books.map(b => !!b.querySelector('.badge-new')), badgeFirst: books.filter(b => b.querySelector('.badge-new')).every(b => b.querySelector('.badge-new').compareDocumentPosition(b.querySelector('.news-t')) & Node.DOCUMENT_POSITION_FOLLOWING),
    ids: books.map(b => b.dataset.id), title: s.querySelector('h2').textContent.trim(), text: s.innerText, seen: localStorage.getItem('iti-news-visto'), state: localStorage.getItem('iti-news-estado'),
    toggle: { text: t.textContent.trim(), exp: t.getAttribute('aria-expanded'), ctrl: t.getAttribute('aria-controls'), dis: t.disabled, h: Math.round(t.getBoundingClientRect().height) } }; })()`);
const approach = async () => { await ev(`document.querySelector('#cartelera').scrollIntoView({ block: 'end' })`); await sleep(2500); }; // la tira se pinta al acercarse
// 4a. Sin llegadas válidas (la lista que se publica hoy y sus variantes): no existen la sección, su enlace de la barra, su fila del menú ni el control.
for (const [label, data] of [['la lista que se publica (vacía hasta que haya fechas reales)', realData], ['sin la clave', { ...realData, novedades: undefined }], ['con entradas vacías', { ...realData, novedades: { titulo: 'Recién llegados', entradas: [] } }], ['con ids que no existen', { ...realData, novedades: { entradas: [{ id: 'no-existe-1', llegada: dayAgo(1) }, { id: 'no-existe-2', llegada: dayAgo(2) }] } }], ['con entradas que aún no llegan', { ...realData, novedades: { entradas: [{ id: sample[3].id, llegada: dayAgo(-5) }] } }]]) {
  override = data;
  await ev(`localStorage.clear()`);
  await open(390, 844, { wait: 2500 });
  await approach();
  const st = await newsState();
  check('novedades', `${label}: no existen la sección, su enlace de la barra, su fila del menú ni el control del inicio (nada de «Todo el catálogo»); queda recordado «sin llegadas»`, st.display === 'none' && !st.hasNews && st.links.every(l => l.w === 0) && st.cards === 0 && !st.dot && st.sr === '' && st.cta === null && !st.hint && !/de la A a la Z/.test(st.text) && st.state === 'n' && st.tabs.join('|') === 'Inicio|Catálogo|Mi lista', JSON.stringify(st).slice(0, 700));
}
// El inicio de una primera visita no reserva un renglón vacío para el control: de la dirección a la foto, solo el aire del inicio (24 px).
override = realData;
await ev(`localStorage.clear()`);
await open(390, 844, { wait: 2500 });
const gap = await ev(`(() => { const a = document.querySelector('.entry-address').getBoundingClientRect(), m = document.querySelector('.entry-media').getBoundingClientRect(); return { gap: Math.round(m.top - a.bottom), hint: document.documentElement.classList.contains('news-hint') }; })()`);
check('inicio', `primera visita: sin hueco entre la dirección y la foto (${gap.gap} px, el aire del inicio) y sin renglón reservado`, gap.gap <= 25 && !gap.hint, JSON.stringify(gap));
// 4b. «Ver todo» / «Ver menos» (con siete llegadas): despliega la tira en rejilla dentro de la sección y la vuelve a plegar; el foco se queda en el botón.
const ids = sample.slice(10, 17).map(b => b.id);
const withSeven = { ...realData, novedades: { titulo: 'Recién llegados', entradas: ids.map((id, i) => ({ id, llegada: dayAgo([1, 3, 20, 2, 30, 35, 40][i]) })) } };
override = withSeven;
for (const [vw, vh, cols] of [[390, 844, 3], [320, 640, 2]]) {
  await open(vw, vh, { wait: 2500 });
  await approach();
  await ev(`document.querySelector('#novedades').scrollIntoView()`); await sleep(500);
  const grid = () => ev(`(() => { const l = document.querySelector('#news-list'); const it = [...l.children].map(e => e.getBoundingClientRect()); const t = document.querySelector('[data-news-toggle]');
    return { rows: new Set(it.map(r => Math.round(r.top))).size, cols: it.filter(r => Math.round(r.top) === Math.round(it[0].top)).length, scrolls: l.scrollWidth > l.clientWidth + 1, sl: l.scrollLeft, exp: t.getAttribute('aria-expanded'), text: t.textContent.trim(), focus: document.activeElement === t, over: document.documentElement.scrollWidth > innerWidth, h: Math.round(l.getBoundingClientRect().height) }; })()`);
  const g0 = await grid();
  await clickSel('[data-news-toggle]'); await sleep(1000);
  const g1 = await grid();
  if (vw === 390) { await ev(`scrollBy(0, -40)`); await sleep(300); await shot('04b-novedades-desplegada.jpg'); }
  await ev(`document.querySelector('[data-news-toggle]').scrollIntoView({ block: 'center' })`); await sleep(300);
  await clickSel('[data-news-toggle]'); await sleep(1000);
  const g2 = await grid();
  check('novedades', `${vw}×${vh}: plegada es una tira de una fila que se desliza; «Ver todo» la despliega en rejilla de ${cols} columnas (aria-expanded, «Ver menos», foco en el botón) y «Ver menos» la regresa al principio`, g0.rows === 1 && g0.scrolls && g1.exp === 'true' && g1.text === 'Ver menos' && g1.focus && g1.cols === cols && g1.rows === Math.ceil(7 / cols) && !g1.scrolls && g2.exp === 'false' && g2.text === 'Ver todo' && g2.focus && g2.rows === 1 && g2.sl === 0 && !g1.over && !g2.over, JSON.stringify({ g0, g1, g2 }));
}
// 4c. Un libro abre la ficha única: WhatsApp (prellenado), Guardar, Compartir (Web Share o copiar el enlace) y «Cómo llegar»; al cerrar, el foco vuelve al libro.
await open(390, 844, { wait: 2500 });
await approach();
await ev(`document.querySelector('#novedades').scrollIntoView()`); await sleep(400);
const pick = await ev(`(() => { const b = document.querySelectorAll('.news-book')[1]; return { id: b.dataset.id, t: b.querySelector('.news-t').textContent, a: b.querySelector('.news-a').textContent }; })()`);
await clickSel('.news-book', 1); await sleep(1800);
const ficha = await ev(`(() => { const d = document.getElementById('cat-drawer'); const vis = e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none';
  const share = d.querySelector('[data-d-share]'); const sr = share.getBoundingClientRect(); const reds = d.querySelectorAll('.redes, [data-d-red-ig], [data-d-red-fb], a[href*="instagram"], a[href*="facebook"]').length;
  const cta = d.querySelector('[data-d-cta]'); const foot = d.querySelector('.drawer-foot').getBoundingClientRect();
  return { open: d.open, modo: d.dataset.modo, title: d.querySelector('[data-d-title]').textContent, wa: cta.href, waPrim: cta.classList.contains('btn--primario') && vis(cta), reds, share: { name: share.getAttribute('aria-label'), w: Math.round(sr.width), h: Math.round(sr.height) }, visit: vis(d.querySelector('[data-d-visit]')), save56: vis(d.querySelector('[data-d-save]')), inView: foot.bottom <= innerHeight + 1, note: d.querySelector('.drawer-note').textContent }; })()`);
await shot('05-ficha-novedades.jpg');
const waText = new URL(ficha.wa).searchParams.get('text') || '';
check('ficha', 'el libro de Novedades abre la ficha única: «Preguntar por WhatsApp» primaria con título y autor en el mensaje, y la nota de confirmación', ficha.open && !ficha.modo && ficha.title.includes(pick.t.slice(0, 10)) && /^https:\/\/wa\.me\/528180875940\?text=/.test(ficha.wa) && waText.includes(`«${sample.find(b => b.id === pick.id).t}»`) && waText.includes(pick.a) && ficha.waPrim && ficha.note === 'La librería confirma si lo tienen.' && ficha.inView, JSON.stringify(ficha).slice(0, 600));
check('ficha', 'debajo: Guardar y Compartir (iconos de 56 × 56; Compartir con el título en su nombre) y «Cómo llegar»; sin Instagram ni Facebook en la ficha', ficha.reds === 0 && ficha.visit && ficha.save56 && ficha.share.w === 56 && ficha.share.h === 56 && /^Compartir «.+»$/.test(ficha.share.name), JSON.stringify({ reds: ficha.reds, share: ficha.share, visit: ficha.visit }));
await clickSel('[data-d-save]'); await sleep(600);
const rs = await ev(`({ pressed: document.querySelector('[data-d-save]').getAttribute('aria-pressed'), stored: JSON.parse(localStorage.getItem('iti-saved-v1') || '[]'), toast: document.querySelector('.toast')?.textContent || '', above: (() => { const t = document.querySelector('.toast'), f = document.querySelector('#cat-drawer .drawer-foot'); return !!t && t.getBoundingClientRect().bottom <= f.getBoundingClientRect().top + 1; })() })`);
check('ficha', '«Guardar» guarda en Mi lista (aria-pressed) y avisa «Guardado en Mi lista.» encima de las acciones del pie, sin taparlas', rs.pressed === 'true' && rs.stored.includes(pick.id) && /^Guardado en Mi lista\./.test(rs.toast) && rs.above, JSON.stringify(rs));
await ev(`window.__shared = null; navigator.share = async d => { window.__shared = d; }`);
await clickSel('[data-d-share]'); await sleep(600);
const sh4 = await ev(`window.__shared`);
check('ficha', '«Compartir» usa Web Share con el título y un enlace a la ficha del libro', sh4 && sh4.title.includes(sample.find(b => b.id === pick.id).t) && sh4.url.endsWith(`#libro-${pick.id}`), JSON.stringify(sh4));
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__copied = t; } }, configurable: true })`);
await clickSel('[data-d-share]'); await sleep(600);
const cp4 = await ev(`({ copied: window.__copied, toast: document.querySelector('.toast')?.textContent })`);
check('ficha', 'sin Web Share, «Compartir» copia el enlace y lo avisa', (cp4.copied || '').endsWith(`#libro-${pick.id}`) && /Enlace copiado/.test(cp4.toast || ''), JSON.stringify(cp4));
await key('Escape', 'Escape', 27); await sleep(900);
const back4 = await ev(`({ open: document.getElementById('cat-drawer').open, focus: document.activeElement?.classList.contains('news-book') && document.activeElement.dataset.id })`);
check('ficha', 'Escape cierra la ficha y el foco vuelve al libro de Novedades', !back4.open && back4.focus === pick.id, JSON.stringify(back4));
// El enlace compartido abre la ficha de ese libro.
await send('Page.navigate', { url: 'about:blank' });
await send('Page.navigate', { url: `${URL_}#libro-${pick.id}` }); await sleep(4000);
const deep = await ev(`({ open: document.getElementById('cat-drawer').open, modo: document.getElementById('cat-drawer').dataset.modo, hash: location.hash })`);
check('ficha', 'un enlace #libro-<id> abre la ficha de ese libro (la única) y deja la dirección limpia', deep.open && !deep.modo && deep.hash === '', JSON.stringify(deep));
// 4d. Con fechas de llegada reales: la tira son esas llegadas (lo más reciente primero) y solo las recientes son «Nuevo»; nada del resto del catálogo.
// 3 llegadas en las dos últimas semanas, 3 anteriores y una sin fecha, en desorden: la tira ordena de lo más reciente a lo más antiguo y deja al final la que no trae fecha.
const ages = [1, 3, 20, 2, 30, null, 40];
const newsOrder = [0, 3, 1, 2, 4, 6, 5].map(i => ids[i]);
const NEW7 = JSON.stringify([true, true, true, false, false, false, false]);
override = { ...realData, novedades: { titulo: 'Recién llegados', entradas: ids.map((id, i) => (ages[i] === null ? { id } : { id, llegada: dayAgo(ages[i]) })) } };
await ev(`localStorage.clear()`);
await open(390, 844, { wait: 2500 });
const early = await newsState();
check('novedades', 'primera visita con llegadas, antes de acercarse: punto en el enlace y en la fila del menú (con «, 3 sin ver» para lectores); el control del inicio no aparece a la vista (no había renglón reservado: nada salta)', early.dot && early.sr === ', 3 sin ver' && early.cta === null && !early.hint && early.tabs.join('|') === 'Inicio|Catálogo|Mi lista' && early.cards === 0, JSON.stringify({ dot: early.dot, sr: early.sr, cta: early.cta, hint: early.hint, cards: early.cards }));
await approach();
const withData = await newsState();
check('novedades', 'con el inicio fuera de la vista, el control «3 novedades recientes» toma su renglón (sin que nadie lo vea saltar)', withData.hint && withData.cta === '3 novedades recientes', JSON.stringify({ hint: withData.hint, cta: withData.cta }));
check('novedades', 'con entradas, la sección aparece sola con esas siete llegadas (lo más reciente primero, sin fecha al final) y nada más; titular «Novedades» y «3 llegaron en las últimas dos semanas»', withData.cards === 7 && !withData.hidden && withData.hasNews && JSON.stringify(withData.ids) === JSON.stringify(newsOrder) && withData.title === 'Novedades' && withData.status === '3 llegaron en las últimas dos semanas', JSON.stringify(withData).slice(0, 600));
check('novedades', '«Nuevo» solo en las tres llegadas recientes, dentro del botón del libro y antes de su título (entra en su nombre accesible)', JSON.stringify(withData.badges) === NEW7 && withData.badgeFirst, JSON.stringify(withData.badges.slice(0, 9)));
check('novedades', 'sin aviso de muestra, sin ranking y sin fechas impresas (la fecha de llegada solo ordena y decide «Nuevo»)', !/Datos de muestra|no es inventario|más leídos|más vendid/i.test(withData.text) && !/\d{4}-\d{2}-\d{2}|\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|hace \d+ días/i.test(withData.text), withData.text.slice(0, 300));
await ev(`document.querySelector('#novedades').scrollIntoView()`); await sleep(600);
await shot('04-novedades.jpg');
const cardBox = await ev(`(()=>{ const s = document.querySelector('#novedades'); const c = s.querySelector('.news-book'), b = s.querySelector('.badge-new'); const cs = getComputedStyle(b); return { card: Math.round(c.getBoundingClientRect().width), save: !!s.querySelector('.save'), badge: [cs.backgroundColor, cs.color, cs.fontSize], popup: c.getAttribute('aria-haspopup') }; })()`);
check('novedades', 'cada libro es un solo botón de 120 px (portada, título y autor) que abre la ficha; «Guardar» vive en la ficha; insignia «Nuevo» en primario (turquesa profundo) con texto blanco', cardBox.card === 120 && !cardBox.save && cardBox.popup === 'dialog' && cardBox.badge[0] === 'rgb(23, 107, 98)' && cardBox.badge[1] === 'rgb(255, 255, 255)' && cardBox.badge[2] === '12px', JSON.stringify(cardBox));
await sleep(1600);
const looking = await newsState();
const mtyToday = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey' }).format(new Date()); // «visto» es el día de Monterrey (news.js isoDay), no el del reloj de la máquina
check('novedades', '«visto» se guarda con la sección en pantalla (día de Monterrey); mientras se mira, las insignias y el punto siguen', looking.seen === mtyToday && looking.badges.filter(Boolean).length === 3 && looking.dot, JSON.stringify({ seen: looking.seen, dot: looking.dot }));
await ev(`scrollTo(0, 0)`); await sleep(900);
const left = await newsState();
check('novedades', 'al salir de la sección se retiran insignias, punto y control, y la cabecera pasa a «Ya viste todo lo que ha llegado»', left.badges.every(b => !b) && !left.dot && left.sr === '' && left.cta === null && left.status === 'Ya viste todo lo que ha llegado' && left.state === 's', JSON.stringify({ dot: left.dot, cta: left.cta, status: left.status, state: left.state }));
// Visita de regreso: solo cuenta lo que llegó después de la última vez que se vio la sección.
await ev(`localStorage.setItem('iti-news-visto', '${dayAgo(2)}')`);
await open(390, 844, { wait: 2500 });
await approach();
const back = await newsState();
check('novedades', 'visita de regreso (vista hace 2 días): una sola llegada posterior → «1 llegó desde tu última visita», una insignia y «, 1 sin ver»', back.status === '1 llegó desde tu última visita' && JSON.stringify(back.badges.slice(0, 7)) === JSON.stringify([true, false, false, false, false, false, false]) && back.badges.filter(Boolean).length === 1 && back.dot && back.sr === ', 1 sin ver', JSON.stringify({ status: back.status, sr: back.sr }));
// Compatibilidad: la clave antigua `ids` (sin fecha) va primero en su orden y nunca lleva «Nuevo».
override = { ...realData, novedades: { titulo: 'Recién llegados', ids } };
await ev(`localStorage.clear()`);
await open(390, 844, { wait: 2500 });
await approach();
const undated = await newsState();
check('novedades', 'sin fecha de llegada (clave antigua `ids`) la sección muestra esos libros en su orden, sin «Nuevo», ni punto ni control', undated.cards === 7 && JSON.stringify(undated.ids) === JSON.stringify(ids) && undated.badges.every(b => !b) && !undated.dot && undated.cta === null, JSON.stringify({ cards: undated.cards, dot: undated.dot, cta: undated.cta }));
check('consola', 'sin errores de consola con Novedades', !problems.length, problems.join(' | '));
override = null;
await ev(`localStorage.clear()`);

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
      const prim = [...document.querySelectorAll('.btn--primario')].filter(e => vis(e) && !e.closest('dialog'));
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
    const prim = [...d.querySelectorAll('.btn--primario')].filter(vis); const wa = [...d.querySelectorAll('a[href*="wa.me"]')].filter(vis);
    const h = e => Math.round(e.getBoundingClientRect().height);
    return { id: d.id || d.className, prim: prim.map(p => p.innerText.trim()), maxPrim: Math.max(0, ...prim.map(h)), maxWa: Math.max(0, ...wa.map(h)) }; })()`);
  sheets.push({ name, ...r });
  await key('Escape', 'Escape', 27); await sleep(600);
};
await sheetPrim('menú', () => clickSel('[data-menu-open]'));
await sheetPrim('Mi lista', async () => { await ev(`localStorage.setItem('iti-saved-v1', JSON.stringify(['${sample[0].id}']))`); await ev(`document.querySelector('[data-open-mylist]')?.click?.()`); });
await ev(`scrollTo(0,0)`);
await sheetPrim('Explorar', async () => { await ev(`document.querySelector('[data-ex-open]').scrollIntoView({block:'center'})`); await sleep(500); await clickSel('[data-ex-open]'); await sleep(2000); });
check('primaria', 'hojas abiertas (menú, Mi lista): una sola primaria «Cómo llegar» y ningún WhatsApp mayor', sheets.filter(s => s.id).every(s => s.prim.length <= 1 && s.prim.every(t => /^Cómo llegar/.test(t)) && s.maxWa <= (s.maxPrim || Infinity)) && sheets.filter(s => ['menú', 'historia'].includes(s.name)).every(s => s.id && s.prim.length === 1), JSON.stringify(sheets));
check('consola', 'sin errores de consola en el barrido', !problems.length, problems.join(' | '));

const failed = report.filter(r => !r.ok);
for (const r of report) console.log(`${r.ok ? 'ok   ' : 'FALLA'} [${r.area}] ${r.name}${r.ok ? '' : '\n        ' + r.detail.slice(0, 700)}`);
console.log(`\n${report.length - failed.length}/${report.length} comprobaciones`);
chrome.kill();
process.exit(failed.length ? 1 : 0);
