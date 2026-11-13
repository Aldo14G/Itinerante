// Eventos y talleres (Cartelera) sin inventar nada: «Compartir» es local (no se envía nada y no hay contadores) y el estado de cada
// propuesta es «Propuesta · sin fecha» hasta que la librería confirme una fecha. Las propuestas van en un Carrusel3D, variante «evento»
// (carousel3d.js, 2026-11-13): tarjeta con foto, insignias y título; debajo, la descripción de la del centro (región viva) y una sola fila de
// acciones («Preguntar por WhatsApp» con el título de la del centro y «Compartir»). Se carga al acercarse a la sección o al primer toque.
// Las historias de los destacados se retiraron el 2026-11-11, «Me interesa» el 2026-11-13 y los puntos bajo el carrusel también el 2026-11-13.
import { notify } from './saved.js';
import { createCarousel3D } from './carousel3d.js';

// ---------- Estado de la propuesta: «Propuesta · sin fecha» o la fecha confirmada ----------
// Cómo se actualiza: cuando la librería confirma una fecha, se añade `data-fecha="AAAA-MM-DD"` (o `AAAA-MM-DDTHH:MM`, hora de Monterrey)
// al <details class="bill-item"> de esa propuesta en index.html. Sin atributo, con un valor que no es una fecha real o con una fecha que ya
// pasó, la insignia dice «Propuesta · sin fecha»: nunca se anuncia una fecha que no esté confirmada y vigente.
const MTY = 'America/Monterrey';
export const NO_DATE = 'Propuesta · sin fecha';
const dayKey = date => new Intl.DateTimeFormat('en-CA', { timeZone: MTY, year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); // AAAA-MM-DD en Monterrey

export function eventBadge(fecha, now = new Date()) {
  const quiet = { kind: 'propuesta', text: NO_DATE };
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T([01]\d|2[0-3]):([0-5]\d))?$/.exec(String(fecha ?? '').trim());
  if (!m) return quiet;
  const [, y, mo, d, h, mi] = m;
  const noon = new Date(Date.UTC(+y, +mo - 1, +d, 18)); // mediodía en Monterrey (UTC−6 todo el año): el día no cambia al dar formato
  if (noon.getUTCMonth() !== +mo - 1 || noon.getUTCDate() !== +d) return quiet; // 31 de febrero y similares
  const key = `${y}-${mo}-${d}`;
  const today = dayKey(now);
  if (key < today) return quiet;
  const parts = new Intl.DateTimeFormat('es-MX', { timeZone: MTY, weekday: 'short', day: 'numeric', month: 'short' }).formatToParts(noon);
  const part = type => (parts.find(p => p.type === type)?.value ?? '').replace('.', '');
  const weekday = part('weekday');
  let text = key === today ? 'Hoy' : `${weekday.charAt(0).toUpperCase()}${weekday.slice(1)} ${part('day')} ${part('month')}${y === today.slice(0, 4) ? '' : ` ${y}`}`;
  if (h) text += ` · ${h}:${mi}`;
  return { kind: key === today ? 'hoy' : 'fecha', text, date: key };
}

function paintWhen(item) {
  const el = item.querySelector('[data-bill-when]');
  if (!el) return;
  const badge = eventBadge(item.dataset.fecha);
  el.textContent = badge.text;
  el.classList.toggle('badge--quiet', badge.kind === 'propuesta'); // lo confirmado lleva la insignia menta; lo que no, la callada
}

// ---------- «Compartir» ----------
export async function shareItem(btn) {
  const title = btn.dataset.title || 'Cartelera';
  const url = `${location.origin}${location.pathname}#cartelera`;
  const item = btn.closest?.('.bill-item') ?? (typeof document !== 'undefined' ? document.querySelector?.(`.bill-item[data-id="${btn.dataset.share}"]`) : null); // «Compartir» va en la fila de acciones, no dentro de la tarjeta
  const when = eventBadge(item?.dataset.fecha);
  const state = when.kind === 'propuesta' ? 'una propuesta de la Cartelera de Librería Itinerante y Más (sin fecha confirmada todavía)' : `${when.text} en Librería Itinerante y Más`;
  const data = { title: `${title} · Librería Itinerante y Más`, text: `${title}: ${state}.`, url };
  if (navigator.share) {
    try { await navigator.share(data); return; } catch (e) { if (e?.name === 'AbortError') return; /* sin hoja de compartir: se copia */ }
  }
  try { await navigator.clipboard.writeText(url); notify('Enlace copiado.'); } catch { notify('No se pudo copiar. Copia la dirección desde el navegador.'); }
}

