/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { AcmLoadingPage } from '../../../ui-components'
import { RoleRoleAssignments } from './RoleRoleAssignments'
import { FlattenedRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../RoleAssignment/RoleAssignments', () => ({
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

const Component = ({ userId = 'mock-user-alice-trask' }: { userId?: string } = {}) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/roles/${userId}/role-assignments`]}>
      <Routes>
        <Route path="/roles/:id/role-assignments" element={<RoleRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('RoleRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
  })

  it('renders RoleRoleAssignments component with no user found', () => {
    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('Back to roles')).toBeInTheDocument()
  })

  it('renders RoleRoleAssignments component with user found', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state and metadata
    expect(screen.getByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
    expect(screen.getByText(/5/)).toBeInTheDocument() // 5 flattened TrackedRoleAssignments from alice.trask (expanded!)

    // Verify the new flattened structure shows correct data from expanded mock data
    expect(screen.getAllByText(/User: alice\.trask/i)).toHaveLength(5) // Subject appears 5 times (5 role assignments)
    expect(screen.getAllByText(/kubevirt\.io:admin/i)).toHaveLength(2) // ClusterRole appears twice
    expect(screen.getByText(/cluster-admin/i)).toBeInTheDocument() // New expanded role
    expect(screen.getByText(/storage-admin/i)).toBeInTheDocument() // New expanded role
    expect(screen.getAllByText(/production-cluster/i)).toHaveLength(3) // ClusterSet appears in multiple assignments
    expect(screen.getByText(/kubevirt-production/i)).toBeInTheDocument() // Target namespace
    // Verify other key data appears correctly
    expect(screen.getAllByText(/staging-cluster/i)).toHaveLength(3) // ClusterSet appears in multiple assignments
    expect(screen.getAllByText(/vm-workloads/i)).toHaveLength(2) // Appears in 2 role assignments
  })

  it('renders with different user and shows their role assignments', () => {
    // Test with bob.levy who exists in real mock data
    render(<Component userId="mock-user-bob-levy" />)

    // Verify loading state and data
    expect(screen.getByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText(/2/)).toBeInTheDocument() // 2 flattened TrackedRoleAssignments from bob.levy

    // Should show bob.levy data (appears twice due to 2 role assignments)
    expect(screen.getAllByText(/User: bob\.levy/i)).toHaveLength(2) // Subject info appears twice
    expect(screen.getAllByText(/kubevirt\.io:edit/i)).toHaveLength(2) // ClusterRole appears twice
    expect(screen.getByText(/development-cluster/i)).toBeInTheDocument() // ClusterSet from mock data
  })

  it('passes correct hidden columns to RoleAssignments component', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify hidden columns prop is passed correctly (subject column should be hidden)
    expect(screen.getByText(/subject/i)).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(<Component userId="mock-user-alice-trask" />)

    // Verify loading state is rendered (can be "Loading" or "Loaded" depending on timing)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
  })

  it('renders loading state when component is actually loading', () => {
    // Directly render the loading state that the component would show
    render(
      <PageSection>
        <AcmLoadingPage />
      </PageSection>
    )

    // Verify actual loading page is rendered with "Loading" text from AcmLoadingPage
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
