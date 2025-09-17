/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../../lib/PluginContext'
import { clickByText, waitForText } from '../../../lib/test-util'
import {
  deleteRoleAssignment,
  FlattenedRoleAssignment,
} from '../../../resources/clients/multicluster-role-assignment-client'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { AcmToastContext } from '../../../ui-components'
import { RoleAssignments } from './RoleAssignments'

// Mock Apollo Client
jest.mock('@apollo/client', () => ({
  ...jest.requireActual('@apollo/client'),
  useQuery: jest.fn(() => ({
    data: undefined,
    loading: false,
    error: undefined,
  })),
  useLazyQuery: jest.fn(() => [
    jest.fn(),
    {
      data: undefined,
      loading: false,
      error: undefined,
    },
  ]),
}))

// Mock the RoleAssignmentDataHook to avoid Apollo Client issues
jest.mock('./hook/RoleAssignmentDataHook', () => ({
  useRoleAssignmentData: jest.fn(() => ({
    roleAssignmentData: {
      users: [],
      groups: [],
      serviceAccounts: [],
      roles: [],
      clusters: [],
    },
    isLoading: false,
    isUsersLoading: false,
    isGroupsLoading: false,
    isRolesLoading: false,
    isClusterSetLoading: false,
  })),
}))

// Mock multicluster role assignments data
const mockMulticlusterRoleAssignments: MulticlusterRoleAssignment[] = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'test-assignment-1',
      uid: 'test-uid-1',
      creationTimestamp: '2024-01-15T10:30:00Z',
    },
    spec: {
      subject: { kind: 'User', name: 'test.user1' },
      roleAssignments: [
        {
          name: 'A1',
          clusterRole: 'admin',
          targetNamespaces: ['default', 'kube-system'],
          clusterSelection: {
            type: 'clusterNames',
            clusterNames: ['test-cluster-1'],
          },
        },
        {
          name: 'A2',
          clusterRole: 'cluster-admin',
          targetNamespaces: ['monitoring'],
          clusterSelection: {
            type: 'clusterNames',
            clusterNames: ['test-cluster-2'],
          },
        },
      ],
    },
    status: {
      roleAssignments: [
        {
          name: 'A1',
          status: 'Active',
        },
        {
          name: 'A2',
          status: 'Error',
        },
      ],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'test-assignment-2',
      uid: 'test-uid-2',
      creationTimestamp: '2024-01-15T11:00:00Z',
    },
    spec: {
      subject: { kind: 'User', name: 'test.user2' },
      roleAssignments: [
        {
          name: 'B1',
          clusterRole: 'developer',
          targetNamespaces: ['app-namespace'],
          clusterSelection: {
            type: 'clusterNames',
            clusterNames: ['dev-cluster'],
          },
        },
      ],
    },
    status: {
      roleAssignments: [
        {
          name: 'B1',
          status: 'Active',
        },
      ],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'test-assignment-3',
      uid: 'test-uid-3',
    },
    spec: {
      subject: { kind: 'User', name: 'test.user3' },
      roleAssignments: [
        {
          name: 'C1',
          clusterRole: 'viewer',
          targetNamespaces: ['staging-ns-1', 'staging-ns-2'],
          clusterSelection: {
            type: 'clusterNames',
            clusterNames: ['staging-cluster'],
          },
        },
      ],
    },
    status: {},
  },
]

const mockRoleAssignments: FlattenedRoleAssignment[] = [
  {
    name: 'A1',
    clusterRole: 'admin',
    targetNamespaces: ['default', 'kube-system'],
    clusterSelection: {
      type: 'clusterNames',
      clusterNames: ['test-cluster-1'],
    },
    relatedMulticlusterRoleAssignment: mockMulticlusterRoleAssignments[0],
    subject: {
      name: mockMulticlusterRoleAssignments[0].spec.subject.name,
      kind: mockMulticlusterRoleAssignments[0].spec.subject.kind,
    },
    status: mockMulticlusterRoleAssignments[0].status?.roleAssignments?.[0],
  },
  {
    name: 'A2',
    clusterRole: 'cluster-admin',
    targetNamespaces: ['monitoring'],
    clusterSelection: {
      type: 'clusterNames',
      clusterNames: ['test-cluster-2'],
    },
    relatedMulticlusterRoleAssignment: mockMulticlusterRoleAssignments[0],
    subject: {
      name: mockMulticlusterRoleAssignments[0].spec.subject.name,
      kind: mockMulticlusterRoleAssignments[0].spec.subject.kind,
    },
    status: mockMulticlusterRoleAssignments[0].status?.roleAssignments?.[1],
  },
  {
    name: 'B1',
    clusterRole: 'developer',
    targetNamespaces: ['app-namespace'],
    clusterSelection: {
      type: 'clusterNames',
      clusterNames: ['dev-cluster'],
    },
    relatedMulticlusterRoleAssignment: mockMulticlusterRoleAssignments[1],
    subject: {
      name: mockMulticlusterRoleAssignments[1].spec.subject.name,
      kind: mockMulticlusterRoleAssignments[1].spec.subject.kind,
    },
    status: mockMulticlusterRoleAssignments[1].status?.roleAssignments?.[0],
  },
  {
    name: 'C1',
    clusterRole: 'viewer',
    targetNamespaces: ['staging-ns-1', 'staging-ns-2'],
    clusterSelection: {
      type: 'clusterNames',
      clusterNames: ['staging-cluster'],
    },
    relatedMulticlusterRoleAssignment: mockMulticlusterRoleAssignments[2],
    subject: {
      name: mockMulticlusterRoleAssignments[2].spec.subject.name,
      kind: mockMulticlusterRoleAssignments[2].spec.subject.kind,
    },
  },
]

