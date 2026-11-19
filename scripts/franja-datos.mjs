// Franja de editoriales del Inicio (2026-11-19, encargo de Aldo): la lógica pura de los datos, sin DOM. La usan scripts/build-editoriales.mjs (que la pinta en
// index.html), tests/contenido.test.mjs y tools/qa/franja.mjs. El runtime (movimiento, pausa) vive en franja.js; este archivo no se publica.
//
// Quiénes aparecen: las editoriales de assets/data/catalog.json (campo `p`; `editorialesDe` de catalog.js, así la franja crece sola cuando se importen más libros),
// menos las que Aldo no ha confirmado (`excluir` en assets/data/editoriales.json: hoy «Libro Objeto», que puede ser un formato y no una editorial). Un libro sin
// editorial no cuenta. Con menos de EDITORIALES_MIN (3) no se pinta nada. El sitio no dice «aliadas», «socias», «oficiales» ni «distribuidores»: no se sabe el vínculo.
//
// Logos: los de terceras marcas NO se descargan ni se copian de internet. Hoy no hay ninguno autorizado, así que cada editorial se muestra con su nombre en
// tipografía (un dato verdadero). Cuando Aldo aporte un logo con permiso de la editorial, `python3 scripts/logo-editorial.py` lo recorta, lo guarda y lo registra
// (con `--permiso` obligatorio) y la franja pinta una silueta monocroma (mask-image) en lugar del nombre. `editorialesLogosProblems` exige que el archivo exista,
// esté registrado en assets/provenance.json (`logos`) y traiga permiso explícito: sin eso, no se pinta y `npm test` falla.
import { editorialKey, editorialesDe, EDITORIALES_MIN } from '../catalog.js';

export const LOGO_DIR = 'assets/img/editoriales/';
const LOGO_RE = /^assets\/img\/editoriales\/[a-z0-9]+(-[a-z0-9]+)*\.(svg|webp)$/;
export const ALTO_LOGO = 28; // franja-logo-alto de design/tokens.json (px); solo para estimar cuántas copias llenan el ancho
export const ANCHO_LLENAR = 1280; // la ventana de la franja mide hasta 1152 (el contenedor); con margen
const HUECO = 64; // space-16: el hueco entre nombres
const PX_POR_LETRA = 9; // cota inferior del ancho de una letra de Title 3 (20 px, peso 600): se queda corta a propósito, para que sobren copias y no falten (franja.js lo verifica al medir)
export const COPIAS_MAX = 8;

const esc = s => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const texto = (v, max) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null);
const entero = v => Number.isInteger(v) && v > 0 && v < 100000;

/** El nombre de archivo de una editorial: «capitulo-siete» (minúsculas, sin acentos, guiones). */
export const slugEditorial = nombre => editorialKey(nombre).replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

/** Un logo válido de editoriales.json (`{ logo, alt, ancho, alto }`) o null. No mira el disco. */
export function validLogo(l, clave) {
  if (!l || typeof l !== 'object') return null;
  const alt = texto(l.alt, 120);
  const ok = typeof l.logo === 'string' && LOGO_RE.test(l.logo) && l.logo.startsWith(`${LOGO_DIR}${slugEditorial(clave)}.`) && entero(l.ancho) && entero(l.alto) && alt;
  return ok ? { logo: l.logo, alt, ancho: l.ancho, alto: l.alto } : null;
}

/**
 * Lee editoriales.json con tolerancia (Postel): falta el archivo, no es un objeto, o `excluir` / `logos` no traen lo esperado → se toma como vacío.
 * `excluir`: nombres de editoriales que no se muestran en la franja (cualquier grafía; se comparan por `editorialKey`). `logos`: clave normalizada → logo válido.
 */
export function leerConfig(raw) {
  const excluir = new Set();
  const logos = new Map();
  if (raw && typeof raw === 'object' && !Array.isArray(raw)) {
    if (Array.isArray(raw.excluir)) for (const n of raw.excluir) if (typeof n === 'string' && n.trim()) excluir.add(editorialKey(n));
    if (raw.logos && typeof raw.logos === 'object' && !Array.isArray(raw.logos)) {
      for (const [k, v] of Object.entries(raw.logos)) { const l = validLogo(v, k); if (l && editorialKey(k) === k) logos.set(k, l); }
    }
  }
  return { excluir, logos };
}

