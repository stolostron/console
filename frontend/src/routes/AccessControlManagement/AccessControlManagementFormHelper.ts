/* Copyright Contributors to the Open Cluster Management project */
import { RoleBindingHookType } from './RoleBindingHook'
import { AccessControlApiVersion, AccessControlKind } from '../../resources/access-control'

const buildRoleBindingsFromState = (roleBinding: RoleBindingHookType) =>
  roleBinding.namespaces.flatMap((ns) =>
    roleBinding.roleNames.map((role) => ({
      namespace: ns,
      roleRef: {
        name: role,
        apiGroup: 'rbac.authorization.k8s.io',
        kind: 'ClusterRole',
      },
      subjects: roleBinding.subjectNames.map((name) => ({
        name,
        apiGroup: 'rbac.authorization.k8s.io',
        kind: roleBinding.subjectKind,
      })),
    }))
  )

const buildClusterRoleBindingFromState = (roleBinding: RoleBindingHookType) => ({
  roleRef: {
    name: roleBinding.roleNames[0],
    apiGroup: 'rbac.authorization.k8s.io',
    kind: 'ClusterRole',
  },
  subjects: roleBinding.subjectNames.map((name) => ({
    name,
    apiGroup: 'rbac.authorization.k8s.io',
    kind: roleBinding.subjectKind,
  })),
})

const buildAccessControlFromState = (
  isRBValid: boolean,
  isCRBValid: boolean,
  roleBindingRB: RoleBindingHookType,
  roleBindingCRB: RoleBindingHookType,
  name: string,
  namespace: string
) => {
  const spec: any = isRBValid
    ? {
        roleBindings: buildRoleBindingsFromState(roleBindingRB),
      }
    : {}

  if (isCRBValid) {
    spec.clusterRoleBinding = buildClusterRoleBindingFromState(roleBindingCRB)
  }

  return [
    {
      apiVersion: AccessControlApiVersion,
      kind: AccessControlKind,
      metadata: {
        name,
        namespace,
      },
      spec,
    },
  ]
}

export { buildAccessControlFromState }
