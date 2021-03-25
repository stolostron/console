/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import CreateClusterSet from './CreateClusterSet'
import { nockIgnoreRBAC, nockCreate, nockPatch, mockBadRequestStatus } from '../../../../lib/nock-util'
import {
    waitForText,
    waitForNotText,
    waitForTestId,
    waitForInputByTestId,
    typeByTestId,
    waitForNocks,
    clickByLabel,
    clickByText,
} from '../../../../lib/test-util'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
} from '../../../../atoms'
import { mockClusterDeployments, mockManagedClusterInfos, mockManagedClusters } from '../../Clusters/Clusters.test'
import { NavigationPath } from '../../../../NavigationPath'

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
        <MemoryRouter initialEntries={[NavigationPath.createClusterSet]}>
            <Route path={NavigationPath.createClusterSet} component={CreateClusterSet} />
            <Route path={NavigationPath.clusterSets} render={() => <div id="cluster-sets-page" />} />
            <Route path={NavigationPath.clusterSetDetails} render={() => <div id="cluster-set-details" />} />
        </MemoryRouter>
    </RecoilRoot>
)

describe('CreateClusterSet page', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(<Component />)
    })
    test('can create a cluster set', async () => {
        await waitForInputByTestId('clusterSetName')
        await typeByTestId('clusterSetName', mockManagedClusterSet.metadata.name!)

        await clickByText('createClusterSet.form.create')

        const createNock = nockCreate(mockManagedClusterSet)
        await waitForNocks([createNock])

        // cluster wasn't added, so redirect to cluster sets page
        await waitForTestId('cluster-sets-page')
    })
    test('can create a cluster set and add clusters', async () => {
        await waitForInputByTestId('clusterSetName')
        await typeByTestId('clusterSetName', mockManagedClusterSet.metadata.name!)

        await waitForText(mockManagedClusters[1].metadata.name!)
        // 0 has a set already, verify it's not in the table
        await waitForNotText(mockManagedClusters[0].metadata.name!)
        await clickByLabel('Select row 0')

        await clickByText('createClusterSet.form.create')

        const createNock = nockCreate(mockManagedClusterSet)
        const copy = JSON.parse(JSON.stringify(mockManagedClusters[1]))
        delete copy.spec
        const patchNock = nockPatch(copy, [
            {
                op: 'add',
                path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                value: mockManagedClusterSet.metadata.name!,
            },
        ])
        await waitForNocks([createNock, patchNock])

        // cluster was added, so redirect to details page
        await waitForTestId('cluster-set-details')
    })
    test('shows error message when cluster set creation fails', async () => {
        await waitForInputByTestId('clusterSetName')
        await typeByTestId('clusterSetName', mockManagedClusterSet.metadata.name!)

        await clickByText('createClusterSet.form.create')

        const createNock = nockCreate(mockManagedClusterSet, mockBadRequestStatus)

        await waitForNocks([createNock])

        await waitForText(mockBadRequestStatus.message, true)
    })
    test('shows error message when patching a managed cluster fails', async () => {
        await waitForInputByTestId('clusterSetName')
        await typeByTestId('clusterSetName', mockManagedClusterSet.metadata.name!)

        await waitForText(mockManagedClusters[1].metadata.name!)
        // 0 has a set already, verify it's not in the table
        await waitForNotText(mockManagedClusters[0].metadata.name!)
        await clickByLabel('Select row 0')

        await clickByText('createClusterSet.form.create')

        const createNock = nockCreate(mockManagedClusterSet)
        const copy = JSON.parse(JSON.stringify(mockManagedClusters[1]))
        delete copy.spec
        const patchNock = nockPatch(
            copy,
            [
                {
                    op: 'add',
                    path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                    value: mockManagedClusterSet.metadata.name!,
                },
            ],
            mockBadRequestStatus
        )
        await waitForNocks([createNock, patchNock])
        await waitForText(mockBadRequestStatus.message, true)
    })
})
