/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { nockCreate, nockPatch, nockRBAC, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { clickByLabel, clickByText, waitForText, waitForNock, waitForNocks } from '../../../../lib/test-util'
import { ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ClusterActionDropdown } from './ClusterActionDropdown'
import { ManagedCluster, ManagedClusterApiVersion, ManagedClusterKind } from '../../../../resources/managed-cluster'
import {
    KlusterletAddonConfig,
    KlusterletAddonConfigApiVersion,
    KlusterletAddonConfigKind,
} from '../../../../resources/klusterlet-add-on-config'

const mockCluster: Cluster = {
    name: 'test-cluster',
    displayName: 'test-cluster',
    namespace: 'test-cluster',
    status: ClusterStatus.ready,
    provider: undefined,
    distribution: {
        k8sVersion: '1.19',
        ocp: {
            version: '4.6',
            availableUpdates: [],
            desiredVersion: '4.6',
            upgradeFailed: false,
        },
        displayVersion: '4.6',
        isManagedOpenShift: false,
    },
    labels: undefined,
    nodes: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: undefined,
            kubeadmin: undefined,
            kubeconfig: undefined,
        },
    },
    isHive: true,
    isManaged: true,
}

function rbacPatchManagedCluster() {
    return rbacPatch(ManagedClusterDefinition, undefined, mockCluster.name)
}

function rbacPatchClusterDeployment() {
    return rbacPatch(ClusterDeploymentDefinition, mockCluster.namespace, mockCluster.name)
}

function rbacDeleteManagedCluster() {
    return rbacDelete(ManagedClusterDefinition, undefined, mockCluster.name)
}

function rbacDeleteClusterDeployment() {
    return rbacDelete(ClusterDeploymentDefinition, mockCluster.namespace, mockCluster.name)
}

function nockPatchClusterDeployment(op: 'replace' | 'add' | 'remove', path: string, value?: string) {
    const patch: { op: 'replace' | 'add' | 'remove'; path: string; value?: string } = { op, path }
    if (value) {
        patch.value = value
    }
    return nockPatch(
        {
            apiVersion: ClusterDeploymentDefinition.apiVersion,
            kind: ClusterDeploymentDefinition.kind,
            metadata: {
                name: mockCluster.name,
                namespace: mockCluster.namespace,
            },
        },
        [patch]
    )
}

const Component = (props: { cluster: Cluster }) => (
    <RecoilRoot>
        <ClusterActionDropdown cluster={props.cluster} isKebab={true} />
    </RecoilRoot>
)

describe('ClusterActionDropdown', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
    })

    test('can import detached clusters', async () => {
        const mockDetachedCluster: Cluster = JSON.parse(JSON.stringify(mockCluster))
        mockDetachedCluster.status = ClusterStatus.detached
        const mockCreateManagedCluster: ManagedCluster = {
            apiVersion: ManagedClusterApiVersion,
            kind: ManagedClusterKind,
            metadata: {
                name: mockDetachedCluster.name!,
                labels: {
                    cloud: 'auto-detect',
                    vendor: 'auto-detect',
                    name: mockDetachedCluster.name!,
                },
            },
            spec: { hubAcceptsClient: true },
        }
        const mockCreateKlusterletAddonConfig: KlusterletAddonConfig = {
            apiVersion: KlusterletAddonConfigApiVersion,
            kind: KlusterletAddonConfigKind,
            metadata: {
                name: mockDetachedCluster.name!,
                namespace: mockDetachedCluster.name!,
            },
            spec: {
                clusterName: mockDetachedCluster.name!,
                clusterNamespace: mockDetachedCluster.name!,
                clusterLabels: {
                    cloud: 'auto-detect',
                    vendor: 'auto-detect',
                    name: mockDetachedCluster.name!,
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
        render(<Component cluster={mockDetachedCluster} />)

        await clickByLabel('Actions')
        await clickByText('managed.import')
        await waitForText('bulk.title.import')
        await clickByText('common:import')
        await waitForNocks([createMcNock, createKacNock])
    })

    test('hibernate action should patch cluster deployment', async () => {
        const nockPatch = nockPatchClusterDeployment('replace', '/spec/powerState', 'Hibernating')
        const cluster = JSON.parse(JSON.stringify(mockCluster))
        render(<Component cluster={cluster} />)
        await clickByLabel('Actions')
        await clickByText('managed.hibernate')
        await clickByText('hibernate')
        await waitForNock(nockPatch)
    })

    test('resume action should patch cluster deployment', async () => {
        const nockPatch = nockPatchClusterDeployment('replace', '/spec/powerState', 'Running')
        const cluster = JSON.parse(JSON.stringify(mockCluster))
        cluster.status = ClusterStatus.hibernating
        render(<Component cluster={cluster} />)
        await clickByLabel('Actions')
        await clickByText('managed.resume')
        await clickByText('resume')
        await waitForNock(nockPatch)
    })
})

describe('ClusterActionDropdown', () => {
    test("disables menu items based on the user's permissions", async () => {
        const cluster = JSON.parse(JSON.stringify(mockCluster))
        cluster.status = ClusterStatus.hibernating
        render(<Component cluster={cluster} />)
        const rbacNocks: Scope[] = [
            nockRBAC(rbacPatchManagedCluster()),
            nockRBAC(rbacPatchClusterDeployment()),
            nockRBAC(rbacDeleteManagedCluster()),
            nockRBAC(rbacDeleteClusterDeployment()),
        ]
        await clickByLabel('Actions')
        await waitForNocks(rbacNocks)
    })
})
