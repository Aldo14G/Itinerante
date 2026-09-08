import { BrowseCatalogData, BrowseCatalogVariables, BookDetailsPageData, BookDetailsPageVariables, SearchBooksVectorData, SearchBooksVectorVariables } from '../';
import { UseDataConnectQueryResult, useDataConnectQueryOptions} from '@tanstack-query-firebase/react/data-connect';
import { UseQueryResult} from '@tanstack/react-query';
import { DataConnect } from 'firebase/data-connect';
import { FirebaseError } from 'firebase/app';


export function useBrowseCatalog(vars?: BrowseCatalogVariables, options?: useDataConnectQueryOptions<BrowseCatalogData>): UseDataConnectQueryResult<BrowseCatalogData, BrowseCatalogVariables>;
export function useBrowseCatalog(dc: DataConnect, vars?: BrowseCatalogVariables, options?: useDataConnectQueryOptions<BrowseCatalogData>): UseDataConnectQueryResult<BrowseCatalogData, BrowseCatalogVariables>;

export function useBookDetailsPage(vars: BookDetailsPageVariables, options?: useDataConnectQueryOptions<BookDetailsPageData>): UseDataConnectQueryResult<BookDetailsPageData, BookDetailsPageVariables>;
export function useBookDetailsPage(dc: DataConnect, vars: BookDetailsPageVariables, options?: useDataConnectQueryOptions<BookDetailsPageData>): UseDataConnectQueryResult<BookDetailsPageData, BookDetailsPageVariables>;

export function useSearchBooksVector(vars: SearchBooksVectorVariables, options?: useDataConnectQueryOptions<SearchBooksVectorData>): UseDataConnectQueryResult<SearchBooksVectorData, SearchBooksVectorVariables>;
export function useSearchBooksVector(dc: DataConnect, vars: SearchBooksVectorVariables, options?: useDataConnectQueryOptions<SearchBooksVectorData>): UseDataConnectQueryResult<SearchBooksVectorData, SearchBooksVectorVariables>;
