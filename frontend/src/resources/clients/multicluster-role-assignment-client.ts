/* Copyright Contributors to the Open Cluster Management project */
import { sha256 } from 'js-sha256'
import { useMemo } from 'react'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { ManagedClusterSetBinding } from '../managed-cluster-set-binding'
import {
  MulticlusterRoleAssignment,
  MulticlusterRoleAssignmentApiVersion,
  MulticlusterRoleAssignmentKind,
  MulticlusterRoleAssignmentNamespace,
  PlacementRef,
  RoleAssignment,
} from '../multicluster-role-assignment'
import { GlobalPlacementName, Placement } from '../placement'
import { createResource, deleteResource, patchResource } from '../utils'
import { getResource, IRequestResult, ResourceError, ResourceErrorCode } from '../utils/resource-request'
import { createForClusterSets as createForClusterSetsBinding } from './managed-cluster-set-binding-client'
import { FlattenedRoleAssignment } from './model/flattened-role-assignment'
import { PlacementClusters } from './model/placement-clusters'
import { RoleAssignmentToSave } from './model/role-assignment-to-save'
import {
  createForClusters,
  createForClusterSets,
  doesPlacementContainsClusterName,
  doesPlacementContainsClusterSet,
  isPlacementForClusterNames,
  isPlacementForClusterSets,
  PlacementLabel,
  useGetPlacementClusters,
} from './placement-client'

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
  /** Filter by cluster set names (resolved from placements) */
  clusterSetNames?: string[]
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
  clusterNames: string[],
  clusterSetNames: string[]
): FlattenedRoleAssignment => ({
  ...roleAssignment,
  subject: {
    name: multiClusterRoleAssignment.spec.subject.name,
    kind: multiClusterRoleAssignment.spec.subject.kind,
  },
  relatedMulticlusterRoleAssignment: multiClusterRoleAssignment,
  status: multiClusterRoleAssignment?.status?.roleAssignments?.find((e) => e.name === roleAssignment.name),
  clusterNames,
  clusterSetNames,
})

/**
 * Resolves cluster names for a role assignment by looking up its placement references.
 *
 * @param roleAssignment - The role assignment containing placement references
 * @param placementClusters - Array of placement clusters to search
 * @returns Array of cluster names associated with the role assignment's placements
 */
const getClustersForRoleAssignment = (
  roleAssignment: RoleAssignment,
  placementClusters: PlacementClusters[]
): string[] =>
  [
    ...new Set(
      roleAssignment.clusterSelection.placements
        .map((placement) => placement.name)
        .flatMap(
          (placementName) =>
            placementClusters.find((pc) => pc.placement.metadata.name === placementName)?.clusters ?? []
        )
    ),
  ].sort((a, b) => a.localeCompare(b))

const doesPlacementRefMatchesPlacement = (placementRef: PlacementRef, placementB: Placement) =>
  placementRef.name === placementB.metadata.name && placementRef.namespace === placementB.metadata.namespace

/**
 * Flattens a MulticlusterRoleAssignment into individual FlattenedRoleAssignment objects,
 * filtering by cluster or role match.
 *
 * @param multiclusterRoleAssignment - The parent MulticlusterRoleAssignment
 * @param placementClusters - Array of placement clusters for cluster resolution
 * @param query - Query parameters for filtering
 * @returns Array of FlattenedRoleAssignments that match the query
 */
const flattenMulticlusterRoleAssignment = (
  multiclusterRoleAssignment: MulticlusterRoleAssignment,
  placementClusters: PlacementClusters[],
  query: MulticlusterRoleAssignmentQuery
): FlattenedRoleAssignment[] =>
  multiclusterRoleAssignment.spec.roleAssignments
    .map((roleAssignment) =>
      roleAssignmentToFlattenedRoleAssignment(
        multiclusterRoleAssignment,
        roleAssignment,
        getClustersForRoleAssignment(roleAssignment, placementClusters),
        placementClusters
          .filter(
            (placementCluster) =>
              roleAssignment.clusterSelection.type === 'placements' &&
              roleAssignment.clusterSelection.placements.some((roleAssignmentPlacement) =>
                doesPlacementRefMatchesPlacement(roleAssignmentPlacement, placementCluster.placement)
              )
          )
          .flatMap((placementCluster) => placementCluster.clusterSetNames ?? [])
      )
    )
    .filter((flattenedRoleAssignment) => isClusterOrClustersetOrRoleMatch(flattenedRoleAssignment, query))

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
const isClusterOrClustersetOrRoleMatch = (
  roleAssignment: FlattenedRoleAssignment,
  query: MulticlusterRoleAssignmentQuery
): boolean => {
  switch (true) {
    // Filter by cluster names
    case query.clusterNames?.length &&
      !roleAssignment.clusterNames.some((clusterName) => query.clusterNames!.includes(clusterName)):
      return false
    // Filter by cluster set names
    case query.clusterSetNames?.length &&
      !roleAssignment.clusterSetNames.some((clusterSetName) => query.clusterSetNames!.includes(clusterSetName)):
      return false
    // Filter by roles
    case query.roles?.length && !query.roles.includes(roleAssignment.clusterRole):
      return false
    default:
      return true
  }
}

