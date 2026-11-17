// Café y té (#cafe): la carta de la sala por categorías, al modo de las apps de comida (Uber Eats, DiDi Food; 2026-11-17), con su barra de
// categorías encima. Sustituye a la parrilla de tarjetas del 2026-11-16 (y esta al Carrusel3D, variante carta, del 2026-11-13).
// Recomposición del 2026-11-17 (pedido de Aldo: «el título, la fotografía, las categorías y los productos parecen ocupar cuadrículas
// distintas»): la carta ya no se arma aquí. Llega pintada en index.html desde assets/data/menu.json (scripts/build-carta.mjs, `npm run
// carta`; `npm run carta:check` y npm test fallan si el HTML no coincide con el JSON), así se ve desde el primer render, sin esqueleto ni
// saltos, y también sin JavaScript. Este módulo solo la mejora:
//   · Barra de categorías (enlaces #carta-<id>, nombre corto con el completo en aria-label): marca el grupo a la vista (aria-current,
//     IntersectionObserver sobre una línea bajo la barra) y, al tocar, lleva al grupo (desplazamiento suave solo con movimiento) y deja el
//     foco en su título. Si los enlaces no caben en un renglón (320 px con texto ampliado, 200 %…) pasan a otro (flex-wrap, nunca
//     desplazamiento horizontal) y la barra deja de ser fija (data-envuelta): dos renglones fijos tapaban demasiado.
//   · Fila de producto con foto (ninguna hoy): si la foto falla, se quita y queda el icono de su categoría.
// La parte pura (validMenu, menuProblems, precioCarta, groupId…) la usan scripts/build-carta.mjs y las pruebas.
// Se carga al acercarse a la sección y también en reposo (app.js).

export const MENU_URL = 'assets/data/menu.json';

// ---------- Parte pura ----------
const text = v => (typeof v === 'string' ? v.trim() : '');
/** La foto de un producto: { src, alt } con una ruta local bajo assets/img/ y un texto alternativo; si no, null (la tarjeta va con su icono). */
export function validFoto(foto) {
  const src = text(foto?.src), alt = text(foto?.alt);
  return /^assets\/img\/[\w./-]+\.(webp|jpe?g|png|avif)$/.test(src) && !src.includes('..') && alt ? { src, alt } : null;
}
// Una carta válida: categorías con id, nombre y al menos un producto (cada uno con id y nombre; precio null o un número ≥ 0; foto solo si es válida).
export function validMenu(menu) {
  const cats = Array.isArray(menu?.categorias) ? menu.categorias : [];
  return cats
    .filter(c => c && /^[a-z0-9][a-z0-9-]*$/.test(text(c.id)) && text(c.nombre) && Array.isArray(c.productos))
    .map(c => ({ ...c, productos: c.productos
      .filter(p => p && typeof p.id === 'string' && typeof p.nombre === 'string' && (p.precio === null || p.precio === undefined || (typeof p.precio === 'number' && p.precio >= 0)))
      .map(p => ({ ...p, foto: validFoto(p.foto) })) }))
    .filter(c => c.productos.length);
}
/**
 * Revisión estricta del archivo (la corre npm test): lo que validMenu perdona al pintar, aquí se señala. Devuelve una lista de frases; vacía
 * si todo está bien. Que cada foto exista y esté registrada en assets/provenance.json lo comprueba la prueba (aquí no hay disco).
 */
export function menuProblems(menu) {
  const out = [];
  if (!Array.isArray(menu?.categorias)) return ['falta la lista «categorias»'];
  const cats = new Set();
  for (const c of menu.categorias) {
    const who = `categoría ${c?.id ?? '?'}`;
    if (!/^[a-z0-9][a-z0-9-]*$/.test(text(c?.id))) out.push(`${who}: id inválido (minúsculas, cifras y guiones)`);
    else if (cats.has(c.id)) out.push(`${who}: id repetido`);
    cats.add(c?.id);
    if (!text(c?.nombre)) out.push(`${who}: falta «nombre»`);
    if (c?.chip !== undefined && (typeof c.chip !== 'string' || !c.chip.trim() || c.chip.trim().length > 16)) out.push(`${who}: «chip» es un nombre corto de hasta 16 letras`);
    if (!Array.isArray(c?.productos) || !c.productos.length) { out.push(`${who}: sin productos`); continue; }
    const ids = new Set();
    for (const p of c.productos) {
      const quien = `${who}, producto ${p?.id ?? '?'}`;
      if (!text(p?.id)) out.push(`${quien}: falta «id»`);
      else if (ids.has(p.id)) out.push(`${quien}: id repetido`);
      ids.add(p?.id);
      if (!text(p?.nombre)) out.push(`${quien}: falta «nombre»`);
      if (!(p?.precio === null || (typeof p?.precio === 'number' && Number.isFinite(p.precio) && p.precio >= 0))) out.push(`${quien}: «precio» es null o un número ≥ 0`);
      if (p?.foto !== undefined && p.foto !== null && !validFoto(p.foto)) out.push(`${quien}: «foto» es { "src": "assets/img/…", "alt": "…" } (ruta local y texto alternativo)`);
    }
  }
  return out;
}
// Precio de un producto: solo si la librería lo dio («$45 MXN»); sin precio, nada (ni «por confirmar»).
export const precioCarta = n => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? `$${Math.round(n)} MXN` : null);
/** El id del grupo de una categoría en la página (el ancla de su chip). */
export const groupId = id => `carta-${id}`;
/**
 * Qué grupo está «a la vista»: el último cuyo borde superior ya pasó la línea bajo la barra (`tops`: el borde superior de cada grupo, en el
 * orden de la carta, en coordenadas de la ventana). Antes de llegar al primero, el primero. Devuelve su índice (−1 sin grupos).
 */
