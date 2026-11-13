// Auditoría E2E con Chromium (CDP) del sistema «Itinerante Líquido»: menú ☰, temas claro y oscuro, barra inferior, Eventos, inicio, catálogo, movimiento reducido, escritorio, desbordes y rendimiento.
// node e2e.mjs <url> <outDir>
import { spawn } from 'node:child_process';
import { mkdirSync, writeFileSync, mkdtempSync, readFileSync } from 'node:fs';
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
  if (m.method === 'Fetch.requestPaused') { send('Fetch.fulfillRequest', { requestId: m.params.requestId, responseCode: 200, responseHeaders: [{ name: 'Content-Type', value: 'application/json' }], body: Buffer.from(JSON.stringify(NEWS_DATA)).toString('base64') }); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Log.entryAdded' && ['error'].includes(m.params.entry.level)) problems.push(`LOG error: ${m.params.entry.text} ${m.params.entry.url || ''}`);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('CONSOLE ' + m.params.args.map(a => a.value || a.description).join(' '));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => { const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) problems.push('EVAL ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result?.result?.value; };
const shot = async n => writeFileSync(join(out, n), Buffer.from((await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 })).result.data, 'base64'));
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable'); await send('Network.enable');
// Novedades: la lista que se publica está vacía hasta que la librería registre fechas de llegada reales, y entonces el capítulo no existe
// (eso lo comprueba feed.mjs). Esta auditoría recorre la página completa, con Novedades: collections.json se sirve con siete libros del
// inventario y fechas relativas a hoy (tres en las dos últimas semanas). Los ids salen del catálogo real: si un libro se va, la prueba lo dice.
const CATALOG = JSON.parse(readFileSync(new URL('../../assets/data/catalog.json', import.meta.url), 'utf8')).books;
const dayAgo = n => { const d = new Date(); d.setDate(d.getDate() - n); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
const NEWS_DATA = { ...JSON.parse(readFileSync(new URL('../../assets/data/collections.json', import.meta.url), 'utf8')), novedades: { titulo: 'Recién llegados', entradas: CATALOG.slice(10, 17).map((b, i) => ({ id: b.id, llegada: dayAgo([1, 3, 20, 2, 30, 35, 40][i]) })) } };
await send('Fetch.enable', { patterns: [{ urlPattern: '*collections.json*' }] });

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
const overflow = () => ev(`(()=>{const d=document.documentElement; const clipped=e=>{for(let p=e.parentElement;p&&p!==document.body;p=p.parentElement){const o=getComputedStyle(p).overflowX; if((o==='hidden'||o==='clip')&&p.getBoundingClientRect().right<=d.clientWidth+1) return true;} return false;}; return {sw:d.scrollWidth, cw:d.clientWidth, wide:[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect(); return r.width>0 && r.right>d.clientWidth+1 && getComputedStyle(e).position!=='absolute' && !clipped(e) && !e.closest('.bill-track, .rail-chips, .rail-viewport, .house-track, .news-list, dialog, .tabbar')}).slice(0,4).map(e=>(e.className||e.tagName)+' <'+(e.parentElement&&e.parentElement.className)+'>')}})()`);

// ---------- 1. Desbordes en varios anchos ----------
for (const [w, h, mobile] of [[360, 740, true], [390, 844, true], [414, 896, true], [768, 1024, true], [1280, 800, false], [1920, 1080, false]]) {
  await open(w, h, { mobile });
  const o = await overflow();
  check('layout', `sin desborde horizontal a ${w}px`, o.sw <= o.cw && !o.wide.length, JSON.stringify(o));
  check('consola', `sin errores de consola a ${w}px`, !problems.length, problems.join(' | '));
}

// ---------- 2. Menú ☰ (MenuHamburguesa) ----------
for (const w of [360, 390]) {
  await open(w, 800);
  const A = 'menú ' + w;
  const btn = await ev(`(()=>{const b=document.querySelector('[data-menu-open]'); const r=b.getBoundingClientRect(); return {shown:getComputedStyle(b).display!=='none', w:Math.round(r.width), h:Math.round(r.height), exp:b.getAttribute('aria-expanded'), ctl:b.getAttribute('aria-controls'), target:!!document.getElementById(b.getAttribute('aria-controls')), label:b.getAttribute('aria-label'), inBar:!!b.closest('.hdr')}})()`);
  check(A, '☰ en la barra de navegación, 44 × 44, con nombre, aria-expanded y aria-controls a un elemento real', btn.shown && btn.w === 44 && btn.h === 44 && btn.exp === 'false' && btn.ctl === 'menu' && btn.target && btn.label === 'Abrir menú' && btn.inBar, JSON.stringify(btn));
  await ev(`document.querySelector('[data-menu-open]').click()`);
  for (let i = 0; i < 20 && !(await ev(`document.getElementById('menu').open`)); i++) await sleep(150);
  await sleep(700);
  const s1 = await ev(`(()=>{const d=document.getElementById('menu'); const h=d.querySelector('.menu-hoja').getBoundingClientRect(); const x=d.querySelector('[data-menu-close]').getBoundingClientRect(); const o=document.querySelector('[data-menu-open]').getBoundingClientRect(); return {open:d.open, modal:d.matches(':modal'), left:Math.round(h.left), right:Math.round(innerWidth-h.right), top:Math.round(h.top), active:document.activeElement.textContent.trim(), sheet:document.documentElement.classList.contains('sheet-open'), lock:getComputedStyle(document.documentElement).overflow, exp:document.querySelector('[data-menu-open]').getAttribute('aria-expanded'), label:document.querySelector('[data-menu-open]').getAttribute('aria-label'), tabbarHidden:getComputedStyle(document.querySelector('.tabbar')).opacity==='0', title:document.getElementById(d.getAttribute('aria-labelledby'))?.textContent, xOnTop:Math.abs(x.left-o.left)<=1 && Math.abs(x.top-o.top)<=1}})()`);
  check(A, 'abre como modal titulado «Menú», el foco entra a la primera sección, el × queda en el sitio del ☰, scroll bloqueado y la barra inferior se oculta', s1.open && s1.modal && s1.active === 'Inicio' && s1.xOnTop && s1.sheet && s1.lock === 'hidden' && s1.exp === 'true' && s1.label === 'Cerrar menú' && s1.tabbarHidden && s1.title === 'Menú', JSON.stringify(s1));
  check(A, 'hoja de vidrio con 8 px de margen, bajo la barra de navegación', s1.left === 8 && s1.right === 8 && s1.top >= 44, JSON.stringify(s1));
  const rows = await ev(`[...document.querySelectorAll('#menu .menu-row')].filter(r=>r.getClientRects().length).map(r=>[r.querySelector('span').firstChild.textContent.trim(), Math.round(r.getBoundingClientRect().height)])`);
  check(A, 'filas de 56 px con todas las secciones y Mi lista', rows.every(r => r[1] === 56) && rows.map(r => r[0]).join('|') === 'Inicio|Catálogo|Eventos y talleres|Novedades|La casa|Visita|Mi lista', JSON.stringify(rows));
  const redes = await ev(`[...document.querySelectorAll('#menu .menu-redes a')].map(r=>[r.textContent.trim(), Math.round(r.getBoundingClientRect().height), Math.round(r.getBoundingClientRect().width)])`);
  check(A, 'Instagram y Facebook como botones de 44 px', redes.length === 2 && redes.every(c => c[1] === 44 && c[2] >= 44) && redes.map(c => c[0]).join() === 'Instagram,Facebook', JSON.stringify(redes));
  const flatSheet = await ev(`(()=>{const d=document.getElementById('menu'); return {collapsed:d.querySelectorAll('[aria-expanded="false"], details').length, inert:d.querySelectorAll('[inert]').length, dead:[...d.querySelectorAll('a[href^="#"]')].filter(a=>a.getClientRects().length).filter(a=>{const t=document.querySelector(a.getAttribute('href')); return !t || !t.getClientRects().length}).map(a=>a.getAttribute('href'))}})()`);
  check(A, 'sin acordeones ni contenido plegado; los destinos internos existen', flatSheet.collapsed === 0 && flatSheet.inert === 0 && !flatSheet.dead.length, JSON.stringify(flatSheet));
  const reach = await ev(`(()=>{const h=document.querySelector('#menu .menu-hoja'); const last=[...h.querySelectorAll('a, button')].at(-1); last.scrollIntoView({block:'nearest'}); const n=h.getBoundingClientRect(), l=last.getBoundingClientRect(); const out={lastIn:l.top>=n.top-1&&l.bottom<=n.bottom+1, scrolls:h.scrollHeight>h.clientHeight}; h.scrollTop=0; return out})()`);
  check(A, 'si la hoja no cabe, se desplaza y el último destino se alcanza', reach.lastIn, JSON.stringify(reach));
  await ev(`document.querySelector('#menu .menu-row').focus()`);
  let escaped = false;
  for (let i = 0; i < 24; i++) { await key('Tab', 'Tab', 9); const inside = await ev(`(()=>{const a=document.activeElement; return a===document.body || document.getElementById('menu').contains(a)})()`); if (!inside) { escaped = true; break; } }
  check(A, 'el foco no escapa con Tab (trampa modal)', !escaped);
  await key('Escape', 'Escape', 27); await sleep(600);
  const s2 = await ev(`({open:document.getElementById('menu').open, focus:document.activeElement.className, sheet:document.documentElement.classList.contains('sheet-open'), exp:document.querySelector('[data-menu-open]').getAttribute('aria-expanded'), label:document.querySelector('[data-menu-open]').getAttribute('aria-label')})`);
  check(A, 'Escape cierra y devuelve el foco al ☰ (y el × vuelve a ☰)', !s2.open && /menu-btn/.test(s2.focus) && !s2.sheet && s2.exp === 'false' && s2.label === 'Abrir menú', JSON.stringify(s2));
  await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(900);
  await ev(`document.querySelector('#menu a[href="#casa"]').click()`); await sleep(2200);
  const nav = await ev(`({closed:!document.getElementById('menu').open, top:Math.round(document.querySelector('#casa').getBoundingClientRect().top) + 0, y:scrollY, hash:location.hash, cur:[...document.querySelectorAll('.tabbar a[aria-current]')].map(a=>a.getAttribute('href'))})`);
  const foc = await ev(`document.activeElement.closest('section')?.id + ':' + document.activeElement.tagName`);
  check(A, 'tras navegar el foco va al título de la sección destino', foc === 'casa:H2', foc);
  check(A, 'La casa cierra la hoja, navega (título a la vista) y la barra marca Inicio', nav.closed && Math.abs(nav.top) <= 100 && nav.y > 400 && nav.hash === '#casa' && nav.cur.join() === '#inicio', JSON.stringify(nav));
  await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(900);
  await ev(`document.querySelector('#menu a[href="#visita"]').click()`); await sleep(2600);
  const vis = await ev(`({closed:!document.getElementById('menu').open, top:Math.round(document.querySelector('#visita').getBoundingClientRect().top) + 0, focus:document.activeElement.id, cur:[...document.querySelectorAll('.tabbar [aria-current]')].length, row:document.querySelector('#menu a[href="#visita"]').getAttribute('aria-current')})`);
  check(A, 'Visita cierra la hoja, navega (foco en su titular); la barra inferior no marca casilla y el menú marca Visita', vis.closed && Math.abs(vis.top) <= 100 && vis.focus === 'visit-title' && vis.cur === 0 && vis.row === 'true', JSON.stringify(vis));
  await ev(`document.querySelector('[data-menu-open]').click()`);
  for (let i = 0; i < 20 && !(await ev(`document.getElementById('menu').open`)); i++) await sleep(150);
  await sleep(700);
  const hrs = (await ev(`(()=>{const d=document.getElementById('menu'); return {status:d.querySelector('.menu-horario [data-status-text]').textContent, week:d.querySelector('.menu-semana').textContent, open:d.querySelector('.menu-horario').dataset.open}})()`)) || {};
  check(A, 'el menú trae el estado corto de hoy (hora de Monterrey) y debajo la semana, sin repetir la hora de cierre', /^(Abierto ahora · hasta 20:00|Cierra pronto · 20:00|Cerrado · abre .+ 11:00)$/.test(hrs.status) && /Lun–sáb · 11:00–20:00 · Domingo cerrado/.test(hrs.week) && /true|false/.test(hrs.open), JSON.stringify(hrs));
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x: 3, y: 400, button: 'left', clickCount: 1 }); await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: 3, y: 400, button: 'left', clickCount: 1 }); await sleep(900);
  check(A, 'clic en el velo (fuera de la hoja) cierra', await ev(`!document.getElementById('menu').open`));
  const ext = await ev(`[...document.querySelectorAll('#menu a[target=_blank]')].map(a=>[a.rel, a.href.slice(0,40)])`);
  check(A, 'enlaces externos con noopener noreferrer («Cómo llegar», WhatsApp, Instagram y Facebook)', ext.length === 4 && ext.every(e => /noopener/.test(e[0]) && /noreferrer/.test(e[0])), JSON.stringify(ext));
  check(A, 'sin errores de consola durante el menú', !problems.length, problems.join(' | '));
}

