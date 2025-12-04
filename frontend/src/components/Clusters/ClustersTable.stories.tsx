/* Copyright Contributors to the Open Cluster Management project */

import type { Meta, StoryObj } from '@storybook/react'
import { MemoryRouter } from 'react-router-dom'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import { ClustersTable } from './ClustersTable'
import { Cluster, ClusterStatus } from '../../resources/utils'
import { Provider } from '../../ui-components'
import { AcmEmptyState, IAcmTableButtonAction } from '../../ui-components'
import { ButtonVariant } from '@patternfly/react-core'

// Mock the shared atoms for Storybook
const mockRecoilState = {
  clusterCuratorsState: [],
  hostedClustersState: [],
  infraEnvironmentsState: [],
  agentClusterInstallsState: [],
  clusterImageSetsState: [],
}

// Decorator to provide necessary context
const withProviders = (Story: any) => (
  <RecoilRoot
    initializeState={(snapshot: any) => {
      Object.entries(mockRecoilState).forEach(([key, value]) => {
        snapshot.set(key as any, value)
      })
    }}
  >
    <MemoryRouter>
      <Story />
    </MemoryRouter>
  </RecoilRoot>
)

const createMockCluster = (overrides: Partial<Cluster> = {}): Cluster => ({
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
    environment: 'production',
    team: 'platform',
    region: 'us-east-1',
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
  ...overrides,
})

const mockClusters: Cluster[] = [
  createMockCluster({
    name: 'production-cluster-1',
    displayName: 'Production Cluster 1',
    namespace: 'production-1',
    status: ClusterStatus.ready,
    provider: Provider.aws,
    nodes: { nodeList: [], ready: 5, unhealthy: 0, unknown: 0 },
    addons: { addonList: [], available: 3, degraded: 0, progressing: 0, unknown: 0 },
  }),
  createMockCluster({
    name: 'staging-cluster',
    displayName: 'Staging Cluster',
    namespace: 'staging',
    status: ClusterStatus.hibernating,
    provider: Provider.gcp,
    nodes: { nodeList: [], ready: 0, unhealthy: 0, unknown: 3 },
    addons: { addonList: [], available: 1, degraded: 1, progressing: 0, unknown: 0 },
    labels: {
      environment: 'staging',
      team: 'development',
    },
  }),
  createMockCluster({
    name: 'development-cluster',
    displayName: 'Development Cluster',
    namespace: 'development',
    status: ClusterStatus.offline,
    provider: Provider.azure,
    nodes: { nodeList: [], ready: 1, unhealthy: 2, unknown: 0 },
    addons: { addonList: [], available: 0, degraded: 0, progressing: 2, unknown: 0 },
    labels: {
      environment: 'development',
      team: 'development',
    },
  }),
  createMockCluster({
    name: 'test-cluster-hypershift',
    displayName: 'Test Hypershift Cluster',
    namespace: 'hypershift-test',
    status: ClusterStatus.ready,
    provider: Provider.aws,
    isHypershift: true,
    isHostedCluster: true,
    nodes: { nodeList: [], ready: 2, unhealthy: 0, unknown: 0 },
    addons: { addonList: [], available: 1, degraded: 0, progressing: 0, unknown: 0 },
  }),
  createMockCluster({
    name: 'regional-hub',
    displayName: 'Regional Hub Cluster',
    namespace: 'regional-hub',
    status: ClusterStatus.ready,
    provider: Provider.baremetal,
    isRegionalHubCluster: true,
    nodes: { nodeList: [], ready: 7, unhealthy: 0, unknown: 0 },
    addons: { addonList: [], available: 5, degraded: 0, progressing: 0, unknown: 0 },
  }),
]

const defaultTableButtonActions = [
  {
    id: 'createCluster',
    title: 'Create cluster',
    click: () => console.log('Create cluster clicked'),
    variant: ButtonVariant.primary,
  },
  {
    id: 'importCluster',
    title: 'Import cluster',
    click: () => console.log('Import cluster clicked'),
    variant: ButtonVariant.secondary,
  },
] as IAcmTableButtonAction[]

const emptyState = (
  <AcmEmptyState
    title="You don't have any clusters yet"
    message="To get started, create a cluster or import an existing cluster."
    action={<button>Add Cluster</button>}
  />
)

const meta: Meta<typeof ClustersTable> = {
  title: 'Components/ClustersTable',
  component: ClustersTable,
  decorators: [withProviders],
  parameters: {
    layout: 'fullscreen',
  },
  argTypes: {
    clusters: {
      description: 'Array of cluster objects to display in the table',
    },
    tableButtonActions: {
      description: 'Array of button actions to display above the table',
    },
    emptyState: {
      description: 'React node to display when no clusters are available',
    },
    hideTableActions: {
      description: 'Hide bulk table actions (upgrade, hibernate, etc.)',
      control: 'boolean',
    },
    showExportButton: {
      description: 'Show/hide the export button',
      control: 'boolean',
    },
    areLinksDisplayed: {
      description: 'Enable/disable clickable links in the table',
      control: 'boolean',
    },
    hiddenColumns: {
      description: 'Array of column names to hide from the table',
      control: 'object',
    },
    onSelectCluster: {
      description: 'Callback function when clusters are selected',
      action: 'onSelectCluster',
    },
  },
}

