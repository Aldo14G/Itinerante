// Carrusel de libros: una sola pieza para cualquier colección. Hoy muestra la muestra (rotulada);
// cuando llegue el listado real basta con poner `ids` en assets/data/collections.json.
import { coverTone, filterBooks, sortBooks, loadSample } from './catalog.js';

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

function bookCard(b) {
  const cover = make('span', `cover cover--blank tone-${coverTone(b)}`);
  const title = make('span', 'cover-title', b.t);
  const author = make('span', 'cover-author', b.a);
  title.setAttribute('aria-hidden', 'true');
  author.setAttribute('aria-hidden', 'true');
  cover.append(title, author);
  const btn = make('button', 'card');
  btn.type = 'button';
  btn.dataset.id = b.id;
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.append(cover, make('span', 'card-t', b.t), make('span', 'card-a', b.a));
  const li = make('li', 'rail-item');
  li.append(btn);
  return li;
}

export async function initRail({ ensureCatalog, isMotion = () => false } = {}) {
  const root = document.querySelector('[data-rail]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
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
      fetch('assets/data/collections.json').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); })
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
  function show(id, announce) {
    const col = cols.find(c => c.id === id) ?? cols[0];
    current = col.id;
    const list = pickBooks(books, col);
    track.replaceChildren(...list.map(bookCard));
    track.removeAttribute('aria-busy');
    viewport.scrollTo({ left: 0, behavior: 'auto' });
    viewport.setAttribute('aria-label', `Libros de la colección ${col.titulo}`);
    noteEl.textContent = col.nota || '';
    noteEl.hidden = !col.nota;
    chipsEl.querySelectorAll('.rail-chip').forEach(c => c.setAttribute('aria-checked', String(c.dataset.id === col.id)));
    if (announce) live.textContent = `${col.titulo}: ${list.length} libros.`;
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

  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  viewport.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  viewport.addEventListener('keydown', e => {
    if (e.target !== viewport) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(viewport);

  // La ficha vive en el catálogo: se asegura que esté cargado y se le pide abrirla.
  track.addEventListener('click', async e => {
    const card = e.target.closest('.card');
    if (!card) return;
    const opener = card;
    try { await ensureCatalog?.(); } catch { return; }
    const drawer = document.getElementById('cat-drawer');
    if (drawer) drawer.addEventListener('close', () => opener.isConnected && opener.focus({ preventScroll: true }), { once: true });
    document.dispatchEvent(new CustomEvent('iti:open-book', { detail: { id: card.dataset.id } }));
  });

  chipsEl.querySelector('.rail-chip').tabIndex = 0;
  chipsEl.querySelectorAll('.rail-chip:not(:first-child)').forEach(c => { c.tabIndex = -1; });
  show(cols[0].id, false);
  root.classList.add('is-ready');
}
