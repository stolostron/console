/* Copyright Contributors to the Open Cluster Management project */
import { ManagedCluster } from '../../../resources'

export const mockLocalManagedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        annotations: {
            'open-cluster-management/created-via': 'other',
        },
        labels: {
            cloud: 'Amazon',
            'cluster.open-cluster-management.io/clusterset': 'default',
            clusterID: '6aa520b5-c9fd-41d3-bc73-2b7bff8c1b08',
            'feature.open-cluster-management.io/addon-application-manager': 'available',
            'feature.open-cluster-management.io/addon-cert-policy-controller': 'available',
            'feature.open-cluster-management.io/addon-config-policy-controller': 'available',
            'feature.open-cluster-management.io/addon-governance-policy-framework': 'available',
            'feature.open-cluster-management.io/addon-iam-policy-controller': 'available',
            'feature.open-cluster-management.io/addon-work-manager': 'available',
            'installer.name': 'multiclusterhub',
            'installer.namespace': 'open-cluster-management',
            'local-cluster': 'true',
            name: 'local-cluster',
            openshiftVersion: '4.11.0-rc.2',
            'velero.io/exclude-from-backup': 'true',
            vendor: 'OpenShift',
        },

        name: 'local-cluster',
    },
    spec: {
        hubAcceptsClient: true,
        leaseDurationSeconds: 60,
    },
    status: {
        allocatable: {
            cpu: '22500m',
            memory: '93181396Ki',
        },
        capacity: {
            cpu: '24',
            memory: '96634324Ki',
        },
        clusterClaims: [
            {
                name: 'id.k8s.io',
                value: 'local-cluster',
            },
            {
                name: 'kubeversion.open-cluster-management.io',
                value: 'v1.24.0+9546431',
            },
            {
                name: 'platform.open-cluster-management.io',
                value: 'AWS',
            },
            {
                name: 'product.open-cluster-management.io',
                value: 'OpenShift',
            },
            {
                name: 'consoleurl.cluster.open-cluster-management.io',
                value: 'https://console-openshift-console.apps.cs-aws-411-b25nm.dev02.red-chesterfield.com',
            },
            {
                name: 'controlplanetopology.openshift.io',
                value: 'HighlyAvailable',
            },
            {
                name: 'id.openshift.io',
                value: '6aa520b5-c9fd-41d3-bc73-2b7bff8c1b08',
            },
            {
                name: 'infrastructure.openshift.io',
                value: '{"infraName":"cs-aws-411-b25nm-89t8l"}',
            },
            {
                name: 'oauthredirecturis.openshift.io',
                value: 'https://oauth-openshift.apps.cs-aws-411-b25nm.dev02.red-chesterfield.com/oauth/token/implicit',
            },
            {
                name: 'region.open-cluster-management.io',
                value: 'us-east-1',
            },
            {
                name: 'version.openshift.io',
                value: '4.11.0-rc.2',
            },
        ],
        conditions: [
            // {
            //     lastTransitionTime: '2022-07-19T11:22:48Z',
            //     message: 'Accepted by hub cluster admin',
            //     reason: 'HubClusterAdminAccepted',
            //     status: 'True',
            //     type: 'HubAcceptedManagedCluster',
            // },
            // {
            //     lastTransitionTime: '2022-07-19T11:22:51Z',
            //     message: 'Import succeeded',
            //     reason: 'ManagedClusterImported',
            //     status: 'True',
            //     type: 'ManagedClusterImportSucceeded',
            // },
            // {
            //     lastTransitionTime: '2022-07-19T11:23:06Z',
            //     message: 'Managed cluster joined',
            //     reason: 'ManagedClusterJoined',
            //     status: 'True',
            //     type: 'ManagedClusterJoined',
            // },
            // {
            //     lastTransitionTime: '2022-07-19T11:23:06Z',
            //     message: 'Managed cluster is available',
            //     reason: 'ManagedClusterAvailable',
            //     status: 'True',
            //     type: 'ManagedClusterConditionAvailable',
            // },
        ],
        version: {
            kubernetes: 'v1.24.0+9546431',
        },
    },
}
