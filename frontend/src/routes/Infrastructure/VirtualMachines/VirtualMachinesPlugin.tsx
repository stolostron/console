/* Copyright Contributors to the Open Cluster Management project */
import { ACMNotReadyWarning } from '../../../components/ACMNotReadyWarning'
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import VirtualMachines from './VirtualMachines'

export default function VirtualMachinesPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <ACMNotReadyWarning>
          <VirtualMachines />
        </ACMNotReadyWarning>
      </LoadPluginData>
    </PluginContextProvider>
  )
}
