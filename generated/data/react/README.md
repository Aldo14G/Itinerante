# Generated React README
This README will guide you through the process of using the generated React SDK package for the connector `connector`. It will also provide examples on how to use your generated SDK to call your Data Connect queries and mutations.

**If you're looking for the `JavaScript README`, you can find it at [`data/README.md`](../README.md)**

***NOTE:** This README is generated alongside the generated SDK. If you make changes to this file, they will be overwritten when the SDK is regenerated.*

You can use this generated SDK by importing from the package `@itinerante/data/react` as shown below. Both CommonJS and ESM imports are supported.

You can also follow the instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#react).

# Table of Contents
- [**Overview**](#generated-react-readme)
- [**TanStack Query Firebase & TanStack React Query**](#tanstack-query-firebase-tanstack-react-query)
  - [*Package Installation*](#installing-tanstack-query-firebase-and-tanstack-react-query-packages)
  - [*Configuring TanStack Query*](#configuring-tanstack-query)
- [**Accessing the connector**](#accessing-the-connector)
  - [*Connecting to the local Emulator*](#connecting-to-the-local-emulator)
- [**Queries**](#queries)
  - [*BrowseCatalog*](#browsecatalog)
  - [*BookDetailsPage*](#bookdetailspage)
  - [*SearchBooksVector*](#searchbooksvector)
- [**Mutations**](#mutations)

# TanStack Query Firebase & TanStack React Query
This SDK provides [React](https://react.dev/) hooks generated specific to your application, for the operations found in the connector `connector`. These hooks are generated using [TanStack Query Firebase](https://react-query-firebase.invertase.dev/) by our partners at Invertase, a library built on top of [TanStack React Query v5](https://tanstack.com/query/v5/docs/framework/react/overview).

***You do not need to be familiar with Tanstack Query or Tanstack Query Firebase to use this SDK.*** However, you may find it useful to learn more about them, as they will empower you as a user of this Generated React SDK.

## Installing TanStack Query Firebase and TanStack React Query Packages
In order to use the React generated SDK, you must install the `TanStack React Query` and `TanStack Query Firebase` packages.
```bash
npm i --save @tanstack/react-query @tanstack-query-firebase/react
```
```bash
npm i --save firebase@latest # Note: React has a peer dependency on ^11.3.0
```

You can also follow the installation instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#tanstack-install), or the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react) and [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/installation).

## Configuring TanStack Query
In order to use the React generated SDK in your application, you must wrap your application's component tree in a `QueryClientProvider` component from TanStack React Query. None of your generated React SDK hooks will work without this provider.

```javascript
import { QueryClientProvider } from '@tanstack/react-query';

// Create a TanStack Query client instance
const queryClient = new QueryClient()

function App() {
  return (
    // Provide the client to your App
    <QueryClientProvider client={queryClient}>
      <MyApplication />
    </QueryClientProvider>
  )
}
```

To learn more about `QueryClientProvider`, see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/quick-start) and the [TanStack Query Firebase documentation](https://invertase.docs.page/tanstack-query-firebase/react#usage).

# Accessing the connector
A connector is a collection of Queries and Mutations. One SDK is generated for each connector - this SDK is generated for the connector `connector`.

You can find more information about connectors in the [Data Connect documentation](https://firebase.google.com/docs/data-connect#how-does).

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@itinerante/data';

const dataConnect = getDataConnect(connectorConfig);
```

## Connecting to the local Emulator
By default, the connector will connect to the production service.

To connect to the emulator, you can use the following code.
You can also follow the emulator instructions from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#emulator-react-angular).

```javascript
import { connectDataConnectEmulator, getDataConnect } from 'firebase/data-connect';
import { connectorConfig } from '@itinerante/data';

const dataConnect = getDataConnect(connectorConfig);
connectDataConnectEmulator(dataConnect, 'localhost', 9399);
```

After it's initialized, you can call your Data Connect [queries](#queries) and [mutations](#mutations) using the hooks provided from your generated React SDK.

# Queries

The React generated SDK provides Query hook functions that call and return [`useDataConnectQuery`](https://react-query-firebase.invertase.dev/react/data-connect/querying) hooks from TanStack Query Firebase.

Calling these hook functions will return a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and the most recent data returned by the Query, among other things. To learn more about these hooks and how to use them, see the [TanStack Query Firebase documentation](https://react-query-firebase.invertase.dev/react/data-connect/querying).

TanStack React Query caches the results of your Queries, so using the same Query hook function in multiple places in your application allows the entire application to automatically see updates to that Query's data.

Query hooks execute their Queries automatically when called, and periodically refresh, unless you change the `queryOptions` for the Query. To learn how to stop a Query from automatically executing, including how to make a query "lazy", see the [TanStack React Query documentation](https://tanstack.com/query/latest/docs/framework/react/guides/disabling-queries).

To learn more about TanStack React Query's Queries, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/queries).

## Using Query Hooks
Here's a general overview of how to use the generated Query hooks in your code:

- If the Query has no variables, the Query hook function does not require arguments.
- If the Query has any required variables, the Query hook function will require at least one argument: an object that contains all the required variables for the Query.
- If the Query has some required and some optional variables, only required variables are necessary in the variables argument object, and optional variables may be provided as well.
- If all of the Query's variables are optional, the Query hook function does not require any arguments.
- Query hook functions can be called with or without passing in a `DataConnect` instance as an argument. If no `DataConnect` argument is passed in, then the generated SDK will call `getDataConnect(connectorConfig)` behind the scenes for you.
- Query hooks functions can be called with or without passing in an `options` argument of type `useDataConnectQueryOptions`. To learn more about the `options` argument, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/guides/query-options).
  - ***Special case:***  If the Query has all optional variables and you would like to provide an `options` argument to the Query hook function without providing any variables, you must pass `undefined` where you would normally pass the Query's variables, and then may provide the `options` argument.

Below are examples of how to use the `connector` connector's generated Query hook functions to execute each Query. You can also follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

## BrowseCatalog
You can execute the `BrowseCatalog` Query using the following Query hook function, which is defined in [data/react/index.d.ts](./index.d.ts):

```javascript
useBrowseCatalog(dc: DataConnect, vars?: BrowseCatalogVariables, options?: useDataConnectQueryOptions<BrowseCatalogData>): UseDataConnectQueryResult<BrowseCatalogData, BrowseCatalogVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useBrowseCatalog(vars?: BrowseCatalogVariables, options?: useDataConnectQueryOptions<BrowseCatalogData>): UseDataConnectQueryResult<BrowseCatalogData, BrowseCatalogVariables>;
```

### Variables
The `BrowseCatalog` Query has an optional argument of type `BrowseCatalogVariables`, which is defined in [data/index.d.ts](../index.d.ts). It has the following fields:

```javascript
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
Recall that calling the `BrowseCatalog` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `BrowseCatalog` Query is of type `BrowseCatalogData`, which is defined in [data/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `BrowseCatalog`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BrowseCatalogVariables } from '@itinerante/data';
import { useBrowseCatalog } from '@itinerante/data/react'

export default function BrowseCatalogComponent() {
  // The `useBrowseCatalog` Query hook has an optional argument of type `BrowseCatalogVariables`:
  const browseCatalogVars: BrowseCatalogVariables = {
    mood: ..., // optional
    categorySlug: ..., // optional
    subgenreSlug: ..., // optional
    format: ..., // optional
    maxPriceMxnCents: ..., // optional
    partialTitle: ..., // optional
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useBrowseCatalog(browseCatalogVars);
  // Variables can be defined inline as well.
  const query = useBrowseCatalog({ mood: ..., categorySlug: ..., subgenreSlug: ..., format: ..., maxPriceMxnCents: ..., partialTitle: ..., limit: ..., });
  // Since all variables are optional for this Query, you can omit the `BrowseCatalogVariables` argument.
  // (as long as you don't want to provide any `options`!)
  const query = useBrowseCatalog();

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useBrowseCatalog(dataConnect, browseCatalogVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useBrowseCatalog(browseCatalogVars, options);
  // If you'd like to provide options without providing any variables, you must
  // pass `undefined` where you would normally pass the variables.
  const query = useBrowseCatalog(undefined, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useBrowseCatalog(dataConnect, browseCatalogVars /** or undefined */, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.books);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## BookDetailsPage
You can execute the `BookDetailsPage` Query using the following Query hook function, which is defined in [data/react/index.d.ts](./index.d.ts):

```javascript
useBookDetailsPage(dc: DataConnect, vars: BookDetailsPageVariables, options?: useDataConnectQueryOptions<BookDetailsPageData>): UseDataConnectQueryResult<BookDetailsPageData, BookDetailsPageVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useBookDetailsPage(vars: BookDetailsPageVariables, options?: useDataConnectQueryOptions<BookDetailsPageData>): UseDataConnectQueryResult<BookDetailsPageData, BookDetailsPageVariables>;
```

### Variables
The `BookDetailsPage` Query requires an argument of type `BookDetailsPageVariables`, which is defined in [data/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface BookDetailsPageVariables {
  slug: string;
}
```
### Return Type
Recall that calling the `BookDetailsPage` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `BookDetailsPage` Query is of type `BookDetailsPageData`, which is defined in [data/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `BookDetailsPage`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, BookDetailsPageVariables } from '@itinerante/data';
import { useBookDetailsPage } from '@itinerante/data/react'

export default function BookDetailsPageComponent() {
  // The `useBookDetailsPage` Query hook requires an argument of type `BookDetailsPageVariables`:
  const bookDetailsPageVars: BookDetailsPageVariables = {
    slug: ..., 
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useBookDetailsPage(bookDetailsPageVars);
  // Variables can be defined inline as well.
  const query = useBookDetailsPage({ slug: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useBookDetailsPage(dataConnect, bookDetailsPageVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useBookDetailsPage(bookDetailsPageVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useBookDetailsPage(dataConnect, bookDetailsPageVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.books);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

## SearchBooksVector
You can execute the `SearchBooksVector` Query using the following Query hook function, which is defined in [data/react/index.d.ts](./index.d.ts):

```javascript
useSearchBooksVector(dc: DataConnect, vars: SearchBooksVectorVariables, options?: useDataConnectQueryOptions<SearchBooksVectorData>): UseDataConnectQueryResult<SearchBooksVectorData, SearchBooksVectorVariables>;
```
You can also pass in a `DataConnect` instance to the Query hook function.
```javascript
useSearchBooksVector(vars: SearchBooksVectorVariables, options?: useDataConnectQueryOptions<SearchBooksVectorData>): UseDataConnectQueryResult<SearchBooksVectorData, SearchBooksVectorVariables>;
```

### Variables
The `SearchBooksVector` Query requires an argument of type `SearchBooksVectorVariables`, which is defined in [data/index.d.ts](../index.d.ts). It has the following fields:

```javascript
export interface SearchBooksVectorVariables {
  query: string;
  limit?: number | null;
}
```
### Return Type
Recall that calling the `SearchBooksVector` Query hook function returns a `UseQueryResult` object. This object holds the state of your Query, including whether the Query is loading, has completed, or has succeeded/failed, and any data returned by the Query, among other things.

To check the status of a Query, use the `UseQueryResult.status` field. You can also check for pending / success / error status using the `UseQueryResult.isPending`, `UseQueryResult.isSuccess`, and `UseQueryResult.isError` fields.

To access the data returned by a Query, use the `UseQueryResult.data` field. The data for the `SearchBooksVector` Query is of type `SearchBooksVectorData`, which is defined in [data/index.d.ts](../index.d.ts). It has the following fields:
```javascript
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

To learn more about the `UseQueryResult` object, see the [TanStack React Query documentation](https://tanstack.com/query/v5/docs/framework/react/reference/useQuery).

### Using `SearchBooksVector`'s Query hook function

```javascript
import { getDataConnect } from 'firebase/data-connect';
import { connectorConfig, SearchBooksVectorVariables } from '@itinerante/data';
import { useSearchBooksVector } from '@itinerante/data/react'

export default function SearchBooksVectorComponent() {
  // The `useSearchBooksVector` Query hook requires an argument of type `SearchBooksVectorVariables`:
  const searchBooksVectorVars: SearchBooksVectorVariables = {
    query: ..., 
    limit: ..., // optional
  };

  // You don't have to do anything to "execute" the Query.
  // Call the Query hook function to get a `UseQueryResult` object which holds the state of your Query.
  const query = useSearchBooksVector(searchBooksVectorVars);
  // Variables can be defined inline as well.
  const query = useSearchBooksVector({ query: ..., limit: ..., });

  // You can also pass in a `DataConnect` instance to the Query hook function.
  const dataConnect = getDataConnect(connectorConfig);
  const query = useSearchBooksVector(dataConnect, searchBooksVectorVars);

  // You can also pass in a `useDataConnectQueryOptions` object to the Query hook function.
  const options = { staleTime: 5 * 1000 };
  const query = useSearchBooksVector(searchBooksVectorVars, options);

  // You can also pass both a `DataConnect` instance and a `useDataConnectQueryOptions` object.
  const dataConnect = getDataConnect(connectorConfig);
  const options = { staleTime: 5 * 1000 };
  const query = useSearchBooksVector(dataConnect, searchBooksVectorVars, options);

  // Then, you can render your component dynamically based on the status of the Query.
  if (query.isPending) {
    return <div>Loading...</div>;
  }

  if (query.isError) {
    return <div>Error: {query.error.message}</div>;
  }

  // If the Query is successful, you can access the data returned using the `UseQueryResult.data` field.
  if (query.isSuccess) {
    console.log(query.data.books);
  }
  return <div>Query execution {query.isSuccess ? 'successful' : 'failed'}!</div>;
}
```

# Mutations

No Mutations were generated for the `connector` connector.

If you want to learn more about how to use Mutations in Data Connect, you can follow the examples from the [Data Connect documentation](https://firebase.google.com/docs/data-connect/web-sdk#operations-react-angular).

