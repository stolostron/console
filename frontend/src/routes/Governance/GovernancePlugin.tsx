/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../components/LoadPluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Governance from './Governance'

export default function GovernancePlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <Governance />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
