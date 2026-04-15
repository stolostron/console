/* Copyright Contributors to the Open Cluster Management project */

import { setPlacementDeployStatus } from './NodeDetailsProviderStatuses'
import { setClusterStatus } from './NodeDetailsProviderStatuses'
import { setPlacementRuleDeployStatus } from './NodeDetailsProviderStatuses'
import { setApplicationDeployStatus } from './NodeDetailsProviderStatuses'
import { setSubscriptionDeployStatus } from './NodeDetailsProviderStatuses'
import { setPodDeployStatus } from './NodeDetailsProviderStatuses'
import { setResourceDeployStatus } from './NodeDetailsProviderStatuses'
import {
  getNodePropery,
  addPropertyToList,
  addDetails,
  addNodeOCPRouteLocationForCluster,
  addIngressNodeInfo,
} from '../helpers/diagram-helpers'
import { getLabels, getMatchLabels } from '../../../CreateSubscriptionApplication/controlData/ControlDataPlacement'
import { PlacementKind } from '../../../../../resources'
import { TFunction } from 'react-i18next'

const resName = 'resource.name'
const unknonwnApiVersion = 'unknown'

export const nodeDetailsProvider = (
  node: any,
  activeFilters: Record<string, any>,
  t: TFunction,
  hubClusterName: string
) => {
  const details: any[] = []
  if (node) {
    const { type, labels = [] } = node

    // for argo apps with application sets

    details.push({
      type: 'spacer',
    })
    if (type === 'cluster') {
      details.push({
        type: 'label',
        labelValue: t('Select a cluster to view details'),
      })
    }
    details.push({
      type: 'spacer',
    })

    switch (type) {
      case 'cluster':
        setClusterStatus(node, details, t, hubClusterName)
        break

      case 'package':
        addDetails(details, [
          {
            labelValue: resName,
            value: node?.specs?.raw?.metadata?.name ?? '',
          },
          {
            labelValue: t('resource.message'),
            value: t('There is not enough information in the subscription to retrieve deployed objects data.'),
          },
        ])
        break

      case 'git':
      case 'chart': {
        //for appset repo sources
        const appSetSources = node?.specs?.resources
        if (Array.isArray(appSetSources)) {
          appSetSources.forEach((resource: any) => {
            addPropertyToList(details, getNodePropery(resource, ['repoURL'], t('Repository')))
            if (resource?.chart != null && String(resource.chart).trim() !== '') {
              addPropertyToList(details, getNodePropery(resource, ['chart'], t('Chart name')))
            }
            if (resource?.path != null && String(resource.path).trim() !== '') {
              addPropertyToList(details, getNodePropery(resource, ['path'], t('Path')))
            }
            if (resource?.targetRevision != null && String(resource.targetRevision).trim() !== '') {
              addPropertyToList(details, getNodePropery(resource, ['targetRevision'], t('Revision')))
            }
            details.push({
              type: 'spacer',
            })
          })
          addAppSetTemplateSyncPolicyDetails(details, node?.specs?.raw?.spec?.template?.spec?.syncPolicy, t)
        }
        break
      }

      default:
        addK8Details(node, details, activeFilters, t, hubClusterName)
        break
    }

    // labels
    if (labels && labels.length) {
      details.push({
        type: 'label',
        labelValue: t('Labels'),
      })
      labels.forEach(({ name: lname, value: lvalue }: any) => {
        const labelDetails = [{ labelValue: '', value: `${lname} = ${lvalue}`, indent: true }]
        addDetails(details, labelDetails)
      })
    }
  }
  return details
}

