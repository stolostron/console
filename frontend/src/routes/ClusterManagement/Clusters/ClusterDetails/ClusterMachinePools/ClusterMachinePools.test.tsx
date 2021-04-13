/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { nockPatch, nockDelete, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { clickByLabel, clickByText, typeByText, waitForNocks, waitForText } from '../../../../../lib/test-util'
import { Cluster, ClusterStatus } from '../../../../../lib/get-cluster'
import { MachinePoolsPageContent } from './ClusterMachinePools'
import { machinePoolsState } from '../../../../../atoms'
import { ClusterContext } from '../ClusterDetails'
import { clusterName, mockMachinePoolManual, mockMachinePoolAuto } from '../ClusterDetails.test'

const mockCluster: Cluster = {
    name: clusterName,
    namespace: clusterName,
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
    },
    labels: undefined,
    nodes: {
        nodeList: [],
        active: 0,
        inactive: 0,
    },
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            kubeconfig: '',
            kubeadmin: '',
            installConfig: '',
        },
    },
    isHive: true,
    isManaged: true,
}

describe('ClusterMachinePools', () => {
    beforeEach(() => {
        nockIgnoreRBAC()
        render(
            <RecoilRoot
                initializeState={(snapshot) => {
                    snapshot.set(machinePoolsState, [mockMachinePoolManual, mockMachinePoolAuto])
                }}
            >
                <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined, importCommand: undefined }}>
                    <MachinePoolsPageContent />
                </ClusterContext.Provider>
            </RecoilRoot>
        )
    })

    it('should be able to manually scale a machine pool', async () => {
        await waitForText(mockMachinePoolManual.metadata.name!)
        await clickByLabel('Actions', 1)
        await clickByText('machinePool.scale')
        await waitForText('machinePool.modal.scale.edit-manualscale.title')
        await clickByLabel('Plus')
        const patchNocks: Scope[] = [
            nockPatch(mockMachinePoolManual, [
                { op: 'replace', path: '/spec/replicas', value: mockMachinePoolManual.spec!.replicas! + 1 },
            ]),
        ]
        await clickByText('common:scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to enable autoscaling for a machine pool', async () => {
        await waitForText(mockMachinePoolManual.metadata.name!)
        await clickByLabel('Actions', 1)
        await clickByText('machinePool.enableAutoscale')
        await waitForText('machinePool.modal.scale.enable-autoscale.title')
        await clickByLabel('Plus', 1)
        const patchNocks: Scope[] = [
            nockPatch(mockMachinePoolManual, [
                { op: 'remove', path: '/spec/replicas' },
                {
                    op: 'add',
                    path: '/spec/autoscaling',
                    value: {
                        minReplicas: mockMachinePoolManual.status!.machineSets!.length,
                        maxReplicas: mockMachinePoolManual.status!.machineSets!.length + 1,
                    },
                },
            ]),
        ]
        await clickByText('common:scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to edit autoscaling for a machine pool', async () => {
        await waitForText(mockMachinePoolAuto.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('machinePool.editAutoscale')
        await waitForText('machinePool.modal.scale.edit-autoscale.title')
        await clickByLabel('Plus', 1)
        const patchNocks: Scope[] = [
            nockPatch(mockMachinePoolAuto, [
                {
                    op: 'replace',
                    path: '/spec/autoscaling',
                    value: {
                        minReplicas: mockMachinePoolAuto.spec!.autoscaling!.minReplicas,
                        maxReplicas: mockMachinePoolAuto.spec!.autoscaling!.maxReplicas + 1,
                    },
                },
            ]),
        ]
        await clickByText('common:scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to disable autoscaling for a machine pool', async () => {
        await waitForText(mockMachinePoolAuto.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('machinePool.disableAutoscale')
        await waitForText('machinePool.modal.scale.disable-autoscale.title')
        const patchNocks: Scope[] = [
            nockPatch(mockMachinePoolAuto, [
                { op: 'remove', path: '/spec/autoscaling' },
                {
                    op: 'add',
                    path: '/spec/replicas',
                    value: mockMachinePoolAuto.status!.replicas,
                },
            ]),
        ]
        await clickByText('common:scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to delete machine pools', async () => {
        await waitForText(mockMachinePoolAuto.metadata.name!)
        await waitForText(mockMachinePoolManual.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('machinePool.delete')
        await waitForText('bulk.title.deleteMachinePool')
        await typeByText('type.to.confirm', mockMachinePoolAuto.metadata.name!)
        const deleteNocks: Scope[] = [nockDelete(mockMachinePoolAuto)]
        await clickByText('common:delete')
        await waitForNocks(deleteNocks)
    })
})
