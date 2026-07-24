/* Copyright Contributors to the Open Cluster Management project */
import type { TFunction } from 'i18next'
import { fleetResourceRequest } from '../../../../../resources/utils/fleet-resource-request'
import { searchClient } from '../../../../Search/search-sdk/search-client'
import { SearchRelatedResult, SearchResultItemsAndRelatedItemsDocument } from '../../../../Search/search-sdk/search-sdk'
import type { TopologyNode } from '../types'
import type { TopologyAlert } from './analyzeTopology'
import type { AnalyzeTopologyHealthResult } from './analyzeTopologyHealth'
import { createTopologyAlert, TopologyAlertActionType } from './utils'

const MAX_PULL_CLUSTER_FETCHES = 3
const GITOPS_NAMESPACE = 'openshift-gitops'
const ARGOCD_NAME = 'openshift-gitops'
const GITOPS_OPERATOR_SUBSCRIPTION = {
  apiVersion: 'operators.coreos.com/v1alpha1',
  kind: 'Subscription',
  name: 'openshift-gitops-operator',
  namespace: 'openshift-gitops-operator',
}

/**
 * Analyzes OpenShift GitOps operator availability and GitOpsCluster condition errors.
 * @returns true when GitOps pod issues were found and alerts were added
 */
export const checkOpenshiftGitops = async (
  appSet: TopologyNode,
  nodes: TopologyNode[],
  health: AnalyzeTopologyHealthResult,
  alerts: TopologyAlert[],
  t: TFunction
): Promise<boolean> => {
  const { isAppSetPullModel, unhealthyClusterSet } = health
  const placement = nodes.find((node) => node.type === 'placement')
  let hasGitopsIssues = false

  if (isAppSetPullModel) {
    await verifyPullClusterGitOps(appSet, [...unhealthyClusterSet], alerts, t)
  }

  /////////////////////////////////////////////
  // ArgoCD instance and related pods on unhealthy clusters
  /////////////////////////////////////////////
  if (unhealthyClusterSet.size > 0) {
    const pods = await fetchArgoCDRelatedPods([...unhealthyClusterSet])
    hasGitopsIssues = await checkNonRunningArgoCDPods(pods, alerts, t)
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
            title: t('Add predicate to exclude the local hub cluster'),
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

  return hasGitopsIssues
}

interface ArgoCDSearchResource {
  name?: string
  namespace?: string
  cluster?: string
  kind?: string
  status?: string
  restarts?: number | string
  _uid?: string
  _relatedUids?: string[]
}

/**
 * Searches for ArgoCD instances in openshift-gitops on the given clusters and returns related Pods.
 */
const fetchArgoCDRelatedPods = async (clusters: string[]): Promise<ArgoCDSearchResource[]> => {
  if (clusters.length === 0) {
    return []
  }

  const searchResult = await searchClient.query({
    query: SearchResultItemsAndRelatedItemsDocument,
    variables: {
      input: [
        {
          filters: [
            { property: 'name', values: [ARGOCD_NAME] },
            { property: 'namespace', values: [GITOPS_NAMESPACE] },
            { property: 'kind', values: ['ArgoCD'] },
            { property: 'cluster', values: clusters },
            { property: 'apigroup', values: ['argoproj.io'] },
          ],
          relatedKinds: ['Pod'],
        },
      ],
      limit: 1000,
    },
    fetchPolicy: 'network-only',
  })

  return (searchResult.data?.searchResult?.[0]?.related ?? [])
    .filter((related: SearchRelatedResult | null) => related?.kind?.toLowerCase() === 'pod')
    .flatMap((related: SearchRelatedResult | null) => (related?.items ?? []).filter(Boolean) as ArgoCDSearchResource[])
}

interface PodTerminatedContainerStatus {
  status?: {
    containerStatuses?: Array<{
      lastState?: {
        terminated?: {
          reason?: string
        }
      }
    }>
  }
}

/**
 * Fetches full Pod resources for pods that are not Running or have restarts > 3,
 * and creates alerts for terminated containers.
 * @returns true when one or more alerts were added
 */
const checkNonRunningArgoCDPods = async (
  pods: ArgoCDSearchResource[],
  alerts: TopologyAlert[],
  t: TFunction
): Promise<boolean> => {
  const nonRunningPods = pods.filter(
    (pod) => pod.name && pod.cluster && pod.namespace && (pod.status !== 'Running' || Number(pod.restarts ?? 0) > 3)
  )
  let hasGitopsIssues = false

  await Promise.all(
    nonRunningPods.map(async (pod) => {
      try {
        const response = await fleetResourceRequest('GET', pod.cluster!, {
          apiVersion: 'v1',
          kind: 'Pod',
          name: pod.name!,
          namespace: pod.namespace,
        })
        if ('errorMessage' in response) {
          return
        }

        const reason = (response as PodTerminatedContainerStatus).status?.containerStatuses?.[0]?.lastState?.terminated
          ?.reason
        if (!reason) {
          return
        }

        const alert = createTopologyAlert(
          t('{{reason}} on {{cluster}} cluster', {
            reason,
            cluster: pod.cluster,
          }),
          'red',
          {
            message: t(
              'The OpenShift GitOps operator is having this issue with the {{podName}} pod. The pod has restarted {{restarts}} times.',
              {
                podName: pod.name,
                restarts: Number(pod.restarts ?? 0),
              }
            ),
          }
        )
        if (!alerts.some((existingAlert) => existingAlert.id === alert.id)) {
          alerts.push(alert)
          hasGitopsIssues = true
        }
      } catch {
        // Ignore unreachable clusters during pod fetch.
      }
    })
  )

  return hasGitopsIssues
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
