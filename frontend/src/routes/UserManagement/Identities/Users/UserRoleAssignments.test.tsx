/* Copyright Contributors to the Open Cluster Management project */

import React from 'react'

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom-v5-compat'
import { RecoilRoot } from 'recoil'

import { waitForText } from '../../../../lib/test-util'
import { defaultPlugin, PluginContext } from '../../../../lib/PluginContext'
import { UserRoleAssignments } from './UserRoleAssignments'

// Mock role assignments data that matches the mock users in the component
const mockRoleAssignments = [
  {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'RoleAssignment',
    metadata: {
      name: 'alice-admin-assignment',
      uid: 'alice-admin-uid',
      creationTimestamp: '2024-01-15T10:30:00Z',
    },
    spec: {
      roles: ['admin'],
      subjects: [{ kind: 'User', name: 'alice.trask' }], // Match the mock user name
      clusters: [{ name: 'alice-production-cluster', namespaces: ['alice-default', 'alice-web-apps'] }],
    },
  },
  {
    apiVersion: 'rbac.open-cluster-management.io/v1alpha1',
    kind: 'RoleAssignment',
    metadata: {
      name: 'alice-viewer-assignment',
      uid: 'alice-viewer-uid',
      creationTimestamp: '2024-01-16T14:20:00Z',
    },
    spec: {
      roles: ['viewer'],
      subjects: [{ kind: 'User', name: 'alice.trask' }], // Match the mock user name
      clusters: [{ name: 'alice-staging-cluster', namespaces: ['alice-monitoring'] }],
    },
  },
]

// Mock translation hook - simple pattern used in other test files
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: jest.fn().mockReturnValue({
    t: (key: string) => key,
  }),
}))

jest.mock('react-router-dom-v5-compat', () => ({
  ...jest.requireActual('react-router-dom-v5-compat'),
  useParams: () => ({ id: 'mock-user-alice-trask' }), // Match the mock user uid
}))

// Mock the role assignments JSON to return our test data
jest.doMock('../../../../resources/clients/mock-data/role-assignments.json', () => mockRoleAssignments)

// Mock PatternFly dropdown components for kebab menu
jest.mock('@patternfly/react-core/deprecated', () => ({
  Dropdown: ({ children, dropdownItems, isOpen }: any) => (
    <div data-testid="kebab-dropdown">
      {children}
      {isOpen && <div data-testid="kebab-menu">{dropdownItems}</div>}
    </div>
  ),
}))

// Mock BulkActionModal for delete confirmation testing
// We need to create a mock that properly renders when the component's state changes
// Create a global spy that we can access in tests
const globalModalSpy = jest.fn()

// Mock BulkActionModal with spy integration
jest.mock('../../../../components/BulkActionModal', () => ({
  BulkActionModal: (props: any) => {
    const { open, actionFn } = props

    // Always call the spy to capture props
    globalModalSpy(props)

    // Store the actionFn globally for testing
    if (open && actionFn) {
      ;(global as any).testActionFn = actionFn
    }

    // Return null to avoid DOM integration issues
    return null
  },
}))

// Mock toast context for alert notifications
const mockAddAlert = jest.fn()

// Create a provider component that uses our mock
const TestWrapper = ({ children }: { children: React.ReactNode }) => {
  return <div>{children}</div> // Simplified wrapper since we mock AcmToastContext globally
}

