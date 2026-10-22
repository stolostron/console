/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useVirtualMachineDetection } from './useVirtualMachineDetection'
import { useSearchResultCountQuery } from '../routes/Search/search-sdk/search-sdk'

// Mock the useSearchResultCountQuery hook
jest.mock('../routes/Search/search-sdk/search-sdk', () => ({
  useSearchResultCountQuery: jest.fn(),
}))

const mockUseSearchResultCountQuery = useSearchResultCountQuery as jest.MockedFunction<typeof useSearchResultCountQuery>

describe('useVirtualMachineDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return hasVirtualMachines as true when VMs are found', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: {
        searchResult: [{ count: 3 }],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when no VMs are found', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: {
        searchResult: [{ count: 0 }],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when there is an error', () => {
    const mockError = new Error('Search failed')
    mockUseSearchResultCountQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: mockError,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBe(mockError)
  })

  it('should return hasVirtualMachines as false when data is undefined', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when count is null', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: {
        searchResult: [{ count: null }],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when searchResult is empty', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: {
        searchResult: [],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should handle loading state correctly', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: undefined,
      loading: true,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(true)
    expect(result.current.error).toBeUndefined()
  })

  it('should work with clusterName option', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: {
        searchResult: [{ count: 1 }],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection({ clusterName: 'test-cluster' }))

    expect(result.current.hasVirtualMachines).toBe(true)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should work with pollInterval option', () => {
    mockUseSearchResultCountQuery.mockReturnValue({
      data: {
        searchResult: [{ count: 0 }],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection({ pollInterval: 30 }))

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })
})
