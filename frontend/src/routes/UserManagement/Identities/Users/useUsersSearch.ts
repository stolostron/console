/* Copyright Contributors to the Open Cluster Management project */
import { SortByDirection } from '@patternfly/react-table'
import { useCallback, useEffect, useMemo, useRef } from 'react'
// Avoid the package barrel: it also loads fleetK8s* → @console/shared (breaks npm start).
import { useFleetSearch } from '@stolostron/multicluster-sdk/lib/api/useFleetSearch'
import type { SearchFilter, SearchInput } from '@stolostron/multicluster-sdk'
import { IRequestListView, IResultListView } from '../../../../lib/useAggregates'
import { IResource } from '../../../../resources/resource'
import { User, UserApiVersion, UserKind } from '../../../../resources/rbac'
import { useSharedAtoms, useSharedValue } from '../../../../shared-atoms'
import { DEFAULT_ITEMS_PER_PAGE, DEFAULT_PAGE } from '../../../../ui-components/AcmTable/AcmTableStateProvider'
import { searchClient } from '../../../Search/search-sdk/search-client'
import { SearchResultItemsDocument, useSearchResultCountQuery } from '../../../Search/search-sdk/search-sdk'
import { usersFromMulticlusterRoleAssignments } from '../useMergedIdentities'
import { keywordsFromSearch } from '../Groups/useGroupsSearch'

export type UserSortField = 'name' | 'created'

type SortColumn = {
  sort?: string | ((a: User, b: User) => number)
  isHidden?: boolean
}

const SORT_FIELD_BY_COLUMN: Record<string, UserSortField> = {
  'metadata.name': 'name',
  'metadata.creationTimestamp': 'created',
}

/**
 * Hub-scoped User filters for Search query and watch.
 *
 * Search stores `_hubClusterResource` only on hub resources, but equality on
 * `values: ['true']` returns 0 hits. `values: ['*']` matches any value and is
 * the supported workaround (property presence ≈ hub-only). Prefer this over
 * `cluster: <hubName>`, which drops User watch events.
 */
export function hubUserFilters(): SearchFilter[] {
  return [
    { property: 'kind', values: ['User'] },
    { property: 'apigroup', values: ['user.openshift.io'] },
    { property: '_hubClusterResource', values: ['*'] },
  ]
}

/**
 * Filters for a User GraphQL watch. Search ignores limit/offset/orderBy on subscriptions
 * and drops User events when `cluster` is set. Same hub scope as {@link hubUserFilters}.
 * Prefer including `name` when watching a single User on details.
 */
export function hubUserWatchFilters(name?: string): SearchFilter[] {
  return [...hubUserFilters(), ...(name ? [{ property: 'name', values: [name] }] : [])]
}

export function userOrderBy(
  columns: SortColumn[],
  sortBy: { index?: number; direction?: string } | undefined
): { field: UserSortField; descending: boolean; orderBy: string } {
  const visible = columns.filter((column) => !column.isHidden)
  const column = sortBy?.index !== undefined ? visible[sortBy.index] : undefined
  const sortKey = typeof column?.sort === 'string' ? column.sort : undefined
  const field = (sortKey && SORT_FIELD_BY_COLUMN[sortKey]) || 'name'
  const descending = sortBy?.direction === SortByDirection.desc
  return { field, descending, orderBy: `${field} ${descending ? 'desc' : 'asc'}` }
}

export function userMatchesKeywords(user: User, keywords: string[] | undefined): boolean {
  if (!keywords?.length) return true
  const name = (user.metadata.name ?? '').toLowerCase()
  return keywords.every((keyword) => name.includes(keyword.toLowerCase()))
}

export function userSortValue(user: User, field: UserSortField): string {
  switch (field) {
    case 'name':
      return user.metadata.name ?? ''
    case 'created':
      return user.metadata.creationTimestamp ?? ''
  }
}

