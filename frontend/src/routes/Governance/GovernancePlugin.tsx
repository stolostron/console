/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import { usePluginProxy } from '../../lib/usePluginProxy'
import Governance from './Governance'

export default function GovernancePlugin() {
    
    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <Governance />
            </LoadData>
        </RecoilRoot>
    )
}
