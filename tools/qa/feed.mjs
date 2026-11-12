// Móvil con sensación de red social (U03), Novedades (U04) y una sola acción primaria (U01/D10).
// node feed.mjs <url> [outDir]   Sale con código ≠ 0 si algo falla.
//  1. Primera vista (390x844): perfil (nombre, estado, dirección, «Cómo llegar» como única acción de contacto), sin burbujas de historias y con la barra inferior acoplada a la vista (cinco casillas con nombre); ≤ 6 destinos distintos a la vista en 390x844, 360x740 y 375x667 (U02/D11; la casilla Novedades y el control «N novedades…» llevan al mismo sitio y cuentan como uno); «Escribir» (WhatsApp) reaparece en la cabecera al desplazar.
//  3. Eventos y talleres: cada tarjeta va foto → insignias (tipo y estado) → título → frase → descripción → acciones (DOM y pantalla); «Me interesa» (aria-pressed, persistente),
//     «Compartir» (control de icono; Web Share y respaldo de copiar) y «Preguntar por WhatsApp», de ≥ 44 px y con nombre accesible propio; la tarjeta cabe en el alto útil
//     (entre cabecera y barra, con 12 px de holgura) a 320×640, 360×640, 360×740, 375×667 y 390×844; el estado sale de data-fecha.

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
  const hl = document.querySelectorAll('.hl, .hl-item, [data-story], dialog.story').length;
  const cta = q('.entry-actions a:first-child'), wa = q('.entry-actions a:last-child');
  return {
    name: q('.entry-title').getBoundingClientRect().height > 10 && q('.entry-title').textContent.trim(),
    status: q('.entry-status [data-status-text]').textContent.trim(), statusVis: vis(q('.entry-status')),
    address: /Mariano Matamoros Pte\\. 421/.test(q('.entry-facts').textContent) && vis(q('.entry-facts li:last-child')),
    avatar: vis(q('.profile-av')),
    cta: { txt: cta.innerText.trim(), cls: cta.className, h: cta.getBoundingClientRect().height, vis: vis(cta) },
    wa: { txt: wa.innerText.trim(), cls: wa.className, h: wa.getBoundingClientRect().height, vis: vis(wa) },
    hl, tab: vis(q('.tabbar')), tabTop: Math.round(q('.tabbar').getBoundingClientRect().top), ctaBottom: Math.round(cta.getBoundingClientRect().bottom),
    news: (() => { const n = q('[data-news-cta]'); const r = n.getBoundingClientRect(); return { vis: vis(n), txt: n.innerText.trim(), cls: n.className, h: Math.round(r.height), top: Math.round(r.top), bottom: Math.round(r.bottom) }; })(),
    tabItems: [...document.querySelectorAll('.tabbar a, .tab-menu')].filter(vis).map(e => { const r = e.getBoundingClientRect(); const l = e.querySelector('.tab-lb'); const lr = l.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), l.firstChild.textContent.trim(), lr.height > 8 && lr.width > 8 && lr.left >= r.left && lr.right <= r.right && getComputedStyle(l).clipPath === 'none', e.querySelector('svg use').getAttribute('href')]; }),
    barBox: (() => { const r = q('.tabbar').getBoundingClientRect(); const cs = getComputedStyle(q('.tabbar')); return [Math.round(r.left), Math.round(innerWidth - r.right), Math.round(innerHeight - r.bottom), cs.borderTopWidth, cs.backgroundColor, cs.boxShadow, cs.borderTopLeftRadius]; })(), brandHidden: !vis(q('.hdr-brand')),
    dests: [...new Set(act.map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))],
    actions: act.map(e => (e.className || e.tagName) + ':' + e.textContent.trim().slice(0, 20))
  };
})()`);
await shot('01-perfil-390x844.jpg');
check('perfil', 'nombre, estado de hoy, dirección y avatar visibles', first.name && /Itinerante/.test(first.name) && first.statusVis && /Abierto|Cerrad|Cierra/.test(first.status) && first.address && first.avatar, JSON.stringify(first).slice(0, 400));
check('perfil', '«Cómo llegar» primaria de ≥ 44 px y «Escribir» fuera de la primera vista (D11)', first.cta.vis && /^Cómo llegar/.test(first.cta.txt) && /btn--tungsten/.test(first.cta.cls) && first.cta.h >= 44 && !first.wa.vis && !first.actions.some(a => /Escribir|Pregunta por un libro/.test(a)), JSON.stringify([first.cta, first.wa]));
check('primera vista', 'sin burbujas de historias: ni destacados ni visor', first.hl === 0, String(first.hl));
const lastBottom = first.news.vis ? first.news.bottom : first.ctaBottom;
check('barra inferior', 'a la vista desde la primera pantalla y acoplada: de borde a borde, pegada al fondo, blanca, con borde superior de 2 px, sin radio ni sombra', first.tab && first.barBox[0] === 0 && first.barBox[1] === 0 && first.barBox[2] === 0 && first.barBox[3] === '2px' && first.barBox[4] === 'rgb(255, 255, 255)' && first.barBox[5] === 'none' && first.barBox[6] === '0px', JSON.stringify(first.barBox));
check('barra inferior', 'no tapa «Cómo llegar» ni el control de novedades (≥ 8 px de aire)', first.tabTop >= lastBottom + 8, JSON.stringify([first.tabTop, first.ctaBottom, first.news]));
check('barra inferior', 'cinco casillas iguales de ≥ 48 px con icono propio y nombre a la vista: Inicio, Catálogo, Eventos, Novedades y Más', first.tabItems.length === 5 && first.tabItems.every(t => t[0] >= 48 && t[1] >= 48 && t[0] === first.tabItems[0][0] && t[3]) && first.tabItems.map(t => t[2]).join('|') === 'Inicio|Catálogo|Eventos|Novedades|Más' && new Set(first.tabItems.map(t => t[4])).size === 5, JSON.stringify(first.tabItems));
check('inicio', 'control de novedades bajo «Cómo llegar»: secundario (no primaria), táctil (≥ 48 px) y con el conteo en su texto', first.news.vis && first.news.top >= first.ctaBottom && first.news.h >= 48 && !/tungsten/.test(first.news.cls) && /^\d+ novedad(es)? recientes?$/.test(first.news.txt), JSON.stringify(first.news));
check('primera vista', `destinos distintos en la primera vista (${first.dests.length} ≤ 6; ${first.actions.length} controles: «Cómo llegar», la barra y el control de novedades, que repite el destino de su casilla); la marca espera al desplazamiento`, first.tab && first.brandHidden && first.dests.length <= 6 && first.actions.length <= 7, JSON.stringify(first.actions));
for (const [vw, vh] of [[360, 740], [375, 667]]) {
  await open(vw, vh, { reset: true });
  const n = await ev(`[...new Set([...document.querySelectorAll('a[href], button')].filter(e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && r.bottom > 0 && r.top < innerHeight && cs.visibility !== 'hidden' && cs.display !== 'none' && !e.closest('[aria-hidden="true"], [hidden], [inert]'); }).map(e => e.getAttribute('href') || e.getAttribute('aria-controls') || e.className))]`);
  check('primera vista', `${vw}x${vh}: ${n.length} destinos distintos a la vista (≤ 6)`, n.length <= 6, JSON.stringify(n));
}
await open(390, 844, { reset: true });
await ev(`scrollTo(0, 700)`); await sleep(700);
const hdrWa = await ev(`(()=>{ const a = document.querySelector('.hdr-wa'); const r = a.getBoundingClientRect(); const cs = getComputedStyle(a); return { vis: r.width > 0 && cs.visibility !== 'hidden' && +cs.opacity > 0.9, w: r.width, href: a.href }; })()`);
check('perfil', 'al desplazar, WhatsApp está en la cabecera (≥ 44 px)', hdrWa.vis && hdrWa.w >= 44 && /wa\.me\/528180875940/.test(hdrWa.href), JSON.stringify(hdrWa));
await open(390, 844, { reset: true });
check('consola', 'sin errores de consola en la primera vista', !problems.length, problems.join(' | '));

// ---------- 3. Cartelera como publicaciones ----------
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(600); // fuera de pantalla, content-visibility omite el texto (innerText vacío)
const posts = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s); const i = q('[data-interest]'), s = q('[data-share]');
  const rect = e => { const r = e.getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; };
  const wa = q('.bill-wa'); const badges = [...it.querySelectorAll('.bill-badges .badge')]; const img = q('.bill-card-img').getBoundingClientRect();
  return { id: it.dataset.id, photo: !!q('.bill-card-img'), alt: q('.bill-card-img').alt, ratio: +(img.width / img.height).toFixed(2), badges: badges.map(b => b.textContent.trim()), onPhoto: badges.every(b => { const r = b.getBoundingClientRect(); return r.top >= img.top && r.bottom <= img.bottom && r.left >= img.left && r.right <= img.right; }), badgeFs: badges.map(b => getComputedStyle(b).fontSize).join(),
    title: q('.bill-title')?.textContent, interest: i && rect(i), share: s && rect(s), wa: wa && rect(wa), waTxt: wa?.innerText.trim(), waHref: wa?.href, pressed: i?.getAttribute('aria-pressed'), iTxt: i?.textContent.trim(), sTxt: s?.textContent.trim(), sIcon: !!s?.querySelector('svg'), sRound: getComputedStyle(s).borderRadius, row: Math.abs(i.getBoundingClientRect().top - s.getBoundingClientRect().top) < 2, waBelow: wa.getBoundingClientRect().top >= i.getBoundingClientRect().bottom }; })`);
