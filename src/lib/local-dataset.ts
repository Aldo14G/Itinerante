import type { CatalogBookRecord } from "@/lib/test-catalog";
// Import estatico (no fs): Vercel solo empaqueta lo trazado por el bundle.
// data/ existe en el repo y viaja con el deploy.
import coversDoc from "../../data/books.amazon-test.covers.json";
import datasetDoc from "../../data/books.amazon-test.json";

interface RawBook {
  id: string;
  slug: string;
  title: string;
  description?: string | null;
  mood?: string | null;
  format?: string | null;
  priceMxnCents?: number | null;
  stockQty?: number;
  condition?: string;
  coverUrl?: string | null;
  coverAlt?: string | null;
  tags?: string[] | null;
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
  editorialId?: string | null;
  subgenreId?: string | null;
}

interface RawDataset {
  datasetKey: string;
  source?: { label?: string; verifiedAt?: string };
  categories: Array<{ id: string; slug: string; name: string }>;
  subgenres: Array<{ id: string; slug: string; name: string; categoryId: string }>;
  editorials: Array<{ id: string; name: string }>;
  authors: Array<{ id: string; fullName: string }>;
  bookAuthors: Array<{ bookId: string; authorId: string; ord?: number }>;
  books: RawBook[];
}

let cache: { datasetKey: string; books: CatalogBookRecord[] } | null = null;

function readJson<T>(value: unknown): T {
  return value as T;
}

/**
 * Dataset local de prueba para entornos sin Data Connect (p. ej. Vercel).
 * Misma forma que CatalogBookRecord; nunca es inventario.
 */
export function loadLocalTestBooks(datasetKey: string): CatalogBookRecord[] {
  if (cache && cache.datasetKey === datasetKey) return cache.books;
  const dataset = readJson<RawDataset>(datasetDoc);
  if (dataset.datasetKey !== datasetKey) return [];
  const covers = new Map<string, string>();
  for (const entry of readJson<{ books?: Array<{ slug: string; coverUrl: string }> }>(coversDoc).books ?? []) {
    if (entry.slug && entry.coverUrl) covers.set(entry.slug, entry.coverUrl);
  }
  const categoryById = new Map(dataset.categories.map((item) => [item.id, item]));
  const subgenreById = new Map(dataset.subgenres.map((item) => [item.id, item]));
  const editorialById = new Map(dataset.editorials.map((item) => [item.id, item]));
  const authorById = new Map(dataset.authors.map((item) => [item.id, item]));
  const authorsByBook = new Map<string, string[]>();
  for (const link of dataset.bookAuthors) {
    const name = link.authorId ? authorById.get(link.authorId)?.fullName : undefined;
    if (!link.bookId || !name) continue;
    const list = authorsByBook.get(link.bookId) ?? [];
    list.push(name);
    authorsByBook.set(link.bookId, list);
  }
  const books: CatalogBookRecord[] = [];
  for (const book of dataset.books) {
    const subgenre = book.subgenreId ? subgenreById.get(book.subgenreId) : undefined;
    if (!subgenre) continue;
    const category = categoryById.get(subgenre.categoryId) ?? { slug: "fiction", name: "Fiction" };
    const authorNames = authorsByBook.get(book.id) ?? [];
    books.push({
      id: book.id,
      slug: book.slug,
      title: book.title,
      description: book.description ?? "",
      mood: book.mood,
      format: book.format,
      priceMxnCents: book.priceMxnCents,
      stockQty: book.stockQty,
      condition: "nuevo",
      coverUrl: book.coverUrl || covers.get(book.slug) || null,
      coverAlt: book.coverAlt,
      tags: book.tags,
      datasetKey: book.datasetKey,
      sourceKind: book.sourceKind,
      sourceLabel: book.sourceLabel,
      sourceUrl: book.sourceUrl,
      sourceRating: book.sourceRating,
      sourceReviewCount: book.sourceReviewCount,
      sourceWeeksOnList: book.sourceWeeksOnList,
      referencePriceUsdCents: book.referencePriceUsdCents,
      sourceRank: book.sourceRank,
      sourceBsr: book.sourceBsr,
      publishedYear: typeof book.publishedYear === "number" ? book.publishedYear : null,
      verifiedAt: book.verifiedAt,
      editorial: book.editorialId ? { name: editorialById.get(book.editorialId)?.name ?? "" } : null,
      subgenre: {
        slug: subgenre.slug,
        name: subgenre.name,
        category: { slug: category.slug, name: category.name },
      },
      contributors: authorNames.map((fullName) => ({ author: { fullName } })),
    });
  }
  books.sort((left, right) => (left.sourceRank ?? 9999) - (right.sourceRank ?? 9999));
  cache = { datasetKey, books };
  return books;
}
