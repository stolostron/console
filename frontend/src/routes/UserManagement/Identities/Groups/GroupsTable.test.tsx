/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../../lib/nock-util'
import { GroupsTable } from './GroupsTable'
import { Group as RbacGroup } from '../../../../resources/rbac'
import { useQuery } from '../../../../lib/useQuery'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../../lib/useQuery', () => ({
  useQuery: jest.fn(),
}))

jest.mock('../../../../lib/rbac-util', () => ({
  rbacCreate: jest.fn(() => ({ apiVersion: 'rbac.authorization.k8s.io/v1', kind: 'ClusterRole' })),
  useIsAnyNamespaceAuthorized: jest.fn(() => true),
}))

jest.mock('../../../../ui-components/IdentityStatus/IdentityStatus', () => ({
  IdentityStatus: ({ identity }: { identity: any }) => (
    <span data-testid="identity-status">{identity.kind === 'Group' ? 'Active' : 'Inactive'}</span>
  ),
  isIdentityActive: jest.fn(() => true),
}))

const mockUseQuery = useQuery as jest.MockedFunction<typeof useQuery>

const mockGroups: RbacGroup[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers-uid',
      creationTimestamp: '2025-01-24T16:00:00Z',
    },
    users: ['user1', 'user2'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'admins',
      uid: 'admins-uid',
      creationTimestamp: '2025-01-24T15:00:00Z',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'viewers',
      uid: 'viewers-uid',
      creationTimestamp: '2025-01-24T14:00:00Z',
    },
    users: [],
  },
]

function Component() {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupsTable />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('GroupsTable', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    mockUseQuery.mockClear()
  })

  test('should render loading state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByText('Loading')).toBeInTheDocument()
  })

  test('should render groups table with data', () => {
    mockUseQuery.mockReturnValue({
      data: mockGroups,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByText('Name')).toBeInTheDocument()
    expect(screen.getByText('Users')).toBeInTheDocument()
    expect(screen.getByText('Status')).toBeInTheDocument()
    expect(screen.getByText('Created')).toBeInTheDocument()

    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.getByText('viewers')).toBeInTheDocument()

    // Check user counts
    expect(screen.getByText('2')).toBeInTheDocument()
    expect(screen.getByText('1')).toBeInTheDocument()
    // Check that viewers group exists
    expect(screen.getByText('viewers')).toBeInTheDocument()

    expect(screen.getByText('developers')).toBeInTheDocument()
    expect(screen.getByText('admins')).toBeInTheDocument()
    expect(screen.getByText('viewers')).toBeInTheDocument()
  })

  test('should render empty state when no groups', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    expect(screen.getByText('In order to view Users, add Identity provider')).toBeInTheDocument()
    expect(screen.getByText('Add Identity provider')).toBeInTheDocument()
  })

  test('should render error state', () => {
    mockUseQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: new Error('Failed to fetch groups'),
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)
    expect(screen.getByText('In order to view Users, add Identity provider')).toBeInTheDocument()
  })

  test('should sort groups by name', () => {
    mockUseQuery.mockReturnValue({
      data: mockGroups,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    // Groups should be sorted alphabetically: admins, developers, viewers
    const groupNames = screen.getAllByText(/^(admins|developers|viewers)$/)
    expect(groupNames[0]).toHaveTextContent('admins')
    expect(groupNames[1]).toHaveTextContent('developers')
    expect(groupNames[2]).toHaveTextContent('viewers')
  })

  test('should show correct user counts for each group', () => {
    mockUseQuery.mockReturnValue({
      data: mockGroups,
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    const developersRow = screen.getByText('developers').closest('tr')
    const adminsRow = screen.getByText('admins').closest('tr')
    const viewersRow = screen.getByText('viewers').closest('tr')

    expect(developersRow).toHaveTextContent('2')
    expect(adminsRow).toHaveTextContent('1')
    expect(viewersRow).toHaveTextContent('viewers')
  })

  test('should render identity provider button when authorized', () => {
    mockUseQuery.mockReturnValue({
      data: [],
      loading: false,
      error: undefined,
      startPolling: jest.fn(),
      stopPolling: jest.fn(),
      refresh: jest.fn(),
    })

    render(<Component />)

    const addButton = screen.getByText('Add Identity provider')
    expect(addButton).toBeInTheDocument()
    expect(addButton).not.toBeDisabled()
  })
})
