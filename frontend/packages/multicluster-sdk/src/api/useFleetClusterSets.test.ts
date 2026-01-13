/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
}))

import { renderHook } from '@testing-library/react-hooks'
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetClusterSets } from './useFleetClusterSets'

const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>

describe('useFleetClusterSets', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  const mockClustersForAdvanced = [
    {
      metadata: {
        name: 'cluster-1',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'cluster.open-cluster-management.io/clusterset': 'production',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'True',
          },
        ],
      },
    },
    {
      metadata: {
        name: 'cluster-2',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'cluster.open-cluster-management.io/clusterset': 'staging',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'True',
          },
        ],
      },
    },
    {
      metadata: {
        name: 'cluster-3',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'cluster.open-cluster-management.io/clusterset': 'production',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'True',
          },
        ],
      },
    },
    {
      metadata: {
        name: 'cluster-without-set',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'True',
          },
        ],
      },
    },
    {
      metadata: {
        name: 'cluster-unavailable',
        labels: {
          'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
          'cluster.open-cluster-management.io/clusterset': 'development',
        },
      },
      status: {
        conditions: [
          {
            type: 'ManagedClusterConditionAvailable',
            status: 'False',
          },
        ],
      },
    },
  ]

  it('should return structured data with cluster sets', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() => useFleetClusterSets({}))

    expect(result.current[0]).toEqual({
      default: ['cluster-without-set'],
      production: ['cluster-1', 'cluster-3'],
      staging: ['cluster-2'],
    })
    expect(result.current[1]).toBe(true)
    expect(result.current[2]).toBe(undefined)
  })

  it('should include global set when requested', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() => useFleetClusterSets({ includeGlobal: true }))

    expect(result.current[0]).toEqual({
      global: ['cluster-1', 'cluster-2', 'cluster-3', 'cluster-without-set'],
      default: ['cluster-without-set'],
      production: ['cluster-1', 'cluster-3'],
      staging: ['cluster-2'],
    })
  })

  it('should filter to specific cluster sets', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() => useFleetClusterSets({ clusterSets: ['production', 'staging'] }))

    expect(result.current[0]).toEqual({
      production: ['cluster-1', 'cluster-3'],
      staging: ['cluster-2'],
    })
  })

  it('should filter to specific cluster sets only', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() => useFleetClusterSets({ clusterSets: ['production'] }))

    expect(result.current[0]).toEqual({
      production: ['cluster-1', 'cluster-3'],
    })
  })

  it('should return all clusters when returnAllClusters is true', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() => useFleetClusterSets({ returnAllClusters: true }))

    expect(result.current[0]).toEqual({
      default: ['cluster-without-set'],
      production: ['cluster-1', 'cluster-3'],
      staging: ['cluster-2'],
      development: ['cluster-unavailable'],
    })
  })

  it('should handle empty options object', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() => useFleetClusterSets({}))

    expect(result.current[0]).toEqual({
      default: ['cluster-without-set'],
      production: ['cluster-1', 'cluster-3'],
      staging: ['cluster-2'],
    })
  })

  it('should forward loading and error states correctly', () => {
    const mockError = new Error('Failed to load clusters')
    mockUseK8sWatchResource.mockReturnValue([[], false, mockError])

    const { result } = renderHook(() => useFleetClusterSets({ includeGlobal: true }))

    expect(result.current[0]).toEqual({})
    expect(result.current[1]).toBe(false)
    expect(result.current[2]).toBe(mockError)
  })

  it('should handle complex configuration correctly', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    const { result } = renderHook(() =>
      useFleetClusterSets({
        clusterSets: ['production', 'nonexistent'],
        includeGlobal: true,
      })
    )

    expect(result.current[0]).toEqual({
      global: ['cluster-1', 'cluster-2', 'cluster-3', 'cluster-without-set'],
      production: ['cluster-1', 'cluster-3'],
    })
  })

  it('should apply default values correctly for options', () => {
    mockUseK8sWatchResource.mockReturnValue([mockClustersForAdvanced as any, true, undefined])

    // Test includeGlobal defaults to false
    const { result: result1 } = renderHook(() => useFleetClusterSets({ clusterSets: ['production'] }))
    expect(result1.current[0]).not.toHaveProperty('global')

    // Test returnAllClusters defaults to false (should not include unavailable clusters)
    const { result: result2 } = renderHook(() => useFleetClusterSets({}))
    expect(result2.current[0]).toEqual({
      default: ['cluster-without-set'],
      production: ['cluster-1', 'cluster-3'],
      staging: ['cluster-2'],
    })
    // cluster-unavailable should not be included because returnAllClusters defaults to false
  })
})
