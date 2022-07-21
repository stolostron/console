/* Copyright Contributors to the Open Cluster Management project */

import { Cluster, ClusterStatus } from '../../../../../../resources'
import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { machinePoolsState } from '../../../../../../atoms'
import { nockDelete, nockIgnoreRBAC, nockPatch } from '../../../../../../lib/nock-util'
import { clickByLabel, clickByText, typeByText, waitForNocks, waitForText } from '../../../../../../lib/test-util'
import { ClusterContext } from '../ClusterDetails'
import { MachinePoolsPageContent } from './ClusterMachinePools'
import { clusterName, mockMachinePoolAuto, mockMachinePoolManual } from './ClusterDetails.sharedmocks'

const mockCluster: Cluster = {
    name: clusterName,
    displayName: clusterName,
    namespace: clusterName,
    status: ClusterStatus.ready,
    distribution: {
        k8sVersion: '1.19',
        ocp: undefined,
        displayVersion: '1.19',
        isManagedOpenShift: false,
    },
    labels: undefined,
    kubeApiServer: '',
    consoleURL: '',
    hive: {
        isHibernatable: true,
        clusterPool: undefined,
        secrets: {
            installConfig: '',
        },
    },
    isHive: true,
    isManaged: true,
    isCurator: false,
    isHostedCluster: false,
    isSNOCluster: false,
    owner: {},
    kubeconfig: '',
    kubeadmin: '',
    isHypershift: false,
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
                <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
                    <MachinePoolsPageContent />
                </ClusterContext.Provider>
            </RecoilRoot>
        )
    })

    it('should be able to manually scale a machine pool', async () => {
        await waitForText(mockMachinePoolManual.metadata.name!)
        await clickByLabel('Actions', 1)
        await clickByText('Scale machine pool')
        await waitForText('Scale machine pool')
        await clickByLabel('Plus')
        const patchNocks: Scope[] = [
            nockPatch(mockMachinePoolManual, [
                { op: 'replace', path: '/spec/replicas', value: mockMachinePoolManual.spec!.replicas! + 1 },
            ]),
        ]
        await clickByText('Scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to enable autoscaling for a machine pool', async () => {
        await waitForText(mockMachinePoolManual.metadata.name!)
        await clickByLabel('Actions', 1)
        await clickByText('Enable autoscale')
        await waitForText('Enable autoscale')
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
        await clickByText('Scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to edit autoscaling for a machine pool', async () => {
        await waitForText(mockMachinePoolAuto.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('Edit autoscale')
        await waitForText('Edit autoscale')
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
        await clickByText('Scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to disable autoscaling for a machine pool', async () => {
        await waitForText(mockMachinePoolAuto.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('Disable autoscale')
        await waitForText('Disable autoscale')
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
        await clickByText('Scale')
        await waitForNocks(patchNocks)
    })
    it('should be able to delete machine pools', async () => {
        await waitForText(mockMachinePoolAuto.metadata.name!)
        await waitForText(mockMachinePoolManual.metadata.name!)
        await clickByLabel('Actions', 0)
        await clickByText('Delete machine pool')
        await waitForText('Permanently delete machine pools?')
        await typeByText(
            `Confirm by typing "${mockMachinePoolAuto.metadata.name!}" below:`,
            mockMachinePoolAuto.metadata.name!
        )
        const deleteNocks: Scope[] = [nockDelete(mockMachinePoolAuto)]
        await clickByText('Delete')
        await waitForNocks(deleteNocks)
    })
})
