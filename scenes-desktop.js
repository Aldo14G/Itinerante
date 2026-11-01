// Escenas que solo existen en pantallas grandes: el recorrido por fotogramas del hero y la cortinilla de tiles.
// app.js las carga con import() solo cuando hay movimiento y la pantalla es de escritorio; el móvil no las descarga ni las evalúa.
const SEQ_COUNT = 145;
const SEQ_MOBILE = 73;

export function createEntryScene(c, lean) {
  const { $, $$, clamp, smooth, damp, absTop, isMotion, kick } = c;
  const vw = () => c.vw(), vh = () => c.vh();
  const sec = lean.sec;
  const stage = $('.entry-stage', sec);
  const media = $('.entry-media', sec);
  const canvas = $('.entry-canvas', sec);
  let ctx = null; // el contexto 2D se crea al dimensionar el lienzo, no antes
  const { chars } = lean;
  const fades = $$('.entry-row, .entry-facts', sec);
  const beat2 = $('[data-beat="2"]', sec);
  let top = 0, h = 1, sp = 0, frames = [], drawnK = -1, started = false;

  const mobile = () => vw() <= 760;
  const pad = n => String(n).padStart(3, '0');
  const inflight = new Set();
  const failed = new Set(); // fotogramas que fallaron: no se reintentan en cada tick
  const keys = new Set();
  let keysOn = false, cur = 0, framePath = null, count = 0, keyStride = 12;

  function sizeCanvas() {
    const w = Math.max(1, Math.round(stage.clientWidth));
    const hh = Math.max(1, Math.round(stage.clientHeight));
    ctx ||= canvas.getContext('2d', { alpha: false });
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
    if (!img || !ctx) return;
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
    enable() { if (!mobile()) load(); if (frames[0]) sec.classList.add('is-live'); },
    measure() {
      top = absTop(sec);
      h = sec.offsetHeight;
      if (isMotion() && !mobile()) sizeCanvas();
    },
    tick(dt, y) {
      if (!isMotion() || mobile()) return false; // en móvil el hero es un póster fijo
      const p = clamp((y - top) / Math.max(1, h - vh()));
      if (y > top + h || y + vh() < top) { sp = p; return false; }
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
        c.style.transform = w ? `translate3d(${(o * w * vw() * 0.46).toFixed(1)}px, ${(-w * 34).toFixed(1)}px, 0) scale(${(1 + w * 0.28).toFixed(3)})` : '';
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
    }
  };
}

export function createWipeScene(c) {
  const { $, clamp, absTop, isMotion } = c;
  const vw = () => c.vw(), vh = () => c.vh();
  const sec = $('.wipe');
  const grid = $('[data-wipe-grid]', sec);
  let tiles = [], top = 0, h = 1, cols = 0, rows = 0;

  function build() {
    const nextCols = vw() <= 760 ? 6 : 12;
    const nextRows = Math.ceil(vh() / (vw() / nextCols));
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
      if (!isMotion() || y + vh() < top || y > top + h) return false;
      const p = clamp((y - (top - vh() * 0.5)) / (vh() * 0.95));
      tiles.forEach(t => {
        const k = clamp((p * 1.12 - t.d) / 0.42);
        const e = Math.round((1 - (1 - k) ** 3) * 1000) / 1000;
        if (e !== t.v) { t.el.style.transform = `scale(${(e * 1.02).toFixed(3)})`; t.v = e; }
      });
      return false;
    }
  };
}
