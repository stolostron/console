/* Copyright Contributors to the Open Cluster Management project */
import { User, Group, UserApiVersion, UserKind, GroupKind } from '../../rbac'

export const mockUsers: User[] = [
  {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'test-user',
      uid: 'test-user-uid',
      creationTimestamp: '2025-01-24T17:48:45Z',
    },
    fullName: 'Test User',
    identities: ['htpasswd:test-user'],
    groups: [],
  },
  {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'alice.trask',
      uid: 'mock-user-alice-trask',
      creationTimestamp: '2024-01-15T10:30:00Z',
    },
    fullName: 'Alice Trask',
    identities: ['ldap:alice.trask', 'htpasswd_provider:alice.trask'],
    groups: ['kubevirt-admins', 'sre-team'],
  },
  {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'bob.levy',
      uid: 'mock-user-bob-levy',
      creationTimestamp: '2024-01-16T14:20:00Z',
    },
    fullName: 'Bob Levy',
    identities: ['oauth:github:bob.levy'],
    groups: ['developers'],
  },
  {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'charlie.cranston',
      uid: 'mock-user-charlie-cranston',
      creationTimestamp: '2024-01-17T09:45:00Z',
    },
    fullName: 'Charlie Cranston',
    identities: ['oauth:google:charlie.cranston@company.com'],
    groups: ['developers', 'security-auditors'],
  },
  {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'sarah.jones',
      uid: 'mock-user-sarah-jones',
      creationTimestamp: '2024-01-18T16:15:00Z',
    },
    fullName: 'Sarah Jones',
    identities: ['ldap:sarah.jones', 'oauth:saml:sarah.jones@enterprise.corp'],
    groups: ['kubevirt-admins', 'storage-team'],
  },
  {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'david.brown',
      uid: 'mock-user-david-brown',
      creationTimestamp: '2024-01-19T11:30:00Z',
    },
    fullName: 'David Brown',
    identities: ['htpasswd_provider:david.brown'],
    groups: [],
  },
]

export const mockGroups: Group[] = [
  {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: 'kubevirt-admins',
      uid: 'mock-group-kubevirt-admins',
      creationTimestamp: '2024-01-10T09:00:00Z',
    },
    users: ['alice.trask', 'sarah.jones'],
  },
  {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: 'developers',
      uid: 'mock-group-developers',
      creationTimestamp: '2024-01-11T10:30:00Z',
    },
    users: ['bob.levy', 'charlie.cranston'],
  },
  {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: 'sre-team',
      uid: 'mock-group-sre-team',
      creationTimestamp: '2024-01-12T14:15:00Z',
    },
    users: ['alice.trask'],
  },
  {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: 'security-auditors',
      uid: 'mock-group-security-auditors',
      creationTimestamp: '2024-01-13T11:45:00Z',
    },
    users: ['charlie.cranston'],
  },
  {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: 'storage-team',
      uid: 'mock-group-storage-team',
      creationTimestamp: '2024-01-14T12:00:00Z',
    },
    users: ['sarah.jones'],
  },
]
