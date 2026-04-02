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
          metadata: expect.objectContaining({ name: 'oidc:test@example.com' }),
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
          metadata: expect.objectContaining({ name: 'oidc:my-group' }),
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
          metadata: expect.objectContaining({ name: 'no-prefix-user' }),
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
          metadata: expect.objectContaining({ name: 'no-prefix-group' }),
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

  describe('generated uid for in-memory identities', () => {
    const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i

    it('should generate a valid uuid for a created User', async () => {
      render(<CreateIdentityFormDirectAuthentication {...defaultProps} />)

      await userEvent.type(screen.getByTestId('identity-identifier'), 'test-user')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
      })

      const createdUser = defaultProps.onSuccess.mock.calls[0][0]
      expect(createdUser.metadata.uid).toBeDefined()
      expect(createdUser.metadata.uid).toMatch(UUID_REGEX)
    })

    it('should generate a valid uuid for a created Group', async () => {
      render(<CreateIdentityFormDirectAuthentication {...defaultProps} subjectKind="Group" />)

      await userEvent.type(screen.getByTestId('identity-identifier'), 'test-group')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))

      await waitFor(() => {
        expect(defaultProps.onSuccess).toHaveBeenCalledTimes(1)
      })

      const createdGroup = defaultProps.onSuccess.mock.calls[0][0]
      expect(createdGroup.metadata.uid).toBeDefined()
      expect(createdGroup.metadata.uid).toMatch(UUID_REGEX)
    })

    it('should generate unique uids for each created identity', async () => {
      const onSuccess1 = jest.fn()
      const onSuccess2 = jest.fn()

      const { unmount } = render(<CreateIdentityFormDirectAuthentication {...defaultProps} onSuccess={onSuccess1} />)
      await userEvent.type(screen.getByTestId('identity-identifier'), 'user-one')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(onSuccess1).toHaveBeenCalledTimes(1))
      unmount()

      render(<CreateIdentityFormDirectAuthentication {...defaultProps} onSuccess={onSuccess2} />)
      await userEvent.type(screen.getByTestId('identity-identifier'), 'user-two')
      await userEvent.click(screen.getByRole('button', { name: 'Save' }))
      await waitFor(() => expect(onSuccess2).toHaveBeenCalledTimes(1))

      const uid1 = onSuccess1.mock.calls[0][0].metadata.uid
      const uid2 = onSuccess2.mock.calls[0][0].metadata.uid
      expect(uid1).not.toEqual(uid2)
    })
  })
})
