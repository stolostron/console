/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { RefCallback, useCallback } from 'react'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import { TFunction } from 'react-i18next'
import { ButtonProps, NumberInput } from '@patternfly/react-core'

const ControlPanelNumber = (props: {
  control: any
  controlData: any
  controlId: string
  handleChange: () => void
  i18n: TFunction
}) => {
  const { controlId, control, controlData, handleChange, i18n } = props
  const { exception, min } = control

  const setControlRef = useCallback<RefCallback<HTMLDivElement>>(
    (ref) => {
      control.ref = ref
    },
    [control]
  )

  const onSet = useCallback(
    (value: string) => {
      const numValue = Number.parseInt(value, 10)
      if ((min && numValue >= min) || !min) {
        control.active = value
        handleChange()
      }
    },
    [control, handleChange, min]
  )

  const onChange = useCallback(
    (inc: number) => {
      const value = Number.parseInt(control.active, 10) + inc
      if ((min && value >= min) || (!min && value >= 0)) {
        control.active = value.toString()
        handleChange()
      }
    },
    [control, handleChange, min]
  )

  const validated = exception ? 'error' : undefined

  return (
    <div className="creation-view-controls-number" ref={setControlRef}>
      <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
        <NumberInput
          inputName="number-input-default-name"
          inputAriaLabel={i18n('Number input')}
          inputProps={{ id: controlId, 'data-testid': `number-${controlId}` }}
          onChange={(event) => {
            if (event.type === 'change') {
              onSet((event.target as HTMLInputElement).value)
            }
          }}
          onMinus={() => onChange(-1)}
          onPlus={() => onChange(1)}
          value={control.active || ''}
          minusBtnAriaLabel={i18n('Minus')}
          minusBtnProps={{ id: `down-${controlId}`, 'data-testid': `down-${controlId}` } as ButtonProps}
          plusBtnAriaLabel={i18n('Plus')}
          plusBtnProps={{ id: `up-${controlId}`, 'data-testid': `up-${controlId}` } as ButtonProps}
        />
        {validated === 'error' && (
          <div
            style={{
              borderTop: '1.75px solid red',
              paddingBottom: '6px',
              maxWidth: '400px',
            }}
          />
        )}
      </ControlPanelFormGroup>
    </div>
  )
}

export default ControlPanelNumber
