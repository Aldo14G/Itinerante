// Cuarta pasada: Open Library con puntaje (traslape de titulo + autor) y
// verificacion HEAD de la imagen. Solo guarda portadas reales que cargan.
import { readFile, writeFile } from "node:fs/promises";

const catalogPath = "data/books.amazon-test.json";
const manifestPath = "data/books.amazon-test.covers.json";

function normalize(value) {
  return String(value ?? "").normalize("NFKD").replace(/[̀-ͯ]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

const tokens = (value) => new Set(normalize(value).split(" ").filter((t) => t.length > 2));

function authorsFor(book, catalog) {
  return catalog.bookAuthors.filter((item) => item.bookId === book.id)
    .sort((left, right) => left.ord - right.ord)
    .map((item) => catalog.authors.find((author) => author.id === item.authorId)?.fullName)
    .filter(Boolean);
}

async function headOk(url) {
  try {
    const response = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(10000) });
    return response.ok;
  } catch {
    return false;
  }
}

async function findCoverScored(book, authors) {
  const params = new URLSearchParams({ title: book.title, fields: "key,title,author_name,cover_i", limit: "12" });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Open Library ${response.status}`);
  const data = await response.json();
  const wanted = tokens(book.title);
  if (!wanted.size) return null;
  const wantedAuthors = new Set(authors.flatMap((name) => [...tokens(name)]));
  let best = null;
  for (const doc of data.docs ?? []) {
    if (!doc.cover_i) continue;
    const docTokens = tokens(doc.title);
    if (!docTokens.size) continue;
    const overlap = [...wanted].filter((t) => docTokens.has(t)).length / wanted.size;
    const docAuthors = new Set((doc.author_name ?? []).flatMap((name) => [...tokens(name)]));
    const authorHit = [...wantedAuthors].some((t) => docAuthors.has(t));
    const score = overlap + (authorHit ? 0.5 : 0);
    const accept = (authorHit && overlap >= 0.4) || overlap >= 0.85;
    if (accept && (!best || score > best.score)) {
      best = {
        score,
        coverUrl: `https://covers.openlibrary.org/b/id/${doc.cover_i}-M.jpg?default=false`,
        sourceUrl: `https://openlibrary.org${doc.key}`,
      };
    }
  }
  if (best && await headOk(best.coverUrl)) return best;
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
      const cover = await findCoverScored(book, authorsFor(book, catalog));
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

await Promise.all(Array.from({ length: 3 }, worker));
manifestDoc.books.sort((left, right) => left.slug.localeCompare(right.slug));
manifestDoc.provider = "Open Library";
manifestDoc.count = manifestDoc.books.length;
await Promise.all([
  writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
  writeFile(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, "utf8"),
]);
console.log(JSON.stringify({ pending: pending.length, matched, total: manifestDoc.books.length, failures }));
