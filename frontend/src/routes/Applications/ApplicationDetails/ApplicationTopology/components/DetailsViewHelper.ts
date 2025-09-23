/* Copyright Contributors to the Open Cluster Management project */

import {
  setResourceDeployStatus,
  setPodDeployStatus,
  setSubscriptionDeployStatus,
  setApplicationDeployStatus,
  setPlacementRuleDeployStatus,
  setClusterStatus,
  setPlacementDeployStatus,
} from '../statuses/computeStatuses'
import {
  getNodePropery,
  addPropertyToList,
  addDetails,
  addNodeOCPRouteLocationForCluster,
  addIngressNodeInfo,
} from '../elements/helpers/diagram-helpers'
import { getLabels, getMatchLabels } from '../../../CreateSubscriptionApplication/controlData/ControlDataPlacement'
import { PlacementKind } from '../../../../../resources'
import { TFunction } from 'react-i18next'

const resName = 'resource.name'
const unknonwnApiVersion = 'unknown'

export const getNodeDetails = (node: any, activeFilters: Record<string, any>, t: TFunction, hubClusterName: string) => {
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

  if (!node?.specs?.raw?.spec?.selector?.matchLabels) {
    addPropertyToList(mainDetails, getNodePropery(node, ['specs', 'raw', 'spec', 'selector'], t('Pod Selector')))
  }

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

  if (type === 'placements' || type === 'placement') {
    const specNbOfClustersTarget = node?.specs?.raw?.status?.decisions ?? []

    // placement
    const clusterSets = node?.placement?.spec?.clusterSets
    const clusterSelector =
      node?.placement?.spec?.predicates?.[0]?.requiredClusterSelector?.labelSelector ||
      node?.placement?.spec?.clusterSelector

    mainDetails.push(
      {
        labelValue: t('Matched Clusters'),
        value: specNbOfClustersTarget.length,
      },
      { labelValue: t('ClusterSet'), value: clusterSets ? clusterSets.join() : t('Not defined') },
      {
        labelValue: t('LabelSelector'),
        value: node?.placement?.kind === PlacementKind ? getLabels(clusterSelector) : getMatchLabels(clusterSelector),
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
