import { Form } from '@patternfly/react-core'
import { Fragment, ReactNode, useLayoutEffect } from 'react'
import { DisplayMode, useDisplayMode } from './contexts/DisplayModeContext'
import { HasInputsProvider, useHasInputs } from './contexts/HasInputsProvider'
import { ShowValidationProvider, useSetShowValidation } from './contexts/ShowValidationProvider'
import { useSetStepHasInputs } from './contexts/StepHasInputsProvider'
import { useStepShowValidation } from './contexts/StepShowValidationProvider'
import { useSetStepHasValidationError } from './contexts/StepValidationProvider'
import { useHasValidationError, ValidationProvider } from './contexts/ValidationProvider'
import { HiddenFn, useInputHidden } from './inputs/Input'

export interface StepProps {
    label: string
    children?: ReactNode
    id: string
    hidden?: HiddenFn
    autohide?: boolean
}

export function Step(props: StepProps) {
    return (
        <div id={props.id}>
            <HasInputsProvider key={props.id}>
                <ShowValidationProvider>
                    <ValidationProvider>
                        <StepInternal {...props}>{props.children}</StepInternal>
                    </ValidationProvider>
                </ShowValidationProvider>
            </HasInputsProvider>
        </div>
    )
}

export function StepInternal(props: StepProps) {
    const displayMode = useDisplayMode()

    const setShowValidation = useSetShowValidation()
    const stepShowValidation = useStepShowValidation()
    useLayoutEffect(() => {
        if (displayMode !== DisplayMode.Details) {
            if (stepShowValidation[props.id]) {
                setShowValidation(true)
            }
        }
    }, [displayMode, props.id, setShowValidation, stepShowValidation])

    const hasValidationError = useHasValidationError()
    const setStepHasValidationError = useSetStepHasValidationError()
    useLayoutEffect(() => {
        if (displayMode !== DisplayMode.Details) setStepHasValidationError(props.id, hasValidationError)
    }, [hasValidationError, displayMode, props.id, setStepHasValidationError])

    const hasInputs = useHasInputs()
    const setStepHasInputs = useSetStepHasInputs()
    useLayoutEffect(() => {
        if (displayMode !== DisplayMode.Details) {
            setStepHasInputs(props.id, hasInputs)
        }
    }, [hasInputs, displayMode, props.id, setStepHasInputs])

    const hidden = useInputHidden(props)
    if (hidden && props.autohide !== false) return <Fragment />

    if (displayMode === DisplayMode.Details) {
        // Don't use forms in steps which are forms
        return <Fragment>{props.children}</Fragment>
    }
    return (
        <Form
            onSubmit={(event) => {
                event.preventDefault()
            }}
        >
            {props.children}
        </Form>
    )
}
