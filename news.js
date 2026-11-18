// Novedades (CarruselNovedades): lo que ha llegado a la casa. Se alimenta de `novedades.entradas` de assets/data/collections.json, una lista de
// { "id": "…", "llegada": "AAAA-MM-DD" }: para actualizarla basta añadir renglones al JSON (no hay que tocar HTML ni JS).
// Sin entradas válidas no existe: la sección, su enlace de la barra, su fila del menú y el control del inicio quedan ocultos (crítica minimalista
// del 2026-11-13: una sección llamada «Novedades» que mostraba el catálogo de la A a la Z prometía lo que no tenía).
// Con entradas, la tira muestra esas llegadas (lo más reciente primero) y «Nuevo» en lo que la persona no ha visto; «Ver todo» la despliega en
// rejilla. Nunca se simula ni se presenta como ranking. La fecha no se imprime; sirve para ordenar y para saber qué es «Nuevo».
// Solo lo más reciente (2026-11-16): una llegada de hace más de NEWS_DAYS (45) días no se pinta aunque siga en el JSON, y una entrada sin fecha
// real tampoco (no se puede saber si es reciente). Con todas vencidas, la sección, su enlace, su fila del menú y el control del inicio no existen,
// igual que con la lista vacía. Un id que ya no está en catalog.json se ignora (sin hueco, sin conteo).
// Este módulo es ligero a propósito (el conteo se pide pronto): el catálogo se importa solo al pintar la tira.
import { loadSample, loadCollections } from './sample.js';
import { DUR, EASE, confirmThen } from './motion.js';

export const NEWS_SIZE = 12;
export const NEW_DAYS = 14; // primera visita: cuentan como nuevas las llegadas de las últimas dos semanas
export const NEWS_DAYS = 45; // ventana de Novedades: una llegada de hace más de 45 días (día de Monterrey) ya no se muestra; la de hace 45 todavía
const SEEN_KEY = 'iti-news-visto'; // fecha (AAAA-MM-DD) de la última vez que esta persona vio Novedades
const VENCE_KEY = 'iti-news-vence'; // AAAA-MM-DD hasta el que la llegada más reciente sigue en la ventana: boot.js no reserva la sección pasado ese día
const STATE_KEY = 'iti-news-estado'; // lo que boot.js lee antes del primer render: n = sin llegadas (no hay sección), s = sin pendientes, p = con llegadas sin ver

// ---------------------------------------------------------------------------------------------
// Lógica pura (se prueba con fechas en tests/site.test.mjs)

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
/** El día (AAAA-MM-DD) `n` días después de `day`. */
export const addDays = (day, n) => new Date(Date.parse(`${day}T00:00:00Z`) + n * 86_400_000).toISOString().slice(0, 10);

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
 * Entradas válidas de la lista, lo más reciente primero (a igual fecha, el orden del JSON; el primero de un id repetido gana). Una entrada
 * vale si trae `id` y una `llegada` real que ya ocurrió (las que aún no llegan, con fecha posterior a hoy, esperan su día) y que no es más
 * vieja de NEWS_DAYS días (la de hace 45 días todavía; la de hace 46, no). Sin fecha real no se puede saber si es reciente: no se muestra.
 */
export function newsEntries(data, hoy) {
  const col = data?.novedades;
  const raw = Array.isArray(col?.entradas) ? col.entradas : [];
  const seen = new Set();
  const list = [];
  for (const e of raw) {
    const id = typeof e?.id === 'string' ? e.id : '';
    if (!id || seen.has(id) || !validDay(e.llegada)) continue;
    seen.add(id);
    if (validDay(hoy) && (e.llegada > hoy || dayNumber(hoy) - dayNumber(e.llegada) > NEWS_DAYS)) continue;
    list.push({ id, llegada: e.llegada });
  }
  return list
    .map((e, i) => ({ e, i }))
    .sort((a, b) => (a.e.llegada === b.e.llegada ? a.i - b.i : a.e.llegada < b.e.llegada ? 1 : -1))
    .map(x => x.e);
}

/** Línea de estado de la cabecera. Solo cuenta lo que hay en la lista; sin pendientes en una primera visita no afirma que la persona ya lo vio. */
export function statusLine(n, primera) {
  if (n > 0) {
    const verbo = n === 1 ? '1 llegó' : `${n} llegaron`;
    return primera ? `${verbo} en las últimas dos semanas` : `${verbo} desde tu último vistazo`;
  }
  return primera ? 'Lo más reciente que ha llegado a la casa' : 'Ya viste todo lo que ha llegado. Lo próximo aparecerá aquí.';
}

/** Rótulo del control del inicio (solo existe con n > 0). En una primera visita no hay «tu visita» que citar. */
export function hintLine(n, primera) {
  if (primera) return n === 1 ? '1 novedad reciente' : `${n} novedades recientes`;
  return n === 1 ? '1 novedad desde tu último vistazo' : `${n} novedades desde tu último vistazo`;
}

