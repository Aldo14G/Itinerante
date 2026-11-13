// Carrusel de libros: una sola pieza para cualquier colección del inventario; una lista curada se escribe como `ids` en
// assets/data/collections.json. Las colecciones se eligen en una fila de chips (Narrativa · Poesía · Ensayo) sobre el carrusel 3D y,
// bajo él, «Preguntar por {colección}» abre WhatsApp con el mensaje listo. El recorrido de paradas (iconos, progreso «N de M paradas
// hojeadas», palomitas y su dato en localStorage) se retiró el 2026-11-13 con la crítica minimalista.
import { coverLayout, coverTone, coverTones, filterBooks, sortBooks, toneOf, imageCover, priceLabel } from './catalog.js';
import { loadSample, loadCollections } from './sample.js';
import { saveButton, initSaved } from './saved.js';
import { afterPaint, confirmThen } from './motion.js';

export const RAIL_SIZE = 12;

// ---------- Preguntar por la colección (parte pura) ----------
export const WA_NUMBER = '528180875940';
// «Preguntar por poesía»: el objeto es el nombre de la colección en minúsculas (el de la fila de chips).
const noun = col => String(col?.titulo ?? '').toLocaleLowerCase('es');
export const askLabel = col => `Preguntar por ${noun(col)}`;
export const askMessage = col => `Hola, me gustaría preguntar por libros de ${noun(col)}. ¿Qué me recomiendan?`;
export function askUrl(col) {
  const url = new URL(`https://wa.me/${WA_NUMBER}`);
  url.searchParams.set('text', askMessage(col));
  return url.href;
}

// Libros de una colección: una lista curada (`ids`, en ese orden) o un filtro sobre el catálogo, por título.
export function pickBooks(books, col, size = RAIL_SIZE) {
  if (Array.isArray(col.ids) && col.ids.length) {
    const byId = new Map(books.map(b => [b.id, b]));
    return col.ids.map(id => byId.get(id)).filter(Boolean).slice(0, size);
  }
  const f = col.filtro ?? {};
  const state = { q: '', k: new Set(f.k ?? []), g: new Set(f.g ?? []), f: new Set(f.f ?? []), p: new Set(f.p ?? []) };
  return sortBooks(filterBooks(books, state), 'az').slice(0, size);
}

const make = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
// Un chip de colección (role="radio" dentro del radiogroup): su texto es su nombre accesible; elegido, primario con la palomita (CSS).
export function chipNode(col) {
  const btn = make('button', 'chip rail-chip', col.titulo);
  btn.type = 'button';
  btn.setAttribute('role', 'radio');
  btn.dataset.id = col.id;
  btn.setAttribute('aria-checked', 'false');
  return btn;
}

// `tone` lo da la lista (coverTones: sin vecinas del mismo tono); sin él, el tono propio del libro.
export function bookCard(b, tone = coverTone(b)) {
  let cover;
  if (b.c) cover = imageCover(b, tone); // portada real; título y autor siguen dentro, ocultos a la vista
  else {
    cover = make('span', `cover cover--blank tone-${tone}`);
    cover.dataset.coverTone = tone;
    cover.dataset.coverLayout = coverLayout(b);
    // Título y autor van una sola vez, dentro de la portada; son también el nombre accesible del botón.
    cover.append(make('span', 'cover-title', b.t), make('span', 'cover-author', b.a));
  }
  const btn = make('button', 'card');
  btn.type = 'button';
  btn.dataset.id = b.id;
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.append(cover);
  const li = make('li', 'rail-item');
  li.append(btn, saveButton(b));
  return li;
}

// La ficha vive en el catálogo: se asegura que esté cargado y se le pide abrirla (carrusel y Novedades comparten esto).
export function wireBookOpen(track, ensureCatalog) {
  track.addEventListener('click', e => {
    const card = e.target.closest('.card');
    if (!card) return;
    confirmThen(card, async () => { // la tarjeta confirma el toque ya; abrir la hoja (lo caro) va después de pintar
      try { await ensureCatalog?.(); } catch { return; }
      const drawer = document.getElementById('cat-drawer');
      if (drawer) drawer.addEventListener('close', () => card.isConnected && card.focus({ preventScroll: true }), { once: true });
      document.dispatchEvent(new CustomEvent('iti:open-book', { detail: { id: card.dataset.id, tone: toneOf(card) } }));
    });
  });
}

