/* Copyright Contributors to the Open Cluster Management project */

import { IdentityProvider } from '../../../../resources/oauth'
import { AcmForm } from '../../../../ui-components/AcmForm/AcmForm'
import { AcmSelect } from '../../../../ui-components/AcmSelect/AcmSelect'
import { IdentityProviderSelectOption } from './IdentityProviderSelectOption'

export default {
  title: 'Identity Provider Select Option',
  component: IdentityProviderSelectOption,
}

// Mock identity providers for stories
const mockLdapProvider: IdentityProvider = {
  name: 'corporate-ldap',
  type: 'LDAP',
  mappingMethod: 'claim',
  ldap: {
    attributes: {
      email: ['mail'],
      id: ['dn'],
      name: ['displayName'],
      preferredUsername: ['sAMAccountName'],
    },
    bindDN: 'CN=service,OU=Users,DC=example,DC=com',
    bindPassword: { name: 'ldap-secret' },
    insecure: false,
    url: 'ldaps://ldap.example.com:636/OU=Users,DC=example,DC=com?sAMAccountName?sub',
  },
}

const mockHtpasswdProvider: IdentityProvider = {
  name: 'htpasswd-users',
  type: 'HTPasswd',
  mappingMethod: 'claim',
  htpasswd: {
    fileData: { name: 'htpasswd-secret' },
  },
}

const mockGitHubProvider: IdentityProvider = {
  name: 'github-enterprise',
  type: 'GitHub',
  mappingMethod: 'claim',
  github: {
    clientID: 'github-client-id',
    clientSecret: { name: 'github-secret' },
    hostname: 'github.enterprise.com',
    organizations: ['my-org', 'dev-team'],
  },
}

const mockOpenIDProvider: IdentityProvider = {
  name: 'keycloak-oidc',
  type: 'OpenID',
  mappingMethod: 'claim',
  openID: {
    clientID: 'openid-client-id',
    clientSecret: { name: 'openid-secret' },
    issuer: 'https://keycloak.example.com/auth/realms/master',
    claims: {
      email: ['email'],
      name: ['name'],
      preferredUsername: ['preferred_username'],
      groups: ['groups'],
    },
  },
}

const mockGoogleProvider: IdentityProvider = {
  name: 'google-oauth',
  type: 'Google',
  mappingMethod: 'claim',
  google: {
    clientID: 'google-client-id',
    clientSecret: { name: 'google-secret' },
    hostedDomain: 'example.com',
  },
}

const allProviders = [
  mockLdapProvider,
  mockHtpasswdProvider,
  mockGitHubProvider,
  mockOpenIDProvider,
  mockGoogleProvider,
]

export const SingleOption = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="Identity Provider"
        placeholder="Select an identity provider"
        id="single-select"
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
        value={undefined}
      >
        <IdentityProviderSelectOption identityProvider={mockLdapProvider} />
      </AcmSelect>
    </AcmForm>
  </div>
)

export const MultipleOptions = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="Identity Provider"
        placeholder="Select an identity provider"
        id="multiple-select"
        value={undefined}
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
      >
        {allProviders.map((provider) => (
          <IdentityProviderSelectOption key={provider.name} identityProvider={provider} />
        ))}
      </AcmSelect>
    </AcmForm>
  </div>
)

export const LDAPProvider = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="LDAP Identity Provider"
        placeholder="Select LDAP provider"
        id="ldap-select"
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
        value={undefined}
      >
        <IdentityProviderSelectOption identityProvider={mockLdapProvider} />
      </AcmSelect>
    </AcmForm>
  </div>
)

export const HTPasswdProvider = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="HTPasswd Identity Provider"
        placeholder="Select HTPasswd provider"
        id="htpasswd-select"
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
        value={undefined}
      >
        <IdentityProviderSelectOption identityProvider={mockHtpasswdProvider} />
      </AcmSelect>
    </AcmForm>
  </div>
)

export const GitHubProvider = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="GitHub Identity Provider"
        placeholder="Select GitHub provider"
        id="github-select"
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
        value={undefined}
      >
        <IdentityProviderSelectOption identityProvider={mockGitHubProvider} />
      </AcmSelect>
    </AcmForm>
  </div>
)

export const OpenIDProvider = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="OpenID Identity Provider"
        placeholder="Select OpenID provider"
        id="openid-select"
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
        value={undefined}
      >
        <IdentityProviderSelectOption identityProvider={mockOpenIDProvider} />
      </AcmSelect>
    </AcmForm>
  </div>
)

export const GoogleProvider = () => (
  <div style={{ width: '400px' }}>
    <AcmForm>
      <AcmSelect
        label="Google Identity Provider"
        placeholder="Select Google provider"
        id="google-select"
        onChange={function (): void {
          throw new Error('Function not implemented.')
        }}
        value={undefined}
      >
        <IdentityProviderSelectOption identityProvider={mockGoogleProvider} />
      </AcmSelect>
    </AcmForm>
  </div>
)

export const ColorConsistency = () => {
  // Create multiple providers of the same type to show color consistency
  const ldapProviders: IdentityProvider[] = [
    {
      name: 'ldap-primary',
      type: 'LDAP',
      mappingMethod: 'claim',
      ldap: { attributes: { id: ['cn'], name: ['cn'], preferredUsername: ['cn'] }, url: 'ldap://primary.com' },
    },
    {
      name: 'ldap-secondary',
      type: 'LDAP',
      mappingMethod: 'claim',
      ldap: { attributes: { id: ['uid'], name: ['cn'], preferredUsername: ['uid'] }, url: 'ldap://secondary.com' },
    },
    {
      name: 'github-main',
      type: 'GitHub',
      mappingMethod: 'claim',
      github: { clientID: 'main-client', clientSecret: { name: 'main-secret' } },
    },
    {
      name: 'github-backup',
      type: 'GitHub',
      mappingMethod: 'claim',
      github: { clientID: 'backup-client', clientSecret: { name: 'backup-secret' } },
    },
  ]

  return (
    <div style={{ width: '400px' }}>
      <AcmForm>
        <AcmSelect
          label="Identity Providers (Color Consistency)"
          placeholder="Select provider"
          id="color-select"
          onChange={function (): void {
            throw new Error('Function not implemented.')
          }}
          value={undefined}
        >
          {ldapProviders.map((provider) => (
            <IdentityProviderSelectOption key={provider.name} identityProvider={provider} />
          ))}
        </AcmSelect>
      </AcmForm>
    </div>
  )
}

export const StandaloneOption = () => (
  <div style={{ width: '400px', padding: '20px', border: '1px solid #ccc', borderRadius: '4px' }}>
    <h3>Standalone Identity Provider Option</h3>
    <p>This shows how the option looks when rendered outside of a select context:</p>
    <IdentityProviderSelectOption identityProvider={mockLdapProvider} />
  </div>
)
