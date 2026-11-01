// Mi lista para la visita: libros que la persona anota en este dispositivo (sin cuenta, sin servidor).
// Sirve al objetivo del sitio: que lleguen a la librería sabiendo qué quieren ver y puedan preguntarlo.
import { loadSample } from './sample.js';

const KEY = 'iti-saved-v1';
export const MAX_SAVED = 30;
const WA_NUMBER = '528180875940';
const MAPS = 'https://www.google.com/maps/dir/?api=1&destination=Librer%C3%ADa%20Itinerante%20y%20M%C3%A1s%2C%20Mariano%20Matamoros%20Pte.%20421%2C%20Centro%2C%20Monterrey';

let mem = null;
const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };

function load() {
  if (mem) return mem;
  let raw = [];
  try { raw = JSON.parse(store()?.getItem(KEY) || '[]'); } catch { raw = []; }
  mem = Array.isArray(raw) ? raw.filter(x => typeof x === 'string').slice(0, MAX_SAVED) : [];
  return mem;
}
function persist() { try { store()?.setItem(KEY, JSON.stringify(mem)); } catch { /* almacenamiento bloqueado: la lista dura la sesión */ } }
const announce = detail => { if (typeof document !== 'undefined') document.dispatchEvent(new CustomEvent('iti:saved-change', { detail })); };

export const savedIds = () => [...load()];
export const isSaved = id => load().includes(id);

// Guarda o quita un libro. Lo más reciente va primero. Devuelve { ok, on, full }.
export function toggleSaved(id) {
  const list = load();
  const at = list.indexOf(id);
  if (at >= 0) { list.splice(at, 1); persist(); announce({ id, on: false }); return { ok: true, on: false }; }
  if (list.length >= MAX_SAVED) return { ok: false, on: false, full: true };
  list.unshift(id);
  persist();
  announce({ id, on: true });
  return { ok: true, on: true };
}
export function clearSaved() { load().length = 0; persist(); announce({ id: null, on: false }); }

// Mensaje para WhatsApp: informativo, con tope de títulos para no pasar el largo de un enlace.
export function listMessage(books, max = 12) {
  const clip = s => (Array.from(String(s)).length > 70 ? Array.from(String(s)).slice(0, 69).join('') + '…' : String(s));
  const lines = books.slice(0, max).map((b, i) => `${i + 1}. «${clip(b.t)}»${b.a && b.a !== 'Autor no indicado' ? ` de ${clip(b.a)}` : ''}`);
  const rest = books.length - lines.length;
  return [
    'Hola, pienso visitarlos pronto. ¿Me ayudan a confirmar si tienen estos libros? (Los anoté en la muestra de su sitio.)',
    ...lines,
    ...(rest > 0 ? [`…y ${rest} más.`] : []),
    'Gracias.'
  ].join('\n');
}
export function listWaUrl(books) {
  const url = new URL(`https://wa.me/${WA_NUMBER}`);
  url.searchParams.set('text', listMessage(books));
  return url.href;
}

// ---------------------------------------------------------------------------------------------
// Interfaz (solo navegador)
function icon(id) {
  const NS = 'http://www.w3.org/2000/svg';
  const svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'ic');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS(NS, 'use');
  use.setAttribute('href', `#${id}`);
  svg.append(use);
  return svg;
}

const countText = n => (n === 0 ? 'Vacía' : n === 1 ? '1 libro' : `${n} libros`);

function paint(btn) {
  const on = isSaved(btn.dataset.saveId);
  const title = btn.dataset.saveTitle || 'este libro';
  btn.setAttribute('aria-pressed', String(on));
  btn.setAttribute('aria-label', on ? `Quitar «${title}» de mi lista` : `Guardar «${title}» en mi lista`);
  const label = btn.querySelector('[data-save-label]');
  if (label) label.textContent = on ? 'Guardado en mi lista · Quitar' : 'Guardar en mi lista';
}

export function saveButton(book, { wide = false } = {}) {
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = wide ? 'save save--wide' : 'save';
  btn.dataset.saveId = book.id;
  btn.dataset.saveTitle = book.t;
  btn.append(icon('i-mark'));
  if (wide) { const l = document.createElement('span'); l.dataset.saveLabel = ''; btn.append(l); }
  paint(btn);
  return btn;
}

// Apunta el botón ancho de la ficha (que existe en el HTML) a un libro.
export function bindSaveButton(btn, book) {
  btn.dataset.saveId = book.id;
  btn.dataset.saveTitle = book.t;
  paint(btn);
}

let ready = false;
let toastEl, toastTimer;

function hideToast() { try { if (toastEl?.matches(':popover-open')) toastEl.hidePopover(); } catch { /* ya cerrado */ } }

