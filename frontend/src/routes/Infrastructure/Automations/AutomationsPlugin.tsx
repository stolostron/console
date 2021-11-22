/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import Automations from './Automations'

export default function AutomationsPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <Automations />
            </PluginData>
        </RecoilRoot>
    )
}
