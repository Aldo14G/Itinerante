// Auditoría E2E con Chromium (CDP) de la hoja «Más», tonos, barra inferior, eventos, catálogo, movimiento reducido, desbordes y rendimiento.
// node e2e.mjs <url> <outDir>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2] || 'http://127.0.0.1:8105/';
const out = process.argv[3] || '.';
mkdirSync(out, { recursive: true });
const port = 9400 + Math.floor(Math.random() * 60); // puerto al azar: dos corridas a la vez (agentes en paralelo) ya no chocan
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-e2e-'))}`, '--hide-scrollbars', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets;
for (let i = 0; i < 40; i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (targets.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); let problems = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Log.entryAdded' && ['error'].includes(m.params.entry.level)) problems.push(`LOG error: ${m.params.entry.text} ${m.params.entry.url || ''}`);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) problems.push('EVAL ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result?.result?.value; };
const shot = async n => writeFileSync(join(out, n), Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 })).result.data, 'base64'));
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');

const report = []; // { area, name, ok, detail }
const check = (area, name, ok, detail = '') => report.push({ area, name, ok: !!ok, detail: ok ? '' : String(detail) });

async function open(width, height, { mobile = true, reduced = false } = {}) {
  problems = [];
  await send('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: 2, mobile });
  if (mobile) await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 }); else await send('Emulation.setTouchEmulationEnabled', { enabled: false });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await send('Page.navigate', { url: URL_ });
  await sleep(3500);
}

// Un elemento recortado por un antepasado con overflow hidden/clip que sí cabe en la ventana (la IMG escalada 1.22 dentro de .frame-clip al revelarse) no desborda nada.
const overflow = () => ev(`(()=>{const d=document.documentElement; const clipped=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowX; if((o==='hidden'||o==='clip')&&p.getBoundingClientRect().right<=d.clientWidth+1) return true;} return false;}; return {sw:d.scrollWidth, cw:d.clientWidth, wide:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && r.right>d.clientWidth+1 && getComputedStyle(e).position!=='absolute' && !clipped(e) && !e.closest('.bill-track, .rail-chips, .rail-viewport, .topics, .house-track, .marquee, .entry-media, .ftr, .wipe, dialog, .tabbar')}).slice(0,4).map(e=>(e.className||e.tagName)+' <'+(e.parentElement&&e.parentElement.className)+'>')}})()`);

// ---------- 1. Desbordes en varios anchos ----------
for (const [w, h, mobile] of [[360, 740, true], [390, 844, true], [414, 896, true], [768, 1024, true], [1280, 800, false], [1920, 1080, false]]) {
  await open(w, h, { mobile });
  const o = await overflow();
  check('layout', `sin desborde horizontal a ${w}px`, o.sw <= o.cw && !o.wide.length, JSON.stringify(o));
  check('consola', `sin errores de consola a ${w}px`, !problems.length, problems.join(' | '));
}

