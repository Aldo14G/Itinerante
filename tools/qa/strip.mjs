import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';

const URL_ = process.argv[2];
const port = 10000 + Math.floor(Math.random() * 40);
const chrome = spawn((process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe'), ['--headless=new', `--remote-debugging-port=${port}`, '--no-first-run', `--user-data-dir=${mkdtempSync(join(tmpdir(), 'iti-t-'))}`, 'about:blank'], { stdio: 'ignore' });
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
await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true });
await send('Emulation.setTouchEmulationEnabled', { enabled: true, maxTouchPoints: 5 });
await send('Page.navigate', { url: URL_ });
await sleep(4500);
const H = await ev(`document.documentElement.scrollHeight`);
for (let y = 0; y < H; y += 600) { await ev(`scrollTo(0, ${y})`); await sleep(200); }
const marks = await ev(`(() => { const top = s => Math.round(document.querySelector(s).getBoundingClientRect().top + scrollY); return [['inicio', 0], ['manifiesto', top('.manifesto') - 40], ['casa', top('#casa')], ['cartelera', top('#cartelera')], ['libros', top('#libros')], ['libros-catalogo', top('#catalogo') + 380], ['cita', top('.quote') - 40], ['llamado', top('.call') - 40], ['visita', top('#visita')], ['pie', top('.ftr') - 100]]; })()`);
let i = 0;
for (const [name, y] of marks) {
  await ev(`scrollTo(0, ${y})`); await sleep(1400); await ev(`scrollBy(0, 1)`); await sleep(500);
  const shot = await send('Page.captureScreenshot', { format: 'jpeg', quality: 70 });
  writeFileSync(`strip-${String(i++).padStart(2, '0')}-${name}.jpg`, Buffer.from(shot.result.data, 'base64'));
}
chrome.kill();
process.exit(0);
