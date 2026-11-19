// Franja de editoriales del Inicio (2026-11-19, encargo de Aldo; DESIGN.md, «Franja de editoriales»), en el navegador.
// Uso: node tools/qa/franja.mjs URL [DIR] [--solo=E,B,P,Q,C,T,L,I] [--oscuro]   (Playwright como guias.mjs; DIR: capturas). Sale con 1 si algo falla.
//  E · Estructura: lista con rótulo, tres elementos reales, nada enfocable dentro del carril, copias aria-hidden e inert, control de 44, enlace estático a #editoriales, sin consola con errores, CLS 0.
//  B · Bucle (320, 393, 1101, 1440; con movimiento): cada grupo llena la ventana, la vuelta cierra sin salto (el segundo grupo llega a la posición del primero al terminar: ≤ 0.1 px), el
//      carril mide el doble de un grupo (el −50 % es exacto), la velocidad es la del token (40 px/s ± 2) y en ningún momento de la vuelta queda un hueco en la ventana; informa cómo se ve
//      con 3 nombres (qué nombres caben a la vez y si se repiten a la vista).
//  P · Pausas: cursor encima, foco dentro (control), presionar, fuera de la vista, el botón (pausa y reanuda, recordado en localStorage y desde el primer render) y «Pausar el movimiento»
//      del sitio (pie y ☰): quieta y única; el control de la franja solo existe con movimiento.
//  Q · Quieta: con «reducir movimiento», con ahorro de datos, con la pausa del sitio y con la pausa de la franja: sin animación, cada nombre una sola vez, centrado, en renglones si no
//      cabe, sin desborde horizontal, sin copias visibles y sin control.
//  C · Contraste del texto (tinta-2 sobre el fondo ≥ 4.5:1; el enlace y el rótulo también), bordes desvanecidos (máscara degradada de 48 px) y objetivos de 44.
//  T · Posiciones del inicio sin cambios en 393×659, 375×629, 440×763 y 402×874 (áreas 62/34): titular, entradilla, «Cómo llegar», estado, dirección y foto; la franja bajo la foto (a 64) y,
//      en el teléfono, cuánto asoma en el primer pliegue.
//  L · Modo logo de PRUEBA (siluetas genéricas generadas aquí, servidas por intercepción de red; no son marcas de nadie y nunca están en el repositorio): máscara con el color del texto, alto
//      de 28, proporción, role=img con alt, claro y oscuro, el bucle cierra igual.
//  I · INP con CPU 4×: clic en el control de pausa y en el interruptor del pie ≤ 200 ms.
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';

let pw = null;
for (const ruta of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { const m = await import(ruta.startsWith('/') ? pathToFileURL(ruta).href : ruta); pw = m.default?.chromium ? m.default : m; if (pw?.chromium) break; pw = null; } catch { /* la siguiente */ }
}
if (!pw) { console.error('franja.mjs: no encuentro Playwright (PLAYWRIGHT_PATH=/ruta/a/playwright/index.js)'); process.exit(2); }
const CHROME = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
const pos = process.argv.slice(2).filter(a => !a.startsWith('--'));
const opt = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const URL_ = pos[0] || 'http://127.0.0.1:8094/';
const DIR = pos[1] || null; if (DIR) mkdirSync(DIR, { recursive: true });
const SOLO = new Set(String(opt.solo || 'E,B,P,Q,C,T,L,I').split(','));
const root = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
const sleep = ms => new Promise(r => setTimeout(r, ms));
const UA = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const mov = (w, h, dpr = 2) => ({ viewport: { width: w, height: h }, deviceScaleFactor: dpr, isMobile: true, hasTouch: true, userAgent: UA });
const PERFILES = {
  '320': mov(320, 640), '393': mov(393, 659, 3), '375': mov(375, 629, 3), '440': mov(440, 763, 3), '402': mov(402, 874, 3),
  '820': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1 },
  '1101': { viewport: { width: 1101, height: 800 }, deviceScaleFactor: 1 },
  '1440': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
};
const res = [];
const ok = (regla, cond, texto) => { res.push({ regla, ok: Boolean(cond), texto }); console.log(`${cond ? '✓' : '✗'} ${regla} ${texto}`); };
const info = (regla, texto) => console.log(`· ${regla} ${texto}`);
const r1 = n => Math.round(n * 10) / 10;

async function abrir(perfil, { js = true, reducido = false, oscuro = false, pausa = false, quieta = false, saveData = false, hash = '', antes = null, rutas = null, espera = 2400 } = {}) {
  const browser = await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars'] });
  const context = await browser.newContext({ ...PERFILES[perfil], javaScriptEnabled: js, locale: 'es-MX', timezoneId: 'America/Monterrey', colorScheme: (oscuro || opt.oscuro) ? 'dark' : 'light', reducedMotion: reducido ? 'reduce' : 'no-preference' });
  await context.addInitScript(([p, q, sd]) => {
    try { localStorage.setItem('iti-intro', '1'); if (p) localStorage.setItem('iti-b4-motion', 'off'); if (q) localStorage.setItem('iti-franja', 'off'); } catch {}
    if (sd) Object.defineProperty(navigator, 'connection', { value: { saveData: true }, configurable: true });
    window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: true });
  }, [pausa, quieta, saveData]);
  await context.route(/wa\.me|instagram\.com|facebook\.com|openstreetmap\.org|lu\.ma|google\.com/, r => r.abort());
  if (rutas) await rutas(context);
  const errores = [];
  const page = await context.newPage();
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (m.type() === 'error' && !/Failed to load resource/.test(m.text())) errores.push(m.text().slice(0, 160)); });
  if (antes) await antes(page, context);
  await page.goto(URL_ + hash, { waitUntil: 'load' });
  await sleep(js ? espera : 300);
  return { browser, context, page, errores };
}
const ev = (page, fn, arg) => page.evaluate(fn, arg);
const sinDesborde = page => ev(page, () => document.documentElement.scrollWidth <= document.documentElement.clientWidth + 1);
const captura = async (page, nombre) => {
  if (!DIR) return;
  await ev(page, () => { const f = document.querySelector('[data-franja]'); const y = f.getBoundingClientRect().top + scrollY - Math.max(24, (innerHeight - f.offsetHeight) / 3); window.scrollTo(0, y); });
  await sleep(250);
  await page.screenshot({ path: join(DIR, `${nombre}.png`) });
};
const hex = c => c.match(/[\d.]+/g).slice(0, 3).map(Number);
const lum = ([r, g, b]) => { const f = v => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b); };
const contraste = (a, b) => { const A = lum(hex(a)), B = lum(hex(b)); return (Math.max(A, B) + 0.05) / (Math.min(A, B) + 0.05); };

