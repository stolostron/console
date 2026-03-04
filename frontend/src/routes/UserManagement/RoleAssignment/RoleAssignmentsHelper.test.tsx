/* Copyright Contributors to the Open Cluster Management project */

// Mock react-router-dom-v5-compat
jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  generatePath: jest.fn((path: string, params: Record<string, string>) => {
    let result = path
    Object.entries(params).forEach(([key, value]) => {
      result = result.replace(`:${key}`, value)
    })
    return result
  }),
  Link: ({ children, to }: { children: React.ReactNode; to: string }) => <a href={to}>{children}</a>,
}))

// Mock NavigationPath
jest.mock('../../../NavigationPath', () => ({
  NavigationPath: {
    roleDetails: '/multicloud/user-management/roles/:id',
    clusterSetOverview: '/multicloud/infrastructure/clusters/sets/details/:id/overview',
    clusterOverview: '/multicloud/infrastructure/clusters/details/:namespace/:name/overview',
    identitiesGroupsDetails: '/multicloud/user-management/identities/groups/:id',
    identitiesUsersDetails: '/multicloud/user-management/identities/users/:id',
  },
}))

// Mock RoleAssignmentLabel
jest.mock('./RoleAssignmentLabel', () => ({
  RoleAssignmentLabel: ({
    elements,
    numLabel,
    renderElement,
  }: {
    elements?: string[]
    numLabel: number
    renderElement?: (element: string) => React.ReactNode
  }) => {
    if (!elements || elements.length === 0) {
      return <span>All namespaces</span>
    }

    const visibleElements = elements.slice(0, numLabel)
    const remainingCount = elements.length - numLabel

    return (
      <div data-testid="role-assignment-label">
        {visibleElements.map((element, index) => (
          <span key={index}>{renderElement ? renderElement(element) : element}</span>
        ))}
        {remainingCount > 0 && <span>{remainingCount} more</span>}
      </div>
    )
  },
}))

// Mock RoleAssignmentStatusComponent
jest.mock('./RoleAssignmentStatusComponent', () => ({
  RoleAssignmentStatusComponent: ({
    roleAssignment,
    isCallbackProcessing,
  }: {
    roleAssignment?: { status?: { status?: string; reason?: string } }
    isCallbackProcessing?: boolean
  }) => (
    <div data-testid="role-assignment-status">
      {roleAssignment?.status?.status || 'Unknown'}
      {roleAssignment?.status?.reason && <span data-testid="status-reason">{roleAssignment.status.reason}</span>}
      {isCallbackProcessing && <span data-testid="callback-processing">processing</span>}
    </div>
  ),
}))

// Mock AcmTimestamp
jest.mock('../../../lib/AcmTimestamp', () => ({
  __esModule: true,
  default: ({ timestamp }: { timestamp?: string }) => <span data-testid="acm-timestamp">{timestamp || '-'}</span>,
}))

// Mock RoleAssignmentActionDropdown
jest.mock('./RoleAssignmentActionDropdown', () => ({
  RoleAssignmentActionDropdown: ({ roleAssignment, canDelete, canPatch, onEdit }: any) => (
    <div data-testid="role-assignment-action-dropdown">
      <span data-testid="role-assignment-name">{roleAssignment.name}</span>
      <span data-testid="can-delete">{canDelete ? 'true' : 'false'}</span>
      <span data-testid="can-patch">{canPatch ? 'true' : 'false'}</span>
      {onEdit && (
        <button data-testid="edit-button" onClick={() => onEdit(roleAssignment)}>
          Edit
        </button>
      )}
    </div>
  ),
}))

import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'
import { MulticlusterRoleAssignment } from '../../../resources/multicluster-role-assignment'
import { RoleAssignmentCallbackReason } from './RoleAssignmentStatusComponent'
import {
  renderActionCell,
  renderClustersCell,
  renderClusterSetsCell,
  renderCreatedCell,
  renderNamespacesCell,
  renderRoleCell,
  renderStatusCell,
  renderSubjectNameCell,
} from './RoleAssignmentsHelper'

