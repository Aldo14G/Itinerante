// Librería Itinerante y Más · sistema «Itinerante Líquido»: barra y menú, destino actual, entradas de los titulares, Eventos, Catálogo y estado de apertura. Sin dependencias.
import { confirmThen } from './motion.js';
import { openDialog, closeDialog, navigateFromSheet } from './sheets.js';

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
  (window.requestIdleCallback || (cb => setTimeout(cb, 300)))(updateStatus, { timeout: 2000 });
  setInterval(updateStatus, 60_000);

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
    tabLinks.forEach(a => { if (a.getAttribute('href') === hash) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
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
      timer = setTimeout(queueMeasure, 120);
    }).observe(document.body);
  }

  // ---------- Fotos diferidas ----------
  const markLoaded = img => { img.classList.add('is-loaded'); img.closest('.still-img, .frame-clip')?.classList.add('is-loaded'); };
  $$('img[loading="lazy"]').forEach(img => { if (img.complete) markLoaded(img); });
  document.addEventListener('load', e => { if (e.target instanceof HTMLImageElement) markLoaded(e.target); }, true);
  document.addEventListener('error', e => { if (e.target instanceof HTMLImageElement) markLoaded(e.target); }, true);

  await yieldNow();
  // ---------- Movimiento (preferencia del sistema, ahorro de datos y la pausa del pie) ----------
  const toggle = $('[data-motion-toggle]');
  function syncToggle() {
    if (reduceMq.matches) { toggle.disabled = true; toggle.textContent = 'Movimiento reducido por el sistema'; return; }
    if (saveData) { toggle.disabled = true; toggle.textContent = 'Ahorro de datos: movimiento pausado'; return; }
    toggle.disabled = false;
    toggle.textContent = 'Pausar el movimiento';
    toggle.setAttribute('aria-pressed', String(userOff));
  }
  function applyMode() {
    const on = motionOn();
    root.classList.toggle('motion', on);
    if (!on) { root.classList.remove('intro'); revealAll(); }
    syncToggle();
  }
  toggle.addEventListener('click', () => {
    userOff = !userOff;
    try { localStorage.setItem('iti-b4-motion', userOff ? 'off' : 'on'); } catch { /* sin persistencia */ }
    applyMode();
    toggle.scrollIntoView({ block: 'center' });
    toggle.focus();
  });
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
  function revealAll() { pending.forEach(el => el.classList.add('is-visible')); pending.clear(); }
  let revealIo = null;
  function prepareReveals() {
    if (!isMotion() || !('IntersectionObserver' in window)) return;
    revealIo = new IntersectionObserver(es => es.forEach(e => {
      if (!e.isIntersecting) return;
      e.target.classList.add('is-visible');
      pending.delete(e.target);
      revealIo.unobserve(e.target);
    }), { threshold: 0.15, rootMargin: '0px 0px -8% 0px' });
    $$('[data-revelar]').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight) return; // ya a la vista: se queda como está
      if (el.matches('.sec-head')) { const h = $('.h2', el); if (h) splitHeading(h); }
      el.dataset.revelar = 'listo';
      pending.add(el);
      revealIo.observe(el);
    });
  }
  let lastW = innerWidth;
  addEventListener('resize', () => { if (innerWidth === lastW) return; lastW = innerWidth; unsplit(); revealAll(); });

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
    $$('main .btn--primario').forEach(b => primaryIo.observe(b));
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
      if (st) st.textContent = 'No pudimos cargar el catálogo. Escríbenos por WhatsApp y te ayudamos a buscar.';
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
    // de abrir: cerrar la ficha no deja un ancla que la vuelva a abrir al recargar.
    const openShared = () => {
      const m = /^#libro-([a-z0-9-]+)$/.exec(location.hash);
      if (!m) return;
      history.replaceState(null, '', location.pathname + location.search);
      bootCatalog().then(() => document.dispatchEvent(new CustomEvent('iti:open-book', { detail: { id: m[1] } })));
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
  (window.requestIdleCallback || (cb => setTimeout(cb, 600)))(() => import('./saved.js').then(m => m.initSaved()).catch(() => {}), { timeout: 3000 });

  await yieldNow();
  // ---------- Eventos y talleres: Carrusel3D (variante evento), «Compartir» y la fecha de cada propuesta ----------
  // El carrusel se arma al acercarse (como el del Catálogo); «Compartir» carga el módulo al primer toque si aún no llegó.
  let feedLoad;
  const loadFeed = () => (feedLoad ??= import('./feed.js').catch(err => { feedLoad = undefined; throw err; }));
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-share]');
    if (act) loadFeed().then(m => m.onAct(act)).catch(() => {});
  });
  const nearby = (el, boot, margin = '700px 0px') => {
    if (!el) return;
    if (!('IntersectionObserver' in window)) { boot(); return; }
    const io = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { io.disconnect(); boot(); } }, { rootMargin: margin });
    io.observe(el);
  };
  nearby($('[data-bill-c3d]'), () => loadFeed().then(m => m.initEventos({ isMotion })).catch(() => {}));

  // ---------- Café y té: la carta (Carrusel3D, variante carta) se pide al acercarse ----------
  nearby($('[data-cafe]'), () => import('./cafe.js').then(m => m.initCafe({ isMotion })).catch(() => {}));

  await yieldNow();
  // ---------- Start ----------
  applyMode();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const posterReady = $('.entry-poster').decode().catch(() => {});
  Promise.race([Promise.all([fontsReady, posterReady]), new Promise(r => setTimeout(r, 900))]).then(() => {
    measureZones(); // una sola medición, con la letra y la foto ya puestas
    kick();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('intro')));
    // Las entradas se preparan en reposo: partir los titulares en líneas mide texto, y eso no debe competir con el primer render.
    (window.requestIdleCallback || (cb => setTimeout(cb, 300)))(prepareReveals, { timeout: 1500 });
    // Conteo de novedades (control del inicio): después de la foto y las fuentes. Su sitio ya está reservado (boot.js), así que no mueve nada.
    loadNews().then(m => m.initNewsCount()).catch(() => {});
  });
}
