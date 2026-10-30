/* Copyright Contributors to the Open Cluster Management project */
import { useCallback, useEffect, useRef } from 'react'
import type { SearchFilter, SearchInput } from '@stolostron/multicluster-sdk'
import { searchClient } from '../../Search/search-sdk/search-client'
import { SearchResultItemsDocument } from '../../Search/search-sdk/search-sdk'

export type SearchLiveEvent = {
  operation: string
  uid: string
  timestamp: unknown
  newData?: { name?: unknown } | null
  oldData?: { name?: unknown } | null
}

/** Search → optional indexed name → getResource(name or route id). Search misses fall through safely. */
export async function resolveIndexedThenRead<T>(
  id: string,
  hubName: string,
  findIndexed: (id: string, hubName: string) => Promise<string | undefined>,
  read: (name: string) => Promise<T | undefined>
): Promise<T | undefined> {
  let indexedName: string | undefined
  try {
    indexedName = await findIndexed(id, hubName)
  } catch {
    // Search failures must not block the getResource / MRA fallbacks below.
    indexedName = undefined
  }
  return read(indexedName ?? id)
}

export function keywordSearchInput(baseFilters: SearchFilter[], keywords: string[] | undefined): SearchInput {
  return {
    filters: baseFilters,
    ...(keywords ? { keywords } : {}),
  }
}

export function pagedSearchInput(
  baseFilters: SearchFilter[],
  keywords: string[] | undefined,
  searchLimit: number,
  searchOffset: number,
  orderBy: string
): SearchInput {
  return {
    ...keywordSearchInput(baseFilters, keywords),
    limit: searchLimit,
    offset: searchOffset,
    orderBy,
  }
}

export function rankCountVariables(rankInputs: SearchInput[], baseFilters: SearchFilter[]) {
  return { input: rankInputs.length > 0 ? rankInputs : [{ filters: baseFilters }] }
}

export function areRanksReady(extrasLength: number, rankCountsLength: number, loading: boolean): boolean {
  return extrasLength === 0 || (rankCountsLength === extrasLength && !loading)
}

/** Map MRA extras onto Search page indices using per-extra "how many Search hits sort before me" counts. */
export function placeExtrasByRank<T>(
  extras: T[],
  rankCounts: { count?: number }[],
  compare: (a: T, b: T) => number
): { resource: T; mergedIndex: number }[] {
  return extras.map((resource, index) => {
    const searchBefore = rankCounts[index]?.count ?? 0
    const extrasBefore = extras.filter((other) => other !== resource && compare(other, resource) < 0).length
    return { resource, mergedIndex: searchBefore + extrasBefore }
  })
}

export function searchPageWindow<T extends { mergedIndex: number }>(
  placedExtras: T[],
  page: number,
  perPage: number,
  extrasReady: boolean,
  ranksReady: boolean
) {
  const start = Math.max(0, (page - 1) * perPage)
  const extrasOnPage = placedExtras.filter((extra) => extra.mergedIndex >= start && extra.mergedIndex < start + perPage)
  const extrasBeforePage = placedExtras.filter((extra) => extra.mergedIndex < start).length
  const searchOffset = Math.max(0, start - extrasBeforePage)
  const searchLimit = Math.max(0, perPage - extrasOnPage.length)
  const canQueryPage = extrasReady && ranksReady && searchLimit > 0
  return { start, extrasOnPage, searchOffset, searchLimit, canQueryPage }
}

export function keywordsFromSearch(search?: string): string[] | undefined {
  const keywords = (search ?? '').trim().split(/\s+/).filter(Boolean)
  return keywords.length > 0 ? keywords : undefined
}

export function searchApolloClient() {
  return process.env.NODE_ENV === 'test' ? undefined : searchClient
}

export function asSearchError(error: unknown): Error | undefined {
  if (!error) return undefined
  if (error instanceof Error) return error
  if (typeof error === 'object' && 'message' in error && typeof error.message === 'string') {
    return new Error(error.message)
  }
  return new Error('Search request failed')
}

