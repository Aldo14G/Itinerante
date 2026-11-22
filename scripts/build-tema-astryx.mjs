// Compila el tema Astryx de Itinerante a CSS estático: src/app/nuevo/tema-itinerante.css.
// Uso: node scripts/build-tema-astryx.mjs [--check]. Con --check sale con 1 si el archivo no coincide con el tema.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { generateThemeCSS } from '@astryxdesign/core/theme';
import { temaItinerante } from '../src/frente/tema.mjs';

const SALIDA = fileURLToPath(new URL('../src/app/nuevo/tema-itinerante.css', import.meta.url));
const avisos = [];
const { prose, component } = generateThemeCSS(temaItinerante, avisos);
const css = [
  '/* Generado por scripts/build-tema-astryx.mjs desde src/frente/tema.mjs. No se edita a mano. */',
  '@layer reset, astryx-base, astryx-theme;',
  prose ? `@layer reset {\n${prose}\n}` : '',
  component ? `@layer astryx-theme {\n${component}\n}` : '',
  '',
].filter(Boolean).join('\n');

if (avisos.length) console.warn(avisos.join('\n'));
if (process.argv.includes('--check')) {
  const actual = await readFile(SALIDA, 'utf8').catch(() => '');
  if (actual !== css) {
    console.error('tema-itinerante.css no coincide con src/frente/tema.mjs: corre `npm run tema:astryx`.');
    process.exit(1);
  }
  console.log('tema-itinerante.css al día.');
} else {
  await writeFile(SALIDA, css);
  console.log(`tema-itinerante.css escrito (${css.length} bytes).`);
}
