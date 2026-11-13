// Librería Itinerante y Más · sistema «Itinerante Líquido»: barra y menú, destino actual, entradas de los titulares, Eventos, Catálogo y estado de apertura. Sin dependencias.
import { DUR, EASE, EASE_IO, ms, confirmThen } from './motion.js';
import { openDialog, closeDialog, navigateFromSheet } from './sheets.js';

const WA = 'https://wa.me/528180875940';

export const TOPICS = {
  narrativa: { name: 'Narrativa', msg: 'narrativa', line: 'Una historia lleva a otra. Novela y cuento, de aquí y de otros lados.', img: 'libro-narrativa.webp', w: 900, h: 720, alt: 'Libros de portadas de colores sobre una repisa de madera, junto a un muro de piedra', kind: 'real', place: 'La repisa de la entrada' },
  poesia: { name: 'Poesía', msg: 'poesía', line: 'Para leer despacio y en voz alta. Pregunta por un poeta o deja que te recomienden.', img: 'libro-poesia.webp', w: 760, h: 608, alt: 'Diccionario antiguo sobre una mesa de libros, frente a un muro de piedra con cuadros', kind: 'real', place: 'Entre diccionarios y cuadros' },
  ensayo: { name: 'Ensayo', msg: 'ensayo', line: 'Ideas para conversar después. Cuéntanos qué tema te ronda.', img: 'libro-ensayo.webp', w: 900, h: 720, alt: 'Portadas de colores sobre una mesa blanca, vistas de cerca', kind: 'real', place: 'La mesa de libros' },
  cronica: { name: 'Crónica', msg: 'crónica', line: 'La realidad contada de cerca: ciudades, viajes y testimonios.', img: 'libro-cronica.webp', w: 760, h: 608, alt: 'Librero de madera con libros de periodismo, junto a un grabado enmarcado', kind: 'real', place: 'El rincón de lectura' },
  infantil: { name: 'Infantil', msg: 'literatura infantil', line: 'Libros para leer juntos, en mesas con lugar para todos.', img: 'libro-infantil.webp', w: 760, h: 608, alt: 'Globo terráqueo antiguo junto a una fila de libros en un estante de madera', kind: 'real', place: 'El globo terráqueo' },
  libre: { name: 'Sin rumbo fijo', msg: '', line: 'Empieza por una mesa, una portada o una conversación. Te ayudamos a buscar.', img: 'libro-libre.webp', w: 760, h: 608, alt: 'Pilas de libros sobre una mesa negra junto a una repisa', kind: 'real', place: 'El rincón de lectura' }
};

export function buildMessage(key, query = '') {
  const text = Array.from(String(query).trim()).slice(0, 160).join('');
  if (text) return `Hola, estoy buscando «${text}». ¿Me pueden confirmar si lo tienen?`;
  if (key === 'libre' || !TOPICS[key]) return 'Hola, estoy buscando un libro y no sé por dónde empezar. ¿Me ayudan a elegir?';
  return `Hola, me gustaría preguntar por libros de ${TOPICS[key].msg}. ¿Qué me recomiendan?`;
}

export function ctaText(key, query = '') {
  if (String(query).trim()) return 'Preguntar por este libro';
  if (key === 'libre' || !TOPICS[key]) return 'Pedir una recomendación';
  return `Preguntar por ${TOPICS[key].msg}`;
}

