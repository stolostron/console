/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClusterSetsState,
    managedClustersState,
} from '../../../atoms'
import { nockCreate, nockDelete, nockIgnoreRBAC } from '../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../lib/test-metadata'
import {
    clickBulkAction,
    clickByText,
    selectTableRow,
    typeByText,
    waitForNock,
    waitForText,
    typeByTestId,
} from '../../../lib/test-util'
import { mockClusterDeployments, mockManagedClusterInfos, mockManagedClusters } from '../Clusters/Clusters.test'
import ClusterSetsPage from './ClusterSets'

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
            snapshot.set(clusterDeploymentsState, mockClusterDeployments)
            snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
            snapshot.set(managedClustersState, mockManagedClusters)
            snapshot.set(certificateSigningRequestsState, [])
        }}
    >
        <MemoryRouter>
            <ClusterSetsPage />
        </MemoryRouter>
    </RecoilRoot>
)

describe('ClusterSets page', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(<Component />)
    })
    test('renders', () => {
        waitForText(mockManagedClusterSet.metadata.name!)
    })
    test('can create a managed cluster set', async () => {
        await clickByText('managed.createClusterSet')
        await waitForText('createClusterSet.title')
        await typeByTestId('clusterSetName', mockManagedClusterSet.metadata.name!)
        const createNock = nockCreate(mockManagedClusterSet)
        await clickByText('common:create')
        await waitForNock(createNock)
        await waitForText('createClusterSet.success.title')
    })
    test('can delete managed cluster sets with bulk actions', async () => {
        const nock = nockDelete(mockManagedClusterSet)
        await selectTableRow(1)
        await clickBulkAction('bulk.delete.sets')
        await typeByText('type.to.confirm', 'confirm')
        await clickByText('delete')
        await waitForNock(nock)
    })
})