// ---------- 3. Temas claro y oscuro ----------
const lumFn = `const lum=c=>{const [r,g,b]=c.match(/[\\d.]+/g).slice(0,3).map(Number).map(v=>v/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4); return 0.2126*r+0.7152*g+0.0722*b}; const ratio=(a,b)=>{const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)};`;
for (const [w, h, mobile, tag] of [[390, 844, true, 'móvil'], [1280, 800, false, 'escritorio']]) {
  for (const scheme of ['light', 'dark']) {
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    await open(w, h, { mobile });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: scheme }] });
    const t = await ev(`(()=>{${lumFn} const out={}; for (const sel of ['#inicio','#casa','#libros','#cartelera','#novedades','#visita','.ftr']) { const s=document.querySelector(sel); const cs=getComputedStyle(s); let bg=cs.backgroundColor; if (/, 0\\)$/.test(bg) || bg==='transparent') bg=getComputedStyle(document.body).backgroundColor; out[sel]={bg, fg:cs.color, ratio:+ratio(cs.color,bg).toFixed(1)}; } return out})()`);
    for (const [sel, v] of Object.entries(t)) check(`tema ${scheme} ${tag}`, `${sel}: tinta sobre su fondo ≥ 7:1`, v.ratio >= 7, JSON.stringify(v));
    const fills = Object.values(t).map(v => v.bg);
    check(`tema ${scheme} ${tag}`, 'bandas alternas: La casa → Catálogo → Eventos → Novedades → Visita → pie, vecinos de fondo distinto', ['#inicio', '#casa', '#libros', '#cartelera', '#novedades', '#visita', '.ftr'].map(s => t[s].bg).every((f, i, a) => i === 0 || f !== a[i - 1]), JSON.stringify(fills));
    const dark = await ev(`(()=>{ const m=getComputedStyle(document.body).backgroundColor.match(/[\\d.]+/g).map(Number); return (m[0]+m[1]+m[2])/3 })()`);
    check(`tema ${scheme} ${tag}`, scheme === 'dark' ? 'el tema oscuro pinta la página oscura (prefers-color-scheme)' : 'el tema claro pinta la página blanca', scheme === 'dark' ? dark < 40 : dark > 240, String(dark));
  }
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  if (!mobile) {
    await open(w, h, { mobile });
    // El destino actual lleva la pastilla menta; con el cursor un enlace cambia de color, nunca de tamaño.
    const navState = `[...document.querySelectorAll('.hdr-nav a')].filter(a=>a.getClientRects().length).map(a => { const r = a.getBoundingClientRect(); return [a.textContent.trim(), Math.round(r.width), Math.round(r.height), Math.round(a.parentElement.getBoundingClientRect().height)]; })`;
    const rest = await ev(navState);
    const bad = [];
    for (const [i, r] of rest.entries()) {
      const c = await ev(`(()=>{const r=[...document.querySelectorAll('.hdr-nav a')].filter(a=>a.getClientRects().length)[${i}].getBoundingClientRect(); return [r.x+r.width/2, r.y+r.height/2]})()`);
      await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: c[0], y: c[1] }); await sleep(400);
      const hv = (await ev(navState))[i];
      if (hv[1] !== r[1] || hv[2] !== r[2] || hv[3] !== r[3] || r[2] !== 44) bad.push({ rest: r, hover: hv });
    }
    await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 640, y: 500 }); await sleep(300);
    check('barra ' + tag, 'enlaces de 44 px; con el cursor ni el enlace ni la barra cambian de tamaño', !bad.length && rest.length === 4, JSON.stringify(bad.length ? bad : rest));
    await ev(`scrollTo(0, document.getElementById('cartelera').getBoundingClientRect().top + scrollY + 200)`); await sleep(1200); await ev(`scrollBy(0,1)`); await sleep(600);
    const cur = await ev(`(()=>{const a=document.querySelector('.hdr-nav a[aria-current="true"]'); return a ? [a.getAttribute('href'), getComputedStyle(a).backgroundColor] : null})()`);
    check('barra ' + tag, 'en Eventos la barra marca «Eventos» con la pastilla menta', cur && cur[0] === '#cartelera' && cur[1] === 'rgb(220, 241, 236)', JSON.stringify(cur));
  }
}

