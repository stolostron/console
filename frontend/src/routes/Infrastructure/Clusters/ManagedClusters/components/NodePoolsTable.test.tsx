/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CIM } from '@openshift-assisted/ui-lib'
import { RecoilRoot } from 'recoil'
import { namespacesState } from '../../../../../atoms'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../../lib/nock-util'
import { waitForText } from '../../../../../lib/test-util'
import {
    ClusterImageSetApiVersion,
    ClusterImageSetKind,
    Namespace,
    NamespaceApiVersion,
    NamespaceKind,
} from '../../../../../resources'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import NodePoolsTable from './NodePoolsTable'

const mockHostedCluster0: CIM.HostedClusterK8sResource = {
    apiVersion: 'hypershift.openshift.io/v1alpha1',
    kind: 'HostedCluster',
    metadata: {
        name: 'feng-test',
        namespace: 'clusters',
    },
    spec: {
        fips: false,
        release: {
            image: 'quay.io/openshift-release-dev/ocp-release:4.11.9-x86_64',
        },
        dns: {
            baseDomain: 'dev06.red-chesterfield.com',
            privateZoneID: 'Z04755293B3XJ2ACGO84U',
            publicZoneID: 'Z2KFHRPLWG1H9H',
        },
        controllerAvailabilityPolicy: 'SingleReplica',
        infraID: 'feng-test',
        etcd: {
            managed: {
                storage: {
                    persistentVolume: {
                        size: '4Gi',
                    },
                    type: 'PersistentVolume',
                },
            },
            managementType: 'Managed',
        },
        infrastructureAvailabilityPolicy: 'SingleReplica',
        platform: {
            aws: {
                cloudProviderConfig: {
                    subnet: {
                        id: 'subnet-048b18b8c0a7db89a',
                    },
                    vpc: 'vpc-0810759aa5a7598de',
                    zone: 'us-west-2a',
                },
                controlPlaneOperatorCreds: {},
                endpointAccess: 'Public',
                kubeCloudControllerCreds: {},
                nodePoolManagementCreds: {},
                region: 'us-west-2',
                resourceTags: [
                    {
                        key: 'kubernetes.io/cluster/feng-hs-scale-74zxh',
                        value: 'owned',
                    },
                ],
            },
            type: 'AWS',
        },
        networking: {
            clusterNetwork: [
                {
                    cidr: '10.132.0.0/14',
                },
            ],
            machineNetwork: [
                {
                    cidr: '10.1.158.0/24',
                },
            ],
            networkType: 'OVNKubernetes',
            serviceNetwork: [
                {
                    cidr: '172.31.0.0/16',
                },
            ],
        },
        clusterID: 'dff4fe12-de44-4b6f-a78d-16e831234b07',
        pullSecret: {
            name: 'pullsecret-cluster-feng-test',
        },
        issuerURL: 'https://kubernetes.default.svc',
        sshKey: {
            name: 'sshkey-cluster-feng-test',
        },
        autoscaling: {},
        olmCatalogPlacement: 'management',
        services: [
            {
                service: 'APIServer',
                servicePublishingStrategy: {
                    nodePort: {
                        address: '10.1.158.55',
                    },
                    type: 'NodePort',
                },
            },
            {
                service: 'OAuthServer',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'OIDC',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'Konnectivity',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'Ignition',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
        ],
    },
    status: {
        conditions: [
            {
                lastTransitionTime: '2022-10-24T20:34:08Z',
                message: 'Reconciliation completed succesfully',
                observedGeneration: 3,
                reason: 'ReconciliatonSucceeded',
                status: 'True',
                type: 'ReconciliationSucceeded',
            },
            {
                lastTransitionTime: '2022-11-03T19:52:46Z',
                message:
                    'Some cluster operators are still updating: console, csi-snapshot-controller, dns, image-registry, insights, kube-storage-version-migrator, monitoring, network, openshift-samples, service-ca, storage',
                observedGeneration: 3,
                reason: 'ClusterOperatorsNotAvailable',
                status: 'False',
                type: 'ClusterVersionSucceeding',
            },
            {
                lastTransitionTime: '2022-10-24T20:42:58Z',
                message:
                    'Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs which require admin consideration. Please see the knowledge article https://access.redhat.com/articles/6955381 for details and instructions.',
                observedGeneration: 1,
                reason: 'AdminAckRequired',
                status: 'False',
                type: 'ClusterVersionUpgradeable',
            },
            {
                lastTransitionTime: '2022-11-03T12:48:06Z',
                message: 'The hosted cluster is not degraded',
                observedGeneration: 3,
                reason: 'AsExpected',
                status: 'False',
                type: 'Degraded',
            },
            {
                lastTransitionTime: '2022-10-24T20:42:05Z',
                message: 'The hosted control plane is available',
                observedGeneration: 3,
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'Available',
            },
            {
                lastTransitionTime: '2022-10-24T20:34:08Z',
                message: 'Configuration passes validation',
                observedGeneration: 3,
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'ValidConfiguration',
            },
            {
                lastTransitionTime: '2022-10-24T20:34:08Z',
                message: 'HostedCluster is supported by operator configuration',
                observedGeneration: 3,
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'SupportedHostedCluster',
            },
            {
                lastTransitionTime: '2022-10-24T20:34:23Z',
                message: 'Configuration passes validation',
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'ValidHostedControlPlaneConfiguration',
            },
            {
                lastTransitionTime: '2022-10-24T20:35:36Z',
                message: 'Ignition server deployent is available',
                observedGeneration: 3,
                reason: 'IgnitionServerDeploymentAsExpected',
                status: 'True',
                type: 'IgnitionEndpointAvailable',
            },
            {
                lastTransitionTime: '2022-10-24T20:34:08Z',
                message: 'Reconciliation active on resource',
                observedGeneration: 3,
                reason: 'ReconciliationActive',
                status: 'True',
                type: 'ReconciliationActive',
            },
            {
                lastTransitionTime: '2022-10-24T20:34:09Z',
                message: 'Release image is valid',
                observedGeneration: 3,
                reason: 'AsExpected',
                status: 'True',
                type: 'ValidReleaseImage',
            },
            {
                lastTransitionTime: '2022-10-24T20:34:08Z',
                message: 'HostedCluster is at expected version',
                observedGeneration: 3,
                reason: 'AsExpected',
                status: 'False',
                type: 'Progressing',
            },
        ],
        ignitionEndpoint: 'ignition-server-feng-test-feng-test.apps.slot-09.dev06.red-chesterfield.com',
        kubeadminPassword: {
            name: 'feng-test-kubeadmin-password',
        },
        kubeconfig: {
            name: 'feng-test-admin-kubeconfig',
        },
        oauthCallbackURLTemplate:
            'https://oauth-feng-test-feng-test.apps.slot-09.dev06.red-chesterfield.com:443/oauthcallback/[identity-provider-name]',
        version: {
            desired: {
                image: 'quay.io/openshift-release-dev/ocp-release:4.11.9-x86_64',
            },
            history: [
                {
                    completionTime: '',
                    image: 'quay.io/openshift-release-dev/ocp-release:4.11.9-x86_64',
                    startedTime: '2022-10-24T20:34:08Z',
                    state: 'Partial',
                    verified: false,
                    version: '',
                },
            ],
            observedGeneration: 2,
        },
    },
}

const mockHostedCluster1: CIM.HostedClusterK8sResource = {
    apiVersion: 'hypershift.openshift.io/v1alpha1',
    kind: 'HostedCluster',
    metadata: {
        annotations: {
            'cluster.open-cluster-management.io/managedcluster-name': 'jnp-az1',
        },
        name: 'jnp-az1',
        namespace: 'clusters',
        finalizers: ['hypershift.openshift.io/finalizer'],
        labels: {
            'hypershift.openshift.io/auto-created-for-infra': 'jnp-az1-jwkcl',
        },
    },
    spec: {
        fips: false,
        release: {
            image: 'quay.io/openshift-release-dev/ocp-release:4.11.12-x86_64',
        },
        dns: {
            baseDomain: 'az.dev06.red-chesterfield.com',
            privateZoneID:
                '/subscriptions/da057d84-6570-41ea-83f7-f0f61a70542f/resourceGroups/jnp-az1-jnp-az1-jwkcl/providers/Microsoft.Network/privateDnsZones/jnp-az1-azurecluster.az.dev06.red-chesterfield.com',
            publicZoneID:
                '/subscriptions/da057d84-6570-41ea-83f7-f0f61a70542f/resourceGroups/domain/providers/Microsoft.Network/dnszones/az.dev06.red-chesterfield.com',
        },
        controllerAvailabilityPolicy: 'SingleReplica',
        infraID: 'jnp-az1-jwkcl',
        etcd: {
            managed: {
                storage: {
                    persistentVolume: {
                        size: '4Gi',
                    },
                    type: 'PersistentVolume',
                },
            },
            managementType: 'Managed',
        },
        infrastructureAvailabilityPolicy: 'SingleReplica',
        platform: {
            azure: {
                machineIdentityID:
                    '/subscriptions/da057d84-6570-41ea-83f7-f0f61a70542f/resourcegroups/jnp-az1-jnp-az1-jwkcl/providers/Microsoft.ManagedIdentity/userAssignedIdentities/jnp-az1-jnp-az1-jwkcl',
                vnetID: '/subscriptions/da057d84-6570-41ea-83f7-f0f61a70542f/resourceGroups/jnp-az1-jnp-az1-jwkcl/providers/Microsoft.Network/virtualNetworks/jnp-az1-jnp-az1-jwkcl',
                subnetName: 'default',
                securityGroupName: 'jnp-az1-jnp-az1-jwkcl-nsg',
                resourceGroup: 'jnp-az1-jnp-az1-jwkcl',
                vnetName: 'jnp-az1-jnp-az1-jwkcl',
                location: 'centralus',
                subscriptionID: 'da057d84-6570-41ea-83f7-f0f61a70542f',
                credentials: {
                    name: 'jnp-az1-cloud-credentials',
                },
            },
            type: 'Azure',
        },
        secretEncryption: {
            aescbc: {
                activeKey: {
                    name: 'jnp-az1-etcd-encryption-key',
                },
            },
            type: 'aescbc',
        },
        networking: {
            clusterNetwork: [
                {
                    cidr: '10.132.0.0/14',
                },
            ],
            networkType: 'OVNKubernetes',
            serviceNetwork: [
                {
                    cidr: '172.31.0.0/16',
                },
            ],
        },
        clusterID: '2eafc168-1956-401a-ac8a-859664930b41',
        pullSecret: {
            name: 'jnp-az1-pull-secret',
        },
        issuerURL: 'https://kubernetes.default.svc',
        autoscaling: {},
        olmCatalogPlacement: 'management',
        sshKey: {
            name: 'mykey',
        },
        services: [
            {
                service: 'APIServer',
                servicePublishingStrategy: {
                    type: 'LoadBalancer',
                },
            },
            {
                service: 'OAuthServer',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'Konnectivity',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'Ignition',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'OVNSbDb',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
        ],
    },
    status: {
        conditions: [
            {
                lastTransitionTime: '2022-10-31T16:16:17Z',
                message: 'Cluster version is 4.11.12',
                observedGeneration: 2,
                reason: 'AsExpected',
                status: 'True',
                type: 'ClusterVersionSucceeding',
            },
            {
                lastTransitionTime: '2022-10-31T15:49:58Z',
                message:
                    'Kubernetes 1.25 and therefore OpenShift 4.12 remove several APIs which require admin consideration. Please see the knowledge article https://access.redhat.com/articles/6955381 for details and instructions.',
                observedGeneration: 1,
                reason: 'AdminAckRequired',
                status: 'False',
                type: 'ClusterVersionUpgradeable',
            },
            {
                lastTransitionTime: '2022-10-31T17:41:04Z',
                message: 'The hosted cluster is not degraded',
                observedGeneration: 2,
                reason: 'AsExpected',
                status: 'False',
                type: 'Degraded',
            },
            {
                lastTransitionTime: '2022-10-31T15:48:58Z',
                message: 'The hosted control plane is available',
                observedGeneration: 2,
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'Available',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:36Z',
                message: 'Configuration passes validation',
                observedGeneration: 2,
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'ValidConfiguration',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:36Z',
                message: 'HostedCluster is supported by operator configuration',
                observedGeneration: 2,
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'SupportedHostedCluster',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:44Z',
                message: 'Configuration passes validation',
                reason: 'HostedClusterAsExpected',
                status: 'True',
                type: 'ValidHostedControlPlaneConfiguration',
            },
            {
                lastTransitionTime: '2022-10-31T15:48:59Z',
                message: 'Ignition server deployent is available',
                observedGeneration: 2,
                reason: 'IgnitionServerDeploymentAsExpected',
                status: 'True',
                type: 'IgnitionEndpointAvailable',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:36Z',
                message: 'Reconciliation active on resource',
                observedGeneration: 2,
                reason: 'ReconciliationActive',
                status: 'True',
                type: 'ReconciliationActive',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:36Z',
                message: 'Release image is valid',
                observedGeneration: 2,
                reason: 'AsExpected',
                status: 'True',
                type: 'ValidReleaseImage',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:36Z',
                message: 'HostedCluster is at expected version',
                observedGeneration: 2,
                reason: 'AsExpected',
                status: 'False',
                type: 'Progressing',
            },
            {
                lastTransitionTime: '2022-10-31T15:47:36Z',
                message: 'Reconciliation completed succesfully',
                observedGeneration: 2,
                reason: 'ReconciliatonSucceeded',
                status: 'True',
                type: 'ReconciliationSucceeded',
            },
        ],
        ignitionEndpoint: 'ignition-server-clusters-jnp-az1.apps.jnp-aws-411-hub-ml48t.dev06.red-chesterfield.com',
        kubeadminPassword: {
            name: 'jnp-az1-kubeadmin-password',
        },
        kubeconfig: {
            name: 'jnp-az1-admin-kubeconfig',
        },
        oauthCallbackURLTemplate:
            'https://oauth-clusters-jnp-az1.apps.jnp-aws-411-hub-ml48t.dev06.red-chesterfield.com:443/oauthcallback/[identity-provider-name]',
        version: {
            desired: {
                image: 'quay.io/openshift-release-dev/ocp-release:4.11.12-x86_64',
            },
            history: [
                {
                    completionTime: '2022-10-31T16:18:10Z',
                    image: 'quay.io/openshift-release-dev/ocp-release:4.11.12-x86_64',
                    startedTime: '2022-10-31T15:47:36Z',
                    state: 'Completed',
                    verified: false,
                    version: '4.11.12',
                },
            ],
            observedGeneration: 1,
        },
    },
}

const mockHostedCluster2: CIM.HostedClusterK8sResource = {
    apiVersion: 'hypershift.openshift.io/v1alpha1',
    kind: 'HostedCluster',
    metadata: {
        annotations: {
            'hypershift.openshift.io/control-plane-operator-image': 'quay.io/dravicha/hypershift:7sep_2',
        },
        creationTimestamp: '',
        name: 'hyp-ovn-1',
        namespace: 'clusters',
    },
    spec: {
        autoscaling: {},
        controllerAvailabilityPolicy: 'SingleReplica',
        dns: {
            baseDomain: 'hypershift-ppc64le.com',
            privateZoneID: '8bfae88c85977dade9d37d02854c45c3',
            publicZoneID: '8bfae88c85977dade9d37d02854c45c3',
        },
        etcd: {
            managed: {
                storage: {
                    persistentVolume: {
                        size: '4Gi',
                    },
                    restoreSnapshotURL: null,
                    type: 'PersistentVolume',
                },
            },
            managementType: 'Managed',
        },
        fips: false,
        infraID: 'hyp-ovn-1',
        networking: {
            clusterNetwork: [
                {
                    cidr: '10.132.0.0/14',
                },
            ],
            machineNetwork: [
                {
                    cidr: '10.0.0.0/16',
                },
            ],
            networkType: 'OVNKubernetes',
            serviceNetwork: [
                {
                    cidr: '172.31.0.0/16',
                },
            ],
        },
        platform: {
            powervs: {
                accountID: 'c265c8cefda241ca9c107adcbbacaa84',
                cisInstanceCRN:
                    'crn:v1:bluemix:public:internet-svcs:global:a/c265c8cefda241ca9c107adcbbacaa84:185bb127-fd81-434b-8ad9-9b363657b732::',
                ingressOperatorCloudCreds: {
                    name: 'hyp-ovn-1-ingress-creds',
                },
                kubeCloudControllerCreds: {
                    name: 'hyp-ovn-1-cloud-controller-creds',
                },
                nodePoolManagementCreds: {
                    name: 'hyp-ovn-1-node-management-creds',
                },
                region: 'tok',
                resourceGroup: 'ibm-hypershift-dev',
                serviceInstanceID: 'b5317ff9-362b-4bd1-ba04-bcb7f79ff369',
                storageOperatorCloudCreds: {
                    name: 'hyp-ovn-1-storage-creds',
                },
                subnet: {
                    id: '9057fd62-3625-4f38-8ee2-666e705a0948',
                    name: 'DHCPSERVERba27e97f1c1a4ee8a32ff349f2ed7d72_Private',
                },
                vpc: {
                    name: 'hyp-ovn-1-vpc',
                    region: 'jp-tok',
                    subnet: 'hyp-ovn-1-vpc-subnet',
                },
                zone: 'tok04',
            },
            type: 'PowerVS',
        },
        pullSecret: {
            name: 'hyp-ovn-1-pull-secret',
        },
        release: {
            image: 'quay.io/openshift-release-dev/ocp-release-nightly@sha256:e40fe4728e4071c99a961c431144a69fe4fda71d9ea63d850304e507316e671c',
        },
        secretEncryption: {
            aescbc: {
                activeKey: {
                    name: 'hyp-ovn-1-etcd-encryption-key',
                },
            },
            type: 'aescbc',
        },
        services: [
            {
                service: 'APIServer',
                servicePublishingStrategy: {
                    type: 'LoadBalancer',
                },
            },
            {
                service: 'OAuthServer',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'Konnectivity',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'Ignition',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
            {
                service: 'OVNSbDb',
                servicePublishingStrategy: {
                    type: 'Route',
                },
            },
        ],
        sshKey: {
            name: 'hyp-ovn-1-ssh-key',
        },
    },
    status: {
        conditions: [],
    },
}

const mockClusterImageSet0: CIM.ClusterImageSetK8sResource = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'img4.11.8-x86-64',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.11.8-x86_64',
    },
}

const mockNamespaces: Namespace[] = ['clusters'].map((name) => ({
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: { name },
}))

describe('NodePoolsTable', () => {
    const nodePools: any = [
        {
            apiVersion: 'hypershift.openshift.io/v1alpha1',
            kind: 'NodePool',
            metadata: {
                annotations: {
                    'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
                    'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
                },
                creationTimestamp: '2022-08-31T18:55:05Z',
                labels: {
                    'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
                },
                name: 'feng-hypershift-test',
                namespace: 'clusters',
                uid: '53d85cf8-ad72-4464-892a-f3b8be5162cb',
            },
            spec: {
                autoScaling: {
                    min: 1,
                    max: 1,
                },
                clusterName: 'feng-hypershift-test',
                management: {
                    autoRepair: true,
                    replace: {
                        rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
                        strategy: 'RollingUpdate',
                    },
                    upgradeType: 'Replace',
                },
                platform: {
                    aws: {
                        instanceProfile: 'feng-hypershift-test-mjhpv-worker',
                        instanceType: 't3.large',
                        rootVolume: { size: 35, type: 'gp3' },
                        securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
                        subnet: { id: 'subnet-067d3045daf35213d' },
                    },
                    type: 'AWS',
                },
                release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
                replicas: 1,
            },
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-08-31T19:02:51Z',
                        observedGeneration: 1,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'Ready',
                    },
                ],
                version: '4.10.15',
            },
        },
        {
            apiVersion: 'hypershift.openshift.io/v1alpha1',
            kind: 'NodePool',
            metadata: {
                annotations: {
                    'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
                    'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
                },
                creationTimestamp: '2022-08-31T18:55:05Z',
                labels: {
                    'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
                },
                name: 'feng-hypershift-test-false',
                namespace: 'clusters',
            },
            spec: {
                clusterName: 'feng-hypershift-test',
                management: {
                    autoRepair: false,
                    replace: {
                        rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
                        strategy: 'RollingUpdate',
                    },
                    upgradeType: 'Replace',
                },
                platform: {
                    aws: {
                        instanceProfile: 'feng-hypershift-test-mjhpv-worker',
                        instanceType: 't3.large',
                        rootVolume: { size: 35, type: 'gp3' },
                        securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
                        subnet: { id: 'subnet-067d3045daf35213d' },
                    },
                    type: 'AWS',
                },
                release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
                replicas: 1,
            },
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-08-31T19:02:51Z',
                        observedGeneration: 1,
                        reason: 'AsExpected',
                        type: 'Ready',
                    },
                ],
                version: '4.10.15',
            },
        },
    ]
    beforeEach(async () => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()

        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(namespacesState, mockNamespaces)
                }}
            >
                <ClusterContext.Provider
                    value={{
                        hostedCluster: mockHostedCluster0,
                        cluster: undefined,
                        addons: undefined,
                    }}
                >
                    <NodePoolsTable nodePools={nodePools} clusterImages={[mockClusterImageSet0]} />
                </ClusterContext.Provider>
            </RecoilRoot>
        )

        await waitForText(nodePools[0].metadata.name)
    })

    it('should render NodePoolsTable', async () => {
        await waitForText(nodePools[0].metadata.name)
        expect(screen.getByTestId('addNodepool')).toBeTruthy()
        await waitFor(() => expect(screen.getByTestId('addNodepool')).toHaveAttribute('aria-disabled', 'false'), {
            timeout: 5000,
        })
        userEvent.click(screen.getByTestId('addNodepool'))
        expect(screen.queryAllByText('Node pool name').length).toBe(1)
        userEvent.click(screen.getByTestId('cancel-nodepool-form'))
        expect(screen.queryAllByTestId(/pf-dropdown-toggle-id-[0-9]*/)[0]).toBeTruthy()
        userEvent.click(screen.queryAllByTestId(/pf-dropdown-toggle-id-[0-9]*/)[0])
        userEvent.click(screen.getByText('Manage node pool'))
        expect(screen.queryAllByText('Manage node pool').length).toBe(1)
        userEvent.click(screen.getByTestId('cancel-nodepool-form'))
        userEvent.click(screen.queryAllByTestId(/pf-dropdown-toggle-id-[0-9]*/)[0])
        userEvent.click(screen.getByText('Remove node pool'))
        userEvent.click(screen.getByText('Cancel'))
    })
})

