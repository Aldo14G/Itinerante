import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export async function readTaxonomy(dataConnect) {
  const response = await dataConnect.executeGraphql(`
    query {
      categories(orderBy: [{ slug: ASC }]) { slug name sourceLabel }
      subgenres(orderBy: [{ slug: ASC }]) { slug name sourceLabel category { slug } }
    }
  `);
  return response?.data ?? response;
}

async function main() {
  assert(process.env.DATA_CONNECT_EMULATOR_HOST || process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST,
    "La verificacion corre contra el emulador Data Connect");
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
  const data = await readTaxonomy(dataConnect);
  const expected = JSON.parse(await readFile(resolve("data/taxonomy.controlled.json"), "utf8"));
  const categories = data.categories ?? [];
  const subgenres = data.subgenres ?? [];
  console.log(`Emulador: ${categories.length} categorias, ${subgenres.length} subgeneros.`);
  console.log(`Slugs: ${categories.map(({ slug }) => slug).join(", ")}`);
  const slugs = new Set(categories.map(({ slug }) => slug));
  const subSlugs = new Set(subgenres.map(({ slug }) => slug));
  for (const { slug } of expected.categories) {
    assert(slugs.has(slug), `falta categoria canonica en DB: ${slug}`);
  }
  for (const { slug } of expected.subgenres) {
    assert(subSlugs.has(slug), `falta subgenero canonico en DB: ${slug}`);
  }
  console.log("Taxonomia verificada en el emulador.");
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
