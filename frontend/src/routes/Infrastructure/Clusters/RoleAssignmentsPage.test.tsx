/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import RoleAssignmentsPage from './RoleAssignmentsPage'
import { useRecoilValue } from '../../../shared-recoil'

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
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
  <RecoilRoot>
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
  </RecoilRoot>
)

describe('RoleAssignmentsPage', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    ;(useRecoilValue as jest.Mock).mockClear()
  })

  it('renders ClusterRoleAssignments when fine-grained RBAC is enabled', () => {
    ;(useRecoilValue as jest.Mock).mockReturnValue(true)

    const { container } = render(<Component />)

    expect(mockClusterRoleAssignments).toHaveBeenCalled()
    expect(container).toBeTruthy()
  })

  it('does not render ClusterRoleAssignments when fine-grained RBAC is disabled', () => {
    ;(useRecoilValue as jest.Mock).mockReturnValue(false)

    render(<Component name="test-cluster" namespace="test-cluster" />)

    expect(mockClusterRoleAssignments).not.toHaveBeenCalled()
  })

  it('renders with different cluster parameters', () => {
    ;(useRecoilValue as jest.Mock).mockReturnValue(true)

    const { container } = render(<Component name="prod-cluster" namespace="prod-namespace" />)

    expect(mockClusterRoleAssignments).toHaveBeenCalled()
    expect(container).toBeTruthy()
  })
})
