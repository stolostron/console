/* Copyright Contributors to the Open Cluster Management project */
import { Metadata } from './metadata'
import { IResource, IResourceDefinition } from './resource'

export const OAuthApiVersion = 'config.openshift.io/v1'
export type OAuthApiVersionType = 'config.openshift.io/v1'

export const OAuthKind = 'OAuth'
export type OAuthKindType = 'OAuth'

export const OAuthDefinition: IResourceDefinition = {
  apiVersion: OAuthApiVersion,
  kind: OAuthKind,
}

// Base interface for secret references
export interface SecretNameReference {
  name: string
}

// LDAP Identity Provider Configuration
export interface LDAPIdentityProvider {
  attributes: {
    email?: string[]
    id: string[]
    name: string[]
    preferredUsername: string[]
  }
  bindDN?: string
  bindPassword?: SecretNameReference
  insecure?: boolean
  url: string
}

// HTPasswd Identity Provider Configuration
export interface HTPasswdIdentityProvider {
  fileData: SecretNameReference
}

// OpenID Connect Identity Provider Configuration
export interface OpenIDIdentityProvider {
  clientID: string
  clientSecret?: SecretNameReference
  issuer: string
  claims?: {
    email?: string[]
    name?: string[]
    preferredUsername?: string[]
    groups?: string[]
  }
  extraScopes?: string[]
  extraAuthorizeParameters?: Record<string, string>
}

// GitHub Identity Provider Configuration
export interface GitHubIdentityProvider {
  clientID: string
  clientSecret: SecretNameReference
  hostname?: string
  ca?: SecretNameReference
  organizations?: string[]
  teams?: string[]
}

// GitLab Identity Provider Configuration
export interface GitLabIdentityProvider {
  clientID: string
  clientSecret: SecretNameReference
  url?: string
  ca?: SecretNameReference
}

// Google Identity Provider Configuration
export interface GoogleIdentityProvider {
  clientID: string
  clientSecret: SecretNameReference
  hostedDomain?: string
}

// Basic Auth Identity Provider Configuration
export interface BasicAuthIdentityProvider {
  url: string
  ca?: SecretNameReference
  tlsClientCert?: SecretNameReference
  tlsClientKey?: SecretNameReference
}

// Request Header Identity Provider Configuration
export interface RequestHeaderIdentityProvider {
  challengeURL?: string
  loginURL?: string
  clientCA: SecretNameReference
  clientCommonNames?: string[]
  headers: string[]
  emailHeaders?: string[]
  nameHeaders?: string[]
  preferredUsernameHeaders?: string[]
}

// Keystone Identity Provider Configuration
export interface KeystoneIdentityProvider {
  domainName: string
  url: string
  ca?: SecretNameReference
  tlsClientCert?: SecretNameReference
  tlsClientKey?: SecretNameReference
}

// Main Identity Provider interface using discriminated union
export interface IdentityProvider {
  name: string
  mappingMethod: 'claim' | 'lookup' | 'generate' | 'add'
  type: 'LDAP' | 'HTPasswd' | 'OpenID' | 'GitHub' | 'GitLab' | 'Google' | 'BasicAuth' | 'RequestHeader' | 'Keystone'
  ldap?: LDAPIdentityProvider
  htpasswd?: HTPasswdIdentityProvider
  openID?: OpenIDIdentityProvider
  github?: GitHubIdentityProvider
  gitlab?: GitLabIdentityProvider
  google?: GoogleIdentityProvider
  basicAuth?: BasicAuthIdentityProvider
  requestHeader?: RequestHeaderIdentityProvider
  keystone?: KeystoneIdentityProvider
}

export interface OAuth extends IResource {
  apiVersion: OAuthApiVersionType
  kind: OAuthKindType
  metadata: Metadata
  spec: {
    identityProviders: IdentityProvider[]
  }
}

export const emptyOAuth: OAuth = {
  apiVersion: OAuthApiVersion,
  kind: OAuthKind,
  metadata: {},
  spec: {
    identityProviders: [],
  },
}
