/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { placementsState, settingsState } from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../../../../resources/placement'
import Clusters from '../Clusters'

jest.mock('../../../../components/KubevirtProviderAlert', () => ({
  KubevirtProviderAlert: () => null,
}))

const mockPlacement1: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'test-placement-1',
    namespace: 'default',
    uid: 'uid-placement-1',
  },
  spec: {
    clusterSets: ['cluster-set-1', 'cluster-set-2'],
  },
  status: {
    conditions: [],
    numberOfSelectedClusters: 3,
  },
}

const mockPlacement2: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'test-placement-2',
    namespace: 'open-cluster-management',
    uid: 'uid-placement-2',
  },
  spec: {},
  status: {
    conditions: [],
    numberOfSelectedClusters: 0,
  },
}

const Component = ({ placements = [mockPlacement1, mockPlacement2] }: { placements?: Placement[] }) => (
  <RecoilRoot
    initializeState={(snapshot) => {
      snapshot.set(placementsState, placements)
      snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
    }}
  >
    <MemoryRouter initialEntries={[NavigationPath.placements]}>
      <Routes>
        <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('Placements page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders placements table with data', async () => {
    render(<Component />)
    await waitForText(mockPlacement1.metadata.name!)
    await waitForText(mockPlacement2.metadata.name!)
    await waitForText('default')
    await waitForText('open-cluster-management')
  })

  test('renders placement cluster sets', async () => {
    render(<Component />)
    await waitForText('cluster-set-1,')
    await waitForText('cluster-set-2')
  })

  test('renders empty state when no placements', async () => {
    render(<Component placements={[]} />)
    await waitForText("You don't have any placements yet")
    await waitForText('Create placement')
  })
})
