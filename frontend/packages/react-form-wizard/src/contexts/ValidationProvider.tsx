import { createContext, ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'

export enum EditorValidationStatus {
    success = 'success',
    pending = 'pending',
    failure = 'failure',
}

export const EditorValidationStatusContext = createContext<{
    editorValidationStatus: EditorValidationStatus
    setEditorValidationStatus: (status: EditorValidationStatus) => void
}>({
    editorValidationStatus: EditorValidationStatus.success,
    setEditorValidationStatus: () => void 0,
})
export const useEditorValidationStatus = () => useContext(EditorValidationStatusContext)

const SetHasValidationErrorContext = createContext<() => void>(() => null)
SetHasValidationErrorContext.displayName = 'SetHasValidationErrorContext'
export const useSetHasValidationError = () => useContext(SetHasValidationErrorContext)

export const HasValidationErrorContext = createContext(true)
HasValidationErrorContext.displayName = 'HasValidationErrorContext'
export const useHasValidationError = () => useContext(HasValidationErrorContext)

const ValidateContext = createContext<() => void>(() => null)
ValidateContext.displayName = 'ValidateContext'
export const useValidate = () => useContext(ValidateContext)

export function ValidationProvider(props: { children: ReactNode }) {
    const [editorValidationStatus, setEditorValidationStatus] = useState<EditorValidationStatus>(EditorValidationStatus.success)

    const [hasValidationError, setHasValidationErrorState] = useState(false)
    const [previousHasValidationError, setPreviousHasValidationError] = useState(false)
    const setHasValidationError = useCallback(() => {
        if (!hasValidationError) {
            setHasValidationErrorState(true)
        }
    }, [hasValidationError, setHasValidationErrorState])
    const validate = useCallback(() => {
        setHasValidationErrorState(false)
    }, [setHasValidationErrorState])

    const parentValidate = useContext(ValidateContext)
    if (hasValidationError !== previousHasValidationError) {
        setPreviousHasValidationError(hasValidationError)
        if (!hasValidationError) {
            parentValidate()
        }
    }

    // When this control goes away - parentValidate
    useLayoutEffect(
        () => () => {
            parentValidate()
        },
        [parentValidate]
    )

    const parentSetHasValidationError = useContext(SetHasValidationErrorContext)
    useLayoutEffect(() => {
        if (hasValidationError) parentSetHasValidationError?.()
    }, [parentSetHasValidationError, hasValidationError])

    return (
        <ValidateContext.Provider value={validate}>
            <EditorValidationStatusContext.Provider value={{ editorValidationStatus, setEditorValidationStatus }}>
                <SetHasValidationErrorContext.Provider value={setHasValidationError}>
                    <HasValidationErrorContext.Provider value={hasValidationError}>{props.children}</HasValidationErrorContext.Provider>
                </SetHasValidationErrorContext.Provider>
            </EditorValidationStatusContext.Provider>
        </ValidateContext.Provider>
    )
}
