// Novedades: lo que ha llegado a la casa. Se alimenta de `novedades.entradas` de assets/data/collections.json, una lista de
// { "id": "…", "llegada": "AAAA-MM-DD" }: para actualizarla basta añadir renglones al JSON (no hay que tocar HTML ni JS).
// Sin entradas no existe: la sección, su casilla en la barra, sus enlaces y el control del inicio quedan ocultos.
// Nunca se simula ni se presenta como ranking: solo muestra lo que la librería ponga en la lista. La fecha de llegada no se
// imprime; sirve para ordenar (lo más reciente primero) y para saber qué es «Nuevo» para esta persona.
// Este módulo es ligero a propósito (el conteo se pide pronto): el carrusel y el catálogo se importan solo al pintar la tira.
import { loadSample, loadCollections } from './sample.js';
import { DUR } from './motion.js';

export const NEWS_SIZE = 12;
export const NEW_DAYS = 14; // primera visita: cuentan como nuevas las llegadas de las últimas dos semanas
const SEEN_KEY = 'iti-news-visto'; // fecha (AAAA-MM-DD) de la última vez que esta persona vio Novedades
const STATE_KEY = 'iti-news-estado'; // lo que boot.js reserva antes del primer render: n = sin novedades, s = sin pendientes, p = con pendientes

// ---------------------------------------------------------------------------------------------
// Lógica pura (se prueba con fechas en tests/site.test.mjs)

