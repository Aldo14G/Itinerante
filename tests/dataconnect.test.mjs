import assert from "node:assert/strict";
import { readFile, readdir } from "node:fs/promises";
import test from "node:test";
import { buildImportMutation, buildImportMutations, buildImportMutationsWithGemini, validateCatalog } from "../scripts/import-books.mjs";
import { transformAmazonCsv } from "../scripts/etl-amazon-books.mjs";
import { localTestEmbedding } from "../src/lib/local-test-embedding.js";

const read = (path) => readFile(new URL(`../${path}`, import.meta.url), "utf8");

function validCatalog() {
  return {
    schemaVersion: 2,
    categories: [{ id: "categoria-narrativa", slug: "categoria-narrativa", name: "Narrativa", sourceLabel: "Inventario Itinerante" }],
    subgenres: [{ id: "subgenero-novela", slug: "subgenero-novela", name: "Novela", categoryId: "categoria-narrativa", sourceLabel: "Inventario Itinerante" }],
    editorials: [{ id: "editorial-real", slug: "editorial-real", name: "Editorial real", countryCode: "MX", website: "https://editorial.test" }],
    authors: [{ id: "autora-real", slug: "autora-real", fullName: "Autora real", bio: null, imageUrl: null }],
    books: [{
      id: "libro-real", slug: "libro-real", isbn13: "9780306406157", editorialId: "editorial-real", subgenreId: "subgenero-novela",
      title: "Libro real", subtitle: null, description: "Descripcion comprobada.", language: "es",
      pages: 200, publishedYear: 2026, format: "Tapa blanda", priceMxnCents: 34900,
      stockQty: 2, status: "active", condition: "new", coverUrl: null,
      coverAlt: "Portada del libro", curatorNote: "Nota propia.", sourceCategory: "Narrativa", sourceSubGenre: "Novela",
      mood: "Reflexivo", tags: ["independiente"], sourceUrl: "https://inventario.test/libro-real",
      verifiedAt: "2026-08-24T12:00:00.000Z",
    }],
    bookAuthors: [{ bookId: "libro-real", authorId: "autora-real", role: "author", ord: 0 }],
  };
}

test("el schema conserva un catalogo trazable y un vector de 768 dimensiones", async () => {
  const schema = await read("dataconnect/schema/schema.gql");
  assert.match(schema, /type Category @table/);
  assert.match(schema, /type Subgenre @table/);
  assert.match(schema, /type Book @table/);
  assert.match(schema, /subgenre: Subgenre!/);
  assert.match(schema, /sourceCategory: String!/);
  assert.match(schema, /sourceSubGenre: String!/);
  assert.match(schema, /priceMxnCents: Int/);
  assert.match(schema, /stockQty: Int!/);
  assert.match(schema, /sourceUrl: String!/);
  assert.match(schema, /verifiedAt: Timestamp!/);
  assert.match(schema, /embedding: Vector @col\(size: 768\)/);
  assert.doesNotMatch(schema, /EventRegistration|NewsletterSubscriber|contactPhone/);
});

