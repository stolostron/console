/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import { StateProvider } from '~/lib/state-provider'
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

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearch', () => ({
  useFleetSearch: jest.fn(),
}))

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription', () => ({
  useFleetSearchSubscription: jest.fn().mockReturnValue([undefined, false, undefined]),
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('./UserPage', () => ({
  ...jest.requireActual('./UserPage'),
  useUserDetailsContext: jest.fn(),
}))

const mockUseFleetSearch = useFleetSearch as jest.MockedFunction<typeof useFleetSearch>
const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

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

const mockUserGroups: Group[] = [
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
]

function renderWithCtx() {
  return render(
    <StateProvider>
      <MemoryRouter>
        <UserGroups />
      </MemoryRouter>
    </StateProvider>
  )
}

function setCtx(user?: User) {
  mockUseUserDetailsContext.mockReturnValue({ user })
}

function setFleetGroups(groups: Group[] | undefined, loaded = true) {
  mockUseFleetSearch.mockReturnValue([groups, loaded, undefined, jest.fn()])
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
    mockUseUserDetailsContext.mockClear()
    mockUseFleetSearch.mockClear()
    setFleetGroups([])
  })

  it('renders empty state when user is undefined', () => {
    setCtx(undefined)
    setFleetGroups(undefined)
    renderWithCtx()
    expect(screen.getByText('No groups found')).toBeInTheDocument()
  })

  it('renders empty state when user has no groups', () => {
    setCtx(createUser({ groups: [] }))
    setFleetGroups([])
    renderWithCtx()
    expect(screen.getByText('No groups found')).toBeInTheDocument()
    expect(screen.getByText('This user is not a member of any groups yet.')).toBeInTheDocument()
  })

  it('shows loading skeleton while Search is in flight', () => {
    setCtx(mockUser)
    setFleetGroups(undefined, false)
    renderWithCtx()
    expect(screen.getAllByRole('progressbar').length).toBeGreaterThan(0)
    expect(screen.queryByText('No groups found')).not.toBeInTheDocument()
  })

  it('renders groups table with groups from Search', () => {
    setCtx(mockUser)
    setFleetGroups(mockUserGroups)
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
  })

  it('does not show groups that Search did not return for the user', () => {
    setCtx(mockUser)
    setFleetGroups(mockUserGroups)
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.queryByText('viewers')).not.toBeInTheDocument()
  })

  it('handles user with undefined groups array', () => {
    setCtx(createUser({ groups: undefined }))
    setFleetGroups([])
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
    setCtx(userWithNullMetadata)
    setFleetGroups([
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: {
          name: 'developers',
          uid: 'developers-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        users: ['user-with-null-uid'],
      },
    ])
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
    setCtx(userWithInvalidTimestamp)
    setFleetGroups([
      {
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: {
          name: 'developers',
          uid: 'developers-uid',
          creationTimestamp: '2025-01-24T16:00:00Z',
        },
        users: ['user-with-invalid-timestamp'],
      },
    ])
    renderWithCtx()
    expect(screen.getByText('developers')).toBeInTheDocument()
  })

  it('queries Search with groupUsers filter for the current user', () => {
    setCtx(mockUser)
    setFleetGroups(mockUserGroups)
    renderWithCtx()

    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        filters: expect.arrayContaining([
          { property: 'kind', values: ['Group'] },
          { property: 'apigroup', values: ['user.openshift.io'] },
          { property: '_hubClusterResource', values: ['*'] },
          { property: 'groupUsers', values: ['test-user'] },
        ]),
        limit: -1,
        orderBy: 'name asc',
      }),
      false
    )
  })
})
