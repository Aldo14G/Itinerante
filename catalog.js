// Catálogo de muestra: búsqueda predictiva, filtros con conteo, rejilla y ficha.
import { DUR, EASE, ms } from './motion.js';
import { loadSample } from './sample.js';
import { saveButton, bindSaveButton, initSaved } from './saved.js';

export { loadSample };
// La parte pura (sin DOM) se prueba con check.mjs; initCatalog() solo corre en el navegador.

export const PAGE_SIZE = 24;
export const WA_NUMBER = '528180875940';

// Tono de portada: ficción en la familia cálida (terracota, ámbar, ciruela) y no ficción en la fría
// (turquesa, piedra, azul). Dentro de la familia el género decide el tono, así un género siempre se ve igual.
const TONES = { fiction: [1, 2, 5], 'non-fiction': [0, 3, 4] };
export function coverTone(book) {
  const family = TONES[book.k] ?? TONES['non-fiction'];
  let h = 0;
  for (const ch of book.g) h = (h * 31 + ch.charCodeAt(0)) % 997;
  return family[h % family.length];
}

const CATEGORY_ES = { fiction: 'Ficción', 'non-fiction': 'No ficción' };
const FORMAT_ES = { 'Libro electronico': 'Libro electrónico', 'Board Book': 'Libro de cartón' };
export const formatLabel = f => FORMAT_ES[f] || f;

