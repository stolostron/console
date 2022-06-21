'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Select, SelectOption, SelectVariant, Spinner } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import get from 'lodash/get'

class ControlPanelMultiSelect extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  constructor(props) {
    super(props)
    this.state = {
      open: false,
    }
  }

  setControlRef = (control, ref) => {
    this.multiSelect = control.ref = ref
  }

  render() {
    const { open } = this.state
    const { controlId, i18n, control, handleChange } = this.props
    const { available = [], availableMap, exception, disabled, isLoading, isFailed } = control
    let { active, placeholder = '' } = control
    if (!active) {
      if (isLoading) {
        active = i18n(get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        active = i18n('resource.error')
      } else if (available.length === 0) {
        active = i18n(get(control, 'fetchAvailable.emptyDesc', 'resource.none'))
      } else {
        active = []
      }
    } else if (Array.isArray(active) && active.length > 0) {
      const activeKeys = []
      active.forEach((k) => {
        if (typeof availableMap === 'object' && availableMap[k]) {
          const { name: n } = availableMap[k]
          activeKeys.push(n || k)
        } else {
          activeKeys.push(k)
        }
      })
      placeholder = activeKeys.join(', ')
    }

    const setOpen = (open) => {
      this.setState({ open })
    }

    const onChange = (value) => {
      if (value) {
        if (active.includes(value)) {
          active = active.filter((item) => item !== value)
        } else {
          active = [...active, value]
        }
      } else {
        active = []
      }
      control.active = active
      handleChange()
    }

    this.options = available.map((item, inx) => {
      /* eslint-disable-next-line react/no-array-index-key */
      return <SelectOption key={inx} value={item} />
    })

    const onFilter = (evt) => {
      const textInput = get(evt, 'target.value', '')
      if (textInput === '') {
        return this.options
      } else {
        return this.options.filter((item) => {
          return item.props.value.toLowerCase().includes(textInput.toLowerCase())
        })
      }
    }

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div className="creation-view-controls-singleselect" ref={this.setControlRef.bind(this, control)}>
          <ControlPanelFormGroup controlId={controlId} control={control}>
            {isLoading ? (
              <div className="creation-view-controls-singleselect-loading">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <Select
                ariaLabelledBy={`${controlId}-label`}
                spellCheck={false}
                isOpen={open}
                onToggle={() => {
                  setOpen(!open)
                }}
                variant={SelectVariant.checkbox}
                onSelect={(_event, value) => {
                  onChange(value)
                }}
                selections={active}
                onClear={() => {
                  onChange(undefined)
                }}
                placeholderText={placeholder}
                isDisabled={disabled}
                onFilter={onFilter}
                hasInlineFilter
                data-testid={`multi-${controlId}`}
              >
                {this.options}
              </Select>
            )}
            {validated === 'error' ? (
              <div
                style={{
                  borderTop: '1.75px solid red',
                  paddingBottom: '6px',
                  maxWidth: '600px',
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

export default ControlPanelMultiSelect
