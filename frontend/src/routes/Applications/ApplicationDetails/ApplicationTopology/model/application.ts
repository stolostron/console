/* Copyright Contributors to the Open Cluster Management project */

import { getSubscriptionApplication } from './applicationSubscription'
import {
  fireManagedClusterView,
  ArgoApplicationApiVersion,
  ArgoApplicationKind,
  ApplicationSetApiVersion,
  ApplicationSetKind,
  Application,
  Placement,
  PlacementDecision,
  IResource,
} from '../../../../../resources'
import { getResource } from '../../../../../resources/utils'
import { fetchAggregate, SupportedAggregate } from '../../../../../lib/useAggregates'
import type { ApplicationModel, ManagedCluster, RecoilStates } from '../types'
import { safeGet, safeSet } from '../utils'

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
    response = await fireManagedClusterView(cluster, kind, apiVersion, name, namespace)
  } catch (err) {
    // eslint-disable-next-line no-console
    console.error(`[ERROR] Failed to get remote Argo app "${name}" from cluster "${cluster}":`, err)
    console.error('[ERROR] This may indicate:')
    console.error('  1. Application does not exist on the managed cluster')
    console.error('  2. Cluster is offline or work-manager is unhealthy')
    console.error('  3. Wrong application name or namespace in URL parameters')
    // Re-throw to let caller handle it properly
    throw err
  }

  if (response) {
    return response.result
  }

  return undefined
}

/**
 * For pull-model ApplicationSets, build a synthetic view of argo apps and clusters
 * from the MultiClusterApplicationSetReport objects in state.
 */
