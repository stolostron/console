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
- [fleetK8sCreate](#gear-fleetk8screate)
- [fleetK8sDelete](#gear-fleetk8sdelete)
- [fleetK8sGet](#gear-fleetk8sget)
- [fleetK8sPatch](#gear-fleetk8spatch)
- [fleetK8sUpdate](#gear-fleetk8supdate)
- [FleetResourceLink](#gear-fleetresourcelink)
- [fleetWatch](#gear-fleetwatch)
- [getBackendUrl](#gear-getbackendurl)
- [getFleetK8sAPIPath](#gear-getfleetk8sapipath)
- [getResourcePath](#gear-getresourcepath)
- [getResourceURL](#gear-getresourceurl)
- [isResourceRoute](#gear-isresourceroute)
- [useFleetClusterNames](#gear-usefleetclusternames)
- [useFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetSearchPoll](#gear-usefleetsearchpoll)
- [useHubClusterName](#gear-usehubclustername)
- [useIsFleetAvailable](#gear-useisfleetavailable)

### :gear: buildResourceURL

| Function | Type |
| ---------- | ---------- |
| `buildResourceURL` | `(params: { model: K8sModel; ns?: string or undefined; name?: string or undefined; cluster?: string or undefined; queryParams?: QueryParams or undefined; basePath: string; }) => string` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L110)

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

### :gear: FleetResourceLink

Enhanced ResourceLink component for ACM fleet environments.

Unlike the standard OpenShift ResourceLink which always links to the OpenShift console,
FleetResourceLink provides intelligent routing based on cluster context:
- For managed clusters: Links to ACM search results or specialized ACM pages
- For hub clusters: Context-aware routing based on current page location
- For first-class ACM resources: Direct links to rich management interfaces

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


Examples:

```typescript
// Hub cluster VirtualMachine - routes to ACM VM page on multicloud paths
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

### :gear: getFleetK8sAPIPath

| Function | Type |
| ---------- | ---------- |
| `getFleetK8sAPIPath` | `(cluster?: string or undefined) => Promise<string>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L21)

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

### :gear: isResourceRoute

| Function | Type |
| ---------- | ---------- |
| `isResourceRoute` | `(e: Extension) => e is ResourceRoute` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resourceRouteExtension.ts#L25)

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

### :gear: useFleetSearchPoll

| Function | Type |
| ---------- | ---------- |
| `useFleetSearchPoll` | `UseFleetSearchPoll` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/useFleetSearchPoll.ts#L7)

### :gear: useFleetSearchPoll

| Function | Type |
| ---------- | ---------- |
| `useFleetSearchPoll` | `UseFleetSearchPoll` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/useFleetSearchPoll.ts#L7)

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

- [BaseOptions](#gear-baseoptions)
- [Fleet](#gear-fleet)
- [FleetAccessReviewResourceAttributes](#gear-fleetaccessreviewresourceattributes)
- [FleetK8sResourceCommon](#gear-fleetk8sresourcecommon)
- [FleetResourceLinkProps](#gear-fleetresourcelinkprops)
- [FleetWatchK8sResource](#gear-fleetwatchk8sresource)
- [Options](#gear-options)
- [OptionsCreate](#gear-optionscreate)
- [OptionsDelete](#gear-optionsdelete)
- [OptionsGet](#gear-optionsget)
- [OptionsPatch](#gear-optionspatch)
- [OptionsUpdate](#gear-optionsupdate)
- [ResourceRoute](#gear-resourceroute)
- [ResourceRouteExtensionProps](#gear-resourcerouteextensionprops)
- [ResourceRouteHandler](#gear-resourceroutehandler)
- [UseFleetClusterNames](#gear-usefleetclusternames)
- [UseFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [UseFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [UseHubClusterName](#gear-usehubclustername)
- [UseIsFleetAvailable](#gear-useisfleetavailable)

### :gear: BaseOptions

| Type | Type |
| ---------- | ---------- |
| `BaseOptions` | `{ name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L18)

### :gear: Fleet

| Type | Type |
| ---------- | ---------- |
| `Fleet` | `T and { cluster?: string }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L10)

### :gear: FleetAccessReviewResourceAttributes

| Type | Type |
| ---------- | ---------- |
| `FleetAccessReviewResourceAttributes` | `Fleet<AccessReviewResourceAttributes>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L14)

### :gear: FleetK8sResourceCommon

| Type | Type |
| ---------- | ---------- |
| `FleetK8sResourceCommon` | `Fleet<K8sResourceCommon>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L13)

### :gear: FleetResourceLinkProps

| Type | Type |
| ---------- | ---------- |
| `FleetResourceLinkProps` | `Fleet<ResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L20)

### :gear: FleetWatchK8sResource

| Type | Type |
| ---------- | ---------- |
| `FleetWatchK8sResource` | `Fleet<WatchK8sResource>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L12)

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

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L36)

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

### :gear: ResourceRoute

| Type | Type |
| ---------- | ---------- |
| `ResourceRoute` | `ExtensionDeclaration<'acm.resource/route', ResourceRouteExtensionProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resourceRouteExtension.ts#L15)

### :gear: ResourceRouteExtensionProps

| Type | Type |
| ---------- | ---------- |
| `ResourceRouteExtensionProps` | `{ /** resource model to match against */ model: { group?: string kind: string version?: string } /** function that returns the path for the resource */ handler: (params: { kind: string; cluster?: string; namespace?: string; name: string }) => string or null }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resourceRouteExtension.ts#L4)

### :gear: ResourceRouteHandler

| Type | Type |
| ---------- | ---------- |
| `ResourceRouteHandler` | `(params: { kind: string cluster?: string namespace?: string name: string }) => string or null` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/extensions/resourceRouteExtension.ts#L17)

### :gear: UseFleetClusterNames

| Type | Type |
| ---------- | ---------- |
| `UseFleetClusterNames` | `() => [string[], boolean, any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L24)

### :gear: UseFleetK8sAPIPath

| Type | Type |
| ---------- | ---------- |
| `UseFleetK8sAPIPath` | `( cluster?: string ) => [k8sAPIPath: string or undefined, loaded: boolean, error: Error or undefined]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L17)

### :gear: UseFleetK8sWatchResource

| Type | Type |
| ---------- | ---------- |
| `UseFleetK8sWatchResource` | `<R extends FleetK8sResourceCommon or FleetK8sResourceCommon[]>( initResource: FleetWatchK8sResource or null ) => WatchK8sResult<R> or [undefined, boolean, any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L21)

### :gear: UseHubClusterName

| Type | Type |
| ---------- | ---------- |
| `UseHubClusterName` | `() => [hubClusterName: string or undefined, loaded: boolean, error: any]` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L16)

### :gear: UseIsFleetAvailable

Signature of the `useIsFleetAvailable` hook

| Type | Type |
| ---------- | ---------- |
| `UseIsFleetAvailable` | `() => boolean` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/types/fleet.ts#L27)


<!-- TSDOC_END -->

### Utilities

- Fleet resource typing support through TypeScript interfaces

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).