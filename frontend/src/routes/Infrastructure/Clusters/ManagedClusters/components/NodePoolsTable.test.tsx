/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { waitForText } from '../../../../../lib/test-util'
import { createResource, deleteResource, patchResource } from '../../../../../resources'
import NodePoolsTable from './NodePoolsTable'

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
            },
        },
    ]
    beforeEach(() => {
        render(
            <NodePoolsTable
                nodePools={nodePools}
                onAddNodePool={(np) => createResource(np).promise as unknown as Promise<void>}
                onRemoveNodePool={(np) => deleteResource(np).promise}
                onUpdateNodePool={(nodePool, patches) =>
                    patchResource(nodePool, patches).promise as unknown as Promise<void>
                }
                clusterImages={[]}
            />
        )
    })

    it('should render NodePoolsTable', async () => {
        await waitForText(nodePools[0].metadata.name)
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
            <NodePoolsTable
                nodePools={nodePools}
                onAddNodePool={(np) => createResource(np).promise as unknown as Promise<void>}
                onRemoveNodePool={(np) => deleteResource(np).promise}
                onUpdateNodePool={(nodePool, patches) =>
                    patchResource(nodePool, patches).promise as unknown as Promise<void>
                }
                clusterImages={[]}
            />
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
            <NodePoolsTable
                nodePools={nodePools}
                onAddNodePool={(np) => createResource(np).promise as unknown as Promise<void>}
                onRemoveNodePool={(np) => deleteResource(np).promise}
                onUpdateNodePool={(nodePool, patches) =>
                    patchResource(nodePool, patches).promise as unknown as Promise<void>
                }
                clusterImages={[]}
            />
        )
    })

    it('should render with no conditions', async () => {
        await waitForText(nodePools[0].metadata.name)
    })
})
