/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
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
  managedClusterSetsState,
  discoveredClusterState,
} from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { mockManagedClusterSet, mockGlobalClusterSet } from '../../../../lib/test-metadata'
import { waitForText, waitForNotText } from '../../../../lib/test-util'
import { ClusterSetsList } from './ClusterSetsList'

const Component = ({ onSelectClusterSet = jest.fn() }: { onSelectClusterSet?: jest.Mock }) => (
  <StateProvider
    initializeStore={(store) => {
      store.set(managedClusterSetsState, [mockManagedClusterSet, mockGlobalClusterSet])
      store.set(certificateSigningRequestsState, [])
      store.set(clusterClaimsState, [])
      store.set(clusterDeploymentsState, [])
      store.set(managedClusterAddonsState, {})
      store.set(clusterManagementAddonsState, [])
      store.set(managedClusterInfosState, [])
      store.set(managedClustersState, [])
      store.set(agentClusterInstallsState, [])
      store.set(clusterCuratorsState, [])
      store.set(hostedClustersState, [])
      store.set(nodePoolsState, [])
      store.set(managedClusterSetBindingsState, [])
      store.set(discoveredClusterState, [])
    }}
  >
    <MemoryRouter>
      <ClusterSetsList onSelectClusterSet={onSelectClusterSet} />
    </MemoryRouter>
  </StateProvider>
)

describe('ClusterSetsList', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  test('renders cluster sets', async () => {
    render(<Component />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    // Global cluster set should not be rendered as it's filtered out
    await waitForNotText(mockGlobalClusterSet.metadata.name!)
  })

  test('does not render links', async () => {
    render(<Component />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    const links = screen.queryAllByRole('link', { name: mockManagedClusterSet.metadata.name! })
    expect(links).toHaveLength(0)
  })

  test('does not render table action buttons', async () => {
    render(<Component />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    expect(screen.queryByText('Create cluster set')).not.toBeInTheDocument()
  })

  test('hides cluster set binding column', async () => {
    render(<Component />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    await waitForNotText('Namespace bindings')
    // Cluster status column should be visible (not hidden)
    await waitForText('Cluster status')
  })

  test('does not show export button', async () => {
    render(<Component />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    expect(screen.queryByLabelText('export-search-result')).not.toBeInTheDocument()
  })

  test('filters out global cluster set using isGlobalClusterSet', async () => {
    render(<Component />)
    // Regular cluster set should be rendered
    await waitForText(mockManagedClusterSet.metadata.name!)
    // Global cluster set should be filtered out and not rendered
    await waitForNotText(mockGlobalClusterSet.metadata.name!)
    // Verify only the non-global cluster set is in the table
    const clusterSetRows = screen.queryAllByText(mockManagedClusterSet.metadata.name!)
    expect(clusterSetRows.length).toBeGreaterThan(0)
    const globalClusterSetRows = screen.queryAllByText(mockGlobalClusterSet.metadata.name!)
    expect(globalClusterSetRows).toHaveLength(0)
  })
})
