/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import Clusters from './Clusters'

export default function ClustersPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <Clusters />
            </LoadData>
        </RecoilRoot>
    )
}
