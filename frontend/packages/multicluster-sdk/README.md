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

### Components

- `<FleetResourceLink>`: Component for linking to the resource details page in ACM for a resource from a managed cluster, or to the OpenShift console resource page for a resource from the hub cluster

### Hooks

- `useFleetK8sWatchResource`: Watch Kubernetes resources across clusters
- `useFleetK8sAPIPath`: Get the API path for a specific cluster
- `useHubClusterName`: Get the name of the hub cluster
- `useFleetClusterNames`: Get the list of managed cluster names

### Utilities

- Fleet resource typing support through TypeScript interfaces

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).
