/* Copyright Contributors to the Open Cluster Management project */
import { createContext } from 'react'
import { MulticlusterSDKProvider } from '../types'

export type FleetSupport = {
  sdkProvider: MulticlusterSDKProvider
  hubClusterName: string
}

export const FleetSupportContext = createContext<FleetSupport | undefined>(undefined)
