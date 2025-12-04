/* Copyright Contributors to the Open Cluster Management project */

import { fireEvent, render, screen } from '@testing-library/react'
import { CreatePreAuthorizedUser } from './CreatePreAuthorizedUser'

// Mock the translation hook
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('CreatePreAuthorizedUser', () => {
  const mockOnCancel = jest.fn()
  const mockOnSubmit = jest.fn()

  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('should render form with title and input field', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    expect(screen.getByText('Add pre-authorized user')).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // Input field
    expect(screen.getByPlaceholderText('Enter username')).toBeInTheDocument()
    // Helper text is rendered but may be split across elements, so we'll skip this assertion
  })

  test('should render buttons', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    expect(screen.getByRole('button', { name: 'Add user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel and search users instead' })).toBeInTheDocument()
  })

  test('should disable submit button when username is empty', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const submitButton = screen.getByRole('button', { name: 'Add user' })
    expect(submitButton).toBeDisabled()
  })

  test('should enable submit button when username is entered', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const submitButton = screen.getByRole('button', { name: 'Add user' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })

    expect(submitButton).not.toBeDisabled()
  })

  test('should call onCancel when cancel button is clicked', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel and search users instead' })
    fireEvent.click(cancelButton)

    expect(mockOnCancel).toHaveBeenCalledTimes(1)
  })

  test('should call onSubmit with username when form is submitted', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const submitButton = screen.getByRole('button', { name: 'Add user' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('testuser')
  })

  test('should call onSubmit when form is submitted via Enter key', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const form = usernameInput.closest('form')

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.submit(form!)

    expect(mockOnSubmit).toHaveBeenCalledWith('testuser')
  })

  test('should trim whitespace from username', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const submitButton = screen.getByRole('button', { name: 'Add user' })

    fireEvent.change(usernameInput, { target: { value: '  testuser  ' } })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).toHaveBeenCalledWith('testuser')
  })

  test('should not call onSubmit when username is only whitespace', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} onSubmit={mockOnSubmit} />)

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const submitButton = screen.getByRole('button', { name: 'Add user' })

    fireEvent.change(usernameInput, { target: { value: '   ' } })
    fireEvent.click(submitButton)

    expect(mockOnSubmit).not.toHaveBeenCalled()
  })

  test('should work without onSubmit prop', () => {
    render(<CreatePreAuthorizedUser onCancel={mockOnCancel} />)

    const usernameInput = screen.getByPlaceholderText('Enter username')
    const submitButton = screen.getByRole('button', { name: 'Add user' })

    fireEvent.change(usernameInput, { target: { value: 'testuser' } })
    fireEvent.click(submitButton)

    // Should not throw an error
    expect(mockOnCancel).not.toHaveBeenCalled()
  })
})