describe('NodePoolsTable no status', () => {
    const nodePools: any = [
        {
            apiVersion: 'hypershift.openshift.io/v1alpha1',
            kind: 'NodePool',
            metadata: {
                annotations: {
                    'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
                    'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
                },
                creationTimestamp: '2022-08-31T18:55:05Z',
                labels: {
                    'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
                },
                name: 'feng-hypershift-test',
                namespace: 'clusters',
                uid: '53d85cf8-ad72-4464-892a-f3b8be5162cb',
            },
            spec: {
                autoScaling: {
                    min: 1,
                },
                clusterName: 'feng-hypershift-test',
                management: {
                    autoRepair: false,
                    replace: {
                        rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
                        strategy: 'RollingUpdate',
                    },
                    upgradeType: 'Replace',
                },
                platform: {
                    aws: {
                        instanceProfile: 'feng-hypershift-test-mjhpv-worker',
                        instanceType: 't3.large',
                        rootVolume: { size: 35, type: 'gp3' },
                        securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
                        subnet: { id: 'subnet-067d3045daf35213d' },
                    },
                    type: 'AWS',
                },
                release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
                replicas: 1,
            },
        },
    ]
    beforeEach(() => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
        render(
            <RecoilRoot>
                <ClusterContext.Provider
                    value={{
                        hostedCluster: mockHostedCluster0,
                        cluster: undefined,
                        addons: undefined,
                    }}
                >
                    <NodePoolsTable nodePools={nodePools} clusterImages={[]} />
                </ClusterContext.Provider>
            </RecoilRoot>
        )
    })

    it('should render with no status', async () => {
        await waitForText(nodePools[0].metadata.name)
    })
})

