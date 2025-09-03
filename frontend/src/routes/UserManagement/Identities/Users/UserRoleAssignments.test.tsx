/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'
import { UserRoleAssignments } from './UserRoleAssignments'

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ roleAssignments, isLoading, hiddenColumns }: any) => (
    <div id="role-assignments">
      <div id="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div id="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
      <div id="assignments-count">{roleAssignments.length}</div>
      {roleAssignments.map((roleAssignment: FlattenedRoleAssignment, index: number) => (
        <div key={index} id={`assignment-${index}`}>
          <div id={`assignment-subject-${index}`}>
            {roleAssignment.subject.kind}: {roleAssignment.subject.name}
          </div>
          <div id={`assignment-role-${index}`}>{roleAssignment.clusterRole}</div>
          <div id={`assignment-clusters-${index}`}>{roleAssignment.clusterSets.join(', ')}</div>
          <div id={`assignment-namespaces-${index}`}>{roleAssignment.targetNamespaces?.join(', ') ?? ''}</div>
        </div>
      ))}
    </div>
  ),
}))

const Component = ({ userId = 'mock-user-alice-trask' }: { userId?: string } = {}) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/users/${userId}/role-assignments`]}>
      <Routes>
        <Route path="/users/:id/role-assignments" element={<UserRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('UserRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('renders UserRoleAssignments component with no user found', () => {
    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('Back to users')).toBeInTheDocument()
  })

  it('renders UserRoleAssignments component with user found', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state and metadata
    expect(screen.getByText(/loaded/i)).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
    expect(screen.getByText(/^5$/)).toBeInTheDocument() // 5 flattened TrackedRoleAssignments from alice.trask (expanded mock data!)

    // Verify the new flattened structure shows correct data from expanded mock data
    expect(screen.getAllByText(/User: alice\.trask/i)).toHaveLength(5) // Subject appears 5 times (5 role assignments)
    expect(screen.getAllByText(/kubevirt\.io:admin/i)).toHaveLength(2) // ClusterRole appears twice for kubevirt admin
    expect(screen.getByText(/cluster-admin/i)).toBeInTheDocument() // New cluster-admin role
    expect(screen.getByText(/storage-admin/i)).toBeInTheDocument() // New storage-admin role
    expect(screen.getAllByText(/production-cluster/i)).toHaveLength(3) // ClusterSet appears in multiple assignments
    expect(screen.getByText(/kubevirt-production/i)).toBeInTheDocument() // Target namespace
    expect(screen.getByText(/vm-storage/i)).toBeInTheDocument() // New expanded namespace
    expect(screen.getByText(/openshift-console/i)).toBeInTheDocument() // Console namespace
    // Migration to new structure is successful with expanded test data!
  })
})