/** ApplicationSet template.spec.syncPolicy: nested automated + syncOptions (separate from per-source rows). */
function addAppSetTemplateSyncPolicyDetails(
  details: any[],
  syncPolicy: Record<string, unknown> | undefined,
  t: TFunction
) {
  if (!syncPolicy || typeof syncPolicy !== 'object') {
    return
  }

  const automated = syncPolicy.automated as Record<string, unknown> | null | undefined
  const syncOptions = syncPolicy.syncOptions
  const showAutomated = automated !== null && automated !== undefined && typeof automated === 'object'
  const showSyncOptions = Array.isArray(syncOptions) && syncOptions.length > 0
  const legacyPrune = syncPolicy.prune
  const legacySelfHeal = syncPolicy.selfHeal
  const legacyAllowEmpty = syncPolicy.allowEmpty
  const showLegacyAutomated =
    !showAutomated && (legacyPrune !== undefined || legacySelfHeal !== undefined || legacyAllowEmpty !== undefined)

  if (!showAutomated && !showSyncOptions && !showLegacyAutomated) {
    return
  }

  details.push({
    type: 'spacer',
  })

  if (showAutomated) {
    details.push({
      type: 'label',
      labelValue: t('Automated'),
    })
    addPropertyToList(details, {
      labelValue: t('Enabled'),
      value: String((automated.enabled as boolean | undefined) ?? true),
    })
    addPropertyToList(details, {
      labelValue: t('Self-heal'),
      value: String((automated.selfHeal as boolean | undefined) ?? false),
    })
    addPropertyToList(details, {
      labelValue: t('Prune'),
      value: String((automated.prune as boolean | undefined) ?? false),
    })
    if (automated.allowEmpty !== undefined) {
      addPropertyToList(details, {
        labelValue: t('Allow empty'),
        value: String(automated.allowEmpty),
      })
    }
  } else if (showLegacyAutomated) {
    details.push({
      type: 'label',
      labelValue: t('Automated'),
    })
    if (legacyPrune !== undefined) {
      addPropertyToList(details, { labelValue: t('Prune'), value: String(legacyPrune) })
    }
    if (legacySelfHeal !== undefined) {
      addPropertyToList(details, { labelValue: t('Self-heal'), value: String(legacySelfHeal) })
    }
    if (legacyAllowEmpty !== undefined) {
      addPropertyToList(details, { labelValue: t('Allow empty'), value: String(legacyAllowEmpty) })
    }
  }

  if (showSyncOptions) {
    if (showAutomated || showLegacyAutomated) {
      details.push({
        type: 'spacer',
      })
    }
    details.push({
      type: 'label',
      labelValue: t('Sync options'),
    })
    ;(syncOptions as string[]).forEach((option) => {
      const raw = String(option)
      const eq = raw.indexOf('=')
      const key = eq >= 0 ? raw.slice(0, eq) : raw
      const value = eq >= 0 ? raw.slice(eq + 1) : ''
      addPropertyToList(details, {
        labelValue: key,
        value,
      })
    })
  }
}