describe('NodePoolsTable no conditions', () => {
    const nodePools: any = [
        {
            apiVersion: 'hypershift.openshift.io/v1alpha1',
            kind: 'NodePool',
            metadata: {
                annotations: {
                    'hypershift.openshift.io/nodePoolCurrentConfig': '68dd0653',
                    'hypershift.openshift.io/nodePoolCurrentConfigVersion': '77d6686c',
                },
                creationTimestamp: '2022-08-31T18:55:05Z',
                labels: {
                    'hypershift.openshift.io/auto-created-for-infra': 'feng-hypershift-test-mjhpv',
                },
                name: 'feng-hypershift-test',
                namespace: 'clusters',
                uid: '53d85cf8-ad72-4464-892a-f3b8be5162cb',
            },
            spec: {
                autoScaling: {
                    max: 1,
                },
                clusterName: 'feng-hypershift-test',
                management: {
                    autoRepair: false,
                    replace: {
                        rollingUpdate: { maxSurge: 1, maxUnavailable: 0 },
                        strategy: 'RollingUpdate',
                    },
                    upgradeType: 'Replace',
                },
                platform: {
                    aws: {
                        instanceProfile: 'feng-hypershift-test-mjhpv-worker',
                        instanceType: 't3.large',
                        rootVolume: { size: 35, type: 'gp3' },
                        securityGroups: [{ id: 'sg-0fc3099221d8c49ce' }],
                        subnet: { id: 'subnet-067d3045daf35213d' },
                    },
                    type: 'AWS',
                },
                release: { image: 'quay.io/openshift-release-dev/ocp-release:4.10.15-x86_64' },
                replicas: 1,
            },
            status: {},
        },
    ]
    beforeEach(() => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
        render(
            <RecoilRoot>
                <ClusterContext.Provider
                    value={{
                        hostedCluster: mockHostedCluster0,
                        cluster: undefined,
                        addons: undefined,
                    }}
                >
                    <NodePoolsTable nodePools={nodePools} clusterImages={[]} />
                </ClusterContext.Provider>
            </RecoilRoot>
        )
    })

    it('should render with no conditions', async () => {
        await waitForText(nodePools[0].metadata.name)
    })
})

