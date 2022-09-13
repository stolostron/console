/* Copyright Contributors to the Open Cluster Management project */
import { PluginData } from '../../components/PluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Governance from './Governance'

export default function GovernancePlugin() {
    return (
        <PluginContextProvider>
            <PluginData>
                <Governance />
            </PluginData>
        </PluginContextProvider>
    )
}
