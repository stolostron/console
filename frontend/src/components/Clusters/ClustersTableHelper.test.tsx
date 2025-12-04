/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { RecoilRoot } from 'recoil'
import { ButtonVariant } from '@patternfly/react-core'
import {
  getControlPlaneString,
  getClusterDistributionString,
  useClusterNameColumn,
  useClusterStatusColumn,
  useClusterProviderColumn,
  useClusterControlPlaneColumn,
  useClusterDistributionColumn,
  useClusterLabelsColumn,
  useClusterNodesColumn,
  useClusterAddonColumn,
  useClusterCreatedDateColumn,
} from './ClustersTableHelper'
import { Cluster, ClusterStatus } from '../../resources/utils'
import { Provider } from '../../ui-components'

// Mock the translation hook
jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (options?.count !== undefined) {
        return `${key} ${options.count}`
      }
      return key
    },
  }),
}))

// Mock the shared atoms
jest.mock('../../shared-recoil', () => ({
  useSharedAtoms: () => ({
    agentClusterInstallsState: 'agentClusterInstallsState',
    clusterImageSetsState: 'clusterImageSetsState',
  }),
  useRecoilValue: (state: string) => {
    switch (state) {
      case 'agentClusterInstallsState':
        return []
      case 'clusterImageSetsState':
        return []
      default:
        return []
    }
  },
}))

// Mock the components that are not essential for testing
jest.mock('../../routes/Infrastructure/Clusters/ManagedClusters/components/DistributionField', () => ({
  DistributionField: ({ cluster }: { cluster: Cluster }) => (
    <div data-testid="distribution-field">{cluster.distribution?.displayVersion || 'Unknown'}</div>
  ),
}))

jest.mock('../../routes/Infrastructure/Clusters/ManagedClusters/components/StatusField', () => ({
  StatusField: ({ cluster }: { cluster: Cluster }) => (
    <div data-testid="status-field">{cluster.status}</div>
  ),
}))

jest.mock('../../routes/Infrastructure/Clusters/ManagedClusters/utils/cluster-actions', () => ({
  clusterDestroyable: () => true,
}))

jest.mock('../../NavigationPath', () => ({
  getClusterNavPath: () => '/cluster/test-cluster',
  NavigationPath: {
    clusterDetails: 'clusterDetails',
  },
}))

jest.mock('../../routes/Infrastructure/helpers/table-row-helpers', () => ({
  getDateTimeCell: (timestamp: string) => ({
    sortableValue: timestamp === '-' ? 0 : new Date(timestamp).getTime(),
  }),
}))

const mockCluster: Cluster = {
  name: 'test-cluster',
  displayName: 'Test Cluster',
  namespace: 'test-namespace',
  uid: 'test-cluster-uid',
  status: ClusterStatus.ready,
  provider: Provider.aws,
  distribution: {
    displayVersion: 'OpenShift 4.12.0',
    isManagedOpenShift: false,
    ocp: {
      version: '4.12.0',
      availableUpdates: [],
      desiredVersion: '4.12.0',
      upgradeFailed: false,
    },
  },
  labels: {
    'test-label': 'test-value',
    'environment': 'production',
  },
  nodes: {
    nodeList: [],
    ready: 3,
    unhealthy: 0,
    unknown: 0,
  },
  addons: {
    addonList: [],
    available: 2,
    degraded: 0,
    progressing: 0,
    unknown: 0,
  },
  creationTimestamp: '2023-01-01T00:00:00Z',
  hive: {
    isHibernatable: true,
    clusterPool: undefined,
    clusterClaimName: undefined,
    secrets: {
      installConfig: '',
      kubeconfig: '',
      kubeadmin: '',
    },
  },
  isHive: false,
  isHypershift: false,
  isHostedCluster: false,
  isRegionalHubCluster: false,
  isCurator: false,
  isManaged: true,
  isSNOCluster: false,
  owner: {},
  kubeApiServer: '',
  consoleURL: '',
  hasAutomationTemplate: false,
}