describe('NodePoolsTable - Azure', () => {
    const nodePools: any = [
        {
            apiVersion: 'hypershift.openshift.io/v1alpha1',
            kind: 'NodePool',
            metadata: {
                annotations: {
                    'hypershift.openshift.io/nodePoolCurrentConfig': '9d8575e4',
                    'hypershift.openshift.io/nodePoolCurrentConfigVersion': '8e581569',
                },
                resourceVersion: '6635910',
                name: 'jnp-az1',
                uid: '6baf2294-5bde-4eb1-9ceb-73ec45bced24',
                creationTimestamp: '2022-10-31T15:47:36Z',
                generation: 2,
                namespace: 'clusters',
                finalizers: ['hypershift.openshift.io/finalizer'],
                labels: {
                    'hypershift.openshift.io/auto-created-for-infra': 'jnp-az1-jwkcl',
                },
            },
            spec: {
                clusterName: 'jnp-az1',
                management: {
                    autoRepair: false,
                    replace: {
                        rollingUpdate: {
                            maxSurge: 1,
                            maxUnavailable: 0,
                        },
                        strategy: 'RollingUpdate',
                    },
                    upgradeType: 'Replace',
                },
                platform: {
                    azure: {
                        diskSizeGB: 120,
                        diskStorageAccountType: 'Premium_LRS',
                        imageID:
                            '/subscriptions/da057d84-6570-41ea-83f7-f0f61a70542f/resourceGroups/jnp-az1-jnp-az1-jwkcl/providers/Microsoft.Compute/images/rhcos.x86_64.vhd',
                        vmsize: 'Standard_D4s_v4',
                    },
                    type: 'Azure',
                },
                release: {
                    image: 'quay.io/openshift-release-dev/ocp-release:4.11.12-x86_64',
                },
                replicas: 2,
            },
            status: {
                conditions: [
                    {
                        lastTransitionTime: '2022-10-31T15:47:36Z',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'False',
                        type: 'AutoscalingEnabled',
                    },
                    {
                        lastTransitionTime: '2022-10-31T15:47:36Z',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'UpdateManagementEnabled',
                    },
                    {
                        lastTransitionTime: '2022-10-31T15:47:59Z',
                        message: 'Using release image: quay.io/openshift-release-dev/ocp-release:4.11.12-x86_64',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'ValidReleaseImage',
                    },
                    {
                        lastTransitionTime: '2022-10-31T15:49:12Z',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'ValidMachineConfig',
                    },
                    {
                        lastTransitionTime: '2022-10-31T15:49:12Z',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'ValidTuningConfig',
                    },
                    {
                        lastTransitionTime: '2022-10-31T15:49:12Z',
                        message: 'Reconciliation active on resource',
                        observedGeneration: 2,
                        reason: 'ReconciliationActive',
                        status: 'True',
                        type: 'ReconciliationActive',
                    },
                    {
                        lastTransitionTime: '2022-10-31T15:49:12Z',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'False',
                        type: 'AutorepairEnabled',
                    },
                    {
                        lastTransitionTime: '2022-10-31T16:11:35Z',
                        observedGeneration: 2,
                        reason: 'AsExpected',
                        status: 'True',
                        type: 'Ready',
                    },
                ],
                replicas: 2,
                version: '4.11.12',
            },
        },
    ]
    beforeEach(() => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
        render(
            <RecoilRoot>
                <ClusterContext.Provider
                    value={{
                        hostedCluster: mockHostedCluster1,
                        cluster: undefined,
                        addons: undefined,
                    }}
                >
                    <NodePoolsTable nodePools={nodePools} clusterImages={[]} />
                </ClusterContext.Provider>
            </RecoilRoot>
        )
    })

    it('should render Azure HC', async () => {
        await waitForText(nodePools[0].metadata.name)
        expect(screen.getAllByText('Disk storage account type').length).toBe(1)
        expect(screen.getAllByText('VM size').length).toBe(1)
    })
})

