// Merch (2026-11-19): artículos de la librería, preparado y OCULTO hasta que haya productos. Mismo patrón que Novedades y Eventos: los datos viven en
// assets/data/merch.json (`productos`, hoy vacío) y, **mientras no haya productos válidos, no existe nada**: ni la sección #merch en el DOM, ni su entrada en la
// barra de escritorio ni en el ☰, ni su zona en el destino actual (app.js). Con productos válidos aparece sola entre Café y Visita.
// Cada producto: id, nombre, tipo, descripcion (o null), precio (número o null: con null no se imprime nada), foto { src, alt, chica? } (ruta local registrada como real
// en assets/provenance.json) o null, disponibilidad ("hay", "encargo" o null). **El sitio nunca afirma existencia**: la tarjeta es un enlace a WhatsApp,
// «Consultar disponibilidad», con el producto y su precio ya escritos (como la ficha del libro); sin carrito ni pagos. «encargo» solo rotula «Por encargo»; «hay» no
// imprime nada (una nota de la librería para ella: el sitio no la usa para decir «disponible»).
// Postel con lo que deje el proceso externo: un id repetido se pinta una vez (gana el primero), un precio inválido se toma como null, una foto que no sea local o no
// lleve alt se descarta (queda la tarjeta con su icono) y un valor desconocido de `disponibilidad` se toma como null; `merchProblems` lo reporta todo (npm test).
export const MERCH_URL = 'assets/data/merch.json';
export const WA_NUMBER = '528180875940';
const ID = /^[a-z0-9]+(-[a-z0-9]+)*$/;
const FOTO_LOCAL = /^assets\/img\/merch\/[a-z0-9][a-z0-9-]*\.(webp|jpg|jpeg|png)$/;
export const DISPONIBILIDAD = ['hay', 'encargo'];
const texto = (v, max) => (typeof v === 'string' && v.trim() && v.trim().length <= max ? v.trim() : null);

/** «$85 MXN» (o «$85.50 MXN»); null si no hay un precio válido: entonces no se imprime nada. */
export function precioMerch(n) {
  if (typeof n !== 'number' || !Number.isFinite(n) || n <= 0 || n > 100000) return null;
  return `$${Number.isInteger(n) ? n : n.toFixed(2)} MXN`;
}
/** La foto de un producto: { src, alt, chica } si es local y trae alt; si no, null. `chica` (la de 600, opcional) solo si también es local. */
export function validFotoMerch(f) {
  if (!f || typeof f !== 'object') return null;
  const alt = texto(f.alt, 200);
  if (typeof f.src !== 'string' || !FOTO_LOCAL.test(f.src) || !alt) return null;
  const chica = typeof f.chica === 'string' && FOTO_LOCAL.test(f.chica) ? f.chica : null;
  return { src: f.src, alt, chica };
}
/** Los productos válidos de un merch.json, en su orden. */
export function validMerch(data) {
  const lista = data && typeof data === 'object' && Array.isArray(data.productos) ? data.productos : [];
  const vistos = new Set();
  const out = [];
  for (const p of lista) {
    if (!p || typeof p !== 'object' || typeof p.id !== 'string' || !ID.test(p.id) || vistos.has(p.id)) continue;
    const nombre = texto(p.nombre, 80);
    if (!nombre) continue;
    vistos.add(p.id);
    out.push({
      id: p.id, nombre, tipo: texto(p.tipo, 40), descripcion: texto(p.descripcion, 200), precio: precioMerch(p.precio) ? p.precio : null,
      foto: validFotoMerch(p.foto), disponibilidad: DISPONIBILIDAD.includes(p.disponibilidad) ? p.disponibilidad : null
    });
  }
  return out;
}
/** Todo lo que está mal en un merch.json (lista vacía = pasa). `opts.fotoExiste(src)` y `opts.fotoRegistrada(src)` revisan el disco y provenance.json. */
export function merchProblems(data, opts = {}) {
  const out = [];
  if (!data || typeof data !== 'object' || !Array.isArray(data.productos)) return ['falta `productos` (lista; vacía mientras no haya artículos)'];
  const vistos = new Set();
  data.productos.forEach((p, i) => {
    const en = `productos[${i}]${p && p.id ? ` (${p.id})` : ''}`;
    if (!p || typeof p !== 'object') { out.push(`${en}: no es un objeto`); return; }
    if (typeof p.id !== 'string' || !ID.test(p.id)) out.push(`${en}: id en minúsculas, cifras y guiones`);
    else if (vistos.has(p.id)) out.push(`${en}: id repetido`); else vistos.add(p.id);
    if (!texto(p.nombre, 80)) out.push(`${en}: falta el nombre (máx. 80 caracteres)`);
    if (!texto(p.tipo, 40)) out.push(`${en}: falta el tipo (máx. 40 caracteres)`);
    if (p.descripcion !== null && p.descripcion !== undefined && !texto(p.descripcion, 200)) out.push(`${en}: descripcion es texto de hasta 200 caracteres o null`);
    if (p.precio !== null && p.precio !== undefined && !precioMerch(p.precio)) out.push(`${en}: precio es un número positivo o null (con null no se imprime nada)`);
    if (p.disponibilidad !== null && p.disponibilidad !== undefined && !DISPONIBILIDAD.includes(p.disponibilidad)) out.push(`${en}: disponibilidad es "hay", "encargo" o null (el sitio nunca afirma existencias)`);
    if (p.foto !== null && p.foto !== undefined) {
      const f = validFotoMerch(p.foto);
      if (!f) out.push(`${en}: foto necesita src local (assets/img/merch/….webp) y alt`);
      else for (const src of [f.src, f.chica].filter(Boolean)) {
        if (opts.fotoExiste && !opts.fotoExiste(src)) out.push(`${en}: la foto ${src} no existe en el disco`);
        if (opts.fotoRegistrada && !opts.fotoRegistrada(src)) out.push(`${en}: la foto ${src} no está registrada como real en assets/provenance.json`);
      }
    }
  });
  return out;
}
/** El mensaje de WhatsApp de un producto: «Hola, quiero consultar la disponibilidad de «X» (por encargo, $85 MXN).» */
export function merchMessage(p) {
  const datos = [p.disponibilidad === 'encargo' ? 'por encargo' : null, precioMerch(p.precio)].filter(Boolean);
  return `Hola, quiero consultar la disponibilidad de «${p.nombre}»${datos.length ? ` (${datos.join(', ')})` : ''}.`;
}
export const merchWaUrl = p => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(merchMessage(p))}`;

// ---------------------------------------------------------------------------------------------------------------------------------------
// Montaje (solo con productos válidos). Una sola vez.
const SVG = 'http://www.w3.org/2000/svg';
const el = (tag, cls, ...kids) => { const n = document.createElement(tag); if (cls) n.className = cls; n.append(...kids.filter(k => k != null)); return n; };
const icono = (id, cls = 'ic') => { const s = document.createElementNS(SVG, 'svg'); s.setAttribute('class', cls); s.setAttribute('aria-hidden', 'true'); const u = document.createElementNS(SVG, 'use'); u.setAttribute('href', `#${id}`); s.append(u); return s; };

