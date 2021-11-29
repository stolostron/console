/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import InfraEnvironments from './InfraEnvironments'

export default function InfraEnvironmentsPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <InfraEnvironments />
            </PluginData>
        </RecoilRoot>
    )
}
