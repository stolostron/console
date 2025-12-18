/* Copyright Contributors to the Open Cluster Management project */
import { sha256 } from 'js-sha256'
import { get } from 'lodash'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { ManagedClusterSetBinding } from '../managed-cluster-set-binding'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
  MulticlusterRoleAssignmentNamespace,
  RoleAssignment,
} from '../multicluster-role-assignment'
import { Placement } from '../placement'
import { createResource, deleteResource, patchResource } from '../utils'
import { getResource, IRequestResult, ResourceError, ResourceErrorCode } from '../utils/resource-request'
import { createForClusterSets as createForClusterSetsBinding } from './managed-cluster-set-binding-client'
import { FlattenedRoleAssignment } from './model/flattened-role-assignment'
import { RoleAssignmentToSave } from './model/role-assignment-to-save'
import { createForClusters, createForClusterSets, useGetClustersForPlacementMap } from './placement-client'

interface MulticlusterRoleAssignmentQuery {
  subjectNames?: string[]
  subjectKinds?: FlattenedRoleAssignment['subject']['kind'][]
  roles?: string[]
  clusterNames?: string[]
}

const roleAssignmentToFlattenedRoleAssignment = (
  multiClusterRoleAssignment: MulticlusterRoleAssignment,
  roleAssignment: RoleAssignment,
  clusterNames: string[]
): FlattenedRoleAssignment => ({
  ...roleAssignment,
  subject: {
    name: multiClusterRoleAssignment.spec.subject.name,
    kind: multiClusterRoleAssignment.spec.subject.kind,
  },
  relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
  status: multiClusterRoleAssignment?.status?.roleAssignments?.find((e) => e.name === roleAssignment.name),
  clusterNames,
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

const isClusterOrRoleMatch = (
  roleAssignment: FlattenedRoleAssignment,
  query: MulticlusterRoleAssignmentQuery
): boolean => {
  switch (true) {
    // Filter by cluster names
    case query.clusterNames?.length &&
      !roleAssignment.clusterNames.some((clusterName) => query.clusterNames!.includes(clusterName)):
      return false
    // Filter by roles
    case query.roles?.length && !query.roles.includes(roleAssignment.clusterRole):
      return false
    default:
      return true
  }
}

const useGetClusterFromPlacements = (multiclusterRoleAssignments: MulticlusterRoleAssignment[]) =>
  useGetClustersForPlacementMap(
    multiclusterRoleAssignments.flatMap((multiclusterRoleAssignment) =>
      multiclusterRoleAssignment.spec.roleAssignments.flatMap((roleAssignment) =>
        roleAssignment.clusterSelection.placements.map((e) => e.name)
      )
    )
  )

/**
 * Filters MulticlusterRoleAssignments by query parameters, returns only relevant nested RoleAssignments that match
 * @param query the query to filter multiclusterRoleAssignments
 * @returns role assignments with kind and name
 */
export const useFindRoleAssignments = (query: MulticlusterRoleAssignmentQuery): FlattenedRoleAssignment[] => {
  // TODO: replace by new aggregated API
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments =
    useRecoilValue(multiclusterRoleAssignmentState)?.filter((multiclusterRoleAssignment) =>
      isSubjectMatch(multiclusterRoleAssignment, query)
    ) || []
  const clustersForPlacements = useGetClusterFromPlacements(multiclusterRoleAssignments)

  return multiclusterRoleAssignments
    .reduce(
      (
        multiClusterRoleAssignmentAcc: FlattenedRoleAssignment[],
        multiClusterRoleAssignmentCurr: MulticlusterRoleAssignment
      ) => [
        ...multiClusterRoleAssignmentAcc,
        ...multiClusterRoleAssignmentCurr.spec.roleAssignments
          .map((roleAssignment) => {
            const clusters: string[] = roleAssignment.clusterSelection.placements
              .map((e) => e.name)
              .flatMap((placementName: string) => get(clustersForPlacements, placementName))
            return roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, roleAssignment, clusters)
          })
          .reduce(
            (assignmentAcc: FlattenedRoleAssignment[], assignmentCurr: FlattenedRoleAssignment) =>
              isClusterOrRoleMatch(assignmentCurr, query) ? [...assignmentAcc, assignmentCurr] : assignmentAcc,
            []
          ),
      ],
      []
    )
    .sort((a, b) => a.subject.name?.localeCompare(b.subject.name ?? '') ?? 0)
}

export const findRoleAssignments = (
  query: MulticlusterRoleAssignmentQuery,
  multiClusterRoleAssignments: MulticlusterRoleAssignment[],
  clustersForPlacements: Record<string, string[]>
): FlattenedRoleAssignment[] => {
  const filteredMulticlusterRoleAssignments =
    multiClusterRoleAssignments.filter((multiclusterRoleAssignment) =>
      isSubjectMatch(multiclusterRoleAssignment, query)
    ) || []

  return filteredMulticlusterRoleAssignments.reduce(
    (
      multiClusterRoleAssignmentAcc: FlattenedRoleAssignment[],
      multiClusterRoleAssignmentCurr: MulticlusterRoleAssignment
    ) => [
      ...multiClusterRoleAssignmentAcc,
      ...multiClusterRoleAssignmentCurr.spec.roleAssignments
        .map((roleAssignment) => {
          const clusters: string[] = roleAssignment.clusterSelection.placements
            .map((e) => e.name)
            .flatMap((placementName: string) => get(clustersForPlacements, placementName))
          return roleAssignmentToFlattenedRoleAssignment(multiClusterRoleAssignmentCurr, roleAssignment, clusters)
        })
        .reduce(
          (assignmentAcc: FlattenedRoleAssignment[], assignmentCurr: FlattenedRoleAssignment) =>
            isClusterOrRoleMatch(assignmentCurr, query) ? [...assignmentAcc, assignmentCurr] : assignmentAcc,
          []
        ),
    ],
    []
  )
}

const getRoleAssignmentName = (roleAssignment: RoleAssignmentToSave): string => {
  const sortedKeys = Object.keys(roleAssignment).sort((a, b) => a.localeCompare(b))
  const sortedObject: any = {}
  for (const key of sortedKeys) {
    const value = roleAssignment[key as keyof typeof roleAssignment]

    if (key === 'clusterNames' || key === 'clusterSetNames') {
      sortedObject[key] = value
    } else if (
      (key === 'targetNamespaces' || key === 'clusterNames' || key === 'clusterSetNames') &&
      value &&
      Array.isArray(value)
    ) {
      sortedObject[key] = [...value].sort((a, b) => a.localeCompare(b))
    } else {
      sortedObject[key] = value
    }
  }
  const stringified = JSON.stringify(sortedObject)

  const hash = sha256(stringified)

  const shortHash = hash.substring(0, 16)
  return shortHash
}

const mapRoleAssignmentBeforeSaving = (roleAssignment: RoleAssignmentToSave, placement: Placement): RoleAssignment => ({
  ...roleAssignment,
  name: getRoleAssignmentName(roleAssignment),
  clusterSelection: {
    type: 'placements',
    placements: [{ name: placement.metadata.name!, namespace: placement.metadata.namespace! }],
  },
})

const validateRoleAssignmentName = (
  newRoleAssignment: RoleAssignmentToSave,
  existingRoleAssignments: RoleAssignment[]
): boolean => {
  const newName = getRoleAssignmentName(newRoleAssignment)
  const existingNames = existingRoleAssignments.map((ea) => ea.name)
  return !existingNames.includes(newName)
}

/**
 * it checks whether two RoleAssignments are the same or not
 * @param a RoleAssignment1
 * @param b RoleAssignment2
 * @returns true or false depending on whether they are the same or not
 */
const areRoleAssignmentsEquals = (a: RoleAssignment, b: RoleAssignment) => a.name === b.name

async function createAdditionalRoleAssignmentResources(
  roleAssignment: RoleAssignmentToSave,
  {
    existingManagedClusterSetBindings,
    existingPlacement,
  }: { existingManagedClusterSetBindings?: ManagedClusterSetBinding[]; existingPlacement?: Placement }
): Promise<Placement> {
  if (!existingManagedClusterSetBindings?.length) {
    await Promise.all(
      roleAssignment.clusterSetNames?.map((clusterSetName) => createForClusterSetsBinding(clusterSetName).promise) || []
    )
  }

  if (!existingPlacement) {
    return roleAssignment.clusterNames
      ? await createForClusters(roleAssignment.clusterNames).promise
      : await createForClusterSets(roleAssignment.clusterSetNames!).promise
  } else {
    return existingPlacement
  }
}

// TODO: get existingRelatedRoleAssignmets once useFindRoleAssignments is not a custom hook
/**
 * adds a new roleAssignment either to an existing MulticlusterRoleAssignment or it creates a new one adding the new roleAssignment
 * @param roleAssignment
 * @param subject
 * @returns the patched or new MulticlusterRoleAssignment
 */
export const addRoleAssignment = async (
  roleAssignment: RoleAssignmentToSave,
  {
    existingMulticlusterRoleAssignment,
    existingManagedClusterSetBindings,
    existingPlacement,
  }: {
    existingMulticlusterRoleAssignment?: MulticlusterRoleAssignment
    existingManagedClusterSetBindings?: ManagedClusterSetBinding[]
    existingPlacement?: Placement
  }
): Promise<IRequestResult<MulticlusterRoleAssignment>> => {
  const existingRoleAssignments = existingMulticlusterRoleAssignment?.spec.roleAssignments || []
  const isUnique = validateRoleAssignmentName(roleAssignment, existingRoleAssignments)

  if (!isUnique) {
    return {
      promise: Promise.reject(new ResourceError(ResourceErrorCode.BadRequest, 'Duplicate role assignment detected.')),
      abort: () => {},
    }
  }

  if (roleAssignment.clusterNames?.length || roleAssignment.clusterSetNames?.length) {
    const placement: Placement = await createAdditionalRoleAssignmentResources(roleAssignment, {
      existingManagedClusterSetBindings,
      existingPlacement,
    })

    const mappedRoleAssignment = mapRoleAssignmentBeforeSaving(roleAssignment, placement)
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
          subject: roleAssignment.subject,
          roleAssignments: [mappedRoleAssignment],
        },
        status: {},
      }
      return createResource<MulticlusterRoleAssignment>(newMultiClusterRoleAssignment)
    }
  } else {
    return {
      promise: Promise.reject(new ResourceError(ResourceErrorCode.BadRequest, 'No cluster or cluster set selected.')),
      abort: () => {},
    }
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
