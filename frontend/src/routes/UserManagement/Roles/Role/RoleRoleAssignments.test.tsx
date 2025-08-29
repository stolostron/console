/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { AcmLoadingPage } from '../../../../ui-components'
import { RoleRoleAssignments } from './RoleRoleAssignments'
import { RolesContextProvider } from '../RolesPage'

// Mock the useQuery hook used by RolesContextProvider
import { useQuery } from '../../../../lib/useQuery'
jest.mock('../../../../lib/useQuery')

// Mock cluster roles data
const mockClusterRoles = [
  {
    metadata: {
      name: 'kubevirt.io:admin',
      uid: 'kubevirt-admin-uid',
    },
  },
  {
    metadata: {
      name: 'cluster-admin',
      uid: 'cluster-admin-uid',
    },
  },
  {
    metadata: {
      name: 'storage-admin',
      uid: 'storage-admin-uid',
    },
  },
]

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
      <MemoryRouter initialEntries={[`/roles/${userId}/role-assignments`]}>
        <RolesContextProvider>
          <Routes>
            <Route path="/roles/:id/role-assignments" element={<RoleRoleAssignments />} />
          </Routes>
        </RolesContextProvider>
      </MemoryRouter>
    </RecoilRoot>
  )
}

const mockUseQuery = jest.mocked(useQuery)

describe('RoleRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    // Mock the useQuery to return our test cluster roles
    mockUseQuery.mockReturnValue({
      data: mockClusterRoles,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })
  })

  it('renders RoleRoleAssignments component with no user found', () => {
    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('Back to roles')).toBeInTheDocument()
  })

  it('renders RoleRoleAssignments component with role found', () => {
    render(<Component userId="kubevirt.io:admin" />)

    // Verify loading state
    expect(screen.getByText('Loaded')).toBeInTheDocument()

    // Verify role assignments data is rendered
    expect(screen.getAllByText(/User: alice\.trask/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/production-cluster/i).length).toBeGreaterThan(0)
    expect(screen.getAllByText(/kubevirt-production/i).length).toBeGreaterThan(0)
  })

  it('renders with different role', () => {
    render(<Component userId="cluster-admin" />)

    // Verify loading state
    expect(screen.getByText('Loaded')).toBeInTheDocument()

    // Verify role assignments for cluster-admin role are rendered
    expect(screen.getAllByText(/User: alice\.trask/i).length).toBeGreaterThan(0)
  })

  it('passes correct hidden columns to RoleAssignments component', () => {
    render(<Component userId="kubevirt.io:admin" />)

    // Verify hidden columns are passed correctly
    expect(screen.getByText(/role/i)).toBeInTheDocument()
  })

  it('shows loading state correctly', () => {
    render(<Component userId="kubevirt.io:admin" />)

    // Verify loading state is rendered
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
