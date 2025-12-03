/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import React from 'react'
import { RolesList } from './RolesList'

// Mock the translation hook
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock RolesTable component
const mockRolesTable = jest.fn()
jest.mock('../../../routes/UserManagement/Roles/RolesTable', () => ({
  RolesTable: (props: any) => {
    mockRolesTable(props)
    const [selectedRole, setSelectedRole] = React.useState<string>()

    const handleRadioSelect = (roleName: string) => {
      setSelectedRole(roleName)
      props.onRadioSelect(roleName)
    }

    return (
      <div data-testid="roles-table">
        <table>
          <tbody>
            <tr data-testid="role-row-admin">
              <td>admin</td>
              <td>cluster-admin permissions</td>
              <td>
                <input
                  type="radio"
                  name="role-selection"
                  aria-label="Select role admin"
                  checked={selectedRole === 'admin'}
                  onChange={() => handleRadioSelect('admin')}
                />
              </td>
            </tr>
            <tr data-testid="role-row-viewer">
              <td>viewer</td>
              <td>read-only permissions</td>
              <td>
                <input
                  type="radio"
                  name="role-selection"
                  aria-label="Select role viewer"
                  checked={selectedRole === 'viewer'}
                  onChange={() => handleRadioSelect('viewer')}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    )
  },
}))

describe('RolesList', () => {
  const mockOnRadioSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockRolesTable.mockClear()
  })

  it('renders the component with title and subtitle', () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    expect(screen.getByText('Roles')).toBeInTheDocument()
    expect(screen.getByText('Choose a role to assign.')).toBeInTheDocument()
  })

  it('renders RolesTable with correct props', () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    expect(mockRolesTable).toHaveBeenCalledWith({
      onRadioSelect: expect.any(Function), // Now it's the internal handler
      areLinksAllowed: false,
    })
  })

  it('passes onRadioSelect callback to RolesTable', async () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    const adminRadio = screen.getByLabelText('Select role admin')
    await userEvent.click(adminRadio)

    expect(mockOnRadioSelect).toHaveBeenCalledWith('admin')
  })

  it('passes onRadioSelect to RolesTable correctly', () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    // Verify that the onRadioSelect prop is passed correctly to RolesTable
    expect(mockRolesTable).toHaveBeenCalledWith(
      expect.objectContaining({
        onRadioSelect: mockOnRadioSelect,
      })
    )
  })

  it('handles role selection through RolesTable', async () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    // Simulate radio selection through the mock
    const viewerRadio = screen.getByLabelText('Select role viewer')
    await userEvent.click(viewerRadio)

    expect(mockOnRadioSelect).toHaveBeenCalledWith('viewer')
  })

  it('passes areLinksAllowed=false to RolesTable', () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    expect(mockRolesTable).toHaveBeenCalledWith(
      expect.objectContaining({
        areLinksAllowed: false,
      })
    )
  })

  it('renders with no selected role by default', () => {
    render(<RolesList onRadioSelect={mockOnRadioSelect} />)

    const adminRadio = screen.getByLabelText('Select role admin')
    const viewerRadio = screen.getByLabelText('Select role viewer')

    expect(adminRadio).not.toBeChecked()
    expect(viewerRadio).not.toBeChecked()
  })
})
