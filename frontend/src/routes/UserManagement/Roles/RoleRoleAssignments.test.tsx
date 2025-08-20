/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { RoleRoleAssignments } from './RoleRoleAssignments'

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ roleAssignments, isLoading, hiddenColumns }: any) => (
    <div data-testid="role-assignments">
      <div data-testid="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div data-testid="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
      <div data-testid="assignments-count">{roleAssignments?.length || 0}</div>
      {roleAssignments?.map((assignment: any, index: number) => (
        <div key={index} data-testid={`assignment-${index}`}>
          <div data-testid={`assignment-name-${index}`}>{assignment.metadata?.name}</div>
          <div data-testid={`assignment-roles-${index}`}>{assignment.spec?.roles?.join(', ') || 'No roles'}</div>
          <div data-testid={`assignment-clusters-${index}`}>
            {assignment.spec?.clusters?.map((cluster: any) => cluster.name).join(', ') || 'No clusters'}
          </div>
          <div data-testid={`assignment-namespaces-${index}`}>
            {assignment.spec?.clusters?.flatMap((cluster: any) => cluster.namespaces || []).join(', ') ||
              'No namespaces'}
          </div>
        </div>
      ))}
    </div>
  ),
}))

function Component({ userId = 'mock-user-alice-trask' }: { userId?: string } = {}) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/roles/${userId}/role-assignments`]}>
        <Routes>
          <Route path="/roles/:id/role-assignments" element={<RoleRoleAssignments />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('RoleRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('renders RoleRoleAssignments component with no user found', () => {
    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('User not found')).toBeInTheDocument()
  })

  it('renders RoleRoleAssignments component with user found', () => {
    const { container } = render(<Component userId="mock-user-alice-trask" />)

    // Verify the component renders successfully with real data
    expect(container.firstChild).toBeTruthy()

    // Verify the HTML contains the expected role assignments data
    expect(container.innerHTML).toContain('data-testid="role-assignments"')
    expect(container.innerHTML).toContain('data-testid="assignments-count">7</div>')
    expect(container.innerHTML).toContain('data-testid="hidden-columns">subject</div>')

    // Verify real role assignment data is present (from role-assignments.json)
    expect(container.innerHTML).toContain('alice-admin-assignment')
    expect(container.innerHTML).toContain('cluster-admin')
    expect(container.innerHTML).toContain('production-cluster')
    expect(container.innerHTML).toContain('alice-kubevirt-assignment')
    expect(container.innerHTML).toContain('kubevirt:admin')
    expect(container.innerHTML).toContain('development-cluster')

    // Verify namespaces are rendered
    expect(container.innerHTML).toContain('default, kube-system')
    expect(container.innerHTML).toContain('kubevirt, vm-workloads')
  })

  it('renders with different user and shows their role assignments', () => {
    const { container } = render(<Component userId="mock-user-bob-levy" />)

    // Verify the component renders successfully
    expect(container.firstChild).toBeTruthy()

    // Verify the HTML contains role assignments structure
    expect(container.innerHTML).toContain('data-testid="role-assignments"')
    expect(container.innerHTML).toContain('data-testid="assignments-count">1</div>')

    // Bob should have different role assignments than Alice (based on actual data)
    expect(container.innerHTML).toContain('bob-edit-assignment')
    expect(container.innerHTML).toContain('edit')
    expect(container.innerHTML).toContain('development-cluster')
  })

  it('passes correct hidden columns to RoleAssignments component', () => {
    const { container } = render(<Component userId="mock-user-alice-trask" />)

    // Verify the component renders successfully
    expect(container.firstChild).toBeTruthy()

    // Verify hidden columns prop is passed correctly (subject column should be hidden)
    expect(container.innerHTML).toContain('data-testid="hidden-columns">subject</div>')
  })

  it('shows loading state correctly', () => {
    const { container } = render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state is rendered (shows "Loading" initially)
    expect(container.innerHTML).toContain('data-testid="loading">Loading</div>')
  })
})
