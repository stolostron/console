/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ClusterPool, ClusterPoolApiVersion, ClusterPoolKind } from '../../../resources/cluster-pool'
import { ClusterClaim, ClusterClaimApiVersion, ClusterClaimKind } from '../../../resources/cluster-claim'
import { ClusterImageSet, ClusterImageSetApiVersion, ClusterImageSetKind } from '../../../resources/cluster-image-set'
import { clusterPoolsState, clusterImageSetsState } from '../../../atoms'
import { nockCreate, nockGet, nockPatch, nockDelete, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
    clickByLabel,
    clickByText,
    typeByText,
    typeByTestId,
    waitForNocks,
    waitForText,
    clickRowAction,
    clickBulkAction,
    selectTableRow,
} from '../../../lib/test-util'
import ClusterPoolsPage from './ClusterPools'

const mockClusterImageSet: ClusterImageSet = {
    apiVersion: ClusterImageSetApiVersion,
    kind: ClusterImageSetKind,
    metadata: {
        name: 'test-cluster-image-set',
    },
    spec: {
        releaseImage: 'release-image',
    },
}

const mockClusterPool: ClusterPool = {
    apiVersion: ClusterPoolApiVersion,
    kind: ClusterPoolKind,
    metadata: {
        name: 'test-pool',
        namespace: 'test-pool-namespace',
        uid: 'abc',
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

const mockCreateClusterClaim: ClusterClaim = {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
    metadata: {
        generateName: `${mockClusterPool.metadata.name}-`,
        namespace: mockClusterPool.metadata.namespace!,
    },
    spec: {
        clusterPoolName: mockClusterPool.metadata.name!,
        lifetime: '1h',
    },
}

const mockClusterClaim: ClusterClaim = {
    apiVersion: ClusterClaimApiVersion,
    kind: ClusterClaimKind,
    metadata: {
        name: `${mockClusterPool.metadata.name}-abcd`,
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
                    snapshot.set(clusterImageSetsState, [mockClusterImageSet])
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
        await clickRowAction(1, 'clusterPool.destroy')
        await typeByText('type.to.confirm', mockClusterPool.metadata.name!)
        const deleteNocks: Scope[] = [nockDelete(mockClusterPool)]
        await clickByText('common:destroy')
        await waitForNocks(deleteNocks)
    })
    test('should be able to destroy cluster pools using bulk actions', async () => {
        await selectTableRow(1)
        await clickBulkAction('bulk.destroy.clusterPools')
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

    test('should be able to change the release image for a cluster pool', async () => {
        await waitForText(mockClusterPool.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('clusterPool.updateReleaseImage')
        await waitForText('bulk.title.updateReleaseImage')
        await clickByText('common:select')
        await clickByText(mockClusterImageSet.spec!.releaseImage)
        const patchNocks: Scope[] = [
            nockPatch(mockClusterPool, [
                {
                    op: 'replace',
                    path: '/spec/imageSetRef/name',
                    value: mockClusterImageSet.metadata.name,
                },
            ]),
        ]
        await clickByText('common:update')
        await waitForNocks(patchNocks)
    })

    test('should be able to claim a cluster', async () => {
        await waitForText(mockClusterPool.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('clusterPool.claim', 0)
        await waitForText('clusterClaim.create.title')
        await typeByTestId('clusterClaimLifetime', mockClusterClaim.spec!.lifetime!)
        const createNocks: Scope[] = [nockCreate(mockCreateClusterClaim, mockClusterClaim), nockGet(mockClusterClaim)]
        await clickByText('common:claim')
        await waitForNocks(createNocks)
    })
})
