/* Copyright Contributors to the Open Cluster Management project */

import { fetchAggregate, SupportedAggregate } from '../../../../../lib/useAggregates'
import {
  Application,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  IAppSetData,
  IResource,
  PlacementDecision,
  Subscription,
} from '../../../../../resources'
import { getResource } from '../../../../../resources/utils'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import type { ApplicationModel, ManagedCluster, RecoilStates } from '../types'
import { safeSet } from '../utils'
import { getSubscriptionAnnotations, isLocalSubscription } from '../../../helpers/subscriptions'
import { addSubscriptionChannels } from './applicationSubscription'
import { getArgoDestinationCluster } from './topologyArgo'
import { Service } from '../../../../../resources'

/**
 * Resolve an application model for ACM, Argo, ApplicationSet, OCP, or Flux app kinds.
 * The function inspects the requested apiVersion and returns a normalized ApplicationModel
 * used by Application Topology views.
 */
export const getApplication = async (
  namespace: string,
  name: string,
  backendUrl: string,
  selectedChannel: string | undefined,
  recoilStates: RecoilStates,
  cluster?: string,
  apiversion?: string,
  clusters?: ManagedCluster[],
  hubClusterName: string = 'local-cluster'
): Promise<ApplicationModel | undefined> => {
  // get application
  const apiVersion = apiversion || 'application.app.k8s.io' // defaults to ACM app
  const isAppSet = apiVersion === 'applicationset.argoproj.io'
  const isArgoApp = apiVersion.indexOf('argoproj.io') > -1 && !isAppSet
  const isOCPApp = apiVersion === 'ocp'
  const isFluxApp = apiVersion === 'flux'
  const { applications } = recoilStates
  let app: Application | undefined

  let model: ApplicationModel = {
    name,
    namespace,
    app,
    isArgoApp,
    isAppSet,
    isOCPApp,
    isFluxApp,
  }

  ///////////////////////////////////////////
  //////// SUBSCRIPTION /////////////////////
  ///////////////////////////////////////////
  // application is in recoil
  if (apiVersion === 'application.app.k8s.io') {
    app = applications.find((a: Application) => {
      return a?.metadata?.name === name && a?.metadata?.namespace === namespace
    })
    if (app) {
      ;(model as any).clusterList = getSubscriptionClusters(
        app,
        recoilStates.subscriptions ?? [],
        recoilStates.placementDecisions ?? []
      )
      model = await addSubscriptionChannels(model as any, app, selectedChannel, recoilStates)
    }
  }

  ///////////////////////////////////////////
  //////// ARGO APP SET /////////////////////
  ///////////////////////////////////////////
  // appset data is in backend to prevent downloading lots of stuff
  // get argo app set
  if (!app && isAppSet) {
    // appset is not part of recoil
    app = {
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: {
        name,
        namespace,
      },
    } as unknown as Application
    // this stuff is from backend using polling (appsets too big)
    const appSetData: IAppSetData = await fetchAggregate(SupportedAggregate.appSetData, backendUrl, app)
    const appSetClusters = (appSetData?.clusterList ?? []).flatMap((clusterName: string) => {
      const c = (clusters ?? []).find((c) => c.name === clusterName)
      return c
        ? [
            {
              name: c.name,
              namespace: c.namespace,
              url: c.kubeApiServer,
              status: c.status,
              creationTimestamp: c.creationTimestamp,
            },
          ]
        : []
    })
    Object.assign(model as any, {
      ...appSetData,
      appSetClusters,
    })
    app = appSetData.appset as Application
  }

  ///////////////////////////////////////////
  //////// ARGO APP (SINGLE) /////////////////////////
  ///////////////////////////////////////////
  if (!app && apiVersion === 'application.argoproj.io') {
    if (cluster) {
      // need to get resource using ManagedClusterView
      app = await getRemoteArgoApp(cluster, 'application', ArgoApplicationApiVersion, name, namespace)
      if (app) {
        safeSet(app as object, 'status.cluster', cluster)
      }
    } else {
      // get resource from local hub using kube
      app = (await getResource({
        apiVersion: ArgoApplicationApiVersion,
        kind: ArgoApplicationKind,
        metadata: {
          name,
          namespace,
        },
      }).promise) as Application
    }
    ;(model as any).clusterList = [getArgoCluster(app as any, clusters ?? [], hubClusterName)]
  }

  ///////////////////////////////////////////
  //////// OCP APP ///////////////////////////
  ///////////////////////////////////////////
  if (!app && isOCPApp) {
    // accessed only by search api--just add enough details here to create a query
    const clusterInfo = findCluster(clusters ?? [], cluster, false)
    app = {
      apiVersion: 'ocp',
      kind: 'OCPApplication',
      metadata: {
        name,
        namespace,
      },
      cluster: clusterInfo,
    } as unknown as Application
  }
  ///////////////////////////////////////////
  //////// FLUX APP //////////////////////////
  ///////////////////////////////////////////
  if (!app && isFluxApp) {
    // accessed only by search api--just add enough details here to create a query
    const clusterInfo = findCluster(clusters ?? [], cluster, false)
    app = {
      apiVersion: 'flux',
      kind: 'FluxApplication',
      metadata: {
        name,
        namespace,
      },
      cluster: clusterInfo,
    } as unknown as Application
  }

  ;(model as any).app = app
  ;(model as any).metadata = (app as any).metadata
  return model
}

