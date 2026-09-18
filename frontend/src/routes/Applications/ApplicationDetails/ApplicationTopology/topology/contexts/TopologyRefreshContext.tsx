/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useContext } from 'react'
import type { TopologyNode } from '../../types'

export type TopologyRefreshContextValue = {
  refreshResources?: () => void
  onViewLogs?: (node: TopologyNode) => void
  onEditYaml?: (node: TopologyNode) => void
  onEditApplications?: (node: TopologyNode) => void
}

export const TopologyRefreshContext = createContext<TopologyRefreshContextValue>({})

export function useTopologyRefresh(): TopologyRefreshContextValue {
  return useContext(TopologyRefreshContext)
}