const TIPOS = { circulo: 'Lectura', ajedrez: 'Juego', taller: 'Taller' };
check('eventos', '3 tarjetas con foto 4:3 descrita, título y dos insignias sobre la foto: el tipo (Lectura, Juego, Taller) y «Propuesta · sin fecha»', posts.length === 3 && posts.every(p => p.photo && p.alt && !/Recreación IA|Foto real/.test(p.alt) && Math.abs(p.ratio - 1.33) < 0.03 && p.title && p.badges.length === 2 && p.badges[0] === TIPOS[p.id] && p.badges[1] === 'Propuesta · sin fecha' && p.onPhoto && p.badgeFs === '12px,12px'), JSON.stringify(posts.map(p => [p.id, p.alt, p.ratio, p.badges, p.onPhoto, p.badgeFs])));
check('eventos', 'tres acciones de ≥ 44 px: «Me interesa» y «Compartir» (control de icono redondo) en un renglón y «Preguntar por WhatsApp» debajo, con su mensaje', posts.every(p => p.iTxt === 'Me interesa' && p.sTxt === '' && p.sIcon && p.sRound === '50%' && p.interest[1] >= 44 && p.interest[0] >= 44 && p.share[1] >= 44 && p.share[0] >= 44 && p.pressed === 'false' && p.row && p.waBelow && p.waTxt === 'Preguntar por WhatsApp' && p.wa[1] >= 44 && /wa\.me\/528180875940\?text=Hola/.test(p.waHref)), JSON.stringify(posts.map(p => [p.id, p.iTxt, p.sTxt, p.interest, p.share, p.wa, p.waTxt, p.row, p.waBelow])));
// Tarjeta de evento: foto → insignias → título → frase → descripción → acciones, tanto en el DOM como en la pantalla; el título está una sola vez y ya no hay encabezado de red social.
const order = await ev(`[...document.querySelectorAll('.bill-item')].map(it => { const q = s => it.querySelector(s); const els = ['.bill-card-img', '.bill-badges', '.bill-title', '.bill-sub', '.bill-detail > p', '.bill-acts'].map(q);
  const dom = els.every((e, i) => e && (i === 0 || (els[i - 1].compareDocumentPosition(e) & Node.DOCUMENT_POSITION_FOLLOWING)));
  const tops = els.map(e => e ? Math.round(e.getBoundingClientRect().top) : null); const vis = tops.every((t, i) => t !== null && (i === 0 || t >= tops[i - 1]));
  return { id: it.dataset.id, dom, vis, tops, head: it.querySelectorAll('.bill-post-head, .bill-post-who, .bill-cap').length, once: [...it.querySelectorAll('.bill-title')].filter(e => e.getBoundingClientRect().height > 0).length, titles: it.querySelectorAll('.bill-title').length }; })`);
