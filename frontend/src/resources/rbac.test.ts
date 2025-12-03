/* Copyright Contributors to the Open Cluster Management project */
import nock from 'nock'
import {
  listUsers,
  listGroups,
  listRoles,
  listRoleBindings,
  listServiceAccounts,
  listClusterRoles,
  listClusterRoleBindings,
  createUser,
  User,
  Group,
  Role,
  RoleBinding,
  ServiceAccount,
  ClusterRole,
  ClusterRoleBinding,
  UserApiVersion,
  UserKind,
} from './rbac'
import { nockCreate, nockCreateError } from '../lib/nock-util'

export const testNamespace = 'test-namespace'

const mockUser: User = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'User',
  metadata: {
    name: 'test-user',
    uid: 'user-123',
  },
  identities: ['htpasswd:test-user'],
  groups: ['developers'],
}

const mockGroup: Group = {
  apiVersion: 'user.openshift.io/v1',
  kind: 'Group',
  metadata: {
    name: 'test-group',
    uid: 'group-123',
  },
  users: ['test-user', 'another-user'],
}

const mockRole: Role = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'Role',
  metadata: {
    name: 'test-role',
    namespace: testNamespace,
    uid: 'role-123',
  },
  rules: [
    {
      verbs: ['get', 'list'],
      apiGroups: [''],
      resources: ['pods'],
      resourceNames: [],
    },
  ],
}

const mockRoleBinding: RoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'RoleBinding',
  metadata: {
    name: 'test-rolebinding',
    namespace: testNamespace,
    uid: 'rolebinding-123',
  },
  subjects: [
    {
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
      name: 'test-user',
      namespace: testNamespace,
    },
  ],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'Role',
    name: 'test-role',
  },
}

const mockServiceAccount: ServiceAccount = {
  apiVersion: 'v1',
  kind: 'ServiceAccount',
  metadata: {
    name: 'test-serviceaccount',
    namespace: testNamespace,
    uid: 'sa-123',
  },
  secrets: [
    {
      name: 'test-token',
    },
  ],
  imagePullSecrets: [],
}

const mockClusterRole: ClusterRole = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRole',
  metadata: {
    name: 'test-clusterrole',
    uid: 'clusterrole-123',
  },
  rules: [
    {
      verbs: ['*'],
      apiGroups: ['*'],
      resources: ['*'],
      resourceNames: [],
    },
  ],
}

const mockClusterRoleBinding: ClusterRoleBinding = {
  apiVersion: 'rbac.authorization.k8s.io/v1',
  kind: 'ClusterRoleBinding',
  metadata: {
    name: 'test-clusterrolebinding',
    uid: 'clusterrolebinding-123',
  },
  subjects: [
    {
      kind: 'User',
      apiGroup: 'rbac.authorization.k8s.io',
      name: 'test-user',
    },
  ],
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'test-clusterrole',
  },
}

