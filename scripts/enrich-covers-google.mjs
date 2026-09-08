// Tercera pasada: Google Books (sin clave) para los faltantes de Open Library.
// Acepta el primer resultado con miniatura cuando el titulo coincide.
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

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function findCoverGoogle(book, authors) {
  const query = `intitle:${book.title}${authors[0] ? `+inauthor:${authors[0]}` : ""}`;
  const response = await fetch(`https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&maxResults=5&printType=books`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Google Books ${response.status}`);
  const data = await response.json();
  const title = normalize(book.title);
  for (const item of data.items ?? []) {
    const info = item.volumeInfo ?? {};
    if (!info.imageLinks?.thumbnail || normalize(info.title) !== title) continue;
    return {
      coverUrl: String(info.imageLinks.thumbnail).replace(/^http:/, "https:"),
      sourceUrl: info.infoLink || `https://books.google.com/books?id=${item.id}`,
    };
  }
  return null;
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
      const cover = await findCoverGoogle(book, authorsFor(book, catalog));
      if (!cover) continue;
      book.coverUrl = cover.coverUrl;
      book.coverAlt = `Portada de ${book.title}`;
      manifestDoc.books.push({ slug: book.slug, coverUrl: cover.coverUrl, sourceUrl: cover.sourceUrl });
      matched += 1;
    } catch {
      failures += 1;
    }
    await sleep(250);
  }
}

await Promise.all(Array.from({ length: 2 }, worker));
manifestDoc.books.sort((left, right) => left.slug.localeCompare(right.slug));
manifestDoc.provider = "Open Library + Google Books";
manifestDoc.count = manifestDoc.books.length;
await Promise.all([
  writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
  writeFile(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, "utf8"),
]);
console.log(JSON.stringify({ pending: pending.length, matched, total: manifestDoc.books.length, failures }));
