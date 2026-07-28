/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { convertSearchItemToResource } from '../internal/search/convertSearchItemToResource'
import { searchClient } from '../internal/search/search-client'
import {
  Event as FleetSearchEvent,
  SearchResultItemsQuery,
  useSearchResultItemsQuery,
} from '../internal/search/search-sdk'
import { Fleet } from '../types/fleet'
import { SearchInput } from '../types/search'
import { useFleetSearchSubscription } from './useFleetSearchSubscription'

/** A flat search result item as returned by the search API. */
type SearchItem = Record<string, unknown>

/** Extract the raw item list from a search query response payload. */
function extractSearchItems(data: SearchResultItemsQuery | undefined | null): SearchItem[] {
  const items = data?.searchResult?.[0]?.items
  return items ? (items.filter(Boolean) as SearchItem[]) : []
}

/**
 * How subscription events should be applied to the local page.
 *
 * - `unbounded`           — no limit/offset; events are patched directly with optional sort.
 * - `paginated-unordered` — limit/offset present but no `orderBy`; item positions are
 *                           non-deterministic so ADD and DELETE always trigger a refetch.
 * - `paginated-ordered`   — limit/offset AND `orderBy` present; positional rules apply.
 */
type SearchMode = 'unbounded' | 'paginated-unordered' | 'paginated-ordered'

// ── Helpers ────────────────────────────────────────────────────────────────

/** Determine the event-patching mode from the current search input. */
function getSearchMode(input: SearchInput | undefined): SearchMode {
  const hasPagination =
    input != null && ((input.limit != null && input.limit > 0) || (input.offset != null && input.offset > 0))
  if (!hasPagination) return 'unbounded'
  return input!.orderBy ? 'paginated-ordered' : 'paginated-unordered'
}

/**
 * Signed comparison that accounts for sort direction.
 * Negative → `a` comes before `b` in the sorted order, positive → after.
 */
function sortCmp(a: string, b: string, descending: boolean): number {
  return descending ? b.localeCompare(a) : a.localeCompare(b)
}

/**
 * Insert `newItem` into `items` at the position dictated by `orderBy`, or
 * append it at the end when `orderBy` is absent.
 */
function insertSorted(items: SearchItem[], newItem: SearchItem, orderBy: string | null | undefined): SearchItem[] {
  if (!orderBy) return [...items, newItem]
  const [field, dir] = orderBy.trim().split(/\s+/)
  const descending = dir?.toLowerCase() === 'desc'
  const newVal = String(newItem[field] ?? '')
  const insertIdx = items.findIndex((item) => sortCmp(newVal, String(item[field] ?? ''), descending) < 0)
  if (insertIdx === -1) return [...items, newItem]
  return [...items.slice(0, insertIdx), newItem, ...items.slice(insertIdx)]
}

/**
 * Decide whether a subscription event requires a full refetch rather than a
 * local patch, given the current page contents and search mode.
 *
 * Unbounded queries — never refetch; all events patch in place.
 *
 * Paginated-unordered — ADD and DELETE always refetch because item positions
 * are non-deterministic without a sort order. UPDATE patches in place.
 *
 * Paginated-ordered:
 *   ADD
 *     • new item sorts ≤ first item on the page → page has shifted → refetch
 *     • new item sorts strictly between first and last → local insert + drop last
 *     • new item sorts equal to last item → server tie-breaking unknown → refetch
 *     • new item sorts > last item → not on this page → ignore (no refetch)
 *   DELETE
 *     • deleted item is on this page → gap opens that needs backfilling → refetch
 *     • deleted item is not on this page but sorts ≤ last item (earlier page) → shift → refetch
 *     • deleted item sorts > last item → on a later page → ignore (no refetch)
 *     • oldData unavailable → position unknown → refetch to be safe
 *   UPDATE — always patches in place; never triggers a refetch.
 */