describe('RBAC Resource Tests', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  it('should successfully list users', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'user.openshift.io/v1': {
          User: { pluralName: 'users' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/user.openshift.io/v1/users')
      .reply(200, {
        kind: 'UserList',
        apiVersion: 'user.openshift.io/v1',
        items: [mockUser],
      })

    const result = await listUsers().promise
    expect(result).toEqual([mockUser])
  })

  it('should handle empty user list', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'user.openshift.io/v1': {
          User: { pluralName: 'users' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/user.openshift.io/v1/users')
      .reply(200, {
        kind: 'UserList',
        apiVersion: 'user.openshift.io/v1',
        items: [],
      })

    const result = await listUsers().promise
    expect(result).toEqual([])
  })

  it('should successfully list groups', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'user.openshift.io/v1': {
          Group: { pluralName: 'groups' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/user.openshift.io/v1/groups')
      .reply(200, {
        kind: 'GroupList',
        apiVersion: 'user.openshift.io/v1',
        items: [mockGroup],
      })

    const result = await listGroups().promise
    expect(result).toEqual([mockGroup])
  })

  it('should handle empty group list', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'user.openshift.io/v1': {
          Group: { pluralName: 'groups' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/user.openshift.io/v1/groups')
      .reply(200, {
        kind: 'GroupList',
        apiVersion: 'user.openshift.io/v1',
        items: [],
      })

    const result = await listGroups().promise
    expect(result).toEqual([])
  })

  it('should successfully list roles', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'rbac.authorization.k8s.io/v1': {
          Role: { pluralName: 'roles' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/rbac.authorization.k8s.io/v1/roles')
      .reply(200, {
        kind: 'RoleList',
        apiVersion: 'rbac.authorization.k8s.io/v1',
        items: [mockRole],
      })

    const result = await listRoles().promise
    expect(result).toEqual([mockRole])
  })

  it('should successfully list role bindings', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'rbac.authorization.k8s.io/v1': {
          RoleBinding: { pluralName: 'rolebindings' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/rbac.authorization.k8s.io/v1/rolebindings')
      .reply(200, {
        kind: 'RoleBindingList',
        apiVersion: 'rbac.authorization.k8s.io/v1',
        items: [mockRoleBinding],
      })

    const result = await listRoleBindings().promise
    expect(result).toEqual([mockRoleBinding])
  })

  it('should successfully list service accounts', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        v1: {
          ServiceAccount: { pluralName: 'serviceaccounts' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/api/v1/serviceaccounts')
      .reply(200, {
        kind: 'ServiceAccountList',
        apiVersion: 'v1',
        items: [mockServiceAccount],
      })

    const result = await listServiceAccounts().promise
    expect(result).toEqual([mockServiceAccount])
  })

  it('should successfully list cluster roles', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'rbac.authorization.k8s.io/v1': {
          ClusterRole: { pluralName: 'clusterroles' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/rbac.authorization.k8s.io/v1/clusterroles')
      .reply(200, {
        kind: 'ClusterRoleList',
        apiVersion: 'rbac.authorization.k8s.io/v1',
        items: [mockClusterRole],
      })

    const result = await listClusterRoles().promise
    expect(result).toEqual([mockClusterRole])
  })

  it('should successfully list cluster role bindings', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'rbac.authorization.k8s.io/v1': {
          ClusterRoleBinding: { pluralName: 'clusterrolebindings' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/rbac.authorization.k8s.io/v1/clusterrolebindings')
      .reply(200, {
        kind: 'ClusterRoleBindingList',
        apiVersion: 'rbac.authorization.k8s.io/v1',
        items: [mockClusterRoleBinding],
      })

    const result = await listClusterRoleBindings().promise
    expect(result).toEqual([mockClusterRoleBinding])
  })

  it('should handle API errors gracefully', async function () {
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apiPaths')
      .reply(200, {
        'user.openshift.io/v1': {
          User: { pluralName: 'users' },
        },
      })
    nock(process.env.CLUSTER_API_URL || 'http://localhost')
      .get('/apis/user.openshift.io/v1/users')
      .reply(500, {
        message: 'Internal Server Error',
      })

    await expect(listUsers().promise).rejects.toThrow()
  })
})

describe('createUser', function () {
  afterEach(() => {
    nock.cleanAll()
  })

  const mockUserInput = {
    metadata: {
      name: 'new-test-user',
    },
    identities: ['htpasswd:new-test-user'],
  }

  const expectedUserRequest = {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'new-test-user',
    },
    identities: ['htpasswd:new-test-user'],
  }

  const mockCreatedUser: User = {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: 'new-test-user',
      uid: 'new-user-123',
      creationTimestamp: '2024-01-01T00:00:00Z',
    },
    identities: ['htpasswd:new-test-user'],
    groups: [],
  }

  it('should throw error when user name is undefined', function () {
    const userWithoutName = {
      metadata: {},
    }

    expect(() => createUser(userWithoutName as any)).toThrow('User name is undefined')
  })

  it('should throw error when user name is empty string', function () {
    const userWithEmptyName = {
      metadata: {
        name: '',
      },
    }

    expect(() => createUser(userWithEmptyName as any)).toThrow('User name is undefined')
  })

  it('should successfully create user with minimal data', async function () {
    const minimalUser = {
      metadata: {
        name: 'minimal-user',
      },
    }

    const expectedMinimalRequest = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'minimal-user',
      },
    }

    const mockMinimalCreatedUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'minimal-user',
        uid: 'minimal-user-123',
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      identities: [],
      groups: [],
    }

    nockCreate(expectedMinimalRequest, mockMinimalCreatedUser)

    const result = await createUser(minimalUser).promise
    expect(result).toEqual(mockMinimalCreatedUser)
  })

  it('should successfully create user with identities', async function () {
    nockCreate(expectedUserRequest, mockCreatedUser)

    const result = await createUser(mockUserInput).promise
    expect(result).toEqual(mockCreatedUser)
  })

  it('should successfully create user with multiple identities', async function () {
    const userWithMultipleIdentities = {
      metadata: {
        name: 'multi-identity-user',
      },
      identities: ['ldap:multi-identity-user', 'oauth:github:multi-identity-user'],
    }

    const expectedMultiIdentityRequest = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'multi-identity-user',
      },
      identities: ['ldap:multi-identity-user', 'oauth:github:multi-identity-user'],
    }

    const mockMultiIdentityCreatedUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'multi-identity-user',
        uid: 'multi-identity-user-123',
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      identities: ['ldap:multi-identity-user', 'oauth:github:multi-identity-user'],
      groups: [],
    }

    nockCreate(expectedMultiIdentityRequest, mockMultiIdentityCreatedUser)

    const result = await createUser(userWithMultipleIdentities).promise
    expect(result).toEqual(mockMultiIdentityCreatedUser)
  })

  it('should successfully create user with empty identities array', async function () {
    const userWithEmptyIdentities = {
      metadata: {
        name: 'empty-identities-user',
      },
      identities: [],
    }

    const expectedEmptyIdentitiesRequest = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'empty-identities-user',
      },
      identities: [],
    }

    const mockEmptyIdentitiesCreatedUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'empty-identities-user',
        uid: 'empty-identities-user-123',
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      identities: [],
      groups: [],
    }

    nockCreate(expectedEmptyIdentitiesRequest, mockEmptyIdentitiesCreatedUser)

    const result = await createUser(userWithEmptyIdentities).promise
    expect(result).toEqual(mockEmptyIdentitiesCreatedUser)
  })

  it('should handle user creation with additional metadata', async function () {
    const userWithMetadata = {
      metadata: {
        name: 'metadata-user',
        labels: {
          'app.kubernetes.io/managed-by': 'acm-console',
          environment: 'test',
        },
        annotations: {
          description: 'Test user created via console',
        },
      },
      identities: ['htpasswd:metadata-user'],
    }

    const expectedMetadataRequest = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'metadata-user',
        labels: {
          'app.kubernetes.io/managed-by': 'acm-console',
          environment: 'test',
        },
        annotations: {
          description: 'Test user created via console',
        },
      },
      identities: ['htpasswd:metadata-user'],
    }

    const mockMetadataCreatedUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'metadata-user',
        uid: 'metadata-user-123',
        creationTimestamp: '2024-01-01T00:00:00Z',
        labels: {
          'app.kubernetes.io/managed-by': 'acm-console',
          environment: 'test',
        },
        annotations: {
          description: 'Test user created via console',
        },
      },
      identities: ['htpasswd:metadata-user'],
      groups: [],
    }

    nockCreate(expectedMetadataRequest, mockMetadataCreatedUser)

    const result = await createUser(userWithMetadata).promise
    expect(result).toEqual(mockMetadataCreatedUser)
  })

  it('should handle API errors during user creation', async function () {
    const errorMessage = 'User already exists'
    nockCreateError(expectedUserRequest, errorMessage)

    await expect(createUser(mockUserInput).promise).rejects.toThrow()
  })

  it('should handle server errors during user creation', async function () {
    nockCreate(expectedUserRequest, undefined, 500)

    await expect(createUser(mockUserInput).promise).rejects.toThrow()
  })

  it('should handle network errors during user creation', async function () {
    nockCreateError(expectedUserRequest, { code: 'ECONNREFUSED', message: 'Connection refused' })

    await expect(createUser(mockUserInput).promise).rejects.toThrow()
  })

  it('should return IRequestResult with promise and abort function', function () {
    nockCreate(expectedUserRequest, mockCreatedUser)

    const result = createUser(mockUserInput)

    expect(result).toHaveProperty('promise')
    expect(result).toHaveProperty('abort')
    expect(typeof result.promise).toBe('object')
    expect(typeof result.abort).toBe('function')
  })

  it('should handle user creation with special characters in name', async function () {
    const userWithSpecialChars = {
      metadata: {
        name: 'user.with-special_chars@domain.com',
      },
      identities: ['oauth:github:user.with-special_chars@domain.com'],
    }

    const expectedSpecialCharsRequest = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'user.with-special_chars@domain.com',
      },
      identities: ['oauth:github:user.with-special_chars@domain.com'],
    }

    const mockSpecialCharsCreatedUser: User = {
      apiVersion: UserApiVersion,
      kind: UserKind,
      metadata: {
        name: 'user.with-special_chars@domain.com',
        uid: 'special-chars-user-123',
        creationTimestamp: '2024-01-01T00:00:00Z',
      },
      identities: ['oauth:github:user.with-special_chars@domain.com'],
      groups: [],
    }

    nockCreate(expectedSpecialCharsRequest, mockSpecialCharsCreatedUser)

    const result = await createUser(userWithSpecialChars).promise
    expect(result).toEqual(mockSpecialCharsCreatedUser)
  })
})
