import { ByRoleMatcher, ByRoleOptions, Matcher, render, SelectorMatcherOptions, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockList, nockDelete, nockClusterList, nockOptions, nockCreate } from '../../../lib/nock-util'
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
import { ResourceAttributes, SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'

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
const mockManagedCluster3: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-3-no-upgrade' },
    spec: { hubAcceptsClient: true },
}
const mockManagedCluster4: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-4-upgrade-available' },
    spec: { hubAcceptsClient: true },
}
const mockManagedCluster5: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-5-upgrading' },
    spec: { hubAcceptsClient: true },
}
function nockListManagedClusters(managedClusters?: ManagedCluster[]) {
    return nockList(
        { apiVersion: ManagedClusterApiVersion, kind: ManagedClusterKind },
        managedClusters ?? [
            mockManagedCluster1,
            mockManagedCluster2,
            mockManagedCluster3,
            mockManagedCluster4,
            mockManagedCluster5,
        ]
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
const mockManagedClusterInfo3: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name-3-no-upgrade', namespace: 'managed-cluster-name-3-no-upgrade' },
    status: {
        version: '1.17',
        distributionInfo: {
            type: 'ocp',
            ocp: {
                version: '1.2.3',
                availableUpdates: [],
                desiredVersion: '1.2.3',
                upgradeFailed: false,
            },
        },
    },
}

const mockManagedClusterInfo4: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: {
        name: 'managed-cluster-name-4-upgrade-available',
        namespace: 'anaged-cluster-name-4-upgrade-available',
    },
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
const mockManagedClusterInfo5: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name-5-upgrading', namespace: 'managed-cluster-name-5-upgrading' },
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
function nockListManagedClusterInfos(managedClusterInfos?: ManagedClusterInfo[]) {
    return nockList(
        { apiVersion: ManagedClusterInfoApiVersion, kind: ManagedClusterInfoKind },
        managedClusterInfos ?? [
            mockManagedClusterInfo0,
            mockManagedClusterInfo1,
            mockManagedClusterInfo3,
            mockManagedClusterInfo4,
            mockManagedClusterInfo5,
        ],
        undefined,
        { managedNamespacesOnly: '' }
    )
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

function nockcreateSelfSubjectAccesssRequest(resourceAttributes:ResourceAttributes, allowed:boolean){
    return nockCreate(
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes
        }
        } as SelfSubjectAccessReview, 
        {
            apiVersion: 'authorization.k8s.io/v1',
            kind: 'SelfSubjectAccessReview',
            metadata: {},
            spec: {
                resourceAttributes
        },
        status: {
            allowed
        }
        } as SelfSubjectAccessReview, 
    )
}

const createManagedClusterResourceAttribute:ResourceAttributes = {
    resource: 'managedclusteractions',
    verb: 'create',
    group: 'action.open-cluster-management.io',
    namespace: 'managed-cluster-name-1',
}

const patchManagedClusterResourceAttribute:ResourceAttributes = {
    resource: 'managedclusters',
    verb: 'patch',
    group: 'cluster.open-cluster-management.io',
    name: 'managed-cluster-name-1',
}

const deleteManagedClusterResourceAttribute:ResourceAttributes = {
    resource: 'managedclusters',
    verb: 'delete',
    group: 'cluster.open-cluster-management.io',
    name: 'managed-cluster-name-1',
}

const deleteClusterDeploymentResourceAttribute:ResourceAttributes = {
    resource: 'clusterdeployments',
    verb: 'delete',
    group: 'hive.openshift.io',
    name: 'managed-cluster-name-1',
    namespace: 'managed-cluster-name-1',
}

const deleteMachinePoolsResourceAttribute:ResourceAttributes = {
    resource: 'machinepools',
    verb: 'delete',
    group: 'hive.openshift.io',
    namespace: 'managed-cluster-name-1',
}

const createManagedClusterViewsResourceAttribute:ResourceAttributes = {
    resource: 'managedclusterviews',
    verb: 'create',
    group: 'view.open-cluster-management.io',
    namespace: 'managed-cluster-name-1',
}

const createManagedClusterActionsResourceAttribute:ResourceAttributes = {
    resource: 'managedclusteractions',
    verb: 'create',
    group: 'action.open-cluster-management.io',
    namespace: 'managed-cluster-name-1',
}

