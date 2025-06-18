import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'
import { useItem } from './ItemContext'

const StepSetHasInputsContext = createContext<(id: string, has: boolean) => void>(() => null)
StepSetHasInputsContext.displayName = 'StepSetHasInputsContext'
export const useSetStepHasInputs = () => useContext(StepSetHasInputsContext)

const StepHasInputsContext = createContext<Record<string, boolean>>({})
StepHasInputsContext.displayName = 'StepHasInputsContext'
export const useStepHasInputs = () => useContext(StepHasInputsContext)

export function StepHasInputsProvider(props: { children: ReactNode }) {
    const [hasStepInputs, setHasStepInputsState] = useState<Record<string, true>>({})
    const [setHasInputs, setHasInputsFunction] = useState<() => void>(() => () => null)

    // refreshStepInputs
    // - resets validation state to {}
    // - updates the setHasInputs function
    // - which causes the StepSetHasInputsContext to change
    // - which causes the useSetStepHasInputs to change
    // - which causes a useEffect to run in each step
    // - which call useSetStepHasInputs() with the step state
    const refreshStepInputs = useCallback(() => {
        setHasStepInputsState({})
        setHasInputsFunction(() => (id: string, has: boolean) => {
            setHasStepInputsState((state) => {
                if (has && state[id] !== true) {
                    state = { ...state }
                    state[id] = true
                } else if (!has && state[id] !== undefined) {
                    state = { ...state }
                    delete state[id]
                }
                return state
            })
        })
    }, [])

    // When item changes
    // - call refreshStepInputs()
    const item = useItem()
    useLayoutEffect(() => {
        refreshStepInputs()
    }, [item, refreshStepInputs])

    return (
        <StepSetHasInputsContext.Provider value={setHasInputs}>
            <StepHasInputsContext.Provider value={hasStepInputs}>{props.children}</StepHasInputsContext.Provider>
        </StepSetHasInputsContext.Provider>
    )
}
