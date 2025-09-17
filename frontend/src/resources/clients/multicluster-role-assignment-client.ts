/* Copyright Contributors to the Open Cluster Management project */
import { sha256 } from 'js-sha256'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { Subject } from '../kubernetes-client'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
  MulticlusterRoleAssignmentNamespace,
  RoleAssignment,
  RoleAssignmentStatus,
} from '../multicluster-role-assignment'
import { createResource, deleteResource, patchResource } from '../utils'
import { IRequestResult, ResourceError, ResourceErrorCode } from '../utils/resource-request'

export interface FlattenedRoleAssignment extends RoleAssignment {
  relatedMulticlusterRoleAssignment: MulticlusterRoleAssignment
  subject: Pick<Subject, 'name' | 'kind'>
  status?: RoleAssignmentStatus
}

interface MulticlusterRoleAssignmentQuery {
  subjectNames?: string[]
  subjectKinds?: FlattenedRoleAssignment['subject']['kind'][]
  roles?: string[]
  clusterNames?: string[]
}

// TODO: remove export as soon as the mock data is removed and the CR is ready ACM-23633
export const roleAssignmentToFlattenedRoleAssignment = (
  multiClusterRoleAssignment: MulticlusterRoleAssignment,
  roleAssignment: RoleAssignment
): FlattenedRoleAssignment => ({
  ...roleAssignment,
  subject: {
    name: multiClusterRoleAssignment.spec.subject.name,
    kind: multiClusterRoleAssignment.spec.subject.kind,
  },
  relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
  status: multiClusterRoleAssignment?.status?.roleAssignments?.find((e) => e.name === roleAssignment.name),
})

const isSubjectMatch = (
  multiClusterRoleAssignment: MulticlusterRoleAssignment,
  query: MulticlusterRoleAssignmentQuery
): boolean => {
  switch (true) {
    // Filter by subject names
    case query.subjectNames?.length && !query.subjectNames.includes(multiClusterRoleAssignment.spec.subject.name):
      return false
    // Filter by subject kinds
    case query.subjectKinds?.length && !query.subjectKinds.includes(multiClusterRoleAssignment.spec.subject.kind):
      return false
    default:
      return true
  }
}

const isClusterOrRoleMatch = (roleAssignment: RoleAssignment, query: MulticlusterRoleAssignmentQuery): boolean => {
  switch (true) {
    // Filter by cluster names
    case query.clusterNames?.length &&
      !roleAssignment.clusterSelection.clusterNames.some((clusterName) => query.clusterNames!.includes(clusterName)):
      return false
    // Filter by roles
    case query.roles?.length && !query.roles.includes(roleAssignment.clusterRole):
      return false
    default:
      return true
  }
}

/**
 * Filters MulticlusterRoleAssignments by query parameters, returns only relevant nested RoleAssignments that match
 * @param query the query to filter multiclusterRoleAssignments
 * @returns role assignments with kind and name
 */
export const useFindRoleAssignments = (query: MulticlusterRoleAssignmentQuery): FlattenedRoleAssignment[] => {
  // TODO: replace by new aggregated API
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  return multiclusterRoleAssignments.reduce(
    (
      multiClusterRoleAssignmentAcc: FlattenedRoleAssignment[],
      multiClusterRoleAssignmentCurr: MulticlusterRoleAssignment
    ) =>
      !isSubjectMatch(multiClusterRoleAssignmentCurr, query)
        ? multiClusterRoleAssignmentAcc
        : [
            ...multiClusterRoleAssignmentAcc,
            ...multiClusterRoleAssignmentCurr.spec.roleAssignments
              .reduce(
                (assignmentAcc: RoleAssignment[], assignmentCurr: RoleAssignment) =>
                  !isClusterOrRoleMatch(assignmentCurr, query) ? assignmentAcc : [...assignmentAcc, assignmentCurr],
                []
              )
              .map((e) => roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, e)),
          ],
    []
  )
}

export const findRoleAssignments = (
  query: MulticlusterRoleAssignmentQuery,
  multiClusterRoleAssignments: MulticlusterRoleAssignment[]
): FlattenedRoleAssignment[] =>
  multiClusterRoleAssignments.reduce(
    (
      multiClusterRoleAssignmentAcc: FlattenedRoleAssignment[],
      multiClusterRoleAssignmentCurr: MulticlusterRoleAssignment
    ) =>
      !isSubjectMatch(multiClusterRoleAssignmentCurr, query)
        ? multiClusterRoleAssignmentAcc
        : [
            ...multiClusterRoleAssignmentAcc,
            ...multiClusterRoleAssignmentCurr.spec.roleAssignments
              .reduce(
                (assignmentAcc: RoleAssignment[], assignmentCurr: RoleAssignment) =>
                  !isClusterOrRoleMatch(assignmentCurr, query) ? assignmentAcc : [...assignmentAcc, assignmentCurr],
                []
              )
              .map((e) => roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, e)),
          ],
    []
  )

