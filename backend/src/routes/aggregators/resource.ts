/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'http2'
import { applicationCache, appSetAppsMap } from './applications'
import { getApplicationClusters, getApplicationType, getAppSetRelatedResources, getClusters } from './utils'
import { IApplicationSet, IResource, IUIResource } from '../../resources/resource'
import { getKubeResources } from '../events'

export function requestAggregatedResource(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const chucks: string[] = []
  req.on('data', (chuck: string) => {
    chucks.push(chuck)
  })
  req.on('end', () => {
    const body = chucks.join()
    const resource = JSON.parse(body) as IResource
    const argoAppSets = applicationCache['appset'].resources
    const subscriptions = getKubeResources('Subscription', 'apps.open-cluster-management.io/v1')
    const placementDecisions = getKubeResources('PlacementDecision', 'cluster.open-cluster-management.io/v1beta1')
    const type = getApplicationType(resource)
    const clusterList = getApplicationClusters(resource, type, subscriptions, placementDecisions, getClusters())
    const result: IUIResource = {
      ...resource,
      uidata: {
        clusterList,
        appSetRelatedResources:
          resource.kind === 'ApplicationSet'
            ? getAppSetRelatedResources(resource, argoAppSets as IApplicationSet[])
            : ['', []],
        appSetApps: appSetAppsMap[resource.metadata.name] || [],
      },
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  })
}