export function currentGroup(tops, line) {
  let at = tops.length ? 0 : -1;
  tops.forEach((top, i) => { if (top <= line) at = i; });
  return at;
}

// ---------- Interfaz (solo navegador) ----------
export async function initCafe({ isMotion = () => false } = {}) {
  const root = document.querySelector('[data-cafe]');
  if (!root || root.dataset.ready) return;
  const nav = root.querySelector('[data-ct-nav]');
  const tabs = nav ? [...nav.querySelectorAll('.ct-tab')] : [];
  const groupOf = id => document.getElementById(groupId(id));
  const order = tabs.map(a => a.dataset.id).filter(id => groupOf(id));
  if (!order.length) return; // sin carta pintada no hay nada que mejorar
  root.dataset.ready = '1';

  // Foto de producto que falla: queda el icono de su categoría (el recuadro ya lo trae debajo).
  for (const img of root.querySelectorAll('.ct-foto img')) {
    const quitar = () => img.remove();
    if (img.complete && !img.naturalWidth && img.getAttribute('src')) quitar(); else img.addEventListener('error', quitar, { once: true });
  }

  // El grupo a la vista: su enlace lleva aria-current (subrayado y tinta; el verde intenso queda para la acción principal).
  let current = null;
  function mark(id) {
    if (!id || id === current) return;
    current = id;
    for (const tab of tabs) { if (tab.dataset.id === id) tab.setAttribute('aria-current', 'true'); else tab.removeAttribute('aria-current'); }
  }
  mark(order[0]);

  // Scroll-spy: una línea horizontal justo bajo la barra (donde aterriza el título de un grupo, más 8 px). El observador avisa cada vez que
  // un grupo empieza o deja de cruzarla (no hay trabajo por cada evento de scroll) y entonces el actual es el último grupo cuyo borde superior
  // ya la pasó. `pending` es el grupo al que se va tras tocar su enlace: hasta que llega, los que pasan por la línea en el camino no se marcan.
  // Un salto (la barra de navegación, un enlace, el final de la página) puede llegar a la carta sin que ningún grupo cruce la línea: por eso
  // un segundo observador, sobre la ventana, vuelve a calcular cuando la carta entra a la vista (2026-11-16).
  let io = null, pending = null, groups = [], line = 0;
  function sync() {
    if (!groups.length) return;
    const now = order[currentGroup(groups.map(g => g.getBoundingClientRect().top), line)];
    if (pending) { if (now !== pending) return; pending = null; }
    mark(now);
  }
  function watch() {
    io?.disconnect();
    if (!('IntersectionObserver' in window)) return;
    groups = order.map(groupOf);
    line = Math.round((parseFloat(getComputedStyle(groups[0]).scrollMarginTop) || 0) + (parseFloat(getComputedStyle(document.documentElement).scrollPaddingTop) || 0)) + 8;
    io = new IntersectionObserver(sync, { rootMargin: `-${line}px 0px -${Math.max(0, innerHeight - line - 2)}px 0px` });
    groups.forEach(g => io.observe(g));
  }

  // ¿Cabe la barra en un renglón? Con dos o más deja de ser fija (y el título del grupo ya no se aparta de ella): se vuelve a medir cuando
  // cambia su ancho o el tamaño de la letra (ResizeObserver), y entonces también la línea del scroll-spy.
  const filas = () => new Set(tabs.map(a => Math.round(a.offsetTop))).size;
  function fit() {
    const envuelta = filas() > 1;
    if (envuelta !== nav.hasAttribute('data-envuelta')) nav.toggleAttribute('data-envuelta', envuelta);
    watch();
  }
  fit();
  if ('ResizeObserver' in window) { let raf = 0; new ResizeObserver(() => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; fit(); }); }).observe(nav); }
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) sync(); }).observe(root);
  let raf = 0, lastH = innerHeight;
  addEventListener('resize', () => { // otra ventana (giro del teléfono, barra de Safari): la línea se vuelve a calcular, una vez por fotograma
    if (raf || innerHeight === lastH) return;
    raf = requestAnimationFrame(() => { raf = 0; lastH = innerHeight; watch(); });
  });
  for (const type of ['wheel', 'touchstart', 'keydown']) addEventListener(type, () => { pending = null; }, { passive: true }); // la persona toma el control del desplazamiento

  // Tocar un enlace: se marca al instante (la respuesta no espera al desplazamiento), la página va al grupo —el título queda bajo la barra,
  // scroll-margin-top en el CSS— y el foco pasa a su título. No cambia la dirección: «atrás» no recorre las categorías.
  nav.addEventListener('click', e => {
    const tab = e.target.closest('.ct-tab');
    if (!tab) return;
    const group = groupOf(tab.dataset.id);
    if (!group) return;
    e.preventDefault();
    pending = tab.dataset.id;
    mark(tab.dataset.id);
    group.scrollIntoView({ behavior: isMotion() ? 'smooth' : 'auto', block: 'start' });
    group.querySelector('.ct-grupo-tit')?.focus({ preventScroll: true });
  });
  root.classList.add('is-ready');
}