/** El estado de la franja en un instante: lo que mide cada regla. */
const estado = page => ev(page, () => {
  const q = s => document.querySelector(s), f = q('[data-franja]');
  if (!f) return null;
  const v = q('.franja-ventana').getBoundingClientRect(), c = q('.franja-carril'), A = q('.franja-lista'), B = q('.franja-lista--eco');
  const a = c.getAnimations()[0];
  const li = [...f.querySelectorAll('.franja-item')].map(e => { const b = e.getBoundingClientRect(); return { l: b.left, r: b.right, t: b.top, b: b.bottom, w: b.width, vis: b.width > 0 && getComputedStyle(e).display !== 'none', eco: e.classList.contains('franja-eco'), txt: e.textContent.trim() || e.querySelector('[data-logo]')?.dataset.logo || '' }; });
  const ca = c.getBoundingClientRect();
  return {
    v: { l: v.left, r: v.right, w: v.width, t: v.top, b: v.bottom }, carrilW: ca.width, aW: A.getBoundingClientRect().width, bW: B ? B.getBoundingClientRect().width : 0, bLeft: B ? B.getBoundingClientRect().left - ca.left : 0,
    anim: a ? { dur: a.effect.getTiming().duration, estado: a.playState, t: a.currentTime } : null, playState: getComputedStyle(c).animationPlayState, animName: getComputedStyle(c).animationName,
    dur: getComputedStyle(f).getPropertyValue('--franja-dur'), listo: f.hasAttribute('data-listo'), enVista: f.hasAttribute('data-en-vista'),
    motion: document.documentElement.classList.contains('motion'), quieta: document.documentElement.classList.contains('franja-quieta'),
    li, ctl: (() => { const b = q('[data-franja-ctl]'); const r = b.getBoundingClientRect(); return { w: r.width, h: r.height, vis: r.width > 0 && getComputedStyle(b).display !== 'none', label: b.getAttribute('aria-label'), hidden: b.hidden }; })()
  };
});
/** Pone el bucle en el instante t (ms) sin dejar que corra, y lee las cajas. */
const enInstante = async (page, t) => { await ev(page, t => { for (const a of document.querySelector('.franja-carril').getAnimations()) { a.pause(); a.currentTime = t; } }, t); await sleep(40); return estado(page); };
const nombresVisibles = e => e.li.filter(x => x.vis && x.r > e.v.l + 1 && x.l < e.v.r - 1).map(x => x.txt);

