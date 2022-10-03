/* Copyright Contributors to the Open Cluster Management project */
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as atoms from '../atoms'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as recoil from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as selectors from '../selectors'

import { ProviderProps, createContext } from 'react'

// import { LoadDataUpdateContext } from './load-context-data'

const { RecoilRoot } = recoil

export type PluginData = {
    recoil: typeof recoil
    atoms: typeof atoms
    selectors: typeof selectors
    loaded: boolean
}

const defaultContext = { recoil, atoms, selectors, loaded: false }

export const PluginDataContext = createContext<PluginData>(defaultContext)

export const usePluginDataContextValue = () => {
    return defaultContext
}

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
    return (
        <PluginDataContext.Provider value={props.value}>
            <RecoilRoot>{props.children}</RecoilRoot>
        </PluginDataContext.Provider>
    )
}