export default meta
type Story = StoryObj<typeof ClustersTable>

export const Default: Story = {
  args: {
    clusters: mockClusters,
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: true,
    areLinksDisplayed: true,
    hiddenColumns: [],
  },
}

export const EmptyState: Story = {
  args: {
    clusters: [],
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: true,
    areLinksDisplayed: true,
    hiddenColumns: [],
  },
}

export const SingleCluster: Story = {
  args: {
    clusters: [mockClusters[0]],
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: true,
    areLinksDisplayed: true,
    hiddenColumns: [],
  },
}

export const WithoutTableActions: Story = {
  args: {
    clusters: mockClusters,
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: true,
    showExportButton: true,
    areLinksDisplayed: true,
    hiddenColumns: [],
  },
}

export const WithoutExportButton: Story = {
  args: {
    clusters: mockClusters,
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: false,
    areLinksDisplayed: true,
    hiddenColumns: [],
  },
}

export const WithoutLinks: Story = {
  args: {
    clusters: mockClusters,
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: true,
    areLinksDisplayed: false,
    hiddenColumns: [],
  },
}

export const WithHiddenColumns: Story = {
  args: {
    clusters: mockClusters,
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: true,
    areLinksDisplayed: true,
    hiddenColumns: ['table.namespace', 'table.labels'],
  },
}

export const MinimalConfiguration: Story = {
  args: {
    clusters: mockClusters,
    emptyState,
    hideTableActions: true,
    showExportButton: false,
    areLinksDisplayed: false,
    hiddenColumns: ['table.namespace', 'table.labels', 'table.nodes', 'Add-ons'],
  },
}

export const WithRowSelection: Story = {
  args: {
    clusters: mockClusters,
    tableButtonActions: defaultTableButtonActions,
    emptyState,
    hideTableActions: false,
    showExportButton: true,
    areLinksDisplayed: true,
    hiddenColumns: [],
    onSelectCluster: (clusters: Cluster[]) => {
      console.log(
        'Selected clusters:',
        clusters.map((c) => c.name)
      )
    },
  },
}

export const DifferentClusterStates: Story = {
  args: {
    clusters: [
      createMockCluster({
        name: 'ready-cluster',
        displayName: 'Ready Cluster',
        status: ClusterStatus.ready,
        provider: Provider.aws,
      }),
      createMockCluster({
        name: 'offline-cluster',
        displayName: 'Offline Cluster',
        status: ClusterStatus.offline,
        provider: Provider.gcp,
      }),
      createMockCluster({
        name: 'hibernating-cluster',
        displayName: 'Hibernating Cluster',
        status: ClusterStatus.hibernating,
        provider: Provider.azure,
      }),
      createMockCluster({
        name: 'pending-cluster',
        displayName: 'Pending Cluster',
        status: ClusterStatus.pendingimport,
        provider: Provider.baremetal,
      }),
    ],
    tableButtonActions: defaultTableButtonActions,
    emptyState,
  },
}

export const DifferentProviders: Story = {
  args: {
    clusters: [
      createMockCluster({
        name: 'aws-cluster',
        displayName: 'AWS Cluster',
        provider: Provider.aws,
      }),
      createMockCluster({
        name: 'gcp-cluster',
        displayName: 'GCP Cluster',
        provider: Provider.gcp,
      }),
      createMockCluster({
        name: 'azure-cluster',
        displayName: 'Azure Cluster',
        provider: Provider.azure,
      }),
      createMockCluster({
        name: 'baremetal-cluster',
        displayName: 'Baremetal Cluster',
        provider: Provider.baremetal,
      }),
      createMockCluster({
        name: 'vsphere-cluster',
        displayName: 'vSphere Cluster',
        provider: Provider.vmware,
      }),
    ],
    tableButtonActions: defaultTableButtonActions,
    emptyState,
  },
}

export const LargeClustersSet: Story = {
  args: {
    clusters: Array.from({ length: 50 }, (_, i) =>
      createMockCluster({
        name: `cluster-${i + 1}`,
        displayName: `Cluster ${i + 1}`,
        namespace: `namespace-${i + 1}`,
        status: [ClusterStatus.ready, ClusterStatus.offline, ClusterStatus.hibernating][i % 3],
        provider: [Provider.aws, Provider.gcp, Provider.azure, Provider.baremetal][i % 4],
      })
    ),
    tableButtonActions: defaultTableButtonActions,
    emptyState,
  },
}
