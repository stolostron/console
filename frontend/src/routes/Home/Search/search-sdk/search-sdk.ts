/* Copyright Contributors to the Open Cluster Management project */
import * as Apollo from '@apollo/client'
import { gql } from '@apollo/client'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never }
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never }
const defaultOptions = {} as const
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string }
  String: { input: string; output: string }
  Boolean: { input: boolean; output: boolean }
  Int: { input: number; output: number }
  Float: { input: number; output: number }
  Map: { input: any; output: any }
}

/** A message is used to communicate conditions detected while executing a query on the server. */
export type Message = {
  /** Message text. */
  description?: Maybe<Scalars['String']['output']>
  /** Unique identifier to be used by clients to process the message independently of locale or grammatical changes. */
  id: Scalars['String']['output']
  /**
   * Message type.
   * **Values:** information, warning, error.
   */
  kind?: Maybe<Scalars['String']['output']>
}

/** Queries supported by the Search Query API. */
export type Query = {
  /**
   * Additional information about the service status or conditions found while processing the query.
   * This is similar to the errors query, but without implying that there was a problem processing the query.
   */
  messages?: Maybe<Array<Maybe<Message>>>
  /**
   * Search for resources and their relationships.
   * *[PLACEHOLDER] Results only include kubernetes resources for which the authenticated user has list permission.*
   *
   * For more information see the feature spec.
   */
  search?: Maybe<Array<Maybe<SearchResult>>>
  /**
   * Query all values for the given property.
   * Optionally, a query can be included to filter the results.
   * For example, if we want to get the names of all resources in the namespace foo, we can pass a query with the filter `{property: namespace, values:['foo']}`
   *
   * **Default limit is** 1,000
   * A value of -1 will remove the limit. Use carefully because it may impact the service.
   */
  searchComplete?: Maybe<Array<Maybe<Scalars['String']['output']>>>
  /** Returns all properties from resources currently in the index. */
  searchSchema?: Maybe<Scalars['Map']['output']>
}

/** Queries supported by the Search Query API. */
export type QuerySearchArgs = {
  input?: InputMaybe<Array<InputMaybe<SearchInput>>>
}

/** Queries supported by the Search Query API. */
export type QuerySearchCompleteArgs = {
  limit?: InputMaybe<Scalars['Int']['input']>
  property: Scalars['String']['input']
  query?: InputMaybe<SearchInput>
}

/**
 * Defines a key/value to filter results.
 * When multiple values are provided for a property, it is interpreted as an OR operation.
 */
export type SearchFilter = {
  /** Name of the property (key). */
  property: Scalars['String']['input']
  /**
   * Values for the property. Multiple values per property are interpreted as an OR operation.
   * Optionally one of these operations `=,!,!=,>,>=,<,<=` can be included at the beginning of the value.
   * By default the equality operation is used.
   * The values available for datetime fields (Ex: `created`, `startedAt`) are `hour`, `day`, `week`, `month` and `year`.
   * Property `kind`, if included in the filter, will be matched using a case-insensitive comparison.
   * For example, `kind:Pod` and `kind:pod` will bring up all pods. This is to maintain compatibility with Search V1.
   */
  values: Array<InputMaybe<Scalars['String']['input']>>
}

/** Input options to the search query. */
export type SearchInput = {
  /**
   * List of SearchFilter, which is a key(property) and values.
   * When multiple filters are provided, results will match all filters (AND operation).
   */
  filters?: InputMaybe<Array<InputMaybe<SearchFilter>>>
  /**
   * List of strings to match resources.
   * Will match resources containing any of the keywords in any text field.
   * When multiple keywords are provided, it is interpreted as an AND operation.
   * Matches are case insensitive.
   */
  keywords?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
  /**
   * Max number of results returned by the query.
   * **Default is** 10,000
   * A value of -1 will remove the limit. Use carefully because it may impact the service.
   */
  limit?: InputMaybe<Scalars['Int']['input']>
  /**
   * Filter relationships to the specified kinds.
   * If empty, all relationships will be included.
   * This filter is used with the 'related' field on SearchResult.
   */
  relatedKinds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>>
}

/** Resources related to the items resolved from the search query. */
export type SearchRelatedResult = {
  /**
   * Total number of related resources.
   * **NOTE:** Should not use count in combination with items. If items are requested, the count is simply the size of items.
   */
  count?: Maybe<Scalars['Int']['output']>
  /** Resources matched by the query. */
  items?: Maybe<Array<Maybe<Scalars['Map']['output']>>>
  kind: Scalars['String']['output']
}

