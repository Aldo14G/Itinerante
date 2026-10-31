// Genera prototypes/itinerante-b4/tokens.css desde design/tokens.json.
// Uso: node scripts/build-tokens.mjs [--check]  (--check falla si el archivo generado está desactualizado)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS_PATH = join(root, 'design/tokens.json');
export const B4_CSS_PATH = join(root, 'prototypes/itinerante-b4/tokens.css');

export function renderB4(tokens) {
  const { scales: s, themes } = tokens;
  const t = themes.b4;
  const lines = [];
  const group = (title, entries) => { lines.push(`  /* ${title} */`); entries.forEach(([k, v]) => lines.push(`  --${k}: ${v};`)); lines.push(''); };
  group('Color', Object.entries(t.color));
  group('Tipografía', Object.entries(t.font));
  group('Escala tipográfica', Object.entries(s.type).map(([k, v]) => [`fs-${k}`, v]));
  group('Espaciado (múltiplos de 4)', Object.entries(s.space).map(([k, v]) => [`space-${k}`, `${v}px`]));
  group('Radios', Object.entries(s.radius).map(([k, v]) => [`radius-${k}`, v]));
  group('Movimiento', [...Object.entries(s.duration).map(([k, v]) => [`dur-${k}`, v]), ...Object.entries(t.ease)]);
  group('Distribución', Object.entries(t.layout));
  group('Objetivos y medida', [['target-fine', `${s.target.fine}px`], ['target-coarse', `${s.target.coarse}px`], ['measure-max', `${s.measure.max}ch`]]);
  lines.push(`  --hair: ${s.hair.base};`);
  Object.entries(t.root).forEach(([k, v]) => lines.push(`  ${k}: ${v};`));
  const print = Object.entries(t.print ?? {}).map(([k, v]) => `    --${k}: ${v};`).join('\n');
  return `/* GENERADO por scripts/build-tokens.mjs desde design/tokens.json. No editar a mano. */\n\n:root {\n${lines.join('\n')}\n}\n\n@media (min-resolution: 2dppx) {\n  :root { --hair: ${s.hair.dense}; }\n}\n\n@media print {\n  :root {\n${print}\n  }\n}\n`;
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const css = renderB4(JSON.parse(readFileSync(TOKENS_PATH, 'utf8')));
  if (process.argv.includes('--check')) {
    const current = existsSync(B4_CSS_PATH) ? readFileSync(B4_CSS_PATH, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== css) { console.error('tokens.css desactualizado: ejecuta `npm run tokens`.'); process.exit(1); }
    console.log('tokens.css al día');
  } else {
    writeFileSync(B4_CSS_PATH, css);
    console.log('tokens.css generado');
  }
}