function addK8Details(
  node: any,
  details: any[],
  activeFilters: Record<string, any>,
  t: TFunction,
  hubClusterName: string
) {
  const { clusterName, type, layout = {}, specs } = node
  const { isDesign } = specs
  let labels
  const { type: ltype } = layout

  // not all resources have a namespace

  let namespace = ''
  if (node && (node?.specs?.pulse ?? '') !== 'orange') {
    const kindModel = node?.specs?.[`${type}Model`] ?? {}
    let computedNSList: string[] = []
    Object.values(kindModel)
      .flat()
      .forEach((item: any) => {
        computedNSList = [...new Set([...computedNSList, item.namespace])]
      })

    computedNSList.forEach((item) => {
      namespace = namespace.length === 0 ? item : `${namespace},${item}`
    })
  }

  const nodeAnnotations = node?.specs?.raw?.metadata?.annotations ?? {}
  const gitBranchAnnotation = nodeAnnotations['apps.open-cluster-management.io/git-branch']
    ? 'apps.open-cluster-management.io/git-branch'
    : 'apps.open-cluster-management.io/github-branch'
  const gitPathAnnotation = nodeAnnotations['apps.open-cluster-management.io/git-path']
    ? 'apps.open-cluster-management.io/git-path'
    : 'apps.open-cluster-management.io/github-path'
  const gitTagAnnotation = 'apps.open-cluster-management.io/git-tag'
  const gitCommitAnnotation = 'apps.open-cluster-management.io/git-desired-commit'
  const reconcileRateAnnotation = 'apps.open-cluster-management.io/reconcile-rate'

  const searchData = node?.specs?.[`${type}Model`] ?? {}
  let apiVersion = node?.specs?.raw?.apiVersion ?? ''
  if (apiVersion === unknonwnApiVersion) {
    if (Object.keys(searchData).length > 0) {
      const firstSearchData = searchData[Object.keys(searchData)[0]][0]
      apiVersion = firstSearchData.apigroup
        ? `${firstSearchData.apigroup}/${firstSearchData.apiversion}`
        : firstSearchData.apiversion
    }
  }

  // the main stuff
  const mainDetails: any[] = [
    {
      labelValue: t('Type'),
      value: kubeNaming(ltype) || kubeNaming(type),
    },
    {
      labelValue: t('API Version'),
      value: apiVersion ? apiVersion : undefined,
    },
    {
      labelValue: t('Cluster'),
      value: clusterName ? clusterName : undefined,
    },
    {
      labelValue: t('Namespace'),
      value: (namespace ? namespace : node.namespace) || 'N/A',
    },
  ]

  //for charts
  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'chartName'], t('Chart Name')))

  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'releaseName'], t('Release Name')))
  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'version'], t('Version')))

  //
  if (!isDesign && isDesign !== undefined) {
    const resourceModel = specs?.[`${type}Model`]
    if (resourceModel) {
      // get first item in the object as all should have the same labels
      const resourceLabels =
        Object.keys(resourceModel).length > 0 ? resourceModel[Object.keys(resourceModel)[0]][0].label : undefined
      labels = resourceLabels ? resourceLabels.replace('; ', ',') : t('No labels')
    } else {
      labels = 'No labels'
    }

    addPropertyToList(mainDetails, {
      labelValue: t('Labels'),
      value: labels,
    })
  } else {
    addPropertyToList(
      mainDetails,
      getNodePropery(node, ['specs', 'raw', 'metadata', 'labels'], t('Labels'), t('No labels'))
    )
  }

  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'replicas'], t('Required Replicas')))

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'selector', 'matchLabels'], t('Pod Selector'))
  )

  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'ports'], t('Ports')))

  //subscription specific
  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'channel'], t('Channel')))

  //subscription operator specific
  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'installPlanApproval'], t('Install plan approved'))
  )

  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'source'], t('Source')))

  //argo cd app status
  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'status', 'health', 'status'], t('Status')))

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'sourceNamespace'], t('Source Namespace'))
  )

  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'startingCSV'], t('Starting CSV')))
  ////

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'packageFilter', 'filterRef'], t('Package Filter'))
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'placement', 'placementRef'], t('Placement Ref'))
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitBranchAnnotation], t('Git branch'))
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitPathAnnotation], t('Git path'))
  )

  if (nodeAnnotations[gitTagAnnotation]) {
    addPropertyToList(
      mainDetails,
      getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitTagAnnotation], t('Git tag'))
    )
  }

  if (nodeAnnotations[gitCommitAnnotation]) {
    addPropertyToList(
      mainDetails,
      getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', gitCommitAnnotation], t('Git commit'))
    )
  }

  if (nodeAnnotations[reconcileRateAnnotation]) {
    addPropertyToList(
      mainDetails,
      getNodePropery(node, ['specs', 'raw', 'metadata', 'annotations', reconcileRateAnnotation], t('Reconcile rate'))
    )
  }

  //PR specific
  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'clusterSelector', 'matchLabels'], t('Cluster Selector'))
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'clusterConditions'], t('Cluster Conditions'))
  )
  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'clusterLabels', 'matchLabels'], t('Cluster Labels'))
  )

  addPropertyToList(
    mainDetails,
    getNodePropery(node, ['specs', 'raw', 'spec', 'clusterReplicas'], t('Cluster Replicas'))
  )

  if (type === 'placements' || type === 'placement' || type === 'placementDecision') {
    const specNbOfClustersTarget = node?.specs?.raw?.status?.decisions ?? []

    // placementDecision
    const clusterSets = node?.placementDecision?.spec?.clusterSets
    const clusterSelector =
      node?.placementDecision?.spec?.predicates?.[0]?.requiredClusterSelector?.labelSelector ||
      node?.placementDecision?.spec?.clusterSelector

    mainDetails.push(
      {
        labelValue: t('Matched Clusters'),
        value: specNbOfClustersTarget.length,
      },
      { labelValue: t('ClusterSet'), value: clusterSets ? clusterSets.join() : t('Not defined') },
      {
        labelValue: t('LabelSelector'),
        value:
          node?.placementDecision?.kind === PlacementKind
            ? getLabels(clusterSelector)
            : getMatchLabels(clusterSelector),
      }
    )
  }

  //routes
  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'to'], t('To')))

  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'host'], t('Host')))

  //persistent volume claim
  addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'accessModes'], t('Access Mode')))
  addDetails(details, mainDetails)

  details.push({
    type: 'spacer',
  })

  //if Route with host, show it here
  addNodeOCPRouteLocationForCluster(node, null, details, t)

  //add Ingress service info
  addIngressNodeInfo(node, details, t)

  setApplicationDeployStatus(node, details, t, hubClusterName)

  //subscriptions status
  setSubscriptionDeployStatus(node, details, activeFilters, t, hubClusterName)

  //placement rule details
  setPlacementRuleDeployStatus(node, details, t)

  //placement status
  setPlacementDeployStatus(node, details, t)

  //show error if the resource doesn't produce pods and was not deployed on remote clusters
  setResourceDeployStatus(node, details, activeFilters, t, hubClusterName)

  // kube model details
  setPodDeployStatus(node, details, activeFilters, t, hubClusterName)

  return details
}

