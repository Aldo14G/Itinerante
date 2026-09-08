// Cubiertas editoriales SVG locales para libros sin portada real.
// Diseno de marca uniforme; mismas proporciones 2:3 que las portadas.
// Uso: node scripts/generate-cover-placeholders.mjs
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const catalogPath = "data/books.amazon-test.json";
const manifestPath = "data/books.amazon-test.covers.json";
const outDir = join("images", "covers");

const escapeXml = (value) => String(value ?? "")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

function wrapTitle(title, maxChars = 18, maxLines = 4) {
  const words = String(title).split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
    if (lines.length === maxLines - 1 && current.length > maxChars * 1.4) break;
  }
  if (current) lines.push(current);
  return lines.slice(0, maxLines);
}

function coverSvg({ title, author, genre }) {
  const lines = wrapTitle(title);
  const startY = 250 - (lines.length - 1) * 26;
  const titleLines = lines.map((line, i) =>
    `<text x="200" y="${startY + i * 52}" text-anchor="middle" font-family="Georgia, 'Times New Roman', serif" font-size="34" font-weight="bold" fill="#f5f1e8">${escapeXml(line)}</text>`,
  ).join("");
  return `<svg xmlns="http://www.w3.org/2000/svg" width="400" height="600" viewBox="0 0 400 600" role="img">
<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#0d4a45"/><stop offset="1" stop-color="#061a18"/></linearGradient></defs>
<rect width="400" height="600" fill="url(#g)"/>
<rect x="24" y="24" width="352" height="552" fill="none" stroke="#9de3da" stroke-opacity=".35" stroke-width="2"/>
<circle cx="200" cy="130" r="7" fill="#e8a020"/>
<text x="200" y="170" text-anchor="middle" font-family="Georgia, serif" font-size="19" letter-spacing="3" fill="#9de3da">${escapeXml((genre || "SELECCIÓN EDITORIAL").toUpperCase().slice(0, 30))}</text>
${titleLines}
<text x="200" y="470" text-anchor="middle" font-family="Georgia, serif" font-size="22" font-style="italic" fill="#f5f1e8">${escapeXml((author || "Librería Itinerante").slice(0, 40))}</text>
<text x="200" y="540" text-anchor="middle" font-family="Verdana, sans-serif" font-size="13" letter-spacing="2" fill="#e8a020">LIBRERÍA ITINERANTE</text>
</svg>
`;
}

const catalog = JSON.parse(await readFile(catalogPath, "utf8"));
const manifestDoc = JSON.parse(await readFile(manifestPath, "utf8"));
const have = new Set(manifestDoc.books.map((entry) => entry.slug));
await mkdir(outDir, { recursive: true });

const authorById = new Map(catalog.authors.map((a) => [a.id, a.fullName]));
const firstAuthor = (book) => {
  const link = catalog.bookAuthors.filter((l) => l.bookId === book.id).sort((a, b) => a.ord - b.ord)[0];
  return link ? authorById.get(link.authorId) : undefined;
};

let generated = 0;
for (const book of catalog.books) {
  if (have.has(book.slug)) continue;
  const author = firstAuthor(book);
  const file = `${book.slug}.svg`;
  await writeFile(join(outDir, file), coverSvg({ title: book.title, author, genre: book.sourceSubGenre }), "utf8");
  const coverUrl = `/images/covers/${file}`;
  book.coverUrl = coverUrl;
  book.coverAlt = `Portada de ${book.title}`;
  manifestDoc.books.push({ slug: book.slug, coverUrl, sourceUrl: "" });
  have.add(book.slug);
  generated += 1;
}
manifestDoc.books.sort((left, right) => left.slug.localeCompare(right.slug));
manifestDoc.count = manifestDoc.books.length;
await Promise.all([
  writeFile(catalogPath, `${JSON.stringify(catalog, null, 2)}\n`, "utf8"),
  writeFile(manifestPath, `${JSON.stringify(manifestDoc, null, 2)}\n`, "utf8"),
]);
console.log(JSON.stringify({ generated, total: manifestDoc.books.length }));
