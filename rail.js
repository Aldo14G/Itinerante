// Carrusel de libros: una sola pieza para cualquier colección del inventario; una lista curada se escribe como `ids` en
// assets/data/collections.json. Las colecciones se eligen en un recorrido de paradas (DESIGN.md, «Catálogo como recorrido»):
// cada una con su icono (`icono` en el JSON), y las que la persona ya hojeó quedan marcadas en este dispositivo.
import { coverLayout, coverTone, coverTones, filterBooks, sortBooks, toneOf, imageCover, priceLabel } from './catalog.js';
import { loadSample, loadCollections } from './sample.js';
import { saveButton, initSaved } from './saved.js';
import { afterPaint, confirmThen, pickPop } from './motion.js';

export const RAIL_SIZE = 12;

// ---------- Recorrido: parte pura (se prueba sin navegador) ----------
// Icono de la parada: el símbolo del sprite que nombra `icono`; si falta, no es un id válido o no está en el sprite, el genérico.
export const STOP_ICON = 'c-libro';
export function stopIcon(col, inSprite = () => true) {
  const id = col?.icono;
  return typeof id === 'string' && /^[a-z][a-z0-9-]*$/.test(id) && inSprite(id) ? id : STOP_ICON;
}

// Progreso: cuántas de las colecciones que hoy existen ya hojeó la persona. Un dato local y verdadero: sin metas ni recompensas.
// Lo guardado de colecciones que ya no existen no cuenta.
export function trailProgress(ids, seen) {
  const set = new Set(seen);
  const total = ids.length;
  const done = ids.filter(id => set.has(id)).length;
  const complete = total > 0 && done === total;
  const text = complete
    ? (total === 1 ? 'Ya hojeaste la colección.' : `Ya hojeaste las ${total} colecciones.`)
    : (total === 1 ? '0 de 1 parada hojeada' : `${done} de ${total} paradas hojeadas`);
  return { done, total, complete, text };
}

// Paradas hojeadas, en este dispositivo y sin cuenta. Sin almacenamiento (bloqueado o lleno) el recorrido funciona igual: dura la visita.
export const TRAIL_KEY = 'iti-recorrido-v1';
const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
export const readTrail = () => { try { const r = JSON.parse(store()?.getItem(TRAIL_KEY) || '[]'); return Array.isArray(r) ? r.filter(x => typeof x === 'string') : []; } catch { return []; } };
export const writeTrail = ids => { try { store()?.setItem(TRAIL_KEY, JSON.stringify(ids)); return true; } catch { return false; } };

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
const icon = id => {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
};

