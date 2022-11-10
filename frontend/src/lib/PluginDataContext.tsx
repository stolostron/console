/* Copyright Contributors to the Open Cluster Management project */
import { Dispatch, createContext, useState, SetStateAction, useMemo } from 'react'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as atoms from '../atoms'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as recoil from 'recoil'
// eslint-disable-next-line @typescript-eslint/no-restricted-imports
import * as selectors from '../selectors'

export type PluginData = {
    recoil: typeof recoil
    atoms: typeof atoms
    selectors: typeof selectors
    loaded: boolean
    startLoading: boolean
    setLoaded: Dispatch<SetStateAction<boolean>>
    load: () => void
}

export const defaultContext = {
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

usePluginDataContextValue.context = PluginDataContext
