/* Copyright Contributors to the Open Cluster Management project */
import { Subject } from '../kubernetes-client'
import { MulticlusterRoleAssignment, MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement } from '../placement'
import { UserKind } from '../rbac'
import { ManagedByConsoleLabelKey, ManagedByConsoleLabelValue } from './constants'
import { FlattenedRoleAssignment } from './model/flattened-role-assignment'
import { PlacementClusters } from './model/placement-clusters'
import { RoleAssignmentToSave } from './model/role-assignment-to-save'

/**
 * Helper to create a mock Placement.
 * When clusterSetNames is undefined, the placement has no spec.clusterSets (cluster-name/predicate based).
 * When clusterSetNames is provided, the placement is cluster-set based.
 */
const createMockPlacement = (name: string, clusterSetNames?: string[]): Placement => ({
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
  spec: clusterSetNames !== undefined ? { clusterSets: clusterSetNames } : {},
})

/**
 * Helper to create a PlacementClusters entry for testing
 */
export const createPlacementClusters = (
  name: string,
  clusters: string[],
  clusterSetNames?: string[]
): PlacementClusters => ({
  placement: createMockPlacement(name, clusterSetNames),
  clusters,
  clusterSetNames,
})

/**
 * Test case fixture for getPlacementsForRoleAssignment
 */
interface GetPlacementsTestCase {
  description: string
  placementClusters: PlacementClusters[]
  roleAssignment: RoleAssignmentToSave
  expectedPlacementNames: string[]
}

/**
 * Test cases for cluster sets matching
 */
