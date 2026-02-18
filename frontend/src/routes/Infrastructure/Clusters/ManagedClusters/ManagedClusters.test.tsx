/* Copyright Contributors to the Open Cluster Management project */

/*
 * NOTE: Table-specific functionality tests (bulk actions, row actions, upgrades, etc.)
 * have been moved to ClustersTable.test.tsx since ClustersTable is now a separate component.
 * This test file focuses on the ManagedClusters page component integration and props passing.
 */

import { cleanup, render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import {
  certificateSigningRequestsState,
  clusterDeploymentsState,
  clusterManagementAddonsState,
  hostedClustersState,
  managedClusterAddonsState,
  managedClusterInfosState,
  managedClustersState,
} from '../../../../atoms'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { waitForTestId } from '../../../../lib/test-util'
import { ManagedCluster, ManagedClusterInfo } from '../../../../resources'
import ManagedClusters from './ManagedClusters'
import {
  mockCertificateSigningRequests,
  mockClusterDeployments,
  mockClusterManagementAddon,
  mockHostedClusters,
  mockManagedCluster6,
  mockManagedCluster7,
  mockManagedCluster8,
  mockManagedCluster9,
  mockManagedClusterAddon,
  mockManagedClusterInfo6,
  mockManagedClusterInfo7,
  mockManagedClusterInfo8,
  mockManagedClusterInfos,
  mockManagedClusters,
} from './ManagedClusters.sharedmocks'

// Mock variables (must be declared before jest.mock calls)
const mockKubevirtProviderAlert = jest.fn()
const mockClustersTable = jest.fn()

// Mock KubevirtProviderAlert component

jest.mock('../../../../components/KubevirtProviderAlert', () => ({
  KubevirtProviderAlert: (props: any) => {
    mockKubevirtProviderAlert(props)
    return (
      <div
        data-testid="kubevirt-provider-alert"
        data-variant={props.variant}
        data-component={props.component}
        data-hide-alert-when-no-vms={props.hideAlertWhenNoVMsExists}
      >
        Mocked KubevirtProviderAlert
      </div>
    )
  },
}))

// Mock ClustersTable component

jest.mock('../../../../components/Clusters/ClustersTable', () => ({
  ClustersTable: (props: any) => {
    mockClustersTable(props)
    return (
      <div
        id="clusters-table"
        data-testid="clusters-table"
        data-table-key={props.tableKey}
        data-clusters-count={props.clusters?.length || 0}
      >
        <div data-testid="table-button-actions">
          {props.tableButtonActions?.map((action: any) => (
            <button
              key={action.id}
              data-testid={`action-${action.id}`}
              disabled={action.isDisabled}
              onClick={action.click}
            >
              {action.title}
            </button>
          ))}
        </div>
        <div data-testid="empty-state">{props.clusters?.length === 0 && props.emptyState}</div>
        <div data-testid="cluster-list">
          {props.clusters?.map((cluster: any) => (
            <div key={cluster.metadata?.name} data-testid={`cluster-${cluster.metadata?.name}`}>
              {cluster.metadata?.name}
            </div>
          ))}
        </div>
      </div>
    )
  },
}))

// Mock the hooks used by KubevirtProviderAlert
jest.mock('../../../../lib/operatorCheck', () => ({
  useOperatorCheck: jest.fn(() => ({
    installed: false,
    pending: false,
  })),
  SupportedOperator: {
    kubevirt: 'kubevirt-hyperconverged',
  },
}))

jest.mock('@stolostron/multicluster-sdk', () => ({
  useFleetSearchPoll: jest.fn(() => [[], true, null]), // empty VMs, loaded, no error
}))

jest.mock('../../../../hooks/use-cluster-version', () => ({
  useClusterVersion: jest.fn(() => ({
    version: '4.21.0',
    isLoading: false,
  })),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: jest.fn(() => 'local-cluster'),
}))

// Mock other required components and hooks
jest.mock('./components/useAllClusters', () => ({
  useAllClusters: jest.fn(),
}))

jest.mock('../ClustersPage', () => ({
  usePageContext: jest.fn(),
}))

jest.mock('./components/AddCluster', () => ({
  AddCluster: () => <button data-testid="add-cluster">Add Cluster</button>,
}))

jest.mock('./components/OnboardingModal', () => ({
  OnboardingModal: ({ open, close }: { open: boolean; close: () => void }) =>
    open ? (
      <button data-testid="onboarding-modal" onClick={close}>
        Onboarding Modal
      </button>
    ) : null,
}))

// Mock navigation
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: () => jest.fn(),
}))

// Mock RBAC
jest.mock('../../../../lib/rbac-util', () => ({
  ...jest.requireActual('../../../../lib/rbac-util'),
  canUser: jest.fn(() => ({ promise: Promise.resolve({ status: { allowed: true } }), abort: jest.fn() })),
}))

