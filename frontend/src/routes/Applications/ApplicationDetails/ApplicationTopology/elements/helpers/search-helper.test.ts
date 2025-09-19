/* Copyright Contributors to the Open Cluster Management project */

import {
  convertStringToQuery,
  formatNumber,
  searchFailure,
  searchError,
  searchSuccess,
  shouldTrySearch,
  isSearchAvailable,
  isYAMLEditAvailable,
} from './search-helper'
import type { SearchQuery } from './types'

/**
 * Test suite for search-helper utility functions.
 * These tests verify the functionality of search query parsing,
 * number formatting, and search availability tracking.
 */
describe('convertStringToQuery', () => {
  // Test input strings representing different search scenarios
  const string1 = 'kind:subscription name:test'
  const string2 = 'kind:channel name:test'
  const string3 = 'kind:placementrule name:test'

  // Expected result for subscription search - includes comprehensive related kinds
  const result1: SearchQuery = {
    filters: [
      {
        property: 'kind',
        values: ['subscription'],
      },
      {
        property: 'name',
        values: ['test'],
      },
    ],
    keywords: [],
    relatedKinds: ['placementrule', 'deployable', 'application', 'subscription', 'channel'],
  }

  // Expected result for channel search - includes subscription as related kind
  const result2: SearchQuery = {
    filters: [
      { property: 'kind', values: ['channel'] },
      { property: 'name', values: ['test'] },
    ],
    keywords: [],
    relatedKinds: ['subscription'],
  }

  // Expected result for placementrule search - includes subscription as related kind
  const result3: SearchQuery = {
    filters: [
      { property: 'kind', values: ['placementrule'] },
      { property: 'name', values: ['test'] },
    ],
    keywords: [],
    relatedKinds: ['subscription'],
  }

  /**
   * Test that search strings are correctly parsed into structured queries.
   * Verifies that different resource kinds generate appropriate related kinds
   * and that filters are properly extracted from the search string.
   */
  it('convert string to query', () => {
    expect(convertStringToQuery(string1)).toEqual(result1)
    expect(convertStringToQuery(string2)).toEqual(result2)
    expect(convertStringToQuery(string3)).toEqual(result3)
  })
})

/**
 * Test suite for number formatting functionality.
 * Verifies that large numbers are properly abbreviated for display.
 */
describe('formatNumber', () => {
  /**
   * Test that numbers are formatted appropriately:
   * - Small numbers (< 1000) are returned as-is
   * - Large numbers (>= 1000) are abbreviated with 'k' suffix
   */
  it('format some numbers', () => {
    expect(formatNumber(1)).toEqual(1)
    expect(formatNumber(1000)).toEqual('1k')
  })
})

/**
 * Test suite for search helper state management functions.
 * These functions track search failures and errors to determine
 * when search functionality should be available to users.
 */
describe('various search helper functions', () => {
  /**
   * Test that search helper functions execute without errors
   * and return expected boolean values for availability checks.
   *
   * This test verifies:
   * - State tracking functions (searchFailure, searchError, searchSuccess) execute
   * - Availability check functions return appropriate boolean values
   * - Search attempt logic returns expected results
   */
  it('call search helper functions', () => {
    // Test state tracking functions - these should execute without throwing
    searchFailure()
    searchError()
    searchSuccess()

    // Test availability check functions - these should return boolean values
    expect(shouldTrySearch()).toEqual(true)
    expect(isSearchAvailable()).toEqual(true)
    expect(isYAMLEditAvailable()).toEqual(true)
  })
})
