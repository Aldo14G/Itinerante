// Núcleo puro del catálogo: sin Firebase ni Node. Lo comparten la API de Next y el Worker de Cloudflare.
import coversManifest from "../../data/books.amazon-test.covers.json";

const coverBySlug = new Map<string, string>(
  (coversManifest.books ?? []).filter((entry) => entry.slug && entry.coverUrl).map((entry) => [entry.slug, entry.coverUrl]),
);

export interface CatalogBookRecord {
  id: string;
  slug: string;
  title: string;
  description: string;
  mood?: string | null;
  format?: string | null;
  priceMxnCents?: number | null;
  stockQty?: number;
  condition?: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
  tags?: string[] | null;
  searchText?: string;
  datasetKey: string;
  sourceKind?: string;
  sourceLabel: string;
  sourceUrl: string;
  sourceRating?: number | null;
  sourceReviewCount?: number | null;
  sourceWeeksOnList?: number | null;
  referencePriceUsdCents?: number | null;
  sourceRank?: number | null;
  sourceBsr?: number | null;
  publishedYear?: number | null;
  verifiedAt: string;
  editorial?: { name: string } | null;
  subgenre: {
    slug: string;
    name: string;
    category: { slug: string; name: string };
  };
  contributors?: Array<{ author?: { fullName: string } | null }>;
}

export interface CatalogFilters {
  categorySlug?: string;
  subgenreSlug?: string;
  format?: string;
  maxPriceMxnCents?: number;
}

export function filterCatalogBooks(books: CatalogBookRecord[], filters: CatalogFilters = {}) {
  return books.filter((book) =>
    (!filters.categorySlug || book.subgenre.category.slug === filters.categorySlug)
    && (!filters.subgenreSlug || book.subgenre.slug === filters.subgenreSlug)
    && (!filters.format || book.format === filters.format)
    && (filters.maxPriceMxnCents === undefined
      || (book.priceMxnCents !== null && book.priceMxnCents !== undefined
        && book.priceMxnCents <= filters.maxPriceMxnCents)));
}

function counts<T>(items: T[], key: (item: T) => string, label: (item: T) => string) {
  const values = new Map<string, { value: string; label: string; count: number }>();
  for (const item of items) {
    const value = key(item);
    const current = values.get(value);
    values.set(value, { value, label: label(item), count: (current?.count ?? 0) + 1 });
  }
  return [...values.values()].sort((a, b) => a.label.localeCompare(b.label, "es"));
}

export function catalogFacets(books: CatalogBookRecord[]) {
  return {
    categories: counts(books, (book) => book.subgenre.category.slug, (book) => book.subgenre.category.name),
    subgenres: counts(books, (book) => book.subgenre.slug, (book) => book.subgenre.name),
    formats: counts(books.filter((book) => book.format), (book) => book.format!, (book) => book.format!),
  };
}

export function toBookView(book: CatalogBookRecord, isTestData: boolean) {
  const { searchText: _searchText, ...publicBook } = book;
  return {
    ...publicBook,
    coverUrl: publicBook.coverUrl || coverBySlug.get(publicBook.slug) || null,
    coverAlt: publicBook.coverAlt || `Portada de ${publicBook.title}`,
    category: book.subgenre.category,
    genre: book.subgenre.category.name,
    subgenreName: book.subgenre.name,
    author: book.contributors?.map((item) => item.author?.fullName).filter(Boolean).join(", ") || "Autor no disponible",
    isTestData,
  };
}
