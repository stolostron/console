/* Copyright Contributors to the Open Cluster Management project */

import { TFunction } from 'react-i18next'
import { showAnsibleJobDetails } from '../helpers/ansible-task'
import {
  createEditLink,
  addOCPRouteLocation,
  addNodeServiceLocation,
  addDetails,
  addPropertyToList,
  getNodePropery,
} from '../helpers/diagram-helpers'
import {
  isDeployableResource,
  getActiveFilterCodes,
  nodeMustHavePods,
  getClusterName,
  showMissingClusterDetails,
  getTargetNsForNode,
  filterSubscriptionObject,
} from '../helpers/diagram-helpers-utils'
import {
  getOnlineClusters,
  showResourceYaml,
  checkmarkStatus,
  pendingStatus,
  resErrorStates,
  failureStatus,
  warningStatus,
  checkmarkCode,
  pendingCode,
  warningCode,
  apiVersionPath,
  failureCode,
  metadataName,
  argoAppHealthyStatus,
  argoAppProgressingStatus,
  argoAppUnknownStatus,
} from './computeStatuses'
import type {
  TopologyNodeWithStatus,
  DetailItem,
  ActiveFilters,
  ResourceItem,
  StatusType,
  PodInfo,
  SubscriptionItem,
  WindowStatusArray,
  ClusterInfo,
  ArgoApp,
  ArgoHealthStatus,
  StateNames,
} from '../types'
import { safeGet } from '../utils'
import { isSearchAvailable } from '../helpers/search-helper'
import AcmTimestamp from '../../../../../lib/AcmTimestamp'
import { ArgoApplication } from '../../../../../resources'

const specIsDesign = 'specs.isDesign'

///////////////////////////////////////////////////////////
//////////////////// NON-POD RESOURCES /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Shows resource deployment status on remote clusters for resources
 * that don't produce pods (e.g., ConfigMaps, Secrets, Services).
 *
 * @param node - The resource node
 * @param details - Array to add detail items to
 * @param activeFilters - Active status filters
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */

