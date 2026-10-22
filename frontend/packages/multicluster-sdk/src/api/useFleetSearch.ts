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

/** Primitive sort keys only. Objects have no stable ordering text. */
function sortableFieldText(value: unknown): string {
  switch (typeof value) {
    case 'string':
    case 'number':
    case 'boolean':
    case 'bigint':
      return String(value)
    default:
      return ''
  }
}

/**
 * Insert `newItem` into `items` at the position dictated by `orderBy`, or
 * append it at the end when `orderBy` is absent.
 */
function insertSorted(items: SearchItem[], newItem: SearchItem, orderBy: string | null | undefined): SearchItem[] {
  if (!orderBy) return [...items, newItem]
  const [field, dir] = orderBy.trim().split(/\s+/)
  const descending = dir?.toLowerCase() === 'desc'
  const newVal = sortableFieldText(newItem[field])
  const insertIdx = items.findIndex((item) => sortCmp(newVal, sortableFieldText(item[field]), descending) < 0)
  if (insertIdx === -1) return [...items, newItem]
  return [...items.slice(0, insertIdx), newItem, ...items.slice(insertIdx)]
}

/**
 * When the query filters by `cluster` but `watchInput` omits it (e.g. Groups use
 * `_hubClusterResource` because Search drops Group events for `cluster`), ignore
 * subscription events whose uid cluster prefix is outside the query filter.
 */
export function eventMatchesQueryClusterFilter(event: FleetSearchEvent, input: SearchInput | undefined): boolean {
  const clusters = input?.filters?.find((filter) => filter?.property === 'cluster')?.values
  if (!clusters?.length) return true
  const uid = event.uid
  if (!uid) return true
  // Search Event.uid is the Kubernetes resource UID (no cluster prefix). Accept those;
  // only slash-delimited `<cluster>/<uid>` values are cluster-scoped.
  if (!uid.includes('/')) return true
  const prefix = uid.split('/')[0]
  return clusters.includes(prefix)
}

function clusterFromEventData(data: unknown): string | undefined {
  if (!data || typeof data !== 'object') return undefined
  const cluster = (data as Record<string, unknown>).cluster
  return typeof cluster === 'string' && cluster ? cluster : undefined
}

/**
 * Resolve a trustworthy cluster for a Search event.
 * Prefer payload `cluster`, then a `<cluster>/<uid>` prefix, then a sole query `cluster` filter.
 */
function resolveEventCluster(event: FleetSearchEvent, input: SearchInput | undefined): string | undefined {
  const fromPayload = clusterFromEventData(event.newData) ?? clusterFromEventData(event.oldData)
  if (fromPayload) return fromPayload
  const uid = event.uid
  if (uid?.includes('/')) return uid.split('/')[0]
  const clusters = input?.filters
    ?.find((filter) => filter?.property === 'cluster')
    ?.values?.filter((value): value is string => typeof value === 'string' && value.length > 0)
  if (clusters?.length === 1) return clusters[0]
  return undefined
}

function eventSearchUid(event: FleetSearchEvent, cluster: string | undefined): string | undefined {
  const uid = event.uid
  if (!uid) return undefined
  if (uid.includes('/')) return uid
  return cluster ? `${cluster}/${uid}` : undefined
}

