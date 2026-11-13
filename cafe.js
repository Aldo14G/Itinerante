// Café y té (#cafe): la carta de la sala en un Carrusel3D, variante «carta» (carousel3d.js). Los datos viven en assets/data/menu.json y se
// editan sin tocar HTML ni JS: cada categoría es un chip (Café · Té) y añadir otra (p. ej. «Para comer») es añadir un objeto a «categorias».
// Carta genérica indicada por Aldo el 2026-11-13 (cafés y tés habituales): sin precios hasta que la librería los dé. Con `precio: null` no se
// imprime nada de precio; con un número, «$NN MXN» marcado como dato de la carta (data-fuente="carta"). Se carga al acercarse a la sección.
import { createCarousel3D, wireRadioChips, checkChip } from './carousel3d.js';
import { afterPaint } from './motion.js';

export const WA_NUMBER = '528180875940';
export const MENU_URL = 'assets/data/menu.json';

// ---------- Parte pura ----------
// Una carta válida: categorías con id, nombre y al menos un producto (cada uno con id y nombre; precio null o un número ≥ 0).
export function validMenu(menu) {
  const cats = Array.isArray(menu?.categorias) ? menu.categorias : [];
  return cats
    .filter(c => c && typeof c.id === 'string' && typeof c.nombre === 'string' && Array.isArray(c.productos))
    .map(c => ({ ...c, productos: c.productos.filter(p => p && typeof p.id === 'string' && typeof p.nombre === 'string' && (p.precio === null || p.precio === undefined || (typeof p.precio === 'number' && p.precio >= 0))) }))
    .filter(c => c.productos.length);
}
// Precio de un producto: solo si la librería lo dio («$45 MXN»); sin precio, nada (ni «por confirmar»).
export const precioCarta = n => (typeof n === 'number' && Number.isFinite(n) && n >= 0 ? `$${Math.round(n)} MXN` : null);
// «Preguntar por la carta»: WhatsApp con el mensaje listo, con la categoría a la vista.
const noun = cat => String(cat?.nombre ?? 'café y té').toLocaleLowerCase('es');
export const cartaMessage = cat => `Hola, quisiera preguntar por la carta de ${noun(cat)}. ¿Qué tienen hoy?`;
export function cartaUrl(cat) {
  const url = new URL(`https://wa.me/${WA_NUMBER}`);
  url.searchParams.set('text', cartaMessage(cat));
  return url.href;
}

const make = (tag, cls, text) => {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
};
// Tarjeta tipográfica (superficie, sin fotos de producto): icono de trazo de la categoría, nombre, descripción y, si existe, el precio.
export function cartaCard(p, cat) {
  const li = make('li', 'cafe-item');
  const card = make('div', 'cafe-card c3d-card');
  card.setAttribute('role', 'group');
  card.setAttribute('aria-roledescription', 'bebida');
  card.setAttribute('aria-label', p.nombre);
  card.dataset.inclina = '';
  card.tabIndex = -1;
  const icon = cat.icono && document.getElementById(`c-${cat.icono}`) ? cat.icono : null; // sin icono en el sprite, la tarjeta va sin él
  if (icon) {
    const box = make('span', 'cafe-ic');
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    svg.setAttribute('class', 'ic'); svg.setAttribute('aria-hidden', 'true');
    const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    use.setAttribute('href', `#c-${icon}`);
    svg.append(use); box.append(svg); card.append(box);
  }
  card.append(make('span', 'cafe-nombre', p.nombre));
  if (p.descripcion) card.append(make('span', 'cafe-desc', p.descripcion));
  const precio = precioCarta(p.precio);
  if (precio) { const s = make('span', 'cafe-precio', precio); s.dataset.fuente = 'carta'; card.append(s); }
  li.append(card);
  return li;
}

let menuLoad;
const loadMenu = () => (menuLoad ??= fetch(MENU_URL).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); }).catch(e => { menuLoad = undefined; throw e; }));

export async function initCafe({ isMotion = () => false } = {}) {
  const root = document.querySelector('[data-cafe]');
  if (!root || root.dataset.ready) return;
  root.dataset.ready = '1';
  const $ = s => document.querySelector(s);
  const chipsEl = $('[data-cafe-chips]');
  const region = $('[data-cafe-c3d]');
  const viewport = $('[data-cafe-viewport]');
  const track = $('[data-cafe-track]');
  const live = $('[data-cafe-live]');
  const status = $('[data-cafe-status]');
  const ask = $('[data-cafe-ask]');

  let cats;
  try { cats = validMenu(await loadMenu()); } catch { cats = []; }
  if (!cats.length) { // sin carta no se promete nada: queda la foto y «Preguntar por la carta»
    root.dataset.state = 'vacio';
    chipsEl.replaceChildren();
    track.replaceChildren();
    track.removeAttribute('aria-busy');
    status.textContent = '';
    delete root.dataset.ready;
    return;
  }

  let list = [], current = null;
  const c3d = createCarousel3D({
    viewport, track, live, isMotion,
    prev: $('[data-cafe-prev]'), next: $('[data-cafe-next]'),
    focusSel: '.cafe-card',
    liveText: i => `${list[i].nombre}. ${i + 1} de ${list.length}.`
  });
  let paintId = 0;
  async function show(id, announce, immediate = false) {
    const cat = cats.find(c => c.id === id) ?? cats[0];
    current = cat.id;
    checkChip(chipsEl, cat.id, '.cafe-chip');
    ask.href = cartaUrl(cat);
    const mine = ++paintId;
    if (!immediate) await afterPaint();
    if (mine !== paintId) return;
    list = cat.productos;
    const items = list.map(p => cartaCard(p, cat));
    track.replaceChildren(...items);
    track.removeAttribute('aria-busy');
    region.setAttribute('aria-label', `Carta: ${cat.nombre}`);
    c3d.setItems(items);
    if (announce) live.textContent = `${cat.nombre}: ${list.length} en la carta.`;
  }
  chipsEl.replaceChildren(...cats.map(c => {
    const b = make('button', 'chip cafe-chip', c.nombre);
    b.type = 'button';
    b.setAttribute('role', 'radio');
    b.setAttribute('aria-checked', 'false');
    b.dataset.id = c.id;
    return b;
  }));
  wireRadioChips(chipsEl, { selector: '.cafe-chip', current: () => current, choose: chip => { if (chip.dataset.id !== current) show(chip.dataset.id, true); } });
  await show(cats[0].id, false, true);
  root.classList.add('is-ready');
}
