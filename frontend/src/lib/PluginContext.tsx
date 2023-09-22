/* Copyright Contributors to the Open Cluster Management project */
import { Context, createContext } from 'react'
import { AcmExtension } from '../plugin-extensions/types'
import { PluginData, PluginDataContext } from './PluginDataContext'
import { UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk/lib/extensions/console-types'

export const PluginContext = createContext<{
  isACMAvailable?: boolean
  isOverviewAvailable?: boolean
  isSubmarinerAvailable?: boolean
  isApplicationsAvailable?: boolean
  isGovernanceAvailable?: boolean
  isSearchAvailable?: boolean
  dataContext: Context<PluginData>
  acmExtensions?: AcmExtension
  ocpApi: {
    useK8sWatchResource: UseK8sWatchResource
  }
}>({
  isACMAvailable: true,
  isOverviewAvailable: true,
  isSubmarinerAvailable: true,
  isApplicationsAvailable: true,
  isGovernanceAvailable: true,
  isSearchAvailable: true,
  dataContext: PluginDataContext,
  acmExtensions: {},
  ocpApi: {
    useK8sWatchResource: () => [[] as any, true, undefined],
  },
})