function toast(text, withAction = true) {
  if (!toastEl) {
    toastEl = document.createElement('div');
    toastEl.className = 'toast';
    toastEl.setAttribute('role', 'status');
    toastEl.popover = 'manual'; // capa superior: se ve también sobre las hojas modales
    document.body.append(toastEl);
  }
  toastEl.replaceChildren();
  const msg = document.createElement('span');
  msg.textContent = text;
  toastEl.append(msg);
  if (withAction) {
    const act = document.createElement('button');
    act.type = 'button';
    act.className = 'toast-action';
    act.dataset.openMylist = '';
    act.textContent = 'Ver mi lista';
    toastEl.append(act);
  }
  if (toastEl.matches(':popover-open')) toastEl.hidePopover();
  toastEl.showPopover?.();
  clearTimeout(toastTimer);
  toastTimer = setTimeout(hideToast, 4500);
}

async function renderList(dlg) {
  const items = dlg.querySelector('[data-ml-items]');
  const empty = dlg.querySelector('[data-ml-empty]');
  const wa = dlg.querySelector('[data-ml-wa]');
  const ids = savedIds();
  empty.hidden = ids.length > 0;
  items.hidden = ids.length === 0;
  wa.hidden = ids.length === 0;
  if (!ids.length) { items.replaceChildren(); return; }
  let books = [];
  try { const sample = await loadSample(); const by = new Map(sample.books.map(b => [b.id, b])); books = ids.map(id => by.get(id)).filter(Boolean); } catch { books = []; }
  items.replaceChildren(...books.map(b => {
    const li = document.createElement('li');
    li.className = 'ml-item';
    const text = document.createElement('span');
    text.className = 'ml-text';
    const t = document.createElement('strong'); t.textContent = b.t;
    const a = document.createElement('span'); a.textContent = b.a;
    text.append(t, a);
    const rm = document.createElement('button');
    rm.type = 'button'; rm.className = 'ml-remove'; rm.dataset.mlRemove = b.id;
    rm.setAttribute('aria-label', `Quitar «${b.t}» de mi lista`);
    rm.append(icon('i-plus'));
    li.append(text, rm);
    return li;
  }));
  wa.href = listWaUrl(books);
  wa.hidden = books.length === 0;
}

function syncAll() {
  document.querySelectorAll('.save[data-save-id]').forEach(paint);
  const n = savedIds().length;
  document.querySelectorAll('[data-saved-count]').forEach(el => { el.textContent = countText(n); });
  document.querySelectorAll('[data-saved-badge]').forEach(el => { el.hidden = n === 0; const c = el.querySelector('[data-saved-n]'); if (c) c.textContent = String(n); });
  const dlg = document.getElementById('mylist');
  if (dlg?.open) renderList(dlg);
}

function openList() {
  const dlg = document.getElementById('mylist');
  if (!dlg || dlg.open) return;
  const open = () => {
    renderList(dlg);
    dlg.showModal();
    document.documentElement.classList.add('sheet-open');
    dlg.querySelector('[data-ml-close]')?.focus({ preventScroll: true });
  };
  const menu = document.getElementById('sheet-menu');
  const drawer = document.getElementById('cat-drawer');
  const other = [menu, drawer].find(d => d?.open);
  if (other) { other.addEventListener('close', () => setTimeout(open, 0), { once: true }); other.close(); } else open();
}

export function initSaved() {
  if (ready || typeof document === 'undefined') return;
  ready = true;
  syncAll();
  document.addEventListener('iti:saved-change', syncAll);
  document.addEventListener('click', e => {
    const save = e.target.closest('.save[data-save-id]');
    if (save) {
      e.preventDefault();
      const res = toggleSaved(save.dataset.saveId);
      if (res.full) toast(`Tu lista llegó a ${MAX_SAVED} libros: quita alguno para sumar otro.`, true);
      else if (res.on) toast('Guardado en tu lista para la visita.');
      else toast('Quitado de tu lista.', false);
      return;
    }
    if (e.target.closest('[data-open-mylist]')) { e.preventDefault(); hideToast(); openList(); return; }
    const rm = e.target.closest('[data-ml-remove]');
    if (rm) { toggleSaved(rm.dataset.mlRemove); return; }
    const dlg = document.getElementById('mylist');
    if (dlg?.open && (e.target === dlg || e.target.closest('[data-ml-close]'))) dlg.close();
  });
  document.getElementById('mylist')?.addEventListener('close', () => {
    document.documentElement.classList.remove('sheet-open');
    document.querySelector('[data-open-mylist]:not(.toast-action)')?.focus?.({ preventScroll: true });
  });
}

export { MAPS };
