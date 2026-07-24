/* Copyright Contributors to the Open Cluster Management project */
import { act, renderHook } from '@testing-library/react-hooks'
import { useSearchResultItemsQuery } from '../internal/search/search-sdk'
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

const mockUseSearchResultItemsQuery = useSearchResultItemsQuery as jest.MockedFunction<typeof useSearchResultItemsQuery>
const mockUseFleetSearchSubscription = useFleetSearchSubscription as jest.MockedFunction<
  typeof useFleetSearchSubscription
>

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

describe('useFleetSearch', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    // Default: subscription disabled (no event, not loading, no error)
    mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])
  })

  // ── Basic query behaviour ──────────────────────────────────────────────────

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
      const mockRefetch = jest.fn()
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

  // ── Subscription disabled ──────────────────────────────────────────────────

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

  // ── Subscription enabled ───────────────────────────────────────────────────

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

  // ── Subscription event patching ────────────────────────────────────────────

  describe('INSERT event', () => {
    it('should append a new resource on INSERT', () => {
      const existingItem = { ...mockSearchItem, name: 'existing-pod', _uid: 'test-cluster/uid-existing' }
      const newItem = { ...mockSearchItem, name: 'new-pod', _uid: 'test-cluster/uid-new' }
      const insertEvent = {
        uid: 'test-cluster/uid-new',
        operation: 'INSERT',
        newData: newItem,
        oldData: null,
        timestamp: new Date(),
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [existingItem] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([insertEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [data] = result.current
      expect(data).toHaveLength(2)
      expect(data!.map((r) => r.metadata?.name)).toContain('new-pod')
    })

    it('should not duplicate on INSERT if uid already exists', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const insertEvent = {
        uid: 'test-cluster/uid-1',
        operation: 'INSERT',
        newData: item,
        oldData: null,
        timestamp: new Date(),
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [item] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([insertEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [data] = result.current
      expect(data).toHaveLength(1)
    })

    it('should insert at the correct sorted position when orderBy is set', () => {
      const appleItem = { ...mockSearchItem, name: 'apple', _uid: 'test-cluster/uid-apple' }
      const mangoItem = { ...mockSearchItem, name: 'mango', _uid: 'test-cluster/uid-mango' }
      const figItem = { ...mockSearchItem, name: 'fig', _uid: 'test-cluster/uid-fig' }
      const insertEvent = {
        uid: 'test-cluster/uid-fig',
        operation: 'INSERT',
        newData: figItem,
        oldData: null,
        timestamp: new Date(),
      }
      const inputWithOrderBy: SearchInput = { ...mockInput, orderBy: 'name asc' }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [appleItem, mangoItem] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([insertEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(inputWithOrderBy, true))

      const [data] = result.current
      expect(data).toHaveLength(3)
      expect(data!.map((r) => r.metadata?.name)).toEqual(['apple', 'fig', 'mango'])
    })

    it('should drop the last item when an INSERT causes the page to exceed its limit', () => {
      const appleItem = { ...mockSearchItem, name: 'apple', _uid: 'test-cluster/uid-apple' }
      const mangoItem = { ...mockSearchItem, name: 'mango', _uid: 'test-cluster/uid-mango' }
      const figItem = { ...mockSearchItem, name: 'fig', _uid: 'test-cluster/uid-fig' }
      const insertEvent = {
        uid: 'test-cluster/uid-fig',
        operation: 'INSERT',
        newData: figItem,
        oldData: null,
        timestamp: new Date(),
      }
      // limit: 2 means at most 2 items should be kept on the page
      const inputWithLimit: SearchInput = { ...mockInput, limit: 2, orderBy: 'name asc' }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [appleItem, mangoItem] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([insertEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(inputWithLimit, true))

      const [data] = result.current
      // 'fig' sorts between 'apple' and 'mango'; 'mango' is bumped off the page
      expect(data).toHaveLength(2)
      expect(data!.map((r) => r.metadata?.name)).toEqual(['apple', 'fig'])
    })
  })

  describe('UPDATE event', () => {
    it('should merge updated fields on UPDATE — e.g. adding a label', () => {
      const originalItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      // Simulate a label being added: label field uses "key=value" format
      const updatedItem = { ...mockSearchItem, _uid: 'test-cluster/uid-1', label: 'abc=123' }
      const updateEvent = {
        uid: 'test-cluster/uid-1',
        operation: 'UPDATE',
        newData: updatedItem,
        oldData: originalItem,
        timestamp: new Date(),
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [originalItem] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([updateEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [data] = result.current
      expect(data).toHaveLength(1)
      // Name is unchanged (K8s names are immutable)
      expect(data![0].metadata?.name).toBe('test-pod')
      // New label should be present after conversion
      expect(data![0].metadata?.labels).toEqual({ abc: '123' })
    })

    it('should re-sort the page after an UPDATE when orderBy is set', () => {
      // Use `status` as the sort field — it can legitimately change (e.g. Pending → Running)
      const pendingItem = { ...mockSearchItem, name: 'pod-a', status: 'Pending', _uid: 'test-cluster/uid-a' }
      const runningItem = { ...mockSearchItem, name: 'pod-b', status: 'Running', _uid: 'test-cluster/uid-b' }
      // pod-a transitions from Pending to Terminated, which sorts after Running
      const updatedItem = { ...pendingItem, status: 'Terminated', label: 'abc=123' }
      const updateEvent = {
        uid: 'test-cluster/uid-a',
        operation: 'UPDATE',
        newData: updatedItem,
        oldData: pendingItem,
        timestamp: new Date(),
      }
      const inputWithOrderBy: SearchInput = { ...mockInput, orderBy: 'status asc' }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [pendingItem, runningItem] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([updateEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(inputWithOrderBy, true))

      const [data] = result.current
      expect(data).toHaveLength(2)
      // 'Running' < 'Terminated' alphabetically → pod-b sorts first
      expect(data![0].metadata?.name).toBe('pod-b')
      expect(data![1].metadata?.name).toBe('pod-a')
      // Confirm the label was also applied to pod-a
      expect(data![1].metadata?.labels).toEqual({ abc: '123' })
    })
  })

  describe('DELETE event', () => {
    it('should remove the matching resource on DELETE', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const deleteEvent = {
        uid: 'test-cluster/uid-1',
        operation: 'DELETE',
        newData: null,
        oldData: item,
        timestamp: new Date(),
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [item] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([deleteEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [data] = result.current
      expect(data).toHaveLength(0)
    })

    it('should be a no-op DELETE when uid does not match any resource', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const deleteEvent = {
        uid: 'uid-nonexistent',
        operation: 'DELETE',
        newData: null,
        oldData: null,
        timestamp: new Date(),
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [item] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([deleteEvent as any, false, undefined])

      const { result } = renderHook(() => useFleetSearch(mockInput, true))

      const [data] = result.current
      expect(data).toHaveLength(1)
    })
  })

  // ── subscriptionEnabled toggle ────────────────────────────────────────────

  describe('subscriptionEnabled toggle', () => {
    it('should reset to query data when subscriptionEnabled changes from true to false', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      // Provide an INSERT event so local state diverges from query data
      const insertEvent = {
        uid: 'test-cluster/uid-new',
        operation: 'INSERT',
        newData: { ...mockSearchItem, name: 'extra-pod', _uid: 'test-cluster/uid-new' },
        oldData: null,
        timestamp: new Date(),
      }

      mockUseSearchResultItemsQuery.mockReturnValue({
        data: { searchResult: [{ items: [item] }] },
        loading: false,
        error: undefined,
        refetch: jest.fn(),
      } as any)
      mockUseFleetSearchSubscription.mockReturnValue([insertEvent as any, false, undefined])

      const { result, rerender } = renderHook(
        ({ enabled }: { enabled: boolean }) => useFleetSearch(mockInput, enabled),
        { initialProps: { enabled: true } }
      )

      // With subscription on, we should have 2 items (original + inserted)
      expect(result.current[0]).toHaveLength(2)

      // Disable subscription — subscription hook now returns no event
      mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])

      act(() => {
        rerender({ enabled: false })
      })

      // Should reset to the base query data (1 item)
      expect(result.current[0]).toHaveLength(1)
    })
  })

  // ── Pagination passthrough ────────────────────────────────────────────────

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
