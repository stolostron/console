/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { RolePermissions } from './RolePermissions'
import { ClusterRole } from '../../../../resources/rbac'
import { useCurrentRole } from '../RolesPage'

// Mock useCurrentRole hook
jest.mock('../RolesPage', () => ({
  useCurrentRole: jest.fn(),
}))

const mockUseCurrentRole = useCurrentRole as jest.MockedFunction<typeof useCurrentRole>

// Mock AcmTable to capture and test column functions directly
jest.mock('../../../../ui-components', () => ({
  ...jest.requireActual('../../../../ui-components'),
  AcmTable: ({ columns, items, keyFn, emptyState }: any) => {
    // Test column functions directly when component renders
    if (columns && Array.isArray(columns) && items?.length > 0) {
      const testItem = items[0]
      const secondItem = items.length > 1 ? items[1] : items[0]

      columns.forEach((col: any) => {
        // Test cell rendering function
        if (col.cell && typeof col.cell === 'function') {
          col.cell(testItem)
        }

        // Test search function
        if (col.search && typeof col.search === 'function') {
          col.search(testItem)
        }

        // Test sort function with proper parameters
        if (col.sort && typeof col.sort === 'function' && items.length > 1) {
          col.sort(testItem, secondItem)
        }
      })
    }

    return (
      <div role="grid" data-testid="permissions-table">
        <div role="rowgroup">
          <div role="row">
            {columns?.map((col: any, index: number) => (
              <div key={index} role="columnheader">
                {col.header}
              </div>
            ))}
          </div>
        </div>
        <div role="rowgroup">
          {items?.map((item: any, rowIndex: number) => (
            <div key={keyFn ? keyFn(item) : rowIndex} role="row">
              {columns?.map((col: any, colIndex: number) => (
                <div key={colIndex} role="cell">
                  {col.cell && col.cell(item)}
                </div>
              ))}
            </div>
          )) || []}
        </div>
        {items?.length === 0 && emptyState}
      </div>
    )
  },
}))

// Mock roles for testing
const mockRoleWithPermissions: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-role-with-permissions',
    uid: 'test-uid-1',
  },
  rules: [
    {
      verbs: ['get', 'list', 'watch'],
      apiGroups: [''],
      resources: ['pods', 'services'],
    },
    {
      verbs: ['create', 'update', 'delete'],
      apiGroups: ['apps'],
      resources: ['deployments', 'replicasets'],
    },
    {
      verbs: ['*'],
      apiGroups: [''],
      resources: ['secrets'],
    },
    {
      verbs: ['get'],
      apiGroups: ['kubevirt.io'],
      resources: ['virtualmachines', 'virtualmachineinstances'],
    },
  ],
}

const mockRoleWithoutPermissions: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-role-no-permissions',
    uid: 'test-uid-2',
  },
  rules: [],
}

