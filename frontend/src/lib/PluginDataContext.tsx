/* Copyright Contributors to the Open Cluster Management project */
import { createContext, ProviderProps } from 'react'
import * as recoil from 'recoil'
import * as atoms from '../atoms'
// import { LoadDataUpdateContext } from './load-context-data'

const { RecoilRoot } = recoil

export type PluginData = {
    recoil: typeof recoil
    atoms: typeof atoms
    loaded: boolean
}

let loaded = false

const defaultContext = { recoil, atoms, loaded }

export const PluginDataContext = createContext<PluginData>(defaultContext)

export const usePluginDataContextValue = () => {
    // const [snapshot, setSnapshot] = useState<Snapshot | undefined>()
    // const [release, setRelease] = useState<() => void>()
    // //const getSnapshot = () => snapshot
    // // const setSnapshotOnce = useCallback((s: string) => {
    // //     if (!snapshot) {
    // //         setSnapshot(s)
    // //     }
    // // }, [snapshot, setSnapshot])
    // const nextSnapshot = useCallback((s: Snapshot) => {
    //     //debugger
    //     if (release) release()
    //     setRelease(s.retain())
    //     setSnapshot(s)
    // }, [release])
    return defaultContext
}

export const PluginDataContextProvider = (props: ProviderProps<PluginData>) => {
    return (
        <PluginDataContext.Provider value={props.value}>
            <RecoilRoot>{props.children}</RecoilRoot>
        </PluginDataContext.Provider>
    )
}
