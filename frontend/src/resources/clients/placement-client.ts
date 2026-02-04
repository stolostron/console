/* Copyright Contributors to the Open Cluster Management project */
import { sha256 } from 'js-sha256'
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement, PlacementApiVersionBeta, PlacementKind, PlacementPredicates } from '../placement'
import { PlacementDecision } from '../placement-decision'
import { createResource, IRequestResult } from '../utils'
import { PlacementClusters } from './model/placement-clusters'
import { getClustersFromPlacementDecision, useFindPlacementDecisions } from './placement-decision-client'

export const PlacementLabel = { 'open-cluster-management.io/managed-by': 'console' }

/**
 * Query parameters for filtering Placement resources.
 */
interface PlacementQuery {
  /** Filter by placement names. Empty array matches all placements. */
  placementNames?: string[]
  /** Filter by cluster names found in placement predicates. Empty array matches all. */
  clusterNames?: string[]
  /** Filter by cluster set names. Empty array matches all. */
  clusterSetNames?: string[]
  /** Logical operator for combining filters: 'and' (default) requires all to match, 'or' requires any to match. */
  logicalOperator?: 'and' | 'or'
}

/**
 * Checks if a placement matches the placementNames filter.
 * Returns true if no placementNames filter is provided or if placement name is in the filter list.
 */
const isPlacementNameMatch = (placement: Placement, query: PlacementQuery): boolean =>
  !query.placementNames?.length ||
  (placement.metadata.name && query.placementNames.includes(placement.metadata.name)) ||
  false

/**
 * Checks if a placement matches the clusterNames filter.
 * Returns true if no clusterNames filter is provided or if any of the placement's
 * cluster names are in the filter list.
 */
const isClusterNameMatch = (placement: Placement, query: PlacementQuery): boolean => {
  if (!query.clusterNames?.length) return true
  const clusterNamesFromPlacements: string[] =
    placement.spec.predicates
      ?.flatMap((predicate) =>
        predicate.requiredClusterSelector?.labelSelector?.matchExpressions
          ?.filter((matchExpression) => matchExpression.key === 'name' && matchExpression.values?.length)
          .flatMap((matchExpression) => matchExpression.values)
      )
      .filter((value): value is string => value !== undefined) || []

  return (
    clusterNamesFromPlacements?.length === query.clusterNames.length &&
    clusterNamesFromPlacements.every((value) => query.clusterNames!.includes(value))
  )
}

/**
 * Checks if a placement matches the clusterSetNames filter.
 * Returns true if no clusterSetNames filter is provided or if any of the placement's
 * cluster set names are in the filter list.
 */
const isClusterSetNameMatch = (placement: Placement, query: PlacementQuery): boolean => {
  if (!query.clusterSetNames?.length) {
    return true
  }
  const clusterSetNamesFromPlacements: string[] = placement.spec.clusterSets || []
  return (
    clusterSetNamesFromPlacements?.length === query.clusterSetNames.length &&
    clusterSetNamesFromPlacements.every((value) => query.clusterSetNames!.includes(value))
  )
}
export const isPlacementForClusterSets = (placement: Placement): boolean =>
  placement.spec.clusterSets !== undefined && placement.spec.clusterSets.length > 0

export const isPlacementForClusterNames = (placement: Placement): boolean => !isPlacementForClusterSets(placement)

export const doesPlacementContainsClusterName = (placement: Placement, clusterName: string): boolean =>
  placement.spec.predicates?.some((predicate) =>
    predicate.requiredClusterSelector?.labelSelector?.matchExpressions?.some(
      (expression) => expression.key === 'name' && expression.values?.includes(clusterName)
    )
  ) || false

export const doesPlacementContainsClusterSet = (placement: Placement, clusterSetName: string): boolean =>
  placement.spec.clusterSets?.includes(clusterSetName) || false

/**
 * Filters placements based on the provided query parameters.
 * Supports filtering by placement names, cluster names (from predicates), and cluster set names.
 * Uses logical AND by default; set logicalOperator to 'or' for OR logic.
 *
 * @param placements - Array of Placement resources to filter
 * @param query - Query parameters for filtering
 * @returns Filtered array of Placement resources matching the query
 */
