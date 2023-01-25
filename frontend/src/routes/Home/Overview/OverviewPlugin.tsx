/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import OverviewPage from './OverviewPage'

export default function OverviewPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <OverviewPage />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
