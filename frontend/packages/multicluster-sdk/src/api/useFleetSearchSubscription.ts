/* Copyright Contributors to the Open Cluster Management project */

import { searchClient } from '../internal/search/search-client'
import { Event as FleetSearchEvent, useSearchSubscription } from '../internal/search/search-sdk'
import { SearchInput } from '../types/search'

/**
 * A React hook that opens a GraphQL WebSocket subscription to the ACM search API
 * and streams real-time change events for resources matching the given input.
 *
 * Events are pushed by the server over a WebSocket connection managed by the
 * Apollo client's `graphql-ws` split link. Apollo re-renders the hook with the
 * latest event on each push. Only the **most recent** event is returned — callers
 * that need to react to each event should use a `useEffect` watching `latestEvent`.
 *
 * @param input - The search input filters that define which resources to watch.
 *   Pass `undefined` to skip opening the WebSocket connection entirely.
 *
 * @returns A tuple of:
 * - `latestEvent` — the most recent {@link FleetSearchEvent} received from the
 *   WebSocket stream, or `undefined` before the first event arrives or when
 *   `input` is `undefined`.
 * - `loading` — `true` until the WebSocket connection is established and the
 *   subscription is active.
 * - `error` — any Apollo subscription error, or `undefined` on success.
 *
 * @example
 * ```typescript
 * // Watch for changes to all Pods in the default namespace
 * const [latestEvent, loading, error] = useFleetSearchSubscription({
 *   filters: [
 *     { property: 'kind', values: ['Pod'] },
 *     { property: 'namespace', values: ['default'] },
 *   ],
 * })
 *
 * useEffect(() => {
 *   if (!latestEvent) return
 *   console.log(`${latestEvent.operation} on uid ${latestEvent.uid}`)
 * }, [latestEvent])
 *
 * // Skip the subscription entirely
 * const [latestEvent, loading, error] = useFleetSearchSubscription(undefined)
 * ```
 */
export function useFleetSearchSubscription(
  input: SearchInput | undefined
): [FleetSearchEvent | undefined, boolean, Error | undefined] {
  const { data, loading, error } = useSearchSubscription({
    client: searchClient,
    variables: { input },
    skip: input === undefined,
  })

  return [data?.searchSubscription ?? undefined, loading, error]
}
