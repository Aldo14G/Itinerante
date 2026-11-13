// Carrusel de libros (capa 1 de Libros): fila de chips de colección (radiogroup, 48 px, teclado, región viva, «Preguntar por {colección}» que
// sigue al chip, sin salto de alto), carrusel 3D de portadas (la del centro de frente, las vecinas giradas; flechas, ← → Inicio Fin, toque en
// una vecina la trae al centro y en la del centro abre la ficha; plano con movimiento reducido), «autor · precio» sin cortar en ningún libro,
// ficha y foco, a 390, 360, 320 y 1280. El carrusel es la variante «portada» del Carrusel3D (carousel3d.js): flechas de vidrio a los lados, región
// con rol de carrusel. Recorrido ligero (A4, 2026-11-13): los chips son las paradas (conector, palomita en las hojeadas, «N de 3 paradas
// hojeadas» y su dato en localStorage) y caben en un renglón a 320 px. En escritorio (≥ 1024) .rail es display: contents (dos columnas,
// A6): las medidas toman como referencia la cabecera del carrusel (.rail-head), que sí tiene caja.
// node tools/qa/rail.mjs URL [DIR]   Las capturas van a DIR (por defecto, el directorio actual).
// Robusto con la máquina cargada (QA1-04): ev() devuelve un valor definido o lanza un error legible (nunca un TypeError
// «of undefined» en el script), y las esperas son por condición con tope en vez de pausas fijas. Si una pantalla aborta,
// se anota como ✗ con el motivo y se sigue con la siguiente; el código de salida es ≠ 0 si algo falló.
import { spawn } from 'node:child_process';
import { mkdirSync, mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
if (!URL_) { console.error('Uso: node tools/qa/rail.mjs URL [DIR]'); process.exit(2); }
const OUT = process.argv[3] || '.';
mkdirSync(OUT, { recursive: true });
const port = 9700 + Math.floor(Math.random() * 50);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-r-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 80; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const page = t?.find(x => x.type === 'page');
if (!page) { chrome.kill(); console.error(`rail.mjs: Chrome no respondió en el puerto ${port} en 20 s (CHROME_PATH=${process.env.CHROME_PATH || 'por defecto'})`); process.exit(2); }
const ws = new WebSocket(page.webSocketDebuggerUrl);
await new Promise((r, j) => { ws.addEventListener('open', r, { once: true }); ws.addEventListener('error', () => j(new Error('rail.mjs: no se pudo abrir el WebSocket de CDP')), { once: true }); });
let id = 0; const pend = new Map(); const errs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
const send = (method, params = {}) => new Promise((res, rej) => {
  const i = ++id;
  pend.set(i, m => m.error ? rej(new Error(`CDP ${method}: ${m.error.message}`)) : res(m));
  ws.send(JSON.stringify({ id: i, method, params }));
});
const short = x => x.replace(/\s+/g, ' ').trim().slice(0, 110);
// ev(): evalúa en la página y devuelve un valor definido; lanza con el motivo y la expresión si la página lanzó o no devolvió nada.
// run(): igual, para sentencias con efecto que no devuelven valor (scrollTo, focus…).
const ev = async (x, { allowUndefined = false } = {}) => {
  const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true });
  const det = r.result?.exceptionDetails;
  if (det) throw new Error(`la página lanzó al evaluar «${short(x)}»: ${det.exception?.description || det.text}`);
  const v = r.result?.result?.value;
  if (v === undefined && !allowUndefined) throw new Error(`ev() no devolvió valor al evaluar «${short(x)}» (¿elemento inexistente o página aún cargando?)`);
  return v;
};
const run = x => ev(x, { allowUndefined: true });
// waitFor(): espera a que una expresión sea verdadera (poll cada 100 ms) o lanza con «qué» esperaba y el tope.
const waitFor = async (cond, what, timeout = 15000) => {
  const t0 = Date.now();
  for (;;) {
    let ok = false; try { ok = await ev(`!!(${cond})`); } catch (e) { if (Date.now() - t0 > timeout) throw e; }
    if (ok) return true;
    if (Date.now() - t0 > timeout) throw new Error(`esperando ${what} (tope ${timeout} ms): «${short(cond)}»`);
    await sleep(100);
  }
};
// settle(): espera a que una expresión sea verdadera, con tope, pero no lanza: devuelve si se cumplió (para «nada debe cambiar»).
const settle = async (cond, timeout = 3000) => { try { return await waitFor(cond, 'settle', timeout); } catch { return false; } };
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

