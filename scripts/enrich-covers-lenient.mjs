// Segunda pasada flexible: rellena portadas faltantes con coincidencia
// por titulo exacto (autor preferido, no exigido) en Open Library.
// Uso: node scripts/enrich-covers-lenient.mjs
import { readFile, writeFile } from "node:fs/promises";

const catalogPath = "data/books.amazon-test.json";
const manifestPath = "data/books.amazon-test.covers.json";

function normalize(value) {
  return String(value ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function authorsFor(book, catalog) {
  return catalog.bookAuthors.filter((item) => item.bookId === book.id)
    .sort((left, right) => left.ord - right.ord)
    .map((item) => catalog.authors.find((author) => author.id === item.authorId)?.fullName)
    .filter(Boolean);
}

async function findCoverLenient(book, authors) {
  const params = new URLSearchParams({ title: book.title, fields: "key,title,author_name,cover_i", limit: "8" });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Open Library ${response.status}`);
  const data = await response.json();
  const title = normalize(book.title);
  const wanted = authors.map(normalize);
  const withCover = (data.docs ?? []).filter((doc) => doc.cover_i && normalize(doc.title) === title);
  if (!withCover.length) return null;
  const byAuthor = withCover.find((doc) => {
    const found = (doc.author_name ?? []).map(normalize);
    return wanted.some((name) => found.includes(name) || found.some((item) => item.includes(name) || name.includes(item)));
  });
  const match = byAuthor ?? withCover[0];
  return {
    coverUrl: `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg?default=false`,
    sourceUrl: `https://openlibrary.org${match.key}`,
  };
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const manifestDoc = JSON.parse(await readFile(manifestPath, "utf8"));
const have = new Set(manifestDoc.books.map((entry) => entry.slug));
const pending = catalog.books.filter((book) => !have.has(book.slug));
let index = 0;
let matched = 0;
let failures = 0;

async function worker() {
  while (index < pending.length) {
    const book = pending[index++];
    try {
      const cover = await findCoverLenient(book, authorsFor(book, catalog));
      if (!cover) continue;
      book.coverUrl = cover.coverUrl;
      book.coverAlt = `Portada de ${book.title}`;
      manifestDoc.books.push({ slug: book.slug, coverUrl: cover.coverUrl, sourceUrl: cover.sourceUrl });
      matched += 1;
    } catch {
      failures += 1;
    }
  }
}

await Promise.all(Array.from({ length: 4 }, worker));
manifestDoc.books.sort((left, right) => left.slug.localeCompare(right.slug));
manifestDoc.provider = "Open Library";
manifestDoc.count = manifestDoc.books.length;
await Promise.all([
  writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
  writeFile(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, "utf8"),
]);
console.log(JSON.stringify({ pending: pending.length, matched, total: manifestDoc.books.length, failures }));
