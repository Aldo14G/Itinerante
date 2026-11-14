// Carrusel3D: un solo motor para los tres carruseles del sitio (2026-11-13). Variantes: «portada» (libros del Catálogo, rail.js),
// «evento» (Eventos y talleres, feed.js) y «carta» (Café y té, cafe.js). Lo mismo para las tres:
//   · desplazamiento nativo con imán al centro (scroll-snap en CSS); una pose por fotograma según la distancia al centro (giro hasta
//     --giro-carrusel, profundidad y empuje hacia fuera: las vecinas asoman separadas de la central, con hueco, sin encimarse);
//     solo la central lleva sombra-portada (CSS: .is-centro);
//   · flechas de vidrio de 48 a los lados con puntero fino (con toque no se muestran: el control es deslizar o tocar la vecina); una sola
//     parada de tabulador (la pieza central), con ← → Inicio Fin;
//   · tocar una vecina la trae al centro; tocar la central la abre (onOpen, si la variante tiene qué abrir);
//   · sin autoplay; con «reducir movimiento» o «Pausar el movimiento», plano: la misma geometría sin giro (las vecinas en el sitio de su
//     silueta girada, con su imagen atenuada; el texto no pierde contraste);
//   · profundidad (A5): con puntero fino y hover, la pieza central se inclina hacia el cursor (hasta --inclinacion-max) y se adelanta
//     --adelanto-profundidad; al soltar vuelve con el resorte. Una sola escritura por fotograma.
// Solo depende de motion.js (duraciones de los tokens). Las funciones puras (coverflowPose, nearestIndex, tiltPose…) se prueban en tests/site.test.mjs.

import { DUR } from './motion.js';

