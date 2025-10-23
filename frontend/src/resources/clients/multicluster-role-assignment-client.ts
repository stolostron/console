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
import { getResource, IRequestResult, ResourceError, ResourceErrorCode } from '../utils/resource-request'

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

const roleAssignmentToFlattenedRoleAssignment = (
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

  return multiclusterRoleAssignments
    ? multiclusterRoleAssignments
        .reduce(
          (
            multiClusterRoleAssignmentAcc: FlattenedRoleAssignment[],
            multiClusterRoleAssignmentCurr: MulticlusterRoleAssignment
          ) =>
            isSubjectMatch(multiClusterRoleAssignmentCurr, query)
              ? [
                  ...multiClusterRoleAssignmentAcc,
                  ...multiClusterRoleAssignmentCurr.spec.roleAssignments
                    .reduce(
                      (assignmentAcc: RoleAssignment[], assignmentCurr: RoleAssignment) =>
                        isClusterOrRoleMatch(assignmentCurr, query)
                          ? [...assignmentAcc, assignmentCurr]
                          : assignmentAcc,
                      []
                    )
                    .map((e) => roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, e)),
                ]
              : multiClusterRoleAssignmentAcc,
          []
        )
        .sort((a, b) => a.subject.name?.localeCompare(b.subject.name ?? '') ?? 0)
    : []
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
      isSubjectMatch(multiClusterRoleAssignmentCurr, query)
        ? [
            ...multiClusterRoleAssignmentAcc,
            ...multiClusterRoleAssignmentCurr.spec.roleAssignments
              .reduce(
                (assignmentAcc: RoleAssignment[], assignmentCurr: RoleAssignment) =>
                  isClusterOrRoleMatch(assignmentCurr, query) ? [...assignmentAcc, assignmentCurr] : assignmentAcc,
                []
              )
              .map((e) => roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, e)),
          ]
        : multiClusterRoleAssignmentAcc,
    []
  )

export const mapRoleAssignmentBeforeSaving = (roleAssignment: Omit<RoleAssignment, 'name'>): RoleAssignment => {
  const sortedKeys = Object.keys(roleAssignment).sort((a, b) => a.localeCompare(b))

  const sortedObject: any = {}
  for (const key of sortedKeys) {
    const value = roleAssignment[key as keyof typeof roleAssignment]

    if (key === 'clusterSelection' && value && typeof value === 'object' && 'clusterNames' in value) {
      sortedObject[key] = {
        ...value,
        clusterNames: value.clusterNames
          ? [...value.clusterNames].sort((a, b) => a.localeCompare(b))
          : value.clusterNames,
      }
    } else if (key === 'targetNamespaces' && Array.isArray(value)) {
      sortedObject[key] = [...value].sort((a, b) => a.localeCompare(b))
    } else {
      sortedObject[key] = value
    }
  }

  const stringified = JSON.stringify(sortedObject)

  const hash = sha256(stringified)

  const shortHash = hash.substring(0, 16)
  const newName = `${roleAssignment.clusterRole}-${shortHash}`
  return { name: newName, ...roleAssignment }
}

export const validateRoleAssignmentName = (
  newRoleAssignment: Omit<RoleAssignment, 'name'>,
  existingRoleAssignments: RoleAssignment[]
): boolean => {
  const newName = mapRoleAssignmentBeforeSaving(newRoleAssignment).name
  const existingNames = existingRoleAssignments.map((ea) => ea.name)
  return !existingNames.includes(newName)
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
  const existingRoleAssignments = existingMulticlusterRoleAssignment?.spec.roleAssignments || []
  const isUnique = validateRoleAssignmentName(roleAssignment, existingRoleAssignments)

  if (!isUnique) {
    return {
      promise: Promise.reject(new ResourceError(ResourceErrorCode.BadRequest, 'Duplicate role assignment detected.')),
      abort: () => {},
    }
  }

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
        name: `role-assignment-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
        namespace: MulticlusterRoleAssignmentNamespace,
        labels: { 'open-cluster-management.io/managed-by': 'console' },
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
  const mra = roleAssignment.relatedMulticlusterRoleAssignment

  const abortController = new AbortController()

  const promise = (async () => {
    const getReq = getResource<MulticlusterRoleAssignment>(mra)
    abortController.signal.addEventListener('abort', getReq.abort)
    const fresh = await getReq.promise.finally(() => abortController.signal.removeEventListener('abort', getReq.abort))

    const idx = fresh.spec.roleAssignments.findIndex((e) => areRoleAssignmentsEquals(e, roleAssignment))
    if (idx < 0) {
      throw new ResourceError(
        ResourceErrorCode.BadRequest,
        'The role assignment does not exist for this particular MulticlusterRoleAssignment'
      )
    }

    const remaining = fresh.spec.roleAssignments.filter((_e, i) => i !== idx)
    const writeReq =
      remaining.length === 0
        ? deleteResource(fresh)
        : patchResource(fresh, { spec: { ...fresh.spec, roleAssignments: remaining } })

    abortController.signal.addEventListener('abort', writeReq.abort)
    return writeReq.promise.finally(() => abortController.signal.removeEventListener('abort', writeReq.abort))
  })()

  return { promise, abort: () => abortController.abort() }
}
