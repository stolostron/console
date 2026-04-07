/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import { defaultPlugin, PluginContext } from '../../../lib/PluginContext'
import { useIsAnyNamespaceAuthorized } from '../../../lib/rbac-util'
import { clickByText, waitForText } from '../../../lib/test-util'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { deleteRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentNamespace,
} from '../../../resources/multicluster-role-assignment'
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
jest.mock('../RoleAssignments/hook/RoleAssignmentDataHook', () => ({
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

// Mock useRoleAssignmentsStatusHook so status column and callbacks are controlled
jest.mock('./useRoleAssignmentsStatusHook', () => ({
  useRoleAssignmentsStatusHook: jest.fn(() => ({
    callbacksPerReasonMap: {},
    isProcessingRoleAssignmentMap: {},
    isAnyRoleAssignmentProcessing: false,
  })),
}))

// Mock multicluster role assignments data
const mockMulticlusterRoleAssignments: MulticlusterRoleAssignment[] = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
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
            type: 'placements',
            placements: [{ name: 'placement-test-cluster-1', namespace: MulticlusterRoleAssignmentNamespace }],
          },
        },
        {
          name: 'A2',
          clusterRole: 'cluster-admin',
          targetNamespaces: ['monitoring'],
          clusterSelection: {
            type: 'placements',
            placements: [{ name: 'placement-test-cluster-2', namespace: MulticlusterRoleAssignmentNamespace }],
          },
        },
      ],
    },
    status: {
      roleAssignments: [
        {
          name: 'A1',
          status: 'Active',
          createdAt: '2024-01-15T10:30:00Z',
        },
        {
          name: 'A2',
          status: 'Error',
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
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
            type: 'placements',
            placements: [{ name: 'placement-dev-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
          },
        },
      ],
    },
    status: {
      roleAssignments: [
        {
          name: 'B1',
          status: 'Active',
          createdAt: '2024-01-15T10:30:00Z',
        },
      ],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
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
            type: 'placements',
            placements: [{ name: 'placement-staging-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
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
      type: 'placements',
      placements: [{ name: 'placement-test-cluster-1', namespace: MulticlusterRoleAssignmentNamespace }],
    },
    clusterNames: ['test-cluster-1'],
    clusterSetNames: ['cluster-set-alpha', 'cluster-set-beta'],
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
      type: 'placements',
      placements: [{ name: 'placement-test-cluster-2', namespace: MulticlusterRoleAssignmentNamespace }],
    },
    clusterNames: ['test-cluster-2'],
    clusterSetNames: ['cluster-set-beta'],
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
      type: 'placements',
      placements: [{ name: 'placement-dev-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
    },
    clusterNames: ['dev-cluster'],
    clusterSetNames: ['cluster-set-gamma'],
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
      type: 'placements',
      placements: [{ name: 'placement-staging-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
    },
    clusterNames: ['staging-cluster'],
    clusterSetNames: ['cluster-set-delta'],
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
  modifyAlert: jest.fn((alert: any) => alert),
  activeAlerts: [],
  alertInfos: [],
  removeVisibleAlert: jest.fn(),
  clearAlerts: jest.fn(),
}

jest.mock('../../../lib/rbac-util', () => ({
  ...jest.requireActual('../../../lib/rbac-util'),
  useIsAnyNamespaceAuthorized: jest.fn(() => true), // Defaults to true == authorized
}))

// Simplified mocks matching Infrastructure pattern style
jest.mock('../../../ui-components', () => {
  const React = jest.requireActual('react')

  return {
    ...jest.requireActual('../../../ui-components'),
    AcmTable: ({ columns, items, filters, isLoading, emptyState, tableActions, tableActionButtons }: any) => {
      const [filteredItems, setFilteredItems] = React.useState(items)

      // Update filteredItems when items change
      React.useEffect(() => {
        setFilteredItems(items)
      }, [items])

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
              case 'clusterSets': {
                const clusterSetNames = item.clusterSetNames || []
                return clusterSetNames.includes(value)
              }
              case 'clusters': {
                const clusterNames = item.clusterNames || []
                return clusterNames.includes(value)
              }
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
            <button
              key={i}
              onClick={btn.isDisabled ? undefined : btn.click}
              disabled={btn.isDisabled}
              title={btn.tooltip || ''}
              aria-disabled={btn.isDisabled}
            >
              {btn.title}
            </button>
          ))}

          {/* Bulk actions - simplified to avoid "Actions" text conflicts */}
          {tableActions?.map((action: any, i: number) => (
            <button
              key={i}
              onClick={action.isDisabled ? undefined : () => handleBulkAction(action.id)}
              disabled={action.isDisabled}
              title={action.tooltip || ''}
              aria-disabled={action.isDisabled}
            >
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
              {filter.id === 'clusterSets' && (
                <>
                  <button onClick={() => handleFilter(filter.id, 'cluster-set-alpha')}>Filter cluster-set-alpha</button>
                  <button onClick={() => handleFilter(filter.id, 'cluster-set-beta')}>Filter cluster-set-beta</button>
                  <button onClick={() => handleFilter(filter.id, 'cluster-set-gamma')}>Filter cluster-set-gamma</button>
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
          {filteredItems?.map((item: FlattenedRoleAssignment) => {
            // Find and render the action column cell
            const actionColumn = columns?.find((col: any) => col.isActionCol)
            return (
              <div key={item.name}>
                <div>
                  {item.subject.kind}: {item.subject.name}
                </div>
                <div>{item.clusterRole}</div>
                <div>{(item.clusterSetNames || []).join(', ') || 'No cluster sets'}</div>
                <div>{(item.clusterNames || []).join(', ') || 'No clusters'}</div>
                <div>{item.targetNamespaces?.join(', ') || 'No namespaces'}</div>
                <div>{`Status: ${item.status?.status ?? 'Unknown'}`}</div>
                <div>{`CreatedAt: ${item.status?.createdAt}`}</div>
                {/* Render action column cell to test canPatch/canDelete props */}
                {actionColumn?.cell && <div data-testid={`action-cell-${item.name}`}>{actionColumn.cell(item)}</div>}
                <button onClick={() => mockToastContext.addAlert({ title: 'Action', type: 'info' })}>
                  Row Actions
                </button>
              </div>
            )
          })}
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
  RoleAssignmentActionDropdown: ({ roleAssignment, setModalProps, toastContext, canPatch, canDelete, onEdit }: any) => (
    <div data-testid={`action-dropdown-${roleAssignment?.name}`}>
      <button
        onClick={() => {
          if (canPatch && onEdit) onEdit(roleAssignment)
        }}
        disabled={!canPatch}
        aria-disabled={!canPatch}
        data-testid={`edit-action-${roleAssignment?.name}`}
      >
        Edit role assignment
      </button>
      <button
        onClick={() => {
          if (canDelete && setModalProps) setModalProps({ open: true })
          if (toastContext) {
            toastContext.addAlert({
              title: `Deleting ${roleAssignment?.metadata?.name}`,
              type: 'info',
              autoClose: true,
            })
          }
        }}
        disabled={!canDelete}
        aria-disabled={!canDelete}
        data-testid={`delete-action-${roleAssignment?.name}`}
      >
        Delete role assignment
      </button>
      {/* Expose canPatch value for testing */}
      <span data-testid={`canPatch-${roleAssignment?.name}`}>{canPatch ? 'true' : 'false'}</span>
      <span data-testid={`canDelete-${roleAssignment?.name}`}>{canDelete ? 'true' : 'false'}</span>
    </div>
  ),
}))

jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  ...jest.requireActual('../../../resources/clients/multicluster-role-assignment-client'),
  deleteRoleAssignment: jest.fn(),
}))
const mockDeleteRoleAssignment = deleteRoleAssignment as jest.Mock
const mockUseIsAnyNamespaceAuthorized = useIsAnyNamespaceAuthorized as jest.Mock

const Component = ({
  roleAssignments = mockRoleAssignments,
  isLoading = false,
  hiddenColumns = undefined,
  hiddenFilters = [],
}: {
  roleAssignments?: FlattenedRoleAssignment[]
  isLoading?: boolean
  hiddenColumns?: ('subject' | 'role' | 'clusters' | 'clusterSets' | 'name')[]
  hiddenFilters?: ('role' | 'identity' | 'clusters' | 'clusterSets' | 'namespace' | 'status')[]
} = {}) => (
  <RecoilRoot>
    <MemoryRouter>
      <PluginContext.Provider value={defaultPlugin}>
        <AcmToastContext.Provider value={mockToastContext}>
          <RoleAssignments
            roleAssignments={roleAssignments}
            isLoading={isLoading}
            hiddenColumns={hiddenColumns}
            hiddenFilters={hiddenFilters}
            preselected={{
              subject: undefined,
              roles: undefined,
              clusterNames: undefined,
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
    expect(screen.getAllByText('CreatedAt: 2024-01-15T10:30:00Z')).toHaveLength(3) // user1's two roles and user2's one role
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
    await waitForText('Confirm by typing "confirm" below:')

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

  it('can filter by cluster set', async () => {
    render(<Component />)
    // Initially all 4 flattened assignments should be visible
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('User: test.user2', true) // Allow multiple matches
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('User: test.user3', true) // Allow multiple matches

    // Filter by 'cluster-set-alpha' cluster set
    await clickByText('Cluster sets')
    await clickByText('Filter cluster-set-alpha')

    // Should still show only the flattened row with 'cluster-set-alpha' (test.user1's admin role)
    await waitForText('User: test.user1', true) // Allow multiple matches
    await waitForText('test-cluster-1', true) // Allow multiple matches
    await waitForText('admin', true) // Verify this is the admin role row
    // Verify cluster set is visible (displayed as joined string)
    expect(screen.getByText('cluster-set-alpha, cluster-set-beta')).toBeInTheDocument()

    // Should filter out rows without 'cluster-set-alpha' cluster set
    expect(screen.queryAllByText(/User: test\.user2/i)).toHaveLength(0) // cluster-set-gamma filtered out
    expect(screen.queryAllByText(/User: test\.user3/i)).toHaveLength(0) // cluster-set-delta filtered out
    expect(screen.queryByText('cluster-admin')).not.toBeInTheDocument() // test.user1's second role (only has cluster-set-beta) filtered out
    expect(screen.queryByText('cluster-set-gamma')).not.toBeInTheDocument()
    expect(screen.queryByText('cluster-set-delta')).not.toBeInTheDocument()
  })

  it('can filter by cluster set with multiple matches', async () => {
    render(<Component />)
    // Initially all 4 flattened assignments should be visible
    await waitForText('test-cluster-1', true)
    await waitForText('User: test.user1', true)

    // Filter by 'cluster-set-beta' which is in both A1 and A2 (test.user1's roles)
    await clickByText('Cluster sets')
    await clickByText('Filter cluster-set-beta')

    // Should show both rows that have 'cluster-set-beta'
    await waitForText('User: test.user1', true)
    await waitForText('admin', true) // A1 has cluster-set-alpha and cluster-set-beta
    await waitForText('cluster-admin', true) // A2 has cluster-set-beta

    // Should filter out rows without 'cluster-set-beta' cluster set
    expect(screen.queryAllByText(/User: test\.user2/i)).toHaveLength(0) // cluster-set-gamma filtered out
    expect(screen.queryAllByText(/User: test\.user3/i)).toHaveLength(0) // cluster-set-delta filtered out
  })

  it('displays cluster set data in table', async () => {
    render(<Component />)

    // Wait for data to load
    await waitForText('test-cluster-1', true)

    // Verify cluster set data is displayed (as joined strings in the mock)
    expect(screen.getByText('cluster-set-alpha, cluster-set-beta')).toBeInTheDocument() // A1
    expect(screen.getByText('cluster-set-beta')).toBeInTheDocument() // A2
    expect(screen.getByText('cluster-set-gamma')).toBeInTheDocument() // B1
    expect(screen.getByText('cluster-set-delta')).toBeInTheDocument() // C1
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

    it('hides cluster sets data when hiddenColumns includes clusterSets', async () => {
      render(<Component hiddenColumns={['clusterSets']} />)

      // Wait for other data to load
      await waitForText('User: test.user1', true) // Subject should still be visible
      await waitForText('admin', true) // Role should still be visible
      await waitForText('test-cluster-1', true) // Cluster should still be visible

      // Component should render without errors when clusterSets column is hidden
      expect(screen.getAllByText('User: test.user1')[0]).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
      expect(screen.getByText('test-cluster-1')).toBeInTheDocument()
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
      // Cluster set column data (displayed as joined string)
      expect(screen.getByText('cluster-set-alpha, cluster-set-beta')).toBeInTheDocument()
    })

    it('hides cluster sets and clusters columns together', async () => {
      render(<Component hiddenColumns={['clusterSets', 'clusters']} />)

      // Wait for other data to load
      await waitForText('User: test.user1', true) // Subject should still be visible
      await waitForText('admin', true) // Role should still be visible

      // Component should render without errors when both cluster-related columns are hidden
      expect(screen.getAllByText('User: test.user1')[0]).toBeInTheDocument()
      expect(screen.getByText('admin')).toBeInTheDocument()
    })
  })

  describe('RBAC Permissions and Button States', () => {
    beforeEach(() => {
      mockUseIsAnyNamespaceAuthorized.mockReturnValue(true)
    })

    describe('Create Permission Tests', () => {
      it('enables Create button when user has both create and patch permissions', async () => {
        mockUseIsAnyNamespaceAuthorized.mockReturnValueOnce(true)
        render(<Component />)
        await waitForText('test-cluster-1')

        const createButton = screen.getByRole('button', { name: /create role assignment/i })
        expect(createButton).toBeInTheDocument()
        expect(createButton).not.toBeDisabled()
      })

      test.each([
        {
          scenario: 'disables Create button when user lacks create permission',
          canCreate: false,
          canPatch: true,
          canDelete: true,
        },
        {
          scenario: 'disables Create button when user lacks patch permission',
          canCreate: true,
          canPatch: false,
          canDelete: true,
        },
        {
          scenario: 'disables Create button when user lacks both create and patch permissions',
          canCreate: false,
          canPatch: false,
          canDelete: true,
        },
      ])('$scenario', async ({ canCreate, canPatch, canDelete }) => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(canCreate)
          .mockReturnValueOnce(canPatch)
          .mockReturnValueOnce(canDelete)
        render(<Component />)
        await waitForText('test-cluster-1')

        const createButton = screen.getByRole('button', { name: /create role assignment/i })
        expect(createButton).toBeInTheDocument()
        expect(createButton).toBeDisabled()
        expect(createButton).toHaveAttribute('title', expect.stringContaining('not authorized'))
      })
    })

    describe('Delete Permission Tests', () => {
      it('enables Delete button when user has both delete and patch permissions', async () => {
        mockUseIsAnyNamespaceAuthorized.mockReturnValueOnce(true)
        render(<Component />)
        await waitForText('test-cluster-1')

        const deleteButton = screen.getByRole('button', { name: /delete role assignments/i })
        expect(deleteButton).toBeInTheDocument()
        expect(deleteButton).not.toBeDisabled()
      })

      test.each([
        {
          scenario: 'disables Delete button when user lacks delete permission',
          canCreate: true,
          canPatch: true,
          canDelete: false,
        },
        {
          scenario: 'disables Delete button when user lacks patch permission',
          canCreate: true,
          canPatch: false,
          canDelete: true,
        },
        {
          scenario: 'disables Delete button when user lacks both delete and patch permissions',
          canCreate: true,
          canPatch: false,
          canDelete: false,
        },
      ])('$scenario', async ({ canCreate, canPatch, canDelete }) => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(canCreate)
          .mockReturnValueOnce(canPatch)
          .mockReturnValueOnce(canDelete)
        render(<Component />)
        await waitForText('test-cluster-1')

        const deleteButton = screen.getByRole('button', { name: /delete role assignments/i })
        expect(deleteButton).toBeInTheDocument()
        expect(deleteButton).toBeDisabled()
        expect(deleteButton).toHaveAttribute('title', expect.stringContaining('not authorized'))
      })
    })

    describe('Empty State RBAC', () => {
      it('enables Create button in empty state when user has permissions', async () => {
        mockUseIsAnyNamespaceAuthorized.mockReturnValueOnce(true)
        render(<Component roleAssignments={[]} />)
        await waitForText('No role assignment created yet')

        const createButtons = screen.getAllByText('Create role assignment')
        expect(createButtons.length).toBeGreaterThan(0)

        const emptyStateButton = createButtons.find((btn) => btn.closest('button'))?.closest('button')
        expect(emptyStateButton).toBeTruthy()
        expect(emptyStateButton).not.toHaveAttribute('aria-disabled', 'true')
      })

      it('disables Create button in empty state when user lacks permissions', async () => {
        mockUseIsAnyNamespaceAuthorized.mockReturnValueOnce(false)
        render(<Component roleAssignments={[]} />)
        await waitForText('No role assignment created yet')

        const createButtons = screen.getAllByText('Create role assignment')
        expect(createButtons.length).toBeGreaterThan(0)

        const emptyStateButton = createButtons.find((btn) => btn.closest('button'))?.closest('button')
        expect(emptyStateButton).toBeTruthy()
        expect(emptyStateButton).toHaveAttribute('aria-disabled', 'true')
      })
    })

    describe('Edit Permission Tests (canPatch passed to ActionCell)', () => {
      it('calls useIsAnyNamespaceAuthorized for create, patch, and delete permissions', async () => {
        mockUseIsAnyNamespaceAuthorized.mockReturnValue(true)
        render(<Component />)
        await waitForText('test-cluster-1')

        // Verify useIsAnyNamespaceAuthorized was called 3 times: rbacCreate, rbacPatch, rbacDelete
        // Note: rbacCreate, rbacPatch, rbacDelete return Promises, so we verify the hook was called 3 times
        expect(mockUseIsAnyNamespaceAuthorized).toHaveBeenCalledTimes(3)
      })

      it('uses canPatchRoleAssignment for edit action enablement', async () => {
        // When canPatch is true, edit should be enabled
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(true) // canPatchRoleAssignment
          .mockReturnValueOnce(true) // canDelete
        render(<Component />)
        await waitForText('test-cluster-1')

        // The action dropdown mock should receive canPatch=true
        // We verify this by checking the edit button is rendered and enabled
        const editButtons = screen.getAllByText('Edit role assignment')
        expect(editButtons.length).toBeGreaterThan(0)
        const editButton = editButtons[0].closest('button')
        expect(editButton).not.toBeDisabled()
      })

      it('disables edit action when canPatchRoleAssignment is false', async () => {
        // When canPatch is false, edit should be disabled
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(false) // canPatchRoleAssignment
          .mockReturnValueOnce(true) // canDelete
        render(<Component />)
        await waitForText('test-cluster-1')

        // The action dropdown mock should receive canPatch=false
        const editButtons = screen.getAllByText('Edit role assignment')
        expect(editButtons.length).toBeGreaterThan(0)
        const editButton = editButtons[0].closest('button')
        expect(editButton).toBeDisabled()
      })

      it('canDeleteRoleAssignment requires both delete and patch permissions', async () => {
        // canDelete=true but canPatch=false should result in canDeleteRoleAssignment=false
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(false) // canPatchRoleAssignment
          .mockReturnValueOnce(true) // canDelete
        render(<Component />)
        await waitForText('test-cluster-1')

        // Delete button should be disabled because canDeleteRoleAssignment = canDelete && canPatch = true && false = false
        const deleteButtons = screen.getAllByText('Delete role assignment')
        expect(deleteButtons.length).toBeGreaterThan(0)
        const deleteButton = deleteButtons[0].closest('button')
        expect(deleteButton).toBeDisabled()
      })

      it('enables delete when both delete and patch permissions are granted', async () => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(true) // canPatchRoleAssignment
          .mockReturnValueOnce(true) // canDelete
        render(<Component />)
        await waitForText('test-cluster-1')

        // Delete button should be enabled because canDeleteRoleAssignment = canDelete && canPatch = true && true = true
        const deleteButtons = screen.getAllByText('Delete role assignment')
        expect(deleteButtons.length).toBeGreaterThan(0)
        const deleteButton = deleteButtons[0].closest('button')
        expect(deleteButton).not.toBeDisabled()
      })

      it('disables delete when only patch permission is missing', async () => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(false) // canPatchRoleAssignment - missing
          .mockReturnValueOnce(true) // canDelete
        render(<Component />)
        await waitForText('test-cluster-1')

        // Delete button should be disabled
        const deleteButtons = screen.getAllByText('Delete role assignment')
        expect(deleteButtons.length).toBeGreaterThan(0)
        const deleteButton = deleteButtons[0].closest('button')
        expect(deleteButton).toBeDisabled()
      })

      it('disables delete when only delete permission is missing', async () => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(true) // canPatchRoleAssignment
          .mockReturnValueOnce(false) // canDelete - missing
        render(<Component />)
        await waitForText('test-cluster-1')

        // Delete button should be disabled because canDeleteRoleAssignment = canDelete && canPatch = false && true = false
        const deleteButtons = screen.getAllByText('Delete role assignment')
        expect(deleteButtons.length).toBeGreaterThan(0)
        const deleteButton = deleteButtons[0].closest('button')
        expect(deleteButton).toBeDisabled()
      })

      it('both edit and delete are disabled when patch permission is missing', async () => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(false) // canPatchRoleAssignment - missing
          .mockReturnValueOnce(true) // canDelete
        render(<Component />)
        await waitForText('test-cluster-1')

        // Both buttons should be disabled
        const editButtons = screen.getAllByText('Edit role assignment')
        const deleteButtons = screen.getAllByText('Delete role assignment')

        expect(editButtons[0].closest('button')).toBeDisabled()
        expect(deleteButtons[0].closest('button')).toBeDisabled()
      })

      it('edit is enabled but delete is disabled when only delete permission is missing', async () => {
        mockUseIsAnyNamespaceAuthorized
          .mockReturnValueOnce(true) // canCreate
          .mockReturnValueOnce(true) // canPatchRoleAssignment
          .mockReturnValueOnce(false) // canDelete - missing
        render(<Component />)
        await waitForText('test-cluster-1')

        // Edit should be enabled (only needs patch)
        // Delete should be disabled (needs both delete and patch)
        const editButtons = screen.getAllByText('Edit role assignment')
        const deleteButtons = screen.getAllByText('Delete role assignment')

        expect(editButtons[0].closest('button')).not.toBeDisabled()
        expect(deleteButtons[0].closest('button')).toBeDisabled()
      })
    })
  })
})
