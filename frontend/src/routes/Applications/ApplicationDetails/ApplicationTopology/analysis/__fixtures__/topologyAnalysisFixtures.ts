/* Copyright Contributors to the Open Cluster Management project */
import type { TopologyNode } from '../types'
import type { IFilteredConditionError, IResourcesWithStatus } from './utils'

export const APPSET_NAME = 'test-appset'
export const NAMESPACE = 'openshift-gitops'
export const CLUSTER_NAME = 'local-cluster'

export const createCondition = (
  overrides: Partial<{
    message: string
    reason: string
    status: 'True' | 'False'
    type: string
  }> = {}
) => ({
  message: overrides.message ?? 'error message',
  reason: overrides.reason ?? 'Error',
  status: overrides.status ?? ('True' as const),
  type: overrides.type ?? 'Error',
})

export const createResourceWithConditions = (
  kind: string,
  name: string,
  conditions: ReturnType<typeof createCondition>[],
  namespace = NAMESPACE
): IResourcesWithStatus => ({
  apiVersion: 'v1',
  kind,
  metadata: { name, namespace },
  status: { conditions },
})

export const createFilteredError = (
  message: string,
  overrides: Partial<{
    kind: string
    name: string
    namespace: string
    reason: string
    type: string
    otherErrors: { message: string; reason: string; type: string }[]
  }> = {}
): IFilteredConditionError => {
  const resource = createResourceWithConditions(
    overrides.kind ?? 'Placement',
    overrides.name ?? 'test-resource',
    [createCondition({ message, reason: overrides.reason, type: overrides.type })]
  )
  return {
    name: overrides.name ?? 'test-resource',
    namespace: overrides.namespace ?? NAMESPACE,
    kind: overrides.kind ?? 'Placement',
    resource,
    errors: [
      {
        firstError: {
          message,
          reason: overrides.reason ?? 'Error',
          type: overrides.type ?? 'Error',
        },
        otherErrors: overrides.otherErrors ?? [],
      },
    ],
  }
}

export const createAppSetNode = (overrides: Partial<TopologyNode> = {}): TopologyNode => {
  const { specs: specsOverrides, ...rest } = overrides
  return {
    name: APPSET_NAME,
    namespace: NAMESPACE,
    type: 'applicationset',
    id: `application--${APPSET_NAME}`,
    ...rest,
    specs: {
      raw: {
        apiVersion: 'argoproj.io/v1alpha1',
        kind: 'ApplicationSet',
        metadata: { name: APPSET_NAME, namespace: NAMESPACE },
        spec: {
          generators: [{ clusterDecisionResource: { labelSelector: { matchLabels: {} } } }],
          template: {
            spec: {
              sources: [{ repoURL: 'https://example.com/repo.git', path: 'apps/nginx' }],
              destination: { namespace: 'default' },
            },
          },
        },
        status: { conditions: [] },
      },
      appSetApps: [
        {
          metadata: { name: `${APPSET_NAME}-${CLUSTER_NAME}`, namespace: NAMESPACE },
          kind: 'Application',
          status: {
            health: { status: 'Healthy' },
            sync: { status: 'Synced' },
          },
        },
      ],
      appSetClusters: [{ name: CLUSTER_NAME }],
      isAppSetPullModel: false,
      clusterNames: [CLUSTER_NAME],
      ...(specsOverrides as object),
    },
  }
}

export const createPlacementNode = (
  conditionMessage?: string,
  placementOverrides: Record<string, unknown> = {}
): TopologyNode => {
  const placement = {
    apiVersion: 'cluster.open-cluster-management.io/v1beta1',
    kind: 'Placement',
    metadata: { name: 'test-placement', namespace: NAMESPACE },
    spec: {
      predicates: [{ requiredClusterSelector: { labelSelector: { matchLabels: { env: 'prod' } } } }],
      clusterSets: ['default'],
    },
    status: {
      conditions: conditionMessage
        ? [
            {
              type: 'PlacementSatisfied',
              reason: 'NotSatisfied',
              message: conditionMessage,
              status: 'False' as const,
            },
          ]
        : [],
    },
    ...placementOverrides,
  }

  return {
    name: 'test-placement',
    namespace: NAMESPACE,
    type: 'placement',
    id: `member--placement--${NAMESPACE}--${APPSET_NAME}`,
    specs: { isDesign: true, raw: placement },
    placement,
  }
}

export const createDeploymentNode = (
  resources: {
    kind: string
    name: string
    cluster?: string
    status?: string
    health?: { status?: string }
    requiresPruning?: boolean
  }[],
  resourceCount?: number
): TopologyNode => ({
  name: 'nginx-deployment',
  namespace: 'default',
  type: 'deployment',
  id: 'member--deployable--nginx-deployment',
  specs: {
    isDesign: false,
    resourceCount: resourceCount ?? resources.length,
    resources,
  },
})
