/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes, generatePath } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { placementsState, settingsState } from '../../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../../lib/nock-util'
import { waitForText } from '../../../../../lib/test-util'
import { NavigationPath } from '../../../../../NavigationPath'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../../../../../resources/placement'
import Clusters from '../../Clusters'

jest.mock('../../../../../components/KubevirtProviderAlert', () => ({
  KubevirtProviderAlert: () => null,
}))

const mockPlacement: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: {
    name: 'test-placement',
    namespace: 'default',
    uid: 'uid-placement-1',
  },
  spec: {
    clusterSets: ['cluster-set-1'],
  },
  status: {
    conditions: [],
    numberOfSelectedClusters: 5,
  },
}

function PlacementDetailsComponent({ placements = [mockPlacement] }: { placements?: Placement[] }) {
  const initialPath = generatePath(NavigationPath.placementDetails, {
    namespace: mockPlacement.metadata.namespace!,
    name: mockPlacement.metadata.name!,
  })
  return (
    <RecoilRoot
      initializeState={(snapshot) => {
        snapshot.set(placementsState, placements)
        snapshot.set(settingsState, { enhancedPlacement: 'enabled' })
      }}
    >
      <MemoryRouter initialEntries={[initialPath]}>
        <Routes>
          <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('PlacementDetails page', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders placement details with breadcrumb and header', async () => {
    render(<PlacementDetailsComponent />)
    await waitForText('test-placement', true)
    await waitForText('Placements')
  })

  test('renders overview tab content', async () => {
    render(<PlacementDetailsComponent />)
    await waitForText('test-placement', true)
    await waitForText('default', true)
    await waitForText('Details')
  })

  test('renders not found error when placement does not exist', async () => {
    render(<PlacementDetailsComponent placements={[]} />)
    await waitForText('Not found')
  })
})
