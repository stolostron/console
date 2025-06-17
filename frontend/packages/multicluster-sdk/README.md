# Multicluster SDK for OpenShift Console

<!-- Copyright Contributors to the Open Cluster Management project -->

A React SDK for working with multicluster OpenShift/Kubernetes resources from the OpenShift Console.

This SDK provides extensions and APIs that dynamic plugins can use to leverage multicluster capabilities provided by Red Hat Advanced Cluster Management. It aims to provide similar functionality to the dynamic plugin(<https://www.npmjs.com/package/@openshift-console/dynamic-plugin-sdk>) SDK but for multicluster scenarios.

## Prerequisites

- Red Hat Advanced Cluster Management for Kubernetes 2.15+

## Installation

```bash
npm install @stolostron/multicluster-sdk

```

## Usage

The multicluster-sdk provides components and hooks that enable your dynamic plugins to work with resources across multiple clusters.

## Basic Setup

// Example code will be added after API stabilization

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
