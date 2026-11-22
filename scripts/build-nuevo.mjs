// Genera el HTML de /nuevo (SPEC v2): React 19 renderizado a HTML estático, con el CSS y el JS en línea.
// Uso: node --import tsx/esm scripts/build-nuevo.mjs [--check]
// Escribe src/app/nuevo/documento.generado.ts, que sirve src/app/nuevo/route.ts (ISR) tras resolver los bloques fechados.
// Con --check sale con 1 si el archivo no coincide con los datos y el código actuales.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build, transform } from 'esbuild';
import { Pagina, idEditorial } from '../src/frente/pagina.tsx';
import { editorialesConFiltro, generosConFiltro, tiposDeTienda } from '../src/frente/datos.ts';

const raiz = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const SALIDA = raiz('src/app/nuevo/documento.generado.ts');

// Filtros por editorial sin JS: un radio marcado oculta las tarjetas de otras editoriales.
const filtrosCSS = [
  ...tiposDeTienda().map((t) => `.tienda:has(input[name="tipo"][value="${t.id}"]:checked) .rejilla > li:not([data-tipo="${t.id}"]){display:none}`),
  ...generosConFiltro().map((g) => {
    const id = idEditorial(g.nombre);
    return `.tienda:has(input[name="genero"][value="${id}"]:checked) .rejilla .libro:not([data-gen="${id}"]){display:none}`;
  }),
  ...editorialesConFiltro().map((e) => {
    const id = idEditorial(e.nombre);
    return `.tienda:has(input[name="editorial"][value="${id}"]:checked) .rejilla .libro:not([data-ed="${id}"]){display:none}`;
  }),
].join('\n');

const tema = await readFile(raiz('src/frente/tema-itinerante.css'), 'utf8');
const propio = await readFile(raiz('src/frente/nuevo.css'), 'utf8');
const css = (await transform(`${tema}\n${propio}\n${filtrosCSS}`, { loader: 'css', minify: true, target: ['chrome111', 'safari16.4', 'firefox128'] })).code.trim();
const empaquetado = await build({
  absWorkingDir: raiz('.'),
  entryPoints: [raiz('src/frente/cliente.js')],
  bundle: true,
  format: 'iife',
  minify: true,
  write: false,
  legalComments: 'none',
  target: 'es2019',
});
const js = empaquetado.outputFiles[0].text.trim();

const html = '<!doctype html>' + renderToStaticMarkup(createElement(Pagina, { css, js }));
const salida = [
  '// Generado por scripts/build-nuevo.mjs desde src/frente/ (pagina.tsx, datos, nuevo.css, cliente.js). No se edita a mano.',
  `export const DOCUMENTO = ${JSON.stringify(html)};`,
  '',
].join('\n');

if (process.argv.includes('--check')) {
  const actual = await readFile(SALIDA, 'utf8').catch(() => '');
  if (actual !== salida) {
    console.error('documento.generado.ts no está al día: corre `npm run nuevo`.');
    process.exit(1);
  }
  console.log('documento.generado.ts al día.');
} else {
  await writeFile(SALIDA, salida);
  console.log(`documento.generado.ts escrito: HTML ${html.length} B, CSS ${css.length} B, JS ${js.length} B.`);
}
