/* Copyright Contributors to the Open Cluster Management project */
import get from 'get-value'
import { ReactNode, useCallback, useContext, useLayoutEffect, useState } from 'react'
import set from 'set-value'
import { EditMode } from '../contexts/EditMode'
import { useData } from '../contexts/DataContext'
import { useDisplayMode } from '../contexts/DisplayModeContext'
import { useEditMode } from '../contexts/EditModeContext'
import { useHasInputs, useSetHasInputs, useUpdateHasInputs } from '../contexts/HasInputsProvider'
import { useHasValue, useSetHasValue } from '../contexts/HasValueProvider'
import {
  CurrentStepIdContext,
  InputReviewMeta,
  ReviewPathPrefixSegmentsContext,
  useStepInputsRegistry,
} from '../review/ReviewStepContexts'
import { ItemContext } from '../contexts/ItemContext'
import { useShowValidation } from '../contexts/ShowValidationProvider'
import { useBumpReviewDomTree } from '../review/ReviewStepContexts'
import { useStringContext } from '../contexts/StringContext'
import { useHasValidationError, useSetHasValidationError, useValidate } from '../contexts/ValidationProvider'

export type HiddenFn = (item: any) => boolean

export type InputCommonProps<ValueT = any> = {
  id?: string

  /* JSON dot notation path to the input value in the active item context */
  path: string
  hidden?: (item: any) => boolean
  validation?: (value: ValueT, item?: unknown) => string | undefined
  required?: boolean
  readonly?: boolean
  disabled?: boolean
  label?: string
  labelHelp?: ReactNode
  labelHelpTitle?: string
  helperText?: ReactNode
  prompt?: { label?: string; href?: string; isDisabled?: boolean }
  disabledInEditMode?: boolean
  /** When true, this input is omitted from the review step navigation / registry. */
  hideFromReviewStep?: boolean

  inputValueToPathValue?: (inputValue: unknown, pathValue: unknown) => unknown
  pathValueToInputValue?: (pathValue: unknown) => unknown
  onValueChange?: (value: unknown, item?: any) => void
}

export function convertId(props: { id?: string; path: string }) {
  if (props.id) return props.id
  return props.path?.toLowerCase().split('.').join('-') ?? ''
}

export function useValue(
  props: Pick<
    InputCommonProps,
    'id' | 'path' | 'label' | 'inputValueToPathValue' | 'pathValueToInputValue' | 'onValueChange'
  >,
  defaultValue: any
): [value: any, setValue: (value: any) => void] {
  const { onValueChange, path } = props
  const item = useContext(ItemContext)
  const { update } = useData()
  const pathValue = get(item, path) ?? defaultValue
  const setValue = useCallback(
    (newValue: any) => {
      if (props.inputValueToPathValue) {
        newValue = props.inputValueToPathValue(newValue, pathValue)
      }
      set(item, path, newValue, { preservePaths: false })
      onValueChange?.(newValue, item)
      update()
    },
    [item, onValueChange, path, pathValue, props, update]
  )
  let value = pathValue
  if (props.pathValueToInputValue) {
    value = props.pathValueToInputValue(pathValue)
  }
  return [value, setValue]
}

export function useInputValidation(props: Pick<InputCommonProps, 'id' | 'path' | 'label' | 'required' | 'validation'>) {
  const [value] = useValue(props, '')
  const showValidation = useShowValidation()
  const item = useContext(ItemContext)
  const { required } = useStringContext()
  let error: string | undefined = undefined
  let validated: 'error' | undefined = undefined
  if (props.required && (!value || (Array.isArray(value) && value.length === 0))) {
    error = required
  } else if (props.validation) {
    error = props.validation(value, item)
  }
  if (showValidation) {
    validated = error ? 'error' : undefined
  }
  return { validated, error }
}

export function useInputHidden(props: { hidden?: (item: any) => boolean }) {
  const item = useContext(ItemContext)
  return props.hidden ? props.hidden(item) : false
}