export const clusterSetsMatchingTestCases: GetPlacementsTestCase[] = [
  {
    description: 'should return placement when cluster sets match exactly (cs01 matches cs01)',
    placementClusters: [createPlacementClusters('placement-1', [], ['cs01'])],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1'],
  },
  {
    description: 'should return placement when multiple cluster sets match exactly (cs01 & cs02 matches cs01 & cs02)',
    placementClusters: [createPlacementClusters('placement-1', [], ['cs01', 'cs02'])],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1'],
  },
  {
    description:
      'should return placement when placement cluster sets are subset of role assignment (cs01 & cs02 subset of cs01 & cs02 & cs03)',
    placementClusters: [createPlacementClusters('placement-1', [], ['cs01', 'cs02'])],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1'],
  },
  {
    description:
      'should return multiple placements when each is a subset (placement1: cs01 & cs02, placement2: cs03 from cs01 & cs02 & cs03)',
    placementClusters: [
      createPlacementClusters('placement-1', [], ['cs01', 'cs02']),
      createPlacementClusters('placement-2', [], ['cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1', 'placement-2'],
  },
  {
    description:
      'should return both placements when each has different cluster sets (placement1: cs02, placement2: cs03 from cs01 & cs02 & cs03)',
    placementClusters: [
      createPlacementClusters('placement-1', [], ['cs02']),
      createPlacementClusters('placement-2', [], ['cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1', 'placement-2'],
  },
  {
    description:
      'should NOT return placement when it contains cluster set not in role assignment (placement: cs02 & cs04, role: cs01 & cs02 & cs03)',
    placementClusters: [
      createPlacementClusters('placement-1', [], ['cs02', 'cs04']),
      createPlacementClusters('placement-2', [], ['cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-2'],
  },
  {
    description: 'should NOT return placement when placement has no cluster sets',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should NOT return placement when role assignment has no cluster sets',
    placementClusters: [createPlacementClusters('placement-1', [], ['cs01'])],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
]

/**
 * Test cases for cluster names matching
 */
export const clusterNamesMatchingTestCases: GetPlacementsTestCase[] = [
  {
    description: 'should return placement when clusters match exactly',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a', 'cluster-b'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1'],
  },
  {
    description:
      'should NOT return placement when placement clusters are subset of role assignment clusters (requires exact match)',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b', 'cluster-c'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should NOT return placement when role assignment clusters are subset of placement clusters',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a', 'cluster-b', 'cluster-c'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should NOT return placement when placement has empty clusters array',
    placementClusters: [createPlacementClusters('placement-1', [], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should NOT return placement when role assignment has empty cluster names',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should NOT return placement when role assignment has undefined cluster names',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: undefined,
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should return placement when clusters match exactly regardless of order',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-c', 'cluster-a', 'cluster-b'], undefined)],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b', 'cluster-c'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1'],
  },
]

/**
 * Test cases for minimal placement cover (clusters): no redundant placements.
 * When multiple placements exactly match or multiple combinations can cover the target,
 * only one valid combination is returned (e.g. PlacementA OR PlacementB, or PlacementD+PlacementE).
 */
export const minimalPlacementCoverClustersTestCases: GetPlacementsTestCase[] = [
  {
    description:
      'should return only one placement when two placements have identical clusters (PlacementA and PlacementB both [clusterA, clusterB, clusterC])',
    placementClusters: [
      createPlacementClusters('PlacementA', ['clusterA', 'clusterB', 'clusterC'], undefined),
      createPlacementClusters('PlacementB', ['clusterA', 'clusterB', 'clusterC'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementA'],
  },
  {
    description:
      'should return two placements when one exact match does not exist but D+E cover (PlacementD [A,B] + PlacementE [C])',
    placementClusters: [
      createPlacementClusters('PlacementD', ['clusterA', 'clusterB'], undefined),
      createPlacementClusters('PlacementE', ['clusterC'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementD', 'PlacementE'],
  },
  {
    description:
      'should return three placements when only single-cluster placements cover (PlacementH [A] + PlacementI [B] + PlacementJ [C])',
    placementClusters: [
      createPlacementClusters('PlacementH', ['clusterA'], undefined),
      createPlacementClusters('PlacementI', ['clusterB'], undefined),
      createPlacementClusters('PlacementJ', ['clusterC'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementH', 'PlacementI', 'PlacementJ'],
  },
  {
    description:
      'should return one exact match and ignore placement with extra cluster (PlacementC has A,B,C,D; target A,B,C)',
    placementClusters: [
      createPlacementClusters('PlacementA', ['clusterA', 'clusterB', 'clusterC'], undefined),
      createPlacementClusters('PlacementC', ['clusterA', 'clusterB', 'clusterC', 'clusterD'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementA'],
  },
  {
    description: 'should return PlacementF+PlacementH when they cover [clusterA, clusterB, clusterC] (F: B,C; H: A)',
    placementClusters: [
      createPlacementClusters('PlacementF', ['clusterB', 'clusterC'], undefined),
      createPlacementClusters('PlacementH', ['clusterA'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementF', 'PlacementH'],
  },
  {
    description: 'should not return PlacementG (has A,B,D) for target [A,B,C] because D is not in target',
    placementClusters: [
      createPlacementClusters('PlacementG', ['clusterA', 'clusterB', 'clusterD'], undefined),
      createPlacementClusters('PlacementH', ['clusterA'], undefined),
      createPlacementClusters('PlacementI', ['clusterB'], undefined),
      createPlacementClusters('PlacementJ', ['clusterC'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementH', 'PlacementI', 'PlacementJ'],
  },
  {
    description: 'should return a combination of placements when combining them produce the expected target',
    placementClusters: [
      createPlacementClusters('PlacementG', ['clusterA', 'clusterB', 'clusterD'], undefined),
      createPlacementClusters('PlacementH', ['clusterA', 'clusterB'], undefined),
      createPlacementClusters('PlacementI', ['clusterB', 'clusterC'], undefined),
      createPlacementClusters('PlacementJ', ['clusterC', 'clusterD'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementH', 'PlacementI'],
  },
  {
    description: 'should not return any placement when no placements cover the target',
    placementClusters: [
      createPlacementClusters('PlacementG', ['clusterA', 'clusterB', 'clusterD'], undefined),
      createPlacementClusters('PlacementH', ['clusterA', 'clusterB', 'clusterE'], undefined),
      createPlacementClusters('PlacementI', ['clusterB', 'clusterC', 'clusterD'], undefined),
      createPlacementClusters('PlacementJ', ['clusterC', 'clusterD'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['clusterA', 'clusterB', 'clusterC'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description:
      'should prefer placement without spec.clusterSets over placement with clusterSets when both cover same clusters (e.g. clusters-weekly-and-weekly-managed over cluster-sets-default)',
    placementClusters: [
      createPlacementClusters('cluster-sets-default', ['weekly', 'weekly-managed'], ['default']),
      createPlacementClusters('clusters-weekly-and-weekly-managed', ['weekly', 'weekly-managed'], undefined),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['weekly', 'weekly-managed'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['clusters-weekly-and-weekly-managed'],
  },
]

/**
 * Test cases for minimal placement cover (cluster sets): no redundant placements.
 * When multiple placements have the same cluster sets, only one is returned; minimal combinations for coverage.
 */
export const minimalPlacementCoverClusterSetsTestCases: GetPlacementsTestCase[] = [
  {
    description:
      'should return only one placement when two placements have identical cluster sets (both [cs01, cs02, cs03])',
    placementClusters: [
      createPlacementClusters('PlacementA', [], ['cs01', 'cs02', 'cs03']),
      createPlacementClusters('PlacementB', [], ['cs01', 'cs02', 'cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementA'],
  },
  {
    description: 'should return two placements when each contributes (PlacementX [cs01, cs02] + PlacementY [cs03])',
    placementClusters: [
      createPlacementClusters('PlacementX', [], ['cs01', 'cs02']),
      createPlacementClusters('PlacementY', [], ['cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementX', 'PlacementY'],
  },
  {
    description:
      'should return three placements when each has one cluster set (cs01, cs02, cs03) and together they cover',
    placementClusters: [
      createPlacementClusters('PlacementP', [], ['cs01']),
      createPlacementClusters('PlacementQ', [], ['cs02']),
      createPlacementClusters('PlacementR', [], ['cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementP', 'PlacementQ', 'PlacementR'],
  },
  {
    description: 'should return only one placement when three exact-match placements exist (no redundancy)',
    placementClusters: [
      createPlacementClusters('PlacementAlpha', [], ['cs01', 'cs02']),
      createPlacementClusters('PlacementBeta', [], ['cs01', 'cs02']),
      createPlacementClusters('PlacementGamma', [], ['cs01', 'cs02']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementAlpha'],
  },
  {
    description: 'should return a combination of placements when combining them produce the expected target',
    placementClusters: [
      createPlacementClusters('PlacementAlpha', [], ['cs01']),
      createPlacementClusters('PlacementBeta', [], ['cs01', 'cs02']),
      createPlacementClusters('PlacementGamma', [], ['cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['PlacementBeta', 'PlacementGamma'],
  },
  {
    description: 'should not return any placement when no placements cover the target',
    placementClusters: [
      createPlacementClusters('PlacementAlpha', [], ['cs01', 'cs04']),
      createPlacementClusters('PlacementBeta', [], ['cs01', 'cs02', 'cs05']),
      createPlacementClusters('PlacementGamma', [], ['cs03', 'cs06']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
]

/**
 * Test cases for combined matching (clusters and cluster sets)
 */
export const combinedMatchingTestCases: GetPlacementsTestCase[] = [
  {
    description: 'should return only placement matching by cluster sets when clusters do not match exactly',
    placementClusters: [
      createPlacementClusters('placement-by-clusters', ['cluster-a'], undefined),
      createPlacementClusters('placement-by-sets', [], ['cs01']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: ['cs01', 'cs02'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-by-sets'],
  },
  {
    description: 'should return both placements when clusters match exactly AND cluster sets are subset',
    placementClusters: [
      createPlacementClusters('placement-by-clusters', ['cluster-a', 'cluster-b'], undefined),
      createPlacementClusters('placement-by-sets', [], ['cs01']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: ['cs01', 'cs02'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-by-clusters', 'placement-by-sets'],
  },
  {
    description: 'should return only placement matching by clusters when cluster sets do not match',
    placementClusters: [
      createPlacementClusters('placement-by-clusters', ['cluster-a'], undefined),
      createPlacementClusters('placement-by-sets', [], ['cs01', 'cs99']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: ['cs01', 'cs02'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-by-clusters'],
  },
  {
    description: 'should return no placements when neither clusters nor cluster sets match',
    placementClusters: [
      createPlacementClusters('placement-by-clusters', ['cluster-x'], undefined),
      createPlacementClusters('placement-by-sets', [], ['cs99']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should return multiple placements matching by different criteria',
    placementClusters: [
      createPlacementClusters('placement-exact-clusters', ['cluster-a', 'cluster-b'], undefined),
      createPlacementClusters('placement-subset-sets-1', [], ['cs01']),
      createPlacementClusters('placement-subset-sets-2', [], ['cs02']),
      createPlacementClusters('placement-no-match', ['cluster-x'], ['cs99']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-exact-clusters', 'placement-subset-sets-1', 'placement-subset-sets-2'],
  },
]

/**
 * Helper to create a minimal FlattenedRoleAssignment for testing sort
 */
const createFlattenedRoleAssignment = (
  subjectName: string | undefined,
  clusterRole: string = 'admin'
): FlattenedRoleAssignment => ({
  name: `role-${subjectName ?? 'unknown'}`,
  subject: { name: subjectName, kind: UserKind } as Pick<Subject, 'name' | 'kind'>,
  clusterRole,
  clusterSelection: { type: 'placements', placements: [] },
  clusterNames: [],
  clusterSetNames: [],
  targetNamespaces: [],
  relatedMulticlusterRoleAssignment: {} as MulticlusterRoleAssignment,
})

/**
 * Test case fixture for findRoleAssignments sort
 */
export interface FindRoleAssignmentsSortTestCase {
  description: string
  subjectNames: (string | undefined)[]
  expectedOrder: (string | undefined)[]
}

/**
 * Test cases for findRoleAssignments sort covering all conditions
 */
export const findRoleAssignmentsSortTestCases: FindRoleAssignmentsSortTestCase[] = [
  {
    description: 'should sort subjects alphabetically when all names are defined',
    subjectNames: ['charlie', 'alice', 'bob'],
    expectedOrder: ['alice', 'bob', 'charlie'],
  },
  {
    description: 'should handle undefined subject name in first position (a.subject.name is undefined)',
    subjectNames: [undefined, 'alice', 'bob'],
    expectedOrder: [undefined, 'alice', 'bob'],
  },
  {
    description: 'should handle undefined subject name in second position (b.subject.name is undefined)',
    subjectNames: ['alice', undefined, 'bob'],
    expectedOrder: [undefined, 'alice', 'bob'],
  },
  {
    description: 'should handle both subject names undefined',
    subjectNames: [undefined, undefined],
    expectedOrder: [undefined, undefined],
  },
  {
    description: 'should handle mixed undefined and defined names correctly',
    subjectNames: ['charlie', undefined, 'alice', undefined, 'bob'],
    expectedOrder: [undefined, undefined, 'alice', 'bob', 'charlie'],
  },
]

/**
 * Helper to create FlattenedRoleAssignments for sort test cases
 */
export const createFlattenedRoleAssignmentsForSort = (
  subjectNames: (string | undefined)[]
): FlattenedRoleAssignment[] => subjectNames.map((name) => createFlattenedRoleAssignment(name))

/**
 * Test case fixture for addRoleAssignment
 */
export interface AddRoleAssignmentTestCase {
  description: string
  roleAssignment: RoleAssignmentToSave
  existingMulticlusterRoleAssignments?: MulticlusterRoleAssignment[]
  existingPlacements: Placement[]
  shouldSucceed: boolean
  expectedErrorMessage?: string
}

/**
 * Helper to create a mock MulticlusterRoleAssignment
 */
export const createMockMulticlusterRoleAssignment = (
  name: string,
  subject: Subject,
  roleAssignmentNames: string[] = []
): MulticlusterRoleAssignment => ({
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
  spec: {
    subject,
    roleAssignments: roleAssignmentNames.map((raName) => ({
      name: raName,
      clusterRole: 'admin',
      clusterSelection: { type: 'placements' as const, placements: [] },
      targetNamespaces: [],
    })),
  },
  status: {},
})

/**
 * Helper to create a mock MulticlusterRoleAssignment with ManagedByConsole label (console-managed)
 */
export const createMockMulticlusterRoleAssignmentManagedByConsole = (
  name: string,
  subject: Subject,
  roleAssignmentNames: string[] = []
): MulticlusterRoleAssignment => {
  const base = createMockMulticlusterRoleAssignment(name, subject, roleAssignmentNames)
  return {
    ...base,
    metadata: { ...base.metadata, labels: { [ManagedByConsoleLabelKey]: ManagedByConsoleLabelValue } },
  }
}

/**
 * Interface for role assignment configuration in MRA
 */
interface RoleAssignmentConfig {
  name: string
  clusterRole: string
  placementNames: string[]
  targetNamespaces?: string[]
}

/**
 * Helper to create a MulticlusterRoleAssignment with specific role assignments and placements
 */
export const createMulticlusterRoleAssignment = (
  name: string,
  subject: Subject,
  roleAssignments: RoleAssignmentConfig[]
): MulticlusterRoleAssignment => ({
  apiVersion: 'rbac.open-cluster-management.io/v1beta1',
  kind: 'MulticlusterRoleAssignment',
  metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
  spec: {
    subject,
    roleAssignments: roleAssignments.map((ra) => ({
      name: ra.name,
      clusterRole: ra.clusterRole,
      clusterSelection: {
        type: 'placements' as const,
        placements: ra.placementNames.map((placementName) => ({
          name: placementName,
          namespace: MulticlusterRoleAssignmentNamespace,
        })),
      },
      targetNamespaces: ra.targetNamespaces ?? [],
    })),
  },
  status: {},
})

/**
 * Helper to create a MulticlusterRoleAssignment with a single role assignment referencing one placement
 */
export const createMRAWithSingleRoleAndPlacement = (
  name: string,
  subject: Subject,
  roleName: string,
  clusterRole: string,
  placementName: string
): MulticlusterRoleAssignment =>
  createMulticlusterRoleAssignment(name, subject, [{ name: roleName, clusterRole, placementNames: [placementName] }])

/**
 * Helper to create a MulticlusterRoleAssignment with a single role assignment referencing multiple placements
 */
export const createMRAWithSingleRoleAndMultiplePlacements = (
  name: string,
  subject: Subject,
  roleName: string,
  clusterRole: string,
  placementNames: string[]
): MulticlusterRoleAssignment =>
  createMulticlusterRoleAssignment(name, subject, [{ name: roleName, clusterRole, placementNames }])

/**
 * Helper to create a MulticlusterRoleAssignment with multiple role assignments
 */
export const createMRAWithMultipleRoles = (
  name: string,
  subject: Subject,
  roleAssignments: RoleAssignmentConfig[]
): MulticlusterRoleAssignment => createMulticlusterRoleAssignment(name, subject, roleAssignments)

/**
 * Test cases for addRoleAssignment
 */
export const addRoleAssignmentTestCases: AddRoleAssignmentTestCase[] = [
  {
    description: 'should reject when no cluster or cluster set is selected',
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      // No clusterNames or clusterSetNames
    },
    existingPlacements: [],
    shouldSucceed: false,
    expectedErrorMessage: 'No cluster or cluster set selected.',
  },
  {
    description: 'should reject when empty clusterNames and clusterSetNames arrays',
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    existingPlacements: [],
    shouldSucceed: false,
    expectedErrorMessage: 'No cluster or cluster set selected.',
  },
  {
    description: 'should create new MulticlusterRoleAssignment when clusterNames provided',
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    existingPlacements: [],
    shouldSucceed: true,
  },
  {
    description: 'should create new MulticlusterRoleAssignment when clusterSetNames provided',
    roleAssignment: {
      clusterRole: 'admin',
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    existingPlacements: [],
    shouldSucceed: true,
  },
  {
    description: 'should patch existing MulticlusterRoleAssignment when one with ManagedByConsole label exists',
    roleAssignment: {
      clusterRole: 'viewer',
      clusterNames: ['cluster-b'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    existingMulticlusterRoleAssignments: [
      createMockMulticlusterRoleAssignmentManagedByConsole('existing-mra', { name: 'user1', kind: UserKind }, [
        'existing-role',
      ]),
    ],
    existingPlacements: [],
    shouldSucceed: true,
  },
]

/**
 * Test cases for duplicate detection in addRoleAssignment
 */
export interface DuplicateDetectionTestCase {
  description: string
  roleAssignment: RoleAssignmentToSave
  existingRoleAssignmentData: RoleAssignmentToSave
}

export const duplicateDetectionTestCases: DuplicateDetectionTestCase[] = [
  {
    description: 'should reject when role assignment is a duplicate (same clusterRole, clusters, and subject)',
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    existingRoleAssignmentData: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
  },
]

/**
 * Test case fixture for getRoleAssignmentName: pairs of RoleAssignmentToSave that differ only
 * by undefined vs empty array for targetNamespaces, clusterNames, or clusterSetNames.
 * Both entries in each pair must produce the same hash name.
 */
export interface GetRoleAssignmentNameEquivalentPairTestCase {
  description: string
  roleAssignmentA: RoleAssignmentToSave
  roleAssignmentB: RoleAssignmentToSave
}

export const getRoleAssignmentNameEquivalentPairTestCases: GetRoleAssignmentNameEquivalentPairTestCase[] = [
  {
    description: 'same name when targetNamespaces is undefined vs empty array',
    roleAssignmentA: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    roleAssignmentB: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      targetNamespaces: [],
    },
  },
  {
    description: 'same name when clusterNames is undefined vs empty array',
    roleAssignmentA: {
      clusterRole: 'admin',
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      targetNamespaces: [],
    },
    roleAssignmentB: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      targetNamespaces: [],
    },
  },
  {
    description: 'same name when clusterSetNames is undefined vs empty array',
    roleAssignmentA: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      targetNamespaces: [],
    },
    roleAssignmentB: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      targetNamespaces: [],
    },
  },
  {
    description: 'same name when all three array properties are undefined vs all empty arrays',
    roleAssignmentA: {
      clusterRole: 'viewer',
      subject: { name: 'user2', kind: UserKind },
      isGlobalScope: true,
      targetNamespaces: [],
    },
    roleAssignmentB: {
      clusterRole: 'viewer',
      clusterNames: [],
      clusterSetNames: [],
      subject: { name: 'user2', kind: UserKind },
      isGlobalScope: true,
      targetNamespaces: [],
    },
  },
  {
    description: 'same name when targetNamespaces is undefined (omitted) vs empty in minimal assignment',
    roleAssignmentA: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    roleAssignmentB: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
      targetNamespaces: [],
    },
  },
]

/**
 * Test case fixture for getClustersForRoleAssignment deduplication and sorting
 * Tests that the function returns unique cluster names without duplicates, sorted alphabetically
 */
export interface GetClustersDeduplicationTestCase {
  description: string
  placementClusters: PlacementClusters[]
  placementNames: string[]
  expectedClusters: string[]
}

/**
 * Test cases for getClustersForRoleAssignment deduplication
 */
export const getClustersDeduplicationTestCases: GetClustersDeduplicationTestCase[] = [
  {
    description: 'should return unique clusters when placements have no overlapping clusters',
    placementClusters: [
      createPlacementClusters('placement-1', ['cluster-a', 'cluster-b']),
      createPlacementClusters('placement-2', ['cluster-c', 'cluster-d']),
    ],
    placementNames: ['placement-1', 'placement-2'],
    expectedClusters: ['cluster-a', 'cluster-b', 'cluster-c', 'cluster-d'],
  },
  {
    description: 'should deduplicate clusters when placements have overlapping clusters',
    placementClusters: [
      createPlacementClusters('placement-1', ['cluster-a', 'cluster-b', 'cluster-c']),
      createPlacementClusters('placement-2', ['cluster-b', 'cluster-c', 'cluster-d']),
    ],
    placementNames: ['placement-1', 'placement-2'],
    expectedClusters: ['cluster-a', 'cluster-b', 'cluster-c', 'cluster-d'],
  },
  {
    description: 'should deduplicate clusters when multiple placements contain the same cluster',
    placementClusters: [
      createPlacementClusters('placement-1', ['shared-cluster']),
      createPlacementClusters('placement-2', ['shared-cluster']),
      createPlacementClusters('placement-3', ['shared-cluster']),
    ],
    placementNames: ['placement-1', 'placement-2', 'placement-3'],
    expectedClusters: ['shared-cluster'],
  },
  {
    description: 'should deduplicate clusters when all placements have identical cluster lists',
    placementClusters: [
      createPlacementClusters('placement-1', ['cluster-a', 'cluster-b']),
      createPlacementClusters('placement-2', ['cluster-a', 'cluster-b']),
    ],
    placementNames: ['placement-1', 'placement-2'],
    expectedClusters: ['cluster-a', 'cluster-b'],
  },
  {
    description: 'should handle single placement without duplicates',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a', 'cluster-b', 'cluster-c'])],
    placementNames: ['placement-1'],
    expectedClusters: ['cluster-a', 'cluster-b', 'cluster-c'],
  },
  {
    description: 'should return empty array when placement is not found',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a', 'cluster-b'])],
    placementNames: ['non-existent-placement'],
    expectedClusters: [],
  },
  {
    description: 'should handle mixed found and not-found placements',
    placementClusters: [
      createPlacementClusters('placement-1', ['cluster-a', 'cluster-b']),
      createPlacementClusters('placement-2', ['cluster-c']),
    ],
    placementNames: ['placement-1', 'non-existent', 'placement-2'],
    expectedClusters: ['cluster-a', 'cluster-b', 'cluster-c'],
  },
  {
    description: 'should return empty array when placements array is empty',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-a'])],
    placementNames: [],
    expectedClusters: [],
  },
  {
    description: 'should deduplicate and sort when same cluster appears in different positions across placements',
    placementClusters: [
      createPlacementClusters('placement-1', ['cluster-x', 'cluster-a', 'cluster-y']),
      createPlacementClusters('placement-2', ['cluster-a', 'cluster-z']),
      createPlacementClusters('placement-3', ['cluster-z', 'cluster-a', 'cluster-x']),
    ],
    placementNames: ['placement-1', 'placement-2', 'placement-3'],
    expectedClusters: ['cluster-a', 'cluster-x', 'cluster-y', 'cluster-z'],
  },
]

/**
 * Test cases for getClustersForRoleAssignment sorting
 * Tests that the function returns clusters sorted alphabetically using localeCompare
 */
export const getClustersSortingTestCases: GetClustersDeduplicationTestCase[] = [
  {
    description: 'should sort clusters alphabetically when input is unsorted',
    placementClusters: [createPlacementClusters('placement-1', ['zebra-cluster', 'alpha-cluster', 'beta-cluster'])],
    placementNames: ['placement-1'],
    expectedClusters: ['alpha-cluster', 'beta-cluster', 'zebra-cluster'],
  },
  {
    description: 'should sort clusters alphabetically when input is reverse sorted',
    placementClusters: [createPlacementClusters('placement-1', ['z-cluster', 'y-cluster', 'x-cluster', 'a-cluster'])],
    placementNames: ['placement-1'],
    expectedClusters: ['a-cluster', 'x-cluster', 'y-cluster', 'z-cluster'],
  },
  {
    description: 'should maintain sorted order when input is already sorted',
    placementClusters: [createPlacementClusters('placement-1', ['aaa-cluster', 'bbb-cluster', 'ccc-cluster'])],
    placementNames: ['placement-1'],
    expectedClusters: ['aaa-cluster', 'bbb-cluster', 'ccc-cluster'],
  },
  {
    description: 'should sort clusters from multiple placements into a single sorted list',
    placementClusters: [
      createPlacementClusters('placement-1', ['delta', 'alpha']),
      createPlacementClusters('placement-2', ['gamma', 'beta']),
    ],
    placementNames: ['placement-1', 'placement-2'],
    expectedClusters: ['alpha', 'beta', 'delta', 'gamma'],
  },
  {
    description: 'should handle numeric suffixes correctly with localeCompare',
    placementClusters: [createPlacementClusters('placement-1', ['cluster-10', 'cluster-2', 'cluster-1', 'cluster-20'])],
    placementNames: ['placement-1'],
    expectedClusters: ['cluster-1', 'cluster-10', 'cluster-2', 'cluster-20'],
  },
  {
    description: 'should sort case-sensitively (uppercase before lowercase in default locale)',
    placementClusters: [createPlacementClusters('placement-1', ['Bravo', 'alpha', 'CHARLIE', 'delta'])],
    placementNames: ['placement-1'],
    expectedClusters: ['alpha', 'Bravo', 'CHARLIE', 'delta'],
  },
  {
    description: 'should sort clusters with special characters',
    placementClusters: [createPlacementClusters('placement-1', ['cluster_b', 'cluster-a', 'cluster.c', 'cluster@d'])],
    placementNames: ['placement-1'],
    // localeCompare sorts: '_' comes before '-', '.' and '@'
    expectedClusters: ['cluster_b', 'cluster-a', 'cluster.c', 'cluster@d'],
  },
  {
    description: 'should sort and deduplicate clusters from overlapping unsorted placements',
    placementClusters: [
      createPlacementClusters('placement-1', ['zulu', 'mike', 'alpha']),
      createPlacementClusters('placement-2', ['alpha', 'yankee', 'mike']),
      createPlacementClusters('placement-3', ['bravo', 'zulu']),
    ],
    placementNames: ['placement-1', 'placement-2', 'placement-3'],
    expectedClusters: ['alpha', 'bravo', 'mike', 'yankee', 'zulu'],
  },
  {
    description: 'should handle single cluster without changing order',
    placementClusters: [createPlacementClusters('placement-1', ['only-cluster'])],
    placementNames: ['placement-1'],
    expectedClusters: ['only-cluster'],
  },
  {
    description: 'should sort clusters with mixed alphanumeric names',
    placementClusters: [
      createPlacementClusters('placement-1', [
        'prod-us-east-1',
        'dev-eu-west-2',
        'staging-ap-south-1',
        'prod-eu-west-1',
      ]),
    ],
    placementNames: ['placement-1'],
    expectedClusters: ['dev-eu-west-2', 'prod-eu-west-1', 'prod-us-east-1', 'staging-ap-south-1'],
  },
]

/**
 * Helper to create a PlacementClusters entry with a specific namespace for testing namespace filtering.
 * When clusterSetNames is undefined, the placement has no spec.clusterSets (cluster-name based).
 * When clusterSetNames is provided, the placement is cluster-set based.
 */
export const createPlacementClustersWithNamespace = (
  name: string,
  namespace: string,
  clusters: string[],
  clusterSetNames?: string[]
): PlacementClusters => ({
  placement: {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'Placement',
    metadata: { name, namespace },
    spec: clusterSetNames !== undefined ? { clusterSets: clusterSetNames } : {},
  },
  clusters,
  clusterSetNames,
})

/**
 * Test case fixture for getPlacementsForRoleAssignment namespace filtering
 * Tests that only placements in the MulticlusterRoleAssignmentNamespace are returned
 */
export interface NamespaceFilteringTestCase {
  description: string
  placementClusters: PlacementClusters[]
  roleAssignment: RoleAssignmentToSave
  expectedPlacementNames: string[]
}

/**
 * Test cases for namespace filtering in getPlacementsForRoleAssignment
 * These test cases verify that only placements in the correct namespace (open-cluster-management-global-set)
 * are returned, preventing the bug where all clusters were being saved instead of selected clusters.
 */
export const namespaceFilteringTestCases: NamespaceFilteringTestCase[] = [
  {
    description:
      'should only return placements from MulticlusterRoleAssignmentNamespace, ignoring placements from other namespaces',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-correct-ns', MulticlusterRoleAssignmentNamespace, [
        'cluster-a',
        'cluster-b',
      ]),
      createPlacementClustersWithNamespace('placement-wrong-ns', 'other-namespace', ['cluster-a', 'cluster-b']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-correct-ns'],
  },
  {
    description: 'should return empty array when all matching placements are in wrong namespace',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-wrong-ns-1', 'namespace-1', ['cluster-a', 'cluster-b']),
      createPlacementClustersWithNamespace('placement-wrong-ns-2', 'namespace-2', ['cluster-a', 'cluster-b']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: [],
  },
  {
    description: 'should filter by namespace for cluster sets matching as well',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-correct-ns', MulticlusterRoleAssignmentNamespace, [], ['cs01']),
      createPlacementClustersWithNamespace('placement-wrong-ns', 'other-namespace', [], ['cs01']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-correct-ns'],
  },
  {
    description: 'should not return placements from default namespace even if clusters match exactly',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-default-ns', 'default', ['cluster-x', 'cluster-y']),
      createPlacementClustersWithNamespace('placement-global-set', MulticlusterRoleAssignmentNamespace, [
        'cluster-x',
        'cluster-y',
      ]),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-x', 'cluster-y'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-global-set'],
  },
  {
    description: 'should handle mixed namespaces with both cluster names and cluster sets',
    placementClusters: [
      createPlacementClustersWithNamespace(
        'placement-clusters-correct',
        MulticlusterRoleAssignmentNamespace,
        ['cluster-a', 'cluster-b'],
        undefined
      ),
      createPlacementClustersWithNamespace(
        'placement-clusters-wrong',
        'wrong-ns',
        ['cluster-a', 'cluster-b'],
        undefined
      ),
      createPlacementClustersWithNamespace('placement-sets-correct', MulticlusterRoleAssignmentNamespace, [], ['cs01']),
      createPlacementClustersWithNamespace('placement-sets-wrong', 'wrong-ns', [], ['cs01']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: ['cs01', 'cs02'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-clusters-correct', 'placement-sets-correct'],
  },
  {
    description: 'should return all matching placements from correct namespace when multiple exist',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-1', MulticlusterRoleAssignmentNamespace, [], ['cs01']),
      createPlacementClustersWithNamespace('placement-2', MulticlusterRoleAssignmentNamespace, [], ['cs02']),
      createPlacementClustersWithNamespace('placement-3', MulticlusterRoleAssignmentNamespace, [], ['cs03']),
      createPlacementClustersWithNamespace('placement-wrong', 'other-ns', [], ['cs01', 'cs02', 'cs03']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: [],
      clusterSetNames: ['cs01', 'cs02', 'cs03'],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-1', 'placement-2', 'placement-3'],
  },
  {
    description: 'should ignore placements with undefined namespace',
    placementClusters: [
      {
        placement: {
          apiVersion: 'cluster.open-cluster-management.io/v1beta1',
          kind: 'Placement',
          metadata: { name: 'placement-no-ns' },
          spec: { clusterSets: ['default'] },
        },
        clusters: ['cluster-a', 'cluster-b'],
        clusterSetNames: undefined,
      },
      createPlacementClustersWithNamespace('placement-correct', MulticlusterRoleAssignmentNamespace, [
        'cluster-a',
        'cluster-b',
      ]),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a', 'cluster-b'],
      clusterSetNames: [],
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: false,
    },
    expectedPlacementNames: ['placement-correct'],
  },
]

/**
 * Test case fixture for getPlacementsForRoleAssignment with isGlobalScope: true
 */
interface GetPlacementsGlobalScopeTestCase {
  description: string
  placementClusters: PlacementClusters[]
  roleAssignment: RoleAssignmentToSave
  expectedPlacementNames?: string[]
  shouldThrow?: boolean
  expectedErrorMessage?: string
}

/**
 * Test cases for isGlobalScope: true in getPlacementsForRoleAssignment
 */
export const globalScopeTestCases: GetPlacementsGlobalScopeTestCase[] = [
  {
    description: 'should return global placement when isGlobalScope is true and GlobalPlacementName exists',
    placementClusters: [
      createPlacementClustersWithNamespace('global', MulticlusterRoleAssignmentNamespace, [
        'cluster-a',
        'cluster-b',
        'cluster-c',
      ]),
      createPlacementClustersWithNamespace('placement-other', MulticlusterRoleAssignmentNamespace, ['cluster-a']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: true,
    },
    expectedPlacementNames: ['global'],
  },
  {
    description:
      'should return global placement when isGlobalScope is true and GlobalPlacementName exists, ignoring other placements',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-1', MulticlusterRoleAssignmentNamespace, ['cluster-a']),
      createPlacementClustersWithNamespace('global', MulticlusterRoleAssignmentNamespace, ['cluster-a', 'cluster-b']),
      createPlacementClustersWithNamespace('placement-2', MulticlusterRoleAssignmentNamespace, ['cluster-b']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: true,
    },
    expectedPlacementNames: ['global'],
  },
  {
    description:
      'should throw error when isGlobalScope is true but GlobalPlacementName does not exist in placementClusters',
    placementClusters: [
      createPlacementClustersWithNamespace('placement-1', MulticlusterRoleAssignmentNamespace, ['cluster-a']),
      createPlacementClustersWithNamespace('placement-2', MulticlusterRoleAssignmentNamespace, ['cluster-b']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: true,
    },
    shouldThrow: true,
    expectedErrorMessage:
      'Global placement not found. Expected placement with name: global and namespace: open-cluster-management-global-set.',
  },
  {
    description: 'should throw error when isGlobalScope is true and GlobalPlacementName exists but in wrong namespace',
    placementClusters: [
      createPlacementClustersWithNamespace('global', 'wrong-namespace', ['cluster-a']),
      createPlacementClustersWithNamespace('placement-1', MulticlusterRoleAssignmentNamespace, ['cluster-b']),
    ],
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: true,
    },
    shouldThrow: true,
    expectedErrorMessage:
      'Global placement not found. Expected placement with name: global and namespace: open-cluster-management-global-set.',
  },
  {
    description: 'should throw error when isGlobalScope is true and placementClusters is empty',
    placementClusters: [],
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
      isGlobalScope: true,
    },
    shouldThrow: true,
    expectedErrorMessage:
      'Global placement not found. Expected placement with name: global and namespace: open-cluster-management-global-set.',
  },
]
