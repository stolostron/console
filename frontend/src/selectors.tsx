/* Copyright Contributors to the Open Cluster Management project */
import { selector } from 'recoil'
import { clusterCuratorsState, managedClustersState } from './atoms'

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
