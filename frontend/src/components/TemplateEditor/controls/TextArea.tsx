/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { useCallback } from 'react'
import { TextArea } from '@patternfly/react-core'
import ControlPanelFormGroup from './FormGroup'
import { ControlPanelBaseProps } from '../types'

type Props = ControlPanelBaseProps & {
  handleChange: (value: string[]) => void
}

const ControlPanelTextArea = (props: Props) => {
  const { controlId, i18n, control, controlData, handleChange } = props
  const { name, type, exception, disabled } = control as {
    name?: string
    type?: string
    exception?: string
    disabled?: boolean
  }

  let { placeholder } = control as { placeholder?: string }
  if (!placeholder) {
    placeholder = i18n('creation.ocp.cluster.enter.value', [name ? name.toLowerCase() : ''])
  }

  let { active: value } = control as { active?: string | string[] }
  if (Array.isArray(value)) {
    value = value.join('\n')
  }

  const setControlRef = useCallback(
    (ref: HTMLDivElement | null) => {
      control.ref = ref
    },
    [control]
  )

  const onChange = useCallback(
    (_event: unknown, v: string) => {
      const lines = v.split(/\r\n|\n/)
      control.active = lines
      handleChange(lines)
    },
    [control, handleChange]
  )

  const validated = exception ? 'error' : undefined
  return (
    <React.Fragment>
      <div className="creation-view-controls-textbox" style={{ display: '' }} ref={setControlRef}>
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          <TextArea
            id={controlId}
            isDisabled={disabled}
            type={type}
            placeholder={placeholder}
            validated={validated}
            value={(value as string) || ''}
            onChange={onChange}
            data-testid={`area-${controlId}`}
          />
        </ControlPanelFormGroup>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelTextArea
