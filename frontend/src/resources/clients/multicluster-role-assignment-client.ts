/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { Subject } from '../kubernetes-client'
import { MulticlusterRoleAssignment, RoleAssignment } from '../multicluster-role-assignment'
import { GroupKindType, UserKindType } from '../rbac'
import { createResource, deleteResource } from '../utils'
import { IRequestResult } from '../utils/resource-request'

interface RoleAssignmentUI extends RoleAssignment, Pick<Subject, 'name' | 'kind'> {}

interface MulticlusterRoleAssignmentQuery {
  subjectNames?: string[]
  subjectKinds?: (UserKindType | GroupKindType)[]
  roles?: string[]
  clusterSets?: string[]
}

const roleAssignmentToRoleAssignmentUI = (
  multiClusterRoleAssignment: MulticlusterRoleAssignment,
  roleAssignment: RoleAssignment
): RoleAssignmentUI => ({
  ...roleAssignment,
  name: multiClusterRoleAssignment.spec.subject.name,
  kind: multiClusterRoleAssignment.spec.subject.kind,
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
export const useFindRoleAssignments = (query: MulticlusterRoleAssignmentQuery): RoleAssignmentUI[] => {
  // TODO: replace by new aggregated API
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)

  return multiclusterRoleAssignments.reduce(
    (multiClusterRoleAssignmentAcc: RoleAssignmentUI[], multiClusterRoleAssignmentCurr: MulticlusterRoleAssignment) =>
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
              .map((e) => roleAssignmentToRoleAssignmentUI(multiClusterRoleAssignmentCurr, e)),
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
 * it removes a MulticlusterRoleAssignment from the CR
 * @param multiclusterRoleAssignment the element to delete
 * @returns unknown
 */
export const remove = (multiclusterAssignment: MulticlusterRoleAssignment): IRequestResult<unknown> =>
  deleteResource(multiclusterAssignment)
