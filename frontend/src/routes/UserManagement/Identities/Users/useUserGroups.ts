/* Copyright Contributors to the Open Cluster Management project */
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import { useFleetSearchSubscription } from '@stolostron/multicluster-sdk/lib/api/useFleetSearchSubscription'
import { SearchInput } from '@stolostron/multicluster-sdk/lib/types/search'
import { useEffect, useMemo, useRef } from 'react'
import { useLocalHubName } from '../../../../hooks/use-local-hub'
import { Group } from '../../../../resources/rbac'
import { hubGroupFilters, hubGroupWatchFilters } from '../Groups/useGroupsSearch'
import { useUserDetailsContext } from './UserPage'

type GroupMembershipEvent = {
  uid?: string | null
  oldData?: unknown
  newData?: unknown
}

function groupUsersFromEventData(data: unknown): string[] {
  if (!data || typeof data !== 'object') return []
  const groupUsers = (data as Record<string, unknown>).groupUsers
  if (Array.isArray(groupUsers)) return groupUsers.map(String)
  if (typeof groupUsers === 'string') return [groupUsers]
  return []
}

/** True when the watch event adds, removes, or deletes a group for this user. */
export function groupEventAffectsUser(
  event: GroupMembershipEvent,
  userName: string,
  listedUids: Set<string>
): boolean {
  if (groupUsersFromEventData(event.oldData).includes(userName)) return true
  if (groupUsersFromEventData(event.newData).includes(userName)) return true
  // DELETE (or sparse payloads) may omit groupUsers — refresh if we already listed this uid.
  const uid = event.uid
  if (!uid) return false
  for (const listed of listedUids) {
    if (uid === listed || uid.endsWith(`/${listed}`)) return true
  }
  return false
}

export const useUserGroups = () => {
  const { user } = useUserDetailsContext()
  const hubName = useLocalHubName()
  const userName = user?.metadata?.name

  const queryInput = useMemo<SearchInput | undefined>(() => {
    if (!userName) return undefined
    return {
      filters: [...hubGroupFilters(hubName), { property: 'groupUsers', values: [userName] }],
      limit: -1,
      orderBy: 'name asc',
    }
  }, [hubName, userName])

  // Do not filter the watch by groupUsers: Search skips events once membership no longer
  // matches (e.g. user removed). Watch all hub Groups and refetch the filtered query.
  const watchInput = useMemo<SearchInput | undefined>(
    () => (userName ? { filters: hubGroupWatchFilters() } : undefined),
    [userName]
  )

  const [fleet, loaded, , refetch] = useFleetSearch<Group>(queryInput, false)
  const [latestEvent] = useFleetSearchSubscription(watchInput)
  const userGroups = fleet ?? []
  const handledEventKey = useRef<string>()

  const listedUids = useMemo(() => {
    const uids = new Set<string>()
    for (const group of userGroups) {
      if (group.metadata.uid) uids.add(group.metadata.uid)
    }
    return uids
  }, [userGroups])

  useEffect(() => {
    if (!latestEvent || !userName) return
    const key = `${latestEvent.operation}:${latestEvent.uid}:${String(latestEvent.timestamp)}`
    if (handledEventKey.current === key) return
    if (!groupEventAffectsUser(latestEvent, userName, listedUids)) return
    handledEventKey.current = key
    refetch()
  }, [latestEvent, listedUids, refetch, userName])

  // Skip shows as loaded; only treat as loading while we have a user to query for.
  const loading = Boolean(userName) && !loaded

  const userWithGroups = useMemo(() => {
    if (!user) return user

    const groupNames = userGroups.map((group) => group.metadata.name || '')

    return {
      ...user,
      groups: groupNames.length > 0 ? groupNames : null,
    }
  }, [user, userGroups])

  return {
    userGroups,
    userWithGroups,
    loading,
  }
}
