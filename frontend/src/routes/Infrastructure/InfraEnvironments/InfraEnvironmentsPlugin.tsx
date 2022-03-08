/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import { PluginContextProvider } from '../../../components/PluginContextProvider'
import InfraEnvironments from './InfraEnvironments'

export default function InfraEnvironmentsPlugin() {
    return (
        <PluginContextProvider>
            <RecoilRoot>
                <PluginData>
                    <InfraEnvironments />
                </PluginData>
            </RecoilRoot>
        </PluginContextProvider>
    )
}
