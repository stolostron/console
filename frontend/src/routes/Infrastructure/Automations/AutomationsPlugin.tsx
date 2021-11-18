/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import Automations from './Automations'

export default function AutomationsPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <Automations />
            </LoadData>
        </RecoilRoot>
    )
}
