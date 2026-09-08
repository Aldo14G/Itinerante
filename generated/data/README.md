# Generated TypeScript README
This README will guide you through the process of using the generated JavaScript SDK package for the connector `connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `React README`, you can find it at [`data/react/README.md`](./react/README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

# Table of Contents
- [**Overview**](#generated-javascript-readme)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*BrowseCatalog*](#browsecatalog)
  - [*BookDetailsPage*](#bookdetailspage)
  - [*SearchBooksVector*](#searchbooksvector)
- [**Mutations**](#mutations)

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `connector`. You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

You can use this generated SDK by importing from the package `@itinerante/data` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#set-client).

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@itinerante/data';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#instrument-clients).

```typescript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@itinerante/data';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) from your generated SDK.

# Queries

There are two ways to execute a Data Connect Query using the generated Web SDK:
- Using a Query Reference function, which returns a `QueryRef`
  - The `QueryRef` can be used as an argument to `executeQuery()`, which will execute the Query and return a `QueryPromise`
- Using an action shortcut function, which returns a `QueryPromise`
  - Calling the action shortcut function will execute the Query and return a `QueryPromise`

The following is true for both the action shortcut function and the `QueryRef` function:
- The `QueryPromise` returned will resolve to the result of the Query once it has finished executing
- If the Query accepts arguments, both the action shortcut function and the `QueryRef` function accept a single argument: an object that contains all the required variables (and the optional variables) for the Query
- Both functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.

Below are examples of how to use the `connector` connector's generated functions to execute each query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-queries).

## BrowseCatalog
You can execute the `BrowseCatalog` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [data/index.d.ts](./index.d.ts):
```typescript
browseCatalog(vars?: BrowseCatalogVariables, options?: ExecuteQueryOptions): QueryPromise<BrowseCatalogData, BrowseCatalogVariables>;

interface BrowseCatalogRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars?: BrowseCatalogVariables): QueryRef<BrowseCatalogData, BrowseCatalogVariables>;
}
export const browseCatalogRef: BrowseCatalogRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
browseCatalog(dc: DataConnect, vars?: BrowseCatalogVariables, options?: ExecuteQueryOptions): QueryPromise<BrowseCatalogData, BrowseCatalogVariables>;

interface BrowseCatalogRef {
  ...
  (dc: DataConnect, vars?: BrowseCatalogVariables): QueryRef<BrowseCatalogData, BrowseCatalogVariables>;
}
export const browseCatalogRef: BrowseCatalogRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the browseCatalogRef:
```typescript
const name = browseCatalogRef.operationName;
console.log(name);
```

### Variables
The `BrowseCatalog` query has an optional argument of type `BrowseCatalogVariables`, which is defined in [data/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BrowseCatalogVariables {
  mood?: string | null;
  categorySlug?: string | null;
  subgenreSlug?: string | null;
  format?: string | null;
  maxPriceMxnCents?: number | null;
  partialTitle?: string | null;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `BrowseCatalog` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BrowseCatalogData`, which is defined in [data/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `BrowseCatalog`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, browseCatalog, BrowseCatalogVariables } from '@itinerante/data';

// The `BrowseCatalog` query has an optional argument of type `BrowseCatalogVariables`:
const browseCatalogVars: BrowseCatalogVariables = {
  mood: ..., // optional
  categorySlug: ..., // optional
  subgenreSlug: ..., // optional
  format: ..., // optional
  maxPriceMxnCents: ..., // optional
  partialTitle: ..., // optional
  limit: ..., // optional
};

// Call the `browseCatalog()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await browseCatalog(browseCatalogVars);
// Variables can be defined inline as well.
const { data } = await browseCatalog({ mood: ..., categorySlug: ..., subgenreSlug: ..., format: ..., maxPriceMxnCents: ..., partialTitle: ..., limit: ..., });
// Since all variables are optional for this query, you can omit the `BrowseCatalogVariables` argument.
const { data } = await browseCatalog();

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await browseCatalog(dataConnect, browseCatalogVars);

