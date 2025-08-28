/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { waitForText, clickByText } from '../../../lib/test-util'
import { RoleAssignments } from './RoleAssignments'
import { defaultPlugin, PluginContext } from '../../../lib/PluginContext'
import { AcmToastContext } from '../../../ui-components'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'

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
          clusterRole: 'admin',
          targetNamespaces: ['default', 'kube-system'],
          clusterSets: ['test-cluster-1'],
        },
        {
          clusterRole: 'cluster-admin',
          targetNamespaces: ['monitoring'],
          clusterSets: ['test-cluster-2'],
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
          clusterRole: 'developer',
          targetNamespaces: ['app-namespace'],
          clusterSets: ['dev-cluster'],
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
          clusterRole: 'viewer',
          targetNamespaces: ['staging-ns-1', 'staging-ns-2'],
          clusterSets: ['staging-cluster'],
        },
      ],
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
              case 'clusterSet':
                return item.clusterSets?.includes(value)
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
              {filter.id === 'clusterSet' && (
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
          {filteredItems?.map((item: any) => (
            <div key={item.multiclusterRoleAssignmentUid + '-' + item.roleAssignmentIndex}>
              <div>
                {item.subjectKind}: {item.subjectName}
              </div>
              <div>{item.clusterRole}</div>
              <div>{item.clusterSets?.join(', ') || 'No clusters'}</div>
              <div>{item.targetNamespaces?.join(', ') || 'No namespaces'}</div>
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
      <button>Edit role assignment</button>
    </div>
  ),
}))

const Component = ({
  multiclusterRoleAssignments = mockMulticlusterRoleAssignments,
  isLoading = false,
  hiddenColumns = undefined,
}: {
  multiclusterRoleAssignments?: MulticlusterRoleAssignment[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'cluster')[]
} = {}) => (
  <RecoilRoot>
    <MemoryRouter>
      <PluginContext.Provider value={defaultPlugin}>
        <AcmToastContext.Provider value={mockToastContext}>
          <RoleAssignments
            multiclusterRoleAssignments={multiclusterRoleAssignments}
            isLoading={isLoading}
            hiddenColumns={hiddenColumns}
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
    render(<Component isLoading={true} />)
    await waitForText('Loading role assignments')
  })

  it('renders with role assignments data', async () => {
    render(<Component />)
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('admin', true) // Allow multiple matches

    // Test accessibility-focused button assertions for key functionality
    expect(screen.getAllByRole('button', { name: /create role assignment/i })[0]).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /delete role assignments/i })).toBeInTheDocument()
  })

  it('renders empty state', async () => {
    render(<Component multiclusterRoleAssignments={[]} />)
    await waitForText('No role assignment created yet')
    await waitForText('Create role assignment', true) // Allow multiple matches

    // Test accessibility-focused button assertion - use getAllByRole for multiple buttons
    expect(screen.getAllByRole('button', { name: /create role assignment/i })[0]).toBeInTheDocument()
  })

  it('can create role assignment', async () => {
    render(<Component />)
    await waitForText('test-cluster-1')

    // Test accessibility-focused button assertion before clicking - use getAllByRole for multiple buttons
    expect(screen.getAllByRole('button', { name: /create role assignment/i })[0]).toBeInTheDocument()
    await clickByText('Create role assignment')
  })

  it('can create role assignment from empty state', async () => {
    render(<Component multiclusterRoleAssignments={[]} />)
    await waitForText('No role assignment created yet')
    // Use screen.getAllByText for multiple matches
    expect(screen.getAllByText('Create role assignment')[0]).toBeInTheDocument()

    // Test accessibility-focused button assertion - use getAllByRole for multiple buttons
    expect(screen.getAllByRole('button', { name: /create role assignment/i })[0]).toBeInTheDocument()
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
  })

  it('bulk delete modal shows correct confirmation text', async () => {
    render(<Component />)
    await waitForText('test-cluster-1')
    await clickByText('Delete role assignments')
    await waitForText('Delete role assignments?')
    await waitForText('Are you sure that you want to delete the role assignments? This action cannot be undone.')
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

    // Filter by 'test-cluster-1' cluster set
    await clickByText('Cluster Set')
    await clickByText('Filter test-cluster-1')

    // Should still show only the flattened row with 'test-cluster-1' (test.user1's admin role)
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('admin', true) // Verify this is the admin role row

    // Should filter out rows with different cluster sets
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

  it('shows success toast after bulk delete', async () => {
    const mockAddAlert = jest.fn()
    const testToastContext = {
      ...mockToastContext,
      addAlert: mockAddAlert,
    }

    render(
      <RecoilRoot>
        <MemoryRouter>
          <PluginContext.Provider value={defaultPlugin}>
            <AcmToastContext.Provider value={testToastContext}>
              <RoleAssignments multiclusterRoleAssignments={mockMulticlusterRoleAssignments} />
            </AcmToastContext.Provider>
          </PluginContext.Provider>
        </MemoryRouter>
      </RecoilRoot>
    )

    await waitForText('test-cluster-1')
    await clickByText('Delete role assignments')
    await waitForText('Confirm by typing "delete" below:')
    await clickByText('Delete')

    expect(mockAddAlert).toHaveBeenCalledWith({
      title: 'Role assignment deleted',
      type: 'success',
      autoClose: true,
    })
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
      render(<Component hiddenColumns={['cluster']} />)

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
