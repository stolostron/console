/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import type { IResource } from '../../../../../resources'
import type { AppSetCluster, ArgoAppResource, PulseColor, TopologyNode } from '../types'
import type { IResourcesWithStatus, TopologyAlert } from './analyzeTopology'
import {
  createTopologyAlert,
  type IBulletDescription,
  TopologyAlertActionType,
  type TopologyAlertDescription,
} from './utils'
import { DOC_LINKS } from '~/lib/doc-util'

export interface SyncAlertEntry {
  kind: string
  healthSyncKey: string
  clusterName: string
}

export interface AnalyzeTopologyHealthResult {
  syncAlerts: SyncAlertEntry[]
  appMap: Record<string, IResource>
  badResourceMap: Record<string, Record<string, string[]>>
  unhealthyClusterSet: Set<string>
  hasApplicationIssues: boolean
  appsetClusters: string[]
  isAppSetPullModel: boolean
  /** False when there are no health/sync/deploy issues to continue analyzing. */
  shouldContinue: boolean
}

/**
 * Analyzes ApplicationSet application and deployment health/sync status and deployment coverage.
 */
export const analyzeTopologyHealth = (
  appSet: TopologyNode,
  deploymentNodes: TopologyNode[]
): AnalyzeTopologyHealthResult => {
  const syncAlerts: SyncAlertEntry[] = []
  const appMap: Record<string, IResource> = {}
  const badResourceMap: Record<string, Record<string, string[]>> = {}

  const appSetName = appSet.name
  const appSetApps = (appSet.specs.appSetApps ?? []) as IResourcesWithStatus[]
  const appsetClusters = ((appSet.specs.appSetClusters ?? []) as AppSetCluster[]).map((cluster) => cluster.name)
  const sortedClusterNames = [...appsetClusters].sort((a, b) => b.length - a.length)
  const isAppSetPullModel = Boolean(appSet.specs.isAppSetPullModel)

  /////////////////////////////////////////////
  // create alert for unhealthy/unsynced applications and deployment resources
  /////////////////////////////////////////////
  appSetApps.forEach((app) => {
    const compositeName = app.metadata?.name ?? ''
    const { clusterName, appName } = parseCompositeAppName(compositeName, appSetName, sortedClusterNames)
    if (!clusterName) {
      return
    }

    const mapKey = `${clusterName}/${appName}`
    appMap[mapKey] = app

    recordHealthSyncIssue(
      'Application',
      (app.status as { health?: { status?: string } } | undefined)?.health?.status,
      (app.status as { sync?: { status?: string } } | undefined)?.sync?.status,
      clusterName,
      mapKey,
      badResourceMap,
      syncAlerts
    )
  })

  deploymentNodes.forEach((deploymentNode) => {
    const resources = deploymentNode.specs?.resources as ArgoAppResource[] | undefined
    if (!resources) {
      return
    }

    resources.forEach((resource) => {
      const clusterName = resource.cluster as string | undefined
      if (!clusterName || resource.requiresPruning === true) {
        return
      }

      recordHealthSyncIssue(
        capitalizeKind(resource.kind),
        resource.health?.status,
        resource.status,
        clusterName,
        `${clusterName}/${resource.name}`,
        badResourceMap,
        syncAlerts
      )
    })
  })

  /////////////////////////////////////////////
  // get list of clusters on where app resources haven't deployed correctly
  /////////////////////////////////////////////
  const unhealthyClusterSet = new Set<string>()

  for (const deploymentNode of deploymentNodes) {
    const resources = (deploymentNode.specs?.resources ?? []) as ArgoAppResource[]

    if (deploymentNode.specs.resourceCount !== appsetClusters.length) {
      const resourceClusters = new Set(resources.map((resource) => resource.cluster).filter(Boolean) as string[])
      appsetClusters.forEach((clusterName) => {
        if (!resourceClusters.has(clusterName)) {
          unhealthyClusterSet.add(clusterName)
        }
      })
    }

    resources.forEach((resource) => {
      const cluster = resource.cluster as string | undefined
      if (cluster && isBadDeployResourceHealth(resource)) {
        unhealthyClusterSet.add(cluster)
      }
    })

    if (unhealthyClusterSet.size === appsetClusters.length) {
      break
    }
  }

  const hasApplicationIssues = Boolean(badResourceMap.Application && Object.keys(badResourceMap.Application).length > 0)
  if (!hasApplicationIssues && unhealthyClusterSet.size === 0 && syncAlerts.length === 0) {
    return {
      syncAlerts,
      appMap,
      badResourceMap,
      unhealthyClusterSet,
      hasApplicationIssues,
      appsetClusters,
      isAppSetPullModel,
      shouldContinue: false,
    }
  }

  const badAppClusters = getClustersFromBadResourceMap(badResourceMap)
  Object.keys(appMap).forEach((mapKey) => {
    const [clusterName] = mapKey.split('/')
    if (!badAppClusters.has(clusterName) && !unhealthyClusterSet.has(clusterName)) {
      delete appMap[mapKey]
    }
  })

  return {
    syncAlerts,
    appMap,
    badResourceMap,
    unhealthyClusterSet,
    hasApplicationIssues,
    appsetClusters,
    isAppSetPullModel,
    shouldContinue: true,
  }
}

