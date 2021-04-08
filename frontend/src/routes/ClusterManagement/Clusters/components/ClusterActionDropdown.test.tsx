/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { nockPatch, nockRBAC, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { clickByLabel, clickByText, waitForNock, waitForNocks } from '../../../../lib/test-util'
import { ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ClusterActionDropdown } from './ClusterActionDropdown'
import { managedClusterSetsState } from '../../../../atoms'
import { mockManagedClusterSet } from '../../../../lib/test-metadata'
import { managedClusterSetLabel } from '../../../../resources/managed-cluster-set'

const mockCluster: Cluster = {
    name: 'test-cluster',
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

function nockPatchManagedCluster(op: string, value?: string) {
    const patch: { op: string; path: string; value?: string } = {
        op,
        path: `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
    }
    if (value) {
        patch.value = value
    }
    return nockPatch(
        {
            apiVersion: ManagedClusterDefinition.apiVersion,
            kind: ManagedClusterDefinition.kind,
            metadata: {
                name: mockCluster.name,
            },
        },
        [patch]
    )
}

const Component = (props: { cluster: Cluster }) => (
    <RecoilRoot
        initializeState={(snapshot) => {
            snapshot.set(managedClusterSetsState, [mockManagedClusterSet])
        }}
    >
        <ClusterActionDropdown cluster={props.cluster} isKebab={true} />
    </RecoilRoot>
)

describe('ClusterActionDropdown', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
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

    test('can add a cluster to a managed cluster set', async () => {
        const nockPatch = nockPatchManagedCluster('add', mockManagedClusterSet.metadata.name)
        const nockPatchCD = nockPatchClusterDeployment(
            'add',
            `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`,
            mockManagedClusterSet.metadata.name
        )
        const cluster = JSON.parse(JSON.stringify(mockCluster))
        render(<Component cluster={cluster} />)
        await clickByLabel('Actions')
        await clickByText('managed.addSet')
        await clickByText('common:select')
        await clickByText(mockManagedClusterSet.metadata.name!)
        await clickByText('add')
        await waitForNocks([nockPatch, nockPatchCD])
    })

    test('can remove a cluster from a managed cluster set', async () => {
        const nockPatch = nockPatchManagedCluster('remove')
        const nockPatchCD = nockPatchClusterDeployment(
            'remove',
            `/metadata/labels/${managedClusterSetLabel.replace(/\//g, '~1')}`
        )
        const cluster = JSON.parse(JSON.stringify(mockCluster))
        cluster.labels = { [managedClusterSetLabel]: mockManagedClusterSet.metadata.name }
        cluster.clusterSet = mockManagedClusterSet.metadata.name
        render(<Component cluster={cluster} />)
        await clickByLabel('Actions')
        await clickByText('managed.removeSet')
        await clickByText('remove')
        await waitForNocks([nockPatch, nockPatchCD])
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
