/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { Radio } from '@patternfly/react-core'
import React from 'react'
import ControlPanelFormGroup from './FormGroup'
import { ControlPanelBaseProps } from '../types'

type Props = ControlPanelBaseProps & {
  handleChange: () => void
}

const ControlPanelBoolean = (props: Props) => {
  const { controlId, control, controlData, handleChange, i18n } = props
  const { tip, isTrue } = control as { tip?: React.ReactNode; isTrue?: boolean }

  const onChange = () => {
    control.isTrue = !isTrue
    control.active = !isTrue
    handleChange()
  }

  const setControlRef = (ref: HTMLDivElement | null) => {
    control.ref = ref
  }

  return (
    <React.Fragment>
      <div
        style={{ flexDirection: 'column', alignItems: 'flex-start' }}
        className="creation-view-controls-number"
        ref={setControlRef}
      >
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          <div style={{ display: 'flex' }}>
            <div style={{ marginRight: '40px' }}>
              <Radio
                name={controlId}
                aria-label={`${controlId}-true`}
                id={`${controlId}-true`}
                label={'True'}
                isChecked={!!isTrue}
                onChange={onChange}
                data-testid={`radio-${controlId}`}
                style={{ marginRight: 0 }}
              />
            </div>
            <div>
              <Radio
                name={controlId}
                aria-label={`${controlId}-false`}
                id={`${controlId}-false`}
                label={'False'}
                isChecked={!isTrue}
                onChange={onChange}
                data-testid={`radio-${controlId}`}
                style={{ marginRight: 0 }}
              />
            </div>
          </div>
        </ControlPanelFormGroup>
      </div>
      <div style={{ fontSize: '14px', fontWeight: 'normal' }}>{tip}</div>
    </React.Fragment>
  )
}

export default ControlPanelBoolean
