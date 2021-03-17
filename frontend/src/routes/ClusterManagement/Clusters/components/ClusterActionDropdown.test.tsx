/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { Cluster, ClusterStatus } from '../../../../lib/get-cluster'
import { nockPatch, nockRBAC } from '../../../../lib/nock-util'
import { rbacDelete, rbacPatch } from '../../../../lib/rbac-util'
import { clickByLabel, clickByText, waitForNock, waitForNocks } from '../../../../lib/test-util'
import { ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ClusterActionDropdown } from './ClusterActionDropdown'

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

function nockPatchClusterDeployment(powerState: 'Running' | 'Hibernating') {
    return nockPatch(
        {
            apiVersion: ClusterDeploymentDefinition.apiVersion,
            kind: ClusterDeploymentDefinition.kind,
            metadata: {
                name: mockCluster.name,
                namespace: mockCluster.namespace,
            },
        },
        [{ op: 'replace', path: '/spec/powerState', value: powerState }]
    )
}

describe('Cluster Action Dropdown', () => {
    test('hibernate action should patch cluster deployment', async () => {
        const cluster = { ...mockCluster }
        render(
            <RecoilRoot>
                <ClusterActionDropdown cluster={cluster} isKebab={true} />
            </RecoilRoot>
        )
        const rbacNocks: Scope[] = [
            nockRBAC(rbacPatchManagedCluster()),
            nockRBAC(rbacPatchClusterDeployment()),
            nockRBAC(rbacDeleteManagedCluster()),
            nockRBAC(rbacDeleteManagedCluster()),
            nockRBAC(rbacDeleteClusterDeployment()),
        ]
        await clickByLabel('Actions')
        await waitForNocks(rbacNocks)
        await clickByText('managed.hibernate')
        const nockPatch = nockPatchClusterDeployment('Hibernating')
        await clickByText('hibernate')
        await waitForNock(nockPatch)
    })

    test('resume action should patch cluster deployment', async () => {
        const cluster = { ...mockCluster }
        cluster.status = ClusterStatus.hibernating
        render(
            <RecoilRoot>
                <ClusterActionDropdown cluster={cluster} isKebab={true} />
            </RecoilRoot>
        )
        const rbacNocks: Scope[] = [
            nockRBAC(rbacPatchManagedCluster()),
            nockRBAC(rbacPatchClusterDeployment()),
            nockRBAC(rbacDeleteManagedCluster()),
            nockRBAC(rbacDeleteClusterDeployment()),
        ]
        await clickByLabel('Actions')
        await waitForNocks(rbacNocks)
        await clickByText('managed.resume')
        const nockPatch = nockPatchClusterDeployment('Running')
        await clickByText('resume')
        await waitForNock(nockPatch)
    })
})
