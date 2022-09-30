/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    policiesState,
    namespacesState,
    placementsState,
    placementRulesState,
    managedClustersState,
    policySetsState,
} from '../../../atoms'
import { nockIgnoreRBAC } from '../../../lib/nock-util'
import { clickByText, waitForNotText, waitForText } from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import { mockPlacements, mockPolicy, mockPolicySets } from '../governance.sharedMocks'
import { ManagedCluster, Namespace, NamespaceApiVersion, NamespaceKind } from '../../../resources'
import { EditPolicy } from './EditPolicy'

const namespace: Namespace = {
    apiVersion: NamespaceApiVersion,
    kind: NamespaceKind,
    metadata: {
        name: 'test',
    },
}

const mockLocalCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: {
        labels: {
            cloud: 'Amazon',
            name: 'local-cluster',
            openshiftVersion: '4.9.7',
            vendor: 'OpenShift',
        },
        name: 'local-cluster',
    },
}

const mockManagedClusters: ManagedCluster[] = [mockLocalCluster]

function TestEditPolicyPage() {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(policiesState, [mockPolicy[0]])
                snapshot.set(namespacesState, [namespace])
                snapshot.set(managedClustersState, mockManagedClusters)
                snapshot.set(placementsState, mockPlacements)
                snapshot.set(policySetsState, mockPolicySets)
            }}
        >
            <MemoryRouter>
                <Route
                    path={NavigationPath.editPolicy
                        .replace(':namespace', mockPolicy[0].metadata.namespace as string)
                        .replace(':name', mockPolicy[0].metadata.name as string)}
                    render={() => <EditPolicy />}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('Edit Policy Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
    })

    test('can render Edit Policy Page', async () => {
        window.scrollBy = () => {}
        render(<TestEditPolicyPage />)
    })

    // test('can cancel edit policy', async () => {
    //     render(<TestEditPolicyPage />)
    //     await waitForText('Edit policy')
    //     await clickByText('Cancel')
    //     await waitForNotText('Cancel')
    // })
})
