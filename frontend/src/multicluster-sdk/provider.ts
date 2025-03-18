/* Copyright Contributors to the Open Cluster Management project */
import { MulticlusterSDKProvider } from '@stolostron/multicluster-sdk/lib/internal'
import { useFleetK8sWatchResource } from './use-fleet-k8s-watch-resource'
import { getFleetK8sAPIPath } from './get-fleet-k8s-api-path'
import { FleetResourceLink } from './fleet-resource-link'
import { fetchHubClusterName } from './get-hub-cluster-name'

const provider: MulticlusterSDKProvider = {
  fetchHubClusterName,
  getFleetK8sAPIPath,

  // Cluster-scoped factories
  FleetResourceLink,
  useFleetK8sWatchResource,

  // Multicluster functions
  // useMulticlusterSearchPoll: Function
  // usePrometheusPoll: UsePrometheusPoll
}

export default provider
