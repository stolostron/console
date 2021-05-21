/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import {
    certificateSigningRequestsState,
    clusterDeploymentsState,
    managedClusterInfosState,
    managedClustersState,
} from '../../../atoms'
import { nockDelete, nockIgnoreRBAC, nockRBAC } from '../../../lib/nock-util'
import { rbacCreate } from '../../../lib/rbac-util'
import { mockManagedClusterSet } from '../../../lib/test-metadata'
import {
    clickBulkAction,
    clickByLabel,
    clickByText,
    clickRowAction,
    selectTableRow,
    typeByText,
    waitForNock,
    waitForNocks,
    waitForNotText,
    waitForText,
} from '../../../lib/test-util'
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
import {
    ManagedCluster,
    ManagedClusterApiVersion,
    ManagedClusterDefinition,
    ManagedClusterKind,
} from '../../../resources/managed-cluster'
import {
    ManagedClusterInfo,
    ManagedClusterInfoApiVersion,
    ManagedClusterInfoKind,
} from '../../../resources/managed-cluster-info'
import { managedClusterSetLabel } from '../../../resources/managed-cluster-set'
import { ResourceAttributes } from '../../../resources/self-subject-access-review'
import ClustersPage from './Clusters'

const mockManagedCluster0: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: {
        name: 'managed-cluster-0-clusterset',
        labels: { [managedClusterSetLabel!]: mockManagedClusterSet.metadata.name },
    },
    spec: { hubAcceptsClient: true },
    status: {
        allocatable: { cpu: '', memory: '' },
        capacity: { cpu: '', memory: '' },
        clusterClaims: [{ name: 'platform.open-cluster-management.io', value: 'AWS' }],
        conditions: [],
        version: { kubernetes: '' },
    },
}
const mockManagedCluster1: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-1' },
    spec: { hubAcceptsClient: true },
}
const readyManagedClusterConditions = [
    { type: 'ManagedClusterConditionAvailable', reason: 'ManagedClusterConditionAvailable', status: 'True' },
    { type: 'ManagedClusterJoined', reason: 'ManagedClusterJoined', status: 'True' },
    { type: 'HubAcceptedManagedCluster', reason: 'HubAcceptedManagedCluster', status: 'True' },
]
const readyManagedClusterStatus = {
    allocatable: { cpu: '', memory: '' },
    capacity: { cpu: '', memory: '' },
    version: { kubernetes: '1.17' },
    clusterClaims: [],
    conditions: readyManagedClusterConditions,
}
const mockManagedCluster2: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-2-no-upgrade' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
const mockManagedCluster3: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-3-upgrade-available' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
const mockManagedCluster4: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-4-upgrading' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
const mockManagedCluster5: ManagedCluster = {
    apiVersion: ManagedClusterApiVersion,
    kind: ManagedClusterKind,
    metadata: { name: 'managed-cluster-5-upgrade-available' },
    spec: { hubAcceptsClient: true },
    status: readyManagedClusterStatus,
}
export const mockManagedClusters: ManagedCluster[] = [
    mockManagedCluster0,
    mockManagedCluster1,
    mockManagedCluster2,
    mockManagedCluster3,
    mockManagedCluster4,
    mockManagedCluster5,
]
const upgradeableMockManagedClusters: ManagedCluster[] = [mockManagedCluster3, mockManagedCluster5]