check('eventos', 'orden del DOM y de la pantalla: foto → insignias → título → frase → descripción → acciones; sin encabezado «Itinerante · propuesta»; el título está y se ve una sola vez', order.length === 3 && order.every(o => o.dom && o.vis && o.head === 0 && o.once === 1 && o.titles === 1), JSON.stringify(order));
// Nombres accesibles (árbol de accesibilidad del navegador): cada «Compartir», «Me interesa» y «Preguntar por WhatsApp» lleva el título de su propuesta.
await ev(`document.querySelector('#cartelera').scrollIntoView()`); await sleep(600); // Eventos ya no queda junto al inicio: el árbol de accesibilidad se lee con el capítulo a la vista (fuera de pantalla, content-visibility lo omite)
await send('Accessibility.enable');
const axNodes = (await send('Accessibility.getFullAXTree')).result.nodes;
const ax = axNodes.filter(n => n.role?.value === 'button' && /^(Compartir|Me interesa)/.test(n.name?.value || '')).map(n => n.name.value);
const shareNames = ax.filter(n => n.startsWith('Compartir')), likeNames = ax.filter(n => n.startsWith('Me interesa'));
const waNames = axNodes.filter(n => n.role?.value === 'link' && /^Preguntar por WhatsApp/.test(n.name?.value || '')).map(n => n.name.value);
check('eventos', 'árbol de accesibilidad: 3 «Compartir» con nombres distintos que llevan el título (y 3 «Me interesa» y 3 «Preguntar por WhatsApp» igual)', shareNames.length === 3 && new Set(shareNames).size === 3 && shareNames.every(n => /^Compartir «.+»$/.test(n)) && likeNames.length === 3 && new Set(likeNames).size === 3 && waNames.length === 3 && new Set(waNames).size === 3 && waNames.every(n => /^Preguntar por WhatsApp: .+/.test(n)), JSON.stringify([...ax, ...waNames]));
// Estado de la propuesta: sale de data-fecha (hora de Monterrey); sin atributo, «Propuesta · sin fecha».
const when = await ev(`(async () => { const m = await import(new URL('feed.js', document.baseURI).href); const it = document.querySelector('.bill-item'); const b = it.querySelector('[data-bill-when]'); const read = () => ({ text: b.textContent, quiet: b.classList.contains('badge--quiet') });
  const out = { base: read() }; it.dataset.fecha = '2099-05-02'; m.initFeed(); out.fecha = read(); it.dataset.fecha = '2099-05-02T18:30'; m.initFeed(); out.hora = read(); it.dataset.fecha = '2001-01-01'; m.initFeed(); out.pasada = read(); delete it.dataset.fecha; m.initFeed(); out.sin = read(); return out; })()`);
