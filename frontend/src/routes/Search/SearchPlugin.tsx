/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../components/LoadPluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Search from './Search'

export default function SearchPlugin() {
  return (
    <PluginContextProvider>
      <LoadPluginData>
        <Search />
      </LoadPluginData>
    </PluginContextProvider>
  )
}
