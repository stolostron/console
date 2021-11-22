/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../components/PluginData'
import Governance from './Governance'

export default function GovernancePlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <Governance />
            </PluginData>
        </RecoilRoot>
    )
}
