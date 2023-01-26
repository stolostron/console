/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import InfraEnvironments from './InfraEnvironments'

import './InfraEnvironmentsPlugin.css'

export default function InfraEnvironmentsPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <InfraEnvironments />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
