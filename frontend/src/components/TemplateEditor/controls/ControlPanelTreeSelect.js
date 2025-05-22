/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import PropTypes from 'prop-types'
import classNames from 'classnames'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'

class ControlPanelTreeSelect extends React.Component {
  static propTypes = {
    control: PropTypes.object,
    controlId: PropTypes.string,
    handleChange: PropTypes.func,
    i18n: PropTypes.func,
  }

  static getDerivedStateFromProps(props, state) {
    const { control, handleChange } = props
    const handleTreeChange = (evt) => {
      control.active = evt.selectedItem
      handleChange(evt)
    }

    const { available = [] } = control
    const { branches = 0 } = state
    let { active } = control
    let { currentSelection, searchList, indexes = [], isOpen, searchText } = state
    const branchLabels = []
    let currentAvailable = []

    // clicked on a branch in search mode, search for that branch
    if (currentSelection !== undefined && searchText) {
      const { value, branch, description } = searchList[currentSelection]
      if (!value) {
        searchText = branch
        currentSelection = undefined
      } else if (value && description) {
        active = `${value}  # ${description}`
        handleTreeChange({ selectedItem: active })
        currentSelection = null
        currentAvailable = []
        indexes = []
        isOpen = false
        searchText = null
      }
    }

    const { isBlurred } = state
    /////////////////////////////////////////////////////////////
    // search mode
    if (searchText && searchText.length) {
      // nothing selected, filter list
      if (currentSelection === undefined) {
        if (isBlurred) {
          handleTreeChange({ selectedItem: searchText })
          searchText = null
          isOpen = false
        } else {
          searchList = []
          const findText = searchText.toLowerCase()
          const fillArray = (arry, branchMatch, indent) => {
            arry.forEach(({ label, children, value, description }) => {
              if (value) {
                const instance = `${value} - ${description}`
                if (branchMatch || instance.toLowerCase().indexOf(findText) !== -1) {
                  currentAvailable.push({ instance, indent })
                  searchList.push({ value, description })
                }
              } else if (children) {
                const beg = currentAvailable.length
                const bm = branchMatch || label.toLowerCase().indexOf(findText) !== -1
                fillArray(children, bm, indent + 20)
                if (currentAvailable.length > beg) {
                  currentAvailable.splice(beg, 0, { branch: label, indent })
                  searchList.splice(beg, 0, { branch: label })
                }
              }
            })
          }
          fillArray(available, false, 0)
          isOpen = true
        }
      } else {
        // handle change
        const { value, description } = searchList[currentSelection]
        active = `${value}  # ${description}`
        handleTreeChange({ selectedItem: active })
        currentAvailable = []
        indexes = []
        isOpen = false
        searchText = null
      }
    } else {
      /////////////////////////////////////////////////////////////
      // tree mode
      if (currentSelection !== undefined) {
        // get current list using indexes
        currentSelection -= branches
        if (currentSelection >= 0) {
          indexes = cloneDeep(indexes)
          indexes.push(currentSelection)
        } else {
          // clicked a branch label
          indexes = indexes.slice(0, currentSelection)
        }
      }

      let path = indexes.map((index) => `[${index}]`).join('.children')
      currentAvailable = path ? get(available, path) : available
      currentAvailable = currentAvailable.children || currentAvailable
      let indent = 0
      if (Array.isArray(currentAvailable)) {
        path = ''
        indexes.forEach((index) => {
          path += `[${index}]`
          let label = get(available, `${path}.label`)
          if (label) {
            label = `${label}`
            branchLabels.push({ branch: label, indent })
            path += '.children'
            indent += 20
          }
        })
        currentAvailable = [
          ...branchLabels,
          ...currentAvailable.map((item) => {
            if (item.label) {
              return { branch: item.label, indent }
            } else {
              return {
                instance: `${item.value} - ${item.description}`,
                indent,
              }
            }
          }),
        ]
      } else {
        // handle change
        active = `${currentAvailable.value}  # ${currentAvailable.description}`
        handleTreeChange({ selectedItem: active })
        currentAvailable = []
        indexes = []
        searchText = null
        isOpen = false
      }
    }
    return {
      active,
      currentAvailable,
      currentSelection: undefined,
      isBlurred: false,
      indexes,
      branches: branchLabels.length,
      isOpen,
      searchText,
      searchList,
    }
  }

