// Carrusel3D: un solo motor para los tres carruseles del sitio (2026-11-13). Variantes: «portada» (libros del Catálogo, rail.js),
// «evento» (Eventos y talleres, feed.js) y «carta» (Café y té, cafe.js). Lo mismo para las tres:
//   · desplazamiento nativo con imán al centro (scroll-snap en CSS); una pose por fotograma según la distancia al centro (giro hasta
//     --giro-carrusel, profundidad y encimado); solo la central lleva sombra-portada (CSS: .is-centro);
//   · flechas de vidrio de 48 a los lados; una sola parada de tabulador (la pieza central), con ← → Inicio Fin;
//   · tocar una vecina la trae al centro; tocar la central la abre (onOpen, si la variante tiene qué abrir);
//   · sin autoplay; con «reducir movimiento» o «Pausar el movimiento», plano (vecinas al 88 % y su imagen atenuada; el texto no pierde contraste);
//   · profundidad (A5): con puntero fino y hover, la pieza central se inclina hacia el cursor (hasta --inclinacion-max) y se adelanta
//     --adelanto-profundidad; al soltar vuelve con el resorte. Una sola escritura por fotograma.
// Sin dependencias. Las funciones puras (coverflowPose, nearestIndex, tiltPose…) se prueban en tests/site.test.mjs.

// ---------- Parte pura ----------
// La pieza del centro va de frente; cada vecina gira hacia el centro según su distancia `d` (en anchos de pieza, con signo), se hunde y se
// encima un poco. `flat` (movimiento reducido o «Pausar el movimiento»): sin giro ni profundidad; las vecinas se achican al 88 % y se atenúan.
// `giro` es el giro máximo en grados (token --giro-carrusel). Hasta dos piezas del centro todo se ve entero; más allá se desvanece y a 2.6 se oculta.
export const CF_GIRO = 52;
export const ATENUADA = 0.6; // opacidad de la imagen de una vecina en el carrusel plano (style.css: .c3d-item.is-atenuada img)
const fade = ac => (ac <= 2 ? 1 : +Math.max(0, 1 - (ac - 2) / 0.6).toFixed(3));
export function coverflowPose(d, { flat = false, giro = CF_GIRO, w = 1 } = {}) {
  const raw = Number(d) || 0;
  const c = Math.abs(raw) < 0.02 ? 0 : Math.max(-3, Math.min(3, raw)); // el imán deja la del centro a medio píxel: va de frente, sin encogerse
  const ac = Math.abs(c), s = c < 0 ? -1 : 1, near = Math.min(ac, 1), far = Math.max(0, ac - 1);
  const zIndex = 100 - Math.round(ac * 10);
  const hidden = ac >= 2.6; // lo que ya no se ve no se toca ni se enfoca
  // Plano: la vecina se achica al 88 % y se atenúa su imagen (`dim`, la foto o la portada al 60 %, CSS .is-atenuada); el texto conserva su contraste.
  if (flat) return { transform: `scale(${(1 - near * 0.12).toFixed(3)})`, opacity: fade(ac), zIndex, hidden, dim: ac >= 0.5 };
  const rot = -s * near * giro;
  const tx = -s * (near * 0.28 + far * 0.42) * w;
  const tz = -(near * 0.8 + far * 0.4) * w;
  return {
    transform: `translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`,
    opacity: fade(ac),
    zIndex,
    hidden,
    dim: false
  };
}
// La pieza que queda al centro: la de menor distancia. `centers` son los centros de cada pieza en la pista; `mid`, el centro de la ventana.
export function nearestIndex(centers, mid) {
  let best = 0, dist = Infinity;
  centers.forEach((x, i) => { const dd = Math.abs(x - mid); if (dd < dist) { dist = dd; best = i; } });
  return best;
}
// Siguiente pieza al pulsar una tecla (← → Inicio Fin) o una flecha; undefined si la tecla no mueve el carrusel.
export function keyTarget(key, actual, n) {
  const to = { ArrowRight: actual + 1, ArrowLeft: actual - 1, Home: 0, End: n - 1 }[key];
  return to === undefined ? undefined : Math.max(0, Math.min(n - 1, to));
}
// Profundidad (A5): el cursor en (px, py), proporciones de la pieza de 0 a 1. La pieza se inclina hacia él, hasta `max` grados en cada eje
// (en el borde); en el centro queda plana. rx es el giro sobre el eje X (arriba/abajo), ry sobre el eje Y (izquierda/derecha).
export function tiltPose(px, py, max = 6) {
  const k = v => Math.max(-1, Math.min(1, ((Number(v) || 0) - 0.5) * 2));
  const ry = +(k(px) * max).toFixed(2);
  const rx = +(-k(py) * max).toFixed(2);
  return { rx: rx || 0, ry: ry || 0 };
}
export const tiltTransform = ({ rx, ry }, { adelanto = 12, perspectiva = 800 } = {}) => `perspective(${perspectiva}px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(${adelanto}px)`;

