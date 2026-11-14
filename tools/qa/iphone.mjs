// Llegar a cada sección en iPhone reales (2026-11-14, pedido de Aldo: «no corresponde con las dimensiones correctas de iPhone»).
// node tools/qa/iphone.mjs URL [DIR]   (DIR: capturas e iphone.json; por omisión, el directorio actual). Cambia el navegador con CHROME_PATH.
//
// Perfiles (alto = la zona visible de Safari con sus barras; la pantalla completa lleva sus áreas seguras por
// Emulation.setSafeAreaInsetsOverride): iPhone 16 393×659 (referencia), 13 mini 375×629 (peor alto), SE (3.ª gen.) 375×667, 16 Pro Max
// 440×763, 16 Pro a pantalla completa 402×874 con áreas seguras 62/34 y 320×640 (Zoom de pantalla). UA de iPhone, toque, dpr del aparato.
//
// Para cada perfil comprueba, como lo haría una persona (toque real en la barra inferior o en el menú ☰, no scrollIntoView):
//  · Inicio sin desplazar: titular a 24 px (± 2) bajo la cabecera y de dos renglones; «Cómo llegar» a 212 px (± 2) bajo la cabecera (y 256–312
//    con la barra de 44); la foto ≥ 160 px de alto, con proporción ≤ 3:2 y entera sobre la barra inferior (≥ 8 px de aire);
//  · al llegar a cada sección por su enlace (barra inferior: Catálogo; menú ☰: La casa, Catálogo, Eventos, Café y Visita): el titular a 24 px
//    (± 4) bajo la cabecera y, entre la cabecera y la barra inferior (≥ 8 px de aire con la barra), lo que importa en esa sección:
//      La casa: titular y la primera foto · Catálogo (menú): titular y «Buscar en el catálogo» · Catálogo (barra inferior): chips, la portada
//      central y su pie «título · autor · precio» · Eventos: titular, la tarjeta central y su «Compartir» (≥ 44, con el título en su nombre) ·
//      Café: titular, chips y la tarjeta central de la carta · Visita: titular y «Cómo llegar»;
//  · menú ☰: la hoja no se desplaza (todo cabe: Instagram y Facebook a la vista) y sus filas miden ≥ 44;
//  · ficha (tocar la portada central): el borde de la hoja ≥ área segura + 12 (y ≥ 48 sin área segura) y las acciones del pie dentro de la ventana.
// Sale con 1 si algo falla. Escribe una tabla, iphone.json y una captura por perfil y estado en DIR.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const out = process.argv[3] || '.';
mkdirSync(out, { recursive: true });
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
// [clave, nombre, ancho, alto, dpr, área segura arriba, abajo]
const PERFILES = [
  ['16', 'iPhone 16 (Safari)', 393, 659, 3, 0, 0],
  ['13mini', 'iPhone 13 mini (Safari)', 375, 629, 3, 0, 0],
  ['se3', 'iPhone SE 3.ª gen. (Safari)', 375, 667, 2, 0, 0],
  ['16promax', 'iPhone 16 Pro Max (Safari)', 440, 763, 3, 0, 0],
  ['16pro-completa', 'iPhone 16 Pro (pantalla completa)', 402, 874, 3, 62, 34],
  ['320', 'Zoom de pantalla 320×640', 320, 640, 2, 0, 0]
];
const SHOTS = !process.env.IPHONE_SIN_CAPTURAS;

const port = 9600 + Math.floor(Math.random() * 90);
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions', '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-iphone-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets = [];
for (let i = 0; i < 80 && !targets.some(t => t.type === 'page'); i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} await sleep(250); }
const page = targets.find(t => t.type === 'page');
if (!page) { chrome.kill(); console.error(`iphone.mjs: Chrome no respondió en el puerto ${port} (CHROME_PATH=${process.env.CHROME_PATH || 'por defecto'}; como root hace falta --no-sandbox)`); process.exit(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); const problems = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push('CONSOLA ' + m.params.args.map(a => a.value ?? a.description).join(' '));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`la página lanzó al evaluar: ${r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text}`);
  return r.result?.result?.value;
};
// Espera por condición con tope (no pausas fijas): la expresión devuelve algo verdadero.
const until = async (expr, max = 6000, step = 100) => { const t0 = Date.now(); while (Date.now() - t0 < max) { try { if (await ev(expr)) return true; } catch {} await sleep(step); } return false; };
// Espera a que el desplazamiento y lo que dependa de él se quede quieto (tres lecturas iguales).
const quieto = async (max = 4000) => { let last = '', same = 0; const t0 = Date.now(); while (Date.now() - t0 < max) { const v = await ev(`JSON.stringify([scrollY, document.documentElement.scrollHeight])`); same = v === last ? same + 1 : 0; last = v; if (same >= 3) return; await sleep(120); } };
// Un toque real (touchStart/touchEnd) en el centro de lo que nombra el selector, ya visible.
async function tap(sel) {
  const c = await ev(`(() => { const e = document.querySelector(${JSON.stringify(sel)}); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; })()`);
  if (!c) throw new Error(`no existe ${sel}`);
  await send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: c.x, y: c.y }] });
  await sleep(40);
  await send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
}
async function shot(name) {
  if (!SHOTS) return;
  const s = await send('Page.captureScreenshot', { format: 'png' });
  if (s.result?.data) writeFileSync(join(out, `${name}.png`), Buffer.from(s.result.data, 'base64'));
}
await send('Page.enable'); await send('Runtime.enable');

