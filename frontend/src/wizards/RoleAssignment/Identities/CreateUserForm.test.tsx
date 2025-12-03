/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateUserForm } from './CreateUserForm'
// Mock the createUser function
jest.mock('../../../resources/rbac', () => ({
  createUser: jest.fn(),
  UserApiVersion: 'user.openshift.io/v1',
  UserKind: 'User',
}))

// Mock the translation hook
jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

describe('CreateUserForm - Simple Tests', () => {
  const defaultProps = {
    saveButtonText: 'Save user',
    cancelButtonText: 'Cancel',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
    onError: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders basic form elements', () => {
    render(<CreateUserForm {...defaultProps} />)

    // Check that buttons are rendered with correct text
    expect(screen.getByRole('button', { name: 'Save user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()

    // Check that form inputs exist
    expect(screen.getByTestId('user-identifier')).toBeInTheDocument()
    // AcmSelect renders as a combobox
    expect(screen.getByRole('combobox')).toBeInTheDocument()
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

  it('renders identity provider options when select is opened', async () => {
    render(<CreateUserForm {...defaultProps} />)

    // Click on the select to open it
    const selectCombobox = screen.getByRole('combobox')
    await userEvent.click(selectCombobox)

    // Check that identity provider options are available
    expect(screen.getByRole('option', { name: 'Any identity provider' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'HTPasswd' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'LDAP' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'OAuth' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'GitHub' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'Google' })).toBeInTheDocument()
    expect(screen.getByRole('option', { name: 'SAML' })).toBeInTheDocument()
  })
})
