// Construye public/ desde la raiz: es la lista de permitidos que publican Cloudflare (wrangler.jsonc),
// Firebase Hosting (predeploy, legado) y Vercel (legado). Lo que no esta aqui no se publica.
//
// Uso:  node scripts/prepare-public.mjs [--out <directorio>]
// Siempre borra el destino y lo regenera, asi que nunca queda un public/ viejo; si falta un archivo
// obligatorio o index.html apunta a algo que no se copio, termina con codigo 1 y `cf:deploy` se aborta.
import { cp, mkdir, readdir, readFile, rm, stat } from "node:fs/promises";
import { basename, dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const SOURCE_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");

// Archivos sueltos de la raiz que se publican (todos obligatorios salvo los opcionales).
export const ROOT_FILES = [
  "index.html",
  "tokens.css",
  "style.css",
  "mobile.css",
  "app.js",
  "catalog.js",
  "motion.js",
  "scenes-desktop.js",
  "Logo.png",
  "Logo.webp",
  "robots.txt",
];
// Se publican solo si existen (sitemap.xml exige dominio verificado y todavia no se crea).
export const OPTIONAL_ROOT_FILES = ["sitemap.xml"];
// Carpeta publica completa, menos lo listado en INTERNAL_NAMES / INTERNAL_PATTERNS.
export const PUBLIC_DIRS = ["assets"];
// Archivos que el sitio necesita para arrancar: si falta alguno, no se publica nada.
export const REQUIRED_IN_ASSETS = [
  "assets/js/boot.js",
  "assets/fonts/fonts.css",
  "assets/data/catalog.json",
  "assets/img/logo-96.webp",
  "assets/seq/f001.webp",
  "assets/seq-m/m001.webp",
];
// Config de Cloudflare: worker/_headers se publica como /_headers (no es contenido, lo consume el runtime).
export const HEADERS_SOURCE = join("worker", "_headers");

// Internos: assets/provenance.json guarda rutas de _archive/ y hashes de las fotos originales;
// assets/fonts/sources.json guarda la URL de Google Fonts con la que se obtuvieron las fuentes.
export const INTERNAL_NAMES = new Set(["provenance.json", "sources.json"]);
export const INTERNAL_PATTERNS = [/^\./, /\.map$/i, /\.(md|log|zip|csv|pdf|psd|ai)$/i, /~$/];

export function isInternal(name) {
  return INTERNAL_NAMES.has(name) || INTERNAL_PATTERNS.some((re) => re.test(name));
}

async function exists(path) {
  try {
    await stat(path);
    return true;
  } catch {
    return false;
  }
}

async function listFiles(dir) {
  const out = [];
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...(await listFiles(full)));
    else out.push(full);
  }
  return out;
}

// Rutas locales que usa un HTML/CSS (src, href, srcset, url()). Ignora absolutas, anclas, data: y mailto.
export function localRefs(text, kind) {
  const refs = new Set();
  const add = (raw) => {
    const value = raw.trim().split(/[?#]/)[0];
    if (!value || /^([a-z][a-z0-9+.-]*:|\/\/|#)/i.test(value)) return;
    refs.add(value);
  };
  if (kind === "css") {
    for (const m of text.matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)) add(m[2]);
    return refs;
  }
  for (const m of text.matchAll(/\b(?:src|href|poster)\s*=\s*"([^"]*)"/gi)) add(m[1]);
  for (const m of text.matchAll(/\bsrcset\s*=\s*"([^"]*)"/gi)) {
    for (const part of m[1].split(",")) add(part.trim().split(/\s+/)[0] || "");
  }
  return refs;
}

async function checkReferences(outDir) {
  const missing = [];
  const files = (await listFiles(outDir)).filter((f) => /\.(html|css)$/i.test(f));
  for (const file of files) {
    const kind = file.toLowerCase().endsWith(".css") ? "css" : "html";
    const text = await readFile(file, "utf8");
    for (const ref of localRefs(text, kind)) {
      const target = ref.startsWith("/") ? join(outDir, ref) : resolve(dirname(file), ref);
      if (!(await exists(target))) missing.push(`${relative(outDir, file)} -> ${ref}`);
    }
  }
  return missing;
}

// Impide borrar la raiz del repo (o un ancestro) por un --out mal escrito.
function assertSafeOutDir(root, outDir) {
  const up = relative(outDir, root);
  if (up === "" || !up.startsWith("..")) throw new Error(`Destino no valido (es o contiene a la raiz del repositorio): ${outDir}`);
}

export async function preparePublic({ root = SOURCE_ROOT, out = join(root, "public") } = {}) {
  const outDir = resolve(out);
  assertSafeOutDir(root, outDir);

  const problems = [];
  const mustExist = [...ROOT_FILES, ...REQUIRED_IN_ASSETS, HEADERS_SOURCE];
  for (const file of mustExist) {
    if (!(await exists(join(root, file)))) problems.push(`falta el archivo obligatorio: ${file}`);
  }
  for (const dir of PUBLIC_DIRS) {
    if (!(await exists(join(root, dir)))) problems.push(`falta la carpeta obligatoria: ${dir}/`);
  }
  if (problems.length) throw new Error(`No se puede construir public/:\n  - ${problems.join("\n  - ")}`);

  // Regenerar siempre desde cero: nunca se conserva un public/ anterior (p. ej. el del sitio archivado).
  await rm(outDir, { recursive: true, force: true });
  await mkdir(outDir, { recursive: true });

  for (const file of [...ROOT_FILES, ...OPTIONAL_ROOT_FILES]) {
    if (await exists(join(root, file))) await cp(join(root, file), join(outDir, file));
  }
  for (const dir of PUBLIC_DIRS) {
    await cp(join(root, dir), join(outDir, dir), {
      recursive: true,
      filter: (src) => src === join(root, dir) || !isInternal(basename(src)),
    });
  }
  await cp(join(root, HEADERS_SOURCE), join(outDir, "_headers"));

  // Verificacion posterior: nada interno publicado y todo lo que referencia el HTML/CSS existe.
  const published = (await listFiles(outDir)).map((f) => relative(outDir, f).split(sep).join("/"));
  const leaked = published.filter((f) => f !== "_headers" && f.split("/").some(isInternal));
  if (leaked.length) throw new Error(`Archivos internos en public/: ${leaked.join(", ")}`);
  const missing = await checkReferences(outDir);
  if (missing.length) throw new Error(`Referencias rotas en public/:\n  - ${missing.join("\n  - ")}`);

  return { outDir, files: published };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const flag = process.argv.indexOf("--out");
  const out = flag > -1 ? resolve(process.argv[flag + 1] ?? "") : undefined;
  if (flag > -1 && !process.argv[flag + 1]) {
    console.error("--out necesita un directorio");
    process.exit(1);
  }
  try {
    const { outDir, files } = await preparePublic({ out });
    console.log(`public/ listo: ${files.length} archivos en ${outDir}`);
  } catch (error) {
    console.error(error.message);
    process.exit(1);
  }
}
