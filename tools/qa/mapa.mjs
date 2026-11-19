// Mapa de Visita con la Maps Embed API de Google (2026-11-19): sin clave sigue el SVG; con una clave de PRUEBA FALSA el iframe se monta una sola vez,
// de forma diferida, sin CLS y sin salir a la red (Playwright intercepta www.google.com y contesta una página de juguete).
// Uso: node tools/qa/mapa.mjs URL [DIR]   (Playwright como en navegacion.mjs; DIR: capturas). Sale con 1 si algo falla.
//  M1 · clave vacía (la de hoy): cero peticiones a Google, ningún iframe, el SVG visible y su atribución a OpenStreetMap; un solo mapa visible.
//  M2 · clave con mala forma: se trata como vacía (nada de Google).
//  M3 · clave de prueba bien formada: nada de Google ni iframe mientras la sección está lejos (página arriba); al acercarse se monta UN iframe con
//       título, loading="lazy", referrerpolicy y la URL de modo place (key, q, language, region); una sola petición a Google; al cargar, el SVG deja
//       de verse y queda un solo mapa visible; la caja del mapa no cambia de alto (± 1 px) ni de posición; CLS 0 durante el montaje; la CSP del sitio
//       (frame-src https://www.google.com) no registra violaciones; en 393, 820 y 1440.
//  M4 · con la clave de prueba pero Google bloqueado (sin red, un bloqueador): LÍMITE CONOCIDO, medido y documentado: el navegador dispara `load` también para la
//       página de error del iframe y no deja ver su contenido (otro origen), así que no se puede distinguir; el SVG se oculta igual. Lo que sí se
//       exige: ninguna excepción en la página, un solo mapa (la caja del iframe, no dos) y «Cómo llegar» (primaria) sigue a la vista y enlazada.
import { existsSync, mkdirSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { join } from 'node:path';

let pw = null;
for (const ruta of [process.env.PLAYWRIGHT_PATH, 'playwright', '/opt/node-tools/node_modules/playwright/index.js'].filter(Boolean)) {
  try { const m = await import(ruta.startsWith('/') ? pathToFileURL(ruta).href : ruta); pw = m.default?.chromium ? m.default : m; if (pw?.chromium) break; pw = null; } catch { /* la siguiente */ }
}
if (!pw) { console.error('mapa.mjs: no encuentro Playwright (PLAYWRIGHT_PATH=/ruta/a/playwright/index.js)'); process.exit(2); }
const CHROME = process.env.CHROME_PATH && existsSync(process.env.CHROME_PATH) ? process.env.CHROME_PATH : undefined;
const URL_ = process.argv[2] || 'http://127.0.0.1:8094/';
const DIR = process.argv[3] || null; if (DIR) mkdirSync(DIR, { recursive: true });
const sleep = ms => new Promise(r => setTimeout(r, ms));
const CLAVE_FALSA = 'AIzaSy' + 'A'.repeat(33); // 39 caracteres, la forma de una clave de Google; no existe
const PERFILES = {
  '393': { viewport: { width: 393, height: 659 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1' },
  '820': { viewport: { width: 820, height: 1180 }, deviceScaleFactor: 1 },
  '1440': { viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 }
};
const res = [];
const ok = (regla, cond, texto) => { res.push({ regla, ok: Boolean(cond), texto }); console.log(`${cond ? '✓' : '✗'} ${regla} ${texto}`); };
const PAGINA_GOOGLE = '<!doctype html><meta charset="utf-8"><title>Mapa de prueba</title><body style="margin:0;background:#cde;font:16px sans-serif">Mapa de prueba (interceptado: no es Google)</body>';

async function abrir(perfil, { clave, google = 'simulado' }) {
  const browser = await pw.chromium.launch({ headless: true, executablePath: CHROME, args: ['--no-sandbox', '--hide-scrollbars'] });
  const context = await browser.newContext({ ...PERFILES[perfil], locale: 'es-MX', timezoneId: 'America/Monterrey', colorScheme: 'light' });
  await context.addInitScript(() => { try { localStorage.setItem('iti-intro', '1'); } catch {} });
  const peticiones = [], errores = [], csp = [];
  await context.route('**/assets/data/sitio.json', route => route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ mapa: { clave, consulta: 'Librería Itinerante y Más, Mariano Matamoros Pte. 421, Centro, Monterrey' } }) }));
  await context.route(/google\.com/, async route => {
    const u = route.request().url();
    if (/\/maps\/embed\//.test(u)) { peticiones.push(u); if (google !== 'simulado') return route.abort(); await sleep(1500); return route.fulfill({ status: 200, contentType: 'text/html; charset=utf-8', body: PAGINA_GOOGLE }); } // 1.5 s de «red»: da tiempo a medir el antes
    return route.abort(); // «Cómo llegar» y demás enlaces: no se navega
  });
  await context.route(/wa\.me|instagram\.com|facebook\.com|openstreetmap\.org|lu\.ma/, route => route.abort());
  const page = await context.newPage();
  page.on('pageerror', e => errores.push(e.message));
  page.on('console', m => { if (/Content Security Policy|violat/i.test(m.text())) csp.push(m.text().slice(0, 160)); });
  await page.goto(URL_, { waitUntil: 'load' });
  await sleep(2600);
  return { browser, page, peticiones, errores, csp };
}
const estado = page => page.evaluate(() => {
  const vis = e => !!e && getComputedStyle(e).display !== 'none' && getComputedStyle(e).visibility !== 'hidden' && +getComputedStyle(e).opacity > 0 && e.getBoundingClientRect().height > 0;
  const fig = document.querySelector('.visit-map'), link = fig.querySelector('.visit-map-link'), svg = fig.querySelector('svg.mapa'), cajas = [...fig.querySelectorAll('.visit-map-embed')], ifr = [...fig.querySelectorAll('iframe')];
  const caja = cajas[0]; const r = (link && vis(link) ? link : caja)?.getBoundingClientRect(); const f = fig.getBoundingClientRect();
  return { iframes: ifr.length, cajas: cajas.length, svg: vis(svg), embed: vis(caja), visibles: [svg, caja].filter(vis).length, caja: r ? [Math.round(r.left), Math.round(r.width), Math.round(r.height)] : null, figAlto: Math.round(f.height), fig: [Math.round(f.top + scrollY), Math.round(f.left)], pie: fig.querySelector('figcaption')?.textContent.trim(), clase: fig.className,
    atributos: ifr[0] ? { title: ifr[0].title, loading: ifr[0].loading, ref: ifr[0].referrerPolicy, src: ifr[0].src } : null };
});
const verMapa = async page => { await page.evaluate(() => document.querySelector('.visit-map').scrollIntoView({ block: 'center', behavior: 'instant' })); await sleep(900); };
const irA = async page => { await page.evaluate(() => document.querySelector('#visita').scrollIntoView({ block: 'start', behavior: 'instant' })); await sleep(2200); };