// ---------- 2. Hoja «Más» (móvil) ----------
for (const w of [360, 390]) {
  await open(w, 800);
  const A = 'hoja Más ' + w;
  const btn = await ev(`(()=>{const b=document.querySelector('[data-menu-open]'); const r=b.getBoundingClientRect(); return {shown:getComputedStyle(b).display!=='none', w:r.width, h:r.height, exp:b.getAttribute('aria-expanded'), ctl:b.getAttribute('aria-controls'), target:!!document.getElementById(b.getAttribute('aria-controls')), label:b.getAttribute('aria-label') || b.querySelector('.tab-lb').textContent.trim()}})()`);
  check(A, 'casilla «Más» en la barra inferior, visible, ≥48px, con nombre y aria-controls a un elemento real', btn.shown && btn.w >= 48 && btn.h >= 48 && btn.exp === 'false' && btn.ctl === 'sheet-menu' && btn.target && btn.label === 'Más', JSON.stringify(btn));
  const desktopMenuHidden = await ev(`getComputedStyle(document.querySelector('.menu-btn')).display==='none'`);
  check(A, 'botón de escritorio oculto en móvil', desktopMenuHidden);
  await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(700);
  const s1 = await ev(`(()=>{const d=document.querySelector('#sheet-menu'); const r=d.getBoundingClientRect(); return {open:d.open, x:Math.round(r.x), w:Math.round(r.width), vw:innerWidth, active:document.activeElement.className, sheet:document.documentElement.classList.contains('sheet-open'), lock:getComputedStyle(document.documentElement).overflow, exp:document.querySelector('[data-menu-open]').getAttribute('aria-expanded'), tabbarHidden:document.querySelector('.tabbar').getBoundingClientRect().top>=innerHeight-1, modal:d.matches(':modal'), label:d.getAttribute('aria-labelledby'), title:document.getElementById(d.getAttribute('aria-labelledby'))?.textContent}})()`);
  check(A, 'abre como modal titulado «Más», foco en cierre, scroll bloqueado, barra inferior oculta', s1.open && s1.modal && s1.x === 0 && /sm-close/.test(s1.active) && s1.sheet && s1.lock === 'hidden' && s1.exp === 'true' && s1.tabbarHidden && s1.title === 'Más', JSON.stringify(s1));
  check(A, 'ancho del panel ≤ 88vw y ≤360', s1.w <= Math.min(s1.vw * 0.88 + 1, 361), s1.w);
  const rows = await ev(`[...document.querySelectorAll('#sheet-menu .sm-row')].map(r=>[r.querySelector('.sm-lb').firstChild.textContent.trim(), Math.round(r.getBoundingClientRect().height)])`);
  check(A, 'todas las filas ≥48px (4: Mi lista, Buscar en el catálogo, La casa y Visita; lo que ya está en la barra no se repite)', rows.every(r => r[1] >= 48) && rows.map(r => r[0]).join('|') === 'Mi lista|Buscar en el catálogo|La casa|Visita', JSON.stringify(rows));
  const chips = await ev(`[...document.querySelectorAll('#sheet-menu .sm-link')].map(r=>[r.textContent.trim(), Math.round(r.getBoundingClientRect().height), Math.round(r.getBoundingClientRect().width)])`);
  check(A, 'redes como chips ≥44px', chips.length === 2 && chips.every(c => c[1] >= 44 && c[2] >= 44), JSON.stringify(chips));
  // sin acordeones: nada plegado ni inerte dentro de la hoja; cada destino interno existe y es visible
  const flatSheet = await ev(`(()=>{const d=document.querySelector('#sheet-menu'); return {expand:d.querySelectorAll('[aria-expanded]').length, inert:d.querySelectorAll('[inert]').length, dead:[...d.querySelectorAll('a[href^="#"]')].filter(a=>{const t=document.querySelector(a.getAttribute('href')); return !t || !t.getClientRects().length}).map(a=>a.getAttribute('href'))}})()`);
  check(A, 'sin acordeones ni contenido plegado; los destinos internos existen', flatSheet.expand === 0 && flatSheet.inert === 0 && !flatSheet.dead.length, JSON.stringify(flatSheet));
  const reveal = await ev(`(()=>{const nav=document.querySelector('#sheet-menu .sm-nav'); const more=nav.scrollTop+nav.clientHeight<nav.scrollHeight-2; const last=[...nav.querySelectorAll('a, button')].at(-1); last.scrollIntoView({block:'nearest'}); const n=nav.getBoundingClientRect(), l=last.getBoundingClientRect(); const out={more, cue:nav.dataset.more, mask:getComputedStyle(nav).maskImage, lastIn:l.top>=n.top-1&&l.bottom<=n.bottom+1}; nav.scrollTop=0; return out})()`);
  check(A, 'si la lista no cabe, su pie se funde como pista y el último destino se alcanza desplazando', reveal.lastIn && (!reveal.more || (reveal.cue === '1' && /gradient/.test(reveal.mask))), JSON.stringify(reveal));
  // Tab no escapa del diálogo
  await ev(`document.querySelector('.sm-close').focus()`);
  let escaped = false;
  for (let i = 0; i < 24; i++) { await key('Tab', 'Tab', 9); const inside = await ev(`(()=>{const a=document.activeElement; return a===document.body || document.querySelector('#sheet-menu').contains(a)})()`); if (!inside) { escaped = true; break; } }
  check(A, 'el foco no escapa con Tab (trampa modal)', !escaped);
  // Escape
  await key('Escape', 'Escape', 27); await sleep(500);
  const s2 = await ev(`({open:document.querySelector('#sheet-menu').open, focus:document.activeElement.className, sheet:document.documentElement.classList.contains('sheet-open'), exp:document.querySelector('[data-menu-open]').getAttribute('aria-expanded')})`);
  check(A, 'Escape cierra y devuelve el foco a «Más»', !s2.open && /tab-menu/.test(s2.focus) && !s2.sheet && s2.exp === 'false', JSON.stringify(s2));
  // navegación a La casa
  await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(600);
  await ev(`document.querySelector('#sheet-menu a[href="#casa"]').click()`); await sleep(2200);
  const nav = await ev(`({closed:!document.querySelector('#sheet-menu').open, top:Math.round(document.querySelector('#casa').getBoundingClientRect().top) + 0, y:scrollY, hash:location.hash, cur:[...document.querySelectorAll('.tabbar a[aria-current]')].map(a=>a.getAttribute('href'))})`);
  const foc = await ev(`document.activeElement.closest('section')?.id + ':' + document.activeElement.tagName`);
  check(A, 'tras navegar el foco va al título de la sección destino', foc === 'casa:H2', foc);
  check(A, 'La casa cierra la hoja, navega (título a la vista) y la barra marca Inicio', nav.closed && Math.abs(nav.top) <= 100 && nav.y > 500 && nav.hash === '#casa' && nav.cur.join() === '#inicio', JSON.stringify(nav));
  // navegación a Visita: la barra no marca ninguna casilla
  await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(600);
  await ev(`document.querySelector('#sheet-menu a[href="#visita"]').click()`); await sleep(2600);
  const vis = await ev(`({closed:!document.querySelector('#sheet-menu').open, top:Math.round(document.querySelector('#visita').getBoundingClientRect().top) + 0, focus:document.activeElement.id, cur:[...document.querySelectorAll('.tabbar [aria-current]')].length})`);
  check(A, 'Visita cierra la hoja, navega (foco en su titular) y ninguna casilla queda marcada', vis.closed && Math.abs(vis.top) <= 100 && vis.focus === 'visit-title' && vis.cur === 0, JSON.stringify(vis));
  // horarios: contenido real, a la vista sin desplegar nada
  await ev(`document.querySelector('[data-menu-open]').click()`);
  for (let i = 0; i < 20 && !(await ev(`document.getElementById('sheet-menu').open`)); i++) await sleep(150); // se espera por condición (con la máquina cargada 600 ms no siempre bastan)
  await sleep(600);
  const hrs = (await ev(`(()=>{const c=document.querySelector('#sheet-menu .sm-card'); return {open:document.getElementById('sheet-menu').open, text:c.innerText, shown:c.querySelector('.sm-hours').getBoundingClientRect().height>0, status:c.querySelector('[data-status-long]').textContent}})()`)) || { error: problems.slice(-2).join(' | ') || 'sin valor' };
  check(A, 'Visita trae a la vista el estado de hoy y los horarios: lunes–sábado 11:00–20:00 y domingo cerrado', hrs.shown && /11:00.{0,3}20:00/.test(hrs.text) && /Domingo\s*Cerrado/.test(hrs.text) && /Abierto|Cerrado|Lunes/.test(hrs.status), JSON.stringify(hrs));
  // clic en el fondo
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: w - 8, y: 400, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: w - 8, y: 400, button: 'left', clickCount: 1 }); await sleep(500);
  check(A, 'clic en el fondo cierra', await ev(`!document.querySelector('#sheet-menu').open`));
  // WhatsApp / enlaces externos seguros
  const ext = await ev(`[...document.querySelectorAll('#sheet-menu a[target=_blank]')].map(a=>[a.rel, a.href.slice(0,40)])`);
  check(A, 'enlaces externos con noopener noreferrer', ext.length >= 3 && ext.every(e => /noopener/.test(e[0]) && /noreferrer/.test(e[0])), JSON.stringify(ext));
  check(A, 'sin errores de consola durante la hoja', !problems.length, problems.join(' | '));
}

