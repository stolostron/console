/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import { Radio } from '@patternfly/react-core'
import PropTypes from 'prop-types'
import React from 'react'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelBoolean extends React.Component {
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
    const { name, active, type, tip, isTrue } = control

    const onChange = () => {
      control.isTrue = !isTrue
      control.active = !isTrue
      handleChange()
    }

    return (
      <React.Fragment>
        <div
          style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          className="creation-view-controls-number"
          ref={this.setControlRef.bind(this, control)}
        >
          <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
            <div style={{ display: 'flex' }}>
              <div style={{ marginRight: '40px' }}>
                <Radio
                  aria-label={'true'}
                  id={`${controlId}-true`}
                  label={'True'}
                  isChecked={isTrue}
                  onChange={onChange}
                  data-testid={`radio-${controlId}`}
                  style={{ marginRight: 0 }}
                />
              </div>
              <div>
                <Radio
                  aria-label={'false'}
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
}

export default ControlPanelBoolean
