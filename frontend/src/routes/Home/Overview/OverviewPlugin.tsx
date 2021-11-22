/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import OverviewPage from './OverviewPage'

export default function OverviewPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <OverviewPage />
            </PluginData>
        </RecoilRoot>
    )
}
