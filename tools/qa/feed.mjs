// Móvil con sensación de red social (U03), Novedades (U04) y una sola acción primaria (U01/D10).
// node feed.mjs <url> [outDir]   Sale con código ≠ 0 si algo falla.
//  Teléfono de referencia desde el 2026-11-14: iPhone 16 en Safari (393×659; antes 390×844, que ningún iPhone tiene).
//  1. Primera vista (393x659): inicio (nombre, estado, dirección, «Cómo llegar» de 56 px como única acción de contacto), sin burbujas de historias, con la barra de navegación (marca y ☰) y la barra inferior de vidrio (Inicio, Catálogo, Mi lista); ≤ 6 destinos distintos a la vista en 393x659, 375x629, 375x667 y 440x763 (U02/D11; la casilla Novedades y el control «N novedades…» llevan al mismo sitio y cuentan como uno); «Escribir» (WhatsApp) reaparece en la cabecera al desplazar.
//  3. Eventos y talleres (destacado y lista por fecha, 2026-11-16; datos en assets/data/eventos.json; lenguaje editorial: líneas finas, fecha tipográfica). Con la
//     lista real (sin fechas): tres propuestas como filas entre líneas finas (rótulo «tipo · Propuesta · sin fecha» como texto, título, portada cuadrada de 88,
//     descripción), sin acciones, sin destacado, sin aviso en el inicio ni punto en la barra; en escritorio, tres por fila; sin JavaScript, lo mismo en HTML
//     estático. Con **datos de prueba inyectados por esta herramienta** (Fetch de CDP; no están en el repo): destacado con cartel entero sobre fondo suave, fecha
//     tipográfica, datos en lista de definición, costo y «Reservar por WhatsApp»; lista por día con «Registrarme» (solo lu.ma / luma.com, en otra pestaña, de
//     contorno) y «Añadir al calendario» (el .ics se descarga con la CSP de producción); propuestas al final; nota lateral; «Compartir»; aviso en el inicio
//     (reservado por boot.js en la visita de regreso, sin mover las posiciones fijas) y punto en «Eventos».
//  3a. Eventos anteriores (2026-11-16): con la lista real el apartado no existe ni deja hueco (misma altura que el HTML estático); con datos de prueba (8 pasados, uno
//     de otro año y dos fuera de la ventana de 24 meses): fila compacta entre líneas finas (sin relleno, sin acciones, portada cuadrada de 64 / 88 con radio 12 y anillo),
//     los 6 más recientes y «Ver los N anteriores» / «Ver menos» (aria-expanded, aria-controls, el foco se queda, al plegar el botón no se mueve bajo el cursor), solo
//     pasados sin próximos, imagen inexistente (fila sin foto, nunca un recuadro roto), cartel enorme sin desborde y 150 eventos sin tareas largas con CPU 4×.
//  3b. Café y té (#cafe, 2026-11-17, al modo de las apps de comida): la carta de menu.json en filas por categorías con su barra de categorías fija (enlaces, no
//     un radiogroup; nombre corto «Sin café» con el completo en aria-label): filas entre líneas finas, nombre, precio justo debajo (solo el de la carta impresa) y
//     descripción, una columna en el teléfono y dos desde 761, sin foto sin columna reservada, los tés y «Aguas frescas» en un renglón, barra fija bajo la cabecera,
//     scroll-spy (llegando desde arriba, desde abajo y por cada grupo), tocar un chip lleva al grupo y deja el foco en su título, la foto real (abajo en el teléfono,
//     a la derecha del titular en escritorio), el cierre («Pídelo en la barra de la sala.» y «Cómo llegar») y una fila con foto de prueba, a 393, 320 y 1280.
//  4. Novedades (CarruselNovedades): sin llegadas válidas no existen la sección, su enlace de la barra, su fila del menú ni el control del inicio; con llegadas, la tira
//     son solo esas (lo más reciente primero) y «Nuevo» solo en lo reciente; «Ver todo» / «Ver menos» (aria-expanded, foco quieto, rejilla de 3 columnas a 393 y 2 a
//     320); cada libro abre la ficha única (WhatsApp prellenado, Guardar, Compartir con respaldo de copiar, «Cómo llegar»; foco de vuelta al libro; enlace #libro-<id>).
//  5. Barrido de acciones primarias en 393x659 y 1280x800: a lo sumo una por pantalla, siempre «Cómo llegar», y ningún WhatsApp mayor que ella.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eventosPlan, validEventos, fechaBloque, fechaLarga, reservaUrl, reservaMessage, icsOf } from '../../feed.js';

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
let overrideMenu = null; // cuerpo alterno de menu.json (carta con fotos de prueba; null = el archivo real)
let cartelEnorme = null; // cuerpo alterno del cartel enorme de la prueba de robustez (null = el archivo real)
let overrideEventos = null; // cuerpo alterno de eventos.json (datos de prueba de esta herramienta; null = el archivo real)
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') problems.push(`LOG ${m.params.entry.text} ${m.params.entry.url || ''}`);
  if (m.method === 'Fetch.requestPaused') {
    const { requestId, request } = m.params;
    if (cartelEnorme && /cartel-enorme/.test(request.url)) send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'image/jpeg' }], body: cartelEnorme.toString('base64') });
    else if (/eventos\.json/.test(request.url)) {
      if (overrideEventos) send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(overrideEventos)).toString('base64') });
      else send('Fetch.continueRequest', { requestId });
    } else if (/menu\.json/.test(request.url)) {
      if (overrideMenu) send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(overrideMenu)).toString('base64') });
      else send('Fetch.continueRequest', { requestId });
    } else if (override) send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(override)).toString('base64') });
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
const enter = async () => { await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13, text: '\r' }); await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Enter', code: 'Enter', windowsVirtualKeyCode: 13 }); }; // Enter con texto: el botón enfocado recibe su clic
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*collections.json*' }, { urlPattern: '*eventos.json*' }, { urlPattern: '*menu.json*' }] });
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
await open(393, 659, { reset: true });
await ev(`localStorage.clear()`);
// Visita de regreso con llegadas sin ver (iti-news-estado = p): boot.js reserva el renglón del control del inicio desde el primer render.
await ev(`localStorage.setItem('iti-news-estado', 'p')`);
await open(393, 659);
const first = await ev(`(()=>{
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const q = s => document.querySelector(s);
  const act = [...document.querySelectorAll('a[href], button')].filter(e => vis(e) && !e.closest('[aria-hidden="true"], [hidden]'));
  const hl = document.querySelectorAll('.hl, .hl-item, [data-story], dialog.story').length;
  const cta = q('.entry-actions a:first-child'), wa = q('#inicio a[href*="wa.me"]'), menu = q('[data-menu-open]');
  return {
    name: q('.entry-title').getBoundingClientRect().height > 10 && q('.entry-title').textContent.trim(),
    status: q('.entry-status [data-status-text]').textContent.trim(), statusVis: vis(q('.entry-status')),
    address: /Mariano Matamoros Pte\\.\\s421/.test(q('.entry-address').textContent) && vis(q('.entry-address')),
    avatar: vis(q('.hdr-brand img')),
    cta: { txt: cta.innerText.trim(), cls: cta.className, h: cta.getBoundingClientRect().height, vis: vis(cta) },
    wa: wa ? { txt: wa.innerText.trim(), cls: wa.className, h: wa.getBoundingClientRect().height, vis: vis(wa) } : { vis: false, none: true },
    hl, tab: vis(q('.tabbar')), tabTop: Math.round(q('.tabbar').getBoundingClientRect().top), ctaBottom: Math.round(cta.getBoundingClientRect().bottom),
    news: (() => { const n = q('[data-news-cta]'); const r = n.getBoundingClientRect(); return { vis: vis(n), txt: n.innerText.trim(), cls: n.className, h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }; })(),
    tabItems: [...document.querySelectorAll('.tabbar a, .tab-list')].filter(vis).map(e => { const r = e.getBoundingClientRect(); const l = e.querySelector('.tab-lb'); const lr = l.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), l.firstChild.textContent.trim(), lr.height > 8 && lr.width > 8 && lr.left >= r.left && lr.right <= r.right && getComputedStyle(l).clipPath === 'none', e.querySelector('svg use').getAttribute('href')]; }),
    barBox: (() => { const r = q('.tabbar').getBoundingClientRect(); const cs = getComputedStyle(q('.tabbar')); return [Math.round(r.left), Math.round(innerWidth - r.right), Math.round(innerHeight - r.bottom), Math.round(r.height), Math.round(r.width), cs.boxShadow !== 'none', parseFloat(cs.borderTopLeftRadius) >= r.height / 2, document.documentElement.dataset.glass === 'lite' ? 'lite' : cs.backdropFilter]; })(), brand: vis(q('.hdr-brand')), menu: vis(menu) && Math.round(menu.getBoundingClientRect().height),
    dests: [...new Set(act.map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))],
    actions: act.map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20))
  };
})()`);
await shot('01-perfil-393x659.jpg');
check('perfil', 'nombre, estado de hoy, dirección y logotipo visibles', first.name && /Itinerante/.test(first.name) && first.statusVis && /Abierto|Cerrad|Cierra/.test(first.status) && first.address && first.avatar, JSON.stringify(first).slice(0, 400));
check('perfil', '«Cómo llegar» primaria de 56 px y ninguna consulta por WhatsApp en el inicio (D11; desde el 2026-11-13 el contacto vive en el pie y el menú)', first.cta.vis && /^Cómo llegar/.test(first.cta.txt) && /btn--primario/.test(first.cta.cls) && first.cta.h === 56 && first.wa.none && !first.actions.some(a => /Escribir|Pregunta por un libro/.test(a)), JSON.stringify([first.cta, first.wa]));
check('primera vista', 'sin burbujas de historias: ni destacados ni visor', first.hl === 0, String(first.hl));
const lastBottom = first.news.vis ? first.news.bottom : first.ctaBottom;
check('barra inferior', 'a la vista desde la primera pantalla: cápsula de vidrio de 49 × 228 px, centrada, 8 px sobre el borde, con sombra y desenfoque (opaca en gama media)', first.tab && Math.abs(first.barBox[0] - first.barBox[1]) <= 1 && first.barBox[2] === 8 && first.barBox[3] === 49 && first.barBox[4] === 228 && first.barBox[5] && first.barBox[6] && /blur|lite/.test(first.barBox[7]), JSON.stringify(first.barBox));
check('barra inferior', 'no tapa «Cómo llegar» ni el control de novedades (≥ 8 px de aire)', first.tabTop >= lastBottom + 8, JSON.stringify([first.tabTop, first.ctaBottom, first.news]));
check('barra inferior', 'tres casillas iguales de 76 × 49 px con icono propio y nombre a la vista: Inicio, Catálogo y Mi lista', first.tabItems.length === 3 && first.tabItems.every(t => t[0] === 76 && t[1] === 49 && t[3]) && first.tabItems.map(t => t[2]).join('|') === 'Inicio|Catálogo|Mi lista' && new Set(first.tabItems.map(t => t[4])).size === 3, JSON.stringify(first.tabItems));
check('inicio', 'control de novedades bajo «Cómo llegar»: secundario (no primaria), táctil (≥ 48 px) y con el conteo en su texto', first.news.vis && first.news.top >= first.ctaBottom && first.news.h >= 48 && !/primario/.test(first.news.cls) && /^\d+ novedad(es)? recientes?$/.test(first.news.txt), JSON.stringify(first.news));
check('primera vista', `destinos distintos en la primera vista (${first.dests.length} ≤ 6; ${first.actions.length} controles: la marca y el ☰, «Cómo llegar», el control de novedades y la barra inferior)`, first.tab && first.brand && first.menu === 44 && first.dests.length <= 6 && first.actions.length <= 7, JSON.stringify(first.actions));
for (const [vw, vh] of [[375, 629], [375, 667], [440, 763]]) {
  await open(vw, vh, { reset: true });
  const n = await ev(`[...new Set([...document.querySelectorAll('a[href], button')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"], [hidden], [inert]'); }).map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))]`);
  check('primera vista', `${vw}x${vh}: ${n.length} destinos distintos a la vista (≤ 6)`, n.length <= 6, JSON.stringify(n));
}
await open(393, 659, { reset: true });
await ev(`scrollTo(0, 700)`); await sleep(700);
const hdrWa = await ev(`(()=>{ const h = document.querySelector('.hdr').getBoundingClientRect(); const m = document.querySelector('[data-menu-open]').getBoundingClientRect(); const wa = document.querySelector('#menu a[href*="wa.me"]'); return { top: Math.round(h.top), h: Math.round(h.height), menu: [Math.round(m.width), Math.round(m.height)], wa: !!wa && /wa\\.me\\/528180875940/.test(wa.href) && wa.getAttribute('aria-label') === 'Preguntar por WhatsApp' }; })()`);
check('perfil', 'al desplazar, la barra de navegación sigue arriba (44 px) con el ☰ de 44 × 44, y WhatsApp está en el menú', hdrWa.top === 0 && hdrWa.h === 44 && hdrWa.menu.join() === '44,44' && hdrWa.wa, JSON.stringify(hdrWa));
await open(393, 659, { reset: true });
check('consola', 'sin errores de consola en la primera vista', !problems.length, problems.join(' | '));

