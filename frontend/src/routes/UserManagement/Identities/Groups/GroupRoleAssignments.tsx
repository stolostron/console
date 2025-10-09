/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { GroupKind } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

const GroupRoleAssignments = () => {
  const { id = undefined } = useParams()

  const { groupsState } = useSharedAtoms()
  const groups = useRecoilValue(groupsState)

  const group = useMemo(
    () => (!groups || !id ? undefined : groups.find((g) => g.metadata.uid === id || g.metadata.name === id)),
    [groups, id]
  )

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
