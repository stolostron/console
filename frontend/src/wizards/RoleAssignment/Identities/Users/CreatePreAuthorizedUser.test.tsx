/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePreAuthorizedUser } from './CreatePreAuthorizedUser'

// Mock the translation hook
jest.mock('../../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

// Mock the AcmToastContext
const mockAddAlert = jest.fn()
jest.mock('react', () => ({
  ...jest.requireActual('react'),
  useContext: () => ({
    addAlert: mockAddAlert,
  }),
}))

// Mock the CreateUserForm component to avoid complex form validation issues
jest.mock('./CreateUserForm', () => ({
  CreateUserForm: ({ saveButtonText, cancelButtonText, onCancel, onSuccess, onError }: any) => {
    const mockUser = { metadata: { name: 'created-user', uid: 'created-user-uid' } }
    return (
      <div>
        <div>Mocked CreateUserForm</div>
        <button onClick={onCancel}>{cancelButtonText}</button>
        <button onClick={() => onSuccess(mockUser)} data-testid="trigger-success">
          {saveButtonText}
        </button>
        <button onClick={() => onError('error-user-name')} data-testid="trigger-error">
          Trigger error
        </button>
      </div>
    )
  },
}))

describe('CreatePreAuthorizedUser', () => {
  const defaultProps = {
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders description text and CreateUserForm', () => {
    render(<CreatePreAuthorizedUser {...defaultProps} />)

    expect(
      screen.getByText("This role assignment will activate automatically on the user's first login.")
    ).toBeInTheDocument()
    expect(screen.getByText('Mocked CreateUserForm')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Save pre-authorized user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel and search users instead' })).toBeInTheDocument()
  })

  it('calls onClose when cancel button is clicked', async () => {
    render(<CreatePreAuthorizedUser {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel and search users instead' })
    await userEvent.click(cancelButton)

    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('passes correct props to CreateUserForm', () => {
    render(<CreatePreAuthorizedUser {...defaultProps} />)

    // Verify the correct button texts are displayed (passed as props to CreateUserForm)
    expect(screen.getByRole('button', { name: 'Save pre-authorized user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel and search users instead' })).toBeInTheDocument()
  })

  it('calls onSuccess with user and onClose when handleSuccess is triggered', async () => {
    render(<CreatePreAuthorizedUser {...defaultProps} />)

    const successButton = screen.getByRole('button', { name: 'Save pre-authorized user' })
    await userEvent.click(successButton)

    expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    expect(defaultProps.onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'created-user', uid: 'created-user-uid' } })
    )
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
  })

  it('does not call onClose or onSuccess when handleError is triggered', async () => {
    render(<CreatePreAuthorizedUser {...defaultProps} />)

    const errorButton = screen.getByRole('button', { name: 'Trigger error' })
    await userEvent.click(errorButton)

    expect(defaultProps.onClose).not.toHaveBeenCalled()
    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        title: 'Failed to create pre-authorized user',
        type: 'danger',
      })
    )
  })
})
