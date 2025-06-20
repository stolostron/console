import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'

const SetHasValueContext = createContext<() => void>(() => null)
SetHasValueContext.displayName = 'SetHasValueContext'
export const useSetHasValue = () => useContext(SetHasValueContext)

export const HasValueContext = createContext(false)
HasValueContext.displayName = 'HasValueContext'
export const useHasValue = () => useContext(HasValueContext)

const UpdateHasValueContext = createContext<() => void>(() => null)
UpdateHasValueContext.displayName = 'UpdateHasValueContext'
export const useUpdateHasValue = () => useContext(UpdateHasValueContext)

export function HasValueProvider(props: { children: ReactNode }) {
    const [hasValue, setHasValueState] = useState(false)
    const [setHasValue, setHasValueFunction] = useState<() => void>(() => () => setHasValueState(true))
    const validate = useCallback(() => {
        setHasValueState(false)
        setHasValueFunction(() => () => setHasValueState(true))
    }, [])
    useLayoutEffect(() => {
        validate()
    }, [validate])

    const parentUpdateHasValue = useContext(UpdateHasValueContext)
    useLayoutEffect(() => {
        if (!hasValue) parentUpdateHasValue?.()
    }, [parentUpdateHasValue, hasValue])

    // When this control goes away - parentUpdateHasValue
    useLayoutEffect(
        () => () => {
            if (parentUpdateHasValue) parentUpdateHasValue()
        },
        [parentUpdateHasValue]
    )

    const parentSetHasValue = useContext(SetHasValueContext)
    useLayoutEffect(() => {
        if (hasValue) parentSetHasValue?.()
    }, [parentSetHasValue, hasValue])

    return (
        <UpdateHasValueContext.Provider value={validate}>
            <SetHasValueContext.Provider value={setHasValue}>
                <HasValueContext.Provider value={hasValue}>{props.children}</HasValueContext.Provider>
            </SetHasValueContext.Provider>
        </UpdateHasValueContext.Provider>
    )
}
