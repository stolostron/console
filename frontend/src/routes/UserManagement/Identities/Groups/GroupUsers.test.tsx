/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupUsers } from './GroupUsers'
import { User, Group } from '../../../../resources/rbac'
import { useGroupDetailsContext } from './GroupPage'

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

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'test-group',
    uid: 'test-group-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  users: ['test-user', 'other-user'],
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
    identities: ['htpasswd:other-user'],
    groups: ['test-group'],
    fullName: 'Other User',
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'non-member-user',
      uid: 'non-member-uid',
      creationTimestamp: '2025-01-24T14:00:00Z',
    },
    identities: ['htpasswd:non-member-user'],
    groups: ['different-group'],
    fullName: 'Non Member User',
  },
]

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>

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

function createGroup(overrides: Partial<Group> = {}): Group {
  return {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'test-group',
      uid: 'test-group-uid',
      creationTimestamp: '2025-01-24T17:48:45Z',
    },
    users: ['test-user', 'other-user'],
    ...overrides,
  }
}

describe('GroupUsers', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
  })

  it('renders loading state', () => {
    setCtx({ group: undefined, users: undefined, loading: true, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('renders "not found" page when group is missing', () => {
    setCtx({ group: undefined, users: undefined, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('renders empty state when group has no users', () => {
    const groupWithoutUsers = createGroup({ users: [] })
    setCtx({ group: groupWithoutUsers, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('No users have been added to this group yet.')).toBeInTheDocument()
  })

  it('renders users table with only the group users', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
  })

  it('does not show users that are not members of the group', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
    expect(screen.queryByText('non-member-user')).not.toBeInTheDocument()
  })

  it('handles group loading state', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: true, usersLoading: false })
    renderWithCtx()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('handles users loading state', () => {
    setCtx({ group: mockGroup, users: mockUsers, loading: false, usersLoading: true })
    renderWithCtx()
    expect(screen.getByRole('grid')).toBeInTheDocument()
  })

  it('handles group with undefined users array', () => {
    const groupWithUndefinedUsers = createGroup({ users: undefined })
    setCtx({ group: groupWithUndefinedUsers, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('No users found')).toBeInTheDocument()
  })

  it('handles group with null/undefined metadata properties', () => {
    const groupWithNullMetadata = createGroup({
      metadata: {
        name: 'group-with-null-uid',
        uid: null as any,
        creationTimestamp: '2025-01-24T16:00:00Z',
      },
      users: ['test-user'],
    })
    setCtx({ group: groupWithNullMetadata, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('test-user')).toBeInTheDocument()
  })

  it('handles group with invalid timestamp formats', () => {
    const groupWithInvalidTimestamp = createGroup({
      metadata: {
        name: 'group-with-invalid-timestamp',
        uid: 'invalid-timestamp-uid',
        creationTimestamp: 'invalid-timestamp',
      },
      users: ['test-user'],
    })
    setCtx({ group: groupWithInvalidTimestamp, users: mockUsers, loading: false, usersLoading: false })
    renderWithCtx()
    expect(screen.getByText('test-user')).toBeInTheDocument()
  })
})