  constructor(props) {
    super(props)
    this.state = {
      isOpen: false,
      searchText: null,
    }
    // create active map
    this.addAvailableMap(props)
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

  addAvailableMap(props) {
    const { control } = props
    control.availableMap = {}
    const { available, availableMap } = control
    this.addAvailableMapHelper(available, availableMap)
  }

  addAvailableMapHelper(available = [], availableMap) {
    available.forEach(({ children, value, description }) => {
      if (children) {
        this.addAvailableMapHelper(children, availableMap)
      } else {
        availableMap[value] = description
      }
    })
  }

  render() {
    const { controlId, control, controlData, i18n } = this.props
    const { name, availableMap = {}, exception, disabled } = control
    const { isOpen, active, currentAvailable, indexes, searchText } = this.state
    const currentActive = availableMap[active] ? `${active} - ${availableMap[active]}` : active

    const toggleClasses = classNames({
      'tf--list-box__menu-icon': true,
      'tf--list-box__menu-icon--open': isOpen,
    })

    const aria = isOpen ? i18n('Close menu') : i18n('Open menu')
    const key = `${controlId}-${name}-${currentAvailable
      .map(({ branch, instance }) => {
        return branch || instance
      })
      .join('-')}`
    const validated = exception ? 'error' : undefined
    const inputClasses = classNames({
      'pf-v5-c-form-control': true,
      input: true,
      disabled: disabled,
    })
    return (
      <React.Fragment>
        <div className="creation-view-controls-treeselect">
          <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
            <div id={controlId}>
              <div role="listbox" aria-label={i18n('Choose an item')} tabIndex="0" className="tf--list-box">
                <div
                  role="button"
                  className={inputClasses}
                  tabIndex="0"
                  type="button"
                  aria-label={aria}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-toggle="true"
                  onClick={this.clickToggle.bind(this)}
                  onKeyPress={this.pressToggle.bind(this)}
                >
                  <input
                    className="pf-v5-c-combo-control"
                    aria-label={name}
                    ref={this.setInputRef}
                    spellCheck="false"
                    role="combobox"
                    aria-controls={key}
                    disabled={disabled}
                    onKeyUp={this.pressUp.bind(this)}
                    onKeyDown={this.pressDown.bind(this)}
                    onBlur={this.blur.bind(this)}
                    aria-expanded="true"
                    autoComplete="new-password"
                    id={`${controlId}-input`}
                    placeholder=""
                    style={validated === 'error' ? { borderBottomColor: 'red' } : undefined}
                    value={searchText !== null ? searchText : currentActive}
                    onFocus={(e) => {
                      e.target.select()
                    }}
                    // if user is editing value, strip comment
                    onClick={(evt) => {
                      if (!searchText) {
                        setTimeout(() => {
                          const { target } = evt
                          const { selectionStart: inx } = target
                          if (inx !== 0 && inx === target.selectionEnd) {
                            this.setState({
                              searchText: active,
                            })
                            evt.target.setSelectionRange(inx, inx)
                          }
                        }, 0)
                      }
                    }}
                    onChange={(evt) => {
                      this.setState({ searchText: evt.currentTarget.value })
                    }}
                    data-testid={`tree-${controlId}`}
                  />
                  {!disabled && (
                    // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                    <div
                      role="button"
                      className="tf--list-box__selection"
                      tabIndex="0"
                      style={{ color: '#6a6e73' }}
                      title={i18n('Clear selected item')}
                      ref={this.setClearRef}
                      onClick={this.clickClear.bind(this)}
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
                        <title>{i18n('Close menu')}</title>
                        <path d="M0 0l5 4.998L10 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {!disabled && isOpen && (
                  // eslint-disable-next-line jsx-a11y/no-static-element-interactions
                  <div
                    className="tf--list-box__menu"
                    key={key}
                    id={key}
                    ref={this.setMenuRef}
                    onMouseDown={
                      /* istanbul ignore next */ () => {
                        this.menuClick = true
                      }
                    }
                    onMouseUp={
                      /* istanbul ignore next */ () => {
                        this.menuClick = false
                      }
                    }
                  >
                    {currentAvailable.map(({ branch, instance, indent = 0 }, inx) => {
                      const itemClasses = classNames({
                        'tf--list-box__menu-item': true,
                        'tf--list-box__menu-branch': branch,
                        searching: searchText,
                        open: inx < indexes.length,
                      })
                      const label = branch || instance
                      return (
                        // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                        <div
                          role="button"
                          key={label}
                          className={itemClasses}
                          id={`${controlId}-item-${inx}`}
                          tabIndex="0"
                          style={{
                            textIndent: `${indent}px`,
                            whiteSpace: 'pre',
                          }}
                          onClick={this.clickSelect.bind(this, inx)}
                        >
                          {this.renderLabel(label, searchText)}
                        </div>
                      )
                    })}
                  </div>
                )}
              </div>
            </div>
          </ControlPanelFormGroup>
        </div>
      </React.Fragment>
    )
  }

  renderLabel(label, searchText) {
    const inx = searchText && searchText.length && label.toLowerCase().indexOf(searchText.toLowerCase())
    if (inx !== null && inx >= 0) {
      label = [label.substr(0, inx), label.substr(inx, searchText.length), label.substr(inx + searchText.length)]
      return (
        <React.Fragment>
          {label[0]}
          <b>{label[1]}</b>
          {label[2]}
        </React.Fragment>
      )
    } else {
      return <React.Fragment>{label}</React.Fragment>
    }
  }

  blur() {
    if (!this.menuClick) {
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

  pressToggle(e) {
    if (e.key === 'Enter') {
      this.clickToggle()
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
      this.setState((preState) => {
        let { currentAvailable, currentSelection, searchText, indexes, isOpen } = preState
        isOpen = !isOpen
        if (!isOpen) {
          currentAvailable = []
          currentSelection = undefined
          searchText = null
          indexes = []
        }
        return {
          currentAvailable,
          currentSelection,
          searchText,
          indexes,
          isOpen,
        }
      })
    }
  }

  clickSelect(inx) {
    this.setState({ currentSelection: inx })
  }

  clickClear() {
    this.setState({ searchText: '' })
    const { control, handleChange } = this.props
    control.active = ''
    handleChange()
  }
}

export default ControlPanelTreeSelect
