/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { PlacementDecision } from '../placement-decision'
import { useFindPlacementDecisions, useGetClustersFromPlacementDecision } from './placement-decision-client'

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock

describe('placement-decision-client', () => {
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
          { clusterName: 'cluster-a', reason: 'Matched' },
          { clusterName: 'cluster-b', reason: 'Matched' },
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
        decisions: [
          { clusterName: 'cluster-c', reason: 'Matched' },
          { clusterName: 'cluster-d', reason: 'Matched' },
        ],
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'PlacementDecision',
      metadata: {
        name: 'placement-decision-3',
        namespace: 'production',
        ownerReferences: [
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            name: 'placement-1',
            uid: 'uid-3',
          },
        ],
      },
      status: {
        decisions: [{ clusterName: 'cluster-e', reason: 'Matched' }],
      },
    },
    {
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'PlacementDecision',
      metadata: {
        name: 'placement-decision-no-status',
        namespace: 'default',
        ownerReferences: [
          {
            apiVersion: 'cluster.open-cluster-management.io/v1beta1',
            kind: 'Placement',
            name: 'placement-3',
            uid: 'uid-4',
          },
        ],
      },
    },
  ]

  beforeAll(() => {
    jest.clearAllMocks()
  })

  beforeEach(() => {
    useSharedAtomsMock.mockReturnValue({ placementDecisionsState: {} })
    useRecoilValueMock.mockReturnValue(mockPlacementDecisions)
  })

  describe('useFindPlacementDecisions', () => {
    it('should return placement decisions matching by name', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          names: ['placement-decision-1'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(1)
      expect(result.current[0].metadata.name).toBe('placement-decision-1')
    })

    it('should return placement decisions matching by multiple names', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          names: ['placement-decision-1', 'placement-decision-2'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current.map((pd) => pd.metadata.name)).toEqual(['placement-decision-1', 'placement-decision-2'])
    })

    it('should return placement decisions matching by placement name', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current.map((pd) => pd.metadata.name)).toEqual(['placement-decision-1', 'placement-decision-3'])
    })

    it('should return placement decisions matching by multiple placement names', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          placementNames: ['placement-1', 'placement-2'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(3)
    })

    it('should return placement decisions when matching either name or placement name', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          names: ['placement-decision-1'],
          placementNames: ['placement-2'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current.map((pd) => pd.metadata.name)).toEqual(['placement-decision-1', 'placement-decision-2'])
    })

    it('should return empty array when no matches found', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          names: ['nonexistent'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return empty array when empty query is provided', () => {
      // Act
      const { result } = renderHook(() => useFindPlacementDecisions({}))

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return empty array when names array is empty', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacementDecisions({
          names: [],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })
  })

  describe('useGetClustersFromPlacementDecision', () => {
    it('should return clusters from placement decisions matching by placement name', () => {
      // Act
      const { result } = renderHook(() =>
        useGetClustersFromPlacementDecision({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(3)
      expect(result.current).toContain('cluster-a')
      expect(result.current).toContain('cluster-b')
      expect(result.current).toContain('cluster-e')
    })

    it('should return unique cluster names across multiple placement decisions', () => {
      // Arrange
      useRecoilValueMock.mockReturnValue([
        ...mockPlacementDecisions,
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'PlacementDecision',
          metadata: {
            name: 'placement-decision-duplicate',
            namespace: 'default',
            ownerReferences: [
              {
                apiVersion: 'cluster.open-cluster-management.io/v1beta1',
                kind: 'Placement',
                name: 'placement-1',
                uid: 'uid-5',
              },
            ],
          },
          status: {
            decisions: [
              { clusterName: 'cluster-a', reason: 'Matched' }, // duplicate
              { clusterName: 'cluster-f', reason: 'Matched' },
            ],
          },
        },
      ])

      // Act
      const { result } = renderHook(() =>
        useGetClustersFromPlacementDecision({
          placementNames: ['placement-1'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(4)
      expect(result.current).toContain('cluster-a')
      expect(result.current).toContain('cluster-b')
      expect(result.current).toContain('cluster-e')
      expect(result.current).toContain('cluster-f')
    })

    it('should return empty array when placement decision has no status', () => {
      // Act
      const { result } = renderHook(() =>
        useGetClustersFromPlacementDecision({
          placementNames: ['placement-3'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return empty array when no placement decisions match', () => {
      // Act
      const { result } = renderHook(() =>
        useGetClustersFromPlacementDecision({
          placementNames: ['nonexistent'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(0)
    })

    it('should return clusters from placement decisions matching by name', () => {
      // Act
      const { result } = renderHook(() =>
        useGetClustersFromPlacementDecision({
          names: ['placement-decision-2'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(2)
      expect(result.current).toContain('cluster-c')
      expect(result.current).toContain('cluster-d')
    })
  })
})
