/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupDetails } from './GroupDetails'
import { Group, User } from '../../../../resources/rbac'

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
]

jest.mock('./GroupPage', () => ({
  ...jest.requireActual('./GroupPage'),
  useGroupDetailsContext: jest.fn(),
}))

import { useGroupDetailsContext } from './GroupPage'

const mockUseGroupDetailsContext = useGroupDetailsContext as jest.MockedFunction<typeof useGroupDetailsContext>

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupDetails />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupDetails', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseGroupDetailsContext.mockClear()
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

  test('should render group not found message', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: undefined,
      users: undefined,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Group not found')).toBeInTheDocument()
  })

  test('should render group details with full information', () => {
    mockUseGroupDetailsContext.mockReturnValue({
      group: mockGroup,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getByText('Group name')).toBeInTheDocument()
    expect(screen.getByText('test-group')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('2')).toBeInTheDocument()
  })

  test('should render group details with missing creation timestamp', () => {
    const groupWithoutTimestamp = {
      ...mockGroup,
      metadata: {
        ...mockGroup.metadata,
        creationTimestamp: undefined,
      },
    }
    mockUseGroupDetailsContext.mockReturnValue({
      group: groupWithoutTimestamp,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Created')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  test('should render group details with no users', () => {
    const groupWithoutUsers = {
      ...mockGroup,
      users: [],
    }
    mockUseGroupDetailsContext.mockReturnValue({
      group: groupWithoutUsers,
      users: [],
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('0')).toBeInTheDocument()
  })

  test('should render group details with single user', () => {
    const groupWithOneUser = {
      ...mockGroup,
      users: ['test-user'],
    }
    mockUseGroupDetailsContext.mockReturnValue({
      group: groupWithOneUser,
      users: [mockUsers[0]],
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
  })

  test('should render group details with missing group name', () => {
    const groupWithoutName = {
      ...mockGroup,
      metadata: {
        ...mockGroup.metadata,
        name: undefined,
      },
    }
    mockUseGroupDetailsContext.mockReturnValue({
      group: groupWithoutName,
      users: mockUsers,
      loading: false,
      usersLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Group name')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
