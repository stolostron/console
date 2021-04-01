/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { mockManagedClusterSet } from '../../../../../lib/test-metadata'
import { mapClusters } from '../../../../../lib/get-cluster'
import { managedClusterSetLabel } from '../../../../../resources/managed-cluster-set'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../../resources/managed-cluster'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
} from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'
import { ClusterSetManageClustersPage } from './ClusterSetManageClusters'
import { ClusterSetContext } from '../ClusterSetDetails'
import { nockPatch } from '../../../../../lib/nock-util'
import {
    waitForText,
    waitForTestId,
    clickByLabel,
    clickByTestId,
    clickByText,
    waitForNocks,
} from '../../../../../lib/test-util'

const mockManagedClusterAdd: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-add',
        labels: {},
    },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}
const mockManagedClusterRemove: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-remove',
        labels: { [managedClusterSetLabel!]: mockManagedClusterSet.metadata.name },
    },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}
const mockManagedClusterUnchanged: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-unchanged',
        labels: { [managedClusterSetLabel!]: mockManagedClusterSet.metadata.name },
    },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClustersState, [
                mockManagedClusterAdd,
                mockManagedClusterRemove,
                mockManagedClusterUnchanged,
            ])
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
            snapshot.set(clusterDeploymentsState, [])
            snapshot.set(managedClusterInfosState, [])
            snapshot.set(certificateSigningRequestsState, [])
        }}
    >
        <ClusterSetContext.Provider
            value={{
                clusterSet: mockManagedClusterSet,
                clusters: mapClusters([], [], [], [mockManagedClusterRemove, mockManagedClusterUnchanged], []),
            }}
        >
            <MemoryRouter
                initialEntries={[NavigationPath.clusterSetManage.replace(':id', mockManagedClusterSet.metadata.name!)]}
            >
                <Switch>
                    <Route exact path={NavigationPath.clusterSetManage}>
                        <ClusterSetManageClustersPage />
                    </Route>
                    <Route exact path={NavigationPath.clusterSetOverview}>
                        <div id="redirected" />
                    </Route>
                </Switch>
            </MemoryRouter>
        </ClusterSetContext.Provider>
    </RecoilRoot>
)

describe('ClusterSetManageClusters', () => {
    test('can update cluster assignments', async () => {
        const { container } = render(<Component />)
        await waitForText(mockManagedClusterAdd.metadata.name!)
        await waitForText(mockManagedClusterRemove.metadata.name!)
        await waitForText(mockManagedClusterUnchanged.metadata.name!)
        await waitForText('2 selected')

        // verify cluster to add is not assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterAdd.metadata.name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual('managedClusterSet.form.unassigned')

        // verify cluster to remove is assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterRemove.metadata
                    .name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual('managedClusterSet.form.assigned')

        // verify cluster that won't be changed is assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterUnchanged.metadata
                    .name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual('managedClusterSet.form.assigned')

        // select the cluster to add
        await clickByLabel('Select row 0')
        // unselect the cluster to remove
        await clickByLabel('Select row 1')

        await clickByTestId('save')

        // confirm modal
        await waitForText('manageClusterSet.form.modal.title')

        await waitForText('managedClusterSet.form.added')
        await waitForText('managedClusterSet.form.removed')
        await waitForText('managedClusterSet.form.unchanged')

        await clickByText('common:save', 1)

        await waitForNocks([
            nockPatch(mockManagedClusterAdd, [
                {
                    op: 'add',
                    path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
                    value: mockManagedClusterSet.metadata.name!,
                },
            ]),
            nockPatch(mockManagedClusterRemove, [
                { op: 'remove', path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}` },
            ]),
        ])

        await waitForTestId('redirected')
    })
})
