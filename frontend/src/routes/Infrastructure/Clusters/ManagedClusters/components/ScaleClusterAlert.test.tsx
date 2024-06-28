/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { machinePoolsState } from '../../../../../atoms'
import { waitForNotText, waitForText } from '../../../../../lib/test-util'
import { ClusterDetailsContext } from '../ClusterDetails/ClusterDetails'
import {
  mockCluster,
  mockMachinePoolAuto,
  mockMachinePoolOther,
  mockMachinePoolManual,
} from '../ClusterDetails/ClusterDetails.sharedmocks'
import { ScaleClusterAlert } from './ScaleClusterAlert'
import { MemoryRouter, Routes, Route, Outlet } from 'react-router-dom-v5-compat'

const Component = () => {
  const context: Partial<ClusterDetailsContext> = { cluster: mockCluster }
  return (
    <MemoryRouter>
      <Routes>
        <Route element={<Outlet context={context} />}>
          <Route path="*" element={<ScaleClusterAlert />} />
        </Route>
      </Routes>
    </MemoryRouter>
  )
}

describe('ScaleClusterAlert', () => {
  it('does not render without MachinePools', async () => {
    render(
      <RecoilRoot>
        <Component />
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
        <Component />
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
        <Component />
      </RecoilRoot>
    )

    await waitForText('Scaling up in progress')
  })
  it('detects scale down', async () => {
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(machinePoolsState, [mockMachinePoolOther])
        }}
      >
        <Component />
      </RecoilRoot>
    )

    await waitForText('Scaling down in progress')
  })
})
