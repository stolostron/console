/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import Applications from './Applications'

export default function ApplicationsPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <Applications />
            </LoadData>
        </RecoilRoot>
    )
}
