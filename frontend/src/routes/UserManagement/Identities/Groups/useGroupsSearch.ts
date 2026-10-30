/* Copyright Contributors to the Open Cluster Management project */
import { SortByDirection } from '@patternfly/react-table'
import { useCallback, useEffect, useMemo, useRef } from 'react'
// Avoid the package barrel: it also loads fleetK8s* → @console/shared (breaks npm start).
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import type { SearchFilter, SearchInput } from '@stolostron/multicluster-sdk'
import { IRequestListView, IResultListView } from '../../../../lib/useAggregates'
import { IResource } from '../../../../resources/resource'
import { Group, GroupKind, UserApiVersion } from '../../../../resources/rbac'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { DEFAULT_ITEMS_PER_PAGE, DEFAULT_PAGE } from '../../../../ui-components/AcmTable/AcmTableStateProvider'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument, useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import {
  areRanksReady,
  asSearchError,
  findIndexedIdentityName,
  keywordSearchInput,
  keywordsFromSearch,
  pagedSearchInput,
  placeExtrasByRank,
  rankCountVariables,
  searchApolloClient,
  searchPageWindow,
  stitchSearchPage,
  useSearchListControls,
} from '../searchIdentityHelpers'
import { groupsFromMulticlusterRoleAssignments } from '../useMergedIdentities'

export type GroupSortField = 'name' | 'created' | 'userCount'

type SortColumn = {
  sort?: string | ((a: Group, b: Group) => number)
  isHidden?: boolean
}

const SORT_FIELD_BY_COLUMN: Record<string, GroupSortField> = {
  'metadata.name': 'name',
  'users.length': 'userCount',
  'metadata.creationTimestamp': 'created',
}

/**
 * Hub-scoped Group filters for Search query and watch.
 *
 * Search stores `_hubClusterResource` only on hub resources, but equality on
 * `values: ['true']` returns 0 hits. `values: ['*']` matches any value and is
 * the supported workaround (property presence ≈ hub-only). Prefer this over
 * `cluster: <hubName>`, which drops Group watch events.
 */
export function hubGroupFilters(): SearchFilter[] {
  return [
    { property: 'kind', values: ['Group'] },
    { property: 'apigroup', values: ['user.openshift.io'] },
    { property: '_hubClusterResource', values: ['*'] },
  ]
}

/**
 * Filters for a Group GraphQL watch. Search ignores limit/offset/orderBy on subscriptions
 * and drops Group events when `cluster` is set. Same hub scope as {@link hubGroupFilters}.
 */
export function hubGroupWatchFilters(name?: string): SearchFilter[] {
  return [...hubGroupFilters(), ...(name ? [{ property: 'name', values: [name] }] : [])]
}

export { keywordsFromSearch } from '../searchIdentityHelpers'

export function groupOrderBy(
  columns: SortColumn[],
  sortBy: { index?: number; direction?: string } | undefined
): { field: GroupSortField; descending: boolean; orderBy: string } {
  const visible = columns.filter((column) => !column.isHidden)
  const column = sortBy?.index !== undefined ? visible[sortBy.index] : undefined
  const sortKey = typeof column?.sort === 'string' ? column.sort : undefined
  const field = (sortKey && SORT_FIELD_BY_COLUMN[sortKey]) || 'name'
  const descending = sortBy?.direction === SortByDirection.desc
  return { field, descending, orderBy: `${field} ${descending ? 'desc' : 'asc'}` }
}

export function groupMatchesKeywords(group: Group, keywords: string[] | undefined): boolean {
  if (!keywords?.length) return true
  const name = (group.metadata.name ?? '').toLowerCase()
  return keywords.every((keyword) => name.includes(keyword.toLowerCase()))
}

function parseCount(value: unknown): number | undefined {
  if (value === undefined || value === null || value === '') return undefined
  const count = typeof value === 'number' ? value : Number(value)
  return Number.isFinite(count) ? count : undefined
}

export function groupSortValue(group: Group, field: GroupSortField): string | number {
  switch (field) {
    case 'name':
      return group.metadata.name ?? ''
    case 'created':
      return group.metadata.creationTimestamp ?? ''
    case 'userCount':
      return group.userCount ?? group.users?.length ?? 0
  }
}

