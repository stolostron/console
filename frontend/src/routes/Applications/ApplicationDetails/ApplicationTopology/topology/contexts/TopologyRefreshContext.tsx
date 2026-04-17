/* Copyright Contributors to the Open Cluster Management project */
import { createContext, useContext } from 'react'

export type TopologyRefreshContextValue = {
  refreshResources?: () => void
}

export const TopologyRefreshContext = createContext<TopologyRefreshContextValue>({})

export function useTopologyRefresh(): TopologyRefreshContextValue {
  return useContext(TopologyRefreshContext)
}