check('eventos', 'la insignia de estado sale de data-fecha: fecha vigente en español («Sáb 2 may 2099», con hora si la trae) en la insignia común; sin atributo o con fecha pasada, «Propuesta · sin fecha»', when && when.base.text === 'Propuesta · sin fecha' && when.base.quiet && when.fecha.text === 'Sáb 2 may 2099' && !when.fecha.quiet && when.hora.text === 'Sáb 2 may 2099 · 18:30' && when.pasada.text === 'Propuesta · sin fecha' && when.pasada.quiet && when.sin.text === 'Propuesta · sin fecha' && when.sin.quiet, JSON.stringify(when));
// La tarjeta cabe en el alto útil: entre la cabecera y la barra inferior (--tabbar-h), con 12 px de holgura, desde 320×640.
for (const [vw, vh] of [[320, 640], [360, 640], [360, 740], [375, 667], [390, 844]]) {
  await open(vw, vh, { reset: true, wait: 2500 });
  await ev(`document.querySelector('.bill-track').scrollIntoView({ block: 'center' })`); await sleep(900);
  const fit = await ev(`(() => { const cs = getComputedStyle(document.documentElement); const hdr = parseFloat(cs.getPropertyValue('--hdr-h')), tab = parseFloat(cs.getPropertyValue('--tabbar-h')); const cards = [...document.querySelectorAll('.bill-item')].map(c => Math.round(c.getBoundingClientRect().height));
    const c = document.querySelector('.bill-item'); const acts = c.querySelector('.bill-acts').getBoundingClientRect(), box = c.getBoundingClientRect();
    return { util: innerHeight - hdr - tab, cards, actsInside: acts.bottom <= box.bottom, cut: [...c.querySelectorAll('.bill-title, .bill-sub, .bill-detail > p, .bill-acts > *')].filter(e => e.scrollWidth > e.clientWidth + 1).length, over: document.documentElement.scrollWidth > innerWidth }; })()`);
  const tallest = Math.max(...fit.cards);
  check('eventos', `${vw}×${vh}: la tarjeta (${tallest} px) cabe en el alto útil (${fit.util} px) con ≥ 12 px de holgura (${(tallest / fit.util).toFixed(2)}×), sin texto cortado`, tallest <= fit.util - 12 && fit.actsInside && fit.cut === 0 && !fit.over, JSON.stringify(fit));
}
await open(390, 844, { reset: true });
await ev(`localStorage.clear()`);
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
check('verdad', 'sin contadores, reseñas, precios ni fechas inventadas en perfil y publicaciones', !/(\\d+\\s*(me gusta|likes?|seguidores|reseñas|opiniones|vistas))|★|\\$\\s?\\d|\\bmás leídos\\b|\\bagotad/i.test(feedText || ''), feedText);

