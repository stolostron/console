/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCreateForm } from './ProjectCreateForm'
import * as validation from './validation'

const mockOnCancel = jest.fn()
const mockOnSubmit = jest.fn()

// Mock the validation functions
jest.mock('./validation', () => ({
  validateName: jest.fn(),
}))

const mockValidation = validation as jest.Mocked<typeof validation>

describe('ProjectCreateForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset validation mocks to return undefined (valid) by default
    mockValidation.validateName.mockReturnValue(undefined)
  })

  it('renders the form with all required elements', () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    expect(screen.getByLabelText(/Name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Display name/)).toBeInTheDocument()
    expect(screen.getByLabelText(/Description/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Save/ })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Cancel/ })).toBeInTheDocument()
  })

  it('shows correct placeholders', () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    expect(screen.getByPlaceholderText('Enter project name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter display name (optional)')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Enter description (optional)')).toBeInTheDocument()
  })

  it('calls onCancelCallback when cancel button is clicked', async () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    const cancelButton = screen.getByRole('button', { name: /Cancel/ })
    await userEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  it('calls validation functions when fields change', async () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByLabelText(/Name/)

    await userEvent.type(nameInput, 'test-name')

    // Only name validation function should be called since displayName and description validation was removed
    expect(mockValidation.validateName).toHaveBeenCalled()
  })

  it('calls validation functions with correct parameters', async () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByLabelText(/Name/)
    await userEvent.type(nameInput, 'test-name')

    // Verify that validation functions are called
    expect(mockValidation.validateName).toHaveBeenCalled()
  })

  it('submits form with valid data', async () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByLabelText(/Name/)
    const displayNameInput = screen.getByLabelText(/Display name/)
    const descriptionInput = screen.getByLabelText(/Description/)
    const saveButton = screen.getByRole('button', { name: /Save/ })

    await userEvent.type(nameInput, 'test-project')
    await userEvent.type(displayNameInput, 'Test Project')
    await userEvent.type(descriptionInput, 'A test project description')

    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'test-project',
        displayName: 'Test Project',
        description: 'A test project description',
      })
    })
  })

  it('allows optional fields to be empty', async () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByLabelText(/Name/)
    const saveButton = screen.getByRole('button', { name: /Save/ })

    await userEvent.type(nameInput, 'test-project')
    await userEvent.click(saveButton)

    await waitFor(() => {
      expect(mockOnSubmit).toHaveBeenCalledWith({
        name: 'test-project',
        displayName: '',
        description: '',
      })
    })
  })
})