function compareGroups(a: Group, b: Group, field: GroupSortField, descending: boolean): number {
  const left = groupSortValue(a, field)
  const right = groupSortValue(b, field)
  const compared =
    typeof left === 'number' && typeof right === 'number' ? left - right : String(left).localeCompare(String(right))
  if (compared !== 0) return descending ? -compared : compared
  const nameCompared = (a.metadata.name ?? '').localeCompare(b.metadata.name ?? '')
  return descending ? -nameCompared : nameCompared
}

function uniqueGroups(groups: Group[]): Group[] {
  const seen = new Set<string>()
  const unique: Group[] = []
  for (const group of groups) {
    const name = group.metadata.name
    if (!name || seen.has(name)) continue
    seen.add(name)
    unique.push(group)
  }
  return unique
}

/** MRA-only subjects use `uid === name`; Search-backed Groups use a real uid. */
export function isSearchBackedGroup(group: Group): boolean {
  const name = group.metadata.name
  const uid = group.metadata.uid
  if (group.userCount !== undefined) return true
  return Boolean(uid && name && uid !== name)
}

function groupMemberCount(group: Group): number {
  return group.userCount ?? group.users?.length ?? 0
}

/** Search-backed rows win over MRA stubs. Equal backing keeps the larger member count. */
function preferredGroup(existing: Group, next: Group): Group {
  const existingIndexed = isSearchBackedGroup(existing)
  const nextIndexed = isSearchBackedGroup(next)
  if (nextIndexed !== existingIndexed) return nextIndexed ? next : existing
  return groupMemberCount(next) > groupMemberCount(existing) ? next : existing
}

/**
 * Collapse duplicate names after stitching MRA extras with Search rows.
 * Prefer the Search-backed Group (real CR / userCount) over an MRA-only stub.
 */
export function preferSearchBackedGroups(groups: Group[]): Group[] {
  const preferred = new Map<string, Group>()
  for (const group of groups) {
    const name = group.metadata.name
    if (!name) continue
    const existing = preferred.get(name)
    preferred.set(name, existing ? preferredGroup(existing, group) : group)
  }
  return uniqueGroups(groups.map((group) => preferred.get(group.metadata.name ?? '') ?? group))
}

function toGroup(group: Group): Group {
  return {
    ...group,
    apiVersion: group.apiVersion ?? UserApiVersion,
    kind: GroupKind,
    users: group.users ?? [],
  }
}

export function searchItemToGroup(item: Record<string, unknown>): Group {
  const uid = typeof item._uid === 'string' ? item._uid.split('/').pop() : undefined
  const userCount = parseCount(item.userCount)
  return {
    apiVersion: UserApiVersion,
    kind: GroupKind,
    metadata: {
      name: typeof item.name === 'string' ? item.name : undefined,
      uid,
      creationTimestamp: typeof item.created === 'string' ? item.created : undefined,
    },
    users: [],
    ...(userCount !== undefined ? { userCount } : {}),
  }
}

/** Search compares with an operator prefix on the value (`<name`, `>3`). */
function beforeFilter(field: GroupSortField, group: Group, descending: boolean): SearchFilter {
  const operator = descending ? '>' : '<'
  return { property: field, values: [`${operator}${groupSortValue(group, field)}`] }
}

export function stitchGroupPage(
  searchItems: Group[],
  extrasOnPage: { mergedIndex: number; group: Group }[],
  start: number,
  perPage: number
): Group[] {
  return stitchSearchPage(
    searchItems,
    extrasOnPage.map(({ mergedIndex, group }) => ({ mergedIndex, resource: group })),
    start,
    perPage
  )
}

function useMraGroupSubjects(): Group[] {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  return useMemo(() => groupsFromMulticlusterRoleAssignments(mras ?? [], new Set()), [mras])
}

export type GroupsSearchResult = {
  groups: Group[]
  processedItemCount: number
  loading: boolean
  error?: Error
  refetch: () => void
  fetchExport: (requestedExport: IRequestListView) => Promise<IResultListView | undefined>
  emptyResult: boolean
}

