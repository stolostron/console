/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupRoleAssignments } from './GroupRoleAssignments'
import { render, screen } from '@testing-library/react'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'

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
            {roleAssignment.kind}: {roleAssignment.name}
          </div>
          <div id={`assignment-role-${index}`}>{roleAssignment.clusterRole}</div>
          <div id={`assignment-clusters-${index}`}>{roleAssignment.clusterSets.join(', ')}</div>
          <div id={`assignment-namespaces-${index}`}>{roleAssignment.targetNamespaces?.join(', ') ?? ''}</div>
        </div>
      ))}
    </div>
  ),
}))

function Component({ groupId = 'developers' }: { groupId?: string } = {}) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/groups/${groupId}/role-assignments`]}>
        <Routes>
          <Route path="/groups/:id/role-assignments" element={<GroupRoleAssignments />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('renders GroupRoleAssignments component with no group found', () => {
    render(<Component groupId="non-existent-group" />)
    expect(screen.getByText('Back to groups')).toBeInTheDocument()
  })

  it('renders GroupRoleAssignments component with developers group found', () => {
    render(<Component groupId="developers" />)

    // Verify loading state and metadata
    expect(screen.getByText(/loaded/i)).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()

    // Verify the group has role assignments
    screen.logTestingPlaygroundURL()
    expect(screen.getAllByText(/Group: developers/i)).toHaveLength(3) // Subject appears 3 times (3 role assignments)
    expect(screen.getByText(/kubevirt\.io:edit/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getByText(/network-admin/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getByText(/storage-admin/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getAllByText(/development-cluster/i)).toHaveLength(3) // ClusterSet appears in all assignments
    expect(screen.getAllByText(/kubevirt-dev/i)).toHaveLength(3) // Target namespace appears 3 times
    expect(screen.getAllByText(/vm-dev/i)).toHaveLength(3) // Target namespace appears 3 times
    expect(screen.getAllByText(/storage-dev/i)).toHaveLength(3) // Target namespace appears 3 times
    expect(screen.getAllByText(/networking-dev/i)).toHaveLength(3) // Target namespace appears 3 times
  })
})
