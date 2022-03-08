/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import BareMetalAssets from './BareMetalAssets'

export default function BareMetalAssetsPlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <BareMetalAssets />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider>
    )
}
