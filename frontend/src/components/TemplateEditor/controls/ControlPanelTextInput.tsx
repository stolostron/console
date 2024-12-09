/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { RefCallback, useCallback } from 'react'
import { TextInput } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import { TFunction } from 'react-i18next'
import { useDynamicPropertyValues } from '../helpers/dynamicProperties'

const ControlPanelTextInput = (props: {
  control: any
  controlData: any
  controlId: string
  handleChange: (value: string) => void
  i18n: TFunction
}) => {
  const { controlId, i18n, control, controlData, handleChange } = props
  const { name, type, active: value, exception } = control
  const { disabled } = useDynamicPropertyValues(control, controlData, i18n, ['disabled'])

  const setControlRef = useCallback<RefCallback<HTMLDivElement>>(
    (ref) => {
      control.ref = ref
    },
    [control]
  )

  const onChange = useCallback(
    (value: string) => {
      control.active = value || ''
      handleChange(value)
    },
    [control, handleChange]
  )

  // if placeholder missing, create one
  let { placeholder } = control
  if (!placeholder) {
    placeholder = i18n('creation.ocp.cluster.enter.value', [name ? name.toLowerCase() : ''])
  }

  const validated = exception ? 'error' : undefined
  return (
    <React.Fragment>
      <div className="creation-view-controls-textbox" style={{ display: '' }} ref={setControlRef}>
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          <TextInput
            id={controlId}
            isDisabled={disabled as boolean}
            type={type}
            spellCheck="false"
            placeholder={placeholder}
            validated={validated}
            value={value || ''}
            onChange={(_event, value) => onChange(value)}
            data-testid={`text-${controlId}`}
          />
        </ControlPanelFormGroup>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelTextInput
