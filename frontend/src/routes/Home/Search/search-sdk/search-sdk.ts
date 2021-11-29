/* Copyright Contributors to the Open Cluster Management project */
import * as Apollo from '@apollo/client'
import { gql } from '@apollo/client'
export type Maybe<T> = T | null
export type InputMaybe<T> = Maybe<T>
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
    applicationSet?: Maybe<Scalars['String']>
    chart?: Maybe<Scalars['String']>
    cluster?: Maybe<Scalars['String']>
    clusterCount?: Maybe<Scalars['JSON']>
    created?: Maybe<Scalars['String']>
    dashboard?: Maybe<Scalars['String']>
    destinationCluster?: Maybe<Scalars['String']>
    destinationName?: Maybe<Scalars['String']>
    destinationNamespace?: Maybe<Scalars['String']>
    destinationServer?: Maybe<Scalars['String']>
    hubChannels?: Maybe<Array<Maybe<Scalars['JSON']>>>
    hubSubscriptions?: Maybe<Array<Maybe<Subscription>>>
    labels?: Maybe<Array<Maybe<Scalars['String']>>>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    path?: Maybe<Scalars['String']>
    repoURL?: Maybe<Scalars['String']>
    targetRevision?: Maybe<Scalars['String']>
}

export enum CacheControlScope {
    Private = 'PRIVATE',
    Public = 'PUBLIC',
}

export type Channel = {
    _uid?: Maybe<Scalars['String']>
    clusterCount?: Maybe<Scalars['JSON']>
    created?: Maybe<Scalars['String']>
    localPlacement?: Maybe<Scalars['Boolean']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    pathname?: Maybe<Scalars['String']>
    subscriptionCount?: Maybe<Scalars['Int']>
    type?: Maybe<Scalars['String']>
}

export type Message = {
    description?: Maybe<Scalars['String']>
    id: Scalars['String']
    kind?: Maybe<Scalars['String']>
}

export type Mutation = {
    deleteSearch?: Maybe<Scalars['JSON']>
    saveSearch?: Maybe<Scalars['JSON']>
}

export type MutationDeleteSearchArgs = {
    resource?: InputMaybe<Scalars['JSON']>
}

export type MutationSaveSearchArgs = {
    resource?: InputMaybe<Scalars['JSON']>
}

export type PlacementRule = {
    _uid?: Maybe<Scalars['String']>
    clusterCount?: Maybe<Scalars['JSON']>
    created?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    replicas?: Maybe<Scalars['Int']>
}

export type Query = {
    applications?: Maybe<Array<Maybe<Application>>>
    channels?: Maybe<Array<Maybe<Channel>>>
    messages?: Maybe<Array<Maybe<Message>>>
    placementRules?: Maybe<Array<Maybe<PlacementRule>>>
    savedSearches?: Maybe<Array<Maybe<UserSearch>>>
    search?: Maybe<Array<Maybe<SearchResult>>>
    searchComplete?: Maybe<Array<Maybe<Scalars['String']>>>
    searchSchema?: Maybe<Scalars['JSON']>
    subscriptions?: Maybe<Array<Maybe<Subscription>>>
}

export type QueryApplicationsArgs = {
    name?: InputMaybe<Scalars['String']>
    namespace?: InputMaybe<Scalars['String']>
}

export type QueryChannelsArgs = {
    name?: InputMaybe<Scalars['String']>
    namespace?: InputMaybe<Scalars['String']>
}

export type QueryPlacementRulesArgs = {
    name?: InputMaybe<Scalars['String']>
    namespace?: InputMaybe<Scalars['String']>
}

export type QuerySearchArgs = {
    input?: InputMaybe<Array<InputMaybe<SearchInput>>>
}

export type QuerySearchCompleteArgs = {
    limit?: InputMaybe<Scalars['Int']>
    property: Scalars['String']
    query?: InputMaybe<SearchInput>
}

export type QuerySubscriptionsArgs = {
    name?: InputMaybe<Scalars['String']>
    namespace?: InputMaybe<Scalars['String']>
}

