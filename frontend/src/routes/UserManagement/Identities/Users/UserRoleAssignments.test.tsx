/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { User } from '../../../../resources/rbac'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'
import { UserRoleAssignments } from './UserRoleAssignments'
import { useRecoilValue } from '../../../../shared-recoil'

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'mock-user-alice-trask',
      uid: 'mock-user-alice-trask',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    fullName: 'Alice Trask',
    identities: ['alice-trask:oauth'],
    groups: ['developers'],
  },
]

const mockMulticlusterRoleAssignments = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'alice-trask-role-assignment',
      namespace: 'open-cluster-management-global-set',
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
            placements: [{ name: 'placement-development-cluster', namespace: 'open-cluster-management-global-set' }],
          },
          targetNamespaces: ['kubevirt-dev', 'vm-dev'],
        },
        {
          name: 'network-admin-role',
          clusterRole: 'network-admin',
          clusterSelection: {
            type: 'placements' as const,
            placements: [{ name: 'placement-development-cluster', namespace: 'open-cluster-management-global-set' }],
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

// Mock the translation hook
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

// Mock the Recoil state
jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    usersState: 'usersState',
    placementsState: 'placementsState',
    placementDecisionsState: 'placementDecisionsState',
  })),
}))

// Mock placement-client hooks
jest.mock('../../../../resources/clients/placement-client', () => ({
  useFindPlacements: jest.fn(() => []),
  useGetClustersForPlacement: jest.fn(() => []),
  useGetClustersForPlacementMap: jest.fn(() => ({ 'placement-development-cluster': ['development-cluster'] })),
  createForClusterSets: jest.fn(),
  createForClusters: jest.fn(),
}))

// Mock placement-decision-client hooks
jest.mock('../../../../resources/clients/placement-decision-client', () => ({
  useFindPlacementDecisions: jest.fn(() => []),
  useGetClustersFromPlacementDecision: jest.fn(() => []),
}))

// Mock RoleAssignments to show the key data we want to verify
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
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/users/${userId}/role-assignments`]}>
      <Routes>
        <Route path="/users/:id/role-assignments" element={<UserRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('UserRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    // Reset mocks before each test
    ;(useRecoilValue as jest.Mock).mockClear()
  })

  it('renders UserRoleAssignments component with no user found', async () => {
    ;(useRecoilValue as jest.Mock).mockReturnValueOnce([]).mockReturnValueOnce([])

    render(<Component userId="non-existent-user" />)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // No assignments
  })

  it('renders UserRoleAssignments component with user found', async () => {
    ;(useRecoilValue as jest.Mock).mockReturnValueOnce(mockUsers).mockReturnValueOnce(mockMulticlusterRoleAssignments)

    render(<Component userId="mock-user-alice-trask" />)

    // Verify the component renders without crashing
    expect(screen.getByText(/loaded/i)).toBeInTheDocument()

    // Verify the user has role assignments - check for the actual rendered content
    screen.logTestingPlaygroundURL()

    // Check that role assignments are rendered
    expect(screen.getByText(/kubevirt\.io:edit/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getByText(/network-admin/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getAllByText(/development-cluster/i)).toHaveLength(2) // ClusterSet appears 2 times
    expect(screen.getByText(/kubevirt-dev/i)).toBeInTheDocument() // Target namespace
    expect(screen.getByText(/vm-dev/i)).toBeInTheDocument() // Target namespace
    expect(screen.getByText(/networking-dev/i)).toBeInTheDocument() // Target namespace
  })
})