export const mapRoleAssignmentBeforeSaving = (roleAssignment: Omit<RoleAssignment, 'name'>): RoleAssignment => {
  const newName = sha256(
    JSON.stringify(
      roleAssignment,
      Object.keys(roleAssignment).sort((a, b) => a.localeCompare(b))
    )
  )
  return { name: newName, ...roleAssignment }
}

/**
 * it creates a new MulticlusterRoleAssignment on the CR
 * @param multiclusterRoleAssignment the element to be created
 * @returns the new MulticlusterRoleAssignment
 */
export const create = (
  multiclusterRoleAssignment: MulticlusterRoleAssignment
): IRequestResult<MulticlusterRoleAssignment> => {
  const treatedMulticlusterRoleAssignment = {
    ...multiclusterRoleAssignment,
    spec: {
      ...multiclusterRoleAssignment.spec,
      roleAssignments: multiclusterRoleAssignment.spec.roleAssignments.map(mapRoleAssignmentBeforeSaving),
    },
  }
  return createResource<MulticlusterRoleAssignment>(treatedMulticlusterRoleAssignment)
}

/**
 * it checks whether two RoleAssignments are the same or not
 * @param a RoleAssignment1
 * @param b RoleAssignment2
 * @returns true or false depending on whether they are the same or not
 */
const areRoleAssignmentsEquals = (a: RoleAssignment, b: RoleAssignment) => a.name === b.name

// TODO: get existingRelatedRoleAssignmets once useFindRoleAssignments is not a custom hook
/**
 * adds a new roleAssignment either to an existing MulticlusterRoleAssignment or it creates a new one adding the new roleAssignment
 * @param roleAssignment
 * @param subject
 * @returns the patched or new MulticlusterRoleAssignment
 */
export const addRoleAssignment = (
  roleAssignment: Omit<RoleAssignment, 'name'>,
  subject: FlattenedRoleAssignment['subject'],
  existingMulticlusterRoleAssignment?: MulticlusterRoleAssignment
): IRequestResult<MulticlusterRoleAssignment> => {
  const mappedRoleAssignment = mapRoleAssignmentBeforeSaving(roleAssignment)

  if (existingMulticlusterRoleAssignment) {
    return patchResource(existingMulticlusterRoleAssignment, {
      spec: {
        ...existingMulticlusterRoleAssignment.spec,
        roleAssignments: [...existingMulticlusterRoleAssignment.spec.roleAssignments, mappedRoleAssignment],
      },
    })
  } else {
    const newMultiClusterRoleAssignment: MulticlusterRoleAssignment = {
      apiVersion: MulticlusterRoleAssignmentApiVersion,
      kind: MulticlusterRoleAssignmentKind,
      metadata: {
        name: `role-assignment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        namespace: MulticlusterRoleAssignmentNamespace,
      },
      spec: {
        subject,
        roleAssignments: [mappedRoleAssignment],
      },
      status: {},
    }
    return create(newMultiClusterRoleAssignment)
  }
}

/**
 * it removes a RoleAssignment element from the MulticlusterRoleAssignment. If it is the latest one, the whole MulticlusterRoleAssignment is instead removed
 * @param roleAssignment
 * @returns the request result
 */
export const deleteRoleAssignment = (roleAssignment: FlattenedRoleAssignment): IRequestResult<unknown> => {
  const multiClusterRoleAssignment = roleAssignment.relatedMulticlusterRoleAssignment
  const indexToRemove = multiClusterRoleAssignment.spec.roleAssignments.findIndex((e) =>
    areRoleAssignmentsEquals(e, roleAssignment)
  )

  if (indexToRemove > -1) {
    const newRoleAssignmentList = multiClusterRoleAssignment.spec.roleAssignments.filter(
      (_e, index) => index !== indexToRemove
    )
    if (newRoleAssignmentList.length === 0) {
      return deleteResource(multiClusterRoleAssignment)
    } else {
      return patchResource(multiClusterRoleAssignment, {
        spec: {
          ...multiClusterRoleAssignment.spec,
          roleAssignments: newRoleAssignmentList,
        },
      })
    }
  } else {
    throw new ResourceError(
      ResourceErrorCode.BadRequest,
      'The role assignment does not exist for this particular MulticlusterRoleAssignment'
    )
  }
}
