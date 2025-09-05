/* Copyright Contributors to the Open Cluster Management project */
import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '../../../../lib/useQuery'
import { listGroups, listUsers } from '../../../../resources'
import { compareStrings } from '../../../../ui-components'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { useSearchResultItemsQuery } from '../../../Search/search-sdk/search-sdk'

type SelectOption = {
  id?: string
  value?: string
}

type RoleAssignmentHookType = {
  users: SelectOption[]
  groups: SelectOption[]
  roles: SelectOption[]
}

type RoleAssignmentHookReturnType = {
  roleAssignment: RoleAssignmentHookType
  isLoading: boolean
  isUsersLoading: boolean
  isGroupsLoading: boolean
  isRolesLoading: boolean
}
/**
 * custom hook for retrieving whatever the data is needed for RoleAssignment creation/edit
 * @returns RoleAssignmentHookReturnType
 */
const useRoleAssignment = (): RoleAssignmentHookReturnType => {
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
        .map((e) => ({ id: e.metadata.name, value: e.metadata.name })) ?? [],
    [userList]
  )

  const { data: groupList, loading: isGroupsLoading } = useQuery(listGroups)
  const groups: SelectOption[] = useMemo(
    () =>
      groupList
        ?.sort((a, b) => compareStrings(a.metadata.name ?? '', b.metadata.name ?? ''))
        .map((e) => ({ id: e.metadata.name, value: e.metadata.name })) ?? [],
    [groupList]
  )

  const { data: clusterRolesQuery, loading: isRolesLoading } = useSearchResultItemsQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: {
      input: [
        {
          keywords: [],
          filters: [
            { property: 'kind', values: ['ClusterRole'] },
            { property: 'cluster', values: ['local-cluster'] },
            { property: 'label', values: ['rbac.open-cluster-management.io/filter=vm-clusterroles'] },
          ],
          limit: -1,
        },
      ],
    },
  })

  const roles: SelectOption[] = useMemo(
    () =>
      clusterRolesQuery?.searchResult
        ?.flatMap((roles) => roles?.items as unknown as { name: string; _uid: string })
        .map((e) => ({ id: e.name, value: e.name }))
        .sort((a, b) => a.value.localeCompare(b.value)) ?? [],
    [clusterRolesQuery?.searchResult]
  )

  useEffect(() => setIsLoading(isUsersLoading || isRolesLoading), [isUsersLoading, isRolesLoading])

  // to avoid loop onroleAssignment
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setRoleAssignment({ ...roleAssignment, users }), [users])

  // to avoid loop onroleAssignment
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setRoleAssignment({ ...roleAssignment, groups }), [groups])

  // to avoid loop onroleAssignment
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => setRoleAssignment({ ...roleAssignment, roles }), [roles])

  return { roleAssignment, isLoading, isUsersLoading, isGroupsLoading, isRolesLoading }
}

export { useRoleAssignment }

export type { RoleAssignmentHookType, SelectOption }
