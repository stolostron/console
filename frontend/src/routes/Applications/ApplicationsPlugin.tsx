/* Copyright Contributors to the Open Cluster Management project */
import '../../lib/configure-mobx'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import { LoadPluginData } from '../../components/LoadPluginData'
import Applications from './Applications'

export default function ApplicationsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <Applications />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
