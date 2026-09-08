import { readFile, writeFile } from "node:fs/promises";
import { isValidIsbn13 } from "./import-books.mjs";

const catalogPath = process.argv[2] ?? "data/books.amazon-test.json";
const qualityPath = process.argv[3] ?? "data/books.amazon-test.quality.json";
const manifestPath = process.argv[4] ?? "data/books.amazon-test.covers.json";

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalize(value) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function extractCoreTitle(title) {
  const raw = String(title ?? "").trim();
  // Quitar subtítulos tras dos puntos, guion largo, paréntesis o corchetes
  const beforeSep = raw.split(/[:\(\[\—\-]/)[0].trim();
  return beforeSep.length >= 3 ? beforeSep : raw;
}

function extractCoreAuthor(author) {
  const raw = String(author ?? "").trim();
  // Si dice "Various Artists" o "Dr. Seuss", limpiar
  if (/various/i.test(raw)) return "";
  return raw.split(/[,&]/)[0].trim();
}

function tokenOverlapScore(strA, strB) {
  const stopWords = new Set(["the", "a", "an", "and", "of", "in", "to", "for", "on", "with", "de", "la", "el", "los", "las", "un", "una", "y", "en", "novel", "edition", "book"]);
  const tokensA = new Set(normalize(strA).split(/\s+/).filter((t) => t.length > 1 && !stopWords.has(t)));
  const tokensB = new Set(normalize(strB).split(/\s+/).filter((t) => t.length > 1 && !stopWords.has(t)));

  if (tokensA.size === 0 || tokensB.size === 0) return 0;
  let matches = 0;
  for (const t of tokensA) {
    if (tokensB.has(t)) matches += 1;
  }
  return matches / Math.min(tokensA.size, tokensB.size);
}

function authorsFor(book, catalog) {
  return (catalog.bookAuthors ?? [])
    .filter((item) => item.bookId === book.id)
    .sort((left, right) => left.ord - right.ord)
    .map((item) => catalog.authors.find((author) => author.id === item.authorId)?.fullName)
    .filter(Boolean);
}

function cleanCoverUrl(url) {
  if (!url || typeof url !== "string") return null;
  return url
    .replace(/^http:\/\//i, "https://")
    .replace(/&edge=curl/gi, "")
    .replace(/&zoom=[0-9]/gi, "&zoom=1");
}

async function fetchJsonWithRetry(url, maxRetries = 2) {
  for (let attempt = 0; attempt <= maxRetries; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: {
          "User-Agent": "LibreriaItineranteCatalogBot/1.0 (https://libreria-itineranteymas.web.app)",
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(12000),
      });
      if (response.status === 429) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      if (!response.ok) return null;
      return await response.json();
    } catch {
      if (attempt < maxRetries) await sleep(500 * (attempt + 1));
    }
  }
  return null;
}

async function queryGoogleBooks(fullTitle, author) {
  const coreTitle = extractCoreTitle(fullTitle);
  const coreAuthor = extractCoreAuthor(author);

  const queryCandidates = [
    `${coreTitle} ${coreAuthor}`.trim(),
    `intitle:"${coreTitle}"`.trim(),
    fullTitle.slice(0, 40).trim(),
  ];

  for (const q of queryCandidates) {
    if (!q) continue;
    const url = `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(q)}&maxResults=5&printType=books`;
    const data = await fetchJsonWithRetry(url);
    if (!Array.isArray(data?.items) || data.items.length === 0) continue;

    for (const item of data.items) {
      const vol = item.volumeInfo ?? {};
      const volTitle = vol.title ?? "";
      const volAuthors = (vol.authors ?? []).join(" ");

      const titleScore = tokenOverlapScore(coreTitle, volTitle);
      const authorScore = coreAuthor ? tokenOverlapScore(coreAuthor, volAuthors) : 0.5;

      // Si el título coincide bien y el autor tiene coincidencia o el título es muy específico
      if (titleScore >= 0.5 || (titleScore >= 0.35 && authorScore >= 0.4)) {
        let isbn13 = null;
        for (const id of vol.industryIdentifiers ?? []) {
          const raw = String(id.identifier ?? "").replace(/\D/g, "");
          if (id.type === "ISBN_13" && isValidIsbn13(raw)) {
            isbn13 = raw;
            break;
          }
        }

        const images = vol.imageLinks ?? {};
        const rawCover = images.extraLarge || images.large || images.medium || images.thumbnail || images.smallThumbnail
          || `https://books.google.com/books/content?id=${item.id}&printsec=frontcover&img=1&zoom=1`;
        const coverUrl = cleanCoverUrl(rawCover);

        return {
          source: "Google Books",
          isbn13,
          coverUrl,
          sourceUrl: vol.canonicalVolumeLink || vol.infoLink || `https://books.google.com/books?id=${item.id}`,
          pages: typeof vol.pageCount === "number" && vol.pageCount > 0 ? vol.pageCount : null,
          categories: Array.isArray(vol.categories) ? vol.categories : [],
          description: vol.description || null,
          averageRating: typeof vol.averageRating === "number" ? vol.averageRating : null,
          ratingsCount: typeof vol.ratingsCount === "number" ? vol.ratingsCount : null,
        };
      }
    }
  }
  return null;
}

async function queryOpenLibrary(fullTitle, author) {
  const coreTitle = extractCoreTitle(fullTitle);
  const coreAuthor = extractCoreAuthor(author);
  const q = `${coreTitle} ${coreAuthor}`.trim();

  const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(q)}&fields=key,title,author_name,cover_i,isbn&limit=5`;
  const data = await fetchJsonWithRetry(url);
  if (!Array.isArray(data?.docs) || data.docs.length === 0) return null;

  for (const doc of data.docs) {
    const docTitle = doc.title ?? "";
    const docAuthors = (doc.author_name ?? []).join(" ");

    const titleScore = tokenOverlapScore(coreTitle, docTitle);
    const authorScore = coreAuthor ? tokenOverlapScore(coreAuthor, docAuthors) : 0.5;

    if (titleScore >= 0.4 || (titleScore >= 0.3 && authorScore >= 0.4)) {
      let isbn13 = null;
      if (Array.isArray(doc.isbn)) {
        for (const candidate of doc.isbn) {
          const raw = String(candidate).replace(/\D/g, "");
          if (isValidIsbn13(raw)) {
            isbn13 = raw;
            break;
          }
        }
      }

      const coverUrl = doc.cover_i
        ? `https://covers.openlibrary.org/b/id/${doc.cover_i}-L.jpg?default=false`
        : (isbn13 ? `https://covers.openlibrary.org/b/isbn/${isbn13}-L.jpg?default=false` : null);

      return {
        source: "Open Library",
        isbn13,
        coverUrl,
        sourceUrl: doc.key ? `https://openlibrary.org${doc.key}` : null,
        pages: null,
        categories: [],
        description: null,
      };
    }
  }
  return null;
}

