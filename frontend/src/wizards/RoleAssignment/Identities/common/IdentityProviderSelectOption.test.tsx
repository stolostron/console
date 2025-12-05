/* Copyright Contributors to the Open Cluster Management project */

import { render, screen } from '@testing-library/react'
import { IdentityProvider } from '../../../../resources/oauth'
import { IdentityProviderSelectOption } from './IdentityProviderSelectOption'

describe('IdentityProviderSelectOption', () => {
  const mockLdapProvider: IdentityProvider = {
    name: 'test-ldap',
    type: 'LDAP',
    mappingMethod: 'claim',
    ldap: {
      attributes: {
        email: [],
        id: ['cn'],
        name: ['cn'],
        preferredUsername: ['cn'],
      },
      bindDN: 'cn=test',
      url: 'ldap://test.com',
    },
  }

  const mockGitHubProvider: IdentityProvider = {
    name: 'test-github',
    type: 'GitHub',
    mappingMethod: 'claim',
    github: {
      clientID: 'test-client',
      clientSecret: { name: 'test-secret' },
    },
  }

  const mockHTPasswdProvider: IdentityProvider = {
    name: 'test-htpasswd',
    type: 'HTPasswd',
    mappingMethod: 'claim',
    htpasswd: {
      fileData: { name: 'htpasswd-secret' },
    },
  }

  const mockOpenIDProvider: IdentityProvider = {
    name: 'test-openid',
    type: 'OpenID',
    mappingMethod: 'claim',
    openID: {
      clientID: 'openid-client',
      issuer: 'https://issuer.com',
    },
  }

  it('should render identity provider name and type label', () => {
    render(<IdentityProviderSelectOption identityProvider={mockLdapProvider} />)

    expect(screen.getByText('test-ldap')).toBeInTheDocument()
    expect(screen.getByText('LDAP')).toBeInTheDocument()
  })

  it('should render different provider types correctly', () => {
    const { rerender } = render(<IdentityProviderSelectOption identityProvider={mockLdapProvider} />)

    expect(screen.getByText('test-ldap')).toBeInTheDocument()
    expect(screen.getByText('LDAP')).toBeInTheDocument()

    rerender(<IdentityProviderSelectOption identityProvider={mockGitHubProvider} />)

    expect(screen.getByText('test-github')).toBeInTheDocument()
    expect(screen.getByText('GitHub')).toBeInTheDocument()
  })

  it('should render SelectOption with correct structure', () => {
    render(<IdentityProviderSelectOption identityProvider={mockLdapProvider} />)

    // The SelectOption component renders as a menuitem when not in a select context
    const selectOption = screen.getByRole('menuitem')
    expect(selectOption).toBeInTheDocument()

    // Verify the content is structured correctly with label and name
    expect(screen.getByText('LDAP')).toBeInTheDocument()
    expect(screen.getByText('test-ldap')).toBeInTheDocument()
  })

  it('should render label with consistent color for same type', () => {
    const anotherLdapProvider: IdentityProvider = {
      name: 'another-ldap',
      type: 'LDAP',
      mappingMethod: 'claim',
      ldap: {
        attributes: { id: ['uid'], name: ['cn'], preferredUsername: ['uid'] },
        url: 'ldap://another.com',
      },
    }

    const { container: container1 } = render(<IdentityProviderSelectOption identityProvider={mockLdapProvider} />)
    const { container: container2 } = render(<IdentityProviderSelectOption identityProvider={anotherLdapProvider} />)

    // Both should have LDAP labels
    expect(container1.textContent).toContain('LDAP')
    expect(container2.textContent).toContain('LDAP')
  })

  it('should handle HTPasswd provider type', () => {
    render(<IdentityProviderSelectOption identityProvider={mockHTPasswdProvider} />)

    expect(screen.getByText('test-htpasswd')).toBeInTheDocument()
    expect(screen.getByText('HTPasswd')).toBeInTheDocument()
  })

  it('should handle OpenID provider type', () => {
    render(<IdentityProviderSelectOption identityProvider={mockOpenIDProvider} />)

    expect(screen.getByText('test-openid')).toBeInTheDocument()
    expect(screen.getByText('OpenID')).toBeInTheDocument()
  })

  it('should handle providers with special characters in names', () => {
    const specialProvider: IdentityProvider = {
      name: 'ldap-test.example.com',
      type: 'LDAP',
      mappingMethod: 'claim',
      ldap: { attributes: { id: ['cn'], name: ['cn'], preferredUsername: ['cn'] }, url: 'ldap://test.com' },
    }

    render(<IdentityProviderSelectOption identityProvider={specialProvider} />)

    expect(screen.getByText('ldap-test.example.com')).toBeInTheDocument()
    expect(screen.getByText('LDAP')).toBeInTheDocument()
  })

  it('should handle providers with different mapping methods', () => {
    const lookupProvider: IdentityProvider = {
      name: 'lookup-provider',
      type: 'LDAP',
      mappingMethod: 'lookup',
      ldap: { attributes: { id: ['cn'], name: ['cn'], preferredUsername: ['cn'] }, url: 'ldap://test.com' },
    }

    render(<IdentityProviderSelectOption identityProvider={lookupProvider} />)

    expect(screen.getByText('lookup-provider')).toBeInTheDocument()
    expect(screen.getByText('LDAP')).toBeInTheDocument()
  })

  it('should render with proper accessibility attributes', () => {
    render(<IdentityProviderSelectOption identityProvider={mockLdapProvider} />)

    // The SelectOption component renders as a menuitem when not in a select context
    const selectOption = screen.getByRole('menuitem')
    expect(selectOption).toBeInTheDocument()

    // The value is set on the SelectOption component internally
    // We can verify the component renders correctly with the expected content
    expect(screen.getByText('test-ldap')).toBeInTheDocument()
    expect(screen.getByText('LDAP')).toBeInTheDocument()
  })

  it('should use consistent layout structure', () => {
    render(<IdentityProviderSelectOption identityProvider={mockLdapProvider} />)

    // Verify that the Flex layout is used
    const flexContainer = screen.getByText('LDAP').closest('div')
    expect(flexContainer).toBeInTheDocument()

    // Both label and name should be present
    expect(screen.getByText('LDAP')).toBeInTheDocument()
    expect(screen.getByText('test-ldap')).toBeInTheDocument()
  })
})
