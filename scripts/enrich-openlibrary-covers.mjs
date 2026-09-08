import { readFile, writeFile } from "node:fs/promises";

const catalogPath = process.argv[2] ?? "data/books.amazon-test.json";
const qualityPath = process.argv[3] ?? "data/books.amazon-test.quality.json";
const manifestPath = process.argv[4] ?? "data/books.amazon-test.covers.json";

function normalize(value) {
  return String(value ?? "").normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

function authorsFor(book, catalog) {
  return catalog.bookAuthors.filter((item) => item.bookId === book.id)
    .sort((left, right) => left.ord - right.ord)
    .map((item) => catalog.authors.find((author) => author.id === item.authorId)?.fullName)
    .filter(Boolean);
}

async function findCover(book, authors) {
  const params = new URLSearchParams({
    title: book.title,
    author: authors.join(" "),
    fields: "key,title,author_name,cover_i",
    limit: "5",
  });
  const response = await fetch(`https://openlibrary.org/search.json?${params}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!response.ok) throw new Error(`Open Library ${response.status}`);
  const data = await response.json();
  const title = normalize(book.title);
  const wantedAuthors = authors.map(normalize);
  const match = data.docs?.find((candidate) => {
    if (!candidate.cover_i || normalize(candidate.title) !== title) return false;
    const foundAuthors = (candidate.author_name ?? []).map(normalize);
    return wantedAuthors.length === 0 || wantedAuthors.some((wanted) => foundAuthors.includes(wanted));
  });
  if (!match) return null;
  return {
    coverUrl: `https://covers.openlibrary.org/b/id/${match.cover_i}-M.jpg?default=false`,
    sourceUrl: `https://openlibrary.org${match.key}`,
  };
}

async function main() {
  const [catalog, quality] = await Promise.all([
    readFile(catalogPath, "utf8").then(JSON.parse),
    readFile(qualityPath, "utf8").then(JSON.parse),
  ]);
  const manifest = [];
  let nextIndex = 0;
  let failures = 0;

  async function worker() {
    while (nextIndex < catalog.books.length) {
      const book = catalog.books[nextIndex++];
      try {
        const cover = await findCover(book, authorsFor(book, catalog));
        if (!cover) continue;
        book.coverUrl = cover.coverUrl;
        book.coverAlt = `Portada de ${book.title}`;
        manifest.push({ slug: book.slug, coverUrl: cover.coverUrl, sourceUrl: cover.sourceUrl });
      } catch {
        failures += 1;
      }
    }
  }

  await Promise.all(Array.from({ length: 4 }, worker));
  manifest.sort((left, right) => left.slug.localeCompare(right.slug));
  quality.coverProvider = "Open Library";
  quality.coverMatches = manifest.length;
  quality.coverMissing = catalog.books.length - manifest.length;
  quality.coverLookupFailures = failures;
  quality.risks = [...new Set([
    ...(quality.risks ?? []),
    "Las portadas de Open Library solo se aceptan con coincidencia exacta de titulo y autor; las demas usan cubierta editorial de marca.",
  ])];

  await Promise.all([
    writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
    writeFile(qualityPath, `${JSON.stringify(quality, null, 2)}\n`, "utf8"),
    writeFile(manifestPath, `${JSON.stringify({ provider: "Open Library", books: manifest }, null, 2)}\n`, "utf8"),
  ]);
  console.log(JSON.stringify({ books: catalog.books.length, matched: manifest.length, missing: quality.coverMissing, failures }, null, 2));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
