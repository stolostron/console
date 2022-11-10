/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Automations from './Automations'

export default function AutomationsPlugin() {
    return (
        <PluginContextProvider>
            <LoadPluginData>
                <Automations />
            </LoadPluginData>
        </PluginContextProvider>
    )
}
