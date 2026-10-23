/* Copyright Contributors to the Open Cluster Management project */
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import { SearchInput } from '@stolostron/multicluster-sdk/lib/types/search'
import { useMemo } from 'react'
import { Group, GroupKind, UserApiVersion } from '../../../../resources/rbac'
import { hubGroupFilters } from '../Groups/useGroupsSearch'
import { useUserDetailsContext } from './UserPage'

function stubGroup(name: string): Group {
  return {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: { name, uid: name },
    users: [],
  }
}

/**
 * Groups for the User details Groups tab.
 *
 * Membership comes from the User CR `groups` field, which stays live via
 * {@link useCurrentUser}'s User Search subscription (same path YAML uses).
 * Group rows are loaded by name through Search — not a hub-wide Group watch.
 * Watching every hub Group previously completed other Search subscriptions on
 * the shared WebSocket when this tab mounted.
 */
export const useUserGroups = () => {
  const { user } = useUserDetailsContext()

  const groupNames = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const name of user?.groups ?? []) {
      if (!name || seen.has(name)) continue
      seen.add(name)
      ordered.push(name)
    }
    return ordered
  }, [user?.groups])

  const queryInput = useMemo<SearchInput | undefined>(() => {
    if (groupNames.length === 0) return undefined
    return {
      filters: [...hubGroupFilters(), { property: 'name', values: groupNames }],
      limit: groupNames.length,
    }
  }, [groupNames])

  // Subscribe to the named Groups only (narrow watch). Membership add/remove is
  // driven by User CR updates in context — do not watch all hub Groups.
  const [fleet, loaded] = useFleetSearch<Group>(queryInput, true)
  const indexedGroups = useMemo(() => fleet ?? [], [fleet])

  const userGroups = useMemo(() => {
    if (groupNames.length === 0) return []
    const byName = new Map<string, Group>()
    for (const group of indexedGroups) {
      const name = group.metadata.name
      if (name) byName.set(name, group)
    }
    return groupNames.map((name) => byName.get(name) ?? stubGroup(name))
  }, [groupNames, indexedGroups])

  // Skip shows as loaded; only treat as loading while we have names to resolve.
  const loading = groupNames.length > 0 && !loaded

  const userWithGroups = useMemo(() => {
    if (!user) return user
    return {
      ...user,
      groups: groupNames.length > 0 ? groupNames : null,
    }
  }, [user, groupNames])

  return {
    userGroups,
    userWithGroups,
    loading,
  }
}
