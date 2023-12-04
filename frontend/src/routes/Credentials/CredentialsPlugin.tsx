/* Copyright Contributors to the Open Cluster Management project */
import { ACMNotReadyWarning } from '../../components/ACMNotReadyWarning'
import { LoadPluginData } from '../../components/LoadPluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Credentials from './Credentials'

export default function CredentialsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <ACMNotReadyWarning>
          <Credentials />
        </ACMNotReadyWarning>
      </LoadPluginData>
    </PluginContextProvider>
  )
}
