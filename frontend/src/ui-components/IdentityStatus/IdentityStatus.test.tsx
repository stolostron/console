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
  test('should render Active status for User', () => {
    render(<IdentityStatus identity={mockUser} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  test('should render Active status for Group', () => {
    render(<IdentityStatus identity={mockGroup} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })

  test('should render Active status for ServiceAccount', () => {
    render(<IdentityStatus identity={mockServiceAccount} />)

    expect(screen.getByText('Active')).toBeInTheDocument()
  })
})

//TODO: implement logic once 'active' field is added
describe('isIdentityActive function', () => {
  test('should return true for User', () => {
    expect(isIdentityActive(mockUser)).toBe(true)
  })

  test('should return true for Group', () => {
    expect(isIdentityActive(mockGroup)).toBe(true)
  })

  test('should return true for ServiceAccount', () => {
    expect(isIdentityActive(mockServiceAccount)).toBe(true)
  })

  test('should return false for unknown kind', () => {
    const unknownIdentity = {
      ...mockUser,
      kind: 'Unknown' as any,
    }

    expect(isIdentityActive(unknownIdentity)).toBe(false)
  })
})
