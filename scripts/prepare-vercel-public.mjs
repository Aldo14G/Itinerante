// Genera public/, la única carpeta que publican Firebase Hosting (predeploy) y Vercel.
// Allowlist: index.html, robots.txt, sitemap.xml, fuentes y solo los archivos que
// index.html y sus hojas de estilo referencian. Nunca copia la raíz del repositorio.
import { copyFile, lstat, mkdir, readdir, readFile, realpath, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { dirname, isAbsolute, join, posix, relative, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export const SITE_ORIGIN = 'https://libreria-itineranteymas.web.app';
const ALWAYS = ['index.html', 'robots.txt', 'sitemap.xml'];
const DIRECTORIES = ['assets/fonts'];
const ALLOWED = /^(index\.html|robots\.txt|sitemap\.xml|Logo\.png|assets\/css\/[\w.-]+\.css|assets\/js\/[\w.-]+\.js|assets\/fonts\/[\w.-]+\.(woff2|txt)|images\/[\w./-]+\.(webp|avif|png|jpe?g|svg|mp4))$/i;
const FORBIDDEN = /(^|\/)\.|\.md$|\.json$|\.env|(^|\/)config\.js$|^(features|_archive|src|data|docs|scripts|tests|tools|supabase|dataconnect|node_modules|instagram-data|web-intel)\//i;
const EXTERNAL = /^(#|mailto:|tel:|data:|blob:|javascript:|https?:|\/\/)/i;
const REFERENCE_ATTRIBUTES = /\b(?:src|href|poster|data-poster|data-src|data-desktop|data-mobile)="([^"]+)"/g;
const SRCSET_ATTRIBUTES = /\b(?:srcset|data-srcset)="([^"]+)"/g;

const isInside = (parent, child) => {
  const path = relative(parent, child);
  return Boolean(path) && !path.startsWith('..') && !isAbsolute(path);
};

function toRepoPath(reference, fromDir = '') {
  let value = reference.trim();
  if (value.startsWith(SITE_ORIGIN)) value = value.slice(SITE_ORIGIN.length);
  else if (EXTERNAL.test(value)) return null;
  value = decodeURIComponent(value.split(/[?#]/)[0]);
  if (!value || value === '/') return null;
  const path = value.startsWith('/') ? posix.normalize(value.slice(1)) : posix.normalize(posix.join(fromDir, value));
  if (path.startsWith('..')) throw new Error(`Referencia fuera del sitio: ${reference}`);
  return path;
}

async function listFiles(root, dir) {
  const entries = await readdir(join(root, dir), { withFileTypes: true });
  const nested = await Promise.all(entries.map(entry => {
    const path = posix.join(dir, entry.name);
    if (entry.isSymbolicLink()) throw new Error(`Enlace simbólico no permitido: ${path}`);
    return entry.isDirectory() ? listFiles(root, path) : [path];
  }));
  return nested.flat();
}

export async function collectPublicFiles(root, html) {
  const markup = html ?? await readFile(join(root, 'index.html'), 'utf8');
  const files = new Set(ALWAYS);
  const add = (reference, fromDir) => {
    const path = toRepoPath(reference, fromDir);
    if (path) files.add(path);
  };

  for (const [, value] of markup.matchAll(REFERENCE_ATTRIBUTES)) add(value);
  for (const [, value] of markup.matchAll(SRCSET_ATTRIBUTES)) {
    for (const candidate of value.split(',')) add(candidate.trim().split(/\s+/)[0]);
  }
  for (const [match] of markup.matchAll(new RegExp(`${SITE_ORIGIN.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}/[^"'\\s)<>]+`, 'g'))) add(match);

  for (const path of files) {
    if (FORBIDDEN.test(path) || !ALLOWED.test(path)) throw new Error(`Archivo fuera de la allowlist pública: ${path}`);
  }
  for (const sheet of [...files].filter(path => path.endsWith('.css'))) {
    const css = await readFile(join(root, sheet), 'utf8');
    for (const [, value] of css.matchAll(/url\(\s*["']?([^"')]+)["']?\s*\)/g)) add(value, posix.dirname(sheet));
  }
  for (const dir of DIRECTORIES) (await listFiles(root, dir)).forEach(path => files.add(path));

  const realRoot = await realpath(root);
  for (const path of files) {
    if (FORBIDDEN.test(path) || !ALLOWED.test(path)) throw new Error(`Archivo fuera de la allowlist pública: ${path}`);
    const info = await lstat(join(root, path)).catch(() => null);
    if (!info?.isFile()) throw new Error(`Referencia sin archivo local regular (o enlace simbólico): ${path}`);
    if (!isInside(realRoot, await realpath(join(root, path)))) throw new Error(`Archivo fuera del repositorio: ${path}`);
  }
  return [...files].sort();
}

export async function buildPublic({ root = process.cwd(), outDir = join(root, 'public') } = {}) {
  const target = resolve(outDir);
  if (target !== resolve(root, 'public') && !isInside(resolve(tmpdir()), target)) {
    throw new Error(`Destino no permitido: ${target}. Solo <repo>/public o una carpeta temporal.`);
  }
  const files = await collectPublicFiles(root);
  await rm(target, { recursive: true, force: true });
  for (const path of files) {
    await mkdir(dirname(join(target, path)), { recursive: true });
    await copyFile(join(root, path), join(target, path));
  }
  return files;
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
  const outDir = join(root, 'public');
  const files = await buildPublic({ root, outDir });
  const { stat } = await import('node:fs/promises');
  const bytes = (await Promise.all(files.map(path => stat(join(outDir, path))))).reduce((sum, info) => sum + info.size, 0);
  console.log(`public/ listo: ${files.length} archivos, ${(bytes / 1048576).toFixed(2)} MB`);
}
