// Carrusel de libros: una sola pieza para cualquier colección del inventario; una lista curada se escribe como `ids` en
// assets/data/collections.json. Las colecciones se eligen en una fila de chips (Narrativa · Poesía · Ensayo) sobre el carrusel 3D (el
// contacto por WhatsApp vive en el pie desde el 2026-11-13). Los chips son también las paradas de un recorrido ligero (A4,
// 2026-11-13): conector entre ellas, palomita en las hojeadas y «N de 3 paradas hojeadas» junto a la nota. El carrusel es la variante
// «portada» del Carrusel3D (carousel3d.js).
import { coverLayout, coverTone, coverTones, filterBooks, sortBooks, toneOf, imageCover, priceLabel } from './catalog.js';
import { loadSample, loadCollections } from './sample.js';
import { saveButton, initSaved } from './saved.js';
import { afterPaint, confirmThen, drawCheck } from './motion.js';
import { createCarousel3D, wireRadioChips, checkChip, checkMark } from './carousel3d.js';

export const RAIL_SIZE = 12;

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
  btn.prepend(checkMark()); // la palomita (decorativa): se ve elegida u hojeada y se dibuja al elegir
  btn.type = 'button';
  btn.setAttribute('role', 'radio');
  btn.dataset.id = col.id;
  btn.setAttribute('aria-checked', 'false');
  return btn;
}