// ---------- 4. Novedades ----------
const sample = JSON.parse(readFileSync(new URL('../../assets/data/catalog.json', import.meta.url), 'utf8')).books;
const realData = JSON.parse(readFileSync(new URL('../../assets/data/collections.json', import.meta.url), 'utf8'));
// Fechas relativas a hoy (fecha local, como en news.js): la comprobación no caduca con el calendario.
const dayAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const newsState = () => ev(`(()=>{ const s = document.querySelector('#novedades'); const links = [...document.querySelectorAll('[data-news-link]')]; const r = s.getBoundingClientRect();
  const shown = e => { const b = e.getBoundingClientRect(); return (b.width > 0 || b.height > 0) && getComputedStyle(e).visibility !== 'hidden'; };
  const cta = document.querySelector('[data-news-cta]'), dot = document.querySelector('[data-news-dot]');
  return { hidden: s.hidden, display: getComputedStyle(s).display, h: Math.round(r.height), cards: s.querySelectorAll('.rail-item:not(.card--sk)').length, links: links.map(l => ({ hidden: l.hidden, w: Math.round(l.getBoundingClientRect().width) })),
    visibleNodes: [s, ...links, ...s.querySelectorAll('*')].filter(shown).length, tabs: [...document.querySelectorAll('.tabbar a, .tab-menu')].filter(shown).map(t => t.querySelector('.tab-lb').firstChild.textContent.trim()),
    dot: shown(dot), sr: document.querySelector('[data-news-sr]').textContent, cta: shown(cta) ? cta.innerText.trim() : null, hasNews: document.documentElement.classList.contains('has-news'),
    status: s.querySelector('[data-news-status]').textContent, badges: [...s.querySelectorAll('.card')].map(c => !!c.querySelector('.badge-new')), names: [...s.querySelectorAll('.card')].slice(0, 2).map(c => c.textContent.trim().slice(0, 12)),
    ids: [...s.querySelectorAll('.card')].map(c => c.dataset.id), title: s.querySelector('h2').textContent.trim(), text: s.innerText, seen: localStorage.getItem('iti-news-visto'), state: localStorage.getItem('iti-news-estado') }; })()`);
