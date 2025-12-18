/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../placement'
import { createResource } from '../utils'
import { createForClusters, createForClusterSets, useFindPlacements } from './placement-client'

jest.mock('../../shared-recoil', () => ({
  useRecoilValue: jest.fn(),
  useSharedAtoms: jest.fn(),
}))

jest.mock('../utils', () => ({
  createResource: jest.fn(),
}))

const createResourceMock = createResource as jest.MockedFunction<typeof createResource>

const useSharedAtomsMock = useSharedAtoms as jest.Mock
const useRecoilValueMock = useRecoilValue as jest.Mock

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
        name: 'placement-no-predicates',
        namespace: 'default',
      },
      spec: {},
    },
  ]

  beforeAll(() => {
    jest.clearAllMocks()
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

    it('should return all placements when placementNames is empty', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: [],
        })
      )

      // Assert - empty placementNames matches all placements
      expect(result.current).toHaveLength(mockPlacements.length)
    })

    it('should return all placements when no query filters are provided', () => {
      // Act
      const { result } = renderHook(() => useFindPlacements({}))

      // Assert - no filters means match all
      expect(result.current).toHaveLength(mockPlacements.length)
    })
  })

  describe('createForClusterSets', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should create a Placement with the provided cluster sets', () => {
      // Arrange
      const clusterSets = ['cluster-set-1', 'cluster-set-2']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSets)

      // Assert
      expect(createResourceMock).toHaveBeenCalledTimes(1)
      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'cluster-set-1-and-cluster-set-2',
          namespace: MulticlusterRoleAssignmentNamespace,
        },
        spec: {
          clusterSets,
          tolerations: [
            {
              key: 'cluster.open-cluster-management.io/unreachable',
              operator: 'Equal',
            },
            {
              key: 'cluster.open-cluster-management.io/unavailable',
              operator: 'Equal',
            },
          ],
        },
      })
    })

    it('should use default namespace when not provided', () => {
      // Arrange
      const clusterSets = ['test-set']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSets)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            namespace: MulticlusterRoleAssignmentNamespace,
          }),
        })
      )
    })

    it('should use custom namespace when provided', () => {
      // Arrange
      const clusterSets = ['custom-set']
      const namespace = 'custom-namespace'
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSets, namespace)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            namespace,
          }),
        })
      )
    })

    it('should join cluster set names with -and- for the placement name', () => {
      // Arrange
      const clusterSets = ['set-a', 'set-b', 'set-c']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSets)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: 'set-a-and-set-b-and-set-c',
          }),
        })
      )
    })

    it('should return the IRequestResult from createResource', () => {
      // Arrange
      const clusterSets = ['result-test']
      const expectedResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(expectedResult)

      // Act
      const result = createForClusterSets(clusterSets)

      // Assert
      expect(result).toBe(expectedResult)
    })

    it('should include tolerations for unreachable and unavailable clusters', () => {
      // Arrange
      const clusterSets = ['toleration-test']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSets)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            tolerations: [
              {
                key: 'cluster.open-cluster-management.io/unreachable',
                operator: 'Equal',
              },
              {
                key: 'cluster.open-cluster-management.io/unavailable',
                operator: 'Equal',
              },
            ],
          }),
        })
      )
    })
  })

  describe('createForClusters', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should create a Placement with predicates for the provided clusters', () => {
      // Arrange
      const clusters = ['cluster-1', 'cluster-2']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusters)

      // Assert
      expect(createResourceMock).toHaveBeenCalledTimes(1)
      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'clusters-cluster-1-and-cluster-2',
          namespace: MulticlusterRoleAssignmentNamespace,
        },
        spec: {
          predicates: [
            {
              requiredClusterSelector: {
                labelSelector: {
                  matchExpressions: [{ key: 'name', operator: 'In', values: clusters }],
                },
              },
            },
          ],
          tolerations: [
            {
              key: 'cluster.open-cluster-management.io/unreachable',
              operator: 'Equal',
            },
            {
              key: 'cluster.open-cluster-management.io/unavailable',
              operator: 'Equal',
            },
          ],
        },
      })
    })

    it('should use default namespace when not provided', () => {
      // Arrange
      const clusters = ['test-cluster']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusters)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            namespace: MulticlusterRoleAssignmentNamespace,
          }),
        })
      )
    })

    it('should use custom namespace when provided', () => {
      // Arrange
      const clusters = ['custom-cluster']
      const namespace = 'custom-namespace'
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusters, namespace)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            namespace,
          }),
        })
      )
    })

    it('should prefix placement name with clusters- and join with -and-', () => {
      // Arrange
      const clusters = ['alpha', 'beta', 'gamma']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusters)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: 'clusters-alpha-and-beta-and-gamma',
          }),
        })
      )
    })

    it('should return the IRequestResult from createResource', () => {
      // Arrange
      const clusters = ['result-test']
      const expectedResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(expectedResult)

      // Act
      const result = createForClusters(clusters)

      // Assert
      expect(result).toBe(expectedResult)
    })

    it('should include tolerations for unreachable and unavailable clusters', () => {
      // Arrange
      const clusters = ['toleration-test']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusters)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            tolerations: [
              {
                key: 'cluster.open-cluster-management.io/unreachable',
                operator: 'Equal',
              },
              {
                key: 'cluster.open-cluster-management.io/unavailable',
                operator: 'Equal',
              },
            ],
          }),
        })
      )
    })

    it('should create predicates with matchExpressions using In operator', () => {
      // Arrange
      const clusters = ['cluster-x']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusters)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          spec: expect.objectContaining({
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: clusters }],
                  },
                },
              },
            ],
          }),
        })
      )
    })
  })
})