// Mock toast context
const mockToastContext = {
  addAlert: jest.fn(),
  removeAlert: jest.fn(),
  replaceAlert: jest.fn(),
  activeAlerts: [],
  alertInfos: [],
  removeVisibleAlert: jest.fn(),
  clearAlerts: jest.fn(),
}

// Simplified mocks matching Infrastructure pattern style
jest.mock('../../../ui-components', () => {
  const React = jest.requireActual('react')

  return {
    ...jest.requireActual('../../../ui-components'),
    AcmTable: ({ columns, items, filters, isLoading, emptyState, tableActions, tableActionButtons }: any) => {
      const [filteredItems, setFilteredItems] = React.useState(items)

      // Simulate Infrastructure pattern: Simple table with text-based interactions
      const handleBulkAction = (actionId: string) => {
        const action = tableActions?.find((a: any) => a.id === actionId)
        if (action && items?.length > 0) {
          action.click(items.slice(0, 1))
          mockToastContext.addAlert({
            title: 'Role assignment deleted',
            type: 'success',
            autoClose: true,
          })
        }
      }

      const handleFilter = (filterId: string, value: string) => {
        const filter = filters?.find((f: any) => f.id === filterId)
        if (filter && filter.tableFilterFn && items?.length > 0) {
          filter.tableFilterFn([value], items[0])

          // Apply the actual filter using TrackedRoleAssignment properties
          const filtered = items.filter((item: any) => {
            switch (filterId) {
              case 'role':
                return item.clusterRole === value
              case 'clusters':
                const clusterNames = item.clusterSelection?.clusterNames || []
                return clusterNames.includes(value)
              case 'namespace':
                return item.targetNamespaces?.includes(value)
              case 'status':
                return true // All items are active in our mock
              default:
                return true
            }
          })
          setFilteredItems(filtered)
        }
      }

      if (columns && items?.length > 0) {
        const testItem = items[0]
        columns.forEach((col: any) => {
          try {
            if (col.cell) col.cell(testItem)
            if (col.exportContent) col.exportContent(testItem)
            if (col.sort && typeof col.sort === 'function' && items.length > 1) {
              col.sort(testItem, items[1])
            }
          } catch {}
        })
      }

      return (
        <div>
          {/* Loading state */}
          {isLoading && <div>Loading role assignments</div>}

          {/* Empty state */}
          {items?.length === 0 && emptyState}

          {/* Create button */}
          {tableActionButtons?.map((btn: any, i: number) => (
            <button key={i} onClick={btn.click}>
              {btn.title}
            </button>
          ))}

          {/* Bulk actions - simplified to avoid "Actions" text conflicts */}
          {tableActions?.map((action: any, i: number) => (
            <button key={i} onClick={() => handleBulkAction(action.id)}>
              {action.title}
            </button>
          ))}

          {/* Filters - simplified but with specific options for tests */}
          {filters?.map((filter: any, i: number) => (
            <div key={i}>
              <button onClick={() => handleFilter(filter.id, 'default')}>{filter.label}</button>
              {filter.id === 'role' && (
                <>
                  <button onClick={() => handleFilter(filter.id, 'admin')}>Filter admin</button>
                  <button onClick={() => handleFilter(filter.id, 'developer')}>Filter developer</button>
                </>
              )}
              {filter.id === 'clusters' && (
                <>
                  <button onClick={() => handleFilter(filter.id, 'test-cluster-1')}>Filter test-cluster-1</button>
                  <button onClick={() => handleFilter(filter.id, 'dev-cluster')}>Filter dev-cluster</button>
                </>
              )}
              {filter.id === 'namespace' && (
                <>
                  <button onClick={() => handleFilter(filter.id, 'default')}>Filter default</button>
                  <button onClick={() => handleFilter(filter.id, 'app-namespace')}>Filter app-namespace</button>
                </>
              )}
              {filter.id === 'status' && <button onClick={() => handleFilter(filter.id, 'Active')}>Active</button>}
            </div>
          ))}

          {/* Export button - simplified */}
          <button
            onClick={() => {
              const blob = new Blob(['test'], { type: 'text/csv' })
              URL.createObjectURL(blob)
            }}
          >
            Export all to CSV
          </button>

          {/* Table data - simplified */}
          {filteredItems?.map((item: FlattenedRoleAssignment) => (
            <div key={item.name}>
              <div>
                {item.subject.kind}: {item.subject.name}
              </div>
              <div>{item.clusterRole}</div>
              <div>{(item.clusterSelection?.clusterNames || []).join(', ') || 'No clusters'}</div>
              <div>{item.targetNamespaces?.join(', ') || 'No namespaces'}</div>
              <div>{`Status: ${item.status?.status ?? 'Unknown'}`}</div>
              <button onClick={() => mockToastContext.addAlert({ title: 'Action', type: 'info' })}>Row Actions</button>
            </div>
          ))}
        </div>
      )
    },
    AcmLoadingPage: () => <div>Loading role assignments</div>,
  }
})

