import { NextResponse } from "next/server";
import { catalogDataset } from "@/config/catalog-mode";
import { parseCatalogFilters, vocabularyPayload } from "@/config/taxonomy";
import {
  cachedList,
  catalogFacets,
  filterCatalogBooks,
  listInventoryBooks,
  recommendTestBooks,
  searchInventoryBooks,
  toBookView,
} from "@/lib/test-catalog";

export async function GET(request: Request) {
  const datasetKey = catalogDataset();
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
    return NextResponse.json(
      { error: { message: parsed.error.message, code: parsed.error.code }, vocabulary: vocabularyPayload() },
      { status: 400 },
    );
  }
  const valid = parsed.filters ?? {};
  const filters = {
    categorySlug: valid.categorySlug,
    subgenreSlug: valid.subgenreSlug,
    format: searchParams.get("format")?.trim() || undefined,
    maxPriceMxnCents: Number.isInteger(maxPrice) && maxPrice >= 0 ? maxPrice : undefined,
  };

  try {
    const isTestData = datasetKey !== "inventory";
    const candidates = query
      ? (isTestData ? await recommendTestBooks(query, datasetKey, 500, filters) : await searchInventoryBooks(query, 500))
      : (isTestData ? await cachedList(datasetKey) : await listInventoryBooks());
    const books = filterCatalogBooks(candidates, filters);
    return NextResponse.json({
      mode: isTestData ? "test" : "inventory",
      datasetKey,
      total: books.length,
      facets: catalogFacets(books),
      vocabulary: vocabularyPayload(),
      books: books.slice(0, limit).map((book) => toBookView(book, isTestData)),
    });
  } catch (error) {
    console.error("[catalog] Data Connect no disponible", error);
    return NextResponse.json(
      { error: { message: "El catálogo no está disponible en este momento." } },
      { status: 503 }
    );
  }
}
