// Móvil con sensación de red social (U03), Novedades (U04) y una sola acción primaria (U01/D10).
// node feed.mjs <url> [outDir]   Sale con código ≠ 0 si algo falla.
//  1. Primera vista (390x844): inicio (nombre, estado, dirección, «Cómo llegar» de 56 px como única acción de contacto), sin burbujas de historias, con la barra de navegación (marca y ☰) y la barra inferior de vidrio (Inicio, Catálogo, Mi lista); ≤ 6 destinos distintos a la vista en 390x844, 360x740 y 375x667 (U02/D11; la casilla Novedades y el control «N novedades…» llevan al mismo sitio y cuentan como uno); «Escribir» (WhatsApp) reaparece en la cabecera al desplazar.
//  3. Eventos y talleres (Carrusel3D, variante evento, 2026-11-13): tarjeta foto → insignias (tipo y estado) → título; debajo, la descripción de la del centro
//     (región viva) y una sola fila: «Preguntar por WhatsApp» (secundario, nombre con el título de la del centro) y «Compartir» (icono menta; Web Share y respaldo
//     de copiar); con toque no hay flechas: tocar la vecina y el teclado mueven el centro y la fila lo sigue; sin puntos ni «Me interesa»; la tarjeta cabe en el alto útil a 320×640, 360×640, 360×740,
//     375×667 y 390×844; el estado sale de data-fecha; sin JavaScript cada tarjeta muestra su descripción y su consulta.
//  3b. Café y té (#cafe): chips Café · Té (radiogroup), Carrusel3D variante carta (tarjetas tipográficas con icono, sin fotos ni precios), «Preguntar por la carta»
//     (secundario, mensaje de la categoría), foto real de la casa (en escritorio arriba, junto al titular, y la carta a todo el ancho debajo), con toque sin flechas, teclado y región viva, a 390, 320 y 1280.
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
  await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }); // maxTouchPoints 0 es un error de CDP: el toque se quedaba encendido en escritorio
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

