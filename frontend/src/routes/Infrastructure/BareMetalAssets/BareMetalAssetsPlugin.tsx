/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import BareMetalAssets from './BareMetalAssets'

export default function BareMetalAssetsPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <BareMetalAssets />
            </PluginData>
        </RecoilRoot>
    )
}
