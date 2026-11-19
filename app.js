// Librería Itinerante y Más · sistema «Itinerante Líquido»: barra y menú, destino actual, entradas de los titulares, Eventos, Catálogo y estado de apertura. Sin dependencias.
import { confirmThen, EASE, ms, whenIdle } from './motion.js';
import { openDialog, closeDialog, navigateFromSheet, swipeToClose } from './sheets.js';

const DAYS = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

let monterreyFormat;
export function monterreyNow(date = new Date()) {
  monterreyFormat ??= new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Monterrey', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  });
  const parts = Object.fromEntries(monterreyFormat.formatToParts(date).map(part => [part.type, part.value]));
  return { day: DAYS[parts.weekday], mins: (Number(parts.hour) % 24) * 60 + Number(parts.minute) };
}

export function openingStatus({ day, mins }) {
  const workday = day >= 1 && day <= 6;
  if (workday && mins >= 660 && mins < 1200) {
    const left = 1200 - mins;
    return left <= 45
      ? { open: true, short: 'Cierra pronto · 20:00', long: `Abierto ahora: cerramos en ${left} min, a las 20:00.` }
      : { open: true, short: 'Abierto ahora · hasta 20:00', long: 'Abierto ahora. Hoy cerramos a las 20:00.' };
  }
  const when = workday && mins < 660 ? 'hoy' : day === 6 ? 'el lunes' : 'mañana';
  return { open: false, short: `Cerrado · abre ${when} 11:00`, long: `Cerrado ahora. Abrimos ${when} a las 11:00.` };
}

// El arranque se reparte en tareas cortas (cada tramo por debajo de ~50 ms con CPU 4×): entre una y otra el navegador puede
// pintar y atender un toque. El orden de los tramos es el de siempre; nada depende de que boot() termine de una vez.
const yieldNow = () => (globalThis.scheduler?.yield ? globalThis.scheduler.yield() : new Promise(r => setTimeout(r)));

if (typeof document !== 'undefined') boot();