// Medición en la página: la franja útil (de la cabecera a la barra inferior) y la caja de cada selector.
const MEDIR = String.raw`((sels) => {
  const R = e => { if (!e) return null; const r = e.getBoundingClientRect(); return { t: Math.round(r.top), b: Math.round(r.bottom), l: Math.round(r.left), r: Math.round(r.right), w: Math.round(r.width), h: Math.round(r.height) }; };
  const vis = e => { if (!e) return false; const cs = getComputedStyle(e); if (cs.display === 'none' || cs.visibility === 'hidden' || +cs.opacity === 0) return false; const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; };
  const hdr = document.querySelector('.hdr'), tab = document.querySelector('.tabbar');
  const band = { t: Math.round(hdr.getBoundingClientRect().bottom), b: vis(tab) ? Math.round(tab.getBoundingClientRect().top) : innerHeight };
  const el = {};
  for (const [k, s] of Object.entries(sels)) { const e = document.querySelector(s); el[k] = e ? { ...R(e), vis: vis(e), name: e.getAttribute('aria-label') || '' } : null; }
  return { band, H: innerHeight, W: innerWidth, el};
})`;
const medir = sels => ev(`${MEDIR}(${JSON.stringify(sels)})`);

const DESTINOS = [
  // [clave, cómo se llega, enlace, selectores que deben verse entre las barras, titular (o null)]
  ['casa', 'menu', '#casa', { titular: '#house-title', foto: '.house-track .still-img' }, 'titular'],
  ['catalogo-menu', 'menu', '#libros', { titular: '#books-title', accion: '.explore-open' }, 'titular'],
  ['catalogo-barra', 'barra', '#colecciones', { chips: '.rail-chips', pieza: '.c3d--portada .c3d-item.is-centro .cover', pie: '.cf-meta' }, null],
  ['eventos', 'menu', '#cartelera', { titular: '#bill-title', pieza: '.c3d--evento .c3d-item.is-centro .bill-card', accion: '.c3d--evento .c3d-item.is-centro .bill-share' }, 'titular'],
  ['cafe', 'menu', '#cafe', { titular: '#cafe-title', chips: '.cafe-chips', pieza: '.c3d--carta .c3d-item.is-centro .cafe-card' }, 'titular'],
  ['visita', 'menu', '#visita', { titular: '#visit-title', accion: '.visit-actions .btn' }, 'titular']
];

const rows = [];
const report = [];
const check = (where, name, ok, detail = '') => report.push({ where, name, ok: !!ok, detail: ok ? '' : String(detail) });
const AIRE = 8; // aire mínimo con la barra inferior

