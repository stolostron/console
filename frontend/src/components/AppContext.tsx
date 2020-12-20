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

export function AppContextContainer(props: { children: React.ReactNode[] | React.ReactNode }) {
    const [featureGates, setFeatureGates] = useState<Record<string, FeatureGate>>({})
    const [clusterManagementAddons, setClusterManagementAddons] = useState<ClusterManagementAddOn[]>([])

    useEffect(() => {
        // TODO change discovery FG to use a label
        // i.e. console.open-cluster-management.io/feature-gate
        ;(async () => {
            const calls = [listClusterManagementAddOns(), listFeatureGates()]
            const results = await Promise.allSettled(calls.map((call) => call.promise))
            if (results[0].status === 'fulfilled') {
                setClusterManagementAddons(results[0].value as ClusterManagementAddOn[])
            } else {
                console.error(results[0])
            }

            if (results[1].status === 'fulfilled') {
                const featureGates = results[1].value as FeatureGate[]
                const discoveryFeature = featureGates.find(
                    (fg) => fg.metadata.name === 'open-cluster-management-discovery'
                )
                discoveryFeature && setFeatureGates({ 'open-cluster-management-discovery': discoveryFeature })
            } else {
                console.error(results[1])
            }
        })()
    }, [])

    return <AppContext.Provider value={{ featureGates, clusterManagementAddons }}>{props.children}</AppContext.Provider>
}
