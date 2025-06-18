/* Copyright Contributors to the Open Cluster Management project */
import { useIsAnyNamespaceAuthorized, rbacCreate } from '../lib/rbac-util'
import { AccessControlDefinition } from '../resources/access-control'

export function useCanMigrateVm(): boolean {
  return useIsAnyNamespaceAuthorized(rbacCreate(AccessControlDefinition))
}