/**
 * Todo lo que está mal en editoriales.json (lista vacía = pasa). `opts.existe(ruta)` revisa el disco y `opts.registro(ruta)` devuelve el renglón de `logos`
 * de assets/provenance.json que registra ese archivo (o null). Un logo sin archivo, sin registro o sin `permiso` es un problema: el sitio no pinta lo que
 * no tiene permiso de la editorial.
 */
export function editorialesLogosProblems(raw, opts = {}) {
  const out = [];
  if (raw === undefined || raw === null) return out; // sin archivo: nada que revisar
  if (typeof raw !== 'object' || Array.isArray(raw)) return ['editoriales.json debe ser un objeto con `excluir` (lista de nombres) y `logos` (clave → logo)'];
  if (raw.excluir !== undefined && (!Array.isArray(raw.excluir) || raw.excluir.some(n => typeof n !== 'string' || !n.trim()))) out.push('`excluir` es una lista de nombres de editorial');
  if (raw.logos === undefined) return out;
  if (!raw.logos || typeof raw.logos !== 'object' || Array.isArray(raw.logos)) return [...out, '`logos` es un objeto (vacío mientras no haya logos autorizados)'];
  for (const [k, v] of Object.entries(raw.logos)) {
    const en = `logos["${k}"]`;
    if (editorialKey(k) !== k || !slugEditorial(k)) { out.push(`${en}: la clave va normalizada (minúsculas, sin acentos, espacios simples): «${editorialKey(k)}»`); continue; }
    if (!v || typeof v !== 'object') { out.push(`${en}: no es un objeto`); continue; }
    const l = validLogo(v, k);
    if (!l) { out.push(`${en}: logo debe ser ${LOGO_DIR}${slugEditorial(k)}.svg o .webp, con alt (hasta 120 caracteres), ancho y alto enteros`); continue; }
    if (opts.existe && !opts.existe(l.logo)) out.push(`${en}: el archivo ${l.logo} no existe`);
    const reg = opts.registro ? opts.registro(l.logo) : undefined;
    if (opts.registro && !reg) out.push(`${en}: ${l.logo} no está registrado en assets/provenance.json (logos)`);
    else if (reg && !texto(reg.permiso, 400)) out.push(`${en}: ${l.logo} se registró sin permiso explícito de la editorial (campo «permiso»)`);
  }
  return out;
}

/**
 * El plan de la franja: las editoriales del catálogo sin las excluidas, cada una con su logo si lo hay. `mostrar` = al menos EDITORIALES_MIN.
 * `books`: el arreglo `books` de catalog.json; `cfg`: lo que devuelve leerConfig.
 */
export function franjaPlan(books, cfg = leerConfig(null)) {
  const lista = editorialesDe(books).filter(e => !cfg.excluir.has(e.clave)).map(e => ({ nombre: e.nombre, clave: e.clave, titulos: e.titulos, logo: cfg.logos.get(e.clave) ?? null }));
  return { lista, mostrar: lista.length >= EDITORIALES_MIN };
}

/** Ancho estimado (px) de una vuelta de la lista: lo que mide cada elemento más el hueco que lo sigue. */
export function anchoEstimado(lista) {
  return lista.reduce((n, e) => n + (e.logo ? Math.round(ALTO_LOGO * e.logo.ancho / e.logo.alto) : e.nombre.length * PX_POR_LETRA) + HUECO, 0);
}
/** Cuántas veces se repite el conjunto en un grupo para que un solo grupo llene ANCHO_LLENAR (el bucle necesita que cada grupo cubra la ventana). */
export const copiasPorGrupo = lista => Math.min(COPIAS_MAX, Math.max(1, Math.ceil(ANCHO_LLENAR / Math.max(1, anchoEstimado(lista)))));

export const INICIO = '<!-- franja:inicio · generada desde assets/data/catalog.json y assets/data/editoriales.json con `npm run editoriales`; no se edita a mano -->';
export const FIN = '<!-- franja:fin -->';
export const ROTULO = 'Editoriales en el catálogo';
export const VER = 'Ver los libros por editorial';

function itemHtml(e, { eco = false } = {}) {
  const cuerpo = e.logo
    ? `<span class="franja-logo" data-logo="${esc(slugEditorial(e.clave))}"${eco ? '' : ` role="img" aria-label="${esc(e.logo.alt)}"`}></span>`
    : `<span class="franja-nombre">${esc(e.nombre)}</span>`;
  return eco ? `<li class="franja-item franja-eco" aria-hidden="true" inert>${cuerpo}</li>` : `<li class="franja-item">${cuerpo}</li>`;
}