describe('NodePoolsTable - PowerVS', () => {
    const nodePools: any = [
        {
            apiVersion: 'hypershift.openshift.io/v1alpha1',
            kind: 'NodePool',
            metadata: {
                creationTimestamp: null,
                name: 'hyp-ovn-1',
                namespace: 'clusters',
            },
            spec: {
                clusterName: 'hyp-ovn-1',
                management: {
                    autoRepair: false,
                    upgradeType: 'Replace',
                },
                platform: {
                    powervs: {
                        memoryGiB: 32,
                        processorType: 'shared',
                        processors: '0.5',
                        systemType: 's922',
                    },
                    type: 'PowerVS',
                },
                release: {
                    image: 'quay.io/openshift-release-dev/ocp-release-nightly@sha256:e40fe4728e4071c99a961c431144a69fe4fda71d9ea63d850304e507316e671c',
                },
                replicas: 2,
            },
            status: {
                conditions: null,
                replicas: 0,
            },
        },
    ]
    beforeEach(() => {
        nockIgnoreRBAC()
        nockIgnoreApiPaths()
        render(
            <RecoilRoot>
                <ClusterContext.Provider
                    value={{
                        hostedCluster: mockHostedCluster2,
                        cluster: undefined,
                        addons: undefined,
                    }}
                >
                    <NodePoolsTable nodePools={nodePools} clusterImages={[]} />
                </ClusterContext.Provider>
            </RecoilRoot>
        )
    })

    it('should render PowerVS HC', async () => {
        await waitForText(nodePools[0].metadata.name)
        expect(screen.getAllByText('Processor type').length).toBe(1)
        expect(screen.getAllByText('System type').length).toBe(1)
    })
})
