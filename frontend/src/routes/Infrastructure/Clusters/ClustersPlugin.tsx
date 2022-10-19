/* Copyright Contributors to the Open Cluster Management project */
import { LoadPluginData } from '../../../components/LoadPluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Clusters from './Clusters'

import './ClustersPlugin.css'

export default function ClustersPlugin() {
    return (
        <PluginContextProvider>
            <LoadPluginData>
                <Clusters />
            </LoadPluginData>
        </PluginContextProvider>
    )
}
