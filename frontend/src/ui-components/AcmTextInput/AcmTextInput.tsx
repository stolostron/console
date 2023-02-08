/* Copyright Contributors to the Open Cluster Management project */

import { Button, FormGroup, Popover, TextInput, TextInputProps } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment, ReactNode, useLayoutEffect, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { useValidationContext } from '../AcmForm/AcmForm'

type AcmTextInputProps = TextInputProps & {
  id: string
  label: string
  validation?: (value: string) => string | undefined
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
}
export function AcmTextInput(props: AcmTextInputProps) {
  const ValidationContext = useValidationContext()
  const [validated, setValidated] = useState<'default' | 'success' | 'error' | 'warning'>('default')
  const [error, setError] = useState<string>('')
  const { validation, labelHelp, labelHelpTitle, helperText, ...textInputProps } = props
  const { t } = useTranslation()

  useLayoutEffect(() => {
    let error: string | undefined = undefined
    /* istanbul ignore else */
    if (props.hidden !== true) {
      if (props.isRequired) {
        if (!props.value || (typeof props.value === 'string' && props.value.trim() === '')) {
          error = t('Required')
        }
      }
      if (!error && validation) {
        error = validation(props.value as string)
      }
    }
    setError(error ?? '')
    if (ValidationContext.validate) {
      setValidated(error ? 'error' : 'default')
    }
    ValidationContext.setError(props.id, error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, props.hidden])

  useLayoutEffect(() => {
    setValidated(error ? 'error' : 'default')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ValidationContext.validate])

  return (
    <FormGroup
      id={`${props.id}-label`}
      label={props.label}
      isRequired={props.isRequired}
      fieldId={props.id}
      hidden={props.hidden}
      helperTextInvalid={error}
      validated={validated}
      helperText={helperText}
      labelIcon={
        /* istanbul ignore next */
        props.labelHelp ? (
          <Popover id={`${props.id}-label-help-popover`} headerContent={labelHelpTitle} bodyContent={labelHelp}>
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
      <TextInput
        {...textInputProps}
        validated={validated}
        isDisabled={props.isDisabled || ValidationContext.isReadOnly}
      />
    </FormGroup>
  )
}