const mockManagedClusterInfo0: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-0-clusterset', namespace: 'managed-cluster-0-clusterset' },
}
const mockManagedClusterInfo1: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-1', namespace: 'managed-cluster-1', labels: { cloud: 'Google' } },
}
const mockManagedClusterInfo2: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-2-no-upgrade', namespace: 'managed-cluster-2-no-upgrade' },
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
const mockManagedClusterInfo3: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: {
        name: 'managed-cluster-3-upgrade-available',
        namespace: 'managed-cluster-3-upgrade-available',
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
                channel: 'stable-1.2',
                upgradeFailed: false,
                versionAvailableUpdates: [
                    { version: '1.2.4', image: '1.2.4' },
                    { version: '1.2.5', image: '1.2.5' },
                ],
                desired: {
                    channels: ['stable-1.2', 'stable-1.3'],
                    version: '1.2.3',
                    image: 'abc',
                },
            },
        },
    },
}
const mockManagedClusterInfo4: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: { name: 'managed-cluster-4-upgrading', namespace: 'managed-cluster-4-upgrading' },
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
                versionAvailableUpdates: [
                    { version: '1.2.4', image: '1.2.4' },
                    { version: '1.2.5', image: '1.2.5' },
                ],
            },
        },
    },
}
const mockManagedClusterInfo5: ManagedClusterInfo = {
    apiVersion: ManagedClusterInfoApiVersion,
    kind: ManagedClusterInfoKind,
    metadata: {
        name: 'managed-cluster-5-upgrade-available',
        namespace: 'managed-cluster-5-upgrade-available',
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
                channel: 'stable-1.2',
                versionAvailableUpdates: [
                    { version: '1.2.4', image: '1.2.4' },
                    { version: '1.2.5', image: '1.2.5' },
                ],
                desired: {
                    channels: ['stable-1.2', 'stable-1.3'],
                    version: '1.2.3',
                    image: 'abc',
                },
            },
        },
        nodeList: [
            {
                name: 'ip-10-0-134-240.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-west-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1c',
                    'node-role.kubernetes.io/worker': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                conditions: [{ status: 'True', type: 'Ready' }],
            },
            {
                name: 'ip-10-0-130-30.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-east-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1a',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                capacity: { cpu: '4', memory: '15944104Ki' },
                conditions: [{ status: 'Unknown', type: 'Ready' }],
            },
            {
                name: 'ip-10-0-151-254.ec2.internal',
                labels: {
                    'beta.kubernetes.io/instance-type': 'm5.xlarge',
                    'failure-domain.beta.kubernetes.io/region': 'us-south-1',
                    'failure-domain.beta.kubernetes.io/zone': 'us-east-1b',
                    'node-role.kubernetes.io/master': '',
                    'node.kubernetes.io/instance-type': 'm5.xlarge',
                },
                capacity: { cpu: '4', memory: '8194000Pi' },
                conditions: [{ status: 'False', type: 'Ready' }],
            },
        ],
    },
}
export const mockManagedClusterInfos = [
    mockManagedClusterInfo0,
    mockManagedClusterInfo1,
    mockManagedClusterInfo2,
    mockManagedClusterInfo3,
    mockManagedClusterInfo4,
    mockManagedClusterInfo5,
]

const mockClusterDeployment0: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        name: 'managed-cluster-0-clusterset',
        namespace: 'managed-cluster-0-clusterset',
        labels: { 'hive.openshift.io/cluster-platform': 'aws' },
    },
}
// ClusterDeployment without a ManagedCluster
const mockClusterDeployment6: ClusterDeployment = {
    apiVersion: ClusterDeploymentApiVersion,
    kind: ClusterDeploymentKind,
    metadata: {
        name: 'managed-cluster-6-no-managed-cluster',
        namespace: 'managed-cluster-6-no-managed-cluster',
        labels: { 'hive.openshift.io/cluster-platform': 'aws' },
    },
    spec: {
        clusterName: 'managed-cluster-6-no-managed-cluster',
        installed: true,
        provisioning: {
            imageSetRef: { name: '' },
            installConfigSecretRef: { name: '' },
            sshPrivateKeySecretRef: { name: '' },
        },
        pullSecretRef: { name: '' },
    },
}
export const mockClusterDeployments = [mockClusterDeployment0, mockClusterDeployment6]

const mockCertificateSigningRequest0: CertificateSigningRequest = {
    apiVersion: CertificateSigningRequestApiVersion,
    kind: CertificateSigningRequestKind,
    metadata: { name: 'managed-cluster-0-clusterset', namespace: 'managed-cluster-0-clusterset' },
}
const mockCertificateSigningRequests = [mockCertificateSigningRequest0]

function getClusterCuratorCreateResourceAttributes(name: string) {
    return {
        resource: 'clustercurators',
        verb: 'create',
        group: 'cluster.open-cluster-management.io',
        namespace: name,
    } as ResourceAttributes
}
function getClusterCuratorPatchResourceAttributes(name: string) {
    return {
        resource: 'clustercurators',
        verb: 'patch',
        group: 'cluster.open-cluster-management.io',
        namespace: name,
    } as ResourceAttributes
}