export function useInput(props: InputCommonProps, options?: { isArrayInput?: boolean }) {
  const { isArrayInput } = options ?? {}
  const bumpReviewDomTree = useBumpReviewDomTree()
  const editMode = useEditMode()
  const displayMode = useDisplayMode()
  const [value, setValue] = useValue(props, '')
  const hidden = useInputHidden(props)

  const setHasInputs = useSetHasInputs()
  const hasInputs = useHasInputs()
  const updateHasInputs = useUpdateHasInputs()

  // Update hasInputs in useLayoutEffect to avoid updating state during render
  useLayoutEffect(() => {
    if (!hidden && !hasInputs) {
      setHasInputs()
    }
  }, [hidden, hasInputs, setHasInputs])

  const { validated, error } = useInputValidation(props)
  const hasValidationError = useHasValidationError()
  const setHasValidationError = useSetHasValidationError()

  // Update hasValidationError in useLayoutEffect to avoid updating state during render
  useLayoutEffect(() => {
    if (!hidden && error && !hasValidationError) {
      setHasValidationError()
    }
  }, [hidden, error, hasValidationError, setHasValidationError])

  // if value changes we need to validate in the case of a checkbox which hides child inputs
  // if hidden changes we need to validate in the case of a inputs which hides child inputs
  // if error changes we need to validate to set the error or clear errors if there is no other inputs with errors
  const [previousValue, setPreviousValue] = useState(value)
  const [previousHidden, setPreviousHidden] = useState(hidden)
  const [previousError, setPreviousError] = useState(error)
  const validate = useValidate()

  if (value !== previousValue || hidden !== previousHidden || error !== previousError) {
    setPreviousValue(value)
    setPreviousHidden(hidden)
    setPreviousError(error)
    if (hidden && !previousHidden) {
      updateHasInputs()
    }
    validate()
  }

  const item = useContext(ItemContext)
  const currentStepId = useContext(CurrentStepIdContext)
  const stepInputsRegistry = useStepInputsRegistry()
  const reviewPathPrefixSegments = useContext(ReviewPathPrefixSegmentsContext)
  let registrationPath = buildReviewInputRegistrationPath(
    isArrayInput ? [] : reviewPathPrefixSegments,
    props.path,
    item
  )
  if (props.inputValueToPathValue) {
    const transformed = props.inputValueToPathValue(true, false)
    registrationPath = `${registrationPath}#${JSON.stringify(transformed)}`
  }

  if (props.id) {
    registrationPath = `${registrationPath};id=${props.id}`
  }

  const id = process.env.NODE_ENV === 'test' || (window as any).Cypress ? convertId(props) : registrationPath

  useLayoutEffect(() => {
    if (!stepInputsRegistry || currentStepId === undefined || hidden || props.hideFromReviewStep) return
    stepInputsRegistry.register(id, {
      id,
      path: registrationPath,
      value,
      label: props.label,
      error: error ?? undefined,
      type: isArrayInput ? InputReviewMeta.ARRAY_INPUT : InputReviewMeta.INPUT,
    })
    bumpReviewDomTree?.()
    return () => stepInputsRegistry.unregister(id)
  }, [
    stepInputsRegistry,
    currentStepId,
    hidden,
    props.hideFromReviewStep,
    id,
    registrationPath,
    value,
    props.label,
    error,
    isArrayInput,
    bumpReviewDomTree,
  ])

  const hasValue = useHasValue()
  const setHasValue = useSetHasValue()
  // anything other than empty array counts as having a value
  if (!hasValue && value && (!Array.isArray(value) || value.length > 0)) {
    setHasValue()
  }

  let disabled = props.disabled
  if (editMode === EditMode.Edit) {
    if (props.disabledInEditMode) {
      disabled = props.disabledInEditMode
    }
  }

  return {
    ...props,
    id,
    displayMode,
    value,
    setValue,
    validated,
    error,
    hidden,
    disabled,
  }
}

function lowercaseFirst(label: string) {
  if (label) {
    label = label[0].toLowerCase() + label.substring(1)
  }
  return label
}

export function getEnterPlaceholder(props: { label?: string; placeholder?: string }) {
  return props.placeholder ?? (props.label && props.label.length ? `Enter the ${lowercaseFirst(props.label)}` : '')
}

export function getSelectPlaceholder(props: { label: string; placeholder?: string }) {
  return props.placeholder ?? `Select the ${lowercaseFirst(props.label)}`
}

export function getCollapsedPlaceholder(props: { collapsedPlaceholder?: ReactNode }) {
  return props.collapsedPlaceholder ?? 'Expand to edit'
}

export function getAddPlaceholder(props: { placeholder?: string }) {
  return props.placeholder ?? 'Add'
}

/** Full dot-path for review registration: `prefixSegments` (array field + index segments) + `path`, with resource `kind` prepended when `item` has one. */
export function buildReviewInputRegistrationPath(
  prefixSegments: readonly string[],
  path: string,
  item?: unknown
): string {
  const base = prefixSegments.length > 0 ? [...prefixSegments, path].join('.') : path
  return prependItemKindToRegistrationPath(item, base)
}

/** When the active item looks like a resource (has `kind`), prefix the review path so it stays unique across kinds. */
export function prependItemKindToRegistrationPath(item: unknown, path: string): string {
  if (item && typeof item === 'object' && 'kind' in item) {
    const kind = (item as { kind: unknown }).kind
    if (kind != null && String(kind) !== '') {
      return `${String(kind)}.${path}`
    }
  }
  return path
}