for (const [key, nombre, w, h, dpr, top, bottom] of PERFILES) {
  await send('Emulation.setUserAgentOverride', { userAgent: UA, platform: 'iPhone' });
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: dpr, mobile: true, screenWidth: w, screenHeight: h });
  await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
  const insets = await send('Emulation.setSafeAreaInsetsOverride', { insets: { top, bottom, left: 0, right: 0 } });
  if (insets.error && (top || bottom)) check(key, 'áreas seguras emuladas (Emulation.setSafeAreaInsetsOverride)', false, insets.error.message);
  await send('Emulation.setEmulatedMedia', { media: 'screen', features: [{ name: 'prefers-color-scheme', value: 'light' }] });
  await send('Page.navigate', { url: URL_ });
  await until(`document.readyState === 'complete' && document.documentElement.classList.contains('js')`, 10000);
  await until(`document.fonts.status === 'loaded' && document.querySelector('.entry-poster').complete`, 6000);
  await sleep(400);
  const fila = { perfil: nombre, vp: `${w}×${h}`, insets: `${top}/${bottom}` };

  // ---------- Inicio ----------
  const ini = await medir({ titular: '.entry-title', cta: '.entry-actions .btn', foto: '.entry-media', dir: '.entry-address' });
  const { band } = ini; const e = ini.el;
  fila.franja = band.b - band.t;
  fila.h1 = `${e.titular.t}–${e.titular.b}`;
  fila.cta = `${e.cta.t}–${e.cta.b}`;
  fila.foto = `${e.foto.w}×${e.foto.h} → ${e.foto.b}`;
  fila.fotoAire = band.b - e.foto.b;
  check(key, 'inicio: titular a 24 px bajo la cabecera (± 2)', Math.abs(e.titular.t - band.t - 24) <= 2, `${e.titular.t - band.t}`);
  check(key, 'inicio: titular de dos renglones (82 ± 2 px)', w <= 359 || Math.abs(e.titular.h - 82) <= 2, `${e.titular.h}`);
  check(key, 'inicio: «Cómo llegar» a 212 px bajo la cabecera (± 2): y 256–312 con la barra de 44', w <= 359 || Math.abs(e.cta.t - band.t - 212) <= 2, `${e.cta.t - band.t}`);
  check(key, 'inicio: la foto ≥ 160 px de alto y ≤ 3:2', e.foto.h >= 160 && e.foto.w / e.foto.h >= 1.49, `${e.foto.w}×${e.foto.h}`);
  check(key, `inicio: la foto entera sobre la barra inferior (≥ ${AIRE} px)`, w <= 359 || band.b - e.foto.b >= AIRE, `${band.b - e.foto.b} px`);
  await shot(`${key}-inicio`);

  // ---------- Llegar a cada sección ----------
  for (const [dest, via, href, sels, tit] of DESTINOS) {
    await ev(`scrollTo(0, 0)`); await sleep(150);
    if (via === 'menu') {
      await tap('.hdr .menu-btn');
      await until(`document.querySelector('#menu').open && !document.querySelector('#menu').classList.contains('is-closing')`, 4000);
      await sleep(450);
      await tap(`#menu .menu-row[href="${href}"]`);
      await until(`!document.querySelector('#menu').open`, 4000);
    } else {
      await tap(`.tabbar a[href="${href}"], .tabbar a[href="#libros"]`); // (#libros: la página de antes del 2026-11-14, para comparar)
    }
    await sleep(300); await quieto();
    // Carga diferida del carrusel de la sección: se espera a su pieza central (y vuelve a quedarse quieto).
    if (sels.pieza) { await until(`!!document.querySelector(${JSON.stringify(sels.pieza)})`, 8000); await sleep(500); await quieto(); }
    const m = await medir(sels);
    const b = m.band;
    const res = [];
    for (const [k, r] of Object.entries(m.el)) {
      const ok = r && r.vis && r.t >= b.t && r.b <= b.b - AIRE && r.l >= -1 && r.r <= m.W + 1;
      res.push(`${k} ${r ? `${r.t}–${r.b}` : '∅'}${ok ? '' : ' ✗'}`);
      check(key, `${dest}: ${k} entero entre la cabecera y la barra inferior (≥ ${AIRE} px de aire)`, ok, r ? `${r.t}–${r.b} en la franja ${b.t}–${b.b}` : 'no existe');
    }
    if (tit) check(key, `${dest}: titular a 24 px bajo la cabecera (± 4)`, m.el.titular && Math.abs(m.el.titular.t - b.t - 24) <= 4, m.el.titular ? `${m.el.titular.t - b.t}` : '∅');
    if (dest === 'eventos' && m.el.accion) check(key, 'eventos: «Compartir» ≥ 44 con el título en su nombre', m.el.accion.w >= 44 && m.el.accion.h >= 44 && /^Compartir «.+»$/.test(m.el.accion.name), `${m.el.accion.w}×${m.el.accion.h} «${m.el.accion.name}»`);
    if (dest === 'catalogo-barra') check(key, 'catálogo: la barra inferior marca «Catálogo»', await ev(`document.querySelector('.tabbar a:nth-of-type(2)').getAttribute('aria-current') === 'location'`), 'sin aria-current');
    const marca = { casa: '#inicio', 'catalogo-menu': '#libros', 'catalogo-barra': '#libros' }[dest] || '';
    const cur = await ev(`[...document.querySelectorAll('.tabbar a')].filter(a => a.getAttribute('aria-current')).map(a => a.dataset.zona || a.getAttribute('href')).join()`);
    check(key, `${dest}: la barra inferior marca ${marca || 'ninguna casilla'}`, cur === marca, cur || 'ninguna');
    fila[dest] = res.join(' · ');
    await sleep(450); // la pastilla de la barra inferior termina de irse o de llegar (dur-base) antes de la captura
    await shot(`${key}-${dest}`);
  }

  // ---------- Menú ☰ ----------
  await ev(`scrollTo(0, 0)`); await sleep(150);
  await tap('.hdr .menu-btn');
  await until(`document.querySelector('#menu').open`, 4000); await sleep(700);
  const menu = await ev(`(() => { const h = document.querySelector('.menu-hoja'); const rows = [...document.querySelectorAll('#menu .menu-row')].map(r => Math.round(r.getBoundingClientRect().height)).filter(Boolean); /* Novedades sin llegadas no existe (alto 0) */ const redes = [...document.querySelectorAll('.menu-redes .btn')].map(r => Math.round(r.getBoundingClientRect().bottom)); return { sh: h.scrollHeight, ch: h.clientHeight, fondo: Math.round(h.getBoundingClientRect().bottom), rows, redes }; })()`);
  fila.menu = `desborda ${menu.sh - menu.ch} · filas ${Math.min(...menu.rows)}–${Math.max(...menu.rows)}`;
  check(key, 'menú: todo cabe en la hoja (sin desplazar; Instagram y Facebook a la vista)', menu.sh - menu.ch <= 1 && menu.redes.every(y => y <= menu.fondo), `desborda ${menu.sh - menu.ch} px`);
  check(key, 'menú: filas ≥ 44', Math.min(...menu.rows) >= 44, menu.rows.join(','));
  await shot(`${key}-menu`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await until(`!document.querySelector('#menu').open`, 3000); await sleep(300);

  // ---------- Ficha ----------
  await tap('.tabbar a:nth-of-type(2)'); await sleep(300); await quieto();
  await until(`!!document.querySelector('.c3d--portada .c3d-item.is-centro .card')`, 8000); await sleep(300);
  await tap('.c3d--portada .c3d-item.is-centro .card');
  await until(`document.querySelector('#cat-drawer').open`, 5000); await sleep(800);
  const f = await ev(`(() => { const d = document.querySelector('#cat-drawer').getBoundingClientRect(); const a = document.querySelector('.drawer-actions').getBoundingClientRect(); const c = document.querySelector('.drawer-close').getBoundingClientRect(); return { top: Math.round(d.top), cerrar: Math.round(c.top), acc: Math.round(a.bottom), H: innerHeight }; })()`);
  fila.ficha = `borde ${f.top} · × ${f.cerrar} · acciones → ${f.acc}`;
  check(key, `ficha: el borde de la hoja ≥ área segura + 12 (${Math.max(48, top + 12)})`, f.top >= Math.max(48, top + 12) - 1, `${f.top}`);
  check(key, 'ficha: las acciones del pie dentro de la ventana', f.acc <= f.H, `${f.acc} > ${f.H}`);
  await shot(`${key}-ficha`);
  await send('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await send('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
  await sleep(500);
  rows.push(fila);
}
await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 0, bottom: 0, left: 0, right: 0 } }).catch(() => {});

for (const p of problems) check('consola', 'sin errores de consola ni excepciones', false, p);
writeFileSync(join(out, 'iphone.json'), JSON.stringify({ rows, report }, null, 1));
console.log('\n== Llegar a cada sección en iPhone ==');
for (const r of rows) {
  console.log(`\n${r.perfil} ${r.vp} (áreas ${r.insets}) · franja ${r.franja} px`);
  console.log(`  inicio: titular ${r.h1} · «Cómo llegar» ${r.cta} · foto ${r.foto} (aire ${r.fotoAire})`);
  for (const [dest] of DESTINOS) console.log(`  ${dest}: ${r[dest]}`);
  console.log(`  menú: ${r.menu} · ficha: ${r.ficha}`);
}
const bad = report.filter(r => !r.ok);
console.log(`\n${report.length - bad.length}/${report.length} comprobaciones bien`);
bad.forEach(r => console.log(`  ✗ [${r.where}] ${r.name}: ${r.detail}`));
ws.close(); chrome.kill();
process.exit(bad.length ? 1 : 0);