export const setResourceDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  activeFilters: ActiveFilters,
  t: TFunction,
  hubClusterName: string
): DetailItem[] => {
  const { notDeployedStr, notDeployedNSStr, deployedStr, deployedNSStr, resNotDeployedStates, resSuccessStates } =
    getStateNames(t)
  const isDeployable = isDeployableResource(node)
  const isDesign = safeGet(node, specIsDesign, false)
  const { resourceStatuses = new Set() } = activeFilters
  const activeFilterCodes = getActiveFilterCodes(resourceStatuses)

  // Skip resources with pods or certain design-time resources
  if (
    nodeMustHavePods(node) ||
    node.type === 'package' ||
    (!isDeployable &&
      [
        'application',
        'applicationset',
        'placements',
        'placement',
        'cluster',
        'subscription',
        'ocpapplication',
        'fluxapplication',
      ].includes(node.type) &&
      isDesign)
  ) {
    return details
  }

  const nodeId = safeGet(node, 'id', '')
  const nodeType = safeGet<string>(node, 'type', '')
  const name = safeGet(node, 'name', '')
  const namespace = safeGet(node, 'namespace', '')
  const cluster = safeGet(node, 'cluster', '')

  const isHookNode = safeGet(node, 'specs.raw.hookType')
  const clusterNames = isHookNode
    ? [hubClusterName]
    : cluster
      ? [cluster]
      : getClusterName(nodeId, node, true, hubClusterName).split(',')
  const resourceMap = safeGet(node, `specs.${node.type}Model`, {})
  const onlineClusters = getOnlineClusters(node, hubClusterName)

  // Handle Ansible job hooks specially
  if (nodeType === 'ansiblejob' && isHookNode) {
    showAnsibleJobDetails(node, details, t)

    if (!safeGet(node, 'specs.raw.spec') || Object.keys(resourceMap).length === 0) {
      const res = {
        name: name,
        namespace: namespace,
        cluster: hubClusterName,
        kind: 'ansiblejob',
        apigroup: 'tower.ansible.com',
        apiversion: 'v1alpha1',
      }
      details.push({
        type: 'spacer',
      })
      details.push({
        type: 'link',
        value: {
          label: t('View resource YAML'),
          data: {
            action: showResourceYaml,
            cluster: res.cluster,
            editLink: createEditLink(res, hubClusterName),
          },
        },
        indent: true,
      })
      return details // No other status info available
    }
  } else {
    details.push({
      type: 'spacer',
    })
    details.push({
      type: 'label',
      labelValue: t('Cluster deploy status'),
    })
  }

  // Process each cluster
  clusterNames.forEach((clusterName) => {
    details.push({
      type: 'spacer',
    })
    clusterName = clusterName.trim()

    if (!onlineClusters.includes(clusterName)) {
      // Offline cluster or unmappable Argo destination server
      return showMissingClusterDetails(clusterName, node, details, t)
    }

    details.push({
      labelValue: t('Cluster name'),
      value: clusterName,
    })

    const resourcesForCluster = Object.values(resourceMap)
      .flat()
      .filter((obj: any) => safeGet(obj, 'cluster', '') === clusterName)
    const resourceNSString = !safeGet(node, 'namespace') ? 'name' : 'namespace'

    // Get cluster target namespaces
    const targetNSList = getTargetNsForNode(node, resourcesForCluster as ResourceItem[], clusterName, '*')

    targetNSList.forEach((targetNS) => {
      let res = resourcesForCluster.find((obj: any) => safeGet(obj, resourceNSString, '') === targetNS)

      if (node.type !== 'ansiblejob' || !isHookNode) {
        // Process regular resources (not ansible hooks)
        const deployedKey = res
          ? node.type === 'namespace'
            ? deployedNSStr
            : safeGet(res, 'status', deployedStr)
          : node.type === 'namespace'
            ? notDeployedNSStr
            : notDeployedStr
        const deployedKeyLower = deployedKey.toLowerCase()
        const statusStr: StatusType = resSuccessStates.includes(deployedKeyLower)
          ? checkmarkStatus
          : resNotDeployedStates.includes(deployedKeyLower)
            ? pendingStatus
            : resErrorStates.includes(deployedKeyLower as (typeof resErrorStates)[number])
              ? failureStatus
              : warningStatus

        let addItemToDetails = false
        if (resourceStatuses.size > 0) {
          if (
            (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode)) ||
            (statusStr === pendingStatus && (activeFilterCodes.has(pendingCode) || activeFilterCodes.has(warningCode)))
          ) {
            addItemToDetails = true
          }
        } else {
          addItemToDetails = true
        }

        if (addItemToDetails) {
          details.push({
            labelValue: targetNS,
            value: `${deployedKey}${res && typeof res === 'object' && 'desired' in res ? '  ' + (res as any).resStatus : ''}`,
            status: statusStr,
          })
        } else {
          res = null
        }
      }

      if (res) {
        // Add OpenShift route location info
        addOCPRouteLocation(node, clusterName, targetNS, details, t)

        // Add service location info
        addNodeServiceLocation(node, clusterName, targetNS, details, t)

        // Add apiversion if not present
        if (typeof res === 'object' && res !== null && !('apiversion' in res)) {
          Object.assign(res, { apiversion: safeGet(node, apiVersionPath) })
        }

        details.push({
          type: 'link',
          value: {
            label: t('View resource YAML'),
            data: {
              action: showResourceYaml,
              cluster:
                res && typeof res === 'object' && res !== null && 'cluster' in res
                  ? (res as Record<string, unknown>).cluster
                  : undefined,
              editLink: createEditLink(res as Record<string, unknown>, hubClusterName),
            },
          },
          indent: true,
        })
      }
    })
  })

  details.push({
    type: 'spacer',
  })

  return details
} ///////////////////////////////////////////////////////////
//////////////////// POD RESOURCES /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Shows resource deployment status for resources that produce pods,
 * including detailed pod information per cluster.
 *
 * @param node - The node with pod resources
 * @param details - Array to add detail items to
 * @param activeFilters - Active status filters
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */

