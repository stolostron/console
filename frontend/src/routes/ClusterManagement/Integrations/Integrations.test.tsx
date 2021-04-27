/* Copyright Contributors to the Open Cluster Management project */

import { render, waitFor } from '@testing-library/react'
import { MemoryRouter, Route } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { clusterCuratorsState, secretsState } from '../../../atoms'
import { mockBadRequestStatus, nockDelete, nockIgnoreRBAC, nockRBAC } from '../../../lib/nock-util'
import {
    clickBulkAction,
    clickByLabel,
    clickByText,
    selectTableRow,
    waitForNock,
    waitForNocks,
    waitForNotText,
    waitForText,
} from '../../../lib/test-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
// import { ResourceAttributes } from '../../../resources/self-subject-access-review'
import IntegrationsPage from './Integrations'
import { ClusterCurator, ClusterCuratorApiVersion, ClusterCuratorKind } from '../../../resources/cluster-curator'

const mockAnsibleConnection1: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'ansible-connection-1',
        namespace: 'default',
        labels: {
            'cluster.open-cluster-management.io/provider': 'ans',
        },
    },
    type: 'Opaque',
}

const mockAnsibleConnection2: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'ansible-connection-3',
        namespace: 'default',
        labels: {
            'cluster.open-cluster-management.io/provider': 'ans',
        },
    },
    type: 'Opaque',
}

const mockAnsibleConnection3: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: {
        name: 'ansible-connection-3',
        namespace: 'default',
        labels: {
            'cluster.open-cluster-management.io/provider': 'ans',
        },
    },
    type: 'Opaque',
}

const clusterCurator1: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator1',
        namespace: 'default',
    },
    spec: {
        install: {
            towerAuthSecret: 'ansible-credential-i',
            prehook: [
                {
                    name: 'test-job-i',
                },
            ],
        },
    },
}

const clusterCurator2: ClusterCurator = {
    apiVersion: ClusterCuratorApiVersion,
    kind: ClusterCuratorKind,
    metadata: {
        name: 'test-curator2',
        namespace: 'default',
    },
    spec: {
        install: {
            prehook: [
                {
                    name: 'test-job-i',
                },
            ],
        },
    },
}

const clusterCurators = [clusterCurator1, clusterCurator2]
const mockProviderConnections = [mockAnsibleConnection1, mockAnsibleConnection2, mockAnsibleConnection3]
let testLocation: Location

// function getPatchSecretResourceAttributes(name: string, namespace: string) {
//     return {
//         name,
//         namespace,
//         resource: 'secrets',
//         verb: 'patch',
//         group: '',
//     } as ResourceAttributes
// }

// function getDeleteSecretResourceAttributes(name: string, namespace: string) {
//     return {
//         name,
//         namespace,
//         resource: 'secrets',
//         verb: 'delete',
//         group: '',
//     } as ResourceAttributes
// }

function TestIntegrationPage(props: {
    providerConnections: ProviderConnection[]
    clusterCurators?: ClusterCurator[]
}) {
    return (
        <RecoilRoot
            initializeState={(snapshot) => {
                snapshot.set(secretsState, props.providerConnections)
                snapshot.set(clusterCuratorsState, props.clusterCurators || [])
            }}
        >
            <MemoryRouter initialEntries={[NavigationPath.integrations]}>
                <Route
                    path={NavigationPath.integrations}
                    render={(props: any) => {
                        testLocation = props.location
                        return <IntegrationsPage />
                    }}
                />
            </MemoryRouter>
        </RecoilRoot>
    )
}

describe('ansible job page', () => {
    beforeEach(nockIgnoreRBAC)

    test('should render the table with templates', async () => {
        render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
        await waitForText(clusterCurator1.metadata!.name!)
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.integrations))
    })

    // test('should goto the edit template page', async () => {
    //     render(<TestIntegrationPage providerConnections={mockProviderConnections} />)
    //     await waitForText(clusterCurator1.metadata!.name!)
    //     await clickByLabel('Actions', 0) // Click the action button on the first table row
    //     await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.credentials))
    //     await clickByText('credentials.tableAction.edit')
    //     await waitFor(() =>
    //         expect(testLocation.pathname).toEqual(
    //             NavigationPath.editCredentials
    //                 .replace(':namespace', clusterCurator1.metadata.namespace!)
    //                 .replace(':name', clusterCurator1.metadata.name!)
    //         )
    //     )
    // })

    test('should be able to delete a template', async () => {
        const deleteNock = nockDelete(clusterCurator2)
        render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
        await waitForText(clusterCurator2.metadata!.name!)
        await clickByLabel('Actions', 1) // Click the action button on the first table row
        await clickByText('integration.delete')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
    })

    test('should show error if delete a template fails', async () => {
        const badRequestStatus = nockDelete(clusterCurator2, mockBadRequestStatus)
        render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
        await waitForText(clusterCurator2.metadata!.name!)
        await clickByLabel('Actions', 1) // Click the action button on the first table row
        await clickByText('integration.delete')
        await clickByText('common:delete')
        await waitForNock(badRequestStatus)
        await waitForText(`Could not process request because of invalid data.`)
    })

    test('should be able to cancel delete a template', async () => {
        render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
        await waitForText(clusterCurator2.metadata!.name!)
        await clickByLabel('Actions', 1) // Click the action button on the first table row
        await clickByText('integration.delete')
        await clickByText('common:cancel')
        await waitForNotText('common:cancel')
    })

test('should be able to bulk delete templates', async () => {
    const deleteNock1 = nockDelete(clusterCurator2)
    const deleteNock2 = nockDelete(clusterCurator1)
    render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
    await waitForText(clusterCurator1.metadata!.name!)
    await selectTableRow(1)
    await clickBulkAction('bulk.delete.integrations')
    await waitForText('bulk.delete.integration.message')
    await clickByText('common:delete')
    await waitForNock(deleteNock1)
    await waitForNock(deleteNock2)
})

    test('should be able to cancel bulk delete templates', async () => {
        render(<TestIntegrationPage providerConnections={mockProviderConnections} clusterCurators={clusterCurators} />)
        await waitForText(clusterCurator1.metadata!.name!)
        await selectTableRow(1)
        await clickBulkAction('bulk.delete.integrations')
        await clickByText('common:cancel')
        await waitForNotText('common:cancel')
    })

// describe('ansible job template page RBAC', () => {
//     test('should check rbac on row action menu', async () => {
//         const rbacNocks: Scope[] = [
//             nockRBAC(getPatchSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')),
//             nockRBAC(getDeleteSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')),
//         ]
//         render(<TestIntegrationPage providerConnections={mockProviderConnections} />)
//         await waitForText(mockProviderConnection1.metadata!.name!)
//         await clickByLabel('Actions', 0) // Click the action button on the first table row
//         await waitForNocks(rbacNocks)
//     })
})
