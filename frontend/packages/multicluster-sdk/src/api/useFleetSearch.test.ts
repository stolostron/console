/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react-hooks'
import {
  SearchResultItemsQuery,
  SearchResultItemsQueryVariables,
  useSearchResultItemsQuery,
} from '../internal/search/search-sdk'
import { SearchInput } from '../types/search'
import { useFleetSearch } from './useFleetSearch'
import { useFleetSearchSubscription } from './useFleetSearchSubscription'

// Mock the base query hook
jest.mock('../internal/search/search-sdk', () => ({
  useSearchResultItemsQuery: jest.fn(),
}))

// Mock the search client
jest.mock('../internal/search/search-client', () => ({
  searchClient: 'mock-search-client',
}))

// Mock the subscription hook
jest.mock('./useFleetSearchSubscription', () => ({
  useFleetSearchSubscription: jest.fn(),
}))

const mockUseSearchResultItemsQuery = jest.mocked(useSearchResultItemsQuery)
const mockUseFleetSearchSubscription = jest.mocked(useFleetSearchSubscription)

const mockInput: SearchInput = {
  filters: [{ property: 'kind', values: ['Pod'] }],
}

const mockSearchItem = {
  cluster: 'test-cluster',
  apigroup: '',
  apiversion: 'v1',
  kind: 'Pod',
  name: 'test-pod',
  namespace: 'default',
  created: '2024-01-01T00:00:00Z',
  _uid: 'test-cluster/uid-1',
}

const mockSearchResult = {
  searchResult: [{ items: [mockSearchItem] }],
}

// ── Helpers ──────────────────────────────────────────────────────────────────

// Apollo's `refetch()` resolves with an `ApolloQueryResult`, but our hook only
// ever reads `.data` off of it — so the mock only needs to satisfy that shape,
// rather than fabricating `loading` / `networkStatus` in every test.
type RefetchResult = { data: SearchResultItemsQuery }
type RefetchMock = ReturnType<typeof jest.fn<Promise<RefetchResult>, [Partial<SearchResultItemsQueryVariables>?]>>

// Tests that only assert whether/how many times refetch was called (and don't
// care about post-refetch state) can use a mock that returns a promise which
// never resolves.
function pendingRefetch(): RefetchMock {
  return jest
    .fn<Promise<RefetchResult>, [Partial<SearchResultItemsQueryVariables>?]>()
    .mockReturnValue(new Promise(() => {}))
}

function makeQueryMock(items: object[], refetch: RefetchMock = pendingRefetch()) {
  return {
    data: { searchResult: [{ items }] },
    loading: false,
    error: undefined,
    refetch,
  } as any
}

