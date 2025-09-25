/* Copyright Contributors to the Open Cluster Management project */
import { TimestampProps, UseK8sWatchResource } from '@openshift-console/dynamic-plugin-sdk/lib/extensions/console-types'
import { useFleetK8sWatchResource } from '@stolostron/multicluster-sdk'
import { Context, createContext, FC } from 'react'
import { AcmExtension } from '../plugin-extensions/types'
import { PluginData, PluginDataContext } from './PluginDataContext'

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
  }
  multiclusterApi: { useFleetK8sWatchResource: typeof useFleetK8sWatchResource }
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
  },
  multiclusterApi: { useFleetK8sWatchResource: () => [[] as any, true, undefined] },
}

export const PluginContext = createContext<Plugin>(defaultPlugin)
