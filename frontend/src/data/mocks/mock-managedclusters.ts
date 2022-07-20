/* Copyright Contributors to the Open Cluster Management project */
export const mockManagedclusters = [
    {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: {
            name: 'local-cluster',
            labels: {
                name: 'local-cluster',
                cloud: 'Amazon',
                'local-cluster': 'true',
                'cluster.open-cluster-management.io/clusterset': 'default',
                openshiftVersion: '4.11.0-rc.2',
            },
        },
        spec: {
            hubAcceptsClient: true,
            leaseDurationSeconds: 60,
        },
    },
    {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: {
            name: 'mock-cluster-1',
            labels: {
                name: 'mock-cluster-1',
                region: 'us-east-1',
                vendor: 'OpenShift',
                cloud: 'Amazon',
                'cluster.open-cluster-management.io/clusterset': 'default',
            },
        },
        spec: {
            hubAcceptsClient: true,
            leaseDurationSeconds: 60,
        },
    },
    {
        apiVersion: 'cluster.open-cluster-management.io/v1',
        kind: 'ManagedCluster',
        metadata: {
            name: 'mock-cluster-2',
            labels: {
                name: 'mock-cluster-2',
                region: 'us-east-1',
                vendor: 'OpenShift',
                cloud: 'Amazon',
                'cluster.open-cluster-management.io/clusterset': 'default',
            },
        },
        spec: {
            hubAcceptsClient: true,
            leaseDurationSeconds: 60,
        },
    },
]
