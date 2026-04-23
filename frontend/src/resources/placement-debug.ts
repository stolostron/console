/* Copyright Contributors to the Open Cluster Management project */
import { IPlacement, PlacementApiVersion, PlacementKind } from '../wizards/common/resources/IPlacement'
import { IRequestResult, postRequest } from './utils/resource-request'
import { getBackendUrl } from './utils/resource-request'

interface ClusterScore {
  clusterName: string
  score: number
}

export interface PlacementDebugResult {
  placement?: IPlacement
  filteredPipelineResults?: Array<{
    name: string
    filteredClusters: string[]
  }>
  prioritizeResults?: unknown
  aggregatedScores?: ClusterScore[]
  error?: string
}

export function postPlacementDebug(placement: IPlacement): IRequestResult<PlacementDebugResult> {
  const url = getBackendUrl() + '/placement-debug'
  const body = {
    apiVersion: PlacementApiVersion,
    kind: PlacementKind,
    metadata: placement.metadata,
    spec: placement.spec,
  }
  return postRequest<typeof body, PlacementDebugResult>(url, body)
}