/**
 * React hook that resolves MulticlusterRoleAssignments to PlacementClusters
 * Extracts all placement names from the MulticlusterRoleAssignments and uses
 * useGetPlacementClusters to resolve them to PlacementClusters.
 *
 * @param multiclusterRoleAssignments - Array of MulticlusterRoleAssignments to process
 * @returns Array of PlacementClusters for the placements together with the clusters and cluster sets
 */
const useGetPlacementClustersForMulticlusterRoleAssignments = (
  multiclusterRoleAssignments: MulticlusterRoleAssignment[]
): PlacementClusters[] =>
  useGetPlacementClusters(
    multiclusterRoleAssignments.flatMap((multiclusterRoleAssignment) =>
      multiclusterRoleAssignment.spec.roleAssignments.flatMap((roleAssignment) =>
        roleAssignment.clusterSelection.placements.map((e) => e.name)
      )
    )
  )

/**
 * Filters MulticlusterRoleAssignments and returns flattened role assignments matching the query.
 * Non-hook version that accepts pre-resolved clusters for placements.
 * Used when the clusters map is already available (e.g., in modal save operations).
 *
 * @param query - Query parameters for filtering
 * @param multiClusterRoleAssignments - Array of MulticlusterRoleAssignments to filter
 * @param placementClusters - Pre-resolved map of placement names to cluster names
 * @returns Array of FlattenedRoleAssignments matching all query filters
 */
export const findRoleAssignments = (
  query: MulticlusterRoleAssignmentQuery,
  multiClusterRoleAssignments: MulticlusterRoleAssignment[],
  placementClusters: PlacementClusters[]
): FlattenedRoleAssignment[] => {
  const filteredMulticlusterRoleAssignments = multiClusterRoleAssignments.filter((multiClusterRoleAssignment) =>
    isSubjectMatch(multiClusterRoleAssignment, query)
  )

  return filteredMulticlusterRoleAssignments
    .flatMap((multiClusterRoleAssignments) =>
      flattenMulticlusterRoleAssignment(multiClusterRoleAssignments, placementClusters, query)
    )
    .sort((a, b) => a.subject.name?.localeCompare(b.subject.name ?? '') ?? 0)
}

/**
 * Filters MulticlusterRoleAssignments by query parameters, returns only relevant nested RoleAssignments that match
 * @param query the query to filter multiclusterRoleAssignments
 * @returns role assignments with kind and name
 */