// Ayudantes dentro de la página: until(fn, ms) resuelve en cuanto fn() es verdadera (poll de 50 ms) o rechaza al tope; stable(fn, ms, quiet) espera a
// que fn() lleve `quiet` ms sin cambiar (desplazamiento o lista que terminan de moverse); settled(el) espera a que el elemento no tenga transiciones ni animaciones en curso.
const HELPERS = `(() => {
  if (window.__itiQa) return true;
  const until = (fn, ms = 5000, what = '') => new Promise((res, rej) => { const t0 = performance.now(); (function tick() { let v; try { v = fn(); } catch {} if (v) return res(v); if (performance.now() - t0 > ms) return rej(new Error('until: ' + (what || fn.toString().slice(0, 90)) + ' (' + ms + ' ms)')); setTimeout(tick, 50); })(); });
  const stable = (fn, ms = 3000, quiet = 250) => new Promise(res => { const t0 = performance.now(); let last = fn(), since = t0; (function tick() { const now = performance.now(); const v = fn(); if (v !== last) { last = v; since = now; } if (now - since >= quiet || now - t0 > ms) return res(v); setTimeout(tick, 50); })(); });
  const settled = (el, ms = 3000) => until(() => el.getAnimations().length === 0, ms, 'transiciones de ' + (el.className || el.tagName)).catch(() => false);
  window.__itiQa = { until, stable, settled }; return true;
})()`;
// Cambio de colección: la etiqueta del carrusel nombra la colección, la pista deja aria-busy y la lista deja de crecer.
const AFTER_CHIP = `async chip => { const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-c3d]'); const tr = r.querySelector('[data-rail-track]'); const name = chip.textContent.trim();
  await __itiQa.until(() => v.getAttribute('aria-label').includes(name) && !tr.hasAttribute('aria-busy') && tr.children.length > 0, 8000, 'colección ' + name);
  await __itiQa.stable(() => tr.children.length); }`;
// Estado de la fila de chips, del botón «Preguntar por {colección}» y posición del carrusel dentro de la pieza (para vigilar que nada salte de alto).
const CHIPS = `(() => { const r = document.querySelector('[data-rail]'); const g = r.querySelector('[data-rail-chips]'); const top = r.querySelector('.rail-head').getBoundingClientRect().top;
  const chips = [...g.querySelectorAll('.rail-chip')].map(c => { const b = c.getBoundingClientRect(); const cs = getComputedStyle(c);
    return { id: c.dataset.id, name: c.textContent.trim(), role: c.getAttribute('role'), checked: c.getAttribute('aria-checked'), tab: c.tabIndex, w: Math.round(b.width), h: Math.round(b.height), left: b.left, right: b.right, top: Math.round(b.top), cut: c.scrollWidth > c.clientWidth + 1, fs: cs.fontSize, bg: cs.backgroundColor, mark: getComputedStyle(c, '::before').content }; });
  const ask = r.querySelector('[data-rail-ask]'); const libre = r.querySelector('.rail-libre');
  return { role: g.getAttribute('role'), label: g.getAttribute('aria-label'), chips, gap: chips.slice(1).map((c, i) => c.top === chips[i].top ? Math.round(c.left - chips[i].right) : 99),
    ask: { text: ask.textContent.trim(), msg: new URL(ask.href).searchParams.get('text'), h: Math.round(ask.getBoundingClientRect().height) }, libre: { text: libre.textContent.trim(), h: Math.round(libre.getBoundingClientRect().height), msg: new URL(libre.href).searchParams.get('text') },
    vpTop: Math.round(r.querySelector('[data-rail-viewport]').getBoundingClientRect().top - top), noteTop: Math.round(r.querySelector('[data-rail-note]').getBoundingClientRect().top - top), headH: Math.round(r.querySelector('.rail-head').getBoundingClientRect().height),
    askTop: Math.round(ask.getBoundingClientRect().top - top), live: r.querySelector('[data-rail-live]').textContent, stored: (() => { try { return JSON.parse(localStorage.getItem('iti-recorrido-v2') || '[]'); } catch { return []; } })(),
    progreso: r.querySelector('[data-rail-progreso]').textContent, links: [...g.querySelectorAll('.rail-conector')].map(l => [l.classList.contains('is-hecho'), Math.round(l.getBoundingClientRect().width), Math.round(l.getBoundingClientRect().height)]),
    hojeadas: chips.map(c => g.querySelector('.rail-chip[data-id="' + c.id + '"]').classList.contains('is-hojeada')), row: (() => { const all = [...g.children].map(e => e.getBoundingClientRect()); const pad = parseFloat(getComputedStyle(document.querySelector('.books')).paddingRight); return { one: new Set(all.map(b => Math.round(b.top + b.height / 2))).size === 1, right: Math.round(Math.max(...all.map(b => b.right))), limit: Math.round(innerWidth - pad) }; })() }; })()`;
