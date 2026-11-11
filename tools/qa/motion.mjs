// Prueba de movimiento en ejecución: ¿qué transiciones/animaciones se disparan, con qué duración y curva?
import { spawn } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const port = 9900 + Math.floor(Math.random() * 50);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-m-'))}`, 'about:blank'], { stdio: 'ignore' });
const sleep = ms => new Promise(r => setTimeout(r, ms));
let t;
for (let i = 0; i < 40; i++) { try { t = await (await fetch(`http://127.0.0.1:${port}/json`)).json(); if (t.length) break; } catch {} await sleep(250); }
const ws = new WebSocket(t.find(x => x.type === 'page').webSocketDebuggerUrl);
await new Promise(r => ws.addEventListener('open', r, { once: true }));
let id = 0; const pend = new Map();
ws.addEventListener('message', e => { const m = JSON.parse(e.data); if (m.id && pend.has(m.id)) { pend.get(m.id)(m); pend.delete(m.id); } });
const send = (method, params = {}) => new Promise(r => { const i = ++id; pend.set(i, r); ws.send(JSON.stringify({ id: i, method, params })); });
const ev = async x => (await send('Runtime.evaluate', { expression: x, awaitPromise: true, returnByValue: true })).result?.result?.value;
await send('Page.enable'); await send('Runtime.enable');

const HOOK = `(() => {
  window.__mot = [];
  const rec = (kind, e, el) => {
    const cs = getComputedStyle(el, e.pseudoElement || null);
    const anim = e.target.getAnimations ? null : null;
    window.__mot.push({ kind, prop: e.propertyName || e.animationName, el: (el.className && String(el.className).split(' ')[0]) || el.tagName, pseudo: e.pseudoElement || '' });
  };
  document.addEventListener('transitionrun', e => rec('transition', e, e.target), true);
  document.addEventListener('animationstart', e => rec('animation', e, e.target), true);
})()`;
await send('Page.addScriptToEvaluateOnNewDocument', { source: HOOK });

// Duraciones permitidas por los tokens (ms) + escalonados + intención.
const TOKENS = new Set([120, 240, 400, 700, 1200, 24, 60, 250, 320]);

async function pass(name, w, h, mobile, reduced) {
  await send('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile });
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: reduced ? 'reduce' : 'no-preference' }] });
  await send('Page.navigate', { url: URL_ });
  await sleep(4500);
  // recorrido completo por la página, como una persona
  const H = await ev(`document.documentElement.scrollHeight - innerHeight`);
  for (let y = 0; y <= H; y += Math.round(h * 0.6)) { await ev(`scrollTo(0, ${y})`); await sleep(260); }
  await ev(`scrollTo(0, 0)`); await sleep(500);
  // interacciones: menú móvil, acordeón, chips del carrusel, tarjeta -> ficha
  if (mobile) {
    await ev(`document.querySelector('[data-menu-open]').click()`); await sleep(700);
    await ev(`document.querySelector('#sheet-menu [aria-controls="sm-libros"]').click()`); await sleep(500);
    await ev(`document.querySelector('[data-sm-close]').click()`); await sleep(700);
  } else {
    await ev(`document.querySelector('.menu-btn')?.click()`); await sleep(500);
  }
  await ev(`scrollTo(0, document.querySelector('[data-rail]').getBoundingClientRect().top + scrollY - 100)`); await sleep(2500);
  await ev(`document.querySelectorAll('[data-rail] .rail-chip')[1]?.click()`); await sleep(600);
  await ev(`document.querySelector('[data-rail] .card')?.click()`); await sleep(1800);
  await ev(`document.getElementById('cat-drawer')?.close()`); await sleep(600);

  const rows = await ev(`(() => {
    const out = new Map();
    for (const a of document.getAnimations()) { /* vivas: se cuentan abajo */ }
    for (const m of window.__mot) { const k = m.kind + '|' + m.prop + '|' + m.el + m.pseudo; out.set(k, (out.get(k) || 0) + 1); }
    return [...out].map(([k, n]) => [k, n]);
  })()`);
  // Duraciones calculadas de los elementos que dispararon algo (se recalculan ahora)
  const dur = await ev(`(() => {
    const seen = new Map();
    const toMs = s => s.split(',').map(x => x.trim()).map(x => x.endsWith('ms') ? parseFloat(x) : parseFloat(x) * 1000);
    document.querySelectorAll('*').forEach(el => {
      for (const pe of [null, '::before', '::after']) {
        const cs = getComputedStyle(el, pe);
        for (const [dKey, pKey] of [['transitionDuration', 'transitionProperty'], ['animationDuration', 'animationName']]) {
          const ds = toMs(cs[dKey] || '0s'); const ps = (cs[pKey] || '').split(',').map(s => s.trim());
          ds.forEach((d, i) => { if (d > 0.5) { const k = d; const e = seen.get(k) || { n: 0, ex: [] }; e.n++; if (e.ex.length < 3) e.ex.push((el.className && String(el.className).split(' ')[0] || el.tagName) + (pe || '') + ':' + (ps[i % ps.length] || '')); seen.set(k, e); } });
        }
      }
    });
    return [...seen].sort((a, b) => a[0] - b[0]).map(([d, e]) => [Math.round(d * 100) / 100, e.n, e.ex]);
  })()`);
  return { name, rows, dur };
}

const results = [];
results.push(await pass('móvil · movimiento normal', 390, 844, true, false));
results.push(await pass('escritorio · movimiento normal', 1280, 800, false, false));
results.push(await pass('móvil · movimiento reducido', 390, 844, true, true));

for (const r of results) {
  console.log('\n=== ' + r.name);
  console.log('eventos disparados (' + r.rows.length + ' tipos):', r.rows.slice(0, 14).map(([k, n]) => `${k}×${n}`).join(' · '));
  const off = r.dur.filter(([d]) => !TOKENS.has(d) && d > 1 && !(r.name.includes('reducido') && d <= 1));
  console.log('duraciones calculadas en el DOM (ms):', r.dur.map(([d, n]) => `${d}×${n}`).join(' '));
  console.log(off.length ? '  FUERA DE TOKENS: ' + off.map(([d, n, ex]) => `${d}ms (${n}) ej. ${ex.join(', ')}`).join(' | ') : '  todas las duraciones salen de los tokens');
}
chrome.kill();
process.exit(0);
