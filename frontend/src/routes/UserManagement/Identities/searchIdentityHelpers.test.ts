/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react'
import { searchClient } from '../../Search/search-sdk/search-client'
import {
  areRanksReady,
  asSearchError,
  eventMatchesIdentity,
  eventResourceName,
  findIndexedIdentityName,
  keywordSearchInput,
  keywordsFromSearch,
  pagedSearchInput,
  placeExtrasByRank,
  rankCountVariables,
  resolveIndexedThenRead,
  searchApolloClient,
  searchPageWindow,
  settleNavigation,
  stitchSearchPage,
  useSearchListControls,
} from './searchIdentityHelpers'

jest.mock('../../Search/search-sdk/search-client', () => ({
  searchClient: { query: jest.fn() },
}))

jest.mock('../../Search/search-sdk/search-sdk', () => ({
  SearchResultItemsDocument: 'SearchResultItemsDocument',
}))

const mockSearchQuery = searchClient.query as jest.Mock

describe('keywordsFromSearch', () => {
  it('returns undefined for empty or whitespace search', () => {
    expect(keywordsFromSearch(undefined)).toBeUndefined()
    expect(keywordsFromSearch('')).toBeUndefined()
    expect(keywordsFromSearch('   ')).toBeUndefined()
  })

  it('splits on whitespace and drops empty tokens', () => {
    expect(keywordsFromSearch('  alice   bob ')).toEqual(['alice', 'bob'])
  })
})

describe('searchApolloClient', () => {
  it('returns undefined in test so Apollo hooks do not hit a live client', () => {
    expect(searchApolloClient()).toBeUndefined()
  })

  it('returns the Search Apollo client outside test', () => {
    const previous = process.env.NODE_ENV
    process.env.NODE_ENV = 'development'
    try {
      expect(searchApolloClient()).toBe(searchClient)
    } finally {
      process.env.NODE_ENV = previous
    }
  })
})

describe('asSearchError', () => {
  it('returns undefined for falsy values', () => {
    expect(asSearchError(undefined)).toBeUndefined()
    expect(asSearchError(null)).toBeUndefined()
    expect(asSearchError('')).toBeUndefined()
  })

  it('passes Error instances through', () => {
    const error = new Error('boom')
    expect(asSearchError(error)).toBe(error)
  })

  it('wraps objects with a string message', () => {
    expect(asSearchError({ message: 'from apollo' })?.message).toBe('from apollo')
  })

  it('falls back to a generic message', () => {
    expect(asSearchError(42)?.message).toBe('Search request failed')
  })
})

describe('stitchSearchPage', () => {
  it('interleaves extras by mergedIndex into the Search page window', () => {
    const page = stitchSearchPage(
      ['s0', 's1', 's2'],
      [
        { mergedIndex: 1, resource: 'e1' },
        { mergedIndex: 3, resource: 'e3' },
      ],
      0,
      4
    )
    expect(page).toEqual(['s0', 'e1', 's1', 'e3'])
  })

  it('stops when Search items are exhausted', () => {
    expect(stitchSearchPage(['only'], [], 0, 3)).toEqual(['only'])
  })
})

describe('search list helpers', () => {
  const baseFilters = [{ property: 'kind', values: ['User'] }]

  it('builds keyword and paged Search inputs', () => {
    expect(keywordSearchInput(baseFilters, undefined)).toEqual({ filters: baseFilters })
    expect(keywordSearchInput(baseFilters, ['alice'])).toEqual({ filters: baseFilters, keywords: ['alice'] })
    expect(pagedSearchInput(baseFilters, ['bob'], 10, 20, 'name asc')).toEqual({
      filters: baseFilters,
      keywords: ['bob'],
      limit: 10,
      offset: 20,
      orderBy: 'name asc',
    })
  })

  it('builds rank variables and readiness', () => {
    expect(rankCountVariables([], baseFilters)).toEqual({ input: [{ filters: baseFilters }] })
    expect(rankCountVariables([{ filters: baseFilters }], baseFilters)).toEqual({
      input: [{ filters: baseFilters }],
    })
    expect(areRanksReady(0, 0, true)).toBe(true)
    expect(areRanksReady(2, 2, false)).toBe(true)
    expect(areRanksReady(2, 1, false)).toBe(false)
  })

  it('places extras by Search rank and peers', () => {
    const placed = placeExtrasByRank(['b', 'a'], [{ count: 1 }, { count: 0 }], (left, right) =>
      left.localeCompare(right)
    )
    expect(placed).toEqual([
      { resource: 'b', mergedIndex: 2 },
      { resource: 'a', mergedIndex: 0 },
    ])
  })

  it('computes the Search page window around placed extras', () => {
    const window = searchPageWindow([{ mergedIndex: 0 }, { mergedIndex: 5 }], 1, 5, true, true)
    expect(window).toEqual({
      start: 0,
      extrasOnPage: [{ mergedIndex: 0 }],
      searchOffset: 0,
      searchLimit: 4,
      canQueryPage: true,
    })
  })
})

