/* Copyright Contributors to the Open Cluster Management project */

import { Button, FormGroup, NumberInput, NumberInputProps, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment, ReactNode, useLayoutEffect, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { useValidationContext } from '../AcmForm/AcmForm'

type AcmNumberInputProps = NumberInputProps & {
  id: string
  label: string
  validation?: (value: number) => string | undefined
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
}

export function AcmNumberInput(props: AcmNumberInputProps) {
  const ValidationContext = useValidationContext()
  const [validated, setValidated] = useState<'default' | 'success' | 'error' | 'warning'>('default')
  const [error, setError] = useState<string>('')
  const { validation, labelHelp, labelHelpTitle, helperText, ...numberInputProps } = props
  const { t } = useTranslation()

  useLayoutEffect(() => {
    let error: string | undefined = undefined
    /* istanbul ignore else */
    if (props.hidden !== true) {
      if (props.required) {
        /* istanbul ignore else */
        if (props.value === undefined) {
          error = t('Required')
        }
      }
      if (!error && validation) {
        error = validation(props.value as number)
      }
    }
    setError(error ?? '')
    if (ValidationContext.validate) {
      /* istanbul ignore next-line */
      setValidated(error ? 'error' : 'default')
    }
    ValidationContext.setError(props.id, error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, props.hidden, validation])

  useLayoutEffect(() => {
    setValidated(error ? 'error' : 'default')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ValidationContext.validate, t])

  return (
    <FormGroup
      id={`${props.id}-label`}
      label={props.label}
      isRequired={props.required}
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
              aria-label={t('More info')}
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
      <NumberInput
        {...numberInputProps}
        inputName={props.id}
        inputAriaLabel={props.label}
        // validated={validated} not supported now
        isDisabled={props.isDisabled || ValidationContext.isReadOnly}
      />
    </FormGroup>
  )
}
