/* Copyright Contributors to the Open Cluster Management project */
// Avoid the package barrel: it also loads fleetK8s* → @console/shared (breaks npm start).
import type { SearchFilter } from '@stolostron/multicluster-sdk'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument } from '../../../Search/search-sdk/search-sdk'

/** Bound for uid→name scans; Search returns `_uid` on items but often cannot filter by it. */
const GROUP_UID_LOOKUP_LIMIT = 10000

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
