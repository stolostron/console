/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { MulticlusterRoleAssignmentNamespace } from '../../../../resources'
import { FlattenedRoleAssignment } from '../../../../resources/clients/model/flattened-role-assignment'
import { User } from '../../../../resources/rbac'
import { useSharedValue } from '../../../../shared-atoms'
import { useUserDetailsContext } from './UserPage'
import { UserRoleAssignments } from './UserRoleAssignments'

jest.mock('./UserPage', () => ({
  useUserDetailsContext: jest.fn(),
}))

const mockUseUserDetailsContext = useUserDetailsContext as jest.Mock

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'mock-user-alice-trask',
    uid: 'mock-user-alice-trask',
    creationTimestamp: '2023-01-01T00:00:00Z',
  },
}

const mockMulticlusterRoleAssignments = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'alice-trask-role-assignment',
      namespace: MulticlusterRoleAssignmentNamespace,
      uid: '1',
    },
    spec: {
      subject: { kind: 'User', name: 'mock-user-alice-trask' },
      roleAssignments: [
        {
          name: 'kubevirt-edit-role',
          clusterRole: 'kubevirt.io:edit',
          clusterSelection: {
            type: 'placements' as const,
            placements: [{ name: 'placement-development-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
          },
          targetNamespaces: ['kubevirt-dev', 'vm-dev'],
        },
        {
          name: 'network-admin-role',
          clusterRole: 'network-admin',
          clusterSelection: {
            type: 'placements' as const,
            placements: [{ name: 'placement-development-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
          },
          targetNamespaces: ['networking-dev'],
        },
      ],
    },
    status: {
      roleAssignments: [
        { name: 'kubevirt-edit-role', status: 'Active' },
        { name: 'network-admin-role', status: 'Active' },
      ],
    },
  },
]

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'button.backToUsers': 'Back to users',
        'button.backToGroups': 'Back to groups',
        'button.backToRoles': 'Back to roles',
      }
      return translations[key] || key
    },
  }),
}))

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    multiclusterRoleAssignmentState: 'multiclusterRoleAssignmentState',
    placementsState: 'placementsState',
    placementDecisionsState: 'placementDecisionsState',
  })),
}))

jest.mock('../../../../resources/clients/placement-client', () => ({
  useFindPlacements: jest.fn(() => []),
  useGetPlacementClusters: jest.fn(() => [
    {
      placement: {
        apiVersion: 'cluster.open-cluster-management.io/v1beta1',
        kind: 'Placement',
        metadata: { name: 'placement-development-cluster', namespace: 'open-cluster-management-global-set' },
        spec: {},
      },
      clusters: ['development-cluster'],
      clusterSetNames: ['development-cluster'],
    },
  ]),
  createForClusterSets: jest.fn(),
  createForClusters: jest.fn(),
}))

jest.mock('../../../../resources/clients/placement-decision-client', () => ({
  useFindPlacementDecisions: jest.fn(() => []),
  useGetClustersFromPlacementDecision: jest.fn(() => []),
}))

jest.mock('../../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ roleAssignments, isLoading, hiddenColumns }: any) => (
    <div id="role-assignments">
      <div id="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div id="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
      <div id="assignments-count">{roleAssignments?.length || 0}</div>
      {roleAssignments?.map((roleAssignment: FlattenedRoleAssignment, index: number) => (
        <div key={index} id={`assignment-${index}`}>
          <div id={`assignment-subject-${index}`}>
            {roleAssignment.subject.kind}: {roleAssignment.subject.name}
          </div>
          <div id={`assignment-role-${index}`}>{roleAssignment.clusterRole}</div>
          <div id={`assignment-clusters-${index}`}>{(roleAssignment.clusterNames || []).join(', ')}</div>
          <div id={`assignment-namespaces-${index}`}>{roleAssignment.targetNamespaces?.join(', ') ?? ''}</div>
        </div>
      ))}
    </div>
  ),
}))

const Component = ({ userId = 'mock-user-alice-trask' }: { userId?: string } = {}) => (
  <StateProvider>
    <MemoryRouter initialEntries={[`/users/${userId}/role-assignments`]}>
      <Routes>
        <Route path="/users/:id/role-assignments" element={<UserRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </StateProvider>
)

describe('UserRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    ;(useSharedValue as jest.Mock).mockReset()
    mockUseUserDetailsContext.mockReturnValue({ user: mockUser })
  })

  it('renders UserRoleAssignments component with no user found', async () => {
    mockUseUserDetailsContext.mockReturnValue({ user: undefined })
    ;(useSharedValue as jest.Mock).mockReturnValueOnce([]).mockReturnValueOnce([])

    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  it('renders UserRoleAssignments component with user found', async () => {
    ;(useSharedValue as jest.Mock).mockImplementation((atom: string) => {
      if (atom === 'multiclusterRoleAssignmentState') return mockMulticlusterRoleAssignments
      if (atom === 'placementsState') return []
      if (atom === 'placementDecisionsState') return []
      return undefined
    })

    render(<Component userId="mock-user-alice-trask" />)

    expect(screen.getByText(/loaded/i)).toBeInTheDocument()
    expect(screen.getByText(/kubevirt\.io:edit/i)).toBeInTheDocument()
    expect(screen.getByText(/network-admin/i)).toBeInTheDocument()
    expect(screen.getAllByText(/development-cluster/i)).toHaveLength(2)
    expect(screen.getByText(/kubevirt-dev/i)).toBeInTheDocument()
    expect(screen.getByText(/vm-dev/i)).toBeInTheDocument()
    expect(screen.getByText(/networking-dev/i)).toBeInTheDocument()
  })

  it('renders without crashing when multicluster role assignment state is undefined', async () => {
    ;(useSharedValue as jest.Mock).mockImplementation((atom: string) => {
      if (atom === 'multiclusterRoleAssignmentState') return undefined
      if (atom === 'placementsState') return []
      if (atom === 'placementDecisionsState') return []
      return undefined
    })
    render(<Component userId="mock-user-alice-trask" />)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })
})
