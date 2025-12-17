/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useAllClusters } from '../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { Placement } from '../placement'
import { PlacementDecision } from '../placement-decision'
import { useFindPlacements, useGetClustersForPlacement } from './placement-client'

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../../routes/Infrastructure/Clusters/ManagedClusters/components/useAllClusters', () => ({
  useAllClusters: jest.fn(),
}))

const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock
const useAllClustersMock = useAllClusters as jest.Mock

describe('placement-client', () => {
  const mockPlacements: Placement[] = [
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'placement-1',
        namespace: 'default',
      },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'name',
                    operator: 'In',
                    values: ['cluster-a', 'cluster-b'],
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'placement-2',
        namespace: 'default',
      },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'name',
                    operator: 'In',
                    values: ['cluster-c'],
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'global',
        namespace: 'default',
      },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  {
                    key: 'name',
                    operator: 'In',
                    values: ['cluster-x'],
                  },
                ],
              },
            },
          },
        ],
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'Placement',
      metadata: {
        name: 'placement-no-predicates',
        namespace: 'default',
      },
      spec: {},
    },
  ]

  const mockPlacementDecisions: PlacementDecision[] = [
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'PlacementDecision',
      metadata: {
        name: 'placement-decision-1',
        namespace: 'default',
        ownerReferences: [
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            name: 'placement-1',
            uid: 'uid-1',
          },
        ],
      },
      status: {
        decisions: [
          { clusterName: 'cluster-d', reason: 'Matched' },
          { clusterName: 'cluster-e', reason: 'Matched' },
        ],
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'PlacementDecision',
      metadata: {
        name: 'placement-decision-2',
        namespace: 'default',
        ownerReferences: [
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            name: 'placement-2',
            uid: 'uid-2',
          },
        ],
      },
      status: {
        decisions: [{ clusterName: 'cluster-f', reason: 'Matched' }],
      },
    },
  ]

  const mockAllClusters = [{ name: 'global-cluster-1' }, { name: 'global-cluster-2' }, { name: 'global-cluster-3' }]

  beforeAll(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    useAllClustersMock.mockReturnValue(mockAllClusters)
  })

  describe('useFindPlacements', () => {
    beforeEach(() => {
      useSharedAtomsMock.mockReturnValue({ placementsState: {} })
      useRecoilValueMock.mockReturnValue(mockPlacements)
    })

    it('should return placements matching by name', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(1)
      expect(result.current[0].metadata.name).toBe('placement-1')
    })

    it('should return placements matching by multiple names', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: ['placement-1', 'placement-2'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current.map((p) => p.metadata.name)).toEqual(['placement-1', 'placement-2'])
    })

    it('should return empty array when no matches found', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: ['nonexistent'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return empty array when placementNames is empty', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: [],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return empty array when no query filters are provided', () => {
      // Act
      const { result } = renderHook(() => useFindPlacements({}))

      // Assert
      expect(result.current).toHaveLength(0)
    })
  })

  describe('useGetClustersForPlacement', () => {
    beforeEach(() => {
      useSharedAtomsMock.mockReturnValue({ placementsState: {}, placementDecisionsState: {} })
    })

    it('should return clusters from placement predicates', () => {
      // Arrange
      useRecoilValueMock.mockReset()
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce([])

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      expect(result.current).toContain('cluster-a')
      expect(result.current).toContain('cluster-b')
    })

    it('should return all global clusters when placement name is global', () => {
      // Arrange
      useRecoilValueMock.mockReset()
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce([])

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['global'],
        })
      )

      // Assert
      expect(result.current).toContain('global-cluster-1')
      expect(result.current).toContain('global-cluster-2')
      expect(result.current).toContain('global-cluster-3')
    })

    it('should combine clusters from placements and placement decisions', () => {
      // Arrange
      useRecoilValueMock.mockReset()
      // useGetClustersForPlacement calls:
      //   1. useFindPlacements -> useRecoilValue(placementsState)
      //   2. useGetClustersFromPlacementDecision -> useFindPlacementDecisions -> useRecoilValue(placementDecisionsState)
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce(mockPlacementDecisions)

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      // From predicates
      expect(result.current).toContain('cluster-a')
      expect(result.current).toContain('cluster-b')
      // From placement decisions
      expect(result.current).toContain('cluster-d')
      expect(result.current).toContain('cluster-e')
    })

    it('should return unique cluster names', () => {
      // Arrange
      const placementDecisionsWithDuplicates: PlacementDecision[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'PlacementDecision',
          metadata: {
            name: 'placement-decision-1',
            namespace: 'default',
            ownerReferences: [
              {
                apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                kind: 'Placement',
                name: 'placement-1',
                uid: 'uid-1',
              },
            ],
          },
          status: {
            decisions: [
              { clusterName: 'cluster-a', reason: 'Matched' }, // duplicate with predicates
              { clusterName: 'cluster-f', reason: 'Matched' },
            ],
          },
        },
      ]

      useRecoilValueMock.mockReset()
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce(placementDecisionsWithDuplicates)

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      const clusterACount = result.current.filter((c) => c === 'cluster-a').length
      expect(clusterACount).toBe(1)
    })

    it('should return empty array when placement has no predicates', () => {
      // Arrange
      useRecoilValueMock.mockReset()
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce([])

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['placement-no-predicates'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return empty array when no placements match', () => {
      // Arrange
      useRecoilValueMock.mockReset()
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce([])

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['nonexistent'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should handle multiple placements', () => {
      // Arrange
      useRecoilValueMock.mockReset()
      useRecoilValueMock.mockReturnValueOnce(mockPlacements).mockReturnValueOnce(mockPlacementDecisions)

      // Act
      const { result } = renderHook(() =>
        useGetClustersForPlacement({
          placementNames: ['placement-1', 'placement-2'],
        })
      )

      // Assert
      // From placement-1 predicates
      expect(result.current).toContain('cluster-a')
      expect(result.current).toContain('cluster-b')
      // From placement-2 predicates
      expect(result.current).toContain('cluster-c')
      // From placement decisions
      expect(result.current).toContain('cluster-d')
      expect(result.current).toContain('cluster-e')
      expect(result.current).toContain('cluster-f')
    })
  })
})
