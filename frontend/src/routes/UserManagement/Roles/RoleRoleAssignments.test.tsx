/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { RoleRoleAssignments } from './RoleRoleAssignments'

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ roleAssignments, isLoading, hiddenColumns }: any) => (
    <div id="role-assignments">
      <div id="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div id="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
      <div id="assignments-count">{roleAssignments?.length || 0}</div>
      {roleAssignments?.map((assignment: any, index: number) => (
        <div key={index} id={`assignment-${index}`}>
          <div id={`assignment-name-${index}`}>{assignment.metadata?.name}</div>
          <div id={`assignment-roles-${index}`}>{assignment.spec?.roles?.join(', ') || 'No roles'}</div>
          <div id={`assignment-clusters-${index}`}>
            {assignment.spec?.clusters?.map((cluster: any) => cluster.name).join(', ') || 'No clusters'}
          </div>
          <div id={`assignment-namespaces-${index}`}>
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
    expect(screen.getByText(/user not found/i)).toBeInTheDocument()
  })

  it('renders RoleRoleAssignments component with user found', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state and metadata
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
    expect(screen.getByText(/7/)).toBeInTheDocument()

    // Verify unique role assignment names (most specific identifiers)
    expect(screen.getByText(/alice-admin-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/alice-kubevirt-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/alice-mixed-workloads-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/alice-monitoring-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/alice-multi-cluster-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/alice-network-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/alice-storage-assignment/i)).toBeInTheDocument()

    // Verify unique roles
    expect(screen.getByText(/cluster-admin/i)).toBeInTheDocument()
    expect(screen.getByText(/kubevirt:admin/i)).toBeInTheDocument()
    expect(screen.getByText(/monitoring:viewer/i)).toBeInTheDocument()
    expect(screen.getByText(/network:operator/i)).toBeInTheDocument()
    expect(screen.getByText(/storage:admin/i)).toBeInTheDocument()

    // Verify unique namespace combinations (more specific patterns)
    expect(screen.getByText(/kubevirt.*vm-workloads/i)).toBeInTheDocument()
    expect(screen.getByText(/ceph.*rook-system.*persistent-volumes/i)).toBeInTheDocument()
  })

  it('renders with different user and shows their role assignments', () => {
    render(<Component userId="mock-user-bob-levy" />)

    // Verify loading state and metadata
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
    expect(screen.getByText(/1/)).toBeInTheDocument()

    // Bob should have different role assignments than Alice (using unique identifiers)
    expect(screen.getByText(/bob-edit-assignment/i)).toBeInTheDocument()
    expect(screen.getByText(/^edit$/i)).toBeInTheDocument()
    expect(screen.getByText(/^development-cluster$/i)).toBeInTheDocument()
  })

  it('passes correct hidden columns to RoleAssignments component', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify hidden columns prop is passed correctly (subject column should be hidden)
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state is rendered (can be "Loading" or "Loaded" depending on timing)
    expect(screen.getByText(/loading/i)).toBeInTheDocument()
  })
})
