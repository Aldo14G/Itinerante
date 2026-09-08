import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function loadTaxonomy(path = "data/taxonomy.controlled.json") {
  return JSON.parse(await readFile(resolve(path), "utf8"));
}

export function validateTaxonomy(taxonomy) {
  assert(taxonomy && typeof taxonomy === "object", "la taxonomia debe ser un objeto");
  assert(taxonomy.schemaVersion === 1, "taxonomy schemaVersion debe ser 1");
  assert(Array.isArray(taxonomy.categories) && taxonomy.categories.length === 7,
    `se esperaban 7 categorias canonicas, hay ${taxonomy.categories?.length ?? 0}`);
  const SOURCE = "Librería Itinerante · taxonomía controlada v1";
  for (const category of taxonomy.categories) {
    assert(SLUG.test(category.id) && category.id === category.slug, `categoria invalida: ${category.id}`);
    assert(category.name?.trim(), `categoria sin nombre: ${category.id}`);
    assert(category.sourceLabel === SOURCE, `categoria sin sourceLabel canonico: ${category.id}`);
  }
  const categoryIds = new Set(taxonomy.categories.map(({ id }) => id));
  assert(Array.isArray(taxonomy.subgenres) && taxonomy.subgenres.length > 0, "la taxonomia debe tener subgeneros");
  for (const subgenre of taxonomy.subgenres) {
    assert(SLUG.test(subgenre.id) && subgenre.id === subgenre.slug, `subgenero invalido: ${subgenre.id}`);
    assert(subgenre.name?.trim(), `subgenero sin nombre: ${subgenre.id}`);
    assert(subgenre.sourceLabel === SOURCE, `subgenero sin sourceLabel canonico: ${subgenre.id}`);
    assert(categoryIds.has(subgenre.categoryId), `subgenero huerfano: ${subgenre.id}`);
  }
  const ids = [...taxonomy.categories.map(({ id }) => id), ...taxonomy.subgenres.map(({ id }) => id)];
  assert(new Set(ids).size === ids.length, "hay ids duplicados en la taxonomia");
  return taxonomy;
}

function gql(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(gql).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value).map(([key, item]) => `${key}:${gql(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

function alignRecords(records) {
  const keys = [...new Set(records.flatMap((record) => Object.keys(record)))];
  return records.map((record) => Object.fromEntries(keys.map((key) => [key, record[key] ?? null])));
}

export function buildTaxonomyMutations(taxonomy) {
  validateTaxonomy(taxonomy);
  return [
    `mutation { category_upsertMany(data: ${gql(alignRecords(taxonomy.categories))}) }`,
    `mutation { subgenre_upsertMany(data: ${gql(alignRecords(taxonomy.subgenres))}) }`,
  ];
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const input = args.find((arg) => !arg.startsWith("--")) ?? "data/taxonomy.controlled.json";
  const taxonomy = validateTaxonomy(JSON.parse(await readFile(resolve(input), "utf8")));
  const mutations = buildTaxonomyMutations(taxonomy);
  if (!commit) {
    console.log(`Taxonomia valida: ${taxonomy.categories.length} categorias, ${taxonomy.subgenres.length} subgeneros (${mutations.length} mutaciones).`);
    return;
  }

  assert(process.env.DATA_CONNECT_EMULATOR_HOST || process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST,
    "La taxonomia solo se siembra con el emulador Data Connect activo");
  const [{ initializeApp, applicationDefault, getApps }, { getDataConnect }] = await Promise.all([
    import("firebase-admin/app"),
    import("firebase-admin/data-connect"),
  ]);
  const projectId = process.env.FIREBASE_PROJECT_ID ?? process.env.GCLOUD_PROJECT ?? "libreria-itineranteymas";
  const app = getApps()[0] ?? initializeApp({ credential: applicationDefault(), projectId });
  const dataConnect = getDataConnect({
    location: process.env.DATA_CONNECT_LOCATION ?? "us-central1",
    serviceId: process.env.DATA_CONNECT_SERVICE_ID ?? "itinerante-service",
  }, app);
  for (const mutation of mutations) {
    await dataConnect.executeGraphql(mutation);
  }
  console.log(`Taxonomia sembrada: ${taxonomy.categories.length} categorias, ${taxonomy.subgenres.length} subgeneros.`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
