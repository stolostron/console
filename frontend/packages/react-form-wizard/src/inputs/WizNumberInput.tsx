import {
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    NumberInputProps,
    NumberInput as PFNumberInput,
} from '@patternfly/react-core'
import { Fragment, useCallback } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { getEnterPlaceholder, InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export type WizNumberInputProps = InputCommonProps<string> & {
    label: string
    placeholder?: string
    secret?: boolean
    min?: number
    max?: number
    zeroIsUndefined?: boolean
}

export function WizNumberInput(props: WizNumberInputProps) {
    const { displayMode: mode, value, setValue, disabled, hidden, id } = useInput(props)

    const onMinus = useCallback(() => {
        const newValue = typeof value === 'number' ? value - 1 : 0
        if (props.zeroIsUndefined && newValue === 0) {
            setValue(undefined)
        } else {
            setValue(newValue)
        }
    }, [props.zeroIsUndefined, setValue, value])

    const onChange = useCallback<Required<NumberInputProps>['onChange']>(
        (event) => {
            const newValue = Number((event.target as HTMLInputElement).value)
            if (props.zeroIsUndefined && newValue === 0) {
                setValue(undefined)
            } else {
                if (Number.isInteger(newValue)) setValue(newValue)
            }
        },
        [props.zeroIsUndefined, setValue]
    )
    const onPlus = useCallback(() => {
        if (typeof value === 'number') setValue(value + 1)
        else setValue(1)
    }, [setValue, value])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        // return <WizTextDetail id={id} path={props.path} label={props.label} />
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
            </DescriptionListGroup>
        )
    }

    const placeholder = getEnterPlaceholder(props)

    return (
        <WizFormGroup {...props} id={id}>
            <PFNumberInput
                id={id}
                placeholder={placeholder}
                // validated={validated}
                value={value}
                onMinus={onMinus}
                onChange={onChange}
                onPlus={onPlus}
                min={props.min === undefined ? 0 : props.min}
                max={props.max}
                // isReadOnly={props.readonly}
                // type={!props.secret || showSecrets ? 'text' : 'password'}
                isDisabled={disabled}
            />
        </WizFormGroup>
    )
}
