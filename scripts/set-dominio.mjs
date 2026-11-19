// Marca y SEO listos para el dominio (2026-11-19). El dominio de producción aún no está decidido: este script NO compra, registra ni toca nada fuera del repositorio.
//
//   node scripts/set-dominio.mjs https://dominio.mx                 escribe canonical, og:url, og:image (absoluta), twitter:card, la línea `Sitemap:` de
//                                                                     robots.txt, sitemap.xml (una sola URL, sin #secciones) y `url` e `image` del JSON-LD.
//                                                                     El sitio SIGUE con noindex,nofollow.
//   node scripts/set-dominio.mjs https://dominio.mx --indexar        además retira el noindex (solo con este indicador explícito: el día de salir a producción).
//   node scripts/set-dominio.mjs https://dominio.mx [--indexar] --check   sale con 1 si los archivos no son lo que esas opciones escribirían.
//   node scripts/set-dominio.mjs --check                              comprueba el estado actual del repositorio: SIN dominio, con noindex (lo corre `npm run dominio:check` y npm test).
//   node scripts/set-dominio.mjs --reset                              vuelve a ese estado (sin dominio, noindex, sin sitemap.xml ni línea Sitemap).
//   --root DIR  usa otra carpeta con index.html, robots.txt y sitemap.xml (las pruebas trabajan en una copia temporal).
//
// Idempotente: aplicar dos veces da lo mismo; cambiar de dominio sustituye el anterior. El dominio es solo el origen: https, un nombre con punto (sin IP, sin
// localhost, sin puerto, sin usuario, sin ruta, sin consulta ni #). Flujo completo, Cloudflare, Search Console y la ficha de Google: docs/DOMINIO.md.
import { existsSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO = join(dirname(fileURLToPath(import.meta.url)), '..');
export const INICIO = '<!-- dominio:inicio · lo escribe scripts/set-dominio.mjs (docs/DOMINIO.md): sin dominio, el sitio no se indexa -->';
export const FIN = '<!-- dominio:fin -->';
export const NOINDEX = '<meta name="robots" content="noindex,nofollow">';
export const IMAGEN = 'assets/img/compartir.jpg';
export const IMAGEN_ALT = 'La sala de la librería, con libreros, una mesa y sillas, junto al logo de Librería Itinerante y Más';

/** El origen (`https://host`) de un dominio bien formado; lanza un Error con la razón si no. */
export function origenDe(arg) {
  let u;
  try { u = new URL(String(arg)); } catch { throw new Error(`«${arg}» no es una URL: escribe el dominio completo, p. ej. https://libreria.mx`); }
  if (u.protocol !== 'https:') throw new Error('el dominio va con https://');
  if (u.username || u.password) throw new Error('el dominio no lleva usuario ni contraseña');
  if (u.port) throw new Error('el dominio no lleva puerto');
  if (u.pathname !== '/' || u.search || u.hash) throw new Error('el dominio va sin ruta, consulta ni #: solo https://dominio.mx');
  const h = u.hostname;
  if (!/^(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z]{2,}$/.test(h) || /^\d+(\.\d+){3}$/.test(h) || /(^|\.)(localhost|local|internal|test|invalid)$/.test(h)) throw new Error(`«${h}» no parece un dominio público (un nombre con punto; sin IP ni localhost)`);
  return `https://${h}`;
}

const esc = s => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;');
/** Las líneas del <head> entre las marcas, según el dominio (origen o null) y si se indexa. */
export function cabecera(origen, indexar, ind = '  ') {
  const l = [];
  if (!indexar) l.push(NOINDEX);
  if (origen) l.push(
    `<link rel="canonical" href="${origen}/">`,
    `<meta property="og:url" content="${origen}/">`,
    `<meta property="og:image" content="${origen}/${IMAGEN}">`,
    '<meta property="og:image:type" content="image/jpeg">',
    '<meta property="og:image:width" content="1200">',
    '<meta property="og:image:height" content="630">',
    `<meta property="og:image:alt" content="${esc(IMAGEN_ALT)}">`,
    '<meta name="twitter:card" content="summary_large_image">');
  return [`${ind}${INICIO}`, ...l.map(x => `${ind}${x}`), `${ind}${FIN}`].join('\n');
}

export function robotsTxt(origen) {
  return [
    '# Generado por scripts/set-dominio.mjs (docs/DOMINIO.md); no se edita a mano.',
    '# Se permite rastrear todo el sitio (menos /api/); mientras index.html lleve <meta name="robots" content="noindex,nofollow">, los buscadores lo leen y no lo indexan.',
    'User-agent: *', 'Allow: /', 'Disallow: /api/', ...(origen ? ['', `Sitemap: ${origen}/sitemap.xml`] : []), ''
  ].join('\n');
}
export const sitemapXml = origen => `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n  <url><loc>${origen}/</loc></url>\n</urlset>\n`;

// JSON-LD: `url` e `image` solo con dominio, justo tras `name`; lo demás no se toca.
export function conDominioLd(ld, origen) {
  const out = {};
  for (const [k, v] of Object.entries(ld)) {
    if (k === 'url' || k === 'image') continue;
    out[k] = v;
    if (k === 'name' && origen) { out.url = `${origen}/`; out.image = `${origen}/${IMAGEN}`; }
  }
  return out;
}
const LD = /(<script type="application\/ld\+json">)([\s\S]*?)(<\/script>)/;

/** Lo que quedaría: index.html, robots.txt y sitemap.xml (null = no existe) para un dominio (origen o null) y `indexar`. */
export function aplicar({ html }, { origen = null, indexar = false } = {}) {
  const a = html.indexOf(INICIO), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('index.html no tiene las marcas del dominio (<!-- dominio:inicio … --> y <!-- dominio:fin -->)');
  const ini = html.lastIndexOf('\n', a) + 1;
  const ind = html.slice(ini, a);
  let out = html.slice(0, ini) + cabecera(origen, indexar, ind) + html.slice(b + FIN.length);
  const m = LD.exec(out);
  if (!m) throw new Error('index.html no tiene el JSON-LD');
  out = out.replace(LD, (_, s, body, e) => `${s}${JSON.stringify(conDominioLd(JSON.parse(body), origen))}${e}`);
  return { html: out, robots: robotsTxt(origen), sitemap: origen ? sitemapXml(origen) : null };
}

export function leer(root) {
  const f = n => join(root, n);
  return { html: readFileSync(f('index.html'), 'utf8'), robots: existsSync(f('robots.txt')) ? readFileSync(f('robots.txt'), 'utf8') : null, sitemap: existsSync(f('sitemap.xml')) ? readFileSync(f('sitemap.xml'), 'utf8') : null };
}
export function escribir(root, e) {
  writeFileSync(join(root, 'index.html'), e.html);
  writeFileSync(join(root, 'robots.txt'), e.robots);
  if (e.sitemap === null) rmSync(join(root, 'sitemap.xml'), { force: true }); else writeFileSync(join(root, 'sitemap.xml'), e.sitemap);
}
/** Diferencias entre lo que hay y lo que escribirían las opciones (lista vacía = al día). */
export function diferencias(root, opts) {
  const hay = leer(root), debe = aplicar(hay, opts), d = [];
  if (hay.html !== debe.html) d.push('index.html (cabecera y JSON-LD)');
  if (hay.robots !== debe.robots) d.push('robots.txt');
  if (hay.sitemap !== debe.sitemap) d.push(debe.sitemap === null ? 'sitemap.xml (no debería existir sin dominio)' : 'sitemap.xml');
  return d;
}

function main(argv) {
  const args = argv.filter(x => !x.startsWith('--')), has = f => argv.includes(f);
  const ri = argv.indexOf('--root');
  const root = ri > -1 ? resolve(argv[ri + 1] || '') : REPO;
  if (ri > -1) args.splice(args.indexOf(argv[ri + 1]), 1);
  let origen = null;
  try {
    if (has('--reset')) { if (args.length || has('--indexar')) throw new Error('--reset no lleva dominio ni --indexar'); }
    else if (args.length) { if (args.length > 1) throw new Error('un solo dominio'); origen = origenDe(args[0]); }
    else if (!has('--check')) throw new Error('uso: node scripts/set-dominio.mjs https://dominio.mx [--indexar] [--check] [--root DIR]  |  --check  |  --reset');
    if (has('--indexar') && !origen) throw new Error('--indexar necesita el dominio: node scripts/set-dominio.mjs https://dominio.mx --indexar');
  } catch (e) { console.error(`set-dominio: ${e.message}`); return 2; }
  const opts = { origen, indexar: has('--indexar') };
  if (has('--check')) {
    const d = diferencias(root, opts);
    if (d.length) { console.error(`set-dominio: no coincide con ${origen ? `${origen}${opts.indexar ? ' (--indexar)' : ''}` : 'el estado sin dominio (con noindex)'}: ${d.join(', ')}`); return 1; }
    console.log(origen ? `dominio al día: ${origen}${opts.indexar ? ' (indexable)' : ' (con noindex)'}` : 'sin dominio, con noindex: al día');
    return 0;
  }
  escribir(root, aplicar(leer(root), opts));
  console.log(origen
    ? `dominio ${origen} escrito (canonical, og:url, og:image, twitter:card, Sitemap, sitemap.xml, JSON-LD); ${opts.indexar ? 'noindex RETIRADO: el sitio queda indexable' : 'el sitio sigue con noindex,nofollow (usa --indexar el día de salir a producción)'}.`
    : 'estado sin dominio restaurado: noindex, sin canonical ni og:url/og:image, sin sitemap.xml ni línea Sitemap.');
  return 0;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) process.exit(main(process.argv.slice(2)));