function precioNodo(n) { const s = el('span', 'merch-precio', precioMerch(n)); s.dataset.fuente = 'merch'; return s; }
function foto(p) {
  const caja = el('span', 'merch-foto');
  caja.dataset.kind = 'real';
  const marca = icono('c-merch', 'ic merch-ic');
  caja.append(marca);
  if (p.foto) {
    const img = document.createElement('img');
    img.src = p.foto.src;
    if (p.foto.chica) { img.srcset = `${p.foto.chica} 600w, ${p.foto.src} 1200w`; img.sizes = '(min-width: 1024px) 270px, (min-width: 761px) 30vw, 46vw'; }
    img.alt = p.foto.alt; // lo que se ve en la foto (el nombre del producto va en el texto de la tarjeta)
    img.loading = 'lazy'; img.decoding = 'async';
    img.addEventListener('error', () => img.remove(), { once: true }); // si no carga, queda el icono
    caja.append(img);
  }
  return caja;
}
/** La tarjeta de un producto (TarjetaMerch): un enlace a WhatsApp con foto cuadrada, tipo, nombre, descripción, precio y «Consultar disponibilidad». */
export function merchCard(p) {
  const tipoLinea = [p.tipo, p.disponibilidad === 'encargo' ? 'Por encargo' : null].filter(Boolean).join(' · ');
  const a = el('a', 'merch-card');
  a.href = merchWaUrl(p); a.target = '_blank'; a.rel = 'noopener noreferrer';
  a.append(...[
    foto(p),
    tipoLinea ? el('span', 'merch-tipo', tipoLinea) : null,
    el('span', 'merch-nom', p.nombre),
    p.descripcion ? el('span', 'merch-desc', p.descripcion) : null,
    precioMerch(p.precio) ? precioNodo(p.precio) : null,
    el('span', 'merch-accion', icono('i-chat'), el('span', null, 'Consultar disponibilidad'))
  ].filter(Boolean)); // append(null) escribiría el texto «null»
  const li = el('li', 'merch-item', a);
  li.dataset.id = p.id;
  return li;
}
/** La sección #merch con sus tarjetas. */
export function merchSection(productos) {
  const s = el('section', 'merch');
  s.id = 'merch'; s.setAttribute('aria-labelledby', 'merch-title'); s.dataset.merch = '';
  const h = el('h2', 'h2'); h.id = 'merch-title'; h.append('Merch ', el('em', null, 'de la casa'));
  s.append(el('header', 'sec-head', h, el('p', 'sec-texto', 'Artículos de la librería. Toca el que te interese para consultar su disponibilidad.')), el('ul', 'merch-grid', ...productos.map(merchCard)));
  s.querySelector('.merch-grid').setAttribute('aria-label', 'Artículos de la librería');
  return s;
}

let montado = false;
/** Pide merch.json y, si hay productos válidos, monta la sección y sus entradas (barra de escritorio y ☰). Sin productos no toca nada. */
export async function initMerch() {
  if (montado || typeof document === 'undefined' || document.getElementById('merch')) return false;
  let data = null;
  try { const r = await fetch(MERCH_URL); data = r.ok ? await r.json() : null; } catch { /* sin datos: no hay merch que anunciar */ }
  const productos = validMerch(data);
  const visita = document.getElementById('visita');
  if (!productos.length || !visita) return false;
  montado = true;
  visita.before(merchSection(productos));
  document.documentElement.classList.add('has-merch');
  // Entradas: la barra de escritorio y el ☰, entre Café y lo que sigue (Visita y La casa). Sin entrada en la barra inferior (Inicio, Catálogo, Mi lista).
  const nav = document.querySelector('.hdr-nav a[href="#cafe"]');
  if (nav) { const a = el('a', null, 'Merch'); a.href = '#merch'; nav.after(a); }
  const fila = document.querySelector('.menu-lista a.menu-row[href="#cafe"]')?.closest('li');
  if (fila) { const a = el('a', 'menu-row', el('span', null, 'Merch'), icono('t-chevron')); a.href = '#merch'; const li = el('li', null, a); fila.after(li); }
  document.dispatchEvent(new CustomEvent('iti:merch', { detail: { n: productos.length } })); // app.js: zona del destino actual y enlaces
  if (location.hash === '#merch') document.getElementById('merch').scrollIntoView();
  return true;
}
