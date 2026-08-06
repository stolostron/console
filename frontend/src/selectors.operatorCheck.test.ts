/* Copyright Contributors to the Open Cluster Management project */
import { snapshot_UNSTABLE } from 'recoil'
import { clusterExtensionsState, subscriptionOperatorsState } from './atoms'
import {
  ClusterExtensionApiVersion,
  ClusterExtensionKind,
  CLUSTER_EXTENSION_SOURCE_LABEL,
} from './resources/cluster-extension'
import type { ClusterExtension } from './resources/cluster-extension'
import { SubscriptionOperatorApiVersion, SubscriptionOperatorKind } from './resources/subscription-operator'
import type { SubscriptionOperator } from './resources/subscription-operator'
import { gitOpsOperatorSubscriptionsValue, kubevirtOperatorSubscriptionsValue } from './selectors'

const healthyGitOpsSubscription: SubscriptionOperator = {
  apiVersion: SubscriptionOperatorApiVersion,
  kind: SubscriptionOperatorKind,
  metadata: { name: 'openshift-gitops-operator', namespace: 'openshift-gitops' },
  spec: { name: 'openshift-gitops-operator' },
  status: {
    installedCSV: 'openshift-gitops-operator.v1.8.2',
    conditions: [{ type: 'CatalogSourcesUnhealthy', status: 'False' }],
  },
}

const installedKubevirtClusterExtension: ClusterExtension = {
  apiVersion: ClusterExtensionApiVersion,
  kind: ClusterExtensionKind,
  metadata: { name: 'kubevirt-hyperconverged' },
  spec: {
    namespace: 'openshift-cnv',
    source: {
      sourceType: 'Catalog',
      catalog: { packageName: 'kubevirt-hyperconverged' },
    },
  },
  status: {
    install: { bundle: { version: '4.17.0' } },
    conditions: [{ type: 'Installed', status: 'True', reason: 'Succeeded' }],
  },
}

const notInstalledClusterExtension: ClusterExtension = {
  ...installedKubevirtClusterExtension,
  status: {
    conditions: [{ type: 'Installed', status: 'False', reason: 'Failed' }],
  },
}

describe('operator subscription selectors', () => {
  it('returns Subscription when only Subscription is present', () => {
    const snapshot = snapshot_UNSTABLE(({ set }) => {
      set(subscriptionOperatorsState, [healthyGitOpsSubscription])
      set(clusterExtensionsState, [])
    })
    expect(snapshot.getLoadable(gitOpsOperatorSubscriptionsValue).contents).toEqual([healthyGitOpsSubscription])
  })

  it('returns mapped ClusterExtension when only ClusterExtension is present', () => {
    const snapshot = snapshot_UNSTABLE(({ set }) => {
      set(subscriptionOperatorsState, [])
      set(clusterExtensionsState, [installedKubevirtClusterExtension])
    })
    const result = snapshot.getLoadable(kubevirtOperatorSubscriptionsValue).contents as SubscriptionOperator[]
    expect(result).toHaveLength(1)
    expect(result[0].spec.name).toBe('kubevirt-hyperconverged')
    expect(result[0].status?.installedCSV).toBe('4.17.0')
    expect(result[0].metadata?.namespace).toBe('openshift-cnv')
    expect(result[0].metadata?.labels?.[CLUSTER_EXTENSION_SOURCE_LABEL]).toBe('ClusterExtension')
  })

  it('prefers Subscription when both Subscription and ClusterExtension are present', () => {
    const snapshot = snapshot_UNSTABLE(({ set }) => {
      set(subscriptionOperatorsState, [healthyGitOpsSubscription])
      set(clusterExtensionsState, [
        {
          ...installedKubevirtClusterExtension,
          metadata: { name: 'openshift-gitops-operator' },
          spec: {
            namespace: 'openshift-gitops',
            source: {
              sourceType: 'Catalog',
              catalog: { packageName: 'openshift-gitops-operator' },
            },
          },
        },
      ])
    })
    expect(snapshot.getLoadable(gitOpsOperatorSubscriptionsValue).contents).toEqual([healthyGitOpsSubscription])
  })

  it('ignores ClusterExtension that is not installed', () => {
    const snapshot = snapshot_UNSTABLE(({ set }) => {
      set(subscriptionOperatorsState, [])
      set(clusterExtensionsState, [notInstalledClusterExtension])
    })
    expect(snapshot.getLoadable(kubevirtOperatorSubscriptionsValue).contents).toEqual([])
  })
})
