/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UserRoleAssignments } from './UserRoleAssignments'
import { render, screen } from '@testing-library/react'

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../../RoleAssignment/RoleAssignments', () => ({
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
      <MemoryRouter initialEntries={[`/users/${userId}/role-assignments`]}>
        <Routes>
          <Route path="/users/:id/role-assignments" element={<UserRoleAssignments />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('UserRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('renders UserRoleAssignments component with no user found', () => {
    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('User not found')).toBeInTheDocument()
  })

  it('renders UserRoleAssignments component with user found', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state and metadata
    expect(screen.getByText(/loaded/i)).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
    expect(screen.getByText(/^7$/)).toBeInTheDocument()

    // Verify unique role assignment names
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

    // Verify unique cluster names
    expect(screen.getByText(/^development-cluster$/i)).toBeInTheDocument()
    expect(screen.getByText(/storage-cluster/i)).toBeInTheDocument()

    // Verify unique namespace combinations
    expect(screen.getByText(/kubevirt.*vm-workloads/i)).toBeInTheDocument()
    expect(screen.getByText(/ceph.*rook-system.*persistent-volumes/i)).toBeInTheDocument()
  })
})
