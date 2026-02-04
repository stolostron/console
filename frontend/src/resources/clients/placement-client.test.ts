/* Copyright Contributors to the Open Cluster Management project */
import { renderHook } from '@testing-library/react-hooks'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../placement'
import { MatchExpressions } from '../selector'
import { PlacementDecision } from '../placement-decision'
import { createResource } from '../utils'
import {
  createForClusters,
  createForClusterSets,
  doesPlacementContainsClusterName,
  doesPlacementContainsClusterSet,
  isPlacementForClusterNames,
  isPlacementForClusterSets,
  PlacementLabel,
  useGetPlacementClusters,
  useFindPlacements,
} from './placement-client'
import {
  doesPlacementContainsClusterNameTestCases,
  doesPlacementContainsClusterSetTestCases,
  isPlacementForClusterNamesTestCases,
  isPlacementForClusterSetsTestCases,
  producePlacementNameHashTestCases,
  producePlacementNameLengthTestCases,
  producePlacementNameLongListTestCases,
  producePlacementNameSuggestedTestCases,
  producePlacementNameUniqueTestCases,
  producePlacementNameValidTestCases,
} from './placement-client.fixtures'
import * as placementDecisionClient from './placement-decision-client'

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

    it('should filter by clusterNames and return placements with exact matching clusters', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          clusterNames: ['cluster-a', 'cluster-b'],
        })
      )

      // Assert - only placement-1 has exactly cluster-a and cluster-b
      expect(result.current).toHaveLength(1)
      expect(result.current[0].metadata.name).toBe('placement-1')
    })

    it('should return empty when clusterNames do not match exactly', () => {
      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          clusterNames: ['cluster-a'], // placement-1 has cluster-a and cluster-b
        })
      )

      // Assert - no exact match
      expect(result.current).toHaveLength(0)
    })

    it('should filter by clusterSetNames and return placements with exact matching cluster sets', () => {
      // Arrange - add a placement with clusterSets
      const placementsWithClusterSets: Placement[] = [
        ...mockPlacements,
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-with-sets', namespace: 'default' },
          spec: { clusterSets: ['set-1', 'set-2'] },
        },
      ]
      useRecoilValueMock.mockReturnValue(placementsWithClusterSets)

      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          clusterSetNames: ['set-1', 'set-2'],
        })
      )

      // Assert
      expect(result.current).toHaveLength(1)
      expect(result.current[0].metadata.name).toBe('placement-with-sets')
    })

    it('should return empty when clusterSetNames do not match exactly', () => {
      // Arrange
      const placementsWithClusterSets: Placement[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-with-sets', namespace: 'default' },
          spec: { clusterSets: ['set-1', 'set-2'] },
        },
      ]
      useRecoilValueMock.mockReturnValue(placementsWithClusterSets)

      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          clusterSetNames: ['set-1'], // only one of the two sets
        })
      )

      // Assert - no exact match
      expect(result.current).toHaveLength(0)
    })

    it('should use OR logic when logicalOperator is or', () => {
      // Arrange
      const placementsWithMixed: Placement[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-by-name', namespace: 'default' },
          spec: {},
        },
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-by-clusters', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-x'] }],
                  },
                },
              },
            ],
          },
        },
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-by-sets', namespace: 'default' },
          spec: { clusterSets: ['set-x'] },
        },
      ]
      useRecoilValueMock.mockReturnValue(placementsWithMixed)

      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: ['placement-by-name'],
          clusterNames: ['cluster-x'],
          clusterSetNames: ['set-x'],
          logicalOperator: 'or',
        })
      )

      // Assert - all three match via OR
      expect(result.current).toHaveLength(3)
    })

    it('should use AND logic by default', () => {
      // Arrange
      const placementsWithMixed: Placement[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-matching-all', namespace: 'default' },
          spec: {
            clusterSets: ['set-a'],
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-a'] }],
                  },
                },
              },
            ],
          },
        },
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-partial', namespace: 'default' },
          spec: { clusterSets: ['set-a'] }, // missing cluster predicates
        },
      ]
      useRecoilValueMock.mockReturnValue(placementsWithMixed)

      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          placementNames: ['placement-matching-all'],
          clusterNames: ['cluster-a'],
          clusterSetNames: ['set-a'],
        })
      )

      // Assert - only the one matching all criteria
      expect(result.current).toHaveLength(1)
      expect(result.current[0].metadata.name).toBe('placement-matching-all')
    })

    it('should handle placement with empty clusterSets array', () => {
      // Arrange
      const placementsWithEmptySets: Placement[] = [
        {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'empty-sets', namespace: 'default' },
          spec: { clusterSets: [] },
        },
      ]
      useRecoilValueMock.mockReturnValue(placementsWithEmptySets)

      // Act
      const { result } = renderHook(() =>
        useFindPlacements({
          clusterSetNames: ['some-set'],
        })
      )

      // Assert - empty clusterSets cannot match
      expect(result.current).toHaveLength(0)
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

      // Assert - name from producePlacementName with prefix 'cluster-sets-'
      expect(createResourceMock).toHaveBeenCalledTimes(1)
      expect(createResourceMock).toHaveBeenCalledWith({
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'cluster-sets-cluster-set-1-and-cluster-set-2',
          namespace: MulticlusterRoleAssignmentNamespace,
          labels: { ...PlacementLabel },
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

    it('should prefix placement name with cluster-sets- and join set names with -and-', () => {
      // Arrange
      const clusterSets = ['set-a', 'set-b', 'set-c']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusterSets(clusterSets)

      // Assert - name from producePlacementName with prefix 'cluster-sets-'
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: 'cluster-sets-set-a-and-set-b-and-set-c',
          }),
        })
      )
    })

    it('should include metadata.labels (PlacementLabel)', () => {
      // Arrange
      const clusterSets = ['label-test']
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
            labels: PlacementLabel,
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
          labels: { ...PlacementLabel },
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

    it('should include metadata.labels (PlacementLabel)', () => {
      // Arrange
      const clusters = ['label-test']
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
            labels: PlacementLabel,
          }),
        })
      )
    })
  })

  describe('useGetPlacementClusters', () => {
    const useFindPlacementDecisionsSpy = jest.spyOn(placementDecisionClient, 'useFindPlacementDecisions')
    const getClustersFromPlacementDecisionSpy = jest.spyOn(placementDecisionClient, 'getClustersFromPlacementDecision')

    beforeEach(() => {
      jest.clearAllMocks()
      useSharedAtomsMock.mockReturnValue({
        placementsState: {},
        placementDecisionsState: {},
      })
    })

    // Helper to create a placement with predicates
    const createPlacementWithPredicates = (
      name: string,
      clusterNames: string[],
      additionalMatchExpressions: MatchExpressions[] = []
    ): Placement => ({
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name, namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  { key: 'name', operator: 'In', values: clusterNames },
                  ...additionalMatchExpressions,
                ],
              },
            },
          },
        ],
      },
    })

    // Helper to create a placement decision
    const createPlacementDecision = (
      name: string,
      placementName: string,
      clusterNames: string[]
    ): PlacementDecision => ({
      apiVersion: 'cluster.open-cluster-management.io/v1beta1',
      kind: 'PlacementDecision',
      metadata: {
        name,
        namespace: 'default',
        ownerReferences: [
          {
            apiVersion: PlacementApiVersionBeta,
            kind: 'Placement',
            name: placementName,
            uid: `${placementName}-uid`,
          },
        ],
      },
      status: {
        decisions: clusterNames.map((clusterName) => ({ clusterName, reason: '' })),
      },
    })

    describe('getClusterFromPlacements logic (via useGetPlacementClusters)', () => {
      it('should extract cluster names from placement predicates with key=name', () => {
        // Arrange
        const placement = createPlacementWithPredicates('placement-with-clusters', ['cluster-a', 'cluster-b'])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['placement-with-clusters']))

        // Assert
        expect(result.current[0].clusters).toEqual(['cluster-a', 'cluster-b'])
        expect(result.current[0].placement).toBe(placement)
      })

      it('should return empty clusters array for placement without predicates', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'no-predicates', namespace: 'default' },
          spec: {},
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['no-predicates']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should return empty clusters array for placement with empty predicates array', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'empty-predicates', namespace: 'default' },
          spec: { predicates: [] },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['empty-predicates']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should ignore matchExpressions with key other than name', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'wrong-key', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [
                      { key: 'environment', operator: 'In', values: ['prod', 'dev'] },
                      { key: 'region', operator: 'In', values: ['us-east', 'us-west'] },
                    ],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['wrong-key']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should extract only values from matchExpressions with key=name', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'mixed-keys', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [
                      { key: 'environment', operator: 'In', values: ['prod'] },
                      { key: 'name', operator: 'In', values: ['cluster-x', 'cluster-y'] },
                      { key: 'region', operator: 'In', values: ['eu-west'] },
                    ],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['mixed-keys']))

        // Assert
        expect(result.current[0].clusters).toEqual(['cluster-x', 'cluster-y'])
      })

      it('should handle placement with no labelSelector', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'no-label-selector', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {},
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['no-label-selector']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should handle placement with no matchExpressions', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'no-match-expressions', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {},
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['no-match-expressions']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should handle placement with empty matchExpressions array', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'empty-match-expressions', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['empty-match-expressions']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should handle matchExpression with key=name but no values', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'no-values', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In' }],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['no-values']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should handle matchExpression with key=name but empty values array', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'empty-values', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: [] }],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['empty-values']))

        // Assert
        expect(result.current[0].clusters).toEqual([])
      })

      it('should filter out falsy values from matchExpression values', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'falsy-values', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [
                      {
                        key: 'name',
                        operator: 'In',
                        values: ['cluster-a', '', 'cluster-b', undefined as unknown as string],
                      },
                    ],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['falsy-values']))

        // Assert
        expect(result.current[0].clusters).toEqual(['cluster-a', 'cluster-b'])
      })

      it('should deduplicate cluster names from predicates', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'duplicates', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [
                      { key: 'name', operator: 'In', values: ['cluster-a', 'cluster-b'] },
                      { key: 'name', operator: 'In', values: ['cluster-b', 'cluster-c'] },
                    ],
                  },
                },
              },
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-a', 'cluster-d'] }],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['duplicates']))

        // Assert
        expect(result.current[0].clusters).toEqual(['cluster-a', 'cluster-b', 'cluster-c', 'cluster-d'])
      })

      it('should handle multiple predicates each with their own matchExpressions', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'multi-predicates', namespace: 'default' },
          spec: {
            predicates: [
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-1'] }],
                  },
                },
              },
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-2'] }],
                  },
                },
              },
              {
                requiredClusterSelector: {
                  labelSelector: {
                    matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-3'] }],
                  },
                },
              },
            ],
          },
        }
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['multi-predicates']))

        // Assert
        expect(result.current[0].clusters).toEqual(['cluster-1', 'cluster-2', 'cluster-3'])
      })
    })

    describe('PlacementDecision integration', () => {
      it('should combine clusters from predicates and PlacementDecision', () => {
        // Arrange
        const placement = createPlacementWithPredicates('combined', ['cluster-from-predicate'])
        const placementDecision = createPlacementDecision('decision-1', 'combined', ['cluster-from-decision'])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([placementDecision])
        getClustersFromPlacementDecisionSpy.mockReturnValue(['cluster-from-decision'])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['combined']))

        // Assert
        expect(result.current[0].clusters).toEqual(
          expect.arrayContaining(['cluster-from-predicate', 'cluster-from-decision'])
        )
        expect(result.current[0].clusters).toHaveLength(2)
      })

      it('should deduplicate clusters from predicates and PlacementDecision', () => {
        // Arrange
        const placement = createPlacementWithPredicates('dedupe-combined', ['shared-cluster', 'predicate-only'])
        const placementDecision = createPlacementDecision('decision-2', 'dedupe-combined', [
          'shared-cluster',
          'decision-only',
        ])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([placementDecision])
        getClustersFromPlacementDecisionSpy.mockReturnValue(['shared-cluster', 'decision-only'])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['dedupe-combined']))

        // Assert
        expect(result.current[0].clusters).toEqual(
          expect.arrayContaining(['shared-cluster', 'predicate-only', 'decision-only'])
        )
        expect(result.current[0].clusters).toHaveLength(3)
      })

      it('should handle PlacementDecision without matching Placement', () => {
        // Arrange
        const placement = createPlacementWithPredicates('orphan-test', ['cluster-a'])
        const placementDecision = createPlacementDecision('orphan-decision', 'different-placement', ['cluster-b'])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([placementDecision])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['orphan-test']))

        // Assert - only clusters from predicate, not from orphan decision
        expect(result.current[0].clusters).toEqual(['cluster-a'])
      })

      it('should use PlacementDecision clusters when placement has no predicates', () => {
        // Arrange
        const placement: Placement = {
          apiVersion: PlacementApiVersionBeta,
          kind: PlacementKind,
          metadata: { name: 'decision-only-clusters', namespace: 'default' },
          spec: {},
        }
        const placementDecision = createPlacementDecision('decision-3', 'decision-only-clusters', [
          'decision-cluster-1',
          'decision-cluster-2',
        ])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([placementDecision])
        getClustersFromPlacementDecisionSpy.mockReturnValue(['decision-cluster-1', 'decision-cluster-2'])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['decision-only-clusters']))

        // Assert
        expect(result.current[0].clusters).toEqual(['decision-cluster-1', 'decision-cluster-2'])
      })
    })

    describe('multiple placements', () => {
      it('should return array with entries for each requested placement', () => {
        // Arrange
        const placement1 = createPlacementWithPredicates('placement-a', ['cluster-1'])
        const placement2 = createPlacementWithPredicates('placement-b', ['cluster-2'])
        const placement3 = createPlacementWithPredicates('placement-c', ['cluster-3'])
        useRecoilValueMock.mockReturnValue([placement1, placement2, placement3])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['placement-a', 'placement-b', 'placement-c']))

        // Assert
        expect(result.current).toHaveLength(3)
        expect(result.current[0].placement.metadata.name).toBe('placement-a')
        expect(result.current[0].clusters).toEqual(['cluster-1'])
        expect(result.current[1].placement.metadata.name).toBe('placement-b')
        expect(result.current[1].clusters).toEqual(['cluster-2'])
        expect(result.current[2].placement.metadata.name).toBe('placement-c')
        expect(result.current[2].clusters).toEqual(['cluster-3'])
      })

      it('should return empty array when no placements match', () => {
        // Arrange
        useRecoilValueMock.mockReturnValue([])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['nonexistent']))

        // Assert
        expect(result.current).toEqual([])
      })

      it('should associate correct PlacementDecisions with each Placement', () => {
        // Arrange
        const placement1 = createPlacementWithPredicates('p1', [])
        const placement2 = createPlacementWithPredicates('p2', [])
        const decision1 = createPlacementDecision('d1', 'p1', ['c1'])
        const decision2 = createPlacementDecision('d2', 'p2', ['c2'])
        useRecoilValueMock.mockReturnValue([placement1, placement2])
        useFindPlacementDecisionsSpy.mockReturnValue([decision1, decision2])
        getClustersFromPlacementDecisionSpy.mockImplementation((decision: PlacementDecision) => {
          if (decision.metadata.name === 'd1') return ['c1']
          if (decision.metadata.name === 'd2') return ['c2']
          return []
        })

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(['p1', 'p2']))

        // Assert
        const p1Entry = result.current.find((e) => e.placement.metadata.name === 'p1')
        const p2Entry = result.current.find((e) => e.placement.metadata.name === 'p2')
        expect(p1Entry?.clusters).toEqual(['c1'])
        expect(p2Entry?.clusters).toEqual(['c2'])
      })

      it('should return all placements when called without arguments', () => {
        // Arrange
        const placement1 = createPlacementWithPredicates('placement-a', ['cluster-1'])
        const placement2 = createPlacementWithPredicates('placement-b', ['cluster-2'])
        const placement3 = createPlacementWithPredicates('placement-c', ['cluster-3'])
        useRecoilValueMock.mockReturnValue([placement1, placement2, placement3])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters())

        // Assert
        expect(result.current).toHaveLength(3)
        expect(result.current[0].placement.metadata.name).toBe('placement-a')
        expect(result.current[1].placement.metadata.name).toBe('placement-b')
        expect(result.current[2].placement.metadata.name).toBe('placement-c')
      })

      it('should return all placements when called with undefined', () => {
        // Arrange
        const placement1 = createPlacementWithPredicates('p1', ['c1'])
        const placement2 = createPlacementWithPredicates('p2', ['c2'])
        useRecoilValueMock.mockReturnValue([placement1, placement2])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetPlacementClusters(undefined))

        // Assert
        expect(result.current).toHaveLength(2)
      })
    })
  })

  describe('isPlacementForClusterSets', () => {
    it.each(isPlacementForClusterSetsTestCases)('$description', ({ placement, expected }) => {
      expect(isPlacementForClusterSets(placement)).toBe(expected)
    })
  })

  describe('isPlacementForClusterNames', () => {
    it.each(isPlacementForClusterNamesTestCases)('$description', ({ placement, expected }) => {
      expect(isPlacementForClusterNames(placement)).toBe(expected)
    })
  })

  describe('doesPlacementContainsClusterName', () => {
    it.each(doesPlacementContainsClusterNameTestCases)('$description', ({ placement, clusterName, expected }) => {
      expect(doesPlacementContainsClusterName(placement, clusterName)).toBe(expected)
    })
  })

  describe('doesPlacementContainsClusterSet', () => {
    it.each(doesPlacementContainsClusterSetTestCases)('$description', ({ placement, clusterSetName, expected }) => {
      expect(doesPlacementContainsClusterSet(placement, clusterSetName)).toBe(expected)
    })
  })

  describe('producePlacementName (via createForClusters)', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return suggestedName when length is less than 63', () => {
      // Arrange
      const clusterNames = ['cluster-1', 'cluster-2']
      const expected = 'clusters-cluster-1-and-cluster-2'
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: expected,
          }),
        })
      )
      expect(expected.length).toBeLessThan(63)
    })

    it('should return suggestedName when length equals 63', () => {
      // Arrange - create cluster name that results in exactly 63 characters
      // 'clusters-' = 9 chars, so we need 54 chars for the cluster name part
      // Single cluster name of 54 characters will make total = 63
      const clusterName = 'a'.repeat(54)
      const clusterNames = [clusterName]
      const expected = `clusters-${clusterName}`
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: expected,
          }),
        })
      )
      expect(expected.length).toBe(63)
    })

    it('should return hash-based name when suggestedName length is greater than 63', () => {
      // Arrange - create cluster names that exceed 63 characters
      const longClusterName = 'a'.repeat(100)
      const clusterNames = [longClusterName, 'another-long-cluster-name']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames)

      // Assert
      const placementCall = createResourceMock.mock.calls[0][0] as Placement
      expect(placementCall.metadata.name!.length).toBe(63)
      expect(placementCall.metadata.name!).toMatch(/^clusters-[a-f0-9]+$/)
      expect(placementCall.metadata.name!).not.toContain(longClusterName)
    })

    it.each(producePlacementNameLengthTestCases)(
      'should never produce a string longer than 63 characters for $description',
      ({ clusterNames }) => {
        // Arrange
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        // Act
        createForClusters(clusterNames)

        // Assert
        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
      }
    )

    it.each(producePlacementNameValidTestCases)('should produce a valid name for $description', ({ clusterNames }) => {
      // Arrange
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames)

      // Assert
      const placementCall = createResourceMock.mock.calls[0][0] as Placement
      expect(placementCall.metadata.name).toBeDefined()
      expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
      expect(placementCall.metadata.name!).toMatch(/^clusters-/)
    })

    it('should produce unique names for different cluster name lists', () => {
      // Arrange
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      producePlacementNameUniqueTestCases.forEach(({ clusterNames }) => {
        createForClusters(clusterNames)
      })

      // Assert - all should be unique
      const names = createResourceMock.mock.calls.map((call) => (call[0] as Placement).metadata.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should produce the same name for the same cluster name list', () => {
      // Arrange
      const clusterNames = ['cluster-1', 'cluster-2', 'cluster-3']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act - call twice with the same cluster names
      createForClusters(clusterNames)
      createForClusters(clusterNames)

      // Assert - both calls should produce the same name
      const name1 = (createResourceMock.mock.calls[0][0] as Placement).metadata.name
      const name2 = (createResourceMock.mock.calls[1][0] as Placement).metadata.name
      expect(name1).toBe(name2)
    })

    it('should handle empty cluster names array', () => {
      // Arrange
      const clusterNames: string[] = []
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames)

      // Assert
      const placementCall = createResourceMock.mock.calls[0][0] as Placement
      expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
      expect(placementCall.metadata.name!).toMatch(/^clusters-/)
    })

    it('should handle single cluster name', () => {
      // Arrange
      const clusterNames = ['single-cluster']
      const expected = 'clusters-single-cluster'
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames)

      // Assert
      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: expected,
          }),
        })
      )
      expect(expected.length).toBeLessThanOrEqual(63)
    })

    it.each(producePlacementNameHashTestCases)(
      'should produce hash when many short cluster names exceed 63 characters for $description',
      ({ clusterNames }) => {
        // Arrange
        const suggestedName = `clusters-${clusterNames.join('-and-')}`
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        // Act
        createForClusters(clusterNames)

        // Assert
        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
        expect(placementCall.metadata.name!).toMatch(/^clusters-[a-f0-9]+$/)
        expect(placementCall.metadata.name!).not.toBe(suggestedName)
      }
    )

    it.each(producePlacementNameSuggestedTestCases)(
      'should produce suggestedName when many short cluster names do not exceed 63 characters for $description',
      ({ clusterNames }) => {
        // Arrange
        const suggestedName = `clusters-${clusterNames.join('-and-')}`
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        // Act
        createForClusters(clusterNames)

        // Assert
        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name).toBe(suggestedName)
      }
    )

    it.each(producePlacementNameLongListTestCases)(
      'should produce hash-based name for long cluster name list: $description',
      ({ clusterNames }) => {
        // Arrange - create long cluster names that definitely exceed 63
        // 'clusters-' = 9, so we need cluster names that when joined exceed 54 chars
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        // Act
        createForClusters(clusterNames)

        // Assert
        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        const name = placementCall.metadata.name!
        expect(name.length).toBeLessThanOrEqual(63)
        expect(name).toMatch(/^clusters-[a-f0-9]+$/)
      }
    )

    it('should ensure hash-based names are unique for different long cluster name lists', () => {
      // Arrange - create two different sets of long cluster names that definitely exceed 63
      // 'clusters-' = 9, so we need cluster names that when joined exceed 54 chars
      const clusterNames1 = ['a'.repeat(30), 'b'.repeat(30)]
      const clusterNames2 = ['c'.repeat(30), 'd'.repeat(30)]
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      // Act
      createForClusters(clusterNames1)
      createForClusters(clusterNames2)

      // Assert
      const placement1 = createResourceMock.mock.calls[0][0] as Placement
      const placement2 = createResourceMock.mock.calls[1][0] as Placement
      const name1 = placement1.metadata.name!
      const name2 = placement2.metadata.name!
      expect(name1.length).toBeLessThanOrEqual(63)
      expect(name2.length).toBeLessThanOrEqual(63)
      expect(name1).not.toBe(name2)
      expect(name1).toMatch(/^clusters-[a-f0-9]+$/)
      expect(name2).toMatch(/^clusters-[a-f0-9]+$/)
    })
  })

  describe('producePlacementName (via createForClusterSets)', () => {
    beforeEach(() => {
      jest.clearAllMocks()
    })

    it('should return suggestedName when length is less than 63', () => {
      const clusterSets = ['set-1', 'set-2']
      const expected = 'cluster-sets-set-1-and-set-2'
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSets)

      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: expected,
          }),
        })
      )
      expect(expected.length).toBeLessThan(63)
    })

    it('should return suggestedName when length equals 63', () => {
      // 'cluster-sets-' = 13 chars, so we need 50 chars for the set name to get total 63
      const clusterSetName = 'a'.repeat(50)
      const clusterSets = [clusterSetName]
      const expected = `cluster-sets-${clusterSetName}`
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSets)

      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: expected,
          }),
        })
      )
      expect(expected.length).toBe(63)
    })

    it('should return hash-based name when suggestedName length is greater than 63', () => {
      const longName = 'a'.repeat(100)
      const clusterSets = [longName, 'another-long-set-name']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSets)

      const placementCall = createResourceMock.mock.calls[0][0] as Placement
      expect(placementCall.metadata.name!.length).toBe(63)
      expect(placementCall.metadata.name!).toMatch(/^cluster-sets-[a-f0-9]+$/)
      expect(placementCall.metadata.name!).not.toContain(longName)
    })

    it.each(producePlacementNameLengthTestCases)(
      'should never produce a string longer than 63 characters for $description',
      ({ clusterNames: clusterSetNames }) => {
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        createForClusterSets(clusterSetNames)

        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
      }
    )

    it.each(producePlacementNameValidTestCases)(
      'should produce a valid name for $description',
      ({ clusterNames: clusterSetNames }) => {
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        createForClusterSets(clusterSetNames)

        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name).toBeDefined()
        expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
        expect(placementCall.metadata.name!).toMatch(/^cluster-sets-/)
      }
    )

    it('should produce unique names for different cluster set name lists', () => {
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      producePlacementNameUniqueTestCases.forEach(({ clusterNames: clusterSetNames }) => {
        createForClusterSets(clusterSetNames)
      })

      const names = createResourceMock.mock.calls.map((call) => (call[0] as Placement).metadata.name)
      const uniqueNames = new Set(names)
      expect(uniqueNames.size).toBe(names.length)
    })

    it('should produce the same name for the same cluster set name list', () => {
      const clusterSets = ['set-1', 'set-2', 'set-3']
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSets)
      createForClusterSets(clusterSets)

      const name1 = (createResourceMock.mock.calls[0][0] as Placement).metadata.name
      const name2 = (createResourceMock.mock.calls[1][0] as Placement).metadata.name
      expect(name1).toBe(name2)
    })

    it('should handle empty cluster set names array', () => {
      const clusterSets: string[] = []
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSets)

      const placementCall = createResourceMock.mock.calls[0][0] as Placement
      expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
      expect(placementCall.metadata.name!).toMatch(/^cluster-sets-/)
    })

    it('should handle single cluster set name', () => {
      const clusterSets = ['single-set']
      const expected = 'cluster-sets-single-set'
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSets)

      expect(createResourceMock).toHaveBeenCalledWith(
        expect.objectContaining({
          metadata: expect.objectContaining({
            name: expected,
          }),
        })
      )
      expect(expected.length).toBeLessThanOrEqual(63)
    })

    it.each(producePlacementNameHashTestCases)(
      'should produce hash when many short cluster set names exceed 63 characters for $description',
      ({ clusterNames: clusterSetNames }) => {
        const suggestedName = `cluster-sets-${clusterSetNames.join('-and-')}`
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        createForClusterSets(clusterSetNames)

        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name!.length).toBeLessThanOrEqual(63)
        expect(placementCall.metadata.name!).toMatch(/^cluster-sets-[a-f0-9]+$/)
        expect(placementCall.metadata.name!).not.toBe(suggestedName)
      }
    )

    it.each(producePlacementNameSuggestedTestCases)(
      'should produce suggestedName when many short cluster set names do not exceed 63 characters for $description',
      ({ clusterNames: clusterSetNames }) => {
        const suggestedName = `cluster-sets-${clusterSetNames.join('-and-')}`
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        createForClusterSets(clusterSetNames)

        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        expect(placementCall.metadata.name).toBe(suggestedName)
      }
    )

    it.each(producePlacementNameLongListTestCases)(
      'should produce hash-based name for long cluster set name list: $description',
      ({ clusterNames: clusterSetNames }) => {
        const mockResult = {
          promise: Promise.resolve({} as Placement),
          abort: jest.fn(),
        }
        createResourceMock.mockReturnValue(mockResult)

        createForClusterSets(clusterSetNames)

        const placementCall = createResourceMock.mock.calls[0][0] as Placement
        const name = placementCall.metadata.name!
        expect(name.length).toBeLessThanOrEqual(63)
        expect(name).toMatch(/^cluster-sets-[a-f0-9]+$/)
      }
    )

    it('should ensure hash-based names are unique for different long cluster set name lists', () => {
      const clusterSetNames1 = ['a'.repeat(30), 'b'.repeat(30)]
      const clusterSetNames2 = ['c'.repeat(30), 'd'.repeat(30)]
      const mockResult = {
        promise: Promise.resolve({} as Placement),
        abort: jest.fn(),
      }
      createResourceMock.mockReturnValue(mockResult)

      createForClusterSets(clusterSetNames1)
      createForClusterSets(clusterSetNames2)

      const placement1 = createResourceMock.mock.calls[0][0] as Placement
      const placement2 = createResourceMock.mock.calls[1][0] as Placement
      const name1 = placement1.metadata.name!
      const name2 = placement2.metadata.name!
      expect(name1.length).toBeLessThanOrEqual(63)
      expect(name2.length).toBeLessThanOrEqual(63)
      expect(name1).not.toBe(name2)
      expect(name1).toMatch(/^cluster-sets-[a-f0-9]+$/)
      expect(name2).toMatch(/^cluster-sets-[a-f0-9]+$/)
    })
  })
})