function compareUsers(a: User, b: User, field: UserSortField, descending: boolean): number {
  const compared = userSortValue(a, field).localeCompare(userSortValue(b, field))
  if (compared !== 0) return descending ? -compared : compared
  const nameCompared = (a.metadata.name ?? '').localeCompare(b.metadata.name ?? '')
  return descending ? -nameCompared : nameCompared
}

function uniqueUsers(users: User[]): User[] {
  const seen = new Set<string>()
  const unique: User[] = []
  for (const user of users) {
    const name = user.metadata.name
    if (!name || seen.has(name)) continue
    seen.add(name)
    unique.push(user)
  }
  return unique
}

/** MRA-only subjects use `uid === name`; Search-backed Users use a real uid. */
export function isSearchBackedUser(user: User): boolean {
  const name = user.metadata.name
  const uid = user.metadata.uid
  return Boolean(uid && name && uid !== name)
}

/** Search-backed rows win over MRA stubs. */
function preferredUser(existing: User, next: User): User {
  const existingIndexed = isSearchBackedUser(existing)
  const nextIndexed = isSearchBackedUser(next)
  if (nextIndexed !== existingIndexed) return nextIndexed ? next : existing
  return next
}

/**
 * Collapse duplicate names after stitching MRA extras with Search rows.
 * Prefer the Search-backed User (real CR) over an MRA-only stub.
 */
export function preferSearchBackedUsers(users: User[]): User[] {
  const preferred = new Map<string, User>()
  for (const user of users) {
    const name = user.metadata.name
    if (!name) continue
    const existing = preferred.get(name)
    preferred.set(name, existing ? preferredUser(existing, user) : user)
  }
  return uniqueUsers(users.map((user) => preferred.get(user.metadata.name ?? '') ?? user))
}

function toUser(user: User): User {
  return {
    ...user,
    apiVersion: user.apiVersion ?? UserApiVersion,
    kind: UserKind,
  }
}

export function searchItemToUser(item: Record<string, unknown>): User {
  const uid = typeof item._uid === 'string' ? item._uid.split('/').pop() : undefined
  return {
    apiVersion: UserApiVersion,
    kind: UserKind,
    metadata: {
      name: typeof item.name === 'string' ? item.name : undefined,
      uid,
      creationTimestamp: typeof item.created === 'string' ? item.created : undefined,
    },
  }
}

/** Search compares with an operator prefix on the value (`<name`, `>3`). */
function beforeFilter(field: UserSortField, user: User, descending: boolean): SearchFilter {
  const operator = descending ? '>' : '<'
  return { property: field, values: [`${operator}${userSortValue(user, field)}`] }
}

export function stitchUserPage(
  searchItems: User[],
  extrasOnPage: { mergedIndex: number; user: User }[],
  start: number,
  perPage: number
): User[] {
  const extrasByIndex = new Map(extrasOnPage.map((extra) => [extra.mergedIndex, extra.user]))
  const page: User[] = []
  let searchIndex = 0
  for (let index = start; index < start + perPage; index++) {
    const extra = extrasByIndex.get(index)
    if (extra) {
      page.push(extra)
      continue
    }
    if (searchIndex >= searchItems.length) break
    page.push(searchItems[searchIndex])
    searchIndex += 1
  }
  return page
}

function searchApolloClient() {
  return process.env.NODE_ENV === 'test' ? undefined : searchClient
}

function asError(error: unknown): Error | undefined {
  if (!error) return undefined
  if (error instanceof Error) return error
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message)
  }
  return new Error('Search request failed')
}

function useMraUserSubjects(): User[] {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const mras = useSharedValue(multiclusterRoleAssignmentState)
  return useMemo(() => usersFromMulticlusterRoleAssignments(mras ?? [], new Set()), [mras])
}

export type UsersSearchResult = {
  users: User[]
  processedItemCount: number
  loading: boolean
  error?: Error
  refetch: () => void
  fetchExport: (requestedExport: IRequestListView) => Promise<IResultListView | undefined>
  emptyResult: boolean
}