const findPlacements = (placements: Placement[], query: PlacementQuery): Placement[] => {
  const isPlacementNameMatchFn = (placement: Placement) => isPlacementNameMatch(placement, query)
  const isClusterNameMatchFn = (placement: Placement) => isClusterNameMatch(placement, query)
  const isClusterSetNameMatchFn = (placement: Placement) => isClusterSetNameMatch(placement, query)

  if (query.logicalOperator === 'or') {
    return placements?.filter(
      (placement) =>
        isPlacementNameMatchFn(placement) || isClusterNameMatchFn(placement) || isClusterSetNameMatchFn(placement)
    )
  } else {
    return placements?.filter(
      (placement) =>
        isPlacementNameMatchFn(placement) && isClusterNameMatchFn(placement) && isClusterSetNameMatchFn(placement)
    )
  }
}

/**
 * React hook to find placements matching the query from the global Recoil state.
 *
 * @param query - Query parameters for filtering placements
 * @returns Array of Placement resources matching the query
 */
export const useFindPlacements = (query: PlacementQuery): Placement[] => {
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)

  return findPlacements(placements, query)
}

/**
 * Extracts cluster names from a single predicate's matchExpressions.
 * Only extracts values from matchExpressions where key is 'name'.
 *
 * @param predicate - The placement predicate to extract cluster names from
 * @returns Array of cluster names from the predicate's matchExpressions
 */
const getClusterNamesFromPredicate = (predicate: PlacementPredicates): string[] => {
  const matchExpressions = predicate.requiredClusterSelector.labelSelector?.matchExpressions

  return matchExpressions?.length
    ? matchExpressions
        .filter((expr) => expr.key === 'name' && expr.values?.length)
        .flatMap((expr) => expr.values!.filter(Boolean))
    : []
}

/**
 * Extracts unique cluster names from placement predicates.
 * Looks for matchExpressions with key 'name' and extracts their values.
 *
 * @param placements - Array of Placement resources to extract clusters from
 * @returns Array of unique cluster names found in the placements' predicates
 */
const getClusterFromPlacements = (placements: Placement[]): string[] => {
  const clusterNames = placements
    .filter((placement) => placement.spec.predicates?.length)
    .flatMap((placement) => placement.spec.predicates!.flatMap(getClusterNamesFromPredicate))

  return [...new Set(clusterNames)]
}

/**
 * Checks if a PlacementDecision belongs to a specific Placement by examining owner references.
 *
 * @param placementDecision - The PlacementDecision to check
 * @param placement - The Placement to check ownership against
 * @returns True if the PlacementDecision is owned by the Placement
 */
const doesPlacementDecisionBelongToPlacement = (placementDecision: PlacementDecision, placement: Placement) =>
  placementDecision.metadata.ownerReferences
    ?.filter((e) => e.kind === 'Placement')
    .some((ownerReference) => ownerReference.name === placement.metadata.name)

/**
 * React hook that creates a map of placement names to their resolved cluster names.
 * Combines clusters from both placement predicates and PlacementDecision resources.
 * This is used to resolve which clusters a RoleAssignment applies to based on its placements.
 *
 * @param placementNames - Array of placement names to resolve clusters for
 * @returns Array of PlacementClusters for the placements together with the clusters and cluster sets
 */
export const useGetPlacementClusters = (placementNames?: string[]): PlacementClusters[] => {
  const placements = useFindPlacements({ placementNames })
  const placementDecisions = useFindPlacementDecisions({ placementNames })

  return placements.reduce((acc: PlacementClusters[], placement: Placement) => {
    const placementDecision = placementDecisions.find((placementDecision) =>
      doesPlacementDecisionBelongToPlacement(placementDecision, placement)
    )
    const clustersFromPlacementDecisions: string[] = placementDecision
      ? getClustersFromPlacementDecision(placementDecision)
      : []
    const clustersFromPlacements: string[] = getClusterFromPlacements([placement])
    return [
      ...acc,
      {
        placement,
        clusters: [...new Set([...clustersFromPlacements, ...clustersFromPlacementDecisions])],
        clusterSetNames: placement.spec.clusterSets,
      },
    ]
  }, [])
}

