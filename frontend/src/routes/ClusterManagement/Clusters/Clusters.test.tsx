import { ByRoleMatcher, ByRoleOptions, Matcher, render, SelectorMatcherOptions, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockList, nockClusterList, nockDelete } from '../../../lib/nock-util'
import {
    CertificateSigningRequest,
    CertificateSigningRequestApiVersion,
    CertificateSigningRequestKind,
} from '../../../resources/certificate-signing-requests'
import {
    ClusterDeployment,
    ClusterDeploymentApiVersion,
    ClusterDeploymentKind,
} from '../../../resources/cluster-deployment'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../resources/managed-cluster'
import {
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
} from '../../../resources/managed-cluster-info'
import ClustersPage from './Clusters'

const mockManagedCluster1: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-1' },
    spec: { hubAcceptsClient: true },
}
const mockManagedCluster2: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-2' },
    spec: { hubAcceptsClient: true },
}
function nockListManagedClusters(managedClusters?: ManagedCluster[]) {
    return nockList(
        { apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind },
        managedClusters ?? [mockManagedCluster1, mockManagedCluster2]
    )
}

const mockManagedClusterInfo0: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name-1', namespace: 'managed-cluster-name-1' },
}
const mockManagedClusterInfo1: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name-2', namespace: 'managed-cluster-name-2' },
}
function nockListManagedClusterInfos(managedClusterInfos?: ManagedClusterInfo[]) {
    return nockList(
        { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
        managedClusterInfos ?? [mockManagedClusterInfo0, mockManagedClusterInfo1],
        undefined,
        { managedNamespacesOnly: '' }
    )
}
const mockManagedClusterInfoUpgradeAvailable: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-name' },
    status: {
        version: '1.17',
        distributionInfo: {
            type: 'ocp',
            ocp: {
                version: '1.2.3',
                availableUpdates: ['1.2.4', '1.2.5'],
                desiredVersion: '1.2.3',
                upgradeFailed: false,
            },
        },
    },
}
const mockManagedClusterInfoUpgrading: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name', namespace: 'managed-cluster-name' },
    status: {
        version: '1.17',
        distributionInfo: {
            type: 'ocp',
            ocp: {
                version: '1.2.3',
                availableUpdates: ['1.2.4', '1.2.5'],
                desiredVersion: '1.2.4',
                upgradeFailed: false,
            },
        },
    },
}

const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: { name: 'managed-cluster-name-1', namespace: 'managed-cluster-name-1' },
}
function nockListClusterDeployments(clusterDeployments?: ClusterDeployment[]) {
    return nockList(mockClusterDeployment, clusterDeployments ?? [mockClusterDeployment], undefined, {
        managedNamespacesOnly: '',
    })
}