// ---------------------------------------------------------------- E · Estructura
async function estructura() {
  for (const perfil of ['320', '393', '1440']) {
    const { browser, page, errores } = await abrir(perfil);
    const d = await ev(page, () => {
      const f = document.querySelector('[data-franja]'); if (!f) return null;
      const reales = [...f.querySelectorAll('.franja-lista:not(.franja-lista--eco) > .franja-item:not(.franja-eco)')].map(x => x.textContent.trim());
      const carril = f.querySelector('.franja-carril');
      return { reales, sec: f.tagName, nombre: f.getAttribute('aria-labelledby'), rotulo: document.getElementById('franja-rotulo')?.textContent, lista: !!f.querySelector('ul.franja-lista[aria-labelledby="franja-rotulo"]'),
        enfocables: carril.querySelectorAll('a, button, [tabindex], input').length, eco: [...f.querySelectorAll('.franja-eco')].every(e => e.getAttribute('aria-hidden') === 'true' && e.hasAttribute('inert')),
        grupoB: (() => { const b = f.querySelector('.franja-lista--eco'); return b.getAttribute('aria-hidden') === 'true' && b.hasAttribute('inert'); })(),
        ver: (() => { const a = f.querySelector('a.franja-ver'); const r = a.getBoundingClientRect(); return { href: a.getAttribute('href'), h: r.height, w: r.width, destino: !!document.querySelector(a.getAttribute('href')) }; })(),
        padre: f.parentElement.id };
    });
    ok('E1', d && d.sec === 'SECTION' && d.padre === 'inicio' && d.lista && d.rotulo === 'Editoriales en el catálogo', `${perfil}: sección con nombre dentro de #inicio, lista con su rótulo «${d?.rotulo}»`);
    ok('E1', d.reales.length === 3 && d.reales.join('|') === 'Abismos Casa Editorial|Capítulo Siete|Iridiscencias', `${perfil}: tres elementos reales (${d.reales.join(' · ')}); «Libro Objeto» no`);
    ok('E2', d.enfocables === 0 && d.eco && d.grupoB, `${perfil}: nada enfocable dentro del carril; copias y grupo duplicado aria-hidden + inert`);
    ok('E3', d.ver.href === '#editoriales' && d.ver.destino && d.ver.h >= 44 - 0.5, `${perfil}: enlace estático «Ver los libros por editorial» a #editoriales (alto ${r1(d.ver.h)})`);
    const e = await estado(page);
    ok('E4', e.ctl.vis && e.ctl.w >= 44 - 0.5 && e.ctl.h >= 44 - 0.5 && /Pausar/.test(e.ctl.label), `${perfil}: control de pausa visible de ${r1(e.ctl.w)}×${r1(e.ctl.h)} («${e.ctl.label}»)`);
    ok('E5', errores.length === 0, `${perfil}: sin errores de consola${errores.length ? ': ' + errores.join(' | ') : ''}`);
    ok('E6', await sinDesborde(page), `${perfil}: sin desborde horizontal`);
    const cls = await ev(page, () => window.__cls);
    ok('E7', cls === 0, `${perfil}: CLS ${cls} (franja pregenerada: sin saltos al cargar ni al empezar el bucle)`);
    await browser.close();
  }
  // sin JavaScript: pregenerada, quieta y sin control
  const { browser, page } = await abrir('393', { js: false });
  const d = await ev(page, () => ({ visibles: [...document.querySelectorAll('.franja-item')].filter(e => e.getBoundingClientRect().width > 0 && getComputedStyle(e).display !== 'none').map(e => e.textContent.trim()), ctl: getComputedStyle(document.querySelector('[data-franja-ctl]')).display, anim: document.querySelector('.franja-carril').getAnimations().length }));
  ok('E8', d.visibles.length === 3 && d.ctl === 'none' && d.anim === 0, `393 sin JavaScript: la franja se ve (${d.visibles.length} nombres, una vez), quieta y sin control`);
  await browser.close();
}

// ---------------------------------------------------------------- B · Bucle
async function bucle() {
  for (const perfil of ['320', '393', '1101', '1440']) {
    const { browser, page } = await abrir(perfil);
    await ev(page, () => document.querySelector('[data-franja]').scrollIntoView({ block: 'center' }));
    await sleep(300);
    const e = await estado(page);
    ok('B0', e.motion && !e.quieta && e.listo && e.anim && e.anim.dur > 0, `${perfil}: con movimiento y listo (data-listo); duración de la vuelta ${e.anim ? r1(e.anim.dur / 1000) : '?'} s`);
    ok('B1', e.aW >= e.v.w - 0.5 && e.bW >= e.v.w - 0.5, `${perfil}: cada grupo llena la ventana (grupo ${r1(e.aW)} y ${r1(e.bW)} ≥ ventana ${r1(e.v.w)})`);
    ok('B2', Math.abs(e.carrilW / 2 - e.aW) <= 0.1 && Math.abs(e.bLeft - e.aW) <= 0.1 && Math.abs(e.aW - e.bW) <= 0.1, `${perfil}: el carril mide el doble de un grupo (${r1(e.carrilW)} = 2 × ${r1(e.aW)}); el segundo grupo empieza donde acaba el primero (${r1(e.bLeft)})`);
    const velocidad = e.aW / (e.anim.dur / 1000);
    ok('B3', Math.abs(velocidad - 40) <= 2, `${perfil}: velocidad ${r1(velocidad)} px/s (token 40)`);
    // cierre del bucle: justo antes de terminar, el segundo grupo está donde el primero empezaba
    const e0 = await enInstante(page, 0), eN = await enInstante(page, e.anim.dur - 1);
    const salto = Math.abs((eN.li.find(x => x.eco && x.vis && x.l > eN.v.l - e.aW)?.l ?? 0) - 0);
    const primero0 = e0.li[0].l, segundoGrupoN = eN.li.filter(x => x.l >= eN.v.l - 2000).sort((a, b) => a.l - b.l).find(x => x.l >= primero0 - 200 && x.eco && Math.abs((x.l - primero0)) < 1) ?? null;
    // más directo: la posición del primer elemento del grupo B al final de la vuelta contra la del primero del grupo A al inicio
    const liB = await ev(page, () => [...document.querySelectorAll('.franja-lista--eco > .franja-item')].map(x => x.getBoundingClientRect().left));
    const difCierre = Math.abs(liB[0] - primero0);
    ok('B4', difCierre <= 0.1, `${perfil}: al cerrar la vuelta (t = duración − 1 ms) el primer elemento del segundo grupo está a ${r1(difCierre * 100) / 100} px de donde empezó el primero: sin salto`);
    // sin huecos en ninguna fase: los elementos (con su hueco como relleno) cubren la ventana
    let peor = 0, repetidos = 0, vistos = [], hueco = 0;
    const N = 48;
    for (let i = 0; i < N; i++) {
      const s = await enInstante(page, (e.anim.dur * i) / N);
      const cajas = s.li.filter(x => x.vis).sort((a, b) => a.l - b.l);
      const dentro = cajas.filter(x => x.r > s.v.l && x.l < s.v.r);
      const primeroL = dentro[0].l, ultimoR = dentro[dentro.length - 1].r;
      peor = Math.max(peor, Math.max(0, primeroL - s.v.l), Math.max(0, s.v.r - ultimoR));
      for (let k = 1; k < dentro.length; k++) hueco = Math.max(hueco, dentro[k].l - dentro[k - 1].r);
      const nom = nombresVisibles(s); vistos.push(nom);
      if (new Set(nom).size < nom.length) repetidos++;
    }
    ok('B5', peor <= 0.5 && hueco <= 0.5, `${perfil}: en 48 instantes de la vuelta nunca queda un hueco en la ventana (borde sin cubrir ≤ ${r1(peor)} px; hueco entre elementos ≤ ${r1(hueco)} px)`);
    const maxVis = Math.max(...vistos.map(v => new Set(v).size)), maxElem = Math.max(...vistos.map(v => v.length));
    info('B6', `${perfil}: con 3 nombres, a la vez se ven hasta ${maxElem} elementos (${maxVis} distintos); en ${repetidos} de ${N} instantes se ve el mismo nombre dos veces a la vez`);
    if (DIR && ['320', '393', '1440'].includes(perfil)) { await enInstante(page, 0); await captura(page, `B-${perfil}-t0`); await enInstante(page, e.anim.dur * 0.5); await captura(page, `B-${perfil}-t50`); }
    await browser.close();
  }
}

