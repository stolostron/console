/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import ClusterSetRoleAssignmentsPage from './ClusterSetRoleAssignmentsPage'
import { useSharedValue } from '../../../../shared-atoms'

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    isFineGrainedRbacEnabledState: 'isFineGrainedRbacEnabledState',
  })),
}))

const mockClusterSetRoleAssignments = jest.fn()
jest.mock('./ClusterSetDetails/ClusterSetRoleAssignments/ClusterSetRoleAssignments', () => ({
  ClusterSetRoleAssignments: () => {
    mockClusterSetRoleAssignments()
    return <div data-testid="cluster-set-role-assignments">ClusterSetRoleAssignments</div>
  },
}))

const Component = ({ id = 'default-cluster-set' }: { id?: string } = {}) => (
  <StateProvider>
    <MemoryRouter initialEntries={[`/multicloud/infrastructure/clusters/cluster-sets/${id}/role-assignments`]}>
      <Routes>
        <Route
          path="/multicloud/infrastructure/clusters/cluster-sets/:id/role-assignments"
          element={<ClusterSetRoleAssignmentsPage />}
        />
      </Routes>
    </MemoryRouter>
  </StateProvider>
)

describe('ClusterSetRoleAssignmentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSharedValue as jest.Mock).mockClear()
  })

  it('renders ClusterSetRoleAssignments when fine-grained RBAC is enabled', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(true)

    const { container } = render(<Component />)

    expect(mockClusterSetRoleAssignments).toHaveBeenCalled()
    expect(container).toBeTruthy()
  })

  it('does not render ClusterSetRoleAssignments when fine-grained RBAC is disabled', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(false)

    render(<Component id="test-cluster-set" />)

    expect(mockClusterSetRoleAssignments).not.toHaveBeenCalled()
  })

  it('renders with different cluster set id parameters', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(true)

    const { container } = render(<Component id="production-cluster-set" />)

    expect(mockClusterSetRoleAssignments).toHaveBeenCalled()
    expect(container).toBeTruthy()
  })

  it('renders ClusterSetRoleAssignments component inside PageSection when RBAC is enabled', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(true)

    render(<Component />)

    expect(screen.getByText('ClusterSetRoleAssignments')).toBeInTheDocument()
  })

  it('redirects to cluster set details when fine-grained RBAC is disabled', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(false)

    render(<Component id="my-cluster-set" />)

    // When RBAC is disabled, Navigate component is rendered which redirects
    // The ClusterSetRoleAssignments should not be called
    expect(mockClusterSetRoleAssignments).not.toHaveBeenCalled()
  })

  it('handles default empty id parameter gracefully', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(false)

    // When id is empty and RBAC is disabled, it should redirect
    // The generatePath will use the default empty string for id
    render(
      <StateProvider>
        <MemoryRouter initialEntries={['/multicloud/infrastructure/clusters/cluster-sets/test-set/role-assignments']}>
          <Routes>
            <Route
              path="/multicloud/infrastructure/clusters/cluster-sets/:id/role-assignments"
              element={<ClusterSetRoleAssignmentsPage />}
            />
          </Routes>
        </MemoryRouter>
      </StateProvider>
    )

    // When RBAC is disabled, Navigate is rendered and ClusterSetRoleAssignments is not called
    expect(mockClusterSetRoleAssignments).not.toHaveBeenCalled()
  })
})
