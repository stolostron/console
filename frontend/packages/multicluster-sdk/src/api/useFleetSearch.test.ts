/* Copyright Contributors to the Open Cluster Management project */
import { K8sResourceCommon } from '@openshift-console/dynamic-plugin-sdk'
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

      const { result } = renderHook(() => useFleetSearch<K8sResourceCommon[]>(mockInput))

      const [data, loaded, error] = result.current
      expect(loaded).toBe(true)
      expect(error).toBeUndefined()
      expect(data).toHaveLength(1)
      expect((data as K8sResourceCommon[])[0].metadata?.name).toBe('test-pod')
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
        uid: 'uid-new',
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

      const { result } = renderHook(() => useFleetSearch<K8sResourceCommon[]>(mockInput, true))

      const [data] = result.current
      expect((data as K8sResourceCommon[]).length).toBe(2)
      expect((data as K8sResourceCommon[]).map((r) => r.metadata?.name)).toContain('new-pod')
    })

    it('should not duplicate on INSERT if uid already exists', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const insertEvent = {
        uid: 'uid-1',
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

      const { result } = renderHook(() => useFleetSearch<K8sResourceCommon[]>(mockInput, true))

      const [data] = result.current
      expect((data as K8sResourceCommon[]).length).toBe(1)
    })
  })

  describe('UPDATE event', () => {
    it('should replace the matching resource on UPDATE', () => {
      const originalItem = { ...mockSearchItem, name: 'original-pod', _uid: 'test-cluster/uid-1' }
      const updatedItem = { ...mockSearchItem, name: 'updated-pod', _uid: 'test-cluster/uid-1' }
      const updateEvent = {
        uid: 'uid-1',
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

      const { result } = renderHook(() => useFleetSearch<K8sResourceCommon[]>(mockInput, true))

      const [data] = result.current
      expect((data as K8sResourceCommon[]).length).toBe(1)
      expect((data as K8sResourceCommon[])[0].metadata?.name).toBe('updated-pod')
    })
  })

  describe('DELETE event', () => {
    it('should remove the matching resource on DELETE', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      const deleteEvent = {
        uid: 'uid-1',
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

      const { result } = renderHook(() => useFleetSearch<K8sResourceCommon[]>(mockInput, true))

      const [data] = result.current
      expect((data as K8sResourceCommon[]).length).toBe(0)
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

      const { result } = renderHook(() => useFleetSearch<K8sResourceCommon[]>(mockInput, true))

      const [data] = result.current
      expect((data as K8sResourceCommon[]).length).toBe(1)
    })
  })

  // ── subscriptionEnabled toggle ────────────────────────────────────────────

  describe('subscriptionEnabled toggle', () => {
    it('should reset to query data when subscriptionEnabled changes from true to false', () => {
      const item = { ...mockSearchItem, _uid: 'test-cluster/uid-1' }
      // Provide an INSERT event so local state diverges from query data
      const insertEvent = {
        uid: 'uid-new',
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
        ({ enabled }: { enabled: boolean }) => useFleetSearch<K8sResourceCommon[]>(mockInput, enabled),
        { initialProps: { enabled: true } }
      )

      // With subscription on, we should have 2 items (original + inserted)
      expect((result.current[0] as K8sResourceCommon[]).length).toBe(2)

      // Disable subscription — subscription hook now returns no event
      mockUseFleetSearchSubscription.mockReturnValue([undefined, false, undefined])

      act(() => {
        rerender({ enabled: false })
      })

      // Should reset to the base query data (1 item)
      expect((result.current[0] as K8sResourceCommon[]).length).toBe(1)
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