function wouldTriggerRefetch(
  event: FleetSearchEvent,
  current: SearchItem[],
  mode: SearchMode,
  input: SearchInput | undefined
): boolean {
  if (mode === 'unbounded') return false

  if (mode === 'paginated-unordered') {
    return event.operation === 'INSERT' || event.operation === 'DELETE'
  }

  // ── paginated-ordered ────────────────────────────────────────────────────
  const [field, dir] = (input?.orderBy ?? '').trim().split(/\s+/)
  const descending = dir?.toLowerCase() === 'desc'

  if (event.operation === 'INSERT') {
    if (!event.newData) return false
    if (current.length === 0) return true // empty page — cannot determine position → refetch
    const cluster = event.uid.split('/')[0]
    const newVal = String(({ ...event.newData, cluster, _uid: event.uid } as SearchItem)[field] ?? '')
    const firstVal = String(current[0][field] ?? '')
    const lastVal = String(current[current.length - 1][field] ?? '')
    const cmpFirst = sortCmp(newVal, firstVal, descending)
    const cmpLast = sortCmp(newVal, lastVal, descending)
    if (cmpFirst <= 0) return true // ≤ first → page has shifted → refetch
    if (cmpLast === 0) return true // tied with last → server tie-breaking unknown → refetch
    if (cmpLast > 0) return false // > last → not on this page → ignore
    return false // strictly between → local insert
  }

  if (event.operation === 'DELETE') {
    if (current.length === 0) return false
    if (current.some((item) => item._uid === event.uid)) return true // on this page → gap → refetch
    // Not on this page. Check position using oldData.
    const oldRaw = event.oldData
    if (oldRaw) {
      const cluster = event.uid.split('/')[0]
      const oldVal = String(({ ...oldRaw, cluster, _uid: event.uid } as SearchItem)[field] ?? '')
      const lastVal = String(current[current.length - 1][field] ?? '')
      // ≤ last → was on an earlier page; its removal shifts our window → refetch
      return sortCmp(oldVal, lastVal, descending) <= 0
    }
    return true // no oldData — position unknown → refetch to be safe
  }

  return false // UPDATE never triggers a refetch
}

/**
 * Apply a subscription event directly to the current page and return the updated array.
 * Only called when `wouldTriggerRefetch` returned `false` for this event.
 */
function applyEvent(
  current: SearchItem[],
  event: FleetSearchEvent,
  mode: SearchMode,
  input: SearchInput | undefined
): SearchItem[] {
  switch (event.operation) {
    case 'INSERT': {
      if (!event.newData) return current
      const cluster = event.uid.split('/')[0]
      const patchedItem: SearchItem = { ...event.newData, cluster, _uid: event.uid }
      if (current.some((item) => item._uid === patchedItem._uid)) return current // dedup
      if (mode === 'unbounded') {
        return insertSorted(current, patchedItem, input?.orderBy)
      }
      // paginated-ordered: item sorts strictly between first and last
      const inserted = insertSorted(current, patchedItem, input?.orderBy)
      const limit = input?.limit
      if (limit != null && limit > 0 && inserted.length > limit) return inserted.slice(0, limit)
      return inserted
    }
    case 'UPDATE': {
      if (!event.newData) return current
      const cluster = event.uid.split('/')[0]
      const patchedItem: SearchItem = { ...event.newData, cluster, _uid: event.uid }
      // Update in place. No re-sort: K8s names are immutable, and re-sorting a paginated
      // result would cause items to jump across page boundaries unpredictably.
      return current.map((item) => (item._uid === patchedItem._uid ? patchedItem : item))
    }
    case 'DELETE': {
      return current.filter((item) => item._uid !== event.uid)
    }
    default:
      return current
  }
}