// Una parada del recorrido: el control redondo (role="radio") con su icono, el nombre colgado debajo (es su nombre accesible) y la
// insignia de «hojeada», que se muestra con la clase is-seen de la envoltura. La envoltura lleva la línea punteada hacia la siguiente.
export function stopNode(col) {
  const btn = make('button', 'rail-chip');
  btn.type = 'button';
  btn.setAttribute('role', 'radio');
  btn.dataset.id = col.id;
  btn.setAttribute('aria-checked', 'false');
  const done = make('span', 'badge rail-chip-done');
  done.setAttribute('aria-hidden', 'true');
  done.append(icon('i-check'));
  const seen = make('span', 'sr-only');
  seen.dataset.stopSeen = '';
  btn.append(icon(stopIcon(col, id => !!document.getElementById(id))), make('span', 'rail-chip-name', col.titulo), seen, done);
  const wrap = make('span', 'rail-stop');
  wrap.setAttribute('role', 'presentation');
  wrap.dataset.stop = col.id;
  wrap.append(btn);
  return wrap;
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
  const dotsEl = $('[data-rail-dots]');
  const live = $('[data-rail-live]');
  const trailBar = $('[data-rail-trail-bar]');
  const trailText = $('[data-rail-trail-text]');
  const trailAll = $('[data-rail-trail-all]');
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
    if (!cols.length) { root.hidden = true; return; } // sin datos no se promete nada: el capítulo sigue con los temas y el catálogo completo
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
    if (cap.price) { const strong = document.createElement('strong'); strong.textContent = cap.price; strong.dataset.fuente = 'hoja'; capMeta.append(cap.author ? ' · ' : '', strong); }
    [...dotsEl.children].forEach((d, k) => d.classList.toggle('is-activo', k === i));
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

  // Recorrido: una parada queda hojeada cuando la persona la elige y su carrusel se pinta. La que no eligió con un toque (la primera, o la que
  // marca un tema de «Pregúntanos») cuenta cuando ese carrusel llega a la pantalla, no al cargar.
  const seen = new Set(readTrail());
  let painted = null; // colección cuyas tarjetas están en la pista
  let inView = !('IntersectionObserver' in window);
  const paintTrail = () => {
    const p = trailProgress(cols.map(c => c.id), seen);
    chipsEl.querySelectorAll('.rail-stop').forEach(stop => {
      const on = seen.has(stop.dataset.stop);
      stop.classList.toggle('is-seen', on);
      stop.querySelector('[data-stop-seen]').textContent = on ? ', hojeada' : '';
    });
    trailBar.max = Math.max(1, p.total);
    trailBar.value = p.done;
    trailBar.setAttribute('aria-valuetext', p.text);
    trailText.textContent = p.text;
    trailAll.hidden = !p.complete;
    root.classList.toggle('is-complete', p.complete);
    return p;
  };
  const markSeen = (id, chosen = false) => {
    if (!id || seen.has(id) || !(chosen || inView)) return false;
    seen.add(id);
    writeTrail([...seen]);
    return true;
  };

  // La parada marcada queda a la vista dentro de la fila, la elija un toque, una flecha o un tema (solo se mueve la fila, nunca la página).
  const reveal = chip => {
    if (chipsEl.scrollWidth - chipsEl.clientWidth <= 0) return;
    const r = chipsEl.getBoundingClientRect(), b = chip.parentElement.getBoundingClientRect();
    if (b.left >= r.left && b.right <= r.right) return;
    chipsEl.scrollBy({ left: b.left + b.width / 2 - (r.left + r.width / 2), behavior: isMotion() ? 'smooth' : 'auto' });
  };

  let current = null;
  let paintId = 0; // el último cambio de colección gana si se toca otra parada antes de terminar de pintar
  // `immediate` (primera carga) pinta de una vez. Al tocar una parada, la parada confirma ya y las portadas se cambian después de pintar.
  // `announce` es verdadero solo cuando la persona eligió la parada (toque o teclado): se anuncia y cuenta como hojeada al pintarse.
  async function show(id, announce, immediate = false) {
    const col = cols.find(c => c.id === id) ?? cols[0];
    current = col.id;
    chipsEl.querySelectorAll('.rail-chip').forEach(c => { // la marcada es también el punto de tabulación del grupo, la elija un toque, una flecha o un tema
      const on = c.dataset.id === col.id;
      c.setAttribute('aria-checked', String(on));
      c.tabIndex = on ? 0 : -1;
      if (on) reveal(c);
    });
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
    dotsEl.replaceChildren(...list.map(() => document.createElement('span')));
    viewport.setAttribute('aria-label', `Libros de la colección ${col.titulo}`);
    noteEl.textContent = col.nota || ''; // la nota de la colección
    actual = -1;
    measure();
    go(Math.floor(list.length / 2), false); // se empieza por el libro del medio: hay vecinas a los dos lados
    paint();
    painted = col.id;
    markSeen(col.id, announce);
    const trail = paintTrail();
    if (announce) live.textContent = `${col.titulo}: ${list.length} libros. ${trail.text}${trail.complete ? '' : '.'}`; // una sola región viva: la colección y el progreso del recorrido
  }

  chipsEl.replaceChildren(...cols.map(stopNode));
  // Elegir por toque o teclado: el control confirma ya (aria-checked y rebote del icono) y el carrusel cambia después de pintar.
  const choose = chip => {
    if (chip.dataset.id === current) return;
    pickPop(chip);
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

  // Elegir un tema en «Pregúntanos» marca la colección equivalente (`tema` en collections.json): una sola taxonomía a la vista, no dos sin relación.
  // Sin colección para ese tema no pasa nada, y si la colección visible ya es de ese tema se queda como está. Sin aviso: la persona está en la consulta.
  document.addEventListener('iti:topic', e => {
    const tema = e.detail?.tema;
    const col = cols.find(c => c.tema === tema);
    if (col && cols.find(c => c.id === current)?.tema !== tema) show(col.id, false);
  });

  // La parada pintada cuenta como hojeada cuando el carrusel está a la vista (más de la mitad): la primera al llegar, no al cargar.
  if ('IntersectionObserver' in window) {
    new IntersectionObserver(entries => {
      inView = entries[entries.length - 1].isIntersecting;
      if (markSeen(painted)) paintTrail();
    }, { threshold: 0.5 }).observe(viewport);
  }

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
  paintTrail(); // lo guardado de visitas anteriores se pinta sin rebote: no hubo toque
  await show(cols[0].id, false, true);
  root.classList.add('is-ready');
}
