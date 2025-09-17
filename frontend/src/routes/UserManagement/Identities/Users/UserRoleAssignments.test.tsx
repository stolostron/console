/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../../lib/nock-util'
import { User } from '../../../../resources/rbac'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'
import { UserRoleAssignments } from './UserRoleAssignments'
import { useRecoilValue } from '../../../../shared-recoil'

// Mock the useQuery hook
jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

import { useQuery } from '../../../../lib/useQuery'
const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

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
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
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
            type: 'clusterNames' as const,
            clusterNames: ['development-cluster'],
          },
          targetNamespaces: ['kubevirt-dev', 'vm-dev'],
        },
        {
          name: 'network-admin-role',
          clusterRole: 'network-admin',
          clusterSelection: {
            type: 'clusterNames' as const,
            clusterNames: ['development-cluster'],
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
    multiclusterRoleAssignmentState: 'multiclusterRoleAssignmentState',
  })),
}))

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ roleAssignments, isLoading, hiddenColumns }: any) => (
    <div id="role-assignments">
      <div id="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div id="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
      <div id="assignments-count">{roleAssignments.length}</div>
      {roleAssignments.map((roleAssignment: FlattenedRoleAssignment, index: number) => (
        <div key={index} id={`assignment-${index}`}>
          <div id={`assignment-subject-${index}`}>
            {roleAssignment.subject.kind}: {roleAssignment.subject.name}
          </div>
          <div id={`assignment-role-${index}`}>{roleAssignment.clusterRole}</div>
          <div id={`assignment-clusters-${index}`}>{roleAssignment.clusterSelection.clusterNames.join(', ')}</div>
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

    // Mock useQuery to return our mock data
    mockUseQuery.mockReturnValue({
      data: mockUsers,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    // Reset mocks before each test
    ;(useRecoilValue as jest.Mock).mockClear()
  })

  it('renders UserRoleAssignments component with no user found', async () => {
    // Mock Recoil to return undefined (loading state)
    ;(useRecoilValue as jest.Mock).mockReturnValue(undefined)

    render(<Component userId="non-existent-user" />)
    // The component should render without crashing
    // Since the user is not found, it should show loading or error state
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders UserRoleAssignments component with user found', async () => {
    // Mock Recoil to return our role assignments data
    ;(useRecoilValue as jest.Mock).mockReturnValue(mockMulticlusterRoleAssignments)

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