export function useGroupsSearch(options: {
  request: IRequestListView | undefined
  columns: SortColumn[]
  additionalGroups?: Group[]
}): GroupsSearchResult {
  const { request, columns, additionalGroups } = options
  const mraGroups = useMraGroupSubjects()
  const page = request?.page ?? DEFAULT_PAGE
  const perPage = request?.perPage && request.perPage > 0 ? request.perPage : DEFAULT_ITEMS_PER_PAGE
  const keywords = useMemo(() => keywordsFromSearch(request?.search), [request?.search])
  const { field, descending, orderBy } = useMemo(
    () => groupOrderBy(columns, request?.sortBy),
    [columns, request?.sortBy]
  )
  const baseFilters = useMemo(() => hubGroupFilters(), [])

  const candidates = useMemo(
    () => uniqueGroups([...(additionalGroups ?? []), ...mraGroups]),
    [additionalGroups, mraGroups]
  )
  const lookupNames = useMemo(
    () => candidates.map((group) => group.metadata.name).filter((name): name is string => Boolean(name)),
    [candidates]
  )
  const lookupInput = useMemo<SearchInput | undefined>(() => {
    if (lookupNames.length === 0) return undefined
    return {
      filters: [...baseFilters, { property: 'name', values: lookupNames }],
      limit: lookupNames.length,
    }
  }, [baseFilters, lookupNames])
  const [lookupFleet, lookupLoaded, lookupError, refetchLookup] = useFleetSearch(lookupInput, false)
  const lookupGroups = lookupFleet as Group[] | undefined

  const indexedNames = useMemo(() => {
    const names = new Set<string>()
    for (const group of lookupGroups ?? []) {
      if (group.metadata?.name) names.add(group.metadata.name)
    }
    return names
  }, [lookupGroups])

  const extrasReady = lookupNames.length === 0 || lookupLoaded
  const extras = useMemo(() => {
    if (!extrasReady) return []
    return candidates.filter(
      (group) => !indexedNames.has(group.metadata.name ?? '') && groupMatchesKeywords(group, keywords)
    )
  }, [candidates, extrasReady, indexedNames, keywords])

  const rankInputs = useMemo<SearchInput[]>(
    () => extras.map((group) => keywordSearchInput([...baseFilters, beforeFilter(field, group, descending)], keywords)),
    [baseFilters, descending, extras, field, keywords]
  )
  const rankQuery = useSearchResultCountQuery({
    client: searchApolloClient(),
    skip: extras.length === 0,
    variables: rankCountVariables(rankInputs, baseFilters),
  })
  const rankCounts = useMemo(() => rankQuery.data?.searchResult ?? [], [rankQuery.data])
  const ranksReady = areRanksReady(extras.length, rankCounts.length, rankQuery.loading)

  const placedExtras = useMemo(() => {
    if (!ranksReady) return []
    return placeExtrasByRank(extras, rankCounts, (a, b) => compareGroups(a, b, field, descending)).map(
      ({ resource, mergedIndex }) => ({ group: resource, mergedIndex })
    )
  }, [descending, extras, field, rankCounts, ranksReady])

  const { start, extrasOnPage, searchOffset, searchLimit, canQueryPage } = searchPageWindow(
    placedExtras,
    page,
    perPage,
    extrasReady,
    ranksReady
  )

  const pageInput = useMemo<SearchInput | undefined>(() => {
    if (!canQueryPage) return undefined
    return pagedSearchInput(baseFilters, keywords, searchLimit, searchOffset, orderBy)
  }, [baseFilters, canQueryPage, keywords, orderBy, searchLimit, searchOffset])
  // Subscription uses toWatchInput(pageInput): same filters, without limit/offset/orderBy.
  const [pageFleet, pageLoaded, pageError, refetchPage] = useFleetSearch(pageInput, true)
  const pageGroups = pageFleet as Group[] | undefined

  const countInput = useMemo(() => keywordSearchInput(baseFilters, keywords), [baseFilters, keywords])
  const countQuery = useSearchResultCountQuery({
    client: searchApolloClient(),
    variables: { input: [countInput] },
  })
  const searchCount = countQuery.data?.searchResult?.[0]?.count ?? 0
  // Search subscription can add a Group to the page before the lookup query sees it;
  // do not double-count that name as an MRA extra.
  const searchNamesOnPage = useMemo(() => {
    const names = new Set<string>()
    for (const group of pageGroups ?? []) {
      if (group.metadata?.name) names.add(group.metadata.name)
    }
    return names
  }, [pageGroups])
  // Search can surface a Group on the page before lookup drops it from extras; hold the
  // stitched page and count until that overlap is reconciled (lookup refetch below).
  const hasUnresolvedOverlap = useMemo(
    () => extras.some((group) => searchNamesOnPage.has(group.metadata.name ?? '')),
    [extras, searchNamesOnPage]
  )
  const extrasNotOnSearchPage = useMemo(
    () => extras.filter((group) => !searchNamesOnPage.has(group.metadata.name ?? '')),
    [extras, searchNamesOnPage]
  )
  const processedItemCount = hasUnresolvedOverlap ? 0 : searchCount + extrasNotOnSearchPage.length

  const pageReady = !canQueryPage || pageLoaded
  const ready = extrasReady && ranksReady && pageReady && !countQuery.loading && !hasUnresolvedOverlap
  const groups = useMemo(() => {
    if (!ready) return []
    return preferSearchBackedGroups(stitchGroupPage((pageGroups ?? []).map(toGroup), extrasOnPage, start, perPage))
  }, [extrasOnPage, pageGroups, perPage, ready, start])

  const pageQueryKey = `${keywords?.join('\0') ?? ''}\n${orderBy}\n${searchOffset}\n${searchLimit}`
  const refetch = useSearchListControls({
    refetchPage,
    refetchLookup,
    refetchCount: countQuery.refetch,
    refetchRanks: rankQuery.refetch,
    lookupNamesLength: lookupNames.length,
    extrasLength: extras.length,
    hasUnresolvedOverlap,
    pageQueryKey,
    searchNamesOnPage,
    indexedNames,
    lookupNames,
  })

  const additionalKey = (additionalGroups ?? []).map((group) => group.metadata.name ?? '').join('\n')
  const skipAdditionalRefetch = useRef(true)
  useEffect(() => {
    if (skipAdditionalRefetch.current) {
      skipAdditionalRefetch.current = false
      return
    }
    refetch()
  }, [additionalKey, refetch])

  const fetchExport = useCallback(async (): Promise<IResultListView | undefined> => {
    const result = await searchClient.query({
      query: SearchResultItemsDocument,
      variables: {
        input: [{ filters: hubGroupFilters(), limit: -1, orderBy: 'name asc' }],
      },
    })
    const items = ((result.data?.searchResult?.[0]?.items ?? []) as Array<Record<string, unknown> | null>)
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map(searchItemToGroup)
    const indexed = new Set(items.map((group) => group.metadata.name).filter((name): name is string => Boolean(name)))
    const extra = candidates.filter((group) => group.metadata.name && !indexed.has(group.metadata.name))
    const merged = [...items, ...extra].sort((a, b) => (a.metadata.name ?? '').localeCompare(b.metadata.name ?? ''))
    return {
      page: 1,
      loading: false,
      refresh: () => {},
      items: merged as IResource[],
      emptyResult: merged.length === 0,
      processedItemCount: merged.length,
      isPreProcessed: true,
    }
  }, [candidates])

  const searching = keywords !== undefined
  const error =
    asSearchError(pageError) ??
    asSearchError(lookupError) ??
    asSearchError(countQuery.error) ??
    asSearchError(rankQuery.error)
  return {
    groups,
    processedItemCount,
    // Rank/count/page failures must surface via emptyState, not an indefinite skeleton.
    loading: !ready && !error,
    error,
    refetch,
    fetchExport,
    emptyResult: ready && searching && processedItemCount === 0,
  }
}

export function useHasHubGroups(): { hasGroups: boolean; loaded: boolean } {
  const mraGroups = useMraGroupSubjects()
  const filters = useMemo(() => hubGroupFilters(), [])
  const { data, loading } = useSearchResultCountQuery({
    client: searchApolloClient(),
    variables: { input: [{ filters }] },
  })
  const count = data?.searchResult?.[0]?.count ?? 0
  return { hasGroups: count > 0 || mraGroups.length > 0, loaded: !loading }
}

export function useGroupIdentity(name: string | undefined): Group | undefined {
  const mraGroups = useMraGroupSubjects()
  const input = useMemo<SearchInput | undefined>(() => {
    if (!name) return undefined
    return {
      filters: [...hubGroupFilters(), { property: 'name', values: [name] }],
      limit: 1,
    }
  }, [name])
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

/**
 * Resolve a Group CR name from a route id (uid or name).
 * Search returns `_uid` on items but rejects it as a filter, so load hub Groups once and match
 * by `_uid` or `name`. Callers then load the full CR via getResource(name).
 */
export async function findIndexedGroupName(id: string, hubName: string): Promise<string | undefined> {
  return findIndexedIdentityName(id, hubName, hubGroupFilters())
}
