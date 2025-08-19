/* Copyright Contributors to the Open Cluster Management project */
import { render, screen } from '@testing-library/react'
import { IdentityStatus, isIdentityActive } from './IdentityStatus'
import { User, Group, ServiceAccount } from '../../resources/rbac'

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'test-user-uid',
    creationTimestamp: '2025-01-24T17:48:45Z',
  },
  identities: ['htpasswd:test-user'],
  groups: ['developers'],
  fullName: 'Test User',
}

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'developers',
    uid: 'developers-uid',
    creationTimestamp: '2025-01-24T16:00:00Z',
  },
  users: ['test-user'],
}

const mockServiceAccount: ServiceAccount = {
  apiVersion: 'v1',
  kind: 'ServiceAccount',
  metadata: {
    name: 'test-sa',
    uid: 'test-sa-uid',
    creationTimestamp: '2025-01-24T15:00:00Z',
  },
  secrets: [{ name: 'test-secret' }],
  imagePullSecrets: [],
}

describe('IdentityStatus Component', () => {
  test.each([
    { name: 'User', identity: mockUser },
    { name: 'Group', identity: mockGroup },
    { name: 'ServiceAccount', identity: mockServiceAccount },
  ])('should render Active status for $name', ({ identity }) => {
    render(<IdentityStatus identity={identity} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

//TODO: implement logic once 'active' field is added
describe('isIdentityActive function', () => {
  test.each([
    { identity: mockUser, name: 'User', expected: true },
    { identity: mockGroup, name: 'Group', expected: true },
    { identity: mockServiceAccount, name: 'ServiceAccount', expected: true },
  ])('should return $expected for $name', ({ identity, expected }) => {
    expect(isIdentityActive(identity)).toBe(expected)
  })

  test('should return false for unknown kind', () => {
    const unknownIdentity = {
      ...mockUser,
      kind: 'Unknown' as any,
    }

    expect(isIdentityActive(unknownIdentity)).toBe(false)
  })
})
