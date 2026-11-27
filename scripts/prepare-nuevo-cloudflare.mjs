// Copia únicamente los recursos utilizados por /nuevo al directorio de publicación.
import { copyFile, lstat, mkdir, realpath, rm } from 'node:fs/promises';
import { dirname, join, relative, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { DOCUMENTO } from '../src/app/nuevo/documento.generado.ts';

const raiz = await realpath(fileURLToPath(new URL('../', import.meta.url)));
const cache = resolve(raiz, '.wrangler');
await mkdir(cache, { recursive: true });
if (relative(raiz, await realpath(cache)) !== '.wrangler') throw new Error('La carpeta de preparación debe estar dentro del proyecto.');
const salida = join(cache, 'nuevo-assets');
const previa = await lstat(salida).catch((error) => {
  if (error.code !== 'ENOENT') throw error;
});
if (previa && !previa.isDirectory()) throw new Error('La salida para Cloudflare no es un directorio local.');

const referencias = DOCUMENTO.matchAll(/\/assets\/(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_.-]+\.(?:avif|gif|jpe?g|png|svg|webp|woff2?|ico)\b/g);
const publicables = [...new Set(["Logo.png", "assets/frente/fuentes/OFL.txt", ...Array.from(referencias, ([ruta]) => ruta.slice(1))])];
if (!publicables.length) throw new Error('El documento de /nuevo no tiene recursos locales.');
const fuentes = await Promise.all(publicables.map(async (ruta) => {
  const origen = await realpath(join(raiz, ruta));
  if (resolve(raiz, ruta) !== origen || !(await lstat(origen)).isFile()) throw new Error(`El recurso debe ser un archivo local de la landing: ${ruta}`);
  return { ruta, origen };
}));

// La ruta absoluta y su padre se comprobaron arriba; solo se limpia la salida generada.
if (previa) await rm(salida, { recursive: true });
await mkdir(salida);
for (const { ruta, origen } of fuentes) {
  const destino = join(salida, ruta);
  await mkdir(dirname(destino), { recursive: true });
  await copyFile(origen, destino);
}
for (const archivo of ['_headers', '404.html', '404.css']) {
  await copyFile(join(raiz, 'worker', archivo), join(salida, archivo));
}
console.log(`Cloudflare /nuevo: ${fuentes.length} recursos y 3 archivos de servicio en ${salida}.`);
