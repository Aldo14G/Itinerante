// Stack Data Connect local determinista para este sandbox.
// El CLI (`firebase emulators:start`) pierde una carrera interna (configure con
// 3 reintentos ~2s mientras el hijo hace codegen), asi que aqui se orquesta
// directo: PGLite propio + binario dataconnect-emulator + configure manual.
// Uso: node scripts/local-stack.mjs  (levanta, siembra taxonomia, verifica, apaga)
import { spawn } from "node:child_process";
import { readdir, readFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { homedir } from "node:os";
import { join, resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { buildTaxonomyMutations, validateTaxonomy } from "./seed-taxonomy.mjs";
import { loadLocalEnv } from "./load-env.mjs";
import { readTaxonomy } from "./verify-taxonomy.mjs";

const require = createRequire(import.meta.url);
const { PostgresServer } = require("firebase-tools/lib/emulator/dataconnect/pgliteServer.js");

const ROOT = process.cwd();
const PG_PORT = Number(process.env.LOCAL_PG_PORT ?? 5434);
const DC_PORT = Number(process.env.LOCAL_DC_PORT ?? 9399);
const SERVICE = process.env.DATA_CONNECT_SERVICE_ID ?? "itinerante-service";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function emulatorBinary() {
  const dir = join(homedir(), ".cache", "firebase", "emulators");
  const files = (await readdir(dir)).filter((f) => f.startsWith("dataconnect-emulator-"));
  assert(files.length > 0, "sin binario dataconnect-emulator en cache de firebase-tools");
  return join(dir, files.sort().at(-1));
}

function waitFor(pattern, readLog, timeoutMs) {  return new Promise((resolvePromise, rejectPromise) => {
    const timer = setTimeout(() => rejectPromise(new Error(`timeout esperando: ${pattern}`)), timeoutMs);
    const interval = setInterval(() => {
      if (readLog().includes(pattern)) {
        clearTimeout(timer);
        clearInterval(interval);
        resolvePromise();
      }
    }, 1000);
  });
}

async function main() {
  await loadLocalEnv();
  process.env.DATA_CONNECT_EMULATOR_HOST ??= `127.0.0.1:${DC_PORT}`;
  process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST ??= `http://127.0.0.1:${DC_PORT}`;
  try {
    await run();
  } finally {
    if (!process.env.LOCAL_STACK_KEEP) await teardown();
  }
}

let child;
let pg;

async function run() {
  const { initializeApp, applicationDefault, getApps } = await import("firebase-admin/app");
  const { getDataConnect } = await import("firebase-admin/data-connect");
  const taxonomy = validateTaxonomy(JSON.parse(await readFile(resolve("data/taxonomy.controlled.json"), "utf8")));

  console.log(`[stack] PGLite en 127.0.0.1:${PG_PORT}...`);
  pg = new PostgresServer({ dataDirectory: resolve("dataconnect/.dataconnect/pgliteData") });
  await pg.createPGServer("127.0.0.1", PG_PORT);

  console.log(`[stack] hijo dataconnect en 127.0.0.1:${DC_PORT}...`);
  const binary = await emulatorBinary();
  let childLog = "";
  child = spawn(binary, [
    "--logtostderr", "-v=2", "dev",
    `--config_dir=${resolve("dataconnect")}`,
    `--listen=127.0.0.1:${DC_PORT}`,
  ], { env: { ...process.env }, windowsHide: true });
  child.stderr.on("data", (chunk) => { childLog += chunk.toString(); });
  if (process.env.LOCAL_STACK_CHILD_LOG) {
    const { createWriteStream } = await import("node:fs");
    const tee = createWriteStream(resolve(process.env.LOCAL_STACK_CHILD_LOG), { flags: "w" });
    child.stderr.on("data", (chunk) => tee.write(chunk));
  }
  child.on("error", (error) => { throw error; });
  await waitFor("Listening on address", () => childLog, 180000).catch(async () => {
    child.kill();
    throw new Error(`el hijo no escucho a tiempo:\n${childLog.slice(-2000)}`);
  });

  const connectionString = `postgres://127.0.0.1:${PG_PORT}/itinerante?sslmode=disable`;
  console.log("[stack] configure del servicio...");
  const configured = await fetch(`http://127.0.0.1:${DC_PORT}/emulator/configure`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ connectionString, database: "itinerante", serviceId: SERVICE }),
  });
  assert(configured.ok, `configure fallo: ${configured.status} ${await configured.text()}`);

  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "libreria-itineranteymas";
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
  const dataConnect = getDataConnect({ location: "us-central1", serviceId: SERVICE }, app);

  console.log("[stack] siembra de taxonomia...");
  for (const mutation of buildTaxonomyMutations(taxonomy)) {
    await dataConnect.executeGraphql(mutation);
  }
  const data = await readTaxonomy(dataConnect);
  const slugs = new Set((data.categories ?? []).map(({ slug }) => slug));
  for (const { slug } of taxonomy.categories) assert(slugs.has(slug), `falta en DB: ${slug}`);
  console.log(`[stack] OK: ${(data.categories ?? []).length} categorias, ${(data.subgenres ?? []).length} subgeneros en DB.`);

  if (process.env.INVENTORY_PATH) {
    const { validateCatalog, buildImportMutationsWithGemini } = await import("./import-books.mjs");
    const { embedGemini } = await import("../src/lib/gemini-embedding.js");
    const catalog = validateCatalog(JSON.parse(await readFile(resolve(process.env.INVENTORY_PATH), "utf8")));
    console.log(`[stack] inventario valido: ${catalog.books.length} libros (embeddings Gemini, sin facturacion)...`);
    const mutations = await buildImportMutationsWithGemini(catalog, embedGemini);
    let done = 0;
    for (const mutation of mutations) {
      done += 1;
      console.log(`[stack] mut ${done}/${mutations.length}...`);
      await dataConnect.executeGraphql(mutation);
      console.log(`[stack] mut ${done}/${mutations.length} ok`);
    }
    const probeVector = await embedGemini("novela mexicana pueblo memoria");
    const probe = await dataConnect.executeGraphql(`query ($compare: Vector!) {
      books: books_embedding_similarity(
        compare: $compare method: COSINE
        where: { status: { eq: "active" }, datasetKey: { eq: "inventory" } }
        limit: 3
      ) { slug title }
    }`, { variables: { compare: probeVector } });
    const hits = probe?.data?.books ?? probe?.books ?? [];
    console.log(`[stack] busqueda vectorial: ${hits.map(({ slug }) => slug).join(", ") || "sin resultados"}`);
    assert(hits.some(({ slug }) => slug === "pedro-paramo-juan-rulfo"), "la ficha piloto no aparece en busqueda vectorial");
    console.log("[stack] OK: ficha piloto recuperable por similitud.");
  }

  if (process.env.LOCAL_STACK_KEEP) {
    console.log("[stack] vivo para gates (LOCAL_STACK_KEEP). Terminar con SIGINT/SIGTERM.");
    await new Promise(() => {});
  }

  await teardown();
}

async function teardown() {
  try {
    child.kill();
  } catch {
    // Ya apagado.
  }
  try {
    await pg.server?.close?.();
  } catch {
    // Cierre con sockets abiertos: ruido inofensivo del teardown.
  }
  console.log("[stack] apagado.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  const shutdown = async () => { await teardown(); process.exit(0); };
  process.once('SIGINT', shutdown);
  process.once('SIGTERM', shutdown);
  main().catch((error) => {
    console.error(`[stack] ${error.message}`);
    process.exitCode = 1;
  });
}
