/* Copyright Contributors to the Open Cluster Management project */

type GpuMetricsPollTuple = [{ data?: { result?: Array<{ metric: { instance: string } }> } }, unknown, boolean]

/** Read by jest.mock factories for NodesPoolsTable tests. */
// eslint-disable-next-line no-var
var clusterNodesTestState: {
  observabilityInstalled: boolean
  metricsPoll: GpuMetricsPollTuple
} = {
  observabilityInstalled: false,
  metricsPoll: [{ data: { result: [] } }, undefined, false],
}

import { render, screen, within } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { defaultPlugin, PluginContext } from '../../../../../../lib/PluginContext'
import { ClusterDetailsContext } from '../ClusterDetails'
import { mockCluster } from '../ClusterDetails.sharedmocks'
import { NodesPoolsTable } from './ClusterNodes'

jest.mock('~/lib/useMetricsPoll', () => ({
  ObservabilityEndpoint: { QUERY: 'observability/query' },
  useMetricsPoll: () => clusterNodesTestState.metricsPoll,
}))

jest.mock('~/shared-recoil', () => ({
  useSharedAtoms: () => ({
    clusterManagementAddonsState: 'clusterManagementAddonsState',
    useIsObservabilityInstalled: () => clusterNodesTestState.observabilityInstalled,
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
  beforeEach(() => {
    clusterNodesTestState.observabilityInstalled = false
    clusterNodesTestState.metricsPoll = [{ data: { result: [] } }, undefined, false]
  })

  it('renders node names from cluster context', async () => {
    renderNodesPoolsTable()
    expect(await screen.findByText('ip-10-0-134-240.ec2.internal')).toBeInTheDocument()
  })

  it('does not render GPU count column when observability is not installed', async () => {
    renderNodesPoolsTable()
    await screen.findByText('ip-10-0-134-240.ec2.internal')
    expect(screen.queryByRole('columnheader', { name: 'GPU count' })).not.toBeInTheDocument()
  })

  it('renders GPU count column and per-node counts when observability is installed', async () => {
    clusterNodesTestState.observabilityInstalled = true
    clusterNodesTestState.metricsPoll = [
      {
        data: {
          result: [
            { metric: { instance: 'ip-10-0-134-240.ec2.internal' } },
            { metric: { instance: 'ip-10-0-134-240.ec2.internal:9101' } },
          ],
        },
      },
      undefined,
      false,
    ]

    renderNodesPoolsTable()

    expect(await screen.findByRole('columnheader', { name: 'GPU count' })).toBeInTheDocument()

    const rows = screen.getAllByRole('row')
    const rowForFirstNode = rows.find((row) => row.textContent?.includes('ip-10-0-134-240.ec2.internal'))
    expect(rowForFirstNode).toBeDefined()
    expect(within(rowForFirstNode!).getByText('2')).toBeInTheDocument()

    const rowForSecondNode = rows.find((row) => row.textContent?.includes('ip-10-0-134-241.ec2.internal'))
    expect(rowForSecondNode).toBeDefined()
    expect(within(rowForSecondNode!).getByText('0')).toBeInTheDocument()
  })
})
