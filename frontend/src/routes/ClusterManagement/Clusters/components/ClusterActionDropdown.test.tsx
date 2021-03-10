/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { nockPatch, nockRBAC } from '../../../../lib/nock-util'
import { ClusterStatus, Cluster } from '../../../../lib/get-cluster'
import { ClusterDeploymentDefinition } from '../../../../resources/cluster-deployment'
import { ManagedClusterDefinition } from '../../../../resources/managed-cluster'
import { ClusterActionDropdown } from './ClusterActionDropdown'
import { clickByLabel, clickByText, waitForNocks, waitForText } from '../../../../lib/test-util'
import { getResourceAttributes } from '../../../../lib/rbac-util'

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

function getPatchClusterResourceAttributes() {
    return getResourceAttributes('patch', ManagedClusterDefinition, undefined, mockCluster.name)
}

function getPatchClusterDeploymentResourceAttributes() {
    return getResourceAttributes('patch', ClusterDeploymentDefinition, mockCluster.namespace, mockCluster.name)
}

function getDeleteClusterResourceAttributes() {
    return getResourceAttributes('delete', ManagedClusterDefinition, undefined, mockCluster.name)
}

function getDeleteDeploymentResourceAttributes() {
    return getResourceAttributes('delete', ClusterDeploymentDefinition, mockCluster.namespace, mockCluster.name)
}

function patchClusterDeployment(powerState: 'Running' | 'Hibernating') {
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

describe('ClusterActionDropdown', () => {
    test('hibernate action', async () => {
        const cluster = { ...mockCluster }
        const rbacNocks: Scope[] = [
            nockRBAC(getPatchClusterResourceAttributes()),
            nockRBAC(getPatchClusterDeploymentResourceAttributes()),
            nockRBAC(getDeleteClusterResourceAttributes()),
            nockRBAC(getDeleteClusterResourceAttributes()),
            nockRBAC(getDeleteDeploymentResourceAttributes()),
        ]
        render(<ClusterActionDropdown cluster={cluster} isKebab={true} />)
        await clickByLabel('Actions')
        await waitForText('managed.hibernate')
        await waitForNocks(rbacNocks)
        await clickByText('managed.hibernate')
        await clickByText('hibernate')
        await waitForNocks([patchClusterDeployment('Hibernating')])
    })
    test('resume action', async () => {
        const cluster = { ...mockCluster }
        cluster.status = ClusterStatus.hibernating
        const rbacNocks: Scope[] = [
            nockRBAC(getPatchClusterResourceAttributes()),
            nockRBAC(getPatchClusterDeploymentResourceAttributes()),
            nockRBAC(getDeleteClusterResourceAttributes()),
            nockRBAC(getDeleteDeploymentResourceAttributes()),
        ]
        render(<ClusterActionDropdown cluster={cluster} isKebab={true} />)
        await clickByLabel('Actions')
        await waitForNocks(rbacNocks)
        await waitForText('managed.resume')
        await clickByText('managed.resume')
        await clickByText('resume')
        await waitForNocks([patchClusterDeployment('Running')])
    })
})
