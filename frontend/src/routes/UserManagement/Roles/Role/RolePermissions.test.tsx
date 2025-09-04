/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC } from '../../../../lib/nock-util'
import { RolePermissions } from './RolePermissions'
import { ClusterRole } from '../../../../resources/rbac'

// Mock useCurrentRole hook
jest.mock('../RolesPage', () => ({
  useCurrentRole: jest.fn(),
}))

import { useCurrentRole } from '../RolesPage'
const mockUseCurrentRole = useCurrentRole as jest.MockedFunction<typeof useCurrentRole>

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
  beforeEach(() => {
    nockIgnoreRBAC()
  })

  it('renders role permissions page with role name in header', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithPermissions)
    render(<Component roleId="test-role-with-permissions" />)

    expect(screen.getByText('test-role-with-permissions')).toBeInTheDocument()
    expect(screen.getByText('Actions')).toBeInTheDocument()
    expect(screen.getByText('API groups')).toBeInTheDocument()
    expect(screen.getByText('Resources')).toBeInTheDocument()
  })

  it('renders default header when no role is found', () => {
    mockUseCurrentRole.mockReturnValue(undefined)
    render(<Component roleId="non-existent-role" />)

    expect(screen.getByText('Role Permissions')).toBeInTheDocument()
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

  it('displays empty state when role has no permissions', () => {
    mockUseCurrentRole.mockReturnValue(mockRoleWithoutPermissions)
    render(<Component roleId="test-role-no-permissions" />)

    expect(screen.getByText('test-role-no-permissions')).toBeInTheDocument()
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
})
