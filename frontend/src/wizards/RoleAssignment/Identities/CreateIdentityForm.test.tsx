/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateIdentityForm } from './CreateIdentityForm'

jest.mock('../../../resources/rbac', () => ({
  createUser: jest.fn(),
  createGroup: jest.fn(),
  UserApiVersion: 'user.openshift.io/v1',
  UserKind: 'User',
  GroupKind: 'Group',
}))

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}))

import { createGroup, createUser } from '../../../resources/rbac'

const mockCreateUser = createUser as jest.MockedFunction<typeof createUser>
const mockCreateGroup = createGroup as jest.MockedFunction<typeof createGroup>

describe('CreateIdentityForm', () => {
  const defaultProps = {
    subjectKind: 'User' as const,
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
    mockCreateGroup.mockReturnValue({
      promise: Promise.resolve({
        apiVersion: 'user.openshift.io/v1',
        kind: 'Group',
        metadata: { name: 'test-group' },
        users: [],
      }),
      abort: jest.fn(),
    })
  })

  it('renders user form elements', () => {
    render(<CreateIdentityForm {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Save user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByTestId('identity-identifier')).toBeInTheDocument()
  })

  it('renders group form elements with correct label', () => {
    render(<CreateIdentityForm {...defaultProps} subjectKind="Group" saveButtonText="Save group" />)

    expect(screen.getByRole('button', { name: 'Save group' })).toBeInTheDocument()
    expect(screen.getByTestId('identity-identifier')).toBeInTheDocument()
  })

  it('calls createUser on submit when subjectKind is User', async () => {
    render(<CreateIdentityForm {...defaultProps} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'test.user@example.com')

    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({ metadata: { name: 'test.user@example.com' } })
    })

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('calls createGroup on submit when subjectKind is Group', async () => {
    render(<CreateIdentityForm {...defaultProps} subjectKind="Group" saveButtonText="Save group" />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'my-group')

    const submitButton = screen.getByRole('button', { name: 'Save group' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateGroup).toHaveBeenCalledWith({ metadata: { name: 'my-group' }, users: [] })
    })

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onCancel when cancel button is clicked', async () => {
    render(<CreateIdentityForm {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelButton)

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('calls onError when createUser rejects', async () => {
    mockCreateUser.mockReturnValue({
      promise: Promise.reject(new Error('fail')),
      abort: jest.fn(),
    })

    render(<CreateIdentityForm {...defaultProps} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'test.user')

    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onError).toHaveBeenCalledWith('test.user')
    })
    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
  })

  it('validates that identifier is required', async () => {
    render(<CreateIdentityForm {...defaultProps} />)

    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    expect(mockCreateUser).not.toHaveBeenCalled()
  })

  it('trims whitespace from identifier', async () => {
    render(<CreateIdentityForm {...defaultProps} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, '  test.user  ')

    const submitButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(mockCreateUser).toHaveBeenCalledWith({ metadata: { name: 'test.user' } })
    })
  })
})
