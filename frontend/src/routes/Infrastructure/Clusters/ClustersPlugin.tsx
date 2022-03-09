/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import Clusters from './Clusters'

export default function ClustersPlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <Clusters />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider>
    )
}