/**
 * Creates a new Placement resource.
 *
 * @param placement - The Placement resource to create
 * @returns IRequestResult containing the promise and abort function
 */
const create = (placement: Placement): IRequestResult<Placement> => createResource<Placement>(placement)

/**
 * Generates a placement resource name based on the given cluster/clusterSet names.
 * The name is the cluster names joined with '-and-'. If the resulting name exceeds
 * 63 characters, it returns a SHA-256 hash truncated to 63 characters instead.
 *
 * @param elements - Array of cluster names or cluster set names used to generate the placement name
 * @param prefix - Prefix for the placement name
 * @returns A placement name as a string (max length 63 characters)
 */
const producePlacementName = (elements: string[], prefix: string) => {
  const MAX_LENGTH = 63
  const clusterNamesString = elements.join('-and-')

  const suggestedName = `${prefix}${elements.join('-and-')}`

  return suggestedName.length > MAX_LENGTH
    ? `${prefix}${sha256(clusterNamesString)}`.substring(0, MAX_LENGTH)
    : suggestedName
}

const placementTolerations: Placement['spec']['tolerations'] = [
  { key: 'cluster.open-cluster-management.io/unreachable', operator: 'Equal' },
  { key: 'cluster.open-cluster-management.io/unavailable', operator: 'Equal' },
]

/**
 * Creates a Placement resource with the given name elements, prefix, and spec content.
 * Shared helper for createForClusterSets and createForClusters.
 *
 * @param nameElements - Array of names used to generate the placement name (e.g. cluster set or cluster names)
 * @param namePrefix - Prefix for the placement name (e.g. 'cluster-sets-' or 'clusters-')
 * @param specContent - Either clusterSets or predicates to define which clusters the placement selects
 * @param namespace - Namespace for the placement (defaults to MulticlusterRoleAssignmentNamespace)
 * @returns IRequestResult containing the promise and abort function
 */
const createPlacement = (
  nameElements: string[],
  namePrefix: string,
  specContent: { clusterSets: string[] } | { predicates: PlacementPredicates[] },
  namespace = MulticlusterRoleAssignmentNamespace
): IRequestResult<Placement> => {
  const placement: Placement = {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: {
      name: producePlacementName(nameElements, namePrefix),
      namespace,
      labels: { ...PlacementLabel },
    },
    spec: {
      ...specContent,
      tolerations: placementTolerations,
    },
  }
  return create(placement)
}

/**
 * Creates a Placement resource that selects clusters based on cluster sets.
 * The placement name is generated by joining cluster set names with '-and-'.
 * Includes tolerations for unreachable and unavailable clusters.
 *
 * @param clusterSets - Array of cluster set names to include in the placement
 * @param namespace - Namespace for the placement (defaults to MulticlusterRoleAssignmentNamespace)
 * @returns IRequestResult containing the promise and abort function
 */
export const createForClusterSets = (clusterSets: string[], namespace = MulticlusterRoleAssignmentNamespace) =>
  createPlacement(clusterSets, 'cluster-sets-', { clusterSets }, namespace)

/**
 * Creates a Placement resource that selects specific clusters using label selectors.
 * Uses predicates with matchExpressions to select clusters by their 'name' label.
 * The placement name is prefixed with 'clusters-' followed by cluster names joined with '-and-'.
 * Includes tolerations for unreachable and unavailable clusters.
 *
 * @param clusters - Array of cluster names to select
 * @param namespace - Namespace for the placement (defaults to MulticlusterRoleAssignmentNamespace)
 * @returns IRequestResult containing the promise and abort function
 */
export const createForClusters = (clusters: string[], namespace = MulticlusterRoleAssignmentNamespace) =>
  createPlacement(
    clusters,
    'clusters-',
    {
      predicates: [
        {
          requiredClusterSelector: {
            labelSelector: {
              matchExpressions: [{ key: 'name', operator: 'In', values: clusters }],
            },
          },
        },
      ],
    },
    namespace
  )
