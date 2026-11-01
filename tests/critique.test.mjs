import { strict as assert } from 'node:assert';
import { spawnSync } from 'node:child_process';
import { readFileSync, mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import { existsSync as exists } from 'node:fs';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const hasChrome = Boolean(process.env.CHROME_PATH) || ['C:/Program Files/Google/Chrome/Application/chrome.exe', '/usr/bin/google-chrome', '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'].some(exists);
const browser = { skip: hasChrome ? false : 'sin Chrome (define CHROME_PATH)' };
const run = (...args) => spawnSync(process.execPath, ['scripts/critique.mjs', ...args], { cwd: root, encoding: 'utf8' });

test('el auditor detecta cada familia de defectos en el fixture malo', browser, () => {
  const out = join(mkdtempSync(join(tmpdir(), 'crit-')), 'report.json');
  const res = run('--surface', 'fixture', '--out', out, '--top', '0');
  assert.equal(res.status, 1, 'un fixture malo debe fallar');
  const { counts } = JSON.parse(readFileSync(out, 'utf8')).surfaces.fixture;
  for (const rule of ['token-color-literal', 'token-font-size', 'token-space-grid', 'token-radius', 'token-duration', 'motion-too-long', 'motion-layout-prop', 'motion-no-reduced', 'a11y-focus-removed', 'a11y-font-small', 'a11y-contrast', 'a11y-target', 'a11y-name', 'a11y-h1', 'copy-truth', 'copy-glued']) {
    assert.ok(counts[rule] > 0, `no detectó ${rule}`);
  }
});

test('ratchet: B.4 y el sitio raíz no superan el baseline', () => {
  const res = run('--static-only', '--out', join(mkdtempSync(join(tmpdir(), 'crit-')), 'r.json'), '--top', '0');
  assert.equal(res.status, 0, res.stdout.split('CRÍTICA')[0].slice(-600));
});

test('los tokens generados están al día y el baseline existe', () => {
  const check = spawnSync(process.execPath, ['scripts/build-tokens.mjs', '--check'], { cwd: root, encoding: 'utf8' });
  assert.equal(check.status, 0, check.stderr);
  assert.ok(existsSync(join(root, 'design/baseline.json')));
});

test('una superficie desconocida falla en lugar de salir en verde', () => {
  const res = run('--surface', 'no-existe', '--static-only');
  assert.equal(res.status, 2);
  assert.match(res.stderr, /Superficie desconocida/);
});
