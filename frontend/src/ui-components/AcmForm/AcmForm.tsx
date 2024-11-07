/* Copyright Contributors to the Open Cluster Management project */

import { Button, ButtonProps, Form, FormProps } from '@patternfly/react-core'
import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { AcmAlertContext } from '../AcmAlert/AcmAlert'

export interface IValidationData {
  /** Flag indicating if controls should validate their input */
  readonly validate: boolean

  /** Mapping of control ids to error strings */
  readonly errors: { [id: string]: string | undefined }

  /** Flag indicating if controls should be read only */
  readonly isReadOnly: boolean
}

export interface IValidationState extends IValidationData {
  setValidate: (validate: boolean) => void
  setError: (id: string, error?: string) => void
  setReadOnly: (disabled: boolean) => void
}

export function hasValidationErrors(state: IValidationData): boolean {
  return Object.values(state.errors).filter((v) => v).length > 0
}

export const ValidationContext = createContext<IValidationState>({
  validate: false,
  setValidate: noop,
  errors: {},
  setError: noop,
  isReadOnly: false,
  setReadOnly: noop,
})

export function useValidationState() {
  const [validationState, setValidationState] = useState<IValidationData>({
    validate: false,
    errors: {},
    isReadOnly: false,
  })
  const setValidate = useCallback((validate: boolean) => {
    setValidationState((validationState) => ({ ...validationState, ...{ validate } }))
  }, [])
  const setReadOnly = useCallback((isReadOnly: boolean) => {
    setValidationState((validationState) => ({ ...validationState, ...{ isReadOnly } }))
  }, [])
  const setError = useCallback((id: string, error?: string) => {
    setValidationState((validationState) => {
      const newState = { ...validationState }
      if (!error) {
        newState.errors = { ...newState.errors }
        delete newState.errors[id]
      } else {
        newState.errors = { ...newState.errors, ...{ [id]: error } }
      }
      return newState
    })
  }, [])
  const validationContext: IValidationState = useMemo(
    () => ({ ...{ setValidate, setReadOnly, setError }, ...validationState }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [validationState]
  )
  return validationContext
}

export function AcmValidationProvider(props: { children: ReactNode }) {
  const validationState = useValidationState()
  return <ValidationContext.Provider value={validationState}>{props.children}</ValidationContext.Provider>
}

export function useValidationContext() {
  return useContext(ValidationContext)
}

export function AcmForm(props: FormProps) {
  return (
    <AcmValidationProvider>
      <Form {...props} onSubmit={/* istanbul ignore next */ (e) => e.preventDefault()} />
    </AcmValidationProvider>
  )
}

type AcmSubmitProps = ButtonProps & { label?: string; processingLabel?: string }

export function AcmSubmit(props: AcmSubmitProps) {
  const validationContext = useContext(ValidationContext)
  const alertContext = useContext(AcmAlertContext)
  const [isDisabled, setDisabled] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const isMountedRef = useRef(false)
  const { t } = useTranslation()
  useEffect(() => {
    isMountedRef.current = true
    return () => {
      isMountedRef.current = false
    }
  }, [])

  useEffect(() => {
    if (validationContext.validate) {
      const hasError = hasValidationErrors(validationContext)
      setDisabled(hasError)
      if (!hasError) {
        alertContext.clearAlerts((alert) => alert.group === 'validation')
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [validationContext.errors])
  return (
    <Button
      type="submit"
      variant={props.variant ?? 'primary'}
      spinnerAriaValueText={isLoading ? 'Loading' : undefined}
      isLoading={isLoading}
      onClick={async (event) => {
        const hasError = hasValidationErrors(validationContext)
        if (hasError) {
          validationContext.setValidate(true)
          setDisabled(hasError)
          alertContext.addAlert({
            type: 'danger',
            title: t('Validation errors detected'),
            group: 'validation',
            id: 'validation',
          })
        } else {
          setIsLoading(true)
          validationContext.setReadOnly(true)
          /* istanbul ignore else */
          if (props.onClick) {
            try {
              await props.onClick(event)
            } catch {
              // Do Nothing
            }

            // In cases where the onClick caused a route change and the component is unmounted
            // we need to wait for that to process and only after that if we are still mounted
            // set the states
            /* istanbul ignore next */
            setTimeout(() => {
              if (isMountedRef.current) {
                validationContext.setReadOnly(false)
                setIsLoading(false)
              }
            }, 0)
          }
        }
      }}
      isDisabled={isLoading || isDisabled || props.isDisabled}
    >
      {props.label ? (isLoading ? props.processingLabel : props.label) : props.children}
    </Button>
  )
}

function noop() {
  // Do Nothing
}

/** @deprecated Deprecated - use ValidationContext instead */
export const FormContext = ValidationContext

/** @deprecated Deprecated - use AcmValidationProvider instead */
export const AcmFormProvider = AcmValidationProvider
