/* Copyright Contributors to the Open Cluster Management project */
import { useRecoilValue, useSharedAtoms } from '../../shared-recoil'
import { MulticlusterRoleAssignmentNamespace } from '../multicluster-role-assignment'
import { Placement, PlacementApiVersionBeta, PlacementKind } from '../placement'
import { PlacementDecision } from '../placement-decision'
import { createResource, IRequestResult } from '../utils'
import { getClustersFromPlacementDecision, useFindPlacementDecisions } from './placement-decision-client'

interface PlacementQuery {
  placementNames?: string[]
  clusterNames?: string[]
  clusterSetNames?: string[]
  logicalOperator?: 'and' | 'or'
}

const isPlacementNameMatch = (placement: Placement, query: PlacementQuery) =>
  !query.placementNames?.length || (placement.metadata.name && query.placementNames.includes(placement.metadata.name))

const isClusterNameMatch = (placement: Placement, query: PlacementQuery) =>
  !query.clusterNames?.length ||
  placement.spec.predicates?.some((predicate) =>
    predicate.requiredClusterSelector?.labelSelector?.matchExpressions?.some(
      (matchExpression) =>
        matchExpression.key === 'name' &&
        matchExpression.values?.length &&
        matchExpression.values?.some((value) => query.clusterNames?.includes(value))
    )
  )

const isClusterSetNameMatch = (placement: Placement, query: PlacementQuery) =>
  !query.clusterSetNames?.length ||
  placement.spec.clusterSets?.some((clusterSet) => query.clusterSetNames!.includes(clusterSet))

export const findPlacements = (placements: Placement[], query: PlacementQuery): Placement[] => {
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

export const useFindPlacements = (query: PlacementQuery): Placement[] => {
  const { placementsState } = useSharedAtoms()
  const placements = useRecoilValue(placementsState)

  return findPlacements(placements, query)
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

export const createForClusterSets = (clusterSets: string[], namespace = MulticlusterRoleAssignmentNamespace) => {
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

export const createForClusters = (clusters: string[], namespace = MulticlusterRoleAssignmentNamespace) => {
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