function itemMatchesEventUid(itemUid: unknown, eventUid: string | undefined, searchUid: string | undefined): boolean {
  if (typeof itemUid !== 'string' || !eventUid) return false
  if (itemUid === eventUid || (searchUid != null && itemUid === searchUid)) return true
  return itemUid.endsWith(`/${eventUid}`)
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
  const cluster = resolveEventCluster(event, input)
  const searchUid = eventSearchUid(event, cluster)
  // Bare UID INSERT/UPDATE without a resolvable cluster would corrupt local `cluster`/`_uid`.
  if ((event.operation === 'INSERT' || event.operation === 'UPDATE') && !cluster) {
    return true
  }

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
    const newItem = { ...event.newData, cluster, _uid: searchUid } as SearchItem
    const newVal = sortableFieldText(newItem[field])
    const firstVal = sortableFieldText(current[0][field])
    const lastVal = sortableFieldText(current[current.length - 1][field])
    const cmpFirst = sortCmp(newVal, firstVal, descending)
    const cmpLast = sortCmp(newVal, lastVal, descending)
    if (cmpFirst <= 0) return true // ≤ first → page has shifted → refetch
    if (cmpLast === 0) return true // tied with last → server tie-breaking unknown → refetch
    if (cmpLast > 0) return false // > last → not on this page → ignore
    return false // strictly between → local insert
  }

  if (event.operation === 'DELETE') {
    if (current.length === 0) return false
    if (current.some((item) => itemMatchesEventUid(item._uid, event.uid, searchUid))) return true
    // Not on this page. Check position using oldData.
    const oldRaw = event.oldData
    if (oldRaw) {
      const oldItem = { ...oldRaw, cluster, _uid: searchUid } as SearchItem
      const oldVal = sortableFieldText(oldItem[field])
      const lastVal = sortableFieldText(current[current.length - 1][field])
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
  const cluster = resolveEventCluster(event, input)
  const searchUid = eventSearchUid(event, cluster)

  switch (event.operation) {
    case 'INSERT': {
      if (!event.newData || !cluster || !searchUid) return current
      const patchedItem: SearchItem = { ...event.newData, cluster, _uid: searchUid }
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
      if (!event.newData || !cluster || !searchUid) return current
      const patchedItem: SearchItem = { ...event.newData, cluster, _uid: searchUid }
      // Update in place. No re-sort: K8s names are immutable, and re-sorting a paginated
      // result would cause items to jump across page boundaries unpredictably.
      return current.map((item) => (itemMatchesEventUid(item._uid, event.uid, searchUid) ? patchedItem : item))
    }
    case 'DELETE': {
      return current.filter((item) => !itemMatchesEventUid(item._uid, event.uid, searchUid))
    }
    default:
      return current
  }
}

/** Optional third argument to {@link useFleetSearch}. */
export type UseFleetSearchOptions = {
  /**
   * Input for the GraphQL `watch` subscription. When omitted, the subscription
   * uses {@link toWatchInput} on `input` (filters/keywords only — no limit/offset/orderBy).
   */
  watchInput?: SearchInput
}

/**
 * Build a Search watch input from a query input.
 * Search subscriptions do not support `limit` / `offset` / `orderBy` (query-only).
 */
export function toWatchInput(input: SearchInput): SearchInput {
  const { limit: _limit, offset: _offset, orderBy: _orderBy, relatedKinds: _related, ...watch } = input
  return watch
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
 * @param options - Optional {@link UseFleetSearchOptions}, including `watchInput`
 *   when the subscription must use different filters than the query.
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
 *
 * // Optional watchInput: query stays paginated; watch uses a different filter set.
 * // Needed when Search drops events for some query filters (e.g. `cluster` on Groups).
 * const [resources, loaded, error, refetch] = useFleetSearch(pageInput, true, {
 *   watchInput: { filters: [{ property: 'kind', values: ['Group'] }] },
 * })
 * ```
 */
export function useFleetSearch<T extends K8sResourceCommon = K8sResourceCommon>(
  input: SearchInput | undefined,
  subscriptionEnabled?: boolean,
  options?: UseFleetSearchOptions
): [Fleet<T>[] | undefined, boolean, Error | undefined, () => void] {
  // ── Base query ─────────────────────────────────────────────────────────────

  const {
    data: queryResult,
    loading,
    error: queryError,
    refetch,
  } = useSearchResultItemsQuery({
    client: searchClient,
    // Treat null like undefined. Never send `variables.input: [null]` — JSON turns
    // `undefined` array slots into null and Search returns "internal system error".
    skip: input == null,
    variables: input ? { input: [input] } : undefined,
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
      const currentInput = inputRef.current
      const mode = getSearchMode(currentInput)
      // Drop events outside the query's cluster filter (watch may be broader).
      const queue = eventQueueRef.current.filter((e) => eventMatchesQueryClusterFilter(e, currentInput))
      eventQueueRef.current = []

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

  // Prefer an explicit watchInput (callers can omit filters Search mishandles on
  // watch, e.g. `cluster` for Group). Otherwise strip query-only pagination fields.
  const subscriptionInput = useMemo<SearchInput | undefined>(() => {
    if (!subscriptionEnabled || input == null) return undefined
    return options?.watchInput ?? toWatchInput(input)
  }, [subscriptionEnabled, input, options?.watchInput])

  const [latestEvent, , subscriptionError] = useFleetSearchSubscription(subscriptionInput)

  // Route each incoming subscription event based on the current search mode.
  useEffect(() => {
    if (!latestEvent) return

    const currentInput = inputRef.current
    // watchInput may omit `cluster` (Search drops Group events for that filter);
    // keep query results scoped by ignoring events from other clusters.
    if (!eventMatchesQueryClusterFilter(latestEvent, currentInput)) return

    // While a refetch is in flight, queue events for later processing.
    if (isRefetchingRef.current) {
      eventQueueRef.current = [...eventQueueRef.current, latestEvent]
      return
    }

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
    // Skipped queries have no variables; Apollo refetch() would POST `variables:{}`
    // and Search returns an empty/error result. No-op until there is an input.
    if (input == null || isRefetchingRef.current) return
    startRefetch()
  }, [input, startRefetch])

  // ── Return ─────────────────────────────────────────────────────────────────

  // Convert the raw SearchItems to K8s resources once, only when localData changes.
  const data = useMemo<Fleet<T>[] | undefined>(() => {
    if (!localData) return undefined
    return localData.map((item) => convertSearchItemToResource<T>(item)) as Fleet<T>[]
  }, [localData])

  const error = queryError ?? subscriptionError

  return [data, !loading, error, triggerRefetch]
}
