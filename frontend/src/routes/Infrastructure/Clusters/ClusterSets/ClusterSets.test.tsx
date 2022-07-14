/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { screen } from '@testing-library/dom'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClusterSetsState,
    managedClustersState,
} from '../../../../atoms'
import { nockCreate, nockDelete, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { PluginContext } from '../../../../lib/PluginContext'
import { mockManagedClusterSet, mockGlobalClusterSet } from '../../../../lib/test-metadata'
import {
    clickBulkAction,
    clickByText,
    selectTableRow,
    typeByText,
    waitForNock,
    waitForText,
    waitForNotText,
    typeByTestId,
} from '../../../../lib/test-util'
import {
    mockClusterDeployments,
    mockManagedClusterInfos,
    mockManagedClusters,
} from '../ManagedClusters/ManagedClusters.test'
import ClusterSetsPage from './ClusterSets'

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet, mockGlobalClusterSet])
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
    test('renders', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!)
        await waitForText(mockGlobalClusterSet.metadata.name!)
        await waitForText('Submariner')
    })
    test('can create a managed cluster set', async () => {
        await clickByText('Create cluster set')
        await waitForText('Cluster set name')
        await typeByTestId('clusterSetName', mockManagedClusterSet.metadata.name!)
        const createNock = nockCreate(mockManagedClusterSet)
        await clickByText('Create')
        await waitForNock(createNock)
        await waitForText('Cluster set successfully created')
    })
    test('can delete managed cluster sets with bulk actions', async () => {
        const nock = nockDelete(mockManagedClusterSet)
        await selectTableRow(2)
        await clickBulkAction('Delete cluster sets')
        await typeByText('Confirm by typing "confirm" below:', 'confirm')
        await clickByText('Delete')
        await waitForNock(nock)
    })
    test('cannot delete global cluster sets with bulk actions', async () => {
        expect(
            screen.getByRole('checkbox', {
                name: /select row 0/i,
            })
        ).toBeDisabled()
    })
})

describe('ClusterSets page without Submariner', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(
            <PluginContext.Provider value={{ isSubmarinerAvailable: false }}>
                <Component />
            </PluginContext.Provider>
        )
    })
    test('renders', async () => {
        await waitForText(mockManagedClusterSet.metadata.name!)
        await waitForNotText('Submariner')
    })
})
