/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, waitFor } from '@testing-library/react'
import { ButtonVariant } from '@patternfly/react-core'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'
import { MulticlusterRoleAssignment } from '../../../../resources/multicluster-role-assignment'
import { Group } from '../../../../resources/rbac'
import { IAcmTableButtonAction } from '../../../../ui-components/AcmTable/AcmTableTypes'
import { GroupsTable } from './GroupsTable'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'

jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
  Trans: ({ children }: { children: React.ReactNode }) => children,
}))

jest.mock('../../../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
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

const mockUseRecoilValue = useRecoilValue as jest.MockedFunction<typeof useRecoilValue>
const mockUseSharedAtoms = useSharedAtoms as jest.MockedFunction<typeof useSharedAtoms>

const groupsAtom = Symbol('groupsState')
const mraAtom = Symbol('multiclusterRoleAssignmentState')

const mockGroups: Group[] = [
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'kubevirt-admins',
      uid: 'kubevirt-admins',
      creationTimestamp: '2023-01-01T00:00:00Z',
    },
    users: ['admin1'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'developers',
      uid: 'developers',
      creationTimestamp: '2023-01-02T00:00:00Z',
    },
    users: ['dev1', 'dev2'],
  },
  {
    apiVersion: 'user.openshift.io/v1',
    kind: 'Group',
    metadata: {
      name: 'sre-team',
      uid: 'sre-team',
      creationTimestamp: '2023-01-03T00:00:00Z',
    },
    users: ['sre1'],
  },
]

const mockMras: MulticlusterRoleAssignment[] = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-ops', creationTimestamp: '2023-02-01T00:00:00Z' },
    spec: {
      subject: { kind: 'Group', name: 'ops-team' },
      roleAssignments: [],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-devs', creationTimestamp: '2023-02-02T00:00:00Z' },
    spec: {
      subject: { kind: 'Group', name: 'developers' },
      roleAssignments: [],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: { name: 'mra-user', creationTimestamp: '2023-02-03T00:00:00Z' },
    spec: {
      subject: { kind: 'User', name: 'some-user' },
      roleAssignments: [],
    },
  },
]

function Component(props: any = {}) {
  return (
    <RecoilRoot>
      <MemoryRouter>
        <GroupsTable {...props} />
      </MemoryRouter>
    </RecoilRoot>
  )
}

function setupMocks(groups: Group[] = mockGroups, mras: MulticlusterRoleAssignment[] = mockMras) {
  mockUseSharedAtoms.mockReturnValue({
    groupsState: groupsAtom,
    multiclusterRoleAssignmentState: mraAtom,
  } as any)

  mockUseRecoilValue.mockImplementation((atom: any) => {
    if (atom === groupsAtom) return groups
    if (atom === mraAtom) return mras
    return []
  })
}

