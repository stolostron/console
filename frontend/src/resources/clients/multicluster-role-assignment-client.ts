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

/**
 * Query parameters for filtering MulticlusterRoleAssignment resources.
 */
interface MulticlusterRoleAssignmentQuery {
  /** Filter by subject names (users, groups, or service accounts) */
  subjectNames?: string[]
  /** Filter by subject kinds (User, Group, ServiceAccount) */
  subjectKinds?: FlattenedRoleAssignment['subject']['kind'][]
  /** Filter by role names */
  roles?: string[]
  /** Filter by cluster names (resolved from placements) */
  clusterNames?: string[]
}

/**
 * Converts a RoleAssignment within a MulticlusterRoleAssignment to a flattened structure.
 * Combines the subject info from the parent with the role assignment details.
 *
 * @param multiClusterRoleAssignment - The parent MulticlusterRoleAssignment
 * @param roleAssignment - The nested RoleAssignment to flatten
 * @param clusterNames - Resolved cluster names from the placement
 * @returns FlattenedRoleAssignment with all relevant data combined
 */
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

/**
 * Checks if a MulticlusterRoleAssignment's subject matches the query filters.
 * Filters by subject names and/or subject kinds.
 *
 * @param multiClusterRoleAssignment - The assignment to check
 * @param query - Query containing subject filters
 * @returns True if the subject matches all provided filters
 */
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

/**
 * Checks if a FlattenedRoleAssignment matches the cluster and role filters.
 * Filters by cluster names (resolved from placements) and/or role names.
 *
 * @param roleAssignment - The flattened role assignment to check
 * @param query - Query containing cluster and role filters
 * @returns True if the assignment matches all provided filters
 */
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

/**
 * React hook that resolves placement names to cluster names for all role assignments.
 * Extracts all placement names from the MulticlusterRoleAssignments and uses
 * useGetClustersForPlacementMap to resolve them to actual cluster names.
 *
 * @param multiclusterRoleAssignments - Array of MulticlusterRoleAssignments to process
 * @returns Record mapping placement names to arrays of cluster names
 */
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
              .flatMap((placementName: string) => get(clustersForPlacements, placementName).clusters)
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

/**
 * Filters MulticlusterRoleAssignments and returns flattened role assignments matching the query.
 * Non-hook version that accepts pre-resolved clusters for placements.
 * Used when the clusters map is already available (e.g., in modal save operations).
 *
 * @param query - Query parameters for filtering
 * @param multiClusterRoleAssignments - Array of MulticlusterRoleAssignments to filter
 * @param clustersForPlacements - Pre-resolved map of placement names to cluster names
 * @returns Array of FlattenedRoleAssignments matching all query filters
 */
export const findRoleAssignments = (
  query: MulticlusterRoleAssignmentQuery,
  multiClusterRoleAssignments: MulticlusterRoleAssignment[],
  clustersForPlacements: Record<string, { placement: Placement; clusters: string[] }>
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
            .flatMap((placementName: string) => get(clustersForPlacements, placementName).clusters)
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

/**
 * Generates a unique name for a role assignment using SHA-256 hash.
 * Creates a deterministic name based on the role assignment's properties.
 * Used to detect duplicate role assignments.
 *
 * @param roleAssignment - The role assignment to generate a name for
 * @returns A 16-character hash string as the role assignment name
 */
const getRoleAssignmentName = (roleAssignment: RoleAssignmentToSave): string => {
  const sortedKeys = Object.keys(roleAssignment).sort((a, b) => a.localeCompare(b))
  const sortedObject: any = {}
  for (const key of sortedKeys) {
    const value = roleAssignment[key as keyof typeof roleAssignment]

    if (['targetNamespaces', 'clusterNames', 'clusterSetNames'].includes(key) && value && Array.isArray(value)) {
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

/**
 * Maps a RoleAssignmentToSave to a RoleAssignment ready for storage.
 * Generates the name using hash and sets up the clusterSelection with the placement reference.
 *
 * @param roleAssignment - The role assignment data to transform
 * @param placement - The Placement resource to reference in clusterSelection
 * @returns RoleAssignment ready to be added to a MulticlusterRoleAssignment
 */
const mapRoleAssignmentBeforeSaving = (roleAssignment: RoleAssignmentToSave, placement: Placement): RoleAssignment => ({
  ...roleAssignment,
  name: getRoleAssignmentName(roleAssignment),
  clusterSelection: {
    type: 'placements',
    placements: [{ name: placement.metadata.name!, namespace: placement.metadata.namespace! }],
  },
})

/**
 * Validates that a new role assignment doesn't duplicate an existing one.
 * Compares the generated hash name against existing role assignment names.
 *
 * @param newRoleAssignment - The new role assignment to validate
 * @param existingRoleAssignments - Array of existing role assignments to check against
 * @returns True if the role assignment is unique, false if it's a duplicate
 */
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

/**
 * Creates additional Kubernetes resources needed for a role assignment.
 * Creates ManagedClusterSetBindings for cluster sets (if not existing) and
 * creates a Placement resource (if not existing) for the target clusters/cluster sets.
 * Reuses existing resources when available to avoid duplicates.
 *
 * @param roleAssignment - The role assignment being created
 * @param existingManagedClusterSetBindings - Existing bindings that can be reused
 * @param existingPlacement - Existing placement that can be reused
 * @returns The Placement resource to reference in the role assignment
 */
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

  if (existingPlacement) {
    return existingPlacement
  } else {
    return roleAssignment.clusterNames
      ? await createForClusters(roleAssignment.clusterNames).promise
      : await createForClusterSets(roleAssignment.clusterSetNames!).promise
  }
}

// TODO: get existingRelatedRoleAssignmets once useFindRoleAssignments is not a custom hook
/**
 * Adds a new role assignment, either to an existing MulticlusterRoleAssignment or by creating a new one.
 * Handles the complete workflow:
 * 1. Validates that the role assignment is not a duplicate
 * 2. Creates ManagedClusterSetBindings if needed (for cluster set selections)
 * 3. Creates or reuses a Placement for the cluster/cluster set selection
 * 4. Patches existing or creates new MulticlusterRoleAssignment
 *
 * @param roleAssignment - The role assignment data to save
 * @param existingMulticlusterRoleAssignment - Existing MCRA for the same subject (to patch instead of create)
 * @param existingManagedClusterSetBindings - Existing bindings that can be reused
 * @param existingPlacement - Existing placement that can be reused
 * @returns IRequestResult containing the created/patched MulticlusterRoleAssignment
 * @throws ResourceError if duplicate detected or no cluster/cluster set selected
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
