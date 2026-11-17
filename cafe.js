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
//   · Galería de la carta (GaleriaCarta, 2026-11-17; decisión de Aldo: fotos arriba para abrir el antojo, la lista abajo para leer y comparar
//     precios, como las apps de comida): solo existe con fotos de producto (al menos GALERIA_MIN; hasta GALERIA_MAX, en el orden de la carta
//     o en el de `galeria` de menu.json). La pinta build-carta.mjs entre la cabecera y la barra; aquí se le pone el motor del Carrusel3D
//     (carousel3d.js, que solo se pide si hay galería): pose por distancia, imán al centro, flechas con puntero fino, teclado, región viva.
//     Tocar la central lleva a la fila de ese producto en la carta (con el título del grupo bajo la barra si la fila cabe; si no, la fila),
//     deja el foco en su nombre y, con movimiento, la fila se realza un momento (menta que se desvanece en dur-lenta).
// La parte pura (validMenu, menuProblems, galeriaItems, precioCarta, groupId, filaId…) la usan scripts/build-carta.mjs y las pruebas.
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
    .filter(c => c && ID_RE.test(text(c.id)) && text(c.nombre) && Array.isArray(c.productos))
    .map(c => ({ ...c, productos: c.productos
      .filter(p => p && typeof p.id === 'string' && typeof p.nombre === 'string' && (p.precio === null || p.precio === undefined || (typeof p.precio === 'number' && p.precio >= 0)))
      .map(p => ({ ...p, foto: validFoto(p.foto) })) }))
    .filter(c => c.productos.length);
}
/** Ids de producto y de categoría: minúsculas, cifras y guiones (van en el id de su fila y de su grupo en la página). */
const ID_RE = /^[a-z0-9][a-z0-9-]*$/;
/** La galería existe desde GALERIA_MIN productos con foto (con menos no se pinta nada: ni hueco, ni encabezado) y muestra hasta GALERIA_MAX. */
export const GALERIA_MIN = 5;
export const GALERIA_MAX = 12;
/**
 * Revisión estricta del archivo (la corre npm test y `npm run carta`): lo que validMenu perdona al pintar, aquí se señala. Devuelve una lista de
 * frases; vacía si todo está bien. Sin disco aquí: quien llama puede pasar `fotoExiste(src)` y `fotoRegistrada(src)` (scripts/build-carta.mjs
 * y la prueba lo hacen) para que también se señale una foto que no está en assets/img o no está registrada como real en assets/provenance.json.
 */
export function menuProblems(menu, { fotoExiste = null, fotoRegistrada = null } = {}) {
  const out = [];
  if (!Array.isArray(menu?.categorias)) return ['falta la lista «categorias»'];
  const cats = new Set(), todos = new Map();
  for (const c of menu.categorias) {
    const who = `categoría ${c?.id ?? '?'}`;
    if (!ID_RE.test(text(c?.id))) out.push(`${who}: id inválido (minúsculas, cifras y guiones)`);
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
      else if (!ID_RE.test(p.id)) out.push(`${quien}: id inválido (minúsculas, cifras y guiones)`);
      else if (todos.has(p.id)) out.push(`${quien}: id repetido en otra categoría (${todos.get(p.id).cat})`);
      ids.add(p?.id);
      if (text(p?.id) && !todos.has(p.id)) todos.set(p.id, { cat: c?.id, foto: validFoto(p?.foto) });
      if (!text(p?.nombre)) out.push(`${quien}: falta «nombre»`);
      if (!(p?.precio === null || (typeof p?.precio === 'number' && Number.isFinite(p.precio) && p.precio >= 0))) out.push(`${quien}: «precio» es null o un número ≥ 0`);
      if (p?.foto !== undefined && p.foto !== null) {
        const f = validFoto(p.foto);
        if (!f) out.push(`${quien}: «foto» es { "src": "assets/img/…", "alt": "…" } (ruta local y texto alternativo)`);
        else {
          if (fotoExiste && !fotoExiste(f.src)) out.push(`${quien}: la foto ${f.src} no existe`);
          if (fotoRegistrada && !fotoRegistrada(f.src)) out.push(`${quien}: la foto ${f.src} no está registrada como fotografía real en assets/provenance.json`);
        }
      }
    }
  }
  // Galería curada (opcional): ids de productos con foto, sin repetir, hasta GALERIA_MAX y al menos GALERIA_MIN (con menos no se pinta).
  if (menu.galeria !== undefined) {
    if (!Array.isArray(menu.galeria)) out.push('«galeria» es una lista de ids de producto');
    else {
      const vistos = new Set();
      let validos = 0;
      for (const id of menu.galeria) {
        if (typeof id !== 'string' || !todos.has(id)) { out.push(`galeria: ${id} no es un producto de la carta`); continue; }
        if (vistos.has(id)) { out.push(`galeria: ${id} está repetido`); continue; }
        vistos.add(id);
        if (!todos.get(id).foto) { out.push(`galeria: ${id} no tiene foto`); continue; }
        validos++;
      }
      if (menu.galeria.length > GALERIA_MAX) out.push(`galeria: lleva ${menu.galeria.length} productos; se muestran hasta ${GALERIA_MAX}`);
      if (validos < GALERIA_MIN) out.push(`galeria: ${validos} productos con foto; hacen falta ${GALERIA_MIN} para que se pinte`);
    }
  }
  return out;
}
/**
 * Los productos de la galería (GaleriaCarta), ya validados: los de `galeria` (si el archivo la trae) o todos los que tienen foto, en el orden de
 * la carta; hasta GALERIA_MAX. Con menos de GALERIA_MIN, ninguno: la galería no existe. Cada uno lleva su categoría (`cat`, para el icono).
 */
