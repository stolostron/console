/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import IdentitiesManagement from '../IdentitiesManagement'
import { User, Group } from '../../../../resources/rbac'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'

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

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
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
    <RecoilRoot>
      <MemoryRouter initialEntries={[`/users/${userId}`]}>
        <IdentitiesManagement />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('UserPage', () => {
  beforeEach(() => {
    mockUseRecoilValue.mockClear()
    mockUseSharedAtoms.mockClear()

    mockUseSharedAtoms.mockReturnValue({
      usersState: {} as any,
      groupsState: {} as any,
    } as any)
  })

  test('should render user not found error', () => {
    mockUseRecoilValue.mockReturnValue([])

    render(<Component userId="non-existent-user" />)

    expect(screen.getByText('Not found')).toBeInTheDocument()
    expect(screen.getByText('Back to users')).toBeInTheDocument()
  })

  test('should render user page with navigation tabs', () => {
    mockUseRecoilValue.mockReturnValueOnce([mockUser]).mockReturnValueOnce(mockGroups)

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
    mockUseRecoilValue.mockReturnValueOnce([userWithoutFullName]).mockReturnValueOnce(mockGroups)

    render(<Component />)

    expect(screen.getByRole('heading', { level: 1, name: 'test-user' })).toBeInTheDocument()
    expect(screen.getAllByText('test-user').length).toBeGreaterThan(0)
  })

  test('should find user by UID', () => {
    mockUseRecoilValue.mockReturnValueOnce([mockUser]).mockReturnValueOnce(mockGroups)

    render(<Component userId="test-user-uid" />)

    expect(screen.getByRole('heading', { level: 1, name: 'Test User' })).toBeInTheDocument()
  })
})
