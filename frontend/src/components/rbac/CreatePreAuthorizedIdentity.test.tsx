/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { CreatePreAuthorizedIdentity } from './CreatePreAuthorizedIdentity'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { ClaimMappings } from '~/resources/authentication'

jest.mock('../../lib/acm-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, opts?: Record<string, string>) => {
      if (opts) return Object.entries(opts).reduce((s, [k, v]) => s.replace(`{{${k}}}`, v), key)
      return key
    },
  }),
}))

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const mockAddAlert = jest.fn()
jest.mock('../../ui-components/AcmAlert/AcmToast', () => ({
  AcmToastContext: {
    _currentValue: { addAlert: jest.fn() },
    Provider: ({ children }: any) => children,
    Consumer: ({ children }: any) => children({ addAlert: jest.fn() }),
  },
}))

jest.mock('../../wizards/RoleAssignment/Identities/CreateIdentityForm', () => ({
  CreateIdentityForm: ({ subjectKind, saveButtonText, cancelButtonText, onCancel, onSuccess, onError }: any) => {
    const mockUser = { metadata: { name: 'created-user', uid: 'uid-1' } }
    const mockGroup = { metadata: { name: 'created-group', uid: 'uid-2' }, users: [] }
    return (
      <div>
        <span>CreateIdentityForm ({subjectKind})</span>
        <button onClick={onCancel}>{cancelButtonText}</button>
        <button onClick={() => onSuccess(subjectKind === 'User' ? mockUser : mockGroup)}>{saveButtonText}</button>
        <button onClick={() => onError('error-name')}>Trigger error</button>
      </div>
    )
  },
}))

jest.mock('../../wizards/RoleAssignment/Identities/CreateIdentityFormDirectAuthentication', () => ({
  CreateIdentityFormDirectAuthentication: ({
    subjectKind,
    saveButtonText,
    cancelButtonText,
    onCancel,
    onSuccess,
  }: any) => {
    const mockUser = { metadata: { name: 'mock-oidc-user' } }
    const mockGroup = { metadata: { name: 'mock-oidc-group' }, users: [] }
    return (
      <div>
        <span>DirectAuthForm ({subjectKind})</span>
        <button onClick={onCancel}>{cancelButtonText}</button>
        <button onClick={() => onSuccess(subjectKind === 'User' ? mockUser : mockGroup)}>{saveButtonText}</button>
      </div>
    )
  },
}))

const mockUseSharedAtoms = useSharedAtoms as jest.Mock
const mockUseRecoilValue = useRecoilValue as jest.Mock

function setupMocks(directAuth = false, claimMappings?: ClaimMappings) {
  const isDirectAuthEnabledAtom = Symbol('isDirectAuthenticationEnabledState')
  const claimMappingsAtom = Symbol('claimMappingsState')

  mockUseSharedAtoms.mockReturnValue({
    isDirectAuthenticationEnabledState: isDirectAuthEnabledAtom,
    claimMappingsState: claimMappingsAtom,
  })

  mockUseRecoilValue.mockImplementation((atom: unknown) => {
    if (atom === isDirectAuthEnabledAtom) return directAuth
    if (atom === claimMappingsAtom) return claimMappings
    return undefined
  })

  mockAddAlert.mockClear()
  const actualReact = jest.requireActual('react')
  useContextSpy = jest.spyOn(actualReact, 'useContext').mockReturnValue({ addAlert: mockAddAlert })
}

let useContextSpy: jest.SpyInstance | undefined

