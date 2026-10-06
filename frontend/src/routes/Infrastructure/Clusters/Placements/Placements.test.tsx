/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import nock from 'nock'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { placementsState } from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForText } from '../../../../lib/test-util'
import { NavigationPath } from '../../../../NavigationPath'
import { SelfSubjectAccessReview } from '../../../../resources'
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

function nockCreatePlacementAccess(allowed: boolean) {
  return nock(process.env.JEST_DEFAULT_HOST as string)
    .persist()
    .post('/apis/authorization.k8s.io/v1/selfsubjectaccessreviews', () => true)
    .optionally()
    .reply(201, (_uri, requestBody: SelfSubjectAccessReview) => {
      const resourceAttributes = requestBody.spec?.resourceAttributes
      const isCreatePlacement = resourceAttributes?.verb === 'create' && resourceAttributes?.resource === 'placements'
      return {
        apiVersion: 'authorization.k8s.io/v1',
        kind: 'SelfSubjectAccessReview',
        metadata: {},
        spec: requestBody.spec,
        status: { allowed: isCreatePlacement ? allowed : true },
      }
    })
}

const Component = ({ placements = [mockPlacement1, mockPlacement2] }: { placements?: Placement[] }) => (
  <StateProvider
    initializeStore={(store) => {
      store.set(placementsState, placements)
    }}
  >
    <MemoryRouter initialEntries={[NavigationPath.placements]}>
      <Routes>
        <Route path={`${NavigationPath.clusters}/*`} element={<Clusters />} />
      </Routes>
    </MemoryRouter>
  </StateProvider>
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

describe('Placements page RBAC', () => {
  beforeEach(() => {
    nockIgnoreApiPaths()
  })

  test('disables Create placement in the table when create is not allowed', async () => {
    nockCreatePlacementAccess(false)
    render(<Component />)
    await waitForText(mockPlacement1.metadata.name!)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create placement' })).toHaveAttribute('aria-disabled', 'true')
    )
  })

  test('enables Create placement in the table when create is allowed', async () => {
    nockCreatePlacementAccess(true)
    render(<Component />)
    await waitForText(mockPlacement1.metadata.name!)
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create placement' })).not.toHaveAttribute('aria-disabled', 'true')
    )
  })

  test('disables Create placement in the empty state when create is not allowed', async () => {
    nockCreatePlacementAccess(false)
    render(<Component placements={[]} />)
    await waitForText("You don't have any placements yet")
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create placement' })).toHaveAttribute('aria-disabled', 'true')
    )
  })

  test('enables Create placement in the empty state when create is allowed', async () => {
    nockCreatePlacementAccess(true)
    render(<Component placements={[]} />)
    await waitForText("You don't have any placements yet")
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Create placement' })).not.toHaveAttribute('aria-disabled', 'true')
    )
  })
})
