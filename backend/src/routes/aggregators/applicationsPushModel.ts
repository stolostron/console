/* Copyright Contributors to the Open Cluster Management project */
import { Cluster, IResource } from '../../resources/resource'
import { getHubClusterName } from '../events'
import { IArgoApplication, IQuery, SEARCH_QUERY_LIMIT } from './applications'
import { getAppSetAppsMap } from './applicationsArgo'
import { getClusters, getArgoDestinationCluster } from './utils'

export interface PushModelResourceEntry {
  appSetKey: string
  targetCluster: string
}

export type PushModelResourceMap = Map<string, PushModelResourceEntry>

interface IArgoAppPushModelResource extends IResource {
  spec: {
    destination: {
      name?: string
      namespace: string
      server?: string
    }
  }
  status?: {
    resources: Array<{
      kind: string
      name: string
      namespace: string
    }>
  }
}

const workloadKinds = new Set(['Deployment', 'StatefulSet'])

async function collectPushModelWorkloads(
  apps: IArgoApplication[],
  appSetName: string,
  allClusters: Cluster[],
  hubName: string,
  resourceMap: PushModelResourceMap,
  deploymentNames: Set<string>,
  clusterFilters: Set<string>
) {
  for (const app of apps) {
    const argoApp = app as IArgoAppPushModelResource
    const targetCluster = await getArgoDestinationCluster(argoApp.spec.destination, allClusters, undefined, hubName)
    if (!targetCluster || targetCluster === hubName) continue

    const resources = argoApp.status?.resources
    if (!resources) continue

    const appSetKey = `appset/${argoApp.metadata.namespace}/${appSetName}`
    clusterFilters.add(targetCluster)

    for (const res of resources) {
      if (workloadKinds.has(res.kind)) {
        const ns = res.namespace || argoApp.spec.destination.namespace
        deploymentNames.add(res.name)
        resourceMap.set(`${targetCluster}/${ns}/${res.name}`, { appSetKey, targetCluster })
      }
    }
  }
}

export async function addPushModelPodQueryInputs(query: IQuery): Promise<PushModelResourceMap> {
  const resourceMap: PushModelResourceMap = new Map()
  const currentAppSetAppsMap = getAppSetAppsMap()
  const hubName = getHubClusterName()
  const allClusters = await getClusters()

  const deploymentNames = new Set<string>()
  const clusterFilters = new Set<string>()

  for (const [appSetName, apps] of Object.entries(currentAppSetAppsMap)) {
    await collectPushModelWorkloads(
      apps,
      appSetName,
      allClusters,
      hubName,
      resourceMap,
      deploymentNames,
      clusterFilters
    )
  }

  if (deploymentNames.size > 0) {
    query.variables.input.push({
      filters: [
        { property: 'kind', values: ['Deployment', 'StatefulSet'] },
        { property: 'name', values: Array.from(deploymentNames) },
        { property: 'cluster', values: Array.from(clusterFilters) },
      ],
      relatedKinds: ['pod', 'replicaset'],
      limit: SEARCH_QUERY_LIMIT,
    })
  }

  return resourceMap
}
