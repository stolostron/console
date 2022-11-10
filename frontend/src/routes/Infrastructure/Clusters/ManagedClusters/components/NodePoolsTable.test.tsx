/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RecoilRoot } from 'recoil'
import { waitForText } from '../../../../../lib/test-util'
import { ClusterImageSet, ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../../../resources'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import NodePoolsTable from './NodePoolsTable'

const mockHostedCluster0 = {
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
            agent: {
                agentNamespace: 'agent-test2',
            },
            type: 'Agent',
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
                    completionTime: null,
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

const mockClusterImageSet0: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'img4.11.8-x86-64',
    },
    spec: {
        releaseImage: 'quay.io/openshift-release-dev/ocp-release:4.11.8-x86_64',
    },
}

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
    beforeEach(() => {
        render(
            <RecoilRoot>
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
    })

    it('should render NodePoolsTable', async () => {
        await waitForText(nodePools[0].metadata.name)
        expect(screen.getByTestId('addNodepool')).toBeTruthy()
        userEvent.click(screen.getByTestId('addNodepool'))
        expect(screen.queryAllByText('Nodepool name').length).toBe(1)
        userEvent.click(screen.getByTestId('cancel-nodepool-form'))
        expect(screen.queryAllByTestId(/pf-dropdown-toggle-id-[0-9]*/)[0]).toBeTruthy()
        userEvent.click(screen.queryAllByTestId(/pf-dropdown-toggle-id-[0-9]*/)[0])
        userEvent.click(screen.getByText('Manage nodepool'))
        expect(screen.queryAllByText('Manage nodepool').length).toBe(1)
        userEvent.click(screen.getByTestId('cancel-nodepool-form'))
        userEvent.click(screen.queryAllByTestId(/pf-dropdown-toggle-id-[0-9]*/)[0])
        userEvent.click(screen.getByText('Remove nodepool'))
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
        render(
            <RecoilRoot>
                <NodePoolsTable nodePools={nodePools} clusterImages={[]} />
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
        render(
            <RecoilRoot>
                <NodePoolsTable nodePools={nodePools} clusterImages={[]} />
            </RecoilRoot>
        )
    })

    it('should render with no conditions', async () => {
        await waitForText(nodePools[0].metadata.name)
    })
})
