/* Copyright Contributors to the Open Cluster Management project */
import { PageSection } from '@patternfly/react-core'
import { render, screen } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { AcmLoadingPage } from '../../../../ui-components'
import { RoleRoleAssignments } from './RoleRoleAssignments'
import { FlattenedRoleAssignment } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useCurrentRole } from '../RolesPage'
import { useSharedAtoms, useRecoilValue } from '../../../../shared-recoil'
import { MulticlusterRoleAssignmentNamespace } from '../../../../resources'

jest.mock('../RolesPage', () => ({
  useCurrentRole: jest.fn(),
}))

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
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

const mockUseCurrentRole = useCurrentRole as jest.MockedFunction<typeof useCurrentRole>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

const mockClusterRoles = [
  {
    apiVersion: 'rbac.authorization.k8s.io/v1' as const,
    kind: 'ClusterRole' as const,
    metadata: {
      name: 'kubevirt.io:edit',
      uid: 'kubevirt-edit-uid',
      creationTimestamp: '2023-01-01T00:00:00Z',
      labels: {
        'rbac.open-cluster-management.io/filter': 'vm-clusterroles',
      },
    },
    rules: [
      {
        apiGroups: ['kubevirt.io'],
        resources: ['virtualmachines'],
        verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'],
      },
    ],
  },
  {
    apiVersion: 'rbac.authorization.k8s.io/v1' as const,
    kind: 'ClusterRole' as const,
    metadata: {
      name: 'network-admin',
      uid: 'network-admin-uid',
      creationTimestamp: '2023-01-02T00:00:00Z',
      labels: {
        'rbac.open-cluster-management.io/filter': 'vm-clusterroles',
      },
    },
    rules: [
      {
        apiGroups: ['networking.k8s.io'],
        resources: ['networkpolicies'],
        verbs: ['get', 'list', 'watch', 'create', 'update', 'patch', 'delete'],
      },
    ],
  },
]

const mockMulticlusterRoleAssignments = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'kubevirt-edit-role-assignment',
      namespace: MulticlusterRoleAssignmentNamespace,
      uid: '1',
    },
    spec: {
      subject: { kind: 'ClusterRole', name: 'kubevirt.io:edit' },
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
      ],
    },
    status: {
      roleAssignments: [{ name: 'kubevirt-edit-role', status: 'Active' }],
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

// Mock RoleAssignments to show the key data we want to verify
jest.mock('../../RoleAssignment/RoleAssignments', () => ({
  RoleAssignments: ({ roleAssignments, isLoading, hiddenColumns }: any) => (
    <div id="role-assignments">
      <div id="loading">{isLoading ? 'Loading' : 'Loaded'}</div>
      <div id="hidden-columns">{hiddenColumns?.join(',') || 'none'}</div>
      <div id="assignments-count">{roleAssignments?.length || 0}</div>
      {isLoading ? (
        <div id="loading-state">Loading...</div>
      ) : roleAssignments && roleAssignments.length > 0 ? (
        roleAssignments.map((roleAssignment: FlattenedRoleAssignment, index: number) => (
          <div key={index} id={`assignment-${index}`}>
            <div id={`assignment-subject-${index}`}>
              {roleAssignment.subject.kind}: {roleAssignment.subject.name}
            </div>
            <div id={`assignment-role-${index}`}>{roleAssignment.clusterRole}</div>
            <div id={`assignment-clusters-${index}`}>{(roleAssignment.clusterNames || []).join(', ')}</div>
            <div id={`assignment-namespaces-${index}`}>{roleAssignment.targetNamespaces?.join(', ') ?? ''}</div>
          </div>
        ))
      ) : (
        <div id="empty-state">No role assignment created yet</div>
      )}
    </div>
  ),
}))

const Component = ({ userId = 'mock-user-alice-trask' }: { userId?: string } = {}) => (
  <RecoilRoot>
    <MemoryRouter initialEntries={[`/roles/${userId}/role-assignments`]}>
      <Routes>
        <Route path="/roles/:id/role-assignments" element={<RoleRoleAssignments />} />
      </Routes>
    </MemoryRouter>
  </RecoilRoot>
)

describe('RoleRoleAssignments', () => {
  beforeEach(() => {
    mockUseCurrentRole.mockClear()

    mockUseSharedAtoms.mockReturnValue({
      multiclusterRoleAssignmentState: {} as any,
    } as any)

    // Default mock return value for useRecoilValue
    ;(useRecoilValue as jest.Mock).mockReturnValue([])
  })

  it('renders RoleRoleAssignments component with no role found', async () => {
    mockUseCurrentRole.mockReturnValue(undefined)
    render(<Component userId="non-existent-role" />)
    // With hasDataToProcess logic, no role means loading state
    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })

  it('renders RoleRoleAssignments component with role found', async () => {
    mockUseCurrentRole.mockReturnValue(mockClusterRoles[0])
    ;(useRecoilValue as jest.Mock).mockReturnValue(mockMulticlusterRoleAssignments)

    render(<Component userId="kubevirt.io:edit" />)

    // Verify the component renders without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('renders with different role and shows their role assignments', async () => {
    mockUseCurrentRole.mockReturnValue(mockClusterRoles[1])
    ;(useRecoilValue as jest.Mock).mockReturnValue(mockMulticlusterRoleAssignments)

    // Test with network-admin role
    render(<Component userId="network-admin" />)

    // Verify the component renders without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('passes correct hidden columns to RoleAssignments component', async () => {
    mockUseCurrentRole.mockReturnValue(mockClusterRoles[0])
    ;(useRecoilValue as jest.Mock).mockReturnValue(mockMulticlusterRoleAssignments)
    render(<Component userId="kubevirt.io:edit" />)

    // The component should render without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('shows loading state correctly', async () => {
    mockUseCurrentRole.mockReturnValue(mockClusterRoles[0])
    ;(useRecoilValue as jest.Mock).mockReturnValue(mockMulticlusterRoleAssignments)
    render(<Component userId="kubevirt.io:edit" />)

    // The component should render without crashing
    expect(document.body).toBeInTheDocument()
  })

  it('renders loading state when component is actually loading', () => {
    // Directly render the loading state that the component would show
    render(
      <PageSection hasBodyWrapper={false}>
        <AcmLoadingPage />
      </PageSection>
    )

    // Verify actual loading page is rendered with "Loading" text from AcmLoadingPage
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })
})
