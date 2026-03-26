/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { Group, User } from '../../../resources/rbac'
import { useMergedGroups, useMergedUsers } from '../../../routes/UserManagement/Identities/useMergedIdentities'
import { useRecoilValue, useSharedAtoms } from '../../../shared-recoil'
import { IdentitiesList } from './IdentitiesList'

jest.mock('../../../routes/UserManagement/Identities/useMergedIdentities', () => ({
  useMergedUsers: jest.fn(),
  useMergedGroups: jest.fn(),
}))

const mockUseMergedUsers = useMergedUsers as jest.MockedFunction<typeof useMergedUsers>
const mockUseMergedGroups = useMergedGroups as jest.MockedFunction<typeof useMergedGroups>

const mockUsers: User[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: { name: 'alice', uid: 'alice-uid', creationTimestamp: '2025-01-01T00:00:00Z' },
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'User',
    metadata: { name: 'bob-mra', uid: 'bob-mra', creationTimestamp: '2025-02-01T00:00:00Z' },
  },
]

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'developers', uid: 'dev-uid', creationTimestamp: '2025-01-01T00:00:00Z' },
    users: ['alice'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: { name: 'ops-mra', uid: 'ops-mra', creationTimestamp: '2025-02-01T00:00:00Z' },
    users: [],
  },
]

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>
const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>

const usersAtom = Symbol('usersState')
const groupsAtom = Symbol('groupsState')
const isDirectAuthAtom = Symbol('isDirectAuthenticationEnabledState')

function setupMocks(isDirectAuthenticationEnabled = false) {
  mockUseSharedAtoms.mockReturnValue({
    usersState: usersAtom,
    groupsState: groupsAtom,
    isDirectAuthenticationEnabledState: isDirectAuthAtom,
  } as any)

  mockUseRecoilValue.mockImplementation((atom: unknown) => {
    if (atom === usersAtom) return []
    if (atom === groupsAtom) return []
    if (atom === isDirectAuthAtom) return isDirectAuthenticationEnabled
    return undefined
  })
}

jest.mock('../../../routes/UserManagement/Identities/Users/UsersTable', () => ({
  UsersTable: (props: any) => (
    <div
      id="users-table"
      data-testid="users-table"
      data-arelinks={props.areLinksDisplayed}
      data-additionalusers={JSON.stringify((props.additionalUsers ?? []).map((u: any) => u.metadata.name))}
      data-iscreatebuttondisplayed={String(!!props.isCreateButtonDisplayed)}
      data-createbuttontext={props.createButtonText ?? ''}
    >
      Users Table {props.areLinksDisplayed === false ? '(No Links)' : '(With Links)'}
      {props.selectedUser && ` - Selected: ${props.selectedUser.metadata.name}`}
      {props.setSelectedUser && (
        <button
          onClick={() => {
            const mockUser = { metadata: { name: 'test-user', uid: 'test-user-uid' } }
            props.setSelectedUser(mockUser)
          }}
        >
          Select User
        </button>
      )}
      {props.onCreateClick && <button onClick={props.onCreateClick}>Create User Action</button>}
      {props.tableActionButtons?.map((btn: any) => (
        <button key={btn.id} onClick={btn.click}>
          {btn.title}
        </button>
      ))}
    </div>
  ),
}))

jest.mock('../../../routes/UserManagement/Identities/Groups/GroupsTable', () => ({
  GroupsTable: (props: any) => (
    <div
      id="groups-table"
      data-testid="groups-table"
      data-arelinks={props.areLinksDisplayed}
      data-additionalgroups={JSON.stringify((props.additionalGroups ?? []).map((g: any) => g.metadata.name))}
      data-iscreatebuttondisplayed={String(!!props.isCreateButtonDisplayed)}
      data-createbuttontext={props.createButtonText ?? ''}
    >
      Groups Table {props.areLinksDisplayed === false ? '(No Links)' : '(With Links)'}
      {props.selectedGroup && ` - Selected: ${props.selectedGroup.metadata.name}`}
      {props.setSelectedGroup && (
        <button
          onClick={() => {
            const mockGroup = { metadata: { name: 'test-group', uid: 'test-group-uid' } }
            props.setSelectedGroup(mockGroup)
          }}
        >
          Select Group
        </button>
      )}
      {props.onCreateClick && <button onClick={props.onCreateClick}>Create Group Action</button>}
      {props.tableActionButtons?.map((btn: any) => (
        <button key={btn.id} onClick={btn.click}>
          {btn.title}
        </button>
      ))}
    </div>
  ),
}))

