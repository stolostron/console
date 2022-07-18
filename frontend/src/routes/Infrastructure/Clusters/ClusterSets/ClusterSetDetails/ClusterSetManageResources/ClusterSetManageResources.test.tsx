/* Copyright Contributors to the Open Cluster Management project */

import {
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
    ClusterPool,
    ClusterPoolApiVersion,
    ClusterPoolKind,
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterKind,
    ManagedClusterSet,
    ManagedClusterSetApiVersion,
    ManagedClusterSetKind,
    managedClusterSetLabel,
    mapClusters,
} from '../../../../../../resources'
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Switch } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    clusterPoolsState,
    managedClusterInfosState,
    managedClusterSetsState,
    managedClustersState,
} from '../../../../../../atoms'
import { nockIgnoreRBAC, nockPatch } from '../../../../../../lib/nock-util'
import { mockManagedClusterSet } from '../../../../../../lib/test-metadata'
import {
    clickByLabel,
    clickByText,
    waitForNocks,
    waitForNotText,
    waitForTestId,
    waitForText,
} from '../../../../../../lib/test-util'
import { NavigationPath } from '../../../../../../NavigationPath'
import { ClusterSetContext } from '../ClusterSetDetails'
import { ClusterSetManageResourcesPage } from './ClusterSetManageResources'

const mockManagedClusterAdd: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'a-managed-cluster-add',
        uid: 'a-managed-cluster-add',
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
        name: 'b-managed-cluster-remove',
        uid: 'b-managed-cluster-remove',
        labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
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
        labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
    },
}
const mockManagedClusterUnchanged: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'c-managed-cluster-unchanged',
        uid: 'c-managed-cluster-unchanged',
        labels: { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name! },
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
        name: 'd-managed-cluster-transfer',
        uid: 'd-managed-cluster-transfer',
        labels: { [managedClusterSetLabel]: mockManagedClusterSetTransfer.metadata.name! },
    },
    spec: { hubAcceptsClient: true },
}

const mockManagedClusterClaimed: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'd-managed-cluster-claimed',
        uid: 'd-managed-cluster-claimed',
    },
    spec: { hubAcceptsClient: true },
}

const mockClusterDeploymentClaimed: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        name: mockManagedClusterClaimed.metadata.name!,
        namespace: mockManagedClusterClaimed.metadata.name!,
        uid: mockManagedClusterClaimed.metadata.name!,
    },
    spec: {
        clusterName: mockManagedClusterClaimed.metadata.name!,
        installed: true,
        provisioning: {
            imageSetRef: {
                name: '',
            },
            installConfigSecretRef: {
                name: '',
            },
            sshPrivateKeySecretRef: {
                name: '',
            },
        },
        pullSecretRef: {
            name: '',
        },
        clusterPoolRef: {
            claimName: 'e-managed-cluster-claim',
            namespace: 'e-managed-cluster-claim',
            poolName: 'a-cluster-pool-i',
        },
    },
}

const mockClusterPool: ClusterPool = {
    apiVersion: ClusterPoolApiVersion,
    kind: ClusterPoolKind,
    metadata: {
        name: 'a-cluster-pool',
        namespace: 'a-cluster-pool',
        uid: 'a-cluster-pool',
    },
    spec: {
        baseDomain: '',
        installConfigSecretTemplateRef: {
            name: '',
        },
        imageSetRef: {
            name: '',
        },
        pullSecretRef: {
            name: '',
        },
        size: 1,
    },
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
                mockManagedClusterClaimed,
            ])
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet, mockManagedClusterSetTransfer])
            snapshot.set(clusterDeploymentsState, [mockClusterDeploymentAdd, mockClusterDeploymentRemove])
            snapshot.set(managedClusterInfosState, [])
            snapshot.set(certificateSigningRequestsState, [])
            snapshot.set(clusterDeploymentsState, [
                mockClusterDeploymentAdd,
                mockClusterDeploymentRemove,
                mockClusterDeploymentClaimed,
            ])
            snapshot.set(clusterPoolsState, [mockClusterPool])
        }}
    >
        <ClusterSetContext.Provider
            value={{
                clusterSet: mockManagedClusterSet,
                clusters: mapClusters([], [], [], [mockManagedClusterRemove, mockManagedClusterUnchanged], []),
                clusterPools: [],
                submarinerAddons: undefined,
                clusterSetBindings: undefined,
                clusterDeployments: [mockClusterDeploymentClaimed],
                clusterRoleBindings: [],
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
    test('does not display claimed clusters for reassignment', async () => {
        render(<Component />)
        await waitForNotText('Loading')
        await waitForText(mockManagedClusterAdd.metadata.name!)
        await waitForText(mockManagedClusterRemove.metadata.name!)
        await waitForText(mockManagedClusterUnchanged.metadata.name!)
        await waitForText(mockManagedClusterTransfer.metadata.name!)

        await waitForNotText(mockManagedClusterClaimed.metadata.name!)
        await waitForText(mockManagedClusterAdd.metadata.name!)
    })
    test('does not display cluster pools for reassignment', async () => {
        render(<Component />)
        await waitForNotText('Loading')
        await waitForText(mockManagedClusterAdd.metadata.name!)
        await waitForText(mockManagedClusterRemove.metadata.name!)
        await waitForText(mockManagedClusterUnchanged.metadata.name!)
        await waitForText(mockManagedClusterTransfer.metadata.name!)

        await waitForNotText(mockClusterPool.metadata.name!)
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
                `[data-ouia-component-id=${mockManagedClusterAdd.metadata.name!}] td[data-label="Current cluster set"]`
            )!.innerHTML
        ).toEqual('-')

        // verify cluster to remove is assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterRemove.metadata
                    .name!}] td[data-label="Current cluster set"]`
            )!.innerHTML
        ).toEqual(mockManagedClusterSet.metadata.name!)

        // verify cluster that won't be changed is assigned
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterUnchanged.metadata
                    .name!}] td[data-label="Current cluster set"]`
            )!.innerHTML
        ).toEqual(mockManagedClusterSet.metadata.name!)

        // verify transferred cluster is marked under a different cluster set
        expect(
            container.querySelector(
                `[data-ouia-component-id=${mockManagedClusterTransfer.metadata
                    .name!}] td[data-label="Current cluster set"]`
            )!.innerHTML
        ).toEqual(mockManagedClusterSetTransfer.metadata.name!)

        // select the cluster to add
        await clickByLabel('Select row 0')
        // unselect the cluster to remove
        await clickByLabel('Select row 1')
        // select the cluster to transfer
        await clickByLabel('Select row 3')

        await clickByText('Review')

        // confirm modal
        await waitForText('Confirm changes')

        await waitForText('Added')
        await waitForText('Removed')
        await waitForText('No change')
        await waitForText('Transferred')

        await clickByText('Save')

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
