/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { ClusterSetRoleAssignments } from './ClusterSetRoleAssignments'

const mockUseFindRoleAssignments = jest.fn()
jest.mock('../../../../../../resources/clients/multicluster-role-assignment-client', () => ({
  useFindRoleAssignments: (query: any) => mockUseFindRoleAssignments(query),
}))

const mockRoleAssignments = jest.fn()
jest.mock('../../../../../UserManagement/RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: (props: any) => {
    mockRoleAssignments(props)
    return <div data-testid="role-assignments-mock">RoleAssignments</div>
  },
}))

const Component = ({ clusterSetName = 'default-cluster-set' }: { clusterSetName?: string } = {}) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/cluster-sets/${clusterSetName}/role-assignments`]}>
      <Routes>
        <Route path="/cluster-sets/:id/role-assignments" element={<ClusterSetRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('ClusterSetRoleAssignments', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFindRoleAssignments.mockReturnValue([])
  })

  it('renders without errors', () => {
    const { container } = render(<Component />)
    expect(container).toBeTruthy()
  })

  it('calls useFindRoleAssignments with cluster set name from URL', () => {
    render(<Component clusterSetName="production-cluster-set" />)

    expect(mockUseFindRoleAssignments).toHaveBeenCalledWith({
      clusterSetNames: ['production-cluster-set'],
    })
  })

  it('passes correct props to RoleAssignments component', () => {
    const mockAssignments = [
      {
        name: 'test-assignment',
        subject: { kind: 'User', name: 'alice' },
        clusterRole: 'admin',
        clusterSetNames: ['default-cluster-set'],
        clusterNames: [],
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
        preselected: { clusterSetNames: ['default-cluster-set'], context: 'clusterSets' },
      })
    )
  })

  it('passes empty clusterSetNames array when no id param is provided', () => {
    render(
      <RecoilRoot>
        <MemoryRouter initialEntries={['/cluster-sets/role-assignments']}>
          <Routes>
            <Route path="/cluster-sets/role-assignments" element={<ClusterSetRoleAssignments />} />
          </Routes>
        </MemoryRouter>
      </RecoilRoot>
    )

    expect(mockUseFindRoleAssignments).toHaveBeenCalledWith({
      clusterSetNames: [],
    })
  })

  it('passes preselected with context "clusterSets"', () => {
    mockUseFindRoleAssignments.mockReturnValue([])

    render(<Component clusterSetName="my-cluster-set" />)

    expect(mockRoleAssignments).toHaveBeenCalledWith(
      expect.objectContaining({
        preselected: {
          clusterSetNames: ['my-cluster-set'],
          context: 'clusterSets',
        },
      })
    )
  })

  it('handles special characters in cluster set name', () => {
    render(<Component clusterSetName="cluster-set-with-dashes" />)

    expect(mockUseFindRoleAssignments).toHaveBeenCalledWith({
      clusterSetNames: ['cluster-set-with-dashes'],
    })
  })
})
