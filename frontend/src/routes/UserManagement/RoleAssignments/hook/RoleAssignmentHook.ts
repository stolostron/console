/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '../../../../lib/useQuery'
import { listGroups, listRoles, listUsers, Role, ServiceAccount } from '../../../../resources'
import { compareStrings } from '../../../../ui-components'

type SelectOption = {
  id?: string
  value?: string
}

type RoleAssignmentHookType = {
  users: SelectOption[]
  groups: SelectOption[]
  roles: SelectOption[]
}

const getResourceWithNamespaceName = (serviceAccount: ServiceAccount | Role) => {
  const namespace = serviceAccount.metadata.namespace
  const name = serviceAccount.metadata.name
  const separator = namespace !== undefined && name !== undefined ? '/' : ''
  return `${namespace ?? ''}${separator}${name ?? ''}`
}

const useRoleAssignment = () => {
  const [roleAssignment, setRoleAssignment] = useState<RoleAssignmentHookType>({
    users: [],
    groups: [],
    roles: [],
  })
  const [isLoading, setIsLoading] = useState<boolean>(false)

  const { data: userList, loading: isUsersLoading } = useQuery(listUsers)
  const users: SelectOption[] = useMemo(
    () =>
      userList
        ?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
        .map((e) => ({ id: e.metadata.uid, value: e.metadata.name })) ?? [],
    [userList]
  )

  const { data: groupList, loading: isGroupsLoading } = useQuery(listGroups)
  const groups: SelectOption[] = useMemo(
    () =>
      groupList
        ?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
        .map((e) => ({ id: e.metadata.uid, value: e.metadata.name })) ?? [],
    [groupList]
  )

  const { data: roleList, loading: isRolesLoading } = useQuery(listRoles)
  const roles: SelectOption[] = useMemo(
    () =>
      roleList
        ?.sort((a, b) => compareStrings(getResourceWithNamespaceName(a), getResourceWithNamespaceName(b)))
        .map((e) => ({ id: e.metadata.uid, value: getResourceWithNamespaceName(e) })) ?? [],
    [roleList]
  )

  useEffect(() => setIsLoading(isUsersLoading || isRolesLoading), [isUsersLoading, isRolesLoading])

  useEffect(
    () => setRoleAssignment({ ...roleAssignment, users }),
    // roleAssignment would produce a loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [users]
  )

  useEffect(
    () => setRoleAssignment({ ...roleAssignment, groups }),
    // roleAssignment would produce a loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [groups]
  )

  useEffect(
    () => setRoleAssignment({ ...roleAssignment, roles }),
    // roleAssignment would produce a loop
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [roles]
  )

  return { roleAssignment, isLoading, isUsersLoading, isGroupsLoading, isRolesLoading }
}

export { useRoleAssignment }

export type { RoleAssignmentHookType, SelectOption }
