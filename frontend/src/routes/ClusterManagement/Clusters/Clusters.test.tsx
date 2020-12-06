import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockList, nockDelete } from '../../../lib/nock-util'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../resources/managed-cluster'
import ClustersPage from './Clusters'

const mockManagedCluster: ManagedCluster = {
    apiVersion: 'cluster.open-cluster-management.io/v1',
    kind: 'ManagedCluster',
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-namespace' },
    spec: { hubAcceptsClient: true },
}

const mockManagedClusters: ManagedCluster[] = [mockManagedCluster]

// test.skip('Clusters Page', async () => {
//     nockList({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }, mockManagedClusters)
//     const { getByText } = render(
//         <MemoryRouter>
//             <ClustersPage />
//         </MemoryRouter>
//     )
//     await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
// })

describe('Cluster Page', ()=>{
    test('batch action deletes cluster', async () => {
        const listNock = nockList({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }, mockManagedClusters)
        const deleteNock = nockDelete(mockManagedCluster)
        const refreshNock = nockList(mockManagedCluster, mockManagedCluster)
        const { getByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        // userEvent.click(getByText('delete')) // click the delete action
        // userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        // await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        // await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
    })
    // test('overflow menu deletes cluster', async () => {
    //     const listNock = nockList({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }, mockManagedClusters)
    //     const deleteNock = nockDelete(mockManagedCluster)
    //     const refreshNock = nockList(mockManagedCluster, mockManagedCluster)
    //     const { getByText, getAllByLabelText } = render(
    //         <MemoryRouter>
    //             <ClustersPage />
    //         </MemoryRouter>
    //     )
    //     await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
    //     await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        // userEvent.click(getByText('delete')) // click the delete action
        // userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        // await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        // await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
    // })
    // test('overflow menu deletes cluster', async () => {
    //     const listNock = nockList({ apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind }, mockManagedClusters)
    //     const deleteNock = nockDelete(mockManagedCluster)
    //     const refreshNock = nockList(mockManagedCluster, mockManagedCluster)
    //     const { getByText, getAllByLabelText } = render(
    //         <MemoryRouter>
    //             <ClustersPage />
    //         </MemoryRouter>
    //     )
    //     await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
    //     await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row

        // userEvent.click(getByText('delete')) // click the delete action
        // userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        // await waitFor(() => expect(deleteNock.isDone()).toBeTruthy()) // expect the delete api call
        // await waitFor(() => expect(refreshNock.isDone()).toBeTruthy()) // expect the refresh api call
    // })
    // test('should be able to cancel delete a provider connection', async () => {
    //     const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
    //         'cluster.open-cluster-management.io/cloudconnection=',
    //     ])
    //     const { getByText, getAllByLabelText, queryAllByText } = render(
    //         <MemoryRouter>
    //             <ProviderConnectionsPage />
    //         </MemoryRouter>
    //     )
    //     await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
    //     await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
    //     expect(queryAllByText('modal.delete.title')).toHaveLength(0)
    //     userEvent.click(getByText('delete')) // click the delete action
    //     expect(queryAllByText('modal.delete.title')).toHaveLength(1)
    //     userEvent.click(getByText('Cancel')) // click confirm on the delete dialog
    //     expect(queryAllByText('modal.delete.title')).toHaveLength(0)
    // })
    // test('should be able to cancel bulk delete provider connections', async () => {
    //     const listNock = nockList(mockProviderConnection1, mockProviderConnections, [
    //         'cluster.open-cluster-management.io/cloudconnection=',
    //     ])
    //     const { getByText, queryAllByRole, queryAllByText } = render(
    //         <MemoryRouter>
    //             <ProviderConnectionsPage />
    //         </MemoryRouter>
    //     )

    //     await waitFor(() => expect(listNock.isDone()).toBeTruthy()) // expect the list api call
    //     await waitFor(() => expect(getByText(mockProviderConnection1.metadata!.name!)).toBeInTheDocument())
    //     userEvent.click(queryAllByRole('checkbox')[0]) // Select all
    //     expect(queryAllByText('modal.delete.title')).toHaveLength(0)
    //     userEvent.click(getByText('Delete connections')) // click the delete action
    //     expect(queryAllByText('modal.delete.title')).toHaveLength(1)
    //     userEvent.click(getByText('Cancel')) // click confirm on the delete dialog
    //     expect(queryAllByText('modal.delete.title')).toHaveLength(0)
    // })
})
