/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { UserDetails } from './UserDetails'
import { User } from '../../../../resources/rbac'
import { useUserDetailsContext } from './UserPage'

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
    mockUseUserDetailsContext.mockClear()
  })

  test('should render user not found message', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: undefined,
      groups: undefined,
    })

    render(<Component />)

    expect(screen.getByText('User not found')).toBeInTheDocument()
  })

  test('should render user details with full information', () => {
    mockUseUserDetailsContext.mockReturnValue({
      user: mockUser,
      groups: [],
    })

    render(<Component />)

    expect(screen.getByText('General information')).toBeInTheDocument()
    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('Test User')).toBeInTheDocument()
    expect(screen.getByText('Username')).toBeInTheDocument()
    expect(screen.getByText('test-user')).toBeInTheDocument()
  })

  test('should render user details with missing full name', () => {
    const userWithoutFullName = {
      ...mockUser,
      fullName: undefined,
    }
    mockUseUserDetailsContext.mockReturnValue({
      user: userWithoutFullName,
      groups: [],
    })

    render(<Component />)

    expect(screen.getByText('Full name')).toBeInTheDocument()
    expect(screen.getByText('-')).toBeInTheDocument()
  })
})