// ---------------------------------------------------------------- P · Pausas
async function pausas() {
  // cursor encima (puntero fino)
  {
    const { browser, page } = await abrir('1440');
    await ev(page, () => document.querySelector('[data-franja]').scrollIntoView({ block: 'center' }));
    await sleep(500);
    const e0 = await estado(page);
    ok('P0', e0.playState === 'running' && e0.enVista, `1440: la franja corre a la vista (animation-play-state ${e0.playState}, data-en-vista)`);
    const t1 = e0.anim.t; await sleep(400); const t2 = (await estado(page)).anim.t;
    ok('P0', t2 > t1, `1440: el tiempo de la animación avanza (${r1(t1)} → ${r1(t2)} ms)`);
    const caja = e0.v;
    await page.mouse.move(caja.l + caja.w / 2, (caja.t + caja.b) / 2); await sleep(250);
    const eh = await estado(page); const ta = eh.anim.t; await sleep(500); const tb = (await estado(page)).anim.t;
    ok('P1', eh.playState === 'paused' && Math.abs(tb - ta) < 1, `1440: con el cursor encima se detiene (${eh.playState}; el tiempo no avanza: ${r1(ta)} → ${r1(tb)})`);
    await page.mouse.move(5, 5); await sleep(300);
    ok('P1', (await estado(page)).playState === 'running', '1440: al quitar el cursor sigue');
    // presionar
    await page.mouse.move(caja.l + caja.w / 2, (caja.t + caja.b) / 2); await page.mouse.down(); await sleep(200);
    ok('P2', (await estado(page)).playState === 'paused', '1440: al presionar se detiene');
    await page.mouse.up(); await page.mouse.move(5, 5); await sleep(300);
    // foco dentro: el control
    await page.keyboard.press('Tab'); // hasta llegar al control de la franja
    for (let i = 0; i < 40 && !(await ev(page, () => document.activeElement?.matches('[data-franja-ctl]'))); i++) await page.keyboard.press('Tab');
    const enfocado = await ev(page, () => document.activeElement?.matches('[data-franja-ctl]'));
    const ef = await estado(page);
    ok('P3', enfocado && ef.playState === 'paused', `1440: con el foco en el control (Tab) la franja se detiene (${ef.playState})`);
    const anillo = await ev(page, () => getComputedStyle(document.activeElement).boxShadow);
    ok('P3', anillo && anillo !== 'none', `1440: el foco se ve (anillo ${anillo.slice(0, 36)}…)`);
    // Enter pausa del todo; Espacio reanuda
    await page.keyboard.press('Enter'); await sleep(200);
    let q = await estado(page);
    ok('P4', q.quieta && q.ctl.label === 'Reanudar el movimiento de las editoriales' && !q.anim && q.li.filter(x => x.vis).length === 3, `1440: Enter en el control la deja quieta (nombres a la vista: ${q.li.filter(x => x.vis).length}) y el botón pasa a «${q.ctl.label}»`);
    ok('P4', await ev(page, () => localStorage.getItem('iti-franja')) === 'off', '1440: la pausa se recuerda (localStorage iti-franja = off)');
    if (DIR) await captura(page, 'P-1440-pausada-por-boton');
    await page.keyboard.press('Space'); await sleep(400);
    q = await estado(page);
    ok('P4', !q.quieta && q.motion && q.anim && q.listo && q.ctl.label.startsWith('Pausar'), '1440: Espacio la reanuda (vuelve el bucle y «Pausar»)');
    ok('P4', await ev(page, () => localStorage.getItem('iti-franja')) === 'on', '1440: y lo recuerda (on)');
    // fuera de la vista no corre
    await ev(page, () => window.scrollTo(0, document.body.scrollHeight)); await sleep(500);
    const fuera = await estado(page);
    ok('P5', !fuera.enVista && fuera.playState === 'paused', `1440: fuera de la vista no corre (data-en-vista ausente, ${fuera.playState})`);
    await browser.close();
  }
  // recordada desde el primer render: sin salto de diseño
  {
    const { browser, page } = await abrir('393', { quieta: true });
    const e = await estado(page);
    ok('P6', e.quieta && !e.anim && e.li.filter(x => x.vis).length === 3 && e.ctl.label.startsWith('Reanudar'), '393: pausada por la persona en una visita anterior: llega quieta (una sola vez) y con «Reanudar»');
    ok('P6', (await ev(page, () => window.__cls)) === 0, '393: sin salto de diseño al llegar pausada (boot.js la recuerda antes del primer render)');
    await browser.close();
  }
  // «Pausar el movimiento» del sitio: pie y ☰
  for (const perfil of ['1440', '393']) {
    const { browser, page } = await abrir(perfil);
    await ev(page, () => document.querySelector('.ftr [data-motion-toggle]').scrollIntoView({ block: 'center' })); await sleep(300);
    await page.locator('.ftr [data-motion-toggle]').click(); await sleep(400);
    const q = await estado(page);
    ok('P7', !q.motion && !q.anim && q.li.filter(x => x.vis).length === 3 && !q.ctl.vis, `${perfil}: el interruptor del pie deja la franja quieta, única y sin control (nombres ${q.li.filter(x => x.vis).length}, control ${q.ctl.vis ? 'visible' : 'oculto'})`);
    await page.locator('.ftr [data-motion-toggle]').click(); await sleep(500);
    const r = await estado(page);
    ok('P7', r.motion && r.anim && r.listo && r.ctl.vis, `${perfil}: al reanudar el movimiento del sitio vuelve el bucle y el control`);
    if (perfil === '393') {
      // y el del menú ☰
      await ev(page, () => window.scrollTo(0, 0)); await sleep(200);
      await page.locator('[data-open-menu], .hdr-menu, button[aria-controls="menu"]').first().click().catch(() => {}); await sleep(500);
      const sw = page.locator('#menu [data-motion-toggle]');
      if (await sw.count() && await sw.isVisible()) {
        await sw.click(); await sleep(400);
        const m = await estado(page);
        ok('P7', !m.motion && !m.anim, '393: el interruptor del menú ☰ también la deja quieta');
      } else info('P7', '393: no pude abrir el menú ☰ en esta corrida');
    }
    await browser.close();
  }
}

