/* Copyright Contributors to the Open Cluster Management project */
import { useFindRoleAssignments } from '../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignments } from '../../UserManagement/RoleAssignment/RoleAssignments'
import { useParams } from 'react-router-dom-v5-compat'

export const useCurrentCluster = () => {
  const { name } = useParams()
  return name
}

const ClusterRoleAssignments = () => {
  const clusterName = useCurrentCluster()
  const clusterNames = clusterName ? [clusterName] : []

  const roleAssignments = useFindRoleAssignments({ clusterNames })

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={false}
      hiddenColumns={['clusters']}
      preselected={{ clusterNames }}
    />
  )
}

export { ClusterRoleAssignments }
