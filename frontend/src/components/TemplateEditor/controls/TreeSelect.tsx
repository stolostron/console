/* Copyright Contributors to the Open Cluster Management project */
/* eslint-disable @typescript-eslint/ban-ts-comment -- legacy tree control types */
// @ts-nocheck
'use strict'

import React, { useCallback, useEffect, useRef, useState } from 'react'
import classNames from 'classnames'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import ControlPanelFormGroup from './FormGroup'
import cloneDeep from 'lodash/cloneDeep'
import get from 'lodash/get'
import { ControlPanelBaseProps } from '../types'

type TreeSelectState = {
  isOpen: boolean
  searchText: string | null
  isBlurred?: boolean
  currentSelection?: number | null
  searchList?: { value?: string; description?: string; branch?: string }[]
  indexes?: number[]
  currentAvailable?: TreeMenuRow[]
  branches?: number
  active?: string
}

type TreeMenuRow = { branch?: string; instance?: string; indent?: number }

type TreeNode = {
  label?: string
  children?: TreeNode[]
  value?: string
  description?: string
}

type Props = ControlPanelBaseProps & {
  handleChange: (evt?: { selectedItem: string }) => void
}

const initialTreeState: TreeSelectState = {
  isOpen: false,
  searchText: null,
}

function treeViewStatesEqual(a: TreeSelectState, b: TreeSelectState): boolean {
  return (
    a.isOpen === b.isOpen &&
    a.searchText === b.searchText &&
    a.isBlurred === b.isBlurred &&
    a.currentSelection === b.currentSelection &&
    a.branches === b.branches &&
    a.active === b.active &&
    JSON.stringify(a.indexes) === JSON.stringify(b.indexes) &&
    JSON.stringify(a.searchList) === JSON.stringify(b.searchList) &&
    JSON.stringify(a.currentAvailable) === JSON.stringify(b.currentAvailable)
  )
}

function addAvailableMapHelper(available: TreeNode[] = [], availableMap: Record<string, string>) {
  available.forEach(({ children, value, description }) => {
    if (children) {
      addAvailableMapHelper(children, availableMap)
    } else {
      availableMap[value] = description
    }
  })
}

