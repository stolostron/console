import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'
import { useItem } from './ItemContext'

const StepSetHasValidationErrorContext = createContext<(id: string, hasError: boolean) => void>(() => null)
StepSetHasValidationErrorContext.displayName = 'StepSetHasValidationErrorContext'
export const useSetStepHasValidationError = () => useContext(StepSetHasValidationErrorContext)

export const StepHasValidationErrorContext = createContext<Record<string, boolean>>({})
StepHasValidationErrorContext.displayName = 'StepHasValidationErrorContext'
export const useStepHasValidationError = () => useContext(StepHasValidationErrorContext)

export function StepValidationProvider(props: { children: ReactNode }) {
    const item = useItem()
    const [hasStepValidationErrors, setHasStepValidationErrorsState] = useState<Record<string, true>>({})
    const [setHasValidationErrors, setHasValidationErrorsFunction] = useState<() => void>(() => () => null)
    const validateSteps = useCallback(() => {
        setHasStepValidationErrorsState({})
        setHasValidationErrorsFunction(() => (id: string, hasError: boolean) => {
            setHasStepValidationErrorsState((state) => {
                if (hasError && state[id] !== true) {
                    state = { ...state }
                    state[id] = true
                } else if (!hasError && state[id] !== undefined) {
                    state = { ...state }
                    delete state[id]
                }
                return state
            })
        })
    }, [])
    useLayoutEffect(() => {
        validateSteps()
    }, [item, validateSteps])
    return (
        <StepSetHasValidationErrorContext.Provider value={setHasValidationErrors}>
            <StepHasValidationErrorContext.Provider value={hasStepValidationErrors}>
                {props.children}
            </StepHasValidationErrorContext.Provider>
        </StepSetHasValidationErrorContext.Provider>
    )
}
