// Llegar, presionar, avisar y pausar: lo que dejó pendiente la primera auditoría de los 20 principios (2026-11-16, segunda ronda).
// Uso: node tools/qa/navegacion.mjs URL   (Playwright, como hojas.mjs y guias.mjs: PLAYWRIGHT_PATH, «playwright» instalado o /opt/node-tools; sin él sale con 2)
//
//  L1 · llegar a una sección por su enlace (☰ en el teléfono, barra de navegación en 1440): su titular «por línea» y su entradilla quedan colocados
//       en el mismo fotograma en que la sección llega a la vista (≤ 1 fotograma de diferencia) y lo que se queda fuera de esa sección sigue por
//       entrar (ninguna otra sección lleva `is-llegada`).
//  L2 · Eventos al llegar por enlace: con un evento con fecha, la sección ya está armada (sin esqueleto, sin salto: CLS 0 y el destacado ya presente).
//  P1 · presionado: con «reducir movimiento» el color de `:active` es distinto del de reposo y del de hover en cada familia (primaria, secundaria,
//       chip y chip elegido, contorno, plano, marcador sin guardar y guardado, casilla de la barra inferior, ☰, fila del menú, interruptor); la
//       escala sigue solo con movimiento. Con vidrio (8 núcleos) y en gama media (4).
//  B1 · #libro-<id> que no existe (id inexistente, caracteres raros, % mal formado, catálogo que no carga): aterriza en el Catálogo, muestra el
//       aviso «Ese libro ya no está en el catálogo.» (rol status, dentro de la ventana) y no abre ninguna hoja; un id real sigue abriendo su ficha.
//  I1 · «Pausar el movimiento» también en el menú ☰: mismo interruptor (role="switch", rótulo visible, objetivo ≥ 44), un toque en uno mueve al
//       otro, el estado se guarda en `localStorage`, con «reducir movimiento» los dos quedan encendidos, `aria-disabled` y con su nota.
//  M1 · la última fila del menú ☰ termina de entrar en ≤ 480 ms (con movimiento).
//  V1 · el velo (`::backdrop`) de cada hoja no tiene transición con movimiento reducido ni con la pausa del pie.
// Sale con 1 si algo falla.
import { existsSync, readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join, resolve } from 'node:path';

let pw = null;
for (const ruta of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { const m = await import(ruta.startsWith('/') ? pathToFileURL(ruta).href : ruta); pw = m.default?.chromium ? m.default : m; if (pw?.chromium) break; pw = null; } catch { /* la siguiente */ }
}
if (!pw) { console.error('navegacion.mjs: no encuentro Playwright (PLAYWRIGHT_PATH=/ruta/a/playwright/index.js)'); process.exit(2); }
const CHROME = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const SOLO = process.argv.find(a => a.startsWith('--solo='))?.slice(7).split(',') ?? null;
const quiere = k => !SOLO || SOLO.includes(k);
const sleep = ms => new Promise(r => setTimeout(r, ms));
const root = resolve(import.meta.dirname, '..', '..');

