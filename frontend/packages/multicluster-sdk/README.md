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
- [fleetK8sList](#gear-fleetk8slist)
- [fleetK8sListItems](#gear-fleetk8slistitems)
- [fleetK8sPatch](#gear-fleetk8spatch)
- [fleetK8sUpdate](#gear-fleetk8supdate)
- [FleetResourceEventStream](#gear-fleetresourceeventstream)
- [FleetResourceLink](#gear-fleetresourcelink)
- [getFleetK8sAPIPath](#gear-getfleetk8sapipath)
- [useFleetAccessReview](#gear-usefleetaccessreview)
- [useFleetClusterNames](#gear-usefleetclusternames)
- [useFleetClusterSetNames](#gear-usefleetclustersetnames)
- [useFleetClusterSets](#gear-usefleetclustersets)
- [useFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetK8sWatchResources](#gear-usefleetk8swatchresources)
- [useFleetPrometheusPoll](#gear-usefleetprometheuspoll)
- [useFleetSearchPoll](#gear-usefleetsearchpoll)
- [useHubClusterName](#gear-usehubclustername)
- [useIsFleetAvailable](#gear-useisfleetavailable)
- [useIsFleetObservabilityInstalled](#gear-useisfleetobservabilityinstalled)

### :gear: fleetK8sCreate

A fleet version of [`k8sCreate`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8screate) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that creates a resource on the specified cluster.

The cluster name can be specified in options or the payload, with the value from options taking precedence.
If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

| Function | Type |
| ---------- | ---------- |
| `fleetK8sCreate` | `<R extends FleetK8sResourceCommon>(options: FleetK8sCreateUpdateOptions<R>) => Promise<R>` |

Parameters:

* `options`: Which are passed as key-value pairs in the map
* `options.cluster`: - the cluster on which to create the resource
* `options.model`: - Kubernetes model
* `options.data`: - payload for the resource to be created
* `options.path`: - Appends as subpath if provided
* `options.queryParams`: - The query parameters to be included in the URL.


Returns:

A promise that resolves to the response of the resource created.
In case of failure, the promise gets rejected with HTTP error response.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sCreate.ts#L24)

### :gear: fleetK8sDelete

A fleet version of [`k8sDelete`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8sdelete) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that deletes resources from the specified cluster, based on the provided model and resource.

The cluster name can be specified in options or the resource, with the value from options taking precedence.
If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

 The garbage collection works based on 'Foreground' | 'Background', can be configured with `propagationPolicy` property in provided model or passed in json.

| Function | Type |
| ---------- | ---------- |
| `fleetK8sDelete` | `<R extends FleetK8sResourceCommon>(options: FleetK8sDeleteOptions<R>) => Promise<R>` |

Parameters:

* `options`: which are passed as key-value pair in the map.
* `options.cluster`: - the cluster from which to delete the resource
* `options.model`: - Kubernetes model
* `options.resource`: - The resource to be deleted.
* `options.path`: - Appends as subpath if provided.
* `options.queryParams`: - The query parameters to be included in the URL.
* `options.requestInit`: - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html
* `options.json`: - Can control garbage collection of resources explicitly if provided else will default to model's `propagationPolicy`.


Returns:

A promise that resolves to the response of kind Status.
In case of failure promise gets rejected with HTTP error response.

Examples:

```
{ kind: 'DeleteOptions', apiVersion: 'v1', propagationPolicy }
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sDelete.ts#L31)

### :gear: fleetK8sGet

A fleet version of [`k8sGet`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8sget) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that fetches a resource from the specified cluster, based on the provided options.

If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

If the name is provided it returns resource, else it returns all the resources matching the model.

| Function | Type |
| ---------- | ---------- |
| `fleetK8sGet` | `<R extends FleetK8sResourceCommon>(options: FleetK8sGetOptions) => Promise<R>` |

Parameters:

* `options`: Which are passed as key-value pairs in the map
* `options.cluster`: - the cluster from which to fetch the resource
* `options.model`: - Kubernetes model
* `options.name`: - The name of the resource, if not provided then it looks for all the resources matching the model.
* `options.ns`: - The namespace to look into, should not be specified for cluster-scoped resources.
* `options.path`: - Appends as subpath if provided
* `options.queryParams`: - The query parameters to be included in the URL.
* `options.requestInit`: - The fetch init object to use. This can have request headers, method, redirect, etc. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html


Returns:

A promise that resolves to the response as JSON object with a resource if the name is provided, else it returns all the resources matching the model. In case of failure, the promise gets rejected with HTTP error response.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sGet.ts#L25)

### :gear: fleetK8sList

A fleet version of [`k8sList`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slist) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that lists the resources as an array in the specified cluster, based on the provided options.

If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

| Function | Type |
| ---------- | ---------- |
| `fleetK8sList` | `<R extends FleetK8sResourceCommon>(options: FleetK8sListOptions) => Promise<R[]>` |

Parameters:

* `options`: Which are passed as key-value pairs in the map.
* `options.cluster`: - the cluster from which to list the resources
* `options.model`: - Kubernetes model
* `options.queryParams`: - The query parameters to be included in the URL. It can also pass label selectors by using the `labelSelector` key.
* `options.requestInit`: - The fetch init object to use. This can have request headers, method, redirect, and so forth. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html


Returns:

A promise that resolves to the response

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sList.ts#L20)

### :gear: fleetK8sListItems

A fleet version of [`k8sListItems`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slistitems) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that lists the resources as an array in the specified cluster, based on the provided options.

If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

| Function | Type |
| ---------- | ---------- |
| `fleetK8sListItems` | `<R extends FleetK8sResourceCommon>(options: FleetK8sListOptions) => Promise<R[]>` |

Parameters:

* `options`: Which are passed as key-value pairs in the map.
* `options.cluster`: - the cluster from which to list the resources
* `options.model`: - Kubernetes model
* `options.queryParams`: - The query parameters to be included in the URL. It can also pass label selectors by using the `labelSelector` key.
* `options.requestInit`: - The fetch init object to use. This can have request headers, method, redirect, and so forth. See more https://microsoft.github.io/PowerBI-JavaScript/interfaces/_node_modules_typedoc_node_modules_typescript_lib_lib_dom_d_.requestinit.html


Returns:

A promise that resolves to the response

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sList.ts#L54)

### :gear: fleetK8sPatch

A fleet version of [`k8sPatch`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slist) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that patches any resource on the specified cluster, based on the provided options.

The cluster name can be specified in options or the resource, with the value from options taking precedence.
If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

When a client needs to perform the partial update, the client can use `fleetK8sPatch`.
Alternatively, the client can use `fleetK8sUpdate` to replace an existing resource entirely.
See more https://datatracker.ietf.org/doc/html/rfc6902

| Function | Type |
| ---------- | ---------- |
| `fleetK8sPatch` | `<R extends FleetK8sResourceCommon>(options: FleetK8sPatchOptions<R>) => Promise<R>` |

Parameters:

* `options`: Which are passed as key-value pairs in the map.
* `options.cluster`: - the cluster on which to patch the resource
* `options.model`: - Kubernetes model
* `options.resource`: - The resource to be patched.
* `options.data`: - Only the data to be patched on existing resource with the operation, path, and value.
* `options.path`: - Appends as subpath if provided.
* `options.queryParams`: - The query parameters to be included in the URL.


Returns:

A promise that resolves to the response of the resource patched.
In case of failure promise gets rejected with HTTP error response.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sPatch.ts#L29)

### :gear: fleetK8sUpdate

A fleet version of [`k8sPatch`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#k8slist) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that updates the entire resource on the specified cluster, based on the provided options.

The cluster name can be specified in options or the payload, with the value from options taking precedence.
If the cluster name is not specified or matches the name of the hub cluster, the implementation from the dynamic plugin SDK is used.

When a client needs to replace an existing resource entirely, the client can use `fleetK8sUpdate`.
Alternatively, the client can use `fleetK8sPatch` to perform the partial update.

| Function | Type |
| ---------- | ---------- |
| `fleetK8sUpdate` | `<R extends FleetK8sResourceCommon>(options: FleetK8sCreateUpdateOptions<R>) => Promise<R>` |

Parameters:

* `options`: which are passed as key-value pair in the map
* `options.cluster`: - the cluster on which to update the resource
* `options.model`: - Kubernetes model
* `options.data`: - payload for the Kubernetes resource to be updated
* `options.ns`: - namespace to look into, it should not be specified for cluster-scoped resources.
* `options.name`: - resource name to be updated.
* `options.path`: - appends as subpath if provided.
* `options.queryParams`: - The query parameters to be included in the URL.


Returns:

A promise that resolves to the response of the resource updated.
In case of failure promise gets rejected with HTTP error response.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/fleetK8sUpdate.ts#L29)

### :gear: FleetResourceEventStream

A multicluster-aware ResourceEventStream component that displays real-time Kubernetes events
for resources on managed clusters. Provides equivalent functionality to the OpenShift console's
ResourceEventStream for resources on managed clusters.

For managed cluster resources, this component establishes a websocket connection to stream
events from the specified cluster. For hub cluster resources or when no cluster is specified,
it falls back to the standard OpenShift console ResourceEventStream component.

| Function | Type |
| ---------- | ---------- |
| `FleetResourceEventStream` | `FC<FleetResourceEventStreamProps>` |

Parameters:

* `props`: - Component properties
* `props.resource`: - The Kubernetes resource to show events for.
Must include standard K8s metadata (name, namespace, uid, kind) and an optional cluster property.


Returns:

A rendered event stream component showing real-time Kubernetes events

References:

* [https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#resourceeventstream](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#resourceeventstream)
* `FleetK8sResourceCommon`
* [https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk](https://github.com/openshift/console/tree/master/frontend/packages/console-dynamic-plugin-sdk)


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


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/components/FleetResourceEventStream.tsx#L94)

### :gear: FleetResourceLink

Enhanced ResourceLink component for ACM fleet environments.

Unlike the standard OpenShift ResourceLink which always links to the OpenShift console,
FleetResourceLink provides intelligent routing based on cluster context:
- First-class ACM resources (ManagedCluster) get direct links in all cases
- For hub clusters: Extension-based routing first, then fallback to OpenShift console
- For managed clusters: Extension-based routing first, then fallback to ACM search results

This prevents users from having to jump between different consoles when managing
multi-cluster resources.

| Function | Type |
| ---------- | ---------- |
| `FleetResourceLink` | `React.FC<FleetResourceLinkProps>` |

Parameters:

* `props`: - FleetResourceLinkProps extending ResourceLinkProps with cluster information
* `props.cluster`: - the target cluster name for the resource
* `props.groupVersionKind`: - K8s GroupVersionKind for the resource
* `props.name`: - the resource name
* `props.namespace`: - the resource namespace (required for namespaced resources)
* `props.displayName`: - optional display name override
* `props.className`: - additional CSS classes
* `props.inline`: - whether to display inline
* `props.hideIcon`: - whether to hide the resource icon
* `props.children`: - additional content to render


References:

* [https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#resourcelink](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#resourcelink)


Examples:

```typescript
// Hub cluster VirtualMachine - routes to ACM VM page via extension system
<FleetResourceLink
  name="my-vm"
  namespace="default"
  groupVersionKind={{ group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' }}
/>

// Managed cluster VirtualMachine - routes to ACM search results
<FleetResourceLink
  name="remote-vm"
  namespace="default"
  cluster="prod-cluster"
  groupVersionKind={{ group: 'kubevirt.io', version: 'v1', kind: 'VirtualMachine' }}
/>

// ManagedCluster resource (lives on hub) - cluster prop omitted
<FleetResourceLink
  name="prod-cluster"
  groupVersionKind={{ group: 'cluster.open-cluster-management.io', version: 'v1', kind: 'ManagedCluster' }}
/>
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/components/FleetResourceLink.tsx#L61)

### :gear: getFleetK8sAPIPath

Function that provides the k8s API path for the fleet.

| Function | Type |
| ---------- | ---------- |
| `getFleetK8sAPIPath` | `(cluster?: string or undefined) => Promise<string>` |

Parameters:

* `cluster`: - The cluster name.


Returns:

The k8s API path for the fleet.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/getFleetK8sAPIPath.ts#L13)

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

Hook that returns names of managed clusters with optional filtering by cluster proxy addon and availability status.

This hook watches ManagedCluster resources and by default filters them to only include clusters
that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
the condition `ManagedClusterConditionAvailable` with status `True`.

| Function | Type |
| ---------- | ---------- |
| `useFleetClusterNames` | `(returnAllClusters?: boolean or undefined) => [string[], boolean, any]` |

Parameters:

* `returnAllClusters`: - Optional boolean to return all cluster names regardless of labels and conditions.
Defaults to false. When false (default), only returns clusters with the
'feature.open-cluster-management.io/addon-cluster-proxy: available' label AND
'ManagedClusterConditionAvailable' status: 'True'.
When true, returns all cluster names regardless of labels and conditions.


Returns:

A tuple containing:
- clusterNames: Array of cluster names (filtered by default, or all clusters if specified)
- loaded: Boolean indicating if the resource watch has loaded
- error: Any error that occurred during the watch operation

Examples:

```tsx
// Get only clusters with cluster proxy addon available AND ManagedClusterConditionAvailable: 'True' (default behavior)
const [availableClusterNames, loaded, error] = useFleetClusterNames()

// Get all cluster names regardless of labels and conditions
const [allClusterNames, loaded, error] = useFleetClusterNames(true)

// Explicitly filter by cluster proxy addon and availability (same as default)
const [filteredClusterNames, loaded, error] = useFleetClusterNames(false)

if (!loaded) {
  return <Loading />
}

if (error) {
  return <ErrorState error={error} />
}

return (
  <div>
    {availableClusterNames.map(name => (
      <div key={name}>{name}</div>
    ))}
  </div>
)
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetClusterNames.ts#L51)

### :gear: useFleetClusterSetNames

Hook that returns unique cluster set names from managed clusters with optional filtering by cluster proxy addon and availability status.

This hook watches ManagedCluster resources and by default filters them to only include clusters
that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
the condition `ManagedClusterConditionAvailable` with status `True`. It then collects unique
values from the `cluster.open-cluster-management.io/clusterset` label.

| Function | Type |
| ---------- | ---------- |
| `useFleetClusterSetNames` | `(considerAllClusters?: boolean) => [string[], boolean, any]` |

Parameters:

* `considerAllClusters`: - Optional boolean to consider all clusters regardless of labels and conditions.
Defaults to false. When false (default), only considers clusters with the
'feature.open-cluster-management.io/addon-cluster-proxy: available' label AND
'ManagedClusterConditionAvailable' status: 'True'.
When true, considers all clusters regardless of labels and conditions.


Returns:

A tuple containing:
- clusterSets: Array of unique cluster set names from the clusterset labels
- loaded: Boolean indicating if the resource watch has loaded
- error: Any error that occurred during the watch operation

Examples:

```tsx
// Get cluster sets from only clusters with cluster proxy addon available AND ManagedClusterConditionAvailable: 'True' (default behavior)
const [availableClusterSets, loaded, error] = useFleetClusterSetNames()

// Get cluster sets from all clusters regardless of labels and conditions
const [allClusterSets, loaded, error] = useFleetClusterSetNames(true)

// Explicitly filter by cluster proxy addon and availability (same as default)
const [filteredClusterSets, loaded, error] = useFleetClusterSetNames(false)

if (!loaded) {
  return <Loading />
}

if (error) {
  return <ErrorState error={error} />
}

return (
  <div>
    {availableClusterSets.map(setName => (
      <div key={setName}>{setName}</div>
    ))}
  </div>
)
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetClusterSetNames.ts#L53)

### :gear: useFleetClusterSets

Hook that returns cluster names organized by cluster sets with optional filtering.

This hook watches ManagedCluster resources and by default filters them to only include clusters
that have both the label `feature.open-cluster-management.io/addon-cluster-proxy: available` AND
the condition `ManagedClusterConditionAvailable` with status `True`. It then organizes cluster
names by their cluster set labels.

| Function | Type |
| ---------- | ---------- |
| `useFleetClusterSets` | `(options?: FleetClusterNamesOptions) => [ClusterSetData, boolean, any]` |

Parameters:

* `options`: - Configuration object for cluster set organization
* `options.returnAllClusters`: - Whether to return all clusters regardless of availability status. Defaults to false.
* `options.clusterSets`: - Specific cluster set names to include. If not specified, includes all cluster sets.
* `options.includeGlobal`: - Whether to include a special "global" set containing all clusters. Defaults to false.


Returns:

A tuple containing:
- clusterSetData: ClusterSetData object organized by cluster sets
- loaded: Boolean indicating if the resource watch has loaded
- error: Any error that occurred during the watch operation

Examples:

```tsx
// Get clusters organized by cluster sets (default behavior)
const [clusterSetData, loaded, error] = useFleetClusterSets({})

// Include global set with all clusters
const [clusterSetsWithGlobal, loaded, error] = useFleetClusterSets({
  includeGlobal: true
})

// Filter to specific cluster sets
const [productionAndStaging, loaded, error] = useFleetClusterSets({
  clusterSets: ['production', 'staging']
})

if (!loaded) return <Loading />
if (error) return <ErrorState error={error} />

return (
  <div>
    {clusterSetData.global && (
      <div>
        <h3>All Clusters</h3>
        {clusterSetData.global.map(name => <div key={name}>{name}</div>)}
      </div>
    )}
    {Object.entries(clusterSetData).filter(([setName]) => setName !== 'global').map(([setName, clusters]) => (
      <div key={setName}>
        <h3>{setName}</h3>
        {clusters.map(name => <div key={name}>{name}</div>)}
      </div>
    ))}
  </div>
)
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetClusterSets.ts#L60)

### :gear: useFleetK8sAPIPath

Hook that provides the k8s API path for the fleet.

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sAPIPath` | `(cluster?: string or undefined) => [k8sAPIPath: string or undefined, loaded: boolean, error: Error or undefined]` |

Parameters:

* `cluster`: - The cluster name.


Returns:

Array with `k8sAPIPath`, `loaded` and `error` values.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L12)

### :gear: useFleetK8sWatchResource

A hook for watching Kubernetes resources with support for multi-cluster environments.
It is equivalent to the [`useK8sWatchResource`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#usek8swatchresource)
hook from the [OpenShift Console Dynamic Plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk)
but allows you to retrieve data from any cluster managed by Red Hat Advanced Cluster Management.

It automatically detects the hub cluster and handles resource watching on both hub
and remote clusters using WebSocket connections for real-time updates.

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sWatchResource` | `<R extends FleetK8sResourceCommon or FleetK8sResourceCommon[]>(initResource: FleetWatchK8sResource or null) => FleetWatchK8sResult<R>` |

Parameters:

* `initResource`: - The resource to watch. Can be null to disable the watch.
* `initResource.cluster`: - The managed cluster on which the resource resides; null or undefined for the hub cluster
* `initResource.groupVersionKind`: - The group, version, and kind of the resource (e.g., `{ group: 'apps', version: 'v1', kind: 'Deployment' }`)
* `initResource.name`: - The name of the resource (for watching a specific resource)
* `initResource.namespace`: - The namespace of the resource
* `initResource.isList`: - Whether to watch a list of resources (true) or a single resource (false)
* `initResource.selector`: - Label selector to filter resources (e.g., `{ matchLabels: { app: 'myapp' } }`)
* `initResource.fieldSelector`: - Field selector to filter resources (e.g., `status.phase=Running`)
* `initResource.limit`: - Maximum number of resources to return (not supported yet)
* `initResource.namespaced`: - Whether the resource is namespaced (not supported yet)
* `initResource.optional`: - If true, errors will not be thrown when the resource is not found (not supported yet)
* `initResource.partialMetadata`: - If true, only fetch metadata for the resources (not supported yet)


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

// Watch pods with label selector on remote cluster
const [filteredPods, loaded, error] = useFleetK8sWatchResource({
  groupVersionKind: { version: 'v1', kind: 'Pod' },
  isList: true,
  cluster: 'remote-cluster',
  namespace: 'default',
  selector: { matchLabels: { app: 'myapp' } }
})
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sWatchResource.ts#L73)

### :gear: useFleetK8sWatchResources

A hook for watching multiple Kubernetes resources with support for multi-cluster environments.
It is equivalent to the [`useK8sWatchResources`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#usek8swatchresources)
hook from the [OpenShift Console Dynamic Plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk)
but allows you to retrieve data from any cluster managed by Red Hat Advanced Cluster Management.

It automatically detects the hub cluster and handles resource watching on both hub
and remote clusters using WebSocket connections for real-time updates.

| Function | Type |
| ---------- | ---------- |
| `useFleetK8sWatchResources` | `<R extends FleetResourcesObject>(initResources: FleetWatchK8sResources<R> or null) => FleetWatchK8sResults<R>` |

Parameters:

* `initResources`: - An object where each key represents a resource identifier and each value is a resource watch configuration. Can be null to disable all watches.
* `initResources`: key].cluster - The managed cluster on which the resource resides; null or undefined for the hub cluster
* `initResources`: key].groupVersionKind - The group, version, and kind of the resource (e.g., `{ group: 'apps', version: 'v1', kind: 'Deployment' }`)
* `initResources`: key].name - The name of the resource (for watching a specific resource)
* `initResources`: key].namespace - The namespace of the resource
* `initResources`: key].isList - Whether to watch a list of resources (true) or a single resource (false)
* `initResources`: key].selector - Label selector to filter resources (e.g., `{ matchLabels: { app: 'myapp' } }`)
* `initResources`: key].fieldSelector - Field selector to filter resources (e.g., `status.phase=Running`)
* `initResources`: key].limit - Maximum number of resources to return (not supported yet)
* `initResources`: key].namespaced - Whether the resource is namespaced (not supported yet)
* `initResources`: key].optional - If true, errors will not be thrown when the resource is not found (not supported yet)
* `initResources`: key].partialMetadata - If true, only fetch metadata for the resources (not supported yet)


Returns:

An object with the same keys as initResources, where each value contains the watched resource data,
a boolean indicating if the data is loaded, and any error that occurred. The hook returns live-updating data.

Examples:

```typescript
// Watch multiple resources on different clusters
const result = useFleetK8sWatchResources({
  pods: {
    groupVersionKind: { version: 'v1', kind: 'Pod' },
    isList: true,
    cluster: 'remote-cluster-1',
    namespace: 'default'
  },
  deployments: {
    groupVersionKind: { group: 'apps', version: 'v1', kind: 'Deployment' },
    isList: true,
    cluster: 'remote-cluster-2',
    namespace: 'default'
  }
})

// Access individual resources
const { pods, deployments } = result
console.log(pods.data, pods.loaded, pods.loadError)
console.log(deployments.data, deployments.loaded, deployments.loadError)
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sWatchResources.ts#L77)

### :gear: useFleetPrometheusPoll

A fleet version of [`usePrometheusPoll`](https://github.com/openshift/console/blob/main/frontend/packages/console-dynamic-plugin-sdk/docs/api.md#useprometheuspoll) from
the [dynamic plugin SDK](https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk) that polls Prometheus for metrics data from a specific cluster or across all clusters.

Although this is intended as a drop-in replacement for usePrometheusPoll there are a couple of considerations:
1. The Observabilty service must be running on the hub in order to access metric data outside of the hub. The useIsFleetObservabilityInstalled() hook can check this
2. The PromQL query will be different for clusters outside of the hub. The query may be completely different but at the very least it will contain the cluster name(s)
3. Ideally the Observabilty team will setup your queries so that you only need to add the cluster name-- see example

| Function | Type |
| ---------- | ---------- |
| `useFleetPrometheusPoll` | `(props: PrometheusPollProps and { cluster?: string or undefined; } and { allClusters?: boolean or undefined; }) => [response: PrometheusResponse or undefined, loaded: boolean, error: unknown]` |

Parameters:

* `endpoint`: - one of the PrometheusEndpoint (label, query, range, rules, targets)
* `cluster`: - The target cluster name. If not specified or matches hub cluster, queries local Prometheus
* `allClusters`: - If true, queries across all clusters in the fleet (requires observability)
* `query`: - (optional) Prometheus query string. If empty or undefined, polling is not started. (See note above on format)
* `delay`: - (optional) polling delay interval (ms)
* `endTime`: - (optional) for QUERY_RANGE enpoint, end of the query range
* `samples`: - (optional) for QUERY_RANGE enpoint
* `timespan`: - (optional) for QUERY_RANGE enpoint
* `namespace`: - (optional) a search param to append
* `timeout`: - (optional) a search param to append


Returns:

A tuple containing:
- `response`: PrometheusResponse object with query results, or undefined if loading/error
- `loaded`: Boolean indicating if the request has completed (successfully or with error)
- `error`: Any error that occurred during the request, including dependency check failures

Examples:

```typescript
 // (OPTIONAL) Check if the Observability service has been installed 
const [response, loaded, error] = useIsFleetObservabilityInstalled()
if (!loaded) {
   return <Loading />
}
if (error) {
 return <ErrorState error={error} />
}

// Get the query
const [hubClusterName] = useHubClusterName();
const clusterFilter = cluster !== hubClusterName ? `,cluster='$cluster}'` : '';
const sumByCluster = !isEmpty(obj?.cluster) && obj?.cluster === hubClusterName ? ', cluster' : '';
// NOTE: this assumes your queries are identical between hub and other fleet clusters
// if not, you may need to use an entirely different query for fleet--consult the Observability team
const query = `sum(rate(kubevirt_vmi_cpu_usage_seconds_total{name='${name}',namespace='${namespace}'${clusterFilter}}[${duration}])) BY (name, namespace${sumByCluster})`,

// Query metrics data
const [response, loaded, error] = useFleetPrometheusPoll({
 cluster: 'cluster',
 query
});
if (!loaded) {
 return <Loading />
}
if (error) {
  return <ErrorState error={error} />
}
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll.ts#L86)

### :gear: useFleetSearchPoll

A React hook that provides fleet-wide search functionality using the ACM search API.

| Function | Type |
| ---------- | ---------- |
| `useFleetSearchPoll` | `<T extends K8sResourceCommon or K8sResourceCommon[]>(watchOptions?: FleetWatchK8sResource or undefined, advancedSearchFilters?: AdvancedSearchFilter or undefined, pollInterval?: number or ... 1 more ... or undefined) => [...]` |

Parameters:

* `watchOptions`: - Configuration options for the resource watch; no search query is performed if this value is null or if `kind` of `groupVersionKind` is not specified
* `watchOptions.cluster`: - The managed cluster on which the resource resides; unspecified to search all clusters
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


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetSearchPoll.ts#L81)

### :gear: useHubClusterName

Hook that provides hub cluster name.

| Function | Type |
| ---------- | ---------- |
| `useHubClusterName` | `() => [hubClusterName: string or undefined, loaded: boolean, error: any]` |

Returns:

Array with `hubclustername`, `loaded` and `error` values.

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useHubClusterName.ts#L9)

### :gear: useIsFleetAvailable

Hook that determines if the fleet support is available.

Checks if the feature flag with the name corresponding to the `REQUIRED_PROVIDER_FLAG` constant is enabled.
Red Hat Advanced Cluster Management enables this feature flag in versions that provide all of the dependencies
required by this version of the multicluster SDK.

| Function | Type |
| ---------- | ---------- |
| `useIsFleetAvailable` | `() => boolean` |

Returns:

`true` if a version of Red Hat Advanced Cluster Management that is compatible with the multicluster SDK is available; `false` otherwise

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useIsFleetAvailable.ts#L14)

### :gear: useIsFleetObservabilityInstalled

Hook that determines if the Observability service has been installed on the hub

| Function | Type |
| ---------- | ---------- |
| `useIsFleetObservabilityInstalled` | `() => [isObservabilityInstalled: boolean or undefined, loaded: boolean, error: unknown]` |

Returns:

A tuple containing:
- `response`: Boolean indicating whether the Observability service has been installed
- `loaded`: Boolean indicating if the request has completed (successfully or with error)
- `error`: Any error that occurred during the request, including dependency check failures

Examples:

```typescript
// Check if the Observability service has been installed
const [response, loaded, error] = useIsFleetObservabilityInstalled()
if (!loaded) {
 return <Loading />
}
if (error) {
  return <ErrorState error={error} />
}
if (!loaded) {
  return <Loading />
}

if (error) {
  return <ErrorState error={error} />
}
```


[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useIsFleetObservabilityInstalled.ts#L38)


## :wrench: Constants

- [REQUIRED_PROVIDER_FLAG](#gear-required_provider_flag)
- [RESOURCE_ROUTE_TYPE](#gear-resource_route_type)

### :gear: REQUIRED_PROVIDER_FLAG

| Constant | Type |
| ---------- | ---------- |
| `REQUIRED_PROVIDER_FLAG` | `"MULTICLUSTER_SDK_PROVIDER_1"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L2)

### :gear: RESOURCE_ROUTE_TYPE

| Constant | Type |
| ---------- | ---------- |
| `RESOURCE_ROUTE_TYPE` | `"acm.resource/route"` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/constants.ts#L3)



## :cocktail: Types

- [AdvancedSearchFilter](#gear-advancedsearchfilter)
- [ClusterSetData](#gear-clustersetdata)
- [Fleet](#gear-fleet)
- [FleetAccessReviewResourceAttributes](#gear-fleetaccessreviewresourceattributes)
- [FleetClusterNamesOptions](#gear-fleetclusternamesoptions)
- [FleetK8sCreateUpdateOptions](#gear-fleetk8screateupdateoptions)
- [FleetK8sDeleteOptions](#gear-fleetk8sdeleteoptions)
- [FleetK8sGetOptions](#gear-fleetk8sgetoptions)
- [FleetK8sListOptions](#gear-fleetk8slistoptions)
- [FleetK8sPatchOptions](#gear-fleetk8spatchoptions)
- [FleetK8sResourceCommon](#gear-fleetk8sresourcecommon)
- [FleetResourceEventStreamProps](#gear-fleetresourceeventstreamprops)
- [FleetResourceLinkProps](#gear-fleetresourcelinkprops)
- [FleetResourcesObject](#gear-fleetresourcesobject)
- [FleetWatchK8sResource](#gear-fleetwatchk8sresource)
- [FleetWatchK8sResources](#gear-fleetwatchk8sresources)
- [FleetWatchK8sResult](#gear-fleetwatchk8sresult)
- [FleetWatchK8sResults](#gear-fleetwatchk8sresults)
- [FleetWatchK8sResultsObject](#gear-fleetwatchk8sresultsobject)
- [ResourceRoute](#gear-resourceroute)
- [ResourceRouteHandler](#gear-resourceroutehandler)
- [ResourceRouteProps](#gear-resourcerouteprops)
- [SearchResult](#gear-searchresult)

### :gear: AdvancedSearchFilter

| Type | Type |
| ---------- | ---------- |
| `AdvancedSearchFilter` | `{ property: string; values: string[] }[]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/search.ts#L9)

### :gear: ClusterSetData

Structured data containing cluster names organized by cluster sets.

Clusters without an explicit cluster set label are automatically assigned to the "default" cluster set.
The "global" key is a special set that contains all clusters (when includeGlobal is true).

| Type | Type |
| ---------- | ---------- |
| `ClusterSetData` | `Record<string, string[]>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L96)

### :gear: Fleet

| Type | Type |
| ---------- | ---------- |
| `Fleet` | `T and { cluster?: string }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L12)

### :gear: FleetAccessReviewResourceAttributes

| Type | Type |
| ---------- | ---------- |
| `FleetAccessReviewResourceAttributes` | `Fleet<AccessReviewResourceAttributes>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L36)

### :gear: FleetClusterNamesOptions

Options for advanced cluster name retrieval with cluster set organization.

| Type | Type |
| ---------- | ---------- |
| `FleetClusterNamesOptions` | `{ /** Whether to return all clusters regardless of availability status. Defaults to false. */ returnAllClusters?: boolean /** Specific cluster set names to include. If not specified, includes all cluster sets including "default". Should not include "global" - use includeGlobal instead. */ clusterSets?: string[] /** Whether to include a special "global" set containing all clusters. Defaults to false. */ includeGlobal?: boolean }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L101)

### :gear: FleetK8sCreateUpdateOptions

| Type | Type |
| ---------- | ---------- |
| `FleetK8sCreateUpdateOptions` | `{ model: K8sModel name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams data: R }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L41)

### :gear: FleetK8sDeleteOptions

| Type | Type |
| ---------- | ---------- |
| `FleetK8sDeleteOptions` | `{ model: K8sModel name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams resource: R requestInit?: RequestInit json?: Record<string, any> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L72)

### :gear: FleetK8sGetOptions

| Type | Type |
| ---------- | ---------- |
| `FleetK8sGetOptions` | `{ model: K8sModel name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams requestInit?: RequestInit }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L51)

### :gear: FleetK8sListOptions

| Type | Type |
| ---------- | ---------- |
| `FleetK8sListOptions` | `{ model: K8sModel queryParams: { [key: string]: any } requestInit?: RequestInit }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L84)

### :gear: FleetK8sPatchOptions

| Type | Type |
| ---------- | ---------- |
| `FleetK8sPatchOptions` | `{ model: K8sModel name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams resource: R data: Patch[] }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L61)

### :gear: FleetK8sResourceCommon

| Type | Type |
| ---------- | ---------- |
| `FleetK8sResourceCommon` | `Fleet<K8sResourceCommon>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L13)

### :gear: FleetResourceEventStreamProps

| Type | Type |
| ---------- | ---------- |
| `FleetResourceEventStreamProps` | `{ resource: FleetK8sResourceCommon }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L39)

### :gear: FleetResourceLinkProps

| Type | Type |
| ---------- | ---------- |
| `FleetResourceLinkProps` | `Fleet<ResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L38)

### :gear: FleetResourcesObject

| Type | Type |
| ---------- | ---------- |
| `FleetResourcesObject` | `{ [key: string]: FleetK8sResourceCommon or FleetK8sResourceCommon[] }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L25)

### :gear: FleetWatchK8sResource

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResource` | `Fleet<WatchK8sResource>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L15)

### :gear: FleetWatchK8sResources

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResources` | `{ [k in keyof R]: FleetWatchK8sResource }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L16)

### :gear: FleetWatchK8sResult

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResult` | `[ R or undefined, boolean, any, ]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L19)

### :gear: FleetWatchK8sResults

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResults` | `{ [k in keyof R]: FleetWatchK8sResultsObject<R[k]> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L32)

### :gear: FleetWatchK8sResultsObject

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResultsObject` | `{ data: R or undefined loaded: boolean loadError?: any }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L26)

### :gear: ResourceRoute

This extension allows plugins to customize the route used for resources of the given kind. Search results and resource links will direct to the route returned by the implementing function.

| Type | Type |
| ---------- | ---------- |
| `ResourceRoute` | `ExtensionDeclaration<typeof RESOURCE_ROUTE_TYPE, ResourceRouteProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L28)

### :gear: ResourceRouteHandler

| Type | Type |
| ---------- | ---------- |
| `ResourceRouteHandler` | `(props: { /** The cluster where the resource is located. */ cluster: string /** The namespace where the resource is located (if the resource is namespace-scoped). */ namespace?: string /** The name of the resource. */ name: string /** The resource, augmented with cluster property. */ resource: FleetK8sResourceCommon /** The model for the resource. */ model: ExtensionK8sModel }) => string or undefined` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L7)

### :gear: ResourceRouteProps

| Type | Type |
| ---------- | ---------- |
| `ResourceRouteProps` | `{ /** The model for which this resource route should be used. */ model: ExtensionK8sGroupKindModel /** The handler function that returns the route path for the resource. */ handler: CodeRef<ResourceRouteHandler> }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resource.ts#L20)

### :gear: SearchResult

| Type | Type |
| ---------- | ---------- |
| `SearchResult` | `R extends (infer T)[] ? Fleet<T>[] : Fleet<R>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/search.ts#L5)


<!-- TSDOC_END -->

### Utilities

- Fleet resource typing support through TypeScript interfaces

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).
