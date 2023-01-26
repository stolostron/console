/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { machinePoolsState, submarinerConfigsState } from '../../../../../atoms'
import { waitForNotText, waitForText } from '../../../../../lib/test-util'
import { SubmarinerConfig, SubmarinerConfigApiVersion, SubmarinerConfigKind } from '../../../../../resources'
import { ClusterContext } from '../ClusterDetails/ClusterDetails'
import { mockCluster, mockMachinePoolAuto, mockMachinePoolManual } from '../ClusterDetails/ClusterDetails.sharedmocks'
import { ScaleClusterAlert } from './ScaleClusterAlert'

const mockSubmarinerConfig: SubmarinerConfig = {
  apiVersion: SubmarinerConfigApiVersion,
  kind: SubmarinerConfigKind,
  metadata: {
    name: 'submariner',
    namespace: mockCluster.namespace,
  },
  spec: {
    gatewayConfig: {
      gateways: 2,
    },
  },
}

describe('ScaleClusterAlert', () => {
  it('does not render without MachinePools', async () => {
    render(
      <RecoilRoot>
        <ScaleClusterAlert />
      </RecoilRoot>
    )

    await waitForNotText('Scaling up in progress')
    await waitForNotText('Scaling down in progress')
  })
  it('does not render if nodes and machinepool size are equal', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(machinePoolsState, [mockMachinePoolManual])
        }}
      >
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <ScaleClusterAlert />
        </ClusterContext.Provider>
      </RecoilRoot>
    )

    await waitForNotText('Scaling up in progress')
    await waitForNotText('Scaling down in progress')
  })
  it('detects scale up', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(machinePoolsState, [mockMachinePoolManual, mockMachinePoolAuto])
        }}
      >
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <ScaleClusterAlert />
        </ClusterContext.Provider>
      </RecoilRoot>
    )

    await waitForText('Scaling up in progress')
  })
  it('detects scale down', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(machinePoolsState, [
            { ...mockMachinePoolManual, status: { ...mockMachinePoolAuto.status, replicas: 1 } },
          ])
        }}
      >
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <ScaleClusterAlert />
        </ClusterContext.Provider>
      </RecoilRoot>
    )

    await waitForText('Scaling down in progress')
  })
  it('detects scale up due to Submariner', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(machinePoolsState, [mockMachinePoolManual])
          snapshot.set(submarinerConfigsState, [mockSubmarinerConfig])
        }}
      >
        <ClusterContext.Provider value={{ cluster: mockCluster, addons: undefined }}>
          <ScaleClusterAlert />
        </ClusterContext.Provider>
      </RecoilRoot>
    )

    await waitForText('Scaling up in progress')
  })
})