export function galeriaItems(menu) {
  const conFoto = validMenu(menu).flatMap(c => c.productos.filter(p => p.foto && ID_RE.test(p.id)).map(p => ({ ...p, cat: c })));
  let lista = conFoto;
  if (Array.isArray(menu?.galeria) && menu.galeria.length) {
    const porId = new Map();
    for (const p of conFoto) if (!porId.has(p.id)) porId.set(p.id, p);
    lista = [...new Set(menu.galeria.filter(id => typeof id === 'string'))].map(id => porId.get(id)).filter(Boolean);
  }
  lista = lista.filter((p, i, a) => a.findIndex(q => q.id === p.id) === i).slice(0, GALERIA_MAX);
  return lista.length >= GALERIA_MIN ? lista : [];
}
// Precio de un producto: solo si la librería lo dio («$45 MXN»); sin precio, nada (ni «por confirmar»).
export const precioCarta = n => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? `$${Math.round(n)} MXN` : null);
/** El id del grupo de una categoría en la página (el ancla de su chip). */
export const groupId = id => `carta-${id}`;
/** El id de la fila de un producto en la página (solo la lleva la fila de un producto de la galería: el destino de su pieza). */
export const filaId = id => `producto-${id}`;
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

  // Ir a la fila de un producto (lo pide la pieza central de la galería). Si la fila cabe sobre la barra inferior con el título de su grupo
  // bajo la barra de categorías, va el grupo (se lee la categoría); si no, la fila misma bajo la barra (las dos con scroll-margin-top). Su
  // categoría se marca ya y el foco pasa al nombre del producto. Con movimiento, la fila se realza un momento al llegar (.is-realce: menta
  // que se desvanece en dur-lenta, CSS); sin movimiento el salto es inmediato y no hay realce (el foco es el segundo canal).
  function irAFila(id) {
    const fila = document.getElementById(filaId(id));
    const group = fila?.closest('.ct-grupo');
    if (!fila || !group) return;
    const gid = order.find(k => groupOf(k) === group);
    if (gid) { pending = gid; mark(gid); }
    const css = getComputedStyle(document.documentElement);
    const arriba = (parseFloat(css.scrollPaddingTop) || 0) + (parseFloat(getComputedStyle(group).scrollMarginTop) || 0);
    const tab = document.querySelector('.tabbar');
    const abajo = tab && getComputedStyle(tab).display !== 'none' ? tab.getBoundingClientRect().top : innerHeight;
    const destino = arriba + (fila.getBoundingClientRect().bottom - group.getBoundingClientRect().top) <= abajo ? group : fila;
    const nom = fila.querySelector('.ct-nom');
    if (nom) { nom.tabIndex = -1; nom.focus({ preventScroll: true }); }
    const suave = isMotion();
    const antes = scrollY;
    destino.scrollIntoView({ behavior: suave ? 'smooth' : 'auto', block: 'start' });
    if (!suave) return;
    let hecho = false;
    const realza = () => {
      if (hecho) return;
      hecho = true;
      fila.classList.add('is-realce');
      fila.addEventListener('animationend', () => fila.classList.remove('is-realce'), { once: true });
    };
    // El realce empieza cuando termina el desplazamiento (scrollend); si no hubo nada que desplazar o el navegador no avisa, ya.
    if ('onscrollend' in window) {
      addEventListener('scrollend', realza, { once: true });
      requestAnimationFrame(() => requestAnimationFrame(() => { if (Math.abs(scrollY - antes) < 1) realza(); }));
    } else realza();
  }
  const gal = root.querySelector('[data-ct-gal]');
  if (gal) initGaleria(gal, { isMotion, irAFila }).catch(() => {});
  root.classList.add('is-ready');
}