/**
 * A React hook that provides fleet-wide search functionality using the ACM search API,
 * with optional real-time updates via a GraphQL WebSocket subscription.
 *
 * When `subscriptionEnabled` is `false` (the default), the hook issues a one-shot
 * GraphQL query and returns the results. When `subscriptionEnabled` is `true`, the
 * hook additionally opens a WebSocket subscription and patches the locally-held
 * results as INSERT, UPDATE, and DELETE events arrive — keeping the data always
 * up to date without polling.
 *
 * Pagination is supported by setting `limit` and `offset` on the `SearchInput`
 * object. The caller is responsible for constructing those values.
 *
 * @param input - The search input object (filters, keywords, limit, offset, etc.).
 *   Pass `undefined` to skip the query entirely.
 * @param subscriptionEnabled - When `true`, a WebSocket subscription is opened
 *   and the local result set is kept current via incremental event patches.
 *   Defaults to `false`.
 *
 * @returns A tuple of:
 * - `data` — The current search results mapped through
 *   {@link convertSearchItemToResource}, or `undefined` before the first
 *   response arrives.
 * - `loaded` — `true` once the initial query has completed (regardless of
 *   whether the subscription is active).
 * - `error` — Any query or subscription error, or `undefined` on success.
 * - `refetch` — A stable callback that re-executes the base query and resets
 *   the local state to the fresh result.
 *
 * @example
 * ```typescript
 * // Basic query — no real-time updates
 * const [resources, loaded, error, refetch] = useFleetSearch({
 *   filters: [
 *     { property: 'kind', values: ['Pod'] },
 *     { property: 'namespace', values: ['default'] },
 *   ],
 *   limit: 100,
 * })
 *
 * // With real-time subscription — results update automatically
 * const [resources, loaded, error, refetch] = useFleetSearch(
 *   {
 *     filters: [
 *       { property: 'kind', values: ['Pod'] },
 *       { property: 'namespace', values: ['default'] },
 *     ],
 *   },
 *   true,
 * )
 *
 * // With subscription enabled and pagination/ordering — page 2 of 20 results sorted by name
 * const PAGE_SIZE = 20
 * const [page, setPage] = useState(1)
 * const [resources, loaded, error, refetch] = useFleetSearch(
 *   {
 *     filters: [
 *       { property: 'kind', values: ['Pod'] },
 *       { property: 'namespace', values: ['default'] },
 *     ],
 *     limit: PAGE_SIZE,
 *     offset: (page - 1) * PAGE_SIZE,
 *     orderBy: 'name asc',
 *   },
 *   true,
 * )
 * ```
 */