const PERFILES = {
  iphone: { viewport: { width: 393, height: 659 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  // El ancho del teléfono con puntero: `:active` solo se sostiene con el ratón (CDP no lo sostiene con toque) y así se mide la barra inferior.
  ancho393: { viewport: { width: 393, height: 659 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
  d1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1, isMobile: false, hasTouch: false },
};
const NUCLEOS = n => `Object.defineProperty(Navigator.prototype, 'hardwareConcurrency', { get: () => ${n} }); Object.defineProperty(Navigator.prototype, 'deviceMemory', { get: () => ${n} });`;
const SIN_ALMACEN = `Object.defineProperty(window, 'localStorage', { get() { throw new DOMException('bloqueado', 'SecurityError'); } });`;
const PAUSA = `try { localStorage.setItem('iti-b4-motion', 'off'); } catch (e) {}`;

const res = [];
const intenta = async (regla, fn) => { try { await fn(); } catch (e) { res.push({ regla, ok: false, texto: e.message }); console.log(`✗ ${regla} ${e.message.split('\n')[0]}`); } };
const ok = (regla, cond, texto) => { res.push({ regla, ok: Boolean(cond), texto }); console.log(`${cond ? '✓' : '✗'} ${regla} ${texto}`); };

const enDias = n => new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(Date.now() + n * 86_400_000));
const EVENTO_DE_PRUEBA = { eventos: [{ id: 'prueba-navegacion', tipo: 'Lectura', titulo: 'Evento de prueba', fecha: enDias(5), hora: '18:57', fin: null, con: null, descripcion: 'Texto de prueba del arnés. No es un evento real.', imagen: 'assets/img/cartelera-1.webp', alt: 'La sala central', reserva: null }] };

async function abrir(perfil, { init = [], reduce = false, eventos = null, rutas = [], url = URL_, esperar = 3200 } = {}) {
  const browser = await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars'] });
  const context = await browser.newContext({ ...PERFILES[perfil], locale: 'es-MX', timezoneId: 'America/Monterrey', reducedMotion: reduce ? 'reduce' : 'no-preference', colorScheme: 'light' });
  for (const i of init) await context.addInitScript(i);
  if (eventos) await context.route('**/assets/data/eventos.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(eventos) }));
  for (const r of rutas) await context.route(r, route => route.abort());
  await context.route(/google\.com|wa\.me|instagram\.com|facebook\.com|openstreetmap\.org|lu\.ma/, route => route.abort());
  const page = await context.newPage();
  context.on('page', p => { if (p !== page) p.close().catch(() => {}); }); // «Cómo llegar» y las redes abren pestañas: se cierran
  const consola = [];
  page.on('pageerror', e => consola.push(`pageerror: ${e.message}`));
  await page.goto(url, { waitUntil: 'load' });
  await sleep(esperar);
  return { browser, page, context, consola };
}
const rect = (page, sel) => page.evaluate(s => { const el = document.querySelector(s); if (!el) return null; const r = el.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height, cx: r.x + r.width / 2, cy: r.y + r.height / 2 }; }, sel);
const tap = async (page, perfil, sel, dx = 0.5, dy = 0.5) => { const b = await rect(page, sel); if (!b) throw new Error(`no existe ${sel}`); const x = b.x + b.w * dx, y = b.y + b.h * dy; if (PERFILES[perfil].hasTouch) await page.touchscreen.tap(x, y); else await page.mouse.click(x, y); };
const centrar = async (page, sel, espera = 1200) => { await page.evaluate(s => document.querySelector(s)?.scrollIntoView({ block: 'center', behavior: 'instant' }), sel); await sleep(espera); };

// ---------- L1 · llegar por un enlace ----------
// Muestrea cada fotograma desde el clic: lo que ve la persona en el titular de la sección de destino y en su entradilla.
const SONDA_LLEGADA = ([sec, ms]) => new Promise(done => {
  const s = document.querySelector(sec); const out = [];
  addEventListener('click', () => {
    const t0 = performance.now();
    const tick = () => {
      const t = performance.now() - t0;
      const lineas = [...s.querySelectorAll('.sec-head .linea-in')];
      const texto = s.querySelector('.sec-head .sec-texto, .sec-texto');
      const ty = lineas.map(l => new DOMMatrix(getComputedStyle(l).transform).m42);
      const h = s.querySelector('.sec-head .h2')?.getBoundingClientRect();
      out.push({ t: +t.toFixed(1), sy: Math.round(scrollY), lineas: lineas.length, ty: Math.max(0, ...ty.map(Math.abs)), op: texto ? +getComputedStyle(texto).opacity : 1, ttf: texto ? Math.abs(new DOMMatrix(getComputedStyle(texto).transform).m42) : 0, enVista: Boolean(h && h.top >= 0 && h.bottom <= innerHeight) });
      if (t < ms) requestAnimationFrame(tick); else done(out);
    };
    requestAnimationFrame(tick);
  }, { capture: true, once: true });
});
const colocado = m => m.ty < 0.5 && m.op >= 0.99 && m.ttf < 0.5;
async function llegar(perfil, destino, { reduce = false } = {}) {
  const { browser, page, consola } = await abrir(perfil, { reduce, esperar: 3400 });
  const sec = `#${destino}`;
  const enlace = PERFILES[perfil].hasTouch ? `.menu-row[href="${sec}"]` : `.hdr-nav a[href="${sec}"]`;
  if (PERFILES[perfil].hasTouch) { await tap(page, perfil, '[data-menu-open]'); await sleep(900); }
  const dividido = await page.evaluate(s => document.querySelectorAll(`${s} .sec-head .linea-in`).length, sec);
  const oculto = await page.evaluate(s => { const l = document.querySelector(`${s} .sec-head .linea-in`); return l ? Math.abs(new DOMMatrix(getComputedStyle(l).transform).m42) : -1; }, sec);
  const p = page.evaluate(SONDA_LLEGADA, [sec, 1500]);
  await tap(page, perfil, enlace);
  const m = await p;
  const llegada = m.findIndex(x => x.enVista), listo = m.findIndex((x, i) => colocado(x) && x.enVista && i >= llegada);
  const otras = await page.evaluate(s => [...document.querySelectorAll('.is-llegada')].filter(e => !e.closest(s)).length, sec);
  await browser.close();
  return { llegada, listo, tListo: listo >= 0 ? m[listo].t : null, tLlegada: llegada >= 0 ? m[llegada].t : null, lineas: dividido, oculto, otras, consola, ultimo: m.at(-1), tras: listo - llegada };
}
if (quiere('L1')) await intenta('L1', async () => {
  for (const [perfil, nombre, destinos] of [['iphone', 'iPhone 16', ['visita', 'cartelera', 'cafe']], ['d1440', '1440', ['visita', 'cartelera', 'cafe']]]) {
    for (const d of destinos) {
      const r = await llegar(perfil, d);
      ok('L1', r.llegada >= 0 && r.listo >= 0 && r.tras <= 1 && r.otras === 0, `${nombre} → #${d}: titular (${r.lineas} líneas, antes del toque desplazadas ${r.oculto.toFixed ? r.oculto.toFixed(0) : r.oculto} px) y entradilla colocados ${r.listo >= 0 ? `${r.tras} fotograma(s) después de llegar (llega a los ${r.tLlegada} ms; colocados a los ${r.tListo} ms)` : 'nunca (en 1 500 ms)'}; secciones ajenas con is-llegada: ${r.otras}`);
    }
  }
  // Con movimiento reducido todo queda colocado de por sí: sirve de control (misma sonda).
  const r = await llegar('d1440', 'visita', { reduce: true });
  ok('L1', r.llegada >= 0 && r.tras <= 1, `1440 con movimiento reducido → #visita: ya colocado ${r.tras} fotograma(s) después de llegar (control)`);
});

// ---------- L2 · Eventos al llegar por enlace, con un evento con fecha ----------
if (quiere('L2')) await intenta('L2', async () => {
  for (const [perfil, nombre] of [['iphone', 'iPhone 16'], ['d1440', '1440']]) {
    const { browser, page } = await abrir(perfil, { eventos: EVENTO_DE_PRUEBA, esperar: 2600, init: [`window.__cls = 0; new PerformanceObserver(l => l.getEntries().forEach(e => { if (!e.hadRecentInput) window.__cls += e.value; })).observe({ type: 'layout-shift', buffered: true });`] });
    if (PERFILES[perfil].hasTouch) { await tap(page, perfil, '[data-menu-open]'); await sleep(900); }
    const antes = await page.evaluate(() => { window.__cls = 0; return { destacado: Boolean(document.querySelector('[data-ev] .ev-prox')), listo: document.querySelector('[data-ev]')?.classList.contains('is-ready') }; });
    const p = page.evaluate(() => new Promise(done => { const out = []; addEventListener('click', () => { const t0 = performance.now(); const tick = () => { const t = performance.now() - t0; const e = document.querySelector('[data-ev]'); const r = e?.getBoundingClientRect(); out.push({ t, y: r ? Math.round(r.top) : null, h: r ? Math.round(r.height) : null, dest: Boolean(e?.querySelector('.ev-prox')), sy: Math.round(scrollY) }); if (t < 1200) requestAnimationFrame(tick); else done(out); }; requestAnimationFrame(tick); }, { capture: true, once: true }); }));
    await tap(page, perfil, PERFILES[perfil].hasTouch ? '.menu-row[href="#cartelera"]' : '.hdr-nav a[href="#cartelera"]');
    const m = await p; const cls = await page.evaluate(() => window.__cls);
    const alturas = [...new Set(m.filter(x => x.sy > 0).map(x => x.h))];
    ok('L2', antes.destacado && cls < 0.001 && alturas.length <= 1, `${nombre}: Eventos ya armado antes de llegar (destacado: ${antes.destacado}); al llegar por enlace CLS ${cls.toFixed(4)} y altura de la sección ${alturas.join(' / ') || '—'} px`);
    await browser.close();
  }
});

// ---------- P1 · presionado ----------
async function presionado(perfil, nucleos, { reduce, pausa = false }) {
  const { browser, page } = await abrir(perfil, { reduce, init: [NUCLEOS(nucleos), ...(pausa ? [PAUSA] : [])], esperar: 3000 });
  const out = [];
  const color = (sel, i = 0) => page.evaluate(([s, k]) => { const el = document.querySelectorAll(s)[k]; return el ? getComputedStyle(el).backgroundColor : null; }, [sel, i]);
  const escala = sel => page.evaluate(s => { const t = getComputedStyle(document.querySelector(s)).transform; return t === 'none' ? 1 : new DOMMatrix(t).a; }, sel);
  async function familia(nombre, sel, { preparar, medir = color } = {}) {
    try {
      if (preparar) await preparar();
      await centrar(page, sel, 500);
      const b = await rect(page, sel);
      if (!b) { out.push({ nombre, error: 'no existe' }); return; }
      await page.mouse.move(2, 2); await sleep(120);
      const reposo = await medir(sel);
      await page.mouse.move(b.cx, b.cy); await sleep(160);
      const hover = await medir(sel);
      await page.mouse.down(); await sleep(160);
      const activo = await medir(sel); const esc = await escala(sel);
      await page.mouse.move(2, 2); await page.mouse.up(); await sleep(60); // el ratón sale antes de soltar: no hay clic
      out.push({ nombre, reposo, hover, activo, esc });
    } catch (e) { out.push({ nombre, error: e.message.split('\n')[0] }); }
  }
  // Piezas de prueba para lo que el sitio no muestra hoy sin datos (secundario, contorno, vidrio): mismas clases, mismo CSS.
  await page.evaluate(() => {
    const caja = document.createElement('div'); caja.id = 'prueba-estados'; caja.style.position = 'fixed'; caja.style.left = '16px'; caja.style.top = '120px'; caja.style.zIndex = '60'; caja.style.display = 'grid'; caja.style.gap = '16px';
    for (const [id, cls] of [['t-sec', 'btn btn--secundario'], ['t-con', 'btn btn--contorno'], ['t-vid', 'btn btn--vidrio']]) { const b = document.createElement('button'); b.type = 'button'; b.id = id; b.className = cls; b.textContent = id; caja.append(b); }
    document.body.append(caja);
  });
  await familia('primaria', '.entry-actions .btn--primario');
  await familia('secundaria', '#t-sec');
  await familia('contorno', '#t-con');
  await familia('vidrio', '#t-vid');
  if (PERFILES[perfil].viewport.width >= 761) await familia('plano', '.hdr-list');
  await page.evaluate(() => document.querySelector('#prueba-estados').remove());
  await centrar(page, '.c3d--portada', 2800);
  await familia('chip', '.rail-chip:not([aria-checked="true"])');
  await familia('chip elegido', '.rail-chip[aria-checked="true"]');
  await familia('marcador', '.rail-item.is-centro .save');
  await familia('marcador guardado', '.rail-item.is-centro .save', { preparar: () => page.evaluate(() => document.querySelector('.rail-item.is-centro .save').setAttribute('aria-pressed', 'true')) });
  await page.evaluate(() => document.querySelector('.rail-item.is-centro .save').setAttribute('aria-pressed', 'false'));
  if (!reduce) await familia('interruptor', '.ftr .interruptor-pista', { medir: sel => page.evaluate(s => getComputedStyle(document.querySelector(s)).backgroundColor, sel) }); // con «reducir movimiento» está encendido y deshabilitado: no responde por diseño
  if (PERFILES[perfil].viewport.width <= 760) {
    await page.evaluate(() => window.scrollTo(0, 0)); await sleep(500);
    await familia('casilla', '.tabbar a[href="#colecciones"]');
    await familia('☰', '.hdr [data-menu-open]');
  }
  await browser.close();
  return out;
}
if (quiere('P1')) await intenta('P1', async () => {
  for (const [perfil, nombre] of [['d1440', '1440'], ['ancho393', '393']]) {
    for (const nucleos of [8, 4]) {
      const r = await presionado(perfil, nucleos, { reduce: true });
      for (const f of r) {
        if (f.error) { ok('P1', false, `${nombre} · ${nucleos} núcleos · ${f.nombre}: ${f.error}`); continue; }
        ok('P1', f.activo !== f.reposo && f.activo !== f.hover, `${nombre} · ${nucleos} núcleos · ${f.nombre}, con movimiento reducido: reposo ${f.reposo} → hover ${f.hover} → presionado ${f.activo}; escala ${f.esc}`);
      }
    }
  }
  // Con la pausa del pie (html.motion apagado, el interruptor encendido y habilitado): la misma respuesta de color en cada familia.
  for (const f of await presionado('d1440', 8, { reduce: false, pausa: true })) {
    if (f.error) { ok('P1', false, `1440 · pausa · ${f.nombre}: ${f.error}`); continue; }
    ok('P1', f.activo !== f.reposo && f.activo !== f.hover && f.esc === 1, `1440 · con la pausa del pie · ${f.nombre}: reposo ${f.reposo} → hover ${f.hover} → presionado ${f.activo}; escala ${f.esc}`);
  }
  // La escala sigue solo con movimiento.
  for (const reduce of [false, true]) {
    const r = await presionado('d1440', 8, { reduce });
    const p = r.find(x => x.nombre === 'primaria');
    if (!reduce) { const i = r.find(x => x.nombre === 'interruptor'); ok('P1', i && i.activo !== i.reposo && i.activo !== i.hover, `1440 con movimiento · interruptor apagado: reposo ${i?.reposo} → hover ${i?.hover} → presionado ${i?.activo}`); }
    ok('P1', reduce ? p.esc === 1 : p.esc < 1 && p.esc >= 0.9, `1440 ${reduce ? 'con movimiento reducido' : 'con movimiento'}: la primaria presionada escala ${p.esc} (${reduce ? 'debe ser 1' : 'debe estar entre 0.9 y 1'}) y su color es ${p.activo}`);
  }
});

// ---------- B1 · #libro-<id> que no existe ----------
const catalogo = JSON.parse(readFileSync(join(root, 'assets/data/catalog.json'), 'utf8'));
const idReal = (catalogo.books ?? catalogo)[0].id;
async function enlaceLibro(perfil, hash, { rutas = [] } = {}) {
  const { browser, page, consola } = await abrir(perfil, { rutas, url: `${URL_.replace(/#.*$/, '')}${hash}`, esperar: 3800 });
  const r = await page.evaluate(() => {
    const t = document.querySelector('.toast'); const tb = t?.getBoundingClientRect();
    const lib = document.querySelector('#libros')?.getBoundingClientRect();
    return {
      aviso: t && t.matches(':popover-open') ? t.textContent.trim() : null, rol: t?.getAttribute('role'), dentro: Boolean(tb && tb.top >= 0 && tb.bottom <= innerHeight && tb.height > 0),
      hojas: [...document.querySelectorAll('dialog[open]')].filter(d => d.id !== 'explorer' || d.matches(':modal')).map(d => d.id), sy: Math.round(scrollY), libros: lib ? Math.round(lib.top) : null, h: lib ? Math.round(lib.height) : null,
      hash: location.hash, titulo: document.querySelector('#cat-drawer [data-d-title]')?.textContent.trim() ?? '',
    };
  });
  await browser.close();
  return { ...r, consola };
}
if (quiere('B1')) await intenta('B1', async () => {
  const TEXTO = 'Ese libro ya no está en el catálogo.';
  for (const [perfil, nombre] of [['iphone', 'iPhone 16'], ['d1440', '1440']]) {
    for (const [etiqueta, hash] of [['id inexistente', '#libro-no-existe-123'], ['caracteres raros', '#libro-%C3%91%C3%81%3Cb%3E%22%27%26%E2%82%AC'], ['% mal formado', '#libro-%E0%A4%A'], ['vacío', '#libro-']]) {
      const r = await enlaceLibro(perfil, hash);
      ok('B1', r.aviso === TEXTO && r.rol === 'status' && r.dentro && !r.hojas.length && r.libros !== null && r.libros >= -2 && r.libros < 120 && r.hash === '' && !r.consola.length,
        `${nombre} · ${etiqueta}: aviso «${r.aviso}» (rol ${r.rol}, dentro de la ventana: ${r.dentro}); hojas abiertas: ${r.hojas.length}; #libros arriba a ${r.libros} px (scrollY ${r.sy}); dirección «${r.hash}»; errores ${r.consola.length}`);
    }
    const sin = await enlaceLibro(perfil, '#libro-no-existe', { rutas: ['**/assets/data/catalog.json'] });
    ok('B1', sin.libros !== null && sin.libros >= -2 && sin.libros < 120 && !sin.hojas.length && !sin.consola.length && sin.aviso !== TEXTO,
      `${nombre} · catálogo que no carga: aterriza en el Catálogo (#libros a ${sin.libros} px), sin hoja, sin afirmar que el libro no existe (aviso: ${sin.aviso ?? 'ninguno'}), errores ${sin.consola.length}`);
    const real = await enlaceLibro(perfil, `#libro-${idReal}`);
    ok('B1', real.hojas.includes('cat-drawer') && real.titulo && real.aviso !== TEXTO, `${nombre} · id real «${idReal}»: abre su ficha (${real.titulo}) y no avisa nada`);
  }
});

// ---------- I1 · «Pausar el movimiento» también en el menú ☰ ----------
if (quiere('I1')) await intenta('I1', async () => {
  const { browser, page } = await abrir('iphone', { esperar: 2400 });
  await tap(page, 'iphone', '[data-menu-open]'); await sleep(900);
  const info = () => page.evaluate(() => {
    const t = [...document.querySelectorAll('[data-motion-toggle]')];
    return { n: t.length, estados: t.map(x => x.getAttribute('aria-checked')), roles: t.map(x => x.getAttribute('role')), rotulos: t.map(x => x.textContent.trim()), alto: t.map(x => Math.round(x.getBoundingClientRect().height)), enMenu: t.map(x => Boolean(x.closest('#menu'))),
      motion: document.documentElement.classList.contains('motion'), guardado: (() => { try { return localStorage.getItem('iti-b4-motion'); } catch { return 'x'; } })() };
  });
  const a = await info();
  const fila = await page.evaluate(() => { const m = document.querySelector('#menu [data-motion-toggle]'); if (!m) return null; const fila = m.closest('.menu-movimiento, li, div'); const r = m.getBoundingClientRect(); const pieEl = document.querySelector('.menu-pie'); const redes = document.querySelector('.menu-redes')?.getBoundingClientRect(); const cs = fila ? getComputedStyle(fila) : null; return { linea: cs ? cs.borderTopWidth : null, despuesDeRedes: Boolean(redes && r.top >= redes.bottom - 1), dentroDelPie: Boolean(pieEl && pieEl.contains(m)), nota: m.getAttribute('aria-describedby') }; });
  ok('I1', a.n === 2 && a.enMenu.includes(true) && a.roles.every(r => r === 'switch') && a.rotulos.every(t => t === 'Pausar el movimiento') && a.alto.every(h => h >= 44) && fila?.despuesDeRedes && fila?.dentroDelPie && parseFloat(fila?.linea) >= 1,
    `menú ☰: ${a.n} interruptores (role ${a.roles.join('/')}; rótulo «${a.rotulos[0]}»; alto ${a.alto.join('/')} px); fila después de Instagram y Facebook: ${fila?.despuesDeRedes}; línea fina arriba: ${fila?.linea}`);
  await tap(page, 'iphone', '#menu [data-motion-toggle]'); await sleep(500);
  const b = await info();
  ok('I1', b.estados.every(e => e === 'true') && !b.motion && b.guardado === 'off', `un toque en el del menú: los dos aria-checked=${b.estados.join('/')}, html.motion=${b.motion}, localStorage=${b.guardado}`);
  await tap(page, 'iphone', '[data-menu-close]'); await sleep(900);
  await centrar(page, '.ftr [data-motion-toggle]', 600);
  await tap(page, 'iphone', '.ftr [data-motion-toggle]'); await sleep(500);
  const c = await info();
  ok('I1', c.estados.every(e => e === 'false') && c.motion && c.guardado === 'on', `un toque en el del pie: los dos aria-checked=${c.estados.join('/')}, html.motion=${c.motion}, localStorage=${c.guardado}`);
  // Persiste al recargar: si estaba pausado, los dos nacen encendidos.
  await tap(page, 'iphone', '.ftr [data-motion-toggle]'); await sleep(400);
  await page.reload({ waitUntil: 'load' }); await sleep(2200);
  const d = await info();
  ok('I1', d.estados.every(e => e === 'true') && !d.motion, `tras recargar con la pausa guardada: ${d.estados.join('/')}, html.motion=${d.motion}`);
  await browser.close();
  // Con «reducir movimiento» del sistema: encendidos, aria-disabled y con su nota, en el menú y en el pie.
  const r = await abrir('iphone', { reduce: true, esperar: 2400 });
  await tap(r.page, 'iphone', '[data-menu-open]'); await sleep(900);
  const rr = await r.page.evaluate(() => [...document.querySelectorAll('[data-motion-toggle]')].map(t => ({ marcado: t.getAttribute('aria-checked'), inhabilitado: t.getAttribute('aria-disabled'), nota: (document.getElementById(t.getAttribute('aria-describedby'))?.textContent || '').trim(), visible: Boolean(document.getElementById(t.getAttribute('aria-describedby')) && !document.getElementById(t.getAttribute('aria-describedby')).hidden) })));
  await tap(r.page, 'iphone', '#menu [data-motion-toggle]'); await sleep(400);
  const rr2 = await r.page.evaluate(() => [...document.querySelectorAll('[data-motion-toggle]')].map(t => t.getAttribute('aria-checked')));
  ok('I1', rr.length === 2 && rr.every(x => x.marcado === 'true' && x.inhabilitado === 'true' && x.nota && x.visible) && rr2.every(x => x === 'true'),
    `con «reducir movimiento»: ${rr.map(x => `aria-checked=${x.marcado}, aria-disabled=${x.inhabilitado}, nota «${x.nota}»`).join(' | ')}; un toque no lo apaga (${rr2.join('/')})`);
  await r.browser.close();
});

// ---------- M1 · cascada del menú ----------
if (quiere('M1')) await intenta('M1', async () => {
  const { browser, page } = await abrir('iphone', { esperar: 2400 });
  const p = page.evaluate(() => new Promise(done => addEventListener('click', () => requestAnimationFrame(() => requestAnimationFrame(() => { const fin = [...document.querySelectorAll('#menu .menu-lista li')].map(li => { const a = li.getAnimations().map(x => x.effect.getComputedTiming().endTime); return a.length ? Math.max(...a) : 0; }); done({ n: fin.length, fin }); })), { capture: true, once: true })));
  await tap(page, 'iphone', '[data-menu-open]');
  const m = await p;
  const ultimo = Math.max(...m.fin);
  ok("M1", m.n >= 7 && ultimo > 0 && ultimo <= 480, `la última fila del menú (${m.n} filas) termina de entrar a los ${Math.round(ultimo)} ms (tope 480)`);
  await browser.close();
});

// ---------- V1 · el velo sin transición con movimiento reducido o en pausa ----------
if (quiere('V1')) await intenta('V1', async () => {
  for (const [modo, opts] of [['con movimiento reducido', { reduce: true }], ['con la pausa del pie', { init: [PAUSA] }], ['con movimiento (control: debe tener transición)', {}]]) {
    const { browser, page } = await abrir('iphone', { ...opts, esperar: 2200 });
    const dur = await page.evaluate(() => {
      const ms = s => Math.max(...s.split(',').map(x => parseFloat(x) * (x.trim().endsWith('ms') ? 1 : 1000)));
      const medir = id => { const d = document.getElementById(id); const cs = getComputedStyle(d, '::backdrop'); return { id, dur: ms(cs.transitionDuration), retraso: ms(cs.transitionDelay) }; };
      return ['menu', 'cat-drawer', 'mylist', 'explorer'].map(medir);
    });
    const esperado = modo.startsWith('con movimiento (');
    ok('V1', dur.every(d => esperado ? d.dur >= 200 : d.dur <= 1 && d.retraso <= 0), `iPhone ${modo}: velo ${dur.map(d => `${d.id} ${d.dur} ms`).join(' · ')}`);
    await browser.close();
  }
});

const fallan = res.filter(r => !r.ok).length;
console.log(`\nNAVEGACIÓN: ${res.length - fallan}/${res.length} comprobaciones bien. FALLAN ${fallan}`);
process.exit(fallan ? 1 : 0);
