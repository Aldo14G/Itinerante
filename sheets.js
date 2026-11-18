// Hojas que cubren la página (menú lateral, Mi lista, ficha, Explorar, menú de tableta).
// Dos cosas que antes cada una resolvía por su cuenta y se desbalanceaban:
//  1. Bloqueo de scroll por contador: la clase de <html> se quita solo cuando se cierra la última hoja que la pidió.
//  2. Botón «atrás»: cada hoja abierta empuja una entrada de historial; «atrás» cierra la de arriba y cerrar por botón
//     o Escape consume la entrada que se empujó. history.back() es asíncrono, así que las operaciones se serializan.
import { afterPaint, DUR } from './motion.js';

const root = globalThis.document?.documentElement; // saved.js se importa también desde Node (pruebas): sin DOM no hace nada
const stack = []; // hojas abiertas; la última es la de arriba
const locks = new Map(); // clase de <html> -> hojas que la piden
let depth = 0; // entradas de historial que empujamos y siguen ahí
let busy = false; // un history.back() nuestro espera su popstate
let busyTimer;

const lock = cls => { locks.set(cls, (locks.get(cls) || 0) + 1); root.classList.add(cls); };
const unlock = cls => {
  const n = (locks.get(cls) || 1) - 1;
  if (n > 0) locks.set(cls, n); else { locks.delete(cls); root.classList.remove(cls); }
};

function sync() {
  if (busy) return;
  if (depth > stack.length) {
    busy = true;
    // Si el navegador no entrega el popstate (no había entrada a la que volver), se dan por perdidas las entradas sobrantes:
    // sin esta salida `busy` quedaría puesto y ninguna hoja posterior sincronizaría el historial.
    busyTimer = setTimeout(() => { busy = false; depth = stack.length; }, DUR('scene'));
    history.back();
    return;
  }
  while (depth < stack.length) { history.pushState({ sheet: true }, '', stack[depth].url || location.href); depth += 1; }
  // Si la hoja de la muestra se cerró sin pasar por su entrada (p. ej. al agrandar la ventana), la URL no debe conservar #explorar.
  if (!depth && location.hash === '#explorar') history.replaceState(null, '', location.pathname + location.search);
}

globalThis.addEventListener?.('popstate', () => {
  depth = Math.max(0, depth - 1);
  if (busy) { busy = false; clearTimeout(busyTimer); sync(); return; } // fue nuestro history.back()
  stack.at(-1)?.exit(); // el usuario tocó «atrás»: cierra la hoja de arriba (la entrada ya se consumió)
});

// Registra una hoja abierta. `close` la cierra; `url` es lo que debe mostrar la barra de direcciones mientras esté abierta;
// `lock: null` no bloquea el scroll (el menú de tableta ya lo hace).
// Devuelve `release`, que se llama al cerrarse (idempotente).
export function pushSheet({ close, lock: cls = 'sheet-open', url = '', dlg = null }) {
  const entry = { url, dlg, done: false };
  entry.exit = () => { if (entry.done) return; close(); release(); };
  const release = () => {
    if (entry.done) return;
    entry.done = true;
    stack.splice(stack.indexOf(entry), 1);
    if (cls) unlock(cls);
    sync();
  };
  stack.push(entry);
  if (cls) lock(cls);
  sync();
  return release;
}

// Abre un <dialog> como modal y lo registra. Se libera solo con su evento `close` (Escape, botón, fondo, atrás).
// Ocultar el fondo (content-visibility) mientras la hoja está abierta se midió con CPU 4x en el teléfono emulado, alternando
// con y sin ocultarlo: abrir→pintar 108 ms frente a 90 ms y cerrar 118 frente a 121 ms. No ayudaba, así que no se hace.
// `defer`: la hoja abre en dos tareas. showModal() vuelve inerte toda la página (recalcula el estilo de ~600 elementos) y,
// si el contenido ya está maquetado, el enfoque obliga además a calcular su diseño en esa misma tarea: con CPU 4x sumaban
// 180-280 ms seguidos. Con `defer` el contenido espera (`is-filling`, content-visibility: hidden) y se muestra tras el
// siguiente fotograma, de modo que cada tarea queda por debajo de 200 ms. La promesa se resuelve con el contenido ya
// visible: lo que dependa de que sea enfocable (llevar el foco dentro) va después de ella.
// Los avisos que viven dentro de una hoja (popover de capa superior: «Guardado en Mi lista.») se van con ella: si no, flotaban sobre la portada
// mientras la hoja salía (240 ms tras ×; segunda auditoría, 2026-11-17). `:popover-open` puede no existir en un navegador viejo: entonces no hay nada que ocultar.
function hidePopovers(dlg) {
  let open = [];
  try { open = [...dlg.querySelectorAll(':popover-open')]; } catch { return; }
  open.forEach(p => { try { p.hidePopover(); } catch { /* ya cerrado */ } });
}

export function openDialog(dlg, { defer = false, ...opts } = {}) {
  if (defer) dlg.classList.add('is-filling');
  dlg.showModal();
  const release = pushSheet({ ...opts, dlg, close: () => dlg.close() });
  // En captura: corre antes que los `close` de cada hoja, que enfocan cosas.
  dlg.addEventListener('close', release, { once: true, capture: true });
  dlg.addEventListener('close', () => hidePopovers(dlg), { once: true }); // Escape, «atrás» y el fondo
  return defer ? afterPaint(() => dlg.classList.remove('is-filling')) : Promise.resolve();
}

