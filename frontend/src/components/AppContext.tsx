import React, { useState, useEffect } from 'react'
import { FeatureGate, listFeatureGates } from '../resources/feature-gate'
import { ClusterManagementAddOn, listClusterManagementAddOns } from '../resources/cluster-management-add-on'

export const AppContext = React.createContext<{
    readonly featureGates: Record<string, FeatureGate>
    readonly clusterManagementAddons: ClusterManagementAddOn[]
}>({
    featureGates: {},
    clusterManagementAddons: [],
})

export function AppContextContainer(props: { children: React.ReactNode[] }) {
    const [featureGates, setFeatureGates] = useState<Record<string, FeatureGate>>({})
    const [clusterManagementAddons, setClusterManagementAddons] = useState<ClusterManagementAddOn[]>([])

    useEffect(() => {
        try {
            listClusterManagementAddOns().promise.then((items) => {
                setClusterManagementAddons(items)
            })
        } catch (err) {
            console.error(err)
        }
        // TODO change discovery FG to use a label
        // i.e. console.open-cluster-management.io/feature-gate
        try {
            listFeatureGates().promise.then((items) => {
                const discoveryFeature = items.find(
                    (item: FeatureGate) => item.metadata.name === 'open-cluster-management-discovery'
                )
                discoveryFeature && setFeatureGates({ 'open-cluster-management-discovery': discoveryFeature })
            })
        } catch (err) {
            console.error(err)
        }
    }, [])

    return <AppContext.Provider value={{ featureGates, clusterManagementAddons }}>{props.children}</AppContext.Provider>
}
