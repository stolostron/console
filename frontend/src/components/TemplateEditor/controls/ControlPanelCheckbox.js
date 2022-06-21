'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Checkbox, Radio } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelCheckbox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {}
  }

  setControlRef = (control, ref) => {
    control.ref = ref
  }

  render() {
    const { controlId, control, handleChange } = this.props
    const { name, active, type, tip, disabled = false } = control

    const onChange = () => {
      control.active = !active
      handleChange()
    }

    const Input = type === 'radio' ? Radio : Checkbox
    return (
      <React.Fragment>
        <div
          style={{ flexDirection: 'column', alignItems: 'flex-start' }}
          className="creation-view-controls-checkbox"
          ref={this.setControlRef.bind(this, control)}
        >
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Input
              aria-label={name}
              id={controlId}
              isChecked={typeof active === 'boolean' ? active : active === 'true'}
              isDisabled={disabled}
              onChange={onChange}
              data-testid={`checkbox-${controlId}`}
            />
            <ControlPanelFormGroup controlId={controlId} showTip={false} control={control} />
          </div>
          <div style={{ fontSize: '14px', fontWeight: 'normal' }}>{tip}</div>
        </div>
      </React.Fragment>
    )
  }
}

export default ControlPanelCheckbox
