/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from "../../../components/PluginContextProvider"
import OverviewPage from './OverviewPage'

export default function OverviewPlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <OverviewPage />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider>
    )
}
