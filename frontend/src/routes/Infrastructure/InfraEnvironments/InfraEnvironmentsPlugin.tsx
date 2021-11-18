/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import InfraEnvironments from './InfraEnvironments'

export default function InfraEnvironmentsPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <InfraEnvironments />
            </LoadData>
        </RecoilRoot>
    )
}