/** Data returned by the search query. */
export type SearchResult = {
  /**
   * Total number of resources matching the query.
   * **NOTE:** Should not use count in combination with items. If items are requested, the count is simply the size of items.
   */
  count?: Maybe<Scalars['Int']['output']>
  /** Resources matching the search query. */
  items?: Maybe<Array<Maybe<Scalars['Map']['output']>>>
  /**
   * Resources related to the query results (items).
   * For example, if searching for deployments, this will return the related pod resources.
   */
  related?: Maybe<Array<Maybe<SearchRelatedResult>>>
}

export type SearchSchemaQueryVariables = Exact<{ [key: string]: never }>

export type SearchSchemaQuery = { searchSchema?: any | null }

export type SearchCompleteQueryVariables = Exact<{
  property: Scalars['String']['input']
  query?: InputMaybe<SearchInput>
  limit?: InputMaybe<Scalars['Int']['input']>
}>

export type SearchCompleteQuery = { searchComplete?: Array<string | null> | null }

export type SearchResultItemsQueryVariables = Exact<{
  input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultItemsQuery = { searchResult?: Array<{ items?: Array<any | null> | null } | null> | null }

export type SearchResultCountQueryVariables = Exact<{
  input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultCountQuery = { searchResult?: Array<{ count?: number | null } | null> | null }

export type SearchResultRelatedCountQueryVariables = Exact<{
  input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultRelatedCountQuery = {
  searchResult?: Array<{ related?: Array<{ kind: string; count?: number | null } | null> | null } | null> | null
}

export type SearchResultItemsAndRelatedItemsQueryVariables = Exact<{
  input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultItemsAndRelatedItemsQuery = {
  searchResult?: Array<{
    items?: Array<any | null> | null
    related?: Array<{ kind: string; items?: Array<any | null> | null } | null> | null
  } | null> | null
}

export type SearchResultRelatedItemsQueryVariables = Exact<{
  input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultRelatedItemsQuery = {
  searchResult?: Array<{
    related?: Array<{ kind: string; items?: Array<any | null> | null } | null> | null
  } | null> | null
}

export type GetMessagesQueryVariables = Exact<{ [key: string]: never }>

export type GetMessagesQuery = {
  messages?: Array<{ id: string; kind?: string | null; description?: string | null } | null> | null
}

export const SearchSchemaDocument = gql`
  query searchSchema {
    searchSchema
  }
`

/**
 * __useSearchSchemaQuery__
 *
 * To run a query within a React component, call `useSearchSchemaQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchSchemaQuery({
 *   variables: {
 *   },
 * });
 */
export function useSearchSchemaQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchSchemaQuery, SearchSchemaQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchSchemaQuery, SearchSchemaQueryVariables>(SearchSchemaDocument, options)
}
export function useSearchSchemaLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchSchemaQuery, SearchSchemaQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchSchemaQuery, SearchSchemaQueryVariables>(SearchSchemaDocument, options)
}
export function useSearchSchemaSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchSchemaQuery, SearchSchemaQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchSchemaQuery, SearchSchemaQueryVariables>(SearchSchemaDocument, options)
}
export type SearchSchemaQueryHookResult = ReturnType<typeof useSearchSchemaQuery>
export type SearchSchemaLazyQueryHookResult = ReturnType<typeof useSearchSchemaLazyQuery>
export type SearchSchemaSuspenseQueryHookResult = ReturnType<typeof useSearchSchemaSuspenseQuery>
export type SearchSchemaQueryResult = Apollo.QueryResult<SearchSchemaQuery, SearchSchemaQueryVariables>
export const SearchCompleteDocument = gql`
  query searchComplete($property: String!, $query: SearchInput, $limit: Int) {
    searchComplete(property: $property, query: $query, limit: $limit)
  }
`

/**
 * __useSearchCompleteQuery__
 *
 * To run a query within a React component, call `useSearchCompleteQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchCompleteQuery({
 *   variables: {
 *      property: // value for 'property'
 *      query: // value for 'query'
 *      limit: // value for 'limit'
 *   },
 * });
 */
export function useSearchCompleteQuery(
  baseOptions: Apollo.QueryHookOptions<SearchCompleteQuery, SearchCompleteQueryVariables> &
    ({ variables: SearchCompleteQueryVariables; skip?: boolean } | { skip: boolean })
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchCompleteQuery, SearchCompleteQueryVariables>(SearchCompleteDocument, options)
}
export function useSearchCompleteLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchCompleteQuery, SearchCompleteQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchCompleteQuery, SearchCompleteQueryVariables>(SearchCompleteDocument, options)
}
export function useSearchCompleteSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchCompleteQuery, SearchCompleteQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchCompleteQuery, SearchCompleteQueryVariables>(SearchCompleteDocument, options)
}
export type SearchCompleteQueryHookResult = ReturnType<typeof useSearchCompleteQuery>
export type SearchCompleteLazyQueryHookResult = ReturnType<typeof useSearchCompleteLazyQuery>
export type SearchCompleteSuspenseQueryHookResult = ReturnType<typeof useSearchCompleteSuspenseQuery>
export type SearchCompleteQueryResult = Apollo.QueryResult<SearchCompleteQuery, SearchCompleteQueryVariables>
export const SearchResultItemsDocument = gql`
  query searchResultItems($input: [SearchInput]) {
    searchResult: search(input: $input) {
      items
    }
  }
`

