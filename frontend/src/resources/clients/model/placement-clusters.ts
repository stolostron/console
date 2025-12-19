/* Copyright Contributors to the Open Cluster Management project */
import { Placement } from '../../placement'

export interface PlacementClusters {
  placement: Placement
  clusters: string[]
  clusterSetNames?: string[]
}
