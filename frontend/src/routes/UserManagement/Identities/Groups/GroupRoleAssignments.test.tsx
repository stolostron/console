/* Copyright Contributors to the Open Cluster Management project */
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Group } from '../../../../resources/rbac'
import { GroupRoleAssignments } from './GroupRoleAssignments'
import { render, screen } from '@testing-library/react'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useRecoilValue } from '../../../../shared-recoil'
import { MulticlusterRoleAssignmentNamespace } from '../../../../resources'

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
    groupsState: 'groupsState',
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
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'developers-role-assignment',
      namespace: MulticlusterRoleAssignmentNamespace,
      uid: '1',
    },
    spec: {
      subject: { kind: 'Group', name: 'developers' },
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
        {
          name: 'storage-admin-role',
          clusterRole: 'storage-admin',
          clusterSelection: {
            type: 'placements' as const,
            placements: [{ name: 'placement-development-cluster', namespace: MulticlusterRoleAssignmentNamespace }],
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
          <div id={`assignment-clusters-${index}`}>{(roleAssignment.clusterNames || []).join(', ')}</div>
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
    ;(useRecoilValue as jest.Mock).mockClear()
  })

  it('renders GroupRoleAssignments component with no group found', async () => {
    ;(useRecoilValue as jest.Mock).mockReturnValueOnce([]).mockReturnValueOnce([])

    render(<Component groupId="non-existent-group" />)
    expect(screen.getByText('Loaded')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument() // No assignments
  })

  it('renders GroupRoleAssignments component with developers group found', async () => {
    ;(useRecoilValue as jest.Mock).mockReturnValueOnce(mockGroups).mockReturnValueOnce(mockMulticlusterRoleAssignments)

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