// ---------- Carrusel de portadas en 3D (CarruselPortadas): parte pura ----------
// La portada del centro va de frente; cada vecina gira hacia el centro según su distancia `d` (en anchos de portada, con signo),
// se hunde y se encima un poco. Lo mueve el dedo (desplazamiento nativo con imán al centro): aquí solo se traduce la distancia en
// una pose, una vez por fotograma. `flat` (movimiento reducido o «Pausar el movimiento»): sin giro ni profundidad; las vecinas se
// achican al 88 %. `giro` es el giro máximo en grados (token --giro-carrusel). Hasta dos portadas del centro todo se ve entero (el texto de
// una portada conserva su contraste); más allá se desvanece y a 2.6 se oculta.
export const CF_GIRO = 52;
const fade = ac => (ac <= 2 ? 1 : +Math.max(0, 1 - (ac - 2) / 0.6).toFixed(3));
export function coverflowPose(d, { flat = false, giro = CF_GIRO, w = 1 } = {}) {
  const raw = Number(d) || 0;
  const c = Math.abs(raw) < 0.02 ? 0 : Math.max(-3, Math.min(3, raw)); // el imán deja la del centro a medio píxel: va de frente, sin encogerse
  const ac = Math.abs(c), s = c < 0 ? -1 : 1, near = Math.min(ac, 1), far = Math.max(0, ac - 1);
  const zIndex = 100 - Math.round(ac * 10);
  const hidden = ac >= 2.6; // lo que ya no se ve no se toca ni se enfoca
  if (flat) return { transform: `scale(${(1 - near * 0.12).toFixed(3)})`, opacity: fade(ac), zIndex, hidden };
  const rot = -s * near * giro;
  const tx = -s * (near * 0.28 + far * 0.42) * w;
  const tz = -(near * 0.8 + far * 0.4) * w;
  return {
    transform: `translateX(${tx.toFixed(1)}px) translateZ(${tz.toFixed(1)}px) rotateY(${rot.toFixed(2)}deg)`,
    opacity: fade(ac),
    zIndex,
    hidden
  };
}
// La portada que queda al centro: la de menor distancia. `centers` son los centros de cada portada en la pista; `mid`, el centro de la ventana.
export function nearestIndex(centers, mid) {
  let best = 0, dist = Infinity;
  centers.forEach((x, i) => { const dd = Math.abs(x - mid); if (dd < dist) { dist = dd; best = i; } });
  return best;
}
// Pie del carrusel: título (sin subtítulo) y «autor · precio» del libro del centro. El precio es el de la hoja de la librería.
export function captionOf(b, price = null) {
  const at = String(b?.t ?? '').indexOf(': ');
  const title = at > 0 ? b.t.slice(0, at) : String(b?.t ?? '');
  return { title, author: b?.a || '', price };
}

