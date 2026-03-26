/* Copyright Contributors to the Open Cluster Management project */

import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreateIdentityFormDirectAuthentication } from './CreateIdentityFormDirectAuthentication'
import { ClaimMappings } from '~/resources/authentication'

jest.mock('../../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) {
        return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), key)
      }
      return key
    },
  }),
}))

describe('CreateIdentityFormDirectAuthentication', () => {
  const defaultProps = {
    subjectKind: 'User' as const,
    claimMappings: undefined as ClaimMappings | undefined,
    saveButtonText: 'Save',
    cancelButtonText: 'Cancel',
    onSuccess: jest.fn(),
    onCancel: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('renders form elements', () => {
    render(<CreateIdentityFormDirectAuthentication {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Save' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel' })).toBeInTheDocument()
    expect(screen.getByTestId('identity-identifier')).toBeInTheDocument()
  })

  it('returns a synthetic User object on submit without API call', async () => {
    render(<CreateIdentityFormDirectAuthentication {...defaultProps} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'oidc:test@example.com')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: 'user.openshift.io/v1',
          kind: 'User',
          metadata: { name: 'oidc:test@example.com' },
        })
      )
    })
  })

  it('returns a synthetic Group object when subjectKind is Group', async () => {
    render(<CreateIdentityFormDirectAuthentication {...defaultProps} subjectKind="Group" />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'oidc:my-group')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          apiVersion: 'user.openshift.io/v1',
          kind: 'Group',
          metadata: { name: 'oidc:my-group' },
          users: [],
        })
      )
    })
  })

  it('shows warning on input but allows submission when user prefix does not match', async () => {
    const claimMappings: ClaimMappings = {
      username: { claim: 'email', prefix: { prefixString: 'oidc:' }, prefixPolicy: 'Prefix' },
    }

    render(<CreateIdentityFormDirectAuthentication {...defaultProps} claimMappings={claimMappings} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'no-prefix-user')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { name: 'no-prefix-user' },
        })
      )
    })
  })

  it('passes validation when user identifier starts with prefix', async () => {
    const claimMappings: ClaimMappings = {
      username: { claim: 'email', prefix: { prefixString: 'oidc:' }, prefixPolicy: 'Prefix' },
    }

    render(<CreateIdentityFormDirectAuthentication {...defaultProps} claimMappings={claimMappings} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'oidc:user@example.com')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('shows warning on input but allows submission when group prefix does not match', async () => {
    const claimMappings: ClaimMappings = {
      groups: { claim: 'groups', prefix: 'oidc:' },
    }

    render(
      <CreateIdentityFormDirectAuthentication {...defaultProps} subjectKind="Group" claimMappings={claimMappings} />
    )

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'no-prefix-group')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: { name: 'no-prefix-group' },
        })
      )
    })
  })

  it('passes validation when group identifier starts with prefix', async () => {
    const claimMappings: ClaimMappings = {
      groups: { claim: 'groups', prefix: 'oidc:' },
    }

    render(
      <CreateIdentityFormDirectAuthentication {...defaultProps} subjectKind="Group" claimMappings={claimMappings} />
    )

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'oidc:admin-group')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    await waitFor(() => {
      expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
    })
  })

  it('calls onCancel when cancel is clicked', async () => {
    render(<CreateIdentityFormDirectAuthentication {...defaultProps} />)

    const cancelButton = screen.getByRole('button', { name: 'Cancel' })
    await userEvent.click(cancelButton)

    expect(defaultProps.onCancel).toHaveBeenCalledTimes(1)
  })

  it('uses custom validation when provided', async () => {
    const customValidation = jest.fn().mockReturnValue('custom error')

    render(<CreateIdentityFormDirectAuthentication {...defaultProps} validation={customValidation} />)

    const input = screen.getByTestId('identity-identifier')
    await userEvent.type(input, 'test')

    const submitButton = screen.getByRole('button', { name: 'Save' })
    await userEvent.click(submitButton)

    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
  })

  it('shows prefix-based placeholder for users with Prefix policy', () => {
    const claimMappings: ClaimMappings = {
      username: { claim: 'email', prefix: { prefixString: 'oidc:' }, prefixPolicy: 'Prefix' },
    }

    render(<CreateIdentityFormDirectAuthentication {...defaultProps} claimMappings={claimMappings} />)

    const input = screen.getByTestId('identity-identifier')
    expect(input).toHaveAttribute('placeholder', 'oidc:username')
  })

  it('shows prefix-based placeholder for groups', () => {
    const claimMappings: ClaimMappings = {
      groups: { claim: 'groups', prefix: 'oidc:' },
    }

    render(
      <CreateIdentityFormDirectAuthentication {...defaultProps} subjectKind="Group" claimMappings={claimMappings} />
    )

    const input = screen.getByTestId('identity-identifier')
    expect(input).toHaveAttribute('placeholder', 'oidc:group-name')
  })

  it('shows default placeholder when no claimMappings', () => {
    render(<CreateIdentityFormDirectAuthentication {...defaultProps} />)

    const input = screen.getByTestId('identity-identifier')
    expect(input).toHaveAttribute('placeholder', 'user@company.com or username')
  })
})
