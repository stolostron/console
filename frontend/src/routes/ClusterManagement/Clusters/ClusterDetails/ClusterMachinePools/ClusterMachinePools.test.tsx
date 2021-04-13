/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { Scope } from 'nock/types'
import { RecoilRoot } from 'recoil'
import { nockDelete, nockIgnoreRBAC } from '../../../../../lib/nock-util'
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
