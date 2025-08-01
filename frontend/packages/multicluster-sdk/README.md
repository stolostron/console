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

- [fleetK8sCreate](#gear-fleetk8screate)
- [fleetK8sDelete](#gear-fleetk8sdelete)
- [fleetK8sGet](#gear-fleetk8sget)
- [fleetK8sPatch](#gear-fleetk8spatch)
- [fleetK8sUpdate](#gear-fleetk8supdate)
- [FleetResourceEventStream](#gear-fleetresourceeventstream)
- [FleetResourceLink](#gear-fleetresourcelink)
- [getFleetK8sAPIPath](#gear-getfleetk8sapipath)
- [useFleetAccessReview](#gear-usefleetaccessreview)
- [useFleetClusterNames](#gear-usefleetclusternames)
- [useFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetPrometheusPoll](#gear-usefleetprometheuspoll)
- [useFleetSearchPoll](#gear-usefleetsearchpoll)
- [useHubClusterName](#gear-usehubclustername)
- [useIsFleetAvailable](#gear-useisfleetavailable)

### :gear: fleetK8sCreate

| Function | Type |
| ---------- | ---------- |
| `fleetK8sCreate` | `<R extends K8sResourceCommon>(options: OptionsCreate<R>) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L187)

### :gear: fleetK8sDelete

| Function | Type |
| ---------- | ---------- |
| `fleetK8sDelete` | `<R extends K8sResourceCommon>(options: OptionsDelete<R>) => Promise<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L214)

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

### :gear: FleetResourceEventStream

A multicluster-aware ResourceEventStream component that displays real-time Kubernetes events
for resources on managed clusters. Provides equivalent functionality to the OpenShift console's
ResourceEventStream for resources on managed clusters.

For managed cluster resources, this component establishes a websocket connection to stream
events from the specified cluster. For hub cluster resources or when no cluster is specified,
it falls back to the standard OpenShift console ResourceEventStream component.

| Function | Type |
| ---------- | ---------- |
| `FleetResourceEventStream` | `FC<{ resource: FleetK8sResourceCommon; }>` |

Parameters:

* `props`: - Component properties
* `props.resource`: - The Kubernetes resource to show events for.
Must include standard K8s metadata (name, namespace, uid, kind) and an optional cluster property.


Returns:

A rendered event stream component showing real-time Kubernetes events

Examples:

// Display events for a resource on a managed cluster
<FleetResourceEventStream
  resource={{
    metadata: { name: 'my-pod', namespace: 'default', uid: '123' },
    kind: 'Pod',
    cluster: 'managed-cluster-1'
  }}
/>
// Display events for a hub cluster resource (falls back to OpenShift console component)
<FleetResourceEventStream
  resource={{
    metadata: { name: 'my-deployment', namespace: 'openshift-gitops', uid: '456' },
    kind: 'Deployment'
    // No cluster property - uses hub cluster
  }}
/>
// Display events for a cluster-scoped resource on a managed cluster
<FleetResourceEventStream
  resource={{
    metadata: { name: 'my-node', uid: '789' },
    kind: 'Node',
    cluster: 'edge-cluster-2'
  }}
/>


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/components/FleetResourceEventStream.tsx#L93)

### :gear: FleetResourceLink

| Function | Type |
| ---------- | ---------- |
| `FleetResourceLink` | `React.FC<FleetResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/FleetResourceLink.tsx#L9)

### :gear: getFleetK8sAPIPath

| Function | Type |
| ---------- | ---------- |
| `getFleetK8sAPIPath` | `(cluster?: string or undefined) => Promise<string>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L21)

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
* `resourceAttributes.verb`: the "action" to perform; one of 'create' | 'get' | 'list' | 'update' | 'patch' | 'delete' | 'deletecollection' | 'watch' | 'impersonate'
* `resourceAttributes.name`: the name
* `resourceAttributes.namespace`: the namespace
* `resourceAttributes.cluster`: the cluster name to find the resource in


Returns:

Array with `isAllowed` and `loading` values.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetAccessReview.ts#L20)

### :gear: useFleetClusterNames

| Function | Type |
| ---------- | ---------- |
| `useFleetClusterNames` | `UseFleetClusterNames` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetClusterNames.ts#L6)

### :gear: useFleetK8sAPIPath

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sAPIPath` | `UseFleetK8sAPIPath` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L9)

### :gear: useFleetK8sWatchResource

A hook for watching Kubernetes resources with support for multi-cluster environments.
It is equivalent to the [`useK8sWatchResource`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#usek8swatchresource)
hook from the [OpenShift Console Dynamic Plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk)
but allows you to retrieve data from any cluster managed by Red Hat Advanced Cluster Management.

It automatically detects the hub cluster and handles resource watching on both hub
and remote clusters using WebSocket connections for real-time updates.

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sWatchResource` | `UseFleetK8sWatchResource` |

Parameters:

* `initResource`: - The resource to watch. Can be null to disable the watch.
* `initResource.cluster`: - The managed cluster on which the resource resides; null for the hub cluster


Returns:

A tuple containing the watched resource data, a boolean indicating if the data is loaded,
and any error that occurred. The hook returns live-updating data.

Examples:

```typescript
// Watch pods on a remote cluster
const [pods, loaded, error] = useFleetK8sWatchResource({
  groupVersionKind: { version: 'v1', kind: 'Pod' },
  isList: true,
  cluster: 'remote-cluster',
  namespace: 'default'
})

// Watch a specific deployment on hub cluster
const [deployment, loaded, error] = useFleetK8sWatchResource({
  groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
  name: 'my-app',
  namespace: 'default'
})
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sWatchResource.ts#L48)

### :gear: useFleetPrometheusPoll

| Function | Type |
| ---------- | ---------- |
| `useFleetPrometheusPoll` | `UsePrometheusPoll` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/index.ts#L13)

### :gear: useFleetSearchPoll

A React hook that provides fleet-wide search functionality using the ACM search API.

| Function | Type |
| ---------- | ---------- |
| `useFleetSearchPoll` | `UseFleetSearchPoll` |

Parameters:

* `watchOptions`: - Configuration options for the resource watch
* `watchOptions.groupVersionKind`: - The group, version, and kind of the resource to search for
* `watchOptions.limit`: - Maximum number of results to return (defaults to -1 for no limit)
* `watchOptions.namespace`: - Namespace to search in (only used if namespaced is true)
* `watchOptions.namespaced`: - Whether the resource is namespaced
* `watchOptions.name`: - Specific resource name to search for (exact match)
* `watchOptions.isList`: - Whether to return results as a list or single item
* `advancedSearch`: - Optional array of additional search filters
* `advancedSearch[].property`: - The property name to filter on
* `advancedSearch[].values`: - Array of values to match for the property
* `pollInterval`: - Optional polling interval in seconds. Defaults to 30 seconds (polling enabled).
- Not specified: polls every 30 seconds
- 0-30 inclusive: polls every 30 seconds (minimum interval)
- >30: polls at the given interval in seconds
- false or negative: disables polling


Returns:

A tuple containing:
- `data`: The search results formatted as Kubernetes resources, or undefined if no results
- `loaded`: Boolean indicating if the search has completed (opposite of loading)
- `error`: Any error that occurred during the search, or undefined if successful
- `refetch`: A callback that enables you to re-execute the query

Examples:

```typescript
// Search for all Pods in a specific namespace with default 30-second polling
const [pods, loaded, error] = useFleetSearchPoll({
  groupVersionKind: { group: '', version: 'v1', kind: 'Pod' },
  namespace: 'default',
  namespaced: true,
  isList: true
});

// Search for a specific Deployment with polling every 60 seconds
const [deployment, loaded, error] = useFleetSearchPoll({
  groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
  name: 'my-deployment',
  namespace: 'default',
  namespaced: true,
  isList: false
}, [
  { property: 'label', values: ['app=my-app'] }
], 60);

// Search without polling (one-time query)
const [services, loaded, error] = useFleetSearchPoll({
  groupVersionKind: { group: '', version: 'v1', kind: 'Service' },
  namespaced: true,
  isList: true
}, undefined, false);
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetSearchPoll.ts#L79)

### :gear: useHubClusterName

Hook that provides hub cluster name.

| Function | Type |
| ---------- | ---------- |
| `useHubClusterName` | `UseHubClusterName` |

Returns:

Array with `hubclustername`, `loaded` and `error` values.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useHubClusterName.ts#L12)

### :gear: useIsFleetAvailable

Hook that determines if the fleet support is available.

Checks if the feature flag with the name corresponding to the `REQUIRED_PROVIDER_FLAG` constant is enabled.
Red Hat Advanced Cluster Management enables this feature flag in versions that provide all of the dependencies
required by this version of the multicluster SDK.

| Function | Type |
| ---------- | ---------- |
| `useIsFleetAvailable` | `UseIsFleetAvailable` |

Returns:

`true` if a version of Red Hat Advanced Cluster Management that is compatible with the multicluster SDK is available; `false` otherwise

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useIsFleetAvailable.ts#L15)


## :wrench: Constants

- [REQUIRED_PROVIDER_FLAG](#gear-required_provider_flag)

### :gear: REQUIRED_PROVIDER_FLAG

| Constant | Type |
| ---------- | ---------- |
| `REQUIRED_PROVIDER_FLAG` | `"MULTICLUSTER_SDK_PROVIDER_1"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L2)



## :cocktail: Types

- [AdvancedSearchFilter](#gear-advancedsearchfilter)
- [Fleet](#gear-fleet)
- [FleetAccessReviewResourceAttributes](#gear-fleetaccessreviewresourceattributes)
- [FleetK8sResourceCommon](#gear-fleetk8sresourcecommon)
- [FleetResourceLinkProps](#gear-fleetresourcelinkprops)
- [FleetWatchK8sResource](#gear-fleetwatchk8sresource)
- [SearchResult](#gear-searchresult)
- [UseFleetClusterNames](#gear-usefleetclusternames)
- [UseFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [UseFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [UseFleetSearchPoll](#gear-usefleetsearchpoll)
- [UseHubClusterName](#gear-usehubclustername)
- [UseIsFleetAvailable](#gear-useisfleetavailable)

### :gear: AdvancedSearchFilter

| Type | Type |
| ---------- | ---------- |
| `AdvancedSearchFilter` | `{ property: string; values: string[] }[]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/search.ts#L8)

### :gear: Fleet

| Type | Type |
| ---------- | ---------- |
| `Fleet` | `T and { cluster?: string }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L11)

### :gear: FleetAccessReviewResourceAttributes

| Type | Type |
| ---------- | ---------- |
| `FleetAccessReviewResourceAttributes` | `Fleet<AccessReviewResourceAttributes>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L15)

### :gear: FleetK8sResourceCommon

| Type | Type |
| ---------- | ---------- |
| `FleetK8sResourceCommon` | `Fleet<K8sResourceCommon>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L14)

### :gear: FleetResourceLinkProps

| Type | Type |
| ---------- | ---------- |
| `FleetResourceLinkProps` | `Fleet<ResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L21)

### :gear: FleetWatchK8sResource

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResource` | `Fleet<WatchK8sResource>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L13)

### :gear: SearchResult

| Type | Type |
| ---------- | ---------- |
| `SearchResult` | `R extends (infer T)[] ? Fleet<T>[] : Fleet<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/search.ts#L4)

### :gear: UseFleetClusterNames

| Type | Type |
| ---------- | ---------- |
| `UseFleetClusterNames` | `() => [string[], boolean, any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L25)

### :gear: UseFleetK8sAPIPath

| Type | Type |
| ---------- | ---------- |
| `UseFleetK8sAPIPath` | `( cluster?: string ) => [k8sAPIPath: string or undefined, loaded: boolean, error: Error or undefined]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L18)

### :gear: UseFleetK8sWatchResource

| Type | Type |
| ---------- | ---------- |
| `UseFleetK8sWatchResource` | `<R extends FleetK8sResourceCommon or FleetK8sResourceCommon[]>( initResource: FleetWatchK8sResource or null ) => WatchK8sResult<R> or [undefined, boolean, any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L22)

### :gear: UseFleetSearchPoll

| Type | Type |
| ---------- | ---------- |
| `UseFleetSearchPoll` | `<T extends K8sResourceCommon or K8sResourceCommon[]>( watchOptions: WatchK8sResource, advancedSearchFilters?: AdvancedSearchFilter, pollInterval?: number or false ) => [SearchResult<T> or undefined, boolean, Error or undefined, () => void]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L30)

### :gear: UseHubClusterName

| Type | Type |
| ---------- | ---------- |
| `UseHubClusterName` | `() => [hubClusterName: string or undefined, loaded: boolean, error: any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L17)

### :gear: UseIsFleetAvailable

Signature of the `useIsFleetAvailable` hook

| Type | Type |
| ---------- | ---------- |
| `UseIsFleetAvailable` | `() => boolean` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L28)


<!-- TSDOC_END -->

### Utilities

- Fleet resource typing support through TypeScript interfaces

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).