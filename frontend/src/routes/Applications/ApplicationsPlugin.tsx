/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../components/PluginData'
import Applications from './Applications'

export default function ApplicationsPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <Applications />
            </PluginData>
        </RecoilRoot>
    )
}
