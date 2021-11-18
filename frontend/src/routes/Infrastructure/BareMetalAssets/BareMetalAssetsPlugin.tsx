/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import { usePluginProxy } from '../../../lib/usePluginProxy'
import BareMetalAssets from './BareMetalAssets'

export default function BareMetalAssetsPlugin() {
    
    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <BareMetalAssets />
            </LoadData>
        </RecoilRoot>
    )
}
