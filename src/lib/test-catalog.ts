import { getDataConnect } from "firebase-admin/data-connect";
import { adminApp } from "@/lib/firebase-admin";
import { localTestEmbedding } from "@/lib/local-test-embedding";
import { rankTestBooks } from "@/lib/local-test-search";
import { loadLocalTestBooks } from "@/lib/local-dataset";

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

export class CatalogUnavailableError extends Error {
  constructor(cause: unknown) {
    super("Firebase Data Connect no esta disponible.", { cause });
    this.name = "CatalogUnavailableError";
  }
}

const dataConnect = getDataConnect({
  location: process.env.DATA_CONNECT_LOCATION ?? "us-central1",
  serviceId: process.env.DATA_CONNECT_SERVICE_ID ?? "itinerante-service",
  connector: "connector",
}, adminApp);

const fields = `
  id slug title description mood format priceMxnCents stockQty condition coverUrl coverAlt tags searchText datasetKey
  sourceKind sourceLabel sourceUrl sourceRating sourceReviewCount sourceWeeksOnList
  referencePriceUsdCents sourceRank sourceBsr verifiedAt
  editorial { name }
  subgenre {
    slug name
    category { slug name }
  }
  contributors: bookAuthors_on_book(orderBy: [{ ord: ASC }]) {
    author { fullName }
  }
`;

async function readBooks<Variables, Row = CatalogBookRecord>(query: string, variables: Variables): Promise<Row[]> {
  try {
    const response = await dataConnect.executeGraphqlRead<{ books: Row[] }, Variables>(query, { variables });
    return response?.data?.books ?? [];
  } catch (error) {
    throw new CatalogUnavailableError(error);
  }
}

const listCache = new Map<string, { at: number; books: CatalogBookRecord[] }>();
const LIST_CACHE_TTL_MS = 5 * 60 * 1000;

export async function cachedList(datasetKey: string): Promise<CatalogBookRecord[]> {
  const hit = listCache.get(datasetKey);
  if (hit && Date.now() - hit.at < LIST_CACHE_TTL_MS) return hit.books;
  try {
    const books = await listTestBooks(datasetKey);
    listCache.set(datasetKey, { at: Date.now(), books });
    return books;
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) throw error;
    const local = loadLocalTestBooks(datasetKey);
    if (!local.length) throw error;
    listCache.set(datasetKey, { at: Date.now(), books: local });
    return local;
  }
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

export function listTestBooks(datasetKey: string, limit = 500) {
  return readBooks(`
    query ListLocalTestBooks($datasetKey: String!, $limit: Int) {
      books(where: { status: { eq: "test" }, datasetKey: { eq: $datasetKey } }, orderBy: [{ sourceRank: ASC }], limit: $limit) {
        ${fields}
      }
    }
  `, { datasetKey, limit });
}

export function listInventoryBooks(limit = 500) {
  return readBooks(`
    query ListInventoryBooks($limit: Int) {
      books(where: { status: { eq: "active" }, stockQty: { gt: 0 }, datasetKey: { eq: "inventory" } }, orderBy: [{ title: ASC }], limit: $limit) {
        ${fields}
      }
    }
  `, { limit });
}

export function searchInventoryBooks(query: string, limit = 24, filters: CatalogFilters = {}) {
  const subgenreConditions: string[] = [];
  if (filters.subgenreSlug) subgenreConditions.push("slug: { eq: $subgenreSlug }");
  if (filters.categorySlug) subgenreConditions.push("category: { slug: { eq: $categorySlug } }");
  const scope = subgenreConditions.length ? `subgenre: { ${subgenreConditions.join(" ")} }` : "";
  return readBooks(`
    query SearchInventoryBooks($query: String!, $limit: Int, $categorySlug: String, $subgenreSlug: String) {
      books: books_embedding_similarity(
        compare_embed: { model: "text-embedding-005", text: $query }
        where: {
          status: { eq: "active" }
          stockQty: { gt: 0 }
          datasetKey: { eq: "inventory" }
          ${scope}
        }
        limit: $limit
      ) { ${fields} }
    }
  `, { query, limit, categorySlug: filters.categorySlug, subgenreSlug: filters.subgenreSlug });
}

