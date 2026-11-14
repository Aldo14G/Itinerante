// Genera design/COMPONENTES.md (tabla de estados por control, detalle de cada componente y pares de contraste con sus razones calculadas)
// desde design/componentes.json y design/tokens.json. Formato del catálogo inspirado en registry-item.json de shadcn/ui (MIT).
// Uso: node scripts/build-componentes.mjs [--check]  (--check falla si design/COMPONENTES.md está desactualizado)
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
export const CATALOG_PATH = join(root, 'design/componentes.json');
export const MD_PATH = join(root, 'design/COMPONENTES.md');
const TOKENS_PATH = join(root, 'design/tokens.json');

// ---------- Contraste (WCAG 2.x) con canal alfa y color-mix en oklab ----------
const rgba = hex => { const h = hex.replace('#', ''); return [0, 2, 4, 6].map(i => (i < h.length ? parseInt(h.slice(i, i + 2), 16) : 255)).map((v, i) => (i === 3 ? v / 255 : v)); };
const toHex = a => '#' + a.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join('');
/** El color de arriba (con alfa) compuesto sobre el de abajo. */
export const over = (top, under) => { const [r, g, b, a] = rgba(top); const [R, G, B] = rgba(under); return toHex([r * a + R * (1 - a), g * a + G * (1 - a), b * a + B * (1 - a)]); };
const lin = c => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const unlin = c => 255 * (c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055);
const toOklab = hex => {
  const [r, g, b] = rgba(hex).slice(0, 3).map(lin);
  const l = Math.cbrt(0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * b);
  const m = Math.cbrt(0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * b);
  const s = Math.cbrt(0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * b);
  return [0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s, 1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s, 0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s];
};
const fromOklab = ([L, A, B]) => {
  const l = (L + 0.3963377774 * A + 0.2158037573 * B) ** 3, m = (L - 0.1055613458 * A - 0.0638541728 * B) ** 3, s = (L - 0.0894841775 * A - 1.291485548 * B) ** 3;
  return toHex([4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s, -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s, -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s].map(unlin));
};
/** color-mix(in oklab, a, b p%): p es la parte de b (0 a 1). */
export const mixOklab = (a, b, p) => { const A = toOklab(a), B = toOklab(b); return fromOklab(A.map((v, i) => v * (1 - p) + B[i] * p)); };
const luminance = hex => { const [r, g, b] = rgba(hex).slice(0, 3).map(lin); return 0.2126 * r + 0.7152 * g + 0.0722 * b; };
export const contrastRatio = (a, b) => { const [x, y] = [luminance(a), luminance(b)].sort((m, n) => n - m); return (x + 0.05) / (y + 0.05); };

/** Mínimo por tipo de par: texto 4.5:1 (WCAG 1.4.3); borde de control, icono y foco 3:1 (WCAG 1.4.11). */
export const MINIMO = { texto: 4.5, borde: 3, icono: 3, foco: 3 };
/** Lo peor que puede pasar detrás del vidrio: negro en claro, blanco en oscuro. */
export const PEOR = { light: '#000000', dark: '#ffffff' };

/** Resuelve un nombre de la lista «contraste» a un color opaco del tema: token, «token@peor» (vidrio sobre su peor fondo) o «mezcla:a+b@p». */
export function resolveColor(name, colors, tema) {
  const v = k => {
    const c = colors[k];
    if (!c || !c[tema]) throw new Error(`color desconocido en design/tokens.json: ${k}`);
    return c[tema];
  };
  const mezcla = /^mezcla:([a-z0-9-]+)\+([a-z0-9-]+)@(\d+(?:\.\d+)?)$/.exec(name);
  if (mezcla) return mixOklab(v(mezcla[1]), v(mezcla[2]), Number(mezcla[3]) / 100);
  const peor = /^([a-z0-9-]+)@peor$/.exec(name);
  if (peor) return over(v(peor[1]), PEOR[tema]);
  const hex = v(name);
  if (rgba(hex)[3] < 1) throw new Error(`${name} es translúcido: usa «${name}@peor»`);
  return hex;
}

/** Razón de un par en un tema. */
export function pairRatio(par, colors, tema) {
  return contrastRatio(resolveColor(par.frente, colors, tema), resolveColor(par.fondo, colors, tema));
}

