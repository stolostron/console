/* Copyright Contributors to the Open Cluster Management project */

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { ClusterSetClustersPageContent } from './ClusterSetClusters'

// Mock the ClustersTable component
jest.mock('../../../../../../components/Clusters', () => ({
  ClustersTable: jest.fn((props: any) => (
    <div data-testid="mocked-clusters-table" data-tablekey={props.tableKey}>
      Mocked Clusters Table
    </div>
  )),
}))

// Mock AcmTableStateProvider and other ui-components
jest.mock('../../../../../../ui-components', () => ({
  AcmPageContent: jest.fn(({ children }: { children: React.ReactNode }) => (
    <div data-testid="acm-page-content">{children}</div>
  )),
  AcmEmptyState: jest.fn(() => <div data-testid="acm-empty-state">Empty State</div>),
  AcmTableStateProvider: jest.fn(
    ({ children, localStorageKey }: { children: React.ReactNode; localStorageKey: string }) => (
      <div data-testid="acm-table-state-provider" data-localstorage-key={localStorageKey}>
        {children}
      </div>
    )
  ),
}))

// Mock the ClusterSetDetailsContext
const mockClusterSet = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta2',
  kind: 'ManagedClusterSet',
  metadata: {
    name: 'test-cluster-set',
  },
  spec: {},
}

const mockClusters: any[] = []

jest.mock('../ClusterSetDetails', () => ({
  useClusterSetDetailsContext: jest.fn(() => ({
    clusterSet: mockClusterSet,
    clusters: mockClusters,
  })),
}))

// Mock resources
jest.mock('../../../../../../resources', () => ({
  ManagedClusterSetDefinition: {},
  isGlobalClusterSet: jest.fn(() => false),
}))

// Mock other dependencies
jest.mock('../../../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn(() => ({
    t: (key: string) => key,
  })),
}))

jest.mock('../../../../../../components/Rbac', () => ({
  RbacButton: jest.fn(({ children }: { children: React.ReactNode }) => <button>{children}</button>),
}))

jest.mock('../../../../../../lib/rbac-util', () => ({
  rbacCreate: jest.fn(() => []),
}))

jest.mock('../../../../../../NavigationPath', () => ({
  NavigationPath: {
    clusterSetDetails: '/cluster-sets/:id',
    clusterSetManage: '/cluster-sets/:id/manage',
    clusterSetOverview: '/cluster-sets/:id/overview',
  },
  SubRoutesRedirect: jest.fn(() => null),
}))

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <ClusterSetClustersPageContent />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ClusterSetClustersPageContent', () => {
  test('should render component without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeInTheDocument()
  })

  test('should wrap ClustersTable with AcmTableStateProvider using correct localStorageKey', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    expect(provider).toBeInTheDocument()
    expect(provider).toHaveAttribute('data-localstorage-key', 'cluster-set-clusters-table-state')
  })

  test('should render ClustersTable as a child of AcmTableStateProvider', () => {
    const { container } = render(<Component />)

    const provider = container.querySelector('[data-testid="acm-table-state-provider"]')
    const clustersTable = provider?.querySelector('[data-testid="mocked-clusters-table"]')
    expect(clustersTable).toBeInTheDocument()
  })

  test('should pass correct tableKey prop to ClustersTable', () => {
    const { container } = render(<Component />)

    const clustersTable = container.querySelector('[data-testid="mocked-clusters-table"]')
    expect(clustersTable).toBeInTheDocument()
    expect(clustersTable).toHaveAttribute('data-tablekey', 'clusterSetClusters')
  })
})
