/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import IdentitiesManagement from '../IdentitiesManagement'
import { User, Group } from '../../../../resources/rbac'
import { useSharedValue, useSharedAtoms } from '../../../../shared-atoms'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => {
      const translations: { [key: string]: string } = {
        'button.backToUsers': 'Back to users',
        'Not found': 'Not found',
      }
      return translations[key] || key
    },
  }),
}))

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

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

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    users: ['test-user'],
  },
]

function Component({ userId = 'test-user' }: { userId?: string }) {
  return (
    <StateProvider>
      <MemoryRouter initialEntries={[`/users/${userId}`]}>
        <IdentitiesManagement />
      </MemoryRouter>
    </StateProvider>
  )
}

describe('UserPage', () => {
  beforeEach(() => {
    mockUseSharedValue.mockClear()
    mockUseSharedAtoms.mockClear()

    mockUseSharedAtoms.mockReturnValue({
      usersState: {} as any,
      groupsState: {} as any,
      multiclusterRoleAssignmentState: {} as any,
      isDirectAuthenticationEnabledState: {} as any,
    } as any)
  })

  test('should render user not found error', () => {
    mockUseSharedValue.mockReturnValue([])

    render(<Component userId="non-existent-user" />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('Back to users')).toBeInTheDocument()
  })

  test('should render user page with navigation tabs', () => {
    mockUseSharedValue
      .mockReturnValueOnce(false) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockUser]) // useMergedUsers: usersState
      .mockReturnValueOnce([]) // useMergedUsers: mraState
      .mockReturnValueOnce(mockGroups) // UserPage: groupsState
      .mockReturnValueOnce(false) // UserPage: isDirectAuth

    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
    expect(screen.getAllByText('test-user').length).toBeGreaterThan(0)
    expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'YAML' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Role assignments' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Groups' })).toBeInTheDocument()
  })

  test('should render user page with unknown user name', () => {
    const userWithoutFullName = {
      ...mockUser,
      fullName: undefined,
    }
    mockUseSharedValue
      .mockReturnValueOnce(false) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([userWithoutFullName]) // useMergedUsers: usersState
      .mockReturnValueOnce([]) // useMergedUsers: mraState
      .mockReturnValueOnce(mockGroups) // UserPage: groupsState
      .mockReturnValueOnce(false) // UserPage: isDirectAuth

    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'test-user' })).toBeInTheDocument()
    expect(screen.getAllByText('test-user').length).toBeGreaterThan(0)
  })

  test('should find user by UID', () => {
    mockUseSharedValue
      .mockReturnValueOnce(false) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockUser]) // useMergedUsers: usersState
      .mockReturnValueOnce([]) // useMergedUsers: mraState
      .mockReturnValueOnce(mockGroups) // UserPage: groupsState
      .mockReturnValueOnce(false) // UserPage: isDirectAuth

    render(<Component userId="test-user-uid" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
  })

  test('should hide YAML and Groups tabs when isDirectAuthenticationEnabled', () => {
    mockUseSharedValue
      .mockReturnValueOnce(true) // IdentitiesManagement: isDirectAuth
      .mockReturnValueOnce([mockUser]) // useMergedUsers: usersState
      .mockReturnValueOnce([]) // useMergedUsers: mraState
      .mockReturnValueOnce(mockGroups) // UserPage: groupsState
      .mockReturnValueOnce(true) // UserPage: isDirectAuth

    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Details' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Role assignments' })).toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'YAML' })).not.toBeInTheDocument()
    expect(screen.queryByRole('tab', { name: 'Groups' })).not.toBeInTheDocument()
  })
})
