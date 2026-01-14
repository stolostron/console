/* Copyright Contributors to the Open Cluster Management project */
import { fireEvent, render, screen } from '@testing-library/react'
import { nockIgnoreApiPaths, nockIgnoreRBAC } from '../../../lib/nock-util'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentNamespace,
} from '../../../resources/multicluster-role-assignment'
import { RoleAssignmentActionDropdown } from './RoleAssignmentActionDropdown'
import { FlattenedRoleAssignment } from '../../../resources/clients/model/flattened-role-assignment'

// Mock Dropdown component to show the key data we want to verify
jest.mock('@patternfly/react-core', () => ({
  ...jest.requireActual('@patternfly/react-core'),
  Dropdown: ({ children, toggle, isOpen }: any) => (
    <div id="action-dropdown">
      <div id="dropdown-toggle">{toggle}</div>
      <div id="dropdown-menu" style={{ display: isOpen ? 'block' : 'none' }}>
        <div id="dropdown-items">{children}</div>
      </div>
    </div>
  ),
  DropdownItem: ({ children, onClick, isAriaDisabled }: any) => (
    <button
      id="dropdown-item"
      onClick={isAriaDisabled ? undefined : onClick}
      type="button"
      aria-disabled={isAriaDisabled ? 'true' : undefined}
    >
      {children}
    </button>
  ),
  KebabToggle: ({ onToggle, isOpen }: any) => (
    <button id="kebab-toggle" onClick={() => onToggle(!isOpen)}>
      ⋮
    </button>
  ),
}))

const mockRoleAssignment: FlattenedRoleAssignment = {
  name: 'A1',
  relatedMulticlusterRoleAssignment: {} as MulticlusterRoleAssignment,
  clusterRole: 'admin',
  clusterSelection: {
    type: 'placements',
    placements: [
      { name: 'placement-production', namespace: MulticlusterRoleAssignmentNamespace },
      { name: 'placement-staging', namespace: MulticlusterRoleAssignmentNamespace },
    ],
  },
  clusterNames: ['production', 'staging'],
  targetNamespaces: ['default', 'kube-system', 'test-ns'],
  subject: { name: 'test-user', kind: 'User' },
}

const mockSetModalProps = jest.fn()
const mockDeleteAction = jest.fn()
const mockOnEdit = jest.fn()

function Component({ canDelete = true }: { canDelete?: boolean }) {
  return (
    <RoleAssignmentActionDropdown
      roleAssignment={mockRoleAssignment}
      setModalProps={mockSetModalProps}
      deleteAction={mockDeleteAction}
      canDelete={canDelete}
      onEdit={mockOnEdit}
    />
  )
}

describe('RoleAssignmentActionDropdown', () => {
  beforeEach(() => {
    nockIgnoreRBAC()
    nockIgnoreApiPaths()
    jest.clearAllMocks()
  })

  it('renders dropdown toggle button', () => {
    render(<Component />)
    // Verify the kebab toggle button is rendered
    const toggleButton = screen.getByRole('button')
    expect(toggleButton).toBeInTheDocument()
  })

  it('opens dropdown when toggle is clicked', () => {
    render(<Component />)

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    // Verify dropdown item is visible
    expect(screen.getByText(/delete role assignment/i)).toBeInTheDocument()
  })

  it('calls setModalProps when delete option is clicked', () => {
    render(<Component />)

    // Open dropdown
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    // Click delete option
    const deleteOption = screen.getByText(/delete role assignment/i)
    fireEvent.click(deleteOption)

    // Verify setModalProps was called with correct parameters
    expect(mockSetModalProps).toHaveBeenCalledWith(
      expect.objectContaining({
        open: true,
        title: 'Delete role assignment?',
        action: 'Delete',
        processing: 'Deleting',
        items: [mockRoleAssignment],
        isDanger: true,
        icon: 'warning',
        confirmText: 'confirm',
      })
    )
  })

  it('modal props contain correct role assignment data', () => {
    render(<Component />)

    // Open dropdown and click delete
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    const deleteOption = screen.getByText(/delete role assignment/i)
    fireEvent.click(deleteOption)

    // Get the modal props that were passed
    const modalProps = mockSetModalProps.mock.calls[0][0]

    // Verify the role assignment is included
    expect(modalProps.items).toEqual([mockRoleAssignment])

    // Verify columns are configured correctly
    expect(modalProps.columns).toHaveLength(2)
    expect(modalProps.columns[0].header).toMatch(/subject/i)
    expect(modalProps.columns[1].header).toMatch(/role/i)

    // Test column cell functions
    expect(modalProps.columns[0].cell(mockRoleAssignment)).toMatch(/User: test-user/i)
    expect(modalProps.columns[1].cell(mockRoleAssignment)).toMatch(/admin/i)
  })

  it('calls the action on delete', () => {
    render(<Component />)

    // Open dropdown and click delete
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    const deleteOption = screen.getByText(/delete role assignment/i)
    fireEvent.click(deleteOption)

    // Get the modal props and test the actionFn
    const modalProps = mockSetModalProps.mock.calls[0][0]
    modalProps.actionFn(mockRoleAssignment)
    expect(mockDeleteAction).toHaveBeenCalledTimes(1)
  })

  it('close function calls setModalProps with open false', () => {
    render(<Component />)

    // Open dropdown and click delete
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    const deleteOption = screen.getByText(/delete role assignment/i)
    fireEvent.click(deleteOption)

    // Get the modal props and test the close function
    const modalProps = mockSetModalProps.mock.calls[0][0]
    modalProps.close()

    // Verify setModalProps was called to close modal
    expect(mockSetModalProps).toHaveBeenCalledWith({ open: false })
  })

  it('disables delete option when canDelete is false', () => {
    render(<Component canDelete={false} />)

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    const deleteButton = screen.getByText(/delete role assignment/i).closest('button')

    expect(deleteButton).toHaveAttribute('aria-disabled', 'true')
    expect(deleteButton).toBeInTheDocument()

    fireEvent.click(deleteButton!)
    expect(mockSetModalProps).not.toHaveBeenCalled()
  })

  it('enables delete option when canDelete is true', () => {
    render(<Component canDelete={true} />)

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    const deleteButton = screen.getByText(/delete role assignment/i).closest('button')

    expect(deleteButton).not.toHaveAttribute('aria-disabled', 'true')
    expect(deleteButton).toBeInTheDocument()

    fireEvent.click(deleteButton!)
    expect(mockSetModalProps).toHaveBeenCalled()
  })

  it('renders edit option in dropdown', () => {
    render(<Component />)

    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    expect(screen.getByText(/edit role assignment/i)).toBeInTheDocument()
  })

  it('calls onEdit when edit option is clicked', () => {
    render(<Component />)

    // Open dropdown
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    // Click edit option
    const editOption = screen.getByText(/edit role assignment/i)
    fireEvent.click(editOption)

    // Verify onEdit was called with the role assignment
    expect(mockOnEdit).toHaveBeenCalledWith(mockRoleAssignment)
  })
})
