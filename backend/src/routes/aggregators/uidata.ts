/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { applicationCache } from './applications'
import { getApplicationClusters, getApplicationsHelper, getApplicationType, getClusters } from './utils'
import { Cluster, IApplicationSet, IResource, IUIData } from '../../resources/resource'
import { getHubClusterName, getKubeResources } from '../events'
import { getAppSetAppsMap, getAppSetRelatedResources } from './applicationsArgo'

export function requestAggregatedUIData(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', () => {
    const body = chucks.join()
    const resource = JSON.parse(body) as IResource
    const argoAppSets = getApplicationsHelper(applicationCache, ['appset'])
    const subscriptions = getKubeResources('Subscription', 'apps.open-cluster-management.io/v1')
    const placementDecisions = getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
    const type = getApplicationType(resource)
    const hubClusterName = getHubClusterName()
    const clusters: Cluster[] = getClusters()
    const localCluster = clusters.find((cls) => cls.name === hubClusterName)
    const clusterList = getApplicationClusters(
      resource,
      type,
      subscriptions,
      placementDecisions,
      localCluster,
      clusters
    )
    const result: IUIData = {
      clusterList,
      appSetRelatedResources:
        resource.kind === 'ApplicationSet'
          ? getAppSetRelatedResources(resource, argoAppSets as IApplicationSet[])
          : ['', []],
      appSetApps: getAppSetAppsMap()[resource.metadata.name] || [],
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  })
}
