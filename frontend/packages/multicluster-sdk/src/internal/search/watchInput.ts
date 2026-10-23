/* Copyright Contributors to the Open Cluster Management project */

import { SearchInput } from '../../types/search'
import { Event as FleetSearchEvent } from './search-sdk'

/**
 * Build a Search watch input from a query input.
 * Search subscriptions do not support `limit` / `offset` / `orderBy` (query-only).
 */
export function toWatchInput(input: SearchInput): SearchInput {
  const { limit: _limit, offset: _offset, orderBy: _orderBy, relatedKinds: _related, ...watch } = input
  return watch
}

/**
 * When the query filters by `cluster`, ignore subscription events whose uid
 * cluster prefix is outside the query filter.
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