/**
 * Find a managed cluster by name or by kubeApiServer URL.
 */
export const findCluster = (
  managedClusters: ManagedCluster[],
  searchValue: string | undefined,
  findByURL: boolean | undefined
): ManagedCluster | undefined => {
  for (let i = 0; i < managedClusters.length; i++) {
    if (!findByURL) {
      if (managedClusters[i].name === searchValue) {
        return managedClusters[i]
      }
    } else {
      const url = managedClusters[i].kubeApiServer
      if (url === searchValue) {
        return managedClusters[i]
      }
    }
  }

  return undefined
}

/**
 * Retrieve an Argo Application definition from a managed cluster via MCV.
 */
const getRemoteArgoApp = async (
  cluster: string,
  kind: string,
  apiVersion: string,
  name: string,
  namespace: string
): Promise<any> => {
  let response: any

  try {
    response = await fleetResourceRequest('GET', cluster, {
      apiVersion,
      kind,
      name,
      namespace,
    })
  } catch (err) {
    console.error('Error getting remote Argo app', err)
  }

  if (response) {
    return response
  }
}

function getSubscriptionClusters(
  resource: Application,
  subscriptions: IResource[],
  placementDecisions: IResource[]
): string[] {
  const clusterSet = new Set<string>()
  const subAnnotationArray = getSubscriptionAnnotations(resource)
  for (const sa of subAnnotationArray) {
    if (isLocalSubscription(sa, subAnnotationArray)) {
      continue
    }
    const subDetails = sa.split('/')
    subscriptions.forEach((sub) => {
      if (sub.metadata?.name === subDetails[1] && sub.metadata?.namespace === subDetails[0]) {
        const placementRef = (sub as Subscription).spec?.placement?.placementRef
        const placement = placementDecisions.find(
          (placementDecision) =>
            placementDecision.metadata?.labels?.['cluster.open-cluster-management.io/placement'] ===
              placementRef?.name ||
            placementDecision.metadata?.labels?.['cluster.open-cluster-management.io/placementrule'] ===
              placementRef?.name
        )
        const decisions = (placement as PlacementDecision)?.status?.decisions
        if (decisions) {
          decisions.forEach((cluster: { clusterName: string }) => {
            clusterSet.add(cluster.clusterName)
          })
        }
      }
    })
  }
  return Array.from(clusterSet)
}

function getArgoCluster(
  resource: IResource & { spec?: { destination?: { name?: string; server?: string } }; status?: { cluster?: string } },
  clusters: ManagedCluster[],
  hubClusterName: string
): string {
  if (resource.status?.cluster) {
    return resource.status.cluster
  }
  const destination = resource.spec?.destination
  if (
    destination?.name === 'in-cluster' ||
    destination?.name === hubClusterName ||
    destination?.server === 'https://kubernetes.default.svc'
  ) {
    return hubClusterName
  }
  return getArgoDestinationCluster(
    destination ?? { namespace: '' },
    clusters,
    resource.status?.cluster,
    hubClusterName,
    [] as Service[]
  )
}
export default getApplication