export function waUrl(message) {
  const url = new URL(WA);
  url.searchParams.set('text', message);
  return url.href;
}

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
  const fineMq = matchMedia('(hover: hover) and (pointer: fine)');
  const phone = matchMedia('(max-width: 760px)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  let userOff = false;
  try { userOff = localStorage.getItem('iti-b4-motion') === 'off'; } catch { /* almacenamiento bloqueado */ }

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
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
  const zones = [['#inicio', '#casa'], ['#libros'], ['#cartelera'], ['#novedades'], ['#visita']].map(([from, to = from]) => ({ hash: from, from: $(from), to: $(to) }));
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
  const markLoaded = img => { img.classList.add('is-loaded'); img.closest('.still-img, .frame-clip, .topic-layer')?.classList.add('is-loaded'); };
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
  // ---------- Eventos y talleres: todas las propuestas abiertas; en el teléfono, carrusel con puntos ----------
  (function bill() {
    const items = $$('.bill-item');
    items.forEach(d => { d.open = true; $('summary', d).tabIndex = -1; }); // el resumen no pliega nada: la tarjeta entera está a la vista
    const track = $('.bill-track');
    const dots = $$('.bill-dots i');
    track.addEventListener('scroll', () => {
      if (!phone.matches) return;
      const step = items[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
      const idx = clamp(Math.round(track.scrollLeft / step), 0, items.length - 1);
      dots.forEach((dot, i) => dot.classList.toggle('is-on', i === idx));
    }, { passive: true });
    dots[0]?.classList.add('is-on');
  })();

  await yieldNow();
  // ---------- Libros ----------
  (function books() {
    const buttons = $$('.topic');
    const layersWrap = $('[data-topic-layers]');
    const nameEl = $('[data-topic-name]');
    const lineEl = $('[data-topic-line]');
    const tagEl = $('[data-topic-tag]');
    const live = $('[data-topic-live]');
    const input = $('#book-query');
    const note = $('[data-note]');
    const cta = $('[data-book-cta]');
    const ctaLabel = $('[data-cta-label]');
    const form = $('[data-composer]');
    const ease = EASE();
    let current = 'narrativa';
    let token = 0;

    const fillName = text => {
      nameEl.textContent = '';
      return [...text].map((c, i) => {
        const s = document.createElement('span');
        s.className = 'ch';
        s.textContent = c;
        nameEl.append(s);
        return s;
      });
    };
    fillName(nameEl.textContent);

    const updateMessage = animate => {
      const msg = buildMessage(current, input.value);
      const label = ctaText(current, input.value);
      if (note.textContent !== msg) {
        note.textContent = msg;
        if (animate && isMotion()) note.animate([{ opacity: 0.3, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: DUR('fast'), easing: ease });
      }
      cta.href = waUrl(msg);
      if (ctaLabel.textContent !== label) {
        ctaLabel.textContent = label;
        if (animate && isMotion()) ctaLabel.animate([{ opacity: 0, transform: 'translateY(70%)' }, { opacity: 1, transform: 'none' }], { duration: DUR('base'), easing: ease });
      }
    };

    function select(key, quiet = false) {
      if (key === current || !TOPICS[key]) return;
      current = key;
      const t = TOPICS[key];
      const my = ++token;
      buttons.forEach(b => { const on = b.dataset.topic === key; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      if (!quiet) {
        live.textContent = `${t.name}. ${t.line}`;
        document.dispatchEvent(new CustomEvent('iti:topic', { detail: { tema: key } })); // el carrusel marca la colección equivalente (rail.js)
      }

      const layer = document.createElement('div');
      layer.className = 'topic-layer';
      const img = new Image(t.w, t.h);
      img.alt = t.alt;
      img.decoding = 'async';
      img.src = `assets/img/${t.img}`;
      layer.append(img);
      const prev = $$('.topic-layer', layersWrap);
      const motion = isMotion();
      if (motion) layer.style.clipPath = 'inset(0 100% 0 0)';
      layersWrap.append(layer);

      if (!motion) {
        prev.forEach(p => p.remove());
        nameEl.textContent = t.name;
        lineEl.textContent = t.line;
        tagEl.textContent = t.place;
        updateMessage(false);
        return;
      }

      img.decode().catch(() => {}).then(() => {
        if (my !== token) return;
        layer.style.clipPath = '';
        layer.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: DUR('slow'), easing: ease, fill: 'backwards' });
        img.animate([{ transform: 'scale(1.18) translateX(5%)' }, { transform: 'none' }], { duration: DUR('scene'), easing: ease });
        prev.forEach(p => p.firstElementChild.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-9%)', filter: 'brightness(0.4)' }], { duration: DUR('slow'), easing: ease, fill: 'forwards' }));
        setTimeout(() => prev.forEach(p => p.remove()), DUR('slow') + 50);
      });

      const old = $$('.ch', nameEl);
      old.forEach((c, i) => c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-105%)', opacity: 0 }], { duration: DUR('fast'), delay: i * ms('stagger-char') * 0.6, easing: EASE_IO(), fill: 'forwards' }));
      [lineEl, tagEl].forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: DUR('instant'), fill: 'forwards' }));
      setTimeout(() => {
        if (my !== token) return;
        fillName(t.name).forEach((s, i) => s.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: DUR('base'), delay: i * ms('stagger-char'), easing: ease, fill: 'backwards' }));
        lineEl.textContent = t.line;
        tagEl.textContent = t.place;
        [lineEl, tagEl].forEach((el, i) => {
          el.getAnimations().forEach(a => a.cancel());
          el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: DUR('base'), delay: DUR('instant') * 0.6 + i * ms('stagger-line'), easing: ease, fill: 'backwards' });
        });
      }, DUR('fast') - 20 + old.length * 10);

      updateMessage(true);
    }

    const topicsEl = $('.topics');
    const preload = () => Object.values(TOPICS).forEach(t => { const pre = new Image(); pre.src = `assets/img/${t.img}`; });
    ['pointerenter', 'focusin', 'touchstart'].forEach(ev => topicsEl.addEventListener(ev, preload, { once: true, passive: true }));

    buttons.forEach((b, i) => {
      let intent = 0;
      b.addEventListener('click', () => select(b.dataset.topic));
      const arm = e => {
        if (e.pointerType !== 'mouse' || !fineMq.matches) return;
        clearTimeout(intent);
        intent = setTimeout(() => select(b.dataset.topic, true), ms('intent-topic'));
      };
      b.addEventListener('pointerenter', arm);
      b.addEventListener('pointermove', arm);
      b.addEventListener('pointerleave', () => clearTimeout(intent));
      b.addEventListener('keydown', e => {
        const dir = e.key === 'ArrowDown' || e.key === 'ArrowRight' ? 1 : e.key === 'ArrowUp' || e.key === 'ArrowLeft' ? -1 : 0;
        if (!dir) return;
        e.preventDefault();
        const next = buttons[(i + dir + buttons.length) % buttons.length];
        next.focus();
        select(next.dataset.topic);
      });
    });
    input.addEventListener('input', () => updateMessage(true));
    form.addEventListener('submit', e => { e.preventDefault(); cta.focus(); });
  })();

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
      $('[data-ex-open]')?.addEventListener('click', e => confirmThen(e.currentTarget, openExplorer)); // confirma el toque; la hoja (lo caro) va después de pintar
      document.addEventListener('iti:open-explorer', openExplorer);
      // Cualquier enlace al catálogo abre la hoja en móvil (el menú lateral la abre al terminar de cerrarse).
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
        railIo.observe(railEl);
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
  // ---------- Publicaciones de Cartelera (móvil): «Me interesa» y «Compartir» ----------
  let feedLoad;
  const loadFeed = () => (feedLoad ??= import('./feed.js').catch(err => { feedLoad = undefined; throw err; }));
  document.addEventListener('click', e => {
    const act = e.target.closest('[data-interest], [data-share]');
    if (act) loadFeed().then(m => m.onAct(act)).catch(() => {});
  });
  (window.requestIdleCallback || (cb => setTimeout(cb, 800)))(() => loadFeed().then(m => m.initFeed()).catch(() => {}), { timeout: 4000 });

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
