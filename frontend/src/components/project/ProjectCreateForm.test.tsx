/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProjectCreateForm, ProjectFormData } from './ProjectCreateForm'
import * as validation from './validation'

const mockOnCancel = jest.fn()
const mockOnSubmit = jest.fn()

// Mock the validation functions
jest.mock('./validation', () => ({
  validateName: jest.fn(),
  validateDisplayName: jest.fn(),
  validateDescription: jest.fn(),
}))

const mockValidation = validation as jest.Mocked<typeof validation>

describe('ProjectCreateForm', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Reset validation mocks to return undefined (valid) by default
    mockValidation.validateName.mockReturnValue(undefined)
    mockValidation.validateDisplayName.mockReturnValue(undefined)
    mockValidation.validateDescription.mockReturnValue(undefined)
  })

  it('renders the form with all required elements', () => {
    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    expect(screen.getByText('Create common project')).toBeInTheDocument()
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
    const displayNameInput = screen.getByLabelText(/Display name/)
    const descriptionInput = screen.getByLabelText(/Description/)

    await userEvent.type(nameInput, 'test-name')
    await userEvent.type(displayNameInput, 'Test Display Name')
    await userEvent.type(descriptionInput, 'Test description')

    // Validation functions should be called with the translation function
    expect(mockValidation.validateName).toHaveBeenCalled()
    expect(mockValidation.validateDisplayName).toHaveBeenCalled()
    expect(mockValidation.validateDescription).toHaveBeenCalled()
  })

  it('displays validation errors when validation functions return errors', async () => {
    mockValidation.validateName.mockReturnValue('Name is required')
    mockValidation.validateDisplayName.mockReturnValue('Display name too long')
    mockValidation.validateDescription.mockReturnValue('Description too long')

    render(<ProjectCreateForm onCancelCallback={mockOnCancel} onSubmit={mockOnSubmit} />)

    const nameInput = screen.getByLabelText(/Name/)
    await userEvent.type(nameInput, 'test')

    await waitFor(() => {
      expect(screen.getByText('Name is required')).toBeInTheDocument()
    })
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