describe('Clusters Page', () => {
    beforeEach(async () => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, mockManagedClusters)
                    snapshot.set(clusterDeploymentsState, mockClusterDeployments)
                    snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
                    snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
                }}
            >
                <MemoryRouter>
                    <ClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText(mockManagedCluster0.metadata.name!)
    })

    test('should be able to delete cluster using row action', async () => {
        await clickRowAction(1, 'managed.destroy')
        await typeByText('type.to.confirm', mockManagedCluster0.metadata!.name!)
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0), nockDelete(mockClusterDeployment0)]
        await clickByText('destroy')
        await waitForNocks(deleteNocks)
    })

    test('should be able to delete cluster using bulk action', async () => {
        await selectTableRow(1)
        await clickBulkAction('managed.destroy.plural')
        await typeByText('type.to.confirm', 'confirm')
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0), nockDelete(mockClusterDeployment0)]
        await clickByText('destroy')
        await waitForNocks(deleteNocks)
    })

    test('should be able to detach cluster using row action', async () => {
        await clickRowAction(1, 'managed.detach')
        await typeByText('type.to.confirm', mockManagedCluster0.metadata!.name!)
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0)]
        await clickByText('detach')
        await waitForNocks(deleteNocks)
    })

    test('should be able to detach cluster using bulk action', async () => {
        await selectTableRow(2)
        await clickBulkAction('managed.detach.plural')
        await typeByText('type.to.confirm', 'confirm')
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster1)]
        await clickByText('detach')
        await waitForNocks(deleteNocks)
    })

    test('overflow menu should hide upgrade option if no available upgrade', async () => {
        await clickByLabel('Actions', 2)
        await waitForNotText('managed.upgrade')
    })
    test('overflow menu should hide channel select option if no available channels', async () => {
        await clickByLabel('Actions', 2)
        await waitForNotText('managed.selectChannel')
    })

    test('overflow menu should hide upgrade and channel select options if currently upgrading', async () => {
        await clickByLabel('Actions', 4)
        await waitForNotText('managed.upgrade')
        await waitForNotText('managed.selectChannel')
    })

    test('overflow menu should allow upgrade if has available upgrade', async () => {
        await clickByLabel('Actions', 3)
        await clickByText('managed.upgrade')
        await waitForText('upgrade.table.name')
    })

    test('overflow menu should allow channel select if has available channels', async () => {
        await clickByLabel('Actions', 3)
        await clickByText('managed.selectChannel')
        await waitForText('upgrade.table.currentchannel')
    })

    test('batch upgrade support when upgrading multiple clusters', async () => {
        await selectTableRow(1)
        await selectTableRow(2)
        await selectTableRow(3)
        await selectTableRow(4)
        await clickBulkAction('managed.upgrade.plural')
        await waitForText(`upgrade.table.currentversion`)
    })
    test('batch select channel support when updating multiple clusters', async () => {
        await selectTableRow(1)
        await selectTableRow(2)
        await selectTableRow(3)
        await selectTableRow(4)
        await clickBulkAction('managed.selectChannel.plural')
        await waitForText('upgrade.table.currentchannel')
    })
})

describe('Clusters Page RBAC', () => {
    test('should perform RBAC checks', async () => {
        const rbacCreateManagedClusterNock = nockRBAC(rbacCreate(ManagedClusterDefinition))
        const upgradeRBACNocks: Scope[] = upgradeableMockManagedClusters.reduce((prev, mockManagedCluster) => {
            prev.push(
                nockRBAC(getClusterCuratorPatchResourceAttributes(mockManagedCluster.metadata.name!)),
                nockRBAC(getClusterCuratorCreateResourceAttributes(mockManagedCluster.metadata.name!))
            )
            return prev
        }, [] as Scope[])
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(managedClustersState, mockManagedClusters)
                    snapshot.set(clusterDeploymentsState, mockClusterDeployments)
                    snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
                    snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
                }}
            >
                <MemoryRouter>
                    <ClustersPage />
                </MemoryRouter>
            </RecoilRoot>
        )
        await waitForText(mockManagedCluster0.metadata.name!)
        await waitForNock(rbacCreateManagedClusterNock)
        await waitForNocks(upgradeRBACNocks)
    })
})
