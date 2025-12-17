/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { PlacementDecision } from '../placement-decision'

interface PlacementDecisionQuery {
  names?: string[]
  placementNames?: string[]
}

const isPlacementMatch = (placement: PlacementDecision, query: PlacementDecisionQuery) =>
  query.placementNames?.length &&
  placement.metadata.ownerReferences?.some(
    (ownerReference) => ownerReference.kind === 'Placement' && query.placementNames?.includes(ownerReference.name)
  )

const isNameMatch = (placement: PlacementDecision, query: PlacementDecisionQuery) =>
  query.names?.length && placement.metadata.name && query.names.includes(placement.metadata.name)

export const useFindPlacementDecisions = (query: PlacementDecisionQuery): PlacementDecision[] => {
  const { placementDecisionsState } = useSharedAtoms()
  const placementDecisions = useRecoilValue(placementDecisionsState)

  return placementDecisions?.filter((placement) => isNameMatch(placement, query) || isPlacementMatch(placement, query))
}

export const useGetClustersFromPlacementDecision = (query: PlacementDecisionQuery) => [
  ...new Set(
    useFindPlacementDecisions(query)
      .filter((placementDecision) => placementDecision.status)
      .flatMap((placementDecision) => placementDecision.status!.decisions.map((decision) => decision.clusterName))
  ),
]
