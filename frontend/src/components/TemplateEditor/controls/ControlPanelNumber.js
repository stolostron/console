/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import PropTypes from 'prop-types'
import React from 'react'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelNumber extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  }

  render() {
    const { controlId, control, controlData, handleChange, i18n } = this.props
    const { exception, min } = control

    const onSet = (value) => {
      if ((min && value >= min) || !min) {
        control.active = value.toString()
        handleChange()
      }
    }

    const onChange = (inc) => {
      const value = parseInt(control.active, 10) + inc
      if ((min && value >= min) || (!min && value >= 0)) {
        control.active = value.toString()
        handleChange()
      }
    }

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div className="creation-view-controls-number" ref={this.setControlRef.bind(this, control)}>
          <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
            <div className="pf-v5-c-number-input">
              <div className="pf-v5-c-input-group">
                <button
                  className="pf-v5-c-button pf-m-control"
                  style={{ lineHeight: '16px' }}
                  type="button"
                  aria-label={i18n('Minus')}
                  id={`down-${controlId}`}
                  data-testid={`down-${controlId}`}
                  onClick={() => {
                    onChange(-1)
                  }}
                >
                  <span className="pf-v5-c-number-input__icon">
                    <svg height="16" width="16" role="img" viewBox="0 0 24 24">
                      <path d="M0 10h24v4h-24z" />
                    </svg>
                  </span>
                </button>
                <input
                  className="pf-v5-c-form-control"
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
                  className="pf-v5-c-button pf-m-control"
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
            {validated === 'error' ? (
              <div
                style={{
                  borderTop: '1.75px solid red',
                  paddingBottom: '6px',
                  maxWidth: '400px',
                }}
              ></div>
            ) : (
              <React.Fragment />
            )}
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelNumber
