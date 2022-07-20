/* Copyright Contributors to the Open Cluster Management project */
export const mockManagedclustersets = [
    {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterSet',
        metadata: {
            annotations: {
                'cluster.open-cluster-management.io/submariner-broker-ns': 'default-broker',
            },
            name: 'default',
        },
        spec: {
            clusterSelector: {
                selectorType: 'LegacyClusterSetLabel',
            },
        },
        status: {
            conditions: [
                {
                    lastTransitionTime: '2022-07-19T11:22:48Z',
                    message: '3 ManagedClusters selected',
                    reason: 'ClustersSelected',
                    status: 'False',
                    type: 'ClusterSetEmpty',
                },
            ],
        },
    },
    {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'ManagedClusterSet',
        metadata: {
            name: 'global',
        },
        spec: {
            clusterSelector: {
                labelSelector: {},
                selectorType: 'LabelSelector',
            },
        },
        status: {
            conditions: [
                {
                    lastTransitionTime: '2022-07-19T11:22:48Z',
                    message: '3 ManagedClusters selected',
                    reason: 'ClustersSelected',
                    status: 'False',
                    type: 'ClusterSetEmpty',
                },
            ],
        },
    },
]