export function useFleetSearch<T extends K8sResourceCommon = K8sResourceCommon>(
  input: SearchInput | undefined,
  subscriptionEnabled?: boolean
): [Fleet<T>[] | undefined, boolean, Error | undefined, () => void] {
  // ── Base query ─────────────────────────────────────────────────────────────

  const {
    data: queryResult,
    loading,
    error: queryError,
    refetch,
  } = useSearchResultItemsQuery({
    client: searchClient,
    skip: input === undefined,
    variables: { input: [input!] },
  })

  // Derive the raw item list from the query response — conversion to K8s
  // resources happens once at return time via useMemo.
  const queryData = useMemo<SearchItem[] | undefined>(() => {
    const items = queryResult?.searchResult?.[0]?.items
    if (!items) return undefined
    return items.filter(Boolean) as SearchItem[]
  }, [queryResult])

  // ── Local state (patched by subscription events) ───────────────────────────

  const [localData, setLocalData] = useState<SearchItem[] | undefined>(queryData)

  // Ref that mirrors localData so event-handler effects can read the current
  // page contents without listing localData as a dependency (which would cause
  // stale-event replay on every data change).
  const localDataRef = useRef<SearchItem[]>([])

  // Tracks whether a refetch is currently in flight.
  const isRefetchingRef = useRef(false)

  // Events that arrive while a refetch is in flight are queued here and
  // applied (or trigger another refetch) once the fresh data lands.
  const eventQueueRef = useRef<FleetSearchEvent[]>([])

  // Keep a ref to the latest input so effects can always read current
  // orderBy / limit without triggering re-runs when input changes.
  const inputRef = useRef(input)
  useEffect(() => {
    inputRef.current = input
  })

  // Reconcile events that queued up while a subscription-triggered refetch was
  // in flight against the freshly fetched data. If a queued event itself
  // demands another refetch, chain into one instead of settling on stale data.
  //
  // Completion is driven by the Promise returned by `refetch()` rather than by
  // observing `queryData` change: Apollo may keep the exact same `data`
  // reference (and skip a re-render) when a refetch's result is deeply equal
  // to what's already cached — e.g. an item is inserted locally (without
  // updating the base query) and then deleted, so the refetch result matches
  // the still-cached pre-insert data byte-for-byte. Relying on reference
  // identity would leave `isRefetchingRef` stuck `true` forever and local data
  // permanently stale.
  const settleRefetch = useCallback(
    (freshData: SearchItem[]) => {
      const queue = eventQueueRef.current
      eventQueueRef.current = []
      const currentInput = inputRef.current
      const mode = getSearchMode(currentInput)

      // If any queued event would require yet another refetch, chain into it
      // and discard the queue — the next fresh result will settle the state.
      const refetchEvent = queue.find((e) => wouldTriggerRefetch(e, freshData, mode, currentInput))
      if (refetchEvent) {
        localDataRef.current = freshData
        setLocalData(freshData)
        refetch()
          .then((result) => settleRefetch(extractSearchItems(result.data)))
          .catch(() => {
            isRefetchingRef.current = false
          })
        return
      }

      // No further refetch needed — walk the queue and apply any events that
      // are not already reflected in the fresh data.
      const finalData = queue.reduce((acc, e) => applyEvent(acc, e, mode, currentInput), freshData)
      localDataRef.current = finalData
      isRefetchingRef.current = false
      setLocalData(finalData)
    },
    [refetch]
  )

  // Kick off a refetch and settle local state once the network response
  // resolves, via the returned Promise (see `settleRefetch` for why we can't
  // rely on `queryData` reference identity here).
  const startRefetch = useCallback(() => {
    isRefetchingRef.current = true
    eventQueueRef.current = []
    refetch()
      .then((result) => settleRefetch(extractSearchItems(result.data)))
      .catch(() => {
        isRefetchingRef.current = false
      })
  }, [refetch, settleRefetch])

  // When fresh query data arrives from the initial load (or Apollo pushes new
  // data outside of our own refetch flow), reset local state. Skipped while a
  // subscription-triggered refetch is in flight — that path is settled by
  // `settleRefetch` above once the Promise resolves.
  useEffect(() => {
    if (isRefetchingRef.current) return
    localDataRef.current = queryData ?? []
    setLocalData(queryData)
  }, [queryData])

  // When subscriptionEnabled is turned off, reset to the base query result
  // and clear any in-flight refetch state.
  useEffect(() => {
    if (!subscriptionEnabled) {
      isRefetchingRef.current = false
      eventQueueRef.current = []
      localDataRef.current = queryData ?? []
      setLocalData(queryData)
    }
    // We intentionally only react to the subscriptionEnabled flag here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionEnabled])

  // ── Subscription layer ─────────────────────────────────────────────────────

  // Pass undefined as input when subscription is disabled so the inner hook
  // skips the WebSocket connection entirely.
  const [latestEvent, , subscriptionError] = useFleetSearchSubscription(subscriptionEnabled ? input : undefined)

  // Route each incoming subscription event based on the current search mode.
  useEffect(() => {
    if (!latestEvent) return

    // While a refetch is in flight, queue events for later processing.
    if (isRefetchingRef.current) {
      eventQueueRef.current = [...eventQueueRef.current, latestEvent]
      return
    }

    const currentInput = inputRef.current
    const mode = getSearchMode(currentInput)
    const current = localDataRef.current

    if (wouldTriggerRefetch(latestEvent, current, mode, currentInput)) {
      startRefetch()
      return
    }

    const next = applyEvent(current, latestEvent, mode, currentInput)
    localDataRef.current = next
    setLocalData(next)
  }, [latestEvent, startRefetch])

  // ── Stable refetch callback ────────────────────────────────────────────────

  const triggerRefetch = useCallback(() => {
    if (isRefetchingRef.current) return
    startRefetch()
  }, [startRefetch])

  // ── Return ─────────────────────────────────────────────────────────────────

  // Convert the raw SearchItems to K8s resources once, only when localData changes.
  const data = useMemo<Fleet<T>[] | undefined>(() => {
    if (!localData) return undefined
    return localData.map((item) => convertSearchItemToResource<T>(item)) as Fleet<T>[]
  }, [localData])

  const error = queryError ?? subscriptionError

  return [data, !loading, error, triggerRefetch]
}
