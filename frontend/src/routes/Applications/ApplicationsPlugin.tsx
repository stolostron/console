/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import { usePluginProxy } from '../../lib/usePluginProxy'
import Applications from './Applications'

export default function ApplicationsPlugin() {

    usePluginProxy()
    
    return (
        <RecoilRoot>
            <LoadData>
                <Applications />
            </LoadData>
        </RecoilRoot>
    )
}
