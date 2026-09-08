import { readFile } from "node:fs/promises";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

async function main() {
  let config;
  try {
    config = JSON.parse(await readFile(new URL("../generated/tools.json", import.meta.url), "utf8"));
  } catch {
    throw new Error("Falta generated/tools.json; ejecute npm run dataconnect:generate");
  }
  assert(config.connector === "tools", "generated/tools.json debe usar connector=tools");
  assert(config.service === "itinerante-service", "generated/tools.json pertenece a otro servicio");
  assert(config.location === "us-central1", "generated/tools.json pertenece a otra region");
  const names = config.tools?.map(({ name }) => name).sort() ?? [];
  assert(JSON.stringify(names) === JSON.stringify(["FilterBooks", "GetBookBySlug", "SearchBooks"]), `tools inesperadas: ${names.join(", ")}`);
  const search = config.tools.find(({ name }) => name === "SearchBooks");
  const filter = config.tools.find(({ name }) => name === "FilterBooks");
  assert(search?.parameters?.properties?.categorySlug, "SearchBooks debe exponer categorySlug");
  assert(search?.parameters?.properties?.subgenreSlug, "SearchBooks debe exponer subgenreSlug");
  assert(!search?.parameters?.properties?.genre, "SearchBooks no debe conservar genre obsoleto");
  assert(filter?.parameters?.properties?.categorySlugs, "FilterBooks debe exponer categorySlugs");
  assert(filter?.parameters?.properties?.subgenreSlugs, "FilterBooks debe exponer subgenreSlugs");
  assert(!filter?.parameters?.properties?.genres, "FilterBooks no debe conservar genres obsoleto");
  await readFile(new URL("../generated/data/package.json", import.meta.url), "utf8");
  console.log("SDK Data Connect y herramientas Genkit verificados.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