const READY = `document.querySelector('[data-rail]').classList.contains('is-ready') && !document.querySelector('[data-rail] .card--sk') && document.querySelectorAll('[data-rail] .rail-item').length > 0`;

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['móvil 360', 360, 740, true], ['móvil 320', 320, 640, true], ['escritorio', 1280, 800, false]]) {
  errs.length = 0;
  try {
    await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
    await send('Emulation.setTouchEmulationEnabled', mobile ? { enabled: true, maxTouchPoints: 5 } : { enabled: false }); // maxTouchPoints 0 es un error de CDP (antes se ignoraba en silencio)
    await send('Page.navigate', { url: URL_ });
    await waitFor(`document.readyState === 'complete' && document.querySelector('[data-rail]') && document.documentElement.classList.contains('js')`, 'la página cargada', 30000);
    await ev(HELPERS);
    // Esqueleto de los chips: reserva la fila real (se mide antes de acercarse, con el carrusel sin cargar).
    const sk = await ev(`(() => { const r = document.querySelector('[data-rail]'); const g = r.querySelector('[data-rail-chips]'); return { ready: r.classList.contains('is-ready'), n: g.querySelectorAll('.sk-chip').length, rowH: Math.round(g.getBoundingClientRect().height), headH: Math.round(r.querySelector('.rail-head').getBoundingClientRect().height) }; })()`);
    await run(`try { localStorage.removeItem('iti-recorrido-v2'); } catch {}`); // cada pantalla empieza el recorrido de cero
    await run(`scrollTo(0, document.querySelector('[data-rail] .rail-head').getBoundingClientRect().top + scrollY - 120)`);
    await run(`scrollBy(0, 1)`);
    await waitFor(READY, 'el carrusel listo (is-ready, sin esqueletos)', 30000);
    await ev(`__itiQa.stable(() => document.querySelectorAll('[data-rail] .rail-item').length)`);
    const st = await ev(`(() => {
      const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); const reg = r.querySelector('[data-rail-c3d]');
      const items = [...r.querySelectorAll('.rail-item')]; const c = r.querySelector('.rail-item.is-centro'); const ci = items.indexOf(c); const cb = c.getBoundingClientRect(); const vb = v.getBoundingClientRect();
      const pose = it => it.querySelector('.cf-pose')?.style.transform || '';
      const meta = r.querySelector('[data-rail-meta]'); const strong = meta.querySelector('strong');
      return {
        ready: r.classList.contains('is-ready'), hidden: r.hidden, n: items.length,
        chips: [...r.querySelectorAll('.rail-chip')].map(c => c.textContent.trim()),
        checked: r.querySelectorAll('.rail-chip[aria-checked=true]').length,
        vw: v.clientWidth, sw: v.scrollWidth, centerW: Math.round(c.offsetWidth), ci, mid: Math.floor(items.length / 2),
        centered: Math.abs(cb.left + cb.width / 2 - (vb.left + vb.width / 2)) <= 2, front: /rotateY\\(-?0(\\.0+)?deg\\)/.test(pose(c)),
        turned: [items[ci - 1], items[ci + 1]].every(n => n && /rotateY\\(-?[1-9]/.test(pose(n))), both: !!items[ci - 1] && !!items[ci + 1],
        snap: getComputedStyle(v).scrollSnapType, role: reg.getAttribute('aria-roledescription') + '/' + reg.getAttribute('role'), tab: v.tabIndex, progreso: r.querySelector('[data-rail-progreso]').textContent, cardTabs: items.filter(i => i.querySelector('.card').tabIndex === 0).map(i => items.indexOf(i)),
        caption: r.querySelector('[data-rail-title]').textContent, meta: meta.textContent, dots: r.querySelectorAll('[data-rail-dots], .cf-progreso, .rail-all, .rail-trail, .rail-stop').length,
        sk: r.querySelectorAll('.card--sk').length,
        flechas: [...r.querySelectorAll('.c3d-flecha')].map(b => { const x = b.getBoundingClientRect(); return [b.className.includes('btn--vidrio'), Math.round(x.width), Math.round(x.height)]; }),
        small: [...r.querySelectorAll('.rail-chip, .c3d-flecha, [data-rail-ask], .rail-libre')].filter(b => b.getBoundingClientRect().width > 0 && (b.getBoundingClientRect().height < 44 || b.getBoundingClientRect().width < 44)).length,
        docW: document.documentElement.scrollWidth === document.documentElement.clientWidth
      };
    })()`);
    ck(name + ': carrusel listo, 3 colecciones (Narrativa, Poesía, Ensayo), 12 tarjetas, sin esqueletos', st.ready && !st.hidden && st.chips.join() === 'Narrativa,Poesía,Ensayo' && st.checked === 1 && st.n === 12 && st.sk === 0, JSON.stringify(st));
    const pics = await ev(`(async () => { const r = document.querySelector('[data-rail]'); const imgs = [...r.querySelectorAll('.cover--img img')]; imgs.forEach(i => { i.loading = 'eager'; }); await Promise.all(imgs.map(i => i.decode().catch(() => {})));
      const covers = [...r.querySelectorAll('.rail-item .cover')].map(c => ({ width: c.offsetWidth, height: c.offsetHeight })); const cards = [...r.querySelectorAll('.rail-item .card')]; // tamaño propio: el giro no cuenta
      return { imgs: imgs.length, broken: imgs.filter(i => !i.complete || !i.naturalWidth).map(i => i.getAttribute('src')), alt: [...new Set(imgs.map(i => i.getAttribute('alt')))], sizes: [...new Set(covers.map(c => Math.round(c.width) + 'x' + Math.round(c.height)))], named: cards.every(c => c.textContent.trim().length > 3 && c.querySelector('.cover-title')) }; })()`);
    ck(name + ': portadas reales en el carrusel: ninguna rota, sin alt (el título y el autor nombran el botón) y todas del mismo tamaño', pics.imgs >= 8 && !pics.broken.length && JSON.stringify(pics.alt) === '[""]' && pics.sizes.length === 1 && pics.named, JSON.stringify(pics));
    ck(name + ': imán, rol de carrusel y una sola parada de tabulador: la portada del centro', /x mandatory/.test(st.snap) && st.role === 'carrusel/region' && st.tab === -1 && JSON.stringify(st.cardTabs) === JSON.stringify([st.ci]), JSON.stringify(st));
    const reduced = await ev(`!document.documentElement.classList.contains('motion')`);
    ck(name + ': empieza por el libro del medio, centrado y de frente, con vecinas a los dos lados' + (reduced ? ' (sin movimiento: planas)' : ' giradas hacia el centro'), st.ci === st.mid && st.centered && st.front && st.both && (reduced ? !st.turned : st.turned) && st.sw > st.vw, JSON.stringify(st));
    ck(name + ': bajo el carrusel, el título y «autor · precio» del libro del centro; sin puntos, recorrido ni «Ver todo el catálogo»', st.caption.length > 2 && /\s· \$\d+ MXN$/.test(st.meta) && st.dots === 0, JSON.stringify({ caption: st.caption, meta: st.meta, retirados: st.dots }));
    ck(name + ': flechas de vidrio de 48 px a los lados; el recorrido empieza en «0 de 3 paradas hojeadas»', st.flechas.length === 2 && st.flechas.every(f => f[0] && f[2] === 48) && st.progreso === '0 de 3 paradas hojeadas', JSON.stringify([st.flechas, st.progreso]));
    ck(name + ': sin desborde de la página', st.docW);
    ck(name + ': objetivos de 44px o más', st.small === 0, String(st.small));
    // «autor · precio» de cada libro de las tres colecciones: nunca cortado y el precio entero en un renglón (defecto de 320 px).
    const metas = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); const bad = []; let n = 0;
      for (const chip of r.querySelectorAll('.rail-chip')) {
        chip.click(); await (${AFTER_CHIP})(chip);
        const items = [...r.querySelectorAll('.rail-item')];
        for (let i = 0; i < items.length; i += 1) {
          v.scrollTo({ left: items[i].offsetLeft + items[i].offsetWidth / 2 - v.clientWidth / 2, behavior: 'instant' });
          await __itiQa.until(() => items[i].classList.contains('is-centro'), 2000).catch(() => {});
          const m = r.querySelector('[data-rail-meta]'); const t = r.querySelector('[data-rail-title]'); const p = m.querySelector('strong'); const rects = p ? p.getClientRects().length : 0;
          n += 1;
          if (m.scrollWidth > m.clientWidth + 1 || m.scrollHeight > m.clientHeight + 1 || rects > 1 || t.scrollWidth > t.clientWidth + 1 || t.scrollHeight > t.clientHeight + 1) bad.push(t.textContent + ' / ' + m.textContent + ' [' + m.scrollWidth + '/' + m.clientWidth + ', ' + rects + ']');
        }
      }
      r.querySelector('.rail-chip').click(); await (${AFTER_CHIP})(r.querySelector('.rail-chip'));
      return { n, bad };
    })()`);
    ck(name + ': título y «autor · precio» de los ' + metas.n + ' libros sin cortarse y con el precio entero (si no cabe, baja de renglón)', metas.n >= 25 && !metas.bad.length, JSON.stringify(metas.bad));
    // ---------- Chips de colección ----------
    const t0 = await ev(CHIPS);
    ck(name + ': chips = radiogroup «Colección» con 3 botones role=radio, uno marcado (primario con palomita) y un solo punto de tabulación', t0.role === 'radiogroup' && t0.label === 'Colección' && t0.chips.length === 3 && t0.chips.every(x => x.role === 'radio') && t0.chips.filter(x => x.checked === 'true').length === 1 && t0.chips.filter(x => x.tab === 0).length === 1 && t0.chips[0].checked === 'true' && t0.chips[0].tab === 0 && t0.chips[0].mark !== 'none', JSON.stringify(t0.chips.map(x => [x.role, x.checked, x.tab, x.mark.slice(0, 6)])));
    ck(name + ': cada chip mide 48 px de alto, con su nombre entero en 15 px y ≥ 8 px entre vecinos', t0.chips.every(x => x.h === 48 && !x.cut && x.fs === '15px') && t0.gap.every(g => g >= 8), JSON.stringify({ chips: t0.chips.map(x => [x.w, x.h, x.fs, x.cut]), gap: t0.gap }));
    ck(name + ': el esqueleto reserva la fila de chips (uno por colección): la cabecera del carrusel mide lo mismo antes y después de cargar', !sk.ready && sk.n === 3 && sk.headH === t0.headH, JSON.stringify({ sk, headH: t0.headH }));
    ck(name + ': bajo el carrusel, «Preguntar por narrativa» (WhatsApp con el mensaje de la colección) y «Pide una recomendación por WhatsApp», con objetivos ≥ 44 px', t0.ask.text === 'Preguntar por narrativa' && /libros de narrativa\. ¿Qué me recomiendan\?$/.test(t0.ask.msg) && t0.ask.h >= 48 && t0.libre.text === 'Pide una recomendación por WhatsApp' && t0.libre.h >= 44 && /no sé por dónde empezar/.test(t0.libre.msg), JSON.stringify({ ask: t0.ask, libre: t0.libre }));
    ck(name + ': recorrido: tras elegir las tres colecciones, «3 de 3 paradas hojeadas», palomita en las tres, conectores de 2 px en primario y guardado en este dispositivo', t0.progreso === '3 de 3 paradas hojeadas' && t0.hojeadas.every(Boolean) && t0.links.length === 2 && t0.links.every(l => l[0] && l[1] >= 8 && l[2] === 2) && JSON.stringify([...t0.stored].sort()) === JSON.stringify(['ensayo', 'narrativa', 'poesia']), JSON.stringify({ p: t0.progreso, h: t0.hojeadas, l: t0.links, s: t0.stored }));
    ck(name + ': las paradas (con su palomita) y sus conectores caben en un renglón, sin partirse ni desbordar', t0.row.one && t0.row.right <= t0.row.limit + 1 && t0.chips.every(x => !x.cut), JSON.stringify(t0.row));
    // Teclado: las flechas mueven la selección y el foco juntos; Tab entra por el chip marcado.
    await run(`document.querySelector('.rail-chip[tabindex="0"]').focus()`);
    await key('ArrowRight', 'ArrowRight', 39);
    await waitFor(`document.activeElement.dataset.id === 'poesia' && document.activeElement.getAttribute('aria-checked') === 'true'`, 'flecha derecha elige Poesía', 5000);
    await run(`(${AFTER_CHIP})(document.activeElement)`);
    const k1 = await ev(CHIPS);
    await key('ArrowLeft', 'ArrowLeft', 37);
    await waitFor(`document.activeElement.dataset.id === 'narrativa' && document.activeElement.getAttribute('aria-checked') === 'true'`, 'flecha izquierda vuelve a Narrativa', 5000);
    await run(`(${AFTER_CHIP})(document.activeElement)`);
    await key('ArrowLeft', 'ArrowLeft', 37);
    await waitFor(`document.activeElement.dataset.id === 'ensayo'`, 'flecha izquierda desde la primera da la vuelta a la última', 5000);
    await run(`(${AFTER_CHIP})(document.activeElement)`);
    const k2 = await ev(CHIPS);
    ck(name + ': teclado: las flechas eligen y enfocan el chip vecino (dan la vuelta), queda un solo tabindex=0 y la región viva dice la colección y su número de libros', k1.chips[1].checked === 'true' && k1.chips.filter(x => x.tab === 0).length === 1 && k1.chips[1].tab === 0 && k1.live === 'Poesía: 8 libros.' && k2.chips[2].checked === 'true' && k2.chips[2].tab === 0 && k2.chips.filter(x => x.tab === 0).length === 1 && k2.live === 'Ensayo: 9 libros.', JSON.stringify({ k1: [k1.live, k1.chips.map(x => x.tab)], k2: [k2.live, k2.chips.map(x => x.tab)] }));
    ck(name + ': «Preguntar por {colección}» sigue al chip (rótulo y mensaje)', k1.ask.text === 'Preguntar por poesía' && /libros de poesía\./.test(k1.ask.msg) && k2.ask.text === 'Preguntar por ensayo' && /libros de ensayo\./.test(k2.ask.msg), JSON.stringify([k1.ask, k2.ask]));
    ck(name + ': elegir chips no mueve la nota ni el carrusel', [k1, k2].every(k => k.vpTop === t0.vpTop && k.noteTop === t0.noteTop && k.headH === t0.headH), JSON.stringify([t0, k1, k2].map(k => [k.noteTop, k.vpTop, k.headH, k.askTop])));
    await run(`document.querySelector('.rail-chip').click()`); // de vuelta al primer chip para lo que sigue
    await run(`(${AFTER_CHIP})(document.querySelector('.rail-chip'))`);
    if (mobile) ck(name + ': la portada del centro mide el 44 % del ancho (148–240 px)', Math.abs(st.centerW - Math.min(240, Math.max(148, w * 0.44))) <= 1, String(st.centerW));
    else ck('escritorio: la portada del centro mide 240 px', st.centerW === 240, String(st.centerW));
    const btn = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); const at = () => [...r.querySelectorAll('.rail-item')].findIndex(i => i.classList.contains('is-centro'));
      const before = at(); r.querySelector('[data-rail-next]').click(); await __itiQa.until(() => at() === before + 1, 4000, 'siguiente al centro').catch(() => {}); await __itiQa.stable(() => v.scrollLeft, 4000);
      const mid = at(); const live = r.querySelector('[data-rail-live]').textContent; r.querySelector('[data-rail-prev]').click(); await __itiQa.until(() => at() === before, 4000, 'anterior al centro').catch(() => {}); await __itiQa.stable(() => v.scrollLeft, 4000);
      return { before, mid, after: at(), live, title: r.querySelectorAll('.rail-item .cover-title')[mid].textContent };
    })()`);
    ck(name + ': las flechas llevan al centro el libro siguiente y el anterior, y la región viva lo anuncia', btn.mid === btn.before + 1 && btn.after === btn.before && btn.live.startsWith(btn.title), JSON.stringify(btn));
    const col = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const first = [...r.querySelectorAll('.rail-item .cover-title')].map(t => t.textContent).join('|');
      const chip = r.querySelectorAll('.rail-chip')[1]; chip.click(); await (${AFTER_CHIP})(chip);
      await __itiQa.stable(() => r.querySelector('[data-rail-viewport]').scrollLeft); const items = [...r.querySelectorAll('.rail-item')];
      return { changed: items.map(i => i.querySelector('.cover-title').textContent).join('|') !== first, label: r.querySelector('[data-rail-c3d]').getAttribute('aria-label'), live: r.querySelector('[data-rail-live]').textContent, n: items.length, centro: items.findIndex(i => i.classList.contains('is-centro')) };
    })()`);
    ck(name + ': cambiar de colección renueva libros, etiqueta y aviso', col.changed && /Poesía/.test(col.label) && /Poesía/.test(col.live) && col.n > 0 && col.centro === Math.floor(col.n / 2), JSON.stringify(col));
    // Plantilla: junto al carrusel solo va la nota de la colección, que cambia con cada una; ningún sello de muestra.
    const seal = await ev(`(async () => {
      const r = document.querySelector('[data-rail]'); const out = [];
      for (const chip of r.querySelectorAll('.rail-chip')) {
        chip.click(); await (${AFTER_CHIP})(chip);
        const n = r.querySelector('[data-rail-note]'); const b = n.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(n);
        out.push({ col: chip.textContent.trim(), vpTop: Math.round(r.querySelector('[data-rail-viewport]').getBoundingClientRect().top - r.querySelector('.rail-head').getBoundingClientRect().top), shown: b.width > 0 && b.height > 0 && getComputedStyle(n).visibility === 'visible' && !n.closest('[hidden]'), lines: range.getClientRects().length, note: n.textContent, seal: !!r.querySelector('[data-rail-seal], .rail-seal') || /Datos de muestra|no es inventario/.test(document.body.innerText), above: b.bottom <= r.querySelector('[data-rail-viewport]').getBoundingClientRect().top + 1 });
      }
      return out;
    })()`);
    ck(name + ': con las 3 colecciones la nota de la colección se ve, en una línea, antes del carrusel, cambia con cada una, no mueve el carrusel y no hay sello de muestra', seal.length === 3 && seal.every(s => s.shown && s.lines === 1 && !s.seal && s.above && s.note && !/inventario|muestra/i.test(s.note) && s.vpTop === t0.vpTop) && new Set(seal.map(s => s.note)).size === 3, JSON.stringify(seal));
    // Deslizar (desplazamiento nativo): el centro y las flechas siguen al desplazamiento.
    await run(`(() => { const v = document.querySelector('[data-rail-viewport]'); v.scrollTo({ left: v.scrollLeft + 3 * document.querySelector('.rail-item').offsetWidth, behavior: 'instant' }); })()`);
    await ev(`__itiQa.stable(() => document.querySelector('[data-rail-viewport]').scrollLeft, 3000, 300)`);
    const sc = await ev(`(() => { const r = document.querySelector('[data-rail]'); const items = [...r.querySelectorAll('.rail-item')]; return { ci: items.findIndex(i => i.classList.contains('is-centro')), prev: r.querySelector('[data-rail-prev]').disabled, next: r.querySelector('[data-rail-next]').disabled, n: items.length }; })()`);
    ck(name + ': al deslizar, el libro del centro y las flechas siguen al desplazamiento', sc.ci === Math.floor(sc.n / 2) + 3 && sc.prev === false, JSON.stringify(sc));
    // Teclado: Tab entra en la portada del centro; ← → Inicio Fin mueven el centro y el foco.
    const kb = [];
    await run(`document.querySelector('[data-rail] .rail-item.is-centro .card').focus()`);
    for (const [k, code, vk] of [['ArrowRight', 'ArrowRight', 39], ['ArrowLeft', 'ArrowLeft', 37], ['End', 'End', 35], ['Home', 'Home', 36]]) {
      await key(k, code, vk);
      await ev(`__itiQa.stable(() => document.querySelector('[data-rail-viewport]').scrollLeft, 4000, 350)`);
      kb.push(await ev(`(() => { const items = [...document.querySelectorAll('[data-rail] .rail-item')]; const a = document.activeElement.closest('.rail-item'); return [items.indexOf(a), items.findIndex(i => i.classList.contains('is-centro')), items.filter(i => i.querySelector('.card').tabIndex === 0).length]; })()`));
    }
    const n0 = await ev(`document.querySelectorAll('[data-rail] .rail-item').length`);
    const at0 = Math.floor(n0 / 2) + 3;
    ck(name + ': teclado: ← → Inicio y Fin llevan el foco y el centro juntos, con una sola parada de tabulador', JSON.stringify(kb) === JSON.stringify([[at0 + 1, at0 + 1, 1], [at0, at0, 1], [n0 - 1, n0 - 1, 1], [0, 0, 1]]), JSON.stringify({ kb, at0, n0 }));
    // Toque en una vecina: viene al centro y no abre la ficha.
    const tap = await ev(`(async () => { const items = [...document.querySelectorAll('[data-rail] .rail-item')]; const v = document.querySelector('[data-rail-viewport]'); items[1].querySelector('.card').click(); await __itiQa.until(() => items[1].classList.contains('is-centro'), 4000, 'la vecina al centro').catch(() => {}); await __itiQa.stable(() => v.scrollLeft, 3000, 300); return { centro: items[1].classList.contains('is-centro'), open: !!document.getElementById('cat-drawer')?.open }; })()`);
    ck(name + ': tocar una vecina la trae al centro (sin abrir la ficha)', tap.centro && !tap.open, JSON.stringify(tap));
    const fich = await ev(`(async () => {
      const c = document.querySelector('[data-rail] .rail-item.is-centro .card'); c.focus(); c.click();
      await __itiQa.until(() => { const d = document.getElementById('cat-drawer'); return d && d.open && d.querySelector('[data-d-title]')?.textContent; }, 15000, 'la ficha abierta').catch(() => {});
      const d = document.getElementById('cat-drawer'); const tt = d && d.querySelector('[data-d-title]')?.textContent;
      return { open: !!(d && d.open), same: tt === c.querySelector('.cover-title').textContent, sheet: document.documentElement.classList.contains('sheet-open') };
    })()`);
    ck(name + ': tocar la portada del centro abre la ficha del catálogo', fich.open && fich.same && fich.sheet, JSON.stringify(fich));
    await key('Escape', 'Escape', 27);
    await settle(`!document.getElementById('cat-drawer')?.open && !document.documentElement.classList.contains('sheet-open')`, 6000);
    await settle(`document.activeElement.closest('[data-rail]')`, 2000);
    const back = await ev(`(() => { const a = document.activeElement; return { inRail: !!a.closest('[data-rail]'), cls: a.className, open: !!document.getElementById('cat-drawer')?.open }; })()`);
    ck(name + ': al cerrar la ficha el foco vuelve a la tarjeta', back.inRail, JSON.stringify(back));
    ck(name + ': sin errores de consola', !errs.length, errs.join(' | '));
    const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
    writeFileSync(join(OUT, `rail-${name}.jpg`), Buffer.from(shot.result.data, 'base64'));
  } catch (e) {
    ck(name + ': la pantalla abortó', false, `${e.message}${errs.length ? ' | consola: ' + errs.join(' | ') : ''}`);
  }
}
for (const l of out) console.log(l.join(' '));
const bad = out.filter(l => l[0] === '✗').length;
console.log('FALLAN', bad, 'de', out.length);
chrome.kill();
process.exit(bad ? 1 : 0);
