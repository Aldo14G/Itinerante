// Genera el HTML de /nuevo: React 19 renderizado a HTML estático, con el CSS y el JS en línea.
// Uso: node --import tsx/esm scripts/build-nuevo.mjs [--check]
// Escribe src/app/nuevo/documento.generado.ts. route.ts lo sirve y, si la URL trae filtros, vuelve a renderizar.
import { copyFile, mkdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { build, transform } from 'esbuild';
import { Pagina } from '../src/frente/pagina.tsx';
import { EVENTOS } from '../src/frente/datos.ts';
import { MENU_PATH, problemasDisco } from './build-carta.mjs';

const raiz = (p) => fileURLToPath(new URL(`../${p}`, import.meta.url));
const SALIDA = raiz('src/app/nuevo/documento.generado.ts');
const menu = JSON.parse(await readFile(MENU_PATH, 'utf8'));
const problemasCarta = problemasDisco(menu);
if (problemasCarta.length) throw new Error(`Revisa assets/data/menu.json:\n${problemasCarta.join('\n')}`);

const estilos = await Promise.all(['nuevo.css', 'parallax.css', 'tintes.css', 'movimiento.css'].map((archivo) => readFile(raiz(`src/frente/${archivo}`), 'utf8')));
const css = (await transform(estilos.join('\n'), { loader: 'css', minify: true, target: ['chrome111', 'safari16.4', 'firefox128'] })).code.trim();
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
const hashCsp = (value) => `'sha256-${createHash('sha256').update(value).digest('base64')}'`;
const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)].map(([, value]) => hashCsp(value));
// GSAP Flip crea este atributo fijo al medir el navegador. El resto son estilos del HTML.
const estilosAtributo = ['position:static;transform:translate3d(0,0,1px)', ...Array.from(html.matchAll(/\sstyle="([^"]+)"/g), ([, value]) => value)];
const attrs = [...new Set(estilosAtributo.map(hashCsp))];
const csp = [
  "default-src 'none'",
  `script-src ${scripts.join(' ')}`,
  `style-src ${hashCsp(css)}`,
  `style-src-attr 'unsafe-hashes' ${attrs.join(' ')}`,
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "base-uri 'none'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join('; ');
const salida = [
  '// Generado por scripts/build-nuevo.mjs desde src/frente/ (pagina.tsx, datos, nuevo.css, cliente.js). No se edita a mano.',
  `export const CSS = ${JSON.stringify(css)};`,
  `export const JS = ${JSON.stringify(js)};`,
  `export const CSP = ${JSON.stringify(csp)};`,
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
  const fotos = new Set(menu.categorias.flatMap((categoria) => categoria.productos.flatMap((producto) => producto.foto ? [producto.foto.src] : [])));
  for (const { imagen } of EVENTOS) {
    if (imagen?.startsWith('/assets/img/eventos/')) fotos.add(imagen.slice(1));
  }
  for (const foto of fotos) {
    const destino = raiz('public/' + foto);
    await mkdir(dirname(destino), { recursive: true });
    await copyFile(raiz(foto), destino);
  }
  await writeFile(SALIDA, salida);
  console.log(`documento.generado.ts escrito: HTML ${html.length} B, CSS ${css.length} B, JS ${js.length} B.`);
}
