// La carta de Café y té (#cafe) pintada en index.html desde assets/data/menu.json (2026-11-17, recomposición de Café).
// node scripts/build-carta.mjs          reescribe en index.html lo que va entre <!-- carta:inicio --> y <!-- carta:fin -->
// node scripts/build-carta.mjs --check  sale con 1 si index.html no coincide con menu.json (lo corre también npm test)
// menu.json sigue siendo la fuente: cambiar la carta es editar el JSON y correr `npm run carta`. Así la carta llega pintada en el primer
// render (sin esqueleto ni saltos; también sin JavaScript) y cafe.js solo la mejora: marca la categoría a la vista, lleva a cada grupo y
// deja el foco en su título. La validación es la misma que antes usaba cafe.js al pintar (validMenu, precioCarta, groupId).
// Galería de la carta (GaleriaCarta, 2026-11-17): con al menos GALERIA_MIN productos con foto se pinta, entre la cabecera y la barra, una fila de
// piezas cuadradas (el marcado del Carrusel3D: región, ventana, pista, flechas y pie) que sin JavaScript se desliza con imán y con JavaScript
// toma el motor (cafe.js). Con menos fotos no se pinta nada. La fila de cada producto de la galería lleva su id (producto-<id>): el destino.
// Antes de escribir se revisa el archivo (menuProblems, con el disco: la foto existe y está registrada como real); si algo falla, no se pinta.
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validMenu, menuProblems, galeriaItems, precioCarta, groupId, filaId } from '../cafe.js';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const INDEX_PATH = join(root, 'index.html');
export const MENU_PATH = join(root, 'assets/data/menu.json');
export const INICIO = '<!-- carta:inicio · generada desde assets/data/menu.json con `npm run carta`; no se edita a mano -->';
export const FIN = '<!-- carta:fin -->';

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const corto = c => (typeof c.chip === 'string' && c.chip.trim() ? c.chip.trim() : c.nombre);