export const useFindRoleAssignments = (query: MulticlusterRoleAssignmentQuery): FlattenedRoleAssignment[] => {
  const { multiclusterRoleAssignmentState } = useSharedAtoms()
  const multiclusterRoleAssignments = useRecoilValue(multiclusterRoleAssignmentState)
  const clustersForPlacements = useGetPlacementClustersForMulticlusterRoleAssignments(multiclusterRoleAssignments)

  return useMemo(
    () => findRoleAssignments(query, multiclusterRoleAssignments, clustersForPlacements),
    [query, multiclusterRoleAssignments, clustersForPlacements]
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
const ARRAY_KEYS_FOR_NAME = ['clusterNames', 'clusterSetNames', 'targetNamespaces']

export const getRoleAssignmentName = (roleAssignment: RoleAssignmentToSave): string => {
  const allKeys = [...new Set([...Object.keys(roleAssignment), ...ARRAY_KEYS_FOR_NAME])].sort((a, b) =>
    a.localeCompare(b)
  )
  const sortedObject = allKeys.reduce<Record<string, unknown>>((acc, key) => {
    const value = roleAssignment[key as keyof RoleAssignmentToSave]
    if (ARRAY_KEYS_FOR_NAME.includes(key)) {
      const arr = Array.isArray(value) && value.length > 0 ? value : []
      acc[key] = arr.length > 0 ? [...arr].sort((a, b) => a.localeCompare(b)) : []
    } else {
      acc[key] = value
    }
    return acc
  }, {})

  const emptyValuesToUndefinedReplacer = (_k: any, value: any) => {
    switch (true) {
      case value !== undefined && Array.isArray(value) && value.length === 0:
      case value !== undefined && typeof value === 'object' && Object.keys(value).length === 0:
      case value !== undefined && typeof value === 'string' && value.trim().length === 0:
        return undefined
      default:
        return value
    }
  }

  const stringified = JSON.stringify(sortedObject, emptyValuesToUndefinedReplacer)
  const hash = sha256(stringified)
  return hash.substring(0, 16)
}

/**
 * Maps a RoleAssignmentToSave to a RoleAssignment ready for storage.
 * Generates the name using hash and sets up the clusterSelection with the placement reference.
 *
 * @param roleAssignment - The role assignment data to transform
 * @param placements - The Placement resources to reference in clusterSelection
 * @returns RoleAssignment ready to be added to a MulticlusterRoleAssignment
 */
const mapRoleAssignmentBeforeSaving = (
  roleAssignment: RoleAssignmentToSave,
  placements: Placement[]
): RoleAssignment => ({
  ...roleAssignment,
  name: getRoleAssignmentName(roleAssignment),
  clusterSelection: {
    type: 'placements',
    placements: placements.map((placement) => ({
      name: placement.metadata.name!,
      namespace: placement.metadata.namespace!,
    })),
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
export async function createAdditionalRoleAssignmentResources(
  roleAssignment: RoleAssignmentToSave,
  {
    existingManagedClusterSetBindings,
    existingPlacements,
  }: { existingManagedClusterSetBindings?: ManagedClusterSetBinding[]; existingPlacements?: Placement[] }
): Promise<Placement[]> {
  // create new ManagedClusterSetBindings for cluster sets that are not already created
  await Promise.all(
    roleAssignment.clusterSetNames
      ?.filter(
        (clusterSetName) =>
          !existingManagedClusterSetBindings?.some((binding) => binding.spec.clusterSet === clusterSetName)
      )
      .map((clusterSetName) => createForClusterSetsBinding(clusterSetName).promise) || []
  )

  // create new Placement (just one) for clusters that are not already created
  const clustersToCreatePlacementFor: string[] | undefined = roleAssignment.clusterNames?.filter(
    (clusterName) =>
      !existingPlacements
        ?.filter(isPlacementForClusterNames)
        ?.some((placement) => doesPlacementContainsClusterName(placement, clusterName))
  )
  const placementsForNames: Placement[] = clustersToCreatePlacementFor?.length
    ? [await createForClusters(clustersToCreatePlacementFor).promise]
    : []

  // create new Placements (one per cluster set, in order to be reusable) for cluster sets that are not already created
  const placementsForSets: Placement[] = await Promise.all(
    roleAssignment.clusterSetNames
      ?.filter(
        (clusterSetName) =>
          !existingPlacements
            ?.filter(isPlacementForClusterSets)
            ?.some((placement) => doesPlacementContainsClusterSet(placement, clusterSetName))
      )
      .map((clusterSetName) => createForClusterSets([clusterSetName]).promise) || []
  )
  return [...(existingPlacements ?? []), ...placementsForNames, ...placementsForSets]
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
    existingPlacements,
  }: {
    existingMulticlusterRoleAssignment?: MulticlusterRoleAssignment
    existingManagedClusterSetBindings?: ManagedClusterSetBinding[]
    existingPlacements: Placement[]
  }
): Promise<RoleAssignment> => {
  const existingRoleAssignments = existingMulticlusterRoleAssignment?.spec.roleAssignments || []
  const isUnique = validateRoleAssignmentName(roleAssignment, existingRoleAssignments)

  if (!isUnique) {
    throw new ResourceError(ResourceErrorCode.BadRequest, 'Duplicate role assignment detected.')
  }

  if (roleAssignment.clusterNames?.length || roleAssignment.clusterSetNames?.length || roleAssignment.isGlobalScope) {
    const placements: Placement[] = await createAdditionalRoleAssignmentResources(roleAssignment, {
      existingManagedClusterSetBindings,
      existingPlacements,
    })

    const mappedRoleAssignment = mapRoleAssignmentBeforeSaving(roleAssignment, placements)
    if (existingMulticlusterRoleAssignment) {
      patchResource(existingMulticlusterRoleAssignment, {
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
          labels: { ...PlacementLabel },
        },
        spec: {
          subject: roleAssignment.subject,
          roleAssignments: [mappedRoleAssignment],
        },
        status: {},
      }
      createResource<MulticlusterRoleAssignment>(newMultiClusterRoleAssignment)
    }
    return mappedRoleAssignment
  } else {
    throw new ResourceError(ResourceErrorCode.BadRequest, 'No cluster or cluster set selected.')
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

/**
 * Checks if a placement's cluster sets are a subset of the role assignment's cluster sets.
 * A placement matches if ALL of its cluster sets are included in the role assignment's cluster sets.
 *
 * @param placementClusterSetNames - The cluster set names from the placement
 * @param roleAssignmentClusterSetNames - The cluster set names from the role assignment
 * @returns True if all placement cluster sets are in the role assignment's cluster sets
 */
const isPlacementClusterSetsSubset = (
  placementClusterSetNames: string[] | undefined,
  roleAssignmentClusterSetNames: string[] | undefined
): boolean =>
  !placementClusterSetNames?.length || !roleAssignmentClusterSetNames?.length
    ? false
    : placementClusterSetNames.every((clusterSetName) => roleAssignmentClusterSetNames.includes(clusterSetName))

/**
 * Checks if a placement's cluster names exactly match the role assignment's cluster names.
 * Both arrays must contain the same elements (order doesn't matter).
 *
 * @param placementClusterNames - The cluster names from the placement
 * @param roleAssignmentClusterNames - The cluster names from the role assignment
 * @returns True if both arrays contain exactly the same elements
 */
const isPlacementClustersExactMatch = (
  placementClusterNames: string[],
  roleAssignmentClusterNames: string[] | undefined
): boolean =>
  !placementClusterNames.length ||
  !roleAssignmentClusterNames?.length ||
  roleAssignmentClusterNames.length !== placementClusterNames.length
    ? false
    : placementClusterNames.every((cluster) => roleAssignmentClusterNames.includes(cluster))

/**
 * Finds placements that match a role assignment based on cluster names or cluster sets.
 * A placement matches by clusters if its clusters exactly match the role assignment's cluster names.
 * A placement matches by cluster sets if all its cluster sets are in the role assignment's cluster set names (subset).
 *
 * @param roleAssignment - The role assignment to find placements for
 * @param placementClusters - Array of PlacementClusters to search through
 * @returns Array of Placement resources that match the role assignment
 */
export const getPlacementsForRoleAssignment = (
  roleAssignment: RoleAssignmentToSave,
  placementClusters: PlacementClusters[]
): Placement[] => {
  if (roleAssignment.isGlobalScope) {
    const globalPlacement = placementClusters
      .map((placementCluster) => placementCluster.placement)
      .find(
        (placement) =>
          placement.metadata.namespace === MulticlusterRoleAssignmentNamespace &&
          placement.metadata.name === GlobalPlacementName
      )
    if (globalPlacement === undefined) {
      throw new ResourceError(
        ResourceErrorCode.BadRequest,
        `Global placement not found. Expected placement with name: ${GlobalPlacementName} and namespace: ${MulticlusterRoleAssignmentNamespace}.`
      )
    }
    return [globalPlacement]
  } else {
    const relevantPlacementClusters = placementClusters.filter(
      (placementCluster) => placementCluster.placement.metadata.namespace === MulticlusterRoleAssignmentNamespace
    )

    const placementClustersForClusters = roleAssignment.clusterNames
      ? relevantPlacementClusters.filter((placementCluster) =>
          isPlacementClustersExactMatch(placementCluster.clusters, roleAssignment.clusterNames)
        )
      : []
    const placementClustersForClusterSets = relevantPlacementClusters.filter((placementCluster) =>
      isPlacementClusterSetsSubset(placementCluster.clusterSetNames, roleAssignment.clusterSetNames)
    )
    return [...placementClustersForClusters, ...placementClustersForClusterSets].map(
      (placementCluster) => placementCluster.placement
    )
  }
}