export const norm = s => String(s ?? '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim();

function haystack(b) {
  if (!b._h) Object.defineProperty(b, '_h', { value: { t: norm(b.t), a: norm(b.a), p: norm(b.p), n: b.n || '' } });
  return b._h;
}

// Puntaje de coincidencia: 0 = no coincide. Todas las palabras deben aparecer.
export function score(book, query) {
  const q = norm(query);
  if (!q) return 1;
  const h = haystack(book);
  if (/^\d{10,13}$/.test(q)) return h.n === q ? 5 : h.n.startsWith(q) ? 4 : 0;
  let total = 0;
  for (const word of q.split(/\s+/)) {
    let s = 0;
    if (h.t.startsWith(word)) s = 4;
    else if (h.t.includes(` ${word}`)) s = 3;
    else if (h.t.includes(word)) s = 2;
    else if (h.a.startsWith(word) || h.a.includes(` ${word}`)) s = 3;
    else if (h.a.includes(word)) s = 1;
    else if (h.p.includes(word)) s = 1;
    else if (h.n.includes(word)) s = 1;
    if (!s) return 0;
    total += s;
  }
  return total;
}

export function filterBooks(books, f = {}, ignore = '') {
  const has = (set, v) => !set || !set.size || set.has(v);
  return books.filter(b =>
    (ignore === 'k' || has(f.k, b.k)) &&
    (ignore === 'g' || has(f.g, b.g)) &&
    (ignore === 'f' || has(f.f, b.f)) &&
    (ignore === 'p' || has(f.p, b.p)) &&
    (!f.q || score(b, f.q) > 0));
}

const byTitle = (a, b) => a.t.localeCompare(b.t, 'es');
export function sortBooks(list, sort = 'az', q = '') {
  const out = [...list];
  if (sort === 'rel' && q) return out.sort((a, b) => score(b, q) - score(a, q) || byTitle(a, b));
  if (sort === 'new') return out.sort((a, b) => (b.y || 0) - (a.y || 0) || byTitle(a, b));
  if (sort === 'autor') return out.sort((a, b) => a.a.localeCompare(b.a, 'es') || byTitle(a, b));
  return out.sort(byTitle);
}

// Conteo por valor de una dimensión, sin aplicar el filtro de esa misma dimensión.
export function facetCounts(books, f, dim) {
  const counts = new Map();
  for (const b of filterBooks(books, f, dim)) counts.set(b[dim], (counts.get(b[dim]) || 0) + 1);
  return counts;
}

export function suggest(books, query, limit = 6) {
  const q = norm(query);
  if (q.length < 2) return [];
  const out = [];
  const seen = new Set();
  const add = (text, kind) => { const key = kind + norm(text); if (!seen.has(key) && out.length < limit) { seen.add(key); out.push({ text, kind }); } };
  const ranked = books.map(b => [score(b, q), b]).filter(([s]) => s > 0).sort((x, y) => y[0] - x[0]);
  for (const [, b] of ranked.slice(0, 40)) {
    const h = haystack(b);
    if (/^\d+$/.test(q)) add(b.n, 'ISBN');
    else if (h.t.includes(q)) add(b.t, 'Título');
  }
  const byPrefix = x => (haystack(x).a.startsWith(q) || haystack(x).a.includes(` ${q}`) ? 0 : 1);
  for (const [, b] of [...ranked].sort((x, y) => byPrefix(x[1]) - byPrefix(y[1]))) if (haystack(b).a.includes(q)) add(b.a, 'Autor');
  for (const [, b] of ranked) if (haystack(b).p.includes(q) && b.p) add(b.p, 'Editorial');
  for (const [, b] of ranked.slice(0, 40)) if (out.length < limit) add(b.t, 'Título');
  return out;
}

export function relatedBooks(books, book, n = 3) {
  return books.filter(b => b.id !== book.id && b.g === book.g).sort(byTitle).slice(0, n);
}

export function bookMessage(book) {
  const by = book.a && book.a !== 'Autor no indicado' ? ` de ${book.a}` : '';
  const isbn = book.n ? ` (ISBN ${book.n})` : '';
  return `Hola, ¿tienen «${book.t}»${by}${isbn}? Vi el título en la muestra de su sitio.`;
}

export function bookWaUrl(book) {
  const url = new URL(`https://wa.me/${WA_NUMBER}`);
  url.searchParams.set('text', bookMessage(book));
  return url.href;
}

// ---------------------------------------------------------------------------------------------
export async function initCatalog({ isMotion = () => false } = {}) {
  const $ = (s, el = document) => el.querySelector(s);
  const root = $('#catalogo');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  initSaved();

  const status = $('[data-cat-status]', root);
  let data;
  try {
    data = await loadSample();
  } catch {
    status.textContent = 'No pudimos cargar la muestra. Escríbenos por WhatsApp y te ayudamos a buscar.';
    root.dataset.state = 'error';
    delete root.dataset.ready; // permite reintentar (p. ej. al volver a #catalogo)
    $('[data-cat-grid]', root).replaceChildren();
    $('[data-cat-grid]', root).removeAttribute('aria-busy');
    $('[data-cat-filters]', root).replaceChildren();
    // Salida clara: WhatsApp y reintento; los controles de busqueda no hacen nada sin datos.
    const controls = [$('[data-cat-q]', root), $('[data-cat-sort]', root)];
    controls.forEach(c => { c.disabled = true; });
    const box = document.createElement('div');
    box.className = 'cat-error';
    box.innerHTML = `<a class="btn btn--tungsten" href="https://wa.me/${WA_NUMBER}?text=${encodeURIComponent('Hola, estoy buscando un libro.')}" target="_blank" rel="noopener noreferrer"><span>Preguntar por WhatsApp</span></a> <button type="button" class="btn btn--ghost"><span>Reintentar</span></button>`;
    status.after(box);
    box.querySelector('button').addEventListener('click', () => {
      box.remove();
      controls.forEach(c => { c.disabled = false; });
      status.textContent = 'Cargando la muestra…';
      initCatalog({ isMotion });
    });
    return;
  }

  const books = data.books;
  const byId = new Map(books.map(b => [b.id, b]));
  const input = $('[data-cat-q]', root);
  const list = $('[data-cat-suggest]', root);
  const sortEl = $('[data-cat-sort]', root);
  const filtersEl = $('[data-cat-filters]', root);
  const filtersBtn = $('[data-cat-filters-btn]', root);
  const chipsEl = $('[data-cat-chips]', root);
  const grid = $('[data-cat-grid]', root);
  const moreBtn = $('[data-cat-more]', root);
  const emptyEl = $('[data-cat-empty]', root);
  const drawer = $('#cat-drawer');
  const seal = data.meta.label;

  const state = { q: '', k: new Set(), g: new Set(), f: new Set(), p: new Set(), sort: 'az', shown: PAGE_SIZE, expandG: false };
  const names = {
    k: id => CATEGORY_ES[id] || data.categories[id] || id,
    g: id => data.subgenres[id]?.n || id,
    f: formatLabel,
    p: id => id,
  };
  const GROUPS = [
    { dim: 'k', label: 'Categoría', limit: 99 },
    { dim: 'g', label: 'Género', limit: 10 },
    { dim: 'f', label: 'Formato', limit: 99 },
    { dim: 'p', label: 'Editorial', limit: 8 },
  ];

  const el = (tag, attrs = {}, ...kids) => {
    const n = document.createElement(tag);
    for (const [k, v] of Object.entries(attrs)) { if (v === false || v == null) continue; if (k === 'class') n.className = v; else n.setAttribute(k, v === true ? '' : v); }
    n.append(...kids.flat().filter(x => x != null));
    return n;
  };
  const tick = () => new Promise(r => requestAnimationFrame(() => r()));

  // ----- filtros -----
  let filtersDone = false;
  function renderFilters() {
    filtersDone = true;
    const frag = document.createDocumentFragment();
    for (const g of GROUPS) {
      const counts = facetCounts(books, { ...state, q: state.q }, g.dim);
      let entries = [...counts.entries()].filter(([v]) => v).sort((a, b) => b[1] - a[1] || String(names[g.dim](a[0])).localeCompare(String(names[g.dim](b[0])), 'es'));
      for (const v of state[g.dim]) if (!counts.has(v)) entries.push([v, 0]);
      if (!entries.length) continue;
      const open = g.dim === 'g' && state.expandG;
      const visible = g.limit < entries.length && !open ? entries.slice(0, g.limit) : entries;
      const fs = el('fieldset', { class: 'cat-group' }, el('legend', {}, g.label));
      for (const [value, n] of visible) {
        const id = `cf-${g.dim}-${norm(value).replace(/[^a-z0-9]+/g, '-')}`;
        const cb = el('input', { type: 'checkbox', id, 'data-dim': g.dim, 'data-value': value });
        cb.checked = state[g.dim].has(value);
        fs.append(el('div', { class: 'cat-opt' }, cb, el('label', { for: id }, names[g.dim](value), el('span', { class: 'cat-n' }, String(n)))));
      }
      if (g.dim === 'g' && entries.length > g.limit) {
        fs.append(el('button', { type: 'button', class: 'cat-more-facets', 'data-expand': 'g', 'aria-expanded': String(open) }, open ? 'Ver menos géneros' : `Ver los ${entries.length} géneros`));
      }
      frag.append(fs);
    }
    filtersEl.replaceChildren(frag);
  }

  function renderChips() {
    const chips = [];
    if (state.q) chips.push(['q', state.q, `Búsqueda: ${state.q}`]);
    for (const dim of ['k', 'g', 'f', 'p']) for (const v of state[dim]) chips.push([dim, v, names[dim](v)]);
    chipsEl.replaceChildren(...chips.map(([dim, v, label]) =>
      el('li', {}, el('button', { type: 'button', class: 'cat-chip', 'data-chip-dim': dim, 'data-chip-value': v, 'aria-label': `Quitar filtro ${label}` }, label, el('span', { 'aria-hidden': 'true' }, '×')))));
    if (chips.length > 1) chipsEl.append(el('li', {}, el('button', { type: 'button', class: 'cat-clear', 'data-clear': '' }, 'Limpiar todo')));
    chipsEl.hidden = !chips.length;
    const n = state.k.size + state.g.size + state.f.size + state.p.size;
    $('[data-cat-filters-count]', root).textContent = `${n ? `(${n}) · ` : ''}${results.length}`;
  }

  // ----- rejilla -----
  // Una sola familia de portadas: tarjeta tipográfica propia (sin imágenes de terceros ni SVG heterogéneos).
  function cover(b) { return blankCover(b); }
  function blankCover(b) {
    return el('span', { class: `cover cover--blank tone-${coverTone(b)}` }, el('span', { class: 'cover-title', 'aria-hidden': 'true' }, b.t), el('span', { class: 'cover-author', 'aria-hidden': 'true' }, b.a));
  }

  function card(b) {
    const btn = el('button', { type: 'button', class: 'card', 'data-id': b.id, 'aria-haspopup': 'dialog' },
      cover(b),
      el('span', { class: 'card-t' }, b.t),
      el('span', { class: 'card-a' }, b.a));
    return el('li', { class: 'card-item' }, btn, saveButton(b));
  }

  let results = [];
  function compute() {
    results = sortBooks(filterBooks(books, state), state.sort === 'rel' && !state.q ? 'az' : state.sort, state.q);
  }

  function renderGrid({ append = false, animate = true } = {}) {
    const slice = results.slice(0, state.shown);
    const from = append ? grid.children.length : 0;
    const frag = document.createDocumentFragment();
    const fresh = slice.slice(from).map(card);
    fresh.forEach(li => frag.append(li));
    if (!append) grid.replaceChildren();
    grid.removeAttribute('aria-busy');
    grid.append(frag);
    if (animate && isMotion() && fresh.length) fresh.slice(0, 18).forEach((li, i) => li.animate([{ opacity: 0, transform: 'translateY(14px)' }, { opacity: 1, transform: 'none' }], { duration: DUR('base'), delay: i * ms('stagger-char'), easing: EASE(), fill: 'backwards' }));
    const left = results.length - slice.length;
    moreBtn.hidden = left <= 0;
    moreBtn.textContent = `Ver ${Math.min(PAGE_SIZE, left)} más · quedan ${left}`;
    emptyEl.hidden = results.length > 0;
    grid.hidden = !results.length;
    status.textContent = results.length
      ? `Mostrando ${slice.length} de ${results.length} títulos de muestra.`
      : 'Ningún título de muestra coincide.';
    return fresh;
  }

  function refresh({ keepShown = false, animate = true } = {}) {
    if (!keepShown) state.shown = PAGE_SIZE;
    compute();
    renderFilters();
    renderChips();
    renderGrid({ animate });
  }

  // ----- sugerencias (combobox) -----
  let active = -1;
  function closeSuggest() { list.hidden = true; input.setAttribute('aria-expanded', 'false'); input.removeAttribute('aria-activedescendant'); active = -1; }
  function renderSuggest() {
    const items = suggest(books, input.value);
    if (!items.length) { closeSuggest(); return; }
    const q = input.value.trim();
    const total = filterBooks(books, { q }).length;
    const rows = items.map((s, i) => el('li', { role: 'option', id: `cat-s-${i}`, 'data-text': s.text, 'aria-selected': 'false' }, el('span', { class: 'sg-k' }, s.kind), ` ${s.text}`));
    // Patrón de referencia (buscador de SP): una última fila que lleva a todos los resultados.
    if (total > items.length) rows.push(el('li', { role: 'option', id: 'cat-s-all', class: 'sg-all', 'data-text': q, 'data-all': '1', 'aria-selected': 'false' }, `Ver los ${total} resultados`));
    list.replaceChildren(...rows);
    list.hidden = false;
    input.setAttribute('aria-expanded', 'true');
    active = -1;
  }
  function pick(text, { all = false } = {}) {
    input.value = text;
    state.q = text;
    if (state.sort === 'az') state.sort = 'rel';
    sortEl.value = state.sort;
    closeSuggest();
    refresh();
    if (all) status.scrollIntoView({ block: 'center', behavior: isMotion() ? 'smooth' : 'auto' });
  }
  input.addEventListener('input', () => {
    renderSuggest();
    state.q = input.value.trim();
    state.sort = state.q ? (state.sort === 'az' ? 'rel' : state.sort) : (state.sort === 'rel' ? 'az' : state.sort);
    sortEl.value = state.sort;
    refresh({ animate: false }); // al teclear no se repite la entrada de las tarjetas
  });
  input.addEventListener('keydown', e => {
    const opts = [...list.children];
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      if (list.hidden) { renderSuggest(); return; }
      e.preventDefault();
      active = e.key === 'ArrowDown' ? (active + 1) % opts.length : (active <= 0 ? opts.length - 1 : active - 1);
      opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === active)));
      input.setAttribute('aria-activedescendant', opts[active].id);
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (active >= 0 && opts[active]) pick(opts[active].dataset.text, { all: !!opts[active].dataset.all }); else closeSuggest();
    } else if (e.key === 'Escape' && !list.hidden) { e.preventDefault(); closeSuggest(); }
  });
  list.addEventListener('pointerdown', e => { const li = e.target.closest('li'); if (li) { e.preventDefault(); pick(li.dataset.text, { all: !!li.dataset.all }); } });
  input.addEventListener('blur', () => setTimeout(closeSuggest, DUR('instant')));
  $('[data-cat-form]', root).addEventListener('submit', e => { e.preventDefault(); closeSuggest(); });

  sortEl.addEventListener('change', () => { state.sort = sortEl.value; refresh(); });

  filtersEl.addEventListener('change', e => {
    const cb = e.target.closest('input[type="checkbox"]');
    if (!cb) return;
    const set = state[cb.dataset.dim];
    if (cb.checked) set.add(cb.dataset.value); else set.delete(cb.dataset.value);
    refresh();
    document.getElementById(cb.id)?.focus({ preventScroll: true });
  });
  filtersEl.addEventListener('click', e => {
    const b = e.target.closest('[data-expand]');
    if (!b) return;
    state.expandG = !state.expandG;
    renderFilters();
    filtersEl.querySelector('[data-expand]')?.focus({ preventScroll: true });
  });
  chipsEl.addEventListener('click', e => {
    const chip = e.target.closest('[data-chip-dim]');
    if (chip) {
      const dim = chip.dataset.chipDim;
      if (dim === 'q') { state.q = ''; input.value = ''; if (state.sort === 'rel') { state.sort = 'az'; sortEl.value = 'az'; } } else state[dim].delete(chip.dataset.chipValue);
      refresh();
      if (dim === 'q') input.focus({ preventScroll: true }); else restFocus();
    } else if (e.target.closest('[data-clear]')) clearAll();
  });
  function clearAll() {
    state.q = ''; input.value = ''; state.k.clear(); state.g.clear(); state.f.clear(); state.p.clear();
    state.sort = 'az'; sortEl.value = 'az';
    refresh();
    restFocus();
  }
  // Tras quitar un filtro el foco va al estado de resultados (no al buscador, que abriria el teclado en movil).
  function restFocus() { status.tabIndex = -1; status.focus({ preventScroll: true }); }
  filtersBtn.addEventListener('click', () => {
    if (!filtersDone) renderFilters();
    const open = filtersBtn.getAttribute('aria-expanded') !== 'true';
    filtersBtn.setAttribute('aria-expanded', String(open));
    root.classList.toggle('filters-open', open);
  });
  $('[data-cat-reset]', root).addEventListener('click', clearAll);
  moreBtn.addEventListener('click', () => {
    state.shown += PAGE_SIZE;
    const before = grid.children.length;
    renderGrid({ append: true });
    grid.children[before]?.querySelector('button')?.focus({ preventScroll: false });
  });

  // ----- ficha (drawer) -----
  function row(k, v) { return v ? [el('dt', {}, k), el('dd', {}, String(v))] : []; }
  function openBook(id, { trigger } = {}) {
    const b = byId.get(id);
    if (!b) return;
    $('[data-d-cover]', drawer).replaceChildren(cover(b));
    $('[data-d-title]', drawer).textContent = b.t;
    $('[data-d-author]', drawer).textContent = b.a;
    $('[data-d-facts]', drawer).replaceChildren(
      ...row('Editorial', b.p), ...row('Año', b.y), ...row('Formato', formatLabel(b.f)),
      ...row('Género', names.g(b.g)), ...row('Categoría', names.k(b.k)), ...row('ISBN-13', b.n), ...row('Páginas', b.pg));
    const cta = $('[data-d-cta]', drawer);
    cta.href = bookWaUrl(b);
    $('[data-d-msg]', drawer).textContent = bookMessage(b);
    // Los relacionados recorren todo el catálogo: se calculan tras abrir la hoja, no antes.
    const relWrap = $('[data-d-related-wrap]', drawer);
    relWrap.hidden = true;
    requestAnimationFrame(() => {
      if (!drawer.open || drawer.dataset.book !== id) return;
      const rel = relatedBooks(books, b);
      $('[data-d-related]', drawer).replaceChildren(...rel.map(r => el('li', {}, el('button', { type: 'button', class: 'rel', 'data-id': r.id }, cover(r), el('span', {}, r.t)))));
      relWrap.hidden = !rel.length;
    });
    drawer.dataset.book = id;
    bindSaveButton($('[data-d-save]', drawer), b);
    if (trigger) drawer.dataset.trigger = trigger;
    if (!drawer.open) { drawer.showModal(); document.documentElement.classList.add('sheet-open'); }
    drawer.scrollTop = 0;
    $('[data-d-scroll]', drawer).scrollTop = 0;
  }
  grid.addEventListener('click', e => { const c = e.target.closest('.card'); if (c) openBook(c.dataset.id, { trigger: c.dataset.id }); });
  // Otras piezas (el carrusel de libros) piden abrir una ficha sin conocer el diálogo.
  document.addEventListener('iti:open-book', e => { if (e.detail?.id) { drawer.dataset.trigger = ''; openBook(e.detail.id); } });
  $('[data-d-related]', drawer).addEventListener('click', e => { const r = e.target.closest('.rel'); if (r) { openBook(r.dataset.id); $('[data-d-close]', drawer).focus({ preventScroll: true }); } });
  $('[data-d-close]', drawer).addEventListener('click', () => drawer.close());
  drawer.addEventListener('click', e => { if (e.target === drawer) drawer.close(); });
  // Hoja inferior (móvil): se arrastra desde el asa o la parte alta y se cierra al soltar pasado un umbral.
  (function sheetDrag() {
    const grab = $('[data-d-grab]', drawer);
    const scroller = $('[data-d-scroll]', drawer);
    let startY = 0, dy = 0, t0 = 0, active = false;
    const sheetMode = () => matchMedia('(max-width: 760px)').matches;
    drawer.addEventListener('pointerdown', e => {
      if (!sheetMode() || e.target.closest('a, button:not([data-d-grab])') || (scroller.scrollTop > 0 && e.target !== grab)) return;
      if (e.target !== grab && e.clientY - drawer.getBoundingClientRect().top > 72) return;
      active = true; startY = e.clientY; dy = 0; t0 = performance.now();
      drawer.setPointerCapture(e.pointerId);
      drawer.style.transition = 'none';
    });
    drawer.addEventListener('pointermove', e => {
      if (!active) return;
      dy = Math.max(0, e.clientY - startY);
      drawer.style.translate = `0 ${dy}px`;
    });
    const end = () => {
      if (!active) return;
      active = false;
      const speed = dy / Math.max(1, performance.now() - t0);
      drawer.style.transition = '';
      drawer.style.translate = '';
      if (dy > 120 || speed > 0.7) drawer.close();
    };
    drawer.addEventListener('pointerup', end);
    drawer.addEventListener('pointercancel', end);
  })();
  drawer.addEventListener('close', () => {
    document.documentElement.classList.remove('sheet-open');
    const t = drawer.dataset.trigger && grid.querySelector(`.card[data-id="${CSS.escape(drawer.dataset.trigger)}"]`);
    if (t) t.focus({ preventScroll: true });
  });

  // portadas que no cargan: tarjeta tipográfica
  document.addEventListener('error', e => {
    const img = e.target;
    if (!(img instanceof HTMLImageElement) || !img.closest('.cover') || img.dataset.failed) return;
    img.dataset.failed = '1';
    const holder = img.closest('.cover');
    const title = holder.closest('.card, .rel, dialog')?.querySelector('.card-t, .rel span, [data-d-title]')?.textContent || '';
    holder.classList.add('cover--blank');
    holder.replaceChildren(el('span', { class: 'cover-title', 'aria-hidden': 'true' }, title));
  }, true);

  $('[data-cat-seal]', root).textContent = seal;
  sortEl.value = state.sort;
  root.dataset.state = 'ready';
  // Primero lo que se ve (rejilla y filtros activos); las facetas, que recorren los 500 títulos, esperan a un momento libre.
  compute();
  renderChips();
  renderGrid();
  (window.requestIdleCallback || (cb => setTimeout(cb, 200)))(() => { if (!filtersDone) renderFilters(); }, { timeout: 1500 });
  await tick();
}