// Barra de categorías (BarraCategorias): un enlace por categoría, con su nombre corto y el completo como aria-label.
function navHtml(cats, ind) {
  const links = cats.map(c => {
    const label = corto(c) !== c.nombre ? ` aria-label="${esc(c.nombre)}"` : '';
    return `${ind}  <a class="ct-tab" href="#${groupId(c.id)}" data-id="${esc(c.id)}"${label}>${esc(corto(c))}</a>`;
  });
  return [`${ind}<nav class="ct-nav" aria-label="Categorías de la carta" data-ct-nav>`, ...links, `${ind}</nav>`];
}
// Atributos de una foto de producto: la ruta y, si `opts.srcset` la conoce (la variante de 600 que deja scripts/foto-carta.py), el srcset.
function imgAttrs(foto, sizes, opts, alt) {
  const set = opts.srcset ? opts.srcset(foto.src) : null;
  return `src="${esc(foto.src)}"${set ? ` srcset="${esc(set)}" sizes="${esc(sizes)}"` : ''} alt="${esc(alt)}" loading="lazy" decoding="async"`;
}
// Fila de producto (FilaProducto): nombre, el precio justo debajo (solo si la librería lo dio) y la descripción; la foto, si la trae,
// cuadrada a la derecha con el icono de su categoría debajo (si la foto falla, cafe.js la quita y queda el icono); la procedencia viaja como
// dato (data-kind="real": menuProblems exige que esté registrada como real). La fila de un producto de la galería lleva su id (el destino de su pieza).
function productHtml(p, cat, destino, opts) {
  const precio = precioCarta(p.precio);
  const txt = [`<h4 class="ct-nom">${esc(p.nombre)}</h4>`];
  if (precio) txt.push(`<p class="ct-precio" data-fuente="carta">${esc(p.unidad ? `${precio} ${p.unidad}` : precio)}</p>`);
  if (p.descripcion) txt.push(`<p class="ct-desc">${esc(p.descripcion)}</p>`);
  const cuerpo = `<div class="ct-txt">${txt.join('')}</div>`;
  const id = destino.has(p.id) ? ` id="${filaId(p.id)}"` : '';
  if (!p.foto) return `<li class="ct-prod ct-prod--solo"${id} data-id="${esc(p.id)}">${cuerpo}</li>`;
  const icono = cat.icono ? `<svg class="ct-ic" aria-hidden="true"><use href="#c-${esc(cat.icono)}"/></svg>` : '';
  return `<li class="ct-prod"${id} data-id="${esc(p.id)}"><div class="ct-foto" data-kind="real">${icono}<img ${imgAttrs(p.foto, '(min-width: 761px) 120px, 96px', opts, p.foto.alt)}></div>${cuerpo}</li>`;
}
// Galería de la carta (GaleriaCarta): el marcado del Carrusel3D (variante galería) con una pieza cuadrada por producto. Cada pieza es un enlace
// a la fila de su producto; su nombre y su precio van dentro (visibles sin JavaScript bajo cada foto; con JavaScript, el pie común bajo la
// pieza central los muestra y los de la pieza quedan como su nombre accesible). La foto es decorativa aquí (alt vacío): su texto alternativo va
// en la fila de la carta. El pie común se pinta ya con el producto del medio (el carrusel empieza por él), así no cambia al armarse.
function galeriaHtml(items, ind, opts) {
  const medio = items[Math.floor(items.length / 2)];
  const precioDe = p => precioCarta(p.precio) ? `${precioCarta(p.precio)}${p.unidad ? ` ${p.unidad}` : ''}` : '';
  const pieza = p => {
    const icono = p.cat.icono ? `<svg class="ct-ic" aria-hidden="true"><use href="#c-${esc(p.cat.icono)}"/></svg>` : '';
    const precio = precioDe(p) ? `<span class="ct-gal-precio" data-fuente="carta">${esc(precioDe(p))}</span>` : '';
    return `${ind}        <li class="ct-gal-item c3d-item" data-id="${esc(p.id)}" data-kind="real"><div class="cf-pose"><a class="ct-gal-pieza" href="#${filaId(p.id)}" data-inclina><span class="ct-gal-foto">${icono}<img ${imgAttrs(p.foto, '(min-width: 761px) 280px, 64vw', opts, '')}></span><span class="ct-gal-txt"><span class="ct-gal-nom">${esc(p.nombre)}</span>${precio}</span></a></div></li>`;
  };
  return [
    `${ind}<div class="ct-gal" data-ct-gal>`,
    `${ind}  <div class="c3d c3d--galeria" role="region" aria-roledescription="carrusel" aria-label="Fotos de la carta" data-ct-gal-c3d>`,
    `${ind}    <div class="c3d-viewport" data-ct-gal-viewport>`,
    `${ind}      <ul class="c3d-track" data-ct-gal-track>`,
    ...items.map(pieza),
    `${ind}      </ul>`,
    `${ind}    </div>`,
    `${ind}    <button class="btn btn--vidrio btn--icono c3d-flecha c3d-flecha--prev" type="button" data-ct-gal-prev disabled aria-label="Producto anterior"><svg class="ic" aria-hidden="true"><use href="#i-prev"/></svg></button>`,
    `${ind}    <button class="btn btn--vidrio btn--icono c3d-flecha c3d-flecha--next" type="button" data-ct-gal-next disabled aria-label="Producto siguiente"><svg class="ic" aria-hidden="true"><use href="#i-next"/></svg></button>`,
    `${ind}  </div>`,
    `${ind}  <div class="cf-pie ct-gal-pie" aria-hidden="true">`,
    `${ind}    <div class="cf-texto"><p class="ct-gal-nom" data-ct-gal-nom>${esc(medio.nombre)}</p><p class="ct-gal-precio" data-ct-gal-precio${precioDe(medio) ? ' data-fuente="carta"' : ''}>${esc(precioDe(medio))}</p></div>`,
    `${ind}  </div>`,
    `${ind}  <p class="sr-only" aria-live="polite" data-ct-gal-live></p>`,
    `${ind}</div>`
  ];
}
function groupHtml(c, ind, destino, opts) {
  const id = groupId(c.id);
  const out = [`${ind}<section class="ct-grupo" id="${id}" aria-labelledby="${id}-t">`, `${ind}  <h3 class="ct-grupo-tit" id="${id}-t" tabindex="-1">${esc(c.nombre)}</h3>`];
  if (typeof c.nota === 'string' && c.nota.trim()) out.push(`${ind}  <p class="ct-grupo-nota">${esc(c.nota.trim())}</p>`);
  out.push(`${ind}  <ul class="ct-rejilla">`, ...c.productos.map(p => `${ind}    ${productHtml(p, c, destino, opts)}`), `${ind}  </ul>`, `${ind}</section>`);
  return out;
}
/**
 * El marcado de la carta (galería si hay fotos, barra y grupos) para una carta ya leída; con sangría `ind` (la del bloque en index.html).
 * `opts.srcset(src)` da el srcset de una foto (o null); por omisión, ninguno (el CLI lo arma con la variante de 600 si existe en disco).
 */
