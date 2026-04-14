/* Copyright Contributors to the Open Cluster Management project */
import { ReactNode, useContext, useLayoutEffect } from 'react'
import { ItemContext } from '../contexts/ItemContext'
import {
  CurrentStepIdContext,
  InputReviewMeta,
  ReviewPathPrefixSegmentsContext,
  useBumpReviewDomTree,
  useStepInputsRegistry,
} from '../review/ReviewStepContexts'
import { buildReviewInputRegistrationPath, convertId, HiddenFn, useInputHidden } from './Input'

export type WizCustomInputWrapperProps = {
  /**
   * Path segment for review registration (same role as {@link InputCommonProps.path} on wizard inputs).
   * May not correspond to data on the current item when the value only lives in React state.
   */
  path: string
  id?: string
  label?: string
  value: ReactNode
  hidden?: HiddenFn
  inputValueToPathValue?: (inputValue: unknown, pathValue: unknown) => unknown
  children: ReactNode
}

export function WizCustomInputWrapper(props: WizCustomInputWrapperProps) {
  const { path, id: idProp, label, value, inputValueToPathValue, children } = props
  const hidden = useInputHidden(props)
  const item = useContext(ItemContext)
  const currentStepId = useContext(CurrentStepIdContext)
  const stepInputsRegistry = useStepInputsRegistry()
  const reviewPathPrefixSegments = useContext(ReviewPathPrefixSegmentsContext)
  const bumpReviewDomTree = useBumpReviewDomTree()

  let registrationPath = buildReviewInputRegistrationPath(reviewPathPrefixSegments, path, item)
  if (inputValueToPathValue) {
    const transformed = inputValueToPathValue(true, false)
    registrationPath = `${registrationPath}#${JSON.stringify(transformed)}`
  }

  if (idProp) {
    registrationPath = `${registrationPath};id=${idProp}`
  }

  const id =
    process.env.NODE_ENV === 'test' || (window as any).Cypress ? convertId({ id: idProp, path }) : registrationPath

  useLayoutEffect(() => {
    if (!stepInputsRegistry || currentStepId === undefined || hidden) return
    stepInputsRegistry.register(id, {
      id,
      path: registrationPath,
      value,
      label,
      error: undefined,
      type: InputReviewMeta.INPUT,
    })
    bumpReviewDomTree?.()
    return () => stepInputsRegistry.unregister(id)
  }, [stepInputsRegistry, currentStepId, hidden, id, registrationPath, value, label, bumpReviewDomTree])

  return <div id={id}>{children}</div>
}
