/* Copyright Contributors to the Open Cluster Management project */
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../placement'

/**
 * Test case fixture for isPlacementForClusterSets
 */
export interface IsPlacementForClusterSetsTestCase {
  description: string
  placement: Placement
  expected: boolean
}

/**
 * Test cases for isPlacementForClusterSets function
 */
export const isPlacementForClusterSetsTestCases: IsPlacementForClusterSetsTestCase[] = [
  {
    description: 'should return true when placement has clusterSets with one element',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p1', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-1'] },
    },
    expected: true,
  },
  {
    description: 'should return true when placement has clusterSets with multiple elements',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p2', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-1', 'cluster-set-2', 'cluster-set-3'] },
    },
    expected: true,
  },
  {
    description: 'should return false when placement has empty clusterSets array',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p3', namespace: 'default' },
      spec: { clusterSets: [] },
    },
    expected: false,
  },
  {
    description: 'should return false when placement has undefined clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p4', namespace: 'default' },
      spec: {},
    },
    expected: false,
  },
  {
    description: 'should return false when placement has predicates but no clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p5', namespace: 'default' },
      spec: {
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
    expected: false,
  },
]

/**
 * Test case fixture for isPlacementForClusterNames
 */
export interface IsPlacementForClusterNamesTestCase {
  description: string
  placement: Placement
  expected: boolean
}

/**
 * Test cases for isPlacementForClusterNames function
 */
export const isPlacementForClusterNamesTestCases: IsPlacementForClusterNamesTestCase[] = [
  {
    description: 'should return true when placement has predicates but no clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p1', namespace: 'default' },
      spec: {
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
    expected: true,
  },
  {
    description: 'should return true when placement has empty clusterSets array',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p2', namespace: 'default' },
      spec: { clusterSets: [] },
    },
    expected: true,
  },
  {
    description: 'should return true when placement has undefined clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p3', namespace: 'default' },
      spec: {},
    },
    expected: true,
  },
  {
    description: 'should return false when placement has clusterSets with one element',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p4', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-1'] },
    },
    expected: false,
  },
  {
    description: 'should return false when placement has clusterSets with multiple elements',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p5', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-1', 'cluster-set-2'] },
    },
    expected: false,
  },
]

/**
 * Test case fixture for doesPlacementContainsClusterName
 */
export interface DoesPlacementContainsClusterNameTestCase {
  description: string
  placement: Placement
  clusterName: string
  expected: boolean
}

/**
 * Test cases for doesPlacementContainsClusterName function
 */
export const doesPlacementContainsClusterNameTestCases: DoesPlacementContainsClusterNameTestCase[] = [
  {
    description: 'should return true when cluster name is in placement predicates',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p1', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-a', 'cluster-b'] }],
              },
            },
          },
        ],
      },
    },
    clusterName: 'cluster-a',
    expected: true,
  },
  {
    description: 'should return true when cluster name is in one of multiple predicates',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p2', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-x'] }],
              },
            },
          },
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-y', 'cluster-z'] }],
              },
            },
          },
        ],
      },
    },
    clusterName: 'cluster-z',
    expected: true,
  },
  {
    description: 'should return false when cluster name is not in placement predicates',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p3', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-a', 'cluster-b'] }],
              },
            },
          },
        ],
      },
    },
    clusterName: 'cluster-nonexistent',
    expected: false,
  },
  {
    description: 'should return false when placement has no predicates',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p4', namespace: 'default' },
      spec: {},
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when placement has empty predicates array',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p5', namespace: 'default' },
      spec: { predicates: [] },
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when predicate has no requiredClusterSelector',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p6', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {},
          },
        ],
      },
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when predicate has no labelSelector',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p7', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {},
            },
          },
        ],
      },
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when predicate has empty matchExpressions',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p8', namespace: 'default' },
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
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when matchExpression has different key',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p9', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'environment', operator: 'In', values: ['cluster-a'] }],
              },
            },
          },
        ],
      },
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when matchExpression values is undefined',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p10', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [{ key: 'name', operator: 'Exists' }],
              },
            },
          },
        ],
      },
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return false when matchExpression values is empty array',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p11', namespace: 'default' },
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
    },
    clusterName: 'cluster-a',
    expected: false,
  },
  {
    description: 'should return true when cluster name is found among multiple matchExpressions',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p12', namespace: 'default' },
      spec: {
        predicates: [
          {
            requiredClusterSelector: {
              labelSelector: {
                matchExpressions: [
                  { key: 'environment', operator: 'In', values: ['prod'] },
                  { key: 'name', operator: 'In', values: ['cluster-a', 'cluster-b'] },
                  { key: 'region', operator: 'In', values: ['us-east'] },
                ],
              },
            },
          },
        ],
      },
    },
    clusterName: 'cluster-b',
    expected: true,
  },
]

/**
 * Test case fixture for doesPlacementContainsClusterSet
 */
export interface DoesPlacementContainsClusterSetTestCase {
  description: string
  placement: Placement
  clusterSetName: string
  expected: boolean
}

/**
 * Test cases for doesPlacementContainsClusterSet function
 */
export const doesPlacementContainsClusterSetTestCases: DoesPlacementContainsClusterSetTestCase[] = [
  {
    description: 'should return true when cluster set name is in placement clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p1', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-a', 'cluster-set-b'] },
    },
    clusterSetName: 'cluster-set-a',
    expected: true,
  },
  {
    description: 'should return true when cluster set name is the only element in clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p2', namespace: 'default' },
      spec: { clusterSets: ['single-cluster-set'] },
    },
    clusterSetName: 'single-cluster-set',
    expected: true,
  },
  {
    description: 'should return true when cluster set name is last in multiple clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p3', namespace: 'default' },
      spec: { clusterSets: ['cs-1', 'cs-2', 'cs-3'] },
    },
    clusterSetName: 'cs-3',
    expected: true,
  },
  {
    description: 'should return false when cluster set name is not in placement clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p4', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-a', 'cluster-set-b'] },
    },
    clusterSetName: 'cluster-set-nonexistent',
    expected: false,
  },
  {
    description: 'should return false when placement has no clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p5', namespace: 'default' },
      spec: {},
    },
    clusterSetName: 'cluster-set-a',
    expected: false,
  },
  {
    description: 'should return false when placement has empty clusterSets array',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p6', namespace: 'default' },
      spec: { clusterSets: [] },
    },
    clusterSetName: 'cluster-set-a',
    expected: false,
  },
  {
    description: 'should return false when placement has predicates but no clusterSets',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p7', namespace: 'default' },
      spec: {
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
    clusterSetName: 'cluster-set-a',
    expected: false,
  },
  {
    description: 'should return false for partial match of cluster set name',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p8', namespace: 'default' },
      spec: { clusterSets: ['cluster-set-production'] },
    },
    clusterSetName: 'cluster-set',
    expected: false,
  },
  {
    description: 'should be case sensitive when matching cluster set names',
    placement: {
      apiVersion: PlacementApiVersionBeta,
      kind: PlacementKind,
      metadata: { name: 'p9', namespace: 'default' },
      spec: { clusterSets: ['Cluster-Set-A'] },
    },
    clusterSetName: 'cluster-set-a',
    expected: false,
  },
]