// ---------- 3. Eventos y talleres: Carrusel3D, variante evento (2026-11-13) ----------
// Tarjeta (foto 4:3, insignias de tipo y estado, título) en el carrusel; debajo, la descripción de la del centro (región viva) y una sola fila de
// acciones: «Preguntar por WhatsApp» (secundario, nombre accesible con el título de la del centro) y «Compartir» (icono menta, junto a ella). Sin puntos.
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(1200); // fuera de pantalla, content-visibility omite el texto (innerText vacío); el carrusel se arma al acercarse
const posts = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s);
  const badges = [...it.querySelectorAll('.bill-badges .badge')]; const img = q('.bill-card-img').getBoundingClientRect();
  return { id: it.dataset.id, photo: !!q('.bill-card-img'), alt: q('.bill-card-img').alt, ratio: +(q('.bill-card-img').offsetWidth / q('.bill-card-img').offsetHeight).toFixed(2), badges: badges.map(b => b.textContent.trim()), under: badges.every(b => { const r = b.getBoundingClientRect(); return r.top >= img.bottom - 1; }), badgeFs: badges.map(b => getComputedStyle(b).fontSize).join(),
    title: q('.bill-title')?.textContent, interest: it.querySelectorAll('[data-interest]').length, inCard: it.querySelectorAll('[data-share]').length, detail: getComputedStyle(q('.bill-detail')).display, bg: getComputedStyle(q('.bill-card')).backgroundColor, radius: getComputedStyle(q('.bill-card')).borderRadius, glass: getComputedStyle(q('.bill-card')).backdropFilter }; })`);
const TIPOS = { circulo: 'Lectura', ajedrez: 'Juego', taller: 'Taller' };
check('eventos', '3 tarjetas (superficie, radio 20, sin vidrio) con foto 4:3 descrita, título y dos insignias bajo la foto: el tipo (Lectura, Juego, Taller) y «Propuesta · sin fecha»; descripción y consulta fuera de la tarjeta', posts.length === 3 && posts.every(p => p.photo && p.alt && !/Recreación IA|Foto real/.test(p.alt) && Math.abs(p.ratio - 1.33) < 0.03 && p.title && p.badges.length === 2 && p.badges[0] === TIPOS[p.id] && p.badges[1] === 'Propuesta · sin fecha' && p.under && p.badgeFs === '12px,12px' && p.interest === 0 && p.inCard === 0 && p.detail === 'none' && p.radius === '20px' && (p.glass === 'none' || !p.glass)), JSON.stringify(posts));
const pie = async () => ev(`(() => { const q = s => document.querySelector(s); const wa = q('[data-bill-wa]'), sh = q('.bill-fila [data-share]'), d = q('[data-bill-desc]'); const c = document.querySelector('.bill-item.is-centro'); const r = e => { const b = e.getBoundingClientRect(); return [Math.round(b.width), Math.round(b.height), Math.round(b.top)]; };
  return { centro: c?.dataset.id, title: c?.querySelector('.bill-title').textContent, desc: d.textContent.trim(), live: d.getAttribute('aria-live'), wa: { txt: wa.innerText.trim(), name: wa.getAttribute('aria-label'), href: wa.href, cls: wa.className, box: r(wa) }, share: { txt: sh.textContent.trim(), name: sh.getAttribute('aria-label'), cls: sh.className, box: r(sh), bg: getComputedStyle(sh).backgroundColor, id: sh.dataset.share }, gap: Math.round(sh.getBoundingClientRect().left - wa.getBoundingClientRect().right), dots: document.querySelectorAll('.bill-dots').length, rows: document.querySelectorAll('.bill-fila').length, focusable: [...document.querySelectorAll('.bill-card')].map(x => x.tabIndex), region: [document.querySelector('[data-bill-c3d]').getAttribute('role'), document.querySelector('[data-bill-c3d]').getAttribute('aria-roledescription')] }; })()`);
const p0 = await pie();
const menta = await ev(`getComputedStyle(document.querySelector('.btn--secundario')).backgroundColor`);
check('eventos', 'carrusel con role="region" y aria-roledescription="carrusel"; empieza por la del medio; una sola parada de tabulador (la del centro); sin puntos', p0.region.join() === 'region,carrusel' && p0.centro === 'ajedrez' && p0.focusable.join() === '-1,0,-1' && p0.dots === 0, JSON.stringify(p0));
check('eventos', 'debajo: la descripción de la del centro (región viva) y una sola fila: «Preguntar por WhatsApp» (secundario de 48, nombre con el título, mensaje de esa propuesta) y «Compartir» (icono menta de 48 × 48, a 12 px, en el mismo renglón)', p0.rows === 1 && p0.live === 'polite' && p0.desc.includes('El tablero ya está en la casa') && p0.wa.txt === 'Preguntar por WhatsApp' && p0.wa.name === `Preguntar por WhatsApp: ${p0.title}` && /btn--secundario/.test(p0.wa.cls) && p0.wa.box[1] === 48 && /wa\.me\/528180875940\?text=Hola.*ajedrez/.test(p0.wa.href) && p0.share.txt === '' && p0.share.name === `Compartir «${p0.title}»` && /btn--secundario/.test(p0.share.cls) && p0.share.box.slice(0, 2).join() === '48,48' && p0.share.bg === menta && p0.gap === 12 && p0.share.box[2] === p0.wa.box[2], JSON.stringify(p0));
// Con toque no hay flechas (norma del 2026-11-13): se toca la parte visible de la vecina de la derecha, que viene al centro.
const vecina = await ev(`(() => { const it = document.querySelector('.bill-item.is-centro').nextElementSibling; const r = it.querySelector('.bill-card').getBoundingClientRect(); return { x: Math.min(r.right, innerWidth) - 12, y: r.top + r.height / 2, flechas: [...document.querySelectorAll('#cartelera .c3d-flecha')].filter(b => b.getBoundingClientRect().width > 0).length }; })()`);
await mouse(vecina.x, vecina.y); await sleep(1200);
const p1 = await pie();
check('eventos', 'con toque, sin flechas a la vista (deslizar o tocar la vecina, WCAG 2.5.7)', vecina.flechas === 0, JSON.stringify(vecina));
check('eventos', 'tocar la vecina la trae al centro: la descripción, el mensaje de WhatsApp, su nombre accesible y «Compartir» la siguen', p1.centro === 'taller' && p1.desc.includes('Taller de escritura') && p1.desc.includes('Leer, escribir') && p1.wa.name === 'Preguntar por WhatsApp: Taller de escritura' && /taller%20de%20escritura/.test(p1.wa.href) && p1.share.id === 'taller' && p1.share.name === 'Compartir «Taller de escritura»' && p1.focusable.join() === '-1,-1,0', JSON.stringify(p1));
// Teclado: ← en la tarjeta del centro la mueve y el foco la sigue.
await ev(`document.querySelector('.bill-item.is-centro .bill-card').focus()`);
await key('ArrowLeft', 'ArrowLeft', 37); await sleep(1100);
const kb = await ev(`({ active: document.activeElement.closest('.bill-item')?.dataset.id, centro: document.querySelector('.bill-item.is-centro')?.dataset.id })`);
check('eventos', 'teclado: ← en la tarjeta del centro trae la anterior y el foco va con ella', kb.active === 'ajedrez' && kb.centro === 'ajedrez', JSON.stringify(kb));
// Nombres accesibles (árbol de accesibilidad): un «Compartir» y un «Preguntar por WhatsApp» con el título de la del centro; ningún «Me interesa».
await send('Accessibility.enable');
const axNodes = (await send('Accessibility.getFullAXTree')).result.nodes;
const shareNames = axNodes.filter(n => n.role?.value === 'button' && /^Compartir «/.test(n.name?.value || '')).map(n => n.name.value);
const likeNames = axNodes.filter(n => /^Me interesa/.test(n.name?.value || ''));
const waNames = axNodes.filter(n => n.role?.value === 'link' && /^Preguntar por WhatsApp: /.test(n.name?.value || '')).map(n => n.name.value);
check('eventos', 'árbol de accesibilidad: un solo «Compartir» y un solo «Preguntar por WhatsApp», con el título de la propuesta del centro; ningún «Me interesa»', shareNames.length === 1 && shareNames[0] === 'Compartir «Ajedrez en la casa»' && waNames.length === 1 && waNames[0] === 'Preguntar por WhatsApp: Ajedrez en la casa' && likeNames.length === 0, JSON.stringify([shareNames, waNames]));
// Estado de la propuesta: sale de data-fecha (hora de Monterrey); sin atributo, «Propuesta · sin fecha».
const when = await ev(`(async () => { const m = await import(new URL('feed.js', document.baseURI).href); const it = document.querySelector('.bill-item'); const b = it.querySelector('[data-bill-when]'); const read = () => ({ text: b.textContent, quiet: b.classList.contains('badge--quiet') });
  const out = { base: read() }; it.dataset.fecha = '2099-05-02'; m.initFeed(); out.fecha = read(); it.dataset.fecha = '2099-05-02T18:30'; m.initFeed(); out.hora = read(); it.dataset.fecha = '2001-01-01'; m.initFeed(); out.pasada = read(); delete it.dataset.fecha; m.initFeed(); out.sin = read(); return out; })()`);
check('eventos', 'la insignia de estado sale de data-fecha: fecha vigente en español («Sáb 2 may 2099», con hora si la trae) en la insignia común; sin atributo o con fecha pasada, «Propuesta · sin fecha»', when && when.base.text === 'Propuesta · sin fecha' && when.base.quiet && when.fecha.text === 'Sáb 2 may 2099' && !when.fecha.quiet && when.hora.text === 'Sáb 2 may 2099 · 18:30' && when.pasada.text === 'Propuesta · sin fecha' && when.pasada.quiet && when.sin.text === 'Propuesta · sin fecha' && when.sin.quiet, JSON.stringify(when));
// La tarjeta del centro cabe en el alto útil (entre la barra de navegación y la barra inferior), con 12 px de holgura, desde 320×640; nada cortado.
for (const [vw, vh] of [[320, 640], [360, 640], [360, 740], [375, 667], [390, 844]]) {
  await open(vw, vh, { reset: true, wait: 2500 });
  await ev(`document.querySelector('[data-bill-c3d]').scrollIntoView({ block: 'center' })`); await sleep(1400);
  const fit = await ev(`(() => { const hdr = document.querySelector('.hdr').getBoundingClientRect().height, tab = innerHeight - document.querySelector('.tabbar').getBoundingClientRect().top; const cards = [...document.querySelectorAll('.bill-card')].map(c => Math.round(c.offsetHeight));
    const fila = document.querySelector('.bill-fila'); const kids = [...fila.children].map(e => e.getBoundingClientRect());
    return { util: innerHeight - hdr - tab, cards, cut: [...document.querySelectorAll('.bill-item.is-centro .bill-title, .bill-desc, .bill-fila > *')].filter(e => e.scrollWidth > e.clientWidth + 1).length, oneRow: new Set(kids.map(k => Math.round(k.top))).size === 1, rowRight: Math.round(Math.max(...kids.map(k => k.right))), over: document.documentElement.scrollWidth > innerWidth }; })()`);
  const tallest = Math.max(...fit.cards);
  check('eventos', `${vw}×${vh}: la tarjeta (${tallest} px) cabe en el alto útil (${fit.util} px) con ≥ 12 px de holgura; la fila de acciones en un renglón; sin texto cortado ni desborde`, tallest <= fit.util - 12 && fit.cut === 0 && fit.oneRow && !fit.over && fit.rowRight <= vw, JSON.stringify(fit));
}
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
await ev(`document.querySelector('[data-bill-c3d]').scrollIntoView({block:'start'}); scrollBy(0, -80)`); await sleep(1200);
await shot('03-cartelera-carrusel.jpg');
// Web Share
await ev(`window.__shared = null; navigator.share = async d => { window.__shared = d; }`);
await clickSel('.bill-fila [data-share]'); await sleep(500);
const sh = await ev(`window.__shared`);
check('cartelera', '«Compartir» usa Web Share con el título de la del centro y enlace a #cartelera', sh && /Ajedrez en la casa/.test(sh.title) && /#cartelera$/.test(sh.url) && !/\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)/i.test(sh.text), JSON.stringify(sh));
// respaldo: copiar enlace
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__copied = t; } }, configurable: true })`);
await clickSel('.bill-fila [data-share]'); await sleep(500);
const cp = await ev(`({copied:window.__copied, toast:document.querySelector('.toast')?.textContent})`);
check('cartelera', '«Compartir» sin Web Share copia el enlace y avisa', /#cartelera$/.test(cp.copied || '') && /Enlace copiado/.test(cp.toast || ''), JSON.stringify(cp));
// AbortError no copia
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }, configurable: true })`);
await clickSel('.bill-fila [data-share]'); await sleep(400);
check('cartelera', 'cancelar la hoja de compartir no copia nada', (await ev(`window.__copied`)) === null);
check('cartelera', 'sin errores de consola', !problems.length, problems.join(' | '));
// Sin JavaScript: cada tarjeta muestra su descripción y su consulta (la fila de abajo no existe) y data-fecha sigue en el marcado.
await send('Emulation.setScriptExecutionDisabled', { value: true });
await send('Page.navigate', { url: URL_ }); await sleep(2000);
const nojs = await ev(`(() => { document.querySelector('#cartelera').scrollIntoView(); const it = [...document.querySelectorAll('.bill-item')]; return { n: it.length, detail: it.map(i => getComputedStyle(i.querySelector('.bill-detail')).display), wa: it.map(i => !!i.querySelector('.bill-wa')?.getBoundingClientRect().height), pie: getComputedStyle(document.querySelector('.bill-pie')).display }; })()`);
await send('Emulation.setScriptExecutionDisabled', { value: false });
check('eventos', 'sin JavaScript: las tres tarjetas muestran su descripción y su «Preguntar por WhatsApp» (la fila de abajo no se ofrece)', nojs.n === 3 && nojs.detail.every(d => d !== 'none') && nojs.wa.every(Boolean) && nojs.pie === 'none', JSON.stringify(nojs));
// sin números ni reseñas inventadas en el feed
await open(390, 844, { reset: true });
await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(1200);
const feedText = await ev(`[...document.querySelectorAll('.hl, .profile-av, .bill-pie, .bill-card, .entry-copy, .news, .cafe')].map(e => e.innerText).join(' ')`);
check('verdad', 'sin contadores, reseñas, precios ni fechas inventadas en perfil, publicaciones y carta', !/(\d+\s*(me gusta|likes?|seguidores|reseñas|opiniones|vistas))|★|\$\s?\d|\bmás leídos\b|\bagotad/i.test(feedText || ''), feedText);

// ---------- 3b. Café y té (#cafe): chips Café · Té, Carrusel3D variante carta, «Preguntar por la carta» ----------
const menu = JSON.parse(readFileSync(new URL('../../assets/data/menu.json', import.meta.url), 'utf8'));
for (const [vw, vh, mobile] of [[390, 844, true], [320, 640, true], [1280, 800, false]]) {
  await open(vw, vh, { reset: true, mobile, wait: 2500 });
  await ev(`document.querySelector('[data-cafe-c3d]').scrollIntoView({ block: 'center' })`); await sleep(1800);
  const cafe = await ev(`(() => { const q = s => document.querySelector(s); const sec = q('#cafe'); const chips = [...sec.querySelectorAll('.cafe-chip')]; const cards = [...sec.querySelectorAll('.cafe-card')]; const c = sec.querySelector('.cafe-item.is-centro .cafe-card'); const ask = q('[data-cafe-ask]');
    const r = e => e.getBoundingClientRect(); const foto = r(sec.querySelector('.cafe-foto')), carta = r(sec.querySelector('.c3d--carta'));
    return { ready: q('[data-cafe]').classList.contains('is-ready'), group: [sec.querySelector('[data-cafe-chips]').getAttribute('role'), sec.querySelector('[data-cafe-chips]').getAttribute('aria-label')], chips: chips.map(x => [x.textContent.trim(), x.getAttribute('role'), x.getAttribute('aria-checked'), x.tabIndex, Math.round(r(x).height)]),
      region: [q('[data-cafe-c3d]').getAttribute('role'), q('[data-cafe-c3d]').getAttribute('aria-roledescription'), q('[data-cafe-c3d]').getAttribute('aria-label')], n: cards.length, tabs: cards.filter(x => x.tabIndex === 0).length, icons: cards.filter(x => x.querySelector('.cafe-ic use')).length, imgs: sec.querySelectorAll('.cafe-card img').length,
      centro: c && { name: c.querySelector('.cafe-nombre').textContent, role: c.getAttribute('role'), desc: c.querySelector('.cafe-desc')?.textContent, shadow: getComputedStyle(c).boxShadow !== 'none', bg: getComputedStyle(c).backgroundColor, radius: getComputedStyle(c).borderRadius },
      prices: sec.querySelectorAll('.cafe-precio').length, text: sec.innerText, ask: { txt: ask.innerText.trim(), cls: ask.className, h: Math.round(r(ask).height), msg: new URL(ask.href).searchParams.get('text') },
      photo: { real: sec.querySelector('.cafe-foto').dataset.kind, alt: sec.querySelector('.cafe-foto img').alt, above: foto.bottom <= carta.top + 1, full: carta.width >= Math.min(1240, sec.clientWidth - 2 * parseFloat(getComputedStyle(sec).paddingLeft)) - 1 }, over: document.documentElement.scrollWidth > innerWidth,
      flechas: [...sec.querySelectorAll('.c3d-flecha')].map(b => [b.className.includes('btn--vidrio'), Math.round(r(b).width), Math.round(r(b).height)]), primary: sec.querySelectorAll('.btn--primario').length }; })()`);
  const tag = `${vw}×${vh}`;
  check('café', `${tag}: chips Café · Té en un radiogroup «Carta» (48 px, el elegido marcado y un solo tabindex=0)`, cafe.ready && cafe.group.join() === 'radiogroup,Carta' && cafe.chips.map(c => c[0]).join() === 'Café,Té' && cafe.chips.every(c => c[1] === 'radio' && c[4] === 48) && cafe.chips[0][2] === 'true' && cafe.chips.filter(c => c[3] === 0).length === 1, JSON.stringify(cafe.chips));
  check('café', `${tag}: Carrusel3D variante carta: región con rol de carrusel, ${menu.categorias[0].productos.length} tarjetas tipográficas (superficie, radio 20, icono de trazo, sin fotos de producto), la del centro con sombra y la única parada de tabulador; ${mobile ? 'con toque, sin flechas' : 'flechas de vidrio de 48'}`, cafe.region.slice(0, 2).join() === 'region,carrusel' && /Café/.test(cafe.region[2]) && cafe.n === menu.categorias[0].productos.length && cafe.icons === cafe.n && cafe.imgs === 0 && cafe.tabs === 1 && cafe.centro?.role === 'group' && cafe.centro.shadow && cafe.centro.radius === '20px' && cafe.centro.desc && cafe.flechas.length === 2 && cafe.flechas.every(f => f[0] && f[2] === (mobile ? 0 : 48)), JSON.stringify({ region: cafe.region, n: cafe.n, icons: cafe.icons, imgs: cafe.imgs, tabs: cafe.tabs, centro: cafe.centro, flechas: cafe.flechas }));
  check('café', `${tag}: sin precios (la librería no los ha dado: ni cifras ni «por confirmar»)`, cafe.prices === 0 && !/\$\s?\d|MXN|por confirmar/i.test(cafe.text), cafe.text.slice(0, 300));
  check('café', `${tag}: «Preguntar por la carta» secundario (menta) de 48 px con el mensaje de la categoría; ninguna primaria en la sección`, cafe.ask.txt === 'Preguntar por la carta' && /btn--secundario/.test(cafe.ask.cls) && cafe.ask.h === 48 && cafe.ask.msg === 'Hola, quisiera preguntar por la carta de café. ¿Qué tienen hoy?' && cafe.primary === 0, JSON.stringify(cafe.ask));
  check('café', `${tag}: foto real de la casa con alt; ${mobile ? 'encima de la carta' : 'arriba, a la derecha del titular, y la carta a todo el ancho debajo (A6, afinada el 2026-11-13)'}; sin desborde`, cafe.photo.real === 'real' && cafe.photo.alt.length > 20 && cafe.photo.above && (mobile || cafe.photo.full) && !cafe.over, JSON.stringify(cafe.photo));
  if (vw === 390) {
    await shot('05-cafe-390.jpg');
    await clickSel('.cafe-chip[data-id="te"]'); await sleep(1400);
    const te = await ev(`(() => ({ n: document.querySelectorAll('#cafe .cafe-card').length, checked: document.querySelector('.cafe-chip[aria-checked="true"]')?.dataset.id, live: document.querySelector('[data-cafe-live]').textContent, msg: new URL(document.querySelector('[data-cafe-ask]').href).searchParams.get('text'), icon: document.querySelector('#cafe .cafe-ic use')?.getAttribute('href') }))()`);
    check('café', 'elegir «Té» cambia la carta (tarjetas con la tetera), la región viva y el mensaje de «Preguntar por la carta»', te.checked === 'te' && te.n === menu.categorias[1].productos.length && te.icon === '#c-tetera' && /^Té: \d+ en la carta\.$/.test(te.live) && te.msg === 'Hola, quisiera preguntar por la carta de té. ¿Qué tienen hoy?', JSON.stringify(te));
    await ev(`document.querySelector('#cafe .cafe-item.is-centro .cafe-card').focus()`);
    await key('ArrowRight', 'ArrowRight', 39); await sleep(1100);
    const kc = await ev(`(() => { const items = [...document.querySelectorAll('#cafe .cafe-item')]; return { active: items.indexOf(document.activeElement.closest('.cafe-item')), centro: items.findIndex(i => i.classList.contains('is-centro')), mid: Math.floor(items.length / 2), live: document.querySelector('[data-cafe-live]').textContent }; })()`);
    check('café', 'teclado: → en la tarjeta del centro trae la siguiente, el foco va con ella y la región viva la anuncia', kc.active === kc.mid + 1 && kc.centro === kc.mid + 1 && / de \d+\.$/.test(kc.live), JSON.stringify(kc));
  }
  check('café', `${tag}: sin errores de consola`, !problems.length, problems.join(' | '));
}

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
