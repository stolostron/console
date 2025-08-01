/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useHubClusterName } from './useHubClusterName'

// Mock the dependencies
const mockGetCachedHubClusterName = jest.fn()
const mockUseIsFleetAvailable = jest.fn()

jest.mock('../internal/cachedHubClusterName', () => ({
  getCachedHubClusterName: () => mockGetCachedHubClusterName(),
}))

jest.mock('./useIsFleetAvailable', () => ({
  useIsFleetAvailable: () => mockUseIsFleetAvailable(),
}))

describe('testing useHubClusterName Hook', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should return cached hub cluster name if cache available', async () => {
    mockGetCachedHubClusterName.mockResolvedValue('local-cluster')
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useHubClusterName())

    // Initially it should be loading
    expect(result.current).toEqual([undefined, false, undefined])

    // Wait for the async operation to complete
    await waitForNextUpdate()

    expect(result.current).toEqual(['local-cluster', true, undefined])
    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
  })

  it('should fetch hub cluster name and handle async loading', async () => {
    mockGetCachedHubClusterName.mockResolvedValue('remote-cluster')
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useHubClusterName())

    // Initially it should be loading
    expect(result.current).toEqual([undefined, false, undefined])

    // Wait for the async operation to complete
    await waitForNextUpdate()

    expect(mockGetCachedHubClusterName).toHaveBeenCalledTimes(1)
    expect(result.current).toEqual(['remote-cluster', true, undefined])
  })

  it('should handle error when getCachedHubClusterName fails', async () => {
    const errorMessage = 'Failed to fetch hub cluster name'
    mockGetCachedHubClusterName.mockRejectedValue(new Error(errorMessage))
    mockUseIsFleetAvailable.mockReturnValue(true)
    const { result, waitForNextUpdate } = renderHook(() => useHubClusterName())

    // Initially it should be loading
    expect(result.current).toEqual([undefined, false, undefined])

    // Wait for the async operation to complete
    await waitForNextUpdate()

    expect(result.current[0]).toBeUndefined()
    expect(result.current[1]).toBe(true) // loaded should be true even on error
    expect(result.current[2]).toEqual(new Error(errorMessage))
  })

  it('should return error if fleet is not available', () => {
    mockUseIsFleetAvailable.mockReturnValue(false)
    const { result } = renderHook(() => useHubClusterName())

    expect(result.current).toEqual([
      undefined,
      false,
      'A version of RHACM that is compatible with the multicluster SDK is not available',
    ])

    // getCachedHubClusterName should not be called when fleet is not available
    expect(mockGetCachedHubClusterName).not.toHaveBeenCalled()
  })
})
