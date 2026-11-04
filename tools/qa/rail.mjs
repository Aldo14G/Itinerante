import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const port = 9700 + Math.floor(Math.random() * 50);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-r-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map(); const errs = [];
ws.addEventListener('message', e => {
  const m = JSON.parse(e.data);
  if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); }
  else if (m.method === 'Runtime.exceptionThrown') errs.push(m.params.exceptionDetails.exception?.description || m.params.exceptionDetails.text);
  else if (m.method === 'Log.entryAdded' && m.params.entry.level === 'error') errs.push(m.params.entry.text + ' ' + (m.params.entry.url || ''));
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); if (r.result?.exceptionDetails) errs.push('EVAL ' + (r.result.exceptionDetails.exception?.description || r.result.exceptionDetails.text)); return r.result?.result?.value; };
const key = async (k, code, vk) => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: k, code, windowsVirtualKeyCode: vk }); };
await send('Page.enable'); await send('Runtime.enable'); await send('Log.enable');

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);

for (const [name, w, h, mobile] of [['móvil', 390, 844, true], ['móvil 360', 360, 740, true], ['escritorio', 1280, 800, false]]) {
  errs.length = 0;
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setTouchEmulationEnabled', { enabled: mobile, maxTouchPoints: mobile ? 5 : 0 });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
  await sleep(2500);
  await ev(`scrollBy(0, 1)`);
  await sleep(800);
  const st = await ev(`(() => {
    const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]');
    const items = [...r.querySelectorAll('.rail-item')]; const first = items[0].getBoundingClientRect();
    const ctrl = getComputedStyle(r.querySelector('.rail-ctrl')).display;
    return {
      ready: r.classList.contains('is-ready'), hidden: r.hidden, n: items.length,
      chips: [...r.querySelectorAll('.rail-chip')].map(c => c.textContent),
      checked: r.querySelectorAll('.rail-chip[aria-checked=true]').length,
      vw: v.clientWidth, sw: v.scrollWidth, firstW: Math.round(first.width),
      visible: items.filter(i => { const b = i.getBoundingClientRect(); return b.left >= 0 && b.right <= innerWidth + 1; }).length,
      peek: items.some(i => { const b = i.getBoundingClientRect(); return b.left < innerWidth && b.right > innerWidth; }),
      snap: getComputedStyle(v).scrollSnapType, role: v.getAttribute('aria-roledescription'), tab: v.tabIndex, ctrl,
      sk: r.querySelectorAll('.card--sk').length,
      small: [...r.querySelectorAll('.rail-chip, .rail-btn')].filter(b => b.getBoundingClientRect().width > 0 && (b.getBoundingClientRect().height < 44 || b.getBoundingClientRect().width < 44)).length,
      docW: document.documentElement.scrollWidth === document.documentElement.clientWidth
    };
  })()`);
  ck(name + ': carrusel listo, 4 colecciones, 12 tarjetas, sin esqueletos', st.ready && !st.hidden && st.chips.length === 4 && st.checked === 1 && st.n === 12 && st.sk === 0, JSON.stringify(st));
  ck(name + ': snap, rol y foco accesibles', /x mandatory/.test(st.snap) && st.role === 'carrusel' && st.tab === 0, JSON.stringify(st));
  ck(name + ': se asoma la siguiente tarjeta', st.peek && st.sw > st.vw, JSON.stringify(st));
  ck(name + ': sin desborde de la página', st.docW);
  ck(name + ': objetivos de 44px o más', st.small === 0, String(st.small));
  if (mobile) ck('móvil: cerca de 2.3 tarjetas por vista', st.firstW >= 140 && st.firstW <= 175 && st.visible >= 2 && st.visible <= 3, JSON.stringify({ w: st.firstW, vis: st.visible }));
  else {
    const fine = await ev(`matchMedia('(hover: hover) and (pointer: fine)').matches`);
    ck('escritorio: flechas visibles con puntero fino (o ocultas si el entorno no lo reporta)', fine ? st.ctrl === 'flex' : st.ctrl === 'none', JSON.stringify({ fine, ctrl: st.ctrl }));
    const btn = await ev(`(async () => {
      const sh = new CSSStyleSheet(); sh.replaceSync('.rail-ctrl { display: flex !important; }'); document.adoptedStyleSheets = [...document.adoptedStyleSheets, sh];
      const r = document.querySelector('[data-rail]'); const v = r.querySelector('[data-rail-viewport]'); v.scrollTo({ left: 0, behavior: 'instant' });
      await new Promise(x => setTimeout(x, 300));
      const before = v.scrollLeft; r.querySelector('[data-rail-next]').click(); await new Promise(x => setTimeout(x, 900));
      const mid = v.scrollLeft; r.querySelector('[data-rail-prev]').click(); await new Promise(x => setTimeout(x, 900));
      return { before, mid, after: v.scrollLeft, step: Math.round(v.clientWidth * 0.85) };
    })()`);
    ck('escritorio: las flechas desplazan hacia delante y hacia atrás', btn.mid > btn.before + 100 && btn.after < btn.mid, JSON.stringify(btn));
    ck('escritorio: de 4 a 6 tarjetas completas', st.visible >= 4 && st.visible <= 6, String(st.visible));
  }
  const col = await ev(`(async () => {
    const r = document.querySelector('[data-rail]'); const first = r.querySelector('.rail-item .cover-title').textContent;
    r.querySelectorAll('.rail-chip')[1].click(); await new Promise(x => setTimeout(x, 500));
    return { changed: r.querySelector('.rail-item .cover-title').textContent !== first, label: r.querySelector('[data-rail-viewport]').getAttribute('aria-label'), live: r.querySelector('[data-rail-live]').textContent, n: r.querySelectorAll('.rail-item').length, sl: r.querySelector('[data-rail-viewport]').scrollLeft };
  })()`);
  ck(name + ': cambiar de colección renueva libros, etiqueta y aviso', col.changed && /Suspenso/.test(col.label) && /Suspenso/.test(col.live) && col.n > 0 && col.sl === 0, JSON.stringify(col));
  // Verdad (regla 3): el rótulo exacto de muestra sigue visible junto al carrusel con cada colección, y la nota de la colección es otra línea.
  const seal = await ev(`(async () => {
    const r = document.querySelector('[data-rail]'); const out = [];
    for (const chip of r.querySelectorAll('.rail-chip')) {
      chip.click(); await new Promise(x => setTimeout(x, 700));
      const s = r.querySelector('[data-rail-seal]'); const n = r.querySelector('[data-rail-note]'); const b = s.getBoundingClientRect(); const range = document.createRange(); range.selectNodeContents(s);
      out.push({ col: chip.textContent, text: s.textContent.trim(), shown: b.width > 0 && b.height > 0 && getComputedStyle(s).visibility === 'visible' && !s.closest('[hidden]'), lines: range.getClientRects().length, note: n.textContent, sep: s !== n && !n.contains(s) && !s.contains(n), inBody: document.body.innerText.includes('Datos de muestra · no es inventario'), above: b.bottom <= r.querySelector('[data-rail-viewport]').getBoundingClientRect().top + 1 });
    }
    return out;
  })()`);
  ck(name + ': con las 4 colecciones el rótulo «Datos de muestra · no es inventario.» sigue visible, en una línea, antes del carrusel y aparte de la nota', seal.length === 4 && seal.every(s => s.text === 'Datos de muestra · no es inventario.' && s.shown && s.lines === 1 && s.sep && s.inBody && s.above && s.note && !/inventario/.test(s.note)), JSON.stringify(seal));
  // Una sola taxonomía a la vista: elegir un tema de consulta marca la colección equivalente y el estado activo es el mismo.
  const link = await ev(`(async () => {
    const r = document.querySelector('[data-rail]'); const t = document.querySelector('.topic[data-topic="cronica"]');
    r.querySelectorAll('.rail-chip')[0].click(); await new Promise(x => setTimeout(x, 600));
    t.click(); await new Promise(x => setTimeout(x, 1200));
    const on = r.querySelector('.rail-chip[aria-checked=true]');
    const bg = e => getComputedStyle(e).backgroundColor;
    const first = document.querySelector('.topic[aria-checked=true]'); const cta = document.querySelector('.btn--tungsten');
    const out = { chip: on && on.textContent, topic: first && first.dataset.topic, chipBg: bg(on), topicBg: bg(first), ctaBg: bg(cta), chipFg: getComputedStyle(on).color, topicFg: getComputedStyle(first).color };
    document.querySelector('.topic[data-topic="poesia"]').click(); await new Promise(x => setTimeout(x, 800));
    out.sinEquivalente = r.querySelector('.rail-chip[aria-checked=true]').textContent;
    document.querySelector('.topic[data-topic="narrativa"]').click(); await new Promise(x => setTimeout(x, 800));
    out.narrativa = r.querySelector('.rail-chip[aria-checked=true]').textContent;
    return out;
  })()`);
  ck(name + ': elegir el tema Crónica marca Memorias, Poesía (sin equivalente) la deja y Narrativa vuelve a una colección de narrativa', link.chip === 'Memorias' && link.topic === 'cronica' && link.sinEquivalente === 'Memorias' && ['Ciencia ficción', 'Suspenso', 'Novela histórica'].includes(link.narrativa), JSON.stringify(link));
  if (mobile) ck('móvil: el chip activo del carrusel y el del tema comparten fondo y tinta, y no son el terracota de «Cómo llegar»', link.chipBg === link.topicBg && link.chipFg === link.topicFg && link.chipBg !== link.ctaBg, JSON.stringify(link));
  await ev(`document.querySelector('[data-rail-viewport]').scrollTo({ left: 600, behavior: 'instant' })`);
  await sleep(500);
  const sc = await ev(`(() => { const r = document.querySelector('[data-rail]'); return { tr: getComputedStyle(r.querySelector('[data-rail-thumb]')).transform, prev: r.querySelector('[data-rail-prev]').disabled, next: r.querySelector('[data-rail-next]').disabled }; })()`);
  ck(name + ': el progreso y los botones siguen el desplazamiento', sc.tr !== 'none' && sc.tr !== 'matrix(1, 0, 0, 1, 0, 0)' && sc.prev === false, JSON.stringify(sc));
  await ev(`const v = document.querySelector('[data-rail-viewport]'); v.scrollTo({ left: 0, behavior: 'instant' }); v.focus()`);
  await sleep(300);
  await key('ArrowRight', 'ArrowRight', 39);
  await sleep(700);
  ck(name + ': flecha derecha desplaza', (await ev(`document.querySelector('[data-rail-viewport]').scrollLeft`)) > 40);
  // Tab recorre las 12 tarjetas y sus «Guardar»: la enfocada nunca queda recortada por el borde del carrusel.
  await ev(`(() => { const vp = document.querySelector('[data-rail-viewport]'); vp.scrollTo({ left: 0, behavior: 'instant' }); vp.focus(); })()`);
  const clipped = []; let stops = 0;
  for (let i = 0; i < 30; i++) {
    await key('Tab', 'Tab', 9); await sleep(450);
    const st = await ev(`(() => { const a = document.activeElement; const it = a.closest('[data-rail-track] .rail-item'); if (!it) return null; const b = it.getBoundingClientRect(); const r = document.querySelector('[data-rail-viewport]').getBoundingClientRect(); return { t: a.getAttribute('aria-label') || a.textContent.trim().slice(0, 30), ok: b.left >= r.left - 1 && b.right <= r.right + 1 }; })()`);
    if (!st) break;
    stops += 1; if (!st.ok) clipped.push(st.t);
  }
  ck(name + ': Tab recorre las 24 paradas del carrusel sin dejar recortada la tarjeta enfocada', stops === 24 && !clipped.length, JSON.stringify({ stops, clipped }));
  const fich = await ev(`(async () => {
    const c = document.querySelector('[data-rail] .rail-item .card'); c.focus(); c.click();
    for (let i = 0; i < 40; i++) { await new Promise(r => setTimeout(r, 200)); const d = document.getElementById('cat-drawer'); if (d && d.open) break; }
    const d = document.getElementById('cat-drawer'); const tt = d && d.querySelector('[data-d-title]').textContent;
    return { open: !!(d && d.open), same: tt === c.querySelector('.cover-title').textContent, sheet: document.documentElement.classList.contains('sheet-open') };
  })()`);
  ck(name + ': el libro abre la ficha del catálogo', fich.open && fich.same && fich.sheet, JSON.stringify(fich));
  await key('Escape', 'Escape', 27);
  await sleep(700);
  const back = await ev(`(() => { const a = document.activeElement; return { inRail: !!a.closest('[data-rail]'), cls: a.className }; })()`);
  ck(name + ': al cerrar la ficha el foco vuelve a la tarjeta', back.inRail, JSON.stringify(back));
  ck(name + ': sin errores de consola', !errs.length, errs.join(' | '));
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`rail-${name}.jpg`, Buffer.from(shot.result.data, 'base64'));
}
for (const l of out) console.log(l.join(' '));
console.log('FALLAN', out.filter(l => l[0] === '✗').length, 'de', out.length);
chrome.kill();
process.exit(0);