export type SearchFilter = {
    property: Scalars['String']
    values?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type SearchInput = {
    filters?: InputMaybe<Array<InputMaybe<SearchFilter>>>
    keywords?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
    limit?: InputMaybe<Scalars['Int']>
    relatedKinds?: InputMaybe<Array<InputMaybe<Scalars['String']>>>
}

export type SearchRelatedResult = {
    count?: Maybe<Scalars['Int']>
    items?: Maybe<Scalars['JSON']>
    kind: Scalars['String']
}

export type SearchResult = {
    count?: Maybe<Scalars['Int']>
    items?: Maybe<Scalars['JSON']>
    related?: Maybe<Array<Maybe<SearchRelatedResult>>>
}

export type Subscription = {
    _uid?: Maybe<Scalars['String']>
    appCount?: Maybe<Scalars['Int']>
    channel?: Maybe<Scalars['String']>
    clusterCount?: Maybe<Scalars['JSON']>
    created?: Maybe<Scalars['String']>
    localPlacement?: Maybe<Scalars['Boolean']>
    name?: Maybe<Scalars['String']>
    namespace?: Maybe<Scalars['String']>
    status?: Maybe<Scalars['String']>
    timeWindow?: Maybe<Scalars['String']>
}

export type UserSearch = {
    description?: Maybe<Scalars['String']>
    id?: Maybe<Scalars['String']>
    name?: Maybe<Scalars['String']>
    searchText?: Maybe<Scalars['String']>
}

export type GetApplicationsQueryVariables = Exact<{ [key: string]: never }>

export type GetApplicationsQuery = {
    applications?:
        | Array<
              | {
                    _uid?: string | null | undefined
                    apiVersion?: string | null | undefined
                    created?: string | null | undefined
                    dashboard?: string | null | undefined
                    labels?: Array<string | null | undefined> | null | undefined
                    name?: string | null | undefined
                    namespace?: string | null | undefined
                    cluster?: string | null | undefined
                    clusterCount?: any | null | undefined
                    hubChannels?: Array<any | null | undefined> | null | undefined
                    applicationSet?: string | null | undefined
                    destinationName?: string | null | undefined
                    destinationServer?: string | null | undefined
                    destinationCluster?: string | null | undefined
                    destinationNamespace?: string | null | undefined
                    repoURL?: string | null | undefined
                    path?: string | null | undefined
                    chart?: string | null | undefined
                    targetRevision?: string | null | undefined
                    hubSubscriptions?:
                        | Array<
                              | {
                                    _uid?: string | null | undefined
                                    name?: string | null | undefined
                                    localPlacement?: boolean | null | undefined
                                    timeWindow?: string | null | undefined
                                    status?: string | null | undefined
                                    channel?: string | null | undefined
                                }
                              | null
                              | undefined
                          >
                        | null
                        | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type GetSubscriptionsQueryVariables = Exact<{ [key: string]: never }>

export type GetSubscriptionsQuery = {
    subscriptions?:
        | Array<
              | {
                    _uid?: string | null | undefined
                    name?: string | null | undefined
                    namespace?: string | null | undefined
                    created?: string | null | undefined
                    timeWindow?: string | null | undefined
                    localPlacement?: boolean | null | undefined
                    status?: string | null | undefined
                    channel?: string | null | undefined
                    appCount?: number | null | undefined
                    clusterCount?: any | null | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type GetPlacementRulesQueryVariables = Exact<{ [key: string]: never }>

export type GetPlacementRulesQuery = {
    placementRules?:
        | Array<
              | {
                    _uid?: string | null | undefined
                    name?: string | null | undefined
                    namespace?: string | null | undefined
                    created?: string | null | undefined
                    replicas?: number | null | undefined
                    clusterCount?: any | null | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type GetChannelsQueryVariables = Exact<{ [key: string]: never }>

export type GetChannelsQuery = {
    channels?:
        | Array<
              | {
                    _uid?: string | null | undefined
                    name?: string | null | undefined
                    namespace?: string | null | undefined
                    created?: string | null | undefined
                    type?: string | null | undefined
                    pathname?: string | null | undefined
                    localPlacement?: boolean | null | undefined
                    subscriptionCount?: number | null | undefined
                    clusterCount?: any | null | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type SaveSearchMutationVariables = Exact<{
    resource: Scalars['JSON']
}>

export type SaveSearchMutation = { saveSearch?: any | null | undefined }

export type DeleteSearchMutationVariables = Exact<{
    resource: Scalars['JSON']
}>

export type DeleteSearchMutation = { deleteSearch?: any | null | undefined }

export type SavedSearchesQueryVariables = Exact<{ [key: string]: never }>

export type SavedSearchesQuery = {
    items?:
        | Array<
              | {
                    id?: string | null | undefined
                    name?: string | null | undefined
                    description?: string | null | undefined
                    searchText?: string | null | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type SearchSchemaQueryVariables = Exact<{ [key: string]: never }>

export type SearchSchemaQuery = { searchSchema?: any | null | undefined }

export type SearchCompleteQueryVariables = Exact<{
    property: Scalars['String']
    query?: InputMaybe<SearchInput>
    limit?: InputMaybe<Scalars['Int']>
}>

export type SearchCompleteQuery = { searchComplete?: Array<string | null | undefined> | null | undefined }

export type SearchResultItemsQueryVariables = Exact<{
    input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultItemsQuery = {
    searchResult?: Array<{ items?: any | null | undefined } | null | undefined> | null | undefined
}

export type SearchResultCountQueryVariables = Exact<{
    input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultCountQuery = {
    searchResult?: Array<{ count?: number | null | undefined } | null | undefined> | null | undefined
}

export type SearchResultCountAndRelatedCountQueryVariables = Exact<{
    input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultCountAndRelatedCountQuery = {
    searchResult?:
        | Array<
              | {
                    count?: number | null | undefined
                    related?:
                        | Array<{ kind: string; count?: number | null | undefined } | null | undefined>
                        | null
                        | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type SearchResultRelatedCountQueryVariables = Exact<{
    input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultRelatedCountQuery = {
    searchResult?:
        | Array<
              | {
                    related?:
                        | Array<{ kind: string; count?: number | null | undefined } | null | undefined>
                        | null
                        | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type SearchResultRelatedItemsQueryVariables = Exact<{
    input?: InputMaybe<Array<InputMaybe<SearchInput>> | InputMaybe<SearchInput>>
}>

export type SearchResultRelatedItemsQuery = {
    searchResult?:
        | Array<
              | {
                    related?:
                        | Array<{ kind: string; items?: any | null | undefined } | null | undefined>
                        | null
                        | undefined
                }
              | null
              | undefined
          >
        | null
        | undefined
}

export type GetMessagesQueryVariables = Exact<{ [key: string]: never }>

export type GetMessagesQuery = {
    messages?:
        | Array<
              | { id: string; kind?: string | null | undefined; description?: string | null | undefined }
              | null
              | undefined
          >
        | null
        | undefined
}

export const GetApplicationsDocument = gql`
    query getApplications {
        applications {
            _uid
            apiVersion
            created
            dashboard
            labels
            name
            namespace
            cluster
            clusterCount
            hubChannels
            hubSubscriptions {
                _uid
                name
                localPlacement
                timeWindow
                status
                channel
            }
            applicationSet
            destinationName
            destinationServer
            destinationCluster
            destinationNamespace
            repoURL
            path
            chart
            targetRevision
        }
    }
`

/**
 * __useGetApplicationsQuery__
 *
 * To run a query within a React component, call `useGetApplicationsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetApplicationsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetApplicationsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetApplicationsQuery(
    baseOptions?: Apollo.QueryHookOptions<GetApplicationsQuery, GetApplicationsQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<GetApplicationsQuery, GetApplicationsQueryVariables>(GetApplicationsDocument, options)
}
export function useGetApplicationsLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<GetApplicationsQuery, GetApplicationsQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<GetApplicationsQuery, GetApplicationsQueryVariables>(GetApplicationsDocument, options)
}
export type GetApplicationsQueryHookResult = ReturnType<typeof useGetApplicationsQuery>
export type GetApplicationsLazyQueryHookResult = ReturnType<typeof useGetApplicationsLazyQuery>
export type GetApplicationsQueryResult = Apollo.QueryResult<GetApplicationsQuery, GetApplicationsQueryVariables>
export const GetSubscriptionsDocument = gql`
    query getSubscriptions {
        subscriptions {
            _uid
            name
            namespace
            created
            timeWindow
            localPlacement
            status
            channel
            appCount
            clusterCount
        }
    }
`

/**
 * __useGetSubscriptionsQuery__
 *
 * To run a query within a React component, call `useGetSubscriptionsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetSubscriptionsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetSubscriptionsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetSubscriptionsQuery(
    baseOptions?: Apollo.QueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>(GetSubscriptionsDocument, options)
}
export function useGetSubscriptionsLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>(GetSubscriptionsDocument, options)
}
export type GetSubscriptionsQueryHookResult = ReturnType<typeof useGetSubscriptionsQuery>
export type GetSubscriptionsLazyQueryHookResult = ReturnType<typeof useGetSubscriptionsLazyQuery>
export type GetSubscriptionsQueryResult = Apollo.QueryResult<GetSubscriptionsQuery, GetSubscriptionsQueryVariables>
export const GetPlacementRulesDocument = gql`
    query getPlacementRules {
        placementRules {
            _uid
            name
            namespace
            created
            replicas
            clusterCount
        }
    }
`

/**
 * __useGetPlacementRulesQuery__
 *
 * To run a query within a React component, call `useGetPlacementRulesQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetPlacementRulesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetPlacementRulesQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetPlacementRulesQuery(
    baseOptions?: Apollo.QueryHookOptions<GetPlacementRulesQuery, GetPlacementRulesQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<GetPlacementRulesQuery, GetPlacementRulesQueryVariables>(GetPlacementRulesDocument, options)
}
export function useGetPlacementRulesLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<GetPlacementRulesQuery, GetPlacementRulesQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<GetPlacementRulesQuery, GetPlacementRulesQueryVariables>(
        GetPlacementRulesDocument,
        options
    )
}
export type GetPlacementRulesQueryHookResult = ReturnType<typeof useGetPlacementRulesQuery>
export type GetPlacementRulesLazyQueryHookResult = ReturnType<typeof useGetPlacementRulesLazyQuery>
export type GetPlacementRulesQueryResult = Apollo.QueryResult<GetPlacementRulesQuery, GetPlacementRulesQueryVariables>
export const GetChannelsDocument = gql`
    query getChannels {
        channels {
            _uid
            name
            namespace
            created
            type
            pathname
            localPlacement
            subscriptionCount
            clusterCount
        }
    }
`

/**
 * __useGetChannelsQuery__
 *
 * To run a query within a React component, call `useGetChannelsQuery` and pass it any options that fit your needs.
 * When your component renders, `useGetChannelsQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useGetChannelsQuery({
 *   variables: {
 *   },
 * });
 */
export function useGetChannelsQuery(
    baseOptions?: Apollo.QueryHookOptions<GetChannelsQuery, GetChannelsQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<GetChannelsQuery, GetChannelsQueryVariables>(GetChannelsDocument, options)
}
export function useGetChannelsLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<GetChannelsQuery, GetChannelsQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<GetChannelsQuery, GetChannelsQueryVariables>(GetChannelsDocument, options)
}
export type GetChannelsQueryHookResult = ReturnType<typeof useGetChannelsQuery>
export type GetChannelsLazyQueryHookResult = ReturnType<typeof useGetChannelsLazyQuery>
export type GetChannelsQueryResult = Apollo.QueryResult<GetChannelsQuery, GetChannelsQueryVariables>
export const SaveSearchDocument = gql`
    mutation saveSearch($resource: JSON!) {
        saveSearch(resource: $resource)
    }
`
export type SaveSearchMutationFn = Apollo.MutationFunction<SaveSearchMutation, SaveSearchMutationVariables>

/**
 * __useSaveSearchMutation__
 *
 * To run a mutation, you first call `useSaveSearchMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useSaveSearchMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [saveSearchMutation, { data, loading, error }] = useSaveSearchMutation({
 *   variables: {
 *      resource: // value for 'resource'
 *   },
 * });
 */
export function useSaveSearchMutation(
    baseOptions?: Apollo.MutationHookOptions<SaveSearchMutation, SaveSearchMutationVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<SaveSearchMutation, SaveSearchMutationVariables>(SaveSearchDocument, options)
}
export type SaveSearchMutationHookResult = ReturnType<typeof useSaveSearchMutation>
export type SaveSearchMutationResult = Apollo.MutationResult<SaveSearchMutation>
export type SaveSearchMutationOptions = Apollo.BaseMutationOptions<SaveSearchMutation, SaveSearchMutationVariables>
export const DeleteSearchDocument = gql`
    mutation deleteSearch($resource: JSON!) {
        deleteSearch(resource: $resource)
    }
`
export type DeleteSearchMutationFn = Apollo.MutationFunction<DeleteSearchMutation, DeleteSearchMutationVariables>

/**
 * __useDeleteSearchMutation__
 *
 * To run a mutation, you first call `useDeleteSearchMutation` within a React component and pass it any options that fit your needs.
 * When your component renders, `useDeleteSearchMutation` returns a tuple that includes:
 * - A mutate function that you can call at any time to execute the mutation
 * - An object with fields that represent the current status of the mutation's execution
 *
 * @param baseOptions options that will be passed into the mutation, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options-2;
 *
 * @example
 * const [deleteSearchMutation, { data, loading, error }] = useDeleteSearchMutation({
 *   variables: {
 *      resource: // value for 'resource'
 *   },
 * });
 */
export function useDeleteSearchMutation(
    baseOptions?: Apollo.MutationHookOptions<DeleteSearchMutation, DeleteSearchMutationVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useMutation<DeleteSearchMutation, DeleteSearchMutationVariables>(DeleteSearchDocument, options)
}
export type DeleteSearchMutationHookResult = ReturnType<typeof useDeleteSearchMutation>
export type DeleteSearchMutationResult = Apollo.MutationResult<DeleteSearchMutation>
export type DeleteSearchMutationOptions = Apollo.BaseMutationOptions<
    DeleteSearchMutation,
    DeleteSearchMutationVariables
>
export const SavedSearchesDocument = gql`
    query savedSearches {
        items: savedSearches {
            id
            name
            description
            searchText
        }
    }
`

/**
 * __useSavedSearchesQuery__
 *
 * To run a query within a React component, call `useSavedSearchesQuery` and pass it any options that fit your needs.
 * When your component renders, `useSavedSearchesQuery` returns an object from Apollo Client that contains loading, error, and data properties
 * you can use to render your UI.
 *
 * @param baseOptions options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;
 *
 * @example
 * const { data, loading, error } = useSavedSearchesQuery({
 *   variables: {
 *   },
 * });
 */
export function useSavedSearchesQuery(
    baseOptions?: Apollo.QueryHookOptions<SavedSearchesQuery, SavedSearchesQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useQuery<SavedSearchesQuery, SavedSearchesQueryVariables>(SavedSearchesDocument, options)
}
export function useSavedSearchesLazyQuery(
    baseOptions?: Apollo.LazyQueryHookOptions<SavedSearchesQuery, SavedSearchesQueryVariables>
) {
    const options = { ...defaultOptions, ...baseOptions }
    return Apollo.useLazyQuery<SavedSearchesQuery, SavedSearchesQueryVariables>(SavedSearchesDocument, options)
}
export type SavedSearchesQueryHookResult = ReturnType<typeof useSavedSearchesQuery>
export type SavedSearchesLazyQueryHookResult = ReturnType<typeof useSavedSearchesLazyQuery>
export type SavedSearchesQueryResult = Apollo.QueryResult<SavedSearchesQuery, SavedSearchesQueryVariables>
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
