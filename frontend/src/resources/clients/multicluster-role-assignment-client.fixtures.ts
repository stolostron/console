/* Copyright Contributors to the Open Cluster Management project */
import { FlattenedRoleAssignment } from './model/flattened-role-assignment'
import { Subject } from '../kubernetes-client'
import { MulticlusterRoleAssignment, MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement } from '../placement'
import { UserKind } from '../rbac'
import { PlacementClusters } from './model/placement-clusters'
import { RoleAssignmentToSave } from './model/role-assignment-to-save'

/**
 * Helper to create a mock Placement
 */
const createMockPlacement = (name: string, clusterSets: string[] = ['default']): Placement => ({
  apiVersion: 'cluster.open-cluster-management.io/v1beta1',
  kind: 'Placement',
  metadata: { name, namespace: MulticlusterRoleAssignmentNamespace },
  spec: { clusterSets },
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
    },
    expectedPlacementNames: ['placement-1'],
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
  existingMulticlusterRoleAssignment?: MulticlusterRoleAssignment
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
 * Test cases for addRoleAssignment
 */
export const addRoleAssignmentTestCases: AddRoleAssignmentTestCase[] = [
  {
    description: 'should reject when no cluster or cluster set is selected',
    roleAssignment: {
      clusterRole: 'admin',
      subject: { name: 'user1', kind: UserKind },
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
    },
    existingPlacements: [],
    shouldSucceed: true,
  },
  {
    description: 'should patch existing MulticlusterRoleAssignment when one exists',
    roleAssignment: {
      clusterRole: 'viewer',
      clusterNames: ['cluster-b'],
      subject: { name: 'user1', kind: UserKind },
    },
    existingMulticlusterRoleAssignment: createMockMulticlusterRoleAssignment(
      'existing-mra',
      { name: 'user1', kind: UserKind },
      ['existing-role']
    ),
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
    },
    existingRoleAssignmentData: {
      clusterRole: 'admin',
      clusterNames: ['cluster-a'],
      subject: { name: 'user1', kind: UserKind },
    },
  },
]
