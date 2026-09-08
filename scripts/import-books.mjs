import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { localTestEmbedding } from "../src/lib/local-test-embedding.js";

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const CATALOG_KINDS = new Set(["inventory", "test"]);
const STATUSES = new Set(["draft", "active", "archived", "test"]);
const CONDITIONS = new Set(["new", "used_like_new", "used_good", "unknown"]);

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function assertRecord(value, path) {
  assert(value && typeof value === "object" && !Array.isArray(value), `${path} debe ser un objeto`);
  assert(value.__template !== true, `${path} es una plantilla; copie el archivo y elimine __template antes de importarlo`);
}

function assertString(value, path, { optional = false } = {}) {
  if (optional && (value === null || value === undefined)) return;
  assert(typeof value === "string" && value.trim() !== "", `${path} debe ser texto no vacio`);
}

function assertSlug(value, path) {
  assertString(value, path);
  assert(SLUG.test(value), `${path} debe usar minusculas, numeros y guiones`);
}

function assertHttpsUrl(value, path, { optional = false } = {}) {
  if (optional && (value === null || value === undefined)) return;
  assertString(value, path);
  let url;
  try { url = new URL(value); } catch { throw new Error(`${path} no es una URL valida`); }
  assert(url.protocol === "https:", `${path} debe usar HTTPS`);
  assert(url.hostname !== "example.invalid", `${path} todavia contiene la fuente de ejemplo`);
}

export function isValidIsbn13(value) {
  if (!/^\d{13}$/.test(value)) return false;
  const sum = [...value].slice(0, 12).reduce((total, digit, index) =>
    total + Number(digit) * (index % 2 === 0 ? 1 : 3), 0);
  return (10 - (sum % 10)) % 10 === Number(value[12]);
}

function assertUnique(records, field, collection) {
  const seen = new Set();
  for (const record of records) {
    assert(!seen.has(record[field]), `${collection} contiene ${field} duplicado: ${record[field]}`);
    seen.add(record[field]);
  }
}