// ---------------------------------------------------------------- Q · Quieta
async function quieta() {
  const variantes = [
    ['reducir movimiento', { reducido: true }], ['ahorro de datos', { saveData: true }], ['pausa del sitio', { pausa: true }], ['pausa de la franja', { quieta: true }]
  ];
  for (const perfil of ['320', '393', '1440']) for (const [nombre, o] of variantes) {
    const { browser, page } = await abrir(perfil, o);
    await ev(page, () => document.querySelector('[data-franja]').scrollIntoView({ block: 'center' })); await sleep(300);
    const e = await estado(page);
    const visibles = e.li.filter(x => x.vis);
    const unicos = new Set(visibles.map(x => x.txt));
    ok('Q1', !e.anim && e.animName === 'none', `${perfil} · ${nombre}: sin animación (animation-name ${e.animName})`);
    ok('Q2', visibles.length === 3 && unicos.size === 3 && visibles.every(x => !x.eco), `${perfil} · ${nombre}: cada nombre una sola vez (${visibles.length} elementos, ${unicos.size} distintos, sin copias)`);
    const filas = [...new Set(visibles.map(x => Math.round(x.t)))].length;
    // centrado: el centro del conjunto de cada renglón contra el centro de la ventana
    const porFila = new Map(); visibles.forEach(x => { const k = Math.round(x.t); porFila.set(k, [...(porFila.get(k) ?? []), x]); });
    const desv = Math.max(...[...porFila.values()].map(fila => Math.abs((Math.min(...fila.map(x => x.l)) + Math.max(...fila.map(x => x.r))) / 2 - (e.v.l + e.v.r) / 2)));
    ok('Q3', desv <= 1.5, `${perfil} · ${nombre}: centrada (${filas} renglón${filas === 1 ? '' : 'es'}; desvío de cada renglón contra la ventana ≤ ${r1(desv)} px)`);
    if (nombre === 'pausa de la franja') ok('Q4', e.ctl.vis && /^Reanudar/.test(e.ctl.label), `${perfil} · ${nombre}: el control sigue (para reanudar): «${e.ctl.label}»`);
    else ok('Q4', !e.ctl.vis, `${perfil} · ${nombre}: sin el control de pausa (no hay movimiento que pausar)`);
    ok('Q5', await sinDesborde(page) && visibles.every(x => x.l >= e.v.l - 0.5 && x.r <= e.v.r + 0.5), `${perfil} · ${nombre}: sin desborde; cada nombre dentro de la ventana`);
    const sinMascara = await ev(page, () => { const s = getComputedStyle(document.querySelector('.franja-ventana')); return (s.maskImage || s.webkitMaskImage || 'none'); });
    ok('Q6', sinMascara === 'none', `${perfil} · ${nombre}: sin bordes desvanecidos (nada se corta, nada se mueve)`);
    if (DIR && nombre === 'reducir movimiento') await captura(page, `Q-${perfil}-reducido`);
    await browser.close();
  }
}

