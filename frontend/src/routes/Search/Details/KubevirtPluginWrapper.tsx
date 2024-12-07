/* Copyright Contributors to the Open Cluster Management project */
import React, { useContext, createContext } from 'react'
import { PluginContext } from '../../../lib/PluginContext'
import { KubevirtPluginData } from '../../../plugin-extensions/extensions/KubevirtContext'

// Define a default context
const DefaultKubevirtPluginContext = createContext<KubevirtPluginData>({} as KubevirtPluginData)

const KubevirtPluginWrapper = (props: { children: React.ReactNode }) => {
  const { children } = props
  const { acmExtensions } = useContext(PluginContext)
  const KubevirtPluginContext = acmExtensions?.kubevirtContext?.[0].properties.context ?? DefaultKubevirtPluginContext

  const { dynamicPluginSDK, ...other } = useContext(KubevirtPluginContext)
  const contextOverride = { dynamicPluginSDK: { ...dynamicPluginSDK }, ...other }

  return <KubevirtPluginContext.Provider value={contextOverride}>{children}</KubevirtPluginContext.Provider>
}

export default KubevirtPluginWrapper
