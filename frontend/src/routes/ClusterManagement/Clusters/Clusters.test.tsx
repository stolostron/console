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
import { nockCreate, nockDelete, nockIgnoreRBAC, nockRBAC } from '../../../lib/nock-util'
import { rbacCreate } from '../../../lib/rbac-util'
import {
    clickByLabel,
    clickByRole,
    clickByText,
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
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
} from '../../../resources/klusterlet-add-on-config'
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
import { ResourceAttributes } from '../../../resources/self-subject-access-review'
import ClustersPage from './Clusters'
import { managedClusterSetLabel } from '../../../resources/managed-cluster-set'
import { mockManagedClusterSet } from '../../../lib/test-metadata'

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
                upgradeFailed: false,
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

function getClusterActionsResourceAttributes(name: string) {
    return {
        resource: 'managedclusteractions',
        verb: 'create',
        group: 'action.open-cluster-management.io',
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
        await clickByLabel('Actions', 0)
        await clickByText('managed.destroySelected')
        await typeByText('type.to.confirm', mockManagedCluster0.metadata!.name!)
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0), nockDelete(mockClusterDeployment0)]
        await clickByText('destroy')
        await waitForNocks(deleteNocks)
    })

    test('should be able to delete cluster using bulk action', async () => {
        await clickByRole('checkbox', 1)
        await clickByText('managed.destroy')
        await typeByText('type.to.confirm', 'confirm')
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0), nockDelete(mockClusterDeployment0)]
        await clickByText('destroy')
        await waitForNocks(deleteNocks)
    })

    test('should be able to detach cluster using row action', async () => {
        await clickByLabel('Actions', 0)
        await clickByText('managed.detached')
        await typeByText('type.to.confirm', mockManagedCluster0.metadata!.name!)
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster0)]
        await clickByText('detach')
        await waitForNocks(deleteNocks)
    })

    test('should be able to detach cluster using bulk action', async () => {
        await clickByRole('checkbox', 2)
        await clickByText('managed.detachSelected')
        await typeByText('type.to.confirm', 'confirm')
        const deleteNocks: Scope[] = [nockDelete(mockManagedCluster1)]
        await clickByText('detach')
        await waitForNocks(deleteNocks)
    })

    // TODO re-enable when re-attach is supported
    test.skip('can re-attach detached clusters', async () => {
        const mockCreateManagedCluster: ManagedCluster = {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                name: mockClusterDeployment6.metadata.name!,
                labels: {
                    cloud: 'auto-detect',
                    vendor: 'auto-detect',
                    name: mockClusterDeployment6.metadata.name!,
                },
            },
            spec: { hubAcceptsClient: true },
        }
        const mockCreateKlusterletAddonConfig: KlusterletAddonConfig = {
            apiVersion: KlusterletAddonConfigApiVersion,
            kind: KlusterletAddonConfigKind,
            metadata: {
                name: mockClusterDeployment6.metadata.name!,
                namespace: mockClusterDeployment6.metadata.name!,
            },
            spec: {
                clusterName: mockClusterDeployment6.metadata.name!,
                clusterNamespace: mockClusterDeployment6.metadata.name!,
                clusterLabels: {
                    cloud: 'auto-detect',
                    vendor: 'auto-detect',
                    name: mockClusterDeployment6.metadata.name!,
                },
                applicationManager: { enabled: true, argocdCluster: false },
                policyController: { enabled: true },
                searchCollector: { enabled: true },
                certPolicyController: { enabled: true },
                iamPolicyController: { enabled: true },
                version: '2.2.0',
            },
        }
        const createMcNock = nockCreate(mockCreateManagedCluster, mockCreateManagedCluster)
        const createKacNock = nockCreate(mockCreateKlusterletAddonConfig, mockCreateKlusterletAddonConfig)
        await waitForText(mockClusterDeployment6.metadata.name!)
        await clickByLabel('Actions', 6)
        await waitForText('managed.import')
        await clickByText('managed.import')
        await waitForText('cluster.import.description')
        await clickByText('import')
        await waitForNocks([createMcNock, createKacNock])
        await waitForNotText('cluster.import.description')
    })

    test('overflow menu should hide upgrade option if no available upgrade', async () => {
        await clickByLabel('Actions', 2)
        await waitForNotText('managed.upgrade')
    })

    test('overflow menu should hide upgrade option if currently upgrading', async () => {
        await clickByLabel('Actions', 4)
        await waitForNotText('managed.upgrade')
    })

    test('overflow menu should allow upgrade if has available upgrade', async () => {
        await clickByLabel('Actions', 3)
        await clickByText('managed.upgrade')
        await waitForText('upgrade.table.name')
    })

    test('batch upgrade support when upgrading single cluster', async () => {
        await clickByLabel('Select row 3')
        await clickByText('managed.upgradeSelected')
        await waitForText(`bulk.title.upgrade`)
    })

    test('batch upgrade support when upgrading multiple clusters', async () => {
        await clickByLabel('Select row 3')
        await clickByLabel('Select row 5')
        await clickByText('managed.upgradeSelected')
        await waitForText(`bulk.title.upgrade`)
    })
})

describe('Clusters Page RBAC', () => {
    test('should perform RBAC checks', async () => {
        const rbacCreateManagedClusterNock = nockRBAC(rbacCreate(ManagedClusterDefinition))
        const upgradeRBACNocks = upgradeableMockManagedClusters.map((mockManagedCluster) => {
            return nockRBAC(getClusterActionsResourceAttributes(mockManagedCluster.metadata.name!))
        })
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
