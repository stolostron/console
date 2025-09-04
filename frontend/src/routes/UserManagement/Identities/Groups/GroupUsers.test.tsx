/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupUsers } from './GroupUsers'
import { User, Group } from '../../../../resources/rbac'
import { useGroupDetailsContext } from './GroupPage'
import { useNavigate } from 'react-router-dom-v5-compat'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}))

jest.mock('../../../../ui-components', () => ({
  ...jest.requireActual('../../../../ui-components'),
  AcmLoadingPage: () => <div>Loading</div>,
}))

jest.mock('../../../../lib/AcmTimestamp', () => ({
  __esModule: true,
  default: ({ timestamp }: { timestamp: string }) => <span>{timestamp}</span>,
}))

jest.mock('./GroupPage', () => ({
  ...jest.requireActual('./GroupPage'),
  useGroupDetailsContext: jest.fn(),
}))

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: jest.fn(),
}))

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'test-group',
    uid: 'test-group-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  users: ['test-user', 'other-user', 'no-identity'],
}

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'test-user',
      uid: 'test-user-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    identities: ['htpasswd:test-user'],
    groups: ['test-group'],
    fullName: 'Test User',
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'other-user',
      uid: 'other-user-uid',
      creationTimestamp: '2025-01-24T15:00:00Z',
    },
    identities: ['ldap:other-user'],
    groups: ['test-group'],
    fullName: 'Other User',
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'no-identity',
      uid: 'no-identity-uid',
      creationTimestamp: '2025-01-24T13:00:00Z',
    },
    groups: ['test-group'],
    fullName: 'No Identity',
  },
]

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>
const mockNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>

function renderWithCtx() {
  return render(
    <RecoilRoot>
      <MemoryRouter>
        <GroupUsers />
      </MemoryRouter>
    </RecoilRoot>
  )
}

function setCtx({
  group,
  users,
  loading = false,
  usersLoading = false,
}: {
  group?: Group
  users?: User[]
  loading?: boolean
  usersLoading?: boolean
}) {
  mockUseGroupDetailsContext.mockReturnValue({
    group,
    users,
    loading,
    usersLoading,
  } as any)
}

// Helper function to create a user with custom properties
function createUser(overrides: Partial<User> = {}): User {
  return {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'test-user',
      uid: 'test-user-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    identities: ['htpasswd:test-user'],
    groups: ['test-group'],
    fullName: 'Test User',
    ...overrides,
  }
}

// Helper function to create a group with custom properties
function createGroup(overrides: Partial<Group> = {}): Group {
  return {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'test-group',
      uid: 'test-group-uid',
      creationTimestamp: '2025-01-24T17:48:45Z',
    },
    users: ['test-user'],
    ...overrides,
  }
}

// Helper function to create a test scenario
function createTestScenario(users: User[], groupUsers: string[] = []) {
  const group = createGroup({
    users:
      groupUsers.length > 0
        ? groupUsers
        : users.map((u) => u.metadata.name).filter((name): name is string => name !== undefined),
  })
  return { users, group }
}