// ---------------------------------------------------------------- C · Contraste, desvanecidos y objetivos
async function contrasteYMedidas() {
  for (const oscuro of [false, true]) for (const perfil of ['393', '1440']) {
    const { browser, page } = await abrir(perfil, { oscuro });
    const d = await ev(page, () => {
      const f = document.querySelector('[data-franja]');
      const pick = s => { const e = f.querySelector(s); const c = getComputedStyle(e); return { color: c.color }; };
      const fondo = getComputedStyle(document.body).backgroundColor;
      const v = getComputedStyle(f.querySelector('.franja-ventana'));
      return { nombre: pick('.franja-nombre'), rotulo: pick('.franja-rotulo'), ver: pick('.franja-ver'), fondo, mask: v.maskImage || v.webkitMaskImage, tinta2: getComputedStyle(document.documentElement).getPropertyValue('--tinta-2').trim(), tinta: getComputedStyle(document.documentElement).getPropertyValue('--tinta').trim() };
    });
    const t = oscuro ? 'oscuro' : 'claro';
    const cn = contraste(d.nombre.color, d.fondo), cr = contraste(d.rotulo.color, d.fondo), cv = contraste(d.ver.color, d.fondo);
    ok('C1', cn >= 4.5, `${perfil} ${t}: contraste del nombre (tinta-2 ${d.tinta2}) sobre el fondo ${r1(cn)}:1 (≥ 4.5)`);
    ok('C1', cr >= 4.5 && cv >= 4.5, `${perfil} ${t}: rótulo ${r1(cr)}:1 y enlace ${r1(cv)}:1 (≥ 4.5)`);
    const colores = d.mask.match(/rgba?\([^)]*\)/g) || [];
    ok('C2', /linear-gradient/.test(d.mask) && /48px/.test(d.mask) && colores.length >= 4 && /^rgba\(0, 0, 0, 0\)/.test(colores[0]) && /^rgba\(0, 0, 0, 0\)/.test(colores[colores.length - 1]) && colores[1] === colores[2], `${perfil} ${t}: bordes desvanecidos con máscara degradada de 48 px (transparente → opaco → transparente; solo cuenta la opacidad: ${colores.join(' ')})`);
    // al pasar el cursor, el nombre que queda debajo pasa a tinta
    if (perfil === '1440') {
      await ev(page, () => document.querySelector('[data-franja]').scrollIntoView({ block: 'center' })); await sleep(400);
      const c2 = await ev(page, () => { const v = document.querySelector('.franja-ventana').getBoundingClientRect(); return { x: v.left + v.width / 2, y: v.top + v.height / 2 }; });
      await page.mouse.move(c2.x, c2.y); await sleep(500);
      const col = await ev(page, () => getComputedStyle(document.querySelector('.franja-lista:not(.franja-lista--eco) .franja-item')).color);
      const tintaCol = await ev(page, () => { const e = document.createElement('i'); e.style.color = 'var(--tinta)'; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c; });
      ok('C3', col === tintaCol, `1440 ${t}: con el cursor encima, el nombre pasa de tinta-2 a tinta (${col} = ${tintaCol})`);
      await page.mouse.move(2, 2);
    }
    const m = await ev(page, () => { const b = document.querySelector('[data-franja-ctl]').getBoundingClientRect(), a = document.querySelector('.franja-ver').getBoundingClientRect(), r = document.querySelector('.franja-rotulo').getBoundingClientRect(); return { cw: b.width, ch: b.height, ah: a.height, sep: b.left - r.right, rotuloTop: r.top, ctlTop: b.top }; });
    ok('C4', m.cw >= 44 - 0.5 && m.ch >= 44 - 0.5 && m.ah >= 44 - 0.5 && m.sep >= 8 - 0.5, `${perfil} ${t}: objetivos de 44 (control ${r1(m.cw)}×${r1(m.ch)}, enlace de ${r1(m.ah)}); 8 px entre el rótulo y el control (${r1(m.sep)})`);
    if (DIR) await captura(page, `C-${perfil}-${t}`);
    await browser.close();
  }
}

