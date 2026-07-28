/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import {
  clusterCuratorsState,
  clusterExtensionsState,
  managedClustersState,
  secretsState,
  settingsState,
  subscriptionOperatorsState,
} from './atoms'
import { Curation } from './resources/cluster-curator'
import {
  CLUSTER_EXTENSION_SOURCE_LABEL,
  getClusterExtensionPackageName,
  getClusterExtensionVersion,
  isClusterExtensionInstalled,
} from './resources/cluster-extension'
import type { ClusterExtension } from './resources/cluster-extension'
import { SubscriptionOperatorApiVersion, SubscriptionOperatorKind } from './resources'
import type { SubscriptionOperator } from './resources'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { GetRecoilValue, selector } from 'recoil'
import { unpackProviderConnection } from './resources/provider-connection'

export const providerConnectionsValue = selector({
  key: 'providerConnections',
  get: ({ get }) => {
    const secrets = get(secretsState)
    return secrets.map(unpackProviderConnection)
  },
})

export const ansibleCredentialsValue = selector({
  key: 'ansibleCredentials',
  get: ({ get }) => {
    const providerConnections = get(providerConnectionsValue)
    return providerConnections.filter(
      (providerConnection) =>
        providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'ans' &&
        !providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/copiedFromSecretName']
    )
  },
})

export const RHOCMCredentials = selector({
  key: 'RHOCMCredentials',
  get: ({ get }) => {
    const providerConnections = get(providerConnectionsValue)
    return providerConnections.filter(
      (providerConnection) =>
        providerConnection.metadata?.labels?.['cluster.open-cluster-management.io/type'] === 'rhocm'
    )
  },
})

export const clusterCuratorTemplatesValue = selector({
  key: 'clusterCuratorTemplates',
  get: ({ get }) => {
    const clusterCurators = get(clusterCuratorsState)
    const managedClusterNamespaces = get(managedClustersState).map((mc) => mc.metadata.name)
    return clusterCurators.filter(
      (curator) =>
        !managedClusterNamespaces.includes(curator.metadata.namespace) &&
        curator.spec?.desiredCuration === undefined &&
        curator.status === undefined
    )
  },
})

const basicCurations: Curation[] = ['install', 'upgrade']
const allCurations: Curation[] = [...basicCurations, 'scale', 'destroy']
export const clusterCuratorSupportedCurationsValue = selector({
  key: 'clusterCuratorSupportedCurations',
  get: ({ get }) => {
    const settings = get(settingsState)
    return settings.ansibleIntegration === 'enabled' ? allCurations : basicCurations
  },
})

export const validClusterCuratorTemplatesValue = selector({
  key: 'validClusterCuratorTemplates',
  get: ({ get }) => {
    const curatorTemplates = get(clusterCuratorTemplatesValue)
    const supportedCurations = get(clusterCuratorSupportedCurationsValue)
    const ansibleCredentials = get(ansibleCredentialsValue)
    return curatorTemplates.filter((curatorTemplate) =>
      supportedCurations.every(
        // each curation with any hooks must have a secret reference and the secret must exist
        (curation) =>
          !(
            curatorTemplate?.spec?.[curation]?.prehook?.length || curatorTemplate?.spec?.[curation]?.posthook?.length
          ) ||
          (curatorTemplate?.spec?.[curation]?.towerAuthSecret &&
            ansibleCredentials.find(
              (secret) =>
                secret.metadata.name === curatorTemplate?.spec?.[curation]?.towerAuthSecret &&
                secret.metadata.namespace === curatorTemplate.metadata.namespace
            ))
      )
    )
  },
})

function clusterExtensionToSubscriptionOperator(clusterExtension: ClusterExtension): SubscriptionOperator {
  const packageName = getClusterExtensionPackageName(clusterExtension) ?? ''
  const version = getClusterExtensionVersion(clusterExtension)
  return {
    apiVersion: SubscriptionOperatorApiVersion,
    kind: SubscriptionOperatorKind,
    metadata: {
      name: clusterExtension.metadata?.name ?? packageName,
      namespace: clusterExtension.spec?.namespace ?? clusterExtension.metadata?.namespace,
      labels: {
        ...(clusterExtension.metadata?.labels ?? {}),
        [CLUSTER_EXTENSION_SOURCE_LABEL]: 'ClusterExtension',
      },
    },
    spec: {
      name: packageName,
    },
    status: {
      installedCSV: version,
      conditions: [
        {
          type: 'CatalogSourcesUnhealthy',
          status: 'False',
        },
      ],
    },
  }
}

const findInstalledSubscription = (name: string, get: GetRecoilValue): SubscriptionOperator[] => {
  const subscriptionOperators = get(subscriptionOperatorsState)
  const fromSubscriptions = subscriptionOperators.filter(
    (op) =>
      op.spec.name === name &&
      op?.status?.conditions?.find((c) => c.type === 'CatalogSourcesUnhealthy')?.status === 'False'
  )
  if (fromSubscriptions.length > 0) {
    return fromSubscriptions
  }

  const clusterExtensions = get(clusterExtensionsState)
  return clusterExtensions
    .filter(
      (clusterExtension) =>
        getClusterExtensionPackageName(clusterExtension) === name && isClusterExtensionInstalled(clusterExtension)
    )
    .map(clusterExtensionToSubscriptionOperator)
}

export const ansibleOperatorSubscriptionsValue = selector({
  key: 'ansibleOperatorSubscriptions',
  get: ({ get }) => findInstalledSubscription('ansible-automation-platform-operator', get),
})

export const gitOpsOperatorSubscriptionsValue = selector({
  key: 'gitOpsOperatorSubscriptions',
  get: ({ get }) => findInstalledSubscription('openshift-gitops-operator', get),
})

export const acmOperatorSubscriptionsValue = selector({
  key: 'acmOperatorSubscriptions',
  get: ({ get }) => findInstalledSubscription('advanced-cluster-management', get),
})

export const kubevirtOperatorSubscriptionsValue = selector({
  key: 'kubevirtOperatorSubscriptions',
  get: ({ get }) => findInstalledSubscription('kubevirt-hyperconverged', get),
})
