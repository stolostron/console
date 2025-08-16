/* Copyright Contributors to the Open Cluster Management project */
import { UserKindType, GroupKindType } from '../rbac'
import { MulticlusterRoleAssignment, RoleAssignment } from '../role-assignment'

export interface MulticlusterRoleAssignmentQuery {
  subjectNames?: string[]
  subjectTypes?: (UserKindType | GroupKindType)[]
  roles?: string[]
  clusterSets?: string[]
}

export interface TrackedRoleAssignment extends RoleAssignment {
  multiclusterRoleAssignmentUid: string
  subjectName: string
  subjectKind: UserKindType | GroupKindType
  roleAssignmentIndex: number
  dataHash: string
}

export interface RoleAssignmentUpdateResult {
  success: boolean
  error?: string
}

function createRoleAssignmentHash(roleAssignment: RoleAssignment): string {
  const data = JSON.stringify({
    clusterRole: roleAssignment.clusterRole,
    targetNamespaces: roleAssignment.targetNamespaces.slice().sort(),
    clusterSets: roleAssignment.clusterSets.slice().sort(),
  })

  // djb2a hash algorithm
  let hash = 5381
  for (let i = 0; i < data.length; i++) {
    hash = ((hash << 5) + hash) ^ data.charCodeAt(i)
  }

  // Use unsigned 32-bit and convert to hex for 8 character output
  return (hash >>> 0).toString(16).padStart(8, '0')
}

function isSubjectMatch(
  multiClusterAssignment: MulticlusterRoleAssignment,
  query: MulticlusterRoleAssignmentQuery
): boolean {
  // Filter by subject names
  if (query.subjectNames?.length && !query.subjectNames.includes(multiClusterAssignment.spec.subject.name)) {
    return false
  }

  // Filter by subject types
  if (
    query.subjectTypes?.length &&
    !query.subjectTypes.includes(multiClusterAssignment.spec.subject.kind as UserKindType | GroupKindType)
  ) {
    return false
  }

  return true
}

function isClusterSetOrRoleMatch(assignment: RoleAssignment, query: MulticlusterRoleAssignmentQuery): boolean {
  // Filter by cluster sets
  if (query.clusterSets?.length && !assignment.clusterSets.some((set) => query.clusterSets!.includes(set))) {
    return false
  }

  // Filter by roles
  if (query.roles?.length && !query.roles.includes(assignment.clusterRole)) {
    return false
  }

  return true
}

// Filters MulticlusterRoleAssignments by query parameters, returns only relevant nested RoleAssignments that match
// filter criteria. Lastly, tracking properties are added to each RoleAssignment to help with CRUD operations (finding
// the right MulticlusterRoleAssignment to update, and updating it correctly)
export function filterAndTrackRoleAssignments(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  query: MulticlusterRoleAssignmentQuery
): TrackedRoleAssignment[] {
  const tracked: TrackedRoleAssignment[] = []

  multiClusterAssignments.forEach((multi) => {
    if (!isSubjectMatch(multi, query)) return

    multi.spec.roleAssignments.forEach((assignment, assignmentIndex) => {
      if (!isClusterSetOrRoleMatch(assignment, query)) return

      // Add tracking and include in results
      tracked.push({
        ...assignment,
        roleAssignmentIndex: assignmentIndex,
        multiclusterRoleAssignmentUid: multi.metadata.uid || 'unknown',
        dataHash: createRoleAssignmentHash(assignment),
        subjectName: multi.spec.subject.name,
        subjectKind: multi.spec.subject.kind as UserKindType | GroupKindType,
      })
    })
  })

  return tracked
}

// Adds a new RoleAssignment to an existing MulticlusterRoleAssignment
export function addRoleAssignment(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  multiClusterAssignmentUid: string,
  newRoleAssignment: RoleAssignment
): RoleAssignmentUpdateResult {
  const multiClusterAssignment = multiClusterAssignments.find(
    (multi) => multi.metadata.uid === multiClusterAssignmentUid
  )

  if (!multiClusterAssignment) {
    return { success: false, error: 'MulticlusterRoleAssignment not found' }
  }

  multiClusterAssignment.spec.roleAssignments.push(newRoleAssignment)
  return { success: true }
}

// Updates a RoleAssignment in an existing MulticlusterRoleAssignment
export function updateRoleAssignment(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  updatedRoleAssignment: TrackedRoleAssignment
): RoleAssignmentUpdateResult {
  const multiClusterAssignment = multiClusterAssignments.find(
    (multi) => multi.metadata.uid === updatedRoleAssignment.multiclusterRoleAssignmentUid
  )
  if (!multiClusterAssignment) {
    return { success: false, error: 'MulticlusterRoleAssignment not found' }
  }

  if (
    updatedRoleAssignment.roleAssignmentIndex < 0 ||
    updatedRoleAssignment.roleAssignmentIndex >= multiClusterAssignment.spec.roleAssignments.length
  ) {
    return { success: false, error: 'Invalid RoleAssignment index' }
  }

  const currentRole = multiClusterAssignment.spec.roleAssignments[updatedRoleAssignment.roleAssignmentIndex]
  const currentHash = createRoleAssignmentHash(currentRole)

  if (currentHash !== updatedRoleAssignment.dataHash) {
    return {
      success: false,
      error: 'Unexpected RoleAssignment data',
    }
  }

  // Extract RoleAssignment fields from TrackedRoleAssignment
  const {
    multiclusterRoleAssignmentUid,
    subjectName,
    subjectKind,
    roleAssignmentIndex,
    dataHash,
    ...roleAssignmentData
  } = updatedRoleAssignment

  multiClusterAssignment.spec.roleAssignments[updatedRoleAssignment.roleAssignmentIndex] = roleAssignmentData

  return { success: true }
}

// Deletes a RoleAssignment from an existing MulticlusterRoleAssignment
export function deleteRoleAssignment(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  deletedRoleAssignment: TrackedRoleAssignment
): RoleAssignmentUpdateResult {
  const multiClusterAssignment = multiClusterAssignments.find(
    (multi) => multi.metadata.uid === deletedRoleAssignment.multiclusterRoleAssignmentUid
  )
  if (!multiClusterAssignment) {
    return { success: false, error: 'MulticlusterRoleAssignment not found' }
  }

  if (
    deletedRoleAssignment.roleAssignmentIndex < 0 ||
    deletedRoleAssignment.roleAssignmentIndex >= multiClusterAssignment.spec.roleAssignments.length
  ) {
    return { success: false, error: 'Invalid RoleAssignment index' }
  }

  const currentRole = multiClusterAssignment.spec.roleAssignments[deletedRoleAssignment.roleAssignmentIndex]
  const currentHash = createRoleAssignmentHash(currentRole)

  if (currentHash !== deletedRoleAssignment.dataHash) {
    return {
      success: false,
      error: 'Unexpected RoleAssignment data',
    }
  }

  // Remove the role assignment
  multiClusterAssignment.spec.roleAssignments.splice(deletedRoleAssignment.roleAssignmentIndex, 1)
  return { success: true }
}
