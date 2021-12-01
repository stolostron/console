/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../components/PluginData'
import Credentials from './Credentials'

export default function CredentialsPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <Credentials />
            </PluginData>
        </RecoilRoot>
    )
}
