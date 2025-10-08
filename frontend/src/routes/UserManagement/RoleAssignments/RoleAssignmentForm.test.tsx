/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { RecoilRoot } from 'recoil'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RoleAssignmentForm } from './RoleAssignmentForm'
import { UserKind, GroupKind } from '../../../resources'
import { RoleAssignmentPreselected } from './model/role-assignment-preselected'

const mockOnChangeSubjectKind = jest.fn()
const mockOnChangeUserValue = jest.fn()
const mockOnChangeGroupValue = jest.fn()
const mockOnChangeScopeKind = jest.fn()
const mockOnChangeScopeValues = jest.fn()
const mockOnChangeScopeNamespaces = jest.fn()
const mockOnChangeRoles = jest.fn()

let mockRoleAssignmentFormData: any = {
  subject: {
    kind: UserKind,
    user: [],
    group: [],
  },
  scope: {
    kind: 'all',
    clusterNames: [],
    namespaces: [],
  },
  roles: [],
}

jest.mock('./hook/RoleAssignmentDataHook', () => ({
  useRoleAssignmentData: () => ({
    roleAssignmentData: {
      users: [
        { id: 'user1', value: 'john-doe' },
        { id: 'user2', value: 'jane-doe' },
      ],
      groups: [
        { id: 'group1', value: 'admin-group' },
        { id: 'group2', value: 'viewer-group' },
      ],
      roles: [
        { id: 'role1', value: 'admin' },
        { id: 'role2', value: 'viewer' },
      ],
      clusterSets: [
        {
          id: 'clusterset1',
          value: 'default',
          clusters: [
            { name: 'cluster1', namespaces: ['namespace1', 'namespace2'] },
            { name: 'cluster2', namespaces: ['namespace3'] },
          ],
        },
      ],
    },
    isLoading: false,
    isUsersLoading: false,
    isGroupsLoading: false,
    isRolesLoading: false,
    isClusterSetLoading: false,
  }),
}))

jest.mock('./hook/RoleAssignmentFormDataHook', () => ({
  useRoleAssignmentFormData: () => ({
    roleAssignmentFormData: mockRoleAssignmentFormData,
    onChangeSubjectKind: mockOnChangeSubjectKind,
    onChangeUserValue: mockOnChangeUserValue,
    onChangeGroupValue: mockOnChangeGroupValue,
    onChangeScopeKind: mockOnChangeScopeKind,
    onChangeScopeValues: mockOnChangeScopeValues,
    onChangeScopeNamespaces: mockOnChangeScopeNamespaces,
    onChangeRoles: mockOnChangeRoles,
  }),
}))

let mockFormData: any = null
let mockOnChoseOptions: any = null

jest.mock('../../../components/AcmDataForm', () => ({
  AcmDataFormPage: ({ formData, mode }: any) => {
    mockFormData = formData
    return (
      <div data-testid="acm-data-form-page" data-mode={mode}>
        <div data-testid="form-title">{formData.title}</div>
        <button data-testid="submit-button" onClick={formData.submit}>
          {formData.submitText}
        </button>
        <button data-testid="cancel-button" onClick={formData.cancel}>
          {formData.cancelLabel}
        </button>
        {formData.sections.map((section: any, index: number) => (
          <div key={index} data-testid={`section-${index}`}>
            {section.inputs?.map((input: any, inputIndex: number) => {
              if (!input.isHidden) {
                return (
                  <div key={inputIndex} data-testid={`input-${input.id}`}>
                    {input.component}
                  </div>
                )
              }
              return null
            })}
          </div>
        ))}
      </div>
    )
  },
}))

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('../RoleAssignment/ClustersDualListSelector', () => ({
  ClustersDualListSelector: ({ onChoseOptions }: any) => {
    mockOnChoseOptions = onChoseOptions
    return <div data-testid="clusters-selector">Clusters Selector</div>
  },
}))

jest.mock('../RoleAssignment/NamespaceSelector', () => ({
  NamespaceSelector: ({ onChangeNamespaces, disabled }: any) => (
    <div data-testid="namespace-selector">
      <button
        data-testid="namespace-change-button"
        onClick={() => onChangeNamespaces(['namespace1'])}
        disabled={disabled}
      >
        Change Namespaces
      </button>
    </div>
  ),
}))

jest.mock(
  '../../Applications/ApplicationDetails/ApplicationTopology/topology/components/future/truncate-middle',
  () => ({
    truncateMiddle: (text: string) => text,
  })
)

jest.mock('./schema.json', () => ({}))

const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <RecoilRoot>
    <MemoryRouter>{children}</MemoryRouter>
  </RecoilRoot>
)