export const setPodDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  activeFilters: ActiveFilters,
  t: TFunction,
  hubClusterName: string
): DetailItem[] => {
  const { notDeployedStr } = getStateNames(t)
  const { resourceStatuses = new Set() } = activeFilters
  const activeFilterCodes = getActiveFilterCodes(resourceStatuses)

  if (!nodeMustHavePods(node)) {
    return details // Process only resources with pods
  }

  const podModel = safeGet(node, 'specs.podModel', [])
  const podObjects = Object.values(podModel).flat() as PodInfo[]
  const podDataPerCluster: Record<string, DetailItem[]> = {} // Pod details list for each cluster

  const clusterNames = getClusterName(node.id, node, true, hubClusterName).split(',')
  clusterNames.forEach((clusterName) => {
    podDataPerCluster[clusterName] = []
  })

  let addedDetails = false

  // Process each pod
  podObjects.forEach((pod: PodInfo) => {
    const { status, restarts, hostIP, podIP, startedAt, cluster } = pod
    const podError = [
      'Error',
      'Failed',
      'Terminating',
      'ImagePullBackOff',
      'CrashLoopBackOff',
      'RunContainerError',
    ].includes(status || '')
    const podWarning = ['Pending', 'Creating', 'Terminating'].includes(status || '')
    const clusterDetails = podDataPerCluster[cluster || '']

    if (clusterDetails) {
      addedDetails = true
      const statusStr: StatusType = podError ? failureStatus : podWarning ? warningStatus : checkmarkStatus

      let addPodDetails = false
      if (resourceStatuses.size > 0) {
        if (
          (statusStr === failureStatus && activeFilterCodes.has(failureCode)) ||
          (statusStr === warningStatus && activeFilterCodes.has(warningCode)) ||
          (statusStr === checkmarkStatus && activeFilterCodes.has(checkmarkCode))
        ) {
          addPodDetails = true
        }
      } else {
        addPodDetails = true
      }

      if (addPodDetails) {
        addDetails(clusterDetails, [
          {
            labelValue: t('Pod'),
            value: pod.name,
          },
          {
            labelValue: t('Namespace'),
            value: pod.namespace,
          },
          {
            labelValue: t('Status'),
            value: status,
            status: statusStr,
          },
        ])

        clusterDetails.push({
          type: 'link',
          value: {
            label: t('View Pod YAML and Logs'),
            data: {
              action: showResourceYaml,
              cluster: pod.cluster,
              editLink: createEditLink(pod, hubClusterName),
            },
          },
          indent: true,
        })

        addDetails(clusterDetails, [
          {
            labelValue: t('Restarts'),
            value: `${restarts}`,
          },
          {
            labelValue: t('Host and Pod IP'),
            value: `${hostIP}, ${podIP}`,
          },
          {
            labelValue: t('Created'),
            value: <AcmTimestamp timestamp={startedAt} />,
          },
        ])

        clusterDetails.push({
          type: 'spacer',
        })
      }
    }
  })

  // Show "not deployed" message if no pod details were added
  if (!addedDetails && node.type !== 'pod') {
    details.push({
      type: 'spacer',
    })
    details.push({
      type: 'label',
      labelValue: t('Cluster deploy status for pods'),
    })
    clusterNames.forEach((clusterName) => {
      details.push({ labelValue: 'Cluster name', value: clusterName })
      details.push({ labelValue: 'default', status: 'pending', value: notDeployedStr })
      details.push({
        type: 'spacer',
      })
    })
  }

  // Add pod details for each cluster
  clusterNames.forEach((clusterName) => {
    clusterName = clusterName.trim()
    const clusterDetails = podDataPerCluster[clusterName]

    if (clusterDetails && clusterDetails.length > 0) {
      details.push({
        type: 'spacer',
      })

      details.push({
        type: 'label',
        labelValue: t('Pod details for {{0}}', [clusterName]),
      })

      clusterDetails.forEach((podDetail) => {
        details.push(podDetail)
      })
    }
  })

  return details
} ///////////////////////////////////////////////////////////
//////////////////// SUBSCRIPTION /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Sets deployment status details for subscription nodes, including cluster
 * deployment status and time window information.
 *
 * @param node - The subscription node
 * @param details - Array to add detail items to
 * @param activeFilters - Active status filters
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */

