/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../components/PluginData'
import { PluginContextProvider } from '../../components/PluginContextProvider'
import Credentials from './Credentials'

export default function CredentialsPlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <Credentials />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider>
    )
}
