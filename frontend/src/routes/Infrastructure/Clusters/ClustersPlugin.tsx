/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import { usePluginProxy } from '../../../lib/usePluginProxy'
import Clusters from './Clusters'

export default function ClustersPlugin() {
    
    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <Clusters />
            </LoadData>
        </RecoilRoot>
    )
}