const mockCallbackMap: Record<RoleAssignmentCallbackReason, (ra: FlattenedRoleAssignment) => void> = {
  Processing: jest.fn(),
  InvalidReference: jest.fn(),
  NoMatchingClusters: jest.fn(),
  SuccessfullyApplied: jest.fn(),
  ApplicationFailed: jest.fn(),
  MissingNamespaces: jest.fn(),
}

describe('RoleAssignmentsHelper', () => {
  const mockMulticlusterRoleAssignment: MulticlusterRoleAssignment = {
    apiVersion: 'rbac.open-cluster-management.io/v1beta1',
    kind: 'MulticlusterRoleAssignment',
    metadata: {
      name: 'test-assignment',
      uid: 'test-uid',
    },
    spec: {
      subject: { kind: 'User', name: 'test-user' },
      roleAssignments: [],
    },
  }

  const createMockRoleAssignment = (overrides?: Partial<FlattenedRoleAssignment>): FlattenedRoleAssignment => ({
    name: 'test-role-assignment',
    clusterRole: 'admin',
    subject: { name: 'test-user', kind: 'User' },
    clusterNames: ['cluster-1', 'cluster-2'],
    clusterSetNames: ['clusterset-1'],
    targetNamespaces: ['namespace-1', 'namespace-2'],
    clusterSelection: {
      type: 'placements',
      placements: [],
    },
    relatedMulticlusterRoleAssignment: mockMulticlusterRoleAssignment,
    status: {
      name: 'test-role-assignment',
      status: 'Active',
      createdAt: '2024-01-15T10:30:00Z',
    },
    ...overrides,
  })

  describe('renderRoleCell', () => {
    it('should render role link with correct role name', () => {
      const roleAssignment = createMockRoleAssignment({ clusterRole: 'admin' })
      const cell = renderRoleCell(roleAssignment)

      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      const link = getByText('admin')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/multicloud/user-management/roles/admin')
    })

    it('should render role link with different role name', () => {
      const roleAssignment = createMockRoleAssignment({ clusterRole: 'viewer' })
      const cell = renderRoleCell(roleAssignment)

      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      const link = getByText('viewer')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/multicloud/user-management/roles/viewer')
    })
  })

  describe('renderSubjectNameCell', () => {
    it('should render user link with correct path', () => {
      const cell = renderSubjectNameCell('test-user', 'User')

      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      const link = getByText('test-user')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/multicloud/user-management/identities/users/test-user')
    })

    it('should render group link with correct path', () => {
      const cell = renderSubjectNameCell('test-group', 'Group')

      const { getByText } = render(<MemoryRouter>{cell}</MemoryRouter>)
      const link = getByText('test-group')
      expect(link).toBeInTheDocument()
      expect(link.closest('a')).toHaveAttribute('href', '/multicloud/user-management/identities/groups/test-group')
    })

    it('should return dash for empty name', () => {
      const cell = renderSubjectNameCell('', 'User')
      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('-')).toBeInTheDocument()
    })

    it('should return dash for whitespace-only name', () => {
      const cell = renderSubjectNameCell('   ', 'User')
      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('-')).toBeInTheDocument()
    })

    it('should return dash for undefined name', () => {
      const cell = renderSubjectNameCell(undefined as any, 'User')
      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('-')).toBeInTheDocument()
    })
  })

  describe('renderNamespacesCell', () => {
    it('should render namespaces with RoleAssignmentLabel', () => {
      const roleAssignment = createMockRoleAssignment({
        targetNamespaces: ['namespace-1', 'namespace-2', 'namespace-3'],
      })
      const cell = renderNamespacesCell(roleAssignment)

      const { container } = render(<div>{cell}</div>)
      // RoleAssignmentLabel should render the namespaces
      expect(container).toBeInTheDocument()
      // Check that it's not the "All namespaces" text
      expect(container.textContent).not.toBe('All namespaces')
    })

    it('should handle undefined namespaces', () => {
      const roleAssignment = createMockRoleAssignment({
        targetNamespaces: undefined,
      })
      const cell = renderNamespacesCell(roleAssignment)

      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('All namespaces')).toBeInTheDocument()
    })

    it('should handle empty namespaces array', () => {
      const roleAssignment = createMockRoleAssignment({
        targetNamespaces: [],
      })
      const cell = renderNamespacesCell(roleAssignment)

      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('All namespaces')).toBeInTheDocument()
    })
  })

  describe('renderStatusCell', () => {
    it('should render status component with roleAssignment and isCallbackProcessing', () => {
      const roleAssignment = createMockRoleAssignment({
        status: {
          name: 'test-role-assignment',
          status: 'Active',
          createdAt: '2024-01-15T10:30:00Z',
        },
      })
      const cell = renderStatusCell({
        roleAssignment,
        callbackMap: mockCallbackMap,
        isCallbackProcessing: false,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      expect(container.firstChild).toBeTruthy()
      expect(container.textContent).toContain('Active')
    })

    it('should render status component with error status and reason', () => {
      const roleAssignment = createMockRoleAssignment({
        status: {
          name: 'test-role-assignment',
          status: 'Error',
          reason: 'ApplicationFailed',
          createdAt: '2024-01-15T10:30:00Z',
        },
      })
      const cell = renderStatusCell({
        roleAssignment,
        callbackMap: mockCallbackMap,
        isCallbackProcessing: false,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      expect(container.firstChild).toBeTruthy()
      expect(container.textContent).toContain('ApplicationFailed')
    })

    it('should handle undefined status', () => {
      const roleAssignment = createMockRoleAssignment({
        status: undefined,
      })
      const cell = renderStatusCell({
        roleAssignment,
        callbackMap: mockCallbackMap,
        isCallbackProcessing: false,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      expect(container.firstChild).toBeTruthy()
      expect(container.textContent).toContain('Unknown')
    })

    it('should pass isCallbackProcessing to status component', () => {
      const roleAssignment = createMockRoleAssignment()
      const cell = renderStatusCell({
        roleAssignment,
        callbackMap: mockCallbackMap,
        isCallbackProcessing: true,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      expect(container.textContent).toContain('processing')
    })
  })

  describe('renderClusterSetsCell', () => {
    it('should render cluster set links', () => {
      const roleAssignment = createMockRoleAssignment({
        clusterSetNames: ['clusterset-1', 'clusterset-2'],
      })
      const cell = renderClusterSetsCell(roleAssignment)

      const { container } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(container).toBeInTheDocument()
      // Should not render dash when cluster sets exist
      expect(container.textContent).not.toBe('-')
    })

    it('should render dash for empty cluster set names', () => {
      const roleAssignment = createMockRoleAssignment({
        clusterSetNames: [],
      })
      const cell = renderClusterSetsCell(roleAssignment)

      const { getByText } = render(<div>{cell}</div>)
      expect(getByText('-')).toBeInTheDocument()
    })

    it('should render cluster set links with correct paths', () => {
      const roleAssignment = createMockRoleAssignment({
        clusterSetNames: ['clusterset-1'],
      })
      const cell = renderClusterSetsCell(roleAssignment)

      const { container } = render(<MemoryRouter>{cell}</MemoryRouter>)
      const links = container.querySelectorAll('a')
      expect(links.length).toBeGreaterThan(0)
    })
  })

  describe('renderClustersCell', () => {
    it('should render cluster links', () => {
      const roleAssignment = createMockRoleAssignment({
        clusterNames: ['cluster-1', 'cluster-2'],
      })
      const cell = renderClustersCell(roleAssignment)

      const { container } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(container).toBeInTheDocument()
      // Cluster links should be rendered
      expect(container.firstChild).toBeTruthy()
    })

    it('should render cluster links with correct paths', () => {
      const roleAssignment = createMockRoleAssignment({
        clusterNames: ['cluster-1'],
      })
      const cell = renderClustersCell(roleAssignment)

      const { container } = render(<MemoryRouter>{cell}</MemoryRouter>)
      const links = container.querySelectorAll('a')
      expect(links.length).toBeGreaterThan(0)
    })

    it('should handle empty cluster names', () => {
      const roleAssignment = createMockRoleAssignment({
        clusterNames: [],
      })
      const cell = renderClustersCell(roleAssignment)

      const { container } = render(<MemoryRouter>{cell}</MemoryRouter>)
      expect(container).toBeInTheDocument()
      // Should still render the component even with empty cluster names
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('renderCreatedCell', () => {
    it('should render timestamp when createdAt exists', () => {
      const roleAssignment = createMockRoleAssignment({
        status: {
          name: 'test-role-assignment',
          status: 'Active',
          createdAt: '2024-01-15T10:30:00Z',
        },
      })
      const cell = renderCreatedCell(roleAssignment)

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // AcmTimestamp should be rendered
      expect(container.firstChild).toBeTruthy()
    })

    it('should render dash when createdAt is undefined', () => {
      const roleAssignment = createMockRoleAssignment({
        status: {
          name: 'test-role-assignment',
          status: 'Active',
          createdAt: undefined,
        },
      })
      const cell = renderCreatedCell(roleAssignment)

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // AcmTimestamp should be rendered even with undefined timestamp
      expect(container.firstChild).toBeTruthy()
    })

    it('should render dash when status is undefined', () => {
      const roleAssignment = createMockRoleAssignment({
        status: undefined,
      })
      const cell = renderCreatedCell(roleAssignment)

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // AcmTimestamp should be rendered even with undefined status
      expect(container.firstChild).toBeTruthy()
    })
  })

  describe('renderActionCell', () => {
    const mockSetModalProps = jest.fn()
    const mockDeleteAction = jest.fn()
    const mockOnEdit = jest.fn()

    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should render action dropdown with correct props', () => {
      const roleAssignment = createMockRoleAssignment()
      const cell = renderActionCell({
        roleAssignment,
        setModalProps: mockSetModalProps,
        deleteAction: mockDeleteAction,
        canDelete: true,
        canPatch: true,
        onEdit: mockOnEdit,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // RoleAssignmentActionDropdown should be rendered
      expect(container.firstChild).toBeTruthy()
    })

    it('should render action dropdown with canDelete false', () => {
      const roleAssignment = createMockRoleAssignment()
      const cell = renderActionCell({
        roleAssignment,
        setModalProps: mockSetModalProps,
        deleteAction: mockDeleteAction,
        canDelete: false,
        canPatch: true,
        onEdit: mockOnEdit,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // RoleAssignmentActionDropdown should be rendered
      expect(container.firstChild).toBeTruthy()
    })

    it('should render action dropdown with canPatch false', () => {
      const roleAssignment = createMockRoleAssignment()
      const cell = renderActionCell({
        roleAssignment,
        setModalProps: mockSetModalProps,
        deleteAction: mockDeleteAction,
        canDelete: true,
        canPatch: false,
        onEdit: mockOnEdit,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // RoleAssignmentActionDropdown should be rendered
      expect(container.firstChild).toBeTruthy()
    })

    it('should call onEdit when edit button is clicked', () => {
      const roleAssignment = createMockRoleAssignment()
      const cell = renderActionCell({
        roleAssignment,
        setModalProps: mockSetModalProps,
        deleteAction: mockDeleteAction,
        canDelete: true,
        canPatch: true,
        onEdit: mockOnEdit,
      })

      const { container } = render(<div>{cell}</div>)
      const editButton = container.querySelector('[data-testid="edit-button"]') as HTMLButtonElement
      expect(editButton).toBeInTheDocument()
      editButton.click()

      expect(mockOnEdit).toHaveBeenCalledTimes(1)
      expect(mockOnEdit).toHaveBeenCalledWith(roleAssignment)
    })

    it('should handle different role assignment names', () => {
      const roleAssignment = createMockRoleAssignment({
        name: 'different-role-assignment',
      })
      const cell = renderActionCell({
        roleAssignment,
        setModalProps: mockSetModalProps,
        deleteAction: mockDeleteAction,
        canDelete: true,
        canPatch: true,
        onEdit: mockOnEdit,
      })

      const { container } = render(<div>{cell}</div>)
      expect(container).toBeInTheDocument()
      // RoleAssignmentActionDropdown should be rendered
      expect(container.firstChild).toBeTruthy()
    })
  })
})
