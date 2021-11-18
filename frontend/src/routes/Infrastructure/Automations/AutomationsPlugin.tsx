/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import { usePluginProxy } from '../../../lib/usePluginProxy'
import Automations from './Automations'

export default function AutomationsPlugin() {
    
    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <Automations />
            </LoadData>
        </RecoilRoot>
    )
}