async function main() {
  console.log(`[enrich-google-books] Leyendo catálogo desde ${catalogPath}...`);
  const [catalog, quality] = await Promise.all([
    readFile(catalogPath, "utf8").then(JSON.parse),
    readFile(qualityPath, "utf8").then(JSON.parse).catch(() => ({})),
  ]);

  const manifest = [];
  let matchedCovers = 0;
  let matchedIsbns = 0;
  let index = 0;
  const total = catalog.books.length;
  const concurrency = 3; // Concurrencia controlada para no saturar APIs públicas

  async function worker() {
    while (index < total) {
      const currentIndex = index++;
      const book = catalog.books[currentIndex];
      const authors = authorsFor(book, catalog);
      const authorName = authors.join(" ") || "Desconocido";

      process.stdout.write(`\r[enrich] (${currentIndex + 1}/${total}) ${book.title.slice(0, 30)}...`);

      let meta = await queryGoogleBooks(book.title, authorName);
      await sleep(90); // Delay suave anti-rate-limit

      if (!meta || !meta.coverUrl || !meta.isbn13) {
        const fallback = await queryOpenLibrary(book.title, authorName);
        await sleep(90);
        if (fallback) {
          meta = {
            source: meta ? `${meta.source} + Open Library` : fallback.source,
            isbn13: meta?.isbn13 || fallback.isbn13,
            coverUrl: meta?.coverUrl || fallback.coverUrl,
            sourceUrl: meta?.sourceUrl || fallback.sourceUrl,
            pages: meta?.pages || null,
            categories: meta?.categories || [],
            description: meta?.description || null,
            averageRating: meta?.averageRating ?? null,
            ratingsCount: meta?.ratingsCount ?? null,
          };
        }
      }

      if (meta) {
        if (meta.isbn13 && isValidIsbn13(meta.isbn13)) {
          book.isbn13 = meta.isbn13;
          matchedIsbns += 1;
        }
        if (meta.coverUrl) {
          book.coverUrl = meta.coverUrl;
          book.coverAlt = `Portada oficial de ${book.title}`;
          matchedCovers += 1;
        }
        if (meta.sourceUrl) {
          book.sourceUrl = meta.sourceUrl;
        }
        if (meta.pages && !book.pages) {
          book.pages = meta.pages;
        }
        if (meta.categories && meta.categories.length) {
          book.tags = [...new Set([...(book.tags || []), ...meta.categories.slice(0, 3)])];
        }
        manifest.push({
          slug: book.slug,
          title: book.title,
          isbn13: book.isbn13,
          coverUrl: book.coverUrl,
          sourceUrl: book.sourceUrl,
          pages: meta.pages ?? null,
          averageRating: meta.averageRating ?? null,
          ratingsCount: meta.ratingsCount ?? null,
          provider: meta.source,
        });
      }
    }
  }

  console.log(`[enrich-google-books] Iniciando ${concurrency} trabajadores con búsqueda difusa y fallback cruzado...`);
  await Promise.all(Array.from({ length: concurrency }, worker));
  console.log("\n[enrich-google-books] Enriquecimiento finalizado.");

  manifest.sort((a, b) => a.slug.localeCompare(b.slug));

  quality.coverProvider = "Google Books / Open Library (Multi-Strategy)";
  quality.coverMatches = matchedCovers;
  quality.coverMissing = total - matchedCovers;
  quality.isbnMatches = matchedIsbns;
  quality.isbnMissing = total - matchedIsbns;
  quality.enrichedAt = new Date().toISOString();

  await Promise.all([
    writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
    writeFile(qualityPath, `${JSON.stringify(quality, null, 2)}\n`, "utf8"),
    writeFile(manifestPath, `${JSON.stringify({ provider: "Google Books / Open Library", count: manifest.length, books: manifest }, null, 2)}\n`, "utf8"),
  ]);

  console.log(`\n========================================`);
  console.log(`Resultados de rescate oficial:`);
  console.log(`- Total de libros procesados: ${total}`);
  console.log(`- Portadas oficiales rescatadas: ${matchedCovers}/${total} (${Math.round((matchedCovers / total) * 100)}%)`);
  console.log(`- ISBNs-13 oficiales rescatados: ${matchedIsbns}/${total} (${Math.round((matchedIsbns / total) * 100)}%)`);
  console.log(`- Archivos actualizados:`);
  console.log(`  * ${catalogPath}`);
  console.log(`  * ${qualityPath}`);
  console.log(`  * ${manifestPath}`);
  console.log(`========================================`);
}

main().catch((err) => {
  console.error("\nError en script de enriquecimiento:", err);
  process.exitCode = 1;
});