// ---------- Fila de chips (radiogroup): Narrativa · Poesía · Ensayo en el Catálogo, Café · Té en la carta ----------
// Un solo punto de tabulación (el elegido), flechas para moverse y elegir. `choose(chip)` decide qué hacer; `current()` dice cuál está elegido.
export function wireRadioChips(group, { selector = '.chip', current, choose }) {
  const all = () => [...group.querySelectorAll(selector)];
  group.addEventListener('click', e => { const c = e.target.closest(selector); if (c) choose(c); });
  group.addEventListener('keydown', e => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    const list = all();
    const i = list.findIndex(c => c.dataset.id === current());
    const nextChip = list[(i + dir + list.length) % list.length];
    e.preventDefault();
    nextChip.focus({ preventScroll: true });
    choose(nextChip);
  });
  group.addEventListener('focusin', e => { all().forEach(c => { c.tabIndex = c === e.target ? 0 : -1; }); }); // un solo punto de tabulación: el elegido
  all().forEach((c, i) => { c.tabIndex = i ? -1 : 0; });
}
// Marca el chip elegido (aria-checked y su palomita en CSS) y lo deja como punto de tabulación.
export function checkChip(group, id, selector = '.chip') {
  group.querySelectorAll(selector).forEach(c => {
    const on = c.dataset.id === id;
    c.setAttribute('aria-checked', String(on));
    c.tabIndex = on ? 0 : -1;
  });
}

// ---------- Profundidad (A5) ----------
// La pieza que se inclina se marca con data-inclina (la central de cada carrusel y, en escritorio, la tarjeta de la rejilla). Solo con puntero
// fino que pasa por encima (pointer: fine y hover: hover) y con movimiento (clase motion de <html>). El transform se escribe una vez por
// fotograma; al salir se borra y CSS lo devuelve con curva-resorte.
let depthWired = false;
export function initDepth() {
  if (depthWired || typeof window === 'undefined' || !window.matchMedia) return;
  depthWired = true;
  const fine = matchMedia('(hover: hover) and (pointer: fine)');
  const root = document.documentElement;
  const css = getComputedStyle(root);
  const max = parseFloat(css.getPropertyValue('--inclinacion-max')) || 6;
  const adelanto = parseFloat(css.getPropertyValue('--adelanto-profundidad')) || 12;
  const perspectiva = parseFloat(css.getPropertyValue('--perspectiva-inclinacion')) || 800;
  let el = null, px = 0.5, py = 0.5, frame = 0;
  const release = () => { if (!el) return; el.style.transform = ''; el.classList.remove('is-inclinada'); el = null; };
  const paint = () => {
    frame = 0;
    if (!el) return;
    el.style.transform = tiltTransform(tiltPose(px, py, max), { adelanto, perspectiva });
  };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !fine.matches || !root.classList.contains('motion')) { release(); return; }
    const target = e.target.closest?.('[data-inclina]');
    const ok = target && (!target.closest('.c3d-item') || target.closest('.c3d-item.is-centro'));
    if (!ok) { release(); return; }
    if (target !== el) { release(); el = target; el.classList.add('is-inclinada'); }
    const r = el.getBoundingClientRect();
    px = (e.clientX - r.left) / r.width; py = (e.clientY - r.top) / r.height;
    if (!frame) frame = requestAnimationFrame(paint);
  }, { passive: true });
  document.addEventListener('pointerleave', release);
  document.addEventListener('scroll', release, { passive: true, capture: true });
}