describe('CreatePreAuthorizedIdentity', () => {
  const defaultProps = {
    subjectKind: 'User' as const,
    onClose: jest.fn(),
    onSuccess: jest.fn(),
  }

  beforeEach(() => {
    jest.clearAllMocks()
    setupMocks(false)
  })

  afterEach(() => {
    useContextSpy?.mockRestore()
    useContextSpy = undefined
  })

  it('renders CreateIdentityForm when direct auth is disabled', () => {
    render(<CreatePreAuthorizedIdentity {...defaultProps} />)

    expect(screen.getByText('CreateIdentityForm (User)')).toBeInTheDocument()
    expect(screen.queryByText(/DirectAuthForm/)).not.toBeInTheDocument()
  })

  it('renders CreateIdentityFormDirectAuthentication when direct auth is enabled', () => {
    setupMocks(true)
    render(<CreatePreAuthorizedIdentity {...defaultProps} />)

    expect(screen.getByText('DirectAuthForm (User)')).toBeInTheDocument()
    expect(screen.queryByText(/CreateIdentityForm/)).not.toBeInTheDocument()
  })

  it('shows correct button text for User subjectKind', () => {
    render(<CreatePreAuthorizedIdentity {...defaultProps} />)

    expect(screen.getByRole('button', { name: 'Save user' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel and search users instead' })).toBeInTheDocument()
  })

  it('shows correct button text for Group subjectKind', () => {
    render(<CreatePreAuthorizedIdentity {...defaultProps} subjectKind="Group" />)

    expect(screen.getByRole('button', { name: 'Save group' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Cancel and search groups instead' })).toBeInTheDocument()
  })

  it('calls onSuccess and onClose on successful user creation', async () => {
    render(<CreatePreAuthorizedIdentity {...defaultProps} />)

    const successButton = screen.getByRole('button', { name: 'Save user' })
    await userEvent.click(successButton)

    expect(defaultProps.onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'created-user', uid: 'uid-1' } })
    )
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Pre-authorized user created', type: 'success' })
    )
  })

  it('calls onSuccess and onClose on successful group creation', async () => {
    render(<CreatePreAuthorizedIdentity {...defaultProps} subjectKind="Group" />)

    const successButton = screen.getByRole('button', { name: 'Save group' })
    await userEvent.click(successButton)

    expect(defaultProps.onSuccess).toHaveBeenCalledWith(
      expect.objectContaining({ metadata: { name: 'created-group', uid: 'uid-2' } })
    )
    expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Pre-authorized group created', type: 'success' })
    )
  })

  it('shows error toast on failure', async () => {
    render(<CreatePreAuthorizedIdentity {...defaultProps} />)

    const errorButton = screen.getByRole('button', { name: 'Trigger error' })
    await userEvent.click(errorButton)

    expect(defaultProps.onClose).not.toHaveBeenCalled()
    expect(defaultProps.onSuccess).not.toHaveBeenCalled()
    expect(mockAddAlert).toHaveBeenCalledWith(
      expect.objectContaining({ title: 'Failed to create pre-authorized user', type: 'danger' })
    )
  })

  it('renders direct auth form when OIDC is enabled with claimMappings', () => {
    const claimMappings: ClaimMappings = {
      username: { claim: 'email', prefix: { prefixString: 'oidc:' }, prefixPolicy: 'Prefix' },
      groups: { claim: 'groups', prefix: 'oidc:' },
    }
    setupMocks(true, claimMappings)

    render(<CreatePreAuthorizedIdentity {...defaultProps} />)

    expect(screen.getByText('DirectAuthForm (User)')).toBeInTheDocument()
  })

  describe('description text', () => {
    it('shows direct auth user description when direct auth is enabled and subjectKind is User', () => {
      setupMocks(true)
      render(<CreatePreAuthorizedIdentity {...defaultProps} />)

      expect(
        screen.getByText(
          'This user identifier will be used to match the external identity provider login and activate the role assignment. No user resource will be created.'
        )
      ).toBeInTheDocument()
    })

    it('shows direct auth group description when direct auth is enabled and subjectKind is Group', () => {
      setupMocks(true)
      render(<CreatePreAuthorizedIdentity {...defaultProps} subjectKind="Group" />)

      expect(
        screen.getByText(
          'This group identifier will be used to match the external identity provider login and activate the role assignment. No group resource will be created.'
        )
      ).toBeInTheDocument()
    })

    it('shows external IDP user description when direct auth is disabled and subjectKind is User', () => {
      setupMocks(false)
      render(<CreatePreAuthorizedIdentity {...defaultProps} />)

      expect(
        screen.getByText(
          "This role assignment will activate automatically on the user's first login. Once you proceed with the creation, the user will be created immediately."
        )
      ).toBeInTheDocument()
    })

    it('shows external IDP group description when direct auth is disabled and subjectKind is Group', () => {
      setupMocks(false)
      render(<CreatePreAuthorizedIdentity {...defaultProps} subjectKind="Group" />)

      expect(
        screen.getByText(
          "This role assignment will activate automatically on the group's first login. Once you proceed with the creation, the group will be created immediately."
        )
      ).toBeInTheDocument()
    })
  })
})
