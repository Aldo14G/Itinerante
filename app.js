// Itinerante B.4 · escenas sincronizadas al scroll, sin dependencias.
import { DUR, EASE, EASE_IO, ms, confirmThen } from './motion.js';
import { openDialog, closeDialog, pushSheet, navigateFromSheet } from './sheets.js';
import { kindTag } from './tag.js';

const WA = 'https://wa.me/528180875940';

export const TOPICS = {
  narrativa: { name: 'Narrativa', msg: 'narrativa', line: 'Una historia lleva a otra. Novela y cuento, de aquí y de otros lados.', img: 'libro-narrativa.webp', w: 900, h: 720, alt: 'Libros de portadas de colores sobre una repisa de madera, junto a un muro de piedra', kind: 'real', place: 'La repisa de la entrada' },
  poesia: { name: 'Poesía', msg: 'poesía', line: 'Para leer despacio y en voz alta. Pregunta por un poeta o deja que te recomienden.', img: 'libro-poesia.webp', w: 760, h: 608, alt: 'Pilas de libros junto a un muro de piedra', kind: 'ai', place: 'Pilas por descubrir' },
  ensayo: { name: 'Ensayo', msg: 'ensayo', line: 'Ideas para conversar después. Cuéntanos qué tema te ronda.', img: 'libro-ensayo.webp', w: 900, h: 720, alt: 'Portadas de colores sobre una mesa blanca, vistas de cerca', kind: 'real', place: 'La mesa de libros' },
  cronica: { name: 'Crónica', msg: 'crónica', line: 'La realidad contada de cerca: ciudades, viajes y testimonios.', img: 'libro-cronica.webp', w: 760, h: 608, alt: 'Librero de madera con libros de periodismo, junto a un grabado enmarcado', kind: 'real', place: 'El rincón de lectura' },
  infantil: { name: 'Infantil', msg: 'literatura infantil', line: 'Libros para leer juntos, en mesas con lugar para todos.', img: 'libro-infantil.webp', w: 760, h: 608, alt: 'Librero lleno de libros junto a una ventana y una mesa blanca', kind: 'ai', place: 'Los libreros' },
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
  const pinMq = matchMedia('(min-width: 761px) and (min-height: 620px)');
  const saveData = Boolean(navigator.connection && navigator.connection.saveData);
  let userOff = false;
  try { userOff = localStorage.getItem('iti-b4-motion') === 'off'; } catch { /* almacenamiento bloqueado */ }

  const $ = (sel, el = document) => el.querySelector(sel);
  const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a)); return t * t * (3 - 2 * t); };
  const damp = (cur, target, k, dt) => cur + (target - cur) * (1 - Math.exp(-k * dt));
  const absTop = el => el.getBoundingClientRect().top + scrollY;
  let desktopFailed = false; // si no llega el módulo de escritorio, la página queda estática y completa
  const motionOn = () => !reduceMq.matches && !userOff && !saveData && !(desktopFailed && vw > 760);
  const isMotion = () => root.classList.contains('motion');

  let vh = innerHeight;
  let vw = innerWidth;
  let vel = 0;

  // ---------- Text splitting ----------
  function splitChars(el) {
    const text = el.textContent;
    el.textContent = '';
    return [...text].map((c, i) => {
      const outer = document.createElement('span');
      outer.className = 'ch';
      outer.style.setProperty('--i', i);
      const inner = document.createElement('span');
      inner.textContent = c;
      outer.append(inner);
      el.append(outer);
      return outer;
    });
  }

  function splitWords(el) {
    const words = [];
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === Node.TEXT_NODE) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/(\s+)/).forEach(part => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.append(part); return; }
            const w = document.createElement('span');
            w.className = 'w';
            w.textContent = part;
            frag.append(w);
            words.push(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === Node.ELEMENT_NODE) walk(n);
      });
    };
    walk(el);
    return words;
  }

  function splitLines(h) {
    const em = h.querySelector('em');
    if (!em) return;
    const ln = document.createElement('span');
    ln.className = 'ln';
    while (h.firstChild && h.firstChild !== em) ln.append(h.firstChild);
    h.prepend(ln);
    em.classList.add('ln-em');
    em.style.setProperty('--d', 1);
    h.dataset.lines = '';
  }

  function fitWord(el, chars) {
    el.style.setProperty('--fit', '200px');
    const natural = chars.reduce((w, c) => w + c.offsetWidth, 0);
    if (natural) el.style.setProperty('--fit', `${(200 * el.clientWidth / natural) * 0.992}px`);
  }

  // ---------- Status (hora de Monterrey) ----------
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

  // ---------- Scenes ----------
  const scenes = [];

  // Versión ligera: separa el nombre en letras y lo ajusta al ancho. El recorrido por fotogramas (escritorio) llega con attach().
  function entryScene() {
    const sec = $('.entry');
    const word = $('[data-wordmark]', sec);
    const chars = splitChars(word);
    let full = null;
    return {
      sec, word, chars,
      attach(scene) { full = scene; },
      enable() { if (full) full.enable(); },
      measure() {
        fitWord(word, chars); // escrituras antes que lecturas: evita un segundo layout completo
        if (full) full.measure();
      },
      tick(dt, y) { return full ? full.tick(dt, y) : false; },
      reset() { if (full) full.reset(); }
    };
  }

  function manifestoScene() {
    const sec = $('.manifesto');
    const text = $('[data-words]', sec);
    const words = splitWords(text);
    const drifts = $$('[data-drift]', sec).map(el => ({ el, amt: Number(el.dataset.drift) }));
    let top = 0, h = 1, start = 0, end = 1, lit = -1, inner = false;
    // Las medidas del texto (descendiente) solo hacen falta con la sección a la vista: pedirlas antes obliga al navegador a
    // maquetar un subárbol que `content-visibility: auto` (móvil) se salta. Aquí solo se mide la sección.
    const measureInner = () => {
      const tTop = absTop(text);
      start = tTop - vh * 0.85;
      end = tTop + text.offsetHeight - vh * 0.42;
      lit = -1;
      inner = true;
    };
    return {
      measure() {
        top = absTop(sec);
        h = sec.offsetHeight;
        inner = false;
        if (scrollY + vh >= top && scrollY <= top + h) measureInner();
      },
      tick(dt, y) {
        if (!isMotion() || y + vh < top || y > top + h) return false;
        if (!inner) measureInner();
        const n = Math.round(clamp((y - start) / Math.max(1, end - start)) * words.length);
        if (n !== lit) { words.forEach((w, i) => w.classList.toggle('is-lit', i < n)); lit = n; }
        if (vw > 760) {
          const c = clamp((y + vh / 2 - (top + h / 2)) / vh, -1, 1);
          drifts.forEach(d => { d.el.style.transform = `translate3d(0, ${(c * d.amt).toFixed(1)}px, 0)`; });
        }
        return false;
      },
      reset() { drifts.forEach(d => { d.el.style.transform = ''; }); }
    };
  }

  function houseScene() {
    const sec = $('.house');
    const track = $('[data-house-track]', sec);
    const stills = $$('.still', track);
    const idxEl = $('[data-house-index]', sec);
    const bar = $('[data-house-bar]', sec);
    let top = 0, h = 1, dist = 0, sp = 0, pinned = false, centers = [], lastIdx = -1, inner = false;

    const bars = $$('.stories i', sec);
    const setIndex = p => {
      const idx = Math.round(p * (stills.length - 1));
      if (idx !== lastIdx) {
        bars.forEach((b, i) => b.classList.toggle('is-seen', i <= idx));
        idxEl.textContent = String(idx + 1).padStart(2, '0');
        stills.forEach((el, i) => el.classList.toggle('is-center', i === idx));
        lastIdx = idx;
      }
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };

    // Toque a la izquierda o a la derecha para pasar de foto, como en las historias.
    track.addEventListener('click', e => {
      if (pinned || vw > 760 || e.target.closest('a, button')) return;
      const r = track.getBoundingClientRect();
      const next = clamp((lastIdx < 0 ? 0 : lastIdx) + (e.clientX - r.left > r.width * 0.35 ? 1 : -1), 0, stills.length - 1);
      track.scrollTo({ left: stills[next].offsetLeft - stills[0].offsetLeft, behavior: isMotion() ? 'smooth' : 'auto' });
    });
    track.addEventListener('scroll', () => {
      if (pinned) return;
      const max = track.scrollWidth - track.clientWidth;
      setIndex(max > 0 ? clamp(track.scrollLeft / max) : 0);
    }, { passive: true });

    // Carrusel suelto (móvil): el índice inicial depende del ancho del carril, que solo se pide con la sección a la vista.
    const measureLoose = () => {
      const max = track.scrollWidth - track.clientWidth;
      setIndex(max > 0 ? clamp(track.scrollLeft / max) : 0);
      inner = true;
    };

    return {
      measure() {
        pinned = root.classList.contains('pin-house');
        track.tabIndex = pinned ? -1 : 0;
        if (pinned) track.removeAttribute('aria-label'); else track.setAttribute('aria-label', 'Fotografías de la casa, desplázate para ver más');
        track.style.transform = '';
        if (pinned) {
          const last = stills[stills.length - 1];
          const pad = parseFloat(getComputedStyle(track).paddingLeft) || 0;
          dist = Math.max(0, last.offsetLeft + last.offsetWidth + pad - vw);
          sec.style.setProperty('--house-h', `${Math.round(vh + dist / 1.6)}px`);
        } else {
          sec.style.removeProperty('--house-h');
          stills.forEach(s => { s.firstElementChild.removeAttribute('style'); s.querySelector('img').removeAttribute('style'); });
        }
        top = absTop(sec);
        h = sec.offsetHeight;
        // Fijada (escritorio, sin content-visibility) se mide todo; suelta (móvil) la medida del carrusel espera a que la sección se vea.
        inner = pinned;
        if (pinned) centers = stills.map(s => s.offsetLeft + s.offsetWidth / 2);
        else if (scrollY + vh >= top && scrollY <= top + h) measureLoose();
      },
      tick(dt, y) {
        if (!pinned) { if (!inner && y + vh >= top && y <= top + h) measureLoose(); return false; }
        if (y + vh < top || y > top + h) return false;
        const p = clamp((y - top) / Math.max(1, h - vh));
        sp = damp(sp, p, 9, dt);
        const x = -sp * dist;
        track.style.transform = `translate3d(${x.toFixed(1)}px, 0, 0)`;
        stills.forEach((s, i) => {
          const d = clamp((centers[i] + x - vw / 2) / (vw * 0.7), -1, 1);
          const fig = s.firstElementChild;
          fig.style.setProperty('--s', (1 - Math.abs(d) * 0.09).toFixed(4));
          fig.style.setProperty('--dim', (Math.abs(d) * 0.58).toFixed(3));
          s.querySelector('img').style.setProperty('--px', `${(-d * 6).toFixed(2)}%`);
        });
        setIndex(sp);
        return Math.abs(sp - p) > 0.0004;
      },
      reset() { track.style.transform = ''; }
    };
  }

  // Cortinilla de tiles: solo escritorio; llega con attach().
  function wipeScene() {
    let full = null;
    return {
      attach(scene) { full = scene; },
      measure() { if (full) full.measure(); },
      tick(dt, y) { return full ? full.tick(dt, y) : false; }
    };
  }

  function marqueeScene() {
    const sec = $('.call');
    const rows = $$('[data-marquee]', sec).map(row => {
      const span = row.firstElementChild;
      for (let i = 0; i < 3; i++) row.append(span.cloneNode(true));
      return { row, span, dir: Number(row.dataset.marquee), x: 0, w: 1 };
    });
    let top = 0, h = 1, sign = 1, shown = true, inner = false;
    const measureInner = () => {
      rows.forEach(r => { r.w = r.span.offsetWidth || 1; });
      shown = rows.some(r => r.row.offsetWidth > 0); // en móvil la marquesina no se muestra (mobile.css): no se anima
      inner = true;
    };
    return {
      measure() {
        top = absTop(sec);
        h = sec.offsetHeight;
        inner = false; // las filas son descendientes: se miden con la sección a la vista (ver manifestoScene)
        if (scrollY + vh >= top && scrollY <= top + h) measureInner();
      },
      tick(dt, y) {
        if (!isMotion() || y + vh < top || y > top + h) return false;
        if (!inner) measureInner();
        if (!shown) return false;
        if (vel > 30) sign = 1; else if (vel < -30) sign = -1;
        const speed = 48 + Math.min(Math.abs(vel) * 0.32, 900);
        rows.forEach(r => {
          r.x -= r.dir * sign * speed * dt;
          if (r.x <= -r.w) r.x += r.w;
          if (r.x > 0) r.x -= r.w;
          r.row.style.transform = `translate3d(${r.x.toFixed(1)}px, 0, 0)`;
        });
        return true;
      },
      reset() { rows.forEach(r => { r.row.style.transform = ''; }); }
    };
  }

  let holdHeader = 0; // hasta este instante (performance.now) el encabezado no se oculta
  function headerScene() {
    const hdr = $('[data-hdr]');
    const themed = $$('main [data-theme]');
    const navLinks = $$('.hdr-nav a');
    const tabLinks = $$('.tabbar a');
    const chapters = navLinks.map(a => $(a.getAttribute('href')));
    let ranges = [], chapterRanges = [], hidden = false, current = '';
    return {
      measure() {
        ranges = themed.map(el => ({ top: absTop(el), bottom: absTop(el) + el.offsetHeight, theme: el.dataset.theme }));
        chapterRanges = chapters.map(el => ({ top: absTop(el), bottom: absTop(el) + el.offsetHeight }));
      },
      tick(dt, y) {
        hdr.classList.toggle('is-solid', y > 24);
        root.classList.toggle('at-top', y < Math.min(240, vh * 0.3)); // móvil: la barra inferior espera a que se salga del perfil
        const probe = y + 34;
        const r = ranges.find(range => probe >= range.top && probe < range.bottom);
        const on = r ? r.theme : '';
        if ((hdr.dataset.on || '') !== on) { if (on) hdr.dataset.on = on; else delete hdr.dataset.on; }
        if (hdr.classList.contains('is-menu') || hdr.contains(document.activeElement) || y < vh * 0.6 || performance.now() < holdHeader) hidden = false;
        else if (vel > 60) hidden = true;
        else if (vel < -60) hidden = false;
        hdr.classList.toggle('is-hidden', hidden);
        const idx = chapterRanges.findIndex(c => y + vh * 0.4 >= c.top && y + vh * 0.4 < c.bottom);
        const id = idx >= 0 ? String(idx) : '';
        if (id !== current) {
          navLinks.forEach((a, i) => { if (String(i) === id) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); });
          tabLinks.forEach((a, i) => { if (String(i) === id) a.setAttribute('aria-current', 'location'); else a.removeAttribute('aria-current'); });
          current = id;
        }
        return false;
      }
    };
  }

  const entry = entryScene();
  const wipe = wipeScene();
  scenes.push(headerScene(), entry, manifestoScene(), houseScene(), wipe, marqueeScene());

  // Escenas de escritorio (recorrido del hero y cortinilla): se descargan solo si hay movimiento y pantalla grande.
  let desktopLoad = null;
  function loadDesktop() {
    if (desktopLoad || vw <= 760) return;
    desktopLoad = import('./scenes-desktop.js').then(m => {
      const c = { $, $$, clamp, smooth, damp, absTop, isMotion, kick, vw: () => vw, vh: () => vh };
      entry.attach(m.createEntryScene(c, entry));
      wipe.attach(m.createWipeScene(c));
      applyMode();
    }).catch(err => {
      console.error('No se pudo cargar scenes-desktop.js; se muestra la versión estática.', err);
      desktopFailed = true;
      applyMode();
    });
  }

  // ---------- Fotos diferidas ----------
  const markLoaded = img => { img.classList.add('is-loaded'); img.closest('.still-img, .frame-clip, .topic-layer, .bill-layer')?.classList.add('is-loaded'); };
  $$('img[loading="lazy"]').forEach(img => { if (img.complete) markLoaded(img); });
  document.addEventListener('load', e => { if (e.target instanceof HTMLImageElement) markLoaded(e.target); }, true);
  document.addEventListener('error', e => { if (e.target instanceof HTMLImageElement) markLoaded(e.target); }, true);

  await yieldNow();
  // ---------- Loop ----------
  let raf = 0, lastT = 0, lastY = scrollY, lastScrollAt = 0;
  function loop(t) {
    const dt = lastT ? Math.min(0.05, (t - lastT) / 1000) : 1 / 60;
    lastT = t;
    const y = scrollY;
    vel = damp(vel, (y - lastY) / dt, 10, dt);
    lastY = y;
    let busy = false;
    for (const s of scenes) if (s.tick(dt, y)) busy = true;
    if (busy || t - lastScrollAt < 700 || Math.abs(vel) > 1) raf = requestAnimationFrame(loop);
    else { raf = 0; lastT = 0; vel = 0; }
  }
  function kick() {
    lastScrollAt = performance.now();
    if (!raf) raf = requestAnimationFrame(loop);
  }
  addEventListener('scroll', kick, { passive: true });

  function measureAll() {
    vh = innerHeight;
    vw = innerWidth;
    scenes.forEach(s => s.measure && s.measure());
    kick();
  }

  let measureQueued = 0;
  const queueMeasure = () => {
    if (measureQueued) return;
    measureQueued = requestAnimationFrame(() => { measureQueued = 0; measureAll(); });
  };
  addEventListener('resize', () => {
    root.classList.toggle('pin-house', isMotion() && pinMq.matches);
    vw = innerWidth; // loadDesktop decide con el ancho actual, no con el de la última medición
    vh = innerHeight;
    if (isMotion()) loadDesktop();
    queueMeasure();
  });
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

  // ---------- Motion mode ----------
  const toggle = $('[data-motion-toggle]');
  function syncToggle() {
    if (reduceMq.matches) { toggle.disabled = true; toggle.textContent = 'Movimiento reducido por el sistema'; return; }
    if (saveData) { toggle.disabled = true; toggle.textContent = 'Ahorro de datos: movimiento pausado'; return; }
    toggle.disabled = false;
    toggle.textContent = 'Pausar el movimiento';
    toggle.setAttribute('aria-pressed', String(userOff));
  }
  function applyMode({ measure = true } = {}) {
    const on = motionOn();
    root.classList.toggle('motion', on);
    root.classList.toggle('pin-house', on && pinMq.matches);
    if (!on) {
      root.classList.remove('intro');
      scenes.forEach(s => s.reset && s.reset());
    }
    if (measure) measureAll();
    if (on) { loadDesktop(); scenes.forEach(s => s.enable && s.enable()); }
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

  await yieldNow();
  // ---------- Reveals ----------
  $$('.h2, .call-title').forEach(splitLines);
  const footMark = $('[data-footmark]');
  const footChars = splitChars(footMark);
  $$('.entry-lede, .entry-actions, .entry-facts').forEach((el, i) => el.style.setProperty('--d', i));
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-in');
        io.unobserve(e.target);
      });
    }, { threshold: 0.2, rootMargin: '0px 0px -6% 0px' });
    [...$$('[data-reveal], [data-lines], [data-rules]'), footMark].forEach(el => io.observe(el));
  } else {
    [...$$('[data-reveal], [data-lines], [data-rules]'), footMark].forEach(el => el.classList.add('is-in'));
  }

  await yieldNow();
  // ---------- Menu ----------
  const hdr = $('[data-hdr]');
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const menuLabel = $('.menu-btn-label', menuBtn);
  $$('nav a', menu).forEach((a, i) => a.style.setProperty('--i', i));
  let releaseMenu = null; // entrada de historial del menú de tableta: «atrás» lo cierra
  function setMenu(open) {
    if (open && !releaseMenu) releaseMenu = pushSheet({ close: () => setMenu(false), lock: null });
    else if (!open && releaseMenu) { releaseMenu(); releaseMenu = null; }
    menuBtn.setAttribute('aria-expanded', String(open));
    menuLabel.textContent = open ? 'Cerrar' : 'Menú';
    menu.hidden = !open;
    menu.classList.toggle('is-open', open);
    hdr.classList.toggle('is-menu', open);
    $('main').inert = open;
    $('.ftr').inert = open;
    $('.skip').inert = open;
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) $('nav a', menu).focus();
  }
  // «Cómo llegar» es la única acción primaria: la de la cabecera (escritorio) cede el sitio cuando hay otra a la vista.
  if ('IntersectionObserver' in window) {
    const onScreen = new Set();
    const primaryIo = new IntersectionObserver(es => {
      es.forEach(e => { if (e.isIntersecting) onScreen.add(e.target); else onScreen.delete(e.target); });
      hdr.classList.toggle('has-primary', onScreen.size > 0);
    });
    $$('main .btn--tungsten').forEach(b => primaryIo.observe(b));
  }
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) { setMenu(false); holdHeader = performance.now() + 900; } });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

  await yieldNow();
  // ---------- Menú móvil (hoja lateral con categorías que se despliegan) ----------
  (function sheetMenu() {
    const dlg = $('#sheet-menu');
    const opener = $('.hdr-more');
    if (!dlg || !opener) return;
    const phone = matchMedia('(max-width: 760px)');
    const groups = $$('.sm-group', dlg);
    const setGroup = (g, open) => {
      const btn = $('.sm-row', g), sub = $('.sm-sub', g);
      btn.setAttribute('aria-expanded', String(open));
      sub.inert = !open; // fuera del orden de tabulación y del árbol de accesibilidad mientras está plegado
    };
    groups.forEach(g => $('.sm-row', g).addEventListener('click', () => {
      const open = $('.sm-row', g).getAttribute('aria-expanded') !== 'true';
      groups.forEach(o => setGroup(o, o === g ? open : false)); // acordeón exclusivo: una categoría abierta a la vez
    }));
    let landing = null; // sección a enfocar al cerrar tras elegir un destino
    const close = () => closeDialog(dlg); // botón y fondo: sale primero, el cierre real corre después del fotograma
    opener.addEventListener('click', () => {
      if (dlg.open) return;
      opener.setAttribute('aria-expanded', 'true'); // el botón confirma el toque en este fotograma
      confirmThen(opener, async () => { // volver inerte toda la página (showModal) es lo caro: va después de pintar
        await openDialog(dlg, { defer: true }); // el contenido se maqueta en otra tarea (ver openDialog)
        if (dlg.open) $('[data-sm-close]', dlg).focus({ preventScroll: true });
      });
    });
    dlg.addEventListener('close', () => {
      opener.setAttribute('aria-expanded', 'false');
      groups.forEach(g => setGroup(g, false));
      if (landing) { // la navegación lleva el foco al título de la sección, no de vuelta al botón
        const h = $('h1, h2, h3', landing) || landing;
        h.tabIndex = -1;
        h.focus({ preventScroll: true });
        landing = null;
      } else opener.focus({ preventScroll: true });
    });
    $('[data-sm-close]', dlg).addEventListener('click', close);
    dlg.addEventListener('click', e => {
      if (e.target === dlg) return close(); // clic en el fondo
      const link = e.target.closest('a[href]');
      if (!link) return;
      const topic = link.dataset.topicGo, bill = link.dataset.billGo;
      holdHeader = performance.now() + 900;
      const href = link.getAttribute('href');
      landing = href.startsWith('#') ? $(href) : null;
      if (href === '#catalogo') { // en móvil la muestra es una hoja: se abre cuando el menú termina de cerrarse
        landing = null;
        e.preventDefault();
        dlg.addEventListener('close', () => document.dispatchEvent(new CustomEvent('iti:open-explorer')), { once: true });
      } else if (landing) { e.preventDefault(); navigateFromSheet(href); } // la entrada de historial de la hoja pasa a ser la del destino
      dlg.close();
      if (topic) setTimeout(() => $(`.topic[data-topic="${topic}"]`)?.click(), 350);
      if (bill !== undefined) setTimeout(() => { const t = $('.bill-track'), card = $$('.bill-item')[Number(bill)]; if (t && card) t.scrollTo({ left: card.offsetLeft - t.firstElementChild.offsetLeft, behavior: isMotion() ? 'smooth' : 'auto' }); }, 350);
    });
    phone.addEventListener('change', e => { if (!e.matches) close(); });
    groups.forEach(g => setGroup(g, false));
  })();

  await yieldNow();
  // ---------- Cartelera ----------
  (function bill() {
    const items = $$('.bill-item');
    const layers = $$('.bill-layer');
    const caption = $('[data-bill-caption]');
    let shown = 0;
    const show = i => {
      if (i === shown || !layers[i]) return;
      layers.forEach((l, k) => {
        l.classList.toggle('was-active', k === shown);
        l.classList.toggle('is-active', k === i);
      });
      shown = i;
      const item = items[i];
      caption.replaceChildren(kindTag(item.dataset.kind) ?? '', ` ${item.dataset.caption}`);
    };
    items.forEach((d, i) => {
      d.addEventListener('toggle', () => { if (d.open) show(i); });
      const summary = $('summary', d);
      let intent = 0, hovering = false, suppressed = false;
      const arm = () => { clearTimeout(intent); if (hovering && !suppressed && !d.open) intent = setTimeout(() => { d.open = true; }, ms('intent-disclosure')); };
      summary.addEventListener('pointerenter', () => {
        if (!fineMq.matches) return;
        hovering = true;
        show(i);
        arm();
      });
      summary.addEventListener('pointermove', arm);
      summary.addEventListener('pointerleave', () => { hovering = false; suppressed = false; clearTimeout(intent); });
      summary.addEventListener('click', () => { suppressed = true; clearTimeout(intent); });
      summary.addEventListener('focus', () => show(i));
      // Al salir con el teclado, la imagen vuelve al item que sigue abierto
      summary.addEventListener('blur', () => { const open = items.findIndex(x => x.open); if (open >= 0) show(open); });
    });
    // Móvil: carrusel. Todas las tarjetas quedan abiertas (sin acordeón exclusivo) y los puntos siguen el desplazamiento.
    const track = $('.bill-track');
    const dots = $$('.bill-dots i');
    const phone = matchMedia('(max-width: 760px)');
    const carousel = () => {
      items.forEach(d => {
        const summary = $('summary', d);
        if (phone.matches) {
          if (d.hasAttribute('name')) { d.dataset.name = d.getAttribute('name'); d.removeAttribute('name'); }
          d.open = true;
          summary.tabIndex = -1;
        } else {
          if (d.dataset.name) d.setAttribute('name', d.dataset.name);
          summary.removeAttribute('tabindex');
        }
      });
      if (!phone.matches) items.forEach((d, i) => { d.open = i === 0; });
    };
    carousel();
    phone.addEventListener('change', carousel);
    track.addEventListener('scroll', () => {
      if (!phone.matches) return;
      const step = items[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
      const idx = clamp(Math.round(track.scrollLeft / step), 0, items.length - 1);
      dots.forEach((dot, i) => dot.classList.toggle('is-on', i === idx));
    }, { passive: true });
    dots[0]?.classList.add('is-on');
    $('.bill-list').addEventListener('pointerleave', () => {
      const open = items.findIndex(d => d.open);
      if (open >= 0) show(open);
    });
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

      const tag = kindTag(t.kind) ?? '';

      if (!motion) {
        prev.forEach(p => p.remove());
        nameEl.textContent = t.name;
        lineEl.textContent = t.line;
        tagEl.replaceChildren(tag, ` ${t.place}`);
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
        tagEl.replaceChildren(tag, ` ${t.place}`);
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
  // ---------- Catálogo de muestra (carga al acercarse) ----------
  const catalogSection = $('#catalogo');
  if (catalogSection) {
    // Una sola promesa: el catálogo y el carrusel esperan lo mismo (la ficha existe cuando resuelve).
    let catalogReady;
    const bootCatalog = () => (catalogReady ??= import('./catalog.js').then(m => m.initCatalog({ isMotion })).catch(() => {
      catalogReady = undefined;
      const st = $('[data-cat-status]', catalogSection);
      if (st) st.textContent = 'No pudimos cargar la muestra. Escríbenos por WhatsApp y te ayudamos a buscar.';
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
    // Explorar la muestra: en móvil es una hoja a pantalla completa (la rejilla deja de alargar el capítulo);
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
      const openExplorer = async () => {
        if (!phone.matches || explorer.open || opening) return;
        opening = true;
        try { await bootCatalog(); } finally { opening = false; }
        if (!phone.matches || explorer.open) return;
        await openDialog(explorer, { lock: 'explorer-open', url: '#explorar', defer: true }); // bloquea el scroll y empuja la entrada que «atrás» consume; la rejilla se maqueta en otra tarea (ver openDialog)
        if (explorer.open) $('[data-ex-close]', explorer).focus({ preventScroll: true });
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
      // Cualquier enlace a la muestra abre la hoja en móvil (el menú lateral la abre al terminar de cerrarse).
      document.addEventListener('click', e => {
        const a = e.target.closest('a[href="#catalogo"]');
        if (!a || a.closest('#sheet-menu')) return;
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
      const bootRail = () => {
        import('./news.js').then(m => m.initNews({ ensureCatalog: bootCatalog })).catch(() => {}); // Novedades: sin datos queda oculta
        return import('./rail.js').then(m => m.initRail({ ensureCatalog: bootCatalog, isMotion })).catch(() => { railEl.hidden = true; });
      };
      if ('IntersectionObserver' in window) {
        const railIo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { railIo.disconnect(); bootRail(); } }, { rootMargin: '700px 0px' });
        railIo.observe(railEl);
      } else bootRail();
    }
  }

  // ---------- Mi lista para la visita (en reposo: el menú y la cabecera muestran el conteo) ----------
  (window.requestIdleCallback || (cb => setTimeout(cb, 600)))(() => import('./saved.js').then(m => m.initSaved()).catch(() => {}), { timeout: 3000 });

  await yieldNow();
  // ---------- Perfil y publicaciones (móvil): historias de los destacados, «Me interesa» y «Compartir» ----------
  let feedLoad;
  const loadFeed = () => (feedLoad ??= import('./feed.js').catch(err => { feedLoad = undefined; throw err; }));
  document.addEventListener('click', e => {
    const hl = e.target.closest('[data-story]');
    if (hl) {
      e.preventDefault();
      loadFeed().then(m => m.openStory(hl.dataset.story, hl, TOPICS)).catch(() => { location.hash = hl.getAttribute('href'); }); // sin módulo: lleva al capítulo
      return;
    }
    const act = e.target.closest('[data-interest], [data-share]');
    if (act) loadFeed().then(m => m.onAct(act)).catch(() => {});
  });
  (window.requestIdleCallback || (cb => setTimeout(cb, 800)))(() => loadFeed().then(m => m.initFeed()).catch(() => {}), { timeout: 4000 });

  // ---------- Magnetic buttons ----------
  $$('[data-magnetic]').forEach(btn => {
    btn.addEventListener('pointermove', e => {
      if (!fineMq.matches || !isMotion()) return;
      const r = btn.getBoundingClientRect();
      btn.style.setProperty('--mx', `${(((e.clientX - r.left) / r.width - 0.5) * 12).toFixed(1)}px`);
      btn.style.setProperty('--my', `${(((e.clientY - r.top) / r.height - 0.5) * 10).toFixed(1)}px`);
    });
    btn.addEventListener('pointerleave', () => { btn.style.removeProperty('--mx'); btn.style.removeProperty('--my'); });
  });

  await yieldNow();
  // ---------- Start ----------
  applyMode({ measure: false }); // la primera medición va después de fuentes y póster (abajo)
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const posterReady = $('.entry-poster').decode().catch(() => {});
  Promise.race([Promise.all([fontsReady, posterReady]), new Promise(r => setTimeout(r, 900))]).then(() => {
    measureAll(); // entry.measure() ajusta el nombre antes de leer nada: un solo ajuste y un solo maquetado
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('intro')));
  });
  // El nombre gigante del pie solo se ajusta cuando se acerca a la pantalla (cada ajuste fuerza un layout completo).
  let footFitted = false;
  const fitFoot = () => { footFitted = true; fitWord(footMark, footChars); };
  if ('IntersectionObserver' in window) {
    const footIo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { footIo.disconnect(); fitFoot(); } }, { rootMargin: '600px 0px' });
    footIo.observe(footMark);
  } else fitFoot();
  fontsReady.then(() => { if (footFitted) fitFoot(); });
  addEventListener('resize', () => { if (footFitted) fitFoot(); });
}
