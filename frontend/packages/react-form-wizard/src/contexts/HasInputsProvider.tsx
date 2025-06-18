import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'

const SetHasInputsContext = createContext<() => void>(() => null)
SetHasInputsContext.displayName = 'SetHasInputsContext'
export const useSetHasInputs = () => useContext(SetHasInputsContext)

export const HasInputsContext = createContext(false)
HasInputsContext.displayName = 'HasInputsContext'
export const useHasInputs = () => useContext(HasInputsContext)

const UpdateHasInputsContext = createContext<() => void>(() => null)
UpdateHasInputsContext.displayName = 'UpdateHasInputsContext'
export const useUpdateHasInputs = () => useContext(UpdateHasInputsContext)

export function HasInputsProvider(props: { children: ReactNode }) {
    const parentHasInputs = useContext(HasInputsContext)
    const parentSetHasInputs = useContext(SetHasInputsContext)
    const parentUpdateHasInputs = useContext(UpdateHasInputsContext)

    const [hasInputs, setHasInputsState] = useState(false)

    const setHasInputs = useCallback(() => {
        setHasInputsState(true)
    }, [setHasInputsState])

    if (hasInputs && !parentHasInputs) {
        parentSetHasInputs()
    }

    const updateHasInputs = useCallback(() => {
        setHasInputsState(false)
        parentUpdateHasInputs()
    }, [setHasInputsState, parentUpdateHasInputs])

    // When this control goes away - parentUpdateHasInputs
    useLayoutEffect(
        () => () => {
            parentUpdateHasInputs()
        },
        [parentUpdateHasInputs]
    )

    return (
        <UpdateHasInputsContext.Provider value={updateHasInputs}>
            <SetHasInputsContext.Provider value={setHasInputs}>
                <HasInputsContext.Provider value={hasInputs}>{props.children}</HasInputsContext.Provider>
            </SetHasInputsContext.Provider>
        </UpdateHasInputsContext.Provider>
    )
}
