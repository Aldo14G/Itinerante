import { ConnectorConfig, DataConnect, QueryRef, QueryPromise, ExecuteQueryOptions } from 'firebase/data-connect';

export const connectorConfig: ConnectorConfig;

export type TimestampString = string;
export type UUIDString = string;
export type Int64String = string;
export type DateString = string;




export interface Author_Key {
  id: string;
  __typename?: 'Author_Key';
}

export interface BookAuthor_Key {
  bookId: string;
  authorId: string;
  role: string;
  __typename?: 'BookAuthor_Key';
}

export interface BookDetailsPageData {
  books: ({
    id: string;
    slug: string;
    isbn13?: string | null;
    title: string;
    subtitle?: string | null;
    description: string;
    mood?: string | null;
    priceMxnCents?: number | null;
    stockQty: number;
    condition: string;
    coverUrl?: string | null;
    coverAlt?: string | null;
    curatorNote?: string | null;
    tags?: string[] | null;
    datasetKey: string;
    sourceKind: string;
    sourceLabel: string;
    sourceRecordId?: string | null;
    referencePriceUsdCents?: number | null;
    sourceRating?: number | null;
    sourceReviewCount?: number | null;
    sourceWeeksOnList?: number | null;
    sourceRank?: number | null;
    sourceBsr?: number | null;
    sourceUrl: string;
    verifiedAt: TimestampString;
    editorial?: {
      name: string;
    };
    subgenre: {
      slug: string;
      name: string;
      category: {
        slug: string;
        name: string;
      };
    };
    contributors: ({
      role: string;
      ord: number;
      author: {
        slug: string;
        fullName: string;
      };
    })[];
    language: string;
    pages?: number | null;
    publishedYear?: number | null;
    format?: string | null;
  } & Book_Key)[];
}

export interface BookDetailsPageVariables {
  slug: string;
}

export interface Book_Key {
  id: string;
  __typename?: 'Book_Key';
}

export interface BrowseCatalogData {
  books: ({
    id: string;
    slug: string;
    isbn13?: string | null;
    title: string;
    subtitle?: string | null;
    description: string;
    mood?: string | null;
    priceMxnCents?: number | null;
    stockQty: number;
    condition: string;
    coverUrl?: string | null;
    coverAlt?: string | null;
    curatorNote?: string | null;
    tags?: string[] | null;
    datasetKey: string;
    sourceKind: string;
    sourceLabel: string;
    sourceRecordId?: string | null;
    referencePriceUsdCents?: number | null;
    sourceRating?: number | null;
    sourceReviewCount?: number | null;
    sourceWeeksOnList?: number | null;
    sourceRank?: number | null;
    sourceBsr?: number | null;
    sourceUrl: string;
    verifiedAt: TimestampString;
    editorial?: {
      name: string;
    };
    subgenre: {
      slug: string;
      name: string;
      category: {
        slug: string;
        name: string;
      };
    };
    contributors: ({
      role: string;
      ord: number;
      author: {
        slug: string;
        fullName: string;
      };
    })[];
  } & Book_Key)[];
}

export interface BrowseCatalogVariables {
  mood?: string | null;
  categorySlug?: string | null;
  subgenreSlug?: string | null;
  format?: string | null;
  maxPriceMxnCents?: number | null;
  partialTitle?: string | null;
  limit?: number | null;
}

export interface Category_Key {
  id: string;
  __typename?: 'Category_Key';
}

export interface Editorial_Key {
  id: string;
  __typename?: 'Editorial_Key';
}

export interface SearchBooksVectorData {
  books: ({
    id: string;
    slug: string;
    isbn13?: string | null;
    title: string;
    subtitle?: string | null;
    description: string;
    mood?: string | null;
    priceMxnCents?: number | null;
    stockQty: number;
    condition: string;
    coverUrl?: string | null;
    coverAlt?: string | null;
    curatorNote?: string | null;
    tags?: string[] | null;
    datasetKey: string;
    sourceKind: string;
    sourceLabel: string;
    sourceRecordId?: string | null;
    referencePriceUsdCents?: number | null;
    sourceRating?: number | null;
    sourceReviewCount?: number | null;
    sourceWeeksOnList?: number | null;
    sourceRank?: number | null;
    sourceBsr?: number | null;
    sourceUrl: string;
    verifiedAt: TimestampString;
    editorial?: {
      name: string;
    };
    subgenre: {
      slug: string;
      name: string;
      category: {
        slug: string;
        name: string;
      };
    };
    contributors: ({
      role: string;
      ord: number;
      author: {
        slug: string;
        fullName: string;
      };
    })[];
  } & Book_Key)[];
}

export interface SearchBooksVectorVariables {
  query: string;
  limit?: number | null;
}

export interface Subgenre_Key {
  id: string;
  __typename?: 'Subgenre_Key';
}

interface BrowseCatalogRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars?: BrowseCatalogVariables): QueryRef<BrowseCatalogData, BrowseCatalogVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars?: BrowseCatalogVariables): QueryRef<BrowseCatalogData, BrowseCatalogVariables>;
  operationName: string;
}
export const browseCatalogRef: BrowseCatalogRef;

export function browseCatalog(vars?: BrowseCatalogVariables, options?: ExecuteQueryOptions): QueryPromise<BrowseCatalogData, BrowseCatalogVariables>;
export function browseCatalog(dc: DataConnect, vars?: BrowseCatalogVariables, options?: ExecuteQueryOptions): QueryPromise<BrowseCatalogData, BrowseCatalogVariables>;

interface BookDetailsPageRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: BookDetailsPageVariables): QueryRef<BookDetailsPageData, BookDetailsPageVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: BookDetailsPageVariables): QueryRef<BookDetailsPageData, BookDetailsPageVariables>;
  operationName: string;
}
export const bookDetailsPageRef: BookDetailsPageRef;

export function bookDetailsPage(vars: BookDetailsPageVariables, options?: ExecuteQueryOptions): QueryPromise<BookDetailsPageData, BookDetailsPageVariables>;
export function bookDetailsPage(dc: DataConnect, vars: BookDetailsPageVariables, options?: ExecuteQueryOptions): QueryPromise<BookDetailsPageData, BookDetailsPageVariables>;

interface SearchBooksVectorRef {
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchBooksVectorVariables): QueryRef<SearchBooksVectorData, SearchBooksVectorVariables>;
  /* Allow users to pass in custom DataConnect instances */
  (dc: DataConnect, vars: SearchBooksVectorVariables): QueryRef<SearchBooksVectorData, SearchBooksVectorVariables>;
  operationName: string;
}
export const searchBooksVectorRef: SearchBooksVectorRef;

export function searchBooksVector(vars: SearchBooksVectorVariables, options?: ExecuteQueryOptions): QueryPromise<SearchBooksVectorData, SearchBooksVectorVariables>;
export function searchBooksVector(dc: DataConnect, vars: SearchBooksVectorVariables, options?: ExecuteQueryOptions): QueryPromise<SearchBooksVectorData, SearchBooksVectorVariables>;