// Conector entre dos paradas del recorrido: una línea de 2 px (linea-fuerte atenuada; primario entre dos paradas hojeadas).
export function conector() {
  const s = make('span', 'rail-conector');
  s.setAttribute('aria-hidden', 'true');
  return s;
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

// ---------- Carrusel de portadas en 3D (CarruselPortadas): variante «portada» del Carrusel3D ----------
// El motor (pose por fotograma, imán al centro, flechas, teclado, toque y profundidad) vive en carousel3d.js y lo comparten Eventos y la
// carta de Café y té. Se reexporta lo puro para quien lo pedía aquí.
export { coverflowPose, nearestIndex, CF_GIRO } from './carousel3d.js';

// ---------- Recorrido ligero (A4, recuperado el 2026-11-13): los chips son las paradas ----------
// Una parada cuenta como hojeada cuando la persona la elige o mueve el carrusel en ella (la colección que se pinta sola al cargar no cuenta).
// Se guarda en este dispositivo (localStorage, sin cuenta); si el almacenamiento falla, el recorrido vive solo en la visita. No es un ranking
// ni un juego: «N de 3 paradas hojeadas» es un dato local y verdadero.
export const TRAIL_KEY = 'iti-recorrido-v2';
export function readTrail(storage = globalThis.localStorage) {
  try {
    const v = JSON.parse(storage?.getItem(TRAIL_KEY) ?? '[]');
    return new Set(Array.isArray(v) ? v.filter(x => typeof x === 'string') : []);
  } catch { return new Set(); }
}
export function writeTrail(seen, storage = globalThis.localStorage) {
  try { storage?.setItem(TRAIL_KEY, JSON.stringify([...seen])); return true; } catch { return false; }
}
// Estado del recorrido para las colecciones a la vista: cuántas van hojeadas y qué tramos unen dos paradas hojeadas.
export function trailState(cols, seen) {
  const done = cols.map(c => seen.has(c.id));
  return { count: done.filter(Boolean).length, total: cols.length, done, links: done.slice(1).map((d, i) => d && done[i]) };
}
export const trailLine = (n, total) => `${n} de ${total} paradas hojeadas`;

// Pie del carrusel: título (sin subtítulo) y «autor · precio» del libro del centro. El precio es el de la hoja de la librería.
export function captionOf(b, price = null) {
  const at = String(b?.t ?? '').indexOf(': ');
  const title = at > 0 ? b.t.slice(0, at) : String(b?.t ?? '');
  return { title, author: b?.a || '', price };
}

// Pinta el pie de un libro: el título y «autor · precio» (el precio de la hoja, que no se parte ni se corta: CSS).
function fillCaption(titleEl, metaEl, b) {
  const cap = captionOf(b, priceLabel(b.pr));
  titleEl.textContent = cap.title;
  metaEl.replaceChildren(cap.author);
  if (cap.price) { const strong = document.createElement('strong'); strong.textContent = cap.price; strong.dataset.fuente = 'hoja'; metaEl.append(cap.author ? '\u00a0· ' : '', strong); }
}

// Reserva del pie (--cf-reserva): el pie más alto de la colección a este ancho. Se miden todos de una vez en una copia oculta del pie
// (una sola maquetación); así el pie no reserva de más (el aire hasta «Preguntar por…» es de 24 en el más alto) y cambiar de libro no mueve
// lo de abajo. `pie` es .cf-pie; `books`, los libros de la colección pintada.
export function measureCaptions(pie, books) {
  if (!pie?.isConnected || !books.length) return 0;
  const probe = make('div', 'cf-medida');
  probe.setAttribute('aria-hidden', 'true');
  probe.append(...books.map(b => { const box = make('div', 'cf-texto'); const t = make('p', 'cf-titulo'), m = make('p', 'cf-meta'); fillCaption(t, m, b); box.append(t, m); return box; }));
  pie.append(probe);
  const max = Math.max(...[...probe.children].map(n => n.getBoundingClientRect().height));
  probe.remove();
  if (max > 0) pie.style.setProperty('--cf-reserva', `${Math.ceil(max)}px`);
  return max;
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
  const pie = $('.cf-pie');
  const live = $('[data-rail-live]');
  const region = $('[data-rail-c3d]');
  const progreso = $('[data-rail-progreso]');
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

  // ---------- Recorrido: los chips son las paradas, unidos por un conector ----------
  const seen = readTrail();
  // `nueva` es la parada que la persona acaba de hojear (índice): el conector que se completa con ella se llena una sola vez, desde la parada
  // que ya estaba hojeada hacia la nueva (2026-11-14; idea de Animated Beam, sin bucle). Al pintar lo guardado, nada se anima.
  function paintTrail(nueva = -1) {
    const st = trailState(cols, seen);
    chipsEl.querySelectorAll('.rail-chip').forEach((c, i) => c.classList.toggle('is-hojeada', st.done[i]));
    chipsEl.querySelectorAll('.rail-conector').forEach((l, i) => {
      const was = l.classList.contains('is-hecho');
      l.classList.toggle('is-hecho', st.links[i]);
      if (!was && st.links[i] && nueva >= 0) fillLink(l, nueva === i ? 'izq' : 'der');
    });
    const line = trailLine(st.count, st.total);
    if (progreso.textContent !== line) progreso.textContent = line;
  }
  function mark(id) {
    if (!id || seen.has(id)) return;
    seen.add(id);
    writeTrail(seen);
    paintTrail(cols.findIndex(c => c.id === id));
  }
  // El conector crece de la parada hojeada antes (`der`: viene de la izquierda) a la nueva; solo con movimiento (el color cambia igual).
  function fillLink(l, haciaIzq) {
    if (!isMotion()) return;
    l.classList.toggle('desde-der', haciaIzq === 'izq');
    l.classList.add('is-llena');
    l.addEventListener('animationend', () => l.classList.remove('is-llena'), { once: true });
  }

  // ---------- Carrusel3D, variante portada ----------
  let list = []; // libros de la colección pintada
  let current = null;
  const c3d = createCarousel3D({
    viewport, track, prev, next, live, isMotion, focusSel: '.card',
    onCenter: i => fillCaption(capTitle, capMeta, list[i]),
    liveText: i => { const b = list[i]; const price = priceLabel(b.pr); return `${b.t}, ${b.a}${price ? `, ${price}` : ''}. ${i + 1} de ${list.length}.`; },
    onUserMove: () => mark(current) // mover el carrusel en una parada la cuenta como hojeada
  });

  let paintId = 0; // el último cambio de colección gana si se toca otro chip antes de terminar de pintar
  // `immediate` (primera carga) pinta de una vez. Al tocar un chip, el chip confirma ya y las portadas se cambian después de pintar.
  // `announce` es verdadero solo cuando la persona eligió la colección (toque o teclado): entonces se anuncia.
  async function show(id, announce, immediate = false) {
    const col = cols.find(c => c.id === id) ?? cols[0];
    current = col.id;
    checkChip(chipsEl, col.id, '.rail-chip'); // el elegido es también el punto de tabulación del grupo
    const mine = ++paintId;
    if (!immediate) await afterPaint();
    if (mine !== paintId) return;
    list = pickBooks(books, col);
    const tones = coverTones(list);
    // Cada portada se marca para la profundidad (data-inclina): solo la del centro se inclina hacia el cursor.
    const items = list.map((b, i) => { const li = bookCard(b, tones[i]); li.querySelector('.card').dataset.inclina = ''; return li; });
    track.replaceChildren(...items);
    track.removeAttribute('aria-busy');
    region.setAttribute('aria-label', `Libros de la colección ${col.titulo}`);
    noteEl.textContent = col.nota || ''; // la nota de la colección
    c3d.setItems(items);
    measureCaptions(pie, list);
    if (announce) live.textContent = `${col.titulo}: ${list.length} libros.`; // la región viva del carrusel: la colección elegida
  }

  // Chips con un conector entre parada y parada (decorativo: el estado va en la palomita y en «N de 3 paradas hojeadas»).
  chipsEl.replaceChildren(...cols.flatMap((c, i) => (i ? [conector(), chipNode(c)] : [chipNode(c)])));
  // Elegir por toque o teclado: el chip confirma ya (aria-checked y su palomita) y el carrusel cambia después de pintar.
  wireRadioChips(chipsEl, {
    selector: '.rail-chip',
    current: () => current,
    choose: chip => {
      const nueva = chip.dataset.id !== current;
      if (nueva && !chip.classList.contains('is-hojeada')) drawCheck(chip); // la palomita se dibuja si aún no estaba (una hojeada ya la trae)
      mark(chip.dataset.id);
      if (nueva) show(chip.dataset.id, true);
    }
  });
  paintTrail();

  // Si cambia el ancho del pie (giro del teléfono, ventana), la reserva se vuelve a medir una vez por fotograma.
  if ('ResizeObserver' in window) {
    let w = 0, raf = 0;
    new ResizeObserver(([e]) => {
      const nw = Math.round(e.contentRect.width);
      if (nw === w) return;
      w = nw;
      if (!raf) raf = requestAnimationFrame(() => { raf = 0; measureCaptions(pie, list); });
    }).observe(pie);
  }

  // Tocar la portada del centro abre la ficha (wireBookOpen); las vecinas vienen al centro (carousel3d.js).
  wireBookOpen(track, ensureCatalog);

  await show(cols[0].id, false, true);
  root.classList.add('is-ready');
}
