// Arma .wrangler/pages-dist para Cloudflare Pages como sitio 100 % estático (decisión de Aldo, 2026-11-27): sin
// funciones, ningún pico de visitas gasta la cuota diaria ni el límite de CPU de Workers y Cloudflare sirve todo desde
// su red. El HTML del inicio, robots.txt y sitemap.xml se generan llamando al mismo worker (worker/pages.ts) con la fecha
// de hoy en Monterrey; la búsqueda, los filtros, la ficha y los bloques fechados los repite el navegador (cliente.js).
// Las cabeceras de seguridad del inicio (CSP con hashes) pasan a _headers y las rutas heredadas a _redirects.
import { cp, readFile, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import pagina, { ORIGEN_PAGES } from '../worker/pages.ts';

const raiz = fileURLToPath(new URL('../', import.meta.url));
const salida = join(raiz, '.wrangler', 'pages-dist');

await rm(salida, { recursive: true, force: true });
await cp(join(raiz, '.wrangler', 'nuevo-assets'), salida, { recursive: true });

const pide = async (ruta) => {
  const r = await pagina.fetch(new Request(ORIGEN_PAGES + ruta));
  if (r.status !== 200) throw new Error(`${ruta}: ${r.status}`);
  return r;
};
const inicio = await pide('/');
const csp = inicio.headers.get('content-security-policy');
if (!csp?.includes("default-src 'none'")) throw new Error('El inicio no trae su CSP.');
await writeFile(join(salida, 'index.html'), await inicio.text());
await writeFile(join(salida, 'robots.txt'), await (await pide('/robots.txt')).text());
await writeFile(join(salida, 'sitemap.xml'), await (await pide('/sitemap.xml')).text());

// La regla «/*» de _headers ya pone frame-ancestors; «! Content-Security-Policy» la quita en el inicio para dejar una sola CSP.
const headers = await readFile(join(salida, '_headers'), 'utf8');
await writeFile(join(salida, '_headers'), `${headers.trimEnd()}

# Inicio estático en Cloudflare Pages: la CSP completa del documento (hashes de su CSS y JS en línea).
/
  ! Content-Security-Policy
  Content-Security-Policy: ${csp}
  Cross-Origin-Opener-Policy: same-origin

/index.html
  ! Content-Security-Policy
  Content-Security-Policy: ${csp}
  Cross-Origin-Opener-Policy: same-origin
`);

// Las mismas rutas heredadas que worker/nuevo.ts (LEGADO) llevan al inicio.
await writeFile(join(salida, '_redirects'), ['/nuevo / 308', '/nuevo/ / 308', '/index / 308', '/index/ / 308', '/index.html/ / 308',
  '/prototypes / 308', '/prototypes/* / 308', '/_archive / 308', '/_archive/* / 308'].join('\n') + '\n');

console.log(`Pages estático: ${salida} (index.html ${(await readFile(join(salida, 'index.html'))).length} B, sin funciones).`);
