import {
    Chip,
    ChipGroup,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    InputGroup,
    InputGroupItem,
} from '@patternfly/react-core'
import {
    Select as PfSelect,
    SelectProps as PfSelectProps,
    SelectOption,
    SelectOptionObject,
    SelectVariant,
} from '@patternfly/react-core/deprecated'
import get from 'get-value'
import { Fragment, ReactNode, useCallback, useMemo, useState } from 'react'
import { SpinnerButton } from '../components/SpinnerButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getSelectPlaceholder, useInput } from './Input'
import './Select.css'
import { WizFormGroup } from './WizFormGroup'

export interface Option<T> {
    id?: string
    icon?: ReactNode
    label: string
    description?: string
    value: T
    disabled?: boolean
}

export interface OptionGroup<T> {
    id?: string
    label: string
    options: (Option<T> | string | number)[] | undefined
}

type WizSelectCommonProps<T> = InputCommonProps<T> & {
    placeholder?: string
    footer?: ReactNode
    label: string

    /** key path is the path to get the key of the value
     * Used in cases where the value is an object, but we need to track select by a string or number
     */
    keyPath?: string
    isCreatable?: boolean
    onCreate?: (value: string) => void
}

interface WizSelectSingleProps<T> extends WizSelectCommonProps<T> {
    variant: 'single'
    options?: (Option<T> | string | number)[]
}

export function WizSelect<T>(props: Omit<WizSelectSingleProps<T>, 'variant'>) {
    return <WizSelectBase<T> {...props} variant="single" />
}

type SelectProps<T> = WizSelectSingleProps<T>

