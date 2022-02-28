/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from "../../../components/PluginContextProvider"
import Automations from './Automations'

export default function AutomationsPlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <Automations />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider >
    )
}