function makeEvent(
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  uid: string,
  newData: object | null,
  oldData: object | null = null
) {
  return { uid, operation, newData, oldData, timestamp: new Date() } as any
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useFleetSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])
  })

  // ── Base query behaviour ────────────────────────────────────────────────────

  describe('base query', () => {
    it('should return [undefined, false, undefined, refetch] while loading', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearch(mockInput))

      const [data, loaded, error, refetch] = result.current
      expect(data).toBeUndefined()
      expect(loaded).toBe(false)
      expect(error).toBeUndefined()
      expect(typeof refetch).toBe('function')
    })

    it('should return converted resources when query succeeds', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearch(mockInput))

      const [data, loaded, error] = result.current
      expect(loaded).toBe(true)
      expect(error).toBeUndefined()
      expect(data).toHaveLength(1)
      expect(data![0].metadata?.name).toBe('test-pod')
    })

    it('should return undefined data and report error when query fails', () => {
      const mockError = new Error('query failed')
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: mockError,
        refetch: jest.fn(),
      } as any)

      const { result } = renderHook(() => useFleetSearch(mockInput))

      const [data, loaded, error] = result.current
      expect(data).toBeUndefined()
      expect(loaded).toBe(true)
      expect(error).toBe(mockError)
    })

    it('should skip the query when input is undefined', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearch(undefined))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith(expect.objectContaining({ skip: true }))
    })

    it('should pass the correct variables to the query', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearch(mockInput))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          client: 'mock-search-client',
          skip: false,
          variables: { input: [mockInput] },
        })
      )
    })

    it('should provide a stable refetch callback', () => {
      const mockRefetch = pendingRefetch()
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: mockRefetch,
      } as any)

      const { result } = renderHook(() => useFleetSearch(mockInput))

      const [, , , refetch] = result.current
      refetch()
      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })
  })

  // ── Subscription enabled / disabled ────────────────────────────────────────

  describe('subscription disabled (default)', () => {
    it('should pass undefined to useFleetSearchSubscription when subscriptionEnabled is false', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearch(mockInput, false))

      expect(mockUseFleetSearchSubscription).toHaveBeenCalledWith(undefined)
    })

    it('should pass undefined to useFleetSearchSubscription when subscriptionEnabled is omitted', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearch(mockInput))

      expect(mockUseFleetSearchSubscription).toHaveBeenCalledWith(undefined)
    })
  })

  describe('subscription enabled', () => {
    it('should pass input to useFleetSearchSubscription when subscriptionEnabled is true', () => {
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearch(mockInput, true))

      expect(mockUseFleetSearchSubscription).toHaveBeenCalledWith(mockInput)
    })

    it('should surface a subscription error via the error return value', () => {
      const subError = new Error('ws error')
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: mockSearchResult,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([undefined, false, subError])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [, , error] = result.current
      expect(error).toBe(subError)
    })

    it('should prefer query error over subscription error', () => {
      const queryError = new Error('query error')
      const subError = new Error('ws error')
      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: queryError,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([undefined, false, subError])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [, , error] = result.current
      expect(error).toBe(queryError)
    })
  })

  // ── Mode: unbounded (no limit / offset) ────────────────────────────────────

  describe('unbounded mode — INSERT', () => {
    it('should append a new resource on INSERT', () => {
      const existingItem = { ...mockSearchItem, name: 'existing-pod', _uid: 'test-cluster/uid-existing' }
      const newItem = { ...mockSearchItem, name: 'new-pod', _uid: 'test-cluster/uid-new' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([existingItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-new', newItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      expect(result.current[0]).toHaveLength(2)
      expect(result.current[0]!.map((r) => r.metadata?.name)).toContain('new-pod')
    })

    it('should not duplicate on INSERT if uid already exists', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([item]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-1', item),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      expect(result.current[0]).toHaveLength(1)
    })

    it('should insert at the correct sorted position when orderBy is set', () => {
      const appleItem = { ...mockSearchItem, name: 'apple', _uid: 'test-cluster/uid-apple' }
      const mangoItem = { ...mockSearchItem, name: 'mango', _uid: 'test-cluster/uid-mango' }
      const figItem = { ...mockSearchItem, name: 'fig', _uid: 'test-cluster/uid-fig' }
      // No limit — unbounded mode even with orderBy
      const inputWithOrderBy: SearchInput = { ...mockInput, orderBy: 'name asc' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-fig', figItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(inputWithOrderBy, true))

      expect(result.current[0]).toHaveLength(3)
      expect(result.current[0]!.map((r) => r.metadata?.name)).toEqual(['apple', 'fig', 'mango'])
    })
  })

  describe('unbounded mode — UPDATE', () => {
    it('should update fields in place on UPDATE without re-sorting', () => {
      // Use `status` as the sort field — it can legitimately change
      const pendingItem = { ...mockSearchItem, name: 'pod-a', status: 'Pending', _uid: 'test-cluster/uid-a' }
      const runningItem = { ...mockSearchItem, name: 'pod-b', status: 'Running', _uid: 'test-cluster/uid-b' }
      // pod-a transitions to Terminated and gains a label; with re-sort it would move to index 1,
      // but the spec says UPDATE patches in place without re-sorting.
      const updatedItem = { ...pendingItem, status: 'Terminated', label: 'abc=123' }
      const inputWithOrderBy: SearchInput = { ...mockInput, orderBy: 'status asc' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([pendingItem, runningItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('UPDATE', 'test-cluster/uid-a', updatedItem, pendingItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(inputWithOrderBy, true))

      expect(result.current[0]).toHaveLength(2)
      // pod-a stays at position 0 — no re-sort
      expect(result.current[0]![0].metadata?.name).toBe('pod-a')
      expect(result.current[0]![1].metadata?.name).toBe('pod-b')
      // New label applied
      expect(result.current[0]![0].metadata?.labels).toEqual({ abc: '123' })
    })

    it('should merge updated fields on UPDATE — e.g. adding a label', () => {
      const originalItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const updatedItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1', label: 'abc=123' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([originalItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('UPDATE', 'test-cluster/uid-1', updatedItem, originalItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      expect(result.current[0]).toHaveLength(1)
      expect(result.current[0]![0].metadata?.name).toBe('test-pod')
      expect(result.current[0]![0].metadata?.labels).toEqual({ abc: '123' })
    })
  })

  describe('unbounded mode — DELETE', () => {
    it('should remove the matching resource on DELETE', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([item]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-1', null, item),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      expect(result.current[0]).toHaveLength(0)
    })

    it('should be a no-op on DELETE when uid does not match any resource', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([item]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-nonexistent', null, null),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      expect(result.current[0]).toHaveLength(1)
    })
  })

  // ── Mode: paginated-unordered (limit/offset, no orderBy) ───────────────────

  describe('paginated-unordered mode', () => {
    const paginatedInput: SearchInput = { ...mockInput, limit: 10 }

    it('should trigger a refetch on INSERT', () => {
      const mockRefetch = pendingRefetch()
      const existingItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const newItem = { ...mockSearchItem, name: 'new-pod', _uid: 'test-cluster/uid-new' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([existingItem], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-new', newItem),
        false,
        undefined,
      ])

      renderHook(() => useFleetSearch(paginatedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('should trigger a refetch on DELETE', () => {
      const mockRefetch = pendingRefetch()
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([item], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-1', null, item),
        false,
        undefined,
      ])

      renderHook(() => useFleetSearch(paginatedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('should patch in place on UPDATE without refetching', () => {
      const mockRefetch = pendingRefetch()
      const originalItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const updatedItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1', label: 'abc=123' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([originalItem], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('UPDATE', 'test-cluster/uid-1', updatedItem, originalItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(paginatedInput, true))

      expect(mockRefetch).not.toHaveBeenCalled()
      expect(result.current[0]).toHaveLength(1)
      expect(result.current[0]![0].metadata?.labels).toEqual({ abc: '123' })
    })
  })

  // ── Mode: paginated-ordered (limit + orderBy) ───────────────────────────────

  describe('paginated-ordered mode — INSERT', () => {
    const orderedInput: SearchInput = { ...mockInput, limit: 2, orderBy: 'name asc' }
    const appleItem = { ...mockSearchItem, name: 'apple', _uid: 'test-cluster/uid-apple' }
    const mangoItem = { ...mockSearchItem, name: 'mango', _uid: 'test-cluster/uid-mango' }

    it('should trigger a refetch when new item sorts at or before the first item', () => {
      const mockRefetch = pendingRefetch()
      // 'aaa' < 'apple' → before first → refetch
      const newItem = { ...mockSearchItem, name: 'aaa', _uid: 'test-cluster/uid-aaa' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-aaa', newItem),
        false,
        undefined,
      ])

      renderHook(() => useFleetSearch(orderedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('should insert locally and drop the last item when new item sorts strictly between first and last', () => {
      // 'apple' < 'fig' < 'mango' → between → local insert + drop last
      const figItem = { ...mockSearchItem, name: 'fig', _uid: 'test-cluster/uid-fig' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-fig', figItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(orderedInput, true))

      expect(result.current[0]).toHaveLength(2)
      expect(result.current[0]!.map((r) => r.metadata?.name)).toEqual(['apple', 'fig'])
    })

    it('should trigger a refetch when new item ties with the last item (server tie-breaking unknown)', () => {
      const mockRefetch = pendingRefetch()
      // 'mango' === last item 'mango' → tied → refetch
      const tiedItem = { ...mockSearchItem, name: 'mango', _uid: 'test-cluster/uid-mango2' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-mango2', tiedItem),
        false,
        undefined,
      ])

      renderHook(() => useFleetSearch(orderedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('should ignore an INSERT that sorts after the last item on the page', () => {
      // 'zebra' > 'mango' → after last → not on this page → ignore
      const zebraItem = { ...mockSearchItem, name: 'zebra', _uid: 'test-cluster/uid-zebra' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-zebra', zebraItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(orderedInput, true))

      // Page is unchanged
      expect(result.current[0]).toHaveLength(2)
      expect(result.current[0]!.map((r) => r.metadata?.name)).toEqual(['apple', 'mango'])
    })
  })

  describe('paginated-ordered mode — DELETE', () => {
    const orderedInput: SearchInput = { ...mockInput, limit: 2, orderBy: 'name asc' }
    const appleItem = { ...mockSearchItem, name: 'apple', _uid: 'test-cluster/uid-apple' }
    const mangoItem = { ...mockSearchItem, name: 'mango', _uid: 'test-cluster/uid-mango' }

    it('should trigger a refetch when the deleted item is on the current page', () => {
      const mockRefetch = pendingRefetch()

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-apple', null, appleItem),
        false,
        undefined,
      ])

      renderHook(() => useFleetSearch(orderedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('should trigger a refetch when deleted item was on an earlier page (sorts ≤ last item)', () => {
      const mockRefetch = pendingRefetch()
      // 'cherry' is not on this page but sorts before 'mango' — its removal shifts our page
      const cherryItem = { ...mockSearchItem, name: 'cherry', _uid: 'test-cluster/uid-cherry' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-cherry', null, cherryItem),
        false,
        undefined,
      ])

      renderHook(() => useFleetSearch(orderedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)
    })

    it('should ignore a DELETE for an item that sorts after the last item on the page', () => {
      // 'zebra' > 'mango' → on a later page → deletion has no effect on this page
      const zebraItem = { ...mockSearchItem, name: 'zebra', _uid: 'test-cluster/uid-zebra' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([appleItem, mangoItem]))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-zebra', null, zebraItem),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(orderedInput, true))

      expect(result.current[0]).toHaveLength(2)
      expect(result.current[0]!.map((r) => r.metadata?.name)).toEqual(['apple', 'mango'])
    })
  })

  describe('paginated-ordered mode — UPDATE', () => {
    it('should patch in place on UPDATE without refetching', () => {
      const mockRefetch = pendingRefetch()
      const orderedInput: SearchInput = { ...mockInput, limit: 2, orderBy: 'name asc' }
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const updatedItem = { ...item, label: 'abc=123' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([item], mockRefetch))
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('UPDATE', 'test-cluster/uid-1', updatedItem, item),
        false,
        undefined,
      ])

      const { result } = renderHook(() => useFleetSearch(orderedInput, true))

      expect(mockRefetch).not.toHaveBeenCalled()
      expect(result.current[0]).toHaveLength(1)
      expect(result.current[0]![0].metadata?.labels).toEqual({ abc: '123' })
    })
  })

  // ── Refetch queue ───────────────────────────────────────────────────────────

  describe('refetch queue', () => {
    it('should queue events during a refetch and apply non-refetch events after refetch completes', async () => {
      const existingItem = { ...mockSearchItem, name: 'pod-a', _uid: 'test-cluster/uid-a' }
      // Paginated-unordered: INSERT triggers refetch
      const paginatedInput: SearchInput = { ...mockInput, limit: 10 }

      // Refetch completion is driven by the Promise `refetch()` returns — capture
      // the resolver so the test can control exactly when it "completes", after
      // the queued UPDATE event has already arrived.
      let resolveRefetch: (value: RefetchResult) => void = () => {}
      const mockRefetch: RefetchMock = jest.fn(
        () =>
          new Promise<RefetchResult>((resolve) => {
            resolveRefetch = resolve
          })
      )

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([existingItem], mockRefetch))
      // INSERT → triggers refetch
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-b', { ...mockSearchItem, name: 'pod-b', _uid: 'test-cluster/uid-b' }),
        false,
        undefined,
      ])

      const { result, rerender } = renderHook(() => useFleetSearch(paginatedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)

      // UPDATE arrives while refetch is in flight → should be queued
      const updateEvent = makeEvent('UPDATE', 'test-cluster/uid-a', { ...existingItem, label: 'abc=123' }, existingItem)
      mockUseFleetSearchSubscription.mockReturnValue([updateEvent, false, undefined])
      act(() => {
        rerender()
      })

      // Refetch resolves with fresh data (both pods) — note this is delivered
      // via the Promise, not by changing the mocked hook's return value, since
      // Apollo may keep the same `data` reference when a result is deeply equal
      // to what's cached, in which case a `queryData` re-render would never fire.
      const freshNewItem = { ...mockSearchItem, name: 'pod-b', _uid: 'test-cluster/uid-b' }
      await act(async () => {
        resolveRefetch({ data: { searchResult: [{ items: [existingItem, freshNewItem] }] } })
      })

      // Fresh data (2 items) + queued UPDATE applied → pod-a now has the label
      expect(result.current[0]).toHaveLength(2)
      const podA = result.current[0]!.find((r) => r.metadata?.name === 'pod-a')
      expect(podA?.metadata?.labels).toEqual({ abc: '123' })
    })

    it('should trigger a second refetch when a queued event requires one', async () => {
      const existingItem = { ...mockSearchItem, _uid: 'test-cluster/uid-a' }
      const paginatedInput: SearchInput = { ...mockInput, limit: 10 }

      let resolveFirstRefetch: (value: RefetchResult) => void = () => {}
      const mockRefetch: RefetchMock = jest
        .fn<Promise<RefetchResult>, [Partial<SearchResultItemsQueryVariables>?]>()
        .mockImplementationOnce(
          () =>
            new Promise<RefetchResult>((resolve) => {
              resolveFirstRefetch = resolve
            })
        )
        // The second refetch (triggered by the queued event) is only checked for
        // call count, so it can stay pending indefinitely.
        .mockReturnValue(new Promise(() => {}))

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([existingItem], mockRefetch))
      // First INSERT → triggers first refetch
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-b', { ...mockSearchItem, _uid: 'test-cluster/uid-b' }),
        false,
        undefined,
      ])

      const { rerender } = renderHook(() => useFleetSearch(paginatedInput, true))

      expect(mockRefetch).toHaveBeenCalledTimes(1)

      // Second INSERT arrives while first refetch is in flight → queued
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-c', { ...mockSearchItem, _uid: 'test-cluster/uid-c' }),
        false,
        undefined,
      ])
      act(() => {
        rerender()
      })

      // First refetch resolves without the queued item — the queued INSERT
      // (paginated-unordered) still requires a refetch, so a second one is chained.
      const freshItem = { ...mockSearchItem, name: 'pod-b', _uid: 'test-cluster/uid-b' }
      await act(async () => {
        resolveFirstRefetch({ data: { searchResult: [{ items: [existingItem, freshItem] }] } })
      })

      expect(mockRefetch).toHaveBeenCalledTimes(2)
    })

    it('reflects a DELETE after refetch even when the resolved data is identical to what was already cached', async () => {
      // Regression test: page starts with 4 items (below limit=5). An item is
      // inserted into the last slot purely as a local patch (the base query
      // never observes it, since no refetch is needed for an in-page insert).
      // Deleting that item then triggers a refetch whose result is byte-for-byte
      // identical to what was cached *before* the insert. Because completion is
      // driven by the Promise from `refetch()` rather than by `queryData`
      // reference identity, the deletion must still be reflected even if Apollo
      // would otherwise skip a re-render for "unchanged" data.
      const a = { ...mockSearchItem, name: 'a', _uid: 'test-cluster/uid-a' }
      const b = { ...mockSearchItem, name: 'b', _uid: 'test-cluster/uid-b' }
      const c = { ...mockSearchItem, name: 'c', _uid: 'test-cluster/uid-c' }
      const d = { ...mockSearchItem, name: 'd', _uid: 'test-cluster/uid-d' }
      const orderedInput: SearchInput = { ...mockInput, limit: 5, orderBy: 'name asc' }

      let resolveRefetch: (value: RefetchResult) => void = () => {}
      const mockRefetch: RefetchMock = jest.fn(
        () =>
          new Promise<RefetchResult>((resolve) => {
            resolveRefetch = resolve
          })
      )

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([a, b, c, d], mockRefetch))
      // INSERT 'e' — sorts after 'd' (the last item); page has room so it's
      // applied as a local patch without ever refetching the base query.
      const eItem = { ...mockSearchItem, name: 'e', _uid: 'test-cluster/uid-e' }
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-e', eItem),
        false,
        undefined,
      ])

      const { result, rerender } = renderHook(() => useFleetSearch(orderedInput, true))

      expect(result.current[0]!.map((r) => r.metadata?.name)).toEqual(['a', 'b', 'c', 'd', 'e'])
      expect(mockRefetch).not.toHaveBeenCalled()

      // DELETE 'e' — it's on the page, so a refetch is triggered.
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('DELETE', 'test-cluster/uid-e', null, eItem),
        false,
        undefined,
      ])
      act(() => {
        rerender()
      })

      expect(mockRefetch).toHaveBeenCalledTimes(1)

      // Refetch resolves with the original 4 items — identical to what the base
      // query already had cached before the insert.
      await act(async () => {
        resolveRefetch({ data: { searchResult: [{ items: [a, b, c, d] }] } })
      })

      expect(result.current[0]!.map((r) => r.metadata?.name)).toEqual(['a', 'b', 'c', 'd'])
    })
  })

  // ── subscriptionEnabled toggle ──────────────────────────────────────────────

  describe('subscriptionEnabled toggle', () => {
    it('should reset to query data when subscriptionEnabled changes from true to false', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }

      mockUseSearchResultItemsQuery.mockReturnValue(makeQueryMock([item]))
      // INSERT event makes local state diverge
      mockUseFleetSearchSubscription.mockReturnValue([
        makeEvent('INSERT', 'test-cluster/uid-new', {
          ...mockSearchItem,
          name: 'extra-pod',
          _uid: 'test-cluster/uid-new',
        }),
        false,
        undefined,
      ])

      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => useFleetSearch(mockInput, enabled),
        { initialProps: { enabled: true } }
      )

      expect(result.current[0]).toHaveLength(2)

      mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])
      act(() => {
        rerender({ enabled: false })
      })

      expect(result.current[0]).toHaveLength(1)
    })
  })

  // ── Pagination passthrough ──────────────────────────────────────────────────

  describe('pagination', () => {
    it('should pass limit and offset through to the query unchanged', () => {
      const paginatedInput: SearchInput = {
        filters: [{ property: 'kind', values: ['Pod'] }],
        limit: 20,
        offset: 40,
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)

      renderHook(() => useFleetSearch(paginatedInput))

      expect(mockUseSearchResultItemsQuery).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: { input: [paginatedInput] },
        })
      )
    })
  })
})
