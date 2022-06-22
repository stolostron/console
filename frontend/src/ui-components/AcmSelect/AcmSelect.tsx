/* Copyright Contributors to the Open Cluster Management project */

import { Button, FormGroup, Popover, Select, SelectProps, SelectVariant } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment, ReactNode, useLayoutEffect, useState } from 'react'
import { useValidationContext } from '../AcmForm/AcmForm'

type AcmSelectProps = Pick<
    SelectProps,
    Exclude<keyof SelectProps, 'onToggle' | 'onChange' | 'selections' | 'onSelect'>
> & {
    id: string
    label: string
    value: string | undefined
    onChange: (value: string | undefined) => void
    validation?: (value: string | undefined) => string | undefined
    placeholder?: string
    labelHelp?: string
    labelHelpTitle?: ReactNode
    helperText?: ReactNode
    isRequired?: boolean
}

export function AcmSelect(props: AcmSelectProps) {
    const [open, setOpen] = useState(false)
    const ValidationContext = useValidationContext()
    const [validated, setValidated] = useState<'default' | 'success' | 'error' | 'warning'>('default')
    const [error, setError] = useState<string>('')
    const {
        validation,
        labelHelp,
        labelHelpTitle,
        helperText,
        isRequired,
        onChange,
        value,
        placeholder,
        ...selectProps
    } = props

    useLayoutEffect(() => {
        let error: string | undefined = undefined
        /* istanbul ignore else */
        if (props.hidden !== true) {
            if (isRequired) {
                if (props.value === undefined) {
                    error = 'Required'
                } else if (props.value.trim() === '') {
                    error = 'Required'
                }
            }
            if (!error && validation) {
                error = validation(props.value)
            }
        }
        setError(error ?? '')
        /* istanbul ignore next */
        if (ValidationContext.validate) {
            setValidated(error ? 'error' : 'default')
        }
        ValidationContext.setError(props.id, error)
    }, [props.value, props.hidden])

    useLayoutEffect(() => {
        setValidated(error ? 'error' : 'default')
    }, [ValidationContext.validate])

    return (
        <FormGroup
            id={`${props.id}-label`}
            label={props.label}
            isRequired={isRequired}
            fieldId={props.id}
            hidden={props.hidden}
            helperTextInvalid={error}
            validated={validated}
            helperText={helperText}
            labelIcon={
                /* istanbul ignore next */
                props.labelHelp ? (
                    <Popover
                        id={`${props.id}-label-help-popover`}
                        headerContent={labelHelpTitle}
                        bodyContent={labelHelp}
                    >
                        <Button
                            variant="plain"
                            id={`${props.id}-label-help-button`}
                            aria-label="More info"
                            onClick={(e) => e.preventDefault()}
                            // aria-describedby="simple-form-name"
                            className="pf-c-form__group-label-help"
                        >
                            <HelpIcon noVerticalAlign />
                        </Button>
                    </Popover>
                ) : (
                    <Fragment />
                )
            }
        >
            <Select
                aria-labelledby={`${props.id}-label`}
                {...selectProps}
                isOpen={open}
                onToggle={() => {
                    setOpen(!open)
                }}
                selections={value}
                onSelect={(_event, value) => {
                    onChange(value as string)
                    setOpen(false)
                }}
                onClear={
                    !props.isRequired
                        ? () => {
                              onChange(undefined)
                          }
                        : undefined
                }
                placeholderText={
                    props.variant == SelectVariant.typeahead || props.variant == SelectVariant.typeaheadMulti ? (
                        placeholder
                    ) : (
                        <span style={{ color: '#666' }}>{placeholder}</span>
                    )
                }
                isDisabled={props.isDisabled || ValidationContext.isReadOnly}
            />
            {validated === 'error' ? (
                <div style={{ borderTop: '1.75px solid red', paddingBottom: '6px' }}></div>
            ) : (
                <Fragment />
            )}
        </FormGroup>
    )
}
