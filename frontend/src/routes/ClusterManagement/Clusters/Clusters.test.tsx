import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockList, nockDelete, nockNamespacedList, nockNamespacedOptions, nockClusterList, nockOptions } from '../../../lib/nock-util'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../resources/managed-cluster'
import { ManagedClusterInfo, ManagedClusterInfoApiVersion, ManagedClusterInfoKind } from '../../../resources/managed-cluster-info'
import { ClusterDeployment, ClusterDeploymentApiVersion, ClusterDeploymentKind } from '../../../resources/cluster-deployment'
import { CertificateSigningRequest, CertificateSigningRequestApiVersion, CertificateSigningRequestKind, CertificateSigningRequestListApiVersion, CertificateSigningRequestListKind} from '../../../resources/certificate-signing-requests'
import ClustersPage from './Clusters'

const mockManagedCluster: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name' },
    spec: { hubAcceptsClient: true },
}
const mockManagedClusterInfo: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-name' },
}

const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-name' },
}

const mockCertifigate: CertificateSigningRequest = {
    apiVersion: CertificateSigningRequestApiVersion,
    kind: CertificateSigningRequestKind,
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-namespace' },
}

const mockManagedClusters: ManagedCluster[] = [mockManagedCluster]
const mockManagedClusterInfos: ManagedClusterInfo[] = [mockManagedClusterInfo]
const mockCerts: CertificateSigningRequest[] = [mockCertifigate]

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

    test('render table with cluster', async () => {
        
        const listNockInfo = nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, mockManagedClusterInfos, undefined, {managedNamespacesOnly:''})
        const listNockCert = nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCerts, ['open-cluster-management.io/cluster-name'])
        const listdeployNock = nockList(mockClusterDeployment, [mockClusterDeployment], undefined, {managedNamespacesOnly:''})

        const { getByText, queryByText, getAllByLabelText, container } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listdeployNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNockInfo.isDone()).toBeTruthy())
        await waitFor(() => expect(listNockCert.isDone()).toBeTruthy())

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    })

    test('overflow menu deletes cluster', async () => {
        const listNockInfo = nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, mockManagedClusterInfos, undefined, {managedNamespacesOnly:''})
        const listNockCert = nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCerts, ['open-cluster-management.io/cluster-name'])
        const listdeployNock = nockList(mockClusterDeployment, [mockClusterDeployment], undefined, {managedNamespacesOnly:''})
        
        const listdeployNockii = nockList(mockClusterDeployment, [], undefined, {managedNamespacesOnly:''})
        const listNockInfoii = nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {managedNamespacesOnly:''})
        const listNockCertii = nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCerts, ['open-cluster-management.io/cluster-name'])
        const nockOption = nockOptions(mockManagedCluster, mockManagedCluster)
        const deleteNock = nockDelete(mockManagedCluster)

        const { getByText, queryByText, getAllByLabelText, container } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listdeployNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNockInfo.isDone()).toBeTruthy())
        await waitFor(() => expect(listNockCert.isDone()).toBeTruthy())

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        
        userEvent.click(getByText('managed.destroySelected')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(listdeployNockii.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNockInfoii.isDone()).toBeTruthy())
        await waitFor(() => expect(listNockCertii.isDone()).toBeTruthy())


        await waitFor(() =>expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
    })
    test('batch action deletes cluster', async () => {
        
        const listNockInfo = nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, mockManagedClusterInfos, undefined, {managedNamespacesOnly:''})
        const listNockCert = nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCerts, ['open-cluster-management.io/cluster-name'])
        const listdeployNock = nockList(mockClusterDeployment, [mockClusterDeployment], undefined, {managedNamespacesOnly:''})
        
        const listdeployNockii = nockList(mockClusterDeployment, [], undefined, {managedNamespacesOnly:''})
        const listNockInfoii = nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {managedNamespacesOnly:''})
        const listNockCertii = nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCerts, ['open-cluster-management.io/cluster-name'])
        const nockOption = nockOptions(mockManagedCluster, mockManagedCluster)
        const deleteNock = nockDelete(mockManagedCluster)
        const deleteNockDeployment = nockDelete(mockClusterDeployment)

        const listNockInfoiii = nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {managedNamespacesOnly:''})
        const listdeployNockiii = nockList(mockClusterDeployment, [], undefined, {managedNamespacesOnly:''})
        const listNockCertiii = nockClusterList({ apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind }, mockCerts, ['open-cluster-management.io/cluster-name'])

        const { getByText, queryByText, getAllByLabelText, container } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(listdeployNock.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNockInfo.isDone()).toBeTruthy())
        await waitFor(() => expect(listNockCert.isDone()).toBeTruthy())

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Select row 0')[0]) // Click the action button on the first table row
        
        userEvent.click(getByText('managed.destroy')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(listdeployNockii.isDone()).toBeTruthy()) // expect the list api call
        await waitFor(() => expect(listNockInfoii.isDone()).toBeTruthy())
        await waitFor(() => expect(listNockCertii.isDone()).toBeTruthy())
        await waitFor(() => expect(deleteNockDeployment.isDone()).toBeTruthy())

        await waitFor(() =>expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
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
