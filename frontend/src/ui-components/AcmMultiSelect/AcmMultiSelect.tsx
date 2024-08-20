/* Copyright Contributors to the Open Cluster Management project */

import { Button, FormGroup, Popover, Skeleton } from '@patternfly/react-core'
import { Select, SelectOption, SelectProps, SelectVariant } from '@patternfly/react-core/deprecated'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Children, Fragment, ReactNode, useLayoutEffect, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { useValidationContext } from '../AcmForm/AcmForm'

type AcmMultiSelectProps = Pick<
  SelectProps,
  Exclude<keyof SelectProps, 'onToggle' | 'onChange' | 'selections' | 'onSelect'>
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
  isLoading?: boolean
}

export function AcmMultiSelect(props: AcmMultiSelectProps) {
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
    isLoading,
    ...selectProps
  } = props

  const [placeholderText, setPlaceholderText] = useState<ReactNode | undefined>(props.placeholder)
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

  useLayoutEffect(() => {
    if (value === undefined || value.length === 0) {
      setPlaceholderText(<span style={{ color: '#666' }}>{placeholder}</span>)
    } else {
      const selectedItems = Children.map(props.children, (child) => {
        const option = child as unknown as SelectOption
        if (value.includes(option.props.value as string)) return option.props.children
        return undefined
      })
      /* istanbul ignore if */
      if (selectedItems === undefined) {
        setPlaceholderText(<span style={{ color: '#666' }}>{placeholder}</span>)
      } else {
        setPlaceholderText(
          selectedItems
            .filter((item) => item !== undefined)
            .map((node: ReactNode, index) => {
              if (index === 0) {
                return <Fragment key={`${index}`}>{node}</Fragment>
              } else {
                return (
                  <Fragment key={`${index}`}>
                    <span>, </span>
                    {node}
                  </Fragment>
                )
              }
            })
        )
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value])

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
        <Select
          variant={SelectVariant.checkbox}
          aria-labelledby={`${props.id}-label`}
          {...selectProps}
          isOpen={open}
          onToggle={() => {
            setOpen(!open)
          }}
          selections={value}
          onSelect={(_event, selection) => {
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
          placeholderText={
            /* istanbul ignore next */ props.variant === SelectVariant.typeaheadMulti ? placeholder : placeholderText
          }
          isDisabled={props.isDisabled || ValidationContext.isReadOnly}
          noResultsFoundText={t('No results found')}
        />
      )}
      {validated === 'error' ? (
        <div style={{ borderTop: '1.75px solid red', paddingBottom: '6px' }}></div>
      ) : (
        <Fragment />
      )}
    </FormGroup>
  )
}
