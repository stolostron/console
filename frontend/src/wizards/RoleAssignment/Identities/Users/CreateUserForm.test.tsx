/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateUserForm } from './CreateUserForm'

// Mock the createUser function
jest.mock('../../../../resources/rbac', () => ({
  createUser: jest.fn(),
  UserApiVersion: 'user.openshift.io/v1',
  UserKind: 'User',
}))

// Mock the translation hook
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Import the mocked functions
import { createUser } from '../../../../resources/rbac'

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>

describe('CreateUserForm', () => {
  const defaultProps = {
    saveButtonText: 'Save user',
    cancelButtonText: 'Cancel',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    onError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    mockCreateUser.mockReturnValue({
      promise: Promise.resolve({
        apiVersion: 'user.openshift.io/v1',
        kind: 'User',
        metadata: { name: 'test-user' },
        identities: [],
      }),
      abort: jest.fn(),
    })
  })

  it('renders basic form elements', () => {
    render(<CreateUserForm {...defaultProps} />)

    // Check that buttons are rendered with correct text
    expect(screen.getByRole('button', { name: 'Save user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    // Check that form inputs exist
    expect(screen.getByTestId('user-identifier')).toBeInTheDocument()
  })

  it('calls onCancel when cancel button is clicked', async () => {
    render(<CreateUserForm {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelButton)

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('displays custom button texts', () => {
    const customProps = {
      ...defaultProps,
      saveButtonText: 'Create Pre-authorized User',
      cancelButtonText: 'Go Back to Search',
    }

    render(<CreateUserForm {...customProps} />)

    expect(screen.getByRole('button', { name: 'Create Pre-authorized User' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Go Back to Search' })).toBeInTheDocument()
  })

  it('submits form with correct user data', async () => {
    render(<CreateUserForm {...defaultProps} />)

    // Fill in the user identifier
    const userInput = screen.getByTestId('user-identifier')
    await userEvent.type(userInput, 'test.user@example.com')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    // Verify createUser was called with correct data
    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        metadata: {
          name: 'test.user@example.com',
        },
      })
    })

    // Verify onSuccess was called
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('handles form submission error correctly', async () => {
    // Mock createUser to reject
    const errorMessage = 'User creation failed'
    mockCreateUser.mockReturnValue({
      promise: Promise.reject(new Error(errorMessage)),
      abort: jest.fn(),
    })

    render(<CreateUserForm {...defaultProps} />)

    // Fill in the user identifier
    const userInput = screen.getByTestId('user-identifier')
    await userEvent.type(userInput, 'test.user')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    // Verify onError was called with the user name
    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith('test.user')
    })

    // Verify onSuccess was not called
    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
  })

  it('validates user identifier is required', async () => {
    render(<CreateUserForm {...defaultProps} />)

    // Try to submit without entering user identifier
    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    // Should not call createUser when validation fails
    expect(mockCreateUser).not.toHaveBeenCalled()

    // The validation message display is handled by AcmTextInput component
    // The important thing is that createUser is not called with invalid data
  })

  it('trims whitespace from user identifier', async () => {
    render(<CreateUserForm {...defaultProps} />)

    // Fill in the user identifier with whitespace
    const userInput = screen.getByTestId('user-identifier')
    await userEvent.type(userInput, '  test.user  ')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    // Verify createUser was called with trimmed name
    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({
        metadata: {
          name: 'test.user', // Trimmed
        },
      })
    })
  })

  it('displays processing state during form submission', async () => {
    // Mock a delayed promise
    let resolvePromise: (value: any) => void
    const delayedPromise = new Promise((resolve) => {
      resolvePromise = resolve
    })

    mockCreateUser.mockReturnValue({
      promise: delayedPromise as any,
      abort: jest.fn(),
    })

    render(<CreateUserForm {...defaultProps} />)

    // Fill in the user identifier
    const userInput = screen.getByTestId('user-identifier')
    await userEvent.type(userInput, 'test.user')

    // Submit the form
    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    // Should show processing state
    expect(screen.getByText('Saving...')).toBeInTheDocument()

    // Resolve the promise
    resolvePromise!({
      apiVersion: 'user.openshift.io/v1',
      kind: 'User',
      metadata: { name: 'test.user' },
      identities: [],
    })

    // Wait for processing to complete
    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })
})
