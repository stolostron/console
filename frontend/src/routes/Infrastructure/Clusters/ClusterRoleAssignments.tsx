/* Copyright Contributors to the Open Cluster Management project */
import { useFindRoleAssignments } from '../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignments } from '../../UserManagement/RoleAssignment/RoleAssignments'
import { useParams } from 'react-router-dom-v5-compat'

const ClusterRoleAssignments = () => {
  const { name: clusterName } = useParams()
  const clusterNames = clusterName ? [clusterName] : []
  const roleAssignments = useFindRoleAssignments({ clusterNames })

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={false}
      preselected={{ clusterNames, context: 'cluster' }}
    />
  )
}

export { ClusterRoleAssignments }