/**
 * __useSearchResultItemsQuery__
 *
 * To run a query within a React component, call `useSearchResultItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultItemsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchResultItemsQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchResultItemsQuery, SearchResultItemsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchResultItemsQuery, SearchResultItemsQueryVariables>(SearchResultItemsDocument, options)
}
export function useSearchResultItemsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchResultItemsQuery, SearchResultItemsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchResultItemsQuery, SearchResultItemsQueryVariables>(
    SearchResultItemsDocument,
    options
  )
}
export function useSearchResultItemsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchResultItemsQuery, SearchResultItemsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchResultItemsQuery, SearchResultItemsQueryVariables>(
    SearchResultItemsDocument,
    options
  )
}
export type SearchResultItemsQueryHookResult = ReturnType<typeof useSearchResultItemsQuery>
export type SearchResultItemsLazyQueryHookResult = ReturnType<typeof useSearchResultItemsLazyQuery>
export type SearchResultItemsSuspenseQueryHookResult = ReturnType<typeof useSearchResultItemsSuspenseQuery>
export type SearchResultItemsQueryResult = Apollo.QueryResult<SearchResultItemsQuery, SearchResultItemsQueryVariables>
export const SearchResultCountDocument = gql`
  query searchResultCount($input: [SearchInput]) {
    searchResult: search(input: $input) {
      count
    }
  }
`

/**
 * __useSearchResultCountQuery__
 *
 * To run a query within a React component, call `useSearchResultCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultCountQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchResultCountQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchResultCountQuery, SearchResultCountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchResultCountQuery, SearchResultCountQueryVariables>(SearchResultCountDocument, options)
}
export function useSearchResultCountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchResultCountQuery, SearchResultCountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchResultCountQuery, SearchResultCountQueryVariables>(
    SearchResultCountDocument,
    options
  )
}
export function useSearchResultCountSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchResultCountQuery, SearchResultCountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchResultCountQuery, SearchResultCountQueryVariables>(
    SearchResultCountDocument,
    options
  )
}
export type SearchResultCountQueryHookResult = ReturnType<typeof useSearchResultCountQuery>
export type SearchResultCountLazyQueryHookResult = ReturnType<typeof useSearchResultCountLazyQuery>
export type SearchResultCountSuspenseQueryHookResult = ReturnType<typeof useSearchResultCountSuspenseQuery>
export type SearchResultCountQueryResult = Apollo.QueryResult<SearchResultCountQuery, SearchResultCountQueryVariables>
export const SearchResultRelatedCountDocument = gql`
  query searchResultRelatedCount($input: [SearchInput]) {
    searchResult: search(input: $input) {
      related {
        kind
        count
      }
    }
  }
`

/**
 * __useSearchResultRelatedCountQuery__
 *
 * To run a query within a React component, call `useSearchResultRelatedCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultRelatedCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultRelatedCountQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchResultRelatedCountQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables>(
    SearchResultRelatedCountDocument,
    options
  )
}
export function useSearchResultRelatedCountLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables>(
    SearchResultRelatedCountDocument,
    options
  )
}
export function useSearchResultRelatedCountSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables>(
    SearchResultRelatedCountDocument,
    options
  )
}
export type SearchResultRelatedCountQueryHookResult = ReturnType<typeof useSearchResultRelatedCountQuery>
export type SearchResultRelatedCountLazyQueryHookResult = ReturnType<typeof useSearchResultRelatedCountLazyQuery>
export type SearchResultRelatedCountSuspenseQueryHookResult = ReturnType<
  typeof useSearchResultRelatedCountSuspenseQuery
>
export type SearchResultRelatedCountQueryResult = Apollo.QueryResult<
  SearchResultRelatedCountQuery,
  SearchResultRelatedCountQueryVariables
>
export const SearchResultItemsAndRelatedItemsDocument = gql`
  query searchResultItemsAndRelatedItems($input: [SearchInput]) {
    searchResult: search(input: $input) {
      items
      related {
        kind
        items
      }
    }
  }
`

/**
 * __useSearchResultItemsAndRelatedItemsQuery__
 *
 * To run a query within a React component, call `useSearchResultItemsAndRelatedItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultItemsAndRelatedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultItemsAndRelatedItemsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchResultItemsAndRelatedItemsQuery(
  baseOptions?: Apollo.QueryHookOptions<
    SearchResultItemsAndRelatedItemsQuery,
    SearchResultItemsAndRelatedItemsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchResultItemsAndRelatedItemsQuery, SearchResultItemsAndRelatedItemsQueryVariables>(
    SearchResultItemsAndRelatedItemsDocument,
    options
  )
}
export function useSearchResultItemsAndRelatedItemsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<
    SearchResultItemsAndRelatedItemsQuery,
    SearchResultItemsAndRelatedItemsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchResultItemsAndRelatedItemsQuery, SearchResultItemsAndRelatedItemsQueryVariables>(
    SearchResultItemsAndRelatedItemsDocument,
    options
  )
}
export function useSearchResultItemsAndRelatedItemsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<
    SearchResultItemsAndRelatedItemsQuery,
    SearchResultItemsAndRelatedItemsQueryVariables
  >
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchResultItemsAndRelatedItemsQuery, SearchResultItemsAndRelatedItemsQueryVariables>(
    SearchResultItemsAndRelatedItemsDocument,
    options
  )
}
export type SearchResultItemsAndRelatedItemsQueryHookResult = ReturnType<
  typeof useSearchResultItemsAndRelatedItemsQuery
>
export type SearchResultItemsAndRelatedItemsLazyQueryHookResult = ReturnType<
  typeof useSearchResultItemsAndRelatedItemsLazyQuery
>
export type SearchResultItemsAndRelatedItemsSuspenseQueryHookResult = ReturnType<
  typeof useSearchResultItemsAndRelatedItemsSuspenseQuery
>
export type SearchResultItemsAndRelatedItemsQueryResult = Apollo.QueryResult<
  SearchResultItemsAndRelatedItemsQuery,
  SearchResultItemsAndRelatedItemsQueryVariables
>
export const SearchResultRelatedItemsDocument = gql`
  query searchResultRelatedItems($input: [SearchInput]) {
    searchResult: search(input: $input) {
      related {
        kind
        items
      }
    }
  }
`

/**
 * __useSearchResultRelatedItemsQuery__
 *
 * To run a query within a React component, call `useSearchResultRelatedItemsQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultRelatedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultRelatedItemsQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchResultRelatedItemsQuery(
  baseOptions?: Apollo.QueryHookOptions<SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables>(
    SearchResultRelatedItemsDocument,
    options
  )
}
export function useSearchResultRelatedItemsLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables>(
    SearchResultRelatedItemsDocument,
    options
  )
}
export function useSearchResultRelatedItemsSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables>(
    SearchResultRelatedItemsDocument,
    options
  )
}
export type SearchResultRelatedItemsQueryHookResult = ReturnType<typeof useSearchResultRelatedItemsQuery>
export type SearchResultRelatedItemsLazyQueryHookResult = ReturnType<typeof useSearchResultRelatedItemsLazyQuery>
export type SearchResultRelatedItemsSuspenseQueryHookResult = ReturnType<
  typeof useSearchResultRelatedItemsSuspenseQuery
>
export type SearchResultRelatedItemsQueryResult = Apollo.QueryResult<
  SearchResultRelatedItemsQuery,
  SearchResultRelatedItemsQueryVariables
>
export const GetMessagesDocument = gql`
  query getMessages {
    messages {
      id
      kind
      description
    }
  }
`

/**
 * __useGetMessagesQuery__
 *
 * To run a query within a React component, call `useGetMessagesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetMessagesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetMessagesQuery(
  baseOptions?: Apollo.QueryHookOptions<GetMessagesQuery, GetMessagesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useQuery<GetMessagesQuery, GetMessagesQueryVariables>(GetMessagesDocument, options)
}
export function useGetMessagesLazyQuery(
  baseOptions?: Apollo.LazyQueryHookOptions<GetMessagesQuery, GetMessagesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useLazyQuery<GetMessagesQuery, GetMessagesQueryVariables>(GetMessagesDocument, options)
}
export function useGetMessagesSuspenseQuery(
  baseOptions?: Apollo.SuspenseQueryHookOptions<GetMessagesQuery, GetMessagesQueryVariables>
) {
  const options = { ...defaultOptions, ...baseOptions }
  return Apollo.useSuspenseQuery<GetMessagesQuery, GetMessagesQueryVariables>(GetMessagesDocument, options)
}
export type GetMessagesQueryHookResult = ReturnType<typeof useGetMessagesQuery>
export type GetMessagesLazyQueryHookResult = ReturnType<typeof useGetMessagesLazyQuery>
export type GetMessagesSuspenseQueryHookResult = ReturnType<typeof useGetMessagesSuspenseQuery>
export type GetMessagesQueryResult = Apollo.QueryResult<GetMessagesQuery, GetMessagesQueryVariables>
