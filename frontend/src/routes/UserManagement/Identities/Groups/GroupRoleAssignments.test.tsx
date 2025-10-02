/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { Group } from '../../../../resources/rbac'
import { GroupRoleAssignments } from './GroupRoleAssignments'
import { render, screen } from '@testing-library/react'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useRecoilValue } from '../../../../shared-recoil'

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

// Mock the useQuery hook
jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

// Mock the Recoil state
jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(() => ({
    multiclusterRoleAssignmentState: 'multiclusterRoleAssignmentState',
  })),
}))

import { useQuery } from '../../../../lib/useQuery'

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    users: ['user1', 'user2'],
  },
]

const mockMulticlusterRoleAssignments = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'developers-role-assignment',
      namespace: 'open-cluster-management-global-set',
      uid: '1',
    },
    spec: {
      subject: { kind: 'Group', name: 'developers' },
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
        {
          name: 'storage-admin-role',
          clusterRole: 'storage-admin',
          clusterSelection: {
            type: 'clusterNames' as const,
            clusterNames: ['development-cluster'],
          },
          targetNamespaces: ['storage-dev'],
        },
      ],
    },
    status: {
      roleAssignments: [
        { name: 'kubevirt-edit-role', status: 'Active' },
        { name: 'network-admin-role', status: 'Active' },
        { name: 'storage-admin-role', status: 'Active' },
      ],
    },
  },
]

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
          <div id={`assignment-clusters-${index}`}>{roleAssignment.clusterSelection.clusterNames.join(', ')}</div>
          <div id={`assignment-namespaces-${index}`}>{roleAssignment.targetNamespaces?.join(', ') ?? ''}</div>
        </div>
      ))}
    </div>
  ),
}))

function Component({ groupId = 'developers' }: { groupId?: string } = {}) {
  return (
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/groups/${groupId}/role-assignments`]}>
        <Routes>
          <Route path="/groups/:id/role-assignments" element={<GroupRoleAssignments />} />
        </Routes>
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupRoleAssignments', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()

    // Mock useQuery to return our mock data
    mockUseQuery.mockReturnValue({
      data: mockGroups,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    // Reset mocks before each test
    ;(useRecoilValue as jest.Mock).mockClear()
  })

  it('renders GroupRoleAssignments component with no group found', async () => {
    // Mock Recoil to return undefined (loading state)
    ;(useRecoilValue as jest.Mock).mockReturnValue(undefined)

    render(<Component groupId="non-existent-group" />)
    // The component should render without crashing
    // Since the group is not found, it should show loading or error state
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders GroupRoleAssignments component with developers group found', async () => {
    // Mock Recoil to return our role assignments data
    ;(useRecoilValue as jest.Mock).mockReturnValue(mockMulticlusterRoleAssignments)

    render(<Component groupId="developers" />)

    // Verify the component renders without crashing
    expect(screen.getByText(/loaded/i)).toBeInTheDocument()

    // Verify the group has role assignments - check for the actual rendered content
    screen.logTestingPlaygroundURL()

    // Check that role assignments are rendered (the exact counts may vary based on how the component renders)
    expect(screen.getByText(/kubevirt\.io:edit/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getByText(/network-admin/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getByText(/storage-admin/i)).toBeInTheDocument() // ClusterRole
    expect(screen.getAllByText(/development-cluster/i)).toHaveLength(3) // ClusterSet appears 3 times
    expect(screen.getByText(/kubevirt-dev/i)).toBeInTheDocument() // Target namespace
    expect(screen.getByText(/vm-dev/i)).toBeInTheDocument() // Target namespace
    expect(screen.getByText(/storage-dev/i)).toBeInTheDocument() // Target namespace
    expect(screen.getByText(/networking-dev/i)).toBeInTheDocument() // Target namespace
  })
})
