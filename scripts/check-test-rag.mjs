import { strict as assert } from "node:assert";
import { applicationDefault, getApps, initializeApp } from "firebase-admin/app";
import { getDataConnect } from "firebase-admin/data-connect";
import { localTestEmbedding } from "../src/lib/local-test-embedding.js";
import { rankTestBooks } from "../src/lib/local-test-search.js";

const DATASET_KEY = "amazon-bestsellers-500";
assert(process.env.DATA_CONNECT_EMULATOR_HOST,
  "Defina DATA_CONNECT_EMULATOR_HOST; este gate no puede ejecutarse contra produccion");

const app = getApps()[0] ?? initializeApp({
  credential: applicationDefault(),
  projectId: process.env.FIREBASE_PROJECT_ID ?? "libreria-itineranteymas",
});
const dataConnect = getDataConnect({
  location: process.env.DATA_CONNECT_LOCATION ?? "us-central1",
  serviceId: process.env.DATA_CONNECT_SERVICE_ID ?? "itinerante-service",
  connector: "connector",
}, app);

const fields = `slug title description format tags datasetKey sourceKind sourceLabel
  sourceRating referencePriceUsdCents sourceRank sourceUrl verifiedAt
  subgenre { slug name category { slug name } }`;

const all = await dataConnect.executeGraphqlRead(`
  query TestCatalog($datasetKey: String!) {
    books(where: { status: { eq: "test" }, datasetKey: { eq: $datasetKey } }, limit: 500) { ${fields} }
  }
`, { variables: { datasetKey: DATASET_KEY } });
assert.equal(all.data.books.length, 500);

async function semanticSearch(query) {
  const semantic = await dataConnect.executeGraphqlRead(`
  query TestSemantic($compare: Vector!, $datasetKey: String!) {
    books: books_embedding_similarity(
      compare: $compare method: COSINE
      where: { status: { eq: "test" }, datasetKey: { eq: $datasetKey } }
      limit: 40
    ) { ${fields} }
  }
  `, { variables: { compare: localTestEmbedding(query), datasetKey: DATASET_KEY } });
  return rankTestBooks(query, all.data.books, semantic.data.books.map(({ slug }) => slug)).slice(0, 3);
}

const gold = [
  ["ciencia ficcion", /Project Hail Mary/i],
  ["habitos y productividad", /Atomic Habits/i],
  ["misterio thriller psicologico", /The Dinner Party|The Housemaid/i],
  ["libro infantil novela grafica", /Dog Man/i],
  ["memorias y biografias", /Memorial Days|Spare/i],
];
const goldResults = [];
for (const [query, expected] of gold) {
  const books = await semanticSearch(query);
  assert.equal(books.length, 3, `La consulta ${query} no devolvio tres coincidencias`);
  assert.match(books.map(({ title }) => title).join(" | "), expected, `Recall@3 insuficiente para ${query}`);
  goldResults.push({ query, titles: books.map(({ title }) => title) });
}

const semanticBooks = await semanticSearch(gold[0][0]);
assert(semanticBooks.every((book) => book.datasetKey === DATASET_KEY && book.sourceKind === "test_csv"));

const filtered = await dataConnect.executeGraphqlRead(`
  query TestFilter($datasetKey: String!) {
    books(
      where: {
        status: { eq: "test" }
        datasetKey: { eq: $datasetKey }
        subgenre: { category: { slug: { eq: "fiction" } } }
        sourceRating: { ge: 4.8 }
      }
      orderBy: [{ sourceRank: ASC }]
      limit: 5
    ) { ${fields} }
  }
`, { variables: { datasetKey: DATASET_KEY } });

assert.equal(filtered.data.books.length, 5);
assert(filtered.data.books.every((book) => book.subgenre.category.slug === "fiction" && book.sourceRating >= 4.8));

const selected = semanticBooks[0];
const exact = await dataConnect.executeGraphqlRead(`
  query TestExact($slug: String!, $datasetKey: String!) {
    books(where: {
      slug: { eq: $slug }
      status: { eq: "test" }
      datasetKey: { eq: $datasetKey }
    }, limit: 1) { ${fields} }
  }
`, { variables: { slug: selected.slug, datasetKey: DATASET_KEY } });

assert.equal(exact.data.books.length, 1);
assert.equal(exact.data.books[0].slug, selected.slug);

console.log(JSON.stringify({
  datasetKey: DATASET_KEY,
  goldResults,
  semantic: semanticBooks.map(({ slug, title, subgenre }) => ({ slug, title, category: subgenre.category.name, subgenre: subgenre.name })),
  filtered: filtered.data.books.map(({ slug, title, sourceRating }) => ({ slug, title, sourceRating })),
  exact: { slug: exact.data.books[0].slug, sourceLabel: exact.data.books[0].sourceLabel },
}, null, 2));
