/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { PlacementDecision } from '../placement-decision'

/**
 * Query parameters for filtering PlacementDecision resources.
 */
interface PlacementDecisionQuery {
  /** Filter by PlacementDecision names */
  names?: string[]
  /** Filter by owner Placement names (via ownerReferences) */
  placementNames?: string[]
}

/**
 * Checks if a PlacementDecision is owned by any of the specified Placements.
 * Examines owner references to find Placement kind references.
 *
 * @param placement - The PlacementDecision to check
 * @param query - Query containing placementNames to match against
 * @returns True if the PlacementDecision is owned by any of the queried Placements
 */
const isPlacementMatch = (placement: PlacementDecision, query: PlacementDecisionQuery) =>
  query.placementNames?.length &&
  placement.metadata.ownerReferences?.some(
    (ownerReference) => ownerReference.kind === 'Placement' && query.placementNames?.includes(ownerReference.name)
  )

/**
 * Checks if a PlacementDecision's name matches any of the specified names.
 *
 * @param placement - The PlacementDecision to check
 * @param query - Query containing names to match against
 * @returns True if the PlacementDecision's name is in the query's names
 */
const isNameMatch = (placement: PlacementDecision, query: PlacementDecisionQuery) =>
  query.names?.length && placement.metadata.name && query.names.includes(placement.metadata.name)

/**
 * React hook to find PlacementDecisions matching the query from global Recoil state.
 * Matches by name OR by owner Placement name (logical OR).
 *
 * @param query - Query parameters for filtering PlacementDecisions
 * @returns Array of PlacementDecision resources matching the query
 */
export const useFindPlacementDecisions = (query: PlacementDecisionQuery): PlacementDecision[] => {
  const { placementDecisionsState } = useSharedAtoms()
  const placementDecisions = useRecoilValue(placementDecisionsState)

  return placementDecisions?.filter((placement) => isNameMatch(placement, query) || isPlacementMatch(placement, query))
}

/**
 * Extracts cluster names from a PlacementDecision's status decisions.
 *
 * @param placementDecision - The PlacementDecision to extract clusters from
 * @returns Array of cluster names from the PlacementDecision's decisions
 */
export const getClustersFromPlacementDecision = (placementDecision: PlacementDecision): string[] =>
  placementDecision.status?.decisions?.map((decision) => decision.clusterName) || []

/**
 * React hook to get unique cluster names from PlacementDecisions matching the query.
 * Combines clusters from all matching PlacementDecisions and removes duplicates.
 *
 * @param query - Query parameters for filtering PlacementDecisions
 * @returns Array of unique cluster names from matching PlacementDecisions
 */
export const useGetClustersFromPlacementDecision = (query: PlacementDecisionQuery): string[] => [
  ...new Set(useFindPlacementDecisions(query).flatMap(getClustersFromPlacementDecision)),
]
