/* Copyright Contributors to the Open Cluster Management project */
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Welcome from './Welcome'

export default function WelcomePlugin() {
    return (
        <PluginContextProvider>
            <Welcome />
        </PluginContextProvider>
    )
}