// M1 · clave vacía
for (const perfil of ['393', '820', '1440']) {
  const { browser, page, peticiones, errores } = await abrir(perfil, { clave: '' });
  await irA(page);
  const e = await estado(page);
  ok('M1', peticiones.length === 0 && e.iframes === 0 && e.svg && e.visibles === 1 && /OpenStreetMap/.test(e.pie) && errores.length === 0, `${perfil}, clave vacía: ${peticiones.length} peticiones a Google, ${e.iframes} iframes, SVG visible ${e.svg}, un solo mapa (${e.visibles}), pie «${e.pie}», errores ${errores.length}`);
  if (DIR) { await verMapa(page); await page.screenshot({ path: join(DIR, `visita-${perfil}-svg.png`) }); }
  await browser.close();
}
// M2 · mala forma
{
  const { browser, page, peticiones } = await abrir('393', { clave: 'esto-no-es-una-clave' });
  await irA(page);
  const e = await estado(page);
  ok('M2', peticiones.length === 0 && e.iframes === 0 && e.svg, `clave con mala forma: ${peticiones.length} peticiones a Google, ${e.iframes} iframes, SVG ${e.svg}`);
  await browser.close();
}
// M3 · clave de prueba
for (const perfil of ['393', '820', '1440']) {
  const { browser, page, peticiones, errores, csp } = await abrir(perfil, { clave: CLAVE_FALSA });
  const lejos = await estado(page);
  ok('M3', lejos.iframes === 0 && peticiones.length === 0 && lejos.svg, `${perfil}: con la sección lejos (página arriba) no hay iframe ni peticiones a Google (${lejos.iframes} iframes, ${peticiones.length} peticiones) y el SVG se ve`);
  await page.evaluate(() => { window.__cls = 0; new PerformanceObserver(l => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: 'layout-shift', buffered: false }); });
  // Se baja hasta un poco antes de que la sección entre (el iframe se monta a 700 px de distancia) y se mide la caja antes y después de cargar.
  await page.evaluate(() => { const y = document.querySelector('.visit-map').getBoundingClientRect().top + scrollY - innerHeight - 650; scrollTo(0, y); });
  await page.waitForFunction(() => document.querySelector('.visit-map-embed'), null, { timeout: 5000 });
  const antes = await estado(page); // el iframe ya está montado y pidiendo su página (1.5 s de red simulada), todavía sin cargar
  await sleep(3000);
  const cerca = await estado(page);
  const cls = await page.evaluate(() => window.__cls);
  ok('M3', cerca.iframes === 1 && cerca.cajas === 1 && peticiones.length === 1, `${perfil}: al acercarse se monta UN iframe (${cerca.iframes}) con UNA petición a Google (${peticiones.length})`);
  const a = cerca.atributos || {};
  ok('M3', /^Mapa de Google: /.test(a.title || '') && a.loading === 'lazy' && a.ref === 'strict-origin-when-cross-origin' && a.src?.startsWith('https://www.google.com/maps/embed/v1/place?key=' + CLAVE_FALSA + '&q=Librer%C3%ADa%20Itinerante%20y%20M%C3%A1s%2C%20Mariano%20Matamoros%20Pte.%20421%2C%20Centro%2C%20Monterrey'), `${perfil}: título accesible «${a.title}», loading ${a.loading}, referrerpolicy ${a.ref}, modo place con key y q`);
  ok('M3', !cerca.svg && cerca.embed && cerca.visibles === 1 && /has-google/.test(cerca.clase) && /Google/.test(cerca.pie), `${perfil}: tras cargar, el SVG deja de verse y queda un solo mapa visible (SVG ${cerca.svg}, iframe ${cerca.embed}); pie «${cerca.pie}»`);
  ok('M3', antes.iframes === 1 && !/has-google/.test(antes.clase) && antes.svg && antes.visibles === 1, `${perfil}: antes de cargar el iframe, el SVG sigue siendo el único mapa visible`);
  ok('M3', Math.abs(cerca.caja[2] - antes.caja[2]) <= 1 && cerca.caja[0] === antes.caja[0] && cerca.caja[1] === antes.caja[1] && Math.abs(cerca.figAlto - antes.figAlto) <= 1 && cerca.fig.join() === antes.fig.join(), `${perfil}: la caja del mapa no cambia (alto ${antes.caja[2]} → ${cerca.caja[2]}, ancho ${antes.caja[1]} → ${cerca.caja[1]}; figura ${antes.figAlto} → ${cerca.figAlto})`);
  ok('M3', cls === 0, `${perfil}: CLS durante el montaje ${cls}`);
  ok('M3', csp.length === 0 && errores.length === 0, `${perfil}: sin violaciones de la CSP (${csp.length}${csp[0] ? ': ' + csp[0] : ''}) ni errores de la página (${errores.length})`);
  if (DIR) { await verMapa(page); await page.screenshot({ path: join(DIR, `visita-${perfil}-iframe.png`) }); }
  await browser.close();
}
// M4 · Google bloqueado
{
  const { browser, page, errores } = await abrir('393', { clave: CLAVE_FALSA, google: 'bloqueado' });
  await irA(page);
  const e = await estado(page);
  const cta = await page.evaluate(() => { const a = document.querySelector('.visit-actions .btn--primario'); return a && /maps\/dir\//.test(a.href) && a.getBoundingClientRect().height > 0; });
  ok('M4', e.visibles === 1 && errores.length === 0 && cta, `Google bloqueado (límite conocido, ver arriba): un solo mapa visible (${e.visibles}; SVG ${e.svg}), errores de la página ${errores.length}, «Cómo llegar» a la vista ${cta}`);
  await browser.close();
}
const fallan = res.filter(r => !r.ok).length;
console.log(`\nMAPA: ${res.length - fallan}/${res.length} comprobaciones bien. FALLAN ${fallan}`);
process.exit(fallan ? 1 : 0);
