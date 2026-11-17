// La carta de Café y té (#cafe) pintada en index.html desde assets/data/menu.json (2026-11-17, recomposición de Café).
// node scripts/build-carta.mjs          reescribe en index.html lo que va entre <!-- carta:inicio --> y <!-- carta:fin -->
// node scripts/build-carta.mjs --check  sale con 1 si index.html no coincide con menu.json (lo corre también npm test)
// menu.json sigue siendo la fuente: cambiar la carta es editar el JSON y correr `npm run carta`. Así la carta llega pintada en el primer
// render (sin esqueleto ni saltos; también sin JavaScript) y cafe.js solo la mejora: marca la categoría a la vista, lleva a cada grupo y
// deja el foco en su título. La validación es la misma que antes usaba cafe.js al pintar (validMenu, precioCarta, groupId).
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validMenu, precioCarta, groupId } from '../cafe.js';

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
// Fila de producto (FilaProducto): nombre, el precio justo debajo (solo si la librería lo dio) y la descripción; la foto, si la trae,
// cuadrada a la derecha con el icono de su categoría debajo (si la foto falla, cafe.js la quita y queda el icono).
function productHtml(p, cat) {
  const precio = precioCarta(p.precio);
  const txt = [`<h4 class="ct-nom">${esc(p.nombre)}</h4>`];
  if (precio) txt.push(`<p class="ct-precio" data-fuente="carta">${esc(p.unidad ? `${precio} ${p.unidad}` : precio)}</p>`);
  if (p.descripcion) txt.push(`<p class="ct-desc">${esc(p.descripcion)}</p>`);
  const cuerpo = `<div class="ct-txt">${txt.join('')}</div>`;
  if (!p.foto) return `<li class="ct-prod ct-prod--solo" data-id="${esc(p.id)}">${cuerpo}</li>`;
  const icono = cat.icono ? `<svg class="ct-ic" aria-hidden="true"><use href="#c-${esc(cat.icono)}"/></svg>` : '';
  return `<li class="ct-prod" data-id="${esc(p.id)}"><div class="ct-foto">${icono}<img src="${esc(p.foto.src)}" alt="${esc(p.foto.alt)}" loading="lazy" decoding="async"></div>${cuerpo}</li>`;
}
function groupHtml(c, ind) {
  const id = groupId(c.id);
  const out = [`${ind}<section class="ct-grupo" id="${id}" aria-labelledby="${id}-t">`, `${ind}  <h3 class="ct-grupo-tit" id="${id}-t" tabindex="-1">${esc(c.nombre)}</h3>`];
  if (typeof c.nota === 'string' && c.nota.trim()) out.push(`${ind}  <p class="ct-grupo-nota">${esc(c.nota.trim())}</p>`);
  out.push(`${ind}  <ul class="ct-rejilla">`, ...c.productos.map(p => `${ind}    ${productHtml(p, c)}`), `${ind}  </ul>`, `${ind}</section>`);
  return out;
}
/** El marcado de la carta (barra y grupos) para una carta ya leída; con sangría `ind` (la del bloque en index.html). */
export function cartaHtml(menu, ind = '        ') {
  const cats = validMenu(menu);
  if (!cats.length) return `${ind}${INICIO}\n${ind}${FIN}`;
  return [`${ind}${INICIO}`, ...navHtml(cats, ind), `${ind}<div class="ct-lista" data-ct-lista>`, ...cats.flatMap(c => groupHtml(c, `${ind}  `)), `${ind}</div>`, `${ind}${FIN}`].join('\n');
}
/** index.html con la carta de `menu` entre sus marcas. */
export function withCarta(html, menu) {
  const a = html.indexOf(INICIO), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('index.html no tiene las marcas de la carta (<!-- carta:inicio … --> y <!-- carta:fin -->)');
  const lineStart = html.lastIndexOf('\n', a) + 1;
  const ind = html.slice(lineStart, a);
  return html.slice(0, lineStart) + cartaHtml(menu, ind) + html.slice(b + FIN.length);
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const html = readFileSync(INDEX_PATH, 'utf8');
  const menu = JSON.parse(readFileSync(MENU_PATH, 'utf8'));
  const next = withCarta(html, menu);
  if (process.argv.includes('--check')) {
    if (next !== html) { console.error('La carta de index.html no coincide con assets/data/menu.json. Ejecuta "npm run carta".'); process.exit(1); }
    console.log('carta al día');
  } else {
    writeFileSync(INDEX_PATH, next);
    const cats = validMenu(menu);
    console.log(`carta pintada en index.html (${cats.length} categorías, ${cats.reduce((n, c) => n + c.productos.length, 0)} productos)`);
  }
}
