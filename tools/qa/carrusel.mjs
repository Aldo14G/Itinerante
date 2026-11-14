// Norma del Carrusel3D (skill ux-apple §3): mide los tres carruseles (portada, evento y carta) en nueve tamaños, con movimiento y con
// movimiento reducido, y sale con código 1 si algo se sale de la norma. Desde el 2026-11-14 los teléfonos son iPhone reales (alto = la zona
// visible de Safari): 16 393×659, 13 mini 375×629, SE 375×667, 16 Pro Max 440×763 y 16 Pro a pantalla completa 402×874 con áreas seguras
// 62/34 (Emulation.setSafeAreaInsetsOverride), más 320×640 (Zoom de pantalla); antes 360×740, 390×844 y 430×932, que ningún iPhone tiene.
// node tools/qa/carrusel.mjs URL [DIR]   (DIR: capturas y carrusel.json; por omisión, el directorio actual)
// Cambia el navegador con CHROME_PATH. Teléfonos y tableta (≤ 768 px) con toque (puntero grueso); 1024 px o más con puntero fino.
//
// Por carrusel y tamaño comprueba:
//  · centro: |centro de la pieza central − centro del .c3d| ≤ 1 px y lo mismo contra la columna de contenido de su sección;
//  · ancho: en el teléfono, % del ancho del carrusel (portada 54–60 y ≥ 168 px, carta 56–62, evento 76–82); desde 761 px, en px
//    (portada 280–320, evento 400–460, carta 240–280 desde 1280; entre 761 y 1279, donde el escenario no da para la pieza de escritorio con
//    sus vecinas y las flechas, la que quepa: portada 240–320, evento 300–460, carta 232–280);
//  · piezas a la vista (> 50 % dentro de la ventana): ≤ 3 en el teléfono, ≤ 5 desde 761;
//  · hueco visible entre la central y cada vecina ≥ 12 px (no se enciman);
//  · flechas: con toque no se muestran (el control es deslizar o tocar la vecina); con puntero fino se ven, miden ≥ 44, no tapan la central
//    (≥ 8 px de hueco), van centradas en el alto de la pieza (± 2 px) y, desde 1024 px, quedan ≥ 16 px fuera de la última pieza a la vista;
//  · el bloque carrusel + pie cabe en el alto útil (entre la barra de navegación y la barra inferior); desde el 2026-11-14 ningún carrusel
//    lleva acción debajo («Compartir» de Eventos va en la fila de insignias de la tarjeta; el contacto vive en el pie de la página);
//  · aire: lo de arriba → pieza 24–32 (± 2), pieza → pie 16–20 (± 2), pie → acción 24 (± 4; en la carta, pieza → acción);
//  · texto: nada cortado en la pieza central ni en el pie; en las vecinas ningún texto visible cruza el borde de la ventana (el texto de
//    una portada tipográfica es parte de la imagen y no cuenta);
//  · con movimiento reducido, ninguna pieza con giro ni profundidad (transformación plana).
// Informa (sin fallar): % que asoma cada vecina, piezas parciales y distancia de la flecha a la última pieza visible entre 761 y 1023.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const out = process.argv[3] || '.';
mkdirSync(out, { recursive: true });
// [ancho, alto, área segura arriba, abajo]
const SIZES = [[320, 640], [375, 629], [375, 667], [393, 659], [440, 763], [402, 874, 62, 34], [768, 1024], [1024, 768], [1280, 800], [1440, 900], [1920, 1080]];
const MODOS = ['claro', 'reducido'];
const port = 9700 + Math.floor(Math.random() * 90);
// Chromium sin cabeza no declara (hover: hover) ni (pointer: fine): se fijan como en e2e.mjs; el toque emulado los cambia a grueso.
// Como root (contenedores) Chrome no abre su puerto de depuración sin --no-sandbox: la auditoría del 2026-11-14 lo encontró sin arrancar.
const sandbox = process.getuid?.() === 0 ? ['--no-sandbox'] : [];
const chrome = spawn(process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', ['--headless=new', ...sandbox, `--remote-debugging-port=${port}`, '--no-first-run', '--disable-extensions', '--hide-scrollbars', '--blink-settings=primaryHoverType=2,availableHoverTypes=2,primaryPointerType=4,availablePointerTypes=4', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-c3d-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let targets = [];
for (let i = 0; i < 80 && !targets.some(t => t.type === 'page'); i++) { try { targets = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); } catch {} await sleep(250); }
const pageT = targets.find(t => t.type === 'page');
if (!pageT) { chrome.kill(); console.error(`carrusel.mjs: Chrome no respondió en el puerto ${port} (CHROME_PATH=${process.env.CHROME_PATH || 'por defecto'})`); process.exit(2); }
const ws = new WebSocket(pageT.webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pending = new Map(); let problems = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id); return; }
  if (m.method === 'Runtime.exceptionThrown') problems.push('EXC ' + (m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pending.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async expr => {
  const r = await send('Runtime.evaluate', { expression: expr, awaitPromise: true, returnByValue: true });
  if (r.result?.exceptionDetails) throw new Error(`la página lanzó al evaluar: ${r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text}`);
  return r.result?.result?.value;
};
await send('Page.enable'); await send('Runtime.enable');

const VARIANTES = [
  { name: 'portada', sec: '#libros', c3d: '.c3d--portada', top: '.rail-head' },
  { name: 'evento', sec: '#cartelera', c3d: '.c3d--evento', top: '.sec-head' },
  { name: 'carta', sec: '#cafe', c3d: '.c3d--carta', top: '.cafe-chips' }
];
// Norma (skill ux-apple §3). Teléfono: % del ancho del carrusel. Escritorio: px.
const TEL = { portada: [54, 60], carta: [56, 62], evento: [76, 82] };
const ESC = { portada: [280, 320], evento: [400, 460], carta: [240, 280] };
const TAB = { portada: [240, 320], evento: [300, 460], carta: [232, 280] };

const report = [];
const rows = [];
const check = (where, name, ok, detail = '') => report.push({ where, name, ok: !!ok, detail: ok ? '' : String(detail) });

// Medición dentro de la página (una sola pasada por carrusel).
const MEDIR = String.raw`(([secSel, c3dSel, name]) => {
  const R = e => e.getBoundingClientRect();
  const sec = document.querySelector(secSel), c = sec.querySelector(c3dSel), vp = c.querySelector('.c3d-viewport');
  const cr = R(c), vr = R(vp);
  const ps = getComputedStyle(sec), sr = R(sec);
  const colL = sr.left + parseFloat(ps.paddingLeft), colR = sr.right - parseFloat(ps.paddingRight);
  const items = [...c.querySelectorAll('.c3d-item')];
  const ci = items.findIndex(i => i.classList.contains('is-centro'));
  const visual = it => it.querySelector('.cover, .bill-card, .cafe-card') || it.querySelector('.cf-pose');
  const op = el => { let o = 1; for (let p = el; p && p !== c; p = p.parentElement) o *= +getComputedStyle(p).opacity; return o; };
  const info = items.map((it, i) => {
    const r = R(visual(it)); const inside = Math.max(0, Math.min(r.right, vr.right) - Math.max(r.left, vr.left));
    const shown = getComputedStyle(it).visibility !== 'hidden' && op(it.querySelector('.cf-pose')) > 0.05;
    return { i, l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height, frac: r.width ? inside / r.width : 0, shown, t3d: getComputedStyle(it.querySelector('.cf-pose')).transform };
  });
  const cen = info[ci]; const nominal = items[ci].offsetWidth;
  const L = info[ci - 1], Rn = info[ci + 1];
  const vis = info.filter(v => v.shown && v.frac > 0.5);
  const hueco = [L && L.shown && L.frac > 0 ? cen.l - L.r : null, Rn && Rn.shown && Rn.frac > 0 ? Rn.l - cen.r : null];
  const asoma = [L && L.shown ? Math.max(0, Math.min(cen.l, L.r) - Math.max(L.l, vr.left)) / nominal : null, Rn && Rn.shown ? Math.max(0, Math.min(Rn.r, vr.right) - Math.max(Rn.l, cen.r)) / nominal : null];
  const flechas = [...c.querySelectorAll('.c3d-flecha')].map(a => { const r = R(a); const cs = getComputedStyle(a); return { l: r.left, r: r.right, t: r.top, b: r.bottom, w: r.width, h: r.height, shown: cs.display !== 'none' && cs.visibility !== 'hidden' && r.width > 0 && +cs.opacity > 0.05, prev: a.classList.contains('c3d-flecha--prev') }; });
  const extL = Math.min(...vis.map(v => v.l)), extR = Math.max(...vis.map(v => v.r));
  const fl = flechas.filter(f => f.shown).map(f => ({ ...f,
    sobreCentral: Math.max(0, Math.min(f.r, cen.r) - Math.max(f.l, cen.l)) * (Math.min(f.b, cen.b) > Math.max(f.t, cen.t) ? 1 : 0),
    huecoCentral: f.prev ? cen.l - f.r : f.l - cen.r,
    fuera: f.prev ? extL - f.r : f.l - extR,
    dy: (f.t + f.h / 2) - (cen.t + cen.h / 2) }));
  // Texto cortado: en la central y el pie (nada); en las vecinas, ningún texto visible que cruce el borde de la ventana.
  const leaves = root => [...root.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim() && !e.closest('.cover, .sr-only') && getComputedStyle(e).display !== 'none');
  const visibleTxt = e => { const r = R(e); return r.width > 1 && r.height > 1 && op(e) > 0.05 && getComputedStyle(e).visibility !== 'hidden'; };
  const cenEl = visual(items[ci]);
  const cortesCentro = leaves(items[ci]).filter(visibleTxt).filter(e => { const r = R(e); return e.scrollWidth > e.clientWidth + 1 || r.bottom > cen.b + 0.5 || r.right > cen.r + 0.5 || r.left < cen.l - 0.5; }).map(e => e.textContent.trim().slice(0, 30));
  const cortesVecinas = info.filter((v, i) => i !== ci && v.shown && v.frac > 0).flatMap(v => leaves(items[v.i]).filter(visibleTxt).filter(e => { const r = R(e); return (r.left < vr.left - 0.5 && r.right > vr.left + 0.5) || (r.right > vr.right + 0.5 && r.left < vr.right - 0.5); }).map(e => e.textContent.trim().slice(0, 30)));
  // Arriba, pie y acción de cada variante.
  const q = s => sec.querySelector(s);
  let arriba, pie = null, accion = null;
  if (name === 'portada') { arriba = q('.rail-nota-fila'); pie = q('.cf-texto'); }
  else if (name === 'evento') { arriba = q('.sec-head'); pie = q('.bill-desc'); } // «Compartir» va en la tarjeta desde el 2026-11-14
  else { arriba = q('.cafe-chips'); }
  const pieTxt = pie ? [...pie.querySelectorAll('*')].filter(e => !e.children.length && e.textContent.trim() && !e.closest('.sr-only')).filter(e => e.scrollWidth > e.clientWidth + 1).map(e => e.textContent.trim().slice(0, 30)) : [];
  const hdr = document.querySelector('.hdr'), tab = document.querySelector('.tabbar');
  const top = hdr ? R(hdr).bottom : 0;
  const bottom = tab && getComputedStyle(tab).display !== 'none' ? R(tab).top : innerHeight;
  return {
    vw: innerWidth, coarse: matchMedia('(hover: none) and (pointer: coarse)').matches, cw: getComputedStyle(c).getPropertyValue('--c3d-w').trim(),
    nominal, c3dW: cr.width, colW: colR - colL,
    dxC3d: (cen.l + cen.w / 2) - (cr.left + cr.width / 2), dxCol: (cen.l + cen.w / 2) - (colL + (colR - colL) / 2),
    visibles: vis.length, parciales: info.filter(v => v.shown && v.frac > 0 && v.frac <= 0.5).length,
    hueco, asoma, flechas: fl, flechasTotal: flechas.length, flechasVisibles: fl.length,
    cortesCentro, cortesVecinas, pieTxt,
    altoUtil: bottom - top, bloque: (accion ? R(accion).bottom : pie ? R(pie).bottom : cen.b) - cen.t,
    aire: { arriba: cen.t - R(arriba).bottom, pie: pie ? R(pie).top - cen.b : null, accion: accion ? R(accion).top - (pie ? R(pie).bottom : cen.b) : null },
    poses: info.filter(v => v.shown).map(v => v.t3d)
  };
})`;

for (const modo of MODOS) {
  for (const [w, h, sTop = 0, sBottom = 0] of SIZES) {
    const mobile = w <= 768;
    problems = [];
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Emulation.setSafeAreaInsetsOverride', { insets: { top: sTop, bottom: sBottom, left: 0, right: 0 } });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false });
    await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: modo === 'reducido' ? 'reduce' : 'no-preference' }, { name: 'prefers-color-scheme', value: 'light' }] });
    await send('Page.navigate', { url: 'about:blank' });
    await send('Page.navigate', { url: URL_ });
    await sleep(1500);
    // Recorre la página para que cada carrusel se arme al acercarse.
    const H = await ev('document.documentElement.scrollHeight');
    for (let y = 0; y < H; y += h * 0.6) { await ev(`scrollTo(0, ${y})`); await sleep(80); }
    for (const v of VARIANTES) {
      const where = `${modo} ${w}×${h} ${v.name}`;
      try {
        await ev(`(() => { const s = document.querySelector('${v.sec}'); const el = s.querySelector('${v.top}'); const hh = document.querySelector('.hdr')?.getBoundingClientRect().height || 0; scrollTo(0, scrollY + el.getBoundingClientRect().top - hh - 16); })()`);
        // Espera por condición: pieza central, sin esqueletos, imágenes de la central cargadas y desplazamiento quieto.
        const ok = await ev(`new Promise(res => { const t0 = performance.now(); let last = -1, quiet = 0; const tick = () => {
          const c = document.querySelector('${v.sec} ${v.c3d}'); const vp = c?.querySelector('.c3d-viewport'); const cen = c?.querySelector('.c3d-item.is-centro');
          const ready = cen && !c.querySelector('.card--sk') && [...cen.querySelectorAll('img')].every(i => i.complete);
          if (ready && vp.scrollLeft === last) quiet++; else quiet = 0; last = vp?.scrollLeft ?? -1;
          if (quiet >= 6) return res(true); if (performance.now() - t0 > 8000) return res(false); setTimeout(tick, 60); }; tick(); })`);
        if (!ok) { check(where, 'el carrusel está listo', false, 'tope de 8 s sin pieza central quieta'); continue; }
        await ev('document.fonts.ready.then(() => true)');
        await sleep(450);
        const m = await ev(`${MEDIR}(${JSON.stringify([v.sec, v.c3d, v.name])})`);
        const r1 = n => Math.round(n * 10) / 10;
        // Centro
        check(where, 'pieza central centrada en el carrusel (≤ 1 px)', Math.abs(m.dxC3d) <= 1, `Δ ${r1(m.dxC3d)} px`);
        check(where, 'pieza central centrada en la columna (≤ 1 px)', Math.abs(m.dxCol) <= 1, `Δ ${r1(m.dxCol)} px`);
        // Ancho
        let pct = null;
        if (w <= 760) {
          pct = 100 * m.nominal / m.c3dW;
          const [lo, hi] = TEL[v.name];
          check(where, `ancho ${lo}–${hi} % del carrusel`, pct >= lo - 0.5 && pct <= hi + 0.5 && (v.name !== 'portada' || m.nominal >= 168), `${m.nominal} px = ${r1(pct)} %`);
        } else {
          const [lo, hi] = (w >= 1280 ? ESC : TAB)[v.name];
          check(where, `ancho ${lo}–${hi} px`, m.nominal >= lo - 0.5 && m.nominal <= hi + 0.5, `${m.nominal} px`);
        }
        // Piezas y hueco
        check(where, `piezas a la vista ≤ ${w <= 760 ? 3 : 5}`, m.visibles <= (w <= 760 ? 3 : 5), m.visibles);
        const huecos = m.hueco.filter(x => x != null);
        check(where, 'hueco central↔vecina ≥ 12 px', huecos.length > 0 && huecos.every(x => x >= 12), JSON.stringify(m.hueco.map(x => x == null ? x : r1(x))));
        // Flechas
        if (m.coarse) check(where, 'con toque, sin flechas a la vista', m.flechasVisibles === 0, `${m.flechasVisibles} visibles`);
        else {
          const fl = m.flechas;
          check(where, 'con puntero fino, flechas a la vista (≥ 44 px)', m.flechasTotal === 2 ? fl.length >= 1 && fl.every(f => f.w >= 44 && f.h >= 44) : true, JSON.stringify(fl.map(f => [r1(f.w), r1(f.h)])));
          check(where, 'flechas sin tapar la central (≥ 8 px)', fl.every(f => f.sobreCentral === 0 && f.huecoCentral >= 8), JSON.stringify(fl.map(f => r1(f.huecoCentral))));
          check(where, 'flechas centradas en el alto de la pieza (± 2 px)', fl.every(f => Math.abs(f.dy) <= 2), JSON.stringify(fl.map(f => r1(f.dy))));
          if (w >= 1024) check(where, 'flechas ≥ 16 px fuera de la última pieza a la vista', fl.every(f => f.fuera >= 16), JSON.stringify(fl.map(f => r1(f.fuera))));
        }
        // Alto y aire
        check(where, 'carrusel + pie + acción caben en el alto útil', m.bloque <= m.altoUtil, `${Math.round(m.bloque)} / ${Math.round(m.altoUtil)} px`);
        check(where, 'aire arriba 24–32 px', m.aire.arriba >= 22 && m.aire.arriba <= 34, r1(m.aire.arriba));
        if (m.aire.pie != null) check(where, 'pieza → pie 16–20 px', m.aire.pie >= 14 && m.aire.pie <= 22, r1(m.aire.pie));
        if (m.aire.accion != null) check(where, `${m.aire.pie != null ? 'pie' : 'pieza'} → acción 24 px`, m.aire.accion >= 20 && m.aire.accion <= 28, r1(m.aire.accion));
        // Texto
        check(where, 'sin texto cortado en la central ni en el pie', !m.cortesCentro.length && !m.pieTxt.length, [...m.cortesCentro, ...m.pieTxt].join(' | '));
        check(where, 'vecinas sin texto partido en el borde', !m.cortesVecinas.length, m.cortesVecinas.join(' | '));
        if (modo === 'reducido') check(where, 'movimiento reducido: plano, sin giro ni profundidad', m.poses.every(t => t === 'none' || t.startsWith('matrix(')), m.poses.filter(t => t.startsWith('matrix3d')).length + ' piezas en 3D');
        rows.push({ modo, size: `${w}×${h}`, name: v.name, w: m.nominal, pct: pct == null ? null : r1(pct), cw: m.cw, dx: r1(m.dxC3d), dxCol: r1(m.dxCol), visibles: m.visibles, parciales: m.parciales,
          hueco: m.hueco.map(x => x == null ? x : r1(x)), asoma: m.asoma.map(x => x == null ? x : Math.round(100 * x)), flechas: m.coarse ? (m.flechasVisibles ? `${m.flechasVisibles} a la vista con toque` : 'ocultas (toque)') : m.flechas.map(f => ({ hueco: r1(f.huecoCentral), fuera: r1(f.fuera), dy: r1(f.dy) })),
          bloque: Math.round(m.bloque), altoUtil: Math.round(m.altoUtil), aire: { arriba: r1(m.aire.arriba), pie: m.aire.pie == null ? null : r1(m.aire.pie), accion: m.aire.accion == null ? null : r1(m.aire.accion) } });
        const vpRect = await ev(`(() => { const c = document.querySelector('${v.sec} ${v.c3d}'); const r = c.getBoundingClientRect(); return { x: Math.max(0, r.left - 8), y: Math.max(0, r.top - 120), width: Math.min(innerWidth, r.width + 16), height: Math.min(innerHeight - Math.max(0, r.top - 120), r.height + 320) }; })()`);
        const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 72, clip: { ...vpRect, scale: 1 } });
        writeFileSync(join(out, `${modo}-${v.name}-${w}x${h}.jpg`), Buffer.from(shot.result.data, 'base64'));
      } catch (e) { check(where, 'medición', false, e.message); }
    }
    check(`${modo} ${w}×${h}`, 'sin errores en la página', !problems.length, [...new Set(problems.map(p => p.split('\n')[0]))].join(' | '));
  }
}
ws.close(); chrome.kill();

