/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../components/LoadPluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Credentials from './Credentials'

export default function CredentialsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <Credentials />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