export function cartaHtml(menu, ind = '        ', opts = {}) {
  const cats = validMenu(menu);
  if (!cats.length) return `${ind}${INICIO}\n${ind}${FIN}`;
  const gal = galeriaItems(menu);
  const destino = new Set(gal.map(p => p.id));
  return [`${ind}${INICIO}`, ...(gal.length ? galeriaHtml(gal, ind, opts) : []), ...navHtml(cats, ind), `${ind}<div class="ct-lista" data-ct-lista>`, ...cats.flatMap(c => groupHtml(c, `${ind}  `, destino, opts)), `${ind}</div>`, `${ind}${FIN}`].join('\n');
}
/** index.html con la carta de `menu` entre sus marcas. */
export function withCarta(html, menu, opts = {}) {
  const a = html.indexOf(INICIO), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('index.html no tiene las marcas de la carta (<!-- carta:inicio … --> y <!-- carta:fin -->)');
  const lineStart = html.lastIndexOf('\n', a) + 1;
  const ind = html.slice(lineStart, a);
  return html.slice(0, lineStart) + cartaHtml(menu, ind, opts) + html.slice(b + FIN.length);
}

// Con el disco: la variante de 600 de una foto (assets/img/carta/<id>-600.webp, la deja scripts/foto-carta.py) y la revisión de las fotos.
const enDisco = src => existsSync(join(root, src));
export const srcsetDisco = src => { const m = /^(.*)\.webp$/.exec(src); const chica = m && `${m[1]}-600.webp`; return chica && enDisco(chica) ? `${chica} 600w, ${src} 1200w` : null; };
export function problemasDisco(menu) {
  const prov = JSON.parse(readFileSync(join(root, 'assets/provenance.json'), 'utf8'));
  const reales = new Set((prov.real || []).map(f => `assets/${f.file}`));
  return menuProblems(menu, { fotoExiste: enDisco, fotoRegistrada: src => reales.has(src) });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(INDEX_PATH, 'utf8');
  const menu = JSON.parse(readFileSync(MENU_PATH, 'utf8'));
  const problemas = problemasDisco(menu);
  if (problemas.length) { console.error(`assets/data/menu.json no pasa la revisión:\n  · ${problemas.join('\n  · ')}`); process.exit(1); }
  const next = withCarta(html, menu, { srcset: srcsetDisco });
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('La carta de index.html no coincide con assets/data/menu.json. Ejecuta "npm run carta".'); process.exit(1); }
    console.log('carta al día');
  } else {
    writeFileSync(INDEX_PATH, next);
    const cats = validMenu(menu), gal = galeriaItems(menu);
    console.log(`carta pintada en index.html (${cats.length} categorías, ${cats.reduce((n, c) => n + c.productos.length, 0)} productos; ${gal.length ? `galería de ${gal.length} fotos` : 'sin galería'})`);
  }
}