// ---------- Galería de la carta (GaleriaCarta): el motor del Carrusel3D sobre las piezas que ya pintó build-carta.mjs ----------
// Empieza por el producto del medio (el pie común ya lo trae pintado). Tocar una vecina la trae al centro; tocar la central (o Enter en ella)
// lleva a su fila en la carta. La región viva anuncia el producto que llega por una flecha o el teclado. Una foto que falla se quita y queda el
// icono de su categoría en el mismo recuadro. El pie reserva el alto del más alto de la galería a ese ancho (un nombre largo baja de renglón).
async function initGaleria(gal, { isMotion, irAFila }) {
  if (gal.dataset.ready) return;
  gal.dataset.ready = '1';
  const { createCarousel3D } = await import('./carousel3d.js');
  const $ = s => gal.querySelector(s);
  const track = $('[data-ct-gal-track]');
  const items = [...track.querySelectorAll('.ct-gal-item')];
  if (!items.length) return;
  const datos = items.map(li => ({ id: li.dataset.id, nombre: li.querySelector('.ct-gal-txt .ct-gal-nom')?.textContent ?? '', precio: li.querySelector('.ct-gal-txt .ct-gal-precio')?.textContent ?? '' }));
  const nom = $('[data-ct-gal-nom]'), precio = $('[data-ct-gal-precio]'), pie = $('.ct-gal-pie');
  for (const img of track.querySelectorAll('.ct-gal-foto img')) {
    const quitar = () => img.remove();
    if (img.complete && !img.naturalWidth && img.getAttribute('src')) quitar(); else img.addEventListener('error', quitar, { once: true });
  }
  const c3d = createCarousel3D({
    viewport: $('[data-ct-gal-viewport]'), track, prev: $('[data-ct-gal-prev]'), next: $('[data-ct-gal-next]'), live: $('[data-ct-gal-live]'), isMotion,
    focusSel: '.ct-gal-pieza',
    onCenter: i => {
      const d = datos[i];
      if (nom.textContent !== d.nombre) nom.textContent = d.nombre;
      if (precio.textContent !== d.precio) precio.textContent = d.precio;
      if (d.precio) precio.dataset.fuente = 'carta'; else precio.removeAttribute('data-fuente');
    },
    liveText: i => `${datos[i].nombre}${datos[i].precio ? `, ${datos[i].precio}` : ''}. ${i + 1} de ${datos.length}.`,
    onOpen: (i, item, e) => { e.preventDefault(); irAFila(datos[i].id); }
  });
  c3d.setItems(items);
  // Reserva del pie: el más alto de la galería a este ancho, medido de una vez en una copia oculta (sin JavaScript, cada pieza lleva el suyo).
  const reserva = () => {
    if (!pie.isConnected) return;
    const molde = pie.querySelector('.cf-texto');
    const probe = molde.cloneNode(false);
    probe.className = 'cf-medida';
    for (const d of datos) {
      const box = molde.cloneNode(true);
      box.querySelector('.ct-gal-nom').textContent = d.nombre;
      box.querySelector('.ct-gal-precio').textContent = d.precio;
      probe.append(box);
    }
    pie.append(probe);
    const max = Math.max(...[...probe.children].map(n => n.getBoundingClientRect().height));
    probe.remove();
    if (max > 0) pie.style.setProperty('--cf-reserva', `${Math.ceil(max)}px`);
  };
  reserva();
  if ('ResizeObserver' in window) {
    let w = 0, raf = 0;
    new ResizeObserver(([e]) => { const nw = Math.round(e.contentRect.width); if (nw === w) return; w = nw; if (!raf) raf = requestAnimationFrame(() => { raf = 0; reserva(); }); }).observe(pie);
  }
  gal.classList.add('is-ready');
}
