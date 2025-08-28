/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { Subject } from '../kubernetes-client'
import { MulticlusterRoleAssignment, RoleAssignment } from '../multicluster-role-assignment'
import { GroupKindType, UserKindType } from '../rbac'
import { createResource, deleteResource, patchResource } from '../utils'
import { IRequestResult, ResourceError, ResourceErrorCode } from '../utils/resource-request'

export interface FlattenedRoleAssignment extends RoleAssignment, Pick<Subject, 'name' | 'kind'> {
  relatedMulticlusterRoleAssignment: MulticlusterRoleAssignment
}

interface MulticlusterRoleAssignmentQuery {
  subjectNames?: string[]
  subjectKinds?: (UserKindType | GroupKindType)[]
  roles?: string[]
  clusterSets?: string[]
}

// TODO: remove export as soon as the mock data is removed and the CR is ready ACM-23633
export const roleAssignmentToFlattenedRoleAssignment = (
  multiClusterRoleAssignment: MulticlusterRoleAssignment,
  roleAssignment: RoleAssignment
): FlattenedRoleAssignment => ({
  ...roleAssignment,
  name: multiClusterRoleAssignment.spec.subject.name,
  kind: multiClusterRoleAssignment.spec.subject.kind,
  relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
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
    case query.subjectKinds?.length &&
      !query.subjectKinds.includes(multiClusterRoleAssignment.spec.subject.kind as UserKindType | GroupKindType):
      return false
    default:
      return true
  }
}

const isClusterSetOrRoleMatch = (roleAssignment: RoleAssignment, query: MulticlusterRoleAssignmentQuery): boolean => {
  switch (true) {
    // Filter by cluster sets
    case query.clusterSets?.length && !roleAssignment.clusterSets.some((set) => query.clusterSets!.includes(set)):
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
                  !isClusterSetOrRoleMatch(assignmentCurr, query) ? assignmentAcc : [...assignmentAcc, assignmentCurr],
                []
              )
              .map((e) => roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, e)),
          ],
    []
  )
}

/**
 * it creates a new MulticlusterRoleAssignment on the CR
 * @param multiclusterRoleAssignment the element to be created
 * @returns the new MulticlusterRoleAssignment
 */
export const create = (
  multiclusterRoleAssignment: MulticlusterRoleAssignment
): IRequestResult<MulticlusterRoleAssignment> => createResource<MulticlusterRoleAssignment>(multiclusterRoleAssignment)

/**
 * it checks whether two RoleAssignments are the same or not
 * @param a RoleAssignment1
 * @param b RoleAssignment2
 * @returns true or false depending on whether they are the same or not
 */
const areRoleAssignmentsEquals = (a: RoleAssignment, b: RoleAssignment) =>
  JSON.stringify(a, Object.keys(a).sort()) === JSON.stringify(b, Object.keys(b).sort())

/**
 * it removes a RoleAssignment element from the MulticlusterRoleAssignment. If it is the latest one, the whole MulticlusterRoleAssignment is instead removed
 * @param roleAssignment
 * @returns the request result
 */
export const deleteRoleAssignment = (roleAssignment: FlattenedRoleAssignment): IRequestResult<unknown> => {
  const multiClusterRoleAssignment = roleAssignment.relatedMulticlusterRoleAssignment
  const { relatedMulticlusterRoleAssignment, name, kind, ...nonFlattenedRoleAssignment } = roleAssignment

  const indexToRemove = multiClusterRoleAssignment.spec.roleAssignments.findIndex((e) =>
    areRoleAssignmentsEquals(e, nonFlattenedRoleAssignment)
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
