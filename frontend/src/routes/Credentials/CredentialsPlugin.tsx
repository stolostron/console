/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../atoms'
import { usePluginProxy } from '../../lib/usePluginProxy'
import Credentials from './Credentials'

export default function CredentialsPlugin() {

    usePluginProxy()

    return (
        <RecoilRoot>
            <LoadData>
                <Credentials />
            </LoadData>
        </RecoilRoot>
    )
}
