/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../components/PluginData'
import { PluginContextProvider } from "../../components/PluginContextProvider"
import Applications from './Applications'

export default function ApplicationsPlugin() {
    return (
        <RecoilRoot>
            <PluginContextProvider>
                <PluginData>
                    <Applications />
                </PluginData>
            </PluginContextProvider>
        </RecoilRoot>
    )
}