export const setSubscriptionDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  activeFilters: ActiveFilters,
  t: TFunction,
  hubClusterName: string
): DetailItem[] => {
  const { resourceStatuses = new Set() } = activeFilters
  const activeFilterCodes = getActiveFilterCodes(resourceStatuses)
  const isDesign = safeGet<boolean>(node, specIsDesign, false)

  // Only process design-time subscriptions (not deployable ones)
  if (safeGet<string>(node, 'type', '') !== 'subscription' || isDeployableResource(node) || !isDesign) {
    return details
  }

  // Time window configuration
  const timeWindow = safeGet(node, 'specs.raw.spec.timewindow.windowtype')
  const timezone = safeGet(node, 'specs.raw.spec.timewindow.location', 'NA')
  const timeWindowDays = safeGet(node, 'specs.raw.spec.timewindow.daysofweek')
  const timeWindowHours = safeGet(node, 'specs.raw.spec.timewindow.hours', []) as any[]
  const isCurrentlyBlocked = safeGet(node, 'specs.isBlocked')

  let windowStatusArray: WindowStatusArray = []

  if (timeWindow) {
    windowStatusArray = (safeGet(node, 'specs.raw.status.message', '') as string).split(',')

    details.push({
      type: 'label',
      labelValue: t('Time Window'),
    })
    details.push({
      labelValue: t('Time Window type'),
      value: timeWindow,
    })

    if (timeWindowDays) {
      details.push({
        labelValue: t('Time Window days'),
        value: JSON.stringify(timeWindowDays),
      })
    }

    if (timeWindowHours) {
      timeWindowHours.forEach((timeH: any) => {
        details.push({
          labelValue: t('Time Window hours'),
          value: `${safeGet(timeH, 'start', 'NA')}-${safeGet(timeH, 'end', 'NA')}`,
        })
      })
    }

    details.push({
      labelValue: t('Time zone'),
      value: timezone,
    })

    details.push({
      labelValue: t('Currently blocked'),
      value: isCurrentlyBlocked ? t('Yes') : t('No'),
    })
  }

  // Local placement information
  const isLocalPlacementSubs = safeGet<boolean>(node, 'specs.raw.spec.placement.local')
  if (isLocalPlacementSubs) {
    details.push({
      type: 'spacer',
    })
    details.push({
      labelValue: t('Subscription deployed on local cluster'),
      value: 'true',
    })
  }

  details.push({
    type: 'spacer',
  })
  details.push({
    type: 'label',
    labelValue: t('Cluster deploy status'),
  })

  let localSubscriptionFailed = false
  let resourceMap = safeGet(node, 'specs.subscriptionModel', {})
  const filteredResourceMap = filterSubscriptionObject(resourceMap, activeFilterCodes)

  if (resourceStatuses.size > 0) {
    resourceMap = filteredResourceMap
  }

  const subscriptionReportResults = safeGet(node, 'report.results', []) as Array<{ result?: string; source?: string }>
  const onlineClusters = getOnlineClusters(node, hubClusterName)

  // Process each subscription across clusters
  Object.values(resourceMap).forEach((subscriptions: any) => {
    subscriptions.forEach((subscription: SubscriptionItem) => {
      const subsCluster = safeGet<string>(subscription, 'cluster', '')

      if (!onlineClusters.includes(subsCluster)) {
        // Cluster is offline
        details.push({
          labelValue: subsCluster,
          value: t('Cluster is offline'),
          status: warningStatus,
        })
      } else {
        const isLocalFailedSubscription =
          subscription._hubClusterResource && safeGet<string>(subscription, 'status', 'Fail').includes('Fail')
        if (isLocalFailedSubscription) {
          localSubscriptionFailed = true
        }

        const isLinkedLocalPlacementSubs =
          isLocalPlacementSubs ||
          (safeGet<string>(subscription, 'localPlacement', '') === 'true' && subsCluster === hubClusterName)

        if (isLinkedLocalPlacementSubs || !subscription._hubClusterResource || isLocalFailedSubscription) {
          const subscriptionPulse = (safeGet<string>(subscription, 'status', '') || '').includes('Fail')
            ? failureStatus
            : safeGet<string | null>(subscription, 'status', null) === null
              ? warningStatus
              : checkmarkStatus

          // Error message for subscriptions without status
          const emptyStatusErrorMsg = subscription._hubClusterResource
            ? t(
                'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the multicluster-operators-hub-subscription pod is running on hub',
                ['Propagated']
              )
            : t(
                'This subscription has no status. If the status does not change to {{0}} after waiting for initial creation, verify that the application-manager pod is running on the remote cluster.',
                ['Subscribed']
              )

          const subscriptionStatus = safeGet<string>(subscription, 'status', emptyStatusErrorMsg)

          details.push({
            labelValue: subscription.cluster,
            value: subscriptionStatus,
            status: subscriptionPulse,
          })

          if (!isLocalPlacementSubs && isLinkedLocalPlacementSubs) {
            details.push({
              labelValue: t('Subscription deployed on local cluster'),
              value: 'true',
            })
          }

          setClusterWindowStatus(windowStatusArray, subscription, details, t)

          // Check for failed packages in subscription status
          const statuses = safeGet(node, 'specs.raw.status.statuses', {})
          const clusterKey = subscription.cluster ?? ''
          const clusterStatus = safeGet(statuses, clusterKey, {}) as Record<string, unknown>
          const packageItems = safeGet(clusterStatus, 'packages', {}) as Record<string, any>
          const { reason } = safeGet(node, 'specs.raw.status', {}) as Record<string, unknown>
          const failedPackage = Object.values(packageItems).find(
            (item: any) => String(safeGet(item, 'phase', '')) === 'Failed'
          )
          const subscriptionStatusValue = safeGet<string>(subscription, 'status', '')
          const failedSubscriptionStatus = (subscriptionStatusValue || '').includes('Fail')

          if (failedSubscriptionStatus) {
            details.push({
              labelValue: t('Error'),
              value: reason || t('Some resources failed to deploy. Use View resource YAML link to view the details.'),
              status: failureStatus,
            })
          }

          if (failedPackage && !failedSubscriptionStatus) {
            details.push({
              labelValue: t('Warning'),
              value: t('Some resources failed to deploy. Use View resource YAML link to view the details.'),
              status: warningStatus,
            })
          }

          // Check subscription report results
          const clusterResult = subscriptionReportResults.find(
            (res: { source?: string; result?: string }) => res.source === subsCluster
          )
          if (clusterResult && clusterResult.result === 'failed') {
            details.push({
              labelValue: t('Error'),
              value: t('Some resources failed to deploy. Use View status YAML link to view the details.'),
              status: failureStatus,
            })

            const subscriptionStatusLink = createEditLink(
              node,
              hubClusterName,
              'SubscriptionStatus',
              subsCluster,
              'apps.open-cluster-management.io/v1alpha1'
            )
            details.push({
              type: 'link',
              value: {
                label: t('View status YAML'),
                data: {
                  action: 'show_resource_yaml',
                  cluster: subsCluster,
                  editLink: subscriptionStatusLink,
                },
              },
            })
          }
        }
      }

      details.push({
        type: 'spacer',
      })
    })
  })

  // Show missing remote placement error if applicable
  if (
    Object.keys(resourceMap).length === 0 &&
    !localSubscriptionFailed &&
    !isLocalPlacementSubs &&
    resourceStatuses.size === 0
  ) {
    details.push({
      labelValue: t('Remote subscriptions'),
      value: t(
        'This subscription was not added to a managed cluster. If this status does not change after waiting for initial creation, ensure the Placement Rule resource is valid and exists in the {{0}} namespace and that the application-manager pod runs on the managed clusters.',
        [node.namespace]
      ),
      status: failureStatus,
    })

    if (isSearchAvailable()) {
      const ruleSearchLink = `/multicloud/search?filters={"textsearch":"kind%3Aplacementrule%20namespace%3A${node.namespace}%20cluster%3A${hubClusterName}"}`
      details.push({
        type: 'link',
        value: {
          label: t('View all placement rules in {{0}} namespace', [node.namespace]),
          id: `${node.id}-subscrSearch`,
          data: {
            action: 'open_link',
            targetLink: ruleSearchLink,
          },
        },
      })
    }
  }

  details.push({
    type: 'spacer',
  })

  return details
} ///////////////////////////////////////////////////////////////////////////////////////
////////////////////////  SET STATUS IN DETAILS TAB ///////////////////////////////////
//////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////
//////////////////// APPLICATION /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Sets deployment status details for application nodes in the details panel.
 * Handles both regular applications and Argo CD applications.
 *
 * @param node - The application node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */

