'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { TextInput, Label } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'

class ControlPanelValues extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      value: '',
    }
  }

  render() {
    const { controlId, control } = this.props
    const { active = [], exception, placeholder, disabled } = control
    const formatted = active.filter((value) => value.length > 0)
    const { value } = this.state
    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div className="creation-view-controls-labels">
          <ControlPanelFormGroup controlId={controlId} control={control}>
            <div className="creation-view-controls-labels-container">
              {formatted.length !== 0 && (
                <div className="creation-view-controls-labels-tag-container">
                  {formatted.map((label, inx) => {
                    return (
                      <Label key={label} onClose={this.handleDelete.bind(this, inx)}>
                        {label}
                      </Label>
                    )
                  })}
                </div>
              )}
              <div className="creation-view-controls-labels-edit-container">
                <TextInput
                  id={controlId}
                  placeholder={placeholder || 'Enter value'}
                  validated={validated}
                  value={value}
                  isDisabled={disabled}
                  onBlur={this.handleBlur.bind(this)}
                  onKeyDown={this.handleKeyDown.bind(this)}
                  onChange={this.handleChange.bind(this)}
                  data-testid={`value-${controlId}`}
                />
              </div>
            </div>
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  handleDelete(inx) {
    const { control, handleChange } = this.props
    const { active = [] } = control
    active.splice(inx, 1)
    handleChange(control)
  }

  handleChange(value = '') {
    const { control, i18n } = this.props
    const { validation } = control
    if (value.endsWith(',')) {
      this.createValue()
    } else {
      let invalid = false
      if (validation) {
        invalid = !validation.tester.test(value)
        let invalidText = ''
        if (invalid) {
          invalidText = i18n(validation.notification)
        }
        control.exception = invalidText
      }
      this.setState({ value, invalid })
    }
  }

  handleKeyDown(event) {
    switch (event.key) {
      case 'Enter':
        this.createValue()
        break

      case 'Backspace':
        this.deleteLastValue()
        break

      case 'Escape':
        this.cancelValue()
        break
    }
  }

  handleBlur() {
    this.createValue()
  }

  deleteLastValue() {
    const { value } = this.state
    if (!value) {
      const { control, handleChange } = this.props
      const { active = [] } = control
      const inx = active.length - 1
      if (inx >= 0) {
        active.splice(inx, 1)
        handleChange(control)
      }
    }
  }

  createValue() {
    const { control, handleChange } = this.props
    const { value, invalid } = this.state
    if (value && !invalid) {
      if (!Array.isArray(control.active)) {
        control.active = []
      }
      control.active.push(value)
      handleChange(control)
    }
    this.cancelValue()
  }

  cancelValue() {
    const { control } = this.props
    control.exception = ''
    this.setState({ value: '', invalid: false })
  }
}

export default ControlPanelValues
