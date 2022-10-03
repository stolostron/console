/* Copyright Contributors to the Open Cluster Management project */
import { useSharedAtoms } from './shared-recoil'
import { selector as readOnlySelector } from 'recoil'
import { Curation } from './resources/cluster-curator'
import { unpackProviderConnection } from './resources/provider-connection'

export const ansibleCredentialsValue = readOnlySelector({
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

export const clusterCuratorTemplatesValue = readOnlySelector({
    key: 'clusterCuratorTemplates',
    get: ({ get }) => {
        const atoms = useSharedAtoms()
        const { clusterCuratorsState, managedClustersState } = atoms
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
export const clusterCuratorSupportedCurationsValue = readOnlySelector({
    key: 'clusterCuratorSupportedCurations',
    get: ({ get }) => {
        const atoms = useSharedAtoms()
        const { settingsState } = atoms
        const settings = get(settingsState)
        return settings.ansibleIntegration === 'enabled' ? allCurations : basicCurations
    },
})

export const providerConnectionsValue = readOnlySelector({
    key: 'providerConnections',
    get: ({ get }) => {
        const atoms = useSharedAtoms()
        const { secretsState } = atoms
        const secrets = get(secretsState)
        return secrets.map(unpackProviderConnection)
    },
})

export const validClusterCuratorTemplatesValue = readOnlySelector({
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
                        curatorTemplate?.spec?.[curation]?.prehook?.length ||
                        curatorTemplate?.spec?.[curation]?.posthook?.length
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
