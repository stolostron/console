'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { TextArea } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelTextArea extends React.Component {
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
    const { controlId, i18n, control } = this.props
    const { name, type, exception, disabled } = control

    // if placeholder missing, create one
    let { placeholder } = control
    if (!placeholder) {
      placeholder = i18n('creation.ocp.cluster.enter.value', [name ? name.toLowerCase() : ''])
    }

    let { active: value } = control
    if (Array.isArray(value)) {
      value = value.join('\n')
    }

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div
          className="creation-view-controls-textbox"
          style={{ display: '' }}
          ref={this.setControlRef.bind(this, control)}
        >
          <ControlPanelFormGroup controlId={controlId} control={control}>
            <TextArea
              id={controlId}
              isDisabled={disabled}
              type={type}
              placeholder={placeholder}
              validated={validated}
              value={value || ''}
              onChange={this.handleChange.bind(this, control)}
              data-testid={`area-${controlId}`}
            />
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  handleChange(id, value) {
    const { control, handleChange } = this.props
    value = value.split(/\r\n|\n/)
    control.active = value
    handleChange(value)
  }
}

export default ControlPanelTextArea
