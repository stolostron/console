/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import CredentialsFormPage from './CredentialsForm'

export default function CredentialsFormPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <CredentialsFormPage />
            </LoadData>
        </RecoilRoot>
    )
}
