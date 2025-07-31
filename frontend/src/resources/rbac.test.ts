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
  User,
  Group,
  Role,
  RoleBinding,
  ServiceAccount,
  ClusterRole,
  ClusterRoleBinding,
} from './rbac'

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
  secrets: ['test-token'],
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
