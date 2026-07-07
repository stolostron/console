/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useFleetSearchSubscription } from './useFleetSearchSubscription'
import { useSearchSubscription } from '../internal/search/search-sdk'
import { SearchInput } from '../types/search'

// Mock the generated Apollo subscription hook
jest.mock('../internal/search/search-sdk', () => ({
  useSearchSubscription: jest.fn(),
}))

// Mock the search client
jest.mock('../internal/search/search-client', () => ({
  searchClient: 'mock-search-client',
}))

const mockUseSearchSubscription = useSearchSubscription as jest.MockedFunction<typeof useSearchSubscription>

describe('useFleetSearchSubscription', () => {
  const mockInput: SearchInput = {
    filters: [
      { property: 'kind', values: ['Pod'] },
      { property: 'namespace', values: ['default'] },
    ],
  }

  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('basic functionality', () => {
    it('should return [undefined, true, undefined] while loading', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: true,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))

      const [latestEvent, loading, error] = result.current
      expect(latestEvent).toBeUndefined()
      expect(loading).toBe(true)
      expect(error).toBeUndefined()
    })

    it('should return the latest event when data arrives', () => {
      const mockEvent = {
        uid: 'abc-123',
        operation: 'INSERT',
        newData: { kind: 'Pod', name: 'test-pod', namespace: 'default' },
        oldData: null,
        timestamp: new Date('2024-01-01T00:00:00Z'),
      }

      mockUseSearchSubscription.mockReturnValue({
        data: { searchSubscription: mockEvent },
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))

      const [latestEvent, loading, error] = result.current
      expect(latestEvent).toEqual(mockEvent)
      expect(loading).toBe(false)
      expect(error).toBeUndefined()
    })

    it('should return undefined latestEvent when data is undefined', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))

      const [latestEvent, loading, error] = result.current
      expect(latestEvent).toBeUndefined()
      expect(loading).toBe(false)
      expect(error).toBeUndefined()
    })

    it('should return undefined latestEvent when searchSubscription is null', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: { searchSubscription: null },
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))

      const [latestEvent] = result.current
      expect(latestEvent).toBeUndefined()
    })

    it('should return error when subscription errors', () => {
      const mockError = new Error('WebSocket connection failed')

      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: false,
        error: mockError,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))

      const [latestEvent, loading, error] = result.current
      expect(latestEvent).toBeUndefined()
      expect(loading).toBe(false)
      expect(error).toBe(mockError)
    })
  })

  describe('skip behavior', () => {
    it('should pass skip: true to useSearchSubscription when input is undefined', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      } as any)

      renderHook(() => useFleetSearchSubscription(undefined))

      expect(mockUseSearchSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: true,
          client: 'mock-search-client',
        })
      )
    })

    it('should pass skip: false to useSearchSubscription when input is defined', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      } as any)

      renderHook(() => useFleetSearchSubscription(mockInput))

      expect(mockUseSearchSubscription).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: false,
          client: 'mock-search-client',
          variables: { input: mockInput },
        })
      )
    })

    it('should return [undefined, false, undefined] when input is undefined', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(undefined))

      const [latestEvent, loading, error] = result.current
      expect(latestEvent).toBeUndefined()
      expect(loading).toBe(false)
      expect(error).toBeUndefined()
    })
  })

  describe('event types', () => {
    it('should return an INSERT event', () => {
      const insertEvent = {
        uid: 'uid-insert',
        operation: 'INSERT',
        newData: { kind: 'Pod', name: 'new-pod' },
        oldData: null,
        timestamp: new Date(),
      }

      mockUseSearchSubscription.mockReturnValue({
        data: { searchSubscription: insertEvent },
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))
      expect(result.current[0]?.operation).toBe('INSERT')
      expect(result.current[0]?.uid).toBe('uid-insert')
    })

    it('should return an UPDATE event', () => {
      const updateEvent = {
        uid: 'uid-update',
        operation: 'UPDATE',
        newData: { kind: 'Pod', name: 'updated-pod' },
        oldData: { kind: 'Pod', name: 'old-pod' },
        timestamp: new Date(),
      }

      mockUseSearchSubscription.mockReturnValue({
        data: { searchSubscription: updateEvent },
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))
      expect(result.current[0]?.operation).toBe('UPDATE')
    })

    it('should return a DELETE event', () => {
      const deleteEvent = {
        uid: 'uid-delete',
        operation: 'DELETE',
        newData: null,
        oldData: { kind: 'Pod', name: 'deleted-pod' },
        timestamp: new Date(),
      }

      mockUseSearchSubscription.mockReturnValue({
        data: { searchSubscription: deleteEvent },
        loading: false,
        error: undefined,
      } as any)

      const { result } = renderHook(() => useFleetSearchSubscription(mockInput))
      expect(result.current[0]?.operation).toBe('DELETE')
    })
  })

  describe('client configuration', () => {
    it('should always pass the searchClient to the underlying hook', () => {
      mockUseSearchSubscription.mockReturnValue({
        data: undefined,
        loading: false,
        error: undefined,
      } as any)

      renderHook(() => useFleetSearchSubscription(mockInput))

      expect(mockUseSearchSubscription).toHaveBeenCalledWith(expect.objectContaining({ client: 'mock-search-client' }))
    })
  })
})
