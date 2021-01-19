import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockCreate, nockDelete, nockList } from '../../../lib/nock-util'
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
    } as ResourceAttributes
}

function getDeleteSecretResourceAttributes(name: string, namespace: string) {
    return {
        name,
        namespace,
        resource: 'secrets',
        verb: 'delete',
    } as ResourceAttributes
}

function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

describe('provider connections page', () => {
    test('should render the table with provider connections', async () => {
        const listProviderConnectionNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const { getByText } = render(
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
        await waitFor(() => expect(listProviderConnectionNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.providerConnections))
    })

    test('should goto the edit connection page', async () => {
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
        const { getByText, getAllByLabelText, queryAllByText, queryAllByLabelText } = render(
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
        await waitFor(() => expect(listProviderConnectionNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())

        await waitFor(() => expect(queryAllByLabelText('Actions').length).toBeGreaterThan(0))
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        await waitFor(() => expect(testLocation.pathname).toEqual(NavigationPath.providerConnections))

        await waitFor(() => expect(queryAllByText('edit').length).toBeGreaterThan(0))
        userEvent.click(getByText('edit'))

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
        const { getByText, getAllByLabelText, queryAllByText, queryAllByLabelText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())

        await waitFor(() => expect(queryAllByLabelText('Actions').length).toBeGreaterThan(0))
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())

        await waitFor(() => expect(queryAllByText('delete').length).toBeGreaterThan(0))
        userEvent.click(getByText('delete')) // click the delete action

        await waitFor(() => expect(queryAllByText('common:delete').length).toBeGreaterThan(0))
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog

        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
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
        const { getByText, getAllByLabelText, queryAllByLabelText, queryAllByText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())

        await waitFor(() => expect(queryAllByLabelText('Actions').length).toBeGreaterThan(0))
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())

        await waitFor(() => expect(queryAllByText('delete').length).toBeGreaterThan(0))
        userEvent.click(getByText('delete')) // click the delete action

        await waitFor(() => expect(queryAllByText('common:delete').length).toBeGreaterThan(0))
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog

        await waitFor(() => expect(badRequestStatus.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() => expect(getByText(`Could not process request because of invalid data.`)).toBeInTheDocument())
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
        const { getByText, getAllByLabelText, queryAllByText, queryAllByLabelText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())

        await waitFor(() => expect(queryAllByLabelText('Actions').length).toBeGreaterThan(0))
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())

        await waitFor(() => expect(queryAllByText('delete').length).toBeGreaterThan(0))
        userEvent.click(getByText('delete')) // click the delete action

        const refreshNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])

        await waitFor(() => expect(queryAllByText('common:cancel')).toHaveLength(1))
        userEvent.click(getByText('common:cancel')) // click cancel

        await waitFor(() => expect(queryAllByText('common:cancel')).toHaveLength(0))
        await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
    })

    test('should be able to bulk delete provider connections', async () => {
        const listNock = nockList(
            mockProviderConnection1,
            [mockProviderConnection1],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        const deleteNock1 = nockDelete(mockProviderConnection1)
        const refreshNock = nockList(
            mockProviderConnection1,
            [],
            ['cluster.open-cluster-management.io/cloudconnection=']
        )
        const { getByText, queryAllByText, queryAllByRole } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryAllByText(mockProviderConnection1.metadata!.name!)).toHaveLength(1))

        await waitFor(() => expect(queryAllByRole('checkbox')).toHaveLength(2))
        userEvent.click(queryAllByRole('checkbox')[1]) // Select first item

        await waitFor(() => expect(queryAllByText('delete.batch')).toHaveLength(1))
        userEvent.click(getByText('delete.batch')) // click the batch delete

        await waitFor(() => expect(queryAllByText('common:delete')).toHaveLength(1))
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog

        await waitFor(() => expect(deleteNock1.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
        await waitFor(() => expect(queryAllByText(mockProviderConnection1.metadata!.name!)).toHaveLength(0))
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
        const { getByText, queryAllByRole, queryAllByText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())

        await waitFor(() => expect(queryAllByRole('checkbox').length).toBeGreaterThan(0))
        userEvent.click(queryAllByRole('checkbox')[0]) // Select all

        await waitFor(() => expect(queryAllByText('delete.batch')).toHaveLength(1))
        userEvent.click(getByText('delete.batch')) // click the delete action

        await waitFor(() => expect(queryAllByText('common:cancel')).toHaveLength(1))
        userEvent.click(getByText('common:cancel')) // click cancel

        await waitFor(() => expect(queryAllByText('common:cancel')).toHaveLength(0))
        await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
        await waitFor(() => expect(queryAllByText(mockProviderConnection1.metadata!.name!)).toHaveLength(0))
    })

    test('should show error if the connections fail to query', async () => {
        const listNock = nockList(mockProviderConnection1, mockBadRequestStatus, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const { getByText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    })
})
