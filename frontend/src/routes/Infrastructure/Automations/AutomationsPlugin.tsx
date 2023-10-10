/* Copyright Contributors to the Open Cluster Management project */
import { ACMNotReadyWarning } from '../../../components/ACMNotReadyWarning'
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Automations from './Automations'

export default function AutomationsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <ACMNotReadyWarning>
          <Automations />
        </ACMNotReadyWarning>
      </LoadPluginData>
    </PluginContextProvider>
  )
}
