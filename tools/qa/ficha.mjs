// Ficha móvil (FichaLibro del sistema «Itinerante Líquido») y sin JavaScript (QA1-03).
// La ficha es una hoja inferior con las acciones fijas al pie: «Preguntar por WhatsApp» (primaria de la ficha), Guardar y «Cómo llegar».
// Uso: node tools/qa/ficha.mjs URL [DIR]   (necesita Chrome; DIR recibe capturas). Sale con 1 si algo falla.
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const DIR = process.argv[3];
const port = 10400 + Math.floor(Math.random() * 90);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-f-'))}`, 'about:blank'], { stdio: 'ignore' });
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
});
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => { const r = await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true }); return r.result?.result?.value; };
const click = async (x, y) => { await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x, y }); for (const type of ['mousePressed', 'mouseReleased']) await send('Input.dispatchMouseEvent', { type, x, y, button: 'left', clickCount: 1 }); };
const press = async (key, code, vk) => { for (const type of ['rawKeyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key, code, windowsVirtualKeyCode: vk }); };
const shot = async name => { if (!DIR) return; const r = await send('Page.captureScreenshot', { format: 'png' }); writeFileSync(join(DIR, name), Buffer.from(r.result.data, 'base64')); };
await send('Page.enable'); await send('Runtime.enable');

const out = [];
const ck = (n, ok, d = '') => out.push([ok ? '✓' : '✗', n, ok ? '' : d]);

// Con un clic real en la tarjeta 2 del carrusel: las acciones del pie quedan dentro de la ventana (sobre el área segura) y la hoja no se desplaza.
for (const [w, h] of [[360, 740], [375, 667], [320, 640], [390, 844]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: URL_ }); await sleep(1500);
  await ev(`localStorage.clear()`);
  await send('Page.navigate', { url: URL_ }); await sleep(4500);
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 120)`);
  await sleep(2500); await ev(`scrollBy(0, 1)`); await sleep(800);
  const p = await ev(`(() => { const r = document.querySelectorAll('[data-rail] .rail-item .card')[1].getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; })()`);
  await click(...p); await sleep(1800);
  const m = await ev(`(() => {
    const d = document.querySelector('#cat-drawer'); const r = d.querySelector('[data-d-visit]').getBoundingClientRect(); const sc = d.querySelector('[data-d-scroll]');
    const cta = d.querySelector('[data-d-cta]').getBoundingClientRect(); const save = d.querySelector('[data-d-save]').getBoundingClientRect(); const foot = d.querySelector('.drawer-foot').getBoundingClientRect();
    const note = d.querySelector('.drawer-note');
    return { open: d.open, bottom: Math.round(r.bottom), cta: [Math.round(cta.top), Math.round(cta.height)], save: [Math.round(save.width), Math.round(save.height)], inFoot: cta.top >= foot.top && r.bottom <= foot.bottom,
      primary: d.querySelector('[data-d-cta]').classList.contains('btn--primario'), scroll: sc.scrollTop, hover: document.documentElement.scrollWidth > innerWidth || sc.scrollWidth > sc.clientWidth,
      note: note.textContent.trim(), seal: !!d.querySelector('.drawer-seal, .drawer-tag, .tag'), focus: document.activeElement.getAttribute('aria-label') };
  })()`);
  ck(`${w}x${h}: acciones fijas al pie dentro de la ventana («Cómo llegar» ${m.bottom} <= ${h - 8}); WhatsApp primaria de 56, Guardar de 56 × 56; hoja sin desplazar, sin desborde`, m.open && m.bottom <= h - 8 && m.inFoot && m.primary && m.cta[1] === 56 && m.save.join() === '56,56' && m.scroll === 0 && !m.hover, JSON.stringify(m));
  ck(`${w}x${h}: sin sello ni rótulo, la nota dice quién confirma la existencia y el foco inicial va en Cerrar`, !m.seal && m.note === 'La librería confirma si lo tienen.' && m.focus === 'Cerrar ficha', JSON.stringify(m));
  // Inventario real: la portada real carga, la ficha técnica trae el precio de la hoja y la sinopsis (con su encabezado) va bajo ella.
  const dd = await ev(`(async () => {
    const d = document.querySelector('#cat-drawer'); const id = d.dataset.book;
    const b = (await (await fetch('assets/data/catalog.json')).json()).books.find(x => x.id === id);
    const img = d.querySelector('[data-d-cover] img'); if (img) await img.decode().catch(() => {});
    const facts = Object.fromEntries([...d.querySelectorAll('[data-d-facts] dt')].map(dt => [dt.textContent, dt.nextElementSibling.textContent]));
    const wrap = d.querySelector('[data-d-synopsis-wrap]'); const syn = d.querySelector('[data-d-synopsis]');
    const pos = sel => d.querySelector(sel).getBoundingClientRect().top;
    const ink = getComputedStyle(syn).color, bg = getComputedStyle(d).backgroundColor;
    return { id, img: !!img && img.complete && img.naturalWidth > 0, alt: img?.getAttribute('alt'), price: facts.Precio, want: b.pr ? '$' + b.pr + ' MXN' : null, editorial: facts.Editorial === b.p,
      synShown: !wrap.hidden && wrap.getBoundingClientRect().height > 0, synSame: syn.textContent === b.s, head: wrap.querySelector('h4')?.textContent,
      order: pos('[data-d-facts]') < pos('[data-d-synopsis-wrap]') && d.querySelector('.drawer-foot').contains(d.querySelector('[data-d-visit]')), ink, bg, noYear: !('Año' in facts) && !('Formato' in facts) && !('Páginas' in facts) };
  })()`);
  ck(`${w}x${h}: portada real cargada (sin alt), precio de la hoja («${dd.price}»), sinopsis completa con su encabezado bajo la ficha técnica (las acciones, al pie), con la tinta de la hoja; sin renglones vacíos (año, formato, páginas)`, dd.img && dd.alt === '' && dd.price === dd.want && /^\$\d[\d,]* MXN$/.test(dd.price) && dd.editorial && dd.synShown && dd.synSame && dd.head === 'Sinopsis' && dd.order && dd.ink !== dd.bg && dd.noYear, JSON.stringify(dd));
  await shot(`ficha-m${w}x${h}.png`);
  await press('Escape', 'Escape', 27); await sleep(900);
  ck(`${w}x${h}: Escape cierra y libera el scroll`, await ev(`!document.querySelector('#cat-drawer').open && !document.documentElement.classList.contains('sheet-open')`));
}

// Títulos largos del inventario (hasta 94 caracteres, «descubrimiento» de 14 letras): ninguna palabra partida, subtítulo en su renglón
// y las acciones del pie a la vista, en el teléfono más angosto y en el más bajo.
for (const [w, h] of [[320, 640], [375, 667]]) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 2, mobile: true });
  await send('Page.navigate', { url: URL_ }); await sleep(4000);
  await ev(`scrollTo(0, document.getElementById('catalogo').getBoundingClientRect().top + scrollY - 100)`); await sleep(2500);
  for (const id of ['lo-que-el-doc-quiso-decir-antonio-zamudio', 'acaso-un-descubrimiento-a-mitad-de-la-noche-hector-justino-h', 'cartografias-del-pensamiento-latinoamericano-compiladora-mai', 'hipercodex-emmanuel-vizcaya']) {
    const m = await ev(`(async () => {
      const wait = ms => new Promise(r => setTimeout(r, ms)); const d = document.getElementById('cat-drawer');
      if (d.open) { d.close(); await wait(400); }
      document.dispatchEvent(new CustomEvent('iti:open-book', { detail: { id: '${id}' } }));
      for (let i = 0; i < 40 && !(d.open && d.dataset.book === '${id}'); i++) await wait(100);
      await wait(900);
      const h3 = d.querySelector('[data-d-title]'); const text = h3.textContent;
      const words = []; const walk = document.createTreeWalker(h3, NodeFilter.SHOW_TEXT);
      for (let n; (n = walk.nextNode());) for (const m of n.data.matchAll(/\\S+/g)) { const r = document.createRange(); r.setStart(n, m.index); r.setEnd(n, m.index + m[0].length); const lines = new Set([...r.getClientRects()].map(x => Math.round(x.top))); if (lines.size > 1) words.push(m[0]); }
      const sub = h3.querySelector('.drawer-sub');
      return { text, split: words, sub: sub ? getComputedStyle(sub).display : null, long: h3.classList.contains('is-long'), size: getComputedStyle(h3).fontSize, visit: Math.round(d.querySelector('[data-d-visit]').getBoundingClientRect().bottom), scroll: d.querySelector('[data-d-scroll]').scrollTop };
    })()`);
    const full = await ev(`fetch('assets/data/catalog.json').then(r => r.json()).then(j => j.books.find(b => b.id === '${id}').t)`);
    ck(`${w}x${h} «${full.slice(0, 32)}…»: ninguna palabra partida, el encabezado es el título completo${full.includes(': ') ? ' (subtítulo en su renglón)' : ''} y «Cómo llegar» a la vista, al pie (${m.visit} <= ${h - 8})`, !m.split.length && m.text === full && (full.includes(': ') ? m.sub === 'block' : m.sub === null) && m.visit <= h - 8 && m.scroll === 0, JSON.stringify(m));
    if (w === 320 && id.startsWith('lo-que')) await shot('ficha-titulo-largo-320.png');
  }
  await press('Escape', 'Escape', 27); await sleep(700);
}

// QA1-03: sin JavaScript, la barra inferior (Mi lista necesita JS) y el ☰ no se muestran y los capítulos son alcanzables desde la barra de arriba (Novedades necesita JavaScript: ni su sección ni su enlace existen).
await send('Emulation.setScriptExecutionDisabled', { value: true });
await send('Page.navigate', { url: URL_ }); await sleep(2500);
const nj = await ev(`(() => ({ js: document.documentElement.classList.contains('js'), more: getComputedStyle(document.querySelector('.tabbar')).display, menu: getComputedStyle(document.querySelector('.menu-btn')).display,
  links: [...document.querySelectorAll('.hdr-nav a')].map(a => { const r = a.getBoundingClientRect(); return [a.getAttribute('href'), r.width > 0 && r.right > 0 && r.left < innerWidth, Math.round(r.height)]; }) }))()`);
ck('sin JavaScript: ni la barra inferior ni el ☰ (que necesitan JS) se muestran', nj.js === false && nj.more === 'none' && nj.menu === 'none', JSON.stringify(nj));
ck('sin JavaScript: Catálogo, Eventos y Visita son alcanzables (>= 44 px de alto) y Novedades, que necesita JavaScript, no se ofrece', nj.links.filter(l => l[1]).map(l => l[0]).join() === '#libros,#cartelera,#visita' && nj.links.filter(l => l[1]).every(l => l[2] >= 44) && nj.links.some(l => l[0] === '#novedades' && !l[1]), JSON.stringify(nj));
await shot('nojs-390-top.png');

ck('sin errores de consola', errs.length === 0, errs.join(' | '));
for (const r of out) console.log(r.join(' '));
const bad = out.filter(r => r[0] === '✗').length;
console.log(bad ? `FALLAN ${bad}` : 'todo bien');
try { ws.close(); chrome.kill(); } catch {}
process.exit(bad ? 1 : 0);
