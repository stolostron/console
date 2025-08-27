/* Copyright Contributors to the Open Cluster Management project */

jest.mock('@openshift-console/dynamic-plugin-sdk', () => ({
  useK8sWatchResource: jest.fn(),
}))

import { renderHook } from '@testing-library/react-hooks'
import { useK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk'
import { useFleetClusterNames } from './useFleetClusterNames'
import { ManagedClusterListGroupVersionKind } from '../internal/models'

const mockUseK8sWatchResource = useK8sWatchResource as jest.MockedFunction<typeof useK8sWatchResource>

describe('useFleetClusterNames', () => {
  afterEach(() => {
    jest.clearAllMocks()
  })

  describe('when returnAllClusters is false (default)', () => {
    it('should return empty array when no clusters are loaded', () => {
      mockUseK8sWatchResource.mockReturnValue([[], false, undefined])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([[], false, undefined])
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: ManagedClusterListGroupVersionKind,
        isList: true,
      })
    })

    it('should return empty array when no clusters are loaded (explicit false)', () => {
      mockUseK8sWatchResource.mockReturnValue([[], false, undefined])

      const { result } = renderHook(() => useFleetClusterNames(false))

      expect(result.current).toEqual([[], false, undefined])
      expect(mockUseK8sWatchResource).toHaveBeenCalledWith({
        groupVersionKind: ManagedClusterListGroupVersionKind,
        isList: true,
      })
    })

    it('should return cluster names only for clusters with cluster proxy addon available and ManagedClusterConditionAvailable: True', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-and-available',
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
            name: 'cluster-without-proxy',
            labels: {
              'some.other.label': 'value',
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
            name: 'cluster-with-wrong-proxy-value',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'unavailable',
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
            name: 'cluster-with-proxy-but-unavailable',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
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
      ] as any[]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-proxy-and-available'], true, undefined])
    })

    it('should handle clusters without metadata', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-and-available',
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
          // Cluster without metadata
        },
        {
          metadata: {
            // Cluster without name
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-proxy-and-available'], true, undefined])
    })

    it('should handle clusters without labels', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-and-available',
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

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-proxy-and-available'], true, undefined])
    })

    it('should return multiple cluster names when multiple clusters have the required label and available condition', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-1',
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
            name: 'cluster-2',
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
            name: 'cluster-3',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'unavailable',
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

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-1', 'cluster-2'], true, undefined])
    })

    it('should forward loading state from useK8sWatchResource', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-1',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, false, undefined])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-1'], false, undefined])
    })

    it('should forward error from useK8sWatchResource', () => {
      const mockError = new Error('Failed to load clusters')
      mockUseK8sWatchResource.mockReturnValue([[], false, mockError])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([[], false, mockError])
    })

    it('should handle empty clusters array', () => {
      mockUseK8sWatchResource.mockReturnValue([[], true, undefined])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([[], true, undefined])
    })

    it('should be case-sensitive for label values', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-correct-case',
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
            name: 'cluster-with-wrong-case',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'Available',
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

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-correct-case'], true, undefined])
    })

    it('should handle clusters missing status conditions', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-no-status',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
            },
          },
          // No status property
        },
        {
          metadata: {
            name: 'cluster-with-proxy-empty-conditions',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
            },
          },
          status: {
            conditions: [],
          },
        },
        {
          metadata: {
            name: 'cluster-with-proxy-and-available',
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
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-proxy-and-available'], true, undefined])
    })

    it('should handle clusters with different condition types', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-different-condition',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
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

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-available-condition'], true, undefined])
    })

    it('should be case-sensitive for condition status values', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-lowercase-true',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
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

      const { result } = renderHook(() => useFleetClusterNames())

      expect(result.current).toEqual([['cluster-with-uppercase-true'], true, undefined])
    })
  })

  describe('when returnAllClusters is true', () => {
    it('should return all cluster names regardless of labels and conditions', () => {
      const mockClusters = [
        {
          metadata: {
            name: 'cluster-with-proxy-and-available',
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
            name: 'cluster-without-proxy-but-available',
            labels: {
              'some.other.label': 'value',
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
            name: 'cluster-with-proxy-but-unavailable',
            labels: {
              'feature.open-cluster-management.io/addon-cluster-proxy': 'available',
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
          },
        },
      ] as any[]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterNames(true))

      expect(result.current).toEqual([
        [
          'cluster-with-proxy-and-available',
          'cluster-without-proxy-but-available',
          'cluster-with-proxy-but-unavailable',
          'cluster-without-labels-or-status',
        ],
        true,
        undefined,
      ])
    })

    it('should still filter out clusters without names', () => {
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
          // Cluster without metadata
        },
        {
          metadata: {
            // Cluster without name
            labels: {
              'some.label': 'value',
            },
          },
        },
        {
          metadata: {
            name: 'cluster-2',
          },
        },
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterNames(true))

      expect(result.current).toEqual([['cluster-1', 'cluster-2'], true, undefined])
    })

    it('should return empty array when no clusters have names', () => {
      const mockClusters = [
        {
          // Cluster without metadata
        },
        {
          metadata: {
            // Cluster without name
            labels: {
              'some.label': 'value',
            },
          },
        },
      ]

      mockUseK8sWatchResource.mockReturnValue([mockClusters, true, undefined])

      const { result } = renderHook(() => useFleetClusterNames(true))

      expect(result.current).toEqual([[], true, undefined])
    })

    it('should forward loading and error states correctly', () => {
      const mockError = new Error('Failed to load clusters')
      mockUseK8sWatchResource.mockReturnValue([[], false, mockError])

      const { result } = renderHook(() => useFleetClusterNames(true))

      expect(result.current).toEqual([[], false, mockError])
    })
  })
})
