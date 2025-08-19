/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UserGroups } from './UserGroups'
import { User, Group } from '../../../../resources/rbac'

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

jest.mock('./UserPage', () => ({
  ...jest.requireActual('./UserPage'),
  useUserDetailsContext: jest.fn(),
}))

import { useUserDetailsContext } from './UserPage'

const mockUseUserDetailsContext = useUserDetailsContext as jest.MockedFunction<typeof useUserDetailsContext>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <UserGroups />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('UserGroups', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseUserDetailsContext.mockClear()
  })

  test('should render loading state', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: undefined,
      groups: undefined,
      loading: true,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render user not found message', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: undefined,
      groups: undefined,
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('User not found')).toBeInTheDocument()
  })

  test('should render empty state when user has no groups', () => {
    const userWithoutGroups = {
      ...mockUser,
      groups: [],
    }
    mockUseUserDetailsContext.mockReturnValue({
      user: userWithoutGroups,
      groups: mockGroups,
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('No groups found')).toBeInTheDocument()
    expect(screen.getByText('This user is not a member of any groups.')).toBeInTheDocument()
  })

  test('should render groups table with user groups', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: mockUser,
      groups: mockGroups,
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
  })

  test('should not show groups that user is not a member of', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: mockUser,
      groups: mockGroups,
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.queryByText('viewers')).not.toBeInTheDocument()
  })
})
