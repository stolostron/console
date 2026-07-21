/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import { getFilteredNode } from '../helpers/diagram-helpers'
import type { ResourceItemWithStatus, ResourceMap, TopologyNode } from '../types'
import type { TopologyAlert } from './analyzeTopology'
import { createTopologyAlert, TopologyAlertActionType } from './utils'

export const DEPLOYMENT_NODE_EXCLUDED_TYPES = new Set([
  'application',
  'applicationset',
  'placement',
  'placementDecision',
  'cluster',
  'git',
  'chart',
])

const capitalizeKind = (type: string): string => (type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : '')

/**
 * Analyzes deployment topology nodes for red-pulse resources and creates alerts.
 */
export const analyzeTopologyDeployments = (
  appSet: TopologyNode,
  deploymentNodes: TopologyNode[],
  alerts: TopologyAlert[],
  t: TFunction
): void => {
  deploymentNodes.forEach((node) => {
    if (node.specs.pulse === 'green') {
      return
    }

    const kind = capitalizeKind(node.type)
    const resourceMap = (node.specs[`${node.type}Model`] ?? {}) as ResourceMap

    Object.values(resourceMap)
      .flat()
      .forEach((resource) => {
        const resourceItem = resource as ResourceItemWithStatus
        if (resourceItem.pulse !== 'red') {
          return
        }

        const name = resourceItem.name ?? node.name
        const cluster = resourceItem.cluster ?? ''
        const status = resourceItem.status ?? resourceItem.resStatus ?? ''
        const title = t('{{status}} on {{cluster}}', { status, cluster })
        const message = t('Resource did not deploy: {{kind}}/{{name}}', { kind, name })
        const actionNode = getFilteredNode(node, {
          name,
          namespace: resourceItem.namespace ?? node.namespace,
          cluster,
        })

        const actions = [
          {
            label: t('Edit YAML'),
            type: TopologyAlertActionType.editYaml,
            node: actionNode,
          },
          ...(kind === 'Pod'
            ? [
                {
                  label: t('Show logs'),
                  type: TopologyAlertActionType.showLog,
                  node: actionNode,
                },
              ]
            : []),
          {
            label: t('Launch Argo editor'),
            type: TopologyAlertActionType.launchArgo,
            node: appSet,
          },
        ]

        const bullets = [
          ...(status ? [{ title: status, content: [] as string[] }] : []),
          { title: t('View YAML status for cause'), content: [] as string[] },
        ]

        const alert = createTopologyAlert(title, 'red', { message, bullets }, actions)
        if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
          alerts.push(alert)
        }
      })
  })
}
