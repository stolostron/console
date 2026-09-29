/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { StateProvider } from '~/lib/state-provider'
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
import { MemoryRouter, Routes, Route, Outlet } from 'react-router'

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
      <StateProvider>
        <Component />
      </StateProvider>
    )

    await waitForNotText('Scaling up in progress')
    await waitForNotText('Scaling down in progress')
  })
  it('does not render if nodes and machinepool size are equal', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(machinePoolsState, [mockMachinePoolManual])
        }}
      >
        <Component />
      </StateProvider>
    )

    await waitForNotText('Scaling up in progress')
    await waitForNotText('Scaling down in progress')
  })
  it('detects scale up', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(machinePoolsState, [mockMachinePoolManual, mockMachinePoolAuto])
        }}
      >
        <Component />
      </StateProvider>
    )

    await waitForText('Scaling up in progress')
  })
  it('detects scale down', async () => {
    render(
      <StateProvider
        initializeStore={(store) => {
          store.set(machinePoolsState, [mockMachinePoolOther])
        }}
      >
        <Component />
      </StateProvider>
    )

    await waitForText('Scaling down in progress')
  })
})
