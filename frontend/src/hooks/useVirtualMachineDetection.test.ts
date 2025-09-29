/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useVirtualMachineDetection } from './useVirtualMachineDetection'
import { useSearchResultItemsQuery } from '../routes/Search/search-sdk/search-sdk'

// Mock the useSearchResultItemsQuery hook
jest.mock('../routes/Search/search-sdk/search-sdk', () => ({
  useSearchResultItemsQuery: jest.fn(),
}))

const mockUseSearchResultItemsQuery = useSearchResultItemsQuery as jest.MockedFunction<typeof useSearchResultItemsQuery>

describe('useVirtualMachineDetection', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return hasVirtualMachines as true when VMs are found', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [{ kind: 'VirtualMachine', name: 'test-vm' }],
          },
        ],
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
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [],
          },
        ],
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
    mockUseSearchResultItemsQuery.mockReturnValue({
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
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: undefined,
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when related data is missing', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            related: undefined,
          },
        ],
      },
      loading: false,
      error: undefined,
    } as any)

    const { result } = renderHook(() => useVirtualMachineDetection())

    expect(result.current.hasVirtualMachines).toBe(false)
    expect(result.current.isLoading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('should return hasVirtualMachines as false when no virtualmachine kind is found in related', () => {
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            related: [
              { kind: 'pod', count: 5 },
              { kind: 'deployment', count: 2 },
            ],
          },
        ],
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
    mockUseSearchResultItemsQuery.mockReturnValue({
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
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [{ kind: 'VirtualMachine', name: 'test-vm' }],
          },
        ],
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
    mockUseSearchResultItemsQuery.mockReturnValue({
      data: {
        searchResult: [
          {
            items: [],
          },
        ],
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
