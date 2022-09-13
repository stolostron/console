/* Copyright Contributors to the Open Cluster Management project */
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import OverviewPage from './OverviewPage'

export default function OverviewPlugin() {
    return (
        <PluginContextProvider>
            <PluginData>
                <OverviewPage />
            </PluginData>
        </PluginContextProvider>
    )
}