async function boot() {
  const root = document.documentElement;
  const reduceMq = matchMedia('(prefers-reduced-motion: reduce)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  let userOff = false;
  try { userOff = localStorage.getItem('iti-b4-motion') === 'off'; } catch { /* almacenamiento bloqueado */ }

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const absTop = el => el.getBoundingClientRect().top + scrollY;
  const motionOn = () => !reduceMq.matches && !userOff && !saveData;
  const isMotion = () => root.classList.contains('motion');

  let vh = innerHeight;

  // ---------- Estado de apertura (hora de Monterrey) ----------
  function updateStatus() {
    const now = monterreyNow();
    const st = openingStatus(now);
    $$('[data-status]').forEach(el => { el.dataset.open = String(st.open); });
    $$('[data-status-text]').forEach(el => { el.textContent = st.short; });
    $$('[data-status-long]').forEach(el => { el.textContent = st.long; });
    $$('.hours tr').forEach(tr => tr.classList.toggle('is-today', tr.dataset.days.split(' ').includes(String(now.day))));
  }
  // El HTML ya trae el horario habitual; la hora de Monterrey (Intl con zona horaria cuesta ~50 ms de CPU la primera vez) se calcula en reposo.
  whenIdle(updateStatus, { timeout: 2000 });
  setInterval(updateStatus, ms('refresco-estado'));

  // ---------- Barra de navegación y destino actual (scroll-spy) ----------
  // Zonas del recorrido: cada una marca su enlace de la barra, su fila del menú y, en el teléfono, su casilla de la barra inferior.
  // «Inicio» abarca la entrada y La casa; la barra inferior solo tiene Inicio y Catálogo, así que en el resto de la página no marca ninguna.
  const hdr = $('[data-hdr]');
  const navLinks = $$('.hdr-nav a, .menu-row[href]');
  const tabLinks = $$('.tabbar a');
  const zones = [['#inicio', '#casa'], ['#libros'], ['#cartelera'], ['#novedades'], ['#cafe'], ['#visita']].map(([from, to = from]) => ({ hash: from, from: $(from), to: $(to) }));
  let zoneRanges = [], current = null, raf = 0;
  const measureZones = () => {
    vh = innerHeight;
    zoneRanges = zones.filter(z => z.from && z.to && z.from.offsetHeight && z.to.offsetHeight) // una sección que no existe (Novedades sin entradas) no tiene zona
      .map(z => ({ hash: z.hash, top: absTop(z.from), bottom: absTop(z.to) + z.to.offsetHeight }));
  };
  function spy() {
    raf = 0;
    const y = scrollY;
    hdr.classList.toggle('is-solid', y > 8);
    const probe = y + vh * 0.4;
    const zone = zoneRanges.find(c => probe >= c.top && probe < c.bottom);
    const hash = zone ? zone.hash : '';
    if (hash === current) return;
    current = hash;
    navLinks.forEach(a => { if (a.getAttribute('href') === hash) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
    // La entrada «#inicio» abarca La casa: su fila del menú «La casa» no se marca por separado.
    // «Catálogo» de la barra inferior aterriza en las colecciones (#colecciones) pero su zona es la del capítulo (data-zona="#libros").
    tabLinks.forEach(a => { if ((a.dataset.zona || a.getAttribute('href')) === hash) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(spy); };
  addEventListener('scroll', kick, { passive: true });
  let measureQueued = 0;
  const queueMeasure = () => {
    if (measureQueued) return;
    measureQueued = requestAnimationFrame(() => { measureQueued = 0; measureZones(); current = null; kick(); });
  };
  addEventListener('resize', queueMeasure);
  if ('ResizeObserver' in window) {
    let lastH = document.body.offsetHeight, timer = 0;
    new ResizeObserver(() => {
      const h = document.body.offsetHeight;
      if (Math.abs(h - lastH) < 2) return;
      lastH = h;
      clearTimeout(timer);
      timer = setTimeout(queueMeasure, ms('remedir'));
    }).observe(document.body);
  }

  // ---------- Fotos diferidas ----------
  const markLoaded = img => { img.classList.add('is-loaded'); img.closest('.still-img, .frame-clip')?.classList.add('is-loaded'); };
  $$('img[loading="lazy"]').forEach(img => { if (img.complete) markLoaded(img); });
  document.addEventListener('load', e => { if (e.target instanceof HTMLImageElement) markLoaded(e.target); }, true);
  document.addEventListener('error', e => { if (e.target instanceof HTMLImageElement) markLoaded(e.target); }, true);

  await yieldNow();
  // ---------- Movimiento (preferencia del sistema, ahorro de datos y la pausa del pie) ----------
  // «Pausar el movimiento» es un interruptor (role="switch", 2026-11-14): encendido = pausado. Si el sistema ya lo pausa (reducir movimiento o
  // ahorro de datos) queda encendido y no se puede apagar (aria-disabled, así sigue enfocable) y la nota de debajo dice por qué.
  // Hay dos (2026-11-16): el del pie y el del menú ☰ (lo ocasional a dos toques en vez de a siete pantallas). Una sola lógica los cablea: los dos
  // salen de `userOff` y del sistema, así que siempre dicen lo mismo, y el estado se guarda una vez.
  const toggles = $$('[data-motion-toggle]');
  const notes = $$('[data-motion-nota]');
  function syncToggle() {
    const why = reduceMq.matches ? 'Tu dispositivo pide menos movimiento' : saveData ? 'Con ahorro de datos, el movimiento queda en pausa' : '';
    toggles.forEach(toggle => {
      toggle.setAttribute('aria-checked', String(Boolean(why) || userOff));
      if (why) toggle.setAttribute('aria-disabled', 'true'); else toggle.removeAttribute('aria-disabled');
    });
    notes.forEach(note => { note.textContent = why; note.hidden = !why; });
  }
  function applyMode() {
    const on = motionOn();
    root.classList.toggle('motion', on);
    if (!on) { endIntro(); revealAll(); }
    syncToggle();
  }
  toggles.forEach(toggle => toggle.addEventListener('click', () => {
    if (toggle.getAttribute('aria-disabled') === 'true') return; // lo pausa el sistema: la nota lo explica
    userOff = !userOff;
    try { localStorage.setItem('iti-b4-motion', userOff ? 'off' : 'on'); } catch { /* sin persistencia */ }
    applyMode();
    if (!toggle.closest('dialog')) toggle.scrollIntoView({ block: 'center' }); // el del pie se queda a la vista; el del menú ya está en la hoja
    toggle.focus();
  }));
  reduceMq.addEventListener('change', applyMode);

  // ---------- Entradas (EncabezadoSeccion y revelado de imagen) ----------
  // El titular se parte en sus líneas reales (medidas en pantalla) y cada línea sube desde su máscara; la imagen se abre desde un recorte.
  // Solo se prepara lo que todavía no se ve y solo con movimiento: lo que ya está en pantalla nunca se oculta. Una vez por visita.
  // Si cambia el ancho, los titulares vuelven a su texto original (las líneas medidas ya no valdrían).
  const pending = new Set();
  function splitHeading(h) {
    const words = [];
    const walk = (node, em) => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span');
            w.className = em ? 'pal pal-em' : 'pal';
            w.textContent = part;
            frag.append(w);
            words.push(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE) walk(n, em || n.tagName === 'EM');
      });
    };
    h.dataset.src = h.innerHTML;
    walk(h, false);
    const lines = [];
    let top = null;
    words.forEach(w => { const t = w.offsetTop; if (top === null || Math.abs(t - top) > 2) { lines.push([]); top = t; } lines.at(-1).push(w); });
    h.replaceChildren(...lines.flatMap((ws, i) => {
      const line = document.createElement('span');
      line.className = 'linea';
      const inner = document.createElement('span');
      inner.className = 'linea-in';
      ws.forEach((w, k) => { if (k) inner.append(' '); inner.append(w); });
      line.append(inner);
      return i ? [' ', line] : [line];
    }));
  }
  const unsplit = () => $$('[data-src]').forEach(h => { h.innerHTML = h.dataset.src; delete h.dataset.src; });
  // Sin movimiento (la pausa o «reducir movimiento») o al cambiar el ancho, todo lo pendiente queda colocado. Con `is-llegada` (transition: none):
  // en el teléfono las secciones con content-visibility: auto no recalculan su estilo mientras están fuera de la vista y, al reanudar el
  // movimiento, su titular volvía a entrar desde la pose vieja (hasta 930 ms; segunda auditoría, 2026-11-17).
  function revealAll() { pending.forEach(el => el.classList.add('is-visible', 'is-llegada')); pending.clear(); }
  let revealIo = null;
  function prepareReveals() {
    if (!isMotion() || !('IntersectionObserver' in window)) return;
    revealIo = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      pending.delete(e.target);
      revealIo.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    // El mapa de Visita dibuja su ruta cuando se ve buena parte de él (60 %), no al asomar: si no, terminaría de dibujarse fuera de la vista.
    const mapIo = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      pending.delete(e.target);
      mapIo.unobserve(e.target);
    }), { threshold: 0.6 });
    $$('[data-revelar]').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return; // ya a la vista: se queda como está
      if (el.matches('.sec-head')) { const h = $('.h2', el); if (h) splitHeading(h); }
      el.dataset.revelar = 'listo';
      pending.add(el);
      (el.matches('.visit-map') ? mapIo : revealIo).observe(el);
    });
    arriveAt(sectionOf(location.hash)); // se abrió la página directamente en una sección (#visita): llega colocada
  }
  // Llegar por un enlace de ancla (☰, barra, barra inferior, #hash): lo que entra «por línea» o por recorte en la sección de destino aparece ya
  // colocado, sin transición (2026-11-16): la persona llegó a leer, no a ver la entrada, y esperar 120–240 ms al titular se notaba. Lo demás de la
  // página sigue entrando al hacer scroll; el mapa de Visita (se dibuja al verse el 60 %) conserva su propio momento. Cada cambio de clase y
  // el salto ocurren en el mismo fotograma, así que no hay transición que correr (.is-llegada: transition none, ver style.css).
  const sectionOf = hash => { try { const t = hash.length > 1 ? document.getElementById(decodeURIComponent(hash.slice(1))) : null; return t ? t.closest('section, footer') || t : null; } catch { return null; } };
  // La sección de destino avisa además con `iti:llegada` (en el mismo fotograma, antes del salto): lo que entra al verse por su cuenta (el
  // destacado y las filas de Eventos, feed.js) queda colocado en vez de entrar (2026-11-17, segunda auditoría: el destacado se fundía 240 ms tras llegar).
  function arriveAt(scope) {
    if (!scope) return;
    scope.dispatchEvent(new CustomEvent('iti:llegada', { bubbles: true }));
    [...pending].filter(el => scope.contains(el) && !el.matches('.visit-map')).forEach(el => {
      el.classList.add('is-llegada', 'is-visible');
      pending.delete(el);
      revealIo?.unobserve(el);
    });
  }
  document.addEventListener('click', e => { // en captura: antes de que el salto de la ancla (o el de la hoja del menú) llegue a pintarse
    const a = e.target.closest?.('a[href^="#"]');
    if (a) arriveAt(sectionOf(a.getAttribute('href')));
  }, true);
  addEventListener('hashchange', () => arriveAt(sectionOf(location.hash)));
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; unsplit(); revealAll(); });

  // ---------- Entrada de marca (IntroMarca, 2026-11-18): el titular del inicio sube por líneas cuando la marca vuelve a la barra ----------
  // boot.js decide si hay entrada (html.intro-marca) y la termina; el telón, la marca y la foto son CSS (style.css). Aquí solo el titular, con la
  // entrada de los titulares (sus líneas reales suben desde su máscara con escalon-linea y curva-salida; aquí en dur-base, no dur-lenta, para que
  // todo quede quieto antes de 1400 ms), dur-rapida después de que el telón empieza a subir: lo descubre al final. Se cuenta desde el mismo origen
  // que el telón (startTime compartido): corre en el compositor aunque el hilo principal esté ocupado con la carga.
  // Se parte bajo el telón; si el módulo llega cuando el telón ya se va, no se toca (queda colocado). Al terminar, el titular vuelve a su texto.
  function endIntro() {
    if (!root.classList.contains('intro-marca')) return;
    root.classList.remove('intro-marca');
    document.dispatchEvent(new CustomEvent('iti:intro-fin'));
  }
  function introTitular() {
    const h1 = $('.entry-title');
    const telon = $('[data-intro]')?.getAnimations?.().find(a => a.animationName === 'intro-telon');
    if (!root.classList.contains('intro-marca') || !h1 || !telon) return;
    const desde = ms('intro-asentar') + ms('dur-rapida');
    if ((telon.currentTime ?? 0) > ms('intro-asentar')) return; // ya no da tiempo: el titular se queda como está
    splitHeading(h1);
    const anims = $$('.linea-in', h1).map((line, i) => line.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }],
      { duration: ms('dur-base'), delay: desde + i * ms('escalon-linea'), easing: EASE(), fill: 'backwards' }));
    const sync = () => anims.forEach(a => { a.startTime = telon.startTime; });
    if (telon.startTime === null) telon.ready.then(sync).catch(() => {}); else sync();
    const back = () => { if (h1.dataset.src) { h1.innerHTML = h1.dataset.src; delete h1.dataset.src; } };
    document.addEventListener('iti:intro-fin', () => anims.forEach(a => a.finish()), { once: true }); // saltada: cada línea a su sitio
    Promise.all(anims.map(a => a.finished)).then(back, back);
  }
  introTitular();

  await yieldNow();
  // ---------- Menú (MenuHamburguesa): hoja de vidrio con todas las secciones ----------
  (function menu() {
    const dlg = $('#menu');
    const opener = $('[data-menu-open]');
    if (!dlg || !opener) return;
    let landing = null; // sección a enfocar al cerrar tras elegir un destino
    const close = () => closeDialog(dlg); // botón y fondo: sale primero, el cierre real corre después del fotograma
    opener.addEventListener('click', () => {
      if (dlg.open) return;
      opener.setAttribute('aria-expanded', 'true'); // las líneas se cruzan en × en este fotograma
      opener.setAttribute('aria-label', 'Cerrar menú');
      confirmThen(opener, async () => { // volver inerte toda la página (showModal) es lo caro: va después de pintar
        await openDialog(dlg, { defer: true }); // el contenido se maqueta en otra tarea (ver openDialog)
        if (dlg.open) $('.menu-row', dlg).focus({ preventScroll: true });
      });
    });
    dlg.addEventListener('close', () => {
      opener.setAttribute('aria-expanded', 'false');
      opener.setAttribute('aria-label', 'Abrir menú');
      if (landing) { // la navegación lleva el foco al título de la sección, no de vuelta al botón
        const h = $('h1, h2, h3', landing) || landing;
        h.tabIndex = -1;
        h.focus({ preventScroll: true });
        landing = null;
      } else opener.focus({ preventScroll: true });
    });
    $('[data-menu-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('click', e => {
      if (e.target === dlg) return close(); // clic en el velo (fuera de la hoja)
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const href = link.getAttribute('href');
      landing = $(href);
      if (landing) { e.preventDefault(); navigateFromSheet(href); } // la entrada de historial de la hoja pasa a ser la del destino
      dlg.close();
    });
  })();

  // «Cómo llegar» es la única acción primaria a la vista: la de la barra cede el sitio cuando hay otra en pantalla.
  if ('IntersectionObserver' in window) {
    const onScreen = new Set();
    const primaryIo = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); });
      hdr.classList.toggle('has-primary', onScreen.size > 0);
    });
    const watchPrimaries = () => $$('main .btn--primario').forEach(b => primaryIo.observe(b));
    watchPrimaries();
    document.addEventListener('iti:primarias', watchPrimaries); // una primaria que llega después (la del evento destacado, feed.js)
  }

  await yieldNow();
  // ---------- Novedades: un módulo ligero que se pide dos veces sin repetirse (el conteo, pronto; la tira, al acercarse) ----------
  let newsLoad;
  const loadNews = () => (newsLoad ??= import('./news.js').catch(err => {
    newsLoad = undefined;
    root.classList.remove('has-news', 'news-hint'); // sin el módulo no hay novedades que prometer: ni sección, ni casilla, ni control
    throw err;
  }));

  // ---------- Catálogo (carga al acercarse) ----------
  const catalogSection = $('#catalogo');
  if (catalogSection) {
    // Una sola promesa: el catálogo y el carrusel esperan lo mismo (la ficha existe cuando resuelve).
    let catalogReady;
    const bootCatalog = () => (catalogReady ??= import('./catalog.js').then(m => m.initCatalog({ isMotion })).catch(() => {
      catalogReady = undefined;
      const st = $('[data-cat-status]', catalogSection);
      if (st) st.textContent = 'No pudimos cargar el catálogo. Escríbenos por WhatsApp: te ayudamos a buscar tu libro o a pedirlo.';
      $('[data-cat-grid]', catalogSection)?.replaceChildren();
      $('[data-cat-grid]', catalogSection)?.removeAttribute('aria-busy');
      $('[data-cat-filters]', catalogSection)?.replaceChildren();
    }));
    if ('IntersectionObserver' in window) {
      const catIo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { catIo.disconnect(); bootCatalog(); } }, { rootMargin: '900px 0px' });
      catIo.observe(catalogSection);
    } else bootCatalog();
    addEventListener('hashchange', () => { if (location.hash === '#catalogo') bootCatalog(); });
    // Un enlace compartido desde la ficha (#libro-<id>, su botón «Compartir») abre la ficha de ese libro. La dirección queda limpia antes
    // de abrir: cerrar la ficha no deja un ancla que la vuelva a abrir al recargar. Si el libro ya no está (o el id no es de un libro: caracteres
    // raros, un % mal formado), la persona aterriza en el Catálogo con el aviso de siempre (2026-11-16; antes caía al inicio sin decir nada) y no se
    // abre hoja alguna. Si el catálogo no carga no se afirma nada del libro: queda el Catálogo con su propio mensaje.
    const landOnCatalog = notice => requestAnimationFrame(() => {
      const libros = $('#libros');
      arriveAt(libros); // llega como por cualquier enlace: titular colocado
      libros?.scrollIntoView();
      if (notice) import('./saved.js').then(m => m.notify('Ese libro ya no está en el catálogo.')).catch(() => {});
    });
    const openShared = async () => {
      const m = /^#libro-(.*)$/.exec(location.hash);
      if (!m) return;
      history.replaceState(null, '', location.pathname + location.search);
      let id = '';
      try { id = decodeURIComponent(m[1]); } catch { /* % mal formado: no es un id */ }
      await bootCatalog();
      if (catalogSection.dataset.state !== 'ready') return landOnCatalog(false);
      const detail = { id };
      if (/^[a-z0-9-]+$/.test(id)) document.dispatchEvent(new CustomEvent('iti:open-book', { detail }));
      if (detail.found !== true) landOnCatalog(true);
    };
    addEventListener('hashchange', openShared);
    openShared();

    await yieldNow();
    // Explorar el catálogo: en móvil es una hoja a pantalla completa (la rejilla deja de alargar el capítulo);
    // en escritorio el diálogo queda abierto en línea. El botón «atrás» del teléfono cierra la hoja.
    const explorer = $('#explorer');
    if (explorer) {
      const phone = matchMedia('(max-width: 760px)');
      let opening = false;
      // En escritorio el diálogo queda abierto en línea. Se abre con el atributo y no con show(): show() ejecuta los pasos de
      // enfoque del diálogo, que mandan el foco (y el scroll) al campo de búsqueda al cargar la página.
      const settle = () => {
        if (phone.matches) { if (explorer.open && !explorer.matches(':modal')) explorer.close(); }
        else {
          if (explorer.matches(':modal')) explorer.close();
          // Con otra hoja modal abierta (p. ej. Mi lista al girar el teléfono), abrir el explorador en línea pondría su vigilante de
          // cierre por encima y Escape dejaría de cerrar esa hoja: se espera a que se cierre.
          const over = [...document.querySelectorAll('dialog:modal')].find(d => d !== explorer);
          if (over) over.addEventListener('close', () => setTimeout(settle, 0), { once: true });
          else explorer.open = true;
        }
      };
      // La hoja abre al toque, con sus esqueletos (la rejilla nace con aria-busy): la respuesta no espera a la red. El catálogo
      // (módulo y datos) se pide después y rellena la hoja ya abierta; con 4G lenta antes pasaban 1-3 s sin cambio visible.
      const openExplorer = async () => {
        if (!phone.matches || explorer.open || opening) return;
        opening = true;
        try {
          await openDialog(explorer, { lock: 'explorer-open', url: '#explorar', defer: true }); // bloquea el scroll y empuja la entrada que «atrás» consume; la rejilla se maqueta en otra tarea (ver openDialog)
          if (explorer.open) $('[data-ex-close]', explorer).focus({ preventScroll: true });
        } finally { opening = false; }
        if (explorer.open) bootCatalog();
      };
      // En escritorio el campo solo recibe el foco cuando la persona llega a #catalogo (enlace o URL), nunca al cargar.
      const focusSearch = async () => {
        if (phone.matches) return;
        await bootCatalog();
        if (!phone.matches) $('[data-cat-q]', explorer)?.focus({ preventScroll: true });
      };
      settle();
      phone.addEventListener('change', settle);
      explorer.addEventListener('close', () => { if (phone.matches) $('[data-ex-open]')?.focus({ preventScroll: true }); });
      // En el teléfono Explorar es una hoja a pantalla completa: se desliza hacia abajo desde el asa o su barra de arriba para cerrarla (swipeToClose).
      swipeToClose(explorer, { grab: $('[data-sheet-grab]', explorer), head: $('.ex-top', explorer) });
      $('[data-ex-close]', explorer).addEventListener('click', () => closeDialog(explorer)); // el cierre real (volver a activar la página) corre después del fotograma
      document.addEventListener('iti:open-explorer', openExplorer);
      // Cualquier enlace al catálogo («Buscar en el catálogo», arriba del capítulo, incluido) abre la hoja en móvil: confirma el toque y la hoja
      // (lo caro) va después de pintar. En escritorio el enlace baja a la rejilla en línea y deja el foco en su buscador.
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href="#catalogo"]');
        if (!a) return;
        if (phone.matches) { e.preventDefault(); confirmThen(a, openExplorer); } else focusSearch();
      });
      addEventListener('hashchange', () => { if (location.hash === '#catalogo') focusSearch(); });
      if (location.hash === '#catalogo') focusSearch();
      // Recargar con #explorar en móvil: la hoja vuelve a abrirse con su propia entrada de historial.
      if (phone.matches && location.hash === '#explorar') { history.replaceState(null, '', location.pathname + location.search); openExplorer(); }
    }

    await yieldNow();
    // Carrusel de libros (capa 1 de Libros): se carga al acercarse y pide la ficha al catálogo al elegir un libro.
    const railEl = $('[data-rail]');
    if (railEl) {
      const bootRail = () => import('./rail.js').then(m => m.initRail({ ensureCatalog: bootCatalog, isMotion })).catch(() => { railEl.hidden = true; });
      if ('IntersectionObserver' in window) {
        const railIo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { railIo.disconnect(); bootRail(); } }, { rootMargin: '700px 0px' });
        railIo.observe(railEl.querySelector('.c3d') || railEl); // en escritorio .rail es display: contents (sin caja): se observa su carrusel
      } else bootRail();
    }

    // Novedades: la tira se pinta al acercarse a su sección (el conteo llega antes, ver «Start»). Sin entradas la sección no se muestra y nunca se acerca.
    const newsEl = $('[data-news]');
    if (newsEl) {
      const bootNews = () => loadNews().then(m => m.initNews({ ensureCatalog: bootCatalog, isMotion })).catch(() => {});
      if ('IntersectionObserver' in window) {
        const newsIo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { newsIo.disconnect(); bootNews(); } }, { rootMargin: '700px 0px' });
        newsIo.observe(newsEl);
      } else bootNews();
    }
  }

  // ---------- Mi lista para la visita (en reposo: el menú y la cabecera muestran el conteo) ----------
  whenIdle(() => import('./saved.js').then(m => m.initSaved()).catch(() => {}), { timeout: 3000, fallback: 'reposo-largo' });

  await yieldNow();
  // ---------- Eventos y talleres: destacado y lista por fecha (feed.js, datos en assets/data/eventos.json) ----------
  // La sección se pinta al acercarse; «Compartir» y «Añadir al calendario» cargan el módulo al primer toque si aún no llegó. El aviso del
  // inicio y el punto de «Eventos» se piden pronto (ver «Start»), como el conteo de Novedades.
  let feedLoad;
  const loadFeed = () => (feedLoad ??= import('./feed.js').catch(err => {
    feedLoad = undefined;
    root.classList.remove('ev-hint'); // sin el módulo no hay evento que anunciar: el renglón del inicio no se reserva
    throw err;
  }));
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-share], [data-ev-cal]');
    if (act) loadFeed().then(m => m.onAct(act)).catch(() => {});
  });
  const nearby = (el, boot, margin = '700px 0px') => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { boot(); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: margin });
    io.observe(el);
  };
  nearby($('[data-ev]'), () => loadFeed().then(m => m.initEventos({ isMotion })).catch(() => {}));

  // ---------- La casa: «Foto anterior» y «Foto siguiente» bajo la tira (2026-11-19, iteración de lectura; APG, carrusel) ----------
  // Además del gesto y del teclado sobre la tira: dos botones con nombre que llevan a la foto vecina (suave solo con movimiento) y quedan
  // aria-disabled en los extremos (no disabled: el foco se queda en el botón). Sin avance automático. Sin JavaScript no se muestran.
  (() => {
    const track = $('[data-house-track]'), nav = $('[data-house-nav]');
    if (!track || !nav) return;
    const prev = $('[data-house-prev]', nav), next = $('[data-house-next]', nav);
    const sync = () => {
      const max = track.scrollWidth - track.clientWidth;
      prev.setAttribute('aria-disabled', String(track.scrollLeft <= 1));
      next.setAttribute('aria-disabled', String(track.scrollLeft >= max - 1));
    };
    const go = dir => {
      if ((dir < 0 ? prev : next).getAttribute('aria-disabled') === 'true') return;
      const x0 = track.getBoundingClientRect().left + (parseFloat(getComputedStyle(track).scrollPaddingInlineStart) || 0);
      const lefts = [...track.children].map(li => li.getBoundingClientRect().left - x0);
      const d = dir > 0 ? lefts.find(v => v > 2) : lefts.filter(v => v < -2).pop();
      if (d !== undefined) track.scrollBy({ left: d, behavior: isMotion() ? 'smooth' : 'auto' });
    };
    prev.addEventListener('click', () => go(-1));
    next.addEventListener('click', () => go(1));
    let raf = 0;
    track.addEventListener('scroll', () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; sync(); }); }, { passive: true });
    if ('ResizeObserver' in window) new ResizeObserver(sync).observe(track);
    nav.hidden = false;
    sync();
  })();

  // ---------- Café y té: la carta (filas por categorías, cafe.js) se pide al acercarse y también en reposo (ver «Start») ----------
  const bootCafe = () => import('./cafe.js').then(m => m.initCafe({ isMotion })).catch(() => {});
  nearby($('[data-cafe]'), bootCafe);

  await yieldNow();
  // ---------- Start ----------
  applyMode();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const posterReady = $('.entry-poster').decode().catch(() => {});
  Promise.race([Promise.all([fontsReady, posterReady]), new Promise(r => setTimeout(r, ms('espera-recursos')))]).then(() => {
    measureZones(); // una sola medición, con la letra y la foto ya puestas
    kick();
    // Las entradas se preparan en reposo: partir los titulares en líneas mide texto, y eso no debe competir con el primer render.
    whenIdle(prepareReveals, { timeout: 1500 });
    // Conteo de novedades (control del inicio): después de la foto y las fuentes. Su sitio ya está reservado (boot.js), así que no mueve nada.
    loadNews().then(m => m.initNewsCount()).catch(() => {});
    // Aviso del próximo evento (renglón del inicio y punto de «Eventos»): mismo momento y mismo mecanismo; su sitio también está reservado.
    loadFeed().then(m => m.initEventosAviso()).catch(() => {});
    // Eventos se arma también en reposo, no solo al acercarse: al llegar por un enlace (☰, barra) la sección ya está armada y no salta (2026-11-16;
    // antes el destacado y la lista sustituían a las propuestas de index.html 120–240 ms después de llegar). Fuera de la vista: no mueve nada.
    whenIdle(() => loadFeed().then(m => m.initEventos({ isMotion })).catch(() => {}), { timeout: 3000 });
    // La carta de Café, igual (2026-11-17, segunda auditoría): al llegar por un enlace se veía el esqueleto 51–64 ms y la sección crecía de 892 a
    // 2 043 px. initCafe no se repite: la llamada que llegue segunda (esta o la del acercamiento) no hace nada.
    whenIdle(bootCafe, { timeout: 3000 });
  });
}
