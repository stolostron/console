/* Copyright Contributors to the Open Cluster Management project */

import {
    ConfigMap,
    ConfigMapApiVersion,
    ConfigMapKind,
    DiscoveryConfig,
    DiscoveryConfigApiVersion,
    DiscoveryConfigKind,
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetKind,
    MultiClusterHub,
    MultiClusterHubApiVersion,
    MultiClusterHubKind,
    Secret,
    SecretApiVersion,
    SecretKind,
} from '../resources'
import { Provider } from '../ui-components'

export const mockOpenShiftConsoleConfigMap: ConfigMap = {
    apiVersion: ConfigMapApiVersion,
    kind: ConfigMapKind,
    metadata: {
        name: 'console-public',
        namespace: 'openshift-config-managed',
        annotations: {
            'release.openshift.io/create-only': 'true',
        },
    },
    data: {
        consoleURL: 'https://console-openshift-console.apps.test-cluster.dev.test.com',
    },
}

export const mockGlobalClusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'global',
    },
    spec: {},
}

export const mockManagedClusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'test-cluster-set',
    },
    spec: {},
}

export const mockGlobalManagedClusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'global',
    },
    spec: {},
}

export const multiClusterHub: MultiClusterHub = {
    apiVersion: MultiClusterHubApiVersion,
    kind: MultiClusterHubKind,
    metadata: {
        name: 'multiclusterhub',
        namespace: 'test-namespace',
    },
    spec: {},
    status: {
        currentVersion: '2.5.0',
    },
}

export const mockCRHCredential: Secret = {
    apiVersion: SecretApiVersion,
    kind: SecretKind,
    metadata: {
        name: 'ocm-api-token',
        namespace: 'ocm',
        labels: {
            'cluster.open-cluster-management.io/type': Provider.redhatcloud,
        },
    },
}

export const mockDiscoveryConfig: DiscoveryConfig = {
    apiVersion: DiscoveryConfigApiVersion,
    kind: DiscoveryConfigKind,
    metadata: { name: 'discoveryconfig', namespace: 'open-cluster-management' },
    spec: {
        credential: '',
    },
}
