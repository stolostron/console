/* Copyright Contributors to the Open Cluster Management project */
import { renderHook, act } from '@testing-library/react-hooks'
import { usePlacementDebug, clearPlacementDebugCache, placementHasIncompleteEntries } from './usePlacementDebug'
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

    const { result } = renderHook(() => usePlacementDebug(mockPlacement))

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

    const { result } = renderHook(() => usePlacementDebug(mockPlacement))

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

    const { result } = renderHook(() => usePlacementDebug(mockPlacement))

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

    const { result } = renderHook(() => usePlacementDebug(mockPlacement))

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

    const { result } = renderHook(() => usePlacementDebug(mockPlacement))

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

    const { result: first, unmount } = renderHook(() => usePlacementDebug(mockPlacement))

    act(() => {
      jest.advanceTimersByTime(500)
    })

    await act(async () => {
      await Promise.resolve()
    })

    expect(first.current.matched).toEqual(['cluster1', 'cluster2'])
    unmount()

    const { result: second } = renderHook(() => usePlacementDebug(mockPlacement))

    expect(second.current.matched).toEqual(['cluster1', 'cluster2'])
    expect(second.current.matchedCount).toBe(2)
    expect(second.current.loading).toBe(false)
  })

  it('uses cached state when placement spec has not changed', async () => {
    mockPostPlacementDebug.mockReturnValue({
      promise: Promise.resolve(mockResult),
      abort: jest.fn(),
    })

    const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
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

    const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
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

  describe('gating on incomplete entries', () => {
    it('freezes state when an empty label expression is added', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: mockPlacement },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      expect(result.current.matchedCount).toBe(2)
      const callCount = mockPostPlacementDebug.mock.calls.length

      const withEmptyExpr: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: '', operator: 'In', values: [] }],
                },
              },
            },
          ],
        },
      }

      rerender({ placement: withEmptyExpr })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      expect(result.current.matchedCount).toBe(2)
      expect(result.current.loading).toBe(false)
    })

    it('freezes state when a complete expression has its values removed', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const withExpr: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
                },
              },
            },
          ],
        },
      }

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: withExpr },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      const callCount = mockPostPlacementDebug.mock.calls.length

      const withClearedValues: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: [] }],
                },
              },
            },
          ],
        },
      }

      rerender({ placement: withClearedValues })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      expect(result.current.matchedCount).toBe(2)
    })

    it('freezes state when a complete expression has its key removed', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const withExpr: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
                },
              },
            },
          ],
        },
      }

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: withExpr },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      const callCount = mockPostPlacementDebug.mock.calls.length

      const withClearedKey: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: '', operator: 'In', values: ['prod'] }],
                },
              },
            },
          ],
        },
      }

      rerender({ placement: withClearedKey })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })

    it('freezes state when an empty toleration is added', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
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

      const withEmptyToleration: IPlacement = {
        ...mockPlacement,
        spec: {
          tolerations: [{ key: '', operator: 'Exists' }],
        },
      }

      rerender({ placement: withEmptyToleration })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      expect(result.current.matchedCount).toBe(2)
    })

    it('resumes fetching when expression becomes complete', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: mockPlacement },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      // Add incomplete expression — should freeze
      const incomplete: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: [] }],
                },
              },
            },
          ],
        },
      }
      rerender({ placement: incomplete })

      // Complete the expression — should resume and fetch
      const complete: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: ['prod'] }],
                },
              },
            },
          ],
        },
      }
      rerender({ placement: complete })

      expect(result.current.loading).toBe(true)

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })

    it('treats Exists expression with key as complete', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const withExistsExpr: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'gpu', operator: 'Exists' }],
                },
              },
            },
          ],
        },
      }

      const { result } = renderHook(() => usePlacementDebug(withExistsExpr))

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalled()
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })

    it('freezes state for expression with only empty-string values', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: mockPlacement },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      const callCount = mockPostPlacementDebug.mock.calls.length

      const withGhostValues: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env', operator: 'In', values: [''] }],
                },
              },
            },
          ],
        },
      }

      rerender({ placement: withGhostValues })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })

    it('freezes state for expression with key but no operator', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: mockPlacement },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      const callCount = mockPostPlacementDebug.mock.calls.length

      const withKeyOnly: IPlacement = {
        ...mockPlacement,
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'env' } as any],
                },
              },
            },
          ],
        },
      }

      rerender({ placement: withKeyOnly })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })

    it('freezes state when a toleration has its operator removed', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const withToleration: IPlacement = {
        ...mockPlacement,
        spec: {
          tolerations: [{ key: 'gpu', operator: 'Exists' }],
        },
      }

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: withToleration },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
      const callCount = mockPostPlacementDebug.mock.calls.length

      const withClearedOperator: IPlacement = {
        ...mockPlacement,
        spec: {
          tolerations: [{ key: 'gpu' } as any],
        },
      }

      rerender({ placement: withClearedOperator })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })

    it('freezes state for Equal toleration with key but no value', async () => {
      mockPostPlacementDebug.mockReturnValue({
        promise: Promise.resolve(mockResult),
        abort: jest.fn(),
      })

      const { result, rerender } = renderHook(({ placement }) => usePlacementDebug(placement), {
        initialProps: { placement: mockPlacement },
      })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      const callCount = mockPostPlacementDebug.mock.calls.length

      const withIncompleteToleration: IPlacement = {
        ...mockPlacement,
        spec: {
          tolerations: [{ key: 'gpu', operator: 'Equal' }],
        },
      }

      rerender({ placement: withIncompleteToleration })

      act(() => {
        jest.advanceTimersByTime(500)
      })
      await act(async () => {
        await Promise.resolve()
      })

      expect(mockPostPlacementDebug).toHaveBeenCalledTimes(callCount)
      expect(result.current.matched).toEqual(['cluster1', 'cluster2'])
    })
  })
})

describe('placementHasIncompleteEntries', () => {
  it('returns false for placement with no predicates or tolerations', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {},
    }
    expect(placementHasIncompleteEntries(placement)).toBe(false)
  })

  it('returns true when any label expression is incomplete', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  { key: 'env', operator: 'In', values: ['prod'] },
                  { key: '', operator: 'In', values: [] },
                ],
              },
            },
          },
        ],
      },
    }
    expect(placementHasIncompleteEntries(placement)).toBe(true)
  })

  it('returns true when any toleration is incomplete', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {
        tolerations: [{ key: '', operator: 'Exists' }],
      },
    }
    expect(placementHasIncompleteEntries(placement)).toBe(true)
  })

  it('returns false when all entries are complete', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  { key: 'env', operator: 'In', values: ['prod'] },
                  { key: 'region', operator: 'Exists' },
                ],
              },
            },
          },
        ],
        tolerations: [{ key: 'gpu', operator: 'Equal', value: 'nvidia' }],
      },
    }
    expect(placementHasIncompleteEntries(placement)).toBe(false)
  })

  it('detects In expression with key but empty values', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'env', operator: 'In', values: [] }],
              },
            },
          },
        ],
      },
    }
    expect(placementHasIncompleteEntries(placement)).toBe(true)
  })

  it('detects toleration with missing operator', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {
        tolerations: [{ key: 'gpu' } as any],
      },
    }
    expect(placementHasIncompleteEntries(placement)).toBe(true)
  })

  it('detects claim expression incompleteness', () => {
    const placement: IPlacement = {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: { name: 'test', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              claimSelector: {
                matchExpressions: [{ key: '', operator: 'In', values: [] }],
              },
            },
          },
        ],
      },
    }
    expect(placementHasIncompleteEntries(placement)).toBe(true)
  })
})
