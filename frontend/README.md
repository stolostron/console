# Multicluster SDK for OpenShift Console

[![npm version](https://img.shields.io/npm/v/@stolostron/multicluster-sdk.svg?style=flat-square)](https://www.npmjs.com/package/@stolostron/multicluster-sdk)

<!-- Copyright Contributors to the Open Cluster Management project -->

A React SDK for working with multi-cluster OpenShift/Kubernetes resources from the OpenShift Console.

This SDK provides components and hooks that enable your applications to seamlessly work with resources across multiple clusters, integrating with Red Hat Advanced Cluster Management (ACM) for Kubernetes and Red Hat MultiCluster Engine (MCE).

## Prerequisites

- Red Hat OpenShift Console 4.10+
- Red Hat Advanced Cluster Management for Kubernetes 2.x and Red Hat MultiCluster Engine 2.x

## Contributing

All contributions to the repository must be submitted under the terms of the [Apache Public License 2.0](https://www.apache.org/licenses/LICENSE-2.0). For contribution guidelines, see [CONTRIBUTING.md](https://github.com/stolostron/console/blob/main/CONTRIBUTING.md).

For detailed API documentation including all available interfaces, types, and extension points, please refer to our [API Documentation](https://link-to-futuredocswhenavailable).

## Installation

```bash
npm install @stolostron/multicluster-sdk

```

## Usage

The multicluster-sdk provides a React provider component called `FleetSupport` that enables your application to work with resources across multiple clusters.

### Basic Setup

Wrap your application with the `FleetSupport` component to enable multicluster support:

```tsx
import { FleetSupport } from '@stolostron/multicluster-sdk';

function App() {
  return (
    <FleetSupport loading={<div>Loading multicluster support...</div>}>
      <YourApplication />
    </FleetSupport>
  );
}

```

### Working with Resources

Once your application is wrapped with `FleetSupport`, you can use the provided hooks and components to work with resources across clusters:

```tsx
import {
  useFleetK8sWatchResource,
  useFleetK8sAPIPath,
  useHubClusterName,
  FleetResourceLink
} from '@stolostron/multicluster-sdk';

function ClusterResources() {
  // get the hub cluster name
  const hubClusterName = useHubClusterName();

  // watch resources across clusters
  const [clusters, clustersLoaded, clustersError] = useFleetK8sWatchResource({
    kind: 'ManagedCluster',
    apiVersion: 'cluster.open-cluster-management.io/v1',
    isList: true,
  });

  // get the API path for a specific cluster
  const apiPath = useFleetK8sAPIPath('test-cluster');

  // render a list of resources with links
  return (
    <div>
      <h2>Resources from Hub: {hubClusterName}</h2>
      {clustersLoaded ? (
        <ul>
          {clusters.map(cluster => (
            <li key={cluster.metadata.uid}>
              <FleetResourceLink
                resource={cluster}
                kind="ManagedCluster"
                cluster={cluster.metadata.name}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p>Loading clusters...</p>
      )}
    </div>
  );
}

```

## API Reference

### Components

- `<FleetSupport>`: React provider component that enables multicluster support
- `<FleetResourceLink>`: Component for linking to resources across clusters

### Hooks

- `useFleetK8sWatchResource`: Watch Kubernetes resources across clusters
- `useFleetK8sAPIPath`: Get the API path for a specific cluster
- `useHubClusterName`: Get the name of the hub cluster

### Utilities

- Fleet resource typing support through TypeScript interfaces