// ---------------------------------------------------------------- T · Posiciones del inicio
const BASE = { // medidas del inicio ANTES de la franja (2026-11-19, HEAD 4e7b1cb): [x, y, ancho, alto]
  '393': { titulo: [20, 68, 279.8, 82], cta: [20, 226, 353, 56], foto: [20, 368, 353, 218] },
  '375': { titulo: [16, 68, 279.8, 82], cta: [16, 226, 343, 56], foto: [16, 368, 343, 188] },
  '440': { titulo: [20, 68, 279.8, 82], cta: [20, 226, 400, 56], foto: [20, 368, 400, 266.7] },
  '402': { titulo: [20, 130, 279.8, 82], cta: [20, 288, 362, 56], foto: [20, 430, 362, 241.3] },
  '320': { titulo: [16, 68, 279.8, 82], cta: [16, 248, 288, 56], foto: [16, 410, 288, 192] }
};
async function posiciones() {
  for (const perfil of ['393', '375', '440', '402', '320']) {
    const { browser, page } = await abrir(perfil, { antes: perfil === '402' ? async (p, ctx) => { const c = await ctx.newCDPSession(p); await c.send('Emulation.setSafeAreaInsetsOverride', { insets: { top: 62, bottom: 34, left: 0, right: 0 } }); } : null });
    const d = await ev(page, () => { const r = s => { const e = document.querySelector(s); const b = e.getBoundingClientRect(); return [b.left, b.top + scrollY, b.width, b.height].map(n => Math.round(n * 10) / 10); }; const f = document.querySelector('[data-franja]').getBoundingClientRect(); const cab = document.querySelector('.franja-cab').getBoundingClientRect(); const rot = document.querySelector('.franja-rotulo').getBoundingClientRect(); return { titulo: r('.entry-title'), cta: r('.entry-actions a'), foto: r('.entry-media'), franjaTop: f.top + scrollY, cabTop: cab.top + scrollY, rotuloTop: rot.top + scrollY, rotuloBottom: rot.bottom + scrollY, vh: innerHeight }; });
    const b = BASE[perfil];
    const igual = (a, c) => a.every((v, i) => Math.abs(v - c[i]) <= 0.1);
    ok('T1', igual(d.titulo, b.titulo) && igual(d.cta, b.cta) && igual(d.foto, b.foto), `${perfil}: titular ${d.titulo.slice(0, 2)}, «Cómo llegar» ${d.cta.slice(0, 2)}, foto ${d.foto} = las de antes de la franja`);
    const aire = d.cabTop - (d.foto[1] + d.foto[3]);
    ok('T2', Math.abs(aire - 80) <= 0.5, `${perfil}: de la foto a la franja 80 px (capa → capa; medido ${r1(aire)})`);
    const asoma = d.vh - d.cabTop;
    info('T3', `${perfil}: la franja empieza en y = ${r1(d.cabTop)} y la ventana mide ${d.vh}: ${asoma <= 0 ? 'queda toda bajo el primer pliegue' : `asoma ${r1(asoma)} px de su fila de rótulo y pausa (en este teléfono la foto deja sitio: la franja entra al primer pliegue)`}`);
    if (['393', '375', '320'].includes(perfil)) ok('T3', d.cabTop >= d.vh, `${perfil}: la franja entera queda bajo el primer pliegue en el teléfono de referencia (empieza en y ${r1(d.cabTop)} ≥ ${d.vh})`);
    await browser.close();
  }
  // escritorio: el hero no se mueve (1440: titular, foto)
  const { browser, page } = await abrir('1440');
  const d = await ev(page, () => { const r = s => { const b = document.querySelector(s).getBoundingClientRect(); return [b.left, b.top + scrollY, b.width, b.height].map(n => Math.round(n * 10) / 10); }; const f = document.querySelector('[data-franja]').getBoundingClientRect(); const fo = document.querySelector('.entry-media').getBoundingClientRect(); const cab = document.querySelector('.franja-cab').getBoundingClientRect(); return { titulo: r('.entry-title'), foto: r('.entry-media'), aire: cab.top - fo.bottom, franjaBottom: f.bottom + scrollY, casaTop: document.querySelector('#house-title').getBoundingClientRect().top + scrollY, vh: innerHeight }; });
  ok('T4', Math.abs(d.aire - 96) <= 0.5, `1440: de la foto a la franja 96 px (medido ${r1(d.aire)})`);
  ok('T4', Math.abs((d.casaTop - d.franjaBottom) - 112) <= 0.5, `1440: de la franja al titular de La casa 112 px (sección → sección; medido ${r1(d.casaTop - d.franjaBottom)})`);
  info('T4', `1440×900: titular ${d.titulo}, foto ${d.foto}; la franja entera (hasta y ${r1(d.franjaBottom)}) cabe en el primer pliegue (900)`);
  await browser.close();
}