const mockCertifigate: CertificateSigningRequest = {
    apiVersion: CertificateSigningRequestApiVersion,
    kind: CertificateSigningRequestKind,
    metadata: { name: 'managed-cluster-name-1', namespace: 'managed-cluster-name-1' },
}
function nockListCertificateSigningRequests(certificateSigningRequest?: CertificateSigningRequest[]) {
    return nockList(
        { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
        certificateSigningRequest ?? [mockCertifigate],
        ['open-cluster-management.io/cluster-name']
    )
}

let getByText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement
let queryByText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement | null
let getAllByLabelText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement[]
let getAllByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => HTMLElement[]

describe('Cluster page', () => {
    beforeEach(async () => {
        const listManagedClusterInfosNock = nockListManagedClusterInfos()
        const listCertificateSigningRequestsNock = nockListCertificateSigningRequests()
        const listClusterDeploymentsNock = nockListClusterDeployments()
        const listManagedClustersNock = nockListManagedClusters()
        const renderResult = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        getByText = renderResult.getByText
        queryByText = renderResult.queryByText
        getAllByLabelText = renderResult.getAllByLabelText
        getAllByRole = renderResult.getAllByRole
        await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
        await waitFor(() => expect(getByText(mockManagedCluster1.metadata.name!)).toBeInTheDocument())
    })

    it('deletes cluster', async () => {
        const deleteManagedClusterNock = nockDelete(mockManagedCluster1)
        const deleteClusterDeploymentNock = nockDelete(mockClusterDeployment)
        const listManagedClusterInfosNock = nockListManagedClusterInfos([])
        const listCertificateSigningRequestsNock = nockListCertificateSigningRequests([])
        const listClusterDeploymentsNock = nockListClusterDeployments([])
        const listManagedClustersNock = nockListManagedClusters([])
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.destroySelected')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(deleteClusterDeploymentNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    it('bulk deletes cluster', async () => {
        const deleteManagedClusterNock = nockDelete(mockManagedCluster1)
        const deleteClusterDeploymentNock = nockDelete(mockClusterDeployment)
        const listManagedClusterInfosNock = nockListManagedClusterInfos([])
        const listCertificateSigningRequestsNock = nockListCertificateSigningRequests([])
        const listClusterDeploymentsNock = nockListClusterDeployments([])
        const listManagedClustersNock = nockListManagedClusters([])
        userEvent.click(getAllByRole('checkbox')[1]) // select row 1
        userEvent.click(getByText('managed.destroy')) // click the bulk destroy button
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(deleteClusterDeploymentNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    it('detaches cluster', async () => {
        const deleteManagedClusterNock = nockDelete(mockManagedCluster2)
        const listManagedClusterInfosNock = nockListManagedClusterInfos([])
        const listCertificateSigningRequestsNock = nockListCertificateSigningRequests([])
        const listClusterDeploymentsNock = nockListClusterDeployments([])
        const listManagedClustersNock = nockListManagedClusters([])
        userEvent.click(getAllByLabelText('Actions')[1]) // Click the action button on row
        userEvent.click(getByText('managed.detached')) // click the delete action
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    it('bulk detaches cluster', async () => {
        const deleteManagedClusterNock = nockDelete(mockManagedCluster2)
        const listManagedClusterInfosNock = nockListManagedClusterInfos([])
        const listCertificateSigningRequestsNock = nockListCertificateSigningRequests([])
        const listClusterDeploymentsNock = nockListClusterDeployments([])
        const listManagedClustersNock = nockListManagedClusters([])
        userEvent.click(getAllByRole('checkbox')[2]) // select row 2
        userEvent.click(getByText('managed.detachSelected')) // click the bulk detach button
        userEvent.click(getByText('Confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
        await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })
    test('overflow menu should hide upgrade option if no available upgrade', async () => {
        const mockManagedClusterInfoList: ManagedClusterInfo[] = [mockManagedClusterInfo]

        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfoList,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        const { getByText, queryAllByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        expect(queryAllByText('managed.upgrade').length).toBe(0)
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    })

    test('overflow menu should hide upgrade option if currently upgrading', async () => {
        const mockManagedClusterInfoList: ManagedClusterInfo[] = [mockManagedClusterInfoUpgrading]

        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfoList,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        const { getByText, queryAllByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        expect(queryAllByText('managed.upgrade').length).toBe(0)
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    })
    test('overflow menu should allow upgrade if has available upgrade', async () => {
        const mockManagedClusterInfoList: ManagedClusterInfo[] = [mockManagedClusterInfoUpgradeAvailable]

        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfoList,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        const { getByText, queryAllByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        expect(getByText('managed.upgrade'))
        expect(queryAllByText('managed.upgrade').length).toBeGreaterThan(0)
        userEvent.click(getByText('managed.upgrade')) // click the delete action
        expect(getByText('upgrade.title managed-cluster-name')).toBeTruthy()
        userEvent.click(getByText('cancel')) // click confirm on the delete dialog
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    })
    test('batch upgrade support when upgrading single cluster', async () => {
        const mockManagedClusterInfoList: ManagedClusterInfo[] = [mockManagedClusterInfoUpgradeAvailable]

        nockList(
            { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
            mockManagedClusterInfoList,
            undefined,
            { managedNamespacesOnly: '' }
        )
        nockClusterList(
            { apiVersion: CertificateSigningRequestApiVersion, kind: CertificateSigningRequestKind },
            mockCerts,
            ['open-cluster-management.io/cluster-name']
        )
        nockList(mockClusterDeployment, [], undefined, { managedNamespacesOnly: '' })

        const { getByText, getAllByLabelText } = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())

        userEvent.click(getAllByLabelText('Select row 0')[0]) // Click the action button on the first table row
        userEvent.click(getByText('managed.upgradeSelected')) // click the delete action
        expect(getByText('upgrade.title managed-cluster-name')).toBeTruthy()
        userEvent.click(getByText('cancel')) // click confirm on the delete dialog

        await waitFor(() => expect(getByText(mockManagedCluster.metadata.name!)).toBeInTheDocument())
    })
})
