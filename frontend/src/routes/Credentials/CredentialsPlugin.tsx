/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import Credentials from './Credentials'

export default function CredentialsPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <Credentials />
            </LoadData>
        </RecoilRoot>
    )
}
