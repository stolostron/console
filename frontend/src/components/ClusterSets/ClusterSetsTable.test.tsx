/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  certificateSigningRequestsState,
  clusterClaimsState,
  clusterDeploymentsState,
  managedClusterAddonsState,
  clusterManagementAddonsState,
  managedClusterInfosState,
  managedClustersState,
  agentClusterInstallsState,
  clusterCuratorsState,
  hostedClustersState,
  nodePoolsState,
  managedClusterSetBindingsState,
  discoveredClusterState,
} from '../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../lib/nock-util'
import { mockManagedClusterSet, mockGlobalClusterSet } from '../../lib/test-metadata'
import { waitForText, waitForNotText } from '../../lib/test-util'
import { ClusterSetsTable } from './ClusterSetsTable'
import { ExtendedManagedClusterSet } from '../../resources'

const mockExtendedClusterSet: ExtendedManagedClusterSet = {
  ...mockManagedClusterSet,
  clusters: [],
}

const mockExtendedGlobalClusterSet: ExtendedManagedClusterSet = {
  ...mockGlobalClusterSet,
  clusters: [],
}

const Component = ({
  managedClusterSets = [mockExtendedClusterSet, mockExtendedGlobalClusterSet],
  areLinksDisplayed = true,
  hideTableActions = false,
  hiddenColumns = [],
  showExportButton = true,
}: {
  managedClusterSets?: ExtendedManagedClusterSet[]
  areLinksDisplayed?: boolean
  hideTableActions?: boolean
  hiddenColumns?: string[]
  showExportButton?: boolean
}) => (
  <RecoilRoot
    initializeState={(snapshot) => {
      snapshot.set(certificateSigningRequestsState, [])
      snapshot.set(clusterClaimsState, [])
      snapshot.set(clusterDeploymentsState, [])
      snapshot.set(managedClusterAddonsState, {})
      snapshot.set(clusterManagementAddonsState, [])
      snapshot.set(managedClusterInfosState, [])
      snapshot.set(managedClustersState, [])
      snapshot.set(agentClusterInstallsState, [])
      snapshot.set(clusterCuratorsState, [])
      snapshot.set(hostedClustersState, [])
      snapshot.set(nodePoolsState, [])
      snapshot.set(managedClusterSetBindingsState, [])
      snapshot.set(discoveredClusterState, [])
    }}
  >
    <MemoryRouter>
      <ClusterSetsTable
        managedClusterSets={managedClusterSets}
        areLinksDisplayed={areLinksDisplayed}
        hideTableActions={hideTableActions}
        hiddenColumns={hiddenColumns}
        showExportButton={showExportButton}
      />
    </MemoryRouter>
  </RecoilRoot>
)

describe('ClusterSetsTable', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders cluster sets', async () => {
    render(<Component />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    await waitForText(mockGlobalClusterSet.metadata.name!)
  })

  test('renders with links when areLinksDisplayed is true', async () => {
    render(<Component areLinksDisplayed={true} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    const link = screen.getByRole('link', { name: mockManagedClusterSet.metadata.name! })
    expect(link).toBeInTheDocument()
  })

  test('renders without links when areLinksDisplayed is false', async () => {
    render(<Component areLinksDisplayed={false} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    const links = screen.queryAllByRole('link', { name: mockManagedClusterSet.metadata.name! })
    expect(links.length).toBe(0)
  })

  test('hides table actions when hideTableActions is true', async () => {
    render(<Component hideTableActions={true} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    expect(screen.queryByText('Create cluster set')).not.toBeInTheDocument()
  })

  test('shows table actions when hideTableActions is false', async () => {
    render(<Component hideTableActions={false} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    expect(screen.getByText('Create cluster set')).toBeInTheDocument()
  })

  test('hides columns based on hiddenColumns prop', async () => {
    render(<Component hiddenColumns={['Cluster statuses']} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    await waitForNotText('Cluster statuses')
  })

  test('renders empty state when no cluster sets', async () => {
    render(<Component managedClusterSets={[]} />)
    await waitForText("You don't have any cluster sets yet")
  })

  test('global cluster set row is disabled for selection', async () => {
    render(<Component />)
    await waitForText(mockGlobalClusterSet.metadata.name!)
    const checkbox = screen.getByRole('checkbox', { name: /select row 0/i })
    expect(checkbox).toBeDisabled()
  })

  describe('localStorageTableKey', () => {
    beforeEach(() => {
      localStorage.clear()
    })

    afterEach(() => {
      localStorage.clear()
    })

    test('uses default localStorageTableKey when not provided', async () => {
      render(<Component />)
      await waitForText(mockManagedClusterSet.metadata.name!)
      // The default key 'cluster-sets-table-state' should be used
    })

    test('uses custom localStorageTableKey when provided', async () => {
      render(
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(certificateSigningRequestsState, [])
            snapshot.set(clusterClaimsState, [])
            snapshot.set(clusterDeploymentsState, [])
            snapshot.set(managedClusterAddonsState, {})
            snapshot.set(clusterManagementAddonsState, [])
            snapshot.set(managedClusterInfosState, [])
            snapshot.set(managedClustersState, [])
            snapshot.set(agentClusterInstallsState, [])
            snapshot.set(clusterCuratorsState, [])
            snapshot.set(hostedClustersState, [])
            snapshot.set(nodePoolsState, [])
            snapshot.set(managedClusterSetBindingsState, [])
            snapshot.set(discoveredClusterState, [])
          }}
        >
          <MemoryRouter>
            <ClusterSetsTable
              managedClusterSets={[mockExtendedClusterSet]}
              localStorageTableKey="custom-cluster-sets-table-state"
            />
          </MemoryRouter>
        </RecoilRoot>
      )
      await waitForText(mockManagedClusterSet.metadata.name!)
      // The custom key 'custom-cluster-sets-table-state' should be used
    })

    test('renders correctly with role-assignment-cluster-sets-table-state key', async () => {
      render(
        <RecoilRoot
          initializeState={(snapshot) => {
            snapshot.set(certificateSigningRequestsState, [])
            snapshot.set(clusterClaimsState, [])
            snapshot.set(clusterDeploymentsState, [])
            snapshot.set(managedClusterAddonsState, {})
            snapshot.set(clusterManagementAddonsState, [])
            snapshot.set(managedClusterInfosState, [])
            snapshot.set(managedClustersState, [])
            snapshot.set(agentClusterInstallsState, [])
            snapshot.set(clusterCuratorsState, [])
            snapshot.set(hostedClustersState, [])
            snapshot.set(nodePoolsState, [])
            snapshot.set(managedClusterSetBindingsState, [])
            snapshot.set(discoveredClusterState, [])
          }}
        >
          <MemoryRouter>
            <ClusterSetsTable
              managedClusterSets={[mockExtendedClusterSet]}
              localStorageTableKey="role-assignment-cluster-sets-table-state"
            />
          </MemoryRouter>
        </RecoilRoot>
      )
      await waitForText(mockManagedClusterSet.metadata.name!)
    })
  })
})
