/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UserRoleAssignments } from './UserRoleAssignments'
import { render, screen } from '@testing-library/react'

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ multiclusterRoleAssignments, isLoading, hiddenColumns }: any) => {
    // Simulate the flattening that the real component does
    const flattened =
      multiclusterRoleAssignments?.flatMap((mcra: any) =>
        mcra.spec.roleAssignments.map((ra: any, index: number) => ({
          multiclusterRoleAssignmentUid: mcra.metadata.uid,
          subjectKind: mcra.spec.subject.kind,
          subjectName: mcra.spec.subject.name,
          clusterRole: ra.clusterRole,
          clusterSets: ra.clusterSets,
          targetNamespaces: ra.targetNamespaces,
          roleAssignmentIndex: index,
        }))
      ) || []

    return (
      <div id="role-assignments">
        <div id="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
        <div id="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
        <div id="assignments-count">{flattened.length}</div>
        {flattened.map((assignment: any, index: number) => (
          <div key={index} id={`assignment-${index}`}>
            <div id={`assignment-subject-${index}`}>
              {assignment.subjectKind}: {assignment.subjectName}
            </div>
            <div id={`assignment-role-${index}`}>{assignment.clusterRole}</div>
            <div id={`assignment-clusters-${index}`}>{assignment.clusterSets.join(', ')}</div>
            <div id={`assignment-namespaces-${index}`}>{assignment.targetNamespaces.join(', ')}</div>
          </div>
        ))}
      </div>
    )
  },
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