export function useUsersSearch(options: {
  request: IRequestListView | undefined
  columns: SortColumn[]
  additionalUsers?: User[]
}): UsersSearchResult {
  const { request, columns, additionalUsers } = options
  const mraUsers = useMraUserSubjects()
  const page = request?.page ?? DEFAULT_PAGE
  const perPage = request?.perPage && request.perPage > 0 ? request.perPage : DEFAULT_ITEMS_PER_PAGE
  const keywords = useMemo(() => keywordsFromSearch(request?.search), [request?.search])
  const { field, descending, orderBy } = useMemo(
    () => userOrderBy(columns, request?.sortBy),
    [columns, request?.sortBy]
  )
  const baseFilters = useMemo(() => hubUserFilters(), [])

  const candidates = useMemo(() => uniqueUsers([...(additionalUsers ?? []), ...mraUsers]), [additionalUsers, mraUsers])
  const lookupNames = useMemo(
    () => candidates.map((user) => user.metadata.name).filter((name): name is string => Boolean(name)),
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
  const lookupUsers = lookupFleet as User[] | undefined

  const indexedNames = useMemo(() => {
    const names = new Set<string>()
    for (const user of lookupUsers ?? []) {
      if (user.metadata?.name) names.add(user.metadata.name)
    }
    return names
  }, [lookupUsers])

  const extrasReady = lookupNames.length === 0 || lookupLoaded
  const extras = useMemo(() => {
    if (!extrasReady) return []
    return candidates.filter(
      (user) => !indexedNames.has(user.metadata.name ?? '') && userMatchesKeywords(user, keywords)
    )
  }, [candidates, extrasReady, indexedNames, keywords])

  const rankInputs = useMemo<SearchInput[]>(
    () =>
      extras.map((user) => ({
        filters: [...baseFilters, beforeFilter(field, user, descending)],
        ...(keywords ? { keywords } : {}),
      })),
    [baseFilters, descending, extras, field, keywords]
  )
  const rankQuery = useSearchResultCountQuery({
    client: searchApolloClient(),
    skip: extras.length === 0,
    variables: { input: rankInputs.length > 0 ? rankInputs : [{ filters: baseFilters }] },
  })
  const rankCounts = useMemo(() => rankQuery.data?.searchResult ?? [], [rankQuery.data])
  const ranksReady = extras.length === 0 || (rankCounts.length === extras.length && !rankQuery.loading)

  const placedExtras = useMemo(() => {
    if (!ranksReady) return []
    return extras.map((user, index) => {
      const searchBefore = rankCounts[index]?.count ?? 0
      const extrasBefore = extras.filter(
        (other) => other !== user && compareUsers(other, user, field, descending) < 0
      ).length
      return { user, mergedIndex: searchBefore + extrasBefore }
    })
  }, [descending, extras, field, rankCounts, ranksReady])

  const start = Math.max(0, (page - 1) * perPage)
  const extrasOnPage = placedExtras.filter((extra) => extra.mergedIndex >= start && extra.mergedIndex < start + perPage)
  const extrasBeforePage = placedExtras.filter((extra) => extra.mergedIndex < start).length
  const searchOffset = Math.max(0, start - extrasBeforePage)
  const searchLimit = Math.max(0, perPage - extrasOnPage.length)
  const canQueryPage = extrasReady && ranksReady && searchLimit > 0

  const pageInput = useMemo<SearchInput | undefined>(() => {
    if (!canQueryPage) return undefined
    return {
      filters: baseFilters,
      ...(keywords ? { keywords } : {}),
      limit: searchLimit,
      offset: searchOffset,
      orderBy,
    }
  }, [baseFilters, canQueryPage, keywords, orderBy, searchLimit, searchOffset])
  // Subscription uses toWatchInput(pageInput): same filters, without limit/offset/orderBy.
  const [pageFleet, pageLoaded, pageError, refetchPage] = useFleetSearch(pageInput, true)
  const pageUsers = pageFleet as User[] | undefined

  const countInput = useMemo<SearchInput>(
    () => ({
      filters: baseFilters,
      ...(keywords ? { keywords } : {}),
    }),
    [baseFilters, keywords]
  )
  const countQuery = useSearchResultCountQuery({
    client: searchApolloClient(),
    variables: { input: [countInput] },
  })
  const searchCount = countQuery.data?.searchResult?.[0]?.count ?? 0
  // Search subscription can add a User to the page before the lookup query sees it;
  // do not double-count that name as an MRA extra.
  const searchNamesOnPage = useMemo(() => {
    const names = new Set<string>()
    for (const user of pageUsers ?? []) {
      if (user.metadata?.name) names.add(user.metadata.name)
    }
    return names
  }, [pageUsers])
  // Search can surface a User on the page before lookup drops it from extras; hold the
  // stitched page and count until that overlap is reconciled (lookup refetch below).
  const hasUnresolvedOverlap = useMemo(
    () => extras.some((user) => searchNamesOnPage.has(user.metadata.name ?? '')),
    [extras, searchNamesOnPage]
  )
  const extrasNotOnSearchPage = useMemo(
    () => extras.filter((user) => !searchNamesOnPage.has(user.metadata.name ?? '')),
    [extras, searchNamesOnPage]
  )
  const processedItemCount = hasUnresolvedOverlap ? 0 : searchCount + extrasNotOnSearchPage.length

  const pageReady = !canQueryPage || pageLoaded
  const ready = extrasReady && ranksReady && pageReady && !countQuery.loading && !hasUnresolvedOverlap
  const users = useMemo(() => {
    if (!ready) return []
    return preferSearchBackedUsers(stitchUserPage((pageUsers ?? []).map(toUser), extrasOnPage, start, perPage))
  }, [extrasOnPage, pageUsers, perPage, ready, start])

  const refetchPageRef = useRef(refetchPage)
  const refetchLookupRef = useRef(refetchLookup)
  const refetchCountRef = useRef(countQuery.refetch)
  const refetchRanksRef = useRef(rankQuery.refetch)
  const lookupNamesLengthRef = useRef(lookupNames.length)
  const extrasLengthRef = useRef(extras.length)
  refetchPageRef.current = refetchPage
  refetchLookupRef.current = refetchLookup
  refetchCountRef.current = countQuery.refetch
  refetchRanksRef.current = rankQuery.refetch
  lookupNamesLengthRef.current = lookupNames.length
  extrasLengthRef.current = extras.length

  const refetch = useCallback(() => {
    // Lookup/rank queries are skipped when empty; refetching them POSTs empty Search variables.
    // useFleetSearch refetch returns void. Apollo refetch returns a Promise, so those stay ignored.
    if (lookupNamesLengthRef.current > 0) {
      refetchLookupRef.current()
    }
    refetchPageRef.current()
    void refetchCountRef.current()
    if (extrasLengthRef.current > 0) {
      void refetchRanksRef.current()
    }
  }, [])

  // When Search live-adds a User that was still listed as an MRA extra, refresh lookup
  // and count so the stub drops out of extras (and pagination stays consistent).
  useEffect(() => {
    if (!hasUnresolvedOverlap) return
    if (lookupNamesLengthRef.current > 0) {
      refetchLookupRef.current()
    }
    void refetchCountRef.current()
  }, [hasUnresolvedOverlap])

  const additionalKey = (additionalUsers ?? []).map((user) => user.metadata.name ?? '').join('\n')
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
        input: [{ filters: hubUserFilters(), limit: -1, orderBy: 'name asc' }],
      },
    })
    const items = ((result.data?.searchResult?.[0]?.items ?? []) as Array<Record<string, unknown> | null>)
      .filter((item): item is Record<string, unknown> => Boolean(item))
      .map(searchItemToUser)
    const indexed = new Set(items.map((user) => user.metadata.name).filter((name): name is string => Boolean(name)))
    const extra = candidates.filter((user) => user.metadata.name && !indexed.has(user.metadata.name))
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
  return {
    users,
    processedItemCount,
    loading: !ready,
    error: asError(pageError) ?? asError(lookupError) ?? asError(countQuery.error) ?? asError(rankQuery.error),
    refetch,
    fetchExport,
    emptyResult: ready && searching && processedItemCount === 0,
  }
}

