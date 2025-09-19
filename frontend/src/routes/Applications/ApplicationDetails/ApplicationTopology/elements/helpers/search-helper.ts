/* Copyright Contributors to the Open Cluster Management project */

import type { SearchFilter, SearchQuery } from '../../types'

const MAX_SEARCH_ATTEMPTS = 3
let searchFailureCount = 0
let searchErrorCount = 0

/**
 * Parse a search bar string into keywords, filters, and inferred related kinds.
 * - Keywords are whitespace-separated tokens without a ':' character.
 * - Filters are tokens of the form "property:val1,val2".
 * - Operator-like values (e.g., '=', '>=') as the first value are filtered out.
 */
export const convertStringToQuery = (searchText: string): SearchQuery => {
  let relatedKinds: string[] = []

  if (searchText.indexOf('kind:subscription') >= 0) {
    relatedKinds = ['placementrule', 'deployable', 'application', 'subscription', 'channel']
  } else if (searchText.indexOf('kind:channel') >= 0) {
    relatedKinds = ['subscription']
  } else if (searchText.indexOf('kind:placementrule') >= 0) {
    relatedKinds = ['subscription']
  }

  const searchTokens = searchText.split(' ')
  const keywords = searchTokens.filter((token) => token !== '' && token.indexOf(':') < 0)
  const filters: SearchFilter[] = searchTokens
    .filter((token) => token.indexOf(':') >= 0)
    .map((f) => {
      const [property, values] = f.split(':')
      return { property, values: values.split(',') }
    })
    .filter((f) => ['', '=', '<', '>', '<=', '>=', '!=', '!'].findIndex((op) => op === f.values[0]) === -1)

  return { keywords, filters, relatedKinds }
}

/**
 * Format large numbers for display (e.g., 1000 => '1k').
 * Returns the original number if under 1000.
 */
export const formatNumber = (count: number): number | string => {
  if (count > 999) {
    // show one decimal place
    const num = (count - (count % 100)) / 1000
    return `${num}k`
  }
  return count
}

/** Track a search failure, resetting error streak. */
export const searchFailure = (): void => {
  searchFailureCount++
  searchErrorCount = 0
}

/** Track a search transport/error failure. */
export const searchError = (): void => {
  searchErrorCount++
}

/** Reset search failure/error counters on success. */
export const searchSuccess = (): void => {
  searchFailureCount = 0
  searchErrorCount = 0
}

/** Whether another search attempt should be made based on recent failures. */
export const shouldTrySearch = (): boolean => searchFailureCount + searchErrorCount < MAX_SEARCH_ATTEMPTS

/** Search UI is considered available if there have been no recent failures or errors. */
export const isSearchAvailable = (): boolean => searchFailureCount === 0 && searchErrorCount === 0

/** YAML edit is gated only by transport/errors, not logical failures. */
export const isYAMLEditAvailable = (): boolean => searchErrorCount === 0
