/* Copyright Contributors to the Open Cluster Management project */
export const mockClustermanagementaddons = [
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'application-manager',
        },
        spec: {
            addOnConfiguration: {
                crName: '',
                crdName: '',
            },
            addOnMeta: {
                description: 'Processes events and other requests to managed resources.',
                displayName: 'Application Manager',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            annotations: {
                'meta.helm.sh/release-name': 'grc-aeef1',
                'meta.helm.sh/release-namespace': 'open-cluster-management',
            },
            labels: {
                'app.kubernetes.io/managed-by': 'Helm',
            },
            name: 'cert-policy-controller',
        },
        spec: {
            addOnMeta: {
                description: 'Monitors certificate expiration based on distributed policies.',
                displayName: 'Certificate Policy Addon',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            annotations: {
                'meta.helm.sh/release-name': 'grc-aeef1',
                'meta.helm.sh/release-namespace': 'open-cluster-management',
            },
            labels: {
                'app.kubernetes.io/managed-by': 'Helm',
            },
            name: 'config-policy-controller',
        },
        spec: {
            addOnMeta: {
                description: 'Audits k8s resources and remediates violation based on configuration policies.',
                displayName: 'Config Policy Addon',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            annotations: {
                'meta.helm.sh/release-name': 'grc-aeef1',
                'meta.helm.sh/release-namespace': 'open-cluster-management',
            },
            labels: {
                'app.kubernetes.io/managed-by': 'Helm',
            },
            name: 'governance-policy-framework',
        },
        spec: {
            addOnMeta: {
                description: 'Distributes policies and collects policy evaluation results.',
                displayName: 'Governance Policy Framework Addon',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            annotations: {
                'meta.helm.sh/release-name': 'grc-aeef1',
                'meta.helm.sh/release-namespace': 'open-cluster-management',
            },
            labels: {
                'app.kubernetes.io/managed-by': 'Helm',
            },
            name: 'iam-policy-controller',
        },
        spec: {
            addOnMeta: {
                description: 'Monitors identity controls based on distributed policies.',
                displayName: 'IAM Policy Addon',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            annotations: {
                'meta.helm.sh/release-name': 'search-prod-e54ed',
                'meta.helm.sh/release-namespace': 'open-cluster-management',
            },
            labels: {
                'app.kubernetes.io/managed-by': 'Helm',
            },
            name: 'search-collector',
        },
        spec: {
            addOnMeta: {
                description: 'Collects cluster data to be indexed by search components on the hub cluster.',
                displayName: 'Search Collector',
            },
        },
    },
    {
        apiVersion: 'addon.open-cluster-management.io/v1alpha1',
        kind: 'ClusterManagementAddOn',
        metadata: {
            name: 'work-manager',
            ownerReferences: [
                {
                    apiVersion: 'multicluster.openshift.io/v1',
                    blockOwnerDeletion: true,
                    controller: true,
                    kind: 'MultiClusterEngine',
                    name: 'multiclusterengine',
                    uid: 'f846eaf9-c627-441d-a9be-3e717fdf4528',
                },
            ],
        },
        spec: {
            addOnMeta: {
                description: 'work-manager provides action, view and rbac settings',
                displayName: 'work-manager',
            },
        },
    },
]
