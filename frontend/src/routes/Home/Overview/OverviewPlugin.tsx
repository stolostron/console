/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import OverviewPage from './OverviewPage'

export default function OverviewPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <OverviewPage />
            </LoadData>
        </RecoilRoot>
    )
}