/**
 * El marcado de la franja con la sangría `ind`; vacío (solo las marcas) si hay menos de EDITORIALES_MIN. El grupo A trae el conjunto real y sus copias para llenar el
 * ancho (`aria-hidden`, `inert`); el grupo B repite el grupo A entero (`aria-hidden`, `inert`) para que el bucle cierre sin salto. Sin movimiento solo se ve
 * el conjunto real, una vez. Los elementos no son enlaces: un objetivo en movimiento es inaccesible; el enlace es estático, debajo.
 */
export function franjaHtml(books, cfg, ind = '        ') {
  const plan = franjaPlan(books, cfg);
  if (!plan.mostrar) return `${ind}${INICIO}\n${ind}${FIN}`;
  const k = copiasPorGrupo(plan.lista);
  const grupoA = [...plan.lista.map(e => itemHtml(e)), ...Array.from({ length: k - 1 }, () => plan.lista.map(e => itemHtml(e, { eco: true }))).flat()];
  const grupoB = Array.from({ length: k }, () => plan.lista.map(e => itemHtml(e, { eco: true }))).flat();
  const li = (items, n) => items.map(x => `${ind}${' '.repeat(n)}${x}`).join('\n');
  return [
    `${ind}${INICIO}`,
    `${ind}<section class="franja" aria-labelledby="franja-rotulo" data-franja>`,
    `${ind}  <div class="franja-cab">`,
    `${ind}    <p class="franja-rotulo" id="franja-rotulo">${ROTULO}</p>`,
    `${ind}  </div>`,
    `${ind}  <div class="franja-escena" data-franja-escena>`,
    `${ind}    <div class="franja-ventana">`,
    `${ind}      <div class="franja-carril">`,
    `${ind}        <ul class="franja-lista" aria-labelledby="franja-rotulo">`,
    li(grupoA, 10),
    `${ind}        </ul>`,
    `${ind}        <ul class="franja-lista franja-lista--eco" aria-hidden="true" inert>`,
    li(grupoB, 10),
    `${ind}        </ul>`,
    `${ind}      </div>`,
    `${ind}    </div>`,
    `${ind}  </div>`,
    `${ind}  <a class="btn btn--plano btn--sm franja-ver" href="#editoriales"><span>${VER}</span><svg class="ic" aria-hidden="true"><use href="#i-down"/></svg></a>`,
    `${ind}</section>`,
    `${ind}${FIN}`
  ].join('\n');
}

/** index.html con la franja de `books` y `cfg` entre sus marcas. */
export function withFranja(html, books, cfg) {
  const a = html.indexOf(INICIO), b = html.indexOf(FIN);
  if (a < 0 || b < a) throw new Error('index.html no tiene las marcas de la franja (<!-- franja:inicio … --> y <!-- franja:fin -->)');
  const lineStart = html.lastIndexOf('\n', a) + 1;
  const ind = html.slice(lineStart, a);
  return html.slice(0, lineStart) + franjaHtml(books, cfg, ind) + html.slice(b + FIN.length);
}

// --- CSS de los logos (solo existe con logos): la CSP no permite `style` en línea, así que la URL de cada máscara vive en style.css entre estas marcas.
export const CSS_INICIO = '/* franja-logos:inicio · generado por `npm run editoriales` desde assets/data/editoriales.json; no se edita a mano */';
export const CSS_FIN = '/* franja-logos:fin */';
/** Las reglas de los logos de la franja (una por logo; vacío sin logos). Cada logo es una silueta: `mask-image` con el color del texto. */
export function logosCss(books, cfg) {
  const plan = franjaPlan(books, cfg);
  if (!plan.mostrar) return '';
  return plan.lista.filter(e => e.logo).map(e => {
    const url = `url("${e.logo.logo}")`;
    return `.franja-logo[data-logo="${slugEditorial(e.clave)}"] { aspect-ratio: ${e.logo.ancho} / ${e.logo.alto}; -webkit-mask-image: ${url}; mask-image: ${url}; }`;
  }).join('\n');
}
/** style.css con las reglas de los logos entre sus marcas. */
export function withLogosCss(css, books, cfg) {
  const a = css.indexOf(CSS_INICIO), b = css.indexOf(CSS_FIN);
  if (a < 0 || b < a) throw new Error('style.css no tiene las marcas de los logos de la franja (/* franja-logos:inicio … */ y /* franja-logos:fin */)');
  const reglas = logosCss(books, cfg);
  return css.slice(0, a) + CSS_INICIO + '\n' + (reglas ? reglas + '\n' : '') + css.slice(b);
}
