/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { UserGroups } from './UserGroups'
import { User, Group } from '../../../../resources/rbac'
import { useUserDetailsContext } from './UserPage'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({ t: (s: string) => s }),
}))

jest.mock('../../../../lib/AcmTimestamp', () => ({
  __esModule: true,
  default: ({ timestamp }: { timestamp: string }) => <span>{timestamp}</span>,
}))

jest.mock('./UserPage', () => ({
  ...jest.requireActual('./UserPage'),
  useUserDetailsContext: jest.fn(),
}))

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'test-user-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  identities: ['htpasswd:test-user'],
  groups: ['developers', 'admins'],
  fullName: 'Test User',
}

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    users: ['test-user', 'other-user'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'admins',
      uid: 'admins-uid',
      creationTimestamp: '2025-01-24T15:00:00Z',
    },
    users: ['test-user'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'viewers',
      uid: 'viewers-uid',
      creationTimestamp: '2025-01-24T14:00:00Z',
    },
    users: ['other-user'],
  },
]

const mockGroupsWithoutUser: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    users: ['other-user'],
  },
]

const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

function renderWithCtx() {
  return render(
    <RecoilRoot>
      <MemoryRouter>
        <UserGroups />
      </MemoryRouter>
    </RecoilRoot>
  )
}

function setCtx({ user, groups }: { user?: User; groups?: Group[] }) {
  mockUseUserDetailsContext.mockReturnValue({
    user,
    groups,
  })
}

function createUser(overrides: Partial<User> = {}): User {
  return {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'test-user',
      uid: 'test-user-uid',
      creationTimestamp: '2025-01-24T17:48:45Z',
    },
    identities: ['htpasswd:test-user'],
    groups: ['developers', 'admins'],
    fullName: 'Test User',
    ...overrides,
  }
}

function createGroupsWithUser(userName: string): Group[] {
  return [
    {
      apiVersion: 'user.openshift.io/v1',
      kind: 'Group',
      metadata: {
        name: 'developers',
        uid: 'developers-uid',
        creationTimestamp: '2025-01-24T16:00:00Z',
      },
      users: [userName],
    },
  ]
}

describe('UserGroups', () => {
  beforeEach(() => {
    mockUseUserDetailsContext.mockClear()
  })

  it('renders empty state when user is undefined', () => {
    setCtx({ user: undefined, groups: undefined })
    renderWithCtx()
    expect(screen.getByText('No groups found')).toBeInTheDocument()
  })

  it('renders empty state when user has no groups', () => {
    const userWithoutGroups = createUser({ groups: [] })
    setCtx({ user: userWithoutGroups, groups: mockGroupsWithoutUser })
    renderWithCtx()
    expect(screen.getByText('No groups found')).toBeInTheDocument()
    expect(screen.getByText('This user is not a member of any groups yet.')).toBeInTheDocument()
  })

  it('renders groups table with only the user groups', () => {
    setCtx({ user: mockUser, groups: mockGroups })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
  })

  it('does not show groups that user is not a member of', () => {
    setCtx({ user: mockUser, groups: mockGroups })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.queryByText('viewers')).not.toBeInTheDocument()
  })

  it('handles user with undefined groups array', () => {
    const userWithUndefinedGroups = createUser({ groups: undefined })
    setCtx({ user: userWithUndefinedGroups, groups: mockGroupsWithoutUser })
    renderWithCtx()
    expect(screen.getByText('No groups found')).toBeInTheDocument()
  })

  it('handles user with null/undefined metadata properties', () => {
    const userWithNullMetadata = createUser({
      metadata: {
        name: 'user-with-null-uid',
        uid: null as any,
        creationTimestamp: '2025-01-24T16:00:00Z',
      },
      groups: ['developers'],
      fullName: 'User With Null UID',
    })
    setCtx({ user: userWithNullMetadata, groups: createGroupsWithUser('user-with-null-uid') })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
  })

  it('handles user with invalid timestamp formats', () => {
    const userWithInvalidTimestamp = createUser({
      metadata: {
        name: 'user-with-invalid-timestamp',
        uid: 'invalid-timestamp-uid',
        creationTimestamp: 'invalid-timestamp',
      },
      groups: ['developers'],
      fullName: 'User With Invalid Timestamp',
    })
    setCtx({ user: userWithInvalidTimestamp, groups: createGroupsWithUser('user-with-invalid-timestamp') })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
  })

  it('handles groups with null or undefined users array', () => {
    const groupsWithNullUsers: Group[] = [
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: {
          name: 'group-with-null-users',
          uid: 'null-users-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        users: null as any,
      },
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: {
          name: 'group-with-undefined-users',
          uid: 'undefined-users-uid',
          creationTimestamp: '2025-01-24T15:00:00Z',
        },
        users: undefined as any,
      },
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: {
          name: 'valid-group',
          uid: 'valid-group-uid',
          creationTimestamp: '2025-01-24T14:00:00Z',
        },
        users: ['test-user'],
      },
    ]
    setCtx({ user: mockUser, groups: groupsWithNullUsers })
    renderWithCtx()

    expect(screen.getByText('valid-group')).toBeInTheDocument()
    expect(screen.queryByText('group-with-null-users')).not.toBeInTheDocument()
    expect(screen.queryByText('group-with-undefined-users')).not.toBeInTheDocument()
  })
})
