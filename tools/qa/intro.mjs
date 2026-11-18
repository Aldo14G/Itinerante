// Entrada de marca (IntroMarca, 2026-11-18): mide la entrada del inicio en Chromium con Playwright.
//
// Uso: node tools/qa/intro.mjs URL [DIR] [--solo=duracion,salto,ausencia,foco,contraste,cls] [--lcp=N] [--tiras] [--video] [--variante=b]
//   Sin --solo corre todas las comprobaciones (duración total, posición final contra la marca de la barra ± 1 px, salto con toque, clic, tecla,
//   rueda y scroll, ausencia con movimiento reducido, pausa, ahorro de datos, #ancla, #libro-<id>, segunda carga, «atrás» y almacenamiento que
//   lanza, foco y lector, contraste del texto durante la entrada en claro y oscuro, y CLS). Sale con 1 si algo falla.
//   --lcp=N: además, LCP, FCP y CLS con CPU 4× y 4G lenta (preset «Slow 4G» de DevTools: 562.5 ms, 1.44 Mbps), mediana de N corridas por perfil,
//     con la entrada y sin ella (sessionStorage ya anotado), en iPhone 16 y 1440.
//   --tiras: tira de fotogramas cada 80 ms (animaciones en pausa y llevadas a cada instante: fotogramas exactos) en iPhone 16 y 1440, claro y oscuro.
//   --video: graba la entrada (recordVideo, .webm) en los mismos cuatro casos.
//   --variante=b: la tira de la variante B propuesta (subrayado de 2 px y telón que se funde), inyectada sobre el CSS del sitio.
// Playwright: PLAYWRIGHT_PATH, `playwright` instalado o /opt/node-tools/node_modules/playwright (sale con 2 si no lo encuentra).
// Navegador: CHROME_PATH (si no, /opt/pw-browsers/chromium o el de Playwright). Como root, --no-sandbox.
import { existsSync, mkdirSync, readdirSync, renameSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const args = process.argv.slice(2);
const opt = n => { const a = args.find(x => x.startsWith(`--${n}`)); return a ? (a.includes('=') ? a.split('=')[1] : true) : null; };
const pos = args.filter(a => !a.startsWith('--'));
const URL_ = pos[0] || 'http://127.0.0.1:8094/';
const DIR = resolve(pos[1] || '.');
mkdirSync(DIR, { recursive: true });
const SOLO = opt('solo') ? new Set(String(opt('solo')).split(',')) : null;
const corre = n => !SOLO || SOLO.has(n);

let pw;
for (const cand of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { pw = (await import(cand.startsWith('/') ? pathToFileURL(cand).href : cand)).default; break; } catch { /* siguiente */ }
}
if (!pw) { console.error('Playwright no disponible'); process.exit(2); }
const exe = process.env.CHROME_PATH || (existsSync('/opt/pw-browsers/chromium') ? '/opt/pw-browsers/chromium' : undefined);
const browser = await pw.chromium.launch({ executablePath: exe, args: ['--no-sandbox'] });

const PERFILES = {
  iphone16: { ...pw.devices['iPhone 15'], viewport: { width: 393, height: 659 } },
  d1440: { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
};
const filas = [];
const check = (grupo, nombre, ok, detalle = '') => { filas.push({ grupo, nombre, ok: Boolean(ok), detalle }); console.log(`${ok ? '✓' : '✗'} [${grupo}] ${nombre}${detalle ? ` — ${detalle}` : ''}`); };
const sleep = ms => new Promise(r => setTimeout(r, ms));

// Registro dentro de la página, antes que boot.js: el primer fotograma, el fin de la entrada, la marca al aterrizar, CLS y errores.
const SONDA = () => {
  const s = window.__intro = { t0: null, tFin: null, telonFin: null, marcaFin: null, cls: 0, errores: [], fines: [] };
  requestAnimationFrame(() => { s.t0 = performance.now(); });
  addEventListener('error', e => s.errores.push(String(e.message)));
  addEventListener('unhandledrejection', e => s.errores.push(String(e.reason)));
  new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) s.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  document.addEventListener('animationend', e => {
    if (e.animationName === 'intro-telon') s.telonFin = performance.now();
    if (e.animationName === 'intro-marca-alto') { const r = e.target.getBoundingClientRect(); s.marcaFin = { x: r.x, y: r.y, w: r.width, h: r.height, t: performance.now() }; }
  });
  document.addEventListener('iti:intro-fin', () => { s.tFin = performance.now(); });
  // Cuándo termina cada animación de la entrada (telón, marca, foto y titular), contada desde el arranque del telón.
  s.plan = () => {
    const telon = document.querySelector('[data-intro]')?.getAnimations().find(a => a.animationName === 'intro-telon');
    if (!telon || telon.startTime === null) return null;
    const lista = document.getAnimations().filter(a => a.effect?.target && (a.effect.target.closest?.('.hdr, .entry, .intro-telon'))).map(a => ({
      nombre: a.animationName || `titular:${a.effect.target.textContent.trim().slice(0, 12)}`,
      fin: Math.round((a.startTime ?? telon.startTime) + a.effect.getComputedTiming().endTime - telon.startTime),
    }));
    return { lista, telonInicio: telon.startTime };
  };
};

const rect = async (page, sel) => page.evaluate(s => { const e = document.querySelector(s); if (!e) return null; const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; }, sel);
const nuevo = async (perfil, extra = {}, init = []) => {
  const ctx = await browser.newContext({ ...PERFILES[perfil], ...extra });
  await ctx.addInitScript(SONDA);
  for (const f of init) await ctx.addInitScript(f);
  const page = await ctx.newPage();
  const consola = [];
  page.on('console', m => { if (m.type() === 'error') consola.push(m.text()); });
  page.on('pageerror', e => consola.push(String(e)));
  return { ctx, page, consola };
};
const hayIntro = page => page.evaluate(() => document.documentElement.classList.contains('intro-marca'));
const esperaT0 = page => page.waitForFunction(() => window.__intro?.t0 !== null, null, { timeout: 15000 });

// Rectángulo de referencia: la marca en su sitio sin entrada (movimiento reducido).
const referencia = {};
for (const perfil of Object.keys(PERFILES)) {
  const { ctx, page } = await nuevo(perfil, { reducedMotion: 'reduce' });
  await page.goto(URL_);
  await sleep(600);
  referencia[perfil] = await rect(page, '.hdr-brand');
  await ctx.close();
}

// ---------- 1. Duración, posición final, CLS y errores ----------
if (corre('duracion') || corre('cls')) {
  for (const perfil of Object.keys(PERFILES)) {
    for (const esquema of ['light', 'dark']) {
      const { ctx, page, consola } = await nuevo(perfil, { colorScheme: esquema });
      await page.goto(URL_, { waitUntil: 'commit' });
      await esperaT0(page);
      const inicio = await hayIntro(page);
      await page.evaluate(() => { window.__intro.vista = true; });
      await sleep(700); // a esta altura existen todas (el titular las crea app.js bajo el telón)
      const plan = await page.evaluate(() => window.__intro.plan());
      await page.waitForFunction(() => window.__intro.tFin !== null, null, { timeout: 5000 }).catch(() => {});
      await sleep(1200);
      const s = await page.evaluate(() => ({ ...window.__intro, plan: undefined, quedan: document.getAnimations().filter(a => a.playState === 'running').length, clase: document.documentElement.className, sesion: sessionStorage.getItem('iti-intro'), telon: getComputedStyle(document.querySelector('[data-intro]')).display, marca: getComputedStyle(document.querySelector('.hdr-brand')).transform, titular: document.querySelector('.entry-title').innerHTML }));
      const tag = `${perfil} ${esquema === 'light' ? 'claro' : 'oscuro'}`;
      const ultimo = plan ? Math.max(...plan.lista.map(a => a.fin)) : NaN;
      const telonFin = plan ? Math.max(...plan.lista.filter(a => a.nombre === 'intro-telon').map(a => a.fin)) : NaN;
      const titular = plan ? plan.lista.filter(a => a.nombre.startsWith('titular')).length : 0;
      if (corre('duracion')) {
        check('duracion', `${tag}: la entrada aparece en la primera visita`, inicio && s.sesion === '1');
        check('duracion', `${tag}: contenido visible y usable (telón fuera) ≤ 1600 ms`, telonFin <= 1600, `${telonFin} ms desde el primer fotograma de la entrada`);
        check('duracion', `${tag}: todo quieto (marca, foto y titular en su sitio) ≤ 1600 ms`, ultimo <= 1600, `${ultimo} ms · ${plan?.lista.length} animaciones (${titular} líneas del titular)`);
        check('duracion', `${tag}: el titular sube por líneas`, titular >= 2, `${titular} líneas`);
        check('duracion', `${tag}: termina sola (clase fuera, telón oculto, marca sin transformar, titular con su texto)`, !/intro-marca/.test(s.clase) && s.telon === 'none' && s.marca === 'none' && !/linea/.test(s.titular), `fin a los ${s.tFin && s.t0 ? Math.round(s.tFin - s.t0) : '?'} ms del primer fotograma`);
        const ref = referencia[perfil], m = s.marcaFin;
        const dx = m ? Math.max(Math.abs(m.x - ref.x), Math.abs(m.y - ref.y), Math.abs(m.w - ref.w), Math.abs(m.h - ref.h)) : Infinity;
        check('duracion', `${tag}: la marca aterriza en la de la barra (± 1 px)`, dx <= 1, m ? `Δ máx ${dx.toFixed(2)} px (x ${m.x.toFixed(1)} y ${m.y.toFixed(1)} ${m.w.toFixed(1)}×${m.h.toFixed(1)} · barra ${ref.x.toFixed(1)} ${ref.y.toFixed(1)} ${ref.w.toFixed(1)}×${ref.h.toFixed(1)})` : 'sin medición');
        check('duracion', `${tag}: sin errores en la consola`, !consola.length && !s.errores.length, [...consola, ...s.errores].slice(0, 2).join(' | '));
      }
      if (corre('cls')) check('cls', `${tag}: CLS con la entrada`, s.cls === 0, `CLS ${s.cls}`);
      await ctx.close();
    }
  }
}

// ---------- 2. Se salta con toque, clic, tecla, rueda y scroll ----------
if (corre('salto')) {
  const casos = [
    ['iphone16', 'toque en la foto', async p => p.touchscreen.tap(196, 470)],
    ['iphone16', 'toque en la marca grande (no sigue el enlace)', async p => { const r = await rect(p, '.hdr-brand'); await p.touchscreen.tap(r.x + r.w / 2, r.y + r.h / 2); }],
    ['iphone16', 'scroll', async p => p.evaluate(() => scrollBy(0, 40))],
    ['d1440', 'clic', async p => p.mouse.click(1000, 400)],
    ['d1440', 'tecla', async p => p.keyboard.press('Shift')],
    ['d1440', 'rueda', async p => { await p.mouse.move(700, 450); await p.mouse.wheel(0, 60); }],
  ];
  for (const [perfil, nombre, accion] of casos) {
    const { ctx, page } = await nuevo(perfil);
    const popups = [];
    ctx.on('page', p => popups.push(p));
    await page.goto(URL_, { waitUntil: 'commit' });
    await esperaT0(page);
    await sleep(250);
    const antes = await hayIntro(page);
    const t1 = await page.evaluate(() => performance.now());
    await accion(page);
    await page.waitForFunction(() => !document.documentElement.classList.contains('intro-marca'), null, { timeout: 2000 }).catch(() => {});
    const s = await page.evaluate(t => ({ dt: Math.round((window.__intro.tFin ?? Infinity) - t), url: location.href, telon: getComputedStyle(document.querySelector('[data-intro]')).display, marca: getComputedStyle(document.querySelector('.hdr-brand')).transform, vivas: document.getAnimations().filter(a => a.playState === 'running' && a.effect?.target?.closest?.('.hdr, .entry') && !(a instanceof CSSTransition)).map(a => a.animationName || 'titular').join(' ') }), t1);
    await sleep(100);
    const lineas = await page.evaluate(() => document.querySelectorAll('.entry-title .linea').length);
    check('salto', `${perfil}: ${nombre} la termina al momento y deja todo en su sitio`, antes && s.dt <= 100 && s.telon === 'none' && s.marca === 'none' && !s.vivas && lineas === 0, `${s.dt} ms tras la acción · telón ${s.telon} · animaciones de la entrada vivas: ${s.vivas || 'ninguna'}`);
    if (/marca/.test(nombre)) check('salto', `${perfil}: el toque que salta sobre la marca no navega`, !/#inicio/.test(s.url) && !popups.length, s.url);
    await ctx.close();
  }
}

// ---------- 3. Cuándo no aparece ----------
if (corre('ausencia')) {
  const tira = (p, s) => p.evaluate(sel => getComputedStyle(document.querySelector(sel)).display, s);
  const casos = [
    ['movimiento reducido', { reducedMotion: 'reduce' }, [], ''],
    ['«Pausar el movimiento» (iti-b4-motion = off)', {}, [() => { try { localStorage.setItem('iti-b4-motion', 'off'); } catch {} }], ''],
    ['ahorro de datos', {}, [() => { Object.defineProperty(navigator, 'connection', { configurable: true, get: () => ({ saveData: true, addEventListener() {} }) }); }], ''],
    ['llegar con #visita', {}, [], '#visita'],
    ['llegar con #libro-<id>', {}, [], '#libro-no-existe'],
    ['sessionStorage y localStorage que lanzan', {}, [() => { for (const k of ['sessionStorage', 'localStorage']) Object.defineProperty(window, k, { configurable: true, get() { throw new DOMException('bloqueado', 'SecurityError'); } }); }], ''],
  ];
  for (const perfil of Object.keys(PERFILES)) {
    for (const [nombre, extra, init, hash] of casos) {
      const { ctx, page, consola } = await nuevo(perfil, extra, init);
      await page.goto(URL_ + hash, { waitUntil: 'commit' });
      await esperaT0(page);
      const s = await page.evaluate(() => ({ clase: document.documentElement.className }));
      const d = await tira(page, '[data-intro]');
      await sleep(400);
      const h1 = await page.evaluate(() => { const r = document.querySelector('.entry-title').getBoundingClientRect(); return document.elementsFromPoint(r.x + 4, r.y + r.height / 2).some(e => e.matches('.entry-title, .entry-title *')); });
      check('ausencia', `${perfil}: ${nombre}: no aparece`, !/intro-marca/.test(s.clase) && d === 'none', `clase «${s.clase}»`);
      if (/lanzan/.test(nombre)) check('ausencia', `${perfil}: ${nombre}: la página carga sin errores y el titular se ve`, !consola.length && h1, consola.slice(0, 2).join(' | '));
      await ctx.close();
    }
    // Segunda carga en la misma sesión (recargar) y volver con «atrás».
    const { ctx, page } = await nuevo(perfil);
    await page.goto(URL_);
    const primera = await hayIntro(page);
    await sleep(1800);
    await page.reload({ waitUntil: 'commit' });
    await esperaT0(page);
    check('ausencia', `${perfil}: segunda carga en la misma sesión: no aparece`, primera && !(await hayIntro(page)));
    await page.evaluate(() => sessionStorage.removeItem('iti-intro')); // aislar «atrás» de la regla de una vez por sesión
    await page.goto(new URL('robots.txt', URL_).href);
    await page.goBack({ waitUntil: 'commit' });
    await esperaT0(page).catch(() => {});
    const tipo = await page.evaluate(() => performance.getEntriesByType('navigation')[0]?.type);
    check('ausencia', `${perfil}: volver con «atrás»: no aparece`, !(await hayIntro(page)), `navegación ${tipo}`);
    await ctx.close();
  }
}

// ---------- 4. Foco y lector de pantalla ----------
if (corre('foco')) {
  for (const perfil of Object.keys(PERFILES)) {
    const { ctx, page } = await nuevo(perfil);
    await page.goto(URL_, { waitUntil: 'commit' });
    await esperaT0(page);
    await sleep(150);
    const a = await page.evaluate(() => { const t = document.querySelector('[data-intro]'); return { hidden: t.getAttribute('aria-hidden'), hijos: t.querySelectorAll('*').length, enfocables: t.querySelectorAll('a, button, input, [tabindex]').length, pe: getComputedStyle(t).pointerEvents, z: getComputedStyle(t).zIndex }; });
    check('foco', `${perfil}: el telón es aria-hidden, vacío y no recibe toques`, a.hidden === 'true' && a.enfocables === 0 && a.pe === 'none', JSON.stringify(a));
    await page.keyboard.press('Tab');
    const f = await page.evaluate(() => ({ foco: document.activeElement?.className, intro: document.documentElement.classList.contains('intro-marca') }));
    check('foco', `${perfil}: el primer Tab va a «Saltar al contenido» y termina la entrada`, f.foco === 'skip' && !f.intro, JSON.stringify(f));
    await ctx.close();
  }
}

// ---------- 5. Contraste del texto durante la entrada (claro y oscuro) ----------
const congelar = async (page, t) => page.evaluate(ms => {
  const telon = document.querySelector('[data-intro]').getAnimations().find(a => a.animationName === 'intro-telon');
  for (const a of document.getAnimations()) { if (a.timeline !== document.timeline) continue; a.pause(); a.currentTime = ms; }
  return Boolean(telon);
}, t);
// Rutas de prueba: sin tope ni fin por animationend mientras las animaciones están en pausa (solo en este script).
const sinTope = async (ctx, variante) => {
  await ctx.route(/assets\/js\/boot\.js$/, async route => {
    const r = await route.fetch();
    route.fulfill({ response: r, body: (await r.text()).replace('var INTRO_TOPE = 1600;', 'var INTRO_TOPE = 600000;') });
  });
  if (variante === 'b') await ctx.route(/style\.css$/, async route => {
    const r = await route.fetch();
    route.fulfill({ response: r, body: `${await r.text()}\n/* Variante B (propuesta, solo en la tira): subrayado de 2 px en primario y telón que se funde. */
@media (prefers-reduced-motion: no-preference) {
  html.intro-marca .hdr-brand-nombre::before { inset: auto 0 1px; height: 2px; background: var(--primario); }
}
@keyframes intro-telon { to { opacity: 0; visibility: hidden; } }` }); // el mismo nombre: la última regla @keyframes gana
  });
};
const ratio = (a, b) => {
  const lum = c => { const [r, g, bl] = c.map(v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }); return 0.2126 * r + 0.7152 * g + 0.0722 * bl; };
  const [hi, lo] = [lum(a), lum(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};
if (corre('contraste')) {
  for (const esquema of ['light', 'dark']) {
    for (const perfil of Object.keys(PERFILES)) {
      const { ctx, page } = await nuevo(perfil, { colorScheme: esquema });
      await sinTope(ctx);
      await page.goto(URL_, { waitUntil: 'commit' });
      await esperaT0(page);
      await page.waitForFunction(() => document.querySelector('.entry-title .linea'), null, { timeout: 3000 }).catch(() => {});
      await congelar(page, 560);
      const c = await page.evaluate(() => {
        const rgb = s => s.match(/[\d.]+/g).slice(0, 3).map(Number);
        const n = document.querySelector('.hdr-brand-nombre');
        return { texto: rgb(getComputedStyle(n).color), resalte: rgb(getComputedStyle(n, '::before').backgroundColor), telon: rgb(getComputedStyle(document.querySelector('[data-intro]')).backgroundColor), op: getComputedStyle(n, '::before').opacity };
      });
      const r1 = ratio(c.texto, c.resalte), r2 = ratio(c.texto, c.telon);
      check('contraste', `${perfil} ${esquema === 'light' ? 'claro' : 'oscuro'}: el nombre sobre el marcatextos y sobre el telón ≥ 4.5:1`, r1 >= 4.5 && r2 >= 4.5, `${r1.toFixed(2)}:1 sobre el trazo · ${r2.toFixed(2)}:1 sobre el telón`);
      await ctx.close();
    }
  }
}

// ---------- Tiras de fotogramas (y variante B) ----------
const PASO = 80, HASTA = 1440;
async function tira(perfil, esquema, variante) {
  const { ctx, page } = await nuevo(perfil, { colorScheme: esquema });
  await sinTope(ctx, variante);
  await page.goto(URL_, { waitUntil: 'commit' });
  await esperaT0(page);
  await page.waitForFunction(() => document.querySelector('.entry-title .linea'), null, { timeout: 3000 }).catch(() => {});
  await page.evaluate(() => document.fonts.ready);
  await page.waitForFunction(() => [...document.images].filter(i => i.closest('.hdr, .entry')).every(i => i.complete), null, { timeout: 5000 }).catch(() => {});
  const fotos = [];
  for (let t = 0; t <= HASTA; t += PASO) {
    await congelar(page, t);
    await sleep(40);
    fotos.push({ t, png: (await page.screenshot({ type: 'png' })).toString('base64') });
  }
  await ctx.close();
  // La tira se compone en una página en blanco (canvas): sin dependencias.
  const comp = await browser.newPage();
  const png = await comp.evaluate(async ({ fotos, titulo }) => {
    const imgs = await Promise.all(fotos.map(f => new Promise(r => { const i = new Image(); i.onload = () => r(i); i.src = `data:image/png;base64,${f.png}`; })));
    const escala = imgs[0].naturalWidth > 1000 ? 0.25 : 0.5;
    const w = Math.round(imgs[0].naturalWidth * escala), h = Math.round(imgs[0].naturalHeight * escala);
    const cols = Math.min(7, imgs.length), filas = Math.ceil(imgs.length / cols), pie = 22, margen = 8;
    const c = document.createElement('canvas');
    c.width = cols * (w + margen) + margen; c.height = filas * (h + pie + margen) + margen + 28;
    const x = c.getContext('2d');
    x.fillStyle = '#888'; x.fillRect(0, 0, c.width, c.height);
    x.fillStyle = '#fff'; x.font = '600 16px sans-serif'; x.fillText(titulo, margen, 20);
    imgs.forEach((im, i) => {
      const cx = margen + (i % cols) * (w + margen), cy = 28 + margen + Math.floor(i / cols) * (h + pie + margen);
      x.drawImage(im, cx, cy, w, h);
      x.fillStyle = '#fff'; x.font = '13px sans-serif'; x.fillText(`${fotos[i].t} ms`, cx, cy + h + 16);
    });
    return c.toDataURL('image/png').split(',')[1];
  }, { fotos, titulo: `Entrada de marca${variante ? ` · variante ${variante.toUpperCase()}` : ' · variante A (elegida)'} · ${perfil} · ${esquema === 'light' ? 'claro' : 'oscuro'} · cada ${PASO} ms` });
  await comp.close();
  const nombre = join(DIR, `tira${variante ? `-variante-${variante}` : ''}-${perfil}-${esquema === 'light' ? 'claro' : 'oscuro'}.png`);
  writeFileSync(nombre, Buffer.from(png, 'base64'));
  console.log(`tira: ${nombre}`);
}
if (opt('tiras') || opt('variante')) {
  for (const perfil of Object.keys(PERFILES)) for (const esquema of ['light', 'dark']) await tira(perfil, esquema, opt('variante') && opt('variante') !== true ? String(opt('variante')) : null);
}

// ---------- Video ----------
if (opt('video')) {
  for (const perfil of Object.keys(PERFILES)) {
    for (const esquema of ['light', 'dark']) {
      const vdir = join(DIR, `video-tmp-${perfil}-${esquema}`);
      mkdirSync(vdir, { recursive: true });
      const size = PERFILES[perfil].viewport;
      const ctx = await browser.newContext({ ...PERFILES[perfil], colorScheme: esquema, recordVideo: { dir: vdir, size } });
      const page = await ctx.newPage();
      await page.goto(URL_);
      await sleep(2600);
      await ctx.close();
      const f = readdirSync(vdir).find(n => n.endsWith('.webm'));
      const dest = join(DIR, `entrada-${perfil}-${esquema === 'light' ? 'claro' : 'oscuro'}.webm`);
      if (f) { renameSync(join(vdir, f), dest); console.log(`video: ${dest}`); }
    }
  }
}

// ---------- LCP con CPU 4× y 4G lenta ----------
if (opt('lcp')) {
  const N = Number(opt('lcp')) || 7;
  const med = a => { const s = [...a].sort((x, y) => x - y); return s[Math.floor(s.length / 2)]; };
  const res = {};
  for (const perfil of Object.keys(PERFILES)) {
    for (const modo of ['con entrada', 'sin entrada']) {
      const runs = [];
      for (let i = 0; i < N; i++) {
        const ctx = await browser.newContext({ ...PERFILES[perfil] });
        await ctx.addInitScript(() => {
          window.__m = { lcp: 0, cls: 0, fcp: 0, intro: false };
          new PerformanceObserver(l => { for (const e of l.getEntries()) window.__m.lcp = e.startTime; }).observe({ type: 'largest-contentful-paint', buffered: true });
          new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__m.cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
          new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.name === 'first-contentful-paint') window.__m.fcp = e.startTime; }).observe({ type: 'paint', buffered: true });
          requestAnimationFrame(() => { window.__m.intro = document.documentElement.classList.contains('intro-marca'); });
        });
        if (modo === 'sin entrada') await ctx.addInitScript(() => { try { sessionStorage.setItem('iti-intro', '1'); } catch {} });
        const page = await ctx.newPage();
        const cdp = await ctx.newCDPSession(page);
        await cdp.send('Network.enable');
        await cdp.send('Network.setCacheDisabled', { cacheDisabled: true });
        await cdp.send('Network.emulateNetworkConditions', { offline: false, latency: 562.5, downloadThroughput: 180000, uploadThroughput: 84375 });
        await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
        await page.goto(URL_, { waitUntil: 'load', timeout: 90000 });
        await sleep(3500);
        runs.push(await page.evaluate(() => window.__m));
        await ctx.close();
      }
      const r = { lcp: Math.round(med(runs.map(x => x.lcp))), fcp: Math.round(med(runs.map(x => x.fcp))), cls: Math.max(...runs.map(x => x.cls)), corridas: runs.map(x => Math.round(x.lcp)), entrada: runs.filter(x => x.intro).length };
      res[`${perfil} ${modo}`] = r;
      console.log(`LCP ${perfil} ${modo}: mediana ${r.lcp} ms (FCP ${r.fcp}, CLS ${r.cls}; entrada en ${r.entrada}/${N}; corridas ${r.corridas.join(', ')})`);
    }
    const d = res[`${perfil} con entrada`].lcp - res[`${perfil} sin entrada`].lcp;
    check('lcp', `${perfil}: la entrada no empeora el LCP más de 100 ms`, d <= 100 && res[`${perfil} con entrada`].entrada === N, `${d >= 0 ? '+' : ''}${d} ms`);
    check('lcp', `${perfil}: CLS 0 con CPU 4× y 4G lenta`, res[`${perfil} con entrada`].cls === 0, `CLS ${res[`${perfil} con entrada`].cls}`);
  }
  writeFileSync(join(DIR, 'intro-lcp.json'), JSON.stringify(res, null, 2));
}

await browser.close();
writeFileSync(join(DIR, 'intro.json'), JSON.stringify({ url: URL_, fecha: new Date().toISOString(), filas }, null, 2));
const mal = filas.filter(f => !f.ok);
console.log(`\nENTRADA: ${filas.length - mal.length}/${filas.length} bien · FALLAN ${mal.length}`);
process.exit(mal.length ? 1 : 0);
