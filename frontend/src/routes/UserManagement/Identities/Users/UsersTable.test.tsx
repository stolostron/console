/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import { ButtonVariant } from '@patternfly/react-core'
import { MemoryRouter } from 'react-router'
import { StateProvider } from '~/lib/state-provider'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { User } from '../../../../resources/rbac'
import { IAcmTableButtonAction } from '../../../../ui-components/AcmTable/AcmTableTypes'
import { UsersTable } from './UsersTable'
import { useSharedValue, useSharedAtoms } from '../../../../shared-atoms'
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import { useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'

jest.mock('@stolostron/multicluster-sdk/lib/api/useFleetSearch', () => ({
  useFleetSearch: jest.fn(),
}))

jest.mock('../../../Search/search-sdk/search-sdk', () => ({
  useSearchResultCountQuery: jest.fn(),
  SearchResultItemsDocument: 'SearchResultItemsDocument',
}))

jest.mock('../../../../hooks/use-local-hub', () => ({
  useLocalHubName: () => 'local-cluster',
}))

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../../shared-atoms', () => ({
  useSharedValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseSharedValue = useSharedValue as jest.MockedFunction<typeof useSharedValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockUseFleetSearch = useFleetSearch as jest.MockedFunction<typeof useFleetSearch>
const mockUseSearchResultCountQuery = useSearchResultCountQuery as jest.Mock

type FleetSearchInput = {
  orderBy?: string
  filters?: { property: string; values?: Array<string | null> }[]
}

const mraAtom = Symbol('multiclusterRoleAssignmentState')

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'alice.trask',
      uid: 'alice.trask-uid',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: {
      name: 'bob.levy',
      uid: 'bob.levy-uid',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
  },
]

const mockMras: MulticlusterRoleAssignment[] = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-charlie', creationTimestamp: '2023-02-01T00:00:00Z' },
    spec: {
      subject: { kind: 'User', name: 'charlie.new' },
      roleAssignments: [],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-alice', creationTimestamp: '2023-02-02T00:00:00Z' },
    spec: {
      subject: { kind: 'User', name: 'alice.trask' },
      roleAssignments: [],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-group', creationTimestamp: '2023-02-03T00:00:00Z' },
    spec: {
      subject: { kind: 'Group', name: 'ops-team' },
      roleAssignments: [],
    },
  },
]

function Component(props: any = {}) {
  return (
    <StateProvider>
      <MemoryRouter>
        <UsersTable {...props} />
      </MemoryRouter>
    </StateProvider>
  )
}

