/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import { usePluginProxy } from '../../../lib/usePluginProxy'
import OverviewPage from './OverviewPage'

export default function OverviewPlugin() {
    
    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <OverviewPage />
            </LoadData>
        </RecoilRoot>
    )
}
