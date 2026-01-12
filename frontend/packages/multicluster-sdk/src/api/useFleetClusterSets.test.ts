/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
}))

import { renderHook } from '@testing-library/react-hooks'
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetClusterSets } from './useFleetClusterSets'
import { ManagedClusterListGroupVersionKind } from '../internal/models'

const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>

describe('useFleetClusterSets', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when considerAllClusters is false (default)', () => {
    it('should return empty array when no clusters are loaded', () => {
      mockUseK8sWatchResource.mockReturnValue([[], false, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([[], false, undefined])
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: ManagedClusterListGroupVersionKind,
        isList: true,
      })
    })

    it('should return empty array when no clusters are loaded (explicit false)', () => {
      mockUseK8sWatchResource.mockReturnValue([[], false, undefined])

      const { result } = renderHook(() => useFleetClusterSets(false))

      expect(result.current).toEqual([[], false, undefined])
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: ManagedClusterListGroupVersionKind,
        isList: true,
      })
    })

    it('should return cluster set names only for clusters with cluster proxy addon available, ManagedClusterConditionAvailable: True, and clusterset label', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-available-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
            name: 'cluster-without-proxy-but-clusterset',
            labels: {
              'some.other.label': 'value',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
            name: 'cluster-with-wrong-proxy-value-but-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'unavailable',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-3',
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
            name: 'cluster-with-proxy-but-unavailable-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-4',
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
        {
          metadata: {
            name: 'cluster-with-proxy-available-but-no-clusterset',
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
      ] as any[]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-1'], true, undefined])
    })

    it('should handle clusters without metadata', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-available-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
          // Cluster without metadata
        },
        {
          metadata: {
            // Cluster without name
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-1'], true, undefined])
    })

    it('should handle clusters without labels', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-available-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
            name: 'cluster-without-labels',
            // No labels property
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-1'], true, undefined])
    })

    it('should return multiple unique cluster set names when multiple clusters have the required labels and available condition', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-1',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1', // Duplicate clusterset
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
            name: 'cluster-4',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'unavailable',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-3',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-1', 'clusterset-2'], true, undefined])
    })

    it('should forward loading state from useK8sWatchResource', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-1',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, false, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-1'], false, undefined])
    })

    it('should forward error from useK8sWatchResource', () => {
      const mockError = new Error('Failed to load clusters')
      mockUseK8sWatchResource.mockReturnValue([[], false, mockError])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([[], false, mockError])
    })

    it('should handle empty clusters array', () => {
      mockUseK8sWatchResource.mockReturnValue([[], true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([[], true, undefined])
    })

    it('should be case-sensitive for label values', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-correct-case',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
            name: 'cluster-with-wrong-case',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'Available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-1'], true, undefined])
    })

    it('should handle clusters missing status conditions', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-no-status',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
            },
          },
          // No status property
        },
        {
          metadata: {
            name: 'cluster-with-proxy-empty-conditions',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
            },
          },
          status: {
            conditions: [],
          },
        },
        {
          metadata: {
            name: 'cluster-with-proxy-available-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-3',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-3'], true, undefined])
    })

    it('should handle clusters with different condition types', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-different-condition',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
            },
          },
          status: {
            conditions: [
              {
                type: 'SomeOtherCondition',
                status: 'True',
              },
            ],
          },
        },
        {
          metadata: {
            name: 'cluster-with-available-condition',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-2'], true, undefined])
    })

    it('should be case-sensitive for condition status values', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-lowercase-true',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
            },
          },
          status: {
            conditions: [
              {
                type: 'ManagedClusterConditionAvailable',
                status: 'true',
              },
            ],
          },
        },
        {
          metadata: {
            name: 'cluster-with-uppercase-true',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets())

      expect(result.current).toEqual([['clusterset-2'], true, undefined])
    })
  })

  describe('when considerAllClusters is true', () => {
    it('should return all cluster set names regardless of labels and conditions', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-available-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
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
            name: 'cluster-without-proxy-but-clusterset',
            labels: {
              'some.other.label': 'value',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
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
            name: 'cluster-with-proxy-but-unavailable-and-clusterset',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-3',
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
        {
          metadata: {
            name: 'cluster-without-labels-or-status',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'clusterset-4',
            },
          },
        },
      ] as any[]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets(true))

      expect(result.current).toEqual([
        ['clusterset-1', 'clusterset-2', 'clusterset-3', 'clusterset-4'],
        true,
        undefined,
      ])
    })

    it('should still filter out clusters without names or clusterset labels', () => {
      const mockClusters: K8sResourceCommon[] = [
        {
          metadata: {
            name: 'cluster-1',
            labels: {
              'some.label': 'value',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-1',
            },
          },
        },
        {
          // Cluster without metadata
        },
        {
          metadata: {
            // Cluster without name
            labels: {
              'some.label': 'value',
              'cluster.open-cluster-management.io/clusterset': 'clusterset-2',
            },
          },
        },
        {
          metadata: {
            name: 'cluster-2',
            labels: {
              'some.label': 'value',
              // No clusterset label
            },
          },
        },
        {
          metadata: {
            name: 'cluster-3',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'clusterset-3',
            },
          },
        },
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets(true))

      expect(result.current).toEqual([['clusterset-1', 'clusterset-3'], true, undefined])
    })

    it('should return unique cluster set names when clusters share the same clusterset', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-1',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'shared-clusterset',
            },
          },
        },
        {
          metadata: {
            name: 'cluster-2',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'shared-clusterset',
            },
          },
        },
        {
          metadata: {
            name: 'cluster-3',
            labels: {
              'cluster.open-cluster-management.io/clusterset': 'unique-clusterset',
            },
          },
        },
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets(true))

      expect(result.current).toEqual([['shared-clusterset', 'unique-clusterset'], true, undefined])
    })

    it('should return empty array when no clusters have clusterset labels', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-1',
            labels: {
              'some.label': 'value',
            },
          },
        },
        {
          metadata: {
            name: 'cluster-2',
            // No labels
          },
        },
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterSets(true))

      expect(result.current).toEqual([[], true, undefined])
    })

    it('should forward loading and error states correctly', () => {
      const mockError = new Error('Failed to load clusters')
      mockUseK8sWatchResource.mockReturnValue([[], false, mockError])

      const { result } = renderHook(() => useFleetClusterSets(true))

      expect(result.current).toEqual([[], false, mockError])
    })
  })
})
