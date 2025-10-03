/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { User, UserKind } from '../../../../resources'
import { listUsers } from '../../../../resources/rbac'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useQuery } from '../../../../lib/useQuery'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
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

  const roleAssignments = useFindRoleAssignments({
    subjectNames: user?.metadata.name ? [user.metadata.name] : [],
    subjectKinds: ['User'],
  })

  const isLoading = isUsersLoading || isRoleAssignmentsLoading || !user
  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={isLoading}
      hiddenColumns={['subject', 'name']}
      preselected={{ subject: { kind: UserKind, value: user?.metadata.name } }}
    />
  )
}

export { UserRoleAssignments }
