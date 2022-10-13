/* Copyright Contributors to the Open Cluster Management project */
import { Dispatch, ProviderProps, createContext, useState, SetStateAction, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as atoms from '../atoms'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as recoil from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as selectors from '../selectors'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import { LoadData } from '../atoms'

const { RecoilRoot } = recoil

export type PluginData = {
    recoil: typeof recoil
    atoms: typeof atoms
    selectors: typeof selectors
    loaded: boolean
    startLoading: boolean
    setLoaded: Dispatch<SetStateAction<boolean>>
    load: () => void
}

const defaultContext = {
    recoil,
    atoms,
    selectors,
    loaded: false,
    startLoading: false,
    setLoaded: () => {},
    load: () => {},
}

export const PluginDataContext = createContext<PluginData>(defaultContext)

export const usePluginDataContextValue = () => {
    const [loaded, setLoaded] = useState(false)
    const [startLoading, setStartLoading] = useState(false)

    const contextValue = useMemo(
        () => ({
            recoil,
            atoms,
            selectors,
            loaded,
            startLoading,
            setLoaded,
            load: () => setStartLoading(true),
        }),
        [loaded, setLoaded, startLoading]
    )
    return contextValue
}

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
    return (
        <PluginDataContext.Provider value={props.value}>
            <RecoilRoot>{props.value.startLoading ? <LoadData>{props.children}</LoadData> : props.children}</RecoilRoot>
        </PluginDataContext.Provider>
    )
}
