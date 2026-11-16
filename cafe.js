// Café y té (#cafe): la carta de la sala en una parrilla por categorías con su barra de categorías fija (2026-11-16; sustituye al Carrusel3D,
// variante carta, del 2026-11-13). Los datos viven en assets/data/menu.json y se editan sin tocar HTML ni JS: cada categoría es un chip de la
// barra y un grupo de la parrilla, y añadir otra (p. ej. «Para comer») es añadir un objeto a «categorias».
//   · Tarjeta de producto: foto cuadrada si el producto trae `foto` ({ src: ruta local bajo assets/img/, alt }, registrada en
//     assets/provenance.json); sin foto, el recuadro con el icono de su categoría (`icono`: taza, tetera, plato). Nombre, descripción y precio
//     solo si la librería lo dio: con `precio: null` no se imprime nada; con un número, «$NN MXN» marcado como dato de la carta
//     (data-fuente="carta"). La tarjeta no es un control: no abre nada.
//   · Barra de categorías: enlaces a cada grupo; marca el grupo a la vista (aria-current, IntersectionObserver sobre una línea bajo la barra)
//     y, al tocar, lleva al grupo (con desplazamiento suave solo si hay movimiento) y deja el foco en su título.
// Se pide en la sala: la sección cierra con «Pídelo en la barra de la sala.» y «Cómo llegar» (index.html); sin consulta por WhatsApp.
// Se carga al acercarse a la sección. Sin JavaScript, o si el JSON no llega, quedan la foto y el cierre.

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
const NS = 'http://www.w3.org/2000/svg';
const make = (tag, cls, txt) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (txt != null) n.textContent = txt;
  return n;
};
function iconNode(name) {
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ct-ic');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#c-${name}`);
  svg.append(use);
  return svg;
}
// Tarjeta de producto (TarjetaProducto): el recuadro (foto o icono de la categoría), el nombre, la descripción y, si existe, el precio.
export function productNode(p, cat) {
  const li = make('li', p.foto ? 'ct-prod' : 'ct-prod ct-prod--solo'); // sin foto (la carta impresa no las trae), tarjeta compacta de solo texto
  li.dataset.id = p.id;
  const box = make('div', 'ct-foto');
  const icon = cat.icono && document.getElementById(`c-${cat.icono}`) ? cat.icono : null; // sin icono en el sprite, el recuadro va liso
  if (icon) box.append(iconNode(icon));
  if (p.foto) {
    const img = make('img');
    img.src = p.foto.src;
    img.alt = p.foto.alt;
    img.loading = 'lazy';
    img.decoding = 'async';
    img.addEventListener('error', () => img.remove()); // si la foto falla, queda el icono de la categoría
    box.append(img);
  }
  const txt = make('div', 'ct-txt');
  txt.append(make('h4', 'ct-nom', p.nombre));
  if (p.descripcion) txt.append(make('p', 'ct-desc', p.descripcion));
  const precio = precioCarta(p.precio);
  if (precio) { const s = make('p', 'ct-precio', p.unidad ? `${precio} ${p.unidad}` : precio); s.dataset.fuente = 'carta'; txt.append(s); }
  if (p.foto) li.append(box, txt); else li.append(txt);
  return li;
}
export function groupNode(cat) {
  const sec = make('section', 'ct-grupo');
  sec.id = groupId(cat.id);
  const h = make('h3', 'ct-grupo-tit', cat.nombre);
  h.id = `${sec.id}-t`;
  h.tabIndex = -1; // recibe el foco al llegar por su chip
  sec.setAttribute('aria-labelledby', h.id);
  const ul = make('ul', 'ct-rejilla');
  ul.append(...cat.productos.map(p => productNode(p, cat)));
  sec.append(h);
  if (typeof cat.nota === 'string' && cat.nota.trim()) sec.append(make('p', 'ct-grupo-nota', cat.nota.trim()));
  sec.append(ul);
  return sec;
}
export function chipNode(cat) {
  const a = make('a', 'chip ct-chip', cat.nombre);
  a.href = `#${groupId(cat.id)}`;
  a.dataset.id = cat.id;
  return a;
}

let menuLoad;
const loadMenu = () => (menuLoad ??= fetch(MENU_URL).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch(e => { menuLoad = undefined; throw e; }));