export function validateCatalog(catalog) {
  assertRecord(catalog, "catalogo");
  assert(catalog.schemaVersion === 2, "schemaVersion debe ser 2");
  const catalogKind = catalog.catalogKind ?? "inventory";
  assert(CATALOG_KINDS.has(catalogKind), "catalogKind debe ser inventory o test");
  assertSlug(catalog.datasetKey ?? "inventory", "datasetKey");
  for (const name of ["categories", "subgenres", "editorials", "authors", "books", "bookAuthors"]) {
    assert(Array.isArray(catalog[name]), `${name} debe ser una lista`);
  }
  assert(catalog.books.length > 0, "el catalogo debe contener al menos un libro");
  assert(catalog.books.length <= 500, "una importacion admite como maximo 500 libros");

  catalog.categories.forEach((category, index) => {
    const path = `categories[${index}]`;
    assertRecord(category, path);
    assertSlug(category.id, `${path}.id`);
    assert(category.id === category.slug, `${path}.id y slug deben coincidir`);
    assertString(category.name, `${path}.name`);
    assertString(category.sourceLabel, `${path}.sourceLabel`);
  });

  const categoryIds = new Set(catalog.categories.map(({ id }) => id));
  catalog.subgenres.forEach((subgenre, index) => {
    const path = `subgenres[${index}]`;
    assertRecord(subgenre, path);
    assertSlug(subgenre.id, `${path}.id`);
    assert(subgenre.id === subgenre.slug, `${path}.id y slug deben coincidir`);
    assertString(subgenre.name, `${path}.name`);
    assert(categoryIds.has(subgenre.categoryId), `${path}.categoryId no existe en categories`);
    assertString(subgenre.sourceLabel, `${path}.sourceLabel`);
  });

  catalog.editorials.forEach((editorial, index) => {
    const path = `editorials[${index}]`;
    assertRecord(editorial, path);
    assertSlug(editorial.id, `${path}.id`);
    assert(editorial.id === editorial.slug, `${path}.id y slug deben coincidir`);
    assertString(editorial.name, `${path}.name`);
    assertHttpsUrl(editorial.website, `${path}.website`, { optional: true });
  });

  catalog.authors.forEach((author, index) => {
    const path = `authors[${index}]`;
    assertRecord(author, path);
    assertSlug(author.id, `${path}.id`);
    assert(author.id === author.slug, `${path}.id y slug deben coincidir`);
    assertString(author.fullName, `${path}.fullName`);
    assertHttpsUrl(author.imageUrl, `${path}.imageUrl`, { optional: true });
  });

  const editorialIds = new Set(catalog.editorials.map(({ id }) => id));
  const authorIds = new Set(catalog.authors.map(({ id }) => id));
  const subgenreIds = new Set(catalog.subgenres.map(({ id }) => id));
  catalog.books.forEach((book, index) => {
    const path = `books[${index}]`;
    assertRecord(book, path);
    assertSlug(book.id, `${path}.id`);
    assert(book.id === book.slug, `${path}.id y slug deben coincidir`);
    assertString(book.title, `${path}.title`);
    assertString(book.description, `${path}.description`);
    assert(subgenreIds.has(book.subgenreId), `${path}.subgenreId no existe en subgenres`);
    assertString(book.sourceCategory, `${path}.sourceCategory`);
    assertString(book.sourceSubGenre, `${path}.sourceSubGenre`);
    assertSlug(book.datasetKey ?? "inventory", `${path}.datasetKey`);
    assertString(book.sourceKind ?? "verified", `${path}.sourceKind`);
    assertString(book.sourceLabel ?? book.sourceUrl, `${path}.sourceLabel`);
    assertString(book.sourceRecordId, `${path}.sourceRecordId`, { optional: true });
    assert(STATUSES.has(book.status), `${path}.status no es valido`);
    assert(CONDITIONS.has(book.condition), `${path}.condition no es valida`);
    assert(Number.isInteger(book.stockQty) && book.stockQty >= 0, `${path}.stockQty debe ser entero no negativo`);
    assert(book.priceMxnCents === null || (Number.isInteger(book.priceMxnCents) && book.priceMxnCents >= 0), `${path}.priceMxnCents debe ser entero no negativo o null`);
    assert(catalogKind !== "inventory" || book.status !== "active" || book.priceMxnCents !== null, `${path} activo requiere precio verificado`);
    assert(catalogKind !== "test" || book.status === "test", `${path} de prueba requiere status=test`);
    assert(catalogKind !== "test" || book.datasetKey === catalog.datasetKey, `${path}.datasetKey no coincide con el catalogo de prueba`);
    for (const field of ["referencePriceUsdCents", "sourceReviewCount", "sourceWeeksOnList", "sourceRank", "sourceBsr"]) {
      assert(book[field] === null || book[field] === undefined || (Number.isInteger(book[field]) && book[field] >= 0), `${path}.${field} debe ser entero no negativo o null`);
    }
    assert(book.sourceRating === null || book.sourceRating === undefined || (typeof book.sourceRating === "number" && book.sourceRating >= 0 && book.sourceRating <= 5), `${path}.sourceRating debe estar entre 0 y 5 o ser null`);
    assert(book.editorialId === null || editorialIds.has(book.editorialId), `${path}.editorialId no existe en editorials`);
    if (book.isbn13 !== null) assert(isValidIsbn13(book.isbn13), `${path}.isbn13 no supera el digito de control ISBN-13`);
    assertHttpsUrl(book.sourceUrl, `${path}.sourceUrl`);
    assert(!Number.isNaN(Date.parse(book.verifiedAt)), `${path}.verifiedAt debe ser una fecha ISO valida`);
    assertHttpsUrl(book.coverUrl, `${path}.coverUrl`, { optional: true });
  });

  const bookIds = new Set(catalog.books.map(({ id }) => id));
  catalog.bookAuthors.forEach((relation, index) => {
    const path = `bookAuthors[${index}]`;
    assertRecord(relation, path);
    assert(bookIds.has(relation.bookId), `${path}.bookId no existe en books`);
    assert(authorIds.has(relation.authorId), `${path}.authorId no existe en authors`);
    assertString(relation.role, `${path}.role`);
    assert(Number.isInteger(relation.ord) && relation.ord >= 0, `${path}.ord debe ser entero no negativo`);
  });

  for (const book of catalog.books) {
    assert(catalog.bookAuthors.some(({ bookId }) => bookId === book.id), `books.${book.id} requiere al menos un autor o colaborador`);
  }

  assertUnique(catalog.categories, "id", "categories");
  assertUnique(catalog.subgenres, "id", "subgenres");
  assertUnique(catalog.editorials, "id", "editorials");
  assertUnique(catalog.authors, "id", "authors");
  assertUnique(catalog.books, "id", "books");
  assertUnique(catalog.books.filter(({ isbn13 }) => isbn13), "isbn13", "books");
  assertUnique(catalog.bookAuthors.map((item) => ({ key: `${item.bookId}:${item.authorId}:${item.role}` })), "key", "bookAuthors");
  return catalog;
}

