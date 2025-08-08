/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { UserDetails } from './UserDetails'
import { User } from '../../../../resources/rbac'

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'test-user-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  identities: ['htpasswd:test-user'],
  groups: ['developers'],
  fullName: 'Test User',
}

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
        <UserDetails />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('UserDetails', () => {
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

  test('should render user details with full information', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: mockUser,
      groups: [],
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('test-user')).toBeInTheDocument()
    expect(screen.getByText('Last login')).toBeInTheDocument()
  })

  test('should render user details with missing full name', () => {
    const userWithoutFullName = {
      ...mockUser,
      fullName: undefined,
    }
    mockUseUserDetailsContext.mockReturnValue({
      user: userWithoutFullName,
      groups: [],
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })

  test('should render user details with missing creation timestamp', () => {
    const userWithoutTimestamp = {
      ...mockUser,
      metadata: {
        ...mockUser.metadata,
        creationTimestamp: undefined,
      },
    }
    mockUseUserDetailsContext.mockReturnValue({
      user: userWithoutTimestamp,
      groups: [],
      loading: false,
      groupsLoading: false,
    })

    render(<Component />)

    expect(screen.getByText('Last login')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
