/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ClusterPool, ClusterPoolApiVersion, ClusterPoolKind } from '../../../resources/cluster-pool'
import { clusterPoolsState } from '../../../atoms'
import { nockDelete, nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByLabel, clickByText, typeByText, waitForNocks, waitForText } from '../../../lib/test-util'
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
    test('should be able to delete a cluster pool using a row action', async () => {
        await waitForText(mockClusterPool.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('clusterPool.delete')
        await typeByText('type.to.confirm', mockClusterPool.metadata.name!)
        const deleteNocks: Scope[] = [nockDelete(mockClusterPool)]
        await clickByText('common:delete')
        await waitForNocks(deleteNocks)
    })
    test('should be able to delete cluster pools using bulk actions', async () => {
        await clickByLabel('Select row 0')
        await clickByText('bulk.delete.clusterPools')
        await typeByText('type.to.confirm', 'confirm')
        const deleteNocks: Scope[] = [nockDelete(mockClusterPool)]
        await clickByText('common:delete')
        await waitForNocks(deleteNocks)
    })
})
