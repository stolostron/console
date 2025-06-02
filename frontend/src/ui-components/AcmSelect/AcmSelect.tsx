/* Copyright Contributors to the Open Cluster Management project */

import { Button, FormGroup, Popover } from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment, ReactNode, useLayoutEffect, useState } from 'react'
import { AcmSelectBase, AcmSelectBaseProps, SelectVariant } from '../../components/AcmSelectBase'

import { useTranslation } from '../../lib/acm-i18next'
import { useValidationContext } from '../AcmForm/AcmForm'
import { AcmHelperText } from '../AcmHelperText/AcmHelperText'

type AcmSelectProps = Pick<
  AcmSelectBaseProps,
  Exclude<
    keyof AcmSelectBaseProps,
    'toggle' | 'onToggle' | 'onChange' | 'selections' | 'onSelect' | 'variant' | 'width'
  >
> & {
  id: string
  label: string
  variant?: SelectVariant
  value: string | undefined
  onChange: (value: string | undefined) => void
  validation?: (value: string | undefined) => string | undefined
  placeholder?: string
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
  isRequired?: boolean
  toggleId?: string
  footer?: React.ReactNode
}

export function AcmSelect(props: AcmSelectProps) {
  const ValidationContext = useValidationContext()
  const [validated, setValidated] = useState<'default' | 'success' | 'error' | 'warning'>('default')
  const [error, setError] = useState<string>('')
  const { t } = useTranslation()
  const {
    value,
    validation,
    labelHelp,
    labelHelpTitle,
    helperText,
    isRequired,
    onChange,
    placeholder,
    ...selectProps
  } = props

  useLayoutEffect(() => {
    let error: string | undefined = undefined
    /* istanbul ignore else */
    if (props.hidden !== true) {
      if (isRequired) {
        if (props.value === undefined) {
          error = t('Required')
        } else if (props.value.trim() === '') {
          error = t('Required')
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
      isRequired={isRequired}
      fieldId={props.id}
      hidden={props.hidden}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
        }
      }}
      labelIcon={
        /* istanbul ignore next */
        props.labelHelp ? (
          <Popover id={`${props.id}-label-help-popover`} headerContent={labelHelpTitle} bodyContent={labelHelp}>
            <Button
              variant="plain"
              id={`${props.id}-label-help-button`}
              aria-label={t('More info')}
              onClick={(e) => e.preventDefault()}
              className="pf-v5-c-form__group-label-help"
              style={{ ['--pf-v5-c-form__group-label-help--TranslateY' as any]: 0 }}
              icon={<HelpIcon />}
            />
          </Popover>
        ) : (
          <Fragment />
        )
      }
    >
      <AcmSelectBase
        aria-label={props.label}
        {...selectProps}
        selections={value}
        onSelect={(value) => {
          onChange(value as string)
        }}
        onClear={
          !props.isRequired
            ? () => {
                onChange?.(undefined)
              }
            : undefined
        }
        placeholder={placeholder}
        isDisabled={props.isDisabled || ValidationContext.isReadOnly}
      />
      <div
        style={{ borderTop: `1.75px solid ${validated === 'error' ? 'red' : 'transparent'}`, paddingBottom: '10px' }}
      ></div>
      <AcmHelperText controlId={props.id} helperText={helperText} validated={validated} error={error} />
    </FormGroup>
  )
}