// ---------- 3. Tonos ----------
for (const [w, h, mobile, tag] of [[390, 844, true, 'móvil'], [1280, 800, false, 'escritorio']]) {
  await open(w, h, { mobile });
  const t = await ev(`(()=>{const lum=c=>{const [r,g,b]=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4); return 0.2126*r+0.7152*g+0.0722*b}; const ratio=(a,b)=>{const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}; const out={}; for (const [sel,tone] of [['#inicio','light'],['.manifesto','light'],['#casa','mist'],['#libros','light'],['#catalogo','light'],['#novedades','mist'],['.quote','light'],['.call','light'],['.ftr','deep']]) { const s=document.querySelector(sel); const cs=getComputedStyle(s); out[sel]={tone:s.dataset.tone===tone, bg:cs.backgroundColor, fg:cs.color, ratio:+ratio(cs.color,cs.backgroundColor).toFixed(1)}; } return out})()`);
  for (const [sel, v] of Object.entries(t)) check('tonos ' + tag, `${sel}: tono (light|mist|deep) y contraste ≥7`, v.tone && v.ratio >= 7, JSON.stringify(v));
  // Solo el tono profundo (deep: el pie) puede ser oscuro; cualquier otra franja oscura es un resto del sistema anterior.
  const darkBands = await ev(`[...document.querySelectorAll('main > *:not(.wipe), footer')].filter(s=>{const m=getComputedStyle(s).backgroundColor.match(/[\\d.]+/g).map(Number); return s.dataset.tone!=='deep' && s.getBoundingClientRect().height>40 && (m[0]+m[1]+m[2])/3<60}).map(s=>s.id||s.className)`);
  check('tonos ' + tag, 'sin franjas oscuras fuera del tono profundo (deep)', !darkBands.length, JSON.stringify(darkBands));
  // Capítulos vecinos: el fondo pintado cambia entre La casa, Catálogo, Eventos, Novedades y el cierre (ninguno queda pegado a otro igual).
  const fills = await ev(`['#casa','#libros','#cartelera','#novedades','.quote'].map(s=>getComputedStyle(document.querySelector(s)).backgroundColor)`);
  check('tonos ' + tag, 'capítulos vecinos con fondo distinto: La casa → Catálogo → Eventos → Novedades → cierre', fills.every((f, i) => i === 0 || f !== fills[i - 1]), JSON.stringify(fills));
  const hints = await ev(`[...document.querySelectorAll('a[data-hint]')].filter(a => a.getBoundingClientRect().width > 0).map(a => [a.textContent.trim(), Math.round(a.getBoundingClientRect().width), Math.round(parseFloat(getComputedStyle(a, '::before').width))]).filter(x => x[2] > x[1] + 1)`);
  check('pistas ' + tag, 'ninguna pista es más ancha que su enlace (no pisa al vecino en hover ni con foco)', !hints.length, JSON.stringify(hints));
  const rule = await ev(`[...document.querySelectorAll('a[data-hint]')].filter(a => a.getBoundingClientRect().width > 0).map(a => [a.textContent.trim(), getComputedStyle(a, '::after').content, getComputedStyle(a.querySelector('span')).backgroundImage, getComputedStyle(a, '::before').backgroundImage]).filter(x => x[1] !== 'none' || !/linear-gradient/.test(x[2]) || /linear-gradient/.test(x[3]))`);
  check('pistas ' + tag, 'el filete se pinta sobre el rótulo (fondo de la etiqueta), no sobre la celda del enlace ni bajo la pista', !rule.length, JSON.stringify(rule));
  if (!mobile) {
    // CR0-09: con el cursor (y con foco de teclado) el rótulo sigue siendo el texto visible y ni la fila ni el enlace cambian de tamaño.
    const navState = `[...document.querySelectorAll('.hdr-nav a')].map(a => { const r = a.getBoundingClientRect(), s = getComputedStyle(a.querySelector('span')); return [a.textContent.trim(), Math.round(r.width), Math.round(r.height), Math.round(a.parentElement.getBoundingClientRect().height), s.opacity, s.translate, s.backgroundSize]; })`;
    // Chromium sin cabeza no declara (hover: hover) ni (pointer: fine) por sí solo: el flag --blink-settings del arranque (arriba) lo hace,
    // como Playwright; Emulation.setEmulatedMedia no basta para esas dos consultas.
    const rest = await ev(navState);
    const bad = [];
    for (const [i, r] of rest.entries()) {
      const c = await ev(`(()=>{const r=document.querySelectorAll('.hdr-nav a')[${i}].getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c[0], y: c[1] }); await sleep(500);
      const h = (await ev(navState))[i];
      const hint = await ev(`(()=>{const b=getComputedStyle(document.querySelectorAll('.hdr-nav a')[${i}],'::before'); return [b.opacity, b.fontSize]})()`);
      if (h[1] !== r[1] || h[2] !== r[2] || h[3] !== r[3] || h[4] !== '1' || h[5] !== 'none' || parseFloat(h[6]) < 99 || hint[0] !== '1') bad.push({ rest: r, hover: h, hint });
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640, y: 500 }); await sleep(300);
    check('pistas ' + tag, 'con el cursor el rótulo se queda fijo y visible con filete, la pista aparece aparte y ni la fila ni el enlace cambian de tamaño (CR0-09)', !bad.length, JSON.stringify(bad));
    await ev(`document.querySelector('.hdr-brand').focus()`);
    const focusBad = [];
    for (let i = 0; i < rest.length; i++) {
      await key('Tab', 'Tab', 9); await sleep(600);
      const f = await ev(`(()=>{const a=document.activeElement; if(!a.matches('.hdr-nav a')) return null; const r=a.getBoundingClientRect(), s=getComputedStyle(a.querySelector('span')); return [a.textContent.trim(), Math.round(r.width), Math.round(r.height), Math.round(a.parentElement.getBoundingClientRect().height), s.opacity, s.translate, s.backgroundSize]})()`);
      const r = rest[i];
      if (!f || f[1] !== r[1] || f[2] !== r[2] || f[3] !== r[3] || f[4] !== '1' || f[5] !== 'none' || parseFloat(f[6]) < 99) focusBad.push({ rest: r, focus: f });
    }
    check('pistas ' + tag, 'con foco de teclado (Tab real) el rótulo se queda fijo y visible, con filete, sin mover la fila (CR0-09)', !focusBad.length, JSON.stringify(focusBad));
  }
}

// ---------- 4. Barra inferior, cartelera, hero (móvil) ----------
await open(390, 844);
const secs = await ev(`Object.fromEntries([...document.querySelectorAll('main > section')].map(s=>[s.id||s.className.split(' ')[0], Math.round(s.getBoundingClientRect().top+scrollY)]))`);
// Cada tramo de la página y la casilla que debe marcar: Inicio abarca la entrada, el manifiesto y La casa; la cita, el llamado, Visita y el pie no marcan ninguna.
for (const [sel, want] of [['#inicio', '#inicio'], ['.manifesto', '#inicio'], ['#casa', '#inicio'], ['#libros', '#libros'], ['#catalogo', '#libros'], ['#cartelera', '#cartelera'], ['#novedades', '#novedades'], ['.quote', ''], ['.call', ''], ['#visita', ''], ['.ftr', '']]) {
  // se llega por pasos (como un lector) y se asienta antes de medir con la posición real actual
  for (let i = 0; i < 4; i++) { await ev(`scrollTo(0, document.querySelector('${sel}').getBoundingClientRect().top + scrollY + ${sel === '#inicio' ? 0 : 120})`); await sleep(900); }
  await ev(`scrollBy(0,1)`); await sleep(600);
  const cur = await ev(`[...document.querySelectorAll('.tabbar a, .tab-menu')].map(a=>a.getAttribute('aria-current')?a.getAttribute('href')+'='+a.getAttribute('aria-current'):null).filter(Boolean)`);
  check('barra inferior', want ? `en ${sel} marca ${want}` : `en ${sel} no marca ninguna casilla`, want ? cur.length === 1 && cur[0] === want + '=location' : cur.length === 0, JSON.stringify(cur));
}
const tabs = await ev(`[...document.querySelectorAll('.tabbar a, .tab-menu')].map(a=>{const r=a.getBoundingClientRect(); const l=a.querySelector('.tab-lb').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), a.querySelector('.tab-lb').firstChild.textContent.trim(), l.width > 8 && l.height > 8]})`);
check('barra inferior', 'cinco casillas iguales ≥48px con nombre a la vista (Inicio, Catálogo, Eventos, Novedades, Más)', tabs.length === 5 && tabs.every(t => t[0] >= 48 && t[1] >= 48 && t[0] === tabs[0][0] && t[3]) && tabs.map(t => t[2]).join('|') === 'Inicio|Catálogo|Eventos|Novedades|Más', JSON.stringify(tabs));
const steady = await ev(`(async()=>{const box=()=>[...document.querySelectorAll('.tabbar a, .tab-menu')].map(a=>{const r=a.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join()}).join('|'); const a=box(); scrollTo(0, document.querySelector('#libros').getBoundingClientRect().top+scrollY+120); await new Promise(r=>setTimeout(r,1200)); const b=box(); return a===b})()`);
check('barra inferior', 'las casillas no cambian de tamaño ni de sitio al cambiar la activa', steady === true, String(steady));
const car = await ev(`(()=>{const items=[...document.querySelectorAll('.bill-item')]; const tr=document.querySelector('.bill-track'); return {n:items.length, allOpen:items.every(d=>d.open), snap:getComputedStyle(tr).scrollSnapType, img:items.every(d=>d.querySelector('img').naturalWidth>0||!d.querySelector('img').complete), dots:document.querySelectorAll('.bill-dots i').length, sumTab:items.every(d=>d.querySelector('summary').tabIndex===-1)}})()`);
check('cartelera', 'carrusel con 3 tarjetas abiertas, snap y puntos', car.n === 3 && car.allOpen && /x mandatory/.test(car.snap) && car.dots === 3, JSON.stringify(car));
await ev(`scrollTo(0,${secs.cartelera + 150})`); await sleep(1500);
await ev(`document.querySelector('.bill-track').scrollTo({left:700, behavior:'instant'})`); await sleep(700);
check('cartelera', 'el punto activo sigue el desplazamiento', (await ev(`[...document.querySelectorAll('.bill-dots i')].findIndex(i=>i.classList.contains('is-on'))`)) >= 1);
await shot('m-cartelera.jpg');
// hero (como primera visita: sin lo que dejó el recorrido anterior, para que el control de novedades tenga su sitio reservado)
await ev(`localStorage.removeItem('iti-news-visto'); localStorage.removeItem('iti-news-estado')`);
await open(390, 844);
await ev(`scrollTo(0,0)`); await sleep(1200); await ev(`scrollTo(0,1)`); await sleep(300); await ev(`scrollTo(0,0)`); await sleep(800);
const hero = await ev(`(()=>{const q=s=>document.querySelector(s); const r=q('.entry-lede').getBoundingClientRect(); const cta=[...document.querySelectorAll('.entry-actions a')].map(a=>{const b=a.getBoundingClientRect(); return [Math.round(b.height), Math.round(b.top), Math.round(b.bottom)]}); const tb=q('.tabbar').getBoundingClientRect(); const n=q('[data-news-cta]'); const nb=n.getBoundingClientRect(); return {lede:[Math.round(r.top),Math.round(r.bottom)], cta, news:{shown:getComputedStyle(n).visibility==='visible'&&nb.height>0, h:Math.round(nb.height), top:Math.round(nb.top), bottom:Math.round(nb.bottom), primary:n.classList.contains('btn--tungsten')}, tabTop:Math.round(tb.top), ledeShown:getComputedStyle(q('.entry-lede')).opacity, canvas:getComputedStyle(q('.entry-canvas')).display, wordmark:Math.round(q('.wordmark').getBoundingClientRect().top), innerH:innerHeight}})()`);
check('hero móvil', 'una sola CTA visible («Cómo llegar»; «Escribir» sale de la primera vista, D11), sobre la barra inferior y ≥44px', hero.cta.filter(c => c[0] > 0).length === 1 && hero.cta.filter(c => c[0] > 0).every(c => c[0] >= 44 && c[2] <= hero.tabTop), JSON.stringify(hero));
check('hero móvil', 'el control de novedades (si hay llegadas sin ver) va bajo «Cómo llegar», es secundario, ≥48px y queda sobre la barra inferior', !hero.news.shown || (!hero.news.primary && hero.news.h >= 48 && hero.news.top >= Math.max(...hero.cta.map(c => c[2])) && hero.news.bottom <= hero.tabTop), JSON.stringify(hero.news));
check('hero móvil', 'sin canvas de fotogramas en móvil', hero.canvas === 'none', hero.canvas);
await shot('m-hero.jpg');

// ---------- 4b. Portadas, aterrizaje de anclas, cabecera lite, crédito ----------
await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY + 200)`); await sleep(1500);
for (let i = 0; i < 12 && !(await ev(`document.querySelectorAll('.cover--blank').length`)); i++) { await ev(`document.querySelector('#catalogo input').focus(); scrollBy(0,40)`); await sleep(700); }
const cov = await ev(`(()=>{const num=c=>c.match(/[0-9.]+/g).slice(0,3).map(Number); const lum=c=>{const [r,g,b]=num(c).map(v=>v/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4); return 0.2126*r+0.7152*g+0.0722*b}; const ratio=(a,b)=>{const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}; return [...document.querySelectorAll('.cover--blank')].slice(0,24).map(c=>{ const cs=getComputedStyle(c); const stops=cs.backgroundImage.match(/rgba?\\([^)]*\\)/g)||(cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'?[cs.backgroundColor]:[]); const worst=sel=>Math.min(...stops.map(s=>ratio(getComputedStyle(c.querySelector(sel)).color,s))); return stops.length?[worst('.cover-title'), worst('.cover-author')]:[0,0]})})()`);
if (!cov) console.log('COV PROBLEMS', problems.slice(-3)); check('portadas', 'título y autor se leen sobre el campo plano de su portada (≥4.5:1; portadas claras con tinta oscura, oscuras con tinta clara)', cov?.length > 0 && cov.every(r => r[0] >= 4.5 && r[1] >= 4.5), JSON.stringify((cov||[]).slice(0, 3)));
for (const id of ['libros', 'cartelera', 'novedades', 'inicio']) {
  await ev(`scrollTo(0, ${id === 'inicio' ? 3000 : 0})`); await sleep(600);
  await ev(`document.querySelector('.tabbar a[href="#${id}"]').click()`); await sleep(2500);
  const d = await ev(`Math.round(document.getElementById('${id}').getBoundingClientRect().top) + 0`); // + 0: un aterrizaje a -0.4 px redondea a -0, que CDP no serializa por valor (llegaba undefined y la comprobación fallaba con el título en su sitio)
  check('anclas', `la casilla ${id} aterriza con el título a la vista (|top| ≤ 100 px)`, Math.abs(d) <= 100, d);
}
check('hero móvil', 'la foto del hero va sin crédito ni rótulos encima', await ev(`!document.querySelector('.entry-credit, .entry .tag') && !/Recreación IA|Foto real|Datos de muestra|no es inventario|Imagen ilustrativa/.test(document.body.innerText)`));
await ev(`scrollTo(0,0)`); await sleep(800);
const wm = await ev(`(()=>{const w=document.querySelector('.wordmark').getBoundingClientRect(); const t=document.querySelector('.tabbar').getBoundingClientRect(); const f=document.querySelector('.entry-facts').getBoundingClientRect(); return {wordmarkBottom:Math.round(w.bottom), tabTop:Math.round(t.top), factsBottom:Math.round(f.bottom)}})()`);
check('hero móvil', 'wordmark y dirección quedan sobre la barra inferior', wm.wordmarkBottom <= wm.tabTop + 2 && wm.factsBottom <= wm.tabTop + 2, JSON.stringify(wm));
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{Object.defineProperty(navigator,'deviceMemory',{get:()=>2})}catch(e){}` });
await send('Page.navigate', { url: URL_ }); await sleep(3000);
const lite = await ev(`(()=>{const h=document.querySelector('.hdr'); const out={g:document.documentElement.dataset.glass}; window.scrollTo(0, document.getElementById('casa').getBoundingClientRect().top+scrollY+200); return out})()`);
await sleep(1500); await ev(`scrollBy(0,1)`); await sleep(500);
const hb = await ev(`(()=>{const h=document.querySelector('.hdr'); const s=getComputedStyle(h,'::before'); return {on:h.dataset.on, bg:s.backgroundColor, blur:s.backdropFilter}})()`);
check('gama media', 'lite activo, cabecera con tinte claro y sin desenfoque', lite.g === 'lite' && hb.blur === 'none' && /\d/.test(hb.bg) && !/^rgba?\(\s*1[0-9]?,/.test(hb.bg), JSON.stringify({ lite, hb }));

// ---------- 5. Catálogo ----------
await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY)`); await sleep(1500);
const cat = await ev(`(async()=>{const q=s=>document.querySelector(s); const inp=q('#catalogo input[type=search], #catalogo input'); inp.focus(); inp.value='Freida'; inp.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,1200)); const n=document.querySelectorAll('#catalogo .card').length; const sugg=document.querySelectorAll('#catalogo [role=option]').length; return {n, sugg, status:(q('#catalogo [aria-live]')||{}).textContent}})()`);
check('catálogo', 'buscar «Freida» devuelve resultados o sugerencias sin errores', cat.n > 0 || cat.sugg > 0, JSON.stringify(cat));
check('catálogo', 'sin errores de consola', !problems.length, problems.join(' | '));
const card = await ev(`(async()=>{const c=document.querySelector('#catalogo .card button, #catalogo .card a, #catalogo .card'); c.click(); await new Promise(r=>setTimeout(r,1300)); const d=document.querySelector('dialog.drawer'); return {open:d&&d.open, sheet:document.documentElement.classList.contains('sheet-open'), wa:!!d.querySelector('a[href*="wa.me"]'), grab:getComputedStyle(d.querySelector('.drawer-grabber')).display}})()`);
check('catálogo', 'la ficha abre como hoja con WhatsApp y asa de arrastre', card.open && card.sheet && card.wa && card.grab !== 'none', JSON.stringify(card));
await key('Escape', 'Escape', 27); await sleep(800);
check('catálogo', 'Escape cierra la ficha y libera el scroll', await ev(`!document.querySelector('dialog.drawer').open && !document.documentElement.classList.contains('sheet-open')`));

