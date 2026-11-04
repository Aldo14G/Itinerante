// Carrusel de libros: una sola pieza para cualquier colección. Hoy muestra la muestra (rotulada);
// cuando llegue el listado real basta con poner `ids` en assets/data/collections.json.
import { coverLayout, coverTone, coverTones, filterBooks, sortBooks, toneOf } from './catalog.js';
import { loadSample, loadCollections } from './sample.js';
import { saveButton, initSaved } from './saved.js';
import { afterPaint, confirmThen } from './motion.js';

export const RAIL_SIZE = 12;

// Libros de una colección: una lista curada (`ids`, en ese orden) o un filtro sobre la muestra, por título.
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

// `tone` lo da la lista (coverTones: sin vecinas del mismo tono); sin él, el tono propio del libro.
export function bookCard(b, tone = coverTone(b)) {
  const cover = make('span', `cover cover--blank tone-${tone}`);
  cover.dataset.coverTone = tone;
  cover.dataset.coverLayout = coverLayout(b);
  // Título y autor van una sola vez, dentro de la portada; son también el nombre accesible del botón.
  cover.append(make('span', 'cover-title', b.t), make('span', 'cover-author', b.a));
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

  let books, cols;
  try {
    const [sample, collections] = await Promise.all([
      loadSample(),
      loadCollections()
    ]);
    books = sample.books;
    cols = collections.collections.filter(c => pickBooks(books, c).length);
    if (!cols.length) throw new Error('sin colecciones');
  } catch {
    delete root.dataset.ready;
    root.hidden = true; // sin datos no se promete nada: el capítulo sigue con los temas y la muestra completa
    return;
  }

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

  let current = null;
  let paintId = 0; // el último cambio de colección gana si se toca otro chip antes de terminar de pintar
  const FIRST_CHUNK = 6; // lo que se ve al llegar; el resto se pinta en el fotograma siguiente para no hacer una tarea larga
  // `immediate` (primera carga) pinta de una vez. Al tocar un chip, el chip confirma ya y las tarjetas se cambian después de pintar.
  async function show(id, announce, immediate = false) {
    const col = cols.find(c => c.id === id) ?? cols[0];
    current = col.id;
    chipsEl.querySelectorAll('.rail-chip').forEach(c => c.setAttribute('aria-checked', String(c.dataset.id === col.id)));
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
    noteEl.textContent = col.nota || ''; // la nota de la colección va aparte: el rótulo de muestra es fijo (vive en el marcado) y nunca se toca
    if (announce) live.textContent = `${col.titulo}: ${list.length} libros.`;
    if (cards.length > FIRST_CHUNK) {
      if (!immediate) await afterPaint();
      if (mine !== paintId) return;
      track.append(...cards.slice(FIRST_CHUNK));
    }
    sync();
  }

  chipsEl.replaceChildren(...cols.map(c => {
    const b = make('button', 'rail-chip', c.titulo);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.dataset.id = c.id;
    b.setAttribute('aria-checked', 'false');
    return b;
  }));
  chipsEl.addEventListener('click', e => { const c = e.target.closest('.rail-chip'); if (c && c.dataset.id !== current) show(c.dataset.id, true); });
  chipsEl.addEventListener('keydown', e => {
    if (!['ArrowRight', 'ArrowLeft'].includes(e.key)) return;
    const all = [...chipsEl.querySelectorAll('.rail-chip')];
    const i = all.findIndex(c => c.dataset.id === current);
    const nextChip = all[(i + (e.key === 'ArrowRight' ? 1 : all.length - 1)) % all.length];
    e.preventDefault();
    nextChip.focus();
    show(nextChip.dataset.id, true);
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

  chipsEl.querySelector('.rail-chip').tabIndex = 0;
  chipsEl.querySelectorAll('.rail-chip:not(:first-child)').forEach(c => { c.tabIndex = -1; });
  show(cols[0].id, false, true);
  root.classList.add('is-ready');
}
