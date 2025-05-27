/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Spinner, SelectOption } from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../AcmSelectBase'
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
    const { controlId, i18n, control, controlData, handleChange } = this.props
    const { available = [], availableMap, exception, disabled, isLoading, isFailed } = control
    let { active, placeholder = '' } = control
    if (!active) {
      if (isLoading) {
        active = get(control, 'fetchAvailable.loadingDesc', i18n('resource.loading'))
      } else if (isFailed) {
        active = i18n('resource.error')
      } else if (available.length === 0) {
        active = get(control, 'fetchAvailable.emptyDesc', i18n('resource.none'))
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

    const validated = exception ? 'error' : undefined
    return (
      <React.Fragment>
        <div className="creation-view-controls-singleselect" ref={this.setControlRef.bind(this, control)}>
          <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
            {isLoading ? (
              <div className="creation-view-controls-singleselect-loading">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <AcmSelectBase
                ariaLabelledBy={`${controlId}-label`}
                variant={SelectVariant.typeaheadCheckbox}
                onSelect={(value) => {
                  onChange(value)
                }}
                selections={active}
                onClear={() => {
                  onChange(undefined)
                }}
                placeholderText={placeholder}
                isDisabled={disabled}
                data-testid={`multi-${controlId}`}
              >
                {this.options}
              </AcmSelectBase>
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