// ---------- 6. Movimiento reducido ----------
await open(390, 844, { reduced: true });
const rm = await ev(`({motion:document.documentElement.classList.contains('motion'), anims:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length})`);
check('movimiento reducido', 'sin clase motion ni animaciones infinitas', !rm.motion && rm.anims === 0, JSON.stringify(rm));
await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(500);
const rmm = await ev(`({open:document.querySelector('#sheet-menu').open, x:Math.round(document.querySelector('#sheet-menu').getBoundingClientRect().x)})`);
check('movimiento reducido', 'el menú abre sin deslizar', rmm.open && rmm.x === 0, JSON.stringify(rmm));
await key('Escape', 'Escape', 27);
check('movimiento reducido', 'sin errores de consola', !problems.length, problems.join(' | '));

// ---------- 7. Escritorio: cabecera y anclas ----------
await open(1280, 800, { mobile: false });
const dk = await ev(`(()=>{const q=s=>document.querySelector(s); return {more:(q('[data-menu-open]').getClientRects().length ? 'block' : 'none'), tab:getComputedStyle(q('.tabbar')).display, nav:[...document.querySelectorAll('.hdr-nav a')].map(a=>a.getAttribute('href')), canvas:getComputedStyle(q('.entry-canvas')).display}})()`);
check('escritorio', 'sin hoja «Más» ni barra inferior; la cabecera lleva Catálogo, Eventos, Novedades y Visita en el orden de la página, y el inicio es una foto fija (sin lienzo de fotogramas)', dk.more === 'none' && dk.tab === 'none' && dk.nav.join() === '#libros,#cartelera,#novedades,#visita' && dk.canvas === 'none', JSON.stringify(dk));
const anchors = await ev(`(()=>{const bad=[]; document.querySelectorAll('a[href^="#"]').forEach(a=>{const id=a.getAttribute('href').slice(1); if(id && !document.getElementById(id)) bad.push(id)}); return bad})()`);
check('escritorio', 'todas las anclas internas existen', !anchors.length, JSON.stringify(anchors));
await shot('d-hero.jpg');