/**
 * Creates consolidated health/sync alerts for unhealthy ApplicationSet resources.
 */
export const createSuggestsHealth = (
  appSet: TopologyNode,
  deploymentNodes: TopologyNode[],
  health: AnalyzeTopologyHealthResult,
  alerts: TopologyAlert[],
  t: TFunction
): void => {
  if (!health.shouldContinue) {
    return
  }

  const { syncAlerts, appsetClusters, isAppSetPullModel } = health

  /////////////////////////////////////////////
  // create alert for unhealthy/unsynced deployments
  /////////////////////////////////////////////
  if (syncAlerts.length > 0) {
    const healthSyncKeys = [...new Set(syncAlerts.map((entry) => entry.healthSyncKey))]
    setPartialUnhealthyDeploymentNodePulses(deploymentNodes, appsetClusters)
    pushSyncAlert(
      t('Some resources are not healthy or synced on these clusters'),
      getConsolidatedSyncStatus(healthSyncKeys),
      buildConsolidatedSyncDescription(syncAlerts, isAppSetPullModel, t),
      appSet,
      alerts,
      t
    )
  } else {
    appSet.specs.pulse = 'green'
  }
}

export const setPartialUnhealthyDeploymentNodePulses = (
  deploymentNodes: TopologyNode[],
  appsetClusters: string[]
): void => {
  const unhealthyNodes = deploymentNodes.filter((node) => isDeploymentNodeUnhealthy(node, appsetClusters))

  if (unhealthyNodes.length > 0 && unhealthyNodes.length < deploymentNodes.length) {
    unhealthyNodes.forEach((node) => {
      node.specs.pulse = 'red'
    })
  }
}

interface ParsedAppName {
  clusterName: string
  appName: string
}

const formatClusterListContent = (clusters: string[], t: TFunction): string[] => {
  const sorted = [...clusters].sort((a, b) => a.localeCompare(b))
  if (sorted.length <= 3) {
    return sorted
  }
  return [...sorted.slice(0, 3), t('and {{count}} more', { count: sorted.length - 3 })]
}

const buildHealthSyncKey = (healthStatus: string | undefined, syncStatus: string | undefined): string => {
  const parts: string[] = []
  if (syncStatus && syncStatus !== 'Synced' && healthStatus !== 'Progressing') {
    parts.push(syncStatus)
  }
  if (healthStatus && healthStatus !== 'Healthy') {
    parts.push(healthStatus)
  }
  return parts.join('/')
}

