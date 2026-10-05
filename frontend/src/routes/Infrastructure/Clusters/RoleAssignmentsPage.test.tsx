/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import RoleAssignmentsPage from './RoleAssignmentsPage'
import { useSharedValue } from '../../../shared-atoms'

jest.mock('../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    isFineGrainedRbacEnabledState: 'isFineGrainedRbacEnabledState',
  })),
}))

const mockClusterRoleAssignments = jest.fn()
jest.mock('./ClusterRoleAssignments', () => ({
  ClusterRoleAssignments: () => {
    mockClusterRoleAssignments()
    return <div data-testid="cluster-role-assignments">ClusterRoleAssignments</div>
  },
}))

const Component = ({
  name = 'local-cluster',
  namespace = 'local-cluster',
}: { name?: string; namespace?: string } = {}) => (
  <StateProvider>
    <MemoryRouter
      initialEntries={[`/multicloud/infrastructure/clusters/details/${namespace}/${name}/role-assignments`]}
    >
      <Routes>
        <Route
          path="/multicloud/infrastructure/clusters/details/:namespace/:name/role-assignments"
          element={<RoleAssignmentsPage />}
        />
      </Routes>
    </MemoryRouter>
  </StateProvider>
)

describe('RoleAssignmentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useSharedValue as jest.Mock).mockClear()
  })

  it('renders ClusterRoleAssignments when fine-grained RBAC is enabled', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(true)

    const { container } = render(<Component />)

    expect(mockClusterRoleAssignments).toHaveBeenCalled()
    expect(container).toBeTruthy()
  })

  it('does not render ClusterRoleAssignments when fine-grained RBAC is disabled', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(false)

    render(<Component name="test-cluster" namespace="test-cluster" />)

    expect(mockClusterRoleAssignments).not.toHaveBeenCalled()
  })

  it('renders with different cluster parameters', () => {
    ;(useSharedValue as jest.Mock).mockReturnValue(true)

    const { container } = render(<Component name="prod-cluster" namespace="prod-namespace" />)

    expect(mockClusterRoleAssignments).toHaveBeenCalled()
    expect(container).toBeTruthy()
  })
})