// ---------- Parte pura ----------
// La pieza del centro va de frente; cada vecina gira hacia el centro según su distancia `d` (en anchos de pieza, con signo), se hunde y se
// empuja hacia fuera: queda separada de la central por un hueco visible (≥ 12 px en todos los tamaños; skill ux-apple §3, 2026-11-13).
// Los parámetros de la pose van en anchos de pieza y salen del CSS de cada carrusel (.c3d: --c3d-giro, --c3d-separa, --c3d-hunde,
// --c3d-separa-lejos, --c3d-hunde-lejos, --c3d-alcance); la perspectiva de la ventana es 4 anchos de pieza (--perspectiva-carrusel-piezas).
//   giro: giro de la vecina (grados) · separa: empuje hacia fuera de la vecina (d = 1) · hunde: profundidad de la vecina
//   separaLejos / hundeLejos: lo mismo por cada ancho más allá de la vecina · alcance: piezas por lado a la vista (1 o 2).
// Hasta `alcance` todo se ve entero; más allá se desvanece y a alcance + 0.5 se oculta (ni se ve ni se toca).
// `flat` (movimiento reducido o «Pausar el movimiento»): sin giro ni profundidad, con la misma geometría: cada vecina ocupa el sitio de su
// silueta girada (76 % de ancho, con medio punto de holgura hacia dentro y hacia fuera; la lejana, 70 %) y se atenúa su imagen.
export const CF_GIRO = 44;
export const POSE = { giro: CF_GIRO, separa: 0.08, hunde: 0.6, separaLejos: 0.24, hundeLejos: 1.2, alcance: 1 };
export const ATENUADA = 0.6; // opacidad de la imagen de una vecina en el carrusel plano (style.css: .c3d-item.is-atenuada img)
const fade = (ac, alcance) => (ac <= alcance ? 1 : +Math.max(0, 1 - (ac - alcance) / 0.5).toFixed(3));
export function coverflowPose(d, { flat = false, w = 1, ...o } = {}) {
  const k = { ...POSE, ...o };
  const raw = Number(d) || 0;
  const c = Math.abs(raw) < 0.02 ? 0 : Math.max(-3, Math.min(3, raw)); // el imán deja la del centro a medio píxel: va de frente, sin encogerse
  const ac = Math.abs(c), s = c < 0 ? -1 : 1, near = Math.min(ac, 1), far = Math.max(0, ac - 1);
  const zIndex = 100 - Math.round(ac * 10);
  const hidden = ac >= k.alcance + 0.5; // lo que ya no se ve no se toca ni se enfoca
  const opacity = fade(ac, k.alcance);
  if (flat) {
    const tx = s * (near * (0.825 * k.separa - 0.098) - far * 0.35) * w; // bordes de la vecina donde los de su silueta girada
    const sc = 1 - near * 0.24 - far * 0.06;
    return { transform: `translateX(${tx.toFixed(1)}px) scale(${sc.toFixed(3)})`, opacity, zIndex, hidden, dim: ac >= 0.5 };
  }
  const rot = -s * near * k.giro;
  const tx = s * (near * k.separa + far * k.separaLejos) * w;
  const tz = -(near * k.hunde + far * k.hundeLejos) * w;
  return {
    transform: `translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`,
    opacity,
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
// La palomita del chip (2026-11-14): un trazo SVG de verdad, para que se dibuje (stroke-dashoffset, drawCheck en motion.js) al elegir.
// Decorativa (aria-hidden): el estado lo dice aria-checked. El CSS solo la muestra en el chip elegido (y en la parada hojeada).
export function checkMark(cls = 'chip-chk') {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', cls);
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const path = document.createElementNS(NS, 'path');
  path.setAttribute('d', 'm5.5 12.5 4.3 4.3 8.7-9.3');
  path.setAttribute('pathLength', '1');
  svg.append(path);
  return svg;
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
  let el = null, px = 0.5, py = 0.5, frame = 0, entra = 0;
  // Brillo de lámina (2026-11-14; idea de Glare Card y Magic Card): la portada que se inclina lleva un gradiente radial (style.css,
  // .cover::after) centrado en el cursor. Solo se escriben --brillo-x y --brillo-y por CSSOM, en el mismo fotograma que la inclinación:
  // cambia la pintura de la portada, no el layout. Sin puntero fino o sin movimiento no hay brillo (ni inclinación).
  const release = () => { if (!el) return; el.style.transform = ''; el.style.removeProperty('--brillo-x'); el.style.removeProperty('--brillo-y'); el.classList.remove('is-inclinada', 'is-entrando'); clearTimeout(entra); el = null; };
  const paint = () => {
    frame = 0;
    if (!el) return;
    el.style.transform = tiltTransform(tiltPose(px, py, max), { adelanto, perspectiva });
    el.style.setProperty('--brillo-x', `${(Math.max(0, Math.min(1, px)) * 100).toFixed(1)}%`);
    el.style.setProperty('--brillo-y', `${(Math.max(0, Math.min(1, py)) * 100).toFixed(1)}%`);
  };
  document.addEventListener('pointermove', e => {
    if (e.pointerType !== 'mouse' || !fine.matches || !root.classList.contains('motion')) { release(); return; }
    const target = e.target.closest?.('[data-inclina]');
    const ok = target && (!target.closest('.c3d-item') || target.closest('.c3d-item.is-centro'));
    if (!ok) { release(); return; }
    // Al llegar el cursor la pieza entra a su primera pose con transición (dur-rapida, .is-entrando) en lugar de saltar a ella; pasado ese
    // tiempo sigue al cursor sin retraso (idea medida en Glare Card: 300 ms de entrada y luego sin transición). Antes saltaba en un fotograma.
    if (target !== el) { release(); el = target; el.classList.add('is-inclinada', 'is-entrando'); const mine = el; entra = setTimeout(() => mine.classList.remove('is-entrando'), DUR('rapida')); }
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
  // Parámetros de la pose de este carrusel: los pone su CSS (.c3d, por variante y por ancho) y se releen al medir (cambian con el ancho).
  const host = viewport.closest('.c3d') || viewport;
  let cfg = { ...POSE };
  const readPose = () => {
    const cs = getComputedStyle(host);
    const n = (v, f) => { const x = parseFloat(cs.getPropertyValue(v)); return Number.isFinite(x) ? x : f; };
    cfg = { giro: n('--c3d-giro', POSE.giro), separa: n('--c3d-separa', POSE.separa), hunde: n('--c3d-hunde', POSE.hunde), separaLejos: n('--c3d-separa-lejos', POSE.separaLejos), hundeLejos: n('--c3d-hunde-lejos', POSE.hundeLejos), alcance: n('--c3d-alcance', POSE.alcance) };
  };
  let items = [];
  let centers = [];
  let width = 1;
  let actual = -1;
  let frame = 0;
  let keep = -1; // pieza que el teclado va a enfocar: visible aunque esté lejos
  let say = -1; // una flecha o el teclado llevan una pieza al centro: se anuncia cuando llega (deslizar con el dedo no anuncia nada)
  const focusOf = it => it?.querySelector(focusSel);
  const measure = () => {
    readPose();
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
      const d = (centers[i] - mid) / width;
      const p = coverflowPose(d, { flat, w: width, ...cfg });
      const pose = it.firstElementChild;
      pose.style.transform = p.transform;
      pose.style.opacity = String(p.opacity);
      it.style.zIndex = String(p.zIndex);
      it.classList.toggle('is-atenuada', p.dim);
      it.classList.toggle('is-lejana', Math.abs(d) >= 1.5); // con dos por lado, la lejana queda medio tapada por la vecina: su texto no se muestra partido
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
