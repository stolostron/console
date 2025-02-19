/* Copyright Contributors to the Open Cluster Management project */
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import VirtualMachineConsole from './VirtualMachineConsole'
import { PluginDataContext, usePluginDataContextValue } from '../../../lib/PluginDataContext'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'

export default function VirtualMachinesConsolePlugin() {
  const value = usePluginDataContextValue()
  return (
    <PluginDataContext.Provider value={value}>
      <RecoilRoot>
        <PluginContextProvider pluginDataContext={PluginDataContext}>
          <VirtualMachineConsole />
        </PluginContextProvider>
      </RecoilRoot>
    </PluginDataContext.Provider>
  )
}
