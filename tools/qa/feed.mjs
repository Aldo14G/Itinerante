// Móvil con sensación de red social (U03), Novedades (U04) y una sola acción primaria (U01/D10).
// node feed.mjs <url> [outDir]   Sale con código ≠ 0 si algo falla.
//  Teléfono de referencia desde el 2026-11-14: iPhone 16 en Safari (393×659; antes 390×844, que ningún iPhone tiene).
//  1. Primera vista (393x659): inicio (nombre, estado, dirección, «Cómo llegar» de 56 px como única acción de contacto), sin burbujas de historias, con la barra de navegación (marca y ☰) y la barra inferior de vidrio (Inicio, Catálogo, Mi lista); ≤ 6 destinos distintos a la vista en 393x659, 375x629, 375x667 y 440x763 (U02/D11; la casilla Novedades y el control «N novedades…» llevan al mismo sitio y cuentan como uno); «Escribir» (WhatsApp) reaparece en la cabecera al desplazar.
//  3. Eventos y talleres (destacado y lista por fecha, 2026-11-16; datos en assets/data/eventos.json). Con la lista real (sin fechas): tres propuestas en
//     tarjetas horizontales (insignias, título, portada cuadrada de 88, descripción), sin acciones, sin destacado, sin aviso en el inicio ni punto en la barra;
//     en escritorio, tres por fila; sin JavaScript, lo mismo en HTML estático. Con **datos de prueba inyectados por esta herramienta** (Fetch de CDP; no están
//     en el repo): destacado con cartel entero, bloque de fecha, costo y «Reservar por WhatsApp»; lista por día con «Registrarme» (solo lu.ma / luma.com, en
//     otra pestaña) y «Añadir al calendario» (el .ics se descarga con la CSP de producción); propuestas al final; nota lateral; «Compartir»; aviso en el inicio
//     (reservado por boot.js en la visita de regreso, sin mover las posiciones fijas) y punto en «Eventos».
//  3b. Café y té (#cafe): chips Café · Té (radiogroup), Carrusel3D variante carta (tarjetas tipográficas con icono, sin fotos ni precios), «Preguntar por la carta»
//     (secundario, mensaje de la categoría), foto real de la casa (en escritorio arriba, junto al titular, y la carta a todo el ancho debajo), con toque sin flechas, teclado y región viva, a 393, 320 y 1280; en el teléfono la carta va antes que la foto (2026-11-14).
//  4. Novedades (CarruselNovedades): sin llegadas válidas no existen la sección, su enlace de la barra, su fila del menú ni el control del inicio; con llegadas, la tira
//     son solo esas (lo más reciente primero) y «Nuevo» solo en lo reciente; «Ver todo» / «Ver menos» (aria-expanded, foco quieto, rejilla de 3 columnas a 393 y 2 a
//     320); cada libro abre la ficha única (WhatsApp prellenado, Guardar, Compartir con respaldo de copiar, «Cómo llegar»; foco de vuelta al libro; enlace #libro-<id>).
//  5. Barrido de acciones primarias en 393x659 y 1280x800: a lo sumo una por pantalla, siempre «Cómo llegar», y ningún WhatsApp mayor que ella.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, existsSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { eventosPlan, validEventos, fechaBloque, fechaLarga, diaCorto, metaLine, reservaUrl, reservaMessage, icsOf } from '../../feed.js';

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
let overrideEventos = null; // cuerpo alterno de eventos.json (datos de prueba de esta herramienta; null = el archivo real)
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
  if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') problems.push(`LOG ${m.params.entry.text} ${m.params.entry.url || ''}`);
  if (m.method === 'Fetch.requestPaused') {
    const { requestId, request } = m.params;
    if (/eventos\.json/.test(request.url)) {
      if (overrideEventos) send('Fetch.fulfillRequest', { requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(overrideEventos)).toString('base64') });
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
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
await send('Fetch.enable', { patterns: [{ urlPattern: '*collections.json*' }, { urlPattern: '*eventos.json*' }] });
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
  const btn = e => e && { tag: e.tagName, txt: e.innerText.trim(), name: e.getAttribute('aria-label') || '', cls: e.className, box: R(e), href: e.getAttribute('href'), target: e.getAttribute('target'), rel: e.getAttribute('rel'), bg: getComputedStyle(e).backgroundColor, icon: e.querySelector('use')?.getAttribute('href') };
  const card = li => { const c = q('.ev-card', li), img = q('.ev-card-img', li); return { id: li.dataset.id, hora: q('.ev-hora', li)?.textContent || '', badges: all('.badge', li).map(b => [b.textContent.trim(), b.classList.contains('badge--quiet'), getComputedStyle(b).fontSize]), title: q('.ev-card-tit', li)?.textContent, titleTag: q('.ev-card-tit', li)?.tagName, titleFs: getComputedStyle(q('.ev-card-tit', li)).fontSize,
      meta: q('.ev-card-meta', li)?.textContent || '', costo: q('.ev-costo', li)?.textContent || '', costoFuente: q('.ev-costo', li)?.dataset.fuente || '', desc: q('.ev-card-desc', li)?.textContent || '', descShown: q('.ev-card-desc', li) ? getComputedStyle(q('.ev-card-desc', li)).display !== 'none' : false,
      img: img && { box: R(img), alt: img.alt, fit: getComputedStyle(img).objectFit, ok: img.complete ? img.naturalWidth > 0 : true }, box: R(c), bg: getComputedStyle(c).backgroundColor, radius: getComputedStyle(c).borderRadius, glass: getComputedStyle(c).backdropFilter, shadow: getComputedStyle(c).boxShadow, cursor: getComputedStyle(c).cursor, tab: c.tabIndex,
      acc: all('.ev-card-acc > *', li).map(btn), labelled: c.getAttribute('aria-labelledby') === q('.ev-card-tit', li)?.id, cut: all('.ev-card-tit, .badge, .ev-card-meta, .ev-card-desc, .ev-costo, .btn', li).filter(e => e.scrollWidth > e.clientWidth + 1).length }; };
  const prox = q('.ev-prox'); const lado = q('.ev-lado');
  return { lede: q('.sec-texto').innerText.trim(), ledeIg: !!q('.sec-texto a[href*="instagram.com"]'), c3d: all('.c3d, [aria-roledescription="carrusel"], [aria-live]').length, snap: all('*').filter(e => getComputedStyle(e).scrollSnapType !== 'none').length,
    prox: prox && { id: prox.dataset.id, cartel: prox.classList.contains('ev-prox--cartel'), box: R(prox), shadow: getComputedStyle(prox).boxShadow !== 'none', radius: getComputedStyle(prox).borderRadius, img: (i => i && { box: R(i), fit: getComputedStyle(i).objectFit, alt: i.alt, nat: [i.naturalWidth, i.naturalHeight] })(q('.ev-prox-img')), cuerpo: R(q('.ev-prox-cuerpo')),
      fecha: (f => f && { txt: [...f.childNodes].map(n => n.textContent.trim()).filter(Boolean), hidden: f.getAttribute('aria-hidden'), box: R(f), bg: getComputedStyle(f).backgroundColor })(q('.ev-fecha')), badges: all('.ev-prox .badge').map(b => [b.textContent.trim(), b.classList.contains('badge--quiet')]),
      title: q('.ev-prox-tit').textContent, titleTag: q('.ev-prox-tit').tagName, meta: q('.ev-prox-meta').textContent, desc: q('.ev-prox-desc')?.textContent || '', costo: all('.ev-prox .ev-costo li').map(li => li.textContent), costoFuente: q('.ev-prox .ev-costo')?.dataset.fuente || '', acc: all('.ev-acc > *').map(btn),
      cut: all('.ev-prox-tit, .ev-prox .badge, .ev-prox-meta, .ev-prox-desc, .ev-prox .btn').filter(e => e.scrollWidth > e.clientWidth + 1).length },
    sub: all('.ev-sub').map(h => h.textContent), dias: all('.ev-dia').map(d => ({ tit: q('.ev-dia-tit', d).innerText.replace(/\\s+/g, ' ').trim(), ids: all('.ev-fila', d).map(li => li.dataset.id) })),
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
check('eventos', 'lista real: 3 propuestas en tarjetas de superficie (radio 20, sin vidrio ni sombra; no son un control) con portada cuadrada de 88 descrita, título (Title 3) y dos insignias de 12: el tipo y «Propuesta · sin fecha»; la descripción a la vista', r0.cards.length === 3 && r0.cards.every(c => c.img && c.img.box[2] === 88 && c.img.box[3] === 88 && c.img.fit === 'cover' && c.img.alt && !/Recreación IA|Foto real/.test(c.img.alt) && c.title && c.titleFs === '20px' && c.badges.length === 2 && c.badges[0][0] === TIPOS[c.id] && !c.badges[0][1] && c.badges[1][0] === 'Propuesta · sin fecha' && c.badges[1][1] && c.badges.every(b => b[2] === '12px') && c.descShown && c.desc.length > 60 && c.radius === '20px' && (c.glass === 'none' || !c.glass) && c.shadow === 'none' && c.cursor !== 'pointer' && c.tab === -1 && c.labelled), JSON.stringify(r0.cards).slice(0, 900));
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
  check('eventos', `${vw}×${vh} lista real: tres tarjetas al ancho del contenido, sin texto cortado ni desborde`, f.cards.length === 3 && f.cards.every(c => c.cut === 0 && c.box[0] >= 0 && c.box[0] + c.box[2] <= vw) && !f.over, JSON.stringify(f.cards.map(c => [c.box, c.cut])));
}
await open(1280, 800, { reset: true, mobile: false, wait: 2500 });
await irEventos();
const r0d = await leerEventos();
check('eventos', '1280 lista real: las tres propuestas en una fila (columnas 1–4, 5–8 y 9–12), con la portada cuadrada arriba; sin nota lateral', r0d.cards.length === 3 && new Set(r0d.cards.map(c => c.box[1])).size === 1 && new Set(r0d.cards.map(c => c.box[3])).size === 1 && r0d.cards.every(c => c.img.box[2] === c.img.box[3] && c.img.box[2] > 200 && c.img.box[1] < c.box[1] + 40) && !r0d.lado && !r0d.over, JSON.stringify(r0d.cards.map(c => [c.box, c.img.box])));
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
const feedText = await ev(`[...document.querySelectorAll('.hl, .profile-av, #cartelera, .entry-copy, .news, .cafe')].map(e => e.innerText).join(' ')`);
check('verdad', 'sin contadores, reseñas, precios ni fechas inventadas en perfil, eventos y carta', !/(\d+\s*(me gusta|likes?|seguidores|reseñas|opiniones|vistas|asistentes|lugares))|★|\$\s?\d|\bmás leídos\b|\bagotad|\bquedan\b|\bcupo/i.test(feedText || ''), feedText);

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
check('eventos', 'con fechas: el más próximo es el destacado (tarjeta en superficie, radio 28, la única con sombra), con «Próximo», tipo y ciclo, el título y la fecha completa en texto', r1.prox && r1.prox.id === 'prueba-cartel' && r1.prox.shadow && r1.prox.radius === '28px' && r1.prox.badges.map(b => b[0]).join('|') === 'Próximo|Lectura|Ciclo de prueba' && !r1.prox.badges[0][1] && r1.prox.title === D.titulo && r1.prox.titleTag === 'H3' && r1.prox.meta === metaLine(D) && / · 18:57 · Invita a Nombre de prueba · Colabora Editorial de prueba$/.test(r1.prox.meta) && r1.prox.desc === D.descripcion && r1.cards.every(c => c.shadow === 'none'), JSON.stringify(r1.prox));
check('eventos', 'con fechas: bloque de fecha (día de la semana, número y mes sobre primario), decorativo: la fecha se lee en el renglón de al lado', r1.fechaBlocks === 1 && r1.prox.fecha.txt.join('|') === [bloque.sem, bloque.num, bloque.mes].join('|') && r1.prox.fecha.hidden === 'true' && r1.prox.fecha.box[2] === 64 && r1.prox.fecha.box[3] === 72 && r1.prox.meta.toLowerCase().startsWith(fechaLarga(D.fecha)), JSON.stringify(r1.prox.fecha));
check('eventos', 'cartel: entero y cuadrado, nunca recortado (1:1, object-fit: contain), a todo el ancho de la tarjeta, con un alt que dice lo que anuncia', r1.prox.cartel && r1.prox.img.fit === 'contain' && Math.abs(r1.prox.img.box[2] - r1.prox.img.box[3]) <= 1 && r1.prox.img.box[2] === r1.prox.box[2] && /^Cartel de prueba: Tarde de prueba XVII/.test(r1.prox.img.alt), JSON.stringify(r1.prox.img));
check('eventos', 'costo: los tres renglones tal como los da la librería, marcados como dato del anuncio; sin «gratis» ni «entrada libre»', r1.prox.costo.join('|') === D.costo.join('|') && r1.prox.costoFuente === 'anuncio' && !/gratis|entrada libre/i.test(r1.text), JSON.stringify(r1.prox.costo));
const [resv, calD, shD] = r1.prox.acc;
check('eventos', 'destacado: «Reservar por WhatsApp» es la primaria de 56 (enlace wa.me/52 + 10 dígitos con el mensaje ya escrito, en otra pestaña) y «Añadir al calendario» y «Compartir» son iconos de 56 con nombre', r1.prox.acc.length === 3 && resv.tag === 'A' && /btn--primario/.test(resv.cls) && resv.box[3] === 56 && /^Reservar por WhatsApp$/.test(resv.txt) && resv.icon === '#i-chat' && resv.href === reservaUrl(D) && resv.href.startsWith('https://wa.me/528100000000?text=') && decodeURIComponent(resv.href.split('text=')[1]) === reservaMessage(D) && resv.target === '_blank' && resv.rel === 'noopener noreferrer' && resv.name === 'Reservar por WhatsApp para «Tarde de prueba XVII»'
  && calD.tag === 'BUTTON' && calD.box.slice(2).join() === '56,56' && calD.name === 'Añadir «Tarde de prueba XVII» al calendario' && calD.bg === menta && shD.tag === 'BUTTON' && shD.box.slice(2).join() === '56,56' && shD.name === 'Compartir «Tarde de prueba XVII»' && r1.primary === 1 && r1.share === 1, JSON.stringify(r1.prox.acc));
check('eventos', 'destacado en el teléfono: la primaria ocupa su renglón entero y los iconos van debajo (o todo en un renglón si cabe); nada cortado ni fuera de la tarjeta', resv.box[0] === r1.prox.cuerpo[0] + 20 && r1.prox.acc.every(b => b.box[0] + b.box[2] <= r1.prox.box[0] + r1.prox.box[2] - 19) && r1.prox.cut === 0 && !r1.over, JSON.stringify({ acc: r1.prox.acc.map(b => b.box), prox: r1.prox.box }));
// Lista por día
const esperado = planPrueba.dias.map(d => { const c = diaCorto(d.fecha); return { tit: `${c.fecha} ${c.dia}`, ids: d.eventos.map(e => e.id) }; });
check('eventos', 'lista por día: «Después» con un rótulo por día («26 nov jueves») y los eventos en orden de fecha y hora; el pasado no se muestra; las propuestas, al final con su rótulo', r1.sub.join('|') === 'Después|Propuestas, aún sin fecha' && JSON.stringify(r1.dias) === JSON.stringify(esperado) && r1.dias.length === 3 && r1.dias[1].ids.join() === 'ajedrez,prueba-segunda' && !r1.text.includes('Evento pasado') && r1.propuestas.join() === 'taller' && r1.cards.at(-1).id === 'taller', JSON.stringify([r1.sub, r1.dias, esperado, r1.propuestas]));
const cById = id => r1.cards.find(c => c.id === id);
const cir = cById('circulo'), aje = cById('ajedrez'), seg = cById('prueba-segunda'), otro = cById('prueba-otro-dominio'), tal = cById('taller');
check('eventos', 'tarjeta de la lista: hora tal cual y tipo, título (Title 3), «Con …», el primer renglón del costo y la portada cuadrada de 88 a la derecha', cir.hora === '19:00' && cir.badges.length === 1 && cir.badges[0][0] === 'Lectura' && cir.badges[0][1] && cir.title === 'Círculo de lectura' && cir.titleFs === '20px' && cir.meta === 'Con Nombre de prueba' && cir.costo === '$50 MXN' && cir.costoFuente === 'anuncio' && !cir.desc && cir.img.box[2] === 88 && cir.img.box[3] === 88 && cir.img.fit === 'cover' && cir.img.box[0] > cir.box[0] + cir.box[2] / 2 && aje.hora === '17:00' && !aje.meta && !aje.costo, JSON.stringify([cir, aje]).slice(0, 900));
const lumaOk = b => { let u; try { u = new URL(b.href); } catch { return false; } return b.tag === 'A' && u.protocol === 'https:' && ['lu.ma', 'luma.com'].includes(u.hostname) && b.target === '_blank' && b.rel === 'noopener noreferrer' && /^Registrarme$/.test(b.txt) && /^Registrarme en «.+» \(abre Luma en otra pestaña\)$/.test(b.name) && b.icon === '#i-ne'; };
check('eventos', '«Registrarme»: enlace normal a Luma (lu.ma o luma.com) en otra pestaña, secundario de 48, con un nombre que lo dice; a su lado, «Añadir al calendario» (icono de 48 con nombre)', [cir, aje].every(c => c.acc.length === 2 && lumaOk(c.acc[0]) && /btn--secundario/.test(c.acc[0].cls) && c.acc[0].box[3] === 48 && c.acc[0].bg === menta && c.acc[1].tag === 'BUTTON' && c.acc[1].box.slice(2).join() === '48,48' && /^Añadir «.+» al calendario$/.test(c.acc[1].name)) && cir.acc[0].href === 'https://luma.com/prueba-circulo' && aje.acc[0].href === 'https://lu.ma/prueba-ajedrez', JSON.stringify([cir.acc, aje.acc]));
check('eventos', 'sin reserva (o con una que no es de Luma: se descarta), la acción con rótulo es «Añadir al calendario»; ningún enlace a otro dominio', [seg, otro].every(c => c.acc.length === 1 && c.acc[0].tag === 'BUTTON' && c.acc[0].txt === 'Añadir al calendario' && /btn--secundario/.test(c.acc[0].cls) && c.acc[0].box[3] === 48) && !r1.links.some(h => /registro\.example/.test(h)) && r1.links.filter(h => /lu\.ma|luma\.com/.test(h)).length === 2, JSON.stringify([seg.acc, otro.acc, r1.links]));
check('eventos', 'propuesta junto a eventos con fecha: su insignia «Propuesta · sin fecha», su descripción y ninguna acción (ni reserva ni calendario)', tal.badges.map(b => b[0]).join('|') === 'Taller|Propuesta · sin fecha' && tal.descShown && tal.acc.length === 0 && !tal.hora && tal.titleTag === 'H4', JSON.stringify(tal));
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

// ---------- 3b. Café y té (#cafe): chips Café · Té y Carrusel3D variante carta (el contacto vive en el pie desde el 2026-11-13) ----------
const menu = JSON.parse(readFileSync(new URL('../../assets/data/menu.json', import.meta.url), 'utf8'));
for (const [vw, vh, mobile] of [[393, 659, true], [320, 640, true], [1280, 800, false]]) {
  await open(vw, vh, { reset: true, mobile, wait: 2500 });
  await ev(`document.querySelector('[data-cafe-c3d]').scrollIntoView({ block: 'center' })`); await sleep(1800);
  const cafe = await ev(`(() => { const q = s => document.querySelector(s); const sec = q('#cafe'); const chips = [...sec.querySelectorAll('.cafe-chip')]; const cards = [...sec.querySelectorAll('.cafe-card')]; const c = sec.querySelector('.cafe-item.is-centro .cafe-card');
    const r = e => e.getBoundingClientRect(); const foto = r(sec.querySelector('.cafe-foto')), carta = r(sec.querySelector('.c3d--carta'));
    return { ready: q('[data-cafe]').classList.contains('is-ready'), group: [sec.querySelector('[data-cafe-chips]').getAttribute('role'), sec.querySelector('[data-cafe-chips]').getAttribute('aria-label')], chips: chips.map(x => [x.textContent.trim(), x.getAttribute('role'), x.getAttribute('aria-checked'), x.tabIndex, Math.round(r(x).height)]),
      region: [q('[data-cafe-c3d]').getAttribute('role'), q('[data-cafe-c3d]').getAttribute('aria-roledescription'), q('[data-cafe-c3d]').getAttribute('aria-label')], n: cards.length, tabs: cards.filter(x => x.tabIndex === 0).length, icons: cards.filter(x => x.querySelector('.cafe-ic use')).length, imgs: sec.querySelectorAll('.cafe-card img').length,
      centro: c && { name: c.querySelector('.cafe-nombre').textContent, role: c.getAttribute('role'), desc: c.querySelector('.cafe-desc')?.textContent, shadow: getComputedStyle(c).boxShadow !== 'none', bg: getComputedStyle(c).backgroundColor, radius: getComputedStyle(c).borderRadius },
      prices: sec.querySelectorAll('.cafe-precio').length, text: sec.innerText, wa: sec.querySelectorAll('a[href*="wa.me"]').length,
      photo: { real: sec.querySelector('.cafe-foto').dataset.kind, alt: sec.querySelector('.cafe-foto img').alt, above: foto.bottom <= carta.top + 1, below: !!c && foto.top >= r(c).bottom, full: carta.width >= Math.min(1240, sec.clientWidth - 2 * parseFloat(getComputedStyle(sec).paddingLeft)) - 1 }, over: document.documentElement.scrollWidth > innerWidth,
      flechas: [...sec.querySelectorAll('.c3d-flecha')].map(b => [b.className.includes('btn--vidrio'), Math.round(r(b).width), Math.round(r(b).height)]), primary: sec.querySelectorAll('.btn--primario').length }; })()`);
  const tag = `${vw}×${vh}`;
  check('café', `${tag}: chips Café · Té en un radiogroup «Carta» (48 px, el elegido marcado y un solo tabindex=0)`, cafe.ready && cafe.group.join() === 'radiogroup,Carta' && cafe.chips.map(c => c[0]).join() === 'Café,Té' && cafe.chips.every(c => c[1] === 'radio' && c[4] === 48) && cafe.chips[0][2] === 'true' && cafe.chips.filter(c => c[3] === 0).length === 1, JSON.stringify(cafe.chips));
  check('café', `${tag}: Carrusel3D variante carta: región con rol de carrusel, ${menu.categorias[0].productos.length} tarjetas tipográficas (superficie, radio 20, icono de trazo, sin fotos de producto), la del centro con sombra y la única parada de tabulador; ${mobile ? 'con toque, sin flechas' : 'flechas de vidrio de 48'}`, cafe.region.slice(0, 2).join() === 'region,carrusel' && /Café/.test(cafe.region[2]) && cafe.n === menu.categorias[0].productos.length && cafe.icons === cafe.n && cafe.imgs === 0 && cafe.tabs === 1 && cafe.centro?.role === 'group' && cafe.centro.shadow && cafe.centro.radius === '20px' && cafe.centro.desc && cafe.flechas.length === 2 && cafe.flechas.every(f => f[0] && f[2] === (mobile ? 0 : 48)), JSON.stringify({ region: cafe.region, n: cafe.n, icons: cafe.icons, imgs: cafe.imgs, tabs: cafe.tabs, centro: cafe.centro, flechas: cafe.flechas }));
  check('café', `${tag}: sin precios (la librería no los ha dado: ni cifras ni «por confirmar»)`, cafe.prices === 0 && !/\$\s?\d|MXN|por confirmar/i.test(cafe.text), cafe.text.slice(0, 300));
  check('café', `${tag}: sin «Preguntar por la carta» ni otra consulta por WhatsApp (el contacto vive en el pie); ninguna primaria en la sección`, cafe.wa === 0 && cafe.primary === 0, JSON.stringify({ wa: cafe.wa, primary: cafe.primary }));
  check('café', `${tag}: foto real de la casa con alt; ${mobile ? 'debajo de la carta (2026-11-14: al llegar se ve la carta)' : 'arriba, a la derecha del titular, y la carta a todo el ancho debajo (A6, afinada el 2026-11-13)'}; sin desborde`, cafe.photo.real === 'real' && cafe.photo.alt.length > 20 && (mobile ? cafe.photo.below : cafe.photo.above && cafe.photo.full) && !cafe.over, JSON.stringify(cafe.photo));
  if (vw === 393) {
    await shot('05-cafe-393.jpg');
    await clickSel('.cafe-chip[data-id="te"]'); await sleep(1400);
    const te = await ev(`(() => ({ n: document.querySelectorAll('#cafe .cafe-card').length, checked: document.querySelector('.cafe-chip[aria-checked="true"]')?.dataset.id, live: document.querySelector('[data-cafe-live]').textContent, icon: document.querySelector('#cafe .cafe-ic use')?.getAttribute('href') }))()`);
    check('café', 'elegir «Té» cambia la carta (tarjetas con la tetera) y la región viva', te.checked === 'te' && te.n === menu.categorias[1].productos.length && te.icon === '#c-tetera' && /^Té: \d+ en la carta\.$/.test(te.live), JSON.stringify(te));
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
// 3 llegadas en las dos últimas semanas, 3 anteriores y una sin fecha, en desorden: la tira ordena de lo más reciente a lo más antiguo y deja al final la que no trae fecha.
const ages = [1, 3, 20, 2, 30, null, 40];
const newsOrder = [0, 3, 1, 2, 4, 6, 5].map(i => ids[i]);
const NEW7 = JSON.stringify([true, true, true, false, false, false, false]);
override = { ...realData, novedades: { titulo: 'Recién llegados', entradas: ids.map((id, i) => (ages[i] === null ? { id } : { id, llegada: dayAgo(ages[i]) })) } };
await ev(`localStorage.clear()`);
await open(393, 659, { wait: 2500 });
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
await open(393, 659, { wait: 2500 });
await approach();
const back = await newsState();
check('novedades', 'visita de regreso (vista hace 2 días): una sola llegada posterior → «1 llegó desde tu última visita», una insignia y «, 1 sin ver»', back.status === '1 llegó desde tu última visita' && JSON.stringify(back.badges.slice(0, 7)) === JSON.stringify([true, false, false, false, false, false, false]) && back.badges.filter(Boolean).length === 1 && back.dot && back.sr === ', 1 sin ver', JSON.stringify({ status: back.status, sr: back.sr }));
// Compatibilidad: la clave antigua `ids` (sin fecha) va primero en su orden y nunca lleva «Nuevo».
override = { ...realData, novedades: { titulo: 'Recién llegados', ids } };
await ev(`localStorage.clear()`);
await open(393, 659, { wait: 2500 });
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
