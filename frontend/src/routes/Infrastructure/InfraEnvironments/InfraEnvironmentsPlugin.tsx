/* Copyright Contributors to the Open Cluster Management project */
import { ACMNotReadyWarning } from '../../../components/ACMNotReadyWarning'
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import InfraEnvironments from './InfraEnvironments'

export default function InfraEnvironmentsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <ACMNotReadyWarning>
          <InfraEnvironments />
        </ACMNotReadyWarning>
      </LoadPluginData>
    </PluginContextProvider>
  )
}
