/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import InfraEnvironmentsPage from './InfraEnvironmentsPage'

export default function InfraEnvironmentsPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <InfraEnvironmentsPage />
            </LoadData>
        </RecoilRoot>
    )
}