export async function initCafe({ isMotion = () => false } = {}) {
  const root = document.querySelector('[data-cafe]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  const nav = root.querySelector('[data-ct-nav]');
  const lista = root.querySelector('[data-ct-lista]');

  let cats;
  try { cats = validMenu(await loadMenu()); } catch { cats = []; }
  if (!cats.length) { // sin carta no se promete nada: quedan la foto y el cierre
    root.dataset.state = 'vacio';
    nav.replaceChildren();
    lista.replaceChildren();
    lista.removeAttribute('aria-busy');
    delete root.dataset.ready;
    return;
  }
  const order = cats.map(c => c.id);
  nav.replaceChildren(...cats.map(chipNode));
  lista.replaceChildren(...cats.map(groupNode));
  lista.removeAttribute('aria-busy');
  const chipOf = id => nav.querySelector(`.ct-chip[data-id="${id}"]`);
  const groupOf = id => document.getElementById(groupId(id));

  // El grupo a la vista: su chip lleva aria-current (y el color primario). Si la barra se desliza (teléfono con muchas categorías), el chip
  // actual se trae al centro de la barra solo si no se ve entero.
  let current = null;
  function mark(id) {
    if (!id || id === current) return;
    current = id;
    for (const chip of nav.querySelectorAll('.ct-chip')) { if (chip.dataset.id === id) chip.setAttribute('aria-current', 'true'); else chip.removeAttribute('aria-current'); }
    const chip = chipOf(id);
    if (!chip || nav.scrollWidth <= nav.clientWidth + 1) return; // (en escritorio la lista es vertical y no se desliza)
    const nr = nav.getBoundingClientRect(), cr = chip.getBoundingClientRect();
    if (cr.left >= nr.left && cr.right <= nr.right) return; // ya se ve entero: la barra no se mueve (el relleno de los bordes no es motivo de desplazarla)
    nav.scrollTo({ left: Math.max(0, nav.scrollLeft + cr.left - nr.left - (nr.width - cr.width) / 2), behavior: isMotion() ? 'smooth' : 'auto' });
  }
  mark(order[0]);

  // Scroll-spy: una línea horizontal justo bajo la barra (donde aterriza el título de un grupo, más 8 px). El observador avisa cada vez que
  // un grupo empieza o deja de cruzarla (no hay trabajo por cada evento de scroll) y entonces el actual es el último grupo cuyo borde superior
  // ya la pasó. `pending` es el grupo al que se va tras tocar su chip: hasta que llega, los que pasan por la línea en el camino no se marcan.
  // Un salto (la barra de navegación, un enlace, el final de la página) puede llegar a la carta sin que ningún grupo cruce la línea —todos
  // estaban arriba o abajo y siguen fuera de ella—: por eso un segundo observador, sobre la ventana, vuelve a calcular cuando la carta entra a
  // la vista (2026-11-16: llegando desde abajo el chip quedaba en «Salado» y, desde arriba tras recorrerla, también).
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
  watch();
  if ('IntersectionObserver' in window) new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) sync(); }).observe(root);
  let raf = 0, lastH = innerHeight, lastW = innerWidth;
  addEventListener('resize', () => { // otra ventana (giro del teléfono, barra de Safari): la línea se vuelve a calcular, una vez por fotograma
    if (raf || (innerHeight === lastH && innerWidth === lastW)) return;
    raf = requestAnimationFrame(() => { raf = 0; lastH = innerHeight; lastW = innerWidth; watch(); });
  });
  for (const type of ['wheel', 'touchstart', 'keydown']) addEventListener(type, () => { pending = null; }, { passive: true }); // la persona toma el control del desplazamiento

  // Tocar un chip: se marca al instante (la respuesta no espera al desplazamiento), la página va al grupo —el título queda bajo la barra,
  // scroll-margin-top en el CSS— y el foco pasa a su título. No cambia la dirección: «atrás» no recorre los chips.
  nav.addEventListener('click', e => {
    const chip = e.target.closest('.ct-chip');
    if (!chip) return;
    e.preventDefault();
    const group = groupOf(chip.dataset.id);
    if (!group) return;
    pending = chip.dataset.id;
    mark(chip.dataset.id);
    group.scrollIntoView({ behavior: isMotion() ? 'smooth' : 'auto', block: 'start' });
    group.querySelector('.ct-grupo-tit')?.focus({ preventScroll: true });
  });
  root.classList.add('is-ready');
}
