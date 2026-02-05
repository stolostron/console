/* Copyright Contributors to the Open Cluster Management project */
import { GlobalPlacementName, Placement, PlacementApiVersionBeta, PlacementKind } from '../placement'

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

/**
 * Test case fixture for producePlacementName length validation
 */
export interface ProducePlacementNameLengthTestCase {
  description: string
  clusterNames: string[]
}

/**
 * Test cases for producePlacementName that should never exceed 63 characters
 */
export const producePlacementNameLengthTestCases: ProducePlacementNameLengthTestCase[] = [
  { description: 'single very long cluster name', clusterNames: ['a'.repeat(100)] },
  {
    description: 'multiple medium cluster names',
    clusterNames: [
      'cluster-1',
      'cluster-2',
      'cluster-3',
      'cluster-4',
      'cluster-5',
      'cluster-6',
      'cluster-7',
      'cluster-8',
    ],
  },
  {
    description: 'few long cluster names',
    clusterNames: ['very-long-cluster-name-1', 'very-long-cluster-name-2', 'very-long-cluster-name-3'],
  },
  {
    description: 'many short cluster names',
    clusterNames: Array.from({ length: 50 }, (_, i) => `cluster-${i}`),
  },
]

/**
 * Test case fixture for producePlacementName valid name generation
 */
export interface ProducePlacementNameValidTestCase {
  description: string
  clusterNames: string[]
}

/**
 * Test cases for producePlacementName that should produce valid names
 */
export const producePlacementNameValidTestCases: ProducePlacementNameValidTestCase[] = [
  {
    description: 'cluster-a and cluster-b',
    clusterNames: ['cluster-a', 'cluster-b'],
  },
  {
    description: 'cluster-b and cluster-a (same clusters, different order)',
    clusterNames: ['cluster-b', 'cluster-a'],
  },
  {
    description: 'cluster-a, cluster-b, and cluster-c (different set)',
    clusterNames: ['cluster-a', 'cluster-b', 'cluster-c'],
  },
  {
    description: 'cluster-x and cluster-y (completely different)',
    clusterNames: ['cluster-x', 'cluster-y'],
  },
]

/**
 * Test case fixture for producePlacementName unique name generation
 */
export interface ProducePlacementNameUniqueTestCase {
  description: string
  clusterNames: string[]
}

/**
 * Test cases for producePlacementName that should produce unique names
 */
export const producePlacementNameUniqueTestCases: ProducePlacementNameUniqueTestCase[] = [
  { description: 'cluster-a and cluster-b', clusterNames: ['cluster-a', 'cluster-b'] },
  {
    description: 'cluster-b and cluster-a (same clusters, different order)',
    clusterNames: ['cluster-b', 'cluster-a'],
  },
  {
    description: 'cluster-a, cluster-b, and cluster-c (different set)',
    clusterNames: ['cluster-a', 'cluster-b', 'cluster-c'],
  },
  { description: 'cluster-x and cluster-y (completely different)', clusterNames: ['cluster-x', 'cluster-y'] },
]

/**
 * Test case fixture for producePlacementName hash generation when exceeding 63 characters
 */
export interface ProducePlacementNameHashTestCase {
  description: string
  clusterNames: string[]
}

/**
 * Test cases for producePlacementName that should produce hash when exceeding 63 characters
 */
export const producePlacementNameHashTestCases: ProducePlacementNameHashTestCase[] = [
  {
    description: '20 short cluster names',
    clusterNames: Array.from({ length: 20 }, (_, i) => `c${i}`),
  },
  {
    description: '15 short cluster names',
    clusterNames: Array.from({ length: 15 }, (_, i) => `cluster-${i}`),
  },
]

/**
 * Test case fixture for producePlacementName suggested name generation when not exceeding 63 characters
 */
export interface ProducePlacementNameSuggestedTestCase {
  description: string
  clusterNames: string[]
}

/**
 * Test cases for producePlacementName that should produce suggestedName when not exceeding 63 characters
 */
export const producePlacementNameSuggestedTestCases: ProducePlacementNameSuggestedTestCase[] = [
  {
    description: '3 short cluster names',
    clusterNames: ['a', 'b', 'c'],
  },
  {
    description: '2 medium cluster names',
    clusterNames: ['cluster-1', 'cluster-2'],
  },
]

/**
 * Test case fixture for producePlacementName hash-based name for long cluster name lists
 */
export interface ProducePlacementNameLongListTestCase {
  description: string
  clusterNames: string[]
}

/**
 * Test cases for producePlacementName that should produce hash-based name for long cluster name lists
 */