export async function initRail({ ensureCatalog, isMotion = () => false } = {}) {
  const root = document.querySelector('[data-rail]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  initSaved();
  const $ = s => root.querySelector(s);
  const track = $('[data-rail-track]');
  const viewport = $('[data-rail-viewport]');
  const chipsEl = $('[data-rail-chips]');
  const noteEl = $('[data-rail-note]');
  const prev = $('[data-rail-prev]');
  const next = $('[data-rail-next]');
  const capTitle = $('[data-rail-title]');
  const capMeta = $('[data-rail-meta]');
  const live = $('[data-rail-live]');
  const ask = $('[data-rail-ask]');
  const askLabelEl = $('[data-rail-ask-label]');
  const status = $('[data-rail-status]');
  const errBox = $('[data-rail-error]');

  let books, cols;
  try {
    const [sample, collections] = await Promise.all([
      loadSample(),
      loadCollections()
    ]);
    books = sample.books;
    cols = collections.collections.filter(c => pickBooks(books, c).length);
    if (!cols.length) { root.hidden = true; return; } // sin datos no se promete nada: el capítulo sigue con la búsqueda y el catálogo completo
  } catch {
    // Error de red (A03): el carrusel no desaparece en silencio. Línea de estado y salida: reintentar o preguntar por WhatsApp.
    delete root.dataset.ready;
    root.dataset.state = 'error';
    chipsEl.replaceChildren();
    track.replaceChildren();
    track.removeAttribute('aria-busy');
    status.textContent = 'No pudimos cargar los libros.';
    errBox.hidden = false;
    if (!errBox.dataset.wired) {
      errBox.dataset.wired = '1';
      errBox.querySelector('[data-rail-retry]').addEventListener('click', () => { // el catálogo se vuelve a pedir (sample.js olvida la promesa fallida)
        errBox.hidden = true;
        delete root.dataset.state;
        status.textContent = 'Cargando el catálogo…';
        track.setAttribute('aria-busy', 'true');
        initRail({ ensureCatalog, isMotion });
      });
    }
    return;
  }
  status.textContent = '';
  errBox.hidden = true;

  // ---------- Coverflow: pose por fotograma, a partir del desplazamiento ----------
  const giro = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--giro-carrusel')) || CF_GIRO;
  let list = []; // libros de la colección pintada
  let items = []; // sus <li>
  let centers = []; // centro de cada portada en la pista (no cambia con las transformaciones: se mide al pintar y al cambiar el ancho)
  let width = 1;
  let actual = -1;
  let frame = 0;
  let keep = -1; // portada que el teclado va a enfocar: visible aunque esté lejos
  let say = -1; // una flecha o el teclado llevan un libro al centro: se anuncia cuando llega (deslizar con el dedo no anuncia nada)
  const measure = () => {
    width = items[0]?.offsetWidth || 1;
    centers = items.map(it => it.offsetLeft + it.offsetWidth / 2);
  };
  function center(i) {
    if (items[actual]) items[actual].classList.remove('is-centro');
    actual = i;
    const it = items[i];
    it.classList.add('is-centro');
    items.forEach((n, k) => { n.querySelector('.card').tabIndex = k === i ? 0 : -1; }); // una sola parada de tabulador: la portada del centro
    const b = list[i];
    const cap = captionOf(b, priceLabel(b.pr));
    capTitle.textContent = cap.title;
    capMeta.replaceChildren(cap.author);
    if (cap.price) { const strong = document.createElement('strong'); strong.textContent = cap.price; strong.dataset.fuente = 'hoja'; capMeta.append(cap.author ? '\u00a0· ' : '', strong); } // el precio no se parte ni se corta (CSS)
    if (keep === i) keep = -1;
    if (say === i) { say = -1; live.textContent = `${b.t}, ${b.a}${cap.price ? `, ${cap.price}` : ''}. ${i + 1} de ${items.length}.`; } // la única región viva del carrusel
    prev.disabled = i <= 0;
    next.disabled = i >= items.length - 1;
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
      it.style.visibility = p.hidden && i !== keep ? 'hidden' : ''; // la portada a la que va el foco no se oculta mientras viaja (perdería el foco)
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

  let current = null;
  let paintId = 0; // el último cambio de colección gana si se toca otro chip antes de terminar de pintar
  // `immediate` (primera carga) pinta de una vez. Al tocar un chip, el chip confirma ya y las portadas se cambian después de pintar.
  // `announce` es verdadero solo cuando la persona eligió la colección (toque o teclado): entonces se anuncia.
  async function show(id, announce, immediate = false) {
    const col = cols.find(c => c.id === id) ?? cols[0];
    current = col.id;
    chipsEl.querySelectorAll('.rail-chip').forEach(c => { // el elegido es también el punto de tabulación del grupo
      const on = c.dataset.id === col.id;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
    });
    ask.href = askUrl(col); // «Preguntar por {colección}» cambia con el chip, en el mismo fotograma
    askLabelEl.textContent = askLabel(col);
    const mine = ++paintId;
    if (!immediate) await afterPaint();
    if (mine !== paintId) return;
    list = pickBooks(books, col);
    const tones = coverTones(list);
    say = -1; // el cambio de colección se anuncia una sola vez (abajo), no también el libro del centro
    // La pose (giro, profundidad, opacidad) va en una envoltura: el <li> queda sin transformar y es el blanco del imán, así el imán
    // centra la portada en su sitio real y no persigue su silueta girada.
    items = list.map((b, i) => { const li = bookCard(b, tones[i]); const pose = document.createElement('div'); pose.className = 'cf-pose'; pose.append(...li.childNodes); li.append(pose); return li; });
    track.replaceChildren(...items);
    track.removeAttribute('aria-busy');
    viewport.setAttribute('aria-label', `Libros de la colección ${col.titulo}`);
    noteEl.textContent = col.nota || ''; // la nota de la colección
    actual = -1;
    measure();
    go(Math.floor(list.length / 2), false); // se empieza por el libro del medio: hay vecinas a los dos lados
    paint();
    if (announce) live.textContent = `${col.titulo}: ${list.length} libros.`; // una sola región viva: la colección elegida
  }

  chipsEl.replaceChildren(...cols.map(chipNode));
  // Elegir por toque o teclado: el chip confirma ya (aria-checked y su palomita) y el carrusel cambia después de pintar.
  const choose = chip => {
    if (chip.dataset.id === current) return;
    show(chip.dataset.id, true);
  };
  chipsEl.addEventListener('click', e => { const c = e.target.closest('.rail-chip'); if (c) choose(c); });
  chipsEl.addEventListener('keydown', e => {
    const dir = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key];
    if (!dir) return;
    const all = [...chipsEl.querySelectorAll('.rail-chip')];
    const i = all.findIndex(c => c.dataset.id === current);
    const nextChip = all[(i + dir + all.length) % all.length];
    e.preventDefault();
    nextChip.focus({ preventScroll: true });
    choose(nextChip);
  });
  chipsEl.addEventListener('focusin', e => { // un solo punto de tabulación: la colección activa
    chipsEl.querySelectorAll('.rail-chip').forEach(c => { c.tabIndex = c === e.target ? 0 : -1; });
  });

  // Flechas, teclado y toque. Tocar una vecina la trae al centro; tocar la del centro abre la ficha (wireBookOpen).
  const step = dir => { const k = go(actual + dir); say = k === actual ? -1 : k; };
  prev.addEventListener('click', () => step(-1));
  next.addEventListener('click', () => step(1));
  viewport.addEventListener('scroll', request, { passive: true });
  track.addEventListener('click', e => {
    const item = e.target.closest('.rail-item');
    if (!item || e.target.closest('.save') || item.classList.contains('is-centro')) return;
    e.stopImmediatePropagation(); // no abre la ficha: primero viene al centro
    e.preventDefault();
    go(items.indexOf(item));
  }, true);
  track.addEventListener('keydown', e => {
    if (!e.target.closest('.card')) return;
    const to = { ArrowRight: actual + 1, ArrowLeft: actual - 1, Home: 0, End: items.length - 1 }[e.key];
    if (to === undefined) return;
    e.preventDefault();
    const k = go(to);
    say = k === actual ? -1 : k;
    const card = items[k]?.querySelector('.card');
    if (card) { keep = k; items[k].style.visibility = ''; items.forEach(n => { n.querySelector('.card').tabIndex = n === items[k] ? 0 : -1; }); card.focus({ preventScroll: true }); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(() => { if (!items.length) return; const keep = actual; measure(); go(keep, false); request(); }).observe(viewport);
  // «Pausar el movimiento» (clase motion de <html>) y «reducir movimiento» cambian la pose: plano o en 3D.
  new MutationObserver(request).observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
  matchMedia('(prefers-reduced-motion: reduce)').addEventListener?.('change', request);

  wireBookOpen(track, ensureCatalog);

  chipsEl.querySelectorAll('.rail-chip').forEach((c, i) => { c.tabIndex = i ? -1 : 0; });
  await show(cols[0].id, false, true);
  root.classList.add('is-ready');
}
