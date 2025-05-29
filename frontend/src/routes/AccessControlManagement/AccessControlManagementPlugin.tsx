/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../components/LoadPluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import AccessControlManagement from './AccessControlManagement'

export default function AccessControlManagementPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <AccessControlManagement />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
