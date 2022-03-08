/* Copyright Contributors to the Open Cluster Management project */
import { createContext } from 'react'

export const PluginContext = createContext<{
    isACMAvailable?: boolean
    isOverviewAvailable?: boolean
    isSubmarinerAvailable?: boolean
    isApplicationsAvailable?: boolean
    isGovernanceAvailable?: boolean
    isSearchAvailable?: boolean
}>({
    isACMAvailable: true,
    isOverviewAvailable: true,
    isSubmarinerAvailable: true,
    isApplicationsAvailable: true,
    isGovernanceAvailable: true,
    isSearchAvailable: true,
})
