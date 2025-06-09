/* Copyright Contributors to the Open Cluster Management project */
import { RoleBindingHookType } from './RoleBindingHook'
import { AccessControl, AccessControlApiVersion, AccessControlKind } from '../../resources/access-control'

export const getRoleBindingNames = (accessControl?: AccessControl): string[] => {
  return accessControl?.spec?.roleBindings?.map((rb) => rb.name ?? '') ?? []
}

const buildRoleBindingsFromState = (
  roleBinding: RoleBindingHookType,
  baseName?: string,
  preservedNames?: (string | undefined)[]
) => {
  let globalIndex = 0
  const bindings = []

  for (const ns of roleBinding.namespaces) {
    for (const role of roleBinding.roleNames) {
      const name = preservedNames?.[globalIndex]?.trim() || `${baseName}-${globalIndex}`

      bindings.push({
        name,
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
      })

      globalIndex++
    }
  }

  return bindings
}

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
  namespace: string,
  preservedNames?: (string | undefined)[]
) => {
  const spec: any = isRBValid
    ? {
        roleBindings: buildRoleBindingsFromState(roleBindingRB, name, preservedNames),
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
