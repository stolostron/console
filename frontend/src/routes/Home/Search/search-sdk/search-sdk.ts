/* Copyright Contributors to the Open Cluster Management project */
// Copyright (c) 2021 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import * as Apollo from '@apollo/client'
import { gql } from '@apollo/client'
export type Maybe<T> = T | null
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] }
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> }
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> }
const defaultOptions = {}
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
    ID: string
    String: string
    Boolean: boolean
    Int: number
    Float: number
    /** The `JSON` scalar type represents JSON values as specified by [ECMA-404](http://www.ecma-international.org/publications/files/ECMA-ST/ECMA-404.pdf). */
    JSON: any
    /** The `Upload` scalar type represents a file upload. */
    Upload: any
}

export type Application = {
    _uid?: Maybe<Scalars['String']>
    apiVersion?: Maybe<Scalars['String']>
    created?: Maybe<Scalars['String']>
    dashboard?: Maybe<Scalars['String']>
    labels?: Maybe<Array<Maybe<Scalars['String']>>>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    cluster?: Maybe<Scalars['String']>
    clusterCount?: Maybe<Scalars['JSON']>
    hubChannels?: Maybe<Array<Maybe<Scalars['JSON']>>>
    hubSubscriptions?: Maybe<Array<Maybe<Subscription>>>
    applicationSet?: Maybe<Scalars['String']>
    destinationName?: Maybe<Scalars['String']>
    destinationServer?: Maybe<Scalars['String']>
    destinationCluster?: Maybe<Scalars['String']>
    destinationNamespace?: Maybe<Scalars['String']>
    repoURL?: Maybe<Scalars['String']>
    path?: Maybe<Scalars['String']>
    chart?: Maybe<Scalars['String']>
    targetRevision?: Maybe<Scalars['String']>
}

export enum CacheControlScope {
    Public = 'PUBLIC',
    Private = 'PRIVATE',
}

export type Channel = {
    _uid?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    created?: Maybe<Scalars['String']>
    type?: Maybe<Scalars['String']>
    pathname?: Maybe<Scalars['String']>
    localPlacement?: Maybe<Scalars['Boolean']>
    subscriptionCount?: Maybe<Scalars['Int']>
    clusterCount?: Maybe<Scalars['JSON']>
}

export type Message = {
    id: Scalars['String']
    kind?: Maybe<Scalars['String']>
    description?: Maybe<Scalars['String']>
}

export type PlacementRule = {
    _uid?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    created?: Maybe<Scalars['String']>
    clusterCount?: Maybe<Scalars['JSON']>
    replicas?: Maybe<Scalars['Int']>
}

export type Query = {
    applications?: Maybe<Array<Maybe<Application>>>
    subscriptions?: Maybe<Array<Maybe<Subscription>>>
    placementRules?: Maybe<Array<Maybe<PlacementRule>>>
    channels?: Maybe<Array<Maybe<Channel>>>
    search?: Maybe<Array<Maybe<SearchResult>>>
    messages?: Maybe<Array<Maybe<Message>>>
    searchComplete?: Maybe<Array<Maybe<Scalars['String']>>>
    searchSchema?: Maybe<Scalars['JSON']>
}

export type QueryApplicationsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QuerySubscriptionsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryPlacementRulesArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QueryChannelsArgs = {
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
}

export type QuerySearchArgs = {
    input?: Maybe<Array<Maybe<SearchInput>>>
}

export type QuerySearchCompleteArgs = {
    property: Scalars['String']
    query?: Maybe<SearchInput>
    limit?: Maybe<Scalars['Int']>
}

export type SearchFilter = {
    property: Scalars['String']
    values?: Maybe<Array<Maybe<Scalars['String']>>>
}

export type SearchInput = {
    keywords?: Maybe<Array<Maybe<Scalars['String']>>>
    filters?: Maybe<Array<Maybe<SearchFilter>>>
    limit?: Maybe<Scalars['Int']>
    relatedKinds?: Maybe<Array<Maybe<Scalars['String']>>>
}

export type SearchRelatedResult = {
    kind: Scalars['String']
    count?: Maybe<Scalars['Int']>
    items?: Maybe<Scalars['JSON']>
}

export type SearchResult = {
    count?: Maybe<Scalars['Int']>
    items?: Maybe<Scalars['JSON']>
    related?: Maybe<Array<Maybe<SearchRelatedResult>>>
}

export type Subscription = {
    _uid?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    created?: Maybe<Scalars['String']>
    channel?: Maybe<Scalars['String']>
    appCount?: Maybe<Scalars['Int']>
    clusterCount?: Maybe<Scalars['JSON']>
    timeWindow?: Maybe<Scalars['String']>
    localPlacement?: Maybe<Scalars['Boolean']>
    status?: Maybe<Scalars['String']>
}

export type SearchSchemaQueryVariables = Exact<{ [key: string]: never }>

export type SearchSchemaQuery = Pick<Query, 'searchSchema'>

export type SearchCompleteQueryVariables = Exact<{
    property: Scalars['String']
    query?: Maybe<SearchInput>
    limit?: Maybe<Scalars['Int']>
}>

export type SearchCompleteQuery = Pick<Query, 'searchComplete'>

export type SearchResultItemsQueryVariables = Exact<{
    input?: Maybe<Array<Maybe<SearchInput>> | Maybe<SearchInput>>
}>

export type SearchResultItemsQuery = { searchResult?: Maybe<Array<Maybe<Pick<SearchResult, 'items'>>>> }

export type SearchResultCountQueryVariables = Exact<{
    input?: Maybe<Array<Maybe<SearchInput>> | Maybe<SearchInput>>
}>

export type SearchResultCountQuery = { searchResult?: Maybe<Array<Maybe<Pick<SearchResult, 'count'>>>> }

