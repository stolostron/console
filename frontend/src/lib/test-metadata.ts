/* Copyright Contributors to the Open Cluster Management project */

import { ConfigMap, ConfigMapApiVersion, ConfigMapKind } from '../resources/configmap'
import { FeatureGate, FeatureGateApiVersion, FeatureGateKind } from '../resources/feature-gate'
import { ManagedClusterSet, ManagedClusterSetApiVersion, ManagedClusterSetKind } from '../resources/managed-cluster-set'
import { MultiClusterHub, MultiClusterHubApiVersion, MultiClusterHubKind } from '../resources/multi-cluster-hub'

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

export const mockDiscoveryFeatureGate: FeatureGate = {
    apiVersion: FeatureGateApiVersion,
    kind: FeatureGateKind,
    metadata: { name: 'open-cluster-management-discovery' },
    spec: { featureSet: 'DiscoveryEnabled' },
}

export const mockManagedClusterSet: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'test-cluster-set',
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
}