function WizSelectBase<T = any>(props: SelectProps<T>) {
    const { displayMode: mode, value, setValue, validated, hidden, id, disabled } = useInput(props)

    const placeholder = getSelectPlaceholder(props)

    const keyPath = props.keyPath ?? props.path

    const isCreatable = props.isCreatable

    const [open, setOpen] = useState(false)

    // The drop down items with icons and descriptions - optionally grouped
    const selectOptions:
        | ({
              id: string
              icon?: ReactNode
              label: string
              description?: string
              value: string | number | T
              keyedValue: string | number
              disabled?: boolean
          } & SelectOptionObject)[]
        | undefined = useMemo(() => {
        switch (props.variant) {
            case 'single':
                return props.options?.map((option) => {
                    let id: string
                    let label: string
                    let value: string | number | T
                    let keyedValue: string | number
                    let description: string | undefined
                    let toString: () => string
                    if (typeof option === 'string' || typeof option === 'number') {
                        id = option.toString()
                        label = option.toString()
                        value = option
                        keyedValue = option
                        toString = () => option.toString()
                    } else {
                        id = option.id ?? option.label
                        label = option.label
                        if (!keyPath) throw new Error('keyPath is required')
                        value = option.value
                        description = option.description
                        keyedValue = get(value as any, keyPath)
                        switch (typeof keyedValue) {
                            case 'string':
                            case 'number':
                                break
                            default:
                                throw new Error('keyedValue is not a string or number')
                        }
                        toString = () => {
                            return option.label
                            // TODO typeahead uses this... so no typeahread with icons
                            // return (
                            //     <div key={option.id} style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
                            //         {option?.icon}
                            //         {option.label}
                            //     </div>
                            // ) as unknown as string
                        }
                    }
                    const compareTo = (compareTo: any) => compareTo === keyedValue
                    return { id, label, value, keyedValue, toString, compareTo, description }
                })
        }
    }, [props, keyPath])

    const keyedValue = useMemo(() => {
        if (typeof value === 'undefined') return ''
        if (typeof value === 'string') return value
        if (typeof value === 'number') return value
        if (Array.isArray(value)) {
            return value.map((value) => {
                if (typeof value === 'string') return value
                if (typeof value === 'number') return value
                if (!keyPath) throw new Error()
                const valueKey = get(value, keyPath)
                if (typeof valueKey === 'string') return valueKey
                if (typeof valueKey === 'number') return valueKey
                throw new Error()
            })
        }
        if (!keyPath) throw new Error()
        const valueKey = get(value, keyPath)
        if (typeof valueKey === 'string') return valueKey
        if (typeof valueKey === 'number') return valueKey
        throw new Error()
    }, [value, keyPath])

    const selections = useMemo(() => {
        if (Array.isArray(keyedValue)) {
            return selectOptions?.filter(
                (selectOption) => keyedValue.find((keyedValue) => keyedValue === selectOption.keyedValue) !== undefined
            )
        } else {
            return selectOptions?.find((selectOption) => keyedValue === selectOption.keyedValue)
        }
    }, [keyedValue, selectOptions])

    const onSelect = useCallback<Required<PfSelectProps>['onSelect']>(
        (_, selectOptionObject) => {
            switch (props.variant) {
                case 'single':
                    if (isCreatable && typeof selectOptionObject === 'string') {
                        setValue(selectOptionObject)
                    } else {
                        setValue((selectOptionObject as Option<T>).value)
                    }
                    setOpen(false)
                    break
            }
        },
        [isCreatable, props.variant, setValue]
    )

    const onClear = useCallback(() => {
        // TODO
        // set(item, props.path, '', { preservePaths: false })
        // update()
    }, [])

    const onFilter = useCallback<Required<PfSelectProps>['onFilter']>(
        (_, value: string) => {
            if (selectOptions)
                return selectOptions
                    .filter((option) => option.label.toLowerCase().includes(value.toLowerCase()))
                    .map((option) => (
                        <SelectOption
                            key={option.id}
                            id={option.id}
                            value={option}
                            description={option.description}
                            isDisabled={option.disabled}
                        >
                            {option.toString()}
                        </SelectOption>
                    ))
            return []
        },
        [selectOptions]
    )

    const variant = useMemo(() => {
        switch (props.variant) {
            case 'single':
                return SelectVariant.single
        }
    }, [props.variant])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        // return <TextDetail id={id} path={props.path} label={props.label} />
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>{value}</DescriptionListDescription>
            </DescriptionListGroup>
        )
    }
    const activePlacemeholder = Array.isArray(selections) ? (
        selections.length === 0 ? (
            placeholder
        ) : (
            <ChipGroup style={{ marginTop: -8, marginBottom: -8 }} numChips={9999}>
                {selections.map((selection) => (
                    <Chip isReadOnly key={selection.id}>
                        {selection.label}
                    </Chip>
                ))}
            </ChipGroup>
        )
    ) : (
        placeholder
    )
    // TODO: implement loading state for when options are undefined
    // currently disabling select field when undefined
    return (
        <div id={id}>
            <WizFormGroup {...props}>
                <InputGroup>
                    {!selectOptions && <SpinnerButton />}
                    <InputGroupItem isFill>
                        <PfSelect
                            isDisabled={disabled || !selectOptions}
                            variant={variant}
                            isOpen={open}
                            onToggle={(_event, val) => setOpen(val)}
                            selections={selections}
                            onSelect={onSelect}
                            onClear={props.required ? undefined : onClear}
                            isCreatable={isCreatable}
                            onCreateOption={(value) => props.onCreate?.(value)}
                            validated={validated}
                            hasInlineFilter
                            onFilter={onFilter}
                            footer={props.footer}
                            placeholderText={selectOptions && activePlacemeholder}
                        >
                            {selectOptions?.map((option) => (
                                <SelectOption
                                    key={option.id}
                                    id={option.id}
                                    value={option}
                                    description={option.description}
                                    isDisabled={option.disabled}
                                >
                                    {option.toString()}
                                </SelectOption>
                            ))}
                        </PfSelect>
                    </InputGroupItem>
                </InputGroup>
            </WizFormGroup>
        </div>
    )
}
