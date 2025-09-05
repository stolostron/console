/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UserGroups } from './UserGroups'
import { User, Group } from '../../../../resources/rbac'
import { useUserDetailsContext } from './UserPage'

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

function setCtx({
  user,
  groups,
  loading = false,
  groupsLoading = false,
}: {
  user?: User
  groups?: Group[]
  loading?: boolean
  groupsLoading?: boolean
}) {
  mockUseUserDetailsContext.mockReturnValue({
    user,
    groups,
    loading,
    groupsLoading,
  } as any)
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

describe('UserGroups', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseUserDetailsContext.mockClear()
  })

  it('renders loading state', () => {
    setCtx({ user: undefined, groups: undefined, loading: true, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('renders "not found" page when user is missing', () => {
    setCtx({ user: undefined, groups: undefined, loading: false, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('Not found')).toBeInTheDocument()
  })

  it('renders empty state when user has no groups', () => {
    const userWithoutGroups = createUser({ groups: [] })
    setCtx({ user: userWithoutGroups, groups: mockGroups, loading: false, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('No users have been added to this group yet.')).toBeInTheDocument()
  })

  it('renders groups table with only the user groups', () => {
    setCtx({ user: mockUser, groups: mockGroups, loading: false, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
  })

  it('does not show groups that user is not a member of', () => {
    setCtx({ user: mockUser, groups: mockGroups, loading: false, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.queryByText('viewers')).not.toBeInTheDocument()
  })

  it('handles user loading state', () => {
    setCtx({ user: mockUser, groups: mockGroups, loading: true, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('handles groups loading state', () => {
    setCtx({ user: mockUser, groups: mockGroups, loading: false, groupsLoading: true })
    renderWithCtx()
    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  it('handles user with undefined groups array', () => {
    const userWithUndefinedGroups = createUser({ groups: undefined })
    setCtx({ user: userWithUndefinedGroups, groups: mockGroups, loading: false, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
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
    setCtx({ user: userWithNullMetadata, groups: mockGroups, loading: false, groupsLoading: false })
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
    setCtx({ user: userWithInvalidTimestamp, groups: mockGroups, loading: false, groupsLoading: false })
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
  })
})
