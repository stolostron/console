/* Copyright Contributors to the Open Cluster Management project */

import { ConfigMap, ConfigMapApiVersion, ConfigMapKind } from '../resources/configmap'

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