export const producePlacementNameLongListTestCases: ProducePlacementNameLongListTestCase[] = [
  {
    description: 'a and b repeated 30 times',
    clusterNames: ['a'.repeat(30), 'b'.repeat(30)],
  },
  {
    description: 'c and d repeated 30 times',
    clusterNames: ['c'.repeat(30), 'd'.repeat(30)],
  },
]

/**
 * Global placement included in placement lists (same as in placement-client.test).
 */
const globalPlacementForLabelsQuery: Placement = {
  apiVersion: PlacementApiVersionBeta,
  kind: PlacementKind,
  metadata: { name: GlobalPlacementName, namespace: 'default' },
  spec: {},
}

/**
 * Default placements used by useFindPlacements tests (same as in placement-client.test mockPlacements, including global).
 * Used by labels query test cases when no label filter is applied.
 */
export const defaultPlacementsForLabelsQuery: Placement[] = [
  {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: { name: 'placement-1', namespace: 'default' },
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
  {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: { name: 'placement-2', namespace: 'default' },
    spec: {
      predicates: [
        {
          requiredClusterSelector: {
            labelSelector: {
              matchExpressions: [{ key: 'name', operator: 'In', values: ['cluster-c'] }],
            },
          },
        },
      ],
    },
  },
  {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: { name: 'placement-no-predicates', namespace: 'default' },
    spec: {},
  },
  globalPlacementForLabelsQuery,
]

/**
 * Test case fixture for useFindPlacements labels query
 */
export interface UseFindPlacementsLabelsQueryTestCase {
  description: string
  placements: Placement[]
  query: { placementNames?: string[]; labels?: Record<string, string>[] }
  expectedCount: number
  expectedFirstName?: string
  expectedLabels?: Record<string, string>
}

/**
 * Test cases for useFindPlacements with labels query
 */
export const useFindPlacementsLabelsQueryTestCases: UseFindPlacementsLabelsQueryTestCase[] = [
  {
    description: 'should return all placements when no label query is provided and no other filters',
    placements: defaultPlacementsForLabelsQuery,
    query: {},
    expectedCount: 4,
  },
  {
    description: 'should return all placements when labels is empty array and no other filters',
    placements: defaultPlacementsForLabelsQuery,
    query: { labels: [] },
    expectedCount: 4,
  },
  {
    description: 'should return placement when single label query matches (placement has that key-value)',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'placement-with-labels',
          namespace: 'default',
          labels: { env: 'prod', team: 'a', tier: 'frontend' },
        },
        spec: {},
      },
    ],
    query: { labels: [{ env: 'prod' }] },
    expectedCount: 1,
    expectedFirstName: 'placement-with-labels',
  },
  {
    description: 'should return placement when single label query matches and placement has additional labels',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'placement-abc',
          namespace: 'default',
          labels: { a: '1', b: '2', c: '3' },
        },
        spec: {},
      },
    ],
    query: { labels: [{ a: '1' }] },
    expectedCount: 1,
    expectedLabels: { a: '1', b: '2', c: '3' },
  },
  {
    description: 'should return empty when single label query does not match (placement has other labels)',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'placement-abc',
          namespace: 'default',
          labels: { a: '1', b: '2', c: '3' },
        },
        spec: {},
      },
    ],
    query: { labels: [{ d: '4' }] },
    expectedCount: 0,
  },
  {
    description: 'should return empty when single label query is provided but placement has no labels',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: { name: 'placement-no-labels', namespace: 'default' },
        spec: {},
      },
    ],
    query: { labels: [{ a: '1' }] },
    expectedCount: 0,
  },
  {
    description: 'should return placement when multiple labels query matches (placement has all queried labels)',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'placement-abc',
          namespace: 'default',
          labels: { a: '1', b: '2', c: '3' },
        },
        spec: {},
      },
    ],
    query: { labels: [{ a: '1' }, { b: '2' }] },
    expectedCount: 1,
    expectedFirstName: 'placement-abc',
  },
  {
    description: 'should return empty when multiple labels query and placement is missing one label',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'placement-abc',
          namespace: 'default',
          labels: { a: '1', b: '2', c: '3' },
        },
        spec: {},
      },
    ],
    query: { labels: [{ a: '1' }, { d: '4' }] },
    expectedCount: 0,
  },
  {
    description: 'should combine labels filter with other filters (AND)',
    placements: [
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'placement-named-and-labeled',
          namespace: 'default',
          labels: { env: 'prod' },
        },
        spec: {},
      },
      {
        apiVersion: PlacementApiVersionBeta,
        kind: PlacementKind,
        metadata: {
          name: 'other-labeled',
          namespace: 'default',
          labels: { env: 'prod' },
        },
        spec: {},
      },
    ],
    query: { placementNames: ['placement-named-and-labeled'], labels: [{ env: 'prod' }] },
    expectedCount: 1,
    expectedFirstName: 'placement-named-and-labeled',
  },
]
