/* Copyright Contributors to the Open Cluster Management project */
import { Form } from '@patternfly/react-core'
import { Fragment, ReactNode, useLayoutEffect, useRef } from 'react'
import { DisplayMode, useDisplayMode } from './contexts/DisplayModeContext'
import { useReviewDomTreeVersion } from './review/ReviewStepContexts'
import { HasInputsProvider, useHasInputs } from './contexts/HasInputsProvider'
import { ShowValidationProvider, useSetShowValidation } from './contexts/ShowValidationProvider'
import { useSetStepHasInputs } from './contexts/StepHasInputsProvider'
import { useStepShowValidation } from './contexts/StepShowValidationProvider'
import { useSetStepHasValidationError } from './contexts/StepValidationProvider'
import { useHasValidationError, ValidationProvider } from './contexts/ValidationProvider'
import { CurrentStepIdContext, useStepInputsRegistry, useStepRegister } from './review/ReviewStepContexts'
import { HiddenFn, useInputHidden } from './inputs/Input'
import { buildTree } from './review/utils'

export interface StepProps {
  label: string
  children?: ReactNode
  id: string
  hidden?: HiddenFn
  autohide?: boolean
}

export function Step(props: StepProps) {
  const { id, label } = props
  const containerRef = useRef<HTMLDivElement>(null)
  const stepInputsRegistry = useStepInputsRegistry()
  const stepRegister = useStepRegister()
  const reviewDomTreeVersion = useReviewDomTreeVersion()

  /* Context value includes `version` and changes identity on every bump; do not list it in effect
   * deps or unregister/register + setStepTree retrigger in a loop (maximum update depth). */
  const stepRegisterRef = useRef(stepRegister)
  stepRegisterRef.current = stepRegister
  const stepInputsRegistryRef = useRef(stepInputsRegistry)
  stepInputsRegistryRef.current = stepInputsRegistry

  /* Step identity only: register/unregister when id or label changes. Kept separate from the
   * tree-sync effect so reviewDomTreeVersion bumps do not run cleanup (unregister would drop the
   * step from the register map between runs and cause extra version churn). */
  useLayoutEffect(() => {
    const sr = stepRegisterRef.current
    if (!sr) return
    sr.register(id, label)
    return () => sr.unregister(id)
  }, [id, label])

  /* Rebuild the review DOM tree from the live container + input registry. Depends on
   * reviewDomTreeVersion so hidden inputs and layout changes can refresh the tree without
   * re-running registration. */
  useLayoutEffect(() => {
    if (id === 'review') return
    const sr = stepRegisterRef.current
    const reg = stepInputsRegistryRef.current
    if (!sr || !reg) return
    const el = containerRef.current
    const map = reg.get().current
    const tree = el ? buildTree(el, map, { stepId: id, label }) : {}
    sr.setStepTree(id, tree)
  }, [id, label, reviewDomTreeVersion])

  return (
    <div id={id} ref={containerRef}>
      <CurrentStepIdContext.Provider value={id}>
        <HasInputsProvider key={id}>
          <ShowValidationProvider>
            <ValidationProvider>
              <StepInternal {...props}>{props.children}</StepInternal>
            </ValidationProvider>
          </ShowValidationProvider>
        </HasInputsProvider>
      </CurrentStepIdContext.Provider>
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
