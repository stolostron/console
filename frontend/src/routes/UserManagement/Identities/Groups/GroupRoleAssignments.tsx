/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { Group, GroupKind, listGroups } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useQuery } from '../../../../lib/useQuery'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

const GroupRoleAssignments = () => {
  const { id = undefined } = useParams()
  const [group, setGroup] = useState<Group>()

  const { data: groups, loading: isGroupsLoading } = useQuery(listGroups)

  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)

  const isRoleAssignmentsLoading = multiclusterRoleAssignments === undefined
  useEffect(() => {
    const group = groups?.find((group) => group.metadata.name === id || group.metadata.uid === id) as Group
    setGroup(group)
  }, [id, groups])

  const roleAssignments = useFindRoleAssignments({
    subjectNames: group?.metadata.name ? [group.metadata.name] : [],
    subjectKinds: ['Group'],
  })

  const isLoading = isGroupsLoading || isRoleAssignmentsLoading || !group || !multiclusterRoleAssignments

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={isLoading}
      hiddenColumns={['subject', 'name']}
      preselected={{ subject: { kind: GroupKind, value: group?.metadata.name } }}
    />
  )
}

export { GroupRoleAssignments }