// ---------- 4. Barra inferior, Eventos, inicio (móvil) ----------
await open(390, 844);
// Cada tramo de la página y la casilla que debe marcar: Inicio abarca la entrada y La casa; el Catálogo, su capítulo; en el resto no hay casilla.
for (const [sel, want] of [['#inicio', '#inicio'], ['#casa', '#inicio'], ['#libros', '#libros'], ['[data-rail]', '#libros'], ['#cartelera', ''], ['#novedades', ''], ['#visita', ''], ['.ftr', '']]) {
  // En el teléfono #catalogo no ocupa sitio (es la hoja Explorar): el Catálogo se mide en su titular y en el carrusel.
  for (let i = 0; i < 4; i++) { await ev(`scrollTo(0, document.querySelector('${sel}').getBoundingClientRect().top + scrollY + ${['#inicio'].includes(sel) ? 0 : 120})`); await sleep(900); }
  await ev(`scrollBy(0,1)`); await sleep(600);
  const cur = await ev(`[...document.querySelectorAll('.tabbar a, .tab-list')].map(a=>a.getAttribute('aria-current')?a.getAttribute('href')+'='+a.getAttribute('aria-current'):null).filter(Boolean)`);
  const pill = await ev(`getComputedStyle(document.querySelector('.tabbar-pastilla')).opacity`);
  check('barra inferior', want ? `en ${sel} marca ${want} (con la pastilla)` : `en ${sel} no marca ninguna casilla (sin pastilla)`, want ? cur.length === 1 && cur[0] === want + '=location' && pill === '1' : cur.length === 0 && pill === '0', JSON.stringify([cur, pill]));
}
const tabs = await ev(`[...document.querySelectorAll('.tabbar a, .tab-list')].map(a=>{const r=a.getBoundingClientRect(); const l=a.querySelector('.tab-lb').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height), a.querySelector('.tab-lb').firstChild.textContent.trim(), l.width > 8 && l.height > 8]})`);
check('barra inferior', 'tres casillas iguales de 76 × 49 px con nombre a la vista (Inicio, Catálogo, Mi lista)', tabs.length === 3 && tabs.every(t => t[0] === 76 && t[1] === 49 && t[3]) && tabs.map(t => t[2]).join('|') === 'Inicio|Catálogo|Mi lista', JSON.stringify(tabs));
const steady = await ev(`(async()=>{const box=()=>[...document.querySelectorAll('.tabbar a, .tab-list')].map(a=>{const r=a.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)].join()}).join('|'); scrollTo(0,0); await new Promise(r=>setTimeout(r,1200)); const a=box(); scrollTo(0, document.querySelector('#libros').getBoundingClientRect().top+scrollY+120); await new Promise(r=>setTimeout(r,1200)); const b=box(); return a===b})()`);
check('barra inferior', 'las casillas no cambian de tamaño ni de sitio al cambiar la activa (solo se desliza la pastilla)', steady === true, String(steady));
const secs = await ev(`Object.fromEntries([...document.querySelectorAll('main > section')].map(s=>[s.id||s.className.split(' ')[0], Math.round(s.getBoundingClientRect().top+scrollY)]))`);
const car = await ev(`(()=>{const items=[...document.querySelectorAll('.bill-item')]; const tr=document.querySelector('.bill-track'); return {n:items.length, allOpen:items.every(d=>d.open), snap:getComputedStyle(tr).scrollSnapType, img:items.every(d=>d.querySelector('img').naturalWidth>0||!d.querySelector('img').complete), dots:document.querySelectorAll('.bill-dots i').length, sumTab:items.every(d=>d.querySelector('summary').tabIndex===-1)}})()`);
check('eventos', 'carrusel con 3 tarjetas abiertas, snap y puntos; el resumen no es un control', car.n === 3 && car.allOpen && /x mandatory/.test(car.snap) && car.dots === 3 && car.sumTab, JSON.stringify(car));
await ev(`scrollTo(0,${secs.cartelera + 150})`); await sleep(1500);
await ev(`document.querySelector('.bill-track').scrollTo({left:700, behavior:'instant'})`); await sleep(700);
check('eventos', 'el punto activo sigue el desplazamiento', (await ev(`[...document.querySelectorAll('.bill-dots i')].findIndex(i=>i.classList.contains('is-on'))`)) >= 1);
await shot('m-cartelera.jpg');
// inicio (como primera visita: sin lo que dejó el recorrido anterior, para que el control de novedades tenga su sitio reservado)
await ev(`localStorage.removeItem('iti-news-visto'); localStorage.removeItem('iti-news-estado')`);
await open(390, 844);
await ev(`scrollTo(0,0)`); await sleep(1200); await ev(`scrollTo(0,1)`); await sleep(300); await ev(`scrollTo(0,0)`); await sleep(800);
const hero = await ev(`(()=>{const q=s=>document.querySelector(s); const r=q('.entry-lede').getBoundingClientRect(); const cta=[...document.querySelectorAll('.entry-actions a')].map(a=>{const b=a.getBoundingClientRect(); return [Math.round(b.height), Math.round(b.top), Math.round(b.bottom), a.classList.contains('btn--primario')]}); const tb=q('.tabbar').getBoundingClientRect(); const n=q('[data-news-cta]'); const nb=n.getBoundingClientRect(); const ad=q('.entry-address').getBoundingClientRect(); return {lede:[Math.round(r.top),Math.round(r.bottom)], cta, news:{shown:getComputedStyle(n).visibility==='visible'&&nb.height>0, h:Math.round(nb.height), top:Math.round(nb.top), bottom:Math.round(nb.bottom), primary:n.classList.contains('btn--primario')}, tabTop:Math.round(tb.top), address:Math.round(ad.bottom), photo:!!q('.entry-poster').currentSrc.match(/inicio-sala-m/)}})()`);
check('inicio móvil', 'una sola acción visible («Cómo llegar», primario de 56 px; la consulta por WhatsApp vive en el menú), sobre la barra inferior', hero.cta.filter(c => c[0] > 0).length === 1 && hero.cta.filter(c => c[0] > 0).every(c => c[0] === 56 && c[3] && c[2] <= hero.tabTop), JSON.stringify(hero));
check('inicio móvil', 'el control de novedades (si hay llegadas sin ver) va bajo «Cómo llegar», es secundario, ≥ 48 px y queda sobre la barra inferior', !hero.news.shown || (!hero.news.primary && hero.news.h >= 48 && hero.news.top >= Math.max(...hero.cta.map(c => c[2])) && hero.news.bottom <= hero.tabTop), JSON.stringify(hero.news));
check('inicio móvil', 'la dirección queda sobre la barra inferior y la foto es la vertical de la sala', hero.address <= hero.tabTop - 8 && hero.photo, JSON.stringify(hero));
await shot('m-hero.jpg');

