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
- [FleetSupport](#gear-fleetsupport)
- [fleetWatch](#gear-fleetwatch)
- [getBackendUrl](#gear-getbackendurl)
- [getFleetK8sAPIPath](#gear-getfleetk8sapipath)
- [getResourcePath](#gear-getresourcepath)
- [getResourceURL](#gear-getresourceurl)
- [isResourceDetails](#gear-isresourcedetails)
- [isResourceTab](#gear-isresourcetab)
- [useFleetAccessReview](#gear-usefleetaccessreview)
- [useFleetClusterNames](#gear-usefleetclusternames)
- [useFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetPrometheusPoll](#gear-usefleetprometheuspoll)
- [useHubClusterName](#gear-usehubclustername)
- [useIsFleetSupported](#gear-useisfleetsupported)
- [useMulticlusterSearchWatch](#gear-usemulticlustersearchwatch)

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

| Function | Type |
| ---------- | ---------- |
| `FleetResourceLink` | `FC<FleetResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/FleetResourceLink.tsx#L8)

### :gear: FleetSupport

| Function | Type |
| ---------- | ---------- |
| `FleetSupport` | `FC<PropsWithChildren<{ loading: ReactNode; }>>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/FleetSupport.tsx#L7)

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

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L20)

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


Returns:

Array with `isAllowed` and `loading` values.

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
| `useFleetK8sWatchResource` | `UseFleetK8sWatchResource` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sWatchResource.ts#L6)

### :gear: useFleetPrometheusPoll

| Function | Type |
| ---------- | ---------- |
| `useFleetPrometheusPoll` | `UsePrometheusPoll` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetPrometheusPoll/index.ts#L13)

### :gear: useHubClusterName

| Function | Type |
| ---------- | ---------- |
| `useHubClusterName` | `UseHubClusterName` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useHubClusterName.ts#L7)

### :gear: useIsFleetSupported

| Function | Type |
| ---------- | ---------- |
| `useIsFleetSupported` | `() => boolean` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/FleetSupport.tsx#L34)

### :gear: useMulticlusterSearchWatch

| Function | Type |
| ---------- | ---------- |
| `useMulticlusterSearchWatch` | `UseMulticlusterSearchWatch` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/useMulticlusterSearchWatch.ts#L9)



## :cocktail: Types

- [BaseOptions](#gear-baseoptions)
- [Fleet](#gear-fleet)
- [FleetK8sResourceCommon](#gear-fleetk8sresourcecommon)
- [FleetResourceLinkProps](#gear-fleetresourcelinkprops)
- [FleetWatchK8sResource](#gear-fleetwatchk8sresource)
- [Options](#gear-options)
- [OptionsCreate](#gear-optionscreate)
- [OptionsDelete](#gear-optionsdelete)
- [OptionsGet](#gear-optionsget)
- [OptionsPatch](#gear-optionspatch)
- [OptionsUpdate](#gear-optionsupdate)
- [ResourceDetails](#gear-resourcedetails)
- [ResourceTab](#gear-resourcetab)
- [ResourceTabComponent](#gear-resourcetabcomponent)
- [ResourceTabMetadataProps](#gear-resourcetabmetadataprops)
- [ResourceTabProps](#gear-resourcetabprops)
- [UseFleetClusterNames](#gear-usefleetclusternames)
- [UseFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [UseFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [UseHubClusterName](#gear-usehubclustername)

### :gear: BaseOptions

| Type | Type |
| ---------- | ---------- |
| `BaseOptions` | `{ name?: string ns?: string path?: string cluster?: string queryParams?: QueryParams }` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/apiRequests.ts#L18)

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


<!-- TSDOC_END -->

### Utilities

- Fleet resource typing support through TypeScript interfaces

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).
