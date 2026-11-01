// Genera tokens.css (raíz del repo) desde design/tokens.json: un solo tema de sitio.
// Uso: node scripts/build-tokens.mjs [--check]  (--check falla si el archivo generado está desactualizado)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS_PATH = join(root, 'design/tokens.json');
export const SITE_CSS_PATH = join(root, 'tokens.css');

const HEADER = '/* GENERADO por scripts/build-tokens.mjs desde design/tokens.json. No editar a mano. */';

function groups() {
  const lines = [];
  const group = (title, entries) => {
    lines.push(`  /* ${title} */`);
    entries.forEach(([k, v]) => lines.push(`  --${k}: ${v};`));
    lines.push('');
  };
  return { lines, group };
}

export function renderSite(tokens) {
  const { scales: s, themes } = tokens;
  const t = themes.b4;
  const { lines, group } = groups();
  group('Color', Object.entries(t.color));
  group('Tipografía', Object.entries(t.font));
  group('Escala tipográfica', Object.entries(s.type).map(([k, v]) => [`fs-${k}`, v]));
  group('Espaciado (múltiplos de 4)', Object.entries(s.space).map(([k, v]) => [`space-${k}`, `${v}px`]));
  group('Radios', Object.entries(s.radius).map(([k, v]) => [`radius-${k}`, v]));
  group('Movimiento', [...Object.entries(s.duration).map(([k, v]) => [`dur-${k}`, v]), ...Object.entries(s.stagger).map(([k, v]) => [`stagger-${k}`, v]), ...Object.entries(s.intent).map(([k, v]) => [`intent-${k}`, v]), ...Object.entries(t.ease)]);
  group('Distribución', Object.entries(t.layout));
  group('Objetivos y medida', [['target-fine', `${s.target.fine}px`], ['target-coarse', `${s.target.coarse}px`], ['measure-max', `${s.measure.max}ch`]]);
  lines.push(`  --hair: ${s.hair.base};`);
  Object.entries(t.root).forEach(([k, v]) => lines.push(`  ${k}: ${v};`));
  const print = Object.entries(t.print ?? {}).map(([k, v]) => `    --${k}: ${v};`).join('\n');
  // Tonos por sección: el hero es oscuro; el resto redefine los mismos tokens (data-tone) y pinta su fondo.
  const tones = Object.entries(t.tones ?? {}).map(([name, vars]) => {
    const body = Object.entries(vars).map(([k, v]) => (k === 'color-scheme' ? `  ${k}: ${v};` : `  --${k}: ${v};`)).join('\n');
    return `[data-tone="${name}"] {\n${body}\n  background: var(--night);\n  color: var(--bone);\n}\n`;
  }).join('\n');
  return `${HEADER}\n\n:root {\n${lines.join('\n')}\n}\n\n${tones}\n@media (min-resolution: 2dppx) {\n  :root { --hair: ${s.hair.dense}; }\n}\n\n@media print {\n  :root {\n${print}\n  }\n  [data-tone] { background: #fff; color: #000; }\n}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
  const targets = [[SITE_CSS_PATH, renderSite(tokens)]];
  if (process.argv.includes('--check')) {
    const read = path => (existsSync(path) ? readFileSync(path, 'utf8').replace(/\r\n/g, '\n') : '');
    const stale = targets.filter(([path, css]) => read(path) !== css);
    if (stale.length) {
      console.error(`Tokens desactualizados: ${stale.map(([p]) => p).join(', ')}. Ejecuta "npm run tokens".`);
      process.exit(1);
    }
    console.log('tokens al día');
  } else {
    targets.forEach(([path, css]) => writeFileSync(path, css));
    console.log('tokens generados');
  }
}