// ---------- 8. Accesibilidad básica ----------
await open(390, 844);
const a11y = await ev(`(()=>{const bad=[]; document.querySelectorAll('button, a[href], input, select, summary').forEach(e=>{ if(e.closest('[inert],[hidden]')) return; const cs=getComputedStyle(e); if(cs.display==='none'||cs.visibility==='hidden') return; const name=(e.getAttribute('aria-label')||e.textContent||e.getAttribute('title')||e.getAttribute('placeholder')||'').trim() || (e.labels&&e.labels[0]&&e.labels[0].textContent.trim()) || e.getAttribute('aria-labelledby'); if(!name) bad.push(e.outerHTML.slice(0,80)); }); const imgs=[...document.images].filter(i=>!i.hasAttribute('alt')).map(i=>i.src.slice(-30)); return {unnamed:bad.slice(0,6), noAlt:imgs, lang:document.documentElement.lang, h1:document.querySelectorAll('h1').length, dupIds:(()=>{const s={}, d=[]; document.querySelectorAll('[id]').forEach(e=>{s[e.id]?d.push(e.id):s[e.id]=1}); return d})()}})()`);
check('accesibilidad', 'controles con nombre, imágenes con alt, un h1, idioma, sin ids duplicados', !a11y.unnamed.length && !a11y.noAlt.length && a11y.lang === 'es-MX' || a11y.lang?.startsWith('es') && a11y.h1 === 1 && !a11y.dupIds.length, JSON.stringify(a11y));