export function useHasHubUsers(): { hasUsers: boolean; loaded: boolean } {
  const mraUsers = useMraUserSubjects()
  const filters = useMemo(() => hubUserFilters(), [])
  const { data, loading } = useSearchResultCountQuery({
    client: searchApolloClient(),
    variables: { input: [{ filters }] },
  })
  const count = data?.searchResult?.[0]?.count ?? 0
  return { hasUsers: count > 0 || mraUsers.length > 0, loaded: !loading }
}

export function useUserIdentity(name: string | undefined): User | undefined {
  const mraUsers = useMraUserSubjects()
  const input = useMemo<SearchInput | undefined>(() => {
    if (!name) return undefined
    return {
      filters: [...hubUserFilters(), { property: 'name', values: [name] }],
      limit: 1,
    }
  }, [name])
  const [foundFleet, loaded] = useFleetSearch(input, false)
  const found = foundFleet as User[] | undefined
  return useMemo(() => {
    if (!name) return undefined
    const indexed = found?.[0]
    if (indexed?.metadata?.name) return toUser(indexed)
    if (!loaded) return undefined
    return mraUsers.find((user) => user.metadata.name === name)
  }, [found, loaded, mraUsers, name])
}

/**
 * Load hub Users whose names are in `names` (e.g. Group.users members).
 * Uses Search with subscription so membership changes refresh the Group Users tab.
 */
