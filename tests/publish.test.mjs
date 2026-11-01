// Comprobaciones de publicacion: lo que prepare-public.mjs deja en public/ (Cloudflare) y la cabecera de index.html.
import test, { before, after } from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile, mkdir, cp } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { preparePublic, ROOT_FILES, REQUIRED_IN_ASSETS, localRefs, isInternal } from "../scripts/prepare-public.mjs";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
let tmp;
let out;
let files;

before(async () => {
  tmp = await mkdtemp(join(tmpdir(), "iti-publish-"));
  out = join(tmp, "public");
  ({ files } = await preparePublic({ out }));
});
after(async () => {
  await rm(tmp, { recursive: true, force: true });
});

test("incluye los archivos publicos obligatorios y _headers", () => {
  for (const f of [...ROOT_FILES, ...REQUIRED_IN_ASSETS, "_headers"]) {
    assert.ok(files.includes(f), `falta ${f} en public/`);
  }
});

test("no publica archivos internos ni carpetas del repositorio", () => {
  const forbidden = /(^|\/)(provenance\.json|sources\.json|node_modules|docs|tests|tools|scripts|worker|_archive|design|prototypes|images)(\/|$)|(^|\/)\.[^/]|\.(map|md|log|zip)$/i;
  const leaked = files.filter((f) => forbidden.test(f));
  assert.deepEqual(leaked, []);
  assert.ok(!files.some((f) => f === "worker/_headers"), "worker/_headers solo debe salir como /_headers");
});

