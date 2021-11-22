/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import Governance from './Governance'

export default function GovernancePlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <Governance />
            </LoadData>
        </RecoilRoot>
    )
}
