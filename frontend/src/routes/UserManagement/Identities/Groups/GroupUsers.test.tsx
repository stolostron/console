/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupUsers } from './GroupUsers'
import { User, Group } from '../../../../resources/rbac'
import { useGroupDetailsContext } from './GroupPage'
import { useNavigate } from 'react-router-dom-v5-compat'

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
    identities: ['ldap:other-user'],
    groups: ['test-group'],
    fullName: 'Other User',
  },
]

jest.mock('./GroupPage', () => ({
  ...jest.requireActual('./GroupPage'),
  useGroupDetailsContext: jest.fn(),
}))

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useNavigate: jest.fn(),
}))

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>
const mockNavigate = useNavigate as jest.MockedFunction<typeof useNavigate>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupUsers />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupUsers', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
    mockNavigate.mockClear()
    mockNavigate.mockReturnValue(jest.fn())
  })

  test('should render loading state', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: true,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render group not found message with back button', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    const backButton = screen.getByRole('button', { name: /Back to groups/i })
    expect(backButton).toBeInTheDocument()
  })

  test('should navigate to groups page when back button is clicked', () => {
    const mockNavigateFn = jest.fn()
    mockNavigate.mockReturnValue(mockNavigateFn)

    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    const backButton = screen.getByRole('button', { name: /Back to groups/i })
    fireEvent.click(backButton)

    expect(mockNavigateFn).toHaveBeenCalledWith('/multicloud/user-management/identities/groups')
  })

  test('should render empty state when group has no users', () => {
    const groupWithoutUsers = {
      ...mockGroup,
      users: [],
    }
    mockUseGroupDetailsContext.mockReturnValue({
      group: groupWithoutUsers,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('No users found')).toBeInTheDocument()
    expect(screen.getByText('No users have been added to this group yet.')).toBeInTheDocument()
  })

  test('should render users table with group users', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
  })

  test('should render table with correct column headers', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Identity provider')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
  })

  test('should display identity provider information for users', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('htpasswd:test-user')).toBeInTheDocument()
    expect(screen.getByText('ldap:other-user')).toBeInTheDocument()
  })

  test('should render user names as clickable links', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    // Check that user names are rendered as links
    const testUserLink = screen.getByRole('link', { name: 'test-user' })
    const otherUserLink = screen.getByRole('link', { name: 'other-user' })

    expect(testUserLink).toBeInTheDocument()
    expect(otherUserLink).toBeInTheDocument()

    // Check that links have correct href attributes
    expect(testUserLink).toHaveAttribute('href', '/multicloud/user-management/identities/users/test-user-uid')
    expect(otherUserLink).toHaveAttribute('href', '/multicloud/user-management/identities/users/other-user-uid')
  })

  test('should not show users that are not members of the group', () => {
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

    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: usersWithNonMember,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('other-user')).toBeInTheDocument()
    expect(screen.queryByText('non-member')).not.toBeInTheDocument()
  })
})
