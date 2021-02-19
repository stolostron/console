import { render, waitFor } from '@testing-library/react'
import { Scope } from 'nock/types'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockCreate, nockDelete, nockList } from '../../../lib/nock-util'
import {
    clickByLabel,
    clickByRole,
    clickByText,
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
import { ResourceAttributes, SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'
import ProviderConnectionsPage from './ProviderConnections'

const mockProviderConnection1: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: { name: 'provider-connection-1', namespace: 'provider-connection-namespace' },
}

const mockProviderConnection2: ProviderConnection = {
    apiVersion: ProviderConnectionApiVersion,
    kind: ProviderConnectionKind,
    metadata: { name: 'provider-connection-2', namespace: 'provider-connection-namespace' },
}

const mockProviderConnections = [mockProviderConnection1, mockProviderConnection2]
let testLocation: Location

function nockCreateSelfSubjectAccesssRequest(resourceAttributes: ResourceAttributes, allowed: boolean = true) {
    return nockCreate(
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes,
            },
        } as SelfSubjectAccessReview,
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes,
            },
            status: {
                allowed,
            },
        } as SelfSubjectAccessReview
    )
}

function getPatchSecretResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        resource: 'secrets',
        verb: 'patch',
        group: '',
    } as ResourceAttributes
}

function getDeleteSecretResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        resource: 'secrets',
        verb: 'delete',
        group: '',
    } as ResourceAttributes
}

describe('provider connections page', () => {
    test('should render the table with provider connections', async () => {
        const listProviderConnectionNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        render(
            <MemoryRouter initialEntries={[NavigationPath.providerConnections]}>
                <Route
                    path={NavigationPath.providerConnections}
                    render={(props: any) => {
                        testLocation = props.location
                        return <ProviderConnectionsPage {...props} />
                    }}
                />
            </MemoryRouter>
        )
        await waitForNock(listProviderConnectionNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.providerConnections))
    })

    test('should go to the edit connection page', async () => {
        const listProviderConnectionNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const rbacNocks: Scope[] = [
            nockCreateSelfSubjectAccesssRequest(
                getPatchSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
            nockCreateSelfSubjectAccesssRequest(
                getDeleteSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
        ]
        render(
            <MemoryRouter initialEntries={[NavigationPath.providerConnections]}>
                <Route
                    path={NavigationPath.providerConnections}
                    render={(props: any) => {
                        testLocation = props.location
                        return <ProviderConnectionsPage {...props} />
                    }}
                />
            </MemoryRouter>
        )
        await waitForNock(listProviderConnectionNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await waitForNocks(rbacNocks)
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.providerConnections))
        await clickByText('edit')
        await waitFor(() =>
            expect(testLocation.pathname).toEqual(
                NavigationPath.editConnection
                    .replace(':namespace', mockProviderConnection1.metadata.namespace!)
                    .replace(':name', mockProviderConnection1.metadata.name!)
            )
        )
    })

    test('should be able to delete a provider connection', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const deleteNock = nockDelete(mockProviderConnection1)
        const refreshNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const rbacNocks: Scope[] = [
            nockCreateSelfSubjectAccesssRequest(
                getPatchSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
            nockCreateSelfSubjectAccesssRequest(
                getDeleteSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
        ]
        render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitForNock(listNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await waitForNocks(rbacNocks)
        await clickByText('delete')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
        await waitForNock(refreshNock)
    })

    test('should show error if delete a provider connection fails', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const rbacNocks: Scope[] = [
            nockCreateSelfSubjectAccesssRequest(
                getPatchSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
            nockCreateSelfSubjectAccesssRequest(
                getDeleteSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
        ]
        const badRequestStatus = nockDelete(mockProviderConnection1, mockBadRequestStatus)
        render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitForNock(listNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await waitForNocks(rbacNocks)
        await clickByText('delete')
        await clickByText('common:delete')
        await waitForNock(badRequestStatus)
        await waitForText(`Could not process request because of invalid data.`)
    })

    test('should be able to cancel delete a provider connection', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const rbacNocks: Scope[] = [
            nockCreateSelfSubjectAccesssRequest(
                getPatchSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
            nockCreateSelfSubjectAccesssRequest(
                getDeleteSecretResourceAttributes('provider-connection-1', 'provider-connection-namespace')
            ),
        ]
        render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitForNock(listNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByLabel('Actions', 0) // Click the action button on the first table row
        await waitForNocks(rbacNocks)
        await clickByText('delete')
        const refreshNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        await clickByText('common:cancel')
        await waitForNotText('common:cancel')
        await waitForNock(refreshNock)
    })

    test('should be able to bulk delete provider connections', async () => {
        const listNock = nockList(
            mockProviderConnection1,
            [mockProviderConnection1],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        const deleteNock = nockDelete(mockProviderConnection1)
        const refreshNock = nockList(
            mockProviderConnection1,
            [],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )

        await waitForNock(listNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByRole('checkbox', 1) // Select first item
        await clickByText('delete.batch')
        await clickByText('common:delete')
        await waitForNock(deleteNock)
        await waitForNock(refreshNock)
        await waitForNotText(mockProviderConnection1.metadata!.name!)
    })

    test('should be able to cancel bulk delete provider connections', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const refreshNock = nockList(
            mockProviderConnection1,
            [],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitForNock(listNock)
        await waitForText(mockProviderConnection1.metadata!.name!)
        await clickByRole('checkbox', 0) // Select all
        await clickByText('delete.batch')
        await clickByText('common:cancel')
        await waitForNotText('common:cancel')
        await waitForNock(refreshNock)
        await waitForNotText(mockProviderConnection1.metadata!.name!)
    })

    test('should show error if the connections fail to query', async () => {
        const listNock = nockList(mockProviderConnection1, mockBadRequestStatus, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitForNock(listNock)
        await waitForText('Bad request')
    })
})
