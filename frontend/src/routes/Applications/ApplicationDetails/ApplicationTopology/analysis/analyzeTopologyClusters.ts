/* Copyright Contributors to the Open Cluster Management project */
import { GitOpsClusterApiVersion, GitOpsClusterKind } from '~/resources/gitops-cluster'
import { getResource } from '~/resources/utils'
import type { TFunction } from 'i18next'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import type { AppSetCluster, TopologyNode } from '../types'
import type { IFilteredConditionError, IResourcesWithStatus, TopologyAlert } from './analyzeTopology'
import { createSuggestsAppset } from './createSuggestsAppset'
import {
  createTopologyAlert,
  extractConditionsErrors,
  TopologyAlertActionType,
  type IBulletDescription,
  type TopologyAlertDescription,
} from './utils'

const MAX_PULL_CLUSTER_FETCHES = 3
const GITOPS_CLUSTER_NAME = 'gitops'
const GITOPS_NAMESPACE = 'openshift-gitops'
const MANAGED_CLUSTER_REGISTRATION_ERROR_PREFIX = 'Failed to register managed clusters with ArgoCD'
const GITOPS_OPERATOR_SUBSCRIPTION = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  name: 'openshift-gitops-operator',
  namespace: 'openshift-gitops-operator',
}

const fetchHubGitOpsCluster = async (): Promise<IResourcesWithStatus | undefined> => {
  try {
    return (await getResource({
      apiVersion: GitOpsClusterApiVersion,
      kind: GitOpsClusterKind,
      metadata: { name: GITOPS_CLUSTER_NAME, namespace: GITOPS_NAMESPACE },
    }).promise) as IResourcesWithStatus
  } catch {
    return undefined
  }
}

const verifyPullClusterGitOps = async (
  appSet: TopologyNode,
  appSetClusters: string[],
  alerts: TopologyAlert[],
  t: TFunction
): Promise<void> => {
  const clustersToVerify = appSetClusters.slice(0, MAX_PULL_CLUSTER_FETCHES)
  await Promise.all(
    clustersToVerify.map(async (clusterName) => {
      try {
        const response = await fleetResourceRequest('GET', clusterName, GITOPS_OPERATOR_SUBSCRIPTION)
        if ('errorMessage' in response) {
          const alert = createTopologyAlert(t('OpenShift GitOps Operator Missing'), 'red', {
            message: t('Cannot find OpenShift GitOps Operator on {{clusterName}}', { clusterName }),
            bullets: [
              {
                title: t(
                  'For pulled applications, make sure the OpenShift GitOps Operator is installed on {{clusterName}}',
                  { clusterName }
                ),
                content: [],
              },
            ],
          })
          if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
            alerts.push(alert)
          }
          appSet.specs.pulse = 'red'
        }
      } catch {
        // Ignore unreachable clusters during operator verification.
      }
    })
  )
}

const getConditionErrorMessages = (error: IFilteredConditionError): string[] =>
  error.errors.flatMap((filtered) => [
    filtered.firstError.message,
    ...filtered.otherErrors.map((conditionError) => conditionError.message),
  ])

const findManagedClusterRegistrationMessage = (errors: IFilteredConditionError[]): string | undefined => {
  for (const gitopsError of errors) {
    for (const message of getConditionErrorMessages(gitopsError)) {
      if (message.includes(MANAGED_CLUSTER_REGISTRATION_ERROR_PREFIX) && message.includes('all options')) {
        return message
      }
    }
  }
  return undefined
}

const buildGitOpsOperatorIssuesDescription = (message: string): TopologyAlertDescription => {
  const allOptionsIndex = message.indexOf('all options')
  const mainMessage = message.slice(0, allOptionsIndex).trimEnd().replace(/:\s*$/, '')

  const bullets: IBulletDescription[] = message
    .slice(allOptionsIndex)
    .split(/\n(?=all options)/)
    .map((segment) => segment.trim())
    .filter((segment) => segment.startsWith('all options'))
    .map((title) => ({ title, content: [] }))

  return {
    message: mainMessage,
    bullets: bullets.length > 0 ? bullets : undefined,
  }
}

/**
 * Analyzes cluster topology nodes for GitOpsCluster condition errors.
 */
export const analyzeTopologyClusters = async (
  appSet: TopologyNode,
  nodes: TopologyNode[],
  alerts: TopologyAlert[],
  t: TFunction
): Promise<void> => {
  const isAppSetPullModel = Boolean(appSet.specs.isAppSetPullModel)
  const appSetClusters = (appSet.specs.appSetClusters ?? []) as AppSetCluster[]
  const placement = nodes.find((node) => node.type === 'placement')

  if (isAppSetPullModel) {
    await verifyPullClusterGitOps(
      appSet,
      appSetClusters.map((cluster) => cluster.name),
      alerts,
      t
    )
  }

  /////////////////////////////////////////////
  // Hub GitOpsCluster errors (push model only when placement expects more clusters than found)
  /////////////////////////////////////////////
  const numberOfClusters = (placement?.specs?.raw as { spec?: { numberOfClusters?: number } } | undefined)?.spec
    ?.numberOfClusters
  if (!isAppSetPullModel && numberOfClusters !== undefined && numberOfClusters > appSetClusters.length) {
    const hubGitOpsCluster = await fetchHubGitOpsCluster()
    if (hubGitOpsCluster) {
      const gitopsErrors = extractConditionsErrors([hubGitOpsCluster], t)

      if (gitopsErrors.length > 0) {
        const managedClusterRegistrationMessage = findManagedClusterRegistrationMessage(gitopsErrors)

        if (managedClusterRegistrationMessage) {
          const alert = createTopologyAlert(
            t('OpenShift GitOps Operator issues'),
            'orange',
            buildGitOpsOperatorIssuesDescription(managedClusterRegistrationMessage)
          )
          if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
            alerts.push(alert)
          }
        } else {
          gitopsErrors.forEach((appsetError) => {
            createSuggestsAppset(appSet, appsetError, alerts, t)
          })
        }
      }
    }
  }

  /////////////////////////////////////////////
  // Pull model targeting hub/local cluster
  /////////////////////////////////////////////
  if (appSet.isArgoCDPullModelTargetLocalCluster) {
    const actionNode = placement ?? appSet
    const alert = createTopologyAlert(
      t('Warning'),
      'yellow',
      {
        message: t(
          'The ArgoCD pull model does not support the hub cluster as a destination cluster. Filter out the hub cluster from the placement resource.'
        ),
        bullets: [
          {
            title: t('Add predicate to exclude the local-cluster'),
          },
        ],
      },
      [
        {
          label: t('Edit application'),
          type: TopologyAlertActionType.editAppSet,
          node: actionNode,
        },
        {
          label: t('Edit YAML'),
          type: TopologyAlertActionType.editYaml,
          node: actionNode,
          highlightEditorPath: 'Placement.spec.predicates',
        },
      ]
    )
    if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
      alerts.push(alert)
    }
  }
}