export async function searchInventoryBooksByVector(query: string, limit = 24, filters: CatalogFilters = {}) {
  const { embedGemini } = await import("@/lib/gemini-embedding");
  const books = await readBooks(`
    query SearchInventoryBooksByVector($compare: Vector!, $limit: Int) {
      books: books_embedding_similarity(
        compare: $compare method: COSINE
        where: { status: { eq: "active" }, stockQty: { gt: 0 }, datasetKey: { eq: "inventory" } }
        limit: $limit
      ) { ${fields} }
    }
  `, { compare: await embedGemini(query), limit });
  return filterCatalogBooks(books, filters);
}

export async function searchTestBookSlugsRaw(query: string, datasetKey: string, limit = 40): Promise<string[]> {
  try {
    const rows = await readBooks<{ compare: number[]; datasetKey: string; limit: number }, { slug: string }>(`
    query LocalSearchTestSlugs($compare: Vector!, $datasetKey: String!, $limit: Int) {
      books: books_embedding_similarity(
        compare: $compare method: COSINE
        where: { status: { eq: "test" }, datasetKey: { eq: $datasetKey } }
        limit: $limit
      ) { slug }
    }
  `, { compare: localTestEmbedding(query), datasetKey, limit });
    return rows.map((row) => row.slug).filter(Boolean);
  } catch (error) {
    if (!(error instanceof CatalogUnavailableError)) throw error;
    return rankTestBooks(query, loadLocalTestBooks(datasetKey), []).slice(0, limit).map((book) => book.slug);
  }
}

export function searchTestBooksRaw(query: string, datasetKey: string, limit = 40) {
  return readBooks(`
    query LocalSearchTestBooks($compare: Vector!, $datasetKey: String!, $limit: Int) {
      books: books_embedding_similarity(
        compare: $compare method: COSINE
        where: { status: { eq: "test" }, datasetKey: { eq: $datasetKey } }
        limit: $limit
      ) { ${fields} }
    }
  `, { compare: localTestEmbedding(query), datasetKey, limit });
}

export function getTestBookBySlugRaw(slug: string, datasetKey: string) {
  return readBooks(`
    query LocalGetTestBookBySlug($slug: String!, $datasetKey: String!) {
      books(where: { slug: { eq: $slug }, status: { eq: "test" }, datasetKey: { eq: $datasetKey } }, limit: 1) {
        ${fields}
      }
    }
  `, { slug, datasetKey });
}

export async function filterTestBooksRaw(variables: {
  datasetKey: string;
  categorySlugs?: string[];
  subgenreSlugs?: string[];
  formats?: string[];
  minSourceRating?: number;
  maxReferencePriceUsdCents?: number;
  limit?: number;
}) {
  const books = await cachedList(variables.datasetKey);
  return books.filter((book) =>
    (!variables.categorySlugs?.length || variables.categorySlugs.includes(book.subgenre.category.slug))
    && (!variables.subgenreSlugs?.length || variables.subgenreSlugs.includes(book.subgenre.slug))
    && (!variables.formats?.length || (book.format && variables.formats.includes(book.format)))
    && (variables.minSourceRating === undefined || (book.sourceRating ?? -1) >= variables.minSourceRating)
    && (variables.maxReferencePriceUsdCents === undefined
      || (book.referencePriceUsdCents ?? Number.MAX_SAFE_INTEGER) <= variables.maxReferencePriceUsdCents)
  ).slice(0, variables.limit ?? 15);
}

export async function recommendTestBooks(
  query: string,
  datasetKey: string,
  limit = 3,
  filters: CatalogFilters = {},
) {
  const [allBooks, vectorSlugs] = await Promise.all([
    cachedList(datasetKey).then((books) => filterCatalogBooks(books, filters)),
    searchTestBookSlugsRaw(query, datasetKey, Math.max(limit, 40)),
  ]);
  return rankTestBooks(query, allBooks, vectorSlugs).slice(0, limit) as CatalogBookRecord[];
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
    category: book.subgenre.category,
    genre: book.subgenre.category.name,
    subgenreName: book.subgenre.name,
    author: book.contributors?.map((item) => item.author?.fullName).filter(Boolean).join(", ") || "Autor no disponible",
    isTestData,
  };
}
