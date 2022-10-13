/* Copyright Contributors to the Open Cluster Management project */
import { PluginContextProvider } from '../../components/PluginContextProvider'
import { PluginData } from '../../components/PluginData'
import Applications from './Applications'

export default function ApplicationsPlugin() {
    return (
        <PluginContextProvider>
            <PluginData>
                <Applications />
            </PluginData>
        </PluginContextProvider>
    )
}
