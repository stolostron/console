/* Copyright Contributors to the Open Cluster Management project */
import { Context, useContext } from 'react'
import { PluginContext } from '../../lib/PluginContext'
import { KubevirtPluginData } from '../extensions/KubevirtContext'

export const useKubevirtPluginContext = () => {
  const { acmExtensions } = useContext(PluginContext)
  return acmExtensions?.kubevirtContext?.[0].properties.context as Context<KubevirtPluginData>
}
