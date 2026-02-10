/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { applicationCache, IUIData } from './applications'
import { getApplicationClusters, getApplicationsHelper, getApplicationType, getClusters } from './utils'
import { Cluster, IApplicationSet, IResource } from '../../resources/resource'
import { getHubClusterName, getKubeResources } from '../events'
import { getPushedAppSetMap, getAppSetRelatedResources, getAppStatusByNameMap } from './applicationsArgo'
import { inflateApps } from '../../lib/compression'

export function requestAggregatedUIData(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', async () => {
    const body = chucks.join()
    let resource: IResource
    try {
      resource = JSON.parse(body) as IResource
    } catch (error) {
      console.error(error + body.substring(0, 64))
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Invalid request body' }))
      return
    }
    const argoAppSets = await inflateApps(getApplicationsHelper(applicationCache, ['appset']))
    const subscriptions = await getKubeResources('Subscription', 'apps.open-cluster-management.io/v1')
    const placementDecisions = await getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
    const type = getApplicationType(resource)
    const hubClusterName = getHubClusterName()
    const clusters: Cluster[] = await getClusters()
    const localCluster = clusters.find((cls) => cls.name === hubClusterName)
    const clusterList = await getApplicationClusters(
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
      appSetApps: getPushedAppSetMap()[resource.metadata.name] || [],
      appStatusByNameMap: getAppStatusByNameMap()[`${resource.metadata.namespace}/${resource.metadata.name}`] || {},
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  })
}