// Convert types to OpenShift/Kube display entities
export function kubeNaming(type?: string): string {
  if (type === undefined) {
    return ''
  }
  return (
    type.charAt(0).toUpperCase() +
    type
      .slice(1)
      .replace('stream', 'Stream')
      .replace('channel', 'Channel')
      .replace('source', 'Source')
      .replace('reSource', 'Resource')
      .replace('definition', 'Definition')
      .replace('config', 'Config')
      .replace('account', 'Account')
      .replace('controller', 'Controller')
  )
}

export const typeToShapeMap = Object.freeze({
  application: {
    shape: 'application',
    className: 'design',
    nodeRadius: 30,
  },
  applicationset: {
    shape: 'application',
    className: 'design',
    nodeRadius: 30,
  },
  cluster: {
    shape: 'cluster',
    className: 'container',
  },
  clusters: {
    shape: 'cluster',
    className: 'container',
  },
  ansiblejob: {
    shape: 'ansiblejob',
    className: 'container',
  },
  configmap: {
    shape: 'configmap',
    className: 'container',
  },
  container: {
    shape: 'container',
    className: 'container',
  },
  customresource: {
    shape: 'customresource',
    className: 'container',
  },
  daemonset: {
    shape: 'daemonset',
    className: 'daemonset',
  },
  deployable: {
    shape: 'deployable',
    className: 'design',
  },
  deployment: {
    shape: 'deployment',
    className: 'deployment',
  },
  deploymentconfig: {
    shape: 'deploymentconfig',
    className: 'deployment',
  },
  helmrelease: {
    shape: 'chart',
    className: 'container',
  },
  git: {
    shape: 'git',
    className: 'container',
  },
  chart: {
    shape: 'chart',
    className: 'container',
  },
  host: {
    shape: 'host',
    className: 'host',
  },
  ingress: {
    shape: 'ingress',
    className: 'host',
  },
  internet: {
    shape: 'cloud',
    className: 'internet',
  },
  namespace: {
    shape: 'namespace',
    className: 'host',
  },
  node: {
    shape: 'node',
    className: 'host',
  },
  other: {
    shape: 'other',
    className: 'default',
  },
  package: {
    shape: 'chart',
    className: 'container',
  },
  placement: {
    shape: 'placement',
    className: 'design',
  },
  placementDecision: {
    shape: 'placementdecision',
    className: 'design',
  },
  pod: {
    shape: 'pod',
    className: 'pod',
  },
  policy: {
    shape: 'policy',
    className: 'design',
    nodeRadius: 30,
  },
  replicaset: {
    shape: 'replicaset',
    className: 'container',
  },
  replicationcontroller: {
    shape: 'replicationcontroller',
    className: 'container',
  },
  route: {
    shape: 'route',
    className: 'container',
  },
  placements: {
    shape: 'placements',
    className: 'design',
  },
  secret: {
    shape: 'secret',
    className: 'service',
  },
  service: {
    shape: 'service',
    className: 'service',
  },
  statefulset: {
    shape: 'statefulset',
    className: 'default',
  },
  storageclass: {
    shape: 'storageclass',
    className: 'default',
  },
  subscription: {
    shape: 'subscription',
    className: 'design',
  },
  subscriptionblocked: {
    shape: 'subscriptionblocked',
    className: 'design',
  },
})
