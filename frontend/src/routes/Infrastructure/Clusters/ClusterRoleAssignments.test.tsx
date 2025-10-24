/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { ClusterRoleAssignments } from './ClusterRoleAssignments'

const mockUseFindRoleAssignments = jest.fn()
jest.mock('../../../resources/clients/multicluster-role-assignment-client', () => ({
  useFindRoleAssignments: (query: any) => mockUseFindRoleAssignments(query),
}))

const mockRoleAssignments = jest.fn()
jest.mock('../../UserManagement/RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: (props: any) => {
    mockRoleAssignments(props)
    return <div data-testid="role-assignments-mock">RoleAssignments</div>
  },
}))

const Component = ({ clusterName = 'local-cluster' }: { clusterName?: string } = {}) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/clusters/details/${clusterName}/${clusterName}/role-assignments`]}>
      <Routes>
        <Route path="/clusters/details/:namespace/:name/role-assignments" element={<ClusterRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('ClusterRoleAssignments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFindRoleAssignments.mockReturnValue([])
  })

  it('renders without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeTruthy()
  })

  it('calls useFindRoleAssignments with cluster name from URL', () => {
    render(<Component clusterName="production-cluster" />)

    expect(mockUseFindRoleAssignments).toHaveBeenCalledWith({
      clusterNames: ['production-cluster'],
    })
  })

  it('passes correct props to RoleAssignments component', () => {
    const mockAssignments = [
      {
        name: 'test-assignment',
        subject: { kind: 'User', name: 'alice' },
        clusterRole: 'admin',
        clusterSelection: { type: 'clusterNames', clusterNames: ['local-cluster'] },
        targetNamespaces: ['default'],
        relatedMulticlusterRoleAssignment: { metadata: { name: 'test', namespace: 'default' } },
      },
    ]
    mockUseFindRoleAssignments.mockReturnValue(mockAssignments)

    render(<Component />)

    expect(mockRoleAssignments).toHaveBeenCalledWith(
      expect.objectContaining({
        roleAssignments: mockAssignments,
        isLoading: false,
        hiddenFilters: ['clusters'],
        preselected: { clusterNames: ['local-cluster'] },
      })
    )
  })
})
