/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { RoleSelectionStepContent } from './RoleSelectionStepContent'

// Mock RolesList - the mock will be hoisted automatically
const mockRolesList = jest.fn()

jest.mock('./Roles/RolesList', () => ({
  RolesList: (props: any) => {
    mockRolesList(props)
    return (
      <div data-testid="roles-list">
        Roles List
        <button onClick={() => props.onRadioSelect('admin-role')}>Select Admin Role</button>
        <button onClick={() => props.onRadioSelect('viewer-role')}>Select Viewer Role</button>
      </div>
    )
  },
}))

describe('RoleSelectionStepContent', () => {
  const mockOnRoleSelect = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
    mockRolesList.mockClear()
  })

  it('renders RolesList component', () => {
    render(<RoleSelectionStepContent onRoleSelect={mockOnRoleSelect} />)

    expect(mockRolesList).toHaveBeenCalled()
    expect(mockRolesList).toHaveBeenCalledWith(
      expect.objectContaining({
        onRadioSelect: mockOnRoleSelect,
      })
    )
  })

  it('calls onRoleSelect when a role is selected', () => {
    render(<RoleSelectionStepContent onRoleSelect={mockOnRoleSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'Select Admin Role' }))
    expect(mockOnRoleSelect).toHaveBeenCalledWith('admin-role')
  })

  it('calls onRoleSelect with different role names', () => {
    render(<RoleSelectionStepContent onRoleSelect={mockOnRoleSelect} />)

    fireEvent.click(screen.getByRole('button', { name: 'Select Viewer Role' }))
    expect(mockOnRoleSelect).toHaveBeenCalledWith('viewer-role')
  })

  it('passes onRoleSelect callback to RolesList as onRadioSelect', () => {
    render(<RoleSelectionStepContent onRoleSelect={mockOnRoleSelect} />)

    // Verify the component was called with the correct props
    expect(mockRolesList).toHaveBeenCalledWith(
      expect.objectContaining({
        onRadioSelect: mockOnRoleSelect,
      })
    )

    // Verify the callback works when triggered
    fireEvent.click(screen.getByRole('button', { name: 'Select Admin Role' }))
    expect(mockOnRoleSelect).toHaveBeenCalledTimes(1)
  })
})