// ---------- Motor ----------
// Cada pieza es un <li class="c3d-item"> de la pista; su pose va en una envoltura (.cf-pose) para que el <li> quede sin transformar y sea el
// blanco del imán. `focusSel` es lo que recibe el foco dentro de cada pieza (la parada de tabulador). `onCenter(i)` se llama cuando cambia la
// pieza central; `liveText(i)` (si hay `live`) se anuncia cuando una flecha o el teclado traen una pieza al centro; `onOpen(i, el)` corre al
// tocar la central; `onUserMove()` avisa que la persona movió el carrusel (dedo, rueda, flecha o tecla).
export function createCarousel3D({ viewport, track, prev, next, live = null, isMotion = () => false, focusSel = '.c3d-card', onCenter = () => {}, liveText = null, onOpen = null, onUserMove = () => {} }) {
  const giro = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--giro-carrusel')) || CF_GIRO;
  let items = [];
  let centers = [];
  let width = 1;
  let actual = -1;
  let frame = 0;
  let keep = -1; // pieza que el teclado va a enfocar: visible aunque esté lejos
  let say = -1; // una flecha o el teclado llevan una pieza al centro: se anuncia cuando llega (deslizar con el dedo no anuncia nada)
  const focusOf = it => it?.querySelector(focusSel);
  const measure = () => {
    width = items[0]?.offsetWidth || 1;
    centers = items.map(it => it.offsetLeft + it.offsetWidth / 2);
  };
  function center(i) {
    if (items[actual]) items[actual].classList.remove('is-centro');
    actual = i;
    items[i].classList.add('is-centro');
    items.forEach((n, k) => { const f = focusOf(n); if (f) f.tabIndex = k === i ? 0 : -1; }); // una sola parada de tabulador: la pieza del centro
    if (keep === i) keep = -1;
    onCenter(i);
    if (say === i) { say = -1; if (live && liveText) live.textContent = liveText(i); } // la única región viva del carrusel
    if (prev) prev.disabled = i <= 0;
    if (next) next.disabled = i >= items.length - 1;
  }
  function paint() {
    frame = 0;
    if (!items.length) return;
    const mid = viewport.scrollLeft + viewport.clientWidth / 2;
    const flat = !isMotion();
    items.forEach((it, i) => {
      const p = coverflowPose((centers[i] - mid) / width, { flat, giro, w: width });
      const pose = it.firstElementChild;
      pose.style.transform = p.transform;
      pose.style.opacity = String(p.opacity);
      it.style.zIndex = String(p.zIndex);
      it.classList.toggle('is-atenuada', p.dim);
      it.style.visibility = p.hidden && i !== keep ? 'hidden' : ''; // la pieza a la que va el foco no se oculta mientras viaja (perdería el foco)
    });
    const i = nearestIndex(centers, mid);
    if (i !== actual) center(i);
  }
  const request = () => { if (!frame) frame = requestAnimationFrame(paint); };
  const go = (i, smooth = true) => {
    const k = Math.max(0, Math.min(items.length - 1, i));
    if (!items[k]) return k;
    viewport.scrollTo({ left: centers[k] - viewport.clientWidth / 2, behavior: smooth && isMotion() ? 'smooth' : 'auto' });
    return k;
  };
  // La pose (giro, profundidad, opacidad) va en una envoltura: el <li> queda sin transformar y es el blanco del imán.
  const wrap = li => {
    li.classList.add('c3d-item');
    if (!li.firstElementChild?.classList.contains('cf-pose')) { const pose = document.createElement('div'); pose.className = 'cf-pose'; pose.append(...li.childNodes); li.append(pose); }
    return li;
  };
  function setItems(list, start = Math.floor(list.length / 2)) {
    items = list.map(wrap);
    if (!items[0]?.isConnected) track.replaceChildren(...items);
    actual = -1;
    measure();
    go(start, false); // se empieza por la pieza del medio: hay vecinas a los dos lados
    paint();
  }

  // Flechas, teclado y toque. Tocar una vecina la trae al centro; tocar la del centro la abre.
  const step = dir => { const k = go(actual + dir); say = k === actual ? -1 : k; onUserMove(); };
  prev?.addEventListener('click', () => step(-1));
  next?.addEventListener('click', () => step(1));
  viewport.addEventListener('scroll', request, { passive: true });
  for (const type of ['pointerdown', 'wheel']) viewport.addEventListener(type, () => onUserMove(), { passive: true });
  track.addEventListener('click', e => {
    const item = e.target.closest('.c3d-item');
    if (!item || e.target.closest('.save')) return;
    if (!item.classList.contains('is-centro')) {
      e.stopImmediatePropagation(); // no abre la pieza: primero viene al centro
      e.preventDefault();
      go(items.indexOf(item));
      onUserMove();
      return;
    }
    onOpen?.(items.indexOf(item), item, e);
  }, true);
  track.addEventListener('keydown', e => {
    if (!e.target.closest(focusSel)) return;
    const k0 = keyTarget(e.key, actual, items.length);
    if (k0 === undefined) return;
    e.preventDefault();
    const k = go(k0);
    say = k === actual ? -1 : k;
    onUserMove();
    const f = focusOf(items[k]);
    if (f) { keep = k; items[k].style.visibility = ''; items.forEach(n => { const g = focusOf(n); if (g) g.tabIndex = n === items[k] ? 0 : -1; }); f.focus({ preventScroll: true }); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (!items.length) return; const at = actual; measure(); go(at, false); request(); }).observe(viewport);
  // «Pausar el movimiento» (clase motion de <html>) y «reducir movimiento» cambian la pose: plano o en 3D.
  new MutationObserver(request).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', request);
  initDepth();

  return {
    setItems,
    go,
    request,
    get actual() { return actual; },
    get items() { return items; }
  };
}