describe('GroupsTable', () => {
  beforeEach(() => setupMocks())

  test('should render groups table with mock data', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should render groups table with data', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('Name')).toBeInTheDocument()
      expect(screen.getByText('Users')).toBeInTheDocument()
      expect(screen.getByText('Created')).toBeInTheDocument()

      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()

      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })
  })

  test('should render empty state when no groups', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })
  })

  test('should render error state', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })
  })

  test('should show correct user counts for each group', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getAllByText('1').length).toBeGreaterThan(0)
      expect(screen.getAllByText('2').length).toBeGreaterThan(0)
    })
  })

  test('should render identity provider button when authorized', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })
  })

  test('should render with hiddenColumns prop', async () => {
    render(<Component hiddenColumns={['users']} />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should render with areLinksDisplayed prop set to false', async () => {
    render(<Component areLinksDisplayed={false} />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should render with setSelectedGroup callback', async () => {
    const mockSetSelectedGroup = jest.fn()
    render(<Component setSelectedGroup={mockSetSelectedGroup} />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
    })

    expect(mockSetSelectedGroup).toBeDefined()
  })

  test('should render with selectedGroup prop', async () => {
    const selectedGroup = mockGroups[0]
    render(<Component selectedGroup={selectedGroup} />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should pass selectedGroup to groupsTableColumns', async () => {
    const selectedGroup = mockGroups[0]
    const mockSetSelectedGroup = jest.fn()
    render(<Component selectedGroup={selectedGroup} setSelectedGroup={mockSetSelectedGroup} />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should render with all props combined', async () => {
    const mockSetSelectedGroup = jest.fn()
    const selectedGroup = mockGroups[0]

    render(
      <Component
        hiddenColumns={['users']}
        areLinksDisplayed={false}
        selectedGroup={selectedGroup}
        setSelectedGroup={mockSetSelectedGroup}
      />
    )

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should use external selectedGroup when provided', async () => {
    const mockSetSelectedGroup = jest.fn()
    const selectedGroup = mockGroups[0]

    render(<Component selectedGroup={selectedGroup} setSelectedGroup={mockSetSelectedGroup} />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should render without selectedGroup when not provided', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  test('should show MRA-derived group not already in groupsState', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
      expect(screen.getByText('ops-team')).toBeInTheDocument()
    })
  })

  test('should not duplicate group that exists in both groupsState and MRA', async () => {
    render(<Component />)

    await waitFor(() => {
      const devElements = screen.getAllByText('developers')
      expect(devElements).toHaveLength(1)
    })
  })

  test('should not show MRA subjects with kind User in groups table', async () => {
    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('ops-team')).toBeInTheDocument()
      expect(screen.queryByText('some-user')).not.toBeInTheDocument()
    })
  })

  test('should render only rbac groups when MRA state is empty', async () => {
    setupMocks(mockGroups, [])

    render(<Component />)

    await waitFor(() => {
      expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      expect(screen.getByText('developers')).toBeInTheDocument()
      expect(screen.getByText('sre-team')).toBeInTheDocument()
    })
  })

  describe('empty state create button', () => {
    beforeEach(() => {
      mockUseRecoilValue.mockReturnValue([])
    })

    test('should not show create button in empty state by default', async () => {
      render(<Component />)

      await waitFor(() => {
        expect(screen.getByText('In order to view Groups, add Identity provider')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: 'Create group' })).not.toBeInTheDocument()
    })

    test('should show create button in empty state when isCreateButtonDisplayed is true', async () => {
      const mockOnCreateClick = jest.fn()
      render(<Component isCreateButtonDisplayed onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
      })
    })

    test('should show custom button text when createButtonText is provided', async () => {
      const mockOnCreateClick = jest.fn()
      render(<Component isCreateButtonDisplayed createButtonText="Add group" onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Add group' })).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: 'Create group' })).not.toBeInTheDocument()
    })

    test('should call onCreateClick when create button is clicked', async () => {
      const mockOnCreateClick = jest.fn()
      render(<Component isCreateButtonDisplayed onCreateClick={mockOnCreateClick} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
      })

      screen.getByRole('button', { name: 'Create group' }).click()
      expect(mockOnCreateClick).toHaveBeenCalledTimes(1)
    })

    test('should not show create button when isCreateButtonDisplayed is true but onCreateClick is not provided', async () => {
      render(<Component isCreateButtonDisplayed />)

      await waitFor(() => {
        expect(screen.getByText('In order to view Groups, add Identity provider')).toBeInTheDocument()
      })
      expect(screen.queryByRole('button', { name: 'Create group' })).not.toBeInTheDocument()
    })
  })

  describe('tableActionButtons', () => {
    test('should render table action buttons when provided', async () => {
      const mockClick = jest.fn()
      const tableActionButtons: IAcmTableButtonAction[] = [
        {
          id: 'create-pre-authorized-group',
          title: 'Create group',
          click: mockClick,
          variant: ButtonVariant.primary,
        },
      ]
      render(<Component tableActionButtons={tableActionButtons} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
      })
    })

    test('should call click handler when table action button is clicked', async () => {
      const mockClick = jest.fn()
      const tableActionButtons: IAcmTableButtonAction[] = [
        {
          id: 'create-pre-authorized-group',
          title: 'Create group',
          click: mockClick,
          variant: ButtonVariant.primary,
        },
      ]
      render(<Component tableActionButtons={tableActionButtons} />)

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Create group' })).toBeInTheDocument()
      })

      screen.getByRole('button', { name: 'Create group' }).click()
      expect(mockClick).toHaveBeenCalledTimes(1)
    })

    test('should not render table action buttons when not provided', async () => {
      render(<Component />)

      await waitFor(() => {
        expect(screen.getByText('kubevirt-admins')).toBeInTheDocument()
      })

      expect(screen.queryByRole('button', { name: 'Create group' })).not.toBeInTheDocument()
    })
  })
})
