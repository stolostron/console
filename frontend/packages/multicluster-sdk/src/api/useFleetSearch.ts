/* Copyright Contributors to the Open Cluster Management project */

import { useCallback, useEffect, useMemo, useState } from 'react'
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
import { searchClient } from '../internal/search/search-client'
import { convertSearchItemToResource } from '../internal/search/convertSearchItemToResource'
import { SearchInput, SearchResult } from '../types/search'
import { useFleetSearchSubscription } from './useFleetSearchSubscription'

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
 * @template T - The type of Kubernetes resource(s) to search for, extending
 *   `K8sResourceCommon` or `K8sResourceCommon[]`.
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
 * const [pods, loaded, error, refetch] = useFleetSearch<K8sResourceCommon[]>({
 *   filters: [
 *     { property: 'kind', values: ['Pod'] },
 *     { property: 'namespace', values: ['default'] },
 *   ],
 *   limit: 100,
 * })
 *
 * // With real-time subscription — results update automatically
 * const [pods, loaded, error, refetch] = useFleetSearch<K8sResourceCommon[]>(
 *   {
 *     filters: [
 *       { property: 'kind', values: ['Pod'] },
 *       { property: 'namespace', values: ['default'] },
 *     ],
 *   },
 *   true,
 * )
 * ```
 */
export function useFleetSearch<T extends K8sResourceCommon | K8sResourceCommon[]>(
  input: SearchInput | undefined,
  subscriptionEnabled?: boolean
): [SearchResult<T> | undefined, boolean, Error | undefined, () => void] {
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

  // Derive the converted resource list from the raw query response.
  const queryData = useMemo<SearchResult<T> | undefined>(() => {
    const items = queryResult?.searchResult?.[0]?.items
    if (!items) return undefined
    return items.map(convertSearchItemToResource<T>) as unknown as SearchResult<T>
  }, [queryResult])

  // ── Local state (patched by subscription events) ───────────────────────────

  const [localData, setLocalData] = useState<SearchResult<T> | undefined>(queryData)

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

  // Pass undefined as input when subscription is disabled so the inner hook
  // skips the WebSocket connection entirely.
  const [latestEvent, , subscriptionError] = useFleetSearchSubscription(subscriptionEnabled ? input : undefined)

  // Patch local state whenever a new event arrives.
  useEffect(() => {
    if (!latestEvent) return

    setLocalData((prev) => {
      const current = (Array.isArray(prev) ? prev : []) as K8sResourceCommon[]

      switch (latestEvent.operation) {
        case 'INSERT': {
          if (!latestEvent.newData) return prev
          const newResource = convertSearchItemToResource<T>(latestEvent.newData)
          const newUid = (newResource as K8sResourceCommon).metadata?.uid
          // Avoid duplicate insertions.
          if (newUid && current.some((r) => r.metadata?.uid === newUid)) return prev
          return [...current, newResource] as unknown as SearchResult<T>
        }
        case 'UPDATE': {
          if (!latestEvent.newData) return prev
          const updatedResource = convertSearchItemToResource<T>(latestEvent.newData)
          return current.map((r) =>
            r.metadata?.uid === latestEvent.uid ? updatedResource : r
          ) as unknown as SearchResult<T>
        }
        case 'DELETE': {
          return current.filter((r) => r.metadata?.uid !== latestEvent.uid) as unknown as SearchResult<T>
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

  const error = queryError ?? subscriptionError

  return [localData, !loading, error, triggerRefetch]
}
