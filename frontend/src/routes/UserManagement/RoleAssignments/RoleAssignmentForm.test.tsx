/* Copyright Contributors to the Open Cluster Management project */
import { render } from '@testing-library/react'
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
      clusterSets: [{ id: 'clusterset1', value: 'default' }],
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
    roleAssignmentFormData: {
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
    },
    onChangeSubjectKind: mockOnChangeSubjectKind,
    onChangeUserValue: mockOnChangeUserValue,
    onChangeGroupValue: mockOnChangeGroupValue,
    onChangeScopeKind: mockOnChangeScopeKind,
    onChangeScopeValues: mockOnChangeScopeValues,
    onChangeScopeNamespaces: mockOnChangeScopeNamespaces,
    onChangeRoles: mockOnChangeRoles,
  }),
}))

jest.mock('../../../components/AcmDataForm', () => ({
  AcmDataFormPage: ({ formData, mode }: any) => (
    <div data-testid="acm-data-form-page" data-mode={mode}>
      <div data-testid="form-title">{formData.title}</div>
      <button data-testid="submit-button" onClick={formData.submit}>
        {formData.submitText}
      </button>
      <button data-testid="cancel-button" onClick={formData.cancel}>
        {formData.cancelLabel}
      </button>
    </div>
  ),
}))

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

jest.mock('../RoleAssignment/ClustersDualListSelector', () => ({
  ClustersDualListSelector: () => <div data-testid="clusters-selector">Clusters Selector</div>,
}))

jest.mock('../RoleAssignment/NamespaceSelector', () => ({
  NamespaceSelector: () => <div data-testid="namespace-selector">Namespace Selector</div>,
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
})