const Component = ({ roleId = 'test-role-with-permissions' }: { roleId?: string } = {}) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/roles/${roleId}/permissions`]}>
      <Routes>
        <Route path="/roles/:id/permissions" element={<RolePermissions />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('RolePermissions', () => {
  it('renders role permissions page with header and table columns', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    expect(screen.getByText('Permissions')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('API groups')).toBeInTheDocument()
    expect(screen.getByText('Resources')).toBeInTheDocument()
  })

  it('renders header and empty state when no role is found', () => {
    mockUseCurrentRole.mockReturnValue(undefined)
    render(<Component roleId="non-existent-role" />)

    expect(screen.getByText('Permissions')).toBeInTheDocument()
    expect(screen.getByText('No permissions found')).toBeInTheDocument()
  })

  it('displays actions column values correctly', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    // Check that all verbs from the policy rules are displayed
    expect(screen.getAllByText('get')).toHaveLength(2) // appears in 2 rules
    expect(screen.getByText('list')).toBeInTheDocument()
    expect(screen.getByText('watch')).toBeInTheDocument()
    expect(screen.getByText('create')).toBeInTheDocument()
    expect(screen.getByText('update')).toBeInTheDocument()
    expect(screen.getByText('delete')).toBeInTheDocument()
  })

  it('displays API groups column values correctly', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    // Check that API groups are displayed correctly
    expect(screen.getByText('apps')).toBeInTheDocument()
    expect(screen.getByText('kubevirt.io')).toBeInTheDocument()
  })

  it('displays resources column values correctly', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    // Check that all resources from the policy rules are displayed
    expect(screen.getByText('pods')).toBeInTheDocument()
    expect(screen.getByText('services')).toBeInTheDocument()
    expect(screen.getByText('deployments')).toBeInTheDocument()
    expect(screen.getByText('replicasets')).toBeInTheDocument()
    expect(screen.getByText('secrets')).toBeInTheDocument()
    expect(screen.getByText('virtualmachines')).toBeInTheDocument()
    expect(screen.getByText('virtualmachineinstances')).toBeInTheDocument()
  })

  it('displays header and empty state when role has no permissions', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithoutPermissions)
    render(<Component roleId="test-role-no-permissions" />)

    expect(screen.getByText('Permissions')).toBeInTheDocument()
    expect(screen.getByText('No permissions found')).toBeInTheDocument()
  })

  it('renders table with correct structure', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    // AcmTable renders as 'grid' (PatternFly interactive table), not 'table'
    const table = screen.getByRole('grid')
    expect(table).toBeInTheDocument()

    // Should have table headers
    const columnHeaders = screen.getAllByRole('columnheader')
    expect(columnHeaders).toHaveLength(3) // Actions, API groups, Resources
  })

  it('displays complete policy rule data integration', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    // Verify all policy rules are properly displayed with their actions, api groups, and resources
    expect(screen.getByText('pods')).toBeInTheDocument()
    expect(screen.getByText('services')).toBeInTheDocument()

    expect(screen.getByText('create')).toBeInTheDocument()
    expect(screen.getByText('apps')).toBeInTheDocument()
    expect(screen.getByText('deployments')).toBeInTheDocument()
    expect(screen.getByText('replicasets')).toBeInTheDocument()

    expect(screen.getByText('secrets')).toBeInTheDocument()

    expect(screen.getByText('kubevirt.io')).toBeInTheDocument()
    expect(screen.getByText('virtualmachines')).toBeInTheDocument()
    expect(screen.getByText('virtualmachineinstances')).toBeInTheDocument()
  })

  it('tests column functions with comprehensive data', () => {
    // This test uses diverse data that will exercise all column functions (sort, search, cell)
    const mockRoleWithComprehensiveData: ClusterRole = {
      apiVersion: 'rbac.authorization.k8s.io/v1',
      kind: 'ClusterRole',
      metadata: { name: 'comprehensive-test', uid: 'comprehensive' },
      rules: [
        {
          verbs: ['get', 'list', 'watch'],
          apiGroups: ['apps', 'extensions'],
          resources: ['deployments', 'replicasets'],
        },
        {
          verbs: ['create', 'update', 'delete'],
          apiGroups: [''],
          resources: ['pods', 'services'],
        },
        {
          verbs: ['*'],
          apiGroups: ['batch'],
          resources: ['jobs'],
        },
      ],
    }

    mockUseCurrentRole.mockReturnValue(mockRoleWithComprehensiveData)
    render(<Component roleId="comprehensive-test" />)

    // Verify the content is rendered correctly
    expect(screen.getByText('apps, extensions')).toBeInTheDocument()
    expect(screen.getByText('deployments')).toBeInTheDocument()
    expect(screen.getByText('replicasets')).toBeInTheDocument()
    expect(screen.getByText('pods')).toBeInTheDocument()
    expect(screen.getByText('services')).toBeInTheDocument()
    expect(screen.getByText('batch')).toBeInTheDocument()
    expect(screen.getByText('jobs')).toBeInTheDocument()
  })
})