// ---------- 3. Eventos y talleres: destacado y lista por fecha (2026-11-16; datos en assets/data/eventos.json) ----------
// 3.1 Con la lista real (hoy, sin fechas): solo las propuestas —tarjeta horizontal con insignias, título, portada cuadrada y descripción— y
//     la entradilla «Aún sin fecha…»; ni destacado, ni bloque de fecha, ni reserva, ni calendario, ni aviso en el inicio, ni punto en la barra.
// 3.2 Con datos de prueba inyectados por esta herramienta (no están en el repo; fechas relativas a hoy): destacado con cartel entero, bloque de
//     fecha, costo y «Reservar por WhatsApp»; lista por día con «Registrarme» (solo Luma, en otra pestaña) y «Añadir al calendario»; propuestas
//     al final; nota lateral; el .ics se descarga con la CSP de producción; aviso en el inicio y punto en «Eventos».
const dayMty = n => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + n * 86_400_000));
const realEventos = JSON.parse(readFileSync(new URL('../../assets/data/eventos.json', import.meta.url), 'utf8'));
const realBy = id => realEventos.eventos.find(e => e.id === id);
const PRUEBA = { eventos: [
  { ...realBy('ajedrez'), fecha: dayMty(19), hora: '17:00', reserva: { tipo: 'luma', url: 'https://lu.ma/prueba-ajedrez' } },
  { id: 'prueba-cartel', tipo: 'Lectura', ciclo: 'Ciclo de prueba', titulo: 'Tarde de prueba XVII', fecha: dayMty(5), hora: '18:57', fin: null, con: null, invitado: 'Nombre de prueba', colabora: 'Editorial de prueba',
    descripcion: 'Texto de prueba del arnés: dos o tres renglones que dicen de qué trata el evento y para quién es. No es un evento real.', imagen: 'assets/img/cartelera-1.webp', encuadre: 'cartel',
    alt: 'Cartel de prueba: Tarde de prueba XVII, con Nombre de prueba', costo: ['$90 MXN entrada', '$120 MXN con libro en PDF', '$160 MXN con libro en físico'], reserva: { tipo: 'whatsapp', telefono: '8100000000' } },
  { ...realBy('circulo'), fecha: dayMty(10), hora: '19:00', con: 'Nombre de prueba', costo: ['$50 MXN'], reserva: { tipo: 'luma', url: 'https://luma.com/prueba-circulo' } },
  { id: 'prueba-segunda', tipo: 'Conferencia', titulo: 'Segunda actividad de prueba', fecha: dayMty(19), hora: '19:30', fin: null, con: 'Nombre de prueba', descripcion: 'Texto de prueba.', imagen: 'assets/img/04-experiencia-libreros-800.webp', alt: 'Libreros', reserva: null },
  { id: 'prueba-otro-dominio', tipo: 'Charla', titulo: 'Registro en otro dominio', fecha: dayMty(25), hora: '18:00', fin: null, con: null, descripcion: 'Texto de prueba.', imagen: 'assets/img/cartelera-3.webp', alt: 'Rincón', reserva: { tipo: 'luma', url: 'https://registro.example/evento' } },
  { ...realBy('taller') },
  { id: 'prueba-pasado', tipo: 'Taller', titulo: 'Evento pasado de prueba', fecha: dayMty(-3), hora: '18:00', fin: null, con: null, descripcion: 'No debe verse.', imagen: 'assets/img/cartelera-3.webp', alt: 'x', reserva: { tipo: 'luma', url: 'https://lu.ma/pasado' } }
] };
const planPrueba = eventosPlan(validEventos(PRUEBA));
const TIPOS = { circulo: 'Lectura', ajedrez: 'Juego', taller: 'Taller' };
const menta = 'rgb(220, 241, 236)';
// Lo que se ve de la sección, tal cual está pintada.
const leerEventos = () => ev(`(() => { const sec = document.querySelector('#cartelera'); const q = (s, r = sec) => r.querySelector(s); const all = (s, r = sec) => [...r.querySelectorAll(s)];
  const R = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  const btn = e => e && { tag: e.tagName, txt: e.innerText.trim(), name: e.getAttribute('aria-label') || '', cls: e.className, box: R(e), href: e.getAttribute('href'), target: e.getAttribute('target'), rel: e.getAttribute('rel'), bg: getComputedStyle(e).backgroundColor, ring: getComputedStyle(e).boxShadow, color: getComputedStyle(e).color, icon: e.querySelector('use')?.getAttribute('href') };
  const card = li => { const c = q('.ev-card', li), img = q('.ev-card-img', li); return { id: li.dataset.id, hora: q('.ev-hora', li)?.textContent || '', badges: all('.badge', li).length, rot: all('.ev-rot > span', li).map(b => [b.textContent.trim(), b.className, getComputedStyle(b).fontSize]), borderTop: getComputedStyle(c).borderTopWidth, borderBottom: getComputedStyle(c).borderBottomWidth, title: q('.ev-card-tit', li)?.textContent, titleTag: q('.ev-card-tit', li)?.tagName, titleFs: getComputedStyle(q('.ev-card-tit', li)).fontSize,
      meta: q('.ev-card-meta', li)?.textContent || '', costo: q('.ev-costo', li)?.textContent || '', costoFuente: q('.ev-costo', li)?.dataset.fuente || '', desc: q('.ev-card-desc', li)?.textContent || '', descShown: q('.ev-card-desc', li) ? getComputedStyle(q('.ev-card-desc', li)).display !== 'none' : false,
      img: img && { box: R(img), alt: img.alt, fit: getComputedStyle(img).objectFit, radius: getComputedStyle(img).borderRadius, outline: getComputedStyle(img).outlineStyle + ' ' + getComputedStyle(img).outlineWidth, ok: img.complete ? img.naturalWidth > 0 : true }, box: R(c), bg: getComputedStyle(c).backgroundColor, radius: getComputedStyle(c).borderRadius, glass: getComputedStyle(c).backdropFilter, shadow: getComputedStyle(c).boxShadow, cursor: getComputedStyle(c).cursor, tab: c.tabIndex,
      acc: all('.ev-card-acc > *', li).map(btn), labelled: c.getAttribute('aria-labelledby') === q('.ev-card-tit', li)?.id, cut: all('.ev-card-tit, .badge, .ev-card-meta, .ev-card-desc, .ev-costo, .btn', li).filter(e => e.scrollWidth > e.clientWidth + 1).length }; };
  const prox = q('.ev-prox'); const lado = q('.ev-lado');
  return { lede: q('.sec-texto').innerText.trim(), ledeIg: !!q('.sec-texto a[href*="instagram.com"]'), c3d: all('.c3d, [aria-roledescription="carrusel"], [aria-live]').length, snap: all('*').filter(e => getComputedStyle(e).scrollSnapType !== 'none').length,
    prox: prox && { id: prox.dataset.id, cartel: prox.classList.contains('ev-prox--cartel'), box: R(prox), shadow: getComputedStyle(prox).boxShadow !== 'none', radius: getComputedStyle(prox).borderRadius, img: (i => i && { box: R(i), fit: getComputedStyle(i).objectFit, alt: i.alt, nat: [i.naturalWidth, i.naturalHeight] })(q('.ev-prox-img')), cuerpo: R(q('.ev-prox-cuerpo')),
      border: getComputedStyle(prox).borderTopWidth + ' ' + getComputedStyle(prox).borderTopStyle, bg: getComputedStyle(prox).backgroundColor,
      fecha: (f => f && { txt: [...f.children].map(n => n.textContent.trim()), hidden: f.getAttribute('aria-hidden'), box: R(f), bg: getComputedStyle(f).backgroundColor, numFs: getComputedStyle(q('.ev-fecha-num')).fontSize, numW: getComputedStyle(q('.ev-fecha-num')).fontWeight, numTab: getComputedStyle(q('.ev-fecha-num')).fontVariantNumeric, rotFs: getComputedStyle(q('.ev-fecha-rot')).fontSize, rotUp: getComputedStyle(q('.ev-fecha-rot')).textTransform, rotLs: getComputedStyle(q('.ev-fecha-rot')).letterSpacing, rotColor: getComputedStyle(q('.ev-fecha-rot')).color })(q('.ev-fecha')),
      badges: all('.ev-prox .badge').map(b => [b.textContent.trim(), getComputedStyle(b).backgroundColor, getComputedStyle(b).fontSize]), tipos: all('.ev-prox .ev-tipo').map(t => [t.textContent.trim(), getComputedStyle(t).backgroundColor]), pills: all('.ev-prox .ev-rot > *').filter(e => !e.matches('.badge') && getComputedStyle(e).borderRadius !== '0px').length,
      lineH: (id => ({ top: getComputedStyle(id).borderTopWidth, left: getComputedStyle(id).borderLeftWidth, color: getComputedStyle(id).borderTopColor }))(q('.ev-prox-id')), idBox: R(q('.ev-prox-id')), fechaBox: R(q('.ev-fecha')), titBox: R(q('.ev-prox-tit')),
      fig: (f => f && { pad: getComputedStyle(f).paddingTop, bg: getComputedStyle(f).backgroundColor, box: R(f) })(q('.ev-prox-fig')), imgStyle: (i => i && { radius: getComputedStyle(i).borderRadius, shadow: getComputedStyle(i).boxShadow !== 'none', outline: getComputedStyle(i).outlineStyle + ' ' + getComputedStyle(i).outlineWidth })(q('.ev-prox-img')),
      title: q('.ev-prox-tit').textContent, titleTag: q('.ev-prox-tit').tagName, titleFs: getComputedStyle(q('.ev-prox-tit')).fontSize, titleLines: Math.round(q('.ev-prox-tit').getBoundingClientRect().height / parseFloat(getComputedStyle(q('.ev-prox-tit')).lineHeight)), sr: q('.ev-prox-id .sr-only')?.textContent || '', desc: q('.ev-prox-desc')?.textContent || '', costo: all('.ev-prox .ev-costo li').map(li => li.textContent), costoFuente: q('.ev-prox .ev-costo')?.dataset.fuente || '',
      datos: all('.ev-prox .ev-dato').map(d => [q('dt', d).textContent, q('dd', d).innerText.replace(/\\n/g, ' | '), R(d)[3], getComputedStyle(d).borderTopWidth, getComputedStyle(q('dt', d)).fontSize, getComputedStyle(q('dd', d)).fontSize]), dl: q('.ev-prox dl.ev-datos') ? 1 : 0, acc: all('.ev-acc > *').map(btn),
      cut: all('.ev-prox-tit, .ev-prox .badge, .ev-prox-desc, .ev-prox .btn, .ev-dato dd').filter(e => e.scrollWidth > e.clientWidth + 1).length },
    sub: all('.ev-sub').map(h => h.textContent), dias: all('.ev-dia').map(d => ({ tit: q('.ev-dia-tit .sr-only', d).textContent, vis: [...q('.ev-dia-vis', d).children].map(x => x.textContent), hidden: q('.ev-dia-vis', d).getAttribute('aria-hidden'), numFs: getComputedStyle(q('.ev-dia-num', d)).fontSize, numW: getComputedStyle(q('.ev-dia-num', d)).fontWeight, tit0: R(q('.ev-dia-tit', d)), filas: R(q('.ev-filas', d)), box: R(d), ids: all('.ev-fila', d).map(li => li.dataset.id) })),
    cards: all('.ev-fila').map(card), propuestas: all('.ev-propuestas .ev-fila').map(li => li.dataset.id),
    lado: lado && { tit: q('.ev-lado-tit').textContent, txt: q('.ev-lado-txt').innerText.trim(), ig: q('.ev-lado-txt a')?.getAttribute('href'), box: R(lado), sticky: getComputedStyle(lado).position, lista: R(q('.ev-lista')) },
    fechaBlocks: all('.ev-fecha').length, links: all('a[href]').map(a => a.href), primary: all('.btn--primario').length, share: all('[data-share]').length, cal: all('[data-ev-cal]').length, wa: all('a[href*="wa.me"]').length,
    text: sec.innerText, over: document.documentElement.scrollWidth > innerWidth, ext: all('iframe, script, link[rel="stylesheet"]').length,
    aviso: (a => ({ hiddenAttr: a.hidden, shown: !a.hidden && getComputedStyle(a).display !== 'none' && getComputedStyle(a).visibility !== 'hidden', txt: a.innerText.trim(), href: a.getAttribute('href'), box: R(a) }))(document.querySelector('[data-ev-cta]')),
    hint: document.documentElement.classList.contains('ev-hint'), dots: [...document.querySelectorAll('[data-ev-dot]')].map(d => !d.hidden), sr: [...document.querySelectorAll('[data-ev-sr]')].map(s => s.textContent), hasta: (() => { try { return localStorage.getItem('iti-ev-hasta'); } catch { return 'x'; } })() }; })()`);
const irEventos = async () => { await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(1300); await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(500); };