// ---------------------------------------------------------------- L · Modo logo (de prueba)
const SILUETAS = { // genéricas, generadas aquí: NO son marcas de nadie
  'abismos-casa-editorial': { ancho: 300, alto: 60, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 60"><rect x="0" y="6" width="300" height="48" rx="24"/><circle cx="30" cy="30" r="10" fill="#fff"/><rect x="60" y="24" width="190" height="12" rx="6" fill="#fff"/></svg>' },
  'capitulo-siete': { ancho: 240, alto: 60, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 240 60"><path d="M0 54V6h28l24 48h28V6h28v48h28V6h28v48h28V6h28v48H0z" fill-rule="evenodd"/></svg>' },
  'iridiscencias': { ancho: 180, alto: 60, svg: '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 180 60"><circle cx="30" cy="30" r="26"/><circle cx="90" cy="30" r="26"/><circle cx="150" cy="30" r="26"/></svg>' }
};
export const rutearLogos = async context => {
  const { franjaHtml, leerConfig, logosCss, withLogosCss } = await import(pathToFileURL(join(root, 'scripts/franja-datos.mjs')).href);
  const cat = JSON.parse(readFileSync(join(root, 'assets/data/catalog.json'), 'utf8'));
  const cfg = leerConfig({ excluir: ['Libro Objeto'], logos: Object.fromEntries(Object.entries(SILUETAS).map(([slug, s]) => [slug.replace(/-/g, ' '), { logo: `assets/img/editoriales/${slug}.svg`, alt: `Logotipo de prueba ${slug}`, ancho: s.ancho, alto: s.alto }])) });
  const { withEditoriales } = await import(pathToFileURL(join(root, 'scripts/build-editoriales.mjs')).href);
  const { withFranja } = await import(pathToFileURL(join(root, 'scripts/franja-datos.mjs')).href);
  const indexHtml = withFranja(readFileSync(join(root, 'index.html'), 'utf8'), cat.books, cfg);
  const css = withLogosCss(readFileSync(join(root, 'style.css'), 'utf8'), cat.books, cfg);
  await context.route(/\/(index\.html)?(\?.*)?$/, r => { if (new URL(r.request().url()).pathname === '/' || /index\.html$/.test(r.request().url())) return r.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: indexHtml }); return r.continue(); });
  await context.route(/\/style\.css(\?.*)?$/, r => r.fulfill({ status: 200, contentType: 'text/css', body: css }));
  await context.route(/\/assets\/img\/editoriales\/[a-z-]+\.svg$/, r => { const slug = new URL(r.request().url()).pathname.split('/').pop().replace('.svg', ''); const s = SILUETAS[slug]; return s ? r.fulfill({ status: 200, contentType: 'image/svg+xml', body: s.svg }) : r.abort(); });
};
async function logos() {
  for (const oscuro of [false, true]) for (const perfil of ['393', '1440']) {
    const { browser, page, errores } = await abrir(perfil, { oscuro, rutas: rutearLogos });
    const t = oscuro ? 'oscuro' : 'claro';
    const d = await ev(page, () => [...document.querySelectorAll('.franja-item:not(.franja-eco) .franja-logo')].map(e => { const b = e.getBoundingClientRect(), s = getComputedStyle(e); return { h: b.height, w: b.width, ratio: b.width / b.height, bg: s.backgroundColor, mask: s.maskImage || s.webkitMaskImage, role: e.getAttribute('role'), label: e.getAttribute('aria-label') }; }));
    const tinta2 = await ev(page, () => { const e = document.createElement('i'); e.style.color = 'var(--tinta-2)'; document.body.append(e); const c = getComputedStyle(e).color; e.remove(); return c; });
    ok('L1', d.length === 3 && d.every(x => Math.abs(x.h - 28) <= 0.5 && /url\(/.test(x.mask) && x.role === 'img' && /Logotipo de prueba/.test(x.label)), `${perfil} ${t}: 3 logos de prueba de 28 px de alto con máscara, role=img y alt (${d.map(x => `${r1(x.w)}×${r1(x.h)}`).join(', ')})`);
    ok('L2', d.every((x, i) => Math.abs(x.ratio - Object.values(SILUETAS)[i].ancho / Object.values(SILUETAS)[i].alto) < 0.05), `${perfil} ${t}: la proporción de cada logo se conserva (${d.map(x => r1(x.ratio)).join(', ')})`);
    ok('L3', d.every(x => x.bg === tinta2), `${perfil} ${t}: el logo toma el color de tinta-2 del tema (${d[0].bg}): una sola silueta sirve en claro y en oscuro`);
    ok('L4', (await ev(page, () => document.querySelectorAll('.franja-nombre').length)) === 0, `${perfil} ${t}: con logo no se pinta el nombre`);
    ok('L5', errores.length === 0, `${perfil} ${t}: sin errores de consola`);
    // el bucle cierra igual con logos
    await ev(page, () => document.querySelector('[data-franja]').scrollIntoView({ block: 'center' })); await sleep(400);
    const e = await estado(page);
    const liB = await ev(page, () => [...document.querySelectorAll('.franja-lista--eco > .franja-item')].map(x => x.getBoundingClientRect().left));
    const e0 = await enInstante(page, 0); const p0 = e0.li[0].l; await enInstante(page, e.anim.dur - 1);
    const liB2 = await ev(page, () => [...document.querySelectorAll('.franja-lista--eco > .franja-item')].map(x => x.getBoundingClientRect().left));
    ok('L6', e.aW >= e.v.w - 0.5 && Math.abs(liB2[0] - p0) <= 0.1 && Math.abs(e.carrilW / 2 - e.aW) <= 0.1, `${perfil} ${t}: con logos cada grupo llena la ventana (${r1(e.aW)} ≥ ${r1(e.v.w)}) y la vuelta cierra sin salto (${r1(Math.abs(liB2[0] - p0) * 100) / 100} px)`);
    if (DIR) { await enInstante(page, 0); await captura(page, `L-${perfil}-${t}`); }
    await browser.close();
  }
  // quieto con logos
  const { browser, page } = await abrir('393', { reducido: true, rutas: rutearLogos });
  const d = await ev(page, () => [...document.querySelectorAll('.franja-item')].filter(e => getComputedStyle(e).display !== 'none' && e.getBoundingClientRect().width > 0).length);
  ok('L7', d === 3, `393 reducir movimiento con logos: tres logos, una sola vez (${d})`);
  if (DIR) await captura(page, 'L-393-reducido');
  await browser.close();
}

// ---------------------------------------------------------------- I · INP con CPU 4×
async function inp() {
  const { browser, page, context } = await abrir('393', { espera: 1800 });
  const cdp = await context.newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await ev(page, () => { window.__ev = []; new PerformanceObserver(l => { for (const e of l.getEntries()) if (e.interactionId) window.__ev.push(e.duration); }).observe({ type: 'event', durationThreshold: 16, buffered: true }); document.querySelector('[data-franja]').scrollIntoView({ block: 'center' }); });
  await sleep(500);
  const ctl = page.locator('[data-franja-ctl]');
  for (let i = 0; i < 4; i++) { await ctl.click(); await sleep(350); }
  await ev(page, () => document.querySelector('.ftr [data-motion-toggle]').scrollIntoView({ block: 'center' })); await sleep(400);
  for (let i = 0; i < 2; i++) { await page.locator('.ftr [data-motion-toggle]').click(); await sleep(450); }
  const dur = await ev(page, () => window.__ev);
  const peor = Math.max(0, ...dur);
  ok('I1', peor <= 200, `393 con CPU 4×: peor interacción ${r1(peor)} ms en ${dur.length} medidas (pausa de la franja ×4 y pausa del sitio ×2; ≤ 200)`);
  await browser.close();
}

const orden = [['E', estructura], ['B', bucle], ['P', pausas], ['Q', quieta], ['C', contrasteYMedidas], ['T', posiciones], ['L', logos], ['I', inp]];
for (const [k, fn] of orden) if (SOLO.has(k)) { console.log(`\n== ${k} ==`); try { await fn(); } catch (e) { ok(k, false, `la comprobación lanzó: ${e.message}`); } }
const mal = res.filter(r => !r.ok);
console.log(`\n${res.length - mal.length}/${res.length} comprobaciones en verde${mal.length ? `; fallan: ${mal.map(m => m.regla).join(', ')}` : ''}`);
process.exit(mal.length ? 1 : 0);
