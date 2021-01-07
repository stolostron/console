import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter, Route } from 'react-router-dom'
import { mockBadRequestStatus, nockDelete, nockList } from '../../../lib/nock-util'
import { NavigationPath } from '../../../NavigationPath'
import {
    ProviderConnection,
    ProviderConnectionApiVersion,
    ProviderConnectionKind,
} from '../../../resources/provider-connection'
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

describe('provider connections page', () => {
    test('should render the table with provider connections', async () => {
        nockList(mockProviderConnection1, mockProviderConnections, [
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
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        expect(testLocation.pathname).toEqual(NavigationPath.providerConnections)
    })

    test('should goto the edit connection page', async () => {
        nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const { getByText, getAllByLabelText } = render(
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
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        expect(testLocation.pathname).toEqual(NavigationPath.providerConnections)
        userEvent.click(getByText('edit'))
        expect(testLocation.pathname).toEqual(
            NavigationPath.editConnection
                .replace(':namespace', mockProviderConnection1.metadata.namespace!)
                .replace(':name', mockProviderConnection1.metadata.name!)
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
        const { getByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        userEvent.click(getByText('delete')) // click the delete action
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
    })

    test('should show error if delete a provider connection fails', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const badRequestStatus = nockDelete(mockProviderConnection1, mockBadRequestStatus)
        const { getByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        userEvent.click(getByText('delete')) // click the delete action
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog
        await waitFor(() => expect(badRequestStatus.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() =>
            expect(
                getByText(`Failed to delete provider connection named ${mockProviderConnection1.metadata.name}`)
            ).toBeInTheDocument()
        )
    })

    test('should be able to cancel delete a provider connection', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const { getByText, getAllByLabelText, queryAllByText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        expect(queryAllByText('modal.delete.title.single')).toHaveLength(0)
        userEvent.click(getByText('delete')) // click the delete action
        expect(queryAllByText('modal.delete.title.single')).toHaveLength(1)
        userEvent.click(getByText('cancel')) // click confirm on the delete dialog
        expect(queryAllByText('modal.delete.title.single')).toHaveLength(0)
    })

    test('should be able to bulk delete provider connections', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const deleteNock1 = nockDelete(mockProviderConnection1)
        const badRequestStatus = nockDelete(mockProviderConnection2, mockBadRequestStatus)
        const refreshNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const { getByText, queryAllByRole } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        userEvent.click(queryAllByRole('checkbox')[0]) // Select all
        userEvent.click(getByText('delete.batch')) // click the delete action
        userEvent.click(getByText('common:delete')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteNock1.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() => expect(badRequestStatus.isDone()).toBeTruthy()) // expect the delete api call
        await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
        await waitFor(() =>
            expect(
                getByText(`Failed to delete provider connection named ${mockProviderConnection2.metadata.name}`)
            ).toBeInTheDocument()
        )
    })

    test('should be able to cancel bulk delete provider connections', async () => {
        const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
            'cluster.open-cluster-management.io/cloudconnection=',
        ])
        const { getByText, queryAllByRole, queryAllByText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
        userEvent.click(queryAllByRole('checkbox')[0]) // Select all
        expect(queryAllByText('connection:modal.delete.title.batch')).toHaveLength(0)
        userEvent.click(getByText('delete.batch')) // click the delete action
        expect(queryAllByText('connection:modal.delete.title.batch')).toHaveLength(1)
        userEvent.click(getByText('cancel')) // click confirm on the delete dialog
        expect(queryAllByText('connection:modal.delete.title.batch')).toHaveLength(0)
    })

    test('should show error if the connections fail to query', async () => {
        nockList(mockProviderConnection1, mockBadRequestStatus, ['cluster.open-cluster-management.io/cloudconnection='])
        const { getByText } = render(
            <MemoryRouter>
                <ProviderConnectionsPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText('Bad request')).toBeInTheDocument())
    })
})