// ---- 3.1 Lista real: propuestas sin fecha ----
overrideEventos = null;
await open(393, 659, { reset: true });
await ev(`localStorage.clear()`);
await irEventos();
const r0 = await leerEventos();
check('eventos', 'lista real: 3 propuestas como filas entre líneas finas (sin relleno, radio, sombra ni vidrio; no son un control) con portada cuadrada de 88 con radio 12 y anillo fino, título (Title 3) y el rótulo «tipo · Propuesta · sin fecha» como texto de 15 (ninguna píldora); la descripción a la vista', r0.cards.length === 3 && r0.cards.every(c => c.img && c.img.box[2] === 88 && c.img.box[3] === 88 && c.img.fit === 'cover' && c.img.radius === '12px' && /^solid 1px/.test(c.img.outline) && c.img.alt && !/Recreación IA|Foto real/.test(c.img.alt) && c.title && c.titleFs === '20px' && c.badges === 0 && c.rot.length === 2 && c.rot[0][0] === TIPOS[c.id] && c.rot[0][1] === 'ev-tipo' && c.rot[1][0] === 'Propuesta · sin fecha' && c.rot[1][1] === 'ev-estado' && c.rot.every(t => t[2] === '15px') && c.descShown && c.desc.length > 60 && c.radius === '0px' && c.bg === 'rgba(0, 0, 0, 0)' && c.borderTop === '1px' && (c.glass === 'none' || !c.glass) && c.shadow === 'none' && c.cursor !== 'pointer' && c.tab === -1 && c.labelled) && r0.cards.slice(0, -1).every(c => c.borderBottom === '0px') && r0.cards.at(-1).borderBottom === '1px', JSON.stringify(r0.cards).slice(0, 900));
check('eventos', 'lista real: una propuesta no lleva hora, costo, reserva, calendario ni «Compartir»; la sección no enlaza a WhatsApp ni a Luma ni tiene primaria', r0.cards.every(c => !c.hora && !c.costo && c.acc.length === 0) && r0.share === 0 && r0.cal === 0 && r0.wa === 0 && r0.primary === 0 && !r0.links.some(h => /lu\.ma|luma\.com|wa\.me/.test(h)), JSON.stringify({ share: r0.share, cal: r0.cal, wa: r0.wa, primary: r0.primary, links: r0.links }));
check('eventos', 'lista real: sin fechas no hay destacado, bloque de fecha, lista por día, rótulos de grupo ni nota lateral; la entradilla dice «Aún sin fecha. Las fechas se anuncian en Instagram.» con su enlace', !r0.prox && r0.fechaBlocks === 0 && r0.dias.length === 0 && r0.sub.length === 0 && !r0.lado && /^Aún sin fecha\. Las fechas se anuncian en Instagram\s*\.$/.test(r0.lede) && r0.ledeIg, JSON.stringify({ prox: r0.prox, sub: r0.sub, lado: r0.lado, lede: r0.lede }));
check('eventos', 'lista real: lista estática (sin carrusel, región viva ni imán de desplazamiento)', r0.c3d === 0 && r0.snap === 0, JSON.stringify([r0.c3d, r0.snap]));
check('eventos', 'lista real: sin aviso en el inicio, sin punto en «Eventos» (barra y menú) y sin nada guardado', r0.aviso.hiddenAttr && !r0.aviso.shown && !r0.hint && r0.dots.every(d => !d) && r0.sr.every(s => !s) && r0.hasta === null, JSON.stringify({ aviso: r0.aviso, hint: r0.hint, dots: r0.dots, hasta: r0.hasta }));
await ev(`document.querySelector('#cartelera').scrollIntoView({block:'start'}); scrollBy(0, -80)`); await sleep(500);
await shot('03-eventos-hoy.jpg');
for (const [vw, vh] of [[320, 640], [375, 629], [375, 667], [440, 763]]) {
  await open(vw, vh, { reset: true, wait: 2500 });
  await irEventos();
  const f = await leerEventos();
  check('eventos', `${vw}×${vh} lista real: tres filas al ancho del contenido, sin texto cortado ni desborde`, f.cards.length === 3 && f.cards.every(c => c.cut === 0 && c.box[0] >= 0 && c.box[0] + c.box[2] <= vw) && !f.over, JSON.stringify(f.cards.map(c => [c.box, c.cut])));
}
await open(1280, 800, { reset: true, mobile: false, wait: 2500 });
await irEventos();
const r0d = await leerEventos();
check('eventos', '1280 lista real: las tres propuestas en una fila (columnas 1–4, 5–8 y 9–12), cada una bajo su línea fina y con la portada cuadrada arriba; sin nota lateral', r0d.cards.length === 3 && new Set(r0d.cards.map(c => c.box[1])).size === 1 && new Set(r0d.cards.map(c => c.box[3])).size === 1 && r0d.cards.every(c => c.img.box[2] === c.img.box[3] && c.img.box[2] > 200 && c.img.box[1] < c.box[1] + 40) && !r0d.lado && !r0d.over, JSON.stringify(r0d.cards.map(c => [c.box, c.img.box])));
// Reserva obsoleta: la visita anterior dejó un evento vigente y ya no lo hay. El renglón se reserva vacío (nada se anuncia) y se retira al salir del inicio.
await open(393, 659, { reset: true });
await ev(`localStorage.setItem('iti-ev-hasta', ${JSON.stringify(dayMty(30))})`);
await open(393, 659);
const stale0 = await ev(`({ hint: document.documentElement.classList.contains('ev-hint'), vis: getComputedStyle(document.querySelector('[data-ev-cta]')).visibility, hidden: document.querySelector('[data-ev-cta]').hidden })`);
await ev(`scrollTo(0, 1600)`); await sleep(900);
const stale1 = await ev(`({ hint: document.documentElement.classList.contains('ev-hint'), hasta: localStorage.getItem('iti-ev-hasta') })`);
check('eventos', 'reserva obsoleta: boot.js aparta el renglón (invisible: no se anuncia nada) y, al salir del inicio, se retira y se olvida la fecha', stale0.hint && stale0.vis === 'hidden' && stale0.hidden && !stale1.hint && stale1.hasta === null, JSON.stringify([stale0, stale1]));
check('eventos', 'lista real: sin errores de consola', !problems.length, problems.join(' | '));
// Sin JavaScript: las tres propuestas con su descripción, en HTML estático; sin botones.
await send('Emulation.setScriptExecutionDisabled', { value: true });
await send('Page.navigate', { url: URL_ }); await sleep(2000);
const nojs = await ev(`(() => { const sec = document.querySelector('#cartelera'); sec.scrollIntoView(); const it = [...sec.querySelectorAll('.ev-fila')]; return { n: it.length, desc: it.map(i => getComputedStyle(i.querySelector('.ev-card-desc')).display !== 'none' && i.querySelector('.ev-card-desc').textContent.length > 60), titles: it.map(i => i.querySelector('.ev-card-tit').textContent), controls: sec.querySelectorAll('button, .ev-card a, [data-share]').length, wa: sec.querySelectorAll('a[href*="wa.me"]').length, lede: sec.querySelector('.sec-texto').textContent.trim() }; })()`);
await send('Emulation.setScriptExecutionDisabled', { value: false });
check('eventos', 'sin JavaScript: las tres propuestas con su descripción y la entradilla «Aún sin fecha…»; ningún botón que no funcione', nojs.n === 3 && nojs.desc.every(Boolean) && nojs.titles.join('|') === 'Círculo de lectura|Ajedrez en la casa|Taller de escritura' && nojs.controls === 0 && nojs.wa === 0 && /^Aún sin fecha\./.test(nojs.lede), JSON.stringify(nojs));
// sin números ni reseñas inventadas
await open(393, 659, { reset: true });
await irEventos();
const feedText = await ev(`[...document.querySelectorAll('.hl, .profile-av, #cartelera, .entry-copy, .news')].map(e => e.innerText).join(' ')`);
check('verdad', 'sin contadores, reseñas, precios ni fechas inventadas en perfil y eventos (los precios de la carta son los de la carta impresa: se comprueban en Café y té)', !/(\d+\s*(me gusta|likes?|seguidores|reseñas|opiniones|vistas|asistentes|lugares))|★|\$\s?\d|\bmás leídos\b|\bagotad|\bquedan\b|\bcupo/i.test(feedText || ''), feedText);

// ---- 3.2 Datos de prueba inyectados: un destacado (cartel, costo y WhatsApp), cuatro en la lista en tres días y una propuesta ----
overrideEventos = PRUEBA;
const pedidos = [];
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.method === 'Network.requestWillBeSent') pedidos.push(m.params.request.url); });
await open(393, 659, { reset: true });
await ev(`localStorage.clear()`);
await open(393, 659);
// Primera visita con evento: el renglón del inicio no estaba reservado, así que no aparece a la vista (nada salta); el punto del menú sí.
const av0 = await leerEventos();
check('aviso', 'primera visita con un evento con fecha: el renglón del inicio no salta a la vista (no estaba reservado); el punto de «Eventos» y la fecha quedan anotados', av0.aviso.txt === planPrueba.aviso && !av0.aviso.shown && !av0.hint && av0.dots.every(Boolean) && av0.sr.every(s => /próximo: /.test(s)) && av0.hasta === planPrueba.hasta, JSON.stringify({ aviso: av0.aviso, hint: av0.hint, dots: av0.dots, sr: av0.sr, hasta: av0.hasta, want: planPrueba.hasta }));
await irEventos();
const r1 = await leerEventos();
const D = planPrueba.destacado, bloque = fechaBloque(D.fecha);
check('eventos', 'con fechas: el más próximo es el destacado (panel de superficie con borde de 1 px, radio 28, sin sombra), con «Próximo» —la única insignia, en menta y de 13— y el tipo y el ciclo como texto (ninguna píldora), el título (Title 1, 28, un solo h3) y la fecha completa en texto sr-only', r1.prox && r1.prox.id === 'prueba-cartel' && !r1.prox.shadow && r1.prox.border === '1px solid' && r1.prox.radius === '28px' && r1.prox.bg === 'rgb(255, 255, 255)' && r1.prox.badges.length === 1 && r1.prox.badges[0][0] === 'Próximo' && r1.prox.badges[0][1] === menta && r1.prox.badges[0][2] === '13px' && r1.prox.tipos.map(t => t[0]).join('|') === 'Lectura|Ciclo de prueba' && r1.prox.tipos.every(t => t[1] === 'rgba(0, 0, 0, 0)') && r1.prox.pills === 0 && r1.prox.title === D.titulo && r1.prox.titleTag === 'H3' && r1.prox.titleFs === '28px' && r1.prox.titleLines <= 2 && r1.prox.sr.toLowerCase() === fechaLarga(D.fecha) && r1.prox.desc === D.descripcion && r1.cards.every(c => c.shadow === 'none'), JSON.stringify(r1.prox).slice(0, 1200));
check('eventos', 'fecha tipográfica (sin caja ni relleno): «SÁB · NOV» en versalitas de 13 con interletra abierta en turquesa-texto y el número en 52 de peso 300 con cifras tabulares; decorativa (aria-hidden); una línea fina de 1 px (linea-fuerte) la separa del título, horizontal en el teléfono', r1.fechaBlocks === 1 && r1.prox.fecha.txt.join('|') === `${bloque.sem} · ${bloque.mes}|${bloque.num}` && r1.prox.fecha.hidden === 'true' && r1.prox.fecha.bg === 'rgba(0, 0, 0, 0)' && r1.prox.fecha.rotFs === '13px' && r1.prox.fecha.rotUp === 'uppercase' && parseFloat(r1.prox.fecha.rotLs) >= 1 && r1.prox.fecha.rotColor === 'rgb(23, 107, 98)' && r1.prox.fecha.numFs === '52px' && r1.prox.fecha.numW === '300' && /tabular-nums/.test(r1.prox.fecha.numTab) && r1.prox.lineH.top === '1px' && r1.prox.lineH.left === '0px' && r1.prox.lineH.color === 'rgb(95, 119, 115)' && r1.prox.idBox[1] > r1.prox.fechaBox[1] + r1.prox.fechaBox[3], JSON.stringify([r1.prox.fecha, r1.prox.lineH, r1.prox.idBox, r1.prox.fechaBox]));
check('eventos', 'cartel: entero y cuadrado, nunca recortado (1:1, object-fit: contain), como un objeto sobre fondo-3 con relleno interior de 20, radio 20, sombra y anillo de 1 px, con un alt que dice lo que anuncia', r1.prox.cartel && r1.prox.img.fit === 'contain' && Math.abs(r1.prox.img.box[2] - r1.prox.img.box[3]) <= 1 && r1.prox.fig.pad === '20px' && r1.prox.fig.bg === 'rgb(230, 238, 236)' && Math.abs(r1.prox.img.box[2] - (r1.prox.fig.box[2] - 40)) <= 1 && r1.prox.imgStyle.radius === '20px' && r1.prox.imgStyle.shadow && /^solid 1px/.test(r1.prox.imgStyle.outline) && /^Cartel de prueba: Tarde de prueba XVII/.test(r1.prox.img.alt), JSON.stringify([r1.prox.img, r1.prox.fig, r1.prox.imgStyle]));
check('eventos', 'datos del destacado: una lista de definición (dl) con Hora · Invita · Colabora · Costo, solo los renglones con dato (sin «Con»: el evento de prueba no lo trae), línea fina entre renglones, rótulo de 13 y valor de 17; el costo con sus tres renglones tal como los da la librería, marcados como dato del anuncio, sin «gratis» ni «entrada libre»', r1.prox.dl === 1 && r1.prox.datos.map(d => d[0]).join('|') === 'Hora|Invita|Colabora|Costo' && r1.prox.datos[0][1] === '18:57' && r1.prox.datos[1][1] === 'Nombre de prueba' && r1.prox.datos[2][1] === 'Editorial de prueba' && r1.prox.datos[3][1] === D.costo.join(' | ') && r1.prox.datos.every(d => d[3] === '1px' && d[4] === '13px' && d[5] === '17px') && r1.prox.costo.join('|') === D.costo.join('|') && r1.prox.costoFuente === 'anuncio' && !/gratis|entrada libre/i.test(r1.text), JSON.stringify(r1.prox.datos));
const [resv, calD, shD] = r1.prox.acc;
check('eventos', 'destacado: «Reservar por WhatsApp» es la primaria de 56 (enlace wa.me/52 + 10 dígitos con el mensaje ya escrito, en otra pestaña) y «Añadir al calendario» y «Compartir» son iconos de contorno de 44 con nombre', r1.prox.acc.length === 3 && resv.tag === 'A' && /btn--primario/.test(resv.cls) && resv.box[3] === 56 && /^Reservar por WhatsApp$/.test(resv.txt) && resv.icon === '#i-chat' && resv.href === reservaUrl(D) && resv.href.startsWith('https://wa.me/528100000000?text=') && decodeURIComponent(resv.href.split('text=')[1]) === reservaMessage(D) && resv.target === '_blank' && resv.rel === 'noopener noreferrer' && resv.name === 'Reservar por WhatsApp para «Tarde de prueba XVII»'
  && calD.tag === 'BUTTON' && calD.box.slice(2).join() === '44,44' && calD.name === 'Añadir «Tarde de prueba XVII» al calendario' && /btn--contorno/.test(calD.cls) && calD.bg === 'rgba(0, 0, 0, 0)' && /inset/.test(calD.ring) && shD.tag === 'BUTTON' && /btn--contorno/.test(shD.cls) && shD.box.slice(2).join() === '44,44' && shD.name === 'Compartir «Tarde de prueba XVII»' && r1.primary === 1 && r1.share === 1, JSON.stringify(r1.prox.acc));
