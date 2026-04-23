/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { usePlacementDebug, clearPlacementDebugCache } from './usePlacementDebug'
import { IPlacement } from '../common/resources/IPlacement'
import { postPlacementDebug } from '../../resources/placement-debug'
import { ResourceError, ResourceErrorCode } from '../../resources/utils/resource-request'

jest.mock('../../resources/placement-debug', () => ({
  postPlacementDebug: jest.fn(),
}))

jest.mock('../../resources/utils/resource-request', () => {
  const actual = jest.requireActual('../../resources/utils/resource-request')
  return {
    isRequestAbortedError: jest.fn((err) => err?.name === 'AbortError'),
    ResourceError: actual.ResourceError,
    ResourceErrorCode: actual.ResourceErrorCode,
  }
})

const mockPostPlacementDebug = postPlacementDebug as jest.Mock

const mockPlacement: IPlacement = {
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: { name: 'test', namespace: 'default' },
  spec: {},
}

const mockResult = {
  aggregatedScores: [
    { clusterName: 'cluster1', score: 100 },
    { clusterName: 'cluster2', score: 80 },
  ],
  filteredPipelineResults: [{ name: 'filter1', filteredClusters: ['cluster3'] }],
}

describe('usePlacementDebug', () => {
  beforeEach(() => {
    jest.useFakeTimers()
    mockPostPlacementDebug.mockReset()
    clearPlacementDebugCache()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('returns empty state when disabled', () => {
    const { result } = renderHook(() => usePlacementDebug(mockPlacement, false))

    expect(result.current.matchedCount).toBeUndefined()
    expect(result.current.loading).toBe(false)
    expect(result.current.matched).toEqual([])
    expect(result.current.notMatched).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it('returns empty state when placement is undefined', () => {
    const { result } = renderHook(() => usePlacementDebug(undefined))

    expect(result.current.matchedCount).toBeUndefined()
    expect(result.current.loading).toBe(false)
    expect(result.current.matched).toEqual([])
    expect(result.current.notMatched).toEqual([])
    expect(result.current.error).toBeUndefined()
  })

  it('fetches and maps successful result', async () => {
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    })

    const { result } = renderHook(() => usePlacementDebug(mockPlacement, true))

    // After render but before debounce fires, should be loading
    expect(result.current.loading).toBe(true)

    // Advance past the 500ms debounce
    act(() => {
      jest.advanceTimersByTime(500)
    })

    // Wait for the promise to resolve
    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    expect(result.current.notMatched).toEqual(['cluster3'])
    expect(result.current.matchedCount).toBe(2)
    expect(result.current.totalClusters).toBe(3)
    expect(result.current.loading).toBe(false)
    expect(result.current.error).toBeUndefined()
  })

  it('maps server-returned error from result', async () => {
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve({ error: 'placement namespace not found' }),
      abort: jest.fn(),
    })

    const { result } = renderHook(() => usePlacementDebug(mockPlacement, true))

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.error).toEqual(new Error('placement namespace not found'))
    expect(result.current.matched).toEqual([])
    expect(result.current.matchedCount).toBeUndefined()
  })

  it('limits matched clusters by numberOfClusters and puts rest in notMatched', async () => {
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve({
        placement: { spec: { numberOfClusters: 1 } },
        aggregatedScores: [
          { clusterName: 'cluster1', score: 100 },
          { clusterName: 'cluster2', score: 80 },
          { clusterName: 'cluster3', score: 60 },
        ],
        filteredPipelineResults: [],
      }),
      abort: jest.fn(),
    })

    const { result } = renderHook(() => usePlacementDebug(mockPlacement, true))

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.matched).toEqual(['cluster1'])
    expect(result.current.notMatched).toEqual(['cluster2', 'cluster3'])
    expect(result.current.matchedCount).toBe(1)
    expect(result.current.totalClusters).toBe(3)
  })

  it('handles error state', async () => {
    const testError = new Error('Network failure')
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.reject(testError),
      abort: jest.fn(),
    })

    const { result } = renderHook(() => usePlacementDebug(mockPlacement, true))

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.error).toEqual(testError)
    expect(result.current.matched).toEqual([])
    expect(result.current.notMatched).toEqual([])
    expect(result.current.matchedCount).toBeUndefined()
    expect(result.current.loading).toBe(false)
  })

  it('formats ResourceError with status code and reason', async () => {
    const resourceError = new ResourceError(
      ResourceErrorCode.InternalServerError,
      'Internal Server Error',
      'upstream service unavailable'
    )
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.reject(resourceError),
      abort: jest.fn(),
    })

    const { result } = renderHook(() => usePlacementDebug(mockPlacement, true))

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.error?.message).toBe('500 Internal Server Error: upstream service unavailable')
    expect(result.current.matched).toEqual([])
    expect(result.current.matchedCount).toBeUndefined()
  })

  it('returns cached state on initial render when cache matches', async () => {
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    })

    const { result: first, unmount } = renderHook(() => usePlacementDebug(mockPlacement, true))

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(first.current.matched).toEqual(['cluster1', 'cluster2'])
    unmount()

    const { result: second } = renderHook(() => usePlacementDebug(mockPlacement, true))

    expect(second.current.matched).toEqual(['cluster1', 'cluster2'])
    expect(second.current.matchedCount).toBe(2)
    expect(second.current.loading).toBe(false)
  })

  it('uses cached state when placement spec has not changed', async () => {
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    })

    const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement, true), {
      initialProps: { placement: mockPlacement },
    })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.matched).toEqual(['cluster1', 'cluster2'])

    const callCount = mockPostPlacementDebug.mock.calls.length

    rerender({ placement: { ...mockPlacement } })

    expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    expect(result.current.loading).toBe(false)
    expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
  })

  it('clears stale state on re-fetch', async () => {
    // First fetch resolves successfully
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    })

    const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement, true), {
      initialProps: { placement: mockPlacement },
    })

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.matched).toEqual(['cluster1', 'cluster2'])

    // Prepare a new pending promise for the second fetch
    let resolveSecond: (value: typeof mockResult) => void
    const secondPromise = new Promise<typeof mockResult>((resolve) => {
      resolveSecond = resolve
    })
    mockPostPlacementDebug.mockReturnValue({
      promise: secondPromise,
      abort: jest.fn(),
    })

    // Trigger re-fetch by changing the placement spec
    const updatedPlacement: IPlacement = {
      ...mockPlacement,
      spec: { clusterSets: ['new-set'] },
    }

    rerender({ placement: updatedPlacement })

    // After rerender with new spec, state should be cleared and loading
    expect(result.current.loading).toBe(true)
    expect(result.current.matched).toEqual([])
    expect(result.current.notMatched).toEqual([])

    // Resolve the second fetch
    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      resolveSecond!(mockResult)
      await Promise.resolve()
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    expect(result.current.loading).toBe(false)
  })
})