function omitNullish(object) {
  return Object.fromEntries(Object.entries(object).filter(([, value]) => value !== null && value !== undefined && value !== ""));
}

function alignRecords(records) {
  const keys = [...new Set(records.flatMap((record) => Object.keys(record)))];
  return records.map((record) => Object.fromEntries(keys.map((key) => [key, record[key] ?? null])));
}

function searchTextFor(book, catalog) {
  const authorNames = catalog.bookAuthors
    .filter(({ bookId }) => bookId === book.id)
    .sort((a, b) => a.ord - b.ord)
    .map(({ authorId }) => catalog.authors.find(({ id }) => id === authorId)?.fullName)
    .filter(Boolean);
  const editorial = catalog.editorials.find(({ id }) => id === book.editorialId)?.name;
  const subgenre = catalog.subgenres.find(({ id }) => id === book.subgenreId);
  const category = catalog.categories.find(({ id }) => id === subgenre?.categoryId);
  return [book.title, book.subtitle, authorNames.join(", "), editorial, book.description,
    book.curatorNote, category?.name, subgenre?.name, book.sourceCategory,
    book.sourceSubGenre, book.mood, book.format, ...(book.tags ?? []),
    book.sourceRating === null || book.sourceRating === undefined ? null : `Calificacion de fuente ${book.sourceRating} de 5`,
    book.sourceReviewCount === null || book.sourceReviewCount === undefined ? null : `${book.sourceReviewCount} resenas en la fuente`,
    book.sourceWeeksOnList === null || book.sourceWeeksOnList === undefined ? null : `${book.sourceWeeksOnList} semanas en lista`,
    book.sourceRank === null || book.sourceRank === undefined ? null : `posicion ${book.sourceRank} en el dataset`,
  ].filter(Boolean).join(". ");
}

function gql(value) {
  if (value === null) return "null";
  if (Array.isArray(value)) return `[${value.map(gql).join(",")}]`;
  if (typeof value === "object") return `{${Object.entries(value).map(([key, item]) => `${key}:${gql(item)}`).join(",")}}`;
  return JSON.stringify(value);
}

export function buildImportMutation(catalog) {
  validateCatalog(catalog);
  const categories = alignRecords(catalog.categories.map(({ __template, ...item }) => item));
  const subgenres = alignRecords(catalog.subgenres.map(({ __template, ...item }) => item));
  const editorials = alignRecords(catalog.editorials.map(({ __template, ...item }) => item));
  const authors = alignRecords(catalog.authors.map(({ __template, ...item }) => item));
  const books = catalog.books.map(({ __template, ...book }) => {
    const searchText = searchTextFor(book, catalog);
    const embedding = (catalog.catalogKind ?? "inventory") === "test"
      ? { embedding: localTestEmbedding(searchText) }
      : { embedding_embed: { model: "text-embedding-005", text: searchText } };
    return omitNullish({ ...book, searchText, ...embedding });
  });
  const bookAuthors = alignRecords(catalog.bookAuthors.map(({ __template, ...item }) => item));
  return `mutation ImportVerifiedBooks {
    categories: category_upsertMany(data: ${gql(categories)})
    subgenres: subgenre_upsertMany(data: ${gql(subgenres)})
    editorials: editorial_upsertMany(data: ${gql(editorials)})
    authors: author_upsertMany(data: ${gql(authors)})
    books: book_upsertMany(data: ${gql(books)})
    bookAuthors: bookAuthor_upsertMany(data: ${gql(bookAuthors)})
  }`;
}