export const setApplicationDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TFunction,
  hubClusterName: string
): DetailItem[] => {
  const isDesign = safeGet<boolean>(node, 'specs.isDesign', false)
  if ((node.type !== 'application' || !isDesign) && (node.type !== 'applicationset' || !isDesign)) {
    return details
  }

  const apiVersion = safeGet<string>(node, apiVersionPath, '')
  if (node.type === 'applicationset') {
    setAppSetDeployStatus(node, details, t, hubClusterName)
  } else if (apiVersion && apiVersion.indexOf('argoproj.io') > -1) {
    setArgoApplicationDeployStatus(node, details, t)
  } else {
    // Regular ACM application - check for subscription selector
    addPropertyToList(
      details,
      getNodePropery(
        node,
        ['specs', 'raw', 'spec', 'selector'],
        t('Subscription Selector'),
        t('This application has no subscription match selector (spec.selector.matchExpressions)'),
        ''
      )
    )

    details.push({
      type: 'spacer',
    })

    // Show error if no channel (no linked subscription)
    if (!isDeployableResource(node) && !safeGet<any>(node, 'specs.channels')) {
      const appNS = safeGet<string>(node, 'namespace', 'NA')

      details.push({
        labelValue: t('Error'),
        value: t(
          'This application has no matched subscription. Make sure the subscription match selector spec.selector.matchExpressions exists and matches a Subscription resource created in the {{0}} namespace.',
          [appNS]
        ),
        status: failureStatus,
      })

      const subscrSearchLink = `/multicloud/search?filters={"textsearch":"kind%3Asubscription%20namespace%3A${appNS}%20cluster%3A${hubClusterName}"}`
      details.push({
        type: 'link',
        value: {
          label: t('View all subscriptions in {{0}} namespace', [appNS]),
          id: `${node.id}-subscrSearch`,
          data: {
            action: 'open_link',
            targetLink: subscrSearchLink,
          },
        },
      })
    }
  }

  return details
} ///////////////////////////////////////////////////////////
//////////////////// RULE /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Sets deployment status details for placement rule nodes.
 *
 * @param node - The placement rule node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @returns Updated details array
 */

