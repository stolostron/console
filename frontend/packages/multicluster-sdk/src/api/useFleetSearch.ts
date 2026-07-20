/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { convertSearchItemToResource } from '../internal/search/convertSearchItemToResource'
import { searchClient } from '../internal/search/search-client'
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { Fleet } from '../types/fleet'
import { SearchInput } from '../types/search'
import { useFleetSearchSubscription } from './useFleetSearchSubscription'

/** A flat search result item as returned by the search API. */
type SearchItem = Record<string, unknown>

// ── Pagination helpers ─────────────────────────────────────────────────────

/**
 * Return a new array sorted according to a search-API `orderBy` string
 * ("fieldName asc" or "fieldName desc").
 * Fields are read directly from the flat SearchItem, so the sort is always
 * reliable regardless of resource kind.
 */
function sortByOrderBy(items: SearchItem[], orderBy: string | null | undefined): SearchItem[] {
  if (!orderBy) return items
  const [field, dir] = orderBy.trim().split(/\s+/)
  const descending = dir?.toLowerCase() === 'desc'
  return [...items].sort((a, b) => {
    const cmp = String(a[field] ?? '').localeCompare(String(b[field] ?? ''))
    return descending ? -cmp : cmp
  })
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
  // Find the first existing item that newItem should sort before.
  const insertIdx = items.findIndex((item) => {
    const cmp = newVal.localeCompare(String(item[field] ?? ''))
    return descending ? cmp > 0 : cmp < 0
  })
  if (insertIdx === -1) return [...items, newItem]
  return [...items.slice(0, insertIdx), newItem, ...items.slice(insertIdx)]
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

export function useFleetSearch(
  input: SearchInput | undefined,
  subscriptionEnabled?: boolean
): [Fleet<K8sResourceCommon>[] | undefined, boolean, Error | undefined, () => void] {
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

  // When the base query returns fresh data (initial load or after refetch),
  // reset local state to match.
  useEffect(() => {
    setLocalData(queryData)
  }, [queryData])

  // When subscriptionEnabled is turned off, reset to the base query result.
  useEffect(() => {
    if (!subscriptionEnabled) {
      setLocalData(queryData)
    }
    // We intentionally only react to the subscriptionEnabled flag here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [subscriptionEnabled])

  // ── Subscription layer ─────────────────────────────────────────────────────

  // Keep a ref to the latest input so the event-patch effect can always read
  // the current orderBy / limit without being listed as a dependency.  Adding
  // `input` to the effect's dep array would cause stale events to be replayed
  // whenever the query input changes (e.g. page/sort update), because the
  // queryData reset effect and this effect would both fire in the same cycle.
  const inputRef = useRef(input)
  useEffect(() => {
    inputRef.current = input
  })

  // Pass undefined as input when subscription is disabled so the inner hook
  // skips the WebSocket connection entirely.
  const [latestEvent, , subscriptionError] = useFleetSearchSubscription(subscriptionEnabled ? input : undefined)

  // Patch local state whenever a new event arrives.
  useEffect(() => {
    if (!latestEvent) return

    setLocalData((prev) => {
      const current: SearchItem[] = Array.isArray(prev) ? prev : []

      switch (latestEvent.operation) {
        case 'INSERT': {
          if (!latestEvent.newData) return prev
          const cluster = latestEvent.uid.split('/')[0]
          const patchedItem: SearchItem = { ...latestEvent.newData, cluster, _uid: latestEvent.uid }
          // Avoid duplicate insertions.
          if (current.some((item) => item._uid === patchedItem._uid)) return prev
          // Insert at the position dictated by orderBy.
          const inserted = insertSorted(current, patchedItem, inputRef.current?.orderBy)
          // Honour the page limit: if the page is now over capacity, drop the last item.
          const limit = inputRef.current?.limit
          if (limit != null && limit > 0 && inserted.length > limit) {
            return inserted.slice(0, limit)
          }
          return inserted
        }
        case 'UPDATE': {
          if (!latestEvent.newData) return prev
          const cluster = latestEvent.uid.split('/')[0]
          const patchedItem: SearchItem = { ...latestEvent.newData, cluster, _uid: latestEvent.uid }
          const updated = current.map((item) => (item._uid === patchedItem._uid ? patchedItem : item))
          // Re-sort after the update in case the sort-key field changed.
          return inputRef.current?.orderBy ? sortByOrderBy(updated, inputRef.current.orderBy) : updated
        }
        case 'DELETE': {
          // Match directly on the search _uid — no K8s resource conversion needed.
          return current.filter((item) => item._uid !== latestEvent.uid)
        }
        default:
          return prev
      }
    })
  }, [latestEvent])

  // ── Stable refetch callback ────────────────────────────────────────────────

  const triggerRefetch = useCallback(() => {
    refetch()
  }, [refetch])

  // ── Return ─────────────────────────────────────────────────────────────────

  // Convert the raw SearchItems to K8s resources once, only when localData changes.
  const data = useMemo<Fleet<K8sResourceCommon>[] | undefined>(() => {
    if (!localData) return undefined
    return localData.map((item) => convertSearchItemToResource<K8sResourceCommon>(item))
  }, [localData])

  const error = queryError ?? subscriptionError

  return [data, !loading, error, triggerRefetch]
}
