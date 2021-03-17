/* Copyright Contributors to the Open Cluster Management project */

import { ConfigMap, ConfigMapApiVersion, ConfigMapKind } from '../resources/configmap'
import { FeatureGate, FeatureGateApiVersion, FeatureGateKind } from '../resources/feature-gate'

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