console.log(data.books);

// Or, you can use the `Promise` API.
browseCatalog(browseCatalogVars).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

### Using `BrowseCatalog`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, browseCatalogRef, BrowseCatalogVariables } from '@itinerante/data';

// The `BrowseCatalog` query has an optional argument of type `BrowseCatalogVariables`:
const browseCatalogVars: BrowseCatalogVariables = {
  mood: ..., // optional
  categorySlug: ..., // optional
  subgenreSlug: ..., // optional
  format: ..., // optional
  maxPriceMxnCents: ..., // optional
  partialTitle: ..., // optional
  limit: ..., // optional
};

// Call the `browseCatalogRef()` function to get a reference to the query.
const ref = browseCatalogRef(browseCatalogVars);
// Variables can be defined inline as well.
const ref = browseCatalogRef({ mood: ..., categorySlug: ..., subgenreSlug: ..., format: ..., maxPriceMxnCents: ..., partialTitle: ..., limit: ..., });
// Since all variables are optional for this query, you can omit the `BrowseCatalogVariables` argument.
const ref = browseCatalogRef();

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = browseCatalogRef(dataConnect, browseCatalogVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.books);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

## BookDetailsPage
You can execute the `BookDetailsPage` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [data/index.d.ts](./index.d.ts):
```typescript
bookDetailsPage(vars: BookDetailsPageVariables, options?: ExecuteQueryOptions): QueryPromise<BookDetailsPageData, BookDetailsPageVariables>;

interface BookDetailsPageRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: BookDetailsPageVariables): QueryRef<BookDetailsPageData, BookDetailsPageVariables>;
}
export const bookDetailsPageRef: BookDetailsPageRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
bookDetailsPage(dc: DataConnect, vars: BookDetailsPageVariables, options?: ExecuteQueryOptions): QueryPromise<BookDetailsPageData, BookDetailsPageVariables>;

interface BookDetailsPageRef {
  ...
  (dc: DataConnect, vars: BookDetailsPageVariables): QueryRef<BookDetailsPageData, BookDetailsPageVariables>;
}
export const bookDetailsPageRef: BookDetailsPageRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the bookDetailsPageRef:
```typescript
const name = bookDetailsPageRef.operationName;
console.log(name);
```

### Variables
The `BookDetailsPage` query requires an argument of type `BookDetailsPageVariables`, which is defined in [data/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface BookDetailsPageVariables {
  slug: string;
}
```
### Return Type
Recall that executing the `BookDetailsPage` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `BookDetailsPageData`, which is defined in [data/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `BookDetailsPage`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, bookDetailsPage, BookDetailsPageVariables } from '@itinerante/data';

// The `BookDetailsPage` query requires an argument of type `BookDetailsPageVariables`:
const bookDetailsPageVars: BookDetailsPageVariables = {
  slug: ..., 
};

