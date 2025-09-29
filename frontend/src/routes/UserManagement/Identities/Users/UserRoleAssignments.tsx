/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { User, UserKind } from '../../../../resources'
import { listUsers } from '../../../../resources/rbac'
import {
  roleAssignmentToFlattenedRoleAssignment,
  FlattenedRoleAssignment,
} from '../../../../resources/clients/multicluster-role-assignment-client'
import { useQuery } from '../../../../lib/useQuery'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { compareStrings } from '../../../../ui-components'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

const UserRoleAssignments = () => {
  const { id = undefined } = useParams()
  const [user, setUser] = useState<User>()

  const { data: users, loading: isUsersLoading } = useQuery(listUsers)

  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const isRoleAssignmentsLoading = multiclusterRoleAssignments === undefined

  useEffect(() => {
    const user = users?.find((user) => user.metadata.uid === id) as User
    setUser(user)
  }, [id, users])

  const isLoading = isUsersLoading || isRoleAssignmentsLoading || !user || !multiclusterRoleAssignments

  // TODO: call useFindRoleAssignments instead ACM-23633
  const roleAssignments: FlattenedRoleAssignment[] = useMemo(
    () =>
      !user || !multiclusterRoleAssignments
        ? []
        : multiclusterRoleAssignments
            .filter(
              (multiclusterRoleAssignment) =>
                multiclusterRoleAssignment.spec.subject.kind === 'User' &&
                multiclusterRoleAssignment.spec.subject.name === user.metadata.name
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
    [multiclusterRoleAssignments, user]
  )

  return (
    <RoleAssignments
      roleAssignments={isLoading ? undefined : roleAssignments}
      isLoading={isLoading}
      hiddenColumns={['subject', 'name']}
      preselected={{ subject: { kind: UserKind, value: user?.metadata.name } }}
    />
  )
}

export { UserRoleAssignments }