export const setPlacementRuleDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TFunction
): DetailItem[] => {
  if (safeGet<string>(node, 'type', '') !== 'placements' || node.isPlacement) {
    return details
  }

  const clusterStatus = safeGet(node, 'specs.raw.status.decisions', []) as unknown[]
  if (clusterStatus.length === 0) {
    details.push({
      labelValue: t('Error'),
      value: t(
        'This Placement Rule does not match any remote clusters. Make sure the clusterSelector and clusterConditions properties, when used, are valid and match your clusters. If using the clusterReplicas property make sure is being set to a positive value.'
      ),
      status: failureStatus,
    })
  }

  return details
} ///////////////////////////////////////////////////////////
//////////////////// CLUSTER /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Sets cluster status details showing all clusters associated with a node
 * and any clusters not selected by placement rules.
 *
 * @param node - The cluster node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 * @returns Updated details array
 */

export const setClusterStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TFunction,
  hubClusterName: string
): DetailItem[] => {
  const { id } = node
  const specs = safeGet(node, 'specs', {})
  const {
    cluster,
    targetNamespaces = {},
    clusters = [],
    appClusters = [],
    clustersNames = [],
  } = specs as {
    cluster?: ClusterInfo
    targetNamespaces?: Record<string, unknown>
    clusters?: ClusterInfo[]
    appClusters?: string[]
    clustersNames?: string[]
  }

  const clusterArr = cluster ? [cluster] : clusters
  const appClustersList = appClusters.length > 0 ? appClusters : Object.keys(targetNamespaces)

  // Add Argo app clusters not covered by deployed resource clusters
  appClustersList.forEach((appCls: string) => {
    if (clusters.findIndex((obj: any) => safeGet(obj, 'name') === appCls) === -1) {
      clusterArr.push({
        name: appCls,
        _clusterNamespace: appCls === hubClusterName ? appCls : '_',
        status: appCls === hubClusterName ? 'ok' : '',
      })
    }
  })

  // Find zombie clusters (found by search but not selected by placement rule)
  const zombieClusters: string[] = []
  clustersNames.forEach((searchCls: string) => {
    if (
      !clusters.find((prCls: any) => {
        if (prCls.metadata) {
          return prCls.metadata.name === searchCls
        }
        return prCls.name === searchCls
      })
    ) {
      zombieClusters.push(searchCls)
    }
  })

  details.push({
    type: 'label',
    labelValue: `${t('Clusters')} (${clusterArr.length})`,
  })

  details.push({
    type: 'clusterdetailcombobox',
    comboboxdata: {
      clusterList: clusterArr,
      clusterID: id,
    },
  })

  // Show clusters not selected by placement rule
  if (zombieClusters.length > 0) {
    details.push({
      type: 'spacer',
    })
    details.push({
      type: 'label',
      labelValue: `${t('Not selected by placement rule')} (${zombieClusters.length})`,
    })
    zombieClusters.forEach((cls) => {
      details.push({
        labelValue: t('Cluster name'),
        value: cls,
      })
    })
  }

  return details
} /**
 * Sets deployment status details for placement nodes.
 *
 * @param node - The placement node
 * @param details - Array to add detail items to
 * @param t - Translation function
 */