test("las consultas de Iti IA separan inventario y datasets de prueba", async () => {
  const tools = await read("dataconnect/tools/tools.gql");
  const testTools = await read("src/ai/test-catalog-tools.ts");
  const testCatalog = await read("src/lib/test-catalog.ts");
  assert.match(tools, /books_embedding_similarity/);
  assert.match(tools, /model: "text-embedding-005"/);
  assert.match(tools, /status: \{ eq: "active" \}/);
  assert.match(tools, /stockQty: \{ gt: 0 \}/);
  assert.match(tools, /datasetKey: \{ eq: "inventory" \}/);
  assert.match(testCatalog, /status: \{ eq: "test" \}/);
  assert.match(testCatalog, /datasetKey: \{ eq: \$datasetKey \}/);
  assert.match(testCatalog, /compare: \$compare method: COSINE/);
  const localSearch = testCatalog.match(/query LocalSearchTestBooks[\s\S]*?\n\s*}\n\s*`/);
  assert.ok(localSearch);
  assert.doesNotMatch(localSearch[0], /compare_embed|text-embedding-005/);
  assert.match(testTools, /recommendTestBooks/);
  assert.match(testCatalog, /searchText/);
  assert.match(testCatalog, /searchInventoryBooks/);
  assert.match(testCatalog, /subgenre\s*\{[\s\S]*category\s*\{/);
  assert.doesNotMatch(testCatalog, /catch \(error\)[\s\S]{0,200}return \[\]/,
    "una caida de Data Connect no debe convertirse en cero resultados");
  assert.match(tools, /sourceUrl/);
  assert.match(tools, /query GetBookBySlug/);
  assert.doesNotMatch(tools, /SearchCulturalEvents/);
});

test("el conector no publica mutaciones de inventario", async () => {
  const files = await readdir(new URL("../dataconnect/connector", import.meta.url));
  const documents = await Promise.all(files.filter((file) => file.endsWith(".gql")).map((file) => read(`dataconnect/connector/${file}`)));
  assert.doesNotMatch(documents.join("\n"), /mutation\s+\w+/);
});

test("la plantilla no puede importarse como si fuera inventario real", async () => {
  const template = JSON.parse(await read("data/books.template.json"));
  assert.throws(() => validateCatalog(template), /es una plantilla/);
});

test("la validacion rechaza procedencia de ejemplo e inventario incoherente", () => {
  const catalog = validCatalog();
  catalog.books[0].sourceUrl = "https://example.invalid/libro";
  assert.throws(() => validateCatalog(catalog), /fuente de ejemplo/);
  const noPrice = validCatalog();
  noPrice.books[0].priceMxnCents = null;
  assert.throws(() => validateCatalog(noPrice), /activo requiere precio verificado/);
});

test("la importacion usa el mismo modelo de embeddings que la busqueda", () => {
  const mutation = buildImportMutation(validCatalog());
  assert.match(mutation, /book_upsertMany/);
  assert.match(mutation, /category_upsertMany/);
  assert.match(mutation, /subgenre_upsertMany/);
  assert.match(mutation, /bookAuthor_upsertMany/);
  assert.match(mutation, /embedding_embed/);
  assert.match(mutation, /text-embedding-005/);
  assert.match(mutation, /Libro real.*Autora real.*Descripcion comprobada/s);
  assert.equal(buildImportMutations(validCatalog()).length, 6);
});

test("el prompt obliga a recuperar, citar y abstenerse cuando no hay resultados", async () => {
  const prompt = await read("src/ai/prompts/iti-ia.prompt");
  const flow = await read("src/ai/iti-ia.ts");
  const route = await read("src/app/api/ai/iti-ia/route.ts");
  assert.match(prompt, /^---\r?\ndescription:/);
  assert.doesNotMatch(prompt, /toolChoice: required/);
  assert.match(prompt, /selector grounded de Iti IA/);
  assert.match(prompt, /\{\{role "user"\}\}/);
  assert.match(prompt, /candidatos ya recuperados.*Firebase Data Connect/s);
  assert.match(prompt, /slugs presentes en los candidatos/);
  assert.match(prompt, /No inventes premios, citas ni argumentos/);
  assert.match(prompt, /No encontre coincidencias verificables/);
  assert.match(flow, /buildRecommendationMessage/);
  assert.match(route, /itiIaFlow/);
  assert.doesNotMatch(route, /Fallback simulado|2666-roberto-bolano|Sommelier/);
});

test("el ETL de Amazon aisla 500 libros de prueba y conserva metadata util para RAG", async () => {
  const csv = await read("data/amazon-bestselling-500.raw.csv");
  const { catalog, quality } = transformAmazonCsv(csv, {
    sourceLabel: "data/amazon-bestselling-500.raw.csv",
    verifiedAt: "2026-08-25T00:00:00.000Z",
  });

  assert.equal(quality.rows, 500);
  assert.equal(quality.missingRequiredValues, 0);
  assert.equal(catalog.catalogKind, "test");
  assert.equal(catalog.schemaVersion, 2);
  assert.equal(catalog.datasetKey, "amazon-bestsellers-500");
  assert.equal(catalog.categories.length, 2);
  assert.equal(catalog.subgenres.length, 48);
  assert.ok(catalog.categories.some(({ slug }) => slug === "fiction"));
  assert.ok(catalog.subgenres.some(({ slug }) => slug === "fiction-science-fiction"));
  assert.equal(catalog.books.length, 500);
  assert.ok(catalog.books.every((book) =>
    book.status === "test" && book.stockQty === 0 && book.priceMxnCents === null));
  assert.ok(catalog.books.every((book) =>
    book.datasetKey === catalog.datasetKey && book.sourceKind === "test_csv"));
  const subgenreIds = new Set(catalog.subgenres.map(({ id }) => id));
  assert.ok(catalog.books.every((book) =>
    subgenreIds.has(book.subgenreId) && book.sourceCategory && book.sourceSubGenre));
  assert.ok(catalog.books.every((book) => book.isbn13 === null || /^\d{13}$/.test(book.isbn13)));

  const mutations = buildImportMutations(catalog);
  const mutation = mutations[0];
  assert.match(mutations.join("\n"), /embedding:\[/);
  assert.doesNotMatch(mutations.join("\n"), /embedding_embed/);
  assert.match(mutations.join("\n"), /isbn13:null/);
  assert.match(mutations.join("\n"), /Calificacion de fuente/);
  assert.match(mutation, /category_upsertMany/);
  assert.match(mutations.join("\n"), /editorial_upsertMany/);

  const vector = localTestEmbedding("science fiction space opera");
  assert.equal(vector.length, 768);
  assert.ok(Math.abs(Math.hypot(...vector) - 1) < 0.000001);
});

test("el import con Gemini incrusta vectores explicitos sin Vertex", async () => {
  const stub = (text) => Array.from({ length: 768 }, (_, i) => (i + text.length % 7) / 768);
  const mutations = await buildImportMutationsWithGemini(validCatalog(), stub);
  assert.equal(mutations.length, 6);
  assert.match(mutations.join("\n"), /embedding:\[/);
  assert.doesNotMatch(mutations.join("\n"), /embedding_embed/);
});