/** Fecha local del dispositivo como AAAA-MM-DD. */
/** El día (AAAA-MM-DD) en hora de Monterrey, el mismo reloj que el estado de apertura y las fechas de los eventos. Sin soporte de zonas horarias, el día local del dispositivo. */
export function isoDay(date = new Date()) {
  try { return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Monterrey', year: 'numeric', month: '2-digit', day: '2-digit' }).format(date); }
  catch { return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`; }
}

/** ¿Es una fecha real escrita como AAAA-MM-DD? (2026-02-30 no lo es). */
export function validDay(value) {
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const d = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(d.getTime()) && d.toISOString().slice(0, 10) === value;
}

const dayNumber = day => Math.round(Date.parse(`${day}T00:00:00Z`) / 86_400_000);

/**
 * ¿Esta llegada es nueva para la persona? Con `visto` (la fecha de su última visita a Novedades): llegó después.
 * Sin `visto` (primera visita o sin almacenamiento): llegó en los últimos NEW_DAYS días, contando hoy.
 * Una entrada sin fecha nunca es nueva.
 */
export function isNew(llegada, { visto = null, hoy } = {}) {
  if (!validDay(llegada)) return false;
  if (validDay(visto)) return llegada > visto;
  return validDay(hoy) && dayNumber(hoy) - dayNumber(llegada) < NEW_DAYS;
}

/**
 * Entradas válidas de la lista, lo más reciente primero (a igual fecha, el orden del JSON). Una entrada vale si trae `id`;
 * las que aún no llegan (fecha posterior a hoy) esperan su día. Compatibilidad: una entrada sin fecha válida, o la clave
 * antigua `ids`, se muestra al final y nunca lleva «Nuevo».
 */
export function newsEntries(data, hoy) {
  const col = data?.novedades;
  const raw = Array.isArray(col?.entradas) ? col.entradas : Array.isArray(col?.ids) ? col.ids.map(id => ({ id })) : [];
  const seen = new Set();
  const list = [];
  for (const e of raw) {
    const id = typeof e?.id === 'string' ? e.id : '';
    if (!id || seen.has(id)) continue;
    const llegada = validDay(e.llegada) ? e.llegada : null;
    if (llegada && validDay(hoy) && llegada > hoy) continue;
    seen.add(id);
    list.push({ id, llegada });
  }
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.llegada === b.e.llegada ? a.i - b.i : !a.e.llegada ? 1 : !b.e.llegada ? -1 : a.e.llegada < b.e.llegada ? 1 : -1))
    .map(x => x.e);
}

/** Línea de estado de la cabecera. Solo cuenta lo que hay en la lista; sin pendientes en una primera visita no afirma que la persona ya lo vio. */
export function statusLine(n, primera) {
  if (n > 0) {
    const verbo = n === 1 ? '1 llegó' : `${n} llegaron`;
    return primera ? `${verbo} en las últimas dos semanas` : `${verbo} desde tu última visita`;
  }
  return primera ? 'Lo más reciente que ha llegado a la casa' : 'Ya viste todo lo que ha llegado';
}

/** Rótulo del control del inicio (solo existe con n > 0). En una primera visita no hay «tu visita» que citar. */
export function hintLine(n, primera) {
  if (primera) return n === 1 ? '1 novedad reciente' : `${n} novedades recientes`;
  return n === 1 ? '1 novedad desde tu visita' : `${n} novedades desde tu visita`;
}

/**
 * Plan de la sección: qué libros (las entradas cuyo id existe en `books`, en orden, hasta NEWS_SIZE), cuáles son nuevos y qué
 * dice la cabecera. Sin `books` (el conteo temprano, antes de pedir el catálogo) confía en los ids del JSON.
 * `show` es falso sin entradas válidas.
 */
export function newsPlan(books, data, { visto = null, hoy = isoDay() } = {}) {
  const entries = newsEntries(data, hoy);
  const byId = books ? new Map(books.map(b => [b.id, b])) : null;
  const kept = (byId ? entries.filter(e => byId.has(e.id)) : entries).slice(0, NEWS_SIZE);
  const nuevos = kept.filter(e => isNew(e.llegada, { visto, hoy })).map(e => e.id);
  const primera = !validDay(visto);
  return {
    show: kept.length > 0,
    books: byId ? kept.map(e => byId.get(e.id)) : [],
    ids: kept.map(e => e.id),
    nuevos,
    n: nuevos.length,
    primera,
    estado: statusLine(nuevos.length, primera),
    titulo: data?.novedades?.titulo || 'Recién llegados'
  };
}

// ---------------------------------------------------------------------------------------------
// Interfaz (solo navegador)

const store = () => { try { return globalThis.localStorage ?? null; } catch { return null; } };
const readSeen = () => { try { const v = store()?.getItem(SEEN_KEY); return validDay(v) ? v : null; } catch { return null; } };
const writeSeen = day => { try { store()?.setItem(SEEN_KEY, day); } catch { /* sin almacenamiento: la próxima visita vuelve a ser la primera */ } };
const writeState = s => { try { store()?.setItem(STATE_KEY, s); } catch { /* sin almacenamiento */ } };

let visto; // la fecha con la que se pinta esta visita; no cambia mientras la persona mira la sección
let shown = null; // último plan aplicado

// El renglón del control del inicio se reserva antes del primer render (boot.js, clase news-hint). Si la reserva no coincide con
// lo que resultó, se corrige cuando el inicio está fuera de la vista: así nada salta a los ojos de la persona.
function settleHint(wanted) {
  const root = document.documentElement;
  const entry = document.getElementById('inicio');
  if (root.classList.contains('news-hint') === wanted) return;
  if (!entry || !('IntersectionObserver' in window)) { root.classList.toggle('news-hint', wanted); return; }
  const io = new IntersectionObserver(es => {
    if (es.some(e => e.isIntersecting)) return;
    io.disconnect();
    root.classList.toggle('news-hint', shown ? shown.n > 0 : wanted);
  });
  io.observe(entry);
}

// Aplica el plan a todo lo que depende de él fuera de la tira: existencia de la sección y sus enlaces, punto de la casilla,
// control del inicio y línea de estado.
function apply(plan, { remember = true } = {}) {
  shown = plan;
  const root = document.documentElement;
  const section = document.querySelector('[data-news]');
  root.classList.toggle('has-news', plan.show);
  if (section) section.hidden = !plan.show;
  document.querySelectorAll('[data-news-link]').forEach(l => { l.hidden = !plan.show; });
  const n = plan.show ? plan.n : 0;
  document.querySelectorAll('[data-news-dot]').forEach(d => { d.hidden = n === 0; });
  document.querySelectorAll('[data-news-sr]').forEach(s => { s.textContent = n ? `, ${n} sin ver` : ''; });
  const cta = document.querySelector('[data-news-cta]');
  if (cta) {
    if (n) cta.querySelector('[data-news-cta-text]').textContent = hintLine(n, plan.primera);
    cta.hidden = n === 0;
  }
  const status = section?.querySelector('[data-news-status]');
  if (status && plan.show && status.textContent !== plan.estado) status.textContent = plan.estado;
  settleHint(n > 0);
  if (remember) writeState(!plan.show ? 'n' : n ? 'p' : 's');
}

let counted;
/**
 * Conteo temprano: solo pide collections.json (pequeño) para decidir si la sección existe y cuántas llegadas no ha visto la
 * persona. No pinta libros ni pide el catálogo; no bloquea el primer render (app.js lo llama después de la foto y las fuentes).
 */
export function initNewsCount() {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return (counted ??= (async () => {
    visto = readSeen();
    let plan = { show: false, n: 0 }, ok = true;
    try { plan = newsPlan(null, await loadCollections(), { visto, hoy: isoDay() }); } catch { ok = false; counted = undefined; } // sin datos no se promete nada
    apply(plan, { remember: ok }); // un fallo de red no se recuerda: la próxima visita vuelve a reservar
    if (plan.show && location.hash === '#novedades') document.getElementById('novedades')?.scrollIntoView(); // el ancla no existía al cargar
    return plan;
  })());
}

// Progreso, flechas y foco de la tira: lo mismo que hace el carrusel de colecciones con su propio marcado.
function wireScroll(section, viewport, track, isMotion) {
  const prev = section.querySelector('[data-news-prev]');
  const next = section.querySelector('[data-news-next]');
  const thumb = section.querySelector('[data-news-thumb]');
  const sync = () => {
    const max = track.scrollWidth - viewport.clientWidth;
    const p = max > 0 ? viewport.scrollLeft / max : 0;
    const w = track.scrollWidth ? viewport.clientWidth / track.scrollWidth : 1;
    thumb.style.width = `${Math.max(8, Math.min(100, w * 100)).toFixed(1)}%`;
    thumb.style.transform = `translateX(${(p * (100 / Math.max(w, 0.01) - 100)).toFixed(1)}%)`;
    prev.disabled = viewport.scrollLeft <= 2;
    next.disabled = viewport.scrollLeft >= max - 2;
    section.classList.toggle('is-static', max <= 2);
  };
  const go = dir => {
    const first = track.firstElementChild;
    const step = first ? first.getBoundingClientRect().width + parseFloat(getComputedStyle(track).columnGap || 0) : viewport.clientWidth;
    viewport.scrollBy({ left: dir * Math.max(step, viewport.clientWidth * 0.85), behavior: isMotion() ? 'smooth' : 'auto' });
  };
  prev.addEventListener('click', () => go(-1));
  next.addEventListener('click', () => go(1));
  viewport.addEventListener('scroll', () => requestAnimationFrame(sync), { passive: true });
  viewport.addEventListener('keydown', e => {
    if (e.target !== viewport) return;
    if (e.key === 'ArrowRight') { e.preventDefault(); go(1); }
    if (e.key === 'ArrowLeft') { e.preventDefault(); go(-1); }
  });
  track.addEventListener('focusin', e => { // Tab: la tarjeta asomada que recibe el foco se alinea al inicio
    const item = e.target.closest('.rail-item');
    if (!item) return;
    const pad = parseFloat(getComputedStyle(viewport).scrollPaddingInlineStart) || 0;
    const v = viewport.getBoundingClientRect();
    const b = item.getBoundingClientRect();
    if (b.left >= v.left + pad - 1 && b.right <= v.right - pad + 1) return;
    viewport.scrollBy({ left: b.left - v.left - pad, behavior: isMotion() ? 'smooth' : 'auto' });
  });
  if ('ResizeObserver' in window) new ResizeObserver(sync).observe(viewport);
  sync();
}

const badge = () => {
  const b = document.createElement('span');
  b.className = 'badge-new';
  b.textContent = 'Nuevo';
  return b;
};

// «Visto»: la fecha se guarda cuando la sección está en pantalla de verdad (la mitad de la sección, o media ventana si la sección
// no cabe, durante un momento: pasar de largo no cuenta). Lo que se ve no cambia mientras la persona mira: las insignias, el
// punto y el control se retiran al salir de la sección; la línea de estado y el orden ya valen para la siguiente visita.
function watchSeen(section, track) {
  if (!('IntersectionObserver' in window)) return;
  let timer = 0, seen = false;
  const io = new IntersectionObserver(([e]) => {
    const half = e.isIntersecting && (e.intersectionRatio >= 0.5 || e.intersectionRect.height >= (e.rootBounds?.height ?? innerHeight) * 0.5);
    if (e.isIntersecting) section.classList.add('is-in'); // las insignias «Nuevo» aparecen con su rebote al entrar la sección
    if (half && !seen && !timer) timer = setTimeout(() => { timer = 0; seen = true; writeSeen(isoDay()); writeState('s'); }, DUR('scene'));
    if (!half && timer) { clearTimeout(timer); timer = 0; }
    if (!e.isIntersecting && seen) {
      io.disconnect();
      visto = isoDay();
      track.querySelectorAll('.badge-new').forEach(b => b.remove());
      apply({ ...shown, nuevos: [], n: 0, primera: false, estado: statusLine(0, false) });
    }
  }, { threshold: [0, 0.25, 0.5, 0.75, 1] });
  io.observe(section);
}

/** Pinta la tira (al acercarse a la sección): pide el catálogo, comprueba los ids y arma las tarjetas con la pieza del carrusel. */
export async function initNews({ ensureCatalog, isMotion = () => false } = {}) {
  const section = document.querySelector('[data-news]');
  if (!section || section.dataset.ready) return;
  section.dataset.ready = '1';
  await initNewsCount();
  const track = section.querySelector('[data-news-track]');
  const viewport = section.querySelector('[data-news-viewport]');
  let plan = { show: false, n: 0 }, ok = true;
  let rail, cat;
  try {
    const [sample, data, railMod, catMod, savedMod] = await Promise.all([loadSample(), loadCollections(), import('./rail.js'), import('./catalog.js'), import('./saved.js')]);
    rail = railMod; cat = catMod;
    savedMod.initSaved(); // los marcadores de guardar de las tarjetas
    plan = newsPlan(sample.books, data, { visto, hoy: isoDay() });
  } catch { ok = false; /* sin datos no se promete nada: la sección se retira hasta la próxima carga */ }
  apply(plan, { remember: ok });
  if (!plan.show) { track.replaceChildren(); track.removeAttribute('aria-busy'); return; }
  const tones = cat.coverTones(plan.books);
  const fresh = new Set(plan.nuevos);
  track.replaceChildren(...plan.books.map((b, i) => {
    const li = rail.bookCard(b, tones[i]);
    if (fresh.has(b.id)) li.querySelector('.card').prepend(badge()); // dentro del botón: «Nuevo» entra en su nombre accesible
    return li;
  }));
  track.removeAttribute('aria-busy');
  viewport.setAttribute('aria-label', plan.titulo);
  rail.wireBookOpen(track, ensureCatalog);
  wireScroll(section, viewport, track, isMotion);
  watchSeen(section, track);
}