describe('GroupUsers', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
    mockNavigate.mockClear()
    mockNavigate.mockReturnValue(jest.fn())
  })

  it('renders loading state', () => {
    setCtx({ loading: true, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders "not found" page with back button when group is missing', () => {
    setCtx({ group: undefined, users: undefined, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByRole('button', { name: /button.backToGroups/i })).toBeInTheDocument()
  })

  it('navigates back to groups when the back button is clicked', () => {
    const navigateSpy = jest.fn()
    mockNavigate.mockReturnValue(navigateSpy)

    setCtx({ group: undefined, users: undefined, loading: false, usersLoading: false })
    renderWithCtx()

    fireEvent.click(screen.getByRole('button', { name: /button.backToGroups/i }))
    expect(navigateSpy).toHaveBeenCalledWith('/multicloud/user-management/identities/groups')
  })

  it('renders empty state when group has no users', () => {
    setCtx({ group: { ...mockGroup, users: [] }, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('No users have been added to this group yet.')).toBeInTheDocument()
  })

  it('renders users table with only the group members', () => {
    const usersWithNonMember: User[] = [
      ...mockUsers,
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: {
          name: 'non-member',
          uid: 'non-member-uid',
          creationTimestamp: '2025-01-24T14:00:00Z',
        },
        identities: ['oauth:non-member'],
        groups: ['other-group'],
        fullName: 'Non Member',
      },
    ]

    setCtx({ group: mockGroup, users: usersWithNonMember, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
    expect(screen.getByText('no-identity')).toBeInTheDocument()

    expect(screen.queryByText('non-member')).not.toBeInTheDocument()
  })

  it('renders expected column headers', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    ;['Name', 'Identity provider', 'Created'].forEach((hdr) => expect(screen.getByText(hdr)).toBeInTheDocument())
  })

  it('shows identity providers and uses "-" when missing', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('htpasswd:test-user')).toBeInTheDocument()
    expect(screen.getByText('ldap:other-user')).toBeInTheDocument()
    expect(screen.getAllByText('-').length).toBeGreaterThan(0)
  })

  it('renders user names as links with correct hrefs', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()

    const linkCases = [
      { name: 'test-user', href: '/multicloud/user-management/identities/users/test-user-uid' },
      { name: 'other-user', href: '/multicloud/user-management/identities/users/other-user-uid' },
      { name: 'no-identity', href: '/multicloud/user-management/identities/users/no-identity-uid' },
    ] as const

    linkCases.forEach(({ name, href }) => {
      const link = screen.getByRole('link', { name })
      expect(link).toBeInTheDocument()
      expect(link).toHaveAttribute('href', href)
    })
  })

  it('handles group with undefined users array', () => {
    const groupWithUndefinedUsers = createGroup({ users: undefined }) as unknown as Group

    setCtx({ group: groupWithUndefinedUsers, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('handles users with empty names in Name column cell', () => {
    const usersWithEmptyNames: User[] = [
      createUser({
        metadata: {
          name: '',
          uid: 'empty-name-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: ['htpasswd:empty-name'],
        fullName: 'Empty Name User',
      }),
    ]

    const { users, group } = createTestScenario(usersWithEmptyNames, [''])
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('htpasswd:empty-name')).toBeInTheDocument()
  })

  it('handles users with undefined names in Name column cell', () => {
    const usersWithUndefinedNames: User[] = [
      createUser({
        metadata: {
          name: undefined,
          uid: 'undefined-name-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: ['htpasswd:undefined-name'],
        fullName: 'Undefined Name User',
      }),
    ]

    const { users, group } = createTestScenario(usersWithUndefinedNames, [undefined as any])
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('handles users with undefined creation timestamp in Created column cell', () => {
    const usersWithUndefinedTimestamp: User[] = [
      createUser({
        metadata: {
          name: 'no-timestamp-user',
          uid: 'no-timestamp-uid',
          creationTimestamp: undefined,
        },
        identities: ['htpasswd:no-timestamp'],
        fullName: 'No Timestamp User',
      }),
    ]

    const { users, group } = createTestScenario(usersWithUndefinedTimestamp)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('no-timestamp-user')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('handles users with empty creation timestamp in Created column cell', () => {
    const usersWithEmptyTimestamp: User[] = [
      createUser({
        metadata: {
          name: 'empty-timestamp-user',
          uid: 'empty-timestamp-uid',
          creationTimestamp: '',
        },
        identities: ['htpasswd:empty-timestamp'],
        fullName: 'Empty Timestamp User',
      }),
    ]

    const { users, group } = createTestScenario(usersWithEmptyTimestamp)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('empty-timestamp-user')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  it('handles users with mixed data scenarios for better coverage', () => {
    const mixedUsers: User[] = [
      createUser({
        metadata: {
          name: 'user-with-all-data',
          uid: 'user-with-all-data-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: ['htpasswd:user-with-all-data'],
        fullName: 'User With All Data',
      }),
      createUser({
        metadata: {
          name: 'user-with-minimal-data',
          uid: 'user-with-minimal-data-uid',
        },
        identities: undefined,
        fullName: 'User With Minimal Data',
      }),
    ]

    const { users, group } = createTestScenario(mixedUsers)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('user-with-all-data')).toBeInTheDocument()
    expect(screen.getByText('user-with-minimal-data')).toBeInTheDocument()
    expect(screen.getByText('htpasswd:user-with-all-data')).toBeInTheDocument()
    expect(screen.getByText('2025-01-24T16:00:00Z')).toBeInTheDocument()
  })

  it('handles group loading state', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: true, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('handles users loading state', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: true })
    renderWithCtx()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('handles users with null/undefined metadata properties', () => {
    const usersWithNullMetadata: User[] = [
      createUser({
        metadata: {
          name: 'user-with-null-uid',
          uid: null as any,
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: ['htpasswd:user-with-null-uid'],
        fullName: 'User With Null UID',
      }),
      createUser({
        metadata: {
          name: 'user-with-undefined-uid',
          uid: undefined,
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: ['htpasswd:user-with-undefined-uid'],
        fullName: 'User With Undefined UID',
      }),
    ]

    const { users, group } = createTestScenario(usersWithNullMetadata)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('user-with-null-uid')).toBeInTheDocument()
    expect(screen.getByText('user-with-undefined-uid')).toBeInTheDocument()
  })

  it('handles users with empty identities array', () => {
    const usersWithEmptyIdentities: User[] = [
      createUser({
        metadata: {
          name: 'user-with-empty-identities',
          uid: 'empty-identities-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: [],
        fullName: 'User With Empty Identities',
      }),
    ]

    const { users, group } = createTestScenario(usersWithEmptyIdentities)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('user-with-empty-identities')).toBeInTheDocument()
  })

  it('handles users with multiple identities', () => {
    const usersWithMultipleIdentities: User[] = [
      createUser({
        metadata: {
          name: 'user-with-multiple-identities',
          uid: 'multiple-identities-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        identities: ['htpasswd:user1', 'ldap:user1', 'oauth:user1'],
        fullName: 'User With Multiple Identities',
      }),
    ]

    const { users, group } = createTestScenario(usersWithMultipleIdentities)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('user-with-multiple-identities')).toBeInTheDocument()
  })

  it('handles users with invalid timestamp formats', () => {
    const usersWithInvalidTimestamps: User[] = [
      createUser({
        metadata: {
          name: 'user-with-invalid-timestamp',
          uid: 'invalid-timestamp-uid',
          creationTimestamp: 'invalid-timestamp',
        },
        identities: ['htpasswd:invalid-timestamp-user'],
        fullName: 'User With Invalid Timestamp',
      }),
    ]

    const { users, group } = createTestScenario(usersWithInvalidTimestamps)
    setCtx({ group, users, loading: false, usersLoading: false })
    renderWithCtx()

    expect(screen.getByText('user-with-invalid-timestamp')).toBeInTheDocument()
    expect(screen.getByText('invalid-timestamp')).toBeInTheDocument()
  })
})
