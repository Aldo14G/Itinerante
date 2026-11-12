// Carrusel de libros: una sola pieza para cualquier colección del inventario; una lista curada se escribe como `ids` en
// assets/data/collections.json. Las colecciones se eligen en un recorrido de paradas (DESIGN.md, «Catálogo como recorrido»):
// cada una con su icono (`icono` en el JSON), y las que la persona ya hojeó quedan marcadas en este dispositivo.
import { coverLayout, coverTone, coverTones, filterBooks, sortBooks, toneOf, imageCover } from './catalog.js';
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
  const thumb = $('[data-rail-thumb]');
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

  const step = () => {
    const first = track.firstElementChild;
    return first ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : viewport.clientWidth;
  };
  const sync = () => {
    const max = track.scrollWidth - viewport.clientWidth;
    const p = max > 0 ? viewport.scrollLeft / max : 0;
    const w = track.scrollWidth ? viewport.clientWidth / track.scrollWidth : 1;
    thumb.style.width = `${Math.max(8, Math.min(100, w * 100)).toFixed(1)}%`;
    thumb.style.transform = `translateX(${(p * (100 / Math.max(w, 0.01) - 100)).toFixed(1)}%)`;
    prev.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= max - 2;
    root.classList.toggle('is-static', max <= 2);
  };
  const go = dir => viewport.scrollBy({ left: dir * Math.max(step(), viewport.clientWidth * 0.85), behavior: isMotion() ? 'smooth' : 'auto' });

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
  const FIRST_CHUNK = 6; // lo que se ve al llegar; el resto se pinta en el fotograma siguiente para no hacer una tarea larga
  // `immediate` (primera carga) pinta de una vez. Al tocar una parada, la parada confirma ya y las tarjetas se cambian después de pintar.
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
    const list = pickBooks(books, col);
    const tones = coverTones(list);
    const cards = list.map((b, i) => bookCard(b, tones[i]));
    track.replaceChildren(...cards.slice(0, FIRST_CHUNK));
    track.removeAttribute('aria-busy');
    viewport.scrollTo({ left: 0, behavior: 'auto' });
    viewport.setAttribute('aria-label', `Libros de la colección ${col.titulo}`);
    noteEl.textContent = col.nota || ''; // la nota de la colección
    painted = col.id;
    markSeen(col.id, announce);
    const trail = paintTrail();
    if (announce) live.textContent = `${col.titulo}: ${list.length} libros. ${trail.text}${trail.complete ? '' : '.'}`; // una sola región viva: la colección y el progreso del recorrido
    if (cards.length > FIRST_CHUNK) {
      if (!immediate) await afterPaint();
      if (mine !== paintId) return;
      track.append(...cards.slice(FIRST_CHUNK));
    }
    sync();
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

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  viewport.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  viewport.addEventListener('keydown', e => {
    if (e.target !== viewport) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  // Tab: el navegador no desplaza una tarjeta asomada (recortada) al enfocarla; se alinea al inicio, donde la deja el snap.
  track.addEventListener('focusin', e => {
    const item = e.target.closest('.rail-item');
    if (!item) return;
    const pad = parseFloat(getComputedStyle(viewport).scrollPaddingInlineStart) || 0;
    const v = viewport.getBoundingClientRect();
    const b = item.getBoundingClientRect();
    if (b.left >= v.left + pad - 1 && b.right <= v.right - pad + 1) return;
    viewport.scrollBy({ left: b.left - v.left - pad, behavior: isMotion() ? 'smooth' : 'auto' });
  });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(viewport);

  wireBookOpen(track, ensureCatalog);

  chipsEl.querySelectorAll('.rail-chip').forEach((c, i) => { c.tabIndex = i ? -1 : 0; });
  paintTrail(); // lo guardado de visitas anteriores se pinta sin rebote: no hubo toque
  show(cols[0].id, false, true);
  root.classList.add('is-ready');
}
