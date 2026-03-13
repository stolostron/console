/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Outlet, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../../lib/nock-util'
import { waitForText } from '../../../../../../lib/test-util'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../../../../../../resources/placement'
import { PlacementDetailsContext } from '../PlacementDetails'
import PlacementOverviewPageContent from './PlacementOverview'

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'test-placement',
    namespace: 'default',
    uid: 'uid-placement-1',
  },
  spec: {
    clusterSets: ['cluster-set-1', 'cluster-set-2'],
  },
  status: {
    conditions: [],
    numberOfSelectedClusters: 5,
  },
}

function OverviewComponent({ placement = mockPlacement }: { placement?: Placement }) {
  const context: PlacementDetailsContext = { placement }
  return (
    <RecoilRoot>
      <MemoryRouter>
        <Routes>
          <Route element={<Outlet context={context} />}>
            <Route path="*" element={<PlacementOverviewPageContent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('PlacementOverview page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders placement details', async () => {
    render(<OverviewComponent />)
    await waitForText('Details')
    await waitForText('test-placement')
    await waitForText('default')
  })

  test('renders cluster sets', async () => {
    render(<OverviewComponent />)
    await waitForText('cluster-set-1, cluster-set-2')
  })

  test('renders selected clusters count', async () => {
    render(<OverviewComponent />)
    await waitForText('5')
  })

  test('renders without cluster sets', async () => {
    const placementNoSets: Placement = {
      ...mockPlacement,
      spec: {},
    }
    render(<OverviewComponent placement={placementNoSets} />)
    await waitForText('test-placement')
    await waitForText('Details')
  })
})
