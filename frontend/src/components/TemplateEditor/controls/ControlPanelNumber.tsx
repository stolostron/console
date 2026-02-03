/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { RefCallback, useCallback } from 'react'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import { TFunction } from 'react-i18next'

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
        <div className="pf-v6-c-number-input">
          <div className="pf-v6-c-input-group">
            <button
              className="pf-v6-c-button pf-m-control"
              style={{ lineHeight: '16px' }}
              type="button"
              aria-label={i18n('Minus')}
              id={`down-${controlId}`}
              data-testid={`down-${controlId}`}
              onClick={() => {
                onChange(-1)
              }}
            >
              <span className="pf-v6-c-number-input__icon">
                <svg height="16" width="16" role="img" viewBox="0 0 24 24">
                  <path d="M0 10h24v4h-24z" />
                </svg>
              </span>
            </button>
            <input
              className="pf-v6-c-form-control"
              type="number"
              value={control.active || ''}
              pattern="[0-9]*"
              name="number-input-default-name"
              onFocus={(e) => {
                e.target.select()
              }}
              onChange={(e) => {
                onSet(e.target.value)
              }}
              aria-label={i18n('Number input')}
              id={controlId}
              data-testid={`number-${controlId}`}
            />
            <button
              className="pf-v6-c-button pf-m-control"
              style={{ lineHeight: '16px' }}
              type="button"
              aria-label={i18n('Plus')}
              id={`up-${controlId}`}
              data-testid={`up-${controlId}`}
              onClick={() => {
                onChange(1)
              }}
            >
              <svg height="16" width="16" role="img" viewBox="0 0 24 24">
                <path d="M24 10h-10v-10h-4v10h-10v4h10v10h4v-10h10z" />
              </svg>
            </button>
          </div>
        </div>
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
