'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import { Spinner } from '@patternfly/react-core'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon'
import set from 'lodash/set'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import invert from 'lodash/invert'

class ControlPanelComboBox extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleControlChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  static getDerivedStateFromProps(props, state) {
    const { control, handleControlChange } = props
    const handleComboChange = (selectedItem) => {
      if (!control.disabled) {
        control.active = (selectedItem || '').trim()
        if (control.lastActive !== control.active) {
          control.lastActive = control.active
          handleControlChange()
        }
      }
    }
    const { active } = control
    const { currentSelection } = state
    let { isOpen, preselect, searchText } = state
    const { isBlurred, typedText } = state

    /////////////////////////////////////////////////////////////
    // search mode
    if (searchText && searchText.length && !preselect) {
      // nothing selected, filter list
      if (currentSelection === undefined) {
        if (isBlurred) {
          const { userData = [] } = control
          if (!userData.includes(searchText)) {
            control.active = searchText
            userData.push(searchText)
            set(control, 'userData', userData)

            // if this combobox is fetched from server, make sure whatever user types in has an availableMap entry
            const setAvailableMap = get(control, 'fetchAvailable.setAvailableMap')
            if (setAvailableMap) {
              setAvailableMap(control)
            }
          }
          handleComboChange(searchText)
          searchText = null
          isOpen = false
        } else {
          isOpen = true
        }
      } else {
        // handle change
        handleComboChange(currentSelection)
        isOpen = false
        searchText = null
      }
    } else if (currentSelection !== undefined) {
      // handle change
      handleComboChange(currentSelection)
      searchText = null
      isOpen = false
      preselect = false
    } else if (isBlurred && !preselect) {
      handleComboChange(typedText)
      isOpen = false
    }
    return {
      active,
      currentSelection: undefined,
      isOpen,
      isBlurred: false,
      preselect,
      searchText,
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
      isBlurred: false,
      searchText: null,
      sortToTop: null,
    }
    this.onDocClick = this.onDocClick.bind(this)
  }

  componentDidMount() {
    document.addEventListener('click', this.onDocClick)
    document.addEventListener('touchstart', this.onDocClick)
  }

  componentWillUnmount() {
    document.removeEventListener('click', this.onDocClick)
    document.removeEventListener('touchstart', this.onDocClick)
  }

  setControlRef = (ref) => {
    this.controlRef = ref
  }

  setInputRef = (ref) => {
    this.inputRef = ref
  }

  setMenuRef = (ref) => {
    this.menuRef = ref
  }

  setClearRef = (ref) => {
    this.clearRef = ref
  }

  setToggleRef = (ref) => {
    this.toggleRef = ref
  }

  render() {
    const { isOpen, searchText, sortToTop } = this.state
    const { controlId, i18n, control } = this.props
    const {
      name,
      userData = [],
      availableMap,
      exception,
      hasReplacements,
      isFailed,
      fetchAvailable,
      isRefetching,
      disabled,
      simplified,
      describe,
    } = control
    let { isLoading } = control
    let { active, available = [], placeholder = '' } = control
    let loadingMsg
    if (fetchAvailable) {
      if (isLoading) {
        loadingMsg = i18n(get(control, 'fetchAvailable.loadingDesc', 'resource.loading'))
      } else if (isFailed) {
        placeholder = i18n('resource.error')
      } else if (available.length === 0) {
        placeholder = placeholder || i18n(get(control, 'fetchAvailable.emptyDesc', 'resource.empty'))
      }
    } else if (isLoading) {
      loadingMsg = i18n('creation.loading.values', [name.toLowerCase()])
    }
    if (!placeholder) {
      placeholder = i18n('creation.enter.value', [name.toLowerCase()])
    }
    available = uniq([...userData, ...available])

    // when available map has descriptions of choices
    // ex: instance types have # cpu's etc
    if (availableMap && !hasReplacements) {
      const map = invert(availableMap)
      active = map[active] || active
    }

    // if active was preset by loading an existing resource
    // initialize combobox to that value
    if (active && available.length === 0) {
      available.push(active)
      if (isLoading) {
        available.push(loadingMsg)
      } else if (isFailed) {
        available.push(placeholder)
      }
      isLoading = false
    }

    let currentAvailable = available
    if (!isLoading && searchText && searchText.length) {
      const findText = searchText.toLowerCase()
      currentAvailable = available.filter((item) => {
        return item.toLowerCase().includes(findText)
      })
    } else if (sortToTop) {
      currentAvailable.sort((a, b) => {
        if (a.includes(sortToTop) && !b.includes(sortToTop)) {
          return -1
        } else if (!a.includes(sortToTop) && b.includes(sortToTop)) {
          return 1
        }
      })
    }
    const items = currentAvailable.map((label, inx) => {
      return { label, id: inx }
    })
    const key = `${controlId}-${name}-${active}`
    const toggleClasses = classNames({
      'tf--list-box__menu-icon': true,
      'tf--list-box__menu-icon--open': isOpen,
    })
    const inputClasses = classNames({
      'pf-c-form-control': true,
      input: true,
      disabled: disabled,
    })
    const aria = isOpen ? 'Close menu' : 'Open menu'
    const validated = exception ? 'error' : undefined
    let value = typeof searchText === 'string' ? searchText : active || ''
    const isCustom = userData.includes(value)
    value = (!isOpen && !searchText && !isCustom && simplified && simplified(value, control)) || value
    const cancelToggle = simplified && !(!isOpen && !searchText && !isCustom)
    const noop = () => {}

    return (
      <React.Fragment>
        <div className="creation-view-controls-combobox">
          <ControlPanelFormGroup controlId={controlId} control={control}>
            {isLoading || isRefetching ? (
              <div className="creation-view-controls-singleselect-loading  pf-c-form-control">
                <Spinner size="md" />
                <div>{active}</div>
              </div>
            ) : (
              <div id={`${controlId}-group`} ref={this.setControlRef}>
                <div role="listbox" aria-label="Choose an item" tabIndex="0" className="tf--list-box">
                  <div
                    role="button"
                    className=""
                    tabIndex="0"
                    type="button"
                    aria-label={aria}
                    aria-expanded={isOpen}
                    aria-haspopup="true"
                    data-toggle="true"
                    onClick={cancelToggle ? noop : this.clickToggle.bind(this)}
                    onKeyPress={cancelToggle ? noop : this.pressToggle.bind(this)}
                  >
                    <div className={inputClasses}>
                      <input
                        className="pf-c-combo-control pf-c-form-control"
                        aria-label="ListBox input field"
                        spellCheck="false"
                        role="combobox"
                        disabled={disabled}
                        aria-controls={key}
                        aria-expanded="true"
                        autoComplete="off"
                        id={controlId}
                        placeholder={placeholder}
                        ref={this.setInputRef}
                        style={validated === 'error' ? { borderBottomColor: 'red' } : undefined}
                        value={value}
                        onBlur={this.blur.bind(this)}
                        onKeyUp={this.pressUp.bind(this)}
                        onKeyDown={this.pressDown.bind(this)}
                        onFocus={(e) => {
                          if (!simplified) {
                            e.target.select()
                          }
                        }}
                        onChange={(evt) => {
                          this.setState({
                            searchText: evt.currentTarget.value,
                            typedText: evt.currentTarget.value,
                          })
                        }}
                        data-testid={`combo-${controlId}`}
                      />
                    </div>
                    {!disabled && (searchText || active) && (
                      <div
                        role="button"
                        className="tf--list-box__selection"
                        tabIndex="0"
                        style={{ color: '#6a6e73' }}
                        title="Clear selected item"
                        ref={this.setClearRef}
                        onClick={this.clickClear.bind(this)}
                        onKeyPress={this.pressClear.bind(this)}
                      >
                        <TimesCircleIcon aria-hidden />
                      </div>
                    )}
                    {!disabled && (
                      <div
                        role="button"
                        tabIndex="0"
                        className={toggleClasses}
                        ref={this.setToggleRef}
                        onClick={this.clickToggle.bind(this)}
                        onKeyPress={this.pressToggle.bind(this)}
                      >
                        <svg
                          fillRule="evenodd"
                          height="5"
                          role="img"
                          viewBox="0 0 10 5"
                          width="10"
                          alt={aria}
                          aria-label={aria}
                        >
                          <title>Close menu</title>
                          <path d="M0 0l5 4.998L10 0z" />
                        </svg>
                      </div>
                    )}
                    {fetchAvailable && !(searchText || active) && (
                      <div
                        role="button"
                        tabIndex="0"
                        className="tf--list-box__refresh-icon"
                        type="button"
                        onClick={this.clickRefresh.bind(this)}
                        onKeyPress={this.clickRefresh.bind(this)}
                      >
                        <svg
                          fillRule="evenodd"
                          height="12"
                          role="img"
                          viewBox="0 0 12 12"
                          width="12"
                          alt={aria}
                          aria-label={aria}
                        >
                          <title>Refresh</title>
                          <path
                            d="M8.33703191,2.28461538 L6.50516317,0.553494162 L7.02821674,3.11581538e-14 L9.9,2.71384343 L7.02748392,5.41285697 L6.50601674,4.85786795 L8.43419451,3.04615385 L4.95,3.04615385 C2.63677657,3.04615385 0.761538462,4.92139195 0.761538462,7.23461538 C0.761538462,9.54783882 2.63677657,11.4230769 4.95,11.4230769 C7.26322343,11.4230769 9.13846154,9.54783882 9.13846154,7.23461538 L9.9,7.23461538 C9.9,9.9684249 7.68380951,12.1846154 4.95,12.1846154 C2.21619049,12.1846154 0,9.9684249 0,7.23461538 C-1.77635684e-15,4.50080587 2.21619049,2.28461538 4.95,2.28461538 L8.33703191,2.28461538 Z"
                            id="restart"
                          ></path>
                        </svg>
                      </div>
                    )}
                  </div>
                  {!disabled && isOpen && (
                    <div
                      role="button"
                      className="tf--list-box__menu"
                      key={key}
                      id={key}
                      ref={this.setMenuRef}
                      onMouseDown={() => {
                        this.menuClick = true
                      }}
                      onMouseUp={() => {
                        this.menuClick = false
                      }}
                      tabIndex="0"
                    >
                      {items.map(({ label, id }) => {
                        const itemClasses = classNames({
                          'tf--list-box__menu-item': true,
                          searching: searchText,
                        })
                        return (
                          <div
                            role="button"
                            key={label}
                            className={itemClasses}
                            id={`${controlId}-item-${id}`}
                            tabIndex="0"
                            onMouseDown={() => this.setState({ preselect: true })}
                            onClick={this.clickSelect.bind(this, label)}
                            onKeyPress={this.pressSelect.bind(this, label)}
                          >
                            {this.renderLabel(label, searchText, active, control, simplified, describe)}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  renderLabel(label, searchText, active, control, simplified, describe) {
    if (describe) {
      const desc = describe(label, control)
      return (
        <div className="tf--list-box__menu-item-container">
          <div style={{ lineHeight: '14px', fontSize: '16px' }}>{label}</div>
          <div style={{ fontSize: '12px' }}>{desc}</div>
          {label === active && (
            <span className="tf-select__menu-item-icon">
              <CheckIcon aria-hidden />
            </span>
          )}
        </div>
      )
    }
    const isCustom = control.userData && control.userData.includes(label)
    if (isCustom || searchText) {
      if (!searchText) {
        return <React.Fragment>{label}</React.Fragment>
      } else {
        const inx = label.toLowerCase().indexOf(searchText.toLowerCase())
        label = [label.substr(0, inx), label.substr(inx, searchText.length), label.substr(inx + searchText.length)]
        return (
          <React.Fragment>
            {label[0]}
            <b>{label[1]}</b>
            {label[2]}
          </React.Fragment>
        )
      }
    } else {
      const title = simplified && simplified(label, control)
      return (
        <div className="tf--list-box__menu-item-container">
          {title ? (
            <div>
              <div style={{ lineHeight: '14px', fontSize: '16px' }}>{title}</div>
              <div style={{ fontSize: '12px' }}>{label}</div>
            </div>
          ) : (
            <div style={{ lineHeight: '14px', fontSize: '16px' }}>{label}</div>
          )}
          {label === active && (
            <span className="tf-select__menu-item-icon">
              <CheckIcon aria-hidden />
            </span>
          )}
        </div>
      )
    }
  }

  blur() {
    if (!this.menuClick) {
      this.setState({ isBlurred: true })
    }
  }

  onDocClick(event) {
    const { isOpen } = this.state
    const clickedOnToggle = this.controlRef && this.controlRef.contains(event.target)
    const clickedWithinMenu = this.menuRef && this.menuRef.contains && this.menuRef.contains(event.target)
    if (isOpen && !(clickedOnToggle || clickedWithinMenu)) {
      this.setState({ isBlurred: true })
    }
  }

  pressUp(e) {
    if (e.key === 'Enter' && this.state.searchText) {
      this.inputRef.blur()
    }
  }

  pressDown(e) {
    if (e.key === 'Escape') {
      this.clickClear()
    } else if (e.key === 'Tab') {
      this.setState({ isBlurred: true })
    }
  }

  clickRefresh(e) {
    e.preventDefault()
    e.stopPropagation()
    const { control } = this.props
    const { fetchAvailable } = control
    if (fetchAvailable) {
      const { refetch } = fetchAvailable
      if (typeof refetch === 'function') {
        delete control.available
        refetch()
      }
      this.clickClear()
    }
  }

  pressToggle(e) {
    if (e.key === 'Enter') {
      this.clickToggle(e)
    } else if (e.key === 'Escape') {
      this.clickClear()
    }
  }

  clickToggle(e) {
    if (e) {
      e.stopPropagation()
    }
    const clickedWithinClear = e && this.clearRef && this.clearRef.contains && this.clearRef.contains(e.target)
    const clickedWithinToggle = e && this.toggleRef && this.toggleRef.contains && this.toggleRef.contains(e.target)
    if (!(this.state.searchText || clickedWithinClear) || clickedWithinToggle) {
      const { control } = this.props
      const { simplified } = control
      this.setState((preState) => {
        let { currentAvailable, currentSelection, sortToTop, searchText, isOpen } = preState
        isOpen = !isOpen
        if (!isOpen) {
          currentAvailable = []
          currentSelection = undefined
          searchText = null
        } else if (this.inputRef.value && !simplified) {
          sortToTop = this.inputRef.value
        }
        return {
          currentAvailable,
          currentSelection,
          sortToTop,
          searchText,
          isOpen,
        }
      })
    }
  }

  pressSelect(label, e) {
    if (e.key === 'Enter') {
      this.clickSelect(label)
    }
  }

  clickSelect(label) {
    this.setState({ currentSelection: label, isOpen: false })
  }

  pressClear(e) {
    if (e && e.key === 'Enter') {
      this.clickClear()
    }
  }

  clickClear() {
    this.setState({ searchText: null })
    const { control, handleControlChange } = this.props
    control.active = ''
    control.lastActive = ''
    handleControlChange()
  }
}

export default ControlPanelComboBox
