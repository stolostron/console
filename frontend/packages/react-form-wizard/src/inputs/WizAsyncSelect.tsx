import { DescriptionListDescription, DescriptionListGroup, DescriptionListTerm, InputGroup, InputGroupItem } from '@patternfly/react-core'
import { Select as PfSelect, SelectOption, SelectOptionObject, SelectProps, SelectVariant } from '@patternfly/react-core/deprecated'
import { Fragment, ReactNode, useCallback, useEffect, useState } from 'react'
import { SpinnerButton } from '../components/SpinnerButton'
import { SyncButton } from '../components/SyncButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import './Select.css'
import { WizFormGroup } from './WizFormGroup'

type WizAsyncSelectProps = InputCommonProps<string> & {
    label: string
    placeholder?: string
    isCreatable?: boolean
    asyncCallback?: () => Promise<string[]>
    footer?: ReactNode
}

export function WizAsyncSelect(props: WizAsyncSelectProps) {
    const { asyncCallback } = props
    const { displayMode, value, setValue, validated, hidden, id, disabled } = useInput(props)
    const placeholder = getSelectPlaceholder(props)
    const [open, setOpen] = useState(false)
    const [options, setOptions] = useState<string[]>([])
    const [loading, setLoading] = useState(false)

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
            options
                .filter((option) => {
                    if (typeof option !== 'string') return false
                    return option.includes(filterValue)
                })
                .map((option) => (
                    <SelectOption key={option} value={option}>
                        {option}
                    </SelectOption>
                )),
        [options]
    )

    const sync = useCallback(() => {
        if (displayMode !== DisplayMode.Step) return
        if (asyncCallback) {
            setLoading((loading) => {
                if (loading) return loading
                if (asyncCallback) {
                    asyncCallback()
                        .then((options) => {
                            if (Array.isArray(options) && options.every((option) => typeof option === 'string')) {
                                setOptions(options)
                            } else {
                                setOptions([])
                            }
                        })
                        .catch(() => null)
                        .finally(() => setLoading(false))
                    return true
                }
                return false
            })
        }
    }, [asyncCallback, displayMode])

    useEffect(() => sync(), [sync])

    if (hidden) return <Fragment />

    if (displayMode === DisplayMode.Details) {
        if (!value) return <Fragment />
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
            </DescriptionListGroup>
        )
    }

    return (
        <WizFormGroup {...props} id={id}>
            <InputGroup>
                <InputGroupItem isFill>
                    <PfSelect
                        isDisabled={disabled || (loading && !props.isCreatable)}
                        variant={SelectVariant.single}
                        isOpen={open}
                        onToggle={(_event, val) => setOpen(val)}
                        selections={value}
                        onSelect={onSelect}
                        onClear={props.required ? undefined : onClear}
                        validated={validated}
                        onFilter={onFilter}
                        hasInlineFilter={true}
                        footer={props.footer}
                        placeholderText={placeholder}
                        isCreatable={props.isCreatable}
                    >
                        {options.map((option) => (
                            <SelectOption key={option} value={option}>
                                {option}
                            </SelectOption>
                        ))}
                        {/* {props.children} */}
                    </PfSelect>
                </InputGroupItem>
                {props.asyncCallback && loading && <SpinnerButton />}
                {props.asyncCallback && !loading && <SyncButton onClick={sync} />}
            </InputGroup>
        </WizFormGroup>
    )
}