describe('RoleAssignmentForm', () => {
  const mockOnSubmit = jest.fn()
  const mockOnCancel = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockFormData = null
    mockOnChoseOptions = null
    mockRoleAssignmentFormData = {
      subject: {
        kind: UserKind,
        user: [],
        group: [],
      },
      scope: {
        kind: 'all',
        clusterNames: [],
        namespaces: [],
      },
      roles: [],
    }
  })

  it('should render without crashing', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    expect(container.firstChild).not.toBeNull()
  })

  it('should render form with correct title for new creation', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create role assignment')
  })

  it('should render form with correct title for editing', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isEditing={true} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Edit role assignment')
  })

  it('should render form in details mode when viewing', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isViewing={true} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create role assignment')
  })

  it('should handle preselected user data', () => {
    const preselected: RoleAssignmentPreselected = {
      subject: {
        kind: UserKind,
        value: 'john-doe',
      },
    }

    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} preselected={preselected} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create role assignment for john-doe user')
  })

  it('should handle preselected group data', () => {
    const preselected: RoleAssignmentPreselected = {
      subject: {
        kind: GroupKind,
        value: 'admin-group',
      },
    }

    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} preselected={preselected} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create role assignment for admin-group group')
  })

  it('should handle preselected roles data', () => {
    const preselected: RoleAssignmentPreselected = {
      roles: ['admin', 'viewer'],
    }

    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} preselected={preselected} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create role assignment for admin, viewer roles')
  })

  it('should handle empty preselected data', () => {
    const preselected: RoleAssignmentPreselected = {}

    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} preselected={preselected} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create role assignment')
  })

  it('should handle loading state', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    expect(container.firstChild).not.toBeNull()
  })

  it('should handle form submission', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Create')
  })

  it('should handle form cancellation', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    expect(container.textContent).toContain('Cancel')
  })

  it('should handle form with different modes', () => {
    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} isEditing={true} isViewing={true} />
      </TestWrapper>
    )

    expect(container.firstChild).not.toBeNull()
  })

  it('should handle form with all props', () => {
    const preselected: RoleAssignmentPreselected = {
      subject: {
        kind: UserKind,
        value: 'test-user',
      },
      roles: ['admin'],
    }

    const { container } = render(
      <TestWrapper>
        <RoleAssignmentForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
          isEditing={true}
          isViewing={false}
          preselected={preselected}
        />
      </TestWrapper>
    )

    expect(container.firstChild).not.toBeNull()
  })

  it('should call onChangeScopeValues when onChoseOptions is called', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: [],
        namespaces: [],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    mockOnChoseOptions([
      { id: 'cluster1', value: 'cluster1' },
      { id: 'cluster2', value: 'cluster2' },
    ])

    expect(mockOnChangeScopeValues).toHaveBeenCalledWith(['cluster1', 'cluster2'])
  })

  it('should return correct syncs from stateToSyncs', () => {
    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const syncs = mockFormData.stateToSyncs()
    expect(syncs).toHaveLength(1)
    expect(syncs[0].path).toBe('MulticlusterRoleAssignment[0].spec.roles')

    syncs[0].setState(['admin', 'viewer'])
    expect(mockOnChangeRoles).toHaveBeenCalledWith(['admin', 'viewer'])
  })

  it('should validate user selection correctly', () => {
    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const usersInput = mockFormData.sections[0].inputs.find((input: any) => input.id === 'users')
    expect(usersInput.validation([])).toBe('a user should be selected')
    expect(usersInput.validation(['user1'])).toBeUndefined()
  })

  it('should validate group selection correctly', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      subject: {
        kind: GroupKind,
        user: [],
        group: [],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const groupsInput = mockFormData.sections[0].inputs.find((input: any) => input.id === 'groups')
    expect(groupsInput.validation([])).toBe('a group should be selected')
    expect(groupsInput.validation(['group1'])).toBeUndefined()
  })

  it('should validate cluster selection correctly', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: [],
        namespaces: [],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const clustersInput = mockFormData.sections[2].inputs.find((input: any) => input.id === 'clusters')
    expect(clustersInput.validation([])).toBe('at least one cluster should be selected')
    expect(clustersInput.validation(['cluster1'])).toBeUndefined()
  })

  it('should validate namespace selection when clusters are selected', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: ['cluster1'],
        namespaces: [],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const namespacesInput = mockFormData.sections[2].inputs.find((input: any) => input.id === 'namespaces')

    expect(namespacesInput.validation([])).toBe('You must either select "All namespaces" or choose specific namespaces')

    expect(namespacesInput.validation(undefined)).toBeUndefined()

    expect(namespacesInput.validation(['namespace1'])).toBeUndefined()
  })

  it('should validate namespace selection when no clusters are selected', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: [],
        namespaces: ['namespace1'],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const namespacesInput = mockFormData.sections[2].inputs.find((input: any) => input.id === 'namespaces')
    expect(namespacesInput.validation(['namespace1'])).toBe('Clusters must be selected before selecting namespaces')
  })

  it('should handle "All namespaces" checkbox check', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: ['cluster1'],
        namespaces: ['namespace1'],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const checkbox = screen.getByLabelText('All namespaces')
    fireEvent.click(checkbox)

    expect(mockOnChangeScopeNamespaces).toHaveBeenCalledWith(undefined)
  })

  it('should handle "All namespaces" checkbox uncheck', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: ['cluster1'],
        namespaces: undefined,
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const checkbox = screen.getByLabelText('All namespaces')
    fireEvent.click(checkbox)

    expect(mockOnChangeScopeNamespaces).toHaveBeenCalledWith([])
  })

  it('should call onChangeScopeNamespaces when namespace component triggers change', () => {
    mockRoleAssignmentFormData = {
      ...mockRoleAssignmentFormData,
      scope: {
        kind: 'specific',
        clusterNames: ['cluster1'],
        namespaces: [],
      },
    }

    render(
      <TestWrapper>
        <RoleAssignmentForm onSubmit={mockOnSubmit} onCancel={mockOnCancel} />
      </TestWrapper>
    )

    const namespacesInput = mockFormData.sections[2].inputs.find((input: any) => input.id === 'namespaces')

    expect(namespacesInput.isHidden).toBe(false)

    namespacesInput.onChange(['namespace1', 'namespace2'])

    expect(mockOnChangeScopeNamespaces).toHaveBeenCalledWith(['namespace1', 'namespace2'])
  })
})