/**
 * Plan de las llegadas: qué libros llegaron (las entradas cuyo id existe en `books`, en orden, hasta NEWS_SIZE), cuáles son nuevos y
 * qué dice la cabecera. Sin `books` (el conteo temprano, antes de pedir el catálogo) confía en los ids del JSON. `show` es falso sin
 * entradas válidas: entonces la sección no existe.
 */
export function newsPlan(books, data, { visto = null, hoy = isoDay() } = {}) {
  const entries = newsEntries(data, hoy);
  const byId = books ? new Map(books.map(b => [b.id, b])) : null;
  const kept = (byId ? entries.filter(e => byId.has(e.id)) : entries).slice(0, NEWS_SIZE);
  const nuevos = kept.filter(e => isNew(e.llegada, { visto, hoy })).map(e => e.id);
  const primera = !validDay(visto);
  return {
    show: kept.length > 0,
    vence: kept.length ? addDays(kept[0].llegada, NEWS_DAYS) : null, // último día en que la llegada más reciente sigue en la ventana
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
const writeVence = day => { try { if (day) store()?.setItem(VENCE_KEY, day); else store()?.removeItem(VENCE_KEY); } catch { /* sin almacenamiento */ } };

let visto; // la fecha con la que se pinta esta visita; no cambia mientras la persona mira la sección
let shown = null; // último plan de llegadas aplicado (punto, control y línea de estado)

// El renglón del control del inicio solo se reserva antes del primer render (boot.js, clase news-hint) si la visita anterior dejó llegadas sin
// ver. Si lo que resultó no coincide, se corrige cuando el inicio está fuera de la vista: así nada salta a los ojos de la persona.
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

// Aplica el plan a todo lo que depende de él fuera de la tira: existencia de la sección y de sus enlaces (barra y menú), punto, control del
// inicio y línea de estado. Sin llegadas válidas no existe nada de eso.
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
  if (remember) { writeState(!plan.show ? 'n' : n ? 'p' : 's'); writeVence(plan.show ? plan.vence : null); }
}

let counted;
/**
 * Conteo temprano: solo pide collections.json (pequeño) para saber cuántas llegadas no ha visto la persona (punto y control del inicio).
 * No pinta libros ni pide el catálogo; no bloquea el primer render (app.js lo llama después de la foto y las fuentes).
 */
export function initNewsCount() {
  if (typeof document === 'undefined') return Promise.resolve(null);
  return (counted ??= (async () => {
    visto = readSeen();
    let plan = { show: false, n: 0 }, ok = true;
    try {
      const data = await loadCollections();
      plan = newsPlan(null, data, { visto, hoy: isoDay() });
      // Con llegadas vigentes se comprueba que sus libros sigan en el catálogo (el mismo catalog.json que luego usa el Catálogo: una sola carga):
      // un id que ya no existe no cuenta ni deja un punto en la barra. Si el catálogo no llega, se confía en los ids del JSON y la tira corrige.
      if (plan.show) { try { plan = newsPlan((await loadSample()).books, data, { visto, hoy: isoDay() }); } catch { /* se confía en los ids */ } }
    } catch { ok = false; counted = undefined; } // sin datos no se promete nada
    apply(plan, { remember: ok }); // un fallo de red no se recuerda: la próxima visita vuelve a reservar
    if (plan.show && location.hash === '#novedades') document.getElementById('novedades')?.scrollIntoView(); // el ancla no existía al cargar
    return plan;
  })());
}

const make = (tag, cls, text) => { const n = document.createElement(tag); if (cls) n.className = cls; if (text != null) n.textContent = text; return n; };
const badge = () => make('span', 'badge-new', 'Nuevo');

// Un libro de la tira: un solo botón (portada, título y autor) que abre su ficha. «Nuevo» va dentro: entra en su nombre accesible.
function newsItem(b, tone, nuevo, i, cat) {
  let cover;
  if (b.c) cover = cat.imageCover(b, tone, { named: false, eager: i < 6, sizes: cat.CARD_SIZES }); // el título y el autor ya van debajo, a la vista
  else {
    cover = make('span', `cover cover--blank tone-${tone}`);
    cover.dataset.coverTone = tone;
    cover.dataset.coverLayout = cat.coverLayout(b);
    const t = make('span', 'cover-title', b.t), a = make('span', 'cover-author', b.a);
    t.setAttribute('aria-hidden', 'true'); a.setAttribute('aria-hidden', 'true');
    cover.append(t, a);
  }
  const btn = make('button', 'news-book');
  btn.type = 'button';
  btn.dataset.id = b.id;
  btn.setAttribute('aria-haspopup', 'dialog');
  btn.append(cover);
  if (nuevo) btn.append(badge());
  btn.append(make('span', 'news-t', b.t), make('span', 'news-a', b.a));
  const li = make('li', 'news-item');
  li.append(btn);
  return li;
}

// Tocar un libro abre la ficha del catálogo (la misma de siempre); al cerrarla, el foco vuelve al libro.
function wireOpen(track, ensureCatalog, toneOf) {
  track.addEventListener('click', e => {
    const book = e.target.closest('.news-book');
    if (!book) return;
    confirmThen(book, async () => { // el libro confirma el toque ya; la hoja (lo caro) va después de pintar
      try { await ensureCatalog?.(); } catch { return; }
      document.getElementById('cat-drawer')?.addEventListener('close', () => book.isConnected && book.focus({ preventScroll: true }), { once: true });
      document.dispatchEvent(new CustomEvent('iti:open-book', { detail: { id: book.dataset.id, tone: toneOf(book) } }));
    });
  });
}

// «Ver todo» / «Ver menos»: la tira se despliega en rejilla dentro de la misma sección. Cada portada viaja de su lugar en la tira a su lugar en
// la rejilla (FLIP: se mide antes y después y se anima solo transform) mientras la altura de la lista se interpola, en dur-base con
// curva-salida: la página no brinca. «Ver menos» hace lo inverso, regresa la tira al principio y, si la sección quedó arriba, la trae a la
// vista. El foco se queda en el botón. Sin movimiento el cambio es inmediato.
export function wireToggle(section, list, toggle, isMotion = () => false) {
  const set = open => {
    const motion = isMotion();
    const items = [...list.children];
    const before = motion ? items.map(n => n.getBoundingClientRect()) : null;
    const h0 = list.offsetHeight;
    section.classList.toggle('is-open', open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.textContent = open ? 'Ver menos' : 'Ver todo';
    if (!open) {
      list.scrollLeft = 0;
      if (section.getBoundingClientRect().top < 0) section.scrollIntoView({ block: 'start', behavior: motion ? 'smooth' : 'auto' });
    }
    if (!motion) return;
    const h1 = list.offsetHeight;
    const vh = innerHeight, duration = DUR('base'), easing = EASE();
    list.classList.add('is-moving');
    items.forEach((n, i) => {
      const a = before[i], b = n.getBoundingClientRect();
      if ((a.bottom < -vh || a.top > 2 * vh) && (b.bottom < -vh || b.top > 2 * vh)) return; // lo que no se ve ni antes ni después no viaja
      const dx = a.left - b.left, dy = a.top - b.top;
      if (dx || dy) n.animate([{ transform: `translate(${dx}px, ${dy}px)` }, { transform: 'none' }], { duration, easing });
    });
    const done = () => list.classList.remove('is-moving');
    list.animate([{ height: `${h0}px` }, { height: `${h1}px` }], { duration, easing }).finished.then(done, done);
  };
  toggle.addEventListener('click', () => set(toggle.getAttribute('aria-expanded') !== 'true'));
  return set;
}

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

/** Pinta la tira (al acercarse a la sección): pide el catálogo, comprueba los ids y arma un botón por llegada. */
export async function initNews({ ensureCatalog, isMotion = () => false } = {}) {
  const section = document.querySelector('[data-news]');
  if (!section || section.dataset.ready) return;
  section.dataset.ready = '1';
  await initNewsCount();
  const track = section.querySelector('[data-news-track]');
  const toggle = section.querySelector('[data-news-toggle]');
  const status = section.querySelector('[data-news-status]');
  let plan = { show: false }, cat;
  try {
    const [sample, data, catMod] = await Promise.all([loadSample(), loadCollections(), import('./catalog.js')]);
    cat = catMod;
    plan = newsPlan(sample.books, data, { visto, hoy: isoDay() });
    apply(plan); // el conteo temprano confió en los ids del JSON; con el catálogo, solo cuentan los que existen (sin ninguno, la sección se va)
  } catch { // sin catálogo no se promete nada: se dice; la próxima vez que se acerque se vuelve a pedir
    delete section.dataset.ready;
    track.replaceChildren();
    track.removeAttribute('aria-busy');
    status.textContent = 'No pudimos cargar las novedades.';
    return;
  }
  if (!plan.show) return;
  if (status.textContent !== plan.estado) status.textContent = plan.estado;
  const tones = cat.coverTones(plan.books);
  const fresh = new Set(plan.nuevos);
  track.replaceChildren(...plan.books.map((b, i) => newsItem(b, tones[i], fresh.has(b.id), i, cat)));
  track.removeAttribute('aria-busy');
  wireOpen(track, ensureCatalog, cat.toneOf);
  wireToggle(section, track, toggle, isMotion);
  toggle.disabled = false;
  watchSeen(section, track);
}