describe('Clusters Page', () => {
  beforeEach(async () => {
    // Clear mocks and DOM
    jest.clearAllMocks()
    cleanup()

    // Setup mocks
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue(mockManagedClusters)

    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddon)
          snapshot.set(clusterManagementAddonsState, [mockClusterManagementAddon])
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForTestId('clusters-table')
  })

  test('should render ClustersTable component with correct props', async () => {
    await waitForTestId('clusters-table')

    // Verify ClustersTable was called with correct props
    expect(mockClustersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        clusters: expect.any(Array),
        tableKey: 'managedClusters',
        tableButtonActions: expect.arrayContaining([
          expect.objectContaining({
            id: 'createCluster',
            title: 'Create cluster',
          }),
          expect.objectContaining({
            id: 'importCluster',
            title: 'Import cluster',
          }),
        ]),
        emptyState: expect.any(Object),
      })
    )
  })

  test('should pass clusters data to ClustersTable', async () => {
    await waitForTestId('clusters-table')

    // Verify that the correct number of clusters is passed
    expect(mockClustersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        clusters: expect.arrayContaining(mockManagedClusters),
      })
    )
  })

  test('should render table button actions', async () => {
    await waitForTestId('clusters-table')

    // Verify that the table button actions are passed correctly
    expect(mockClustersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        tableButtonActions: expect.arrayContaining([
          expect.objectContaining({
            id: 'createCluster',
            title: 'Create cluster',
          }),
          expect.objectContaining({
            id: 'importCluster',
            title: 'Import cluster',
          }),
        ]),
      })
    )
  })

  test('should render KubevirtProviderAlert component with correct props', async () => {
    await waitForTestId('clusters-table')

    // The mock should have been called with the expected props
    expect(mockKubevirtProviderAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        variant: 'search',
        component: 'hint',
        hideAlertWhenNoVMsExists: true,
      })
    )
  })
})

describe('Clusters Page Empty State', () => {
  test('should render empty state when no clusters', async () => {
    // Clear mocks and DOM
    jest.clearAllMocks()
    cleanup()

    // Setup mocks for empty state
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue([])

    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    // Render with empty clusters
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, [])
          snapshot.set(clusterDeploymentsState, [])
          snapshot.set(managedClusterInfosState, [])
          snapshot.set(certificateSigningRequestsState, [])
          snapshot.set(managedClusterAddonsState, {})
          snapshot.set(clusterManagementAddonsState, [])
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForTestId('clusters-table')

    // Verify that empty clusters array is passed
    expect(mockClustersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        clusters: [],
      })
    )
  })
})

describe('Clusters Page RBAC', () => {
  test('should render component with RBAC restrictions', async () => {
    // Setup mocks
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue(mockManagedClusters)

    // Mock RBAC to return false (no permissions)
    const { canUser } = jest.requireMock('../../../../lib/rbac-util')
    canUser.mockReturnValue({ promise: Promise.resolve({ status: { allowed: false } }), abort: jest.fn() })

    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForTestId('clusters-table')

    // Verify that ClustersTable is rendered even with RBAC restrictions
    expect(mockClustersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        clusters: expect.any(Array),
        tableKey: 'managedClusters',
      })
    )
  })
})

describe('Clusters Page hypershift', () => {
  test('should render hypershift clusters', async () => {
    // Setup mocks
    const hypershiftMockManagedClusters: ManagedCluster[] = [mockManagedCluster6, mockManagedCluster7]
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue(hypershiftMockManagedClusters)

    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const hypershiftMockManagedClusterInfos: ManagedClusterInfo[] = [mockManagedClusterInfo6, mockManagedClusterInfo7]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, hypershiftMockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, hypershiftMockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
          snapshot.set(hostedClustersState, mockHostedClusters)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForTestId('clusters-table')
  })
})

describe('Clusters Page regional hub cluster', () => {
  test('should render regional hub clusters', async () => {
    // Setup mocks
    const mockRegionalHubClusters: ManagedCluster[] = [mockManagedCluster8]
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue(mockRegionalHubClusters)

    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const mockRegionalHubClusterInfos: ManagedClusterInfo[] = [mockManagedClusterInfo8]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockRegionalHubClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockRegionalHubClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForTestId('clusters-table')
  })
  test('should treat regional hub clusters as standalone if addon unreachable', async () => {
    // Setup mocks
    const mockRegionalHubClustersUnreachable: ManagedCluster[] = [mockManagedCluster9]
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue(mockRegionalHubClustersUnreachable)

    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    const mockRegionalHubClusterInfosUnreachable: ManagedClusterInfo[] = [mockManagedClusterInfo8]
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockRegionalHubClustersUnreachable)
          snapshot.set(managedClusterInfosState, mockRegionalHubClusterInfosUnreachable)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForTestId('clusters-table')
  })
})

describe('Clusters Page export', () => {
  test('export functionality is handled by ClustersTable component', async () => {
    // Setup mocks
    const { useAllClusters } = jest.requireMock('./components/useAllClusters')
    useAllClusters.mockReturnValue(mockManagedClusters)

    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    render(
      <RecoilRoot
        initializeState={(snapshot) => {
          snapshot.set(managedClustersState, mockManagedClusters)
          snapshot.set(clusterDeploymentsState, mockClusterDeployments)
          snapshot.set(managedClusterInfosState, mockManagedClusterInfos)
          snapshot.set(certificateSigningRequestsState, mockCertificateSigningRequests)
          snapshot.set(managedClusterAddonsState, mockManagedClusterAddon)
          snapshot.set(clusterManagementAddonsState, [mockClusterManagementAddon])
        }}
      >
        <MemoryRouter>
          <ManagedClusters />
        </MemoryRouter>
      </RecoilRoot>
    )
    await waitForTestId('clusters-table')

    // Verify that ClustersTable is rendered and will handle export functionality
    expect(mockClustersTable).toHaveBeenCalledWith(
      expect.objectContaining({
        clusters: expect.any(Array),
        tableKey: 'managedClusters',
      })
    )
  })
})
