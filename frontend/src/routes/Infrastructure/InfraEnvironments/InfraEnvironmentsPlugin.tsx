/* Copyright Contributors to the Open Cluster Management project */
import { ACMNotReadyWarning } from '../../../components/ACMNotReadyWarning'
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'

export default function InfraEnvironmentsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <ACMNotReadyWarning>
          <InfraEnvironmentsPage />
        </ACMNotReadyWarning>
      </LoadPluginData>
    </PluginContextProvider>
  )
}
