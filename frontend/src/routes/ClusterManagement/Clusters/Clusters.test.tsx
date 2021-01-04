import { render, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockList, nockDelete, nockClusterList, nockOptions } from '../../../lib/nock-util'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../resources/managed-cluster'
import {
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
} from '../../../resources/managed-cluster-info'
import {
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
} from '../../../resources/cluster-deployment'
import {
    CertificateSigningRequest,
    CertificateSigningRequestApiVersion,
    CertificateSigningRequestKind,
} from '../../../resources/certificate-signing-requests'
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


const mockManagedClusterInfos: ManagedClusterInfo[] = [mockManagedClusterInfo]
const mockCerts: CertificateSigningRequest[] = [mockCertifigate]

describe('Cluster Page', () => {
    test('render table with cluster', async () => {
        const listNockInfo = nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCert = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        const listdeployNock = nockList(mockClusterDeployment, [mockClusterDeployment], undefined, {
            managedNamespacesOnly: '',
        })

        const { getByText } = render(
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
        const listNockInfo = nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCert = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        const listdeployNock = nockList(mockClusterDeployment, [mockClusterDeployment], undefined, {
            managedNamespacesOnly: '',
        })

        const listdeployNockii = nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        const listNockInfoii = nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            [],
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCertii = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockOptions(mockManagedCluster, mockManagedCluster)
        nockDelete(mockManagedCluster)

        const { getByText, queryByText, getAllByLabelText } = render(
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

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
    })
    test('batch action deletes cluster', async () => {
        const listNockInfo = nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCert = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        const listdeployNock = nockList(mockClusterDeployment, [mockClusterDeployment], undefined, {
            managedNamespacesOnly: '',
        })
        const listdeployNockii = nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        const listNockInfoii = nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            [],
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCertii = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        const deleteNockDeployment = nockDelete(mockClusterDeployment)

        nockOptions(mockManagedCluster, mockManagedCluster)
        nockDelete(mockManagedCluster)
        nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
            managedNamespacesOnly: '',
        })
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )

        const { getByText, queryByText, getAllByLabelText } = render(
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

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
    })
    test('overflow menu detaches cluster', async () => {
        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
            managedNamespacesOnly: '',
        })
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockOptions(mockManagedCluster, mockManagedCluster)
        nockDelete(mockManagedCluster)

        const { getByText, queryByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.detached')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
    })
    test('batch action detaches cluster', async () => {
        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCert = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
            managedNamespacesOnly: '',
        })
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockOptions(mockManagedCluster, mockManagedCluster)
        nockDelete(mockManagedCluster)

        const { getByText, queryByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNockCert.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Select row 0')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.detachSelected')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
    })
    test('batch action detaches cluster', async () => {
        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        const listNockCert = nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
            managedNamespacesOnly: '',
        })
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockOptions(mockManagedCluster, mockManagedCluster)
        nockDelete(mockManagedCluster)

        const { getByText, queryByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(listNockCert.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Select row 0')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.detachSelected')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeNull())
    })
    test('should be able to cancel batch action', async () => {
        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
            managedNamespacesOnly: '',
        })
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )

        const { getByText, queryByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Select row 0')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.detachSelected')) // click the delete action
        userEvent.click(getByText('Cancel')) // click confirm on the delete dialog

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeInTheDocument)
    })
    test('should be able to cancel overflow menu action', async () => {
        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfos,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })
        nockList({ apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind }, [], undefined, {
            managedNamespacesOnly: '',
        })
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )

        const { getByText, queryByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.detached')) // click the delete action
        userEvent.click(getByText('Cancel')) // click confirm on the delete dialog

        await waitFor(() => expect(queryByText(mockManagedCluster.metadata.name!)).toBeInTheDocument)
    })
})
