/* Copyright Contributors to the Open Cluster Management project */
import { Context, createContext, FC } from 'react'
import { AcmExtension } from '../plugin-extensions/types'
import { PluginData, PluginDataContext } from './PluginDataContext'
import { TimestampProps, UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk/lib/extensions/console-types'

export type Plugin = {
  isACMAvailable: boolean
  isOverviewAvailable: boolean
  isSubmarinerAvailable: boolean
  isApplicationsAvailable: boolean
  isGovernanceAvailable: boolean
  isSearchAvailable: boolean
  dataContext: Context<PluginData>
  acmExtensions: AcmExtension
  ocpApi: {
    Timestamp?: FC<TimestampProps>
    useK8sWatchResource: UseK8sWatchResource
    useFlag: (flag: string) => boolean
  }
}

export const defaultPlugin: Plugin = {
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
    useFlag: () => false, // default implementation returns false for standalone development
  },
}

export const PluginContext = createContext<Plugin>(defaultPlugin)
