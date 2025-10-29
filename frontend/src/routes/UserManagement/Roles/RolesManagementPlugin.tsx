/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import RolesManagement from './RolesManagement'

export default function RolesManagementPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <RolesManagement />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