function deriveTreeSelectState(props: Props, state: TreeSelectState): Partial<TreeSelectState> {
  const { control, handleChange } = props
  const handleTreeChange = (evt: { selectedItem: string }) => {
    control.active = evt.selectedItem
    handleChange(evt)
  }

  const { available = [] } = control
  const { branches = 0 } = state
  let { active } = control
  let { currentSelection, searchList, indexes = [], isOpen, searchText } = state
  const branchLabels: { branch: string; indent: number }[] = []
  let currentAvailable: TreeMenuRow[] = []

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
  if (searchText && searchText.length) {
    if (currentSelection === undefined) {
      if (isBlurred) {
        handleTreeChange({ selectedItem: searchText })
        searchText = null
        isOpen = false
      } else {
        searchList = []
        const findText = searchText.toLowerCase()
        const fillArray = (arry: TreeNode[], branchMatch: boolean, indent: number) => {
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
      const { value, description } = searchList[currentSelection]
      active = `${value}  # ${description}`
      handleTreeChange({ selectedItem: active })
      currentAvailable = []
      indexes = []
      isOpen = false
      searchText = null
    }
  } else {
    if (currentSelection !== undefined) {
      currentSelection -= branches
      if (currentSelection >= 0) {
        indexes = cloneDeep(indexes)
        indexes.push(currentSelection)
      } else {
        indexes = indexes.slice(0, currentSelection)
      }
    }

    let path = indexes.map((index) => `[${index}]`).join('.children')
    let ca: TreeNode | TreeNode[] = path ? get(available, path) : available
    ca = ca.children || ca
    let indent = 0
    if (Array.isArray(ca)) {
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
        ...ca.map((item) => {
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
      active = `${ca.value}  # ${ca.description}`
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

function renderTreeLabel(label: string, searchText: string | null) {
  const inx = searchText && searchText.length ? label.toLowerCase().indexOf(searchText.toLowerCase()) : -1
  if (inx >= 0 && searchText) {
    const parts = [
      label.substring(0, inx),
      label.substring(inx, inx + searchText.length),
      label.substring(inx + searchText.length),
    ]
    return (
      <React.Fragment>
        {parts[0]}
        <b>{parts[1]}</b>
        {parts[2]}
      </React.Fragment>
    )
  } else {
    return <React.Fragment>{label}</React.Fragment>
  }
}

export default function ControlPanelTreeSelect(props: Props) {
  const { controlId, control, controlData, i18n, handleChange } = props
  const inputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const clearRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLDivElement | null>(null)
  const menuClickRef = useRef(false)

  const [state, setState] = useState<TreeSelectState>(initialTreeState)
  const derivedPartial = deriveTreeSelectState(props, state)
  const merged: TreeSelectState = { ...state, ...derivedPartial }
  if (!treeViewStatesEqual(state, merged)) {
    setState(merged)
  }
  const viewState = treeViewStatesEqual(state, merged) ? state : merged

  useEffect(() => {
    control.availableMap = {}
    const { available, availableMap } = control as {
      available?: TreeNode[]
      availableMap: Record<string, string>
    }
    addAvailableMapHelper(available, availableMap)
    // Match class constructor: initialize map once
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const { name, exception, disabled } = control as { name?: string; exception?: string; disabled?: boolean }
  const availableMap = (control as { availableMap?: Record<string, string> }).availableMap || {}
  const { isOpen, active, currentAvailable = [], indexes = [], searchText } = viewState
  const currentActive = availableMap[active as string] ? `${active} - ${availableMap[active as string]}` : active

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
    'pf-v6-c-form-control': true,
    input: true,
    disabled: disabled,
  })

  const clickClear = useCallback(() => {
    setState((s) => ({ ...s, searchText: '' }))
    control.active = ''
    handleChange()
  }, [control, handleChange])

  const blur = useCallback(() => {
    if (!menuClickRef.current) {
      setState((s) => ({ ...s, isBlurred: true }))
    }
  }, [])

  const pressUp = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && viewState.searchText) {
        inputRef.current?.blur()
      }
    },
    [viewState.searchText]
  )

  const pressDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        clickClear()
      } else if (e.key === 'Tab') {
        setState((s) => ({ ...s, isBlurred: true }))
      }
    },
    [clickClear]
  )

  const clickToggle = useCallback(
    (e?: React.MouseEvent) => {
      if (e) {
        e.stopPropagation()
      }
      const clickedWithinClear =
        e && clearRef.current && clearRef.current.contains && clearRef.current.contains(e.target as Node)
      const clickedWithinToggle =
        e && toggleRef.current && toggleRef.current.contains && toggleRef.current.contains(e.target as Node)
      if (!(viewState.searchText || clickedWithinClear) || clickedWithinToggle) {
        setState((preState) => {
          let { currentAvailable: ca, currentSelection, searchText: st, indexes: idx, isOpen: io } = preState
          io = !io
          if (!io) {
            ca = []
            currentSelection = undefined
            st = null
            idx = []
          }
          return {
            ...preState,
            currentAvailable: ca,
            currentSelection,
            searchText: st,
            indexes: idx,
            isOpen: io,
          }
        })
      }
    },
    [viewState.searchText]
  )

  const pressToggle = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        clickToggle()
      } else if (e.key === 'Escape') {
        clickClear()
      }
    },
    [clickToggle, clickClear]
  )

  const clickSelect = useCallback((inx: number) => {
    setState((s) => ({ ...s, currentSelection: inx }))
  }, [])

  return (
    <React.Fragment>
      <div className="creation-view-controls-treeselect">
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          <div id={controlId}>
            <div role="listbox" aria-label={i18n('Choose an item')} tabIndex={0} className="tf--list-box">
              <div
                role="button"
                className={inputClasses}
                tabIndex={0}
                aria-label={aria}
                aria-expanded={isOpen}
                aria-haspopup="true"
                data-toggle="true"
                onClick={() => clickToggle()}
                onKeyPress={pressToggle}
              >
                <input
                  className="pf-v6-c-combo-control"
                  aria-label={name}
                  ref={inputRef}
                  spellCheck="false"
                  role="combobox"
                  aria-controls={key}
                  disabled={disabled}
                  onKeyUp={pressUp}
                  onKeyDown={pressDown}
                  onBlur={blur}
                  aria-expanded="true"
                  autoComplete="new-password"
                  id={`${controlId}-input`}
                  placeholder=""
                  style={validated === 'error' ? { borderBottomColor: 'red' } : undefined}
                  value={searchText !== null ? searchText : currentActive}
                  onFocus={(e) => {
                    e.target.select()
                  }}
                  onClick={(evt) => {
                    if (!searchText) {
                      setTimeout(() => {
                        const { target } = evt
                        const { selectionStart: inx } = target
                        if (inx !== 0 && inx === target.selectionEnd) {
                          setState((s) => ({
                            ...s,
                            searchText: active,
                          }))
                          evt.target.setSelectionRange(inx, inx)
                        }
                      }, 0)
                    }
                  }}
                  onChange={(evt) => {
                    setState((s) => ({ ...s, searchText: evt.currentTarget.value }))
                  }}
                  data-testid={`tree-${controlId}`}
                />
                {!disabled && (
                  // eslint-disable-next-line jsx-a11y/click-events-have-key-events
                  <div
                    role="button"
                    className="tf--list-box__selection"
                    tabIndex={0}
                    style={{ color: '#6a6e73' }}
                    title={i18n('Clear selected item')}
                    ref={clearRef}
                    onClick={clickClear}
                  >
                    <TimesCircleIcon aria-hidden />
                  </div>
                )}
                {!disabled && (
                  <div
                    role="button"
                    tabIndex={0}
                    className={toggleClasses}
                    ref={toggleRef}
                    onClick={() => clickToggle()}
                    onKeyPress={pressToggle}
                  >
                    <svg fillRule="evenodd" height="5" role="img" viewBox="0 0 10 5" width="10" aria-label={aria}>
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
                  ref={menuRef}
                  onMouseDown={() => {
                    menuClickRef.current = true
                  }}
                  onMouseUp={() => {
                    menuClickRef.current = false
                  }}
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
                        tabIndex={0}
                        style={{
                          textIndent: `${indent}px`,
                          whiteSpace: 'pre',
                        }}
                        onClick={() => clickSelect(inx)}
                      >
                        {renderTreeLabel(label, searchText)}
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
