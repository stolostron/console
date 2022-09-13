/* Copyright Contributors to the Open Cluster Management project */
import { Context, createContext } from 'react'
import { AcmExtension } from '../plugin-extensions/types'
import { PluginData, PluginDataContext } from './PluginDataContext'

export const PluginContext = createContext<{
    isACMAvailable?: boolean
    isOverviewAvailable?: boolean
    isSubmarinerAvailable?: boolean
    isApplicationsAvailable?: boolean
    isGovernanceAvailable?: boolean
    isSearchAvailable?: boolean
    dataContext: Context<PluginData>,
    acmExtensions?: AcmExtension
}>({
    isACMAvailable: true,
    isOverviewAvailable: true,
    isSubmarinerAvailable: true,
    isApplicationsAvailable: true,
    isGovernanceAvailable: true,
    isSearchAvailable: true,
    dataContext: PluginDataContext,
    acmExtensions: {},
})