export function useUsersByNames(names: string[] | undefined): { users: User[]; loaded: boolean } {
  const uniqueNames = useMemo(() => {
    const seen = new Set<string>()
    const ordered: string[] = []
    for (const name of names ?? []) {
      if (!name || seen.has(name)) continue
      seen.add(name)
      ordered.push(name)
    }
    return ordered
  }, [names])

  const input = useMemo<SearchInput | undefined>(() => {
    if (uniqueNames.length === 0) return undefined
    return {
      filters: [...hubUserFilters(), { property: 'name', values: uniqueNames }],
      limit: uniqueNames.length,
    }
  }, [uniqueNames])

  const [fleet, loaded] = useFleetSearch(input, true)
  const users = useMemo(() => (fleet as User[] | undefined)?.map(toUser) ?? [], [fleet])
  return { users, loaded: uniqueNames.length === 0 || loaded }
}

/**
 * Resolve a User CR name from a route id (uid or name).
 * Search returns `_uid` on items but rejects it as a filter, so load hub Users once and match
 * by `_uid` or `name`. Callers then load the full CR via getResource(name).
 */
export async function findIndexedUserName(id: string, hubName: string): Promise<string | undefined> {
  const result = await searchClient.query({
    query: SearchResultItemsDocument,
    variables: {
      input: [
        {
          filters: [...hubUserFilters()],
          // Search rejects `_uid` as a filter; scan all hub Users (same as export).
          limit: -1,
        },
      ],
    },
  })
  const items = result.data?.searchResult?.[0]?.items ?? []
  const prefixed = `${hubName}/${id}`
  // Prefer `_uid` matches so a route id that is a uid is not resolved via another User's name.
  for (const item of items) {
    if (typeof item?.name !== 'string') continue
    const itemUid = typeof item._uid === 'string' ? item._uid : ''
    if (itemUid === id || itemUid === prefixed || itemUid.endsWith(`/${id}`)) return item.name
  }
  for (const item of items) {
    if (typeof item?.name === 'string' && item.name === id) return item.name
  }
  return undefined
}
