// Arma .wrangler/pages-dist para Cloudflare Pages: los recursos que ya preparó prepare-nuevo-cloudflare.mjs,
// el worker empaquetado como _worker.js y _routes.json con las rutas que pasan por él (run_worker_first de wrangler.jsonc).
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { build } from 'esbuild';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const assets = join(raiz, '.wrangler', 'nuevo-assets');
const salida = join(raiz, '.wrangler', 'pages-dist');

await rm(salida, { recursive: true, force: true });
await cp(assets, salida, { recursive: true });

await build({
  entryPoints: [join(raiz, 'worker', 'pages.ts')],
  outfile: join(salida, '_worker.js'),
  bundle: true,
  format: 'esm',
  platform: 'neutral',
  target: 'es2022',
  mainFields: ['module', 'main'],
  conditions: ['workerd', 'worker', 'browser'],
  logLevel: 'warning',
});

const config = JSON.parse((await readFile(join(raiz, 'wrangler.jsonc'), 'utf8')).replace(/^\s*\/\/.*$/gm, ''));
const include = config.assets.run_worker_first;
if (!Array.isArray(include) || !include.includes('/')) throw new Error('wrangler.jsonc: falta assets.run_worker_first');
await writeFile(join(salida, '_routes.json'), JSON.stringify({ version: 1, include, exclude: [] }, null, 2));
console.log(`Pages: ${salida} con _worker.js y ${include.length} rutas en _routes.json.`);
