// GET /api/catalog en el Worker. Mismo contrato que la ruta de Next (src/app/api/catalog/route.ts).
// Sin inventario real todavía: sirve únicamente el dataset de prueba y lo declara (mode: "test").
import { catalogFacets, filterCatalogBooks, toBookView, type CatalogBookRecord } from "../src/lib/catalog-core";
import { loadLocalTestBooks } from "../src/lib/local-dataset";
import { rankTestBooks } from "../src/lib/local-test-search.js";
import { parseCatalogFilters, vocabularyPayload } from "../src/config/taxonomy.js";
import { TEST_CATALOG_DATASET } from "../src/config/catalog-mode.js";

export function testBooks(): CatalogBookRecord[] {
  return loadLocalTestBooks(TEST_CATALOG_DATASET);
}

export function handleCatalog(request: Request): Response {
  const headers = { "Cache-Control": "no-store" };
  const searchParams = new URL(request.url).searchParams;
  const requested = Number(searchParams.get("limit") ?? 24);
  const limit = Number.isInteger(requested) ? Math.min(60, Math.max(1, requested)) : 24;
  const query = searchParams.get("q")?.trim().slice(0, 120) ?? "";
  const maxPriceParam = searchParams.get("maxPriceMxnCents");
  const maxPrice = maxPriceParam === null ? Number.NaN : Number(maxPriceParam);

  const parsed: {
    filters?: { categorySlug?: string; subgenreSlug?: string };
    error?: { code: string; message: string };
  } = parseCatalogFilters(searchParams);
  if (parsed.error) {
    return Response.json({ error: { message: parsed.error.message, code: parsed.error.code }, vocabulary: vocabularyPayload() }, { status: 400, headers });
  }
  const valid = parsed.filters ?? {};
  const filters = {
    categorySlug: valid.categorySlug,
    subgenreSlug: valid.subgenreSlug,
    format: searchParams.get("format")?.trim() || undefined,
    maxPriceMxnCents: Number.isInteger(maxPrice) && maxPrice >= 0 ? maxPrice : undefined,
  };

  const all = testBooks();
  if (!all.length) {
    return Response.json({ error: { message: "El catálogo no está disponible en este momento." } }, { status: 503, headers });
  }
  const scoped = filterCatalogBooks(all, filters);
  const books = query ? (rankTestBooks(query, scoped, []) as CatalogBookRecord[]) : scoped;
  return Response.json({
    mode: "test",
    datasetKey: TEST_CATALOG_DATASET,
    total: books.length,
    facets: catalogFacets(books),
    vocabulary: vocabularyPayload(),
    books: books.slice(0, limit).map((book) => toBookView(book, true)),
  }, { headers });
}
