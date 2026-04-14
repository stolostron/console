/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { defaultPlugin, PluginContext } from '../../../../../../lib/PluginContext'
import { ClusterDetailsContext } from '../ClusterDetails'
import { mockCluster } from '../ClusterDetails.sharedmocks'
import { NodesPoolsTable } from './ClusterNodes'

jest.mock('~/lib/useMetricsPoll', () => ({
  ObservabilityEndpoint: { QUERY: 'observability/query' },
  useMetricsPoll: jest.fn(() => [{ data: { result: [] } }, undefined, false]),
}))

jest.mock('~/shared-recoil', () => ({
  useSharedAtoms: () => ({
    clusterManagementAddonsState: 'clusterManagementAddonsState',
    useIsObservabilityInstalled: () => false,
  }),
  useRecoilValue: jest.fn(() => []),
}))

jest.mock('../../components/ScaleClusterAlert', () => ({
  ScaleClusterAlert: () => null,
}))

function renderNodesPoolsTable(context: Partial<ClusterDetailsContext> = { cluster: mockCluster }) {
  return render(
    <RecoilRoot>
      <PluginContext.Provider value={defaultPlugin}>
        <MemoryRouter>
          <Routes>
            <Route element={<Outlet context={context as ClusterDetailsContext} />}>
              <Route path="*" element={<NodesPoolsTable />} />
            </Route>
          </Routes>
        </MemoryRouter>
      </PluginContext.Provider>
    </RecoilRoot>
  )
}

describe('ClusterNodes', () => {
  it('renders node names from cluster context', async () => {
    renderNodesPoolsTable()
    expect(await screen.findByText('ip-10-0-134-240.ec2.internal')).toBeInTheDocument()
  })
})
