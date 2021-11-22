/* Copyright Contributors to the Open Cluster Management project */
import { RecoilRoot } from 'recoil'
import { PluginData } from '../../../components/PluginData'
import Search from './Search'

export default function SearchPlugin() {
    return (
        <RecoilRoot>
            <PluginData>
                <Search />
            </PluginData>
        </RecoilRoot>
    )
}
