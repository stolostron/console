import { FormGroup, TextInput } from '@patternfly/react-core'
import React from 'react'

function AcmTextInputInternal(props: {
    id: string
    value: string | undefined
    onChange: (value: string | undefined) => void
    placeholder?: string
    required?: boolean
    focus?: boolean
    secret?: boolean
}) {
    return (
        <TextInput
            id={props.id}
            value={props.value}
            onChange={props.onChange}
            placeholder={props.placeholder}
            required={props.required}
            autoFocus={props.focus}
            type={props.secret ? 'password' : 'text'}
        />
    )
}

export function AcmTextInput(props: {
    id: string
    label: string
    value: string | null | undefined
    onChange: (value: string | undefined) => void
    placeholder?: string
    required?: boolean
    hidden?: boolean
    focus?: boolean
    secret?: boolean
}) {
    if (props.value === null) {
        props.value = undefined
    }
    return (
        <FormGroup
            id={`${props.id}-label`}
            label={props.label}
            isRequired={props.required}
            fieldId={props.id}
            hidden={props.hidden}
        >
            <AcmTextInputInternal
                id={props.id}
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                required={props.required}
                focus={props.focus}
                secret={props.secret}
            />
        </FormGroup>
    )
}
