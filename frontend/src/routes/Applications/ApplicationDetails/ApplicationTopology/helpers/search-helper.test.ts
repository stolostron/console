// Copyright Contributors to the Open Cluster Management project

import type { SearchQuery } from '../types'
import {
  convertStringToQuery,
  formatNumber,
  isSearchAvailable,
  isYAMLEditAvailable,
  searchError,
  searchFailure,
  searchSuccess,
  shouldTrySearch,
} from './search-helper'

describe('convertStringToQuery', () => {
  const string1: string = 'kind:Subscription name:test'
  const string2: string = 'kind:Channel name:test'
  const string3: string = 'kind:Placement name:test'

  const result1: SearchQuery = {
    filters: [
      {
        property: 'kind',
        values: ['Subscription'],
      },
      {
        property: 'name',
        values: ['test'],
      },
    ],
    keywords: [],
    relatedKinds: ['Placement', 'Deployable', 'Application', 'Subscription', 'Channel'],
  }

  const result2: SearchQuery = {
    filters: [
      { property: 'kind', values: ['Channel'] },
      { property: 'name', values: ['test'] },
    ],
    keywords: [],
    relatedKinds: ['Subscription'],
  }
  const result3: SearchQuery = {
    filters: [
      { property: 'kind', values: ['Placement'] },
      { property: 'name', values: ['test'] },
    ],
    keywords: [],
    relatedKinds: ['Subscription'],
  }
  it('convert string to query', () => {
    expect(convertStringToQuery(string1)).toEqual(result1)
    expect(convertStringToQuery(string2)).toEqual(result2)
    expect(convertStringToQuery(string3)).toEqual(result3)
  })
})

describe('formatNumber', () => {
  it('format some numbers', () => {
    expect(formatNumber(1)).toEqual(1)
    expect(formatNumber(1000)).toEqual('1k')
  })
})

describe('various search helper functions', () => {
  it('call search helper functions', () => {
    searchFailure()
    searchError()
    searchSuccess()
    expect(shouldTrySearch()).toEqual(true)
    expect(isSearchAvailable()).toEqual(true)
    expect(isYAMLEditAvailable()).toEqual(true)
  })
})
