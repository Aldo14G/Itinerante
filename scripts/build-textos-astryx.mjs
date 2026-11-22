// Escribe src/frente/textos-astryx-es.json: las cadenas en español (catálogo es-ES de Astryx 0.7.17) de los componentes que usa /nuevo.
// Así no viaja el catálogo entero. Si la página usa un componente nuevo, añade aquí sus claves (`@astryx.<componente>.*`).
// Uso: node scripts/build-textos-astryx.mjs [--check]
import { readFile, writeFile } from 'node:fs/promises';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const es = require('@astryxdesign/core/locales/es-ES.json');
const SALIDA = fileURLToPath(new URL('../src/frente/textos-astryx-es.json', import.meta.url));

export const CLAVES = [
  '@astryx.button.loading',
  '@astryx.carousel.label',
  '@astryx.carousel.scrollLeft',
  '@astryx.carousel.scrollRight',
  '@astryx.carousel.slideLabel',
  '@astryx.dialog.close',
  '@astryx.field.errorFallback',
  '@astryx.field.labelTooltip',
  '@astryx.field.optional',
  '@astryx.field.required',
  '@astryx.infoTip.label',
  '@astryx.input.statusButton.error',
  '@astryx.input.statusButton.success',
  '@astryx.input.statusButton.warning',
  '@astryx.inputClearButton.tooltip',
  '@astryx.kbd.key.alt',
  '@astryx.kbd.key.altShort',
  '@astryx.kbd.key.backspace',
  '@astryx.kbd.key.command',
  '@astryx.kbd.key.control',
  '@astryx.kbd.key.controlShort',
  '@astryx.kbd.key.down',
  '@astryx.kbd.key.enter',
  '@astryx.kbd.key.escape',
  '@astryx.kbd.key.escapeShort',
  '@astryx.kbd.key.left',
  '@astryx.kbd.key.plus',
  '@astryx.kbd.key.right',
  '@astryx.kbd.key.shift',
  '@astryx.kbd.key.shiftShort',
  '@astryx.kbd.key.tab',
  '@astryx.kbd.key.up',
  '@astryx.kbd.key.windowsShort',
  '@astryx.kbd.shortcut',
  '@astryx.keyboardHint.toNavigate',
  '@astryx.mobileNav.closeNavigation',
  '@astryx.mobileNav.navigation',
  '@astryx.mobileNav.toggle.open',
  '@astryx.popover.close',
  '@astryx.sideNavItem.collapse',
  '@astryx.sideNavItem.expand',
  '@astryx.sideNavItem.submenuLabel',
  '@astryx.spinner.loading',
  '@astryx.switch.loading',
  '@astryx.tabList.label',
  '@astryx.textInput.clearLabel',
  '@astryx.topNav.landmarkLabel',
];

// Las que es-ES 0.7.17 no traduce quedan en el inglés de Astryx (atajos de teclado y textos que esta página no muestra).
const json = JSON.stringify(Object.fromEntries(CLAVES.filter((k) => es[k]).map((k) => [k, es[k].defaultMessage])), null, 2) + '\n';
if (process.argv.includes('--check')) {
  const actual = await readFile(SALIDA, 'utf8').catch(() => '');
  if (actual !== json) {
    console.error('textos-astryx-es.json no está al día: corre `npm run textos:astryx`.');
    process.exit(1);
  }
  console.log('textos-astryx-es.json al día.');
} else {
  await writeFile(SALIDA, json);
  console.log(`textos-astryx-es.json escrito (${CLAVES.length} claves).`);
}
