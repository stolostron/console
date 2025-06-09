/* Copyright Contributors to the Open Cluster Management project */
import { ClusterRoleBinding, RoleBinding } from '../../resources/access-control'

export const mockRoleBindings1: RoleBinding[] = [
  {
    name: 'accesscontrol-1-0',
    namespace: 'dev',
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'admin-access',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Bob',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Luke',
      },
    ],
  },
  {
    name: 'accesscontrol-1-1',
    namespace: 'dev',
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'read-only',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Bob',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Luke',
      },
    ],
  },
  {
    name: 'accesscontrol-1-2',
    namespace: 'test',
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'admin-access',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Bob',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Luke',
      },
    ],
  },
  {
    name: 'accesscontrol-1-3',
    namespace: 'test',
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'read-only',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Bob',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'Luke',
      },
    ],
  },
]

export const mockRoleBindings2: RoleBinding[] = [
  {
    name: 'accesscontrol-1-0',
    namespace: 'development',
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'developer',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Group',
        name: 'dev-team',
      },
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'Group',
        name: 'ops-team',
      },
    ],
  },
]

export const mockRoleBindings3: RoleBinding[] = [
  {
    name: 'accesscontrol-1-0',
    namespace: 'single-namespace',
    roleRef: {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'ClusterRole',
      name: 'single-role',
    },
    subjects: [
      {
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'User',
        name: 'single-user',
      },
    ],
  },
]

export const mockClusterRoleBinding1: ClusterRoleBinding = {
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'cluster-admin',
  },
  subjects: [
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'Jill',
    },
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'User',
      name: 'Stan',
    },
  ],
}

export const mockClusterRoleBinding2: ClusterRoleBinding = {
  roleRef: {
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
    name: 'cluster-admin',
  },
  subjects: [
    {
      apiGroup: 'rbac.authorization.k8s.io',
      kind: 'Group',
      name: 'admin-group',
    },
  ],
}
