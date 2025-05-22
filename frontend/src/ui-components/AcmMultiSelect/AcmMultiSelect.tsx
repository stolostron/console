/* Copyright Contributors to the Open Cluster Management project */

import { Button, FormGroup, Popover, Skeleton } from '@patternfly/react-core'
import { AcmSelectBase, AcmSelectBaseProps, SelectVariant } from '../../components/AcmSelectBase'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Fragment, ReactNode, useLayoutEffect, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { useValidationContext } from '../AcmForm/AcmForm'
import { AcmHelperText } from '../AcmHelperText/AcmHelperText'

type AcmMultiSelectProps = Pick<
  AcmSelectBaseProps,
  Exclude<keyof AcmSelectBaseProps, 'onToggle' | 'onChange' | 'selections' | 'onSelect' | 'placeholder'>
> & {
  id: string
  label: string
  value: string[] | undefined
  onChange: (value: string[] | undefined) => void
  validation?: (value: string[] | undefined) => string | undefined
  placeholder?: string
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
  isRequired?: boolean
  variant?: SelectVariant.checkbox | SelectVariant.typeaheadMulti | SelectVariant.typeaheadCheckbox
  isLoading?: boolean
}

export function AcmMultiSelect(props: AcmMultiSelectProps) {
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
    variant = SelectVariant.checkbox,
    value,
    isLoading,
    ...selectProps
  } = props

  const { t } = useTranslation()

  useLayoutEffect(() => {
    let error: string | undefined = undefined
    /* istanbul ignore else */
    if (props.hidden !== true) {
      if (isRequired) {
        if (props.value === undefined) {
          error = t('Required')
        } else if (props.value.length === 0) {
          error = t('Required')
        }
      }

      if (!error && validation) {
        error = validation(props.value)
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
      isRequired={isRequired}
      fieldId={props.id}
      hidden={props.hidden}
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
      {isLoading ? (
        <Skeleton height="36px" screenreaderText={t('Loading')} />
      ) : (
        <AcmSelectBase
          {...selectProps}
          aria-label={props.label}
          variant={variant}
          selections={value}
          onSelect={(selection) => {
            if (value === undefined) {
              onChange([selection as string])
            } else {
              if (value.includes(selection as string)) {
                onChange(value.filter((item) => item !== selection))
              } else {
                onChange([...value, selection as string])
              }
            }
          }}
          onClear={
            !props.isRequired
              ? () => {
                  onChange(undefined)
                }
              : undefined
          }
          placeholder={props.placeholder}
          isDisabled={props.isDisabled || ValidationContext.isReadOnly}
        />
      )}
      <div
        style={{ borderTop: `1.75px solid ${validated === 'error' ? 'red' : 'transparent'}`, paddingBottom: '10px' }}
      ></div>
      <AcmHelperText controlId={props.id} helperText={helperText} validated={validated} error={error} />
    </FormGroup>
  )
}
