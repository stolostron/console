/* Copyright Contributors to the Open Cluster Management project */
import { useMemo } from 'react'
import { useParams } from 'react-router-dom-v5-compat'
import { UserKind } from '../../../../resources'
import { useFindRoleAssignments } from '../../../../resources/clients/multicluster-role-assignment-client'
import { useRecoilValue, useSharedAtoms } from '../../../../shared-recoil'
import { RoleAssignments } from '../../RoleAssignment/RoleAssignments'

const UserRoleAssignments = () => {
  const { id = undefined } = useParams()

  const { usersState } = useSharedAtoms()
  const users = useRecoilValue(usersState)

  const user = useMemo(
    () => (!users || !id ? undefined : users.find((u) => u.metadata.uid === id || u.metadata.name === id)),
    [users, id]
  )

  const roleAssignments = useFindRoleAssignments({
    subjectNames: user?.metadata.name ? [user.metadata.name] : [],
    subjectKinds: ['User'],
  })

  return (
    <RoleAssignments
      roleAssignments={roleAssignments}
      isLoading={false}
      hiddenColumns={['subject', 'name']}
      preselected={{ subject: { kind: UserKind, value: user?.metadata.name } }}
    />
  )
}

export { UserRoleAssignments }