describe('resolveIndexedThenRead', () => {
  it('reads by indexed name when Search resolves one', async () => {
    const read = jest.fn().mockResolvedValue({ name: 'alice' })
    await expect(resolveIndexedThenRead('uid-1', 'local-cluster', async () => 'alice', read)).resolves.toEqual({
      name: 'alice',
    })
    expect(read).toHaveBeenCalledWith('alice')
  })

  it('falls back to the route id when Search misses or throws', async () => {
    const read = jest.fn().mockResolvedValue({ name: 'bob' })
    await expect(resolveIndexedThenRead('bob', 'local-cluster', async () => undefined, read)).resolves.toEqual({
      name: 'bob',
    })
    await expect(
      resolveIndexedThenRead(
        'bob',
        'local-cluster',
        async () => {
          throw new Error('search down')
        },
        read
      )
    ).resolves.toEqual({ name: 'bob' })
    expect(read).toHaveBeenCalledWith('bob')
  })
})

describe('findIndexedIdentityName', () => {
  const hubFilters = [{ property: 'kind', values: ['User'] }]

  beforeEach(() => {
    mockSearchQuery.mockReset()
  })

  it('prefers a uid match over a colliding name', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [
          {
            items: [
              { name: 'c2064147-9207-4dba-bfeb-3f18fdae53de', _uid: 'local-cluster/other-uid' },
              { name: 'alice', _uid: 'local-cluster/c2064147-9207-4dba-bfeb-3f18fdae53de' },
            ],
          },
        ],
      },
    })

    await expect(
      findIndexedIdentityName('c2064147-9207-4dba-bfeb-3f18fdae53de', 'local-cluster', hubFilters)
    ).resolves.toBe('alice')
  })

  it('matches bare and prefixed uids', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [{ items: [{ name: 'bob', _uid: 'uid-bob' }] }],
      },
    })
    await expect(findIndexedIdentityName('uid-bob', 'local-cluster', hubFilters)).resolves.toBe('bob')

    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [{ items: [{ name: 'cara', _uid: 'local-cluster/uid-cara' }] }],
      },
    })
    await expect(findIndexedIdentityName('uid-cara', 'local-cluster', hubFilters)).resolves.toBe('cara')

    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [{ items: [{ name: 'dan', _uid: 'remote/uid-dan' }] }],
      },
    })
    await expect(findIndexedIdentityName('uid-dan', 'local-cluster', hubFilters)).resolves.toBe('dan')
  })

  it('skips items without a string name and non-string uids', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [
          {
            items: [{ name: 1, _uid: 'uid-skip' }, { name: 'erin', _uid: 42 }, { name: 'erin' }],
          },
        ],
      },
    })
    await expect(findIndexedIdentityName('erin', 'local-cluster', hubFilters)).resolves.toBe('erin')
  })

  it('falls back to an exact name match', async () => {
    mockSearchQuery.mockResolvedValue({
      data: {
        searchResult: [{ items: [{ name: 'alice', _uid: 'local-cluster/other-uid' }] }],
      },
    })
    await expect(findIndexedIdentityName('alice', 'local-cluster', hubFilters)).resolves.toBe('alice')
  })

  it('returns undefined when nothing matches', async () => {
    mockSearchQuery.mockResolvedValue({ data: { searchResult: [{ items: [] }] } })
    await expect(findIndexedIdentityName('missing', 'local-cluster', hubFilters)).resolves.toBeUndefined()
  })

  it('treats missing Search payload as an empty item list', async () => {
    mockSearchQuery.mockResolvedValue({ data: undefined })
    await expect(findIndexedIdentityName('missing', 'local-cluster', hubFilters)).resolves.toBeUndefined()
  })
})

