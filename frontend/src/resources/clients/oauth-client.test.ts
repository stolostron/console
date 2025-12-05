/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { OAuth, IdentityProvider } from '../oauth'
import { useGetIdentityProviders } from './oauth-client'

// Mock shared-recoil
jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock

describe('useGetIdentityProviders', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    useSharedAtomsMock.mockReturnValue({ oauthState: 'oauthState' })
  })

  it('should return empty array when oauth array is empty', () => {
    // Arrange
    useRecoilValueMock.mockReturnValue([])

    // Act
    const { result } = renderHook(() => useGetIdentityProviders())

    // Assert
    expect(result.current).toEqual([])
    expect(useSharedAtomsMock).toHaveBeenCalledTimes(1)
    expect(useRecoilValueMock).toHaveBeenCalledWith('oauthState')
  })

  it('should return empty array when oauth resource has no identity providers', () => {
    // Arrange
    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster' },
        spec: {
          identityProviders: [],
        },
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act
    const { result } = renderHook(() => useGetIdentityProviders())

    // Assert
    expect(result.current).toEqual([])
  })

  it('should return identity providers from the first oauth resource', () => {
    // Arrange
    const mockIdentityProviders: IdentityProvider[] = [
      {
        name: 'qe-ldap',
        type: 'LDAP',
        mappingMethod: 'claim',
        ldap: {
          attributes: {
            email: [],
            id: ['cn'],
            name: ['cn'],
            preferredUsername: ['cn'],
          },
          bindDN: 'cn=ldap-syncer,ou=sync-group,ou=users,dc=qe-ldap,dc=internal',
          bindPassword: { name: 'ldap-bind-password' },
          insecure: true,
          url: 'ldap://glauth-service.qe-ldap.svc.cluster.local:3893/ou=users,dc=qe-ldap,dc=internal?cn?sub',
        },
      },
      {
        name: 'clc-e2e-htpasswd',
        type: 'HTPasswd',
        mappingMethod: 'claim',
        htpasswd: {
          fileData: { name: 'clc-e2e-users' },
        },
      },
    ]

    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster' },
        spec: {
          identityProviders: mockIdentityProviders,
        },
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act
    const { result } = renderHook(() => useGetIdentityProviders())

    // Assert
    expect(result.current).toEqual(mockIdentityProviders)
    expect(result.current).toHaveLength(2)
    expect(result.current[0].name).toBe('qe-ldap')
    expect(result.current[0].type).toBe('LDAP')
    expect(result.current[1].name).toBe('clc-e2e-htpasswd')
    expect(result.current[1].type).toBe('HTPasswd')
  })

  it('should return identity providers from first oauth resource when multiple oauth resources exist', () => {
    // Arrange
    const firstOAuthProviders: IdentityProvider[] = [
      {
        name: 'first-provider',
        type: 'LDAP',
        mappingMethod: 'claim',
        ldap: {
          attributes: {
            email: [],
            id: ['uid'],
            name: ['cn'],
            preferredUsername: ['uid'],
          },
          url: 'ldap://first.example.com',
        },
      },
    ]

    const secondOAuthProviders: IdentityProvider[] = [
      {
        name: 'second-provider',
        type: 'HTPasswd',
        mappingMethod: 'claim',
        htpasswd: {
          fileData: { name: 'second-users' },
        },
      },
    ]

    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster-1' },
        spec: {
          identityProviders: firstOAuthProviders,
        },
      },
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster-2' },
        spec: {
          identityProviders: secondOAuthProviders,
        },
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act
    const { result } = renderHook(() => useGetIdentityProviders())

    // Assert
    expect(result.current).toEqual(firstOAuthProviders)
    expect(result.current).toHaveLength(1)
    expect(result.current[0].name).toBe('first-provider')
  })

  it('should handle different identity provider types correctly', () => {
    // Arrange
    const mockIdentityProviders: IdentityProvider[] = [
      {
        name: 'ldap-provider',
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
      },
      {
        name: 'htpasswd-provider',
        type: 'HTPasswd',
        mappingMethod: 'claim',
        htpasswd: {
          fileData: { name: 'htpasswd-secret' },
        },
      },
      {
        name: 'github-provider',
        type: 'GitHub',
        mappingMethod: 'claim',
        github: {
          clientID: 'github-client-id',
          clientSecret: { name: 'github-secret' },
          organizations: ['my-org'],
        },
      },
      {
        name: 'openid-provider',
        type: 'OpenID',
        mappingMethod: 'claim',
        openID: {
          clientID: 'openid-client-id',
          clientSecret: { name: 'openid-secret' },
          issuer: 'https://auth.example.com',
          claims: {
            email: ['email'],
            name: ['name'],
            preferredUsername: ['preferred_username'],
            groups: ['groups'],
          },
        },
      },
    ]

    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster' },
        spec: {
          identityProviders: mockIdentityProviders,
        },
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act
    const { result } = renderHook(() => useGetIdentityProviders())

    // Assert
    expect(result.current).toEqual(mockIdentityProviders)
    expect(result.current).toHaveLength(4)

    // Verify each provider type
    const ldapProvider = result.current.find((p) => p.type === 'LDAP')
    expect(ldapProvider?.name).toBe('ldap-provider')
    expect(ldapProvider?.ldap?.url).toBe('ldaps://ldap.example.com:636/OU=Users,DC=example,DC=com?sAMAccountName?sub')

    const htpasswdProvider = result.current.find((p) => p.type === 'HTPasswd')
    expect(htpasswdProvider?.name).toBe('htpasswd-provider')
    expect(htpasswdProvider?.htpasswd?.fileData.name).toBe('htpasswd-secret')

    const githubProvider = result.current.find((p) => p.type === 'GitHub')
    expect(githubProvider?.name).toBe('github-provider')
    expect(githubProvider?.github?.clientID).toBe('github-client-id')

    const openidProvider = result.current.find((p) => p.type === 'OpenID')
    expect(openidProvider?.name).toBe('openid-provider')
    expect(openidProvider?.openID?.issuer).toBe('https://auth.example.com')
  })

  it('should handle different mapping methods correctly', () => {
    // Arrange
    const mockIdentityProviders: IdentityProvider[] = [
      {
        name: 'claim-provider',
        type: 'LDAP',
        mappingMethod: 'claim',
        ldap: {
          attributes: {
            id: ['uid'],
            name: ['cn'],
            preferredUsername: ['uid'],
          },
          url: 'ldap://example.com',
        },
      },
      {
        name: 'lookup-provider',
        type: 'HTPasswd',
        mappingMethod: 'lookup',
        htpasswd: {
          fileData: { name: 'users' },
        },
      },
      {
        name: 'generate-provider',
        type: 'GitHub',
        mappingMethod: 'generate',
        github: {
          clientID: 'client-id',
          clientSecret: { name: 'secret' },
        },
      },
      {
        name: 'add-provider',
        type: 'OpenID',
        mappingMethod: 'add',
        openID: {
          clientID: 'openid-client',
          issuer: 'https://issuer.com',
        },
      },
    ]

    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster' },
        spec: {
          identityProviders: mockIdentityProviders,
        },
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act
    const { result } = renderHook(() => useGetIdentityProviders())

    // Assert
    expect(result.current).toHaveLength(4)
    expect(result.current[0].mappingMethod).toBe('claim')
    expect(result.current[1].mappingMethod).toBe('lookup')
    expect(result.current[2].mappingMethod).toBe('generate')
    expect(result.current[3].mappingMethod).toBe('add')
  })

  it('should maintain referential stability when oauth state does not change', () => {
    // Arrange
    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster' },
        spec: {
          identityProviders: [
            {
              name: 'test-provider',
              type: 'LDAP',
              mappingMethod: 'claim',
              ldap: {
                attributes: {
                  id: ['uid'],
                  name: ['cn'],
                  preferredUsername: ['uid'],
                },
                url: 'ldap://example.com',
              },
            },
          ],
        },
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act
    const { result, rerender } = renderHook(() => useGetIdentityProviders())
    const firstResult = result.current

    // Rerender with same data
    rerender()
    const secondResult = result.current

    // Assert
    expect(firstResult).toBe(secondResult)
  })

  it('should handle oauth resource with undefined spec gracefully', () => {
    // Arrange
    const mockOAuth: OAuth[] = [
      {
        apiVersion: 'config.openshift.io/v1',
        kind: 'OAuth',
        metadata: { name: 'cluster' },
        spec: undefined as any,
      },
    ]
    useRecoilValueMock.mockReturnValue(mockOAuth)

    // Act & Assert
    expect(() => {
      const { result } = renderHook(() => useGetIdentityProviders())
      result.current
    }).toThrow()
  })
})
