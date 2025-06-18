import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, InputGroup, InputGroupItem } from '@patternfly/react-core'
import { Select as PfSelect, SelectProps, SelectOption, SelectOptionObject, SelectVariant } from '@patternfly/react-core/deprecated'
import { Fragment, ReactNode, useCallback, useEffect, useState } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import './Select.css'
import { WizFormGroup } from './WizFormGroup'

export type WizSingleSelectProps = InputCommonProps<string> & {
    label: string
    placeholder?: string
    isCreatable?: boolean
    footer?: ReactNode
    options: string[]
}

export function WizSingleSelect(props: WizSingleSelectProps) {
    const { displayMode: mode, value, setValue, validated, hidden, id, disabled } = useInput(props)
    const placeholder = getSelectPlaceholder(props)
    const [open, setOpen] = useState(false)

    const onSelect = useCallback<Required<SelectProps>['onSelect']>(
        (_, selectedString: string | SelectOptionObject) => {
            if (typeof selectedString === 'string') {
                setValue(selectedString)
                setOpen(false)
            }
        },
        [setValue]
    )

    const onClear = useCallback(() => setValue(''), [setValue])

    const onFilter = useCallback<Required<SelectProps>['onFilter']>(
        (_, filterValue: string) =>
            props.options
                .filter((option) => {
                    if (typeof option !== 'string') return false
                    return option.includes(filterValue)
                })
                .map((option) => (
                    <SelectOption key={option} value={option}>
                        {option}
                    </SelectOption>
                )),
        [props.options]
    )

    useEffect(() => {
        if (!props.isCreatable) {
            if (value && !props.options.includes(value)) {
                setValue('')
            }
        }
    }, [props.isCreatable, props.options, setValue, value])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
            </DescriptionListGroup>
        )
    }

    return (
        <div id={id}>
            <WizFormGroup {...props} id={id}>
                <InputGroup>
                    <InputGroupItem isFill>
                        <PfSelect
                            isDisabled={disabled || props.readonly}
                            variant={SelectVariant.single}
                            isOpen={open}
                            onToggle={(_event, val) => setOpen(val)}
                            selections={value}
                            onSelect={onSelect}
                            onClear={props.required ? undefined : onClear}
                            validated={validated}
                            onFilter={onFilter}
                            hasInlineFilter
                            footer={props.footer}
                            placeholderText={placeholder}
                            isCreatable={props.isCreatable}
                        >
                            {props.options.map((option) => (
                                <SelectOption id={option} key={option} value={option}>
                                    {option}
                                </SelectOption>
                            ))}
                        </PfSelect>
                    </InputGroupItem>
                </InputGroup>
            </WizFormGroup>
        </div>
    )
}