check('eventos', 'destacado en el teléfono: la primaria ocupa su renglón entero y los iconos van debajo (o todo en un renglón si cabe); nada cortado ni fuera de la tarjeta', resv.box[0] === r1.prox.cuerpo[0] + 20 && r1.prox.acc.every(b => b.box[0] + b.box[2] <= r1.prox.box[0] + r1.prox.box[2] - 19) && r1.prox.cut === 0 && !r1.over, JSON.stringify({ acc: r1.prox.acc.map(b => b.box), prox: r1.prox.box }));
// Lista por día
const esperado = planPrueba.dias.map(d => { const c = fechaBloque(d.fecha); return { tit: fechaLarga(d.fecha), vis: [c.sem, c.num, c.mes], ids: d.eventos.map(e => e.id) }; });
check('eventos', 'lista por día: «Después» con un rótulo por día («SÁB · 28 NOV»: decorativo, con la fecha completa en texto sr-only) y los eventos en orden de fecha y hora; el pasado ya no es próximo (va a «Eventos anteriores»); las propuestas, al final con su rótulo', r1.sub.join('|') === 'Después|Propuestas, aún sin fecha|Eventos anteriores' && JSON.stringify(r1.dias.map(d => ({ tit: d.tit.toLowerCase(), vis: d.vis, ids: d.ids }))) === JSON.stringify(esperado) && r1.dias.every(d => d.hidden === 'true') && r1.dias.length === 3 && r1.dias[1].ids.join() === 'ajedrez,prueba-segunda' && r1.cards.every(c => c.id !== 'prueba-pasado') && r1.propuestas.join() === 'taller' && r1.cards.at(-1).id === 'taller', JSON.stringify([r1.sub, r1.dias, esperado, r1.propuestas]));
check('eventos', 'filas de la lista con fecha: una línea fina arriba (1 px, salvo la primera de cada día en el teléfono, que usa la del rótulo) y cada grupo se cierra con una sola línea abajo (la última fila de los días y la última propuesta); sin relleno, radio ni sombra', r1.cards.every(c => c.bg === 'rgba(0, 0, 0, 0)' && c.radius === '0px' && c.shadow === 'none') && r1.cards.filter(c => c.borderBottom === '1px').map(c => c.id).join() === 'prueba-otro-dominio,taller' && r1.cards.filter(c => c.borderTop === '1px').map(c => c.id).join() === 'prueba-segunda,taller', JSON.stringify(r1.cards.map(c => [c.id, c.borderTop, c.borderBottom])));
const cById = id => r1.cards.find(c => c.id === id);
const cir = cById('circulo'), aje = cById('ajedrez'), seg = cById('prueba-segunda'), otro = cById('prueba-otro-dominio'), tal = cById('taller');
check('eventos', 'fila de la lista: «hora · tipo» como texto (hora tal cual, en negrita; tipo en tinta-2; ninguna píldora), título (Title 3), «Con …», el primer renglón del costo y la portada cuadrada de 88 a la derecha', cir.hora === '19:00' && cir.badges === 0 && cir.rot.map(t => t[0]).join('|') === '19:00|Lectura' && cir.rot[0][1] === 'ev-hora' && cir.rot[1][1] === 'ev-tipo' && cir.title === 'Círculo de lectura' && cir.titleFs === '20px' && cir.meta === 'Con Nombre de prueba' && cir.costo === '$50 MXN' && cir.costoFuente === 'anuncio' && !cir.desc && cir.img.box[2] === 88 && cir.img.box[3] === 88 && cir.img.fit === 'cover' && cir.img.box[0] > cir.box[0] + cir.box[2] / 2 && aje.hora === '17:00' && !aje.meta && !aje.costo, JSON.stringify([cir, aje]).slice(0, 900));
const lumaOk = b => { let u; try { u = new URL(b.href); } catch { return false; } return b.tag === 'A' && u.protocol === 'https:' && ['lu.ma', 'luma.com'].includes(u.hostname) && b.target === '_blank' && b.rel === 'noopener noreferrer' && /^Registrarme$/.test(b.txt) && /^Registrarme en «.+» \(abre Luma en otra pestaña\)$/.test(b.name) && b.icon === '#i-ne'; };
check('eventos', '«Registrarme»: enlace normal a Luma (lu.ma o luma.com) en otra pestaña, de contorno y 44 (transparente, borde de 1 px), con un nombre que lo dice; a su lado, «Añadir al calendario» (icono plano de 44 con nombre)', [cir, aje].every(c => c.acc.length === 2 && lumaOk(c.acc[0]) && /btn--contorno/.test(c.acc[0].cls) && c.acc[0].box[3] === 44 && c.acc[0].bg === 'rgba(0, 0, 0, 0)' && /inset/.test(c.acc[0].ring) && c.acc[1].tag === 'BUTTON' && /btn--plano/.test(c.acc[1].cls) && c.acc[1].box.slice(2).join() === '44,44' && /^Añadir «.+» al calendario$/.test(c.acc[1].name)) && cir.acc[0].href === 'https://luma.com/prueba-circulo' && aje.acc[0].href === 'https://lu.ma/prueba-ajedrez', JSON.stringify([cir.acc, aje.acc]));
check('eventos', 'sin reserva (o con una que no es de Luma: se descarta), la acción con rótulo es «Añadir al calendario» de contorno; ningún enlace a otro dominio', [seg, otro].every(c => c.acc.length === 1 && c.acc[0].tag === 'BUTTON' && c.acc[0].txt === 'Añadir al calendario' && /btn--contorno/.test(c.acc[0].cls) && c.acc[0].box[3] === 44) && !r1.links.some(h => /registro\.example/.test(h)) && r1.links.filter(h => /lu\.ma|luma\.com/.test(h)).length === 2, JSON.stringify([seg.acc, otro.acc, r1.links]));
check('eventos', 'propuesta junto a eventos con fecha: su insignia «Propuesta · sin fecha», su descripción y ninguna acción (ni reserva ni calendario)', tal.rot.map(b => b[0]).join('|') === 'Taller|Propuesta · sin fecha' && tal.descShown && tal.acc.length === 0 && !tal.hora && tal.titleTag === 'H4', JSON.stringify(tal));
check('eventos', 'nota lateral según las reservas presentes («¿Cómo me registro?»: Luma en otra pestaña y WhatsApp con el mensaje escrito) con el enlace a Instagram; la entradilla pasa a «Lo que viene en la casa.»', r1.lado && r1.lado.tit === '¿Cómo me registro?' && /«Registrarme»/.test(r1.lado.txt) && /Luma/.test(r1.lado.txt) && /«Reservar por WhatsApp»/.test(r1.lado.txt) && /instagram\.com\/libreriaitineranteymasmty/.test(r1.lado.ig) && r1.lede === 'Lo que viene en la casa.' && !r1.ledeIg, JSON.stringify([r1.lado, r1.lede]));
check('eventos', 'con fechas en el teléfono: nada cortado, nada fuera del ancho y sin cupos, asistentes ni contadores', r1.cards.every(c => c.cut === 0 && c.box[0] >= 0 && c.box[0] + c.box[2] <= 393) && !r1.over && !/quedan|lugares|cupo|asistentes|\d+\s*personas/i.test(r1.text), JSON.stringify(r1.cards.map(c => [c.id, c.box, c.cut])));
check('eventos', 'el sitio no carga nada de Luma: ningún pedido de red a lu.ma o luma.com ni marcos o scripts en la sección', !pedidos.some(u => /\/\/([\w.-]+\.)?(lu\.ma|luma\.com)\//.test(u)) && r1.ext === 0, JSON.stringify(pedidos.filter(u => /luma|lu\.ma/.test(u))));
await ev(`document.querySelector('#cartelera').scrollIntoView({block:'start'}); scrollBy(0, -80)`); await sleep(600);
await shot('03-eventos-datos-de-prueba.jpg');
// «Añadir al calendario»: el .ics se descarga de verdad, con la CSP de producción (un Blob con download), y el aviso lo dice.
await send('Page.setDownloadBehavior', { behavior: 'allow', downloadPath: out });
const icsPath = join(out, 'prueba-cartel.ics');
if (existsSync(icsPath)) unlinkSync(icsPath);
const antes = problems.length;
await clickSel('.ev-prox [data-ev-cal]'); await sleep(1500);
const ics = existsSync(icsPath) ? readFileSync(icsPath, 'utf8') : '';
const toastCal = await ev(`document.querySelector('.toast')?.textContent || ''`);
check('calendario', '«Añadir al calendario» descarga prueba-cartel.ics con la CSP de producción (sin violaciones en consola): VEVENT con el título, el lugar y la hora de Monterrey en UTC', ics === icsOf(D, { now: new Date(/DTSTAMP:(\d{4})(\d\d)(\d\d)T(\d\d)(\d\d)(\d\d)Z/.exec(ics)?.slice(1).reduce((s, v, i) => s + v + ['-', '-', 'T', ':', ':', 'Z'][i], '') || 0) }) && /BEGIN:VEVENT\r\n/.test(ics) && /SUMMARY:Tarde de prueba XVII\r\n/.test(ics) && /LOCATION:Librería Itinerante y Más\\, Mariano Matamoros Pte\. 421\\, Centro\\\r\n , Monterrey\r\n|LOCATION:Librería Itinerante y Más\\, Mariano Matamoros Pte\. 421\\, Centro\\, Monterrey\r\n/.test(ics) && /DTSTART:\d{8}T005700Z\r\n/.test(ics) && problems.length === antes, JSON.stringify({ ics: ics.slice(0, 400), problems: problems.slice(antes) }));
check('calendario', 'el aviso lo dice en texto («Se descargó el evento para tu calendario.»)', /Se descargó el evento para tu calendario\./.test(toastCal), toastCal);
// «Compartir» (solo en el destacado): Web Share, respaldo de copiar y cancelar.
await ev(`window.__shared = null; navigator.share = async d => { window.__shared = d; }`);
await clickSel('.ev-prox [data-share]'); await sleep(500);
const sh = await ev(`window.__shared`);
check('eventos', '«Compartir» usa Web Share con el título del destacado, su fecha corta y el enlace a #cartelera', sh && /Tarde de prueba XVII/.test(sh.title) && /#cartelera$/.test(sh.url) && / · 18:57 en Librería Itinerante y Más\.$/.test(sh.text), JSON.stringify(sh));
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: undefined, configurable: true }); Object.defineProperty(navigator, 'clipboard', { value: { writeText: async t => { window.__copied = t; } }, configurable: true })`);
await clickSel('.ev-prox [data-share]'); await sleep(500);
const cp = await ev(`({copied:window.__copied, toast:document.querySelector('.toast')?.textContent})`);
check('eventos', '«Compartir» sin Web Share copia el enlace y avisa', /#cartelera$/.test(cp.copied || '') && /Enlace copiado/.test(cp.toast || ''), JSON.stringify(cp));
await ev(`window.__copied = null; Object.defineProperty(navigator, 'share', { value: async () => { const e = new Error('x'); e.name = 'AbortError'; throw e; }, configurable: true })`);
await clickSel('.ev-prox [data-share]'); await sleep(400);
check('eventos', 'cancelar la hoja de compartir no copia nada', (await ev(`window.__copied`)) === null);
// Árbol de accesibilidad: cada acción con el título de su evento; el bloque de fecha no se lee.
await send('Accessibility.enable');
const axNodes = (await send('Accessibility.getFullAXTree')).result.nodes;
const axNames = axNodes.filter(n => ['button', 'link'].includes(n.role?.value) && /«/.test(n.name?.value || '')).map(n => n.name.value);
check('eventos', 'árbol de accesibilidad: un «Compartir», un «Reservar por WhatsApp», dos «Registrarme … (abre Luma en otra pestaña)» y tres «Añadir «…» al calendario» de icono, cada uno con el título de su evento y sin nombres repetidos', axNames.filter(n => /^Compartir «/.test(n)).length === 1 && axNames.filter(n => /^Reservar por WhatsApp para «/.test(n)).length === 1 && axNames.filter(n => /^Registrarme en «.+» \(abre Luma en otra pestaña\)$/.test(n)).length === 2 && axNames.filter(n => /^Añadir «.+» al calendario$/.test(n)).length === 3 && new Set(axNames).size === axNames.length, JSON.stringify(axNames));
check('eventos', 'con datos de prueba: sin errores de consola', !problems.length, problems.join(' | '));
// Visita de regreso: boot.js reserva el renglón del inicio antes del primer render y el aviso aparece sin mover nada.
const sinAviso = await (async () => { overrideEventos = null; await open(393, 659, { reset: true }); await open(393, 659); /* la segunda carga ya no trae nada reservado de la visita anterior */ return ev(`(() => { const r = s => document.querySelector(s).getBoundingClientRect(); return { cta: Math.round(r('.entry-actions .btn').top), tit: Math.round(r('.entry-title').top), foto: [Math.round(r('.entry-media').top), Math.round(r('.entry-media').bottom)] }; })()`); })();
overrideEventos = PRUEBA;
for (const [vw, vh] of [[393, 659], [375, 629], [320, 640]]) {
  await open(vw, vh, { reset: true });
  await open(vw, vh); // primera visita: anota la fecha del último evento
  await open(vw, vh); // regreso: el renglón ya viene reservado
  const a = await ev(`(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const a = document.querySelector('[data-ev-cta]'), t = a.querySelector('.entry-ev-txt'); const tab = r('.tabbar');
    return { hint: document.documentElement.classList.contains('ev-hint'), shown: !a.hidden && getComputedStyle(a).visibility === 'visible', txt: a.innerText.trim(), href: a.getAttribute('href'), box: [Math.round(r('[data-ev-cta]').top), Math.round(r('[data-ev-cta]').bottom), Math.round(r('[data-ev-cta]').width)], ink: [Math.round(t.getBoundingClientRect().top), Math.round(t.getBoundingClientRect().bottom)], fs: getComputedStyle(a).fontSize,
      dir: Math.round(r('.entry-address').bottom), cta: Math.round(r('.entry-actions .btn').top), tit: Math.round(r('.entry-title').top), foto: [Math.round(r('.entry-media').top), Math.round(r('.entry-media').bottom), Math.round(r('.entry-media').height)], tab: Math.round(tab.top), news: getComputedStyle(document.querySelector('[data-news-cta]')).display,
      dests: [...new Set([...document.querySelectorAll('a[href], button')].filter(e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && b.bottom > 0 && b.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"], [hidden], [inert]'); }).map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))].length, over: document.documentElement.scrollWidth > innerWidth }; })()`);
  check('aviso', `${vw}×${vh} visita de regreso: «${planPrueba.aviso}» bajo la dirección (a 8 px, Subheadline de 15, objetivo de 44) y lleva a #cartelera`, a.hint && a.shown && a.txt === planPrueba.aviso && a.href === '#cartelera' && a.fs === '15px' && a.box[1] - a.box[0] === 44 && Math.abs(a.ink[0] - a.dir - 8) <= 1 && a.ink[1] - a.ink[0] === 20, JSON.stringify(a));
  if (vw === 393) check('aviso', '393×659: las posiciones fijas del inicio no cambian con el aviso (titular y «Cómo llegar» donde estaban); la foto cede 28 px', a.tit === sinAviso.tit && a.cta === sinAviso.cta && a.foto[0] === sinAviso.foto[0] + 28, JSON.stringify([a, sinAviso]));
  check('aviso', `${vw}×${vh}: la foto queda a 24 px del aviso, mide ≥ 160 y ${vw > 359 ? 'termina ≥ 8 px sobre la barra inferior' : 'no se encima'}; sin desborde; ≤ 6 destinos en la primera vista`, Math.abs(a.foto[0] - a.ink[1] - 24) <= 1 && a.foto[2] >= 160 && (vw <= 359 || a.tab - a.foto[1] >= 8) && !a.over && a.dests <= 6, JSON.stringify(a));
  if (vw === 393) {
    await shot('03-aviso-inicio.jpg');
    await clickSel('[data-ev-cta]'); await sleep(1500);
    const ir = await ev(`(() => { const h = document.querySelector('.hdr').getBoundingClientRect().bottom, t = document.querySelector('#bill-title').getBoundingClientRect().top; return Math.round(t - h); })()`);
    check('aviso', 'tocar el aviso lleva a Eventos (titular a 24 px bajo la cabecera)', Math.abs(ir - 24) <= 4, String(ir));
  }
}
// Escritorio: el aviso se muestra desde la primera visita (vive en el relleno del bloque de texto: no mueve nada), punto en «Eventos» sin mover la barra, y la composición 1–8 | 9–12.
overrideEventos = null;
await open(1280, 800, { reset: true, mobile: false, wait: 2500 });
await open(1280, 800, { mobile: false, wait: 2500 }); // sin nada reservado de la visita anterior
const navSin = await ev(`[...document.querySelectorAll('.hdr-nav a')].filter(a => a.getBoundingClientRect().width).map(a => [Math.round(a.getBoundingClientRect().left), Math.round(a.getBoundingClientRect().width)])`);
const bloqueSin = await ev(`Math.round(document.querySelector('.entry-title').getBoundingClientRect().top)`);
overrideEventos = PRUEBA;
await ev(`localStorage.clear()`);
await open(1280, 800, { mobile: false, wait: 2500 }); // primera visita con evento: sin reserva
const dk = await ev(`(() => { const r = s => document.querySelector(s).getBoundingClientRect(); const a = document.querySelector('[data-ev-cta]'); const dot = document.querySelector('.hdr-nav [data-ev-dot]');
  return { shown: !a.hidden && getComputedStyle(a).visibility === 'visible' && r('[data-ev-cta]').width > 0, txt: a.innerText.trim(), ink: Math.round(a.querySelector('.entry-ev-txt').getBoundingClientRect().top - r('.entry-address').bottom), tit: Math.round(r('.entry-title').top), dot: !dot.hidden && getComputedStyle(dot).position === 'absolute' && dot.getBoundingClientRect().width === 8, dotBg: getComputedStyle(dot).backgroundColor,
    nav: [...document.querySelectorAll('.hdr-nav a')].filter(x => x.getBoundingClientRect().width).map(x => [Math.round(x.getBoundingClientRect().left), Math.round(x.getBoundingClientRect().width)]), sr: document.querySelector('.hdr-nav [data-ev-sr]').textContent }; })()`);
check('aviso', '1280 primera visita: el aviso se muestra sin reserva (8 px bajo la dirección) y el bloque de texto no se mueve; punto primario en «Eventos» que no mueve los enlaces de la barra', dk.shown && dk.txt === planPrueba.aviso && dk.ink === 8 && dk.tit === bloqueSin && dk.dot && JSON.stringify(dk.nav) === JSON.stringify(navSin) && /próximo: /.test(dk.sr), JSON.stringify([dk, navSin, bloqueSin]));
await irEventos();
const r1d = await leerEventos();
check('eventos', '1280 con fechas: destacado con el cuerpo a la izquierda y el cartel entero y cuadrado en la mitad derecha; la primaria al ancho de su rótulo, en un renglón con sus iconos', r1d.prox && r1d.prox.img.box[0] >= r1d.prox.box[0] + r1d.prox.box[2] / 2 && Math.abs(r1d.prox.img.box[2] - r1d.prox.img.box[3]) <= 1 && r1d.prox.img.fit === 'contain' && r1d.prox.cuerpo[2] < r1d.prox.box[2] / 2 + 20 && new Set(r1d.prox.acc.map(b => b.box[1] + b.box[3] / 2)).size === 1 && r1d.prox.acc[0].box[2] < 300, JSON.stringify(r1d.prox));
check('eventos', '1280 con fechas: la lista en las columnas 1–8 y la nota lateral en 9–12, alineadas arriba y la nota fija al desplazar; portadas de 120', r1d.lado && r1d.lado.box[0] > r1d.lado.lista[0] + r1d.lado.lista[2] && r1d.lado.box[1] === r1d.lado.lista[1] && r1d.lado.sticky === 'sticky' && Math.abs(r1d.lado.lista[2] / (r1d.lado.box[0] + r1d.lado.box[2] - r1d.lado.lista[0]) - 0.657) < 0.01 && r1d.cards.every(c => c.img.box[2] === 120 && c.img.box[3] === 120 && c.cut === 0) && !r1d.over, JSON.stringify(r1d.lado));
check('eventos', '1280 con datos de prueba: sin errores de consola', !problems.length, problems.join(' | '));
overrideEventos = null;

// ---- 3.3 Eventos anteriores (2026-11-16): el sitio se alimenta solo; lo ya ocurrido pasa a un apartado de archivo ----
{
  const pas = (i, n, extra = {}) => ({ id: `ant-${i}`, tipo: ['Charla', 'Lectura', 'Juego', 'Taller'][i % 4], titulo: ['Tarde de Letras XVI', 'Círculo de otoño', 'Ajedrez en la casa', 'Taller de escritura creativa'][i % 4], fecha: dayMty(n), hora: '18:30', fin: null, con: i % 3 === 0 ? 'Nombre de prueba' : null, descripcion: 'Texto de prueba.', imagen: ['assets/img/cartelera-1.webp', 'assets/img/cartelera-2.webp', 'assets/img/cartelera-3.webp'][i % 3], alt: 'Foto de prueba', reserva: { tipo: 'luma', url: 'https://lu.ma/pasado' }, costo: ['$50 MXN'], ...extra });
  const ANT = [-8, -22, -40, -70, -120, -200, -330, -420].map((n, i) => pas(i, n));
  const ANTES = { eventos: [...PRUEBA.eventos.filter(e => e.id !== 'prueba-pasado'), ...ANT, pas(90, -745), pas(91, -900, { id: 'ant-viejo' })] }; // dos fuera de la ventana
  const planA = eventosPlan(validEventos(ANTES));
  const leer = () => ev(`(() => { const sec = document.querySelector('#cartelera'); const q = (s, r = sec) => r.querySelector(s); const all = (s, r = sec) => [...r.querySelectorAll(s)];
    const R = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
    const cs = (e, p) => getComputedStyle(e)[p];
    const ap = q('.ev-anteriores'), ul = q('.ev-pasados'), fold = q('.ev-fold');
    const rows = all('.ev-pasado'), vis = rows.filter(l => !l.hidden && getComputedStyle(l).display !== 'none');
    const fila = l => { const img = q('.ev-pas-img', l), f = q('.ev-pas-fecha', l), t = q('.ev-pas-tit', l), m = q('.ev-pas-meta', l); return { id: l.dataset.id, box: R(l), bg: cs(l, 'backgroundColor'), bt: cs(l, 'borderTopWidth'), shadow: cs(l, 'boxShadow'), glass: cs(l, 'backdropFilter'), cursor: cs(l, 'cursor'), tag: t.tagName, tit: t.textContent, titFs: cs(t, 'fontSize'), titW: cs(t, 'fontWeight'), fecha: f.querySelector('[aria-hidden]')?.textContent, fechaSr: f.querySelector('.sr-only')?.textContent, fechaFs: cs(f, 'fontSize'), fechaTT: cs(f, 'textTransform'), meta: m?.textContent || '', metaFs: m ? cs(m, 'fontSize') : '', img: img && { box: R(img), alt: img.getAttribute('alt'), radius: cs(img, 'borderTopLeftRadius'), outline: cs(img, 'outlineStyle') + ' ' + cs(img, 'outlineWidth'), fit: cs(img, 'objectFit'), ok: img.naturalWidth > 0 }, acts: all('a, button, input, [tabindex]', l).length, over: [...l.querySelectorAll('*')].filter(e => !e.closest('.sr-only') && e.scrollWidth > e.clientWidth + 1 && getComputedStyle(e).overflow !== 'visible').length }; };
    return { ap: !!ap, labelled: ap && ap.getAttribute('aria-labelledby') === q('.ev-anteriores > .ev-sub')?.id, h: q('.ev-anteriores > .ev-sub')?.tagName, hTxt: q('.ev-anteriores > .ev-sub')?.textContent, ul: ul && { tag: ul.tagName, id: ul.id, bb: cs(ul, 'borderBottomWidth') }, n: rows.length, nVis: vis.length, filas: vis.map(fila), ids: vis.map(l => l.dataset.id),
      fold: fold && { txt: fold.textContent.trim(), exp: fold.getAttribute('aria-expanded'), ctl: fold.getAttribute('aria-controls'), ctlOk: !!document.getElementById(fold.getAttribute('aria-controls')), cls: fold.className, box: R(fold), focus: document.activeElement === fold, top: fold.getBoundingClientRect().top, bg: cs(fold, 'backgroundColor') },
      apBox: ap && R(ap), lista: q('.ev-lista') && R(q('.ev-lista')), lado: q('.ev-lado') && R(q('.ev-lado')), secH: Math.round(sec.getBoundingClientRect().height), over: document.documentElement.scrollWidth > innerWidth, text: ap?.innerText || '',
      broken: all('img').filter(i => i.complete && i.naturalWidth === 0).length, sub: all('.ev-sub').map(h => h.textContent), propuestas: all('.ev-propuestas .ev-fila').length }; })()`);
  // (1) lista real: sin apartado, sin hueco (misma altura que el HTML estático)
  overrideEventos = null;
  await open(393, 659, { reset: true });
  await irEventos();
  const real0 = await leer();
  await send('Emulation.setScriptExecutionDisabled', { value: true });
  await send('Page.navigate', { url: URL_ }); await sleep(1500);
  const estatico = await ev(`Math.round(document.querySelector('#cartelera').getBoundingClientRect().height)`);
  await send('Emulation.setScriptExecutionDisabled', { value: false });
  check('anteriores', 'lista real (hoy, sin eventos pasados): no existe el apartado ni su botón ni su encabezado, y la sección mide lo mismo que el HTML estático (sin hueco)', !real0.ap && real0.n === 0 && !real0.fold && !real0.sub.includes('Eventos anteriores') && real0.secH === estatico, JSON.stringify([real0.ap, real0.n, real0.secH, estatico]));
  // (2) datos de prueba en el teléfono y en escritorio
  for (const [vw, vh, mobile] of [[393, 659, true], [1280, 800, false]]) {
    overrideEventos = ANTES;
    await open(vw, vh, { reset: true, mobile, wait: mobile ? 4000 : 2500 });
    await irEventos();
    const a0 = await leer();
    const tag = `${vw}×${vh}`;
    const cover = vw < 761 ? 64 : 88;
    check('anteriores', `${tag} apartado: section aria-labelledby con h3 «Eventos anteriores» (Title 3), lista ul, 6 de 8 válidos a la vista (los dos de fuera de los 24 meses no están) y «Ver los 8 anteriores» como botón de contorno con aria-expanded="false" y aria-controls`, a0.ap && a0.labelled && a0.h === 'H3' && a0.hTxt === 'Eventos anteriores' && a0.ul.tag === 'UL' && a0.nVis === 6 && a0.n === 6 && planA.anteriores.length === 8 && a0.fold && a0.fold.txt === 'Ver los 8 anteriores' && a0.fold.exp === 'false' && a0.fold.ctl === a0.ul.id && a0.fold.ctlOk && /btn--contorno/.test(a0.fold.cls) && a0.fold.bg === 'rgba(0, 0, 0, 0)', JSON.stringify([a0.ap, a0.labelled, a0.h, a0.nVis, a0.n, a0.fold]));
    check('anteriores', `${tag} orden: del más reciente al más antiguo (${planA.anteriores.slice(0, 6).map(e => e.id).join(', ')})`, a0.ids.join() === planA.anteriores.slice(0, 6).map(e => e.id).join(), a0.ids.join());
    const f = a0.filas;
    check('anteriores', `${tag} fila: entre líneas finas de 1 px, sin relleno, sombra, vidrio ni cursor de mano; título h4 en Headline 17 semibold; fecha en versalitas de 13 en mayúsculas, con la fecha completa en sr-only; «tipo · Con …» de 15; portada cuadrada de ${cover} con radio 12 y anillo de 1 px, decorativa (alt vacío); ningún botón, enlace ni tabindex`, f.length === 6 && f.every(x => x.bt === '1px' && x.bg === 'rgba(0, 0, 0, 0)' && x.shadow === 'none' && (x.glass === 'none' || !x.glass) && x.cursor !== 'pointer' && x.tag === 'H4' && x.titFs === '17px' && x.titW === '600' && x.fechaFs === '13px' && x.fechaTT === 'uppercase' && /[a-záéíóú]+ \d+ de [a-z]+/.test(x.fechaSr) && /^[A-Z][a-zé]+ · \d+ [A-Z][a-z]+/.test(x.fecha) && x.metaFs === '15px' && x.img && x.img.box[2] === cover && x.img.box[3] === cover && x.img.radius === '12px' && /^solid 1px/.test(x.img.outline) && x.img.alt === '' && x.img.ok && x.acts === 0 && x.over === 0) && a0.ul.bb === '1px', JSON.stringify(f[0]));
    check('anteriores', `${tag} sin acciones: ni «Registrarme», «Reservar», calendario, «Compartir», costo ni «Próximo» dentro del apartado (aunque el JSON los traiga)`, !/Registrarme|Reservar|calendario|Compartir|\$\s?\d|Próximo|Hoy\b/.test(a0.text), a0.text.slice(0, 200));
    check('anteriores', `${tag} el año solo cuando no es el en curso («DIC · 2025» aparece en las filas de otro año)`, f.every(x => (x.fecha.split(' · ').length === 3) === (x.fechaSr.includes(' de ' + String(new Date().getFullYear() - 1)) || x.fechaSr.includes(' de ' + String(new Date().getFullYear() + 1)))), JSON.stringify(f.map(x => [x.fecha, x.fechaSr])));
    if (vw >= 1024) check('anteriores', `${tag} está en la columna de la lista (1–8): el apartado empieza y termina con ella y la nota lateral (9–12) queda a su derecha`, a0.apBox[0] === a0.lista[0] && a0.apBox[0] + a0.apBox[2] <= a0.lista[0] + a0.lista[2] + 1 && a0.lado && a0.lado[0] >= a0.apBox[0] + a0.apBox[2] + 16, JSON.stringify([a0.apBox, a0.lista, a0.lado]));
    else check('anteriores', `${tag} a todo el ancho del contenido, sin desborde`, a0.apBox[0] >= 0 && a0.apBox[0] + a0.apBox[2] <= vw && !a0.over, JSON.stringify([a0.apBox, a0.over]));
    await shot(`03a-anteriores-${vw}-plegado.jpg`);
    // desplegar: el foco se queda en el botón; ya salen las 8 y dice «Ver menos»
    await ev(`document.querySelector('.ev-fold').focus({ preventScroll: true }); document.querySelector('.ev-fold').scrollIntoView({ block: 'center' })`); await sleep(500);
    const antes = await ev(`document.querySelector('.ev-fold').getBoundingClientRect().top`);
    await enter(); await sleep(1300);
    const a1 = await leer();
    check('anteriores', `${tag} «Ver los 8 anteriores» con el teclado: aparecen las 8, el botón dice «Ver menos» con aria-expanded="true", conserva el foco y la altura de la sección crece`, a1.nVis === 8 && a1.fold.txt === 'Ver menos' && a1.fold.exp === 'true' && a1.fold.focus && a1.secH > a0.secH && a1.ids.join() === planA.anteriores.map(e => e.id).join() && a1.filas.every(x => x.img && x.img.ok), JSON.stringify([a1.nVis, a1.fold, a0.secH, a1.secH]));
    await shot(`03a-anteriores-${vw}-desplegado.jpg`);
    // plegar con el cursor sobre el botón: el botón no se mueve bajo el cursor
    await ev(`document.querySelector('.ev-fold').scrollIntoView({ block: 'center' })`); await sleep(400);
    const p0 = await ev(`document.querySelector('.ev-fold').getBoundingClientRect().top`);
    await enter(); await sleep(900);
    const a2 = await leer();
    check('anteriores', `${tag} «Ver menos»: vuelven las 6, el botón dice «Ver los 8 anteriores», conserva el foco y no se mueve bajo el cursor (Δ ${Math.round(a2.fold.top - p0)} px)`, a2.nVis === 6 && a2.fold.txt === 'Ver los 8 anteriores' && a2.fold.exp === 'false' && a2.fold.focus && Math.abs(a2.fold.top - p0) <= 1, JSON.stringify([a2.nVis, a2.fold, p0]));
    check('anteriores', `${tag} con datos de prueba: sin errores de consola`, !problems.length, problems.join(' | '));
  }
  // (3) solo pasados, sin próximos ni propuestas: el apartado va solo, en 1–8 en escritorio, con la entradilla «Aún sin fecha…»
  overrideEventos = { eventos: ANT };
  await open(1280, 800, { reset: true, mobile: false, wait: 2500 }); await irEventos();
  const so = await leer();
  const lede = await ev(`document.querySelector('[data-ev-lede]').innerText.trim()`);
  check('anteriores', '1280 solo pasados (sin próximos ni propuestas): el apartado va solo en las columnas 1–8, con su propio encabezado; la entradilla sigue siendo «Aún sin fecha. Las fechas se anuncian en Instagram.»; sin destacado, sin nota lateral', so.ap && so.nVis === 6 && !so.lado && so.propuestas === 0 && so.apBox[2] < 1152 * 0.72 && so.apBox[2] > 1152 * 0.6 && /^Aún sin fecha\./.test(lede) && so.sub.join() === 'Eventos anteriores', JSON.stringify([so.apBox, lede, so.sub]));
  await shot('03a-solo-pasados-1280.jpg');
  // (4) propuestas reales + pasados, sin próximos: no se repintan las propuestas de index.html y los anteriores van debajo
  overrideEventos = { eventos: [realBy('circulo'), realBy('ajedrez'), realBy('taller'), ...ANT.slice(0, 3)] };
  await open(393, 659, { reset: true }); await irEventos();
  const mix = await leer();
  check('anteriores', '393 propuestas sin fecha + 3 pasados: las tres propuestas, el apartado debajo y sin botón (caben en 6)', mix.propuestas === 3 && mix.ap && mix.nVis === 3 && !mix.fold && mix.sub.join() === 'Eventos anteriores', JSON.stringify([mix.propuestas, mix.nVis, mix.fold, mix.sub]));
  // (5) imagen inexistente: la fila queda sin foto, nunca un recuadro roto
  overrideEventos = { eventos: [pas(0, -8, { imagen: 'assets/img/no-existe.webp' }), pas(1, -22, { imagen: null }), pas(2, -40)] };
  await open(393, 659, { reset: true }); await irEventos(); await sleep(800);
  const sinImg = await leer();
  check('anteriores', '393 imagen que no existe (404) o ausente: la fila se conserva sin foto y el texto ocupa el ancho; ninguna imagen rota a la vista', sinImg.nVis === 3 && sinImg.filas[0].img === null && sinImg.filas[1].img === null && sinImg.filas[2].img && sinImg.broken === 0 && sinImg.filas.every(x => x.box[2] > 300), JSON.stringify([sinImg.filas.map(x => [x.id, !!x.img, x.box]), sinImg.broken]));
  // (6) cartel enorme y no cuadrado en el destacado: solo CSS, sin desbordar
  overrideEventos = { eventos: [{ ...PRUEBA.eventos[1], imagen: 'assets/img/eventos/cartel-enorme.jpg' }, pas(0, -8)] };
  const enorme = join(tmpdir(), 'cartel-enorme.jpg');
  if (!existsSync(enorme)) { const { spawnSync } = await import('node:child_process'); spawnSync('python3', ['-c', `from PIL import Image; Image.new('RGB', (4000, 6000), (122, 196, 180)).save(${JSON.stringify(enorme)}, quality=60)`]); }
  if (existsSync(enorme)) {
    await send('Fetch.enable', { patterns: [{ urlPattern: '*collections.json*' }, { urlPattern: '*eventos.json*' }, { urlPattern: '*menu.json*' }, { urlPattern: '*cartel-enorme*' }] });
    cartelEnorme = readFileSync(enorme);
    for (const [vw, vh, mobile] of [[393, 659, true], [1280, 800, false]]) {
      await open(vw, vh, { reset: true, mobile, wait: mobile ? 4000 : 2500 }); await irEventos(); await sleep(1500);
      const big = await ev(`(() => { const i = document.querySelector('.ev-prox-img'); const f = document.querySelector('.ev-prox-fig'); const r = i.getBoundingClientRect(), fr = f.getBoundingClientRect(); return { nat: [i.naturalWidth, i.naturalHeight], box: [Math.round(r.width), Math.round(r.height)], fig: [Math.round(fr.width), Math.round(fr.height)], over: document.documentElement.scrollWidth > innerWidth, inside: r.left >= fr.left - 1 && r.right <= fr.right + 1 }; })()`);
      check('anteriores', `${vw}×${vh} cartel de 4000×6000 (no cuadrado): se muestra entero y cuadrado dentro de su marco, sin desbordar la página`, big.nat[0] === 4000 && Math.abs(big.box[0] - big.box[1]) <= 1 && big.inside && !big.over && big.box[0] < 700, JSON.stringify(big));
    }
    cartelEnorme = null;
  }
  // (6b) eventos de la hoja sin cartel (`origen: "hoja"`, imagen null): destacado, lista y anteriores sin foto ni recuadro roto
  const hoja = (id, n, extra = {}) => ({ id, origen: 'hoja', tipo: 'Charla', titulo: `De la hoja ${id}`, fecha: dayMty(n), hora: '18:00', fin: null, con: 'Nombre de prueba', descripcion: 'Texto de prueba de un evento de la hoja sin cartel.', imagen: null, alt: '', reserva: null, ...extra });
  overrideEventos = { eventos: [hoja('hoja-a', 4, { reserva: { tipo: 'luma', url: 'https://lu.ma/hoja' } }), hoja('hoja-b', 9), hoja('hoja-c', -9)] };
  for (const [vw, vh, mobile] of [[393, 659, true], [1280, 800, false]]) {
    await open(vw, vh, { reset: true, mobile, wait: mobile ? 4000 : 2500 }); await irEventos(); await sleep(800);
    const h = await ev(`(() => { const sec = document.querySelector('#cartelera'), r = e => e.getBoundingClientRect(); const prox = sec.querySelector('.ev-prox'), cu = prox?.querySelector('.ev-prox-cuerpo'); return { prox: !!prox, sin: prox?.classList.contains('ev-prox--sin-foto'), fig: !!sec.querySelector('.ev-prox-fig'), imgs: sec.querySelectorAll('.ev-prox-img, .ev-card-img, .ev-pas-img').length, broken: [...sec.querySelectorAll('img')].filter(i => i.complete && i.naturalWidth === 0).length, cuerpo: cu && [Math.round(r(cu).width), Math.round(r(prox).width)], filas: sec.querySelectorAll('.ev-fila').length, pas: sec.querySelectorAll('.ev-pasado').length, over: document.documentElement.scrollWidth > innerWidth, h: Math.round(r(prox).height) }; })()`);
    await shot(`03a-hoja-sin-foto-${vw}.jpg`);
    check('anteriores', `${vw}×${vh} eventos de la hoja sin cartel (imagen null): destacado sin figura (.ev-prox--sin-foto; ${vw >= 1024 ? 'el cuerpo ocupa 8 de 12 columnas' : 'el cuerpo a todo el ancho'}), una fila en la lista y una en anteriores, ninguna imagen ni recuadro roto, sin desborde`, h.prox && h.sin && !h.fig && h.imgs === 0 && h.broken === 0 && h.filas === 1 && h.pas === 1 && !h.over && (vw >= 1024 ? h.cuerpo[0] / h.cuerpo[1] > 0.6 && h.cuerpo[0] / h.cuerpo[1] < 0.72 : h.cuerpo[1] - h.cuerpo[0] <= 2), JSON.stringify(h));
  }
  // (7) 150 eventos (50 próximos y 100 pasados): pinta sin tareas largas con CPU 4× y arma solo 6 filas de anteriores
  const muchos = { eventos: [...Array.from({ length: 50 }, (_, i) => ({ ...pas(i, 1 + i * 2), id: `prox-${i}`, reserva: i % 2 ? null : { tipo: 'luma', url: 'https://lu.ma/x' } })), ...Array.from({ length: 100 }, (_, i) => pas(i + 100, -3 - i * 6))] };
  overrideEventos = muchos;
  await open(393, 659, { reset: true, wait: 3500 });
  await send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await ev(`window.__long = []; new PerformanceObserver(l => l.getEntries().forEach(e => window.__long.push(Math.round(e.duration)))).observe({ type: 'longtask', buffered: false }); document.querySelector('#cartelera').scrollIntoView(); 0`);
  await sleep(3000);
  const mm = await leer();
  const tareas = await ev(`window.__long`);
  await send('Emulation.setCPUThrottlingRate', { rate: 1 });
  const antPlan = eventosPlan(validEventos(muchos));
  check('anteriores', `150 eventos con CPU 4×: la sección se pinta (${antPlan.conFecha} próximos), solo 6 filas de anteriores en el DOM de las ${antPlan.anteriores.length} vigentes, «Ver los ${antPlan.anteriores.length} anteriores», y ninguna tarea larga supera 200 ms (${JSON.stringify(tareas)})`, mm.ap && mm.n === 6 && mm.fold.txt === `Ver los ${antPlan.anteriores.length} anteriores` && (tareas || []).every(d => d <= 200), JSON.stringify([mm.n, mm.fold, tareas]));
  await ev(`document.querySelector('.ev-fold').click()`); await sleep(1500);
  const mm2 = await leer();
  check('anteriores', `150 eventos: «Ver los ${antPlan.anteriores.length} anteriores» arma el resto de las filas (${mm2.nVis} a la vista), todas dentro de la ventana de 24 meses y sin errores de consola`, mm2.nVis === antPlan.anteriores.length && !problems.length, JSON.stringify([mm2.nVis, problems]));
  overrideEventos = null;
}

// ---------- 3b. Café y té (#cafe): la carta al modo de las apps de comida (2026-11-17; datos en assets/data/menu.json) ----------
// Sustituye a la parrilla de tarjetas del 2026-11-16. Una barra de enlaces (una por categoría, con su nombre corto si lo trae: «Sin café», y el
// nombre completo como aria-label) que marca el grupo a la vista y lleva al grupo; cada grupo con su título (Title 3), su nota si la trae y sus
// filas entre líneas finas: nombre (Headline), el precio justo debajo (15/600 turquesa-texto, solo el de la carta impresa) y la descripción;
// una columna en el teléfono y dos desde 761; sin foto la fila no reserva columna; con foto, cuadrada a la derecha (96 / 120). El cierre
// («Pídelo en la barra de la sala.» y «Cómo llegar», 56, a todo el ancho en el teléfono) vuelve: el café se sirve en la librería (Matamoros 421).
const menu = JSON.parse(readFileSync(new URL('../../assets/data/menu.json', import.meta.url), 'utf8'));
const prodsMenu = menu.categorias.flatMap(c => c.productos);
const precioEsperado = p => (typeof p.precio === 'number' ? `$${p.precio} MXN${p.unidad ? ` ${p.unidad}` : ''}` : '');
const MAPS_LIBRERIA = 'https://www.google.com/maps/dir/?api=1&destination=Librer%C3%ADa%20Itinerante%20y%20M%C3%A1s%2C%20Mariano%20Matamoros%20Pte.%20421%2C%20Centro%2C%20Monterrey';
const leerCarta = () => ev(`(() => { const q = s => document.querySelector(s); const sec = q('#cafe');
  const R = e => { const b = e.getBoundingClientRect(); return [Math.round(b.left * 10) / 10, Math.round(b.top * 10) / 10, Math.round(b.width * 10) / 10, Math.round(b.height * 10) / 10]; };
  const vis = e => { const b = e.getBoundingClientRect(); const cs = getComputedStyle(e); return b.width > 0 && b.height > 0 && cs.visibility !== 'hidden' && cs.display !== 'none'; };
  const nav = q('[data-ct-nav]'), chips = [...nav.querySelectorAll('.ct-chip')], groups = [...sec.querySelectorAll('.ct-grupo')];
  const head = q('#cafe .sec-head'), foto = q('.cafe-foto'), cierre = q('.ct-cierre'), cBtn = cierre.querySelector('a');
  const contenido = (() => { const cs = getComputedStyle(sec), b = sec.getBoundingClientRect(); return [Math.round(b.left + parseFloat(cs.paddingLeft)), Math.round(b.width - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight))]; })();
  const lineas = [...sec.querySelectorAll('.ct-rejilla')].map(ul => getComputedStyle(ul).borderBottom);
  return { ready: q('[data-cafe]').classList.contains('is-ready'), busy: q('[data-ct-lista]').getAttribute('aria-busy'), hdr: Math.round(q('.hdr').getBoundingClientRect().bottom), contenido, lineas,
    linea: getComputedStyle(document.documentElement).getPropertyValue('--linea').trim(), turquesa: (() => { const x = document.createElement('i'); x.style.color = 'var(--turquesa-texto)'; document.body.append(x); const c = getComputedStyle(x).color; x.remove(); return c; })(),
    nav: { label: nav.getAttribute('aria-label'), pos: getComputedStyle(nav).position, top: getComputedStyle(nav).top, bg: getComputedStyle(nav).backgroundColor, glass: getComputedStyle(nav).backdropFilter, box: R(nav), dir: getComputedStyle(nav).flexDirection, scrolls: nav.scrollWidth > nav.clientWidth + 1, scrollLeft: nav.scrollLeft },
    chips: chips.map(c => [c.textContent.trim(), c.tagName, c.getAttribute('href'), c.getAttribute('aria-current'), Math.round(c.getBoundingClientRect().height), R(c), c.getAttribute('aria-label')]),
    groups: groups.map(g => ({ id: g.id, tit: g.querySelector('.ct-grupo-tit').textContent, tag: g.querySelector('.ct-grupo-tit').tagName, fs: getComputedStyle(g.querySelector('.ct-grupo-tit')).fontSize, labelled: g.getAttribute('aria-labelledby') === g.querySelector('.ct-grupo-tit').id, nota: g.querySelector('.ct-grupo-nota')?.textContent || '', notaFs: g.querySelector('.ct-grupo-nota') ? getComputedStyle(g.querySelector('.ct-grupo-nota')).fontSize : '', n: g.querySelectorAll('.ct-prod').length, box: R(g), titBox: R(g.querySelector('.ct-grupo-tit')), cols: new Set([...g.querySelectorAll('.ct-prod')].map(li => Math.round(li.getBoundingClientRect().left))).size })),
    prods: [...sec.querySelectorAll('.ct-prod')].map(li => { const pr = li.querySelector('.ct-precio'), nm = li.querySelector('.ct-nom'), ds = li.querySelector('.ct-desc'), tx = li.querySelector('.ct-txt'), cs = getComputedStyle(li), fo = li.querySelector('.ct-foto');
      return { id: li.dataset.id, solo: li.classList.contains('ct-prod--solo'), nom: nm.textContent, nomTag: nm.tagName, nomFs: getComputedStyle(nm).fontSize + '/' + getComputedStyle(nm).fontWeight, nomBox: R(nm), desc: ds?.textContent || '', descBox: ds ? R(ds) : null, descFs: ds ? getComputedStyle(ds).fontSize : '',
        precio: pr?.textContent || '', fuente: pr?.dataset.fuente || '', precioBox: pr ? R(pr) : null, precioStyle: pr ? getComputedStyle(pr).fontSize + '/' + getComputedStyle(pr).fontWeight + '/' + getComputedStyle(pr).color : '', txtBox: R(tx),
        bg: cs.backgroundColor, radius: cs.borderRadius, ring: cs.boxShadow, borde: cs.borderTop, pad: cs.paddingTop + ' ' + cs.paddingBottom, cursor: cs.cursor, tab: li.tabIndex, focusables: li.querySelectorAll('a, button, [tabindex]').length, box: R(li),
        foto: fo ? { box: R(fo), img: !!fo.querySelector('img'), ic: !!fo.querySelector('.ct-ic use'), bg: getComputedStyle(fo).backgroundColor, radius: getComputedStyle(fo).borderRadius } : null }; }),
    lista: R(q('[data-ct-lista]')), head: R(head), foto: foto && { box: R(foto), kind: foto.dataset.kind, alt: foto.querySelector('img').alt },
    cierre: { vis: vis(cierre), hidden: cierre.hidden, texto: cierre.querySelector('p')?.textContent.trim() || '', box: R(cierre), btn: cBtn ? { txt: cBtn.textContent.trim(), cls: cBtn.className, href: cBtn.getAttribute('href'), target: cBtn.target, rel: cBtn.rel, box: R(cBtn) } : null, txtBottom: cierre.querySelector('p') ? Math.round(cierre.querySelector('p').getBoundingClientRect().bottom) : null },
    text: sec.innerText, html: sec.innerHTML, wa: sec.querySelectorAll('a[href*="wa.me"]').length, primary: [...sec.querySelectorAll('.btn--primario')].filter(vis).length, over: document.documentElement.scrollWidth > innerWidth }; })()`);
const chipActual = () => ev(`document.querySelector('.ct-chip[aria-current="true"]')?.dataset.id ?? null`);
const alGrupo = id => ev(`document.getElementById('carta-${id}').scrollIntoView({ block: 'start', behavior: 'instant' })`);
const irCarta = async () => { await ev(`document.querySelector('#cafe').scrollIntoView({ block: 'start', behavior: 'instant' })`); await sleep(1700); await ev(`document.querySelector('#cafe').scrollIntoView({ block: 'start', behavior: 'instant' })`); await sleep(600); };
const cerca = (a, b, t = 1) => Math.abs(a - b) <= t;
for (const [vw, vh, mobile] of [[393, 659, true], [320, 640, true], [1280, 800, false]]) {
  await open(vw, vh, { reset: true, mobile, wait: 2500 });
  await irCarta();
  const c = await leerCarta();
  const tag = `${vw}×${vh}`;
  const cols = vw >= 761 ? 2 : 1;
  const corto = k => (typeof k.chip === 'string' && k.chip.trim() ? k.chip.trim() : k.nombre);
  check('café', `${tag}: la carta se pinta de menu.json: barra de categorías (nav con nombre; un enlace #carta-<id> por categoría, de 48, con su nombre corto si lo trae y el nombre completo como aria-label; el primero con aria-current) y un grupo por categoría (h3 Title 3, nombrado, con su nota en Subheadline si la trae) con todos sus productos`, c.ready && c.busy === null && c.nav.label === 'Categorías de la carta' && c.chips.map(x => x[0]).join('|') === menu.categorias.map(corto).join('|') && c.chips.every((x, i) => x[1] === 'A' && x[2] === `#carta-${menu.categorias[i].id}` && x[4] === 48 && x[6] === (corto(menu.categorias[i]) !== menu.categorias[i].nombre ? menu.categorias[i].nombre : null)) && menu.categorias.some(k => corto(k) !== k.nombre) && c.chips[0][3] === 'true' && c.chips.filter(x => x[3] === 'true').length === 1 && c.groups.length === menu.categorias.length && c.groups.every((g, i) => g.tit === menu.categorias[i].nombre && g.tag === 'H3' && g.fs === '20px' && g.labelled && g.n === menu.categorias[i].productos.length && g.nota === (menu.categorias[i].nota || '') && (!g.nota || g.notaFs === '15px')), JSON.stringify([c.chips, c.groups]).slice(0, 900));
  check('café', `${tag}: precios solo los de la carta impresa («$NN MXN», con la unidad si la trae), marcados como dato de la carta; con precio null no se imprime nada (ni «por confirmar», ni «$0», ni «MX$»)`, c.prods.length === prodsMenu.length && c.prods.every((p, i) => p.id === prodsMenu[i].id && p.nom === prodsMenu[i].nombre && p.precio === precioEsperado(prodsMenu[i]) && p.fuente === (p.precio ? 'carta' : '') && p.desc === (prodsMenu[i].descripcion || '')) && !/por confirmar|gratis|\$\s?0\b|MX\$/i.test(c.text) && c.prods.filter(p => p.precio).length === prodsMenu.filter(p => typeof p.precio === 'number').length, JSON.stringify(c.prods.filter((p, i) => p.precio !== precioEsperado(prodsMenu[i]))).slice(0, 500));
  const fila = p => p.solo && !p.foto && p.bg === 'rgba(0, 0, 0, 0)' && p.ring === 'none' && p.radius === '0px' && /^1px solid/.test(p.borde) && p.pad === '16px 16px' && p.nomTag === 'H4' && p.nomFs === '17px/600' && p.cursor !== 'pointer' && p.tab === -1 && p.focusables === 0
    && (!p.precio || (p.precioStyle === `15px/600/${c.turquesa}` && p.precioBox[1] >= p.nomBox[1] + p.nomBox[3] && p.precioBox[1] - (p.nomBox[1] + p.nomBox[3]) <= 4.5))
    && (!p.desc || (p.descFs === '15px' && p.descBox[1] >= (p.precioBox ? p.precioBox[1] + p.precioBox[3] : p.nomBox[1] + p.nomBox[3]) - 0.5))
    && cerca(p.txtBox[2], p.box[2]);
  check('café', `${tag}: fila de la carta (todas sin foto, hoy): sin caja (sin fondo, radio ni anillo), una línea fina de 1 px arriba y 16 de aire arriba y abajo; nombre Headline 17/600 (h4), el precio justo debajo (≤ 4 px; 15/600 en turquesa-texto) y luego la descripción; sin foto el texto ocupa la fila entera (no reserva la columna de la foto); no es un control (sin cursor de mano, tabulador ni enlaces)`, c.prods.every(fila), JSON.stringify(c.prods.filter(p => !fila(p))).slice(0, 700));
  check('café', `${tag}: líneas finas entre filas: cada lista de grupo cierra con su línea de 1 px abajo`, c.lineas.length === menu.categorias.length && c.lineas.every(b => /^1px solid/.test(b)), JSON.stringify(c.lineas));
  const ag = c.prods.find(p => p.id === 'aguas-frescas') || c.prods.find(p => /^Aguas frescas/.test(p.nom));
  const tes = c.prods.filter(p => !p.precio && !p.desc);
  check('café', `${tag}: «Aguas frescas» y los tés (sin precio ni descripción) son una fila de un solo renglón (22 + 16 + 16 + la línea)${mobile ? ', a todo el ancho de la carta' : '; en dos columnas la fila iguala el alto de su vecina de renglón (las líneas siguen parejas)'}`, ag && tes.length && tes.every(p => p.nomBox[3] <= 23 && (p.box[3] <= 56 || (!mobile && c.prods.some(q => q !== p && cerca(q.box[1], p.box[1]) && cerca(q.box[3], p.box[3]) && q.box[3] > 56)))) && (!mobile || cerca(ag.box[2], c.lista[2])), JSON.stringify([ag, tes.map(p => [p.id, p.box[3]]), c.lista]).slice(0, 600));
  check('café', `${tag}: ${cols === 1 ? 'una columna de filas en el teléfono' : 'dos columnas de filas desde 761'} en cada grupo`, c.groups.every(g => g.cols === Math.min(cols, g.n)), JSON.stringify(c.groups.map(g => [g.id, g.n, g.cols])));
  check('café', `${tag}: la barra de categorías es fija bajo la cabecera con el fondo opaco de su banda (no es vidrio)${mobile ? ', de borde a borde' : ', en columna a la izquierda (columnas 1–3)'}`, c.nav.pos === 'sticky' && c.nav.bg !== 'rgba(0, 0, 0, 0)' && (c.nav.glass === 'none' || !c.nav.glass) && (mobile ? c.nav.box[0] === 0 && c.nav.box[2] === vw && c.nav.dir === 'row' : c.nav.dir === 'column' && c.nav.box[0] >= 32 && c.nav.box[0] + c.nav.box[2] < c.lista[0] && c.lista[0] > c.nav.box[0] + c.nav.box[2] + 20), JSON.stringify(c.nav));
  check('café', `${tag}: foto real de la casa con alt; ${mobile ? 'debajo de la carta (al llegar se ve la carta)' : 'arriba a la derecha, junto al titular'}; sin desborde`, c.foto.kind === 'real' && c.foto.alt.length > 20 && (mobile ? c.foto.box[1] >= c.lista[1] + c.lista[3] : c.foto.box[0] > c.head[0] + c.head[2] - 10 && c.foto.box[1] <= c.head[1] + 5) && !c.over, JSON.stringify([c.foto, c.head, c.lista]));
  const cb = c.cierre.btn;
  check('café', `${tag}: el cierre vuelve: «Pídelo en la barra de la sala.» y «Cómo llegar» (56, a la librería en Matamoros 421, en otra pestaña${mobile ? ', a todo el ancho' : ', al ancho de su rótulo desde el margen'}; a 24 de su texto), después de la carta; de contorno secundario, no primaria (la primaria de esa pantalla es la de Visita); sin «Padre Mier», sin WhatsApp ni precios en el marcado del cierre`, !c.cierre.hidden && c.cierre.vis && c.cierre.texto === 'Pídelo en la barra de la sala.' && cb && /^Cómo llegar/.test(cb.txt) && /btn--secundario/.test(cb.cls) && !/btn--primario/.test(cb.cls) && cb.box[3] === 56 && cb.href === MAPS_LIBRERIA && cb.target === '_blank' && /noopener/.test(cb.rel) && (mobile ? cerca(cb.box[0], c.contenido[0]) && cerca(cb.box[2], c.contenido[1]) : cerca(cb.box[0], c.contenido[0]) && cb.box[2] < 300) && cerca(cb.box[1] - c.cierre.txtBottom, 24) && c.cierre.box[1] >= c.lista[1] + c.lista[3] && !/Padre Mier/i.test(c.html) && c.wa === 0 && c.primary === 0 && !/\$/.test(c.cierre.texto), JSON.stringify([c.cierre, c.contenido, c.wa, c.primary]));
  // Scroll-spy: llegando desde arriba, desde abajo, y por cada grupo.
  const id0 = menu.categorias[0].id;
  check('café', `${tag}: scroll-spy: al llegar a la sección desde arriba el chip actual es «${corto(menu.categorias[0])}»`, (await chipActual()) === id0, String(await chipActual()));
  await ev(`scrollTo(0, document.documentElement.scrollHeight)`); await sleep(900);
  await irCarta();
  const desdeAbajo = await chipActual();
  await ev(`scrollTo(0, 0)`); await sleep(900);
  const alInicio = await chipActual();
  await irCarta();
  check('café', `${tag}: scroll-spy: llegando desde abajo (salto a #cafe tras recorrer la página) el chip actual es «${corto(menu.categorias[0])}», no el último (defecto del 2026-11-16)`, desdeAbajo === id0 && alInicio === id0, JSON.stringify([desdeAbajo, alInicio]));
  const spy = [];
  for (const k of menu.categorias) { await alGrupo(k.id); await sleep(700); spy.push([k.id, await chipActual()]); }
  check('café', `${tag}: scroll-spy: al llegar a cada grupo su chip es el actual (uno solo con aria-current)`, spy.every(([a, b]) => a === b), JSON.stringify(spy));
  await ev(`scrollTo(0, 0)`); await sleep(500); await irCarta();
  // Tocar un chip: marca al instante, lleva al grupo (título visible bajo la barra), deja el foco en su título y no cambia la dirección.
  if (menu.categorias.length > 2) {
    const k = menu.categorias[2];
    const hashAntes = await ev(`location.hash`);
    await clickSel(`.ct-chip[data-id="${k.id}"]`); await sleep(1200);
    const t = await ev(`(() => { const g = document.getElementById('carta-${k.id}'), t = g.querySelector('.ct-grupo-tit'), nav = document.querySelector('[data-ct-nav]'); const gb = t.getBoundingClientRect(), nb = nav.getBoundingClientRect(); return { cur: document.querySelector('.ct-chip[aria-current="true"]')?.dataset.id, foco: document.activeElement === t, hash: location.hash, titulo: Math.round(gb.top), barraAbajo: Math.round(nb.bottom), hdr: Math.round(document.querySelector('.hdr').getBoundingClientRect().bottom), navTop: Math.round(nb.top), n: document.querySelectorAll('.ct-chip[aria-current="true"]').length }; })()`);
    check('café', `${tag}: tocar «${corto(k)}»: su chip queda actual, la página va a su grupo (el título queda visible${mobile ? ' bajo la barra, a ≥ 8 px' : ''}), el foco pasa al título y la dirección no cambia`, t.cur === k.id && t.n === 1 && t.foco && t.hash === hashAntes && t.titulo >= (mobile ? t.barraAbajo + 8 : t.hdr) && t.titulo <= (mobile ? t.barraAbajo + 40 : t.hdr + 90) && (!mobile || t.navTop === t.hdr), JSON.stringify(t));
  }
  if (vw === 393) await shot('05-cafe-393.jpg');
  check('café', `${tag}: sin errores de consola`, !problems.length, problems.join(' | '));
}
// Con fotos de prueba (no están en el repo): una fila con foto cuadrada a la derecha (96 en el teléfono, 120 desde 761; fondo-3, radio 12) y otra cuya foto no carga
// (queda el icono de su categoría). El nombre y el precio no se mueven: siguen arriba a la izquierda, el precio justo bajo el nombre.
overrideMenu = JSON.parse(JSON.stringify(menu));
Object.assign(overrideMenu.categorias[0].productos[0], { foto: { src: 'assets/img/oficial-mesa-800.webp', alt: 'Foto de prueba del café de olla' } });
Object.assign(overrideMenu.categorias[0].productos[2], { foto: { src: 'assets/img/portadas/no-existe.webp', alt: 'Foto que no carga' } });
for (const [vw, vh, mobile] of [[393, 659, true], [1280, 800, false]]) {
  await open(vw, vh, { reset: true, mobile, wait: 2500 });
  await irCarta(); await sleep(1200);
  const c = await leerCarta();
  const lado = mobile ? 96 : 120;
  const conFoto = c.prods.find(p => p.id === overrideMenu.categorias[0].productos[0].id), rota = c.prods.find(p => p.id === overrideMenu.categorias[0].productos[2].id);
  const aLaDerecha = p => p && !p.solo && p.foto && cerca(p.foto.box[2], lado) && cerca(p.foto.box[2], p.foto.box[3]) && p.foto.box[0] >= p.txtBox[0] + p.txtBox[2] + 15 && cerca(p.foto.box[0] + p.foto.box[2], p.box[0] + p.box[2]) && cerca(p.foto.box[1], p.box[1] + 17) && p.foto.bg === 'rgb(230, 238, 236)' && p.foto.radius === '12px' && cerca(p.nomBox[0], p.box[0]) && cerca(p.nomBox[1], p.box[1] + 17) && p.precioBox[1] - (p.nomBox[1] + p.nomBox[3]) <= 4.5;
  check('café', `${vw}×${vh} con foto de prueba: la fila con foto la lleva cuadrada a la derecha (${lado} × ${lado}, fondo-3, radio 12), con nombre y precio en su sitio (arriba a la izquierda, el precio justo debajo); si la foto falla, queda el icono de su categoría en el mismo recuadro; las demás filas siguen sin foto ni columna reservada`, aLaDerecha(conFoto) && conFoto.foto.img && conFoto.precio === '$65 MXN' && aLaDerecha(rota) && !rota.foto.img && rota.foto.ic && c.prods.filter(p => p.solo).length === c.prods.length - 2 && c.prods.filter(p => p.solo).every(p => !p.foto && cerca(p.txtBox[2], p.box[2])) && !c.over, JSON.stringify([conFoto, rota]).slice(0, 900));
  if (vw === 393) await shot('05-cafe-393-foto-prueba.jpg');
}
overrideMenu = null;

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
  await open(393, 659, { wait: 2500 });
  await approach();
  const st = await newsState();
  check('novedades', `${label}: no existen la sección, su enlace de la barra, su fila del menú ni el control del inicio (nada de «Todo el catálogo»); queda recordado «sin llegadas»`, st.display === 'none' && !st.hasNews && st.links.every(l => l.w === 0) && st.cards === 0 && !st.dot && st.sr === '' && st.cta === null && !st.hint && !/de la A a la Z/.test(st.text) && st.state === 'n' && st.tabs.join('|') === 'Inicio|Catálogo|Mi lista', JSON.stringify(st).slice(0, 700));
}
// El inicio de una primera visita no reserva un renglón vacío para el control: de la dirección a la foto, solo el aire del inicio (24 px).
override = realData;
await ev(`localStorage.clear()`);
await open(393, 659, { wait: 2500 });
const gap = await ev(`(() => { const a = document.querySelector('.entry-address').getBoundingClientRect(), m = document.querySelector('.entry-media').getBoundingClientRect(); return { gap: Math.round(m.top - a.bottom), hint: document.documentElement.classList.contains('news-hint') }; })()`);
check('inicio', `primera visita: sin hueco entre la dirección y la foto (${gap.gap} px, el aire del inicio) y sin renglón reservado`, gap.gap <= 25 && !gap.hint, JSON.stringify(gap));
// 4b. «Ver todo» / «Ver menos» (con siete llegadas): despliega la tira en rejilla dentro de la sección y la vuelve a plegar; el foco se queda en el botón.
const ids = sample.slice(10, 17).map(b => b.id);
const withSeven = { ...realData, novedades: { titulo: 'Recién llegados', entradas: ids.map((id, i) => ({ id, llegada: dayAgo([1, 3, 20, 2, 30, 35, 40][i]) })) } };
override = withSeven;
for (const [vw, vh, cols] of [[393, 659, 3], [320, 640, 2]]) {
  await open(vw, vh, { wait: 2500 });
  await approach();
  await ev(`document.querySelector('#novedades').scrollIntoView()`); await sleep(500);
  const grid = () => ev(`(() => { const l = document.querySelector('#news-list'); const it = [...l.children].map(e => e.getBoundingClientRect()); const t = document.querySelector('[data-news-toggle]');
    return { rows: new Set(it.map(r => Math.round(r.top))).size, cols: it.filter(r => Math.round(r.top) === Math.round(it[0].top)).length, scrolls: l.scrollWidth > l.clientWidth + 1, sl: l.scrollLeft, exp: t.getAttribute('aria-expanded'), text: t.textContent.trim(), focus: document.activeElement === t, over: document.documentElement.scrollWidth > innerWidth, h: Math.round(l.getBoundingClientRect().height) }; })()`);
  const g0 = await grid();
  await clickSel('[data-news-toggle]'); await sleep(1000);
  const g1 = await grid();
  if (vw === 393) { await ev(`scrollBy(0, -40)`); await sleep(300); await shot('04b-novedades-desplegada.jpg'); }
  await ev(`document.querySelector('[data-news-toggle]').scrollIntoView({ block: 'center' })`); await sleep(300);
  await clickSel('[data-news-toggle]'); await sleep(1000);
  const g2 = await grid();
  check('novedades', `${vw}×${vh}: plegada es una tira de una fila que se desliza; «Ver todo» la despliega en rejilla de ${cols} columnas (aria-expanded, «Ver menos», foco en el botón) y «Ver menos» la regresa al principio`, g0.rows === 1 && g0.scrolls && g1.exp === 'true' && g1.text === 'Ver menos' && g1.focus && g1.cols === cols && g1.rows === Math.ceil(7 / cols) && !g1.scrolls && g2.exp === 'false' && g2.text === 'Ver todo' && g2.focus && g2.rows === 1 && g2.sl === 0 && !g1.over && !g2.over, JSON.stringify({ g0, g1, g2 }));
}
// 4c. Un libro abre la ficha única: WhatsApp (prellenado), Guardar, Compartir (Web Share o copiar el enlace) y «Cómo llegar»; al cerrar, el foco vuelve al libro.
await open(393, 659, { wait: 2500 });
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
// 3 llegadas en las dos últimas semanas, 3 anteriores dentro de los 45 días y una de hace 50 días (vencida), en desorden: la tira ordena de lo más reciente a lo más antiguo y no pinta la vencida.
const ages = [1, 3, 20, 2, 30, 50, 40];
const newsOrder = [0, 3, 1, 2, 4, 6].map(i => ids[i]);
const NEW7 = JSON.stringify([true, true, true, false, false, false]);
override = { ...realData, novedades: { titulo: 'Recién llegados', entradas: ids.map((id, i) => (ages[i] === null ? { id } : { id, llegada: dayAgo(ages[i]) })) } };
await ev(`localStorage.clear()`);
await open(393, 659, { wait: 2500 });
const early = await newsState();
check('novedades', 'primera visita con llegadas, antes de acercarse: punto en el enlace y en la fila del menú (con «, 3 sin ver» para lectores); el control del inicio no aparece a la vista (no había renglón reservado: nada salta)', early.dot && early.sr === ', 3 sin ver' && early.cta === null && !early.hint && early.tabs.join('|') === 'Inicio|Catálogo|Mi lista' && early.cards === 0, JSON.stringify({ dot: early.dot, sr: early.sr, cta: early.cta, hint: early.hint, cards: early.cards }));
await approach();
const withData = await newsState();
check('novedades', 'con el inicio fuera de la vista, el control «3 novedades recientes» toma su renglón (sin que nadie lo vea saltar)', withData.hint && withData.cta === '3 novedades recientes', JSON.stringify({ hint: withData.hint, cta: withData.cta }));
check('novedades', 'con entradas, la sección aparece sola con esas seis llegadas vigentes (lo más reciente primero; la de hace 50 días no se pinta) y nada más; titular «Novedades» y «3 llegaron en las últimas dos semanas»', withData.cards === 6 && !withData.hidden && withData.hasNews && JSON.stringify(withData.ids) === JSON.stringify(newsOrder) && withData.title === 'Novedades' && withData.status === '3 llegaron en las últimas dos semanas', JSON.stringify(withData).slice(0, 600));
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
await open(393, 659, { wait: 2500 });
await approach();
const back = await newsState();
check('novedades', 'visita de regreso (vista hace 2 días): una sola llegada posterior → «1 llegó desde tu última visita», una insignia y «, 1 sin ver»', back.status === '1 llegó desde tu última visita' && JSON.stringify(back.badges.slice(0, 6)) === JSON.stringify([true, false, false, false, false, false]) && back.badges.filter(Boolean).length === 1 && back.dot && back.sr === ', 1 sin ver', JSON.stringify({ status: back.status, sr: back.sr }));
// Sin fecha real, la entrada no se puede juzgar reciente: no se muestra (también la clave antigua `ids`): no hay sección, ni punto, ni control.
override = { ...realData, novedades: { titulo: 'Recién llegados', ids } };
await ev(`localStorage.clear()`);
await open(393, 659, { wait: 2500 });
await approach();
const undated = await newsState();
check('novedades', 'entradas sin fecha de llegada (clave antigua `ids`): no hay sección, ni enlaces, ni punto ni control (no se puede saber si son recientes)', undated.cards === 0 && undated.hidden && !undated.hasNews && !undated.dot && undated.cta === null, JSON.stringify({ cards: undated.cards, hidden: undated.hidden, dot: undated.dot, cta: undated.cta }));
// Todas vencidas (hace 46 días o más) o de libros que ya no existen: igual que con la lista vacía.
for (const [nombre, entradas] of [['todas de hace 46 días o más', ids.map((id, i) => ({ id, llegada: dayMty(-(46 + i * 10)) }))], ['de libros que ya no están en el catálogo', [{ id: 'ya-no-existe', llegada: dayMty(-1) }, { id: 'tampoco', llegada: dayMty(-2) }]]]) {
  override = { ...realData, novedades: { titulo: 'Recién llegados', entradas } };
  await ev(`localStorage.clear()`);
  await open(393, 659, { wait: 2500 });
  await approach();
  const v = await newsState();
  const fila = await ev(`[...document.querySelectorAll('[data-news-link]')].map(l => l.hidden || l.getBoundingClientRect().width === 0)`);
  check('novedades', `${nombre}: no existen la sección, su enlace de la barra y del menú, el punto ni el control del inicio (igual que con la lista vacía)`, v.cards === 0 && v.hidden && !v.hasNews && !v.dot && v.cta === null && fila.every(Boolean), JSON.stringify({ cards: v.cards, hidden: v.hidden, hasNews: v.hasNews, dot: v.dot, cta: v.cta, fila }));
}
// Ventana de 45 días y arranque: una llegada de hace 45 días entra; la visita siguiente (iti-news-vence ya pasado) no reserva nada antes del primer render.
override = { ...realData, novedades: { titulo: 'Recién llegados', entradas: [{ id: ids[0], llegada: dayMty(-45) }, { id: ids[1], llegada: dayMty(-46) }] } };
await ev(`localStorage.clear()`);
await open(393, 659, { wait: 2500 }); await approach();
const v45 = await newsState();
const guardado = await ev(`({ estado: localStorage.getItem('iti-news-estado'), vence: localStorage.getItem('iti-news-vence') })`);
check('novedades', 'ventana de 45 días: la llegada de hace 45 días se muestra y la de hace 46 no (1 tarjeta); la visita deja iti-news-vence = llegada + 45 días (hoy, el último día)', v45.cards === 1 && v45.ids[0] === ids[0] && guardado.vence === dayMty(0), JSON.stringify({ cards: v45.cards, guardado, hoy: dayMty(0) }));
// boot.js compara con el día del dispositivo; la prueba fija el reloj en Monterrey (como la gente que visita el sitio), si no, entre las 18:00 y las 24:00
// de Monterrey el contenedor (UTC) ya va un día adelante y «vence hoy» se leía como vencido.
await send('Emulation.setTimezoneOverride', { timezoneId: 'America/Monterrey' }).catch(() => {});
await send('Page.addScriptToEvaluateOnNewDocument', { source: `document.addEventListener('DOMContentLoaded', () => { window.__arranque = [...document.documentElement.classList].filter(c => /has-news|news-hint/.test(c)).join(' '); });` });
await ev(`localStorage.setItem('iti-news-estado', 'p'); localStorage.setItem('iti-news-vence', ${JSON.stringify(dayMty(-1))})`);
await open(393, 659, { wait: 800 });
const arrVencido = await ev(`window.__arranque`);
await ev(`localStorage.setItem('iti-news-estado', 'p'); localStorage.setItem('iti-news-vence', ${JSON.stringify(dayMty(0))})`);
await open(393, 659, { wait: 800 });
const arrVigente = await ev(`window.__arranque`);
check('novedades', 'boot.js: con la ventana ya cerrada (vence ayer) no reserva la sección ni el renglón del control antes del primer render; con la ventana abierta (vence hoy) sí', arrVencido === '' && /has-news/.test(arrVigente) && /news-hint/.test(arrVigente), JSON.stringify({ arrVencido, arrVigente }));
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
for (const [w, h, mobile] of [[393, 659, true], [1280, 800, false]]) {
  const s = await sweep(w, h, mobile);
  check('primaria', `${w}x${h}: a lo sumo una acción primaria por pantalla, siempre «Cómo llegar», y ningún WhatsApp mayor (${s.sections} pantallas, ${s.withPrimary} con primaria)`, !s.bad.length, JSON.stringify(s.bad).slice(0, 600));
}
// hojas abiertas: menú, Mi lista, ficha y Explorar (móvil)
await open(393, 659, { wait: 3500 });
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
