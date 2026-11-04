// Corre el arnés de navegador contra una vista previa propia y falla (código 1) si algún script reporta fallos.
// Uso: npm run test:browser   (necesita Chrome; CHROME_PATH lo cambia). Escribe capturas en una carpeta temporal.
import { spawn, spawnSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const PORT = process.env.QA_PORT || '8599';
const URL = `http://127.0.0.1:${PORT}/`;
const root = resolve(import.meta.dirname, '..', '..');
const work = mkdtempSync(join(tmpdir(), 'iti-qa-'));
const SCRIPTS = ['explorer', 'saved', 'rail', 'skeleton', 'contrast', 'ficha', 'axe'];

const server = spawn(process.execPath, [join(root, 'tools', 'preview-site.mjs')], { cwd: root, env: { ...process.env, PORT }, stdio: 'ignore' });
const stop = () => server.kill();
process.on('exit', stop);

async function ready() {
  for (let i = 0; i < 50; i += 1) {
    try { if ((await fetch(URL)).ok) return; } catch { /* aún no escucha */ }
    await new Promise(r => setTimeout(r, 200));
  }
  throw new Error(`la vista previa no respondió en ${URL}`);
}

let failed = 0;
try {
  await ready();
  for (const name of SCRIPTS) {
    const res = spawnSync(process.execPath, [join(root, 'tools', 'qa', `${name}.mjs`), URL], { cwd: work, encoding: 'utf8', timeout: 240000 });
    const fallan = /FALLAN\s+(\d+)/.exec(res.stdout || '');
    const bad = res.status !== 0 || (fallan && Number(fallan[1]) > 0);
    console.log(`${bad ? '✗' : '✓'} ${name}${fallan ? ` (FALLAN ${fallan[1]})` : ''}`);
    if (bad) { failed += 1; console.log((res.stdout || '').split('\n').filter(l => l.startsWith('✗')).join('\n') || (res.stderr || '').slice(0, 600)); }
  }
} finally {
  stop();
}
process.exit(failed ? 1 : 0);
