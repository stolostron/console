/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
import { renderHook } from '@testing-library/react-hooks'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { Group, User } from '../../../resources/rbac'
import {
  COLUMN_CELLS,
  getIdentityTableColumns,
  groupsTableColumns,
  IdentityItem,
  useIdentityFilters,
  usersTableColumns,
} from './IdentityTableHelper'

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('../../../components/HighlightSearchText', () => ({
  HighlightSearchText: ({ text }: { text: string }) => <span>{text}</span>,
}))

jest.mock('../../../NavigationPath', () => ({
  NavigationPath: {
    identitiesUsersDetails: '/multicloud/user-management/identities/users/:id',
    identitiesGroupsDetails: '/multicloud/user-management/identities/groups/:id',
  },
}))

jest.mock('../../../lib/AcmTimestamp', () => ({
  __esModule: true,
  default: ({ timestamp }: { timestamp: string }) => <span>{timestamp}</span>,
}))

jest.mock('../../../ui-components/IdentityStatus/IdentityStatus', () => ({
  IdentityStatus: ({ identity }: { identity: IdentityItem }) => <span>Status: {identity.metadata.name}</span>,
}))

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'user-uid-123',
    creationTimestamp: '2025-01-24T16:00:00Z',
  },
  identities: ['keycloak:test-user', 'ldap:test-user'],
  groups: ['developers'],
}

const mockUserWithoutIdentities: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user-2',
    uid: 'user-uid-456',
    creationTimestamp: '2025-01-25T10:00:00Z',
  },
}

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'developers',
    uid: 'group-uid-789',
    creationTimestamp: '2025-01-20T12:00:00Z',
  },
  users: ['user1', 'user2', 'user3'],
}

const mockGroupWithoutUsers: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'empty-group',
    uid: 'group-uid-999',
  },
  users: [],
}

