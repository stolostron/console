/* Copyright Contributors to the Open Cluster Management project */
// Avoid the package barrel: it also loads fleetK8s* → @console/shared (breaks npm start).
import { useMemo } from 'react';
import { useFleetSearch, type SearchFilter, type SearchInput } from '@stolostron/multicluster-sdk'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument, useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import { useLocalHubName } from '~/hooks/use-local-hub';
import { useSharedAtoms, useSharedValue } from '~/shared-atoms';
import { groupsFromMulticlusterRoleAssignments } from '../useMergedIdentities';
import { Group, GroupKind, UserApiVersion } from '~/resources/rbac';

/** Bound for uid→name scans; Search returns `_uid` on items but often cannot filter by it. */
const GROUP_UID_LOOKUP_LIMIT = 10000



function useMraGroupSubjects(): Group[] {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  return useMemo(() => groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()), [mras])
}

function toGroup(group: Group): Group {
  return {
    ...group,
    apiVersion: group.apiVersion ?? UserApiVersion,
    kind: GroupKind,
    users: group.users ?? [],
  }
}

export function useHasHubGroups(): { hasGroups: boolean; loaded: boolean } {
  const hubName = useLocalHubName()
  const mraGroups = useMraGroupSubjects()
  const filters = useMemo(() => hubGroupFilters(hubName), [hubName])
  const { data, loading } = useSearchResultCountQuery({
    client: process.env.NODE_ENV === 'test' ? undefined : searchClient,
    variables: { input: [{ filters }] },
  })
  const count = data?.searchResult?.[0]?.count ?? 0
  return { hasGroups: count > 0 || mraGroups.length > 0, loaded: !loading }
}

export function useGroupIdentity(name: string | undefined): Group | undefined {
  const hubName = useLocalHubName()
  const mraGroups = useMraGroupSubjects()
  const input = useMemo<SearchInput | undefined>(() => {
    if (!name) return undefined
    return {
      filters: [...hubGroupFilters(hubName), { property: 'name', values: [name] }],
      limit: 1,
    }
  }, [hubName, name])
  const [foundFleet, loaded] = useFleetSearch(input, false)
  const found = foundFleet as Group[] | undefined
  return useMemo(() => {
    if (!name) return undefined
    const indexed = found?.[0]
    if (indexed?.metadata?.name) return toGroup(indexed)
    if (!loaded) return undefined
    return mraGroups.find((group) => group.metadata.name === name)
  }, [found, loaded, mraGroups, name])
}


function hubGroupFilters(hubName: string): SearchFilter[] {
  return [
    { property: 'kind', values: ['Group'] },
    { property: 'apigroup', values: ['user.openshift.io'] },
    { property: 'cluster', values: [hubName] },
  ]
}

/**
 * Resolve a Group CR name from a route id (uid or name).
 * Search returns `_uid` on items but rejects it as a filter, so load hub Groups once and match
 * by `_uid` or `name`. Callers then load the full CR via getResource(name).
 */
export async function findIndexedGroupName(id: string, hubName: string): Promise<string | undefined> {
  const result = await searchClient.query({
    query: SearchResultItemsDocument,
    variables: {
      input: [
        {
          filters: [...hubGroupFilters(hubName)],
          limit: GROUP_UID_LOOKUP_LIMIT,
        },
      ],
    },
  })
  const items = result.data?.searchResult?.[0]?.items ?? []
  const prefixed = `${hubName}/${id}`
  for (const item of items) {
    if (typeof item?.name !== 'string') continue
    if (item.name === id) return item.name
    const itemUid = typeof item._uid === 'string' ? item._uid : ''
    if (itemUid === id || itemUid === prefixed || itemUid.endsWith(`/${id}`)) return item.name
  }
  return undefined
}
