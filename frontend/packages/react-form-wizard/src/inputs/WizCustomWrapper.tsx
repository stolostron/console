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

type WizCustomWrapperBase = {
  hidden?: HiddenFn
  children: ReactNode
}

export type WizCustomWrapperInputProps = WizCustomWrapperBase & {
  /** Defaults to {@link InputReviewMeta.INPUT}. */
  type?: InputReviewMeta.INPUT
  /**
   * Path segment for review registration (same role as {@link InputCommonProps.path} on wizard inputs).
   * May not correspond to data on the current item when the value only lives in React state.
   */
  path: string
  id?: string
  label?: string
  value: ReactNode
  /** When true, the review row omits the edit pen — used for computed / read-only values. */
  nonEditable?: boolean
  /** When set, the review row renders as a PatternFly Alert instead of a description-list entry. */
  alertVariant?: 'info' | 'warning' | 'danger' | 'success'
  inputValueToPathValue?: (inputValue: unknown, pathValue: unknown) => unknown
}

export type WizCustomWrapperGroupProps = WizCustomWrapperBase & {
  type: InputReviewMeta.GROUP
  path: string
  id?: string
  label?: string
}

export type WizCustomWrapperProps = WizCustomWrapperInputProps | WizCustomWrapperGroupProps

export function WizCustomWrapper(props: WizCustomWrapperProps) {
  const isGroup = props.type === InputReviewMeta.GROUP
  const { path, id: idProp, label, children } = props
  const value = isGroup ? undefined : props.value
  const nonEditable = isGroup ? undefined : props.nonEditable
  const alertVariant = isGroup ? undefined : props.alertVariant
  const inputValueToPathValue = isGroup ? undefined : props.inputValueToPathValue

  const hidden = useInputHidden(props)
  const item = useContext(ItemContext)
  const currentStepId = useContext(CurrentStepIdContext)
  const stepInputsRegistry = useStepInputsRegistry()
  const reviewPathPrefixSegments = useContext(ReviewPathPrefixSegmentsContext)
  const bumpReviewDomTree = useBumpReviewDomTree()

  let registrationPath = buildReviewInputRegistrationPath(reviewPathPrefixSegments, path, item)
  if (!isGroup && inputValueToPathValue) {
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
    if (isGroup) {
      stepInputsRegistry.register(id, {
        id,
        path: registrationPath,
        label,
        error: undefined,
        type: InputReviewMeta.GROUP,
      })
    } else {
      stepInputsRegistry.register(id, {
        id,
        path: registrationPath,
        value,
        label,
        error: undefined,
        type: InputReviewMeta.INPUT,
        nonEditable,
        alertVariant,
      })
    }
    bumpReviewDomTree?.()
    return () => stepInputsRegistry.unregister(id)
  }, [
    stepInputsRegistry,
    currentStepId,
    hidden,
    id,
    registrationPath,
    value,
    label,
    nonEditable,
    alertVariant,
    bumpReviewDomTree,
    isGroup,
  ])

  return <div id={id}>{children}</div>
}