function mockSearch(users: User[]) {
  mockUseFleetSearch.mockImplementation((input) => {
    const searchInput = input as FleetSearchInput | undefined
    if (!searchInput) return [undefined, true, undefined, jest.fn()]
    if (searchInput.orderBy) return [users, true, undefined, jest.fn()]
    const names = new Set(searchInput.filters?.find((filter) => filter.property === 'name')?.values ?? [])
    return [users.filter((user) => names.has(user.metadata.name ?? '')), true, undefined, jest.fn()]
  })

  mockUseSearchResultCountQuery.mockImplementation(
    (options?: { skip?: boolean; variables?: { input?: FleetSearchInput[] } }) => {
      if (options?.skip) return { data: undefined, loading: false, error: undefined, refetch: jest.fn() }
      const inputs = options?.variables?.input ?? []
      const ranked = inputs.some((input) =>
        input.filters?.some((filter) => {
          const value = filter.values?.[0]
          return typeof value === 'string' && (value.startsWith('<') || value.startsWith('>'))
        })
      )
      if (ranked) {
        return {
          data: { searchResult: inputs.map(() => ({ count: 0 })) },
          loading: false,
          error: undefined,
          refetch: jest.fn(),
        }
      }
      return {
        data: { searchResult: [{ count: users.length }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      }
    }
  )
}

function setupMocks(users: User[] = mockUsers, mras: MulticlusterRoleAssignment[] = mockMras) {
  mockUseSharedAtoms.mockReturnValue({
    multiclusterRoleAssignmentState: mraAtom,
  } as any)

  mockUseSharedValue.mockImplementation((atom: any) => {
    if (atom === mraAtom) return mras
    return []
  })
  mockSearch(users)
}

describe('UsersTable', () => {
  beforeEach(() => setupMocks())

  test('should render users table with mock users', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  test('should query Search with hub User filters and subscription', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
    })
    expect(mockUseFleetSearch).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: 'name asc',
        filters: expect.arrayContaining([
          { property: 'kind', values: ['User'] },
          { property: 'apigroup', values: ['user.openshift.io'] },
          { property: '_hubClusterResource', values: ['*'] },
        ]),
      }),
      true
    )
  })

  test('should render with hiddenColumns prop', async () => {
    render(<Component hiddenColumns={['identity-provider']} />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  test('should render with areLinksDisplayed prop set to false', async () => {
    render(<Component areLinksDisplayed={false} />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  test('should render with setSelectedUser callback', async () => {
    const mockSetSelectedUser = jest.fn()
    render(<Component setSelectedUser={mockSetSelectedUser} />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
    })

    expect(mockSetSelectedUser).toBeDefined()
  })

  test('should render with selectedUser prop', async () => {
    const selectedUser = mockUsers[0]
    render(<Component selectedUser={selectedUser} />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  test('should show MRA-derived user not already in Search', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
      expect(screen.getByText('charlie.new')).toBeInTheDocument()
    })
  })

  test('should not duplicate user that exists in both Search and MRA', async () => {
    render(<Component />)

    await waitFor(() => {
      const aliceElements = screen.getAllByText('alice.trask')
      expect(aliceElements).toHaveLength(1)
    })
  })

  test('should not show MRA subjects with kind Group in users table', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('charlie.new')).toBeInTheDocument()
      expect(screen.queryByText('ops-team')).not.toBeInTheDocument()
    })
  })

  test('should render only Search users when MRA state is empty', async () => {
    setupMocks(mockUsers, [])

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('alice.trask')).toBeInTheDocument()
      expect(screen.getByText('bob.levy')).toBeInTheDocument()
    })
  })

  describe('empty state create button', () => {
    beforeEach(() => {
      setupMocks([], [])
    })

    test('should not show create button in empty state by default', async () => {
      render(<Component />)

      await waitFor(() => {
        expect(screen.getByText('In order to view Users, add Identity provider')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: 'Create user' })).not.toBeInTheDocument()
    })

    test('should show create button in empty state when isCreateButtonDisplayed is true', async () => {
      const mockOnCreateClick = jest.fn()
      render(<Component isCreateButtonDisplayed onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
      })
    })

    test('should show custom button text when createButtonText is provided', async () => {
      const mockOnCreateClick = jest.fn()
      render(<Component isCreateButtonDisplayed createButtonText="Add user" onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add user' })).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: 'Create user' })).not.toBeInTheDocument()
    })

    test('should call onCreateClick when create button is clicked', async () => {
      const mockOnCreateClick = jest.fn()
      render(<Component isCreateButtonDisplayed onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
      })

      screen.getByRole('button', { name: 'Create user' }).click()
      expect(mockOnCreateClick).toHaveBeenCalledTimes(1)
    })

    test('should not show create button when isCreateButtonDisplayed is true but onCreateClick is not provided', async () => {
      render(<Component isCreateButtonDisplayed />)

      await waitFor(() => {
        expect(screen.getByText('In order to view Users, add Identity provider')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: 'Create user' })).not.toBeInTheDocument()
    })
  })

  describe('tableActionButtons', () => {
    test('should render table action buttons when provided', async () => {
      const mockClick = jest.fn()
      const tableActionButtons: IAcmTableButtonAction[] = [
        {
          id: 'create-pre-authorized-user',
          title: 'Create user',
          click: mockClick,
          variant: ButtonVariant.primary,
        },
      ]
      render(<Component tableActionButtons={tableActionButtons} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
      })
    })

    test('should call click handler when table action button is clicked', async () => {
      const mockClick = jest.fn()
      const tableActionButtons: IAcmTableButtonAction[] = [
        {
          id: 'create-pre-authorized-user',
          title: 'Create user',
          click: mockClick,
          variant: ButtonVariant.primary,
        },
      ]
      render(<Component tableActionButtons={tableActionButtons} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
      })

      screen.getByRole('button', { name: 'Create user' }).click()
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    test('should not render table action buttons when not provided', async () => {
      render(<Component />)

      await waitFor(() => {
        expect(screen.getByText('alice.trask')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: 'Create user' })).not.toBeInTheDocument()
    })
  })
})
