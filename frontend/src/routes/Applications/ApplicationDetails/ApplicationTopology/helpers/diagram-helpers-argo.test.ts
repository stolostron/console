// Copyright (c) 2020 Red Hat, Inc.
// Copyright Contributors to the Open Cluster Management project

import { getURLSearchData } from './diagram-helpers-argo'
import type { URLSearchData } from './types'

/**
 * Test suite for getURLSearchData function that parses URL search parameters
 * for Argo application topology helpers.
 */
describe('getURLSearchData with data', () => {
  // Store original window.location to restore after tests
  const { location } = window

  /**
   * Set up mock window.location with URL search parameters before running tests.
   * This simulates a browser URL with encoded query parameters for apiVersion and cluster.
   */
  beforeAll(() => {
    // Remove the original location object
    delete (window as any).location

    // Mock window.location with test search parameters
    // URL contains encoded values: argoproj.io%2Fv1alpha1 = argoproj.io/v1alpha1
    ;(window as any).location = {
      search: '?apiVersion=argoproj.io%2Fv1alpha1&cluster=ui-managed',
    } as Location
  })

  /**
   * Restore original window.location after tests complete
   */
  afterAll(() => {
    window.location = location
  })

  // Expected result when URL contains both apiVersion and cluster parameters
  const expectedResult: URLSearchData = {
    apiVersion: 'argoproj.io/v1alpha1',
    cluster: 'ui-managed',
  }

  /**
   * Test that getURLSearchData correctly parses and decodes URL search parameters
   */
  it('should return the search data', () => {
    expect(getURLSearchData()).toEqual(expectedResult)
  })
})

/**
 * Test suite for getURLSearchData function when no URL search parameters are present.
 * This tests the default behavior when the URL has no query string.
 */
describe('getURLSearchData without data', () => {
  // Expected result when no search parameters are present
  const expectedResult: URLSearchData = {}

  /**
   * Test that getURLSearchData returns an empty object when no search parameters exist.
   * This relies on the default window.location which should not have the test search string.
   */
  it('should return an empty object', () => {
    expect(getURLSearchData()).toEqual(expectedResult)
  })
})
