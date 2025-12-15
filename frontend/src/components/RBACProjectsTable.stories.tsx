/* Copyright Contributors to the Open Cluster Management project */
import type { Meta, StoryObj } from '@storybook/react'
import { action } from '@storybook/addon-actions'
import { PluginDataContextProvider } from '../components/PluginDataContextProvider'
import { defaultContext as pluginDataDefaultContext } from '../lib/PluginDataContext'
import { RBACProjectsTable, ProjectTableData } from './RBACProjectsTable'

const sampleProjects: ProjectTableData[] = [
  {
    name: 'default',
    type: 'Namespace',
    clusters: ['local-cluster', 'dev-cluster'],
    description: 'Default namespace used by most workloads',
  },
  {
    name: 'team-a',
    type: 'Namespace',
    clusters: ['local-cluster', 'dev-cluster', 'prod-cluster'],
    description: 'Team A workloads',
  },
  {
    name: 'observability',
    type: 'Namespace',
    clusters: ['local-cluster'],
    description: 'Monitoring and observability stack',
  },
]

const useMockRoleAssignmentData = () => ({
  roleAssignmentData: {
    users: [],
    groups: [],
    serviceAccounts: [],
    roles: [],
    clusterSets: [
      {
        name: 'sample-cluster-set',
        clusters: [
          { name: 'local-cluster', namespaces: ['default', 'team-a', 'observability'] },
          { name: 'dev-cluster', namespaces: ['default', 'team-a'] },
          { name: 'prod-cluster', namespaces: ['default'] },
        ],
      },
    ],
    allClusterNames: ['local-cluster', 'dev-cluster', 'prod-cluster'],
  },
  isLoading: false,
  isUsersLoading: false,
  isGroupsLoading: false,
  isRolesLoading: false,
  isClusterSetLoading: false,
})

const mockPluginData = {
  ...pluginDataDefaultContext,
  loadStarted: true,
  loadCompleted: true,
}

const meta: Meta<typeof RBACProjectsTable> = {
  title: 'RBAC/RBACProjectsTable',
  component: RBACProjectsTable,
  decorators: [
    (Story) => (
      <PluginDataContextProvider value={mockPluginData}>
        <div style={{ padding: 24 }}>
          <Story />
        </div>
      </PluginDataContextProvider>
    ),
  ],
  args: {
    selectedClusters: ['local-cluster', 'dev-cluster', 'prod-cluster'],
    projects: sampleProjects,
    areLinksDisplayed: true,
    onSelectionChange: action('selection-change'),
    onCreateClick: action('create-common-project'),
    useRoleAssignmentDataHook: useMockRoleAssignmentData,
  },
}

export default meta
type Story = StoryObj<typeof meta>

export const WithoutLinks: Story = {
  args: {
    areLinksDisplayed: false,
  },
}

export const EmptyState: Story = {
  args: {
    projects: [],
  },
}