// ---------- 4b. Portadas, aterrizaje de anclas, gama media, crédito ----------
await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY + 200)`); await sleep(1500);
for (let i = 0; i < 12 && !(await ev(`document.querySelectorAll('.cover--blank').length`)); i++) { await ev(`document.querySelector('#catalogo input').focus(); scrollBy(0,40)`); await sleep(700); }
const cov = await ev(`(()=>{const num=c=>c.match(/[0-9.]+/g).slice(0,3).map(Number); const lum=c=>{const [r,g,b]=num(c).map(v=>v/255).map(v=>v<=0.03928?v/12.92:((v+0.055)/1.055)**2.4); return 0.2126*r+0.7152*g+0.0722*b}; const ratio=(a,b)=>{const x=lum(a),y=lum(b); return (Math.max(x,y)+0.05)/(Math.min(x,y)+0.05)}; return [...document.querySelectorAll('.cover--blank')].slice(0,24).map(c=>{ const cs=getComputedStyle(c); const stops=cs.backgroundImage.match(/rgba?\\([^)]*\\)/g)||(cs.backgroundColor&&cs.backgroundColor!=='rgba(0, 0, 0, 0)'?[cs.backgroundColor]:[]); const worst=sel=>Math.min(...stops.map(s=>ratio(getComputedStyle(c.querySelector(sel)).color,s))); return stops.length?[worst('.cover-title'), worst('.cover-author')]:[0,0]})})()`);
const covCount = await ev(`document.querySelectorAll('.cover--blank').length`);
check('portadas', 'título y autor se leen sobre el campo plano de su portada tipográfica (≥ 4.5:1), si hay alguna sin imagen', !covCount || (cov?.length > 0 && cov.every(r => r[0] >= 4.5 && r[1] >= 4.5)), JSON.stringify((cov || []).slice(0, 3)));
for (const [id, how] of [['libros', 'tab'], ['cartelera', 'menu'], ['novedades', 'menu'], ['inicio', 'tab']]) {
  await ev(`scrollTo(0, ${id === 'inicio' ? 3000 : 0})`); await sleep(600);
  if (how === 'tab') await ev(`document.querySelector('.tabbar a[href="#${id}"]').click()`);
  else { await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(900); await ev(`document.querySelector('#menu a[href="#${id}"]').click()`); }
  await sleep(2500);
  const d = await ev(`Math.round(document.getElementById('${id}').getBoundingClientRect().top) + 0`);
  check('anclas', `${how === 'tab' ? 'la casilla' : 'la fila del menú'} ${id} aterriza con el título a la vista (|top| ≤ 100 px)`, Math.abs(d) <= 100, d);
}
check('inicio móvil', 'la foto del inicio va sin crédito ni rótulos encima', await ev(`!document.querySelector('.entry-credit, .entry .tag') && !/Recreación IA|Foto real|Datos de muestra|no es inventario|Imagen ilustrativa/.test(document.body.innerText)`));
await send('Page.addScriptToEvaluateOnNewDocument', { source: `try{Object.defineProperty(navigator,'deviceMemory',{get:()=>2})}catch(e){}` });
await send('Page.navigate', { url: URL_ }); await sleep(3000);
const lite = await ev(`(()=>{const h=document.querySelector('.hdr'); const t=document.querySelector('.tabbar'); const a=getComputedStyle(h), b=getComputedStyle(t); return {g:document.documentElement.dataset.glass, hdr:[a.backgroundColor, a.backdropFilter], bar:[b.backgroundColor, b.backdropFilter]}})()`);
check('gama media', 'lite activo: barra de navegación y barra inferior opacas (superficie), sin desenfoque', lite.g === 'lite' && lite.hdr[0] === 'rgb(255, 255, 255)' && lite.hdr[1] === 'none' && lite.bar[0] === 'rgb(255, 255, 255)' && lite.bar[1] === 'none', JSON.stringify(lite));

// ---------- 5. Catálogo ----------
await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY)`); await sleep(1500);
const cat = await ev(`(async()=>{const q=s=>document.querySelector(s); const inp=q('#catalogo input[type=search], #catalogo input'); inp.focus(); inp.value='lomeli'; inp.dispatchEvent(new Event('input',{bubbles:true})); await new Promise(r=>setTimeout(r,1200)); const n=document.querySelectorAll('#catalogo .card').length; const sugg=document.querySelectorAll('#catalogo [role=option]').length; return {n, sugg, status:(q('#catalogo [aria-live]')||{}).textContent}})()`);
check('catálogo', 'buscar «lomeli» (sin acento) encuentra «Perorata» de Luis Felipe Lomelí: resultado y sugerencia, sin errores', cat.n > 0 && cat.sugg > 0, JSON.stringify(cat));
check('catálogo', 'sin errores de consola', !problems.length, problems.join(' | '));
const card = await ev(`(async()=>{const c=document.querySelector('#catalogo .card button, #catalogo .card a, #catalogo .card'); c.click(); await new Promise(r=>setTimeout(r,1300)); const d=document.querySelector('dialog.drawer'); return {open:d&&d.open, sheet:document.documentElement.classList.contains('sheet-open'), wa:!!d.querySelector('.drawer-foot a[href*="wa.me"].btn--primario'), grab:getComputedStyle(d.querySelector('.drawer-grabber')).display, backdrop:getComputedStyle(d, '::backdrop').backgroundColor}})()`);
check('catálogo', 'la ficha abre como hoja con «Preguntar por WhatsApp» al pie, asa de arrastre y velo detrás', card.open && card.sheet && card.wa && card.grab !== 'none' && /rgba\(16, 32, 30, 0\.2/.test(card.backdrop), JSON.stringify(card));
await key('Escape', 'Escape', 27); await sleep(800);
check('catálogo', 'Escape cierra la ficha y libera el scroll', await ev(`!document.querySelector('dialog.drawer').open && !document.documentElement.classList.contains('sheet-open')`));

// ---------- 6. Movimiento reducido ----------
await open(390, 844, { reduced: true });
const rm = await ev(`({motion:document.documentElement.classList.contains('motion'), anims:document.getAnimations().filter(a=>a.playState==='running'&&a.effect?.getTiming().iterations===Infinity).length, listo:document.querySelectorAll('[data-revelar="listo"]').length})`);
check('movimiento reducido', 'sin clase motion, sin animaciones infinitas y ningún titular o imagen preparado para entrar', !rm.motion && rm.anims === 0 && rm.listo === 0, JSON.stringify(rm));
await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(700);
const rmm = await ev(`({open:document.getElementById('menu').open, x:Math.round(document.querySelector('#menu .menu-hoja').getBoundingClientRect().x), tr:getComputedStyle(document.querySelector('#menu .menu-hoja')).transform})`);
check('movimiento reducido', 'el menú abre en su sitio, sin escala ni desplazamiento', rmm.open && rmm.x === 8 && rmm.tr === 'none', JSON.stringify(rmm));
await key('Escape', 'Escape', 27);
check('movimiento reducido', 'sin errores de consola', !problems.length, problems.join(' | '));

// ---------- 7. Escritorio: barra y anclas ----------
await open(1280, 800, { mobile: false });
const dk = await ev(`(()=>{const q=s=>document.querySelector(s); return {menu:getComputedStyle(q('[data-menu-open]')).display, tab:getComputedStyle(q('.tabbar')).display, nav:[...document.querySelectorAll('.hdr-nav a')].map(a=>a.getAttribute('href')), list:getComputedStyle(q('.hdr-list')).display, cta:!!q('.hdr-cta'), canvas:!!q('canvas')}})()`);
check('escritorio', 'sin ☰ ni barra inferior; la barra lleva Catálogo, Eventos, Novedades y Visita en el orden de la página, Mi lista y «Cómo llegar»; el inicio es una foto fija (sin lienzo)', dk.menu === 'none' && dk.tab === 'none' && dk.nav.join() === '#libros,#cartelera,#novedades,#visita' && dk.list !== 'none' && dk.cta && !dk.canvas, JSON.stringify(dk));
await open(900, 800, { mobile: false });
const tb = await ev(`(()=>{const q=s=>document.querySelector(s); return {menu:getComputedStyle(q('[data-menu-open]')).display, nav:getComputedStyle(q('.hdr-nav')).display, list:getComputedStyle(q('.hdr-list')).display, tab:getComputedStyle(q('.tabbar')).display}})()`);
check('escritorio', '761–1100 px: Mi lista, «Cómo llegar» y el ☰ (las secciones en el menú)', tb.menu !== 'none' && tb.nav === 'none' && tb.list !== 'none' && tb.tab === 'none', JSON.stringify(tb));
await open(1280, 800, { mobile: false });
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
check('rendimiento (4× CPU, 4G lenta)', 'LCP ≤ 2500 ms', perf.lcp <= 2500, JSON.stringify(perf));
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