export function buildImportMutations(catalog, batchSize = 20) {
  return buildImportMutationsWithEmbedding(catalog, batchSize);
}

function buildImportMutationsWithEmbedding(catalog, batchSize, embed) {
  validateCatalog(catalog);
  assert(Number.isInteger(batchSize) && batchSize > 0 && batchSize <= 50, "batchSize debe estar entre 1 y 50");
  const preparedBooks = catalog.books.map(({ __template, ...book }) => {
    const searchText = searchTextFor(book, catalog);
    const embedding = embed
      ? { embedding: embed(searchText) }
      : (catalog.catalogKind ?? "inventory") === "test"
        ? { embedding: localTestEmbedding(searchText) }
        : { embedding_embed: { model: "text-embedding-005", text: searchText } };
    return omitNullish({
      ...book,
      searchText,
      ...embedding,
    });
  });
  const collections = collectionsFor(catalog, preparedBooks);
  return batchMutations(collections, batchSize);
}

function collectionsFor(catalog, preparedBooks) {
  return [
    ["category", catalog.categories.map(({ __template, ...item }) => omitNullish(item))],
    ["subgenre", catalog.subgenres.map(({ __template, ...item }) => omitNullish(item))],
    ["editorial", catalog.editorials.map(({ __template, ...item }) => omitNullish(item))],
    ["author", catalog.authors.map(({ __template, ...item }) => omitNullish(item))],
    ["book", preparedBooks],
    ["bookAuthor", catalog.bookAuthors.map(({ __template, ...item }) => item)],
  ];
}

function batchMutations(collections, batchSize) {
  const mutations = [];
  for (const [entity, records] of collections) {
    for (let index = 0; index < records.length; index += batchSize) {
      mutations.push(`mutation { ${entity}_upsertMany(data: ${gql(alignRecords(records.slice(index, index + batchSize)))}) }`);
    }
  }
  return mutations;
}

/**
 * Variante async con embeddings precalculados (Gemini API capa gratuita,
 * sin facturacion). Misma forma que buildImportMutations pero cada libro
 * lleva `embedding: [...]` en vez de `embedding_embed`.
 */
export async function buildImportMutationsWithGemini(catalog, embed, batchSize = 20) {
  validateCatalog(catalog);
  assert(typeof embed === "function", "se requiere funcion embed(texto)");
  assert(Number.isInteger(batchSize) && batchSize > 0 && batchSize <= 50, "batchSize debe estar entre 1 y 50");
  const preparedBooks = [];
  for (const { __template, ...book } of catalog.books) {
    const searchText = searchTextFor(book, catalog);
    preparedBooks.push(omitNullish({ ...book, searchText, embedding: await embed(searchText) }));
  }
  return batchMutations(collectionsFor(catalog, preparedBooks), batchSize);
}

async function main() {
  const args = process.argv.slice(2);
  const commit = args.includes("--commit");
  const input = args.find((arg) => !arg.startsWith("--"));
  assert(input, "Uso: node scripts/import-books.mjs ruta/catalogo.json [--commit]");
  const catalog = validateCatalog(JSON.parse(await readFile(resolve(input), "utf8")));
  if (!commit) {
    console.log(`Catalogo valido: ${catalog.books.length} libros, ${catalog.authors.length} autores.`);
    return;
  }

  if ((catalog.catalogKind ?? "inventory") === "test") {
    assert(process.env.DATA_CONNECT_EMULATOR_HOST || process.env.FIREBASE_DATA_CONNECT_EMULATOR_HOST,
      "Los catalogos de prueba solo pueden importarse con el emulador Data Connect activo");
  }

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
  const useGemini = (process.env.EMBEDDINGS ?? "vertex").toLowerCase() === "gemini";
  let mutations;
  if (useGemini) {
    const { embedGemini } = await import("../src/lib/gemini-embedding.js");
    mutations = await buildImportMutationsWithGemini(catalog, embedGemini);
  } else {
    mutations = buildImportMutations(catalog);
  }
  for (const mutation of mutations) {
    await dataConnect.executeGraphql(mutation);
  }
  console.log(`Importacion completada: ${catalog.books.length} libros (${catalog.catalogKind ?? "inventory"}, embeddings: ${useGemini ? "gemini" : "vertex"}).`);
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
