/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { RefCallback, useCallback } from 'react'
import { TextInput } from '@patternfly/react-core'
import ControlPanelFormGroup from './FormGroup'
import { useDynamicPropertyValues } from '~/components/TemplateEditor/helpers/dynamicProperties'
import { ControlPanelBaseProps } from '../types'

const ControlPanelTextInput = (props: ControlPanelBaseProps & { handleChange: (value: string) => void }) => {
  const { controlId, i18n, control, controlData, handleChange } = props
  const { name, type, active: value, exception } = control
  const { disabled } = useDynamicPropertyValues(control as Record<string, unknown>, controlData, i18n, ['disabled'])

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
            type={(type as 'text' | 'password' | undefined) ?? 'text'}
            spellCheck="false"
            placeholder={String(placeholder ?? '')}
            validated={validated}
            value={String(value ?? '')}
            onChange={(_event, value) => onChange(value)}
            data-testid={`text-${controlId}`}
          />
        </ControlPanelFormGroup>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelTextInput
