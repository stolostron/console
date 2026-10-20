/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { Group, User } from '../../../../resources/rbac'
import { getResource, ResourceError, ResourceErrorCode } from '../../../../resources/utils'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { GroupPage } from './GroupPage'
import { useSharedValue, useSharedAtoms } from '../../../../shared-atoms'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'button.backToGroups': 'Back to groups',
        'Not found': 'Not found',
      }
      return translations[key] || key
    },
  }),
}))

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('../../../../resources/utils', () => {
  const actual = jest.requireActual('../../../../resources/utils')
  return {
    ...actual,
    getResource: jest.fn(),
  }
})

jest.mock('../../../Search/search-sdk/search-client', () => ({
  searchClient: { query: jest.fn() },
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockGetResource = getResource as jest.Mock
const mockSearchQuery = searchClient.query as jest.Mock

const usersAtom = Symbol('usersState')
const groupsAtom = Symbol('groupsState')
const mraAtom = Symbol('multiclusterRoleAssignmentState')
const authAtom = Symbol('isDirectAuthenticationEnabledState')

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'kubevirt-admins',
      uid: 'kubevirt-admins-uid',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
    users: ['dev1', 'dev2'],
  },
]

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'admin1',
      uid: 'admin1',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
  },
]

const opsMra: MulticlusterRoleAssignment = {
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name: 'mra-ops', creationTimestamp: '2023-02-01T00:00:00Z' },
  spec: {
    subject: { kind: 'Group', name: 'ops-team' },
    roleAssignments: [],
  },
}

const emptyMras: MulticlusterRoleAssignment[] = []
const opsMras: MulticlusterRoleAssignment[] = [opsMra]

function Component({ groupId = 'kubevirt-admins-uid' }: { groupId?: string }) {
  return (
    <StateProvider>
      <MemoryRouter initialEntries={[`/groups/${groupId}`]}>
        <Routes>
          <Route path="/groups/:id" element={<GroupPage />} />
        </Routes>
      </MemoryRouter>
    </StateProvider>
  )
}

function notFound() {
  return Promise.reject(new ResourceError(ResourceErrorCode.NotFound))
}

function mockSearchWithKubevirtAdmins() {
  mockSearchQuery.mockResolvedValue({
    data: {
      searchResult: [
        {
          items: [{ name: 'kubevirt-admins', _uid: 'local-cluster/kubevirt-admins-uid' }],
        },
      ],
    },
  })
}

describe('GroupPage', () => {
  beforeEach(() => {
    mockUseSharedAtoms.mockReturnValue({
      usersState: usersAtom,
      groupsState: groupsAtom,
      multiclusterRoleAssignmentState: mraAtom,
      isDirectAuthenticationEnabledState: authAtom,
    } as any)

    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === groupsAtom) throw new Error('groupsState should not be read')
      if (atom === usersAtom) return mockUsers
      if (atom === mraAtom) return emptyMras
      if (atom === authAtom) return false
      return undefined
    })

    mockGetResource.mockImplementation((resource: Group) => {
      const group = mockGroups.find((item) => item.metadata.name === resource.metadata.name)
      return { promise: group ? Promise.resolve(group) : notFound() }
    })
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [] }] } })
  })

  test('should resolve uid via Search and then load the Group resource', async () => {
    mockSearchWithKubevirtAdmins()
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
    })
    expect(mockSearchQuery).toHaveBeenCalledTimes(1)
    expect(mockGetResource).toHaveBeenCalledTimes(1)
    expect(mockGetResource).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: expect.objectContaining({ name: 'kubevirt-admins' }) })
    )
  })

  test('should render group not found error', async () => {
    render(<Component groupId="non-existent-uid" />)

    await waitFor(() => {
      expect(screen.getByText('Not found')).toBeInTheDocument()
      expect(screen.getByText('Back to groups')).toBeInTheDocument()
    })
    expect(mockGetResource).not.toHaveBeenCalled()
  })

  test('should render group page with navigation tabs', async () => {
    mockSearchWithKubevirtAdmins()
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'YAML' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Role assignments' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Users' })).toBeInTheDocument()
    })
  })

  test('should show an MRA group that has no Group resource', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === groupsAtom) throw new Error('groupsState should not be read')
      if (atom === usersAtom) return mockUsers
      if (atom === mraAtom) return opsMras
      if (atom === authAtom) return false
      return undefined
    })

    // MRA-only subjects use uid === name
    render(<Component groupId="ops-team" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'ops-team' })).toBeInTheDocument()
    })
    expect(mockGetResource).not.toHaveBeenCalled()
  })

  test('should fall back to an MRA group when Search lookup fails', async () => {
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === groupsAtom) throw new Error('groupsState should not be read')
      if (atom === usersAtom) return mockUsers
      if (atom === mraAtom) return opsMras
      if (atom === authAtom) return false
      return undefined
    })
    mockSearchQuery.mockRejectedValue(new Error('search unavailable'))

    render(<Component groupId="ops-team" />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'ops-team' })).toBeInTheDocument()
    })
  })

  test('should hide YAML and Users tabs when isDirectAuthenticationEnabled', async () => {
    mockSearchWithKubevirtAdmins()
    mockUseSharedValue.mockImplementation((atom: unknown) => {
      if (atom === groupsAtom) throw new Error('groupsState should not be read')
      if (atom === usersAtom) return mockUsers
      if (atom === mraAtom) return emptyMras
      if (atom === authAtom) return true
      return undefined
    })

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByRole('heading', { level: 1, name: 'kubevirt-admins' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
      expect(screen.getByRole('tab', { name: 'Role assignments' })).toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
      expect(screen.queryByRole('tab', { name: 'Users' })).not.toBeInTheDocument()
    })
  })
})