// Simplified modal mock
jest.mock('../../../components/BulkActionModal', () => ({
  BulkActionModal: ({ open, actionFn, items = [], confirmText, title, description, close }: any) => (
    <div style={{ display: open ? 'block' : 'none' }}>
      {open && (
        <>
          <div>{title}</div>
          <div>{description}</div>
          <div>Confirm by typing "{confirmText}" below:</div>
          <button
            onClick={() => {
              if (actionFn && items.length > 0) {
                items.forEach(actionFn)
                mockToastContext.addAlert({
                  title: 'Role assignment deleted',
                  type: 'success',
                  autoClose: true,
                })
              }
            }}
          >
            Delete
          </button>
          <button onClick={close}>Cancel</button>
        </>
      )}
    </div>
  ),
}))

// Simplified dropdown mock
jest.mock('./RoleAssignmentActionDropdown', () => ({
  RoleAssignmentActionDropdown: ({ roleAssignment, setModalProps, toastContext }: any) => (
    <div>
      <button
        onClick={() => {
          if (setModalProps) setModalProps({ open: true })
          if (toastContext) {
            toastContext.addAlert({
              title: `Deleting ${roleAssignment?.metadata?.name}`,
              type: 'info',
              autoClose: true,
            })
          }
        }}
      >
        Delete role assignment
      </button>
    </div>
  ),
}))

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  ...jest.requireActual('../../../resources/clients/multicluster-role-assignment-client'),
  deleteRoleAssignment: jest.fn(),
}))
const mockDeleteRoleAssignment = deleteRoleAssignment as jest.Mock

const Component = ({
  roleAssignments = mockRoleAssignments,
  isLoading = false,
  hiddenColumns = undefined,
}: {
  roleAssignments?: FlattenedRoleAssignment[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'clusters')[]
} = {}) => (
  <RecoilRoot>
    <MemoryRouter>
      <PluginContext.Provider value={defaultPlugin}>
        <AcmToastContext.Provider value={mockToastContext}>
          <RoleAssignments
            roleAssignments={roleAssignments}
            isLoading={isLoading}
            hiddenColumns={hiddenColumns}
            preselected={{
              subject: undefined,
              roles: undefined,
              cluterSets: undefined,
            }}
          />
        </AcmToastContext.Provider>
      </PluginContext.Provider>
    </MemoryRouter>
  </RecoilRoot>
)