export function onAct(btn) {
  if (btn.matches('[data-share]')) return shareItem(btn);
}

// Nombre accesible de «Compartir»: es un control de icono, así que el nombre lleva la acción y el título de la propuesta.
// Sin esto las tres propuestas tendrían el mismo nombre para un lector de pantalla. El marcado ya lo trae; aquí se mantiene al día con data-title.
export const shareName = title => `Compartir «${title || 'esta propuesta'}»`;
const paintShare = btn => btn.setAttribute('aria-label', shareName(btn.dataset.title));

export function initFeed() {
  document.querySelectorAll('[data-share]').forEach(paintShare);
  document.querySelectorAll('.bill-item').forEach(paintWhen);
}

// ---------- La propuesta del centro: su descripción y la fila de acciones ----------
// Lo que la fila necesita de cada tarjeta: id, título, descripción y el enlace de WhatsApp con su mensaje (todo sale del marcado).
export function eventOf(item) {
  const q = s => item.querySelector(s);
  return { id: item.dataset.id, title: q('.bill-title')?.textContent.trim() ?? '', text: q('.bill-detail > p')?.textContent.trim() ?? '', wa: q('.bill-wa')?.getAttribute('href') ?? '' };
}
export const waName = title => `Preguntar por WhatsApp: ${title}`;

// Reserva de la descripción (--bill-reserva): la más larga de las propuestas a este ancho, medida de una vez en una copia oculta. Cambiar de
// tarjeta no mueve las acciones y el aire de la descripción a la fila es de 24 en la más larga (antes se reservaban 3 o 4 renglones fijos).
export function measureDescs(pie, texts) {
  if (!pie?.isConnected || !texts.length) return 0;
  const probe = document.createElement('div');
  probe.className = 'bill-medida';
  probe.setAttribute('aria-hidden', 'true');
  probe.append(...texts.map(t => { const p = document.createElement('p'); p.className = 'bill-desc'; p.textContent = t; return p; }));
  pie.append(probe);
  const max = Math.max(...[...probe.children].map(n => n.getBoundingClientRect().height));
  probe.remove();
  if (max > 0) pie.style.setProperty('--bill-reserva', `${Math.ceil(max)}px`);
  return max;
}

export function initEventos({ isMotion = () => false } = {}) {
  const region = document.querySelector('[data-bill-c3d]');
  if (!region || region.dataset.ready) return;
  region.dataset.ready = '1';
  initFeed();
  const items = [...region.querySelectorAll('.bill-item')];
  const events = items.map(eventOf);
  const descTitle = document.querySelector('[data-bill-desc-title]');
  const descText = document.querySelector('[data-bill-desc-text]');
  const wa = document.querySelector('[data-bill-wa]');
  const share = document.querySelector('.bill-fila [data-share]');
  createCarousel3D({
    viewport: region.querySelector('[data-bill-viewport]'),
    track: region.querySelector('[data-bill-track]'),
    prev: region.querySelector('[data-bill-prev]'),
    next: region.querySelector('[data-bill-next]'),
    isMotion,
    focusSel: '.bill-card',
    onCenter: i => {
      const ev = events[i];
      if (descText.textContent !== ev.text) { descTitle.textContent = `${ev.title}. `; descText.textContent = ev.text; } // la región viva dice la propuesta del centro
      wa.href = ev.wa;
      wa.setAttribute('aria-label', waName(ev.title));
      share.dataset.share = ev.id;
      share.dataset.title = ev.title;
      paintShare(share);
    }
  }).setItems(items);
  const pie = document.querySelector('[data-bill-pie]');
  measureDescs(pie, events.map(e => e.text));
  if ('ResizeObserver' in window) { // otro ancho (giro del teléfono, ventana): se vuelve a medir una vez por fotograma
    let w = 0, raf = 0;
    new ResizeObserver(([e]) => { const nw = Math.round(e.contentRect.width); if (nw === w) return; w = nw; if (!raf) raf = requestAnimationFrame(() => { raf = 0; measureDescs(pie, events.map(x => x.text)); }); }).observe(pie);
  }
  region.classList.add('is-ready');
}