writeFileSync(join(out, 'carrusel.json'), JSON.stringify({ rows, report }, null, 1));
const pad = (s, n) => String(s).padEnd(n);
console.log(pad('modo', 9) + pad('tamaño', 11) + pad('pieza', 9) + pad('ancho', 7) + pad('%', 6) + pad('Δ', 6) + pad('vista', 6) + pad('hueco', 13) + pad('asoma %', 10) + pad('flechas', 20) + pad('bloque', 11) + 'aire (arriba/pie/acción)');
for (const r of rows) console.log(pad(r.modo, 9) + pad(r.size, 11) + pad(r.name, 9) + pad(r.w, 7) + pad(r.pct ?? '–', 6) + pad(r.dx, 6) + pad(r.visibles, 6) + pad(JSON.stringify(r.hueco), 13) + pad(JSON.stringify(r.asoma), 10) + pad(typeof r.flechas === 'string' ? (r.flechas.startsWith('ocultas') ? 'ocultas' : r.flechas.split(' ')[0] + ' con toque') : r.flechas.map(f => `${f.hueco}/${f.fuera}`).join(' '), 20) + pad(`${r.bloque}/${r.altoUtil}`, 11) + `${r.aire.arriba}/${r.aire.pie ?? '–'}/${r.aire.accion}`);
const fails = report.filter(r => !r.ok);
console.log(`\n${report.length - fails.length}/${report.length} comprobaciones en verde.`);
for (const f of fails) console.log(`✗ ${f.where}: ${f.name} — ${f.detail}`);
process.exit(fails.length ? 1 : 0);