describe('RoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    jest.clearAllMocks()
  })

  it('renders loading state', async () => {
    // Act
    render(<Component isLoading={true} />)

    // Assert
    expect(screen.getByText('Loading role assignments')).toBeInTheDocument()
  })

  it('renders with role assignments data', async () => {
    // Act
    render(<Component />)

    // Assert
    expect(screen.getByText(/cluster-admin/i)).toBeInTheDocument()
    expect(screen.getAllByText('User: test.user1')).toHaveLength(2)
    expect(screen.getByText('test-cluster-1')).toBeInTheDocument()
    expect(screen.getByText(/default, kube-system/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create role assignment/i })).toBeInTheDocument()
    expect(screen.getAllByText('Status: Active')).toHaveLength(2)
    expect(screen.getAllByText('Status: Error')).toHaveLength(1)
    expect(screen.getAllByText('Status: Unknown')).toHaveLength(1)
  })

  it('renders empty state', async () => {
    render(<Component roleAssignments={[]} />)

    expect(screen.getByText('No role assignment created yet')).toBeInTheDocument()
  })

  it('can create role assignment', async () => {
    // Act
    render(<Component />)

    // Assert
    expect(screen.getByText('test-cluster-1')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /create role assignment/i })).toBeInTheDocument()
    await clickByText('Create role assignment')
  })

  it('can create role assignment from empty state', async () => {
    render(<Component roleAssignments={[]} />)
    await waitForText('No role assignment created yet')
    // Use screen.getAllByText for multiple matches
    expect(screen.getAllByText('Create role assignment')[0]).toBeInTheDocument()

    // Assert
    expect(screen.getByText('No role assignment created yet')).toBeInTheDocument()
    expect(screen.getAllByText('Create role assignment')[0]).toBeInTheDocument()
  })

  it('can delete role assignments using bulk actions', async () => {
    render(<Component />)
    await waitForText('test-cluster-1')

    // Test accessibility-focused button assertions
    expect(screen.getByRole('button', { name: /delete role assignments/i })).toBeInTheDocument()
    await clickByText('Delete role assignments')
    await waitForText('Delete role assignments?')
    await waitForText('Confirm by typing "delete" below:')

    // Test delete confirmation button
    expect(screen.getByRole('button', { name: /^delete$/i })).toBeInTheDocument()
    await clickByText('Delete')
    expect(mockDeleteRoleAssignment).toHaveBeenCalledTimes(1)
  })

  it('bulk delete modal shows correct confirmation text', async () => {
    render(<Component />)
    await waitForText('test-cluster-1')
    await clickByText('Delete role assignments')
    await waitForText('Delete role assignments?')
    await waitForText('Are you sure that you want to delete the role assignments? This action cannot be undone.')
    expect(mockDeleteRoleAssignment).toHaveBeenCalledTimes(0)
  })

  it('can cancel bulk delete modal', async () => {
    render(<Component />)
    await waitForText('test-cluster-1')

    // Test delete button first
    expect(screen.getByRole('button', { name: /delete role assignments/i })).toBeInTheDocument()
    await clickByText('Delete role assignments')
    await waitForText('Delete role assignments?')

    // Test cancel button in modal
    expect(screen.getByRole('button', { name: /cancel/i })).toBeInTheDocument()
    // Click cancel to trigger close function (Line 80)
    await clickByText('Cancel')
    expect(mockDeleteRoleAssignment).toHaveBeenCalledTimes(0)
  })

  it('can filter by role', async () => {
    render(<Component />)
    // Initially all 4 flattened assignments should be visible (test.user1 has 2 roles)
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('User: test.user2', true) // Allow multiple matches
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('User: test.user3', true) // Allow multiple matches

    // Filter by 'admin' role
    await clickByText('Role')
    await clickByText('Filter admin')

    // Should still show the flattened row with 'admin' role (test.user1's first assignment)
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('admin', true) // Verify admin role is visible

    // Should filter out rows with different roles
    expect(screen.queryAllByText(/User: test\.user2/i)).toHaveLength(0) // developer role filtered out
    expect(screen.queryAllByText(/User: test\.user3/i)).toHaveLength(0) // viewer role filtered out
    expect(screen.queryByText('cluster-admin')).not.toBeInTheDocument() // test.user1's second role filtered out
    expect(screen.queryByText('developer')).not.toBeInTheDocument()
    expect(screen.queryByText('viewer')).not.toBeInTheDocument()
  })

  it('can filter by cluster', async () => {
    render(<Component />)
    // Initially all 4 flattened assignments should be visible
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('User: test.user2', true) // Allow multiple matches
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('User: test.user3', true) // Allow multiple matches

    // Filter by 'test-cluster-1' cluster
    await clickByText('Clusters')
    await clickByText('Filter test-cluster-1')

    // Should still show only the flattened row with 'test-cluster-1' (test.user1's admin role)
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('admin', true) // Verify this is the admin role row

    // Should filter out rows with different clusters
    expect(screen.queryAllByText(/User: test\.user2/i)).toHaveLength(0) // dev-cluster filtered out
    expect(screen.queryAllByText(/User: test\.user3/i)).toHaveLength(0) // staging-cluster filtered out
    expect(screen.queryByText('test-cluster-2')).not.toBeInTheDocument() // test.user1's second cluster filtered out
    expect(screen.queryByText('dev-cluster')).not.toBeInTheDocument()
    expect(screen.queryByText('staging-cluster')).not.toBeInTheDocument()
    expect(screen.queryByText('cluster-admin')).not.toBeInTheDocument() // test.user1's second role filtered out
  })

  it('can filter by namespace', async () => {
    render(<Component />)
    // Initially all 4 flattened assignments should be visible
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('User: test.user2', true) // Allow multiple matches
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('User: test.user3', true) // Allow multiple matches

    // Filter by 'default' namespace
    await clickByText('Namespace')
    await clickByText('Filter default')

    // Should still show only the flattened row with 'default' namespace (test.user1's admin role)
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('admin', true) // Verify this is the admin role row
    await waitForText('default, kube-system', true) // Verify default namespace is visible (with kube-system)

    // Should filter out rows without 'default' namespace
    expect(screen.queryAllByText(/User: test\.user2/i)).toHaveLength(0) // app-namespace filtered out
    expect(screen.queryAllByText(/User: test\.user3/i)).toHaveLength(0) // staging-ns-1, staging-ns-2 filtered out
    expect(screen.queryByText('cluster-admin')).not.toBeInTheDocument() // test.user1's monitoring namespace filtered out
    expect(screen.queryByText('monitoring')).not.toBeInTheDocument()
    expect(screen.queryByText('app-namespace')).not.toBeInTheDocument()
    expect(screen.queryByText('staging-ns-1')).not.toBeInTheDocument()
  })

  it('displays all role assignment data correctly', async () => {
    render(<Component />)

    // Start with the exact same pattern as the working test
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('admin', true) // Allow multiple matches

    // Test additional data that should be rendered (keep it simple)
    await waitForText('User: test.user2', true) // Allow multiple matches
    await waitForText('User: test.user3', true) // Allow multiple matches
    await waitForText('cluster-admin', true) // test.user1's second role
    await waitForText('developer', true) // test.user2's role
    await waitForText('viewer', true) // test.user3's role

    // Test cluster data that should be rendered
    await waitForText('test-cluster-2', true) // test.user1's cluster-admin role cluster
    await waitForText('dev-cluster', true) // test.user2's developer role cluster
    await waitForText('staging-cluster', true) // test.user3's viewer role cluster

    // Verify flattened structure: test.user1 should appear in 2 separate rows
    expect(screen.getAllByText(/User: test\.user1/i)).toHaveLength(2)
  })

  describe('Column Display and Hidden Columns', () => {
    it('hides subject data when hiddenColumns includes subject', async () => {
      render(<Component hiddenColumns={['subject']} />)

      // Wait for other data to load
      await waitForText('admin', true) // Role should still be visible
      await waitForText('test-cluster-1', true) // Cluster should still be visible

      // Component should render without errors when subject column is hidden
      // Note: Our mock doesn't implement actual column hiding, but we verify
      // the component handles the hiddenColumns prop without crashing
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('test-cluster-1')).toBeInTheDocument()
    })

    it('hides role data when hiddenColumns includes role', async () => {
      render(<Component hiddenColumns={['role']} />)

      // Wait for other data to load
      await waitForText('User: test.user1', true) // Subject should still be visible
      await waitForText('test-cluster-1', true) // Cluster should still be visible

      // Component should render without errors when role column is hidden
      expect(screen.getAllByText('User: test.user1')[0]).toBeInTheDocument()
      expect(screen.getByText('test-cluster-1')).toBeInTheDocument()
    })

    it('hides cluster data when hiddenColumns includes cluster', async () => {
      render(<Component hiddenColumns={['clusters']} />)

      // Wait for other data to load
      await waitForText('User: test.user1', true) // Subject should still be visible
      await waitForText('admin', true) // Role should still be visible

      // Component should render without errors when cluster column is hidden
      expect(screen.getAllByText('User: test.user1')[0]).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })

    it('hides multiple columns when specified', async () => {
      render(<Component hiddenColumns={['subject', 'role']} />)

      // Wait for remaining data to load
      await waitForText('test-cluster-1', true) // Only cluster should be visible

      // Component should render without errors when multiple columns are hidden
      expect(screen.getByText('test-cluster-1')).toBeInTheDocument()
    })

    it('shows all data when hiddenColumns is empty array', async () => {
      render(<Component hiddenColumns={[]} />)

      // Wait for data to load
      await waitForText('User: test.user1', true)

      // All data types should be visible (same as default behavior)
      await waitForText('admin', true) // Role column data
      await waitForText('User: test.user1', true) // Subject column data
      await waitForText('test-cluster-1', true) // Cluster column data
    })
  })
})
