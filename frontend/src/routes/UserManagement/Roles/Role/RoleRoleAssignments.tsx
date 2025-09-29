/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { ClusterRole } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { compareStrings } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { useRolesContext } from '../RolesPage'
import { Role } from '../RolesTableHelper'

const RoleRoleAssignments = () => {
  const { id = undefined } = useParams()
  const { clusterRoles, loading } = useRolesContext()
  const [role, setRole] = useState<Role>()

  const roles = useMemo(
    () =>
      clusterRoles
        ? clusterRoles
            .map(
              (clusterRole: ClusterRole): Role => ({
                name: clusterRole.metadata.name || '',
                permissions: clusterRole.rules
                  ? [...new Set(clusterRole.rules.flatMap((rule) => rule.apiGroups || []))].join(', ')
                  : '',
                uid: clusterRole.metadata.uid || clusterRole.metadata.name || '',
              })
            )
            .sort((a, b) => compareStrings(a.name, b.name))
        : [],
    [clusterRoles]
  )

  useEffect(() => setRole(roles?.find((role) => role.uid === id) as Role), [id, roles])

  // TODO: conditionally get role assignments
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const isRoleAssignmentsLoading = multiclusterRoleAssignments === undefined

  const roleAssignments = useFindRoleAssignments({ roles: [role?.name ?? ''] })

  const hasDataToProcess = role && multiclusterRoleAssignments
  const isLoading = loading || isRoleAssignmentsLoading || !hasDataToProcess

  return (
    <RoleAssignments
      roleAssignments={isLoading ? undefined : roleAssignments}
      isLoading={isLoading}
      hiddenColumns={['role']}
      preselected={{ roles: [role?.name ?? ''] }}
    />
  )
}

export { RoleRoleAssignments }
