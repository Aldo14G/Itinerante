// Auditoría de controles (WCAG 2.2 · 2.5.8 y 2.5.5) y revisión «mira y corrige» adaptada de la rúbrica de MotionSites (ver docs/agentes/rubrica-visual.md).
// Uso: node tools/qa/controles.mjs URL [DIR]   Sale con código 1 si algo falla. Con DIR guarda capturas: primer cuadro (350 ms), escritorio y móvil.
// En 320×640, 390×844, 900×800 y 1440×900 comprueba, para cada control visible que no sea un enlace dentro de un párrafo:
//   · tamaño ≥ 44×44 px (AAA 2.5.5; el mínimo AA de 24 px queda muy por debajo);
//   · alto de la escala del sistema «Itinerante Líquido»: 44 (--alto-sm: en línea y en las barras), 48 (--alto-md: estándar) o 56 (--alto-lg:
//     acciones principales y filas del menú); excepciones con nombre: casillas de la barra inferior (49, la tab bar de iOS), tarjetas de libro
//     (portada, título y «autor · precio»), opciones de filtro y sugerencias y el resumen de las tarjetas de evento;
//   · ≥ 8 px hasta el control vecino (las casillas contiguas de la barra inferior, «Guardar» sobre su portada y «Compartir» sobre la foto de
//     su evento son una sola pieza y se excluyen);
//   · rótulo a 17 px (Headline: botones de 48 y 56) o 15 px (Subheadline: botones de 44 y chips).
// Y, como la revisión de MotionSites: sin errores de consola ni peticiones fallidas, sin imágenes rotas, sin desborde horizontal,
// Inter cargada (respaldo de la letra de Apple: en Linux y Android es la que se pinta) y el primer cuadro ya con el fondo claro del inicio (sin destello oscuro).
import { spawn } from 'node:child_process';
import { mkdtempSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const OUT = process.argv[3];
if (!URL_) { console.error('Uso: node tools/qa/controles.mjs URL [DIR]'); process.exit(2); }
if (OUT) mkdirSync(OUT, { recursive: true });
const port = 9880 + Math.floor(Math.random() * 50);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', '--hide-scrollbars', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'ctl-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); const problems = []; let tag = '';
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  if (m.method === 'Runtime.exceptionThrown') problems.push(`${tag}: ${m.params.exceptionDetails?.exception?.description || m.params.exceptionDetails?.text}`);
  if (m.method === 'Runtime.consoleAPICalled' && m.params.type === 'error') problems.push(`${tag}: ${m.params.args.map(a => a.value ?? a.description).join(' ')}`);
  if (m.method === 'Network.loadingFailed' && !m.params.canceled) problems.push(`${tag}: petición fallida (${m.params.errorText})`);
  if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) problems.push(`${tag}: HTTP ${m.params.response.status} ${m.params.response.url.slice(0, 90)}`);
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) throw new Error(r.result.exceptionDetails.exception?.description || 'la página lanzó al evaluar'); return r.result?.result?.value; };
const shot = async name => { if (!OUT) return; const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(OUT, name), Buffer.from(r.result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

const SCALE = [44, 48, 56];
// Piezas con alto propio, cada una con su razón: no son botones de la escala.
const OWN = '.tabbar a, .tab-list, .card, .rel, .menu-row, .c3d-viewport, .cat-opt input, .cat-suggest li, summary, .news-book'; // .news-book: un libro de Novedades (portada, título y autor) es una pieza con alto propio, como .card
const AUDIT = `(() => {
  const SCALE = ${JSON.stringify(SCALE)};
  const sel = 'a[href], button, input:not([type=hidden]), select, summary, [role=radio]';
  const vis = e => { const r = e.getBoundingClientRect(); const cs = getComputedStyle(e); return r.width > 0 && r.height > 0 && cs.visibility !== 'hidden' && !e.closest('[hidden], [inert], dialog:not([open]), details:not([open]) > :not(summary), .sr-only'); };
  const inText = e => e.tagName === 'A' && getComputedStyle(e).display === 'inline';
  const els = [...document.querySelectorAll(sel)].filter(e => vis(e) && !inText(e) && !(e.tagName === 'INPUT' && e.type === 'checkbox'));
  const name = e => (e.getAttribute('aria-label') || e.textContent || e.value || e.className || e.tagName).trim().replace(/\\s+/g, ' ').slice(0, 30);
  const box = e => { const r = e.getBoundingClientRect(); return { e, x: r.left, y: r.top + scrollY, w: r.width, h: r.height, fixed: !!e.closest('.tabbar, .hdr') }; };
  const B = els.map(box);
  const out = { small: [], offScale: [], tight: [], font: [] };
  for (const b of B) {
    const e = b.e, own = e.matches(${JSON.stringify(OWN)});
    if (Math.round(b.h) < 44 || Math.round(b.w) < 44) out.small.push(name(e) + ' ' + Math.round(b.w) + '×' + Math.round(b.h));
    if (!own && !SCALE.includes(Math.round(b.h)) && !e.matches('.save')) out.offScale.push(name(e) + ' ' + Math.round(b.h));
    if (/^(BUTTON|A)$/.test(e.tagName) && !own && !e.matches('.save, .btn--icono, .menu-btn, .ml-remove') && ![15, 17].includes(Math.round(parseFloat(getComputedStyle(e).fontSize)))) out.font.push(name(e) + ' ' + getComputedStyle(e).fontSize);
    let best = Infinity, who = '';
    for (const c of B) {
      if (c === b || c.fixed !== b.fixed || c.e.contains(e) || e.contains(c.e)) continue;
      if (b.e.closest('.tabbar') && c.e.closest('.tabbar')) continue; // casillas contiguas de una sola barra
      if (b.e.matches('.save') || c.e.matches('.save')) continue; // «Guardar» va sobre su portada: un solo objeto, alto propio
      if ((b.e.matches('.c3d-flecha') && c.e.closest('.c3d-track')) || (c.e.matches('.c3d-flecha') && b.e.closest('.c3d-track'))) continue; // las flechas de vidrio del Carrusel3D flotan sobre el borde de las piezas vecinas (que solo vienen al centro)
      const dx = Math.max(0, Math.max(b.x, c.x) - Math.min(b.x + b.w, c.x + c.w)), dy = Math.max(0, Math.max(b.y, c.y) - Math.min(b.y + b.h, c.y + c.h));
      const d = Math.hypot(dx, dy); if (d < best) { best = d; who = name(c.e); }
    }
    if (best < 8) out.tight.push(name(e) + ' ↔ ' + who + ' ' + Math.round(best) + ' px');
  }
  const vw = document.documentElement.clientWidth;
  return { n: B.length, ...out, overflow: document.documentElement.scrollWidth > vw + 1,
    broken: [...document.images].filter(i => i.complete && i.naturalWidth === 0 && i.getClientRects().length).map(i => i.src.slice(-50)),
    fonts: [...new Set([...document.fonts].filter(f => f.status === 'loaded').map(f => f.family.replace(/"/g, '')))] };
})()`;

const SIZES = [[320, 640, true], [390, 844, true], [900, 800, false], [1440, 900, false]];
const report = []; const check = (area, name, ok, detail = '') => report.push({ area, name, ok: !!ok, detail });
for (const [w, h, mobile] of SIZES) {
  tag = `${w}×${h}`;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile });
  await send('Page.navigate', { url: URL_ });
  if (w === 1440) { await sleep(350); await shot('primer-cuadro.png'); const bg = await ev(`getComputedStyle(document.documentElement).backgroundColor`); check(tag, 'primer cuadro sin destello oscuro: el lienzo es el blanco del inicio', bg === 'rgb(255, 255, 255)', bg); }
  await sleep(1500);
  const H = await ev('document.documentElement.scrollHeight');
  for (let y = 0; y < H; y += h * 0.7) { await ev(`scrollTo(0, ${y})`); await sleep(60); } // pinta cada sección (content-visibility) y carga lo diferido
  await ev('scrollTo(0, 0)'); await sleep(400);
  if (w === 1440) await shot('escritorio.png'); if (w === 390) await shot('movil.png');
  const r = await ev(AUDIT);
  check(tag, `${r.n} controles: todos ≥ 44×44 px`, !r.small.length, r.small.join(' | '));
  check(tag, 'altos de la escala 44 / 48 / 56 (salvo piezas con alto propio)', !r.offScale.length, r.offScale.join(' | '));
  check(tag, '≥ 8 px entre controles vecinos', !r.tight.length, r.tight.join(' | '));
  check(tag, 'rótulos a 15 o 17 px (Subheadline y Headline)', !r.font.length, r.font.join(' | '));
  check(tag, 'sin desborde horizontal ni imágenes rotas', !r.overflow && !r.broken.length, r.broken.join(' | '));
  // La letra que se pinta de verdad (CDP): en Linux y Android es Inter (la alojada o, si el sistema la trae, la del sistema); nunca Nunito ni Archivo.
  await send('DOM.enable'); await send('CSS.enable');
  const doc = (await send('DOM.getDocument')).result.root.nodeId;
  const painted = [];
  for (const sel of ['.entry-lede', '.entry-title', '.btn--primario']) { const n = (await send('DOM.querySelector', { nodeId: doc, selector: sel })).result.nodeId; if (n) painted.push(...((await send('CSS.getPlatformFontsForNode', { nodeId: n })).result.fonts || []).map(f => f.familyName)); }
  check(tag, 'la letra pintada es Inter (sin Nunito ni Archivo)', painted.length && painted.every(f => /^Inter/.test(f)) && !r.fonts.some(f => /Nunito|Archivo/.test(f)), painted.join(', ') + ' | cargadas: ' + r.fonts.join(', '));
}
check('consola', 'sin errores de consola ni peticiones fallidas', !problems.length, problems.join(' | '));
ws.close(); chrome.kill();
for (const r of report) console.log(`${r.ok ? '✓' : '✗'} [${r.area}] ${r.name}${r.ok || !r.detail ? '' : '\n    ' + r.detail}`);
const fails = report.filter(r => !r.ok).length;
console.log(`\nCONTROLES: ${report.length - fails}/${report.length} comprobaciones`);
process.exit(fails ? 1 : 0);
