/* Copyright Contributors to the Open Cluster Management project */
import { ACMNotReadyWarning } from '../../../components/ACMNotReadyWarning'
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Clusters from './Clusters'

export default function ClustersPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <ACMNotReadyWarning>
          <Clusters />
        </ACMNotReadyWarning>
      </LoadPluginData>
    </PluginContextProvider>
  )
}
