/* Copyright Contributors to the Open Cluster Management project */
import { GroupKind } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'
import { useCurrentGroup } from './GroupPage'

const GroupRoleAssignments = () => {
  const group = useCurrentGroup()

  const roleAssignments = useFindRoleAssignments({
    subjectNames: group?.metadata.name ? [group.metadata.name] : [],
    subjectKinds: ['Group'],
  })

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={false}
      hiddenColumns={['subject', 'name']}
      preselected={{ subject: { kind: GroupKind, value: group?.metadata.name } }}
    />
  )
}

export { GroupRoleAssignments }
