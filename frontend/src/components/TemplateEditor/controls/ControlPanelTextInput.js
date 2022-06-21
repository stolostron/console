'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { TextInput } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelTextInput extends React.Component {
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
    const { name, type, active: value, exception, disabled } = control

    // if placeholder missing, create one
    let { placeholder } = control
    if (!placeholder) {
      placeholder = i18n('creation.ocp.cluster.enter.value', [name ? name.toLowerCase() : ''])
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
            <TextInput
              id={controlId}
              isDisabled={disabled}
              type={type}
              spellCheck="false"
              placeholder={placeholder}
              validated={validated}
              value={value || ''}
              onChange={this.handleChange.bind(this, control)}
              data-testid={`text-${controlId}`}
            />
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  handleChange(id, evt) {
    const { control, handleChange } = this.props
    control.active = evt || ''
    handleChange(evt)
  }
}

export default ControlPanelTextInput