export const setPlacementDeployStatus = (node: TopologyNodeWithStatus, details: DetailItem[], t: TFunction): void => {
  if (node.type !== 'placements' || !node.isPlacement) {
    return
  }

  const placementStatus = safeGet(node, 'specs.raw.status') as { numberOfSelectedClusters?: number } | undefined
  if (placementStatus) {
    if (placementStatus.numberOfSelectedClusters === 0) {
      details.push({
        labelValue: t('Error'),
        value: t(
          'This Placement does not match any remote clusters. Make sure the requiredClusterSelector property is valid and match your clusters.'
        ),
        status: failureStatus,
      })
    }
  } else {
    details.push({
      labelValue: t('Error'),
      value: t(
        'This Placement does not have any status. Make sure the ManagedClusterSetBinding is created for the target namespace.'
      ),
      status: failureStatus,
    })
  }
}
///////////////////////////////////////////////////////////
//////////////////// ARGO APPLICATION /////////////////////////
///////////////////////////////////////////////////////////
/**
 * Sets deployment status details for Argo CD applications.
 *
 * @param node - The Argo application node
 * @param details - Array to add detail items to
 * @param t - Translation function
 */

export const setArgoApplicationDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TFunction
): void => {
  const relatedArgoApps = safeGet<ArgoApp[]>(node, 'specs.relatedApps', [])
  if (relatedArgoApps.length === 0) {
    return // Search is not available
  }

  // Show error if app is not healthy
  const appHealth = safeGet(node, 'specs.raw.status.health.status')
  const appStatusConditions = safeGet(node, 'specs.raw.status.conditions')

  if ((appHealth === 'Unknown' || appHealth === 'Degraded' || appHealth === 'Missing') && appStatusConditions) {
    details.push({
      labelValue: t('Health status'),
      value: t(
        'The health status for application {{0}} is {{1}}. Use the Launch Argo editor action below to view the application details.',
        [safeGet(node, 'name', ''), appHealth]
      ),
      status: failureStatus,
    })
  }

  // Related Argo apps section
  details.push({
    type: 'label',
    labelValue: t('Related applications ({{0}})', [relatedArgoApps.length]),
  })

  details.push({
    type: 'spacer',
  })

  // Sort and display related Argo apps
  const sortedRelatedArgoApps = relatedArgoApps.sort((a, b) =>
    (safeGet(a, 'name', '') as string).toLowerCase().localeCompare((safeGet(b, 'name', '') as string).toLowerCase())
  )
  details.push({
    type: 'relatedargoappdetails',
    relatedargoappsdata: {
      argoAppList: sortedRelatedArgoApps as ArgoApp[],
    },
  })
} /**
 * Sets deployment status details for ApplicationSet nodes.
 *
 * @param node - The ApplicationSet node
 * @param details - Array to add detail items to
 * @param t - Translation function
 * @param hubClusterName - Name of the hub cluster
 */

export const setAppSetDeployStatus = (
  node: TopologyNodeWithStatus,
  details: DetailItem[],
  t: TFunction,
  hubClusterName: string
): void => {
  const isPlacementFound = safeGet(node, 'isPlacementFound')
  if (!isPlacementFound) {
    details.push({
      labelValue: t('Error'),
      value: t(
        'The placement referenced in the ApplicationSet is not found. Make sure the placement is configured properly.'
      ),
      status: failureStatus,
    })
    return
  }

  const appSetApps = safeGet(node, 'specs.appSetApps', []) as ArgoApplication[]
  const isArgoCDPullModelTargetLocalCluster = safeGet(node, 'isArgoCDPullModelTargetLocalCluster')

  if (appSetApps.length === 0) {
    if (isArgoCDPullModelTargetLocalCluster) {
      details.push({
        labelValue: t('Error'),
        value: t(
          'The ArgoCD pull model does not support the hub cluster as a destination cluster. Filter out the hub cluster from the placement resource.'
        ),
        status: failureStatus,
      })
      return
    }

    details.push({
      labelValue: t('Error'),
      value: t(
        'There are no Argo applications created. Check the following resources and make sure they are configured properly: applicationset placement, gitopscluster, gitopscluster placement, managedclusterset. Also make sure the ApplicationSet feature is enabled if GitOps is deployed to a namespace other than openshift-gitops.'
      ),
      status: failureStatus,
    })
    return
  } else {
    if (isArgoCDPullModelTargetLocalCluster) {
      details.push({
        labelValue: t('Warning'),
        value: t(
          'The ArgoCD pull model does not support the hub cluster as a destination cluster. Filter out the hub cluster from the placement resource.'
        ),
        status: warningStatus,
      })
      details.push({
        type: 'spacer',
      })
    }
  }

  details.push({
    type: 'label',
    labelValue: t('Application deploy status'),
  })
  details.push({
    type: 'spacer',
  })

  // Display status for each ApplicationSet app
  appSetApps.forEach((argoApp: ArgoApplication) => {
    const appHealth = safeGet(argoApp, 'status.health.status', '') as ArgoHealthStatus
    const appSync = safeGet(argoApp, 'status.sync.status', '')
    const appName = safeGet(argoApp, metadataName, '') as string
    const appNamespace = safeGet(argoApp, 'metadata.namespace')
    const appStatusConditions = safeGet(argoApp, 'status.conditions', []) as Array<{ type: string; message: string }>

    details.push({
      labelValue: appName,
      value: appHealth,
    })
    details.push({
      labelValue: t('Sync status'),
      value: appSync,
    })

    appStatusConditions.forEach((condition: any) => {
      details.push({
        labelValue: condition.type,
        value: condition.message,
        status: failureStatus,
      })
    })

    details.push({
      type: 'link',
      value: {
        label: t('Launch Argo editor'),
        id: `argoapp-${appName}`,
        data: {
          action: 'open_argo_editor',
          name: appName,
          namespace: appNamespace,
          cluster: hubClusterName,
        },
      },
    })
    details.push({
      type: 'spacer',
    })
  })
} /**
 * Gets the appropriate status type for an Argo application health status.
 *
 * @param healthStatus - The Argo health status
 * @returns The corresponding status type
 */

export const getStatusForArgoApp = (healthStatus: ArgoHealthStatus): StatusType => {
  if (healthStatus === argoAppHealthyStatus) {
    return checkmarkStatus
  }
  if (healthStatus === argoAppProgressingStatus) {
    return pendingStatus
  }
  if (healthStatus === argoAppUnknownStatus) {
    return failureStatus
  }
  return warningStatus
} /**
 * Sets cluster window status information for subscription time windows.
 *
 * @param windowStatusArray - Array of window status strings
 * @param subscription - The subscription item
 * @param details - Array to add detail items to
 * @param t - Translation function
 */

export const setClusterWindowStatus = (
  windowStatusArray: WindowStatusArray,
  subscription: SubscriptionItem,
  details: DetailItem[],
  t: TFunction
): void => {
  windowStatusArray.forEach((wstatus: string) => {
    if (wstatus.trimStart().startsWith(`${subscription.cluster}:`)) {
      details.push({
        labelValue: t('Current window status is'),
        value: wstatus.split(':')[1],
      })
    }
  })
} /**
 * Gets localized state names for resource deployment status.
 *
 * @param t - Translation function
 * @returns Object containing localized state names and arrays
 */

export const getStateNames = (t: TFunction): StateNames => {
  const notDeployedStr = t('Not Deployed')
  const notDeployedNSStr = t('Not Created')
  const deployedStr = t('Deployed')
  const deployedNSStr = t('Created')
  const resNotDeployedStates = [notDeployedStr.toLowerCase(), notDeployedNSStr.toLowerCase()]
  const resSuccessStates = [
    'run',
    'bound',
    deployedStr.toLowerCase(),
    deployedNSStr.toLowerCase(),
    'propagated',
    'healthy',
    'active',
    'available',
    'running',
  ]
  return { notDeployedStr, notDeployedNSStr, deployedStr, deployedNSStr, resNotDeployedStates, resSuccessStates }
}
