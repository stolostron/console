/* Copyright Contributors to the Open Cluster Management project */
import { PluginData } from '../../components/PluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Credentials from './Credentials'

export default function CredentialsPlugin() {
    return (
        <PluginContextProvider>
            <PluginData>
                <Credentials />
            </PluginData>
        </PluginContextProvider>
    )
}
