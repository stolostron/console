/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ClusterPool, ClusterPoolApiVersion, ClusterPoolKind } from '../../../resources/cluster-pool'
import { ClusterClaim, ClusterClaimApiVersion, ClusterClaimKind } from '../../../resources/cluster-claim'
import { clusterPoolsState } from '../../../atoms'
import { nockCreate, nockGet, nockPatch, nockDelete, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByLabel, clickByText, typeByText, typeByTestId, waitForNocks, waitForText } from '../../../lib/test-util'
import ClusterPoolsPage from './ClusterPools'

const mockClusterPool: ClusterPool = {
    apiVersion: ClusterPoolApiVersion,
    kind: ClusterPoolKind,
    metadata: {
        name: 'test-pool',
        namespace: 'test-pool-namespace',
        finalizers: ['hive.openshift.io/clusters'],
    },
    spec: {
        baseDomain: 'dev.test-pool.com',
        imageSetRef: {
            name: 'img4.7.4-x86-64',
        },
        installConfigSecretTemplateRef: {
            name: 'test-pool-install-config',
        },
        platform: {
            aws: {
                credentialsSecretRef: {
                    name: 'test-pool-aws-creds',
                },
                region: 'us-east-1',
            },
        },
        pullSecretRef: {
            name: 'test-pool-pull-secret',
        },
        size: 2,
    },
    status: {
        conditions: [
            {
                message: 'There is capacity to add more clusters to the pool.',
                reason: 'Available',
                status: 'True',
                type: 'CapacityAvailable',
            },
            {
                message: 'Dependencies verified',
                reason: 'Verified',
                status: 'False',
                type: 'MissingDependencies',
            },
        ],
        ready: 2,
        size: 2,
    },
}

const mockClusterClaim: ClusterClaim = {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
    metadata: {
        name: 'test-claim',
        namespace: mockClusterPool.metadata.namespace!,
    },
    spec: {
        clusterPoolName: mockClusterPool.metadata.name!,
        lifetime: '1h',
    },
}

describe('ClusterPools page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(clusterPoolsState, [mockClusterPool])
                }}
            >
                <MemoryRouter>
                    <ClusterPoolsPage />
                </MemoryRouter>
            </RecoilRoot>
        )
    })
    test('should be able to destroy a cluster pool using a row action', async () => {
        await waitForText(mockClusterPool.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('clusterPool.destroy')
        await typeByText('type.to.confirm', mockClusterPool.metadata.name!)
        const deleteNocks: Scope[] = [nockDelete(mockClusterPool)]
        await clickByText('common:destroy')
        await waitForNocks(deleteNocks)
    })
    test('should be able to destroy cluster pools using bulk actions', async () => {
        await clickByLabel('Select row 0')
        await clickByText('bulk.destroy.clusterPools')
        await typeByText('type.to.confirm', 'confirm')
        const deleteNocks: Scope[] = [nockDelete(mockClusterPool)]
        await clickByText('common:destroy')
        await waitForNocks(deleteNocks)
    })

    test('should be able to scale a cluster pool', async () => {
        await waitForText(mockClusterPool.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('clusterPool.scale')
        await waitForText('clusterPool.modal.scale.title')
        await clickByLabel('Plus')
        const patchNocks: Scope[] = [nockPatch(mockClusterPool, [{ op: 'replace', path: '/spec/size', value: 3 }])]
        await clickByText('common:scale')
        await waitForNocks(patchNocks)
    })

    test('should be able to claim a cluster', async () => {
        await waitForText(mockClusterPool.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('clusterPool.claim')
        await waitForText('clusterClaim.create.title')
        await typeByTestId('clusterClaimName', mockClusterClaim.metadata.name!)
        await typeByTestId('clusterClaimLifetime', mockClusterClaim.spec!.lifetime!)
        const createNocks: Scope[] = [nockCreate(mockClusterClaim), nockGet(mockClusterClaim)]
        await clickByText('common:claim')
        await waitForNocks(createNocks)
    })
})
