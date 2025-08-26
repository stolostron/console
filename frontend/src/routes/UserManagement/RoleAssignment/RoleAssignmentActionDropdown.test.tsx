/* Copyright Contributors to the Open Cluster Management project */
import { render, screen, fireEvent } from '@testing-library/react'
import { nockIgnoreRBAC, nockIgnoreApiPaths } from '../../../lib/nock-util'
import { RoleAssignmentActionDropdown } from './RoleAssignmentActionDropdown'

import { TrackedRoleAssignment } from '../../../resources/clients/multicluster-role-assignment-client'

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
  DropdownItem: ({ children, onClick }: any) => (
    <button id="dropdown-item" onClick={onClick} type="button">
      {children}
    </button>
  ),
  KebabToggle: ({ onToggle, isOpen }: any) => (
    <button id="kebab-toggle" onClick={() => onToggle(!isOpen)}>
      ⋮
    </button>
  ),
}))

const mockRoleAssignment: TrackedRoleAssignment = {
  multiclusterRoleAssignmentUid: 'test-uid-123',
  subjectKind: 'User',
  subjectName: 'test-user',
  clusterRole: 'admin',
  clusterSets: ['production', 'staging'],
  targetNamespaces: ['default', 'kube-system', 'test-ns'],
  roleAssignmentIndex: 0,
  dataHash: 'test-hash',
}

const mockSetModalProps = jest.fn()
const mockToastContext = {
  addAlert: jest.fn(),
}

function Component() {
  return (
    <RoleAssignmentActionDropdown
      roleAssignment={mockRoleAssignment}
      setModalProps={mockSetModalProps}
      toastContext={mockToastContext}
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
        confirmText: 'delete',
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

  it('actionFn shows toast and returns promise', () => {
    render(<Component />)

    // Open dropdown and click delete
    const toggleButton = screen.getByRole('button')
    fireEvent.click(toggleButton)

    const deleteOption = screen.getByText(/delete role assignment/i)
    fireEvent.click(deleteOption)

    // Get the modal props and test the actionFn
    const modalProps = mockSetModalProps.mock.calls[0][0]
    const result = modalProps.actionFn(mockRoleAssignment)

    // Verify toast was shown
    expect(mockToastContext.addAlert).toHaveBeenCalledWith({
      title: 'Role assignment deleted',
      type: 'success',
      autoClose: true,
    })

    // Verify promise is returned
    expect(result).toHaveProperty('promise')
    expect(result).toHaveProperty('abort')
    expect(typeof result.abort).toBe('function')
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
})
