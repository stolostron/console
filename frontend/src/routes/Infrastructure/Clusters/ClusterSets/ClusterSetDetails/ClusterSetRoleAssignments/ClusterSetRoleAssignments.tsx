/* Copyright Contributors to the Open Cluster Management project */
import { useParams } from 'react-router-dom-v5-compat'
import { useFindRoleAssignments } from '../../../../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignments } from '../../../../../UserManagement/RoleAssignment/RoleAssignments'

const ClusterSetRoleAssignments = () => {
  const { id: clusterSetName } = useParams()
  const clusterSetNames = clusterSetName ? [clusterSetName] : []
  const roleAssignments = useFindRoleAssignments({ clusterSetNames })

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={false}
      preselected={{ clusterSetNames, context: 'clusterSets' }}
    />
  )
}

export { ClusterSetRoleAssignments }