// Component mock
// action buttons - Create
// table headers - Roles, Cluster, Namespace, Status, Created
// bulk actions - Delete role assignments, Edit role assignments
jest.mock('../../../../ui-components', () => ({
  AcmTable: ({ items, columns, keyFn, tableActions, tableActionButtons }: any) => (
    <div data-testid="acm-table">
      {/* Action buttons */}
      {tableActionButtons?.map((btn: any, i: number) => (
        <button key={i} onClick={btn.click} data-testid="create-button">
          {btn.title}
        </button>
      ))}

      {/* Table with proper headers */}
      <table data-testid="table-headers">
        <thead>
          <tr>
            {columns.map((col: any, i: number) => (
              <th key={i}>{col.header}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {items?.map((item: any) => (
            <tr key={keyFn(item)}>
              {columns.map((col: any, i: number) => {
                const cellContent = typeof col.cell === 'function' ? col.cell(item) : item[col.cell]
                // Add user name to the first column (Roles) for testing
                if (i === 0 && item.spec?.subjects?.[0]?.name) {
                  return (
                    <td key={i}>
                      <span>{cellContent}</span>
                      <span>(user: {item.spec.subjects[0].name})</span>
                    </td>
                  )
                }
                return <td key={i}>{cellContent}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>

      {/* Bulk actions */}
      {tableActions?.map((action: any, i: number) => (
        <button data-testid="table-action" key={i} onClick={() => action.click(items)}>
          {action.title}
        </button>
      ))}
    </div>
  ),
  AcmToastContext: React.createContext({ addAlert: jest.fn() }),
  compareStrings: (a: string, b: string) => a.localeCompare(b),
}))

const Component = () => (
  <RecoilRoot>
    <MemoryRouter
      initialEntries={['/multicloud/user-management/identities/users/mock-user-alice-trask/role-assignments']}
    >
      <PluginContext.Provider value={defaultPlugin}>
        <TestWrapper>
          <UserRoleAssignments />
        </TestWrapper>
      </PluginContext.Provider>
    </MemoryRouter>
  </RecoilRoot>
)

describe('UserRoleAssignments', () => {
  it('should render table with role assignments', async () => {
    const { container } = render(<Component />)

    // Should show the table structure using container queries
    expect(container.querySelector('[data-testid="acm-table"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="table-headers"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="table-action"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="create-button"]')).toBeInTheDocument()
    expect(container.querySelector('[data-testid="kebab-dropdown"]')).toBeInTheDocument()

    expect(screen.getByText('Delete role assignments')).toBeInTheDocument()
    expect(screen.getByText('Edit role assignments')).toBeInTheDocument()
  })

  it('should render create role assignment button', async () => {
    render(<Component />)

    // Wait for component to load and check button
    await waitForText('Create role assignment')
    expect(screen.getByText('Create role assignment')).toBeInTheDocument()
  })

  it('should render specific mock data content', async () => {
    render(<Component />)

    // Wait for component to load
    await waitForText('Create role assignment')

    // Test Role data
    expect(screen.getByText('cluster-admin')).toBeInTheDocument()
    expect(screen.getByText('monitoring:viewer')).toBeInTheDocument()
    expect(screen.getByText('kubevirt:admin')).toBeInTheDocument()

    // Test Cluster data
    const developmentClusters = screen.getAllByText('development-cluster')
    expect(developmentClusters.length).toBeGreaterThan(0)
    expect(screen.getByText('storage-cluster')).toBeInTheDocument()

    // Test Namespace data
    expect(screen.getByText('default')).toBeInTheDocument()
    expect(screen.getByText('kube-system')).toBeInTheDocument()
    expect(screen.getByText('kubevirt')).toBeInTheDocument()

    // Test Subject/User data
    const aliceElements = screen.getAllByText((content) => content.includes('alice.trask'))
    expect(aliceElements.length).toBeGreaterThan(0)
  })
})

describe('UserRoleAssignments expected columns', () => {
  it('should render expected table headers', async () => {
    render(<Component />)
    await waitForText('Create role assignment')

    const expectedHeaders = ['Roles', 'Cluster', 'Namespace', 'Status', 'Created']
    expectedHeaders.forEach((header) => {
      expect(screen.getByText(header)).toBeInTheDocument()
    })
  })

  it('should render expected bulk actions', async () => {
    render(<Component />)
    await waitForText('Create role assignment')

    const expectedBulkActions = ['Delete role assignments', 'Edit role assignments']
    expectedBulkActions.forEach((action) => {
      expect(screen.getByText(action)).toBeInTheDocument()
    })
  })
})

describe('UserRoleAssignments delete confirmation interaction', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockAddAlert.mockClear()
    globalModalSpy.mockClear()
    delete (global as any).testActionFn
  })

  it('should configure and trigger delete confirmation modal when bulk delete button is clicked', async () => {
    render(<Component />)
    await waitForText('Create role assignment')

    // Verify delete button exists
    expect(screen.getByText('Delete role assignments')).toBeInTheDocument()

    // Click delete button
    const deleteButton = screen.getByText('Delete role assignments')
    fireEvent.click(deleteButton)

    // Verify the modal was called with correct configuration
    const openCall = globalModalSpy.mock.calls.find((call) => call[0]?.open === true)

    const modalProps = openCall[0]
    expect(modalProps.title).toBe('Delete role assignments?')
    expect(modalProps.description).toBe(
      'Are you sure that you want to delete the role assignments? This action cannot be undone.'
    )
    expect(modalProps.confirmText).toBe('delete')
    expect(modalProps.isDanger).toBe(true)
    expect(modalProps.icon).toBe('warning')
    expect(modalProps.items).toHaveLength(7)
  })

  it('should execute delete action when actionFn is called', async () => {
    const mockConsoleLog = jest.spyOn(console, 'log').mockImplementation(() => {})

    render(<Component />)
    await waitForText('Create role assignment')

    // Click delete button to trigger modal
    const deleteButton = screen.getByText('Delete role assignments')
    fireEvent.click(deleteButton)

    // Wait for modal to be configured and actionFn to be stored
    await waitFor(() => {
      expect((global as any).testActionFn).toBeTruthy()
    })

    // Execute the action function with a mock role assignment
    const mockRoleAssignment = { metadata: { name: 'test-assignment' } }
    const actionFn = (global as any).testActionFn

    // Verify the actionFn exists and can be called
    expect(typeof actionFn).toBe('function')

    // Execute the function
    const result = actionFn(mockRoleAssignment)

    // Verify it returns the expected structure (promise and abort function)
    expect(result).toHaveProperty('promise')
    expect(result).toHaveProperty('abort')
    expect(typeof result.abort).toBe('function')

    // Verify console.log was called (simulating the delete action)
    expect(mockConsoleLog).toHaveBeenCalledWith('Bulk deleting role assignment:', 'test-assignment')

    mockConsoleLog.mockRestore()
  })
})
