// Genera tokens.css (raíz del repo) desde design/tokens.json: sistema «Itinerante Líquido», tema claro en :root y oscuro con prefers-color-scheme.
// Uso: node scripts/build-tokens.mjs [--check]  (--check falla si el archivo generado está desactualizado)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const TOKENS_PATH = join(root, 'design/tokens.json');
export const SITE_CSS_PATH = join(root, 'tokens.css');

const HEADER = '/* GENERADO por scripts/build-tokens.mjs desde design/tokens.json. No editar a mano. */';
const own = obj => Object.entries(obj).filter(([k]) => !k.startsWith('$'));

export function renderSite(tokens) {
  const { scales: s, themes } = tokens;
  const t = themes.liquido;
  const light = [];
  const dark = [];
  const group = (title, entries, out = light) => {
    out.push(`  /* ${title} */`);
    entries.forEach(([k, v]) => out.push(`  --${k}: ${v};`));
    out.push('');
  };
  // Color y sombra: cada token trae su valor claro y oscuro; el claro va en :root y el oscuro en el bloque de prefers-color-scheme.
  const themed = (title, obj) => {
    group(`${title} (tema claro)`, own(obj).map(([k, v]) => [k, v.light]));
    group(`${title} (tema oscuro)`, own(obj).map(([k, v]) => [k, v.dark]), dark);
  };
  themed('Color', t.color);
  group('Portadas tipográficas (iguales en ambos temas)', own(t.portada));
  group('Letra', own(t.font));
  const typeEntries = own(s.type).flatMap(([k, v]) => [
    [`t-${k}`, `${v.weight} ${v.size}/${v.line} var(--font-${v.family})`],
    [`ls-${k}`, v.tracking],
  ]);
  group('Escala tipográfica (Apple HIG; px CSS = pt). font: var(--t-*) y letter-spacing: var(--ls-*)', typeEntries);
  group('Espaciado (múltiplos de 4)', own(s.space).map(([k, v]) => [`space-${k}`, `${v}px`]));
  group('Radios', own(s.radius));
  themed('Sombras', t.shadow);
  group('Controles', own(s.control));
  group('Barras y márgenes', own(s.medidas));
  group('Vidrio', own(s.filtro));
  group('Movimiento', [...own(s.duration), ...own(s.easing)]);
  group('Tiempos de JavaScript (no son transiciones)', own(s.tiempo));
  group('Objetivos y medida', [['target-fine', `${s.target.fine}px`], ['target-coarse', `${s.target.coarse}px`], ['measure-max', `${s.measure.max}ch`]]);
  own(t.root).forEach(([k, v]) => light.push(`  ${k}: ${v};`));
  const print = own(t.print ?? {}).map(([k, v]) => `    --${k}: ${v};`).join('\n');
  const darkBody = dark.map(l => (l ? `  ${l}` : l)).join('\n').replace(/\n+$/, '');
  return `${HEADER}\n\n:root {\n${light.join('\n')}\n}\n\n@media (prefers-color-scheme: dark) {\n  :root {\n${darkBody}\n  }\n}\n\n@media print {\n  :root {\n${print}\n  }\n}\n`;
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
