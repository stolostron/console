/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../components/PluginData'
import { PluginContextProvider } from "../../components/PluginContextProvider"
import Governance from './Governance'

export default function GovernancePlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <Governance />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider>
    )
}
