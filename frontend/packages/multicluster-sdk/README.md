# Multicluster SDK for OpenShift Console

<!-- Copyright Contributors to the Open Cluster Management project -->

A React SDK for working with multicluster OpenShift/Kubernetes resources from the OpenShift Console.

This SDK provides extensions and APIs that dynamic plugins can use to leverage multicluster capabilities provided by Red Hat Advanced Cluster Management (RHACM). It aims to provide similar functionality to the dynamic plugin(<https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk>) SDK but for multicluster scenarios.

## Prerequisites

- Red Hat Advanced Cluster Management for Kubernetes 2.15+

## Installation

```bash
npm install @stolostron/multicluster-sdk

```

## Usage

The multicluster SDK provides components and hooks that enable your dynamic plugins to work with resources across multiple clusters.

## Basic Setup

Setup depends on your usage scenarios.
- For pages that deal with a single cluster at a time, you can replace hooks, functions, and components from the dynamic plugin SDK with their drop-in replacements from the multicluster SDK. When a compatible version of RHACM is installed on the cluster and a cluster name is given in the arguments or properties of an SDK API, an implementation that works with data from the specified managed cluster will be used. Otherwise, we fall back to the single cluster implementation from the dynamic plugin SDK and work with data on the local cluster.
- For other APIs that work with multiple clusters at a time (such as functions that leverage RHACM's search capabilities) and do not have an equivalent in the dyanamic plugin SDK, you can call the `useIsFleetAvailable` hook to check if support is available. Because it is not permitted to call hooks conditionally, if you are using these multicluster SDK hooks, then you must call them with arguments that render the hook in a disabled state when fleet support is unavailable. Otherwise you will get empty results or errors. See the [API Reference](#api-reference) for details.
- If you have entire [routes](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md#consolepageroute) or [navigation items](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/console-extensions.md#consolenavigationhref) or any other type of dynamic plugin extension that should only be enabled when multicluster support is available, you can make them conditional on a flag. RHACM enables flags indicating that it provides the prerequisites of the multicluster SDK. This is a versioned flag and within any version of the multicluster SDK, its name is available as the `REQUIRED_PROVIDER_FLAG` constant.

## Working with Resources

// Example code will be added after API stabilization


## API Reference

<!-- TSDOC_START -->

## :toolbox: Functions

- [buildResourceURL](#gear-buildresourceurl)
- [convertStringToQuery](#gear-convertstringtoquery)
- [createEquals](#gear-createequals)
- [fleetK8sCreate](#gear-fleetk8screate)
- [fleetK8sDelete](#gear-fleetk8sdelete)
- [fleetK8sGet](#gear-fleetk8sget)
- [fleetK8sPatch](#gear-fleetk8spatch)
- [fleetK8sUpdate](#gear-fleetk8supdate)
- [fleetWatch](#gear-fleetwatch)
- [getBackendUrl](#gear-getbackendurl)
- [getCookie](#gear-getcookie)
- [getFleetK8sAPIPath](#gear-getfleetk8sapipath)
- [getFleetPrometheusURL](#gear-getfleetprometheusurl)
- [getResourcePath](#gear-getresourcepath)
- [getResourceURL](#gear-getresourceurl)
- [handleWebsocketEvent](#gear-handlewebsocketevent)
- [isResourceDetails](#gear-isresourcedetails)
- [isResourceTab](#gear-isresourcetab)
- [requirementToString](#gear-requirementtostring)
- [selectorToString](#gear-selectortostring)
- [toRequirements](#gear-torequirements)
- [useFleetAccessReview](#gear-usefleetaccessreview)
- [useFleetClusterNames](#gear-usefleetclusternames)
- [useFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetPrometheusPoll](#gear-usefleetprometheuspoll)
- [useGetMessagesLazyQuery](#gear-usegetmessageslazyquery)
- [useGetMessagesQuery](#gear-usegetmessagesquery)
- [useGetMessagesSuspenseQuery](#gear-usegetmessagessuspensequery)
- [useHubClusterName](#gear-usehubclustername)
- [useMulticlusterSearchWatch](#gear-usemulticlustersearchwatch)
- [usePoll](#gear-usepoll)
- [useSafeFetch](#gear-usesafefetch)
- [useSearchCompleteLazyQuery](#gear-usesearchcompletelazyquery)
- [useSearchCompleteQuery](#gear-usesearchcompletequery)
- [useSearchCompleteSuspenseQuery](#gear-usesearchcompletesuspensequery)
- [useSearchResultCountLazyQuery](#gear-usesearchresultcountlazyquery)
- [useSearchResultCountQuery](#gear-usesearchresultcountquery)
- [useSearchResultCountSuspenseQuery](#gear-usesearchresultcountsuspensequery)
- [useSearchResultItemsAndRelatedItemsLazyQuery](#gear-usesearchresultitemsandrelateditemslazyquery)
- [useSearchResultItemsAndRelatedItemsQuery](#gear-usesearchresultitemsandrelateditemsquery)
- [useSearchResultItemsAndRelatedItemsSuspenseQuery](#gear-usesearchresultitemsandrelateditemssuspensequery)
- [useSearchResultItemsLazyQuery](#gear-usesearchresultitemslazyquery)
- [useSearchResultItemsQuery](#gear-usesearchresultitemsquery)
- [useSearchResultItemsSuspenseQuery](#gear-usesearchresultitemssuspensequery)
- [useSearchResultRelatedCountLazyQuery](#gear-usesearchresultrelatedcountlazyquery)
- [useSearchResultRelatedCountQuery](#gear-usesearchresultrelatedcountquery)
- [useSearchResultRelatedCountSuspenseQuery](#gear-usesearchresultrelatedcountsuspensequery)
- [useSearchResultRelatedItemsLazyQuery](#gear-usesearchresultrelateditemslazyquery)
- [useSearchResultRelatedItemsQuery](#gear-usesearchresultrelateditemsquery)
- [useSearchResultRelatedItemsSuspenseQuery](#gear-usesearchresultrelateditemssuspensequery)
- [useSearchSchemaLazyQuery](#gear-usesearchschemalazyquery)
- [useSearchSchemaQuery](#gear-usesearchschemaquery)
- [useSearchSchemaSuspenseQuery](#gear-usesearchschemasuspensequery)
- [useURLPoll](#gear-useurlpoll)

### :gear: buildResourceURL

| Function | Type |
| ---------- | ---------- |
| `buildResourceURL` | `(params: { model: K8sModel; ns?: string or undefined; name?: string or undefined; cluster?: string or undefined; queryParams?: QueryParams or undefined; basePath: string; }) => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L110)

### :gear: convertStringToQuery

| Function | Type |
| ---------- | ---------- |
| `convertStringToQuery` | `(searchText: string, queryResultLimit: number) => { keywords: string[]; filters: { property: string; values: string[]; }[]; limit: number; }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/searchUtils.ts#L2)

### :gear: createEquals

| Function | Type |
| ---------- | ---------- |
| `createEquals` | `(key: string, value: string) => MatchExpression` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/utils/requirements.ts#L42)

### :gear: fleetK8sCreate

| Function | Type |
| ---------- | ---------- |
| `fleetK8sCreate` | `<R extends K8sResourceCommon>(options: OptionsCreate<R>) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L187)

### :gear: fleetK8sDelete

| Function | Type |
| ---------- | ---------- |
| `fleetK8sDelete` | `<R extends K8sResourceCommon>(options: OptionsDelete<R>) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L209)

### :gear: fleetK8sGet

| Function | Type |
| ---------- | ---------- |
| `fleetK8sGet` | `<R extends K8sResourceCommon>(options: OptionsGet) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L128)

### :gear: fleetK8sPatch

| Function | Type |
| ---------- | ---------- |
| `fleetK8sPatch` | `<R extends K8sResourceCommon>(options: OptionsPatch<R>) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L160)

### :gear: fleetK8sUpdate

| Function | Type |
| ---------- | ---------- |
| `fleetK8sUpdate` | `<R extends K8sResourceCommon>(options: OptionsUpdate<R>) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L140)

### :gear: fleetWatch

| Function | Type |
| ---------- | ---------- |
| `fleetWatch` | `(model: K8sModel, query: { labelSelector?: Selector or undefined; resourceVersion?: string or undefined; ns?: string or undefined; fieldSelector?: string or undefined; cluster?: string or undefined; } or undefined, backendURL: string) => WebSocket` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L235)

### :gear: getBackendUrl

| Function | Type |
| ---------- | ---------- |
| `getBackendUrl` | `() => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L74)

### :gear: getCookie

| Function | Type |
| ---------- | ---------- |
| `getCookie` | `(name: string) => string or undefined` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/searchUtils.ts#L21)

### :gear: getFleetK8sAPIPath

| Function | Type |
| ---------- | ---------- |
| `getFleetK8sAPIPath` | `(cluster?: string or undefined) => Promise<string>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L20)

### :gear: getFleetPrometheusURL

| Function | Type |
| ---------- | ---------- |
| `getFleetPrometheusURL` | `(props: PrometheusURLProps, basePath?: string) => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/utils.ts#L44)

### :gear: getResourcePath

| Function | Type |
| ---------- | ---------- |
| `getResourcePath` | `(model: K8sModel, options: Options) => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L88)

### :gear: getResourceURL

| Function | Type |
| ---------- | ---------- |
| `getResourceURL` | `GetResourceURL` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L123)

### :gear: handleWebsocketEvent

| Function | Type |
| ---------- | ---------- |
| `handleWebsocketEvent` | `<R>(event: any, requestPath: string, setData: (data: R) => void, isList: boolean or undefined, fleetResourceCache: Record<string, any>, cluster: string) => void` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/use-fleet-k8s-watch-resource/utils.ts#L2)

### :gear: isResourceDetails

| Function | Type |
| ---------- | ---------- |
| `isResourceDetails` | `(e: Extension) => e is ResourceDetails` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L48)

### :gear: isResourceTab

| Function | Type |
| ---------- | ---------- |
| `isResourceTab` | `(e: Extension) => e is ResourceDetails` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L52)

### :gear: requirementToString

| Function | Type |
| ---------- | ---------- |
| `requirementToString` | `(requirement: MatchExpression) => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/utils/requirements.ts#L6)

### :gear: selectorToString

| Function | Type |
| ---------- | ---------- |
| `selectorToString` | `(selector: Selector) => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/utils/requirements.ts#L65)

### :gear: toRequirements

| Function | Type |
| ---------- | ---------- |
| `toRequirements` | `(selector?: Selector) => MatchExpression[]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/utils/requirements.ts#L48)

### :gear: useFleetAccessReview

Hook that provides information about user access to a given resource.

| Function | Type |
| ---------- | ---------- |
| `useFleetAccessReview` | `({ group, resource, subresource, verb, name, namespace, cluster, }: FleetAccessReviewResourceAttributes) => [boolean, boolean]` |

Parameters:

* `resourceAttributes`: resource attributes for access review
* `resourceAttributes.group`: the name of the group to check access for
* `resourceAttributes.resource`: the name of the resource to check access for
* `resourceAttributes.subresource`: the name of the subresource to check access for
* `resourceAttributes.verb`: the "action" to preform either 'create' | 'get' | 'list' | 'update' | 'patch' | 'delete' | 'deletecollection' | 'watch' | 'impersonate'
* `resourceAttributes.name`: the name
* `resourceAttributes.namespace`: the namespace
* `resourceAttributes.cluster`: the cluster name to find the resource in


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetAccessReview/access-review.ts#L27)

### :gear: useFleetClusterNames

| Function | Type |
| ---------- | ---------- |
| `useFleetClusterNames` | `UseFleetClusterNames` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetClusterNames.ts#L6)

### :gear: useFleetK8sAPIPath

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sAPIPath` | `UseFleetK8sAPIPath` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L8)

### :gear: useFleetK8sWatchResource

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sWatchResource` | `<R extends FleetK8sResourceCommon or FleetK8sResourceCommon[]>(hubClusterName: string, initResource: FleetWatchK8sResource or null) => WatchK8sResult<R> or [...]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/use-fleet-k8s-watch-resource/use-fleet-k8s-watch-resource.ts#L33)

### :gear: useFleetK8sWatchResource

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sWatchResource` | `UseFleetK8sWatchResource` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sWatchResource.ts#L6)

### :gear: useFleetPrometheusPoll

| Function | Type |
| ---------- | ---------- |
| `useFleetPrometheusPoll` | `UsePrometheusPoll` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/index.ts#L13)

### :gear: useGetMessagesLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useGetMessagesLazyQuery` | `(baseOptions?: LazyQueryHookOptions<GetMessagesQuery, Exact<{ [key: string]: never; }>> or undefined) => LazyQueryResultTuple<GetMessagesQuery, Exact<...>>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L657)

### :gear: useGetMessagesQuery

__useGetMessagesQuery__

To run a query within a React component, call `useGetMessagesQuery` and pass it any options that fit your needs.
When your component renders, `useGetMessagesQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useGetMessagesQuery` | `(baseOptions?: QueryHookOptions<GetMessagesQuery, Exact<{ [key: string]: never; }>> or undefined) => QueryResult<GetMessagesQuery, Exact<...>>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useGetMessagesQuery({
  variables: {
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L651)

### :gear: useGetMessagesSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useGetMessagesSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<GetMessagesQuery, Exact<{ [key: string]: never; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L663)

### :gear: useHubClusterName

| Function | Type |
| ---------- | ---------- |
| `useHubClusterName` | `UseHubClusterName` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useHubClusterName.ts#L7)

### :gear: useMulticlusterSearchWatch

| Function | Type |
| ---------- | ---------- |
| `useMulticlusterSearchWatch` | `UseMulticlusterSearchWatch` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/useMulticlusterSearchWatch.ts#L9)

### :gear: usePoll

| Function | Type |
| ---------- | ---------- |
| `usePoll` | `(callback: any, delay: number, ...dependencies: any[]) => void` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/usePoll.ts#L6)

### :gear: useSafeFetch

| Function | Type |
| ---------- | ---------- |
| `useSafeFetch` | `() => (url: string) => Promise<any>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/useSafeFetch.ts#L5)

### :gear: useSearchCompleteLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchCompleteLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchCompleteQuery, Exact<{ property: string; query?: InputMaybe<SearchInput> or undefined; limit?: InputMaybe<number> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L293)

### :gear: useSearchCompleteQuery

__useSearchCompleteQuery__

To run a query within a React component, call `useSearchCompleteQuery` and pass it any options that fit your needs.
When your component renders, `useSearchCompleteQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchCompleteQuery` | `(baseOptions: QueryHookOptions<SearchCompleteQuery, Exact<{ property: string; query?: InputMaybe<SearchInput> or undefined; limit?: InputMaybe<number> or undefined; }>> and ({ ...; } or { ...; })) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchCompleteQuery({
  variables: {
     property: // value for 'property'
     query: // value for 'query'
     limit: // value for 'limit'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L286)

### :gear: useSearchCompleteSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchCompleteSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchCompleteQuery, Exact<{ property: string; query?: InputMaybe<SearchInput> or undefined; limit?: InputMaybe<number> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L299)

### :gear: useSearchResultCountLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultCountLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchResultCountQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L393)

### :gear: useSearchResultCountQuery

__useSearchResultCountQuery__

To run a query within a React component, call `useSearchResultCountQuery` and pass it any options that fit your needs.
When your component renders, `useSearchResultCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchResultCountQuery` | `(baseOptions?: QueryHookOptions<SearchResultCountQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchResultCountQuery({
  variables: {
     input: // value for 'input'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L387)

### :gear: useSearchResultCountSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultCountSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchResultCountQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L402)

### :gear: useSearchResultItemsAndRelatedItemsLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultItemsAndRelatedItemsLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchResultItemsAndRelatedItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L522)

### :gear: useSearchResultItemsAndRelatedItemsQuery

__useSearchResultItemsAndRelatedItemsQuery__

To run a query within a React component, call `useSearchResultItemsAndRelatedItemsQuery` and pass it any options that fit your needs.
When your component renders, `useSearchResultItemsAndRelatedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchResultItemsAndRelatedItemsQuery` | `(baseOptions?: QueryHookOptions<SearchResultItemsAndRelatedItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchResultItemsAndRelatedItemsQuery({
  variables: {
     input: // value for 'input'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L510)

### :gear: useSearchResultItemsAndRelatedItemsSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultItemsAndRelatedItemsSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchResultItemsAndRelatedItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<...>[]> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L534)

### :gear: useSearchResultItemsLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultItemsLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchResultItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L339)

### :gear: useSearchResultItemsQuery

__useSearchResultItemsQuery__

To run a query within a React component, call `useSearchResultItemsQuery` and pass it any options that fit your needs.
When your component renders, `useSearchResultItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchResultItemsQuery` | `(baseOptions?: QueryHookOptions<SearchResultItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchResultItemsQuery({
  variables: {
     input: // value for 'input'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L333)

### :gear: useSearchResultItemsSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultItemsSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchResultItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L348)

### :gear: useSearchResultRelatedCountLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultRelatedCountLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchResultRelatedCountQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L453)

### :gear: useSearchResultRelatedCountQuery

__useSearchResultRelatedCountQuery__

To run a query within a React component, call `useSearchResultRelatedCountQuery` and pass it any options that fit your needs.
When your component renders, `useSearchResultRelatedCountQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchResultRelatedCountQuery` | `(baseOptions?: QueryHookOptions<SearchResultRelatedCountQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchResultRelatedCountQuery({
  variables: {
     input: // value for 'input'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L444)

### :gear: useSearchResultRelatedCountSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultRelatedCountSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchResultRelatedCountQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L462)

### :gear: useSearchResultRelatedItemsLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultRelatedItemsLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchResultRelatedItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L597)

### :gear: useSearchResultRelatedItemsQuery

__useSearchResultRelatedItemsQuery__

To run a query within a React component, call `useSearchResultRelatedItemsQuery` and pass it any options that fit your needs.
When your component renders, `useSearchResultRelatedItemsQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchResultRelatedItemsQuery` | `(baseOptions?: QueryHookOptions<SearchResultRelatedItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchResultRelatedItemsQuery({
  variables: {
     input: // value for 'input'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L588)

### :gear: useSearchResultRelatedItemsSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchResultRelatedItemsSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchResultRelatedItemsQuery, Exact<{ input?: InputMaybe<InputMaybe<SearchInput> or InputMaybe<SearchInput>[]> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L606)

### :gear: useSearchSchemaLazyQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchSchemaLazyQuery` | `(baseOptions?: LazyQueryHookOptions<SearchSchemaQuery, Exact<{ query?: InputMaybe<SearchInput> or undefined; }>> or undefined) => LazyQueryResultTuple<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L246)

### :gear: useSearchSchemaQuery

__useSearchSchemaQuery__

To run a query within a React component, call `useSearchSchemaQuery` and pass it any options that fit your needs.
When your component renders, `useSearchSchemaQuery` returns an object from Apollo Client that contains loading, error, and data properties
you can use to render your UI.

| Function | Type |
| ---------- | ---------- |
| `useSearchSchemaQuery` | `(baseOptions?: QueryHookOptions<SearchSchemaQuery, Exact<{ query?: InputMaybe<SearchInput> or undefined; }>> or undefined) => QueryResult<...>` |

Parameters:

* `baseOptions`: options that will be passed into the query, supported options are listed on: https://www.apollographql.com/docs/react/api/react-hooks/#options;


Examples:

const { data, loading, error } = useSearchSchemaQuery({
  variables: {
     query: // value for 'query'
  },
});


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L240)

### :gear: useSearchSchemaSuspenseQuery

| Function | Type |
| ---------- | ---------- |
| `useSearchSchemaSuspenseQuery` | `(baseOptions?: unique symbol or SuspenseQueryHookOptions<SearchSchemaQuery, Exact<{ query?: InputMaybe<SearchInput> or undefined; }>> or undefined) => UseSuspenseQueryResult<...>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L252)

### :gear: useURLPoll

| Function | Type |
| ---------- | ---------- |
| `useURLPoll` | `UseURLPoll` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/useURLPoll.ts#L11)


## :wrench: Constants

- [ALERTMANAGER_BASE_PATH](#gear-alertmanager_base_path)
- [ALERTMANAGER_TENANCY_BASE_PATH](#gear-alertmanager_tenancy_base_path)
- [ALERTMANAGER_USER_WORKLOAD_BASE_PATH](#gear-alertmanager_user_workload_base_path)
- [BASE_FLEET_SEARCH_PATH](#gear-base_fleet_search_path)
- [BASE_K8S_API_PATH](#gear-base_k8s_api_path)
- [checkAccess](#gear-checkaccess)
- [DEFAULT_PROMETHEUS_SAMPLES](#gear-default_prometheus_samples)
- [DEFAULT_PROMETHEUS_TIMESPAN](#gear-default_prometheus_timespan)
- [GetMessagesDocument](#gear-getmessagesdocument)
- [LOCAL_CLUSTER_LABEL](#gear-local_cluster_label)
- [MANAGED_CLUSTER_API_PATH](#gear-managed_cluster_api_path)
- [ManagedClusterListGroupVersionKind](#gear-managedclusterlistgroupversionkind)
- [ManagedClusterModel](#gear-managedclustermodel)
- [PROMETHEUS_BASE_PATH](#gear-prometheus_base_path)
- [PROMETHEUS_TENANCY_BASE_PATH](#gear-prometheus_tenancy_base_path)
- [searchClient](#gear-searchclient)
- [SearchCompleteDocument](#gear-searchcompletedocument)
- [SearchResultCountDocument](#gear-searchresultcountdocument)
- [SearchResultItemsAndRelatedItemsDocument](#gear-searchresultitemsandrelateditemsdocument)
- [SearchResultItemsDocument](#gear-searchresultitemsdocument)
- [SearchResultRelatedCountDocument](#gear-searchresultrelatedcountdocument)
- [SearchResultRelatedItemsDocument](#gear-searchresultrelateditemsdocument)
- [SearchSchemaDocument](#gear-searchschemadocument)
- [SelfSubjectAccessReviewModel](#gear-selfsubjectaccessreviewmodel)
- [URL_POLL_DEFAULT_DELAY](#gear-url_poll_default_delay)

### :gear: ALERTMANAGER_BASE_PATH

| Constant | Type |
| ---------- | ---------- |
| `ALERTMANAGER_BASE_PATH` | `any` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L4)

### :gear: ALERTMANAGER_TENANCY_BASE_PATH

| Constant | Type |
| ---------- | ---------- |
| `ALERTMANAGER_TENANCY_BASE_PATH` | `"api/alertmanager-tenancy"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L6)

### :gear: ALERTMANAGER_USER_WORKLOAD_BASE_PATH

| Constant | Type |
| ---------- | ---------- |
| `ALERTMANAGER_USER_WORKLOAD_BASE_PATH` | `any` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L5)

### :gear: BASE_FLEET_SEARCH_PATH

| Constant | Type |
| ---------- | ---------- |
| `BASE_FLEET_SEARCH_PATH` | `"/multicloud/search/resources"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L5)

### :gear: BASE_K8S_API_PATH

| Constant | Type |
| ---------- | ---------- |
| `BASE_K8S_API_PATH` | `"/api/kubernetes"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L4)

### :gear: checkAccess

Memoizes the result so it is possible to only make the request once for each access review.
This does mean that the user will have to refresh the page to see updates.
Function takes in the destructured resource attributes so that the cache keys are stable.
`JSON.stringify` is not guaranteed to give the same result for equivalent objects.
Impersonate headers are added automatically by `k8sCreate`.

| Constant | Type |
| ---------- | ---------- |
| `checkAccess` | `any` |

Parameters:

* `group`: resource group.
* `resource`: resource string.
* `subresource`: subresource string.
* `verb`: K8s verb.
* `namespace`: namespace.
* `impersonateKey`: parameter to include in the cache key even though it's not used in the function body.


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetAccessReview/checkAccess.ts#L20)

### :gear: DEFAULT_PROMETHEUS_SAMPLES

| Constant | Type |
| ---------- | ---------- |
| `DEFAULT_PROMETHEUS_SAMPLES` | `60` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L7)

### :gear: DEFAULT_PROMETHEUS_TIMESPAN

| Constant | Type |
| ---------- | ---------- |
| `DEFAULT_PROMETHEUS_TIMESPAN` | `number` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L8)

### :gear: GetMessagesDocument

| Constant | Type |
| ---------- | ---------- |
| `GetMessagesDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L626)

### :gear: LOCAL_CLUSTER_LABEL

| Constant | Type |
| ---------- | ---------- |
| `LOCAL_CLUSTER_LABEL` | `"local-cluster"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L15)

### :gear: MANAGED_CLUSTER_API_PATH

| Constant | Type |
| ---------- | ---------- |
| `MANAGED_CLUSTER_API_PATH` | `"managedclusterproxy"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L7)

### :gear: ManagedClusterListGroupVersionKind

| Constant | Type |
| ---------- | ---------- |
| `ManagedClusterListGroupVersionKind` | `{ group: string; version: string; kind: string; }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L9)

### :gear: ManagedClusterModel

| Constant | Type |
| ---------- | ---------- |
| `ManagedClusterModel` | `K8sModel` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L17)

### :gear: PROMETHEUS_BASE_PATH

| Constant | Type |
| ---------- | ---------- |
| `PROMETHEUS_BASE_PATH` | `any` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L2)

### :gear: PROMETHEUS_TENANCY_BASE_PATH

| Constant | Type |
| ---------- | ---------- |
| `PROMETHEUS_TENANCY_BASE_PATH` | `any` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/constants.ts#L3)

### :gear: searchClient

| Constant | Type |
| ---------- | ---------- |
| `searchClient` | `ApolloClient<NormalizedCacheObject>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-client.ts#L25)

### :gear: SearchCompleteDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchCompleteDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L262)

### :gear: SearchResultCountDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchResultCountDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L363)

### :gear: SearchResultItemsAndRelatedItemsDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L482)

### :gear: SearchResultItemsDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchResultItemsDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L309)

### :gear: SearchResultRelatedCountDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L417)

### :gear: SearchResultRelatedItemsDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L561)

### :gear: SearchSchemaDocument

| Constant | Type |
| ---------- | ---------- |
| `SearchSchemaDocument` | `DocumentNode` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L218)

### :gear: SelfSubjectAccessReviewModel

| Constant | Type |
| ---------- | ---------- |
| `SelfSubjectAccessReviewModel` | `K8sModel` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetAccessReview/checkAccess.ts#L54)

### :gear: URL_POLL_DEFAULT_DELAY

| Constant | Type |
| ---------- | ---------- |
| `URL_POLL_DEFAULT_DELAY` | `15000` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/useURLPoll.ts#L7)



## :cocktail: Types

- [BaseOptions](#gear-baseoptions)
- [Exact](#gear-exact)
- [Fleet](#gear-fleet)
- [FleetK8sResourceCommon](#gear-fleetk8sresourcecommon)
- [FleetResourceLinkProps](#gear-fleetresourcelinkprops)
- [FleetWatchK8sResource](#gear-fleetwatchk8sresource)
- [GetMessagesLazyQueryHookResult](#gear-getmessageslazyqueryhookresult)
- [GetMessagesQuery](#gear-getmessagesquery)
- [GetMessagesQueryHookResult](#gear-getmessagesqueryhookresult)
- [GetMessagesQueryResult](#gear-getmessagesqueryresult)
- [GetMessagesQueryVariables](#gear-getmessagesqueryvariables)
- [GetMessagesSuspenseQueryHookResult](#gear-getmessagessuspensequeryhookresult)
- [Incremental](#gear-incremental)
- [InputMaybe](#gear-inputmaybe)
- [MakeEmpty](#gear-makeempty)
- [MakeMaybe](#gear-makemaybe)
- [MakeOptional](#gear-makeoptional)
- [Maybe](#gear-maybe)
- [Message](#gear-message)
- [Options](#gear-options)
- [OptionsCreate](#gear-optionscreate)
- [OptionsDelete](#gear-optionsdelete)
- [OptionsGet](#gear-optionsget)
- [OptionsPatch](#gear-optionspatch)
- [OptionsUpdate](#gear-optionsupdate)
- [PrometheusURLProps](#gear-prometheusurlprops)
- [Query](#gear-query)
- [QuerySearchArgs](#gear-querysearchargs)
- [QuerySearchCompleteArgs](#gear-querysearchcompleteargs)
- [QuerySearchSchemaArgs](#gear-querysearchschemaargs)
- [ResourceDetails](#gear-resourcedetails)
- [ResourceTab](#gear-resourcetab)
- [ResourceTabComponent](#gear-resourcetabcomponent)
- [ResourceTabMetadataProps](#gear-resourcetabmetadataprops)
- [ResourceTabProps](#gear-resourcetabprops)
- [Scalars](#gear-scalars)
- [SearchCompleteLazyQueryHookResult](#gear-searchcompletelazyqueryhookresult)
- [SearchCompleteQuery](#gear-searchcompletequery)
- [SearchCompleteQueryHookResult](#gear-searchcompletequeryhookresult)
- [SearchCompleteQueryResult](#gear-searchcompletequeryresult)
- [SearchCompleteQueryVariables](#gear-searchcompletequeryvariables)
- [SearchCompleteSuspenseQueryHookResult](#gear-searchcompletesuspensequeryhookresult)
- [SearchFilter](#gear-searchfilter)
- [SearchInput](#gear-searchinput)
- [SearchRelatedResult](#gear-searchrelatedresult)
- [SearchResult](#gear-searchresult)
- [SearchResult](#gear-searchresult)
- [SearchResultCountLazyQueryHookResult](#gear-searchresultcountlazyqueryhookresult)
- [SearchResultCountQuery](#gear-searchresultcountquery)
- [SearchResultCountQueryHookResult](#gear-searchresultcountqueryhookresult)
- [SearchResultCountQueryResult](#gear-searchresultcountqueryresult)
- [SearchResultCountQueryVariables](#gear-searchresultcountqueryvariables)
- [SearchResultCountSuspenseQueryHookResult](#gear-searchresultcountsuspensequeryhookresult)
- [SearchResultItemsAndRelatedItemsLazyQueryHookResult](#gear-searchresultitemsandrelateditemslazyqueryhookresult)
- [SearchResultItemsAndRelatedItemsQuery](#gear-searchresultitemsandrelateditemsquery)
- [SearchResultItemsAndRelatedItemsQueryHookResult](#gear-searchresultitemsandrelateditemsqueryhookresult)
- [SearchResultItemsAndRelatedItemsQueryResult](#gear-searchresultitemsandrelateditemsqueryresult)
- [SearchResultItemsAndRelatedItemsQueryVariables](#gear-searchresultitemsandrelateditemsqueryvariables)
- [SearchResultItemsAndRelatedItemsSuspenseQueryHookResult](#gear-searchresultitemsandrelateditemssuspensequeryhookresult)
- [SearchResultItemsLazyQueryHookResult](#gear-searchresultitemslazyqueryhookresult)
- [SearchResultItemsQuery](#gear-searchresultitemsquery)
- [SearchResultItemsQueryHookResult](#gear-searchresultitemsqueryhookresult)
- [SearchResultItemsQueryResult](#gear-searchresultitemsqueryresult)
- [SearchResultItemsQueryVariables](#gear-searchresultitemsqueryvariables)
- [SearchResultItemsSuspenseQueryHookResult](#gear-searchresultitemssuspensequeryhookresult)
- [SearchResultRelatedCountLazyQueryHookResult](#gear-searchresultrelatedcountlazyqueryhookresult)
- [SearchResultRelatedCountQuery](#gear-searchresultrelatedcountquery)
- [SearchResultRelatedCountQueryHookResult](#gear-searchresultrelatedcountqueryhookresult)
- [SearchResultRelatedCountQueryResult](#gear-searchresultrelatedcountqueryresult)
- [SearchResultRelatedCountQueryVariables](#gear-searchresultrelatedcountqueryvariables)
- [SearchResultRelatedCountSuspenseQueryHookResult](#gear-searchresultrelatedcountsuspensequeryhookresult)
- [SearchResultRelatedItemsLazyQueryHookResult](#gear-searchresultrelateditemslazyqueryhookresult)
- [SearchResultRelatedItemsQuery](#gear-searchresultrelateditemsquery)
- [SearchResultRelatedItemsQueryHookResult](#gear-searchresultrelateditemsqueryhookresult)
- [SearchResultRelatedItemsQueryResult](#gear-searchresultrelateditemsqueryresult)
- [SearchResultRelatedItemsQueryVariables](#gear-searchresultrelateditemsqueryvariables)
- [SearchResultRelatedItemsSuspenseQueryHookResult](#gear-searchresultrelateditemssuspensequeryhookresult)
- [SearchSchemaLazyQueryHookResult](#gear-searchschemalazyqueryhookresult)
- [SearchSchemaQuery](#gear-searchschemaquery)
- [SearchSchemaQueryHookResult](#gear-searchschemaqueryhookresult)
- [SearchSchemaQueryResult](#gear-searchschemaqueryresult)
- [SearchSchemaQueryVariables](#gear-searchschemaqueryvariables)
- [SearchSchemaSuspenseQueryHookResult](#gear-searchschemasuspensequeryhookresult)
- [UseFleetClusterNames](#gear-usefleetclusternames)
- [UseFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [UseFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [UseHubClusterName](#gear-usehubclustername)
- [UseMulticlusterSearchWatch](#gear-usemulticlustersearchwatch)
- [UseURLPoll](#gear-useurlpoll)

### :gear: BaseOptions

| Type | Type |
| ---------- | ---------- |
| `BaseOptions` | `{ name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L18)

### :gear: Exact

| Type | Type |
| ---------- | ---------- |
| `Exact` | `{ [K in keyof T]: T[K] }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L6)

### :gear: Fleet

| Type | Type |
| ---------- | ---------- |
| `Fleet` | `T and { cluster?: string }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L9)

### :gear: FleetK8sResourceCommon

| Type | Type |
| ---------- | ---------- |
| `FleetK8sResourceCommon` | `Fleet<K8sResourceCommon>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L12)

### :gear: FleetResourceLinkProps

| Type | Type |
| ---------- | ---------- |
| `FleetResourceLinkProps` | `Fleet<ResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L18)

### :gear: FleetWatchK8sResource

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResource` | `Fleet<WatchK8sResource>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L11)

### :gear: GetMessagesLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `GetMessagesLazyQueryHookResult` | `ReturnType<typeof useGetMessagesLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L670)

### :gear: GetMessagesQuery

| Type | Type |
| ---------- | ---------- |
| `GetMessagesQuery` | `{ messages?: Array<{ id: string; kind?: string or null; description?: string or null } or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L214)

### :gear: GetMessagesQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `GetMessagesQueryHookResult` | `ReturnType<typeof useGetMessagesQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L669)

### :gear: GetMessagesQueryResult

| Type | Type |
| ---------- | ---------- |
| `GetMessagesQueryResult` | `Apollo.QueryResult<GetMessagesQuery, GetMessagesQueryVariables>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L672)

### :gear: GetMessagesQueryVariables

| Type | Type |
| ---------- | ---------- |
| `GetMessagesQueryVariables` | `Exact<{ [key: string]: never }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L212)

### :gear: GetMessagesSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `GetMessagesSuspenseQueryHookResult` | `ReturnType<typeof useGetMessagesSuspenseQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L671)

### :gear: Incremental

| Type | Type |
| ---------- | ---------- |
| `Incremental` | `T or { [P in keyof T]?: P extends ' $fragmentName' or '__typename' ? T[P] : never }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L10)

### :gear: InputMaybe

| Type | Type |
| ---------- | ---------- |
| `InputMaybe` | `Maybe<T>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L5)

### :gear: MakeEmpty

| Type | Type |
| ---------- | ---------- |
| `MakeEmpty` | `{ [_ in K]?: never }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L9)

### :gear: MakeMaybe

| Type | Type |
| ---------- | ---------- |
| `MakeMaybe` | `Omit<T, K> and { [SubKey in K]: Maybe<T[SubKey]> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L8)

### :gear: MakeOptional

| Type | Type |
| ---------- | ---------- |
| `MakeOptional` | `Omit<T, K> and { [SubKey in K]?: Maybe<T[SubKey]> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L7)

### :gear: Maybe

| Type | Type |
| ---------- | ---------- |
| `Maybe` | `T or null` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L4)

### :gear: Message

A message is used to communicate conditions detected while executing a query on the server.

| Type | Type |
| ---------- | ---------- |
| `Message` | `{ /** Message text. */ description?: Maybe<Scalars['String']['output']> /** Unique identifier to be used by clients to process the message independently of locale or grammatical changes. */ id: Scalars['String']['output'] /** * Message type. * **Values:** information, warning, error. */ kind?: Maybe<Scalars['String']['output']> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L23)

### :gear: Options

| Type | Type |
| ---------- | ---------- |
| `Options` | `{ ns?: string name?: string path?: string queryParams?: QueryParams cluster?: string }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L62)

### :gear: OptionsCreate

| Type | Type |
| ---------- | ---------- |
| `OptionsCreate` | `BaseOptions and { model: K8sModel data: R }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L26)

### :gear: OptionsDelete

| Type | Type |
| ---------- | ---------- |
| `OptionsDelete` | `BaseOptions and { model: K8sModel resource: R requestInit?: RequestInit json?: Record<string, any> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L47)

### :gear: OptionsGet

| Type | Type |
| ---------- | ---------- |
| `OptionsGet` | `BaseOptions and { model: K8sModel requestInit?: RequestInit }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L31)

### :gear: OptionsPatch

| Type | Type |
| ---------- | ---------- |
| `OptionsPatch` | `BaseOptions and { model: K8sModel resource: R data: Patch[] }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L41)

### :gear: OptionsUpdate

| Type | Type |
| ---------- | ---------- |
| `OptionsUpdate` | `BaseOptions and { model: K8sModel data: R }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L36)

### :gear: PrometheusURLProps

| Type | Type |
| ---------- | ---------- |
| `PrometheusURLProps` | `{ endpoint: PrometheusEndpoint endTime?: number namespace?: string query?: string samples?: number timeout?: string timespan?: number cluster?: string }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/utils.ts#L11)

### :gear: Query

Queries supported by the Search Query API.

| Type | Type |
| ---------- | ---------- |
| `Query` | `{ /** * Additional information about the service status or conditions found while processing the query. * This is similar to the errors query, but without implying that there was a problem processing the query. */ messages?: Maybe<Array<Maybe<Message>>> /** * Search for resources and their relationships. * *[PLACEHOLDER] Results only include kubernetes resources for which the authenticated user has list permission.* * * For more information see the feature spec. */ search?: Maybe<Array<Maybe<SearchResult>>> /** * Query all values for the given property. * Optionally, a query can be included to filter the results. * For example, if we want to get the names of all resources in the namespace foo, we can pass a query with the filter `{property: namespace, values:['foo']}` * * **Default limit is** 1,000 * A value of -1 will remove the limit. Use carefully because it may impact the service. */ searchComplete?: Maybe<Array<Maybe<Scalars['String']['output']>>> /** * Returns all fields from resources currently in the index. * Optionally, a query can be included to filter the results. * For example, if we want to only get fields for Pod resources, we can pass a query with the filter `{property: kind, values:['Pod']}` */ searchSchema?: Maybe<Scalars['Map']['output']> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L36)

### :gear: QuerySearchArgs

Queries supported by the Search Query API.

| Type | Type |
| ---------- | ---------- |
| `QuerySearchArgs` | `{ input?: InputMaybe<Array<InputMaybe<SearchInput>>> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L67)

### :gear: QuerySearchCompleteArgs

Queries supported by the Search Query API.

| Type | Type |
| ---------- | ---------- |
| `QuerySearchCompleteArgs` | `{ limit?: InputMaybe<Scalars['Int']['input']> property: Scalars['String']['input'] query?: InputMaybe<SearchInput> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L72)

### :gear: QuerySearchSchemaArgs

Queries supported by the Search Query API.

| Type | Type |
| ---------- | ---------- |
| `QuerySearchSchemaArgs` | `{ query?: InputMaybe<SearchInput> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L79)

### :gear: ResourceDetails

This extension allows plugins to replace the contents of the ACM resource details tab.

| Type | Type |
| ---------- | ---------- |
| `ResourceDetails` | `ExtensionDeclaration<typeof RESOURCE_DETAILS_TYPE, ResourceTabProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L42)

### :gear: ResourceTab

This extension allows plugins to add tabs to the ACM resource details page.

| Type | Type |
| ---------- | ---------- |
| `ResourceTab` | `ExtensionDeclaration<typeof RESOURCE_TAB_TYPE, ResourceTabProps and ResourceTabMetadataProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L45)

### :gear: ResourceTabComponent

| Type | Type |
| ---------- | ---------- |
| `ResourceTabComponent` | `React.ComponentType<{ /** The cluster where the resource is located. */ cluster: string /** The namespace where the resource is located (if the resource is namespace-scoped). */ namespace?: string /** The name of the resource. */ name: string /** The resource, augmented with cluster property. */ resource: FleetK8sResourceCommon /** The model for the resource. */ model: ExtensionK8sModel }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L10)

### :gear: ResourceTabMetadataProps

| Type | Type |
| ---------- | ---------- |
| `ResourceTabMetadataProps` | `{ /** A unique identifier for this resource tab. */ id: string /** The name of the tab. */ name: string /** Insert this item before the item referenced here. For arrays, the first one found in order is used. */ insertBefore?: string or string[] /** Insert this item after the item referenced here. For arrays, the first one found in order is used. `insertBefore` takes precedence. */ insertAfter?: string or string[] }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L30)

### :gear: ResourceTabProps

| Type | Type |
| ---------- | ---------- |
| `ResourceTabProps` | `{ /** The model for which this details component should be used. */ model: ExtensionK8sGroupKindModel /** The component to be rendered for the details tab of a matching resource. */ component: CodeRef<ResourceTabComponent> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L23)

### :gear: Scalars

All built-in and custom scalars, mapped to their actual values

| Type | Type |
| ---------- | ---------- |
| `Scalars` | `{ ID: { input: string; output: string } String: { input: string; output: string } Boolean: { input: boolean; output: boolean } Int: { input: number; output: number } Float: { input: number; output: number } Map: { input: any; output: any } }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L13)

### :gear: SearchCompleteLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchCompleteLazyQueryHookResult` | `ReturnType<typeof useSearchCompleteLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L306)

### :gear: SearchCompleteQuery

| Type | Type |
| ---------- | ---------- |
| `SearchCompleteQuery` | `{ searchComplete?: Array<string or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L169)

### :gear: SearchCompleteQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchCompleteQueryHookResult` | `ReturnType<typeof useSearchCompleteQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L305)

### :gear: SearchCompleteQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchCompleteQueryResult` | `Apollo.QueryResult<SearchCompleteQuery, SearchCompleteQueryVariables>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L308)

### :gear: SearchCompleteQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchCompleteQueryVariables` | `Exact<{ property: Scalars['String']['input'] query?: InputMaybe<SearchInput> limit?: InputMaybe<Scalars['Int']['input']> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L163)

### :gear: SearchCompleteSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchCompleteSuspenseQueryHookResult` | `ReturnType<typeof useSearchCompleteSuspenseQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L307)

### :gear: SearchFilter

Defines a key/value to filter results.
When multiple values are provided for a property, it is interpreted as an OR operation.

| Type | Type |
| ---------- | ---------- |
| `SearchFilter` | `{ /** Name of the property (key). */ property: Scalars['String']['input'] /** * Values for the property. Multiple values per property are interpreted as an OR operation. * Optionally one of these operations `=,!,!=,>,>=,<,<=` can be included at the beginning of the value. * By default the equality operation is used. * The values available for datetime fields (Ex: `created`, `startedAt`) are `hour`, `day`, `week`, `month` and `year`. * Property `kind`, if included in the filter, will be matched using a case-insensitive comparison. * For example, `kind:Pod` and `kind:pod` will bring up all pods. This is to maintain compatibility with Search V1. */ values: Array<InputMaybe<Scalars['String']['input']>> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L87)

### :gear: SearchInput

Input options to the search query.

| Type | Type |
| ---------- | ---------- |
| `SearchInput` | `{ /** * List of SearchFilter, which is a key(property) and values. * When multiple filters are provided, results will match all filters (AND operation). */ filters?: InputMaybe<Array<InputMaybe<SearchFilter>>> /** * List of strings to match resources. * Will match resources containing any of the keywords in any text field. * When multiple keywords are provided, it is interpreted as an AND operation. * Matches are case insensitive. */ keywords?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>> /** * Max number of results returned by the query. * **Default is** 10,000 * A value of -1 will remove the limit. Use carefully because it may impact the service. */ limit?: InputMaybe<Scalars['Int']['input']> /** * Filter relationships to the specified kinds. * If empty, all relationships will be included. * This filter is used with the 'related' field on SearchResult. */ relatedKinds?: InputMaybe<Array<InputMaybe<Scalars['String']['input']>>> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L102)

### :gear: SearchRelatedResult

Resources related to the items resolved from the search query.

| Type | Type |
| ---------- | ---------- |
| `SearchRelatedResult` | `{ /** * Total number of related resources. * **NOTE:** Should not use count in combination with items. If items are requested, the count is simply the size of items. */ count?: Maybe<Scalars['Int']['output']> /** Resources matched by the query. */ items?: Maybe<Array<Maybe<Scalars['Map']['output']>>> kind: Scalars['String']['output'] }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L130)

### :gear: SearchResult

Data returned by the search query.

| Type | Type |
| ---------- | ---------- |
| `SearchResult` | `{ /** * Total number of resources matching the query. * **NOTE:** Should not use count in combination with items. If items are requested, the count is simply the size of items. */ count?: Maybe<Scalars['Int']['output']> /** Resources matching the search query. */ items?: Maybe<Array<Maybe<Scalars['Map']['output']>>> /** * Resources related to the query results (items). * For example, if searching for deployments, this will return the related pod resources. */ related?: Maybe<Array<Maybe<SearchRelatedResult>>> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L142)

### :gear: SearchResult

| Type | Type |
| ---------- | ---------- |
| `SearchResult` | `R extends (infer T)[] ? MulticlusterResource<T>[] : MulticlusterResource<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/types.ts#L5)

### :gear: SearchResultCountLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultCountLazyQueryHookResult` | `ReturnType<typeof useSearchResultCountLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L414)

### :gear: SearchResultCountQuery

| Type | Type |
| ---------- | ---------- |
| `SearchResultCountQuery` | `{ searchResult?: Array<{ count?: number or null } or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L181)

### :gear: SearchResultCountQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultCountQueryHookResult` | `ReturnType<typeof useSearchResultCountQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L413)

### :gear: SearchResultCountQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultCountQueryResult` | `Apollo.QueryResult<SearchResultCountQuery, SearchResultCountQueryVariables>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L416)

### :gear: SearchResultCountQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchResultCountQueryVariables` | `Exact<{ input?: InputMaybe<Array<InputMaybe<SearchInput>> or InputMaybe<SearchInput>> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L177)

### :gear: SearchResultCountSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultCountSuspenseQueryHookResult` | `ReturnType<typeof useSearchResultCountSuspenseQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L415)

### :gear: SearchResultItemsAndRelatedItemsLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsLazyQueryHookResult` | `ReturnType< typeof useSearchResultItemsAndRelatedItemsLazyQuery >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L551)

### :gear: SearchResultItemsAndRelatedItemsQuery

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsQuery` | `{ searchResult?: Array<{ items?: Array<any or null> or null related?: Array<{ kind: string; items?: Array<any or null> or null } or null> or null } or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L195)

### :gear: SearchResultItemsAndRelatedItemsQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsQueryHookResult` | `ReturnType< typeof useSearchResultItemsAndRelatedItemsQuery >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L548)

### :gear: SearchResultItemsAndRelatedItemsQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsQueryResult` | `Apollo.QueryResult< SearchResultItemsAndRelatedItemsQuery, SearchResultItemsAndRelatedItemsQueryVariables >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L557)

### :gear: SearchResultItemsAndRelatedItemsQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsQueryVariables` | `Exact<{ input?: InputMaybe<Array<InputMaybe<SearchInput>> or InputMaybe<SearchInput>> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L191)

### :gear: SearchResultItemsAndRelatedItemsSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsAndRelatedItemsSuspenseQueryHookResult` | `ReturnType< typeof useSearchResultItemsAndRelatedItemsSuspenseQuery >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L554)

### :gear: SearchResultItemsLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsLazyQueryHookResult` | `ReturnType<typeof useSearchResultItemsLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L360)

### :gear: SearchResultItemsQuery

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsQuery` | `{ searchResult?: Array<{ items?: Array<any or null> or null } or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L175)

### :gear: SearchResultItemsQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsQueryHookResult` | `ReturnType<typeof useSearchResultItemsQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L359)

### :gear: SearchResultItemsQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsQueryResult` | `Apollo.QueryResult<SearchResultItemsQuery, SearchResultItemsQueryVariables>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L362)

### :gear: SearchResultItemsQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsQueryVariables` | `Exact<{ input?: InputMaybe<Array<InputMaybe<SearchInput>> or InputMaybe<SearchInput>> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L171)

### :gear: SearchResultItemsSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultItemsSuspenseQueryHookResult` | `ReturnType<typeof useSearchResultItemsSuspenseQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L361)

### :gear: SearchResultRelatedCountLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountLazyQueryHookResult` | `ReturnType<typeof useSearchResultRelatedCountLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L474)

### :gear: SearchResultRelatedCountQuery

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountQuery` | `{ searchResult?: Array<{ related?: Array<{ kind: string; count?: number or null } or null> or null } or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L187)

### :gear: SearchResultRelatedCountQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountQueryHookResult` | `ReturnType<typeof useSearchResultRelatedCountQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L473)

### :gear: SearchResultRelatedCountQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountQueryResult` | `Apollo.QueryResult< SearchResultRelatedCountQuery, SearchResultRelatedCountQueryVariables >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L478)

### :gear: SearchResultRelatedCountQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountQueryVariables` | `Exact<{ input?: InputMaybe<Array<InputMaybe<SearchInput>> or InputMaybe<SearchInput>> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L183)

### :gear: SearchResultRelatedCountSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedCountSuspenseQueryHookResult` | `ReturnType< typeof useSearchResultRelatedCountSuspenseQuery >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L475)

### :gear: SearchResultRelatedItemsLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsLazyQueryHookResult` | `ReturnType<typeof useSearchResultRelatedItemsLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L618)

### :gear: SearchResultRelatedItemsQuery

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsQuery` | `{ searchResult?: Array<{ related?: Array<{ kind: string; items?: Array<any or null> or null } or null> or null } or null> or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L206)

### :gear: SearchResultRelatedItemsQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsQueryHookResult` | `ReturnType<typeof useSearchResultRelatedItemsQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L617)

### :gear: SearchResultRelatedItemsQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsQueryResult` | `Apollo.QueryResult< SearchResultRelatedItemsQuery, SearchResultRelatedItemsQueryVariables >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L622)

### :gear: SearchResultRelatedItemsQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsQueryVariables` | `Exact<{ input?: InputMaybe<Array<InputMaybe<SearchInput>> or InputMaybe<SearchInput>> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L202)

### :gear: SearchResultRelatedItemsSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchResultRelatedItemsSuspenseQueryHookResult` | `ReturnType< typeof useSearchResultRelatedItemsSuspenseQuery >` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L619)

### :gear: SearchSchemaLazyQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchSchemaLazyQueryHookResult` | `ReturnType<typeof useSearchSchemaLazyQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L259)

### :gear: SearchSchemaQuery

| Type | Type |
| ---------- | ---------- |
| `SearchSchemaQuery` | `{ searchSchema?: any or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L161)

### :gear: SearchSchemaQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchSchemaQueryHookResult` | `ReturnType<typeof useSearchSchemaQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L258)

### :gear: SearchSchemaQueryResult

| Type | Type |
| ---------- | ---------- |
| `SearchSchemaQueryResult` | `Apollo.QueryResult<SearchSchemaQuery, SearchSchemaQueryVariables>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L261)

### :gear: SearchSchemaQueryVariables

| Type | Type |
| ---------- | ---------- |
| `SearchSchemaQueryVariables` | `Exact<{ query?: InputMaybe<SearchInput> }>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L157)

### :gear: SearchSchemaSuspenseQueryHookResult

| Type | Type |
| ---------- | ---------- |
| `SearchSchemaSuspenseQueryHookResult` | `ReturnType<typeof useSearchSchemaSuspenseQuery>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/search-sdk.ts#L260)

### :gear: UseFleetClusterNames

| Type | Type |
| ---------- | ---------- |
| `UseFleetClusterNames` | `() => [string[], boolean, any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L22)

### :gear: UseFleetK8sAPIPath

| Type | Type |
| ---------- | ---------- |
| `UseFleetK8sAPIPath` | `( cluster?: string ) => [k8sAPIPath: string or undefined, loaded: boolean, error: Error or undefined]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L15)

### :gear: UseFleetK8sWatchResource

| Type | Type |
| ---------- | ---------- |
| `UseFleetK8sWatchResource` | `<R extends FleetK8sResourceCommon or FleetK8sResourceCommon[]>( initResource: FleetWatchK8sResource or null ) => WatchK8sResult<R> or [undefined, boolean, any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L19)

### :gear: UseHubClusterName

| Type | Type |
| ---------- | ---------- |
| `UseHubClusterName` | `() => [hubClusterName: string or undefined, loaded: boolean, error: any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L14)

### :gear: UseMulticlusterSearchWatch

| Type | Type |
| ---------- | ---------- |
| `UseMulticlusterSearchWatch` | `<T extends K8sResourceCommon or K8sResourceCommon[]>( watchOptions: WatchK8sResource, advancedSearch?: { [key: string]: string } ) => [SearchResult<T> or undefined, boolean, Error or undefined]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/types.ts#L9)

### :gear: UseURLPoll

| Type | Type |
| ---------- | ---------- |
| `UseURLPoll` | `<R>(url: string or null, delay?: number, ...dependencies: any[]) => [R or null, any, boolean]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/useURLPoll.ts#L9)


<!-- TSDOC_END -->

### Utilities

- Fleet resource typing support through TypeScript interfaces

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).
