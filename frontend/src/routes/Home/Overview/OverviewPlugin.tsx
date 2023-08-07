/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Overview from './Overview'

export default function OverviewPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <Overview />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
