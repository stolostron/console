/* Copyright Contributors to the Open Cluster Management project */
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { useCurrentRole } from '../RolesPage'

const RoleRoleAssignments = () => {
  const currentRole = useCurrentRole()

  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const isRoleAssignmentsLoading = multiclusterRoleAssignments === undefined

  const roleAssignments = useFindRoleAssignments({ roles: [currentRole?.metadata.name ?? ''] })

  const hasDataToProcess = currentRole && multiclusterRoleAssignments
  const isLoading = isRoleAssignmentsLoading || !hasDataToProcess

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={isLoading}
      hiddenColumns={['role']}
      preselected={{ roles: [currentRole?.metadata.name ?? ''] }}
    />
  )
}

export { RoleRoleAssignments }
