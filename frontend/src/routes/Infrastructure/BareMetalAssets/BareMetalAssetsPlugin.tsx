/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import BareMetalAssets from './BareMetalAssets'

export default function ClustersPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <BareMetalAssets />
            </LoadData>
        </RecoilRoot>
    )
}
