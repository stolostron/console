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
  useGetClustersForPlacementMap,
  useFindPlacements,
} from './placement-client'
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

  describe('useGetClustersForPlacementMap', () => {
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

    describe('getClusterFromPlacements logic (via useGetClustersForPlacementMap)', () => {
      it('should extract cluster names from placement predicates with key=name', () => {
        // Arrange
        const placement = createPlacementWithPredicates('placement-with-clusters', ['cluster-a', 'cluster-b'])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetClustersForPlacementMap(['placement-with-clusters']))

        // Assert
        expect(result.current['placement-with-clusters'].clusters).toEqual(['cluster-a', 'cluster-b'])
        expect(result.current['placement-with-clusters'].placement).toBe(placement)
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['no-predicates']))

        // Assert
        expect(result.current['no-predicates'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['empty-predicates']))

        // Assert
        expect(result.current['empty-predicates'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['wrong-key']))

        // Assert
        expect(result.current['wrong-key'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['mixed-keys']))

        // Assert
        expect(result.current['mixed-keys'].clusters).toEqual(['cluster-x', 'cluster-y'])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['no-label-selector']))

        // Assert
        expect(result.current['no-label-selector'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['no-match-expressions']))

        // Assert
        expect(result.current['no-match-expressions'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['empty-match-expressions']))

        // Assert
        expect(result.current['empty-match-expressions'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['no-values']))

        // Assert
        expect(result.current['no-values'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['empty-values']))

        // Assert
        expect(result.current['empty-values'].clusters).toEqual([])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['falsy-values']))

        // Assert
        expect(result.current['falsy-values'].clusters).toEqual(['cluster-a', 'cluster-b'])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['duplicates']))

        // Assert
        expect(result.current['duplicates'].clusters).toEqual(['cluster-a', 'cluster-b', 'cluster-c', 'cluster-d'])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['multi-predicates']))

        // Assert
        expect(result.current['multi-predicates'].clusters).toEqual(['cluster-1', 'cluster-2', 'cluster-3'])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['combined']))

        // Assert
        expect(result.current['combined'].clusters).toEqual(
          expect.arrayContaining(['cluster-from-predicate', 'cluster-from-decision'])
        )
        expect(result.current['combined'].clusters).toHaveLength(2)
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['dedupe-combined']))

        // Assert
        expect(result.current['dedupe-combined'].clusters).toEqual(
          expect.arrayContaining(['shared-cluster', 'predicate-only', 'decision-only'])
        )
        expect(result.current['dedupe-combined'].clusters).toHaveLength(3)
      })

      it('should handle PlacementDecision without matching Placement', () => {
        // Arrange
        const placement = createPlacementWithPredicates('orphan-test', ['cluster-a'])
        const placementDecision = createPlacementDecision('orphan-decision', 'different-placement', ['cluster-b'])
        useRecoilValueMock.mockReturnValue([placement])
        useFindPlacementDecisionsSpy.mockReturnValue([placementDecision])

        // Act
        const { result } = renderHook(() => useGetClustersForPlacementMap(['orphan-test']))

        // Assert - only clusters from predicate, not from orphan decision
        expect(result.current['orphan-test'].clusters).toEqual(['cluster-a'])
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['decision-only-clusters']))

        // Assert
        expect(result.current['decision-only-clusters'].clusters).toEqual(['decision-cluster-1', 'decision-cluster-2'])
      })
    })

    describe('multiple placements', () => {
      it('should return map with entries for each requested placement', () => {
        // Arrange
        const placement1 = createPlacementWithPredicates('placement-a', ['cluster-1'])
        const placement2 = createPlacementWithPredicates('placement-b', ['cluster-2'])
        const placement3 = createPlacementWithPredicates('placement-c', ['cluster-3'])
        useRecoilValueMock.mockReturnValue([placement1, placement2, placement3])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() =>
          useGetClustersForPlacementMap(['placement-a', 'placement-b', 'placement-c'])
        )

        // Assert
        expect(Object.keys(result.current)).toEqual(['placement-a', 'placement-b', 'placement-c'])
        expect(result.current['placement-a'].clusters).toEqual(['cluster-1'])
        expect(result.current['placement-b'].clusters).toEqual(['cluster-2'])
        expect(result.current['placement-c'].clusters).toEqual(['cluster-3'])
      })

      it('should return empty map when no placements match', () => {
        // Arrange
        useRecoilValueMock.mockReturnValue([])
        useFindPlacementDecisionsSpy.mockReturnValue([])

        // Act
        const { result } = renderHook(() => useGetClustersForPlacementMap(['nonexistent']))

        // Assert
        expect(result.current).toEqual({})
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
        const { result } = renderHook(() => useGetClustersForPlacementMap(['p1', 'p2']))

        // Assert
        expect(result.current['p1'].clusters).toEqual(['c1'])
        expect(result.current['p2'].clusters).toEqual(['c2'])
      })
    })
  })
})
