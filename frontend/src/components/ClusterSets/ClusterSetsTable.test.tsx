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
  discoveredClusterState,
} from '../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../lib/nock-util'
import { mockManagedClusterSet, mockGlobalClusterSet } from '../../lib/test-metadata'
import { waitForText, waitForNotText } from '../../lib/test-util'
import { ClusterSetsTable, getClusterSetProviders } from './ClusterSetsTable'
import { ExtendedManagedClusterSet } from '../../resources'
import { Cluster } from '../../resources/utils'
import { Provider, ProviderLongTextMap } from '~/ui-components'
import { getMappedClusterSetClusters } from '../../routes/Infrastructure/Clusters/ClusterSets/components/useClusters'

jest.mock('../../routes/Infrastructure/Clusters/ClusterSets/components/useClusters', () => ({
  ...jest.requireActual('../../routes/Infrastructure/Clusters/ClusterSets/components/useClusters'),
  getMappedClusterSetClusters: jest.fn(() => []),
}))

const mockGetMappedClusterSetClusters = getMappedClusterSetClusters as jest.Mock
const clusterWith = (provider?: Provider) => ({ provider }) as Cluster

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
  <StateProvider
    initializeStore={(store) => {
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
      <ClusterSetsTable
        managedClusterSets={managedClusterSets}
        areLinksDisplayed={areLinksDisplayed}
        hideTableActions={hideTableActions}
        hiddenColumns={hiddenColumns}
        showExportButton={showExportButton}
      />
    </MemoryRouter>
  </StateProvider>
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
    expect(links).toHaveLength(0)
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

  test('shows provider icons for a set with vSphere and AWS clusters', async () => {
    mockGetMappedClusterSetClusters.mockReturnValue([
      clusterWith(Provider.vmware),
      clusterWith(Provider.aws),
      clusterWith(Provider.vmware),
    ])
    render(<Component managedClusterSets={[mockExtendedClusterSet]} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    expect(screen.getByRole('columnheader', { name: 'Infrastructure' })).toBeInTheDocument()
    expect(screen.getAllByRole('img', { name: ProviderLongTextMap[Provider.vmware] })).toHaveLength(1)
    expect(screen.getAllByRole('img', { name: ProviderLongTextMap[Provider.aws] })).toHaveLength(1)
  })

  test('shows - in the provider column for an empty cluster set', async () => {
    mockGetMappedClusterSetClusters.mockReturnValue([])
    render(<Component managedClusterSets={[mockExtendedClusterSet]} />)
    await waitForText(mockManagedClusterSet.metadata.name!)
    expect(screen.queryByRole('img', { name: ProviderLongTextMap[Provider.aws] })).not.toBeInTheDocument()
    const row = screen.getByRole('link', { name: mockManagedClusterSet.metadata.name! }).closest('tr')!
    expect(row).toHaveTextContent('-')
  })
})

describe('getClusterSetProviders', () => {
  test('de-duplicates providers in order of first appearance', () => {
    expect(
      getClusterSetProviders([
        clusterWith(Provider.vmware),
        clusterWith(Provider.aws),
        clusterWith(Provider.vmware),
        clusterWith(Provider.azure),
        clusterWith(Provider.aws),
      ])
    ).toEqual([Provider.vmware, Provider.aws, Provider.azure])
  })

  test('skips clusters with undefined provider', () => {
    expect(getClusterSetProviders([clusterWith(undefined), clusterWith(Provider.gcp)])).toEqual([Provider.gcp])
  })

  test('returns [] for no clusters', () => {
    expect(getClusterSetProviders([])).toEqual([])
  })
})