export type SearchResultCountAndRelatedCountQueryVariables = Exact<{
    input?: Maybe<Array<Maybe<SearchInput>> | Maybe<SearchInput>>
}>

export type SearchResultCountAndRelatedCountQuery = {
    searchResult?: Maybe<
        Array<
            Maybe<
                Pick<SearchResult, 'count'> & {
                    related?: Maybe<Array<Maybe<Pick<SearchRelatedResult, 'kind' | 'count'>>>>
                }
            >
        >
    >
}

export type SearchResultRelatedCountQueryVariables = Exact<{
    input?: Maybe<Array<Maybe<SearchInput>> | Maybe<SearchInput>>
}>

export type SearchResultRelatedCountQuery = {
    searchResult?: Maybe<Array<Maybe<{ related?: Maybe<Array<Maybe<Pick<SearchRelatedResult, 'kind' | 'count'>>>> }>>>
}

export type SearchResultRelatedItemsQueryVariables = Exact<{
    input?: Maybe<Array<Maybe<SearchInput>> | Maybe<SearchInput>>
}>

export type SearchResultRelatedItemsQuery = {
    searchResult?: Maybe<Array<Maybe<{ related?: Maybe<Array<Maybe<Pick<SearchRelatedResult, 'kind' | 'items'>>>> }>>>
}

export type GetMessagesQueryVariables = Exact<{ [key: string]: never }>

export type GetMessagesQuery = { messages?: Maybe<Array<Maybe<Pick<Message, 'id' | 'kind' | 'description'>>>> }

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
export type SearchSchemaQueryHookResult = ReturnType<typeof useSearchSchemaQuery>
export type SearchSchemaLazyQueryHookResult = ReturnType<typeof useSearchSchemaLazyQuery>
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
    baseOptions: Apollo.QueryHookOptions<SearchCompleteQuery, SearchCompleteQueryVariables>
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
export type SearchCompleteQueryHookResult = ReturnType<typeof useSearchCompleteQuery>
export type SearchCompleteLazyQueryHookResult = ReturnType<typeof useSearchCompleteLazyQuery>
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
export type SearchResultItemsQueryHookResult = ReturnType<typeof useSearchResultItemsQuery>
export type SearchResultItemsLazyQueryHookResult = ReturnType<typeof useSearchResultItemsLazyQuery>
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
export type SearchResultCountQueryHookResult = ReturnType<typeof useSearchResultCountQuery>
export type SearchResultCountLazyQueryHookResult = ReturnType<typeof useSearchResultCountLazyQuery>
export type SearchResultCountQueryResult = Apollo.QueryResult<SearchResultCountQuery, SearchResultCountQueryVariables>
export const SearchResultCountAndRelatedCountDocument = gql`
    query searchResultCountAndRelatedCount($input: [SearchInput]) {
        searchResult: search(input: $input) {
            count
            related {
                kind
                count
            }
        }
    }
`

/**
 * __useSearchResultCountAndRelatedCountQuery__
 *
 * To run a query within a React component, call `useSearchResultCountAndRelatedCountQuery` and pass it any options that fit your needs.
 * When your component renders, `useSearchResultCountAndRelatedCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSearchResultCountAndRelatedCountQuery({
 *   variables: {
 *      input: // value for 'input'
 *   },
 * });
 */
export function useSearchResultCountAndRelatedCountQuery(
    baseOptions?: Apollo.QueryHookOptions<
        SearchResultCountAndRelatedCountQuery,
        SearchResultCountAndRelatedCountQueryVariables
    >
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<SearchResultCountAndRelatedCountQuery, SearchResultCountAndRelatedCountQueryVariables>(
        SearchResultCountAndRelatedCountDocument,
        options
    )
}
export function useSearchResultCountAndRelatedCountLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<
        SearchResultCountAndRelatedCountQuery,
        SearchResultCountAndRelatedCountQueryVariables
    >
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<SearchResultCountAndRelatedCountQuery, SearchResultCountAndRelatedCountQueryVariables>(
        SearchResultCountAndRelatedCountDocument,
        options
    )
}
export type SearchResultCountAndRelatedCountQueryHookResult = ReturnType<
    typeof useSearchResultCountAndRelatedCountQuery
>
export type SearchResultCountAndRelatedCountLazyQueryHookResult = ReturnType<
    typeof useSearchResultCountAndRelatedCountLazyQuery
>
export type SearchResultCountAndRelatedCountQueryResult = Apollo.QueryResult<
    SearchResultCountAndRelatedCountQuery,
    SearchResultCountAndRelatedCountQueryVariables
>
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
export type SearchResultRelatedCountQueryHookResult = ReturnType<typeof useSearchResultRelatedCountQuery>
export type SearchResultRelatedCountLazyQueryHookResult = ReturnType<typeof useSearchResultRelatedCountLazyQuery>
export type SearchResultRelatedCountQueryResult = Apollo.QueryResult<
    SearchResultRelatedCountQuery,
    SearchResultRelatedCountQueryVariables
>
export const SearchResultRelatedItemsDocument = gql`
    query searchResultRelatedItems($input: [SearchInput]) {
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
export type SearchResultRelatedItemsQueryHookResult = ReturnType<typeof useSearchResultRelatedItemsQuery>
export type SearchResultRelatedItemsLazyQueryHookResult = ReturnType<typeof useSearchResultRelatedItemsLazyQuery>
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
export type GetMessagesQueryHookResult = ReturnType<typeof useGetMessagesQuery>
export type GetMessagesLazyQueryHookResult = ReturnType<typeof useGetMessagesLazyQuery>
export type GetMessagesQueryResult = Apollo.QueryResult<GetMessagesQuery, GetMessagesQueryVariables>
