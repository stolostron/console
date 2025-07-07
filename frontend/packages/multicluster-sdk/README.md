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
- [FleetResourceLink](#gear-fleetresourcelink)
- [getFleetK8sAPIPath](#gear-getfleetk8sapipath)
- [useFleetAccessReview](#gear-usefleetaccessreview)
- [useFleetClusterNames](#gear-usefleetclusternames)
- [useFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [useFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [useFleetPrometheusPoll](#gear-usefleetprometheuspoll)
- [useHubClusterName](#gear-usehubclustername)
- [useMulticlusterSearchWatch](#gear-usemulticlustersearchwatch)

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
| `FleetResourceLink` | `React.FC<FleetResourceLinkProps>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/FleetResourceLink.tsx#L9)

### :gear: getFleetK8sAPIPath

| Function | Type |
| ---------- | ---------- |
| `getFleetK8sAPIPath` | `(cluster?: string or undefined) => Promise<string>` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/useFleetK8sAPIPath.ts#L20)

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

### :gear: useMulticlusterSearchWatch

| Function | Type |
| ---------- | ---------- |
| `useMulticlusterSearchWatch` | `UseMulticlusterSearchWatch` |

[:link: Source](https://github.com/stolostron/console/blob/main/frontend/packages/multicluster-sdk/tree/../src/api/search/useMulticlusterSearchWatch.ts#L9)



## :cocktail: Types

- [Fleet](#gear-fleet)
- [FleetK8sResourceCommon](#gear-fleetk8sresourcecommon)
- [FleetResourceLinkProps](#gear-fleetresourcelinkprops)
- [UseFleetClusterNames](#gear-usefleetclusternames)
- [UseFleetK8sAPIPath](#gear-usefleetk8sapipath)
- [UseFleetK8sWatchResource](#gear-usefleetk8swatchresource)
- [UseHubClusterName](#gear-usehubclustername)

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
