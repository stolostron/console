import { FormGroup, Select, SelectOption } from '@patternfly/react-core'
import React, { useState } from 'react'

type SelextionOptionData = string | { title: string; value: string }
export function AcmSelect(props: {
    id: string
    label: string
    value: string | undefined
    onChange: (value: string | undefined) => void
    options: SelextionOptionData[]
    placeholder?: string
    required?: boolean
    hidden?: boolean
    clear?: boolean
}) {
    const [open, setOpen] = useState(false)

    return (
        <FormGroup
            id={`${props.id}-label`}
            label={props.label}
            isRequired={props.required}
            fieldId={props.id}
            hidden={props.hidden}
        >
            <Select
                id={props.id}
                selections={props.value}
                isOpen={open}
                onToggle={() => {
                    setOpen(!open)
                }}
                onSelect={(e, v) => {
                    if (typeof v === 'string') props.onChange(v)
                    setOpen(false)
                }}
                onClear={
                    props.clear
                        ? () => {
                              props.onChange(undefined)
                          }
                        : undefined
                }
                placeholderText={props.placeholder}
                required={props.required}
            >
                {props.options.map((option) => {
                    if (typeof option === 'string') {
                        return <SelectOption key={option} value={option} />
                    } else {
                        return (
                            <SelectOption key={option.value} value={option.value}>
                                {option.title}
                            </SelectOption>
                        )
                    }
                })}
            </Select>
        </FormGroup>
    )
}
