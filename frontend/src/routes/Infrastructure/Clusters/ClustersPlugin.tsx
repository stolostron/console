/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import Clusters from './Clusters'

export default function ClustersPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <Clusters />
            </PluginData>
        </RecoilRoot>
    )
}
