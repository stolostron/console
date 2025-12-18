/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../placement'
import { PlacementDecision } from '../placement-decision'
import { createResource, IRequestResult } from '../utils'
import {
  getClustersFromPlacementDecision,
  useFindPlacementDecisions,
  useGetClustersFromPlacementDecision,
} from './placement-decision-client'

interface PlacementQuery {
  placementNames?: string[]
}

const isPlacementNameMatch = (placement: Placement, query: PlacementQuery) =>
  placement.metadata.name && query.placementNames?.length && query.placementNames.includes(placement.metadata.name)

export const useFindPlacements = (query: PlacementQuery): Placement[] => {
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)

  return placements?.filter((placement) => isPlacementNameMatch(placement, query))
}

const getClusterFromPlacements = (placements: Placement[]) => [
  ...new Set(
    placements
      .filter((placement) => placement.spec.predicates?.length)
      .flatMap((placement) =>
        placement.spec
          .predicates!.filter(
            (predicate) =>
              predicate.requiredClusterSelector.labelSelector?.matchExpressions &&
              predicate.requiredClusterSelector.labelSelector.matchExpressions.length
          )
          .flatMap((predicate) =>
            predicate.requiredClusterSelector
              .labelSelector!.matchExpressions!.filter(
                (matchExpression) => matchExpression.key === 'name' && matchExpression.values?.length
              )
              .flatMap((matchExpression) => matchExpression.values!.filter((e) => e))
          )
      )
  ),
]

export const useGetClustersForPlacement = (query: PlacementQuery) => {
  const placements = useFindPlacements(query)

  const clustersFromPlacementDecisions: string[] = useGetClustersFromPlacementDecision({
    placementNames: placements
      .filter((placement) => placement.metadata.name !== undefined)
      .map((placement) => placement.metadata.name!),
  })
  const clustersFromPlacements: string[] = getClusterFromPlacements(placements)

  return [...new Set([...clustersFromPlacements, ...clustersFromPlacementDecisions])]
}

const doesPlacementDecisionBelongToPlacement = (placementDecision: PlacementDecision, placement: Placement) =>
  placementDecision.metadata.ownerReferences
    ?.filter((e) => e.kind === 'Placement')
    .some((ownerReference) => ownerReference.name === placement.metadata.name)

export const useGetClustersForPlacementMap = (placementNames: string[]) => {
  const placements = useFindPlacements({ placementNames })
  const placementDecisions = useFindPlacementDecisions({ placementNames })

  return placements.reduce((acc, placement) => {
    const placementDecision = placementDecisions.find((placementDecision) =>
      doesPlacementDecisionBelongToPlacement(placementDecision, placement)
    )
    const clustersFromPlacementDecisions: string[] = placementDecision
      ? getClustersFromPlacementDecision(placementDecision)
      : []
    const clustersFromPlacements: string[] = getClusterFromPlacements([placement])

    return {
      ...acc,
      [`${placement.metadata.name}`]: [...new Set([...clustersFromPlacements, ...clustersFromPlacementDecisions])],
    }
  }, {})
}

const create = (placement: Placement): IRequestResult<Placement> => createResource<Placement>(placement)

export const createForClusterSets = (clusterSets: string[], namespace = 'open-cluster-management-global-set') => {
  const placement: Placement = {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: { name: clusterSets.join('-and-'), namespace },
    spec: {
      clusterSets,
      tolerations: [
        {
          key: 'cluster.open-cluster-management.io/unreachable',
          operator: 'Equal',
        },
        {
          key: 'cluster.open-cluster-management.io/unavailable',
          operator: 'Equal',
        },
      ],
    },
  }
  return create(placement)
}

export const createForClusters = (clusters: string[], namespace = 'open-cluster-management-global-set') => {
  const placement: Placement = {
    apiVersion: PlacementApiVersionBeta,
    kind: PlacementKind,
    metadata: { name: `clusters-${clusters.join('-and-')}`, namespace },
    spec: {
      predicates: [
        {
          requiredClusterSelector: {
            labelSelector: {
              matchExpressions: [{ key: 'name', operator: 'In', values: clusters }],
            },
          },
        },
      ],
      tolerations: [
        {
          key: 'cluster.open-cluster-management.io/unreachable',
          operator: 'Equal',
        },
        {
          key: 'cluster.open-cluster-management.io/unavailable',
          operator: 'Equal',
        },
      ],
    },
  }
  return create(placement)
}