test("index.html solo referencia archivos que existen en public/", async () => {
  const html = await readFile(join(out, "index.html"), "utf8");
  const refs = [...localRefs(html, "html")];
  assert.ok(refs.length > 10, "se esperaban varias referencias locales");
  const set = new Set(files);
  assert.deepEqual(refs.filter((r) => !set.has(r.replace(/^\//, ""))), []);
});

test("la CSP del HTML no abre origenes externos", async () => {
  const html = await readFile(join(out, "index.html"), "utf8");
  const csp = html.match(/Content-Security-Policy" content="([^"]+)"/)[1];
  assert.ok(!/https?:|\*/.test(csp), csp);
  assert.match(csp, /default-src 'self'/);
});

test("cabecera de index.html: indexable, tema claro, sin dominio inventado", async () => {
  const html = await readFile(join(out, "index.html"), "utf8");
  const head = html.slice(0, html.indexOf("</head>"));
  assert.ok(!/noindex|nofollow/i.test(head), "el sitio debe ser indexable");
  assert.match(head, /<meta name="theme-color" content="#fbf8f2">/);
  assert.match(head, /<link rel="icon" href="Logo\.png"/);
  assert.match(head, /<title>[^<]+<\/title>/);
  assert.match(head, /<meta name="description" content="[^"]{40,}"/);
  // Sin dominio verificado no hay canonical, og:url ni og:image (exigen URL absoluta).
  assert.ok(!/rel="canonical"|og:url|og:image/.test(head), "no agregues canonical/og:url/og:image sin dominio verificado");
});

test("JSON-LD: direccion y horario lunes a sabado 11:00-20:00", async () => {
  const html = await readFile(join(out, "index.html"), "utf8");
  const ld = JSON.parse(html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)[1]);
  assert.equal(ld["@type"], "BookStore");
  assert.equal(ld.address.streetAddress, "Mariano Matamoros Pte. 421");
  assert.equal(ld.address.addressLocality, "Monterrey");
  const [h] = ld.openingHoursSpecification;
  assert.deepEqual(h.dayOfWeek, ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"]);
  assert.equal(h.opens, "11:00");
  assert.equal(h.closes, "20:00");
});

test("robots.txt permite todo y no declara un sitemap sin dominio", async () => {
  const robots = await readFile(join(out, "robots.txt"), "utf8");
  assert.match(robots, /^User-agent: \*$/m);
  assert.match(robots, /^Allow: \/$/m);
  assert.ok(!/^Disallow: \/$/m.test(robots));
  assert.ok(!/^Sitemap:/mi.test(robots));
  assert.ok(!files.includes("sitemap.xml"), "sitemap.xml requiere dominio verificado");
});

test("_headers: seguridad conservada y cache sin immutable para lo que no tiene huella", async () => {
  const text = await readFile(join(out, "_headers"), "utf8");
  const rules = new Map();
  let cur;
  for (const line of text.split(/\r?\n/)) {
    if (!line.trim() || line.trim().startsWith("#")) continue;
    if (!/^\s/.test(line)) rules.set((cur = line.trim()), []);
    else rules.get(cur).push(line.trim());
  }
  const header = (rule, name) => (rules.get(rule) || []).find((l) => l.toLowerCase().startsWith(name.toLowerCase() + ":"));
  assert.match(header("/*", "Content-Security-Policy"), /frame-ancestors 'self'/);
  for (const h of ["Strict-Transport-Security", "X-Content-Type-Options", "X-Frame-Options", "Referrer-Policy", "Permissions-Policy"]) {
    assert.ok(header("/*", h), `falta ${h}`);
  }
  assert.ok(!header("/*", "Cache-Control"), "/* no debe fijar Cache-Control (se uniria con las demas reglas)");
  for (const r of ["/", "/index.html", "/*.css", "/*.js", "/*.json"]) {
    assert.match(header(r, "Cache-Control"), /max-age=0, must-revalidate/, r);
  }
  for (const [r, lines] of rules) {
    if (r !== "/assets/fonts/*.woff2") assert.ok(!(lines.join(" ").includes("immutable")), `${r} no debe ser immutable`);
  }
  assert.match(header("/assets/fonts/*.woff2", "Cache-Control"), /immutable/);
  const cacheRules = [...rules].filter(([, l]) => l.some((x) => /^cache-control/i.test(x))).map(([r]) => r);
  assert.ok(!cacheRules.includes("/assets/*"), "una regla /assets/* se solaparia con las demas");
});

test("falla con error claro si falta un archivo obligatorio", async () => {
  const fake = join(tmp, "fake-root");
  await mkdir(join(fake, "worker"), { recursive: true });
  await writeFile(join(fake, "index.html"), "<!doctype html>");
  await assert.rejects(preparePublic({ root: fake, out: join(tmp, "fake-out") }), /falta el archivo obligatorio: tokens\.css/);
});

test("no borra la raiz del repositorio ni un ancestro", async () => {
  await assert.rejects(preparePublic({ out: root }), /Destino no valido/);
  await assert.rejects(preparePublic({ out: dirname(root) }), /Destino no valido/);
});

test("detecta referencias rotas en el HTML publicado", async () => {
  const fakeRoot = join(tmp, "broken-root");
  await cp(root, fakeRoot, {
    recursive: true,
    filter: (src) => !/node_modules|[\\/]\.git|[\\/]public|[\\/]_archive|[\\/]\.claude|[\\/]docs|[\\/]instagram-data|[\\/]web-intel|[\\/]imports|[\\/]supabase|[\\/]generated|[\\/]dataconnect|[\\/]testsprite/i.test(src.slice(root.length)),
  });
  const p = join(fakeRoot, "index.html");
  await writeFile(p, (await readFile(p, "utf8")).replace("</head>", '<link rel="stylesheet" href="no-existe.css"></head>'));
  await assert.rejects(preparePublic({ root: fakeRoot, out: join(tmp, "broken-out") }), /Referencias rotas[\s\S]*no-existe\.css/);
});

test("isInternal marca provenance.json, sources.json, dotfiles y mapas", () => {
  for (const n of ["provenance.json", "sources.json", ".env", "app.js.map", "NOTAS.md"]) assert.ok(isInternal(n), n);
  for (const n of ["catalog.json", "fonts.css", "f001.webp", "OFL-archivo.txt"]) assert.ok(!isInternal(n), n);
});

test("cf:dev y cf:deploy regeneran public/ antes de wrangler y se abortan si falla", async () => {
  const pkg = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  for (const s of ["cf:dev", "cf:deploy"]) {
    assert.match(pkg.scripts[s], /^node scripts\/prepare-public\.mjs && wrangler /, s);
  }
  const wr = await readFile(join(root, "wrangler.jsonc"), "utf8");
  assert.match(wr, /"directory": "\.\/public"/);
});
