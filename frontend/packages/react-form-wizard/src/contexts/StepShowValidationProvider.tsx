import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'
import { useItem } from './ItemContext'

// Function to set if a step should show validation
const StepSetShowValidationContext = createContext<(id: string, has: boolean) => void>(() => null)
StepSetShowValidationContext.displayName = 'StepSetShowValidationContext'
export const useSetStepShowValidation = () => useContext(StepSetShowValidationContext)

// Record of step id to boolean indicating is a step should show validation
const StepShowValidationContext = createContext<Record<string, boolean>>({})
StepShowValidationContext.displayName = 'StepShowValidationContext'
export const useStepShowValidation = () => useContext(StepShowValidationContext)

export function StepShowValidationProvider(props: { children: ReactNode }) {
    const [hasStepInputs, setHasStepInputsState] = useState<Record<string, true>>({})
    const [setShowValidation, setShowValidationFunction] = useState<() => void>(() => () => null)

    // refreshStepInputs
    // - resets validation state to {}
    // - updates the setShowValidation function
    // - which causes the StepSetShowValidationContext to change
    // - which causes the useSetStepShowValidation to change
    // - which causes a useEffect to run in each step
    // - which call useSetStepShowValidation() with the step state
    const refreshStepShowValidation = useCallback(() => {
        setHasStepInputsState({})
        setShowValidationFunction(() => (id: string, has: boolean) => {
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
    // - call refreshStepShowValidation()
    const item = useItem()
    useLayoutEffect(() => {
        refreshStepShowValidation()
    }, [item, refreshStepShowValidation])

    return (
        <StepSetShowValidationContext.Provider value={setShowValidation}>
            <StepShowValidationContext.Provider value={hasStepInputs}>{props.children}</StepShowValidationContext.Provider>
        </StepSetShowValidationContext.Provider>
    )
}