// Cierre desde un botón, en tres tiempos para que ninguna tarea pase de ~100 ms con CPU 4x:
//  1. La hoja empieza a salir en el siguiente fotograma (clase `is-closing`, mismo destino que el estado cerrado).
//  2. Cuando terminó de salir (ya no se ve), su contenido se omite (`is-filling`, content-visibility: hidden). Cerrar con
//     la rejilla de Explorar (~340 elementos) montada costaba 170-320 ms de una sola tarea; con el contenido omitido,
//     60-160 ms: close() ya no tiene que desmontar ese diseño además de reactivar la página.
//  3. Un fotograma después corre el cierre real, que vuelve a activar toda la página detrás (cientos de ms en gama media).
// Escape, «atrás» y el fondo de las hojas siguen cerrando de inmediato por su propio camino. Si la hoja se cierra por otra
// vía mientras tanto, el evento `close` limpia las clases y los pasos pendientes no hacen nada.
export function closeDialog(dlg) {
  if (!dlg.open || dlg.classList.contains('is-closing')) return;
  hidePopovers(dlg); // en el mismo fotograma en que empieza la salida
  dlg.classList.add('is-closing');
  let live = true;
  dlg.addEventListener('close', () => { live = false; dlg.classList.remove('is-closing', 'is-filling'); }, { once: true });
  const exited = () => Promise.race([
    Promise.allSettled(dlg.getAnimations().map(a => a.finished)), // la salida y, con movimiento reducido, su fundido instantáneo
    new Promise(resolve => setTimeout(resolve, DUR('base'))), // respaldo: una animación que no termina no debe dejar la hoja abierta
  ]);
  afterPaint(exited)
    .then(() => { if (!live) return; if (dlg.matches(':modal')) dlg.classList.add('is-filling'); return afterPaint(); })
    .then(() => { if (live && dlg.open) dlg.close(); });
}

// Deslizar para cerrar (hoja inferior del teléfono; Apple, Sheets: asa y deslizar hacia abajo cierra). Una sola lógica para la ficha, Mi lista y
// Explorar (2026-11-18; antes solo la ficha, en catalog.js). El gesto empieza en el asa (`[data-sheet-grab]`, 36 × 5 a 8 px del borde, dentro de
// una franja táctil), en la cabecera de la hoja (`head`) o, con el contenido arriba del todo, en sus primeros `zone` px; un enlace o un botón
// no lo empiezan. Con movimiento la hoja sigue al dedo; con «reducir movimiento» o la pausa se queda quieta, pero el gesto cierra igual.
// Al soltar pasados 120 px, o a más de 0.7 px/ms, la hoja sale por closeDialog desde donde quedó; si no, vuelve a su sitio.
export const SWIPE_CLOSE = { dist: 120, speed: 0.7 };
export function swipeToClose(dlg, { grab = null, head = null, scroller = null, zone = 0, media = '(max-width: 760px)', isMotion = () => root.classList.contains('motion') } = {}) {
  let startY = 0, dy = 0, t0 = 0, active = false, follow = false;
  const sheetMode = () => matchMedia(media).matches && dlg.matches(':modal') && !dlg.classList.contains('is-closing');
  const reset = () => { dlg.style.removeProperty('translate'); dlg.style.removeProperty('transition'); };
  dlg.addEventListener('close', reset);
  dlg.addEventListener('pointerdown', e => {
    if (!sheetMode() || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const onGrab = !!(grab && grab.contains(e.target));
    if (!onGrab && e.target.closest('a, button, input, select, textarea, label, [role="combobox"]')) return;
    const onHead = !!(head && head.contains(e.target));
    const inZone = zone > 0 && (!scroller || scroller.scrollTop <= 0) && e.clientY - dlg.getBoundingClientRect().top <= zone;
    if (!onGrab && !onHead && !inZone) return;
    active = true; follow = isMotion(); startY = e.clientY; dy = 0; t0 = performance.now();
    try { dlg.setPointerCapture(e.pointerId); } catch { /* el puntero ya no existe */ }
    if (follow) dlg.style.transition = 'none';
  });
  dlg.addEventListener('pointermove', e => {
    if (!active) return;
    dy = Math.max(0, e.clientY - startY);
    if (follow) dlg.style.translate = `0 ${dy}px`;
  });
  const end = cancel => {
    if (!active) return;
    active = false;
    const speed = dy / Math.max(1, performance.now() - t0);
    const shut = !cancel && (dy > SWIPE_CLOSE.dist || speed > SWIPE_CLOSE.speed);
    dlg.style.removeProperty('transition'); // vuelve la transición de la hoja: la salida (o el regreso) parte de donde quedó el dedo
    if (shut) { closeDialog(dlg); return; }
    if (!follow || !dy) { reset(); return; }
    // Regreso: la hoja vuelve a su sitio con la curva de entrada (translate no está en su transición: se pone solo para esto).
    dlg.style.transition = `translate ${DUR('rapida')}ms var(--curva-salida)`;
    requestAnimationFrame(() => { dlg.style.translate = '0 0'; });
    setTimeout(() => { if (!active && !dlg.classList.contains('is-closing')) reset(); }, DUR('rapida'));
  };
  dlg.addEventListener('pointerup', () => end(false));
  dlg.addEventListener('pointercancel', () => end(true));
}

// Una hoja cuyo enlace lleva a una sección del mismo documento reutiliza su entrada de historial como entrada del destino
// (en vez de dejar una entrada fantasma debajo): no hay que consumirla después.
export function navigateFromSheet(href) {
  if (!depth) { location.hash = href; return; }
  history.replaceState(null, '', href);
  depth -= 1;
  document.querySelector(href)?.scrollIntoView();
}

// El <dialog> modal de más arriba: lo que queda fuera de él es inerte, así que el aviso debe vivir dentro para poder tocarse.
export const topDialog = () => stack.findLast(e => e.dlg)?.dlg ?? null;
