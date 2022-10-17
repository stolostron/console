/* Copyright Contributors to the Open Cluster Management project */
import { ProviderProps } from 'react'
import { LoadData } from './LoadData'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { RecoilRoot } from 'recoil'
import { PluginData, PluginDataContext } from '../lib/PluginDataContext'

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
    return (
        <PluginDataContext.Provider value={props.value}>
            <RecoilRoot>{props.value.startLoading ? <LoadData>{props.children}</LoadData> : props.children}</RecoilRoot>
        </PluginDataContext.Provider>
    )
}
