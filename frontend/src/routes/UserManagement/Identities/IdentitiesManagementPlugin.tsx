/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import IdentitiesManagement from './IdentitiesManagement'
// TODO: trigger sonar issue
export default function IdentitiesManagementPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <IdentitiesManagement />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