let getByText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement
let queryByText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement | null
let getAllByLabelText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement[]
let getAllByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => HTMLElement[]
let container: Element

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
        container = renderResult.container
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

        const rbacNock = nockcreateSelfSubjectAccesssRequest(patchManagedClusterResourceAttribute, true)
        nockcreateSelfSubjectAccesssRequest(deleteManagedClusterResourceAttribute, true)
        nockcreateSelfSubjectAccesssRequest(deleteManagedClusterResourceAttribute, true)
        nockcreateSelfSubjectAccesssRequest(deleteClusterDeploymentResourceAttribute, true)
        nockcreateSelfSubjectAccesssRequest(deleteMachinePoolsResourceAttribute, true)
        nockcreateSelfSubjectAccesssRequest(createManagedClusterActionsResourceAttribute, true)
        nockcreateSelfSubjectAccesssRequest(createManagedClusterViewsResourceAttribute, true)

        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        await waitFor(() => expect(rbacNock.isDone()).toBeTruthy())
        userEvent.click(getByText('managed.destroySelected')) // click the delete action
        userEvent.click(getByText('confirm')) // click confirm on the delete dialog
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
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeInTheDocument())
        userEvent.click(getAllByRole('checkbox')[1]) // select row 1
        userEvent.click(getByText('managed.destroy')) // click the bulk destroy button
        console.log('checking html: ', container.innerHTML)
        userEvent.click(getByText('confirm')) // click confirm on the delete dialog
        await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
        await waitFor(() => expect(deleteClusterDeploymentNock.isDone()).toBeTruthy())
        //await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
        //await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
        //await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
        //await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    // it('detaches cluster', async () => {
    //     const deleteManagedClusterNock = nockDelete(mockManagedCluster2)
    //     const listManagedClusterInfosNock = nockListManagedClusterInfos([])
    //     const listCertificateSigningRequestsNock = nockListCertificateSigningRequests([])
    //     const listClusterDeploymentsNock = nockListClusterDeployments([])
    //     const listManagedClustersNock = nockListManagedClusters([])
    //     userEvent.click(getAllByLabelText('Actions')[1]) // Click the action button on row
    //     userEvent.click(getByText('managed.detached')) // click the delete action
    //     userEvent.click(getByText('confirm')) // click confirm on the delete dialog
    //     await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    // })

    // it('bulk detaches cluster', async () => {
    //     const deleteManagedClusterNock = nockDelete(mockManagedCluster2)
    //     const listManagedClusterInfosNock = nockListManagedClusterInfos([])
    //     const listCertificateSigningRequestsNock = nockListCertificateSigningRequests([])
    //     const listClusterDeploymentsNock = nockListClusterDeployments([])
    //     const listManagedClustersNock = nockListManagedClusters([])
    //     userEvent.click(getAllByRole('checkbox')[2]) // select row 2
    //     userEvent.click(getByText('managed.detachSelected')) // click the bulk detach button
    //     userEvent.click(getByText('confirm')) // click confirm on the delete dialog
    //     await waitFor(() => expect(deleteManagedClusterNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listManagedClusterInfosNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listCertificateSigningRequestsNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listClusterDeploymentsNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(listManagedClustersNock.isDone()).toBeTruthy())
    //     await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    // })
    // test('overflow menu should hide upgrade option if no available upgrade', async () => {
    //     const name = mockManagedCluster3.metadata.name!
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Actions')[2]) // Click the action button on the 3rd table row
    //     expect(queryByText('managed.upgrade')).toBeFalsy()
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    // })
    // test('overflow menu should hide upgrade option if currently upgrading', async () => {
    //     const name = mockManagedCluster5.metadata.name!
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Actions')[4]) // Click the action button on the 5th table row
    //     expect(queryByText('managed.upgrade')).toBeFalsy()
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    // })
    // test('overflow menu should allow upgrade if has available upgrade', async () => {
    //     const name = mockManagedCluster4.metadata.name!
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Actions')[3]) // Click the action button on the 4th table row
    //     expect(getByText('managed.upgrade')).toBeTruthy()
    //     userEvent.click(getByText('managed.upgrade'))
    //     expect(getByText(`upgrade.title ${name}`)).toBeTruthy()
    //     userEvent.click(getByText('cancel'))
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    // })
    // test('batch upgrade support when upgrading single cluster', async () => {
    //     const name = mockManagedCluster4.metadata.name!
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    //     userEvent.click(getAllByLabelText('Select row 3')[0])
    //     userEvent.click(getByText('managed.upgradeSelected'))
    //     expect(getByText(`upgrade.title ${name}`)).toBeTruthy()
    //     userEvent.click(getByText('cancel'))
    //     await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    // })
})
