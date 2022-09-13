/* Copyright Contributors to the Open Cluster Management project */
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Clusters from './Clusters'

import './ClustersPlugin.css'

export default function ClustersPlugin() {
    return (
        <PluginContextProvider>
            <PluginData>
                <Clusters />
            </PluginData>
        </PluginContextProvider>
    )
}
