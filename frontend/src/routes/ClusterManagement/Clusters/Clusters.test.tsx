import { ByRoleMatcher, ByRoleOptions, Matcher, render, SelectorMatcherOptions, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Scope } from 'nock/types'
import React from 'react'
import { MemoryRouter } from 'react-router-dom'
import { nockCreate, nockDelete, nockList } from '../../../lib/nock-util'
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
import { ResourceAttributes, SelfSubjectAccessReview } from '../../../resources/self-subject-access-review'
import ClustersPage from './Clusters'

const mockManagedCluster1: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-1' },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}
const mockManagedCluster2: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-2' },
    spec: { hubAcceptsClient: true },
}
const readyManagedClusterConditions = [
    { type: 'ManagedClusterConditionAvailable', reason: 'ManagedClusterConditionAvailable', status: 'True' },
    { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
    { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
]
const readyManagedClusterStatus = {
    allocatable: {
        cpu: '',
        memory: '',
    },
    capacity: {
        cpu: '',
        memory: '',
    },
    version: {
        kubernetes: '1.17',
    },
    clusterClaims: [],
    conditions: readyManagedClusterConditions,
}
const mockManagedCluster3: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-3-no-upgrade' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
const mockManagedCluster4: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-4-upgrade-available' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
const mockManagedCluster5: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-5-upgrading' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
const mockManagedCluster6: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-name-6-upgrade-available' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
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
            mockManagedCluster6,
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
    metadata: { name: 'managed-cluster-name-2', namespace: 'managed-cluster-name-2', labels: { cloud: 'Google' } },
}
const mockManagedClusterInfo3: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-name-3-no-upgrade', namespace: 'managed-cluster-name-3-no-upgrade' },
    status: {
        conditions: readyManagedClusterConditions,
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
        namespace: 'managed-cluster-name-4-upgrade-available',
    },
    status: {
        conditions: readyManagedClusterConditions,
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
        conditions: readyManagedClusterConditions,
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
const mockManagedClusterInfo6: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: {
        name: 'managed-cluster-name-6-upgrade-available',
        namespace: 'anaged-cluster-name-6-upgrade-available',
    },
    status: {
        conditions: readyManagedClusterConditions,
        version: '1.17',
        distributionInfo: {
            type: 'ocp',
            ocp: {
                version: '1.2.3',
                availableUpdates: ['1.2.4', '1.2.5', '1.2.6'],
                desiredVersion: '1.2.3',
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
            mockManagedClusterInfo6,
        ],
        undefined,
        { managedNamespacesOnly: '' }
    )
}

const mockClusterDeployment: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        name: 'managed-cluster-name-1',
        namespace: 'managed-cluster-name-1',
        labels: { 'hive.openshift.io/cluster-platform': 'aws' },
    },
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

function nockcreateSelfSubjectAccesssRequest(resourceAttributes: ResourceAttributes, allowed: boolean = true) {
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

function getPatchClusterResourceAttributes(name: string) {
    return {
        resource: 'managedclusters',
        verb: 'patch',
        group: 'cluster.open-cluster-management.io',
        name,
    } as ResourceAttributes
}
function getDeleteClusterResourceAttributes(name: string) {
    return {
        resource: 'managedclusters',
        verb: 'delete',
        group: 'cluster.open-cluster-management.io',
        name: name,
    } as ResourceAttributes
}
function getDeleteDeploymentResourceAttributes(name: string) {
    return {
        resource: 'clusterdeployments',
        verb: 'delete',
        group: 'hive.openshift.io',
        name,
        namespace: name,
    } as ResourceAttributes
}
function getDeleteMachinePoolsResourceAttributes(name: string) {
    return {
        resource: 'machinepools',
        verb: 'delete',
        group: 'hive.openshift.io',
        namespace: name,
    } as ResourceAttributes
}
function getCreateClusterViewResourceAttributes(name: string) {
    return {
        resource: 'managedclusterviews',
        verb: 'create',
        group: 'view.open-cluster-management.io',
        namespace: name,
    } as ResourceAttributes
}
function getClusterActionsResourceAttributes(name: string) {
    return {
        resource: 'managedclusteractions',
        verb: 'create',
        group: 'action.open-cluster-management.io',
        namespace: name,
    } as ResourceAttributes
}

function nocksAreDone(nocks: Scope[]) {
    for (const nock of nocks) {
        if (!nock.isDone()) return false
    }
    return true
}

let getByText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement
let queryByText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement | null
let getAllByLabelText: (id: Matcher, options?: SelectorMatcherOptions) => HTMLElement[]
let getAllByRole: (role: ByRoleMatcher, options?: ByRoleOptions) => HTMLElement[]

describe('Cluster page', () => {
    beforeEach(async () => {
        const nocks: Scope[] = [
            nockListManagedClusterInfos(),
            nockListCertificateSigningRequests(),
            nockListClusterDeployments(),
            nockListManagedClusters(),
        ]
        const renderResult = render(
            <MemoryRouter>
                <ClustersPage />
            </MemoryRouter>
        )
        getByText = renderResult.getByText
        queryByText = renderResult.queryByText
        getAllByLabelText = renderResult.getAllByLabelText
        getAllByRole = renderResult.getAllByRole
        await waitFor(() => expect(nocksAreDone(nocks)).toBeTruthy())
        await waitFor(() => expect(getByText(mockManagedCluster1.metadata.name!)).toBeInTheDocument())
    })

    it('deletes cluster', async () => {
        const rbacNocks: Scope[] = [
            nockcreateSelfSubjectAccesssRequest(getPatchClusterResourceAttributes(mockManagedCluster1.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster1.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster1.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(
                getDeleteMachinePoolsResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getClusterActionsResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getCreateClusterViewResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getDeleteDeploymentResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
        ]
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster1), nockDelete(mockClusterDeployment)]
        const refreshNocks: Scope[] = [
            nockListManagedClusterInfos([]),
            nockListCertificateSigningRequests([]),
            nockListClusterDeployments([]),
            nockListManagedClusters([]),
        ]

        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on the first table row
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        userEvent.click(getByText('managed.destroySelected')) // click the delete action
        userEvent.type(getByText('type.to.confirm'), 'DESTROY')
        userEvent.click(getByText('destroy')) // click confirm on the delete dialog
        await waitFor(() => expect(nocksAreDone(deleteNocks)).toBeTruthy())
        await waitFor(() => expect(nocksAreDone(refreshNocks)).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    it('bulk deletes cluster', async () => {
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster1), nockDelete(mockClusterDeployment)]
        const refreshNocks: Scope[] = [
            nockListManagedClusterInfos([]),
            nockListCertificateSigningRequests([]),
            nockListClusterDeployments([]),
            nockListManagedClusters([]),
        ]
        userEvent.click(getAllByRole('checkbox')[1]) // select row 1
        userEvent.click(getByText('managed.destroy')) // click the bulk destroy button
        userEvent.type(getByText('type.to.confirm'), 'DESTROY')
        userEvent.click(getByText('destroy')) // click confirm on the delete dialog
        await waitFor(() => expect(nocksAreDone(deleteNocks)).toBeTruthy())
        await waitFor(() => expect(nocksAreDone(refreshNocks)).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    it('detaches cluster', async () => {
        const rbacNocks: Scope[] = [
            nockcreateSelfSubjectAccesssRequest(getPatchClusterResourceAttributes(mockManagedCluster1.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster1.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster1.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(
                getDeleteMachinePoolsResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getClusterActionsResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getCreateClusterViewResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getDeleteDeploymentResourceAttributes(mockManagedCluster1.metadata.name!)
            ),
        ]
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster1)]
        const refreshNocks: Scope[] = [
            nockListManagedClusterInfos([]),
            nockListCertificateSigningRequests([]),
            nockListClusterDeployments([]),
            nockListManagedClusters([]),
        ]

        userEvent.click(getAllByLabelText('Actions')[0]) // Click the action button on row
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        userEvent.click(getByText('managed.detached')) // click the delete action
        userEvent.type(getByText('type.to.confirm'), 'DETACH')
        userEvent.click(getByText('detach')) // click confirm on the delete dialog
        await waitFor(() => expect(nocksAreDone(deleteNocks)).toBeTruthy())
        await waitFor(() => expect(nocksAreDone(refreshNocks)).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    it('bulk detaches cluster', async () => {
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster2)]
        const refreshNocks: Scope[] = [
            nockListManagedClusterInfos([]),
            nockListCertificateSigningRequests([]),
            nockListClusterDeployments([]),
            nockListManagedClusters([]),
        ]
        userEvent.click(getAllByRole('checkbox')[2]) // select row 2
        userEvent.click(getByText('managed.detachSelected')) // click the bulk detach button
        userEvent.type(getByText('type.to.confirm'), 'DETACH')
        userEvent.click(getByText('detach')) // click confirm on the delete dialog
        await waitFor(() => expect(nocksAreDone(deleteNocks)).toBeTruthy())
        await waitFor(() => expect(nocksAreDone(refreshNocks)).toBeTruthy())
        await waitFor(() => expect(queryByText(mockManagedCluster1.metadata.name!)).toBeNull())
    })

    test('overflow menu should hide upgrade option if no available upgrade', async () => {
        const rbacNocks: Scope[] = [
            nockcreateSelfSubjectAccesssRequest(getPatchClusterResourceAttributes(mockManagedCluster3.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster3.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(
                getClusterActionsResourceAttributes(mockManagedCluster3.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getCreateClusterViewResourceAttributes(mockManagedCluster3.metadata.name!)
            ),
        ]

        const name = mockManagedCluster3.metadata.name!
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[2]) // Click the action button on the 3rd table row
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        expect(queryByText('managed.upgrade')).toBeFalsy()
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    })

    test('overflow menu should hide upgrade option if currently upgrading', async () => {
        const rbacNocks: Scope[] = [
            nockcreateSelfSubjectAccesssRequest(getPatchClusterResourceAttributes(mockManagedCluster5.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster5.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(
                getClusterActionsResourceAttributes(mockManagedCluster5.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getCreateClusterViewResourceAttributes(mockManagedCluster5.metadata.name!)
            ),
        ]

        const name = mockManagedCluster5.metadata.name!
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[4]) // Click the action button on the 5th table row
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        expect(queryByText('managed.upgrade')).toBeFalsy()
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    })

    test('overflow menu should allow upgrade if has available upgrade', async () => {
        const rbacNocks: Scope[] = [
            nockcreateSelfSubjectAccesssRequest(getPatchClusterResourceAttributes(mockManagedCluster4.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(getDeleteClusterResourceAttributes(mockManagedCluster4.metadata.name!)),
            nockcreateSelfSubjectAccesssRequest(
                getCreateClusterViewResourceAttributes(mockManagedCluster4.metadata.name!)
            ),
            nockcreateSelfSubjectAccesssRequest(
                getClusterActionsResourceAttributes(mockManagedCluster4.metadata.name!)
            ),
        ]

        const name = mockManagedCluster4.metadata.name!
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Actions')[3]) // Click the action button on the 4th table row
        await waitFor(() => expect(nocksAreDone(rbacNocks)).toBeTruthy())
        expect(getByText('managed.upgrade')).toBeTruthy()
        userEvent.click(getByText('managed.upgrade'))
        expect(getByText(`upgrade.title ${name}`)).toBeTruthy()
        userEvent.click(getByText('upgrade.cancel'))
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    })

    test('batch upgrade support when upgrading single cluster', async () => {
        const name = mockManagedCluster4.metadata.name!
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Select row 3')[0])
        userEvent.click(getByText('managed.upgradeSelected'))
        expect(getByText(`upgrade.title ${name}`)).toBeTruthy()
        userEvent.click(getByText('upgrade.cancel'))
        await waitFor(() => expect(getByText(name)).toBeInTheDocument())
    })
    test('batch upgrade support when upgrading multiple clusters', async () => {
        const name1 = mockManagedCluster4.metadata.name!
        const name2 = mockManagedCluster6.metadata.name!
        await waitFor(() => expect(getByText(name1)).toBeInTheDocument())
        await waitFor(() => expect(getByText(name2)).toBeInTheDocument())
        userEvent.click(getAllByLabelText('Select row 3')[0])
        userEvent.click(getAllByLabelText('Select row 5')[0])
        userEvent.click(getByText('managed.upgradeSelected'))
        expect(getByText(`upgrade.multiple.title`)).toBeTruthy()
        userEvent.click(getByText('upgrade.cancel'))
        await waitFor(() => expect(getByText(name1)).toBeInTheDocument())
        await waitFor(() => expect(getByText(name2)).toBeInTheDocument())
    })
})