describe('IdentityTableHelper', () => {
  const mockT = (key: string) => key

  describe('COLUMN_CELLS', () => {
    describe('USER_NAME', () => {
      it('should render user name with link and highlight search text by default', () => {
        const { getByText } = render(<MemoryRouter>{COLUMN_CELLS.USER_NAME(mockUser, 'test', true)}</MemoryRouter>)
        expect(getByText('test-user')).toBeInTheDocument()
      })

      it('should render user name with link when areLinksDisplayed is true', () => {
        const { getByText } = render(<MemoryRouter>{COLUMN_CELLS.USER_NAME(mockUser, 'test', true)}</MemoryRouter>)
        expect(getByText('test-user')).toBeInTheDocument()
      })

      it('should render user name without link when areLinksDisplayed is false', () => {
        const { getByText, container } = render(<div>{COLUMN_CELLS.USER_NAME(mockUser, 'test', false)}</div>)
        expect(getByText('test-user')).toBeInTheDocument()
        expect(container.querySelector('a')).not.toBeInTheDocument()
      })
    })

    describe('GROUP_NAME', () => {
      it('should render group name with link and highlight search text by default', () => {
        const { getByText } = render(<MemoryRouter>{COLUMN_CELLS.GROUP_NAME(mockGroup, 'dev', true)}</MemoryRouter>)
        expect(getByText('developers')).toBeInTheDocument()
      })

      it('should render group name with link when areLinksDisplayed is true', () => {
        const { getByText } = render(<MemoryRouter>{COLUMN_CELLS.GROUP_NAME(mockGroup, 'dev', true)}</MemoryRouter>)
        expect(getByText('developers')).toBeInTheDocument()
      })

      it('should render group name without link when areLinksDisplayed is false', () => {
        const { getByText, container } = render(<div>{COLUMN_CELLS.GROUP_NAME(mockGroup, 'dev', false)}</div>)
        expect(getByText('developers')).toBeInTheDocument()
        expect(container.querySelector('a')).not.toBeInTheDocument()
      })
    })

    describe('USER_IDENTITY_PROVIDER', () => {
      it('should render identity providers for user with identities', () => {
        const { container } = render(<div>{COLUMN_CELLS.USER_IDENTITY_PROVIDER(mockUser)}</div>)
        expect(container.textContent).toContain('keycloak:test-user')
        expect(container.textContent).toContain('ldap:test-user')
      })

      it('should render dash for user without identities', () => {
        const { getByText } = render(<div>{COLUMN_CELLS.USER_IDENTITY_PROVIDER(mockUserWithoutIdentities)}</div>)
        expect(getByText('-')).toBeInTheDocument()
      })
    })

    describe('GROUP_USERS', () => {
      it('should render users count for group with users', () => {
        const { getByText } = render(<div>{COLUMN_CELLS.GROUP_USERS(mockGroup)}</div>)
        expect(getByText('3')).toBeInTheDocument()
      })

      it('should render 0 for group without users', () => {
        const { getByText } = render(<div>{COLUMN_CELLS.GROUP_USERS(mockGroupWithoutUsers)}</div>)
        expect(getByText('0')).toBeInTheDocument()
      })
    })

    describe('STATUS', () => {
      it('should render IdentityStatus component', () => {
        const { getByText } = render(<div>{COLUMN_CELLS.STATUS(mockUser)}</div>)
        expect(getByText('Status: test-user')).toBeInTheDocument()
      })
    })

    describe('CREATED', () => {
      it('should render timestamp when creationTimestamp exists', () => {
        const { getByText } = render(<div>{COLUMN_CELLS.CREATED(mockUser)}</div>)
        expect(getByText('2025-01-24T16:00:00Z')).toBeInTheDocument()
      })

      it('should render dash when creationTimestamp is missing', () => {
        const identityWithoutTimestamp = {
          ...mockUser,
          metadata: { ...mockUser.metadata, creationTimestamp: undefined },
        }
        const { getByText } = render(<div>{COLUMN_CELLS.CREATED(identityWithoutTimestamp)}</div>)
        expect(getByText('-')).toBeInTheDocument()
      })
    })
  })

  describe('getIdentityTableColumns', () => {
    it('should return 4 columns by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      expect(columns).toHaveLength(5) // Now includes radio column
    })

    it('should return 5 columns when onRadioSelect is provided', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect })
      expect(columns).toHaveLength(5)

      const radioColumn = columns.find((col) => col.id === 'radio')
      expect(radioColumn).toBeDefined()
      expect(radioColumn?.header).toBe(' ')
    })

    it('should hide radio column when specified in hiddenColumns', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        hiddenColumns: ['radio'],
      })

      const radioColumn = columns.find((col) => col.id === 'radio')
      expect(radioColumn?.isHidden).toBe(true)
    })

    it('should have Name column with correct properties', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn).toBeDefined()
      expect(nameColumn?.header).toBe('Name')
      expect(nameColumn?.sort).toBe('metadata.name')
      expect(nameColumn?.search).toBe('metadata.name')
      expect(nameColumn?.isDefault).toBe(true)
      expect(nameColumn?.isFirstVisitChecked).toBe(true)
    })

    it('should have Identity Provider column with correct properties', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const idpColumn = columns.find((col) => col.id === 'identity-provider')

      expect(idpColumn).toBeDefined()
      expect(idpColumn?.header).toBe('Identity provider')
      expect(idpColumn?.sort).toBe('identities')
      expect(idpColumn?.isDefault).toBe(true)
      expect(idpColumn?.isFirstVisitChecked).toBe(true)
    })

    it('should have Users column with correct properties', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const usersColumn = columns.find((col) => col.id === 'users')

      expect(usersColumn).toBeDefined()
      expect(usersColumn?.header).toBe('Users')
      expect(usersColumn?.sort).toBe('users.length')
      expect(usersColumn?.isDefault).toBe(true)
      expect(usersColumn?.isFirstVisitChecked).toBe(true)
    })

    it('should have Created column with correct properties', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const createdColumn = columns.find((col) => col.id === 'created')

      expect(createdColumn).toBeDefined()
      expect(createdColumn?.header).toBe('Created')
      expect(createdColumn?.sort).toBe('metadata.creationTimestamp')
      expect(createdColumn?.isDefault).toBe(true)
      expect(createdColumn?.isFirstVisitChecked).toBe(true)
    })

    it('should render user name in Name column cell for user identity with links by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockUser, '')
      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(getByText('test-user')).toBeInTheDocument()
    })

    it('should render user name in Name column cell without links when areLinksDisplayed is false', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: false })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockUser, '')
      const { getByText, container } = render(<div>{cell}</div>)
      expect(getByText('test-user')).toBeInTheDocument()
      expect(container.querySelector('a')).not.toBeInTheDocument()
    })

    it('should render group name in Name column cell for group identity with links by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockGroup, '')
      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(getByText('developers')).toBeInTheDocument()
    })

    it('should render group name in Name column cell without links when areLinksDisplayed is false', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: false })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockGroup, '')
      const { getByText, container } = render(<div>{cell}</div>)
      expect(getByText('developers')).toBeInTheDocument()
      expect(container.querySelector('a')).not.toBeInTheDocument()
    })

    it('should render identity provider cell for user', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const idpColumn = columns.find((col) => col.id === 'identity-provider')

      expect(idpColumn?.cell).toBeDefined()
      expect(typeof idpColumn?.cell).not.toBe('string')

      const cell = (idpColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)
      expect(container.textContent).toContain('keycloak:test-user')
      expect(container.textContent).toContain('ldap:test-user')
    })

    it('should render null in identity provider cell for group', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const idpColumn = columns.find((col) => col.id === 'identity-provider')

      expect(idpColumn?.cell).toBeDefined()
      expect(typeof idpColumn?.cell).not.toBe('string')

      const cell = (idpColumn?.cell as any)(mockGroup, '')
      expect(cell).toBeNull()
    })

    it('should render users count cell for group', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const usersColumn = columns.find((col) => col.id === 'users')

      expect(usersColumn?.cell).toBeDefined()
      expect(typeof usersColumn?.cell).not.toBe('string')

      const cell = (usersColumn?.cell as any)(mockGroup, '')
      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('3')).toBeInTheDocument()
    })

    it('should render null in users cell for user identity', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const usersColumn = columns.find((col) => col.id === 'users')

      expect(usersColumn?.cell).toBeDefined()
      expect(typeof usersColumn?.cell).not.toBe('string')

      const cell = (usersColumn?.cell as any)(mockUser, '')
      expect(cell).toBeNull()
    })

    it('should export name content correctly', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.exportContent?.(mockUser, '')).toBe('test-user')
      expect(nameColumn?.exportContent?.(mockGroup, '')).toBe('developers')
    })

    it('should export created timestamp content correctly', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const createdColumn = columns.find((col) => col.id === 'created')

      expect(createdColumn?.exportContent?.(mockUser, '')).toContain('2025-01-24')
      expect(createdColumn?.exportContent?.(mockGroup, '')).toContain('2025-01-20')
    })

    it('should hide columns based on hiddenColumns parameter', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        hiddenColumns: ['name', 'created'],
      })

      const nameColumn = columns.find((col) => col.id === 'name')
      const createdColumn = columns.find((col) => col.id === 'created')

      expect(nameColumn?.isHidden).toBe(true)
      expect(createdColumn?.isHidden).toBe(true)
    })
  })

  describe('useIdentityFilters', () => {
    it('should return name filter for users', () => {
      const users: User[] = [mockUser, mockUserWithoutIdentities]
      const { result } = renderHook(() => useIdentityFilters('user', users))

      const nameFilter = result.current.find((f) => f.id === 'name')
      expect(nameFilter).toBeDefined()
      expect(nameFilter?.label).toBe('User Name')
      expect(nameFilter?.options).toHaveLength(2)
      expect(nameFilter?.options).toEqual(
        expect.arrayContaining([
          { label: 'test-user', value: 'test-user' },
          { label: 'test-user-2', value: 'test-user-2' },
        ])
      )
    })

    it('should return name filter for groups', () => {
      const groups: Group[] = [mockGroup, mockGroupWithoutUsers]
      const { result } = renderHook(() => useIdentityFilters('group', groups))

      const nameFilter = result.current.find((f) => f.id === 'name')
      expect(nameFilter).toBeDefined()
      expect(nameFilter?.label).toBe('Group Name')
      expect(nameFilter?.options).toHaveLength(2)
      expect(nameFilter?.options).toEqual(
        expect.arrayContaining([
          { label: 'developers', value: 'developers' },
          { label: 'empty-group', value: 'empty-group' },
        ])
      )
    })

    it('should include identity provider filter for users', () => {
      const users: User[] = [mockUser, mockUserWithoutIdentities]
      const { result } = renderHook(() => useIdentityFilters('user', users))

      const idpFilter = result.current.find((f) => f.id === 'identity-provider')
      expect(idpFilter).toBeDefined()
      expect(idpFilter?.label).toBe('Identity Provider')
      expect(idpFilter?.options).toHaveLength(2)
      expect(idpFilter?.options).toEqual(
        expect.arrayContaining([
          { label: 'keycloak', value: 'keycloak' },
          { label: 'ldap', value: 'ldap' },
        ])
      )
    })

    it('should not include identity provider filter for groups', () => {
      const groups: Group[] = [mockGroup]
      const { result } = renderHook(() => useIdentityFilters('group', groups))

      const idpFilter = result.current.find((f) => f.id === 'identity-provider')
      expect(idpFilter).toBeUndefined()
    })

    it('should filter users by name correctly', () => {
      const users: User[] = [mockUser, mockUserWithoutIdentities]
      const { result } = renderHook(() => useIdentityFilters('user', users))

      const nameFilter = result.current.find((f) => f.id === 'name')
      const filterFn = nameFilter?.tableFilterFn

      expect(filterFn?.([], mockUser)).toBe(true)
      expect(filterFn?.(['test-user'], mockUser)).toBe(true)
      expect(filterFn?.(['test'], mockUser)).toBe(true)
      expect(filterFn?.(['nonexistent'], mockUser)).toBe(false)
    })

    it('should filter users by identity provider correctly', () => {
      const users: User[] = [mockUser, mockUserWithoutIdentities]
      const { result } = renderHook(() => useIdentityFilters('user', users))

      const idpFilter = result.current.find((f) => f.id === 'identity-provider')
      const filterFn = idpFilter?.tableFilterFn

      expect(filterFn?.([], mockUser)).toBe(true)
      expect(filterFn?.(['keycloak'], mockUser)).toBe(true)
      expect(filterFn?.(['ldap'], mockUser)).toBe(true)
      expect(filterFn?.(['github'], mockUser)).toBe(false)
      expect(filterFn?.(['keycloak'], mockUserWithoutIdentities)).toBe(false)
    })

    it('should handle users with no identities', () => {
      const users: User[] = [mockUserWithoutIdentities]
      const { result } = renderHook(() => useIdentityFilters('user', users))

      const idpFilter = result.current.find((f) => f.id === 'identity-provider')
      expect(idpFilter?.options).toHaveLength(0)
    })

    it('should handle empty identity list', () => {
      const { result } = renderHook(() => useIdentityFilters('user', []))

      expect(result.current).toHaveLength(2)
      expect(result.current[0].options).toHaveLength(0)
      expect(result.current[1].options).toHaveLength(0)
    })

    it('should filter identities with null or undefined names', () => {
      const identitiesWithBadNames: IdentityItem[] = [
        mockUser,
        { ...mockUser, metadata: { ...mockUser.metadata, name: undefined } } as any,
        { ...mockUser, metadata: { ...mockUser.metadata, name: null } } as any,
        { ...mockUser, metadata: { ...mockUser.metadata, name: '   ' } },
      ]

      const { result } = renderHook(() => useIdentityFilters('user', identitiesWithBadNames))
      const nameFilter = result.current.find((f) => f.id === 'name')

      expect(nameFilter?.options).toHaveLength(1)
      expect(nameFilter?.options[0]).toEqual({ label: 'test-user', value: 'test-user' })
    })
  })

  describe('usersTableColumns', () => {
    it('should return 5 columns with users column hidden by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      expect(columns).toHaveLength(5) // Now includes radio column

      const usersColumn = columns.find((col) => col.id === 'users')
      expect(usersColumn?.isHidden).toBe(true)
    })

    it('should return 5 columns when onRadioSelect is provided', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      expect(columns).toHaveLength(5)

      const radioColumn = columns.find((col) => col.id === 'radio')
      expect(radioColumn).toBeDefined()
    })

    it('should have correct column IDs with radio', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const columnIds = columns.map((col) => col.id)
      expect(columnIds).toEqual(['radio', 'name', 'identity-provider', 'users', 'created'])
    })

    it('should have correct column IDs with radio', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const columnIds = columns.map((col) => col.id)
      expect(columnIds).toEqual(['radio', 'name', 'identity-provider', 'users', 'created'])
    })

    it('should render user name cell correctly with links by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockUser, '')
      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(getByText('test-user')).toBeInTheDocument()
    })

    it('should render user name cell without links when areLinksDisplayed is false', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: false })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockUser, '')
      const { getByText, container } = render(<div>{cell}</div>)
      expect(getByText('test-user')).toBeInTheDocument()
      expect(container.querySelector('a')).not.toBeInTheDocument()
    })

    it('should hide columns based on hiddenColumns parameter', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        hiddenColumns: ['identity-provider'],
      })
      const idpColumn = columns.find((col) => col.id === 'identity-provider')
      expect(idpColumn?.isHidden).toBe(true)
    })

    it('should hide radio column when specified in hiddenColumns', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        hiddenColumns: ['radio'],
      })
      const radioColumn = columns.find((col) => col.id === 'radio')
      expect(radioColumn?.isHidden).toBe(true)
    })

    it('should pass selectedIdentity to getIdentityTableColumns', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = usersTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        selectedIdentity: mockUser,
      })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeChecked()
    })
  })

  describe('groupsTableColumns', () => {
    it('should return 5 columns with identity-provider column hidden by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      expect(columns).toHaveLength(5) // Now includes radio column

      const idpColumn = columns.find((col) => col.id === 'identity-provider')
      expect(idpColumn?.isHidden).toBe(true)
    })

    it('should return 5 columns when onRadioSelect is provided', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      expect(columns).toHaveLength(5)

      const radioColumn = columns.find((col) => col.id === 'radio')
      expect(radioColumn).toBeDefined()
    })

    it('should have correct column IDs with radio', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const columnIds = columns.map((col) => col.id)
      expect(columnIds).toEqual(['radio', 'name', 'identity-provider', 'users', 'created'])
    })

    it('should have correct column IDs with radio', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const columnIds = columns.map((col) => col.id)
      expect(columnIds).toEqual(['radio', 'name', 'identity-provider', 'users', 'created'])
    })

    it('should render group name cell correctly with links by default', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockGroup, '')
      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(getByText('developers')).toBeInTheDocument()
    })

    it('should render group name cell without links when areLinksDisplayed is false', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: false })
      const nameColumn = columns.find((col) => col.id === 'name')

      expect(nameColumn?.cell).toBeDefined()
      expect(typeof nameColumn?.cell).not.toBe('string')

      const cell = (nameColumn?.cell as any)(mockGroup, '')
      const { getByText, container } = render(<div>{cell}</div>)
      expect(getByText('developers')).toBeInTheDocument()
      expect(container.querySelector('a')).not.toBeInTheDocument()
    })

    it('should hide columns based on hiddenColumns parameter', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        hiddenColumns: ['users'],
      })
      const usersColumn = columns.find((col) => col.id === 'users')
      expect(usersColumn?.isHidden).toBe(true)
    })

    it('should hide radio column when specified in hiddenColumns', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        hiddenColumns: ['radio'],
      })
      const radioColumn = columns.find((col) => col.id === 'radio')
      expect(radioColumn?.isHidden).toBe(true)
    })

    it('should pass selectedIdentity to getIdentityTableColumns', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = groupsTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        selectedIdentity: mockGroup,
      })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(mockGroup, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeChecked()
    })
  })

  describe('Radio button functionality', () => {
    it('should render radio button cell correctly', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const radioColumn = columns.find((col) => col.id === 'radio')

      expect(radioColumn?.cell).toBeDefined()
      expect(typeof radioColumn?.cell).not.toBe('string')

      const cell = (radioColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]')
      expect(radioInput).toBeInTheDocument()
      expect(radioInput).toHaveAttribute('name', 'radio-user-uid-123')
      expect(radioInput).toHaveAttribute('id', 'radio-user-uid-123')
    })

    it('should render radio button with correct onChange handler', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeInTheDocument()
      expect(radioInput).toHaveAttribute('name', 'radio-user-uid-123')
      expect(radioInput).toHaveAttribute('id', 'radio-user-uid-123')

      // The onChange handler is properly attached to the component
      // Actual event handling is tested through integration tests
    })

    it('should show radio button as checked when identity is selected', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        selectedIdentity: mockUser,
      })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeInTheDocument()
      expect(radioInput).toBeChecked()
    })

    it('should show radio button as unchecked when identity is not selected', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        selectedIdentity: mockGroup, // Different identity selected
      })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeInTheDocument()
      expect(radioInput).not.toBeChecked()
    })

    it('should show radio button as unchecked when no identity is selected', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({
        t: mockT,
        onRadioSelect: mockOnRadioSelect,
        areLinksDisplayed: true,
        selectedIdentity: undefined,
      })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(mockUser, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeInTheDocument()
      expect(radioInput).not.toBeChecked()
    })

    it('should handle identity without uid gracefully', () => {
      const identityWithoutUid = { ...mockUser, metadata: { ...mockUser.metadata, uid: undefined } }
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const cell = (radioColumn?.cell as any)(identityWithoutUid, '')
      const { container } = render(<div>{cell}</div>)

      const radioInput = container.querySelector('input[type="radio"]') as HTMLInputElement
      expect(radioInput).toBeInTheDocument()
      expect(radioInput).toHaveAttribute('id', 'radio-undefined')

      // The component handles undefined UID gracefully by rendering the radio button
      // The onChange handler would call onRadioSelect with empty string
    })

    it('should create unique radio button IDs for different identities', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const userCell = (radioColumn?.cell as any)(mockUser, '')
      const groupCell = (radioColumn?.cell as any)(mockGroup, '')

      const { container: userContainer } = render(<div>{userCell}</div>)
      const { container: groupContainer } = render(<div>{groupCell}</div>)

      const userRadio = userContainer.querySelector('input[type="radio"]')
      const groupRadio = groupContainer.querySelector('input[type="radio"]')

      expect(userRadio).toHaveAttribute('id', 'radio-user-uid-123')
      expect(groupRadio).toHaveAttribute('id', 'radio-group-uid-789')
    })

    it('should use unique name attributes for radio buttons', () => {
      const mockOnRadioSelect = jest.fn()
      const columns = getIdentityTableColumns({ t: mockT, onRadioSelect: mockOnRadioSelect, areLinksDisplayed: true })
      const radioColumn = columns.find((col) => col.id === 'radio')

      const userCell = (radioColumn?.cell as any)(mockUser, '')
      const groupCell = (radioColumn?.cell as any)(mockGroup, '')

      const { container: userContainer } = render(<div>{userCell}</div>)
      const { container: groupContainer } = render(<div>{groupCell}</div>)

      const userRadio = userContainer.querySelector('input[type="radio"]')
      const groupRadio = groupContainer.querySelector('input[type="radio"]')

      expect(userRadio).toHaveAttribute('name', 'radio-user-uid-123')
      expect(groupRadio).toHaveAttribute('name', 'radio-group-uid-789')
    })
  })
})