/** Merge Search page hits with MRA extras that belong on the same page indices. */
export function stitchSearchPage<T>(
  searchItems: T[],
  extrasOnPage: { mergedIndex: number; resource: T }[],
  start: number,
  perPage: number
): T[] {
  const extrasByIndex = new Map(extrasOnPage.map((extra) => [extra.mergedIndex, extra.resource]))
  const page: T[] = []
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

/**
 * Resolve a hub identity CR name from a route id (uid or name).
 * Search returns `_uid` on items but rejects it as a filter, so scan hub resources once.
 */
export async function findIndexedIdentityName(
  id: string,
  hubName: string,
  hubFilters: SearchFilter[]
): Promise<string | undefined> {
  const result = await searchClient.query({
    query: SearchResultItemsDocument,
    variables: {
      input: [
        {
          filters: [...hubFilters],
          // Search rejects `_uid` as a filter; scan all hub resources (same as export).
          limit: -1,
        },
      ],
    },
  })
  const items = result.data?.searchResult?.[0]?.items ?? []
  const prefixed = `${hubName}/${id}`
  // Prefer `_uid` matches so a route id that is a uid is not resolved via another resource's name.
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

/**
 * Shared refetch + live-sync for Search list pages that mix fleet page hits with MRA extras.
 * Handles overlap (Search INSERT of a former extra) and inverse DELETE stale-index refresh.
 */
export function useSearchListControls(options: {
  refetchPage: () => void
  refetchLookup: () => void
  refetchCount: () => unknown
  refetchRanks: () => unknown
  lookupNamesLength: number
  extrasLength: number
  hasUnresolvedOverlap: boolean
  pageQueryKey: string
  searchNamesOnPage: Set<string>
  indexedNames: Set<string>
  lookupNames: string[]
}): () => void {
  const refetchPageRef = useRef(options.refetchPage)
  const refetchLookupRef = useRef(options.refetchLookup)
  const refetchCountRef = useRef(options.refetchCount)
  const refetchRanksRef = useRef(options.refetchRanks)
  const lookupNamesLengthRef = useRef(options.lookupNamesLength)
  const extrasLengthRef = useRef(options.extrasLength)
  refetchPageRef.current = options.refetchPage
  refetchLookupRef.current = options.refetchLookup
  refetchCountRef.current = options.refetchCount
  refetchRanksRef.current = options.refetchRanks
  lookupNamesLengthRef.current = options.lookupNamesLength
  extrasLengthRef.current = options.extrasLength

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

  // When Search live-adds a resource that was still listed as an MRA extra, refresh lookup
  // and count so the stub drops out of extras (and pagination stays consistent).
  useEffect(() => {
    if (!options.hasUnresolvedOverlap) return
    if (lookupNamesLengthRef.current > 0) {
      refetchLookupRef.current()
    }
    void refetchCountRef.current()
  }, [options.hasUnresolvedOverlap])

  // Inverse of overlap: Search DELETE drops a candidate from the subscribed page while
  // lookup still treats them as indexed, so they never re-enter extras until refresh.
  // Ignore pageQueryKey changes (pagination/sort/keywords) — those also change page names.
  const prevSearchNamesRef = useRef<Set<string>>(new Set())
  const prevPageQueryKeyRef = useRef(options.pageQueryKey)
  const indexedNamesRef = useRef(options.indexedNames)
  const candidateNamesRef = useRef(new Set(options.lookupNames))
  indexedNamesRef.current = options.indexedNames
  candidateNamesRef.current = new Set(options.lookupNames)

  useEffect(() => {
    const prevKey = prevPageQueryKeyRef.current
    const prevNames = prevSearchNamesRef.current
    prevPageQueryKeyRef.current = options.pageQueryKey
    prevSearchNamesRef.current = options.searchNamesOnPage

    if (prevKey !== options.pageQueryKey) return

    const removed = [...prevNames].filter((name) => !options.searchNamesOnPage.has(name))
    const deletedCandidateStillIndexed = removed.some(
      (name) => candidateNamesRef.current.has(name) && indexedNamesRef.current.has(name)
    )
    if (!deletedCandidateStillIndexed) return

    if (lookupNamesLengthRef.current > 0) {
      refetchLookupRef.current()
    }
    void refetchCountRef.current()
  }, [options.pageQueryKey, options.searchNamesOnPage])

  return refetch
}

export function eventResourceName(data: { name?: unknown } | null | undefined): string | undefined {
  return typeof data?.name === 'string' ? data.name : undefined
}

export function eventMatchesIdentity(
  uid: string,
  name: string | undefined,
  resourceUid: string | undefined,
  resourceName: string | undefined
): boolean {
  if (resourceName && name === resourceName) return true
  if (!resourceUid || !uid) return false
  return uid === resourceUid || uid.endsWith(`/${resourceUid}`)
}

/** useNavigate returns void in declarative mode and a Promise in data routers. */
export function settleNavigation(navigation: void | Promise<void>) {
  Promise.resolve(navigation).catch(() => {
    // The toast already explains the deletion; a failed redirect should not surface again.
  })
}

/**
 * Shared Search live-sync for identity detail pages: DELETE → toast + navigate/MRA stub,
 * INSERT/UPDATE → refetch the CR without unloading the page.
 */
export function useIdentityLiveEvents<T>(options: {
  latestEvent: SearchLiveEvent | undefined
  watchedName: string | undefined
  routeId: string | undefined
  resourceUid: string | undefined
  hasRoleAssignment: (name: string) => boolean
  readResource: (name: string) => Promise<T | undefined>
  setFetched: (resource: T | undefined) => void
  toastWarning: (title: string) => void
  deletedWithRoleAssignmentTitle: (name: string) => string
  deletedTitle: (name: string) => string
  detailsPath: (name: string) => string
  listPath: string
  navigate: (to: string, opts: { replace: true }) => void | Promise<void>
}) {
  const {
    latestEvent,
    watchedName,
    routeId,
    resourceUid,
    hasRoleAssignment,
    readResource,
    setFetched,
    toastWarning,
    deletedWithRoleAssignmentTitle,
    deletedTitle,
    detailsPath,
    listPath,
    navigate,
  } = options

  const handledEventKey = useRef<string | undefined>(undefined)
  const watchedNameRef = useRef(watchedName)
  useEffect(() => {
    watchedNameRef.current = watchedName
  }, [watchedName])

  useEffect(() => {
    if (!latestEvent || !watchedName) return
    const key = `${latestEvent.operation}:${latestEvent.uid}:${String(latestEvent.timestamp)}`
    if (handledEventKey.current === key) return

    const dataName = eventResourceName(latestEvent.newData) ?? eventResourceName(latestEvent.oldData)
    if (!eventMatchesIdentity(latestEvent.uid, dataName, resourceUid, watchedName)) return
    handledEventKey.current = key

    if (latestEvent.operation === 'DELETE') {
      // Match by identity name: the route id may still be the CR uid while the MRA subject is the name.
      if (hasRoleAssignment(watchedName)) {
        toastWarning(deletedWithRoleAssignmentTitle(watchedName))
        if (routeId !== watchedName) {
          settleNavigation(navigate(detailsPath(watchedName), { replace: true }))
        } else {
          setFetched(undefined)
        }
        return
      }
      toastWarning(deletedTitle(watchedName))
      settleNavigation(navigate(listPath, { replace: true }))
      return
    }

    if (latestEvent.operation !== 'UPDATE' && latestEvent.operation !== 'INSERT') return

    const name = watchedName
    void readResource(name)
      .then((resolved) => {
        if (watchedNameRef.current !== name || !resolved) return
        setFetched(resolved)
      })
      .catch(() => {
        // Keep whatever is on screen (CR or MRA stub) if the background refresh fails.
      })
  }, [
    deletedTitle,
    deletedWithRoleAssignmentTitle,
    detailsPath,
    hasRoleAssignment,
    latestEvent,
    listPath,
    navigate,
    readResource,
    resourceUid,
    routeId,
    setFetched,
    toastWarning,
    watchedName,
  ])
}