jest.mock('./CreatePreAuthorizedIdentity', () => ({
  CreatePreAuthorizedIdentity: ({ subjectKind, onClose, onSuccess }: any) => {
    const mockCreatedUser = { metadata: { name: 'new-pre-authorized-user', uid: 'new-user-uid' } }
    const mockCreatedGroup = { metadata: { name: 'new-pre-authorized-group', uid: 'new-group-uid' }, users: [] }
    const label = subjectKind === 'User' ? 'Pre-Auth User Form' : 'Pre-Auth Group Form'
    const handleSubmit = () => {
      onSuccess?.(subjectKind === 'User' ? mockCreatedUser : mockCreatedGroup)
      onClose()
    }
    return (
      <div>
        <span>{label}</span>
        <button onClick={onClose}>Cancel</button>
        <button onClick={handleSubmit}>Submit</button>
      </div>
    )
  },
}))

function Component(props: any = {}) {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <IdentitiesList {...props} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

describe('IdentitiesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    setupMocks(false)
    mockUseMergedUsers.mockReturnValue(mockUsers)
    mockUseMergedGroups.mockReturnValue(mockGroups)
  })

  test('should render title and tableActionButtons for users', () => {
    render(<Component />)

    expect(screen.getByText('Identities')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
  })

  test('should render tabs for Users and Groups', () => {
    render(<Component />)

    expect(screen.getByRole('tab', { name: 'Users tab' })).toBeInTheDocument()
    expect(screen.getByRole('tab', { name: 'Groups tab' })).toBeInTheDocument()
  })

  test('should show Users tab as active by default', () => {
    render(<Component />)

    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Users Table (No Links)')).toBeInTheDocument()
  })

  test('should switch to Groups tab and show tableActionButtons for groups', () => {
    render(<Component />)

    const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
    fireEvent.click(groupsTab)

    expect(groupsTab).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
  })

  test('should show CreatePreAuthorizedIdentity for users when button is clicked', async () => {
    render(<Component />)

    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByText('Pre-Auth User Form')).toBeInTheDocument()
    })
    expect(screen.queryByText('Users Table (No Links)')).not.toBeInTheDocument()
  })

  test('should show CreatePreAuthorizedIdentity for groups when button is clicked', async () => {
    render(<Component />)

    const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
    fireEvent.click(groupsTab)

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create group' }))

    await waitFor(() => {
      expect(screen.getByText('Pre-Auth Group Form')).toBeInTheDocument()
    })
  })

  test('should return to table when CreatePreAuthorizedIdentity is cancelled', async () => {
    render(<Component />)

    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByText('Pre-Auth User Form')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }))

    await waitFor(() => {
      expect(screen.getByText('Users Table (No Links)')).toBeInTheDocument()
    })
  })

  test('should add created user to additionalUsers on submit', async () => {
    const mockOnUserSelect = jest.fn()
    render(<Component onUserSelect={mockOnUserSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByText('Pre-Auth User Form')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(screen.getByTestId('users-table')).toBeInTheDocument()
    })

    expect(mockOnUserSelect).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'new-pre-authorized-user', uid: 'new-user-uid' } })
    )

    const usersTable = screen.getByTestId('users-table')
    expect(usersTable.getAttribute('data-additionalusers')).toContain('new-pre-authorized-user')
  })

  test('should add created group to additionalGroups on submit', async () => {
    const mockOnGroupSelect = jest.fn()
    render(<Component onGroupSelect={mockOnGroupSelect} />)

    fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Create group' }))

    await waitFor(() => {
      expect(screen.getByText('Pre-Auth Group Form')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('button', { name: 'Submit' }))

    await waitFor(() => {
      expect(screen.getByTestId('groups-table')).toBeInTheDocument()
    })

    expect(mockOnGroupSelect).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'new-pre-authorized-group', uid: 'new-group-uid' } })
    )

    const groupsTable = screen.getByTestId('groups-table')
    expect(groupsTable.getAttribute('data-additionalgroups')).toContain('new-pre-authorized-group')
  })

  test('should reset create form when switching tabs', async () => {
    render(<Component />)

    fireEvent.click(screen.getByRole('button', { name: 'Create user' }))

    await waitFor(() => {
      expect(screen.getByText('Pre-Auth User Form')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

    await waitFor(() => {
      expect(screen.queryByText('Pre-Auth User Form')).not.toBeInTheDocument()
      expect(screen.getByText('Groups Table (No Links)')).toBeInTheDocument()
    })

    fireEvent.click(screen.getByRole('tab', { name: 'Users tab' }))

    await waitFor(() => {
      expect(screen.queryByText('Pre-Auth User Form')).not.toBeInTheDocument()
      expect(screen.getByText('Users Table (No Links)')).toBeInTheDocument()
    })
  })

  test('should pass areLinksDisplayed=false to both table components', () => {
    render(<Component />)

    expect(screen.getByText('Users Table (No Links)')).toBeInTheDocument()

    const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
    fireEvent.click(groupsTab)

    expect(screen.getByText('Groups Table (No Links)')).toBeInTheDocument()
  })

  describe('create button props when isDirectAuthenticationEnabled is false', () => {
    test('should pass isCreateButtonDisplayed=true to UsersTable', () => {
      render(<Component />)

      const usersTable = screen.getByTestId('users-table')
      expect(usersTable.getAttribute('data-iscreatebuttondisplayed')).toBe('true')
    })

    test('should pass isCreateButtonDisplayed=true to GroupsTable', () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      const groupsTable = screen.getByTestId('groups-table')
      expect(groupsTable.getAttribute('data-iscreatebuttondisplayed')).toBe('true')
    })

    test('should show "Create user" button in UsersTable', () => {
      render(<Component />)

      expect(screen.getByRole('button', { name: 'Create user' })).toBeInTheDocument()
    })

    test('should show "Create group" button in GroupsTable', () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
    })
  })

  describe('create button props when isDirectAuthenticationEnabled is true', () => {
    beforeEach(() => {
      setupMocks(true)
    })

    test('should pass isCreateButtonDisplayed=true to UsersTable', () => {
      render(<Component />)

      const usersTable = screen.getByTestId('users-table')
      expect(usersTable.getAttribute('data-iscreatebuttondisplayed')).toBe('true')
    })

    test('should pass createButtonText="Add user" to UsersTable', () => {
      render(<Component />)

      const usersTable = screen.getByTestId('users-table')
      expect(usersTable.getAttribute('data-createbuttontext')).toBe('Add user')
    })

    test('should pass isCreateButtonDisplayed=true to GroupsTable', () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      const groupsTable = screen.getByTestId('groups-table')
      expect(groupsTable.getAttribute('data-iscreatebuttondisplayed')).toBe('true')
    })

    test('should pass createButtonText="Add group" to GroupsTable', () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      const groupsTable = screen.getByTestId('groups-table')
      expect(groupsTable.getAttribute('data-createbuttontext')).toBe('Add group')
    })

    test('should show "Add user" button in UsersTable', () => {
      render(<Component />)

      expect(screen.getByRole('button', { name: 'Add user' })).toBeInTheDocument()
    })

    test('should show "Add group" button in GroupsTable', () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      expect(screen.getByRole('button', { name: 'Add group' })).toBeInTheDocument()
    })

    test('should open CreatePreAuthorizedIdentity for users when onCreateClick is triggered', async () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('button', { name: 'Create User Action' }))

      await waitFor(() => {
        expect(screen.getByText('Pre-Auth User Form')).toBeInTheDocument()
      })
    })

    test('should open CreatePreAuthorizedIdentity for groups when onCreateClick is triggered', async () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      fireEvent.click(screen.getByRole('button', { name: 'Create Group Action' }))

      await waitFor(() => {
        expect(screen.getByText('Pre-Auth Group Form')).toBeInTheDocument()
      })
    })

    test('should open CreatePreAuthorizedIdentity for users via tableActionButtons', async () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('button', { name: 'Add user' }))

      await waitFor(() => {
        expect(screen.getByText('Pre-Auth User Form')).toBeInTheDocument()
      })
    })

    test('should open CreatePreAuthorizedIdentity for groups via tableActionButtons', async () => {
      render(<Component />)

      fireEvent.click(screen.getByRole('tab', { name: 'Groups tab' }))

      fireEvent.click(screen.getByRole('button', { name: 'Add group' }))

      await waitFor(() => {
        expect(screen.getByText('Pre-Auth Group Form')).toBeInTheDocument()
      })
    })
  })

  test('should preselect an RBAC user via initialSelectedIdentity', async () => {
    const mockOnUserSelect = jest.fn()
    render(<Component onUserSelect={mockOnUserSelect} initialSelectedIdentity={{ kind: 'User', name: 'alice' }} />)

    await waitFor(() => {
      expect(screen.getByText(/Selected: alice/)).toBeInTheDocument()
    })
  })

  test('should preselect an MRA-derived user via initialSelectedIdentity', async () => {
    const mockOnUserSelect = jest.fn()
    render(<Component onUserSelect={mockOnUserSelect} initialSelectedIdentity={{ kind: 'User', name: 'bob-mra' }} />)

    await waitFor(() => {
      expect(screen.getByText(/Selected: bob-mra/)).toBeInTheDocument()
    })
  })

  test('should preselect an RBAC group via initialSelectedIdentity', async () => {
    const mockOnGroupSelect = jest.fn()
    render(
      <Component onGroupSelect={mockOnGroupSelect} initialSelectedIdentity={{ kind: 'Group', name: 'developers' }} />
    )

    await waitFor(() => {
      const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
      expect(groupsTab).toHaveAttribute('aria-selected', 'true')
    })

    await waitFor(() => {
      expect(screen.getByText(/Selected: developers/)).toBeInTheDocument()
    })
  })

  test('should preselect an MRA-derived group via initialSelectedIdentity', async () => {
    const mockOnGroupSelect = jest.fn()
    render(<Component onGroupSelect={mockOnGroupSelect} initialSelectedIdentity={{ kind: 'Group', name: 'ops-mra' }} />)

    await waitFor(() => {
      const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
      expect(groupsTab).toHaveAttribute('aria-selected', 'true')
    })

    await waitFor(() => {
      expect(screen.getByText(/Selected: ops-mra/)).toBeInTheDocument()
    })
  })

  test('should activate Groups tab when initialSelectedIdentity is a Group', () => {
    render(<Component initialSelectedIdentity={{ kind: 'Group', name: 'developers' }} />)

    const groupsTab = screen.getByRole('tab', { name: 'Groups tab' })
    expect(groupsTab).toHaveAttribute('aria-selected', 'true')
  })

  test('should activate Users tab when initialSelectedIdentity is a User', () => {
    render(<Component initialSelectedIdentity={{ kind: 'User', name: 'alice' }} />)

    const usersTab = screen.getByRole('tab', { name: 'Users tab' })
    expect(usersTab).toHaveAttribute('aria-selected', 'true')
  })

  test('should not preselect when initialSelectedIdentity name does not match any identity', async () => {
    render(<Component initialSelectedIdentity={{ kind: 'User', name: 'nonexistent' }} />)

    await waitFor(() => {
      expect(screen.queryByText(/Selected:/)).not.toBeInTheDocument()
    })
  })

  test('should render without errors when useMergedUsers returns empty', () => {
    mockUseMergedUsers.mockReturnValue([])
    mockUseMergedGroups.mockReturnValue([])

    render(<Component />)
    expect(screen.getByText('Identities')).toBeInTheDocument()
  })
})
