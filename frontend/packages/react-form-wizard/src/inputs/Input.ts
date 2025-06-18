import get from 'get-value'
import { ReactNode, useCallback, useContext, useState } from 'react'
import set from 'set-value'
import { EditMode } from '..'
import { useData } from '../contexts/DataContext'
import { useDisplayMode } from '../contexts/DisplayModeContext'
import { useEditMode } from '../contexts/EditModeContext'
import { useHasInputs, useSetHasInputs, useUpdateHasInputs } from '../contexts/HasInputsProvider'
import { useHasValue, useSetHasValue } from '../contexts/HasValueProvider'
import { ItemContext } from '../contexts/ItemContext'
import { useShowValidation } from '../contexts/ShowValidationProvider'
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

    inputValueToPathValue?: (inputValue: unknown, pathValue: unknown) => unknown
    pathValueToInputValue?: (pathValue: unknown) => unknown
    onValueChange?: (value: unknown, item?: any) => void
}

export function useID(props: { id?: string; path: string }) {
    if (props.id) return props.id
    return props.path?.toLowerCase().split('.').join('-') ?? ''
}

export function usePath(props: { path: string }) {
    return props.path
}

export function useValue(
    props: Pick<InputCommonProps, 'id' | 'path' | 'label' | 'inputValueToPathValue' | 'pathValueToInputValue' | 'onValueChange'>,
    defaultValue: any
): [value: any, setValue: (value: any) => void] {
    const { onValueChange } = props
    const item = useContext(ItemContext)
    const { update } = useData()
    const path = usePath(props)
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

export function useInput(props: InputCommonProps) {
    const editMode = useEditMode()
    const displayMode = useDisplayMode()
    const [value, setValue] = useValue(props, '')
    const hidden = useInputHidden(props)

    const setHasInputs = useSetHasInputs()
    const hasInputs = useHasInputs()
    const updateHasInputs = useUpdateHasInputs()

    if (!hidden && !hasInputs) {
        setHasInputs()
    }

    const { validated, error } = useInputValidation(props)
    const hasValidationError = useHasValidationError()
    const setHasValidationError = useSetHasValidationError()
    if (!hidden && error && !hasValidationError) {
        setHasValidationError()
    }

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

    const path = usePath(props)
    const id = useID(props)

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
        path,
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