const approach = async () => { await ev(`document.querySelector('#cartelera').scrollIntoView({ block: 'end' })`); await sleep(2500); }; // la tira se pinta (y comprueba los ids contra el catálogo) al acercarse
for (const [label, data] of [['sin la clave', { ...realData, novedades: undefined }], ['con entradas vacías', { ...realData, novedades: { titulo: 'Recién llegados', entradas: [] } }], ['con ids que no existen', { ...realData, novedades: { entradas: [{ id: 'no-existe-1', llegada: dayAgo(1) }, { id: 'no-existe-2', llegada: dayAgo(2) }] } }], ['con entradas que aún no llegan', { ...realData, novedades: { entradas: [{ id: sample[3].id, llegada: dayAgo(-5) }] } }]]) {
  override = data;
  await ev(`localStorage.clear()`);
  await open(390, 844, { wait: 2500 });
  await approach();
  await ev(`scrollTo(0, 0)`); await sleep(500);
  const st = await newsState();
  check('novedades', `${label}: no quedan sección, casilla (cuatro casillas), enlaces, punto ni control; ningún nodo visible ni espacio vertical`, st.hidden && st.display === 'none' && st.h === 0 && st.cards === 0 && st.links.every(l => l.hidden && l.w === 0) && st.visibleNodes === 0 && st.tabs.join('|') === 'Inicio|Catálogo|Eventos|Más' && !st.dot && st.cta === null && !st.hasNews && st.state === 'n', JSON.stringify(st).slice(0, 600));
}
const ids = sample.slice(10, 17).map(b => b.id);
// 3 llegadas en las dos últimas semanas, 3 anteriores y una sin fecha, en desorden: la tira ordena de lo más reciente a lo más antiguo y deja al final la que no trae fecha.
const ages = [1, 3, 20, 2, 30, null, 40];
const newsOrder = [0, 3, 1, 2, 4, 6, 5].map(i => ids[i]);
override = { ...realData, novedades: { titulo: 'Recién llegados', entradas: ids.map((id, i) => (ages[i] === null ? { id } : { id, llegada: dayAgo(ages[i]) })) } };
await ev(`localStorage.clear()`);
await open(390, 844, { wait: 2500 });
const early = await newsState();
check('novedades', 'primera visita, antes de acercarse a la sección: punto en la casilla (con «, 3 sin ver» para lectores) y control «3 novedades recientes» en el inicio', early.dot && early.sr === ', 3 sin ver' && early.cta === '3 novedades recientes' && early.tabs.join('|') === 'Inicio|Catálogo|Eventos|Novedades|Más' && early.cards === 0, JSON.stringify({ dot: early.dot, sr: early.sr, cta: early.cta, tabs: early.tabs, cards: early.cards }));
await approach();
const withData = await newsState();
check('novedades', 'con entradas se pinta la tira, lo más reciente primero (sin fecha al final), con titular «Novedades» y «3 llegaron en las últimas dos semanas»', !withData.hidden && withData.cards === ids.length && JSON.stringify(withData.ids) === JSON.stringify(newsOrder) && withData.title === 'Novedades' && withData.status === '3 llegaron en las últimas dos semanas' && withData.links.every(l => !l.hidden), JSON.stringify(withData).slice(0, 600));
check('novedades', '«Nuevo» solo en las tres llegadas recientes, dentro del botón de la tarjeta (entra en su nombre accesible)', JSON.stringify(withData.badges) === JSON.stringify([true, true, true, false, false, false, false]) && withData.names.every(n => /^Nuevo/.test(n)), JSON.stringify([withData.badges, withData.names]));
check('novedades', 'sin aviso de muestra, sin ranking y sin fechas impresas (la fecha de llegada solo ordena y decide «Nuevo»)', !/Datos de muestra|no es inventario|más leídos|más vendid/i.test(withData.text) && !/\d{4}-\d{2}-\d{2}|\d{1,2} de (enero|febrero|marzo|abril|mayo|junio|julio|agosto|septiembre|octubre|noviembre|diciembre)|hace \d+ días/i.test(withData.text), withData.text.slice(0, 300));
await ev(`document.querySelector('#novedades').scrollIntoView()`); await sleep(600);
await shot('04-novedades.jpg');
const cardBox = await ev(`(()=>{ const s = document.querySelector('#novedades'); const c = s.querySelector('.card'), sv = s.querySelector('.save'), b = s.querySelector('.badge-new'); const cs = getComputedStyle(b); return { card: Math.round(c.getBoundingClientRect().width), save: [Math.round(sv.getBoundingClientRect().width), Math.round(sv.getBoundingClientRect().height)], badge: [cs.backgroundColor, cs.color, cs.fontSize], popup: c.getAttribute('aria-haspopup') }; })()`);
check('novedades', 'la misma tarjeta del carrusel (portada que abre la ficha, guardar de ≥ 44 px) e insignia en turquesa profundo con texto blanco', cardBox.card >= 134 && cardBox.save[0] >= 44 && cardBox.save[1] >= 44 && cardBox.popup === 'dialog' && cardBox.badge[0] === 'rgb(23, 107, 98)' && cardBox.badge[1] === 'rgb(255, 255, 255)' && cardBox.badge[2] === '12px', JSON.stringify(cardBox));
await sleep(1600);
const looking = await newsState();
check('novedades', '«visto» se guarda con la sección en pantalla; mientras se mira, las insignias y el punto siguen', looking.seen === dayAgo(0) && looking.badges.filter(Boolean).length === 3 && looking.dot, JSON.stringify({ seen: looking.seen, badges: looking.badges, dot: looking.dot }));
await ev(`scrollTo(0, 0)`); await sleep(900);
const left = await newsState();
check('novedades', 'al salir de la sección se retiran insignias, punto y control, y la cabecera pasa a «Ya viste todo lo que ha llegado»', left.badges.every(b => !b) && !left.dot && left.sr === '' && left.cta === null && left.status === 'Ya viste todo lo que ha llegado' && left.state === 's', JSON.stringify({ badges: left.badges, dot: left.dot, cta: left.cta, status: left.status, state: left.state }));
// Visita de regreso: solo cuenta lo que llegó después de la última vez que se vio la sección.
await ev(`localStorage.setItem('iti-news-visto', '${dayAgo(2)}')`);
await open(390, 844, { wait: 2500 });
await approach();
const back = await newsState();
check('novedades', 'visita de regreso (vista hace 2 días): una sola llegada posterior → «1 llegó desde tu última visita», una insignia y «, 1 sin ver»', back.status === '1 llegó desde tu última visita' && JSON.stringify(back.badges) === JSON.stringify([true, false, false, false, false, false, false]) && back.dot && back.sr === ', 1 sin ver', JSON.stringify({ status: back.status, badges: back.badges, sr: back.sr }));
// Compatibilidad: la clave antigua `ids` (sin fecha) se pinta en su orden y nunca lleva «Nuevo».
override = { ...realData, novedades: { titulo: 'Recién llegados', ids } };
await ev(`localStorage.clear()`);
await open(390, 844, { wait: 2500 });
await approach();
const undated = await newsState();
check('novedades', 'sin fecha de llegada (clave antigua `ids`) no aparece «Nuevo», ni punto ni control', undated.cards === ids.length && JSON.stringify(undated.ids) === JSON.stringify(ids) && undated.badges.every(b => !b) && !undated.dot && undated.cta === null, JSON.stringify({ cards: undated.cards, badges: undated.badges, dot: undated.dot, cta: undated.cta }));
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