describe('useSearchListControls', () => {
  function setup(overrides: Partial<Parameters<typeof useSearchListControls>[0]> = {}) {
    const refetchPage = jest.fn()
    const refetchLookup = jest.fn()
    const refetchCount = jest.fn()
    const refetchRanks = jest.fn()
    const options = {
      refetchPage,
      refetchLookup,
      refetchCount,
      refetchRanks,
      lookupNamesLength: 1,
      extrasLength: 1,
      hasUnresolvedOverlap: false,
      pageQueryKey: 'key-a',
      searchNamesOnPage: new Set<string>(['alice']),
      indexedNames: new Set<string>(['alice']),
      lookupNames: ['alice'],
      ...overrides,
    }
    const hook = renderHook((props) => useSearchListControls(props), { initialProps: options })
    return { ...hook, refetchPage, refetchLookup, refetchCount, refetchRanks, options }
  }

  it('refetches lookup, page, count, and ranks when those queries are active', () => {
    const { result, refetchPage, refetchLookup, refetchCount, refetchRanks } = setup()

    act(() => {
      result.current()
    })

    expect(refetchLookup).toHaveBeenCalled()
    expect(refetchPage).toHaveBeenCalled()
    expect(refetchCount).toHaveBeenCalled()
    expect(refetchRanks).toHaveBeenCalled()
  })

  it('skips lookup and ranks when those queries are empty', () => {
    const { result, refetchPage, refetchLookup, refetchCount, refetchRanks } = setup({
      lookupNamesLength: 0,
      extrasLength: 0,
    })

    act(() => {
      result.current()
    })

    expect(refetchLookup).not.toHaveBeenCalled()
    expect(refetchRanks).not.toHaveBeenCalled()
    expect(refetchPage).toHaveBeenCalled()
    expect(refetchCount).toHaveBeenCalled()
  })

  it('refreshes lookup and count when an unresolved overlap appears', () => {
    const { rerender, refetchLookup, refetchCount } = setup({ hasUnresolvedOverlap: false })

    rerender({
      refetchPage: jest.fn(),
      refetchLookup,
      refetchCount,
      refetchRanks: jest.fn(),
      lookupNamesLength: 1,
      extrasLength: 1,
      hasUnresolvedOverlap: true,
      pageQueryKey: 'key-a',
      searchNamesOnPage: new Set(['alice']),
      indexedNames: new Set(['alice']),
      lookupNames: ['alice'],
    })

    expect(refetchLookup).toHaveBeenCalled()
    expect(refetchCount).toHaveBeenCalled()
  })

  it('refreshes lookup when Search deletes an indexed candidate from the page', () => {
    const refetchLookup = jest.fn()
    const refetchCount = jest.fn()
    const base = {
      refetchPage: jest.fn(),
      refetchLookup,
      refetchCount,
      refetchRanks: jest.fn(),
      lookupNamesLength: 1,
      extrasLength: 1,
      hasUnresolvedOverlap: false,
      pageQueryKey: 'key-a',
      searchNamesOnPage: new Set(['alice']),
      indexedNames: new Set(['alice']),
      lookupNames: ['alice'],
    }
    const { rerender } = renderHook((props) => useSearchListControls(props), { initialProps: base })

    rerender({
      ...base,
      searchNamesOnPage: new Set<string>(),
    })

    expect(refetchLookup).toHaveBeenCalled()
    expect(refetchCount).toHaveBeenCalled()
  })

  it('ignores name drops caused by a page query key change', () => {
    const refetchLookup = jest.fn()
    const refetchCount = jest.fn()
    const base = {
      refetchPage: jest.fn(),
      refetchLookup,
      refetchCount,
      refetchRanks: jest.fn(),
      lookupNamesLength: 1,
      extrasLength: 1,
      hasUnresolvedOverlap: false,
      pageQueryKey: 'key-a',
      searchNamesOnPage: new Set(['alice']),
      indexedNames: new Set(['alice']),
      lookupNames: ['alice'],
    }
    const { rerender } = renderHook((props) => useSearchListControls(props), { initialProps: base })

    rerender({
      ...base,
      pageQueryKey: 'key-b',
      searchNamesOnPage: new Set<string>(),
    })

    expect(refetchLookup).not.toHaveBeenCalled()
    expect(refetchCount).not.toHaveBeenCalled()
  })
})

describe('eventResourceName', () => {
  it('returns the name string when present', () => {
    expect(eventResourceName({ name: 'alice' })).toBe('alice')
  })

  it('returns undefined for missing or non-string names', () => {
    expect(eventResourceName(undefined)).toBeUndefined()
    expect(eventResourceName(null)).toBeUndefined()
    expect(eventResourceName({ name: 1 })).toBeUndefined()
  })
})

describe('eventMatchesIdentity', () => {
  it('matches by resource name', () => {
    expect(eventMatchesIdentity('uid', 'alice', 'other', 'alice')).toBe(true)
  })

  it('matches exact and suffix uid forms', () => {
    expect(eventMatchesIdentity('uid-1', undefined, 'uid-1', undefined)).toBe(true)
    expect(eventMatchesIdentity('local-cluster/uid-1', undefined, 'uid-1', undefined)).toBe(true)
  })

  it('rejects when neither name nor uid aligns', () => {
    expect(eventMatchesIdentity('uid-a', 'bob', 'uid-b', 'alice')).toBe(false)
    expect(eventMatchesIdentity('', undefined, 'uid', undefined)).toBe(false)
  })
})

describe('settleNavigation', () => {
  it('swallows rejected navigation promises', async () => {
    expect(() => settleNavigation(Promise.reject(new Error('nav failed')))).not.toThrow()
    // Flush the rejected microtask so Jest does not treat it as unhandled.
    await Promise.resolve()
    await Promise.resolve()
  })

  it('accepts void navigations', () => {
    expect(() => settleNavigation(undefined)).not.toThrow()
  })
})
