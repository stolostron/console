/* Copyright Contributors to the Open Cluster Management project */
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Search from './Search'

export default function SearchPlugin() {
    return (
        <PluginContextProvider>
            <PluginData>
                <Search />
            </PluginData>
        </PluginContextProvider>
    )
}
