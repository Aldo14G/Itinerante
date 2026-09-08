import { createHash } from "node:crypto";
import { readFile, stat, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { pathToFileURL } from "node:url";
import { isValidIsbn13, validateCatalog } from "./import-books.mjs";

const EXPECTED_HEADERS = [
  "Rank", "Title", "Author", "Category", "Sub-Genre", "Format",
  "Price (USD)", "Rating", "Reviews", "Weeks on List", "Publisher",
  "Year Published", "ISBN", "Amazon BSR", "Amazon URL",
];
const DATASET_KEY = "amazon-bestsellers-500";

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

export function parseCsv(text) {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < input.length; index += 1) {
    const char = input[index];
    if (quoted) {
      if (char === '"' && input[index + 1] === '"') {
        field += '"';
        index += 1;
      } else if (char === '"') {
        quoted = false;
      } else {
        field += char;
      }
    } else if (char === '"') {
      quoted = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field.replace(/\r$/, ""));
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }
  assert(!quoted, "CSV invalido: comillas sin cerrar");
  if (field !== "" || row.length > 0) {
    row.push(field.replace(/\r$/, ""));
    rows.push(row);
  }
  return rows.filter((values) => values.some((value) => value !== ""));
}

function slug(value) {
  const normalized = value.normalize("NFKD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return normalized || "registro";
}

function stableId(prefix, value) {
  const readable = slug(value).slice(0, 52).replace(/-+$/, "");
  return `${prefix}-${readable}-${createHash("sha256").update(value).digest("hex").slice(0, 8)}`;
}

function integer(value, field, { min = 0, max = Number.MAX_SAFE_INTEGER } = {}) {
  const number = Number(value);
  assert(Number.isFinite(number) && Number.isInteger(number), `${field} debe ser entero: ${value}`);
  assert(number >= min && number <= max, `${field} fuera de rango: ${value}`);
  return number;
}

function decimal(value, field, { min = 0, max = Number.MAX_VALUE } = {}) {
  const number = Number(value);
  assert(Number.isFinite(number), `${field} debe ser numerico: ${value}`);
  assert(number >= min && number <= max, `${field} fuera de rango: ${value}`);
  return number;
}

function formatName(value) {
  return ({
    Paperback: "Tapa blanda",
    Hardcover: "Tapa dura",
    "Kindle Edition": "Libro electronico",
    Audiobook: "Audiolibro",
  })[value] ?? value;
}

export function transformAmazonCsv(text, { sourceLabel, verifiedAt }) {
  const [headers, ...values] = parseCsv(text);
  assert(headers, "El CSV esta vacio");
  assert(JSON.stringify(headers) === JSON.stringify(EXPECTED_HEADERS),
    `Columnas inesperadas: ${headers.join(" | ")}`);
  assert(values.length > 0 && values.length <= 500, "El CSV debe contener entre 1 y 500 libros");

  const records = values.map((row, index) => {
    assert(row.length === headers.length, `Fila ${index + 2} tiene ${row.length} columnas; se esperaban ${headers.length}`);
    const record = Object.fromEntries(headers.map((header, column) => [header, row[column].trim()]));
    for (const header of headers) assert(record[header] !== "", `Fila ${index + 2}: ${header} esta vacio`);
    return record;
  });

  const editorialsById = new Map();
  const authorsById = new Map();
  const categoriesById = new Map();
  const subgenresById = new Map();
  const books = [];
  const bookAuthors = [];
  let validIsbn13 = 0;
  let usableSourceUrls = 0;

  for (const record of records) {
    const rank = integer(record.Rank, "Rank", { min: 1 });
    const year = integer(record["Year Published"], "Year Published", { min: 1000, max: 2100 });
    const reportedIsbn = record.ISBN.replace(/\D/g, "");
    const isbn13 = isValidIsbn13(reportedIsbn) ? reportedIsbn : null;
    if (isbn13) validIsbn13 += 1;
    if (/^https:\/\//i.test(record["Amazon URL"])) usableSourceUrls += 1;

    const categoryId = slug(record.Category);
    if (!categoriesById.has(categoryId)) {
      categoriesById.set(categoryId, {
        id: categoryId,
        slug: categoryId,
        name: record.Category,
        sourceLabel,
      });
    }
    const subGenre = record["Sub-Genre"];
    const subgenreId = `${categoryId}-${slug(subGenre)}`;
    if (!subgenresById.has(subgenreId)) {
      subgenresById.set(subgenreId, {
        id: subgenreId,
        slug: subgenreId,
        name: subGenre,
        categoryId,
        sourceLabel,
      });
    }

    const editorialId = stableId("editorial", record.Publisher);
    if (!editorialsById.has(editorialId)) {
      editorialsById.set(editorialId, {
        id: editorialId,
        slug: editorialId,
        name: record.Publisher,
        countryCode: null,
        website: null,
      });
    }

    // El CSV no define colaboradores por separado; conservar el campo completo
    // evita inventar una resolucion de entidades que la fuente no respalda.
    const authorId = stableId("autor", record.Author);
    if (!authorsById.has(authorId)) {
      authorsById.set(authorId, {
        id: authorId,
        slug: authorId,
        fullName: record.Author,
        bio: null,
        imageUrl: null,
      });
    }

    const identity = `${record.Title}\u0000${record.Author}\u0000${record.Publisher}\u0000${reportedIsbn}`;
    const bookId = stableId("libro", identity);
    const sourceQuery = reportedIsbn || `${record.Title} ${record.Author}`;
    books.push({
      id: bookId,
      slug: bookId,
      isbn13,
      editorialId,
      subgenreId,
      title: record.Title,
      subtitle: null,
      description: `Registro de prueba: ${record.Title}, de ${record.Author}, clasificado como ${record.Category} / ${subGenre}, publicado en ${year} por ${record.Publisher}.`,
      language: "und",
      pages: null,
      publishedYear: year,
      format: formatName(record.Format),
      priceMxnCents: null,
      stockQty: 0,
      status: "test",
      condition: "unknown",
      coverUrl: null,
      coverAlt: null,
      curatorNote: null,
      sourceCategory: record.Category,
      sourceSubGenre: subGenre,
      mood: null,
      tags: [subGenre, record.Format, "dataset-de-prueba"],
      datasetKey: DATASET_KEY,
      sourceKind: "test_csv",
      sourceLabel,
      sourceRecordId: `rank:${rank};reported-isbn:${reportedIsbn}`,
      referencePriceUsdCents: Math.round(decimal(record["Price (USD)"], "Price (USD)") * 100),
      sourceRating: decimal(record.Rating, "Rating", { max: 5 }),
      sourceReviewCount: integer(record.Reviews, "Reviews"),
      sourceWeeksOnList: integer(record["Weeks on List"], "Weeks on List"),
      sourceRank: rank,
      sourceBsr: integer(record["Amazon BSR"], "Amazon BSR"),
      sourceUrl: `https://www.amazon.com/s?k=${encodeURIComponent(sourceQuery)}`,
      verifiedAt,
    });
    bookAuthors.push({ bookId, authorId, role: "author", ord: 0 });
  }

  const catalog = validateCatalog({
    schemaVersion: 2,
    catalogKind: "test",
    datasetKey: DATASET_KEY,
    source: {
      label: sourceLabel,
      verifiedAt,
      note: "Dataset de prueba; no representa inventario, precio MXN ni disponibilidad de Libreria Itinerante.",
    },
    categories: [...categoriesById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    subgenres: [...subgenresById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    editorials: [...editorialsById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    authors: [...authorsById.values()].sort((a, b) => a.id.localeCompare(b.id)),
    books: books.sort((a, b) => a.sourceRank - b.sourceRank),
    bookAuthors,
  });

  return {
    catalog,
    quality: {
      datasetKey: DATASET_KEY,
      rows: records.length,
      columns: headers.length,
      missingRequiredValues: 0,
      uniqueBooks: new Set(books.map(({ id }) => id)).size,
      uniqueCategories: categoriesById.size,
      uniqueSubgenres: subgenresById.size,
      uniqueAuthors: authorsById.size,
      uniqueEditorials: editorialsById.size,
      validIsbn13,
      invalidIsbn13: records.length - validIsbn13,
      usableSourceUrls,
      derivedSourceUrls: records.length - usableSourceUrls,
      risks: [
        "Los precios son referencias USD de la fuente y no precios de Libreria Itinerante.",
        "status=test y stockQty=0 impiden confundir el dataset con inventario.",
        "Las URLs de Amazon se derivan como busquedas porque la columna Amazon URL no contiene enlaces utilizables.",
        "Los ISBN invalidos se conservan solo en sourceRecordId y no en el campo isbn13 validado.",
      ],
    },
  };
}

async function main() {
  const args = process.argv.slice(2);
  const checkOnly = args.includes("--check");
  const paths = args.filter((arg) => !arg.startsWith("--"));
  const inputPath = resolve(paths[0] ?? "data/amazon-bestselling-500.raw.csv");
  const outputPath = resolve(paths[1] ?? "data/books.amazon-test.json");
  const qualityPath = resolve(paths[2] ?? "data/books.amazon-test.quality.json");
  const [source, sourceStat] = await Promise.all([readFile(inputPath, "utf8"), stat(inputPath)]);
  const sourceLabel = inputPath.split(/[\\/]/).pop();
  const verifiedAt = sourceStat.mtime.toISOString();
  const result = transformAmazonCsv(source, { sourceLabel, verifiedAt });
  result.catalog.source.sha256 = createHash("sha256").update(source).digest("hex");

  if (!checkOnly) {
    await Promise.all([
      writeFile(outputPath, `${JSON.stringify(result.catalog, null, 2)}\n`, "utf8"),
      writeFile(qualityPath, `${JSON.stringify(result.quality, null, 2)}\n`, "utf8"),
    ]);
  }
  console.log(JSON.stringify(result.quality, null, 2));
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  main().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  });
}
