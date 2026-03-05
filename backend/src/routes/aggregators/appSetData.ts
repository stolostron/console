/* Copyright Contributors to the Open Cluster Management project */
import { Http2ServerRequest, Http2ServerResponse } from 'node:http2'
import { Cluster, IApplicationSet, IPlacementDecision, IResource } from '../../resources/resource'
import { getAppSetAppsMap, getAppStatusByNameMap } from './applicationsArgo'
import { getToken } from '../../lib/token'
import { unauthorized } from '../../lib/respond'
import { jsonRequest, resourceUrl } from '../../lib/json-request'
import get from 'get-value'
import { getHubClusterName, getKubeResources } from '../events'
import { getApplicationClusters, getClusters } from './utils'
interface IAppSetData {
  // appset resource
  appset: IResource
  // list of clusters this app is on
  clusterList: string[]
  // placement decision for this appset
  placementDecision?: IPlacementDecision
  // placement for this appset
  placement?: IResource
  // all apps that belong to this appset
  appSetApps: IResource[]
  // used in topology--for appsets -- shows status for each app in this appset
  appStatusByNameMap: Record<string, { health: { status: string }; sync: { status: string } }>
  // is this appset a pull model appset?
  isAppSetPullModel: boolean
}

export function requestAggregatedAppSetData(req: Http2ServerRequest, res: Http2ServerResponse): void {
  const chunks: string[] = []
  req.on('data', (chuck: string) => {
    chunks.push(chuck)
  })
  req.on('end', async () => {
    const token = getToken(req)
    if (!token) return unauthorized(req, res)
    const body = chunks.join()
    let appset: IApplicationSet
    let isAppSetPullModel = false
    try {
      appset = JSON.parse(body) as IApplicationSet
    } catch (error) {
      console.error('Invalid appSetData request body', error)
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Invalid request body' }))
      return
    }

    try {
      const resourcePath = resourceUrl(appset)
      appset = await jsonRequest<IApplicationSet>(resourcePath, token)
    } catch (error) {
      console.error(error)
      res.statusCode = 400
      res.end(JSON.stringify({ error: 'Failed to fetch resource' }))
      return
    }
    // get appset data
    const appSetApps = getAppSetAppsMap()[appset.metadata.name] || []
    const appStatusByNameMap = getAppStatusByNameMap()[`${appset.metadata.namespace}/${appset.metadata.name}`] || {}

    // get appset placment onto clusters
    const hubClusterName = getHubClusterName()
    const clusters: Cluster[] = await getClusters()
    const localCluster = clusters.find((cls) => cls.name === hubClusterName)
    const clusterList: string[] = await getApplicationClusters(appset, 'appset', [], [], localCluster, clusters)
    const isClusterListEmpty = clusterList.length === 0
    let placement: IResource | undefined
    let placementDecision: IPlacementDecision | undefined
    const placementName = getPlacementNameFromAppSetSpec(appset.spec as Record<string, unknown>)
    if (placementName) {
      const placements = await getKubeResources('Placement', 'cluster.open-cluster-management.io/v1beta1')
      const placementDecisions = await getKubeResources(
        'PlacementDecision',
        'cluster.open-cluster-management.io/v1beta1'
      )
      placementDecision = placementDecisions?.find((p: IPlacementDecision) => {
        const labels = p.metadata.labels
        return (
          p.metadata.namespace === appset.metadata.namespace &&
          labels?.['cluster.open-cluster-management.io/placement'] === placementName
        )
      })
      if (isClusterListEmpty && placementDecision?.status?.decisions) {
        for (const decision of placementDecision.status.decisions) {
          const clusterName = decision.clusterName
          if (clusterName && !clusterList.includes(clusterName)) {
            clusterList.push(clusterName)
          }
        }
      }

      const decisionOwnerReference = get(placementDecision, ['metadata', 'ownerReferences'], undefined) as
        | Array<{ kind?: string; name?: string; namespace?: string }>
        | undefined

      if (decisionOwnerReference && decisionOwnerReference[0]) {
        const owner0 = decisionOwnerReference[0]
        placement = placements.find(
          (resource: IResource) =>
            resource.kind === owner0.kind &&
            resource.metadata.name === owner0.name &&
            resource.metadata.namespace === appset.metadata.namespace
        )
      }
    }
    isAppSetPullModel = !!get(
      appset,
      ['spec', 'template', 'metadata', 'annotations', 'apps.open-cluster-management.io/ocm-managed-cluster'],
      { default: false }
    )
    const result: IAppSetData = {
      appset,
      clusterList,
      placement,
      placementDecision,
      appSetApps,
      appStatusByNameMap,
      isAppSetPullModel,
    }
    res.setHeader('Content-Type', 'application/json')
    res.end(JSON.stringify(result))
  })
}

const appSetPlacementStr = [
  'clusterDecisionResource',
  'labelSelector',
  'matchLabels',
  'cluster.open-cluster-management.io/placement',
]
export function getPlacementNameFromAppSetSpec(spec: Record<string, unknown> | undefined): string {
  if (!spec || typeof spec !== 'object') return ''
  const generatorWithCDR = findObjectWithKey(spec, 'clusterDecisionResource')
  if (!generatorWithCDR) return ''
  return (get(generatorWithCDR, appSetPlacementStr, { default: '' }) as string) || ''
}

/**
 * Recursively search an object for a property with the given key.
 * Returns the first matching object that contains the key, or undefined.
 */
function findObjectWithKey(obj: unknown, key: string): Record<string, unknown> | undefined {
  if (!obj || typeof obj !== 'object') return undefined
  const record = obj as Record<string, unknown>
  if (key in record) return record
  for (const value of Object.values(record)) {
    const found = findObjectWithKey(value, key)
    if (found) return found
  }
  return undefined
}
