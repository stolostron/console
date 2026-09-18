/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { useSetRecoilState } from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { vmClusterRolesState } from '../atoms'
import { ClusterRoleKind, RbacApiVersion } from '../resources'
import { LoadDataAbstract } from './LoadDataAbstract'

export function LoadRbacData() {
  const setVMClusterRoles = useSetRecoilState(vmClusterRolesState)
  const resources = useMemo(
    () => [{ apiVersion: RbacApiVersion, kind: ClusterRoleKind, setState: setVMClusterRoles }],
    [setVMClusterRoles]
  )
  return <LoadDataAbstract path="/events/rbac" resources={resources} />
}