export const getAppSetApplicationPullModel = (
  model: ApplicationModel,
  app: Record<string, any>,
  recoilStates: RecoilStates,
  clusters: ManagedCluster[]
): ApplicationModel => {
  const { multiclusterApplicationSetReports } = recoilStates
  const multiclusterApplicationSetReport = multiclusterApplicationSetReports?.find(
    (report: any) => report.metadata.name === app.metadata.name && report.metadata.namespace === app.metadata.namespace
  )
  const argoApps = safeGet(multiclusterApplicationSetReport, 'statuses.clusterConditions', []) as any[]
  const resources = safeGet(multiclusterApplicationSetReport, 'statuses.resources', [])
  const appSetApps: any[] = []
  const appSetClusters: any[] = []

  argoApps.forEach((argoApp: any) => {
    const appStr = safeGet(argoApp, 'app')
    const appData = appStr ? (appStr as string).split('/') : []
    const conditions = safeGet(argoApp, 'conditions', [])
    appSetApps.push({
      apiVersion: ArgoApplicationApiVersion,
      kind: ArgoApplicationKind,
      metadata: {
        name: appData[1],
        namespace: appData[0],
      },
      spec: {
        destination: {
          name: argoApp.cluster,
        },
      },
      status: {
        health: {
          status: argoApp.healthStatus,
        },
        conditions,
        sync: {
          status: argoApp.syncStatus,
        },
        resources,
      },
    })

    const cluster = findCluster(clusters, argoApp.cluster, false)
    if (cluster) {
      const url = cluster.kubeApiServer
      let status: string | undefined
      if (cluster.status === 'ready') {
        status = 'ok'
      } else if (cluster.status === 'unknown') {
        status = 'offline'
      } else {
        status = cluster.status
      }
      appSetClusters.push({
        name: cluster.name,
        namespace: cluster.namespace,
        url,
        status,
        created: cluster.creationTimestamp,
      })
    }
  })
  ;(model as any).appSetApps = appSetApps
  ;(model as any).appSetClusters = appSetClusters

  return model
}

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
  hubClusterName?: string
): Promise<ApplicationModel | undefined> => {
  let app: Application | undefined
  let model: ApplicationModel | undefined
  let placement: PlacementDecision | undefined
  let placementName: string | undefined
  let relatedPlacement: Placement | undefined

  // get application
  const apiVersion = apiversion || 'application.app.k8s.io' // defaults to ACM app
  const isAppSet = apiVersion === 'applicationset.argoproj.io'
  const isOCPApp = apiVersion === 'ocp'
  const isFluxApp = apiVersion === 'flux'
  const { applications } = recoilStates
  let isAppSetPullModel = false

  if (apiVersion === 'application.app.k8s.io') {
    app = applications.find((a: Application) => {
      return a?.metadata?.name === name && a?.metadata?.namespace === namespace
    })
  }

  // get argo app set
  if (!app && isAppSet) {
    // appset is not part of recoil
    app = (await getResource({
      apiVersion: ApplicationSetApiVersion,
      kind: ApplicationSetKind,
      metadata: {
        name,
        namespace,
      },
    }).promise) as Application
    if (app) {
      placementName = safeGet(
        app,
        'spec.generators[0].clusterDecisionResource.labelSelector.matchLabels["cluster.open-cluster-management.io/placement"]',
        ''
      )

      placement = recoilStates.placementDecisions?.find((placementDecision: PlacementDecision) => {
        const labels = placementDecision.metadata.labels as Record<string, string>
        return labels?.['cluster.open-cluster-management.io/placement'] === placementName
      })

      const decisionOwnerReference = safeGet(placement, 'metadata.ownerReferences', undefined) as
        | Array<{ kind?: string; name?: string; namespace?: string }>
        | undefined

      if (decisionOwnerReference && decisionOwnerReference[0]) {
        const owner0 = decisionOwnerReference[0]
        relatedPlacement = recoilStates.placements.find(
          (resource: any) =>
            resource.kind === owner0.kind &&
            resource.metadata.name === owner0.name &&
            resource.metadata.namespace === namespace
        )
      }

      if (safeGet(app, 'spec.template.metadata.annotations["apps.open-cluster-management.io/ocm-managed-cluster"]')) {
        isAppSetPullModel = true
      }
    }
  }

  // get argo
  if (!app && apiVersion === 'application.argoproj.io') {
    if (cluster) {
      /**
       * FIX: Support push model ApplicationSet-generated apps on hub cluster
       * PROBLEM: Push model apps exist on the hub but MCV only queries managed clusters
       * SOLUTION: Detect hub cluster and use getResource() directly instead of MCV
       *
       * Background:
       * - Push model: Application CR exists on HUB, deploys TO managed cluster
       * - Pull model: Application CR exists on MANAGED CLUSTER (pulled from hub)
       * - MCV (ManagedClusterView): Can only query managed clusters, not the hub itself
       */
      if (cluster === hubClusterName) {
        try {
          app = (await getResource({
            apiVersion: ArgoApplicationApiVersion,
            kind: ArgoApplicationKind,
            metadata: {
              name,
              namespace,
            },
          }).promise) as Application
          if (app) {
            /**
             * FIX: Set correct destination cluster for push model apps
             * PROBLEM: URL ?cluster=hub but app deploys TO a managed cluster
             * SOLUTION: Extract actual destination from app.spec.destination
             *
             * The destination can be specified as:
             * - name: cluster name (e.g., "rbrunopi-spooky")
             * - server: cluster API URL (e.g., "https://api.cluster.com:6443")
             * - "in-cluster" or "https://kubernetes.default.svc" means the hub itself
             */
            const destinationName = safeGet(app, 'spec.destination.name', '')
            const destinationServer = safeGet(app, 'spec.destination.server', '')

            let destinationCluster = cluster // default to hub
            if (destinationName && destinationName !== 'in-cluster') {
              destinationCluster = destinationName
            } else if (destinationServer && destinationServer !== 'https://kubernetes.default.svc') {
              // Find cluster by matching server URL
              const matchedCluster = findCluster(clusters ?? [], destinationServer, true)
              if (matchedCluster && matchedCluster.name) {
                destinationCluster = matchedCluster.name ?? destinationCluster
              }
            }

            safeSet(app as object, 'status.cluster', destinationCluster)
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[ERROR] Failed to fetch Argo app "${namespace}/${name}" from hub cluster:`, err)
          return undefined
        }
      } else {
        /**
         * FIX: Support pull model ApplicationSet-generated apps
         * PROBLEM: URL ?cluster=X but app actually exists on cluster Y (from pull model)
         * SOLUTION: Check MulticlusterApplicationSetReport to find actual cluster location
         *
         * Background:
         * - Pull model apps are "pulled" to target managed clusters
         * - The Application CR exists ON the managed cluster, not on the hub
         * - URL cluster parameter may not match where the app actually exists
         * - MulticlusterApplicationSetReport tracks which cluster each app is on
         */
        let targetCluster = cluster

        const { multiclusterApplicationSetReports } = recoilStates
        outerLoop: for (const report of multiclusterApplicationSetReports || []) {
          const clusterConditions = safeGet(report, 'statuses.clusterConditions', []) as any[]
          for (const condition of clusterConditions) {
            const appStr = safeGet(condition, 'app', '')
            // appStr format: "namespace/appname/..."
            const appData = appStr ? (appStr as string).split('/') : []
            const reportAppName = appData[1]
            const reportAppNamespace = appData[0]

            // Check if this matches our app
            if (reportAppName === name && reportAppNamespace === namespace) {
              // Found it! Use the cluster from the report instead of URL parameter
              targetCluster = condition.cluster
              break outerLoop
            }
          }
        }

        // get argo app definition from managed cluster via MCV
        try {
          app = await getRemoteArgoApp(targetCluster, 'application', ArgoApplicationApiVersion, name, namespace)
          if (app) {
            safeSet(app as object, 'status.cluster', targetCluster)
          } else {
            // eslint-disable-next-line no-console
            console.error(`[ERROR] Remote Argo app "${name}" not found on cluster "${targetCluster}"`)
          }
        } catch (err) {
          // eslint-disable-next-line no-console
          console.error(`[ERROR] Failed to fetch remote Argo app "${name}" from cluster "${targetCluster}":`, err)
          // Return undefined to show "Application not found" rather than hanging
          return undefined
        }
      }
    } else {
      // argo app is not part of recoil - query hub directly
      try {
        app = (await getResource({
          apiVersion: ArgoApplicationApiVersion,
          kind: ArgoApplicationKind,
          metadata: {
            name,
            namespace,
          },
        }).promise) as Application
      } catch (err) {
        // eslint-disable-next-line no-console
        console.error(`[ERROR] Failed to fetch hub Argo app "${namespace}/${name}":`, err)
        return undefined
      }
    }
  }

  // generate ocp app boiler plate
  if (!app && isOCPApp) {
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

  // generate flux app boiler plate
  if (!app && isFluxApp) {
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

  // collect app resources
  if (app) {
    model = {
      name,
      namespace,
      app,
      metadata: (app as any).metadata,
      placement,
      isArgoApp: safeGet(app, 'apiVersion', '').indexOf('argoproj.io') > -1 && !isAppSet,
      isAppSet: isAppSet,
      isOCPApp,
      isFluxApp,
      isAppSetPullModel,
      relatedPlacement,
    }
    /**
     * FIX: Skip backend aggregate fetch for Argo/OCP/Flux apps
     * PROBLEM: fetchAggregate() hangs for Argo apps (backend not designed for them)
     * SOLUTION: Return early for Argo/OCP/Flux apps before calling fetchAggregate()
     *
     * Background:
     * - fetchAggregate() is designed for ACM subscription-based applications
     * - Argo/OCP/Flux apps have different topology structures and don't need this data
     * - The aggregate fetch was happening BEFORE the early return, causing hangs
     * - Moving the early return before fetchAggregate() fixes the hang
     */
    if (model.isArgoApp || model.isOCPApp || model.isFluxApp) {
      return model
    }

    // For subscription-based apps (ACM model), fetch aggregate data from backend
    const appForFetch: any = { ...app }
    delete appForFetch.cluster
    delete appForFetch.status
    delete appForFetch.metadata.managedFields
    const uidata: any = await fetchAggregate(SupportedAggregate.uidata, backendUrl, appForFetch as IResource)
    ;(model as any).clusterList = uidata?.clusterList

    if (isAppSet) {
      if (isAppSetPullModel) {
        return getAppSetApplicationPullModel(model, app, recoilStates, clusters ?? [])
      }
      // because these values require all argo apps to calculate
      // we get the data from the backend
      ;(model as any).appSetApps = uidata.appSetApps
      ;(model as any).appSetClusters = uidata.clusterList.reduce((list: any[], clusterName: string) => {
        const _cluster = (clusters ?? []).find((c) => c.name === clusterName)
        if (_cluster) {
          list.push({
            name: _cluster.name,
            namespace: _cluster.namespace,
            url: _cluster.kubeApiServer,
            status: _cluster.status,
            creationTimestamp: _cluster.creationTimestamp,
          })
        }
        return list
      }, [])
      return model
    }

    return await getSubscriptionApplication(model as any, app, selectedChannel, recoilStates)
  }
  return model
}

export default getApplication
