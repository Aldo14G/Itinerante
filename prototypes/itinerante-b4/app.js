// Itinerante B.4 · escenas sincronizadas al scroll, sin dependencias.

const WA = 'https://wa.me/528180875940';
const SEQ_COUNT = 145;
const SEQ_MOBILE = 73;

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

export function monterreyNow(date = new Date()) {
  const parts = Object.fromEntries(new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Monterrey', weekday: 'short', hour: '2-digit', minute: '2-digit', hourCycle: 'h23'
  }).formatToParts(date).map(part => [part.type, part.value]));
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

if (typeof document !== 'undefined') boot();

function boot() {
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
  const motionOn = () => !reduceMq.matches && !userOff && !saveData;
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
    $$('.hours tr').forEach(tr => tr.classList.toggle('is-today', Number(tr.dataset.day) === now.day));
  }
  updateStatus();
  setInterval(updateStatus, 60_000);

  // ---------- Scenes ----------
  const scenes = [];

  function entryScene() {
    const sec = $('.entry');
    const stage = $('.entry-stage', sec);
    const media = $('.entry-media', sec);
    const canvas = $('.entry-canvas', sec);
    const ctx = canvas.getContext('2d', { alpha: false });
    const word = $('[data-wordmark]', sec);
    const chars = splitChars(word);
    const fades = $$('.entry-row, .entry-facts', sec);
    const beat2 = $('[data-beat="2"]', sec);
    let top = 0, h = 1, sp = 0, frames = [], drawnK = -1, started = false;

    const mobile = () => vw <= 760;
    const pad = n => String(n).padStart(3, '0');
    const inflight = new Set();
    const failed = new Set(); // fotogramas que fallaron: no se reintentan en cada tick
    const keys = new Set();
    let keysOn = false, cur = 0, framePath = null, count = 0, keyStride = 12;

    function sizeCanvas() {
      const w = Math.max(1, Math.round(stage.clientWidth));
      const hh = Math.max(1, Math.round(stage.clientHeight));
      if (canvas.width === w && canvas.height === hh) return;
      canvas.width = w;
      canvas.height = hh;
      ctx.imageSmoothingQuality = 'high';
      drawnK = -1;
      const k = nearest(cur);
      if (k !== -1) draw(k);
    }

    function draw(k, alpha = 1) {
      const img = frames[k];
      if (!img) return;
      ctx.globalAlpha = alpha;
      const cw = canvas.width, ch = canvas.height, iw = img.naturalWidth, ih = img.naturalHeight;
      const scale = Math.max(cw / iw, ch / ih);
      const dw = iw * scale, dh = ih * scale;
      ctx.drawImage(img, (cw - dw) * (mobile() ? 0.5 : 0.58), (ch - dh) * 0.5, dw, dh);
      ctx.globalAlpha = 1;
      drawnK = k;
    }

    function nearest(target) {
      for (let d = 0; d < frames.length; d++) {
        if (frames[target - d]) return target - d;
        if (frames[target + d]) return target + d;
      }
      return -1;
    }

    function ensure(k) {
      if (k < 0 || k >= count || frames[k] || failed.has(k) || inflight.has(k) || inflight.size >= 4) return;
      inflight.add(k);
      const img = new Image();
      img.decoding = 'async';
      img.fetchPriority = keys.has(k) ? 'low' : 'auto';
      img.src = framePath(k);
      img.decode().then(() => {
        frames[k] = img;
        if (k === 0) { draw(0); sec.classList.add('is-live'); }
        if (Math.abs(k - cur) < 2) drawnK = -1;
        evict();
        kick();
      }).catch(() => { failed.add(k); }).finally(() => { inflight.delete(k); kick(); });
    }

    // Conserva los fotogramas clave y una ventana alrededor del actual; el resto se libera.
    function evict() {
      const loaded = frames.map((f, i) => (f && !keys.has(i) ? i : -1)).filter(i => i >= 0);
      if (loaded.length <= 36) return;
      loaded.sort((x, y) => Math.abs(y - cur) - Math.abs(x - cur));
      loaded.slice(0, loaded.length - 36).forEach(i => { frames[i] = null; });
    }

    function pump() {
      if (!keysOn) return;
      for (let k = 0; k < count; k += keyStride) ensure(k);
      ensure(count - 1);
      for (let d = 0; d <= 10; d++) { ensure(cur + d); ensure(cur - d); }
    }

    function load() {
      if (started) return;
      started = true;
      const m = mobile();
      count = m ? SEQ_MOBILE : SEQ_COUNT;
      keyStride = m ? 6 : 12;
      framePath = k => m ? `assets/seq-m/m${pad(k + 1)}.webp` : `assets/seq/f${pad(k + 1)}.webp`;
      frames = new Array(count).fill(null);
      for (let k = 0; k < count; k += keyStride) keys.add(k);
      keys.add(count - 1);
      const start = () => { keysOn = true; pump(); };
      // El recorrido empieza cuando el navegador está libre o la persona interactúa.
      const once = () => { removeEventListener('wheel', once); removeEventListener('touchstart', once); removeEventListener('keydown', once); start(); };
      addEventListener('wheel', once, { passive: true, once: true });
      addEventListener('touchstart', once, { passive: true, once: true });
      addEventListener('keydown', once, { once: true });
      (window.requestIdleCallback || (cb => setTimeout(cb, 700)))(start, { timeout: 2500 });
    }

    const setBeat = (el, o) => {
      el.style.opacity = o.toFixed(3);
      el.style.transform = `translate3d(0, ${((1 - o) * 26).toFixed(1)}px, 0)`;
    };

    return {
      enable() { load(); if (frames[0]) sec.classList.add('is-live'); },
      measure() {
        top = absTop(sec);
        h = sec.offsetHeight;
        fitWord(word, chars);
        if (isMotion()) sizeCanvas();
      },
      tick(dt, y) {
        if (!isMotion()) return false;
        const p = clamp((y - top) / Math.max(1, h - vh));
        if (y > top + h || y + vh < top) { sp = p; return false; }
        sp = damp(sp, p, 8, dt);

        if (frames.length) {
          const pos = sp * (count - 1);
          cur = Math.round(pos);
          pump();
          // Fundido entre fotogramas contiguos: el recorrido fluye en lugar de saltar de imagen en imagen.
          const lo = Math.floor(pos), mix = pos - lo;
          const a = nearest(lo), b = nearest(Math.min(count - 1, lo + 1));
          const steps = a !== -1 && b !== a && Math.abs(b - a) <= 2 && mix > 0.04 ? Math.round(mix * 16) : 0;
          const key = `${a}:${b}:${steps}`;
          if (a !== -1 && key !== drawnK) { draw(a); if (steps) draw(b, steps / 16); drawnK = key; }
        }

        const a = smooth(0, 0.15, sp);
        fades.forEach(el => {
          el.style.opacity = (1 - a).toFixed(3);
          el.style.transform = a ? `translate3d(0, ${(-a * 28).toFixed(1)}px, 0)` : '';
          el.style.pointerEvents = a > 0.98 ? 'none' : '';
        });

        const w = smooth(0.015, 0.34, sp);
        const mid = (chars.length - 1) / 2;
        chars.forEach((c, i) => {
          const o = (i - mid) / mid;
          c.style.transform = w ? `translate3d(${(o * w * vw * 0.46).toFixed(1)}px, ${(-w * 34).toFixed(1)}px, 0) scale(${(1 + w * 0.28).toFixed(3)})` : '';
          c.style.opacity = w ? (1 - w).toFixed(3) : '';
        });

        setBeat(beat2, smooth(0.30, 0.38, sp) * (1 - smooth(0.50, 0.58, sp)));

        media.style.setProperty('--end', (smooth(0.93, 1, sp) * 0.5).toFixed(3));
        return Math.abs(sp - p) > 0.0004;
      },
      reset() {
        [...chars, ...fades, beat2].forEach(el => { el.style.transform = ''; el.style.opacity = ''; el.style.pointerEvents = ''; });
        media.style.removeProperty('--end');
        sec.classList.remove('is-live');
      },
      fitOnly() { fitWord(word, chars); }
    };
  }

  function manifestoScene() {
    const sec = $('.manifesto');
    const text = $('[data-words]', sec);
    const words = splitWords(text);
    const drifts = $$('[data-drift]', sec).map(el => ({ el, amt: Number(el.dataset.drift) }));
    let top = 0, h = 1, start = 0, end = 1, lit = -1;
    return {
      measure() {
        top = absTop(sec);
        h = sec.offsetHeight;
        const tTop = absTop(text);
        start = tTop - vh * 0.85;
        end = tTop + text.offsetHeight - vh * 0.42;
        lit = -1;
      },
      tick(dt, y) {
        if (!isMotion() || y + vh < top || y > top + h) return false;
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
    let top = 0, h = 1, dist = 0, sp = 0, pinned = false, centers = [], lastIdx = -1;

    const setIndex = p => {
      const idx = Math.round(p * (stills.length - 1));
      if (idx !== lastIdx) {
        idxEl.textContent = String(idx + 1).padStart(2, '0');
        stills.forEach((el, i) => el.classList.toggle('is-center', i === idx));
        lastIdx = idx;
      }
      bar.style.transform = `scaleX(${p.toFixed(4)})`;
    };

    track.addEventListener('scroll', () => {
      if (pinned) return;
      const max = track.scrollWidth - track.clientWidth;
      setIndex(max > 0 ? clamp(track.scrollLeft / max) : 0);
    }, { passive: true });

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
        centers = stills.map(s => s.offsetLeft + s.offsetWidth / 2);
      },
      tick(dt, y) {
        if (!pinned || y + vh < top || y > top + h) return false;
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

  function wipeScene() {
    const sec = $('.wipe');
    const grid = $('[data-wipe-grid]', sec);
    let tiles = [], top = 0, h = 1, cols = 0, rows = 0;

    function build() {
      const nextCols = vw <= 760 ? 6 : 12;
      const nextRows = Math.ceil(vh / (vw / nextCols));
      if (nextCols === cols && nextRows === rows) return;
      cols = nextCols; rows = nextRows;
      grid.style.setProperty('--cols', cols);
      grid.style.gridTemplateRows = `repeat(${rows}, 1fr)`;
      grid.textContent = '';
      tiles = [];
      const frag = document.createDocumentFragment();
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const el = document.createElement('i');
          const parity = (r + c) % 2;
          tiles.push({ el, d: (1 - r / Math.max(1, rows - 1)) * 0.38 + (c / Math.max(1, cols - 1)) * 0.1 + parity * 0.22, v: -1 });
          frag.append(el);
        }
      }
      grid.append(frag);
    }

    return {
      measure() {
        if (!isMotion()) return;
        build();
        top = absTop(sec);
        h = sec.offsetHeight;
      },
      tick(dt, y) {
        if (!isMotion() || y + vh < top || y > top + h) return false;
        const p = clamp((y - (top - vh * 0.5)) / (vh * 0.95));
        tiles.forEach(t => {
          const k = clamp((p * 1.12 - t.d) / 0.42);
          const e = Math.round((1 - (1 - k) ** 3) * 1000) / 1000;
          if (e !== t.v) { t.el.style.transform = `scale(${(e * 1.02).toFixed(3)})`; t.v = e; }
        });
        return false;
      }
    };
  }

  function marqueeScene() {
    const sec = $('.call');
    const rows = $$('[data-marquee]', sec).map(row => {
      const span = row.firstElementChild;
      for (let i = 0; i < 3; i++) row.append(span.cloneNode(true));
      return { row, span, dir: Number(row.dataset.marquee), x: 0, w: 1 };
    });
    let top = 0, h = 1, sign = 1;
    return {
      measure() {
        top = absTop(sec);
        h = sec.offsetHeight;
        rows.forEach(r => { r.w = r.span.offsetWidth || 1; });
      },
      tick(dt, y) {
        if (!isMotion() || y + vh < top || y > top + h) return false;
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
    const chapters = navLinks.map(a => $(a.getAttribute('href')));
    let ranges = [], chapterRanges = [], hidden = false, current = '';
    return {
      measure() {
        ranges = themed.map(el => ({ top: absTop(el), bottom: absTop(el) + el.offsetHeight, theme: el.dataset.theme }));
        chapterRanges = chapters.map(el => ({ top: absTop(el), bottom: absTop(el) + el.offsetHeight }));
      },
      tick(dt, y) {
        hdr.classList.toggle('is-solid', y > 24);
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
          current = id;
        }
        return false;
      }
    };
  }

  const entry = entryScene();
  scenes.push(headerScene(), entry, manifestoScene(), houseScene(), wipeScene(), marqueeScene());

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
  function applyMode() {
    const on = motionOn();
    root.classList.toggle('motion', on);
    root.classList.toggle('pin-house', on && pinMq.matches);
    if (!on) {
      root.classList.remove('intro');
      scenes.forEach(s => s.reset && s.reset());
    }
    measureAll();
    if (on) scenes.forEach(s => s.enable && s.enable());
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

  // ---------- Menu ----------
  const hdr = $('[data-hdr]');
  const menuBtn = $('.menu-btn');
  const menu = $('#menu');
  const menuLabel = $('.menu-btn-label', menuBtn);
  $$('nav a', menu).forEach((a, i) => a.style.setProperty('--i', i));
  function setMenu(open) {
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
  menuBtn.addEventListener('click', () => setMenu(menuBtn.getAttribute('aria-expanded') !== 'true'));
  menu.addEventListener('click', e => { if (e.target.closest('a')) { setMenu(false); holdHeader = performance.now() + 900; } });
  addEventListener('keydown', e => {
    if (e.key === 'Escape' && !menu.hidden) { setMenu(false); menuBtn.focus(); }
  });
  matchMedia('(min-width: 1101px)').addEventListener('change', e => { if (e.matches) setMenu(false); });

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
      const tag = document.createElement('span');
      tag.className = `tag tag--${item.dataset.kind}`;
      tag.textContent = item.dataset.kind === 'ai' ? 'Recreación IA' : 'Foto real';
      caption.replaceChildren(tag, ` ${item.dataset.caption}`);
    };
    items.forEach((d, i) => {
      d.addEventListener('toggle', () => { if (d.open) show(i); });
      const summary = $('summary', d);
      let intent = 0, hovering = false, suppressed = false;
      const arm = () => { clearTimeout(intent); if (hovering && !suppressed && !d.open) intent = setTimeout(() => { d.open = true; }, 320); };
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
    $('.bill-list').addEventListener('pointerleave', () => {
      const open = items.findIndex(d => d.open);
      if (open >= 0) show(open);
    });
  })();

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
    const ease = 'cubic-bezier(0.16, 1, 0.3, 1)';
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
        if (animate && isMotion()) note.animate([{ opacity: 0.3, transform: 'translateY(4px)' }, { opacity: 1, transform: 'none' }], { duration: 320, easing: ease });
      }
      cta.href = waUrl(msg);
      if (ctaLabel.textContent !== label) {
        ctaLabel.textContent = label;
        if (animate && isMotion()) ctaLabel.animate([{ opacity: 0, transform: 'translateY(70%)' }, { opacity: 1, transform: 'none' }], { duration: 480, easing: ease });
      }
    };

    function select(key, quiet = false) {
      if (key === current || !TOPICS[key]) return;
      current = key;
      const t = TOPICS[key];
      const my = ++token;
      buttons.forEach(b => { const on = b.dataset.topic === key; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; });
      if (!quiet) live.textContent = `${t.name}. ${t.line}`;

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

      const tag = document.createElement('span');
      tag.className = `tag tag--${t.kind}`;
      tag.textContent = t.kind === 'ai' ? 'Recreación IA' : 'Foto real';

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
        layer.animate([{ clipPath: 'inset(0 100% 0 0)' }, { clipPath: 'inset(0 0% 0 0)' }], { duration: 700, easing: ease, fill: 'backwards' });
        img.animate([{ transform: 'scale(1.18) translateX(5%)' }, { transform: 'none' }], { duration: 1000, easing: ease });
        prev.forEach(p => p.firstElementChild.animate([{ transform: 'none', filter: 'brightness(1)' }, { transform: 'translateX(-9%)', filter: 'brightness(0.4)' }], { duration: 700, easing: ease, fill: 'forwards' }));
        setTimeout(() => prev.forEach(p => p.remove()), 750);
      });

      const old = $$('.ch', nameEl);
      old.forEach((c, i) => c.animate([{ transform: 'none', opacity: 1 }, { transform: 'translateY(-105%)', opacity: 0 }], { duration: 260, delay: i * 14, easing: 'cubic-bezier(0.65, 0, 0.35, 1)', fill: 'forwards' }));
      [lineEl, tagEl].forEach(el => el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 200, fill: 'forwards' }));
      setTimeout(() => {
        if (my !== token) return;
        fillName(t.name).forEach((s, i) => s.animate([{ transform: 'translateY(105%)' }, { transform: 'none' }], { duration: 520, delay: i * 24, easing: ease, fill: 'backwards' }));
        lineEl.textContent = t.line;
        tagEl.replaceChildren(tag, ` ${t.place}`);
        [lineEl, tagEl].forEach((el, i) => {
          el.getAnimations().forEach(a => a.cancel());
          el.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'none' }], { duration: 420, delay: 80 + i * 60, easing: ease, fill: 'backwards' });
        });
      }, 220 + old.length * 10);

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
        intent = setTimeout(() => select(b.dataset.topic, true), 250);
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

  // ---------- Catálogo de muestra (carga al acercarse) ----------
  const catalogSection = $('#catalogo');
  if (catalogSection) {
    const bootCatalog = () => import('./catalog.js').then(m => m.initCatalog({ isMotion })).catch(() => {
      const st = $('[data-cat-status]', catalogSection);
      if (st) st.textContent = 'No pudimos cargar la muestra. Escríbenos por WhatsApp y te ayudamos a buscar.';
      $('[data-cat-grid]', catalogSection)?.replaceChildren();
      $('[data-cat-grid]', catalogSection)?.removeAttribute('aria-busy');
      $('[data-cat-filters]', catalogSection)?.replaceChildren();
    });
    if ('IntersectionObserver' in window) {
      const catIo = new IntersectionObserver(es => { if (es.some(e => e.isIntersecting)) { catIo.disconnect(); bootCatalog(); } }, { rootMargin: '900px 0px' });
      catIo.observe(catalogSection);
    } else bootCatalog();
    addEventListener('hashchange', () => { if (location.hash === '#catalogo') bootCatalog(); });
  }

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

  // ---------- Start ----------
  applyMode();
  const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();
  const posterReady = $('.entry-poster').decode().catch(() => {});
  Promise.race([Promise.all([fontsReady, posterReady]), new Promise(r => setTimeout(r, 900))]).then(() => {
    entry.fitOnly();
    fitWord(footMark, footChars);
    measureAll();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.remove('intro')));
  });
  fontsReady.then(() => { fitWord(footMark, footChars); queueMeasure(); });
  addEventListener('resize', () => fitWord(footMark, footChars));
}
