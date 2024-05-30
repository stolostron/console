/* Copyright Contributors to the Open Cluster Management project */
import { PropsWithChildren, useCallback, useMemo, useState } from 'react'
import { ValidationContext } from '../../ui-components'
import { useShowValidation } from '@patternfly-labs/react-form-wizard/lib/src/contexts/ShowValidationProvider'
import { noop } from 'lodash'
import {
  useData,
  useHasValidationError,
  useSetHasValidationError,
  useValidate,
} from '@patternfly-labs/react-form-wizard'

export function AcmFormInputAdapter({ children }: Readonly<PropsWithChildren>) {
  const [inputError, setInputError] = useState<string | undefined>()
  const showValidation = useShowValidation()
  const hasValidationError = useHasValidationError()
  const setHasValidationError = useSetHasValidationError()

  const { update } = useData()
  const validate = useValidate()

  const setError = useCallback(
    (_id: string, error?: string) => {
      setInputError(error)
      update()
      validate()
    },
    [update, validate]
  )

  if (!!inputError && !hasValidationError) {
    setHasValidationError()
  }

  const validationState = useMemo(
    () => ({
      validate: showValidation,
      setValidate: noop,
      errors: {},
      setError,
      isReadOnly: false,
      setReadOnly: noop,
    }),
    [showValidation, setError]
  )
  return <ValidationContext.Provider value={validationState}>{children}</ValidationContext.Provider>
}