// Call the `bookDetailsPage()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await bookDetailsPage(bookDetailsPageVars);
// Variables can be defined inline as well.
const { data } = await bookDetailsPage({ slug: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await bookDetailsPage(dataConnect, bookDetailsPageVars);

console.log(data.books);

// Or, you can use the `Promise` API.
bookDetailsPage(bookDetailsPageVars).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

### Using `BookDetailsPage`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, bookDetailsPageRef, BookDetailsPageVariables } from '@itinerante/data';

// The `BookDetailsPage` query requires an argument of type `BookDetailsPageVariables`:
const bookDetailsPageVars: BookDetailsPageVariables = {
  slug: ..., 
};

// Call the `bookDetailsPageRef()` function to get a reference to the query.
const ref = bookDetailsPageRef(bookDetailsPageVars);
// Variables can be defined inline as well.
const ref = bookDetailsPageRef({ slug: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = bookDetailsPageRef(dataConnect, bookDetailsPageVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.books);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

## SearchBooksVector
You can execute the `SearchBooksVector` query using the following action shortcut function, or by calling `executeQuery()` after calling the following `QueryRef` function, both of which are defined in [data/index.d.ts](./index.d.ts):
```typescript
searchBooksVector(vars: SearchBooksVectorVariables, options?: ExecuteQueryOptions): QueryPromise<SearchBooksVectorData, SearchBooksVectorVariables>;

interface SearchBooksVectorRef {
  ...
  /* Allow users to create refs without passing in DataConnect */
  (vars: SearchBooksVectorVariables): QueryRef<SearchBooksVectorData, SearchBooksVectorVariables>;
}
export const searchBooksVectorRef: SearchBooksVectorRef;
```
You can also pass in a `DataConnect` instance to the action shortcut function or `QueryRef` function.
```typescript
searchBooksVector(dc: DataConnect, vars: SearchBooksVectorVariables, options?: ExecuteQueryOptions): QueryPromise<SearchBooksVectorData, SearchBooksVectorVariables>;

interface SearchBooksVectorRef {
  ...
  (dc: DataConnect, vars: SearchBooksVectorVariables): QueryRef<SearchBooksVectorData, SearchBooksVectorVariables>;
}
export const searchBooksVectorRef: SearchBooksVectorRef;
```

If you need the name of the operation without creating a ref, you can retrieve the operation name by calling the `operationName` property on the searchBooksVectorRef:
```typescript
const name = searchBooksVectorRef.operationName;
console.log(name);
```

### Variables
The `SearchBooksVector` query requires an argument of type `SearchBooksVectorVariables`, which is defined in [data/index.d.ts](./index.d.ts). It has the following fields:

```typescript
export interface SearchBooksVectorVariables {
  query: string;
  limit?: number | null;
}
```
### Return Type
Recall that executing the `SearchBooksVector` query returns a `QueryPromise` that resolves to an object with a `data` property.

The `data` property is an object of type `SearchBooksVectorData`, which is defined in [data/index.d.ts](./index.d.ts). It has the following fields:
```typescript
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
```
### Using `SearchBooksVector`'s action shortcut function

```typescript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, searchBooksVector, SearchBooksVectorVariables } from '@itinerante/data';

// The `SearchBooksVector` query requires an argument of type `SearchBooksVectorVariables`:
const searchBooksVectorVars: SearchBooksVectorVariables = {
  query: ..., 
  limit: ..., // optional
};

// Call the `searchBooksVector()` function to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await searchBooksVector(searchBooksVectorVars);
// Variables can be defined inline as well.
const { data } = await searchBooksVector({ query: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the action shortcut function.
const dataConnect = getDataConnect(connectorConfig);
const { data } = await searchBooksVector(dataConnect, searchBooksVectorVars);

console.log(data.books);

// Or, you can use the `Promise` API.
searchBooksVector(searchBooksVectorVars).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

### Using `SearchBooksVector`'s `QueryRef` function

```typescript
import { getDataConnect, executeQuery } from 'firebase/data-connect';
import { connectorConfig, searchBooksVectorRef, SearchBooksVectorVariables } from '@itinerante/data';

// The `SearchBooksVector` query requires an argument of type `SearchBooksVectorVariables`:
const searchBooksVectorVars: SearchBooksVectorVariables = {
  query: ..., 
  limit: ..., // optional
};

// Call the `searchBooksVectorRef()` function to get a reference to the query.
const ref = searchBooksVectorRef(searchBooksVectorVars);
// Variables can be defined inline as well.
const ref = searchBooksVectorRef({ query: ..., limit: ..., });

// You can also pass in a `DataConnect` instance to the `QueryRef` function.
const dataConnect = getDataConnect(connectorConfig);
const ref = searchBooksVectorRef(dataConnect, searchBooksVectorVars);

// Call `executeQuery()` on the reference to execute the query.
// You can use the `await` keyword to wait for the promise to resolve.
const { data } = await executeQuery(ref);

console.log(data.books);

// Or, you can use the `Promise` API.
executeQuery(ref).then((response) => {
  const data = response.data;
  console.log(data.books);
});
```

# Mutations

No mutations were generated for the `connector` connector.

If you want to learn more about how to use mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#using-mutations).

