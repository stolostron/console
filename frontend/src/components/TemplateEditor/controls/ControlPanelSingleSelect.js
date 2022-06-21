'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import { Select, SelectOption, SelectVariant, Spinner } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import get from 'lodash/get'

class ControlPanelSingleSelect extends React.Component {
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
    control.ref = ref
  }

  render() {
    const { open } = this.state
    const { controlId, i18n, control, handleChange } = this.props
    const {
      name,
      active = '',
      available = [],
      exception,
      disabled,
      fetchAvailable,
      isRefetching,
      isLoading,
      isFailed,
    } = control
    let { placeholder = '' } = control
    if (!placeholder) {
      if (isLoading) {
        placeholder = i18n(get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        placeholder = i18n('resource.error')
      } else if (available.length === 0) {
        placeholder = i18n(get(control, 'fetchAvailable.emptyDesc', 'resource.none'))
      }
    }
    const setOpen = (open) => {
      this.setState({ open })
    }
    const onChange = (value) => {
      if (control.active !== value) {
        control.active = value
        handleChange()
      }
    }
    const validated = exception ? 'error' : undefined
    const key = `${controlId}-${name}-${available.join('-')}`
    return (
      <React.Fragment>
        <div className="creation-view-controls-singleselect" ref={this.setControlRef.bind(this, control)}>
          <ControlPanelFormGroup controlId={controlId} control={control}>
            {isLoading || isRefetching ? (
              <div className="creation-view-controls-singleselect-loading  pf-c-form-control">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <div style={{ position: 'relative' }}>
                <Select
                  id={controlId}
                  key={key}
                  aria-labelledby={`${controlId}-label`}
                  spellCheck={false}
                  autoComplete="new-password"
                  isOpen={open}
                  onToggle={() => {
                    setOpen(!open)
                  }}
                  variant={SelectVariant.typeahead}
                  onSelect={(_event, value) => {
                    onChange(value)
                    setOpen(false)
                  }}
                  selections={active}
                  onClear={() => {
                    onChange(undefined)
                  }}
                  placeholderText={placeholder}
                  isDisabled={disabled}
                  data-testid={`select-${controlId}`}
                >
                  {available.map((item, inx) => {
                    /* eslint-disable-next-line react/no-array-index-key */
                    return <SelectOption key={inx} value={item} />
                  })}
                </Select>
                {fetchAvailable && !active && (
                  <div
                    style={{
                      position: 'absolute',
                      top: '6px',
                      right: '40px',
                      cursor: 'pointer',
                    }}
                    role="button"
                    tabIndex="0"
                    className="tf--list-box__refresh-icon"
                    type="button"
                    onClick={this.clickRefresh.bind(this)}
                    onKeyPress={this.clickRefresh.bind(this)}
                  >
                    <svg fillRule="evenodd" height="12" role="img" viewBox="0 0 12 12" width="12">
                      <title>Refresh</title>
                      <path
                        d="M8.33703191,2.28461538 L6.50516317,0.553494162 L7.02821674,3.11581538e-14 L9.9,2.71384343 L7.02748392,5.41285697 L6.50601674,4.85786795 L8.43419451,3.04615385 L4.95,3.04615385 C2.63677657,3.04615385 0.761538462,4.92139195 0.761538462,7.23461538 C0.761538462,9.54783882 2.63677657,11.4230769 4.95,11.4230769 C7.26322343,11.4230769 9.13846154,9.54783882 9.13846154,7.23461538 L9.9,7.23461538 C9.9,9.9684249 7.68380951,12.1846154 4.95,12.1846154 C2.21619049,12.1846154 0,9.9684249 0,7.23461538 C-1.77635684e-15,4.50080587 2.21619049,2.28461538 4.95,2.28461538 L8.33703191,2.28461538 Z"
                        id="restart"
                      ></path>
                    </svg>
                  </div>
                )}
              </div>
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

  clickRefresh(e) {
    e.preventDefault()
    e.stopPropagation()
    const { control } = this.props
    const { fetchAvailable } = control
    if (fetchAvailable) {
      const { refetch } = fetchAvailable
      if (typeof refetch === 'function') {
        refetch()
      }
    }
  }
}

export default ControlPanelSingleSelect
