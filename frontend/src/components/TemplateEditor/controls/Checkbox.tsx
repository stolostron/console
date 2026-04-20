/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import { Checkbox, Radio } from '@patternfly/react-core'
import ControlPanelFormGroup from './FormGroup'
import { ControlPanelBaseProps } from '../types'

type Props = ControlPanelBaseProps & {
  handleChange: () => void
}

const ControlPanelCheckbox = (props: Props) => {
  const { controlId, control, controlData, handleChange, i18n } = props
  const {
    name,
    active,
    type,
    tip,
    disabled = false,
  } = control as {
    name?: string
    active?: boolean | string
    type?: string
    tip?: React.ReactNode
    disabled?: boolean
  }

  const onChange = () => {
    control.active = !active
    handleChange()
  }

  const setControlRef = (ref: HTMLDivElement | null) => {
    control.ref = ref
  }

  const Input = type === 'radio' ? Radio : Checkbox
  return (
    <React.Fragment>
      <div
        style={{ flexDirection: 'column', alignItems: 'flex-start' }}
        className="creation-view-controls-checkbox"
        ref={setControlRef}
      >
        <div style={{ display: 'flex', alignItems: 'baseline' }}>
          <Input
            aria-label={name}
            id={controlId}
            isChecked={typeof active === 'boolean' ? active : active === 'true'}
            isDisabled={disabled}
            onChange={onChange}
            data-testid={`checkbox-${controlId}`}
          />
          <ControlPanelFormGroup
            i18n={i18n}
            controlId={controlId}
            control={control}
            controlData={controlData}
            showTip={false}
          >
            {null}
          </ControlPanelFormGroup>
        </div>
        <div style={{ fontSize: '14px', fontWeight: 'normal' }}>{tip}</div>
      </div>
    </React.Fragment>
  )
}

export default ControlPanelCheckbox