const capitalizeKind = (kind: string): string => (kind ? `${kind.charAt(0).toUpperCase()}${kind.slice(1)}` : '')

const recordHealthSyncIssue = (
  kind: string,
  healthStatus: string | undefined,
  syncStatus: string | undefined,
  clusterName: string,
  mapKey: string,
  badResourceMap: Record<string, Record<string, string[]>>,
  syncAlerts: SyncAlertEntry[]
): void => {
  const healthSyncKey = buildHealthSyncKey(healthStatus, syncStatus)
  if (!healthSyncKey) {
    return
  }

  if (!badResourceMap[kind]) {
    badResourceMap[kind] = {}
  }
  if (!badResourceMap[kind][healthSyncKey]) {
    badResourceMap[kind][healthSyncKey] = []
  }
  badResourceMap[kind][healthSyncKey].push(mapKey)
  syncAlerts.push({ kind, healthSyncKey, clusterName })
}

const parseCompositeAppName = (
  compositeName: string,
  appSetName: string,
  sortedClusterNames: string[]
): ParsedAppName => {
  const namePart = compositeName.startsWith(appSetName) ? compositeName.substring(appSetName.length + 1) : compositeName

  const clusterName =
    sortedClusterNames.find(
      (cluster) => namePart === cluster || namePart.includes(`-${cluster}`) || namePart.includes(`${cluster}-`)
    ) ?? ''

  const appName = clusterName ? namePart.replace(clusterName, '').replaceAll(/(?:^-)|(?:-$)/g, '') : namePart

  return { clusterName, appName: appName || appSetName }
}

const getClustersFromBadResourceMap = (badResourceMap: Record<string, Record<string, string[]>>): Set<string> => {
  const clusters = new Set<string>()
  const applicationEntries = badResourceMap.Application
  if (!applicationEntries) {
    return clusters
  }

  Object.values(applicationEntries).forEach((mapKeys) => {
    mapKeys.forEach((mapKey) => {
      const [clusterName] = mapKey.split('/')
      if (clusterName) {
        clusters.add(clusterName)
      }
    })
  })
  return clusters
}

const isBadDeployResourceHealth = (resource: ArgoAppResource): boolean => {
  return buildHealthSyncKey(resource.health?.status, resource.status) !== ''
}

const isDeploymentNodeUnhealthy = (deploymentNode: TopologyNode, appsetClusters: string[]): boolean => {
  const resources = (deploymentNode.specs?.resources ?? []) as ArgoAppResource[]

  if (deploymentNode.specs.resourceCount !== appsetClusters.length) {
    const resourceClusters = new Set(resources.map((resource) => resource.cluster).filter(Boolean) as string[])
    if (appsetClusters.some((clusterName) => !resourceClusters.has(clusterName))) {
      return true
    }
  }

  return resources.some((resource) => {
    const cluster = resource.cluster as string | undefined
    return cluster && isBadDeployResourceHealth(resource)
  })
}

const formatKindList = (kinds: string[], t: TFunction): string => {
  const sorted = [...new Set(kinds)].sort((a, b) => {
    if (a === 'Application') return -1
    if (b === 'Application') return 1
    return a.localeCompare(b)
  })
  const displayed = sorted.slice(0, 5).join(', ')
  const suffix = sorted.length > 5 ? t(' and {{count}} more', { count: sorted.length - 5 }) : ''
  return t('Kinds: {{kinds}}{{suffix}}', { kinds: displayed, suffix })
}

const RED_HEALTH_SYNC_KEYS = ['Degraded', 'Unknown', 'Missing']
const ORANGE_HEALTH_SYNC_KEYS = ['Progressing', 'OutOfSync']

const getConsolidatedSyncStatus = (healthSyncKeys: string[]): PulseColor => {
  let status: PulseColor = 'yellow'
  healthSyncKeys.forEach((key) => {
    if (RED_HEALTH_SYNC_KEYS.some((token) => key.includes(token))) {
      status = 'red'
    } else if (ORANGE_HEALTH_SYNC_KEYS.some((token) => key.includes(token)) && status !== 'red') {
      status = 'orange'
    }
  })
  return status
}

