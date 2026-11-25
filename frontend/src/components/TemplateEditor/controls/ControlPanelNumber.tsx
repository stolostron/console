/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { RefCallback, useCallback } from 'react'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import type { TFunction } from 'i18next'
import { ButtonProps, NumberInput, TextInput } from '@patternfly/react-core'

const ControlPanelNumber = (props: {
  control: any
  controlData: any
  controlId: string
  handleChange: () => void
  i18n: TFunction
}) => {
  const { controlId, control, controlData, handleChange, i18n } = props
  const { exception, min, variant } = control
  const isPlain = variant === 'plain'

  const setControlRef = useCallback<RefCallback<HTMLDivElement>>(
    (ref) => {
      control.ref = ref
    },
    [control]
  )

  const onSet = useCallback(
    (value: string) => {
      const numValue = Number.parseInt(value, 10)
      if (value === '' || Number.isNaN(numValue)) {
        control.active = value
        handleChange()
        return
      }
      if ((min && numValue >= min) || !min) {
        control.active = value
        handleChange()
      }
    },
    [control, handleChange, min]
  )

  const onChange = useCallback(
    (inc: number) => {
      const parsed = Number.parseInt(control.active, 10)
      const floor = min ?? 0
      const value = control.active === '' || Number.isNaN(parsed) ? floor : parsed + inc
      if (value >= floor) {
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
        {isPlain ? (
          <TextInput
            id={controlId}
            type="number"
            value={control.active || ''}
            validated={validated}
            min={min}
            onChange={(_event, value) => onSet(value)}
            data-testid={`number-${controlId}`}
            aria-label={control.name || i18n('Number input')}
          />
        ) : (
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
        )}
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
