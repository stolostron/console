'use strict'

/* eslint-disable react/no-unused-state, react/no-unused-prop-types, jsx-a11y/autocomplete-valid */

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
      const { value, branch } = searchList[currentSelection]
      if (!value) {
        searchText = branch
        currentSelection = undefined
      }
    }

    /////////////////////////////////////////////////////////////
    // search mode
    if (searchText && searchText.length) {
      // nothing selected, filter list
      if (currentSelection === undefined) {
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
      // get current list using indexes
      if (currentSelection !== undefined) {
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
    this.onDocClick = (event) => {
      const clickedOnToggle = this.parentRef && this.parentRef.contains(event.target)
      const clickedWithinMenu = this.menuRef && this.menuRef.contains && this.menuRef.contains(event.target)
      const clickedWithinClear = this.clearRef && this.clearRef.contains && this.clearRef.contains(event.target)
      const clickedWithinToggle = this.toggleRef && this.toggleRef.contains && this.toggleRef.contains(event.target)
      if (this.state.isOpen && !(clickedOnToggle || clickedWithinMenu || clickedWithinClear || clickedWithinToggle)) {
        this.setState({ isOpen: false })
      }
    }
  }

  componentDidMount() {
    document.addEventListener('mousedown', this.onDocClick)
  }

  componentWillUnmount() {
    document.removeEventListener('mousedown', this.onDocClick)
  }

  setParentRef = (ref) => {
    this.parentRef = ref
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
    const { controlId, control } = this.props
    const { name, availableMap = {}, exception, disabled } = control
    const { isOpen, active, currentAvailable, indexes, searchText } = this.state
    const currentActive = availableMap[active] ? `${active} - ${availableMap[active]}` : active

    const toggleClasses = classNames({
      'tf--list-box__menu-icon': true,
      'tf--list-box__menu-icon--open': isOpen,
    })

    const aria = isOpen ? 'Close menu' : 'Open menu'
    const key = `${controlId}-${name}-${currentAvailable
      .map(({ branch, instance }) => {
        return branch || instance
      })
      .join('-')}`
    const validated = exception ? 'error' : undefined
    const inputClasses = classNames({
      'pf-c-form-control': true,
      input: true,
      disabled: disabled,
    })
    return (
      <React.Fragment>
        <div className="creation-view-controls-treeselect">
          <ControlPanelFormGroup controlId={controlId} control={control}>
            <div id={controlId}>
              <div role="listbox" aria-label="Choose an item" tabIndex="0" className="tf--list-box">
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
                    className="pf-c-combo-control"
                    aria-label="ListBox input field"
                    ref={this.setParentRef}
                    spellCheck="false"
                    role="combobox"
                    aria-controls={key}
                    disabled={disabled}
                    aria-expanded="true"
                    autoComplete="new-password"
                    id={`${controlId}-input`}
                    placeholder=""
                    style={validated === 'error' ? { borderBottomColor: 'red' } : undefined}
                    value={searchText !== null ? searchText : currentActive}
                    onFocus={(e) => {
                      e.target.select()
                    }}
                    onKeyDown={this.pressPress.bind(this)}
                    onChange={(evt) => this.setState({ searchText: evt.currentTarget.value })}
                    data-testid={`tree-${controlId}`}
                  />
                  {!disabled && (
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
                </div>
                {!disabled && isOpen && (
                  <div className="tf--list-box__menu" key={key} id={key} ref={this.setMenuRef}>
                    {currentAvailable.map(({ branch, instance, indent = 0 }, inx) => {
                      const itemClasses = classNames({
                        'tf--list-box__menu-item': true,
                        'tf--list-box__menu-branch': branch,
                        searching: searchText,
                        open: inx < indexes.length,
                      })
                      const label = branch || instance
                      return (
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
                          onKeyPress={this.pressSelect.bind(this, inx)}
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

  pressPress(e) {
    if (e.key === 'Escape') {
      this.clickClear()
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

  pressSelect(inx, e) {
    if (e.key === 'Enter') {
      this.clickSelect(inx)
    }
  }

  clickSelect(inx) {
    this.setState({ currentSelection: inx })
  }

  pressClear(inx, e) {
    if (e && e.key === 'Enter') {
      this.clickClear()
    }
  }

  clickClear() {
    this.setState({ searchText: '' })
    const { control, handleChange } = this.props
    control.active = ''
    handleChange()
  }
}

export default ControlPanelTreeSelect
