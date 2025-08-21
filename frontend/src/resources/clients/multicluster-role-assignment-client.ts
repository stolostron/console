/* Copyright Contributors to the Open Cluster Management project */
import { UserKindType, GroupKindType } from '../rbac'
import {
  MulticlusterRoleAssignment,
  RoleAssignment,
  MulticlusterRoleAssignmentNamespace,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
} from '../multicluster-role-assignment'
import { createResource, patchResource, deleteResource } from '../utils'
import { IRequestResult } from '../utils/resource-request'

export interface MulticlusterRoleAssignmentQuery {
  subjectNames?: string[]
  subjectKinds?: (UserKindType | GroupKindType)[]
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

export function createRoleAssignmentHash(roleAssignment: RoleAssignment): string {
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

  // Filter by subject kinds
  if (
    query.subjectKinds?.length &&
    !query.subjectKinds.includes(multiClusterAssignment.spec.subject.kind as UserKindType | GroupKindType)
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
// filter criteria. Tracking properties are added to each RoleAssignment to help with CRUD operations (finding the right
// MulticlusterRoleAssignment to update, and updating it correctly).
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
function addRoleAssignment(
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
function updateRoleAssignment(
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

  // Extract the RoleAssignment data (without tracking properties)
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
function deleteRoleAssignment(
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

function createMulticlusterRoleAssignment(
  userName: string,
  userKind: UserKindType | GroupKindType,
  newRoleAssignment: RoleAssignment
): Promise<MulticlusterRoleAssignment> {
  const sanitizedUserName = userName
    // replaces invalid characters with one hyphen
    .replace(/[^a-z0-9-]+/gi, '-')
    // removes leading/trailing hyphens
    .replace(/^-+|-+$/g, '')
    .toLowerCase()
  // TODO: improve name creation logic in cases where a MulticlusterRoleAssignment already exists with the name
  const name = `${sanitizedUserName}-role-assignment-console`

  const multiclusterAssignment: MulticlusterRoleAssignment = {
    apiVersion: MulticlusterRoleAssignmentApiVersion,
    kind: MulticlusterRoleAssignmentKind,
    metadata: {
      name,
      namespace: MulticlusterRoleAssignmentNamespace,
      labels: {
        'console-created': 'true',
      },
    },
    spec: {
      subject: {
        kind: userKind,
        name: userName,
      },
      roleAssignments: [newRoleAssignment],
    },
  }

  return createResource<MulticlusterRoleAssignment>(multiclusterAssignment).promise
}

// TODO: consider doing a fresh GET and checking k8s resourceVersion before JSON patching to prevent concurrent clients
// update issues, since JSON patch is overwriting the whole /spec/roleAssignments array
function patchMulticlusterRoleAssignment(
  originalMulticlusterAssignment: MulticlusterRoleAssignment,
  updatedRoleAssignments: RoleAssignment[]
): IRequestResult<MulticlusterRoleAssignment> {
  const patch = [
    {
      op: 'replace',
      path: '/spec/roleAssignments',
      value: updatedRoleAssignments,
    },
  ]
  return patchResource<MulticlusterRoleAssignment>(originalMulticlusterAssignment, patch)
}

function deleteMulticlusterRoleAssignment(multiclusterAssignment: MulticlusterRoleAssignment): IRequestResult<unknown> {
  return deleteResource(multiclusterAssignment)
}

// Finds and returns the first MulticlusterRoleAssignment (if it exists) for a specified user/group. This is needed for
// scenarious where a RoleAssignment is created. This assumes one MulticlusterRoleAssignment per user/group.
// TODO: improve this logic to handle if a user/group has multiple MulticlusterRoleAssignment
function findMulticlusterRoleAssignmentForSubject(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  userName: string,
  userKind: UserKindType | GroupKindType
): MulticlusterRoleAssignment | undefined {
  return multiClusterAssignments.find(
    (multi) => multi.spec.subject.name === userName && multi.spec.subject.kind === userKind
  )
}

// Adds a RoleAssignment to a MulticlusterRoleAssignment and updates Kubernetes. If a MulticlusterRoleAssignment does
// not exist, one will be created for the specified user/group.
export async function addRoleAssignmentK8s(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  userName: string,
  userKind: UserKindType | GroupKindType,
  newRoleAssignment: RoleAssignment
): Promise<RoleAssignmentUpdateResult> {
  try {
    const multiClusterAssignment = findMulticlusterRoleAssignmentForSubject(multiClusterAssignments, userName, userKind)

    if (multiClusterAssignment) {
      // Add to an existing MulticlusterRoleAssignment
      const localResult = addRoleAssignment(
        multiClusterAssignments,
        multiClusterAssignment.metadata.uid || 'unknown',
        newRoleAssignment
      )
      if (!localResult.success) {
        return localResult
      }

      await patchMulticlusterRoleAssignment(multiClusterAssignment, multiClusterAssignment.spec.roleAssignments).promise
    } else {
      // Create new MulticlusterRoleAssignment if one does not exist already for the specific user/group
      await createMulticlusterRoleAssignment(userName, userKind, newRoleAssignment)
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to add RoleAssignment: ${error.message || error}`,
    }
  }
}

// Updates a RoleAssignment in a MulticlusterRoleAssignment and updates Kubernetes
export async function updateRoleAssignmentK8s(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  updatedRoleAssignment: TrackedRoleAssignment
): Promise<RoleAssignmentUpdateResult> {
  const localResult = updateRoleAssignment(multiClusterAssignments, updatedRoleAssignment)
  if (!localResult.success) {
    return localResult
  }

  try {
    const multiClusterAssignment = multiClusterAssignments.find(
      (multi) => multi.metadata.uid === updatedRoleAssignment.multiclusterRoleAssignmentUid
    )

    if (multiClusterAssignment) {
      await patchMulticlusterRoleAssignment(multiClusterAssignment, multiClusterAssignment.spec.roleAssignments).promise
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to update RoleAssignment: ${error.message || error}`,
    }
  }
}

// Deletes a RoleAssignment from a MulticlusterRoleAssignment and updates Kubernetes. Also deletes the
// MulticlusterRoleAssignment if there are no remaining RoleAssignments.
export async function deleteRoleAssignmentK8s(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  deletedRoleAssignment: TrackedRoleAssignment
): Promise<RoleAssignmentUpdateResult> {
  const localResult = deleteRoleAssignment(multiClusterAssignments, deletedRoleAssignment)
  if (!localResult.success) {
    return localResult
  }

  try {
    const multiClusterAssignment = multiClusterAssignments.find(
      (multi) => multi.metadata.uid === deletedRoleAssignment.multiclusterRoleAssignmentUid
    )

    if (multiClusterAssignment) {
      if (multiClusterAssignment.spec.roleAssignments.length === 0) {
        // Delete the entire MulticlusterRoleAssignment if no role assignments remain
        await deleteMulticlusterRoleAssignment(multiClusterAssignment).promise
      } else {
        // Update the MulticlusterRoleAssignment with remaining role assignments
        await patchMulticlusterRoleAssignment(multiClusterAssignment, multiClusterAssignment.spec.roleAssignments)
          .promise
      }
    }

    return { success: true }
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to delete RoleAssignment: ${error.message || error}`,
    }
  }
}

// Moves a RoleAssignment from one user/group to another. This is needed if a user/group is changed from the Roles page.
// If you change the user/group from the Roles role assignments page, we need to delete the role assignment for the old
// user/group and create a new role assignment for the new user/group.
export async function moveRoleAssignmentBetweenSubjectsK8s(
  multiClusterAssignments: MulticlusterRoleAssignment[],
  originalRoleAssignment: TrackedRoleAssignment,
  newUserName: string,
  newUserKind: UserKindType | GroupKindType
): Promise<RoleAssignmentUpdateResult> {
  try {
    // Delete the role assignment from the original subject
    const deleteResult = await deleteRoleAssignmentK8s(multiClusterAssignments, originalRoleAssignment)
    if (!deleteResult.success) {
      return deleteResult
    }

    // Extract the RoleAssignment data (without tracking properties)
    const {
      multiclusterRoleAssignmentUid,
      subjectName,
      subjectKind,
      roleAssignmentIndex,
      dataHash,
      ...roleAssignmentData
    } = originalRoleAssignment

    // Add the role assignment to the new user
    const addResult = await addRoleAssignmentK8s(multiClusterAssignments, newUserName, newUserKind, roleAssignmentData)

    return addResult
  } catch (error: any) {
    return {
      success: false,
      error: `Failed to move RoleAssignment between subjects: ${error.message || error}`,
    }
  }
}
