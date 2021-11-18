/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import { usePluginProxy } from '../../../lib/usePluginProxy'
import InfraEnvironments from './InfraEnvironments'

export default function InfraEnvironmentsPlugin() {
    
    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <InfraEnvironments />
            </LoadData>
        </RecoilRoot>
    )
}