// ---------- Tabla ----------
export const COLUMNAS = [
  ['hover', 'Hover (puntero fino)'],
  ['foco', 'Foco visible'],
  ['presionado', 'Presionado'],
  ['deshabilitado', 'Deshabilitado'],
  ['seleccionado', 'Seleccionado'],
  ['actual', 'Actual'],
  ['expandido', 'Expandido'],
  ['ocupado', 'Ocupado'],
  ['vacio', 'Vacío'],
  ['error', 'Error'],
  ['movimiento_reducido', 'Mov. reducido'],
];
const code = s => '`' + String(s).replace(/`/g, "'").replace(/\|/g, '\\|') + '`';
const cell = s => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');

export function renderMd(catalog, tokens) {
  const colors = tokens.themes.liquido.color;
  const out = [];
  out.push('<!-- GENERADO por scripts/build-componentes.mjs desde design/componentes.json y design/tokens.json. No editar a mano: `npm run componentes`. -->');
  out.push('');
  out.push('# Componentes del sitio · «Itinerante Líquido»');
  out.push('');
  out.push(`Catálogo de ${catalog.componentes.length} componentes (versión ${catalog.version}). La fuente es \`design/componentes.json\` (formato plano inspirado en \`registry-item.json\` de shadcn/ui, MIT; origen en \`docs/ux/FUENTES.md\`). \`tests/componentes.test.mjs\` comprueba que existe todo lo que nombra (archivos, selectores, funciones, tokens y herramientas), que cada estado declarado está en el CSS o el JS con su condición (hover solo dentro de \`@media (hover: hover)\`, foco con \`:focus-visible\`, movimiento solo bajo \`.motion\` o neutralizado con \`prefers-reduced-motion\`…) y el contraste de cada par en claro y oscuro.`);
  out.push('');
  out.push('Regla de atributos: **clase = parte o variante, `aria-*` = estado, `data-*` = gancho de JavaScript** (DESIGN.md).');
  out.push('');
  out.push('## Tabla de estados por control');
  out.push('');
  out.push('«sí» = el estado existe y la prueba lo encuentra; «—» = no aplica (la razón va en el detalle); en blanco = el componente no lo declara.');
  out.push('');
  out.push(`| Componente | ${COLUMNAS.map(([, t]) => t).join(' | ')} |`);
  out.push(`|---|${COLUMNAS.map(() => ':-:').join('|')}|`);
  for (const c of catalog.componentes) {
    const row = COLUMNAS.map(([k]) => (c.estados?.[k] ? 'sí' : c.no_aplica?.[k] ? '—' : ''));
    out.push(`| ${c.nombre}${c.variante_de ? ` (variante de ${catalog.componentes.find(x => x.id === c.variante_de)?.nombre})` : ''} | ${row.join(' | ')} |`);
  }
  out.push('');
  const otros = [...new Set(catalog.componentes.flatMap(c => Object.keys(c.estados ?? {})).filter(k => !COLUMNAS.some(([col]) => col === k)))];
  if (otros.length) out.push(`Estados propios de algún componente, fuera de la tabla: ${otros.map(code).join(', ')} (ver el detalle).`, '');
  out.push('## Pares de contraste');
  out.push('');
  out.push('Calculados desde `design/tokens.json`. Texto ≥ 4.5:1 (WCAG 1.4.3); borde de control, icono y foco ≥ 3:1 (WCAG 1.4.11). `vidrio@peor`: el vidrio compuesto sobre negro (claro) o blanco (oscuro). `mezcla:a+b@p`: `color-mix(in oklab, a, b p%)`, el hover de chips y botones.');
  out.push('');
  out.push('| Frente | Fondo | Tipo | Mínimo | Claro | Oscuro | Dónde |');
  out.push('|---|---|---|--:|--:|--:|---|');
  for (const p of catalog.contraste) {
    const [l, d] = ['light', 'dark'].map(t => pairRatio(p, colors, t).toFixed(2));
    out.push(`| ${code(p.frente)} | ${code(p.fondo)} | ${p.tipo} | ${MINIMO[p.tipo]} | ${l} | ${d} | ${cell(p.donde)} |`);
  }
  out.push('');
  out.push('## Detalle');
  for (const c of catalog.componentes) {
    out.push('');
    out.push(`### ${c.nombre}`);
    out.push('');
    out.push(`${c.descripcion}`);
    out.push('');
    out.push(`- **Tipo:** ${c.tipo}${c.variante_de ? ` · variante de ${catalog.componentes.find(x => x.id === c.variante_de)?.nombre}` : ''} · **desde** ${c.desde} · ${c.decision}`);
    if (c.variantes?.length) out.push(`- **Variantes:** ${c.variantes.map(v => `${code(v.selector)} ${v.nombre} (${v.uso})`).join('; ')}`);
    for (const a of c.archivos) {
      const partes = [];
      if (a.selectores?.length) partes.push(a.selectores.map(code).join(' '));
      if (a.exporta?.length) partes.push(`exporta ${a.exporta.map(code).join(' ')}`);
      if (a.internas?.length) partes.push(`internas ${a.internas.map(code).join(' ')}`);
      if (a.ganchos?.length) partes.push(`ganchos ${a.ganchos.map(code).join(' ')}`);
      out.push(`- **${a.ruta}:** ${partes.join(' · ') || 'datos'}`);
    }
    out.push(`- **Tokens:** ${c.tokens.map(code).join(' ')}`);
    for (const [k, e] of Object.entries(c.estados ?? {})) {
      const partes = [...(e.css ?? []).map(code), ...(e.html ?? []).map(s => `HTML ${code(s)}`), ...(e.js ?? []).map(j => `${j.ruta} ${code(j.texto)}`)];
      out.push(`- **Estado ${k}${e.media ? ` (${e.media})` : ''}:** ${partes.join(', ')}${e.nota ? ` — ${e.nota}` : ''}`);
    }
    for (const [k, why] of Object.entries(c.no_aplica ?? {})) out.push(`- **${k}: no aplica.** ${why}`);
    out.push(`- **ARIA:** ${c.aria.patron} (${c.aria.apg}) · ${c.aria.atributos.map(code).join(' ')} · **Teclado:** ${c.aria.teclado}`);
    out.push(`- **QA:** ${c.qa.map(code).join(' ')}`);
  }
  out.push('');
  return out.join('\n');
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const catalog = JSON.parse(readFileSync(CATALOG_PATH, 'utf8'));
  const tokens = JSON.parse(readFileSync(TOKENS_PATH, 'utf8'));
  const md = renderMd(catalog, tokens);
  if (process.argv.includes('--check')) {
    const current = existsSync(MD_PATH) ? readFileSync(MD_PATH, 'utf8').replace(/\r\n/g, '\n') : '';
    if (current !== md) { console.error('design/COMPONENTES.md desactualizado. Ejecuta "npm run componentes".'); process.exit(1); }
    console.log('componentes al día');
  } else {
    writeFileSync(MD_PATH, md);
    console.log(`design/COMPONENTES.md generado (${catalog.componentes.length} componentes, ${catalog.contraste.length} pares)`);
  }
}
