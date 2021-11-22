/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { LoadData } from '../../../atoms'
import Search from './Search'

export default function SearchPlugin() {
    return (
        <RecoilRoot>
            <LoadData>
                <Search />
            </LoadData>
        </RecoilRoot>
    )
}