const getSyncAlertSuggestionBullets = (isPullModel: boolean, t: TFunction): IBulletDescription[] =>
  isPullModel
    ? [
        {
          title: t(
            'Because this is a pull application, make sure the application has permissions to create namespaces on the target cluster.'
          ),
          content: [],
          link: { label: t('View documentation'), url: DOC_LINKS.GITOPS_REGISTER },
        },
        {
          title: t(
            'If the namespace must be created by this application, add a Namespace manifest to the repository with an early sync wave'
          ),
          content: [],
        },
      ]
    : [
        { title: t('Wait a few minutes for syncing to complete'), content: [] },
        { title: t('You can also try resyncing resources'), content: [] },
        { title: t('If the problem persists, try editing the Application in Argo CD'), content: [] },
      ]

const buildConsolidatedSyncDescription = (
  syncAlerts: SyncAlertEntry[],
  isPullModel: boolean,
  t: TFunction
): TopologyAlertDescription => {
  const byHealthSyncKey = new Map<string, { kinds: Set<string>; clusters: Set<string> }>()

  syncAlerts.forEach(({ kind, healthSyncKey, clusterName }) => {
    if (!byHealthSyncKey.has(healthSyncKey)) {
      byHealthSyncKey.set(healthSyncKey, { kinds: new Set(), clusters: new Set() })
    }
    const entry = byHealthSyncKey.get(healthSyncKey)!
    entry.kinds.add(kind)
    entry.clusters.add(clusterName)
  })

  const sortedKeys = [...byHealthSyncKey.keys()].sort((a, b) => a.localeCompare(b))

  if (sortedKeys.length === 1) {
    const healthSyncKey = sortedKeys[0]
    const { kinds, clusters } = byHealthSyncKey.get(healthSyncKey)!
    return {
      message: t('Status: {{status}}', { status: healthSyncKey }),
      bullets: [
        {
          title: formatKindList([...kinds], t),
          content: formatClusterListContent([...clusters], t),
        },
        ...(healthSyncKey !== 'Progressing' ? getSyncAlertSuggestionBullets(isPullModel, t) : []),
      ],
    }
  }

  const bullets: IBulletDescription[] = [
    ...sortedKeys.map((healthSyncKey) => {
      const { kinds, clusters } = byHealthSyncKey.get(healthSyncKey)!
      return {
        title: t('Status: {{status}}', { status: healthSyncKey }),
        content: [formatKindList([...kinds], t), ...formatClusterListContent([...clusters], t)],
      }
    }),
    ...(sortedKeys.some((healthSyncKey) => healthSyncKey !== 'Progressing')
      ? getSyncAlertSuggestionBullets(isPullModel, t)
      : []),
  ]

  return {
    message: '',
    bullets,
  }
}

const pushSyncAlert = (
  title: string,
  status: PulseColor,
  description: TopologyAlertDescription,
  appSet: TopologyNode,
  alerts: TopologyAlert[],
  t: TFunction
): void => {
  const actions = [
    {
      label: t('Edit application'),
      type: TopologyAlertActionType.editAppSet,
      node: appSet,
    },
    {
      label: t('Edit YAML'),
      type: TopologyAlertActionType.editYaml,
      node: appSet,
      highlightEditorPath: 'ApplicationSet.spec.template.spec.sources',
    },
    {
      label: t('Sync resources'),
      type: TopologyAlertActionType.syncResources,
      node: appSet,
    },
    {
      label: t('Launch Argo editor'),
      type: TopologyAlertActionType.launchArgo,
      node: appSet,
    },
  ]
  const alert = createTopologyAlert(title, status, description, actions)
  if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
    alerts.push(alert)
  }
}
