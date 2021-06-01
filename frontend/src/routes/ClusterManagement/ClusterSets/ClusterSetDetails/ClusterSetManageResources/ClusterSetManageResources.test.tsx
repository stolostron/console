/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Switch, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { mockManagedClusterSet } from '../../../../../lib/test-metadata'
import { mapClusters } from '../../../../../lib/get-cluster'
import { managedClusterSetLabel } from '../../../../../resources/managed-cluster-set'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../../resources/managed-cluster'
import {
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetKind,
} from '../../../../../resources/managed-cluster-set'
import {
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
} from '../../../../../resources/cluster-deployment'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
    managedClusterSetsState,
} from '../../../../../atoms'
import { NavigationPath } from '../../../../../NavigationPath'
import { ClusterSetManageResourcesPage } from './ClusterSetManageResources'
import { ClusterSetContext } from '../ClusterSetDetails'
import { nockPatch, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import {
    waitForText,
    waitForTestId,
    clickByLabel,
    clickByText,
    waitForNocks,
    waitForNotText,
} from '../../../../../lib/test-util'

const mockManagedClusterAdd: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-add',
        uid: 'managed-cluster-add',
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
const mockClusterDeploymentAdd: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        name: mockManagedClusterAdd.metadata.name!,
        namespace: mockManagedClusterAdd.metadata.name!,
        uid: mockManagedClusterAdd.metadata.name!,
        labels: {},
    },
}
const mockManagedClusterRemove: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-remove',
        uid: 'managed-cluster-remove',
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
const mockClusterDeploymentRemove: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        name: mockManagedClusterRemove.metadata.name!,
        namespace: mockManagedClusterRemove.metadata.name!,
        uid: mockManagedClusterRemove.metadata.name!,
        labels: { [managedClusterSetLabel!]: mockManagedClusterSet.metadata.name },
    },
}
const mockManagedClusterUnchanged: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-unchanged',
        uid: 'managed-cluster-unchanged',
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

const mockManagedClusterSetTransfer: ManagedClusterSet = {
    apiVersion: ManagedClusterSetApiVersion,
    kind: ManagedClusterSetKind,
    metadata: {
        name: 'test-cluster-set-transfer',
        uid: 'test-cluster-set-transfer',
    },
    spec: {},
}

const mockManagedClusterTransfer: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-transfer',
        uid: 'managed-cluster-transfer',
        labels: { [managedClusterSetLabel!]: mockManagedClusterSetTransfer.metadata.name },
    },
    spec: { hubAcceptsClient: true },
}

function nockPatchManagedCluster(clusterName: string, op: 'replace' | 'add' | 'remove', value?: string) {
    const patch: { op: 'replace' | 'add' | 'remove'; path: string; value?: string } = {
        op,
        path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
    }
    if (value) {
        patch.value = value
    }
    return nockPatch(
        {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                name: clusterName,
            },
        },
        [patch]
    )
}

function nockPatchClusterDeployment(clusterName: string, op: 'replace' | 'add' | 'remove', value?: string) {
    const patch: { op: 'replace' | 'add' | 'remove'; path: string; value?: string } = {
        op,
        path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
    }
    if (value) {
        patch.value = value
    }
    return nockPatch(
        {
            apiVersion: ClusterDeploymentApiVersion,
            kind: ClusterDeploymentKind,
            metadata: {
                name: clusterName,
                namespace: clusterName,
            },
        },
        [patch]
    )
}

const Component = () => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClustersState, [
                mockManagedClusterAdd,
                mockManagedClusterRemove,
                mockManagedClusterUnchanged,
                mockManagedClusterTransfer,
            ])
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet, mockManagedClusterSetTransfer])
            snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAdd, mockClusterDeploymentRemove])
            snapshot.set(managedClusterInfosState, [])
            snapshot.set(certificateSigningRequestsState, [])
        }}
    >
        <ClusterSetContext.Provider
            value={{
                clusterSet: mockManagedClusterSet,
                clusters: mapClusters([], [], [], [mockManagedClusterRemove, mockManagedClusterUnchanged], []),
                clusterPools: [],
            }}
        >
            <MemoryRouter
                initialEntries={[NavigationPath.clusterSetManage.replace(':id', mockManagedClusterSet.metadata.name!)]}
            >
                <Switch>
                    <Route exact path={NavigationPath.clusterSetManage}>
                        <ClusterSetManageResourcesPage />
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
    beforeEach(() => {
        nockIgnoreRBAC()
    })
    test('can update cluster assignments', async () => {
        const { container } = render(<Component />)
        await waitForNotText('Loading')
        await waitForText(mockManagedClusterAdd.metadata.name!)
        await waitForText(mockManagedClusterRemove.metadata.name!)
        await waitForText(mockManagedClusterUnchanged.metadata.name!)
        await waitForText(mockManagedClusterTransfer.metadata.name!)

        await waitForText('2 selected')

        // verify cluster to add is not assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterAdd.metadata.name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual('-')

        // verify cluster to remove is assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterRemove.metadata
                    .name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual(mockManagedClusterSet.metadata.name!)

        // verify cluster that won't be changed is assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterUnchanged.metadata
                    .name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual(mockManagedClusterSet.metadata.name!)

        // verify transferred cluster is marked under a different cluster set
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterTransfer.metadata
                    .name!}] td[data-label="table.assignedToSet"]`
            )!.innerHTML
        ).toEqual(mockManagedClusterSetTransfer.metadata.name!)

        // select the cluster to add
        await clickByLabel('Select row 0')
        // unselect the cluster to remove
        await clickByLabel('Select row 1')
        // select the cluster to transfer
        await clickByLabel('Select row 3')

        await clickByText('common:review')

        // confirm modal
        await waitForText('manageClusterSet.form.modal.title')

        await waitForText('managedClusterSet.form.added')
        await waitForText('managedClusterSet.form.removed')
        await waitForText('managedClusterSet.form.unchanged')
        await waitForText('managedClusterSet.form.transferred')

        await clickByText('common:save')

        await waitForNocks([
            // remove cluster
            nockPatchManagedCluster(mockManagedClusterRemove.metadata.name!, 'remove'),
            nockPatchClusterDeployment(mockClusterDeploymentRemove.metadata.name!, 'remove'),

            // add cluster
            nockPatchManagedCluster(mockManagedClusterAdd.metadata.name!, 'add', mockManagedClusterSet.metadata.name!),
            nockPatchClusterDeployment(
                mockClusterDeploymentAdd.metadata.name!,
                'add',
                mockManagedClusterSet.metadata.name!
            ),

            // transfer cluster
            nockPatchManagedCluster(
                mockManagedClusterTransfer.metadata.name!,
                'replace',
                mockManagedClusterSet.metadata.name!
            ),
            nockPatchClusterDeployment(
                mockManagedClusterTransfer.metadata.name!,
                'replace',
                mockManagedClusterSet.metadata.name!
            ),
        ])

        await waitForTestId('redirected')
    })
})