// ---------- 9. Rendimiento (CPU 4×, 4G lenta) ----------
await send('Emulation.setCPUThrottlingRate', { rate: 4 });
await send('Network.emulateNetworkConditions', { offline: false, latency: 150, downloadThroughput: 1.6 * 1024 * 1024 / 8, uploadThroughput: 750 * 1024 / 8 });
await ev(`localStorage.removeItem('iti-news-visto'); localStorage.removeItem('iti-news-estado')`); // se mide la primera visita: el conteo de novedades llega y pinta el punto y el control del inicio
await send('Page.addScriptToEvaluateOnNewDocument', { source: `window.__m={lcp:0,cls:0,lt:0};new PerformanceObserver(l=>{for(const e of l.getEntries())__m.lcp=e.startTime}).observe({type:'largest-contentful-paint',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())if(!e.hadRecentInput)__m.cls+=e.value}).observe({type:'layout-shift',buffered:true});new PerformanceObserver(l=>{for(const e of l.getEntries())__m.lt+=Math.max(0,e.duration-50)}).observe({type:'longtask',buffered:true});` });
await open(390, 844);
const perf = await ev(`(()=>{const f=performance.getEntriesByName('first-contentful-paint')[0]; return {fcp:Math.round(f?.startTime||0), lcp:Math.round(__m.lcp), cls:+__m.cls.toFixed(3), tbt:Math.round(__m.lt), kb:Math.round(performance.getEntriesByType('resource').reduce((s,r)=>s+(r.encodedBodySize||0),0)/1024)}})()`);
check('rendimiento (4× CPU, 4G lenta)', 'LCP ≤ 4000 ms', perf.lcp <= 4000, JSON.stringify(perf));
check('rendimiento (4× CPU, 4G lenta)', 'CLS ≤ 0.1', perf.cls <= 0.1, JSON.stringify(perf));
check('rendimiento (4× CPU, 4G lenta)', 'TBT ≤ 3000 ms', perf.tbt <= 3000, JSON.stringify(perf));
check('rendimiento (4× CPU, 4G lenta)', 'transferido ≤ 700 KB en la carga inicial', perf.kb <= 700, JSON.stringify(perf));
report.push({ area: 'info', name: 'métricas', ok: true, detail: JSON.stringify(perf) });

writeFileSync(join(out, 'e2e-report.json'), JSON.stringify(report, null, 1));
const fails = report.filter(r => !r.ok);
console.log(`PASS ${report.filter(r => r.ok).length} / ${report.length}  FAIL ${fails.length}`);
for (const f of fails) console.log(`✗ [${f.area}] ${f.name}\n    ${f.detail}`);
console.log('info', report.at(-1).detail);
chrome.kill();
process.exit(fails.length ? 1 : 0); // código ≠ 0 si algo falla, como el resto del arnés