const renderWithProviders = (component: React.ReactElement) => {
  return render(
    <RecoilRoot>
      <MemoryRouter>
        {component}
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('ClustersTableHelper', () => {
  describe('getControlPlaneString', () => {
    const mockT = (key: string) => key

    it('should return "Hub, Hosted" for hub and hosted cluster', () => {
      const cluster = {
        ...mockCluster,
        isHostedCluster: true,
      }
      const result = getControlPlaneString(cluster, 'test-cluster', mockT)
      expect(result).toBe('Hub, Hosted')
    })

    it('should return "Hub" for hub cluster', () => {
      const result = getControlPlaneString(mockCluster, 'test-cluster', mockT)
      expect(result).toBe('Hub')
    })

    it('should return "Hosted" for hosted cluster', () => {
      const cluster = {
        ...mockCluster,
        name: 'other-cluster',
        isHostedCluster: true,
      }
      const result = getControlPlaneString(cluster, 'test-cluster', mockT)
      expect(result).toBe('Hosted')
    })

    it('should return "Standalone" for regular cluster', () => {
      const cluster = {
        ...mockCluster,
        name: 'other-cluster',
      }
      const result = getControlPlaneString(cluster, 'test-cluster', mockT)
      expect(result).toBe('Standalone')
    })

    it('should return "Hub" for regional hub cluster', () => {
      const cluster = {
        ...mockCluster,
        name: 'other-cluster',
        isRegionalHubCluster: true,
      }
      const result = getControlPlaneString(cluster, 'test-cluster', mockT)
      expect(result).toBe('Hub')
    })
  })

  describe('getClusterDistributionString', () => {
    it('should return cluster distribution displayVersion', () => {
      const result = getClusterDistributionString(mockCluster, [], [], [])
      expect(result).toBe('OpenShift 4.12.0')
    })

    it('should return MicroShift version for microshift provider', () => {
      const cluster = {
        ...mockCluster,
        provider: Provider.microshift,
        microshiftDistribution: {
          version: '4.12.0',
        },
      }
      const result = getClusterDistributionString(cluster, [], [], [])
      expect(result).toBe('4.12.0')
    })

    it('should handle undefined distribution', () => {
      const cluster = {
        ...mockCluster,
        distribution: undefined,
      }
      const result = getClusterDistributionString(cluster, [], [], [])
      expect(result).toBeUndefined()
    })
  })

  describe('Column Hooks', () => {
    // Test component to render column hooks
    const TestColumnComponent = ({ column, cluster }: { column: any, cluster: Cluster }) => {
      const cellContent = column.cell(cluster, '')
      return <div>{cellContent}</div>
    }

    it('should render cluster name column with link', () => {
      const column = useClusterNameColumn(true)
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      expect(screen.getByRole('link')).toBeInTheDocument()
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })

    it('should render cluster name column without link', () => {
      const column = useClusterNameColumn(false)
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      expect(screen.queryByRole('link')).not.toBeInTheDocument()
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })

    it('should render cluster status column', () => {
      const column = useClusterStatusColumn()
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      expect(screen.getByTestId('status-field')).toBeInTheDocument()
    })

    it('should render cluster provider column', () => {
      const column = useClusterProviderColumn()
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      // The AcmInlineProvider component should be rendered
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })

    it('should render cluster control plane column', () => {
      const column = useClusterControlPlaneColumn('local-cluster')
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      expect(screen.getByText('Standalone')).toBeInTheDocument()
    })

    it('should render cluster distribution column', () => {
      const column = useClusterDistributionColumn([mockCluster], [], [])
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      expect(screen.getByTestId('distribution-field')).toBeInTheDocument()
    })

    it('should render cluster labels column', () => {
      const column = useClusterLabelsColumn(false, 'local-cluster')
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      // The AcmLabels component should render the labels
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })

    it('should render cluster nodes column', () => {
      const column = useClusterNodesColumn()
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      // The AcmInlineStatusGroup component should be rendered
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })

    it('should render cluster addon column', () => {
      const column = useClusterAddonColumn()
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      // The AcmInlineStatusGroup component should be rendered
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })

    it('should render cluster created date column', () => {
      const column = useClusterCreatedDateColumn()
      renderWithProviders(<TestColumnComponent column={column} cluster={mockCluster} />)
      
      // The AcmTimestamp component should be rendered
      expect(screen.getByText('Test Cluster')).toBeInTheDocument()
    })
  })

  describe('Column Export Content', () => {
    it('should export cluster name correctly', () => {
      const column = useClusterNameColumn()
      expect(column.exportContent?.(mockCluster)).toBe('Test Cluster')
    })

    it('should export cluster status correctly', () => {
      const column = useClusterStatusColumn()
      expect(column.exportContent?.(mockCluster)).toBe('ready')
    })

    it('should export cluster provider correctly', () => {
      const column = useClusterProviderColumn()
      expect(column.exportContent?.(mockCluster)).toBe('Amazon Web Services')
    })

    it('should export cluster control plane correctly', () => {
      const column = useClusterControlPlaneColumn('local-cluster')
      expect(column.exportContent?.(mockCluster)).toBe('Standalone')
    })

    it('should export cluster distribution correctly', () => {
      const column = useClusterDistributionColumn([mockCluster], [], [])
      expect(column.exportContent?.(mockCluster)).toBe('OpenShift 4.12.0')
    })

    it('should export cluster labels correctly', () => {
      const column = useClusterLabelsColumn(false, 'local-cluster')
      const result = column.exportContent?.(mockCluster)
      expect(result).toContain('test-label=test-value')
      expect(result).toContain('environment=production')
    })

    it('should export cluster nodes correctly', () => {
      const column = useClusterNodesColumn()
      const result = column.exportContent?.(mockCluster)
      expect(result).toContain('healthy: 3')
      expect(result).toContain('danger: 0')
      expect(result).toContain('unknown: 0')
    })

    it('should export cluster addons correctly', () => {
      const column = useClusterAddonColumn()
      const result = column.exportContent?.(mockCluster)
      expect(result).toContain('healthy: 2')
      expect(result).toContain('danger: 0')
      expect(result).toContain('in progress: 0')
      expect(result).toContain('unknown: 0')
    })

    it('should export cluster created date correctly', () => {
      const column = useClusterCreatedDateColumn()
      const result = column.exportContent?.(mockCluster)
      expect(result).toBe('2023-01-01T00:00:00.000Z')
    })
  })

  describe('Column Headers and Properties', () => {
    it('should have correct headers for all columns', () => {
      expect(useClusterNameColumn().header).toBe('table.name')
      expect(useClusterStatusColumn().header).toBe('table.status')
      expect(useClusterProviderColumn().header).toBe('table.provider')
      expect(useClusterControlPlaneColumn().header).toBe('table.controlplane')
      expect(useClusterDistributionColumn([], [], []).header).toBe('table.distribution')
      expect(useClusterLabelsColumn(false).header).toBe('table.labels')
      expect(useClusterNodesColumn().header).toBe('table.nodes')
      expect(useClusterAddonColumn().header).toBe('Add-ons')
      expect(useClusterCreatedDateColumn().header).toBe('table.creationDate')
    })

    it('should have correct sort properties', () => {
      expect(useClusterNameColumn().sort).toBe('displayName')
      expect(useClusterStatusColumn().sort).toBe('status')
      expect(useClusterProviderColumn().sort).toBe('provider')
      expect(useClusterDistributionColumn([], [], []).sort).toBe('distribution.displayVersion')
      expect(useClusterNodesColumn().sort).toBe('nodes')
      expect(useClusterAddonColumn().sort).toBe('addons')
    })
  })
})
