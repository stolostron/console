/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { Group, GroupKind, listGroups } from '../../../../resources'
import {
  FlattenedRoleAssignment,
  roleAssignmentToFlattenedRoleAssignment,
} from '../../../../resources/clients/multicluster-role-assignment-client'
import { useQuery } from '../../../../lib/useQuery'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { compareStrings } from '../../../../ui-components'
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

  const isLoading = isGroupsLoading || isRoleAssignmentsLoading || !group || !multiclusterRoleAssignments

  // TODO: call useFindRoleAssignments instead ACM-23633
  const roleAssignments: FlattenedRoleAssignment[] = useMemo(
    () =>
      !group || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter(
              (multiclusterRoleAssignment) =>
                multiclusterRoleAssignment.spec.subject.kind === 'Group' &&
                multiclusterRoleAssignment.spec.subject.name === group.metadata.name
            )
            .reduce(
              (roleAssignmentsAcc: FlattenedRoleAssignment[], multiclusterRoleAssignmentCurr) => [
                ...roleAssignmentsAcc,
                ...multiclusterRoleAssignmentCurr.spec.roleAssignments.map((roleAssignment) =>
                  roleAssignmentToFlattenedRoleAssignment(multiclusterRoleAssignmentCurr, roleAssignment)
                ),
              ],
              []
            )
            .sort((a, b) => compareStrings(a.subject.name ?? '', b.subject.name ?? '')),
    [multiclusterRoleAssignments, group]
  )

  return (
    <RoleAssignments
      roleAssignments={isLoading ? undefined : roleAssignments}
      isLoading={isLoading}
      hiddenColumns={['subject', 'name']}
      preselected={{ subject: { kind: GroupKind, value: group?.metadata.name } }}
    />
  )
}

export { GroupRoleAssignments }
