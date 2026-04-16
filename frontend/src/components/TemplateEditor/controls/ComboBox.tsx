/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { useCallback, useRef, useState } from 'react'
import classNames from 'classnames'
import { Spinner } from '@patternfly/react-core'
import ControlPanelFormGroup from './FormGroup'
import TimesCircleIcon from '@patternfly/react-icons/dist/js/icons/times-circle-icon'
import CheckIcon from '@patternfly/react-icons/dist/js/icons/check-icon'
import set from 'lodash/set'
import get from 'lodash/get'
import uniq from 'lodash/uniq'
import invert from 'lodash/invert'
import noop from 'lodash/noop'
import { ControlPanelComboBoxProps, TemplateControl } from '../types'

type ComboBoxState = {
  isOpen: boolean
  isBlurred: boolean
  searchText: string | null
  sortToTop: string | null
  currentSelection?: string
  preselect?: boolean
  typedText?: string
  active?: unknown
  currentAvailable?: unknown[]
}

const initialComboState: ComboBoxState = {
  isOpen: false,
  isBlurred: false,
  searchText: null,
  sortToTop: null,
}

function comboBoxViewStatesEqual(a: ComboBoxState, b: ComboBoxState): boolean {
  return (
    a.isOpen === b.isOpen &&
    a.isBlurred === b.isBlurred &&
    a.searchText === b.searchText &&
    a.sortToTop === b.sortToTop &&
    a.currentSelection === b.currentSelection &&
    a.preselect === b.preselect &&
    a.typedText === b.typedText &&
    a.active === b.active &&
    a.currentAvailable === b.currentAvailable
  )
}

function deriveComboBoxState(props: ControlPanelComboBoxProps, state: ComboBoxState): Partial<ComboBoxState> {
  const { control, handleControlChange } = props
  const handleComboChange = (selectedItem: string) => {
    if (!control.disabled) {
      const next = (selectedItem || '').trim()
      control.active = next
      if (control.lastActive !== next) {
        control.lastActive = next
        handleControlChange()
      }
    }
  }
  const { active, available } = control as { active?: string; available?: string[] }
  const { currentSelection } = state
  let { isOpen, preselect, searchText } = state
  const { isBlurred, typedText } = state
  const setAvailableMap =
    (get(control, 'fetchAvailable.setAvailableMap') as ((c: TemplateControl) => void) | undefined) || noop

  if (searchText && searchText.length && !preselect) {
    if (currentSelection === undefined) {
      if (isBlurred) {
        const { userData = [] } = control as TemplateControl & { userData?: string[] }
        if (!userData.includes(searchText) && available && !(available as string[]).includes(searchText)) {
          control.active = searchText
          userData.push(searchText)
          set(control, 'userData', userData)
          setAvailableMap(control)
        }
        handleComboChange(searchText)
        searchText = null
        isOpen = false
      } else {
        isOpen = true
      }
    } else {
      handleComboChange(currentSelection)
      isOpen = false
      searchText = null
    }
  } else if (currentSelection !== undefined) {
    handleComboChange(currentSelection)
    searchText = null
    isOpen = false
    preselect = false
  } else if (isBlurred && !preselect) {
    handleComboChange(String((typedText as string | undefined) ?? active ?? ''))
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

function renderComboLabel(
  label: string,
  searchText: string | null,
  active: string,
  control: TemplateControl,
  simplified?: (value: string, c: TemplateControl) => string | undefined
) {
  const isCustom = control.userData && control.userData.includes(label)
  if (isCustom || searchText) {
    if (!searchText) {
      return <React.Fragment>{label}</React.Fragment>
    } else {
      const inx = label.toLowerCase().indexOf(searchText.toLowerCase())
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
    }
  } else {
    let title = simplified && simplified(label, control)
    let rowLabel = label
    if (control.availableInfo) {
      title = label
      rowLabel = control.availableInfo[label] as string
    }
    return (
      <div className="tf--list-box__menu-item-container">
        {title ? (
          <div>
            <div style={{ lineHeight: '14px', fontSize: '16px' }}>{title}</div>
            <div style={{ fontSize: '12px' }}>{rowLabel}</div>
          </div>
        ) : (
          <div style={{ lineHeight: '14px', fontSize: '16px' }}>{rowLabel}</div>
        )}
        {rowLabel === active && (
          <span className="tf-select__menu-item-icon">
            <CheckIcon aria-hidden />
          </span>
        )}
      </div>
    )
  }
}

export default function ControlPanelComboBox(props: ControlPanelComboBoxProps) {
  const { controlId, i18n, control, controlData, handleControlChange } = props
  const inputRef = useRef<HTMLInputElement | null>(null)
  const menuRef = useRef<HTMLDivElement | null>(null)
  const clearRef = useRef<HTMLDivElement | null>(null)
  const toggleRef = useRef<HTMLDivElement | null>(null)
  const menuClickRef = useRef(false)

  const [state, setState] = useState<ComboBoxState>(initialComboState)
  const derivedPartial = deriveComboBoxState(props, state)
  const merged: ComboBoxState = { ...state, ...derivedPartial }
  if (!comboBoxViewStatesEqual(state, merged)) {
    setState(merged)
  }
  const viewState = comboBoxViewStatesEqual(state, merged) ? state : merged

  const { isOpen, searchText, sortToTop } = viewState
  const {
    name,
    userData = [],
    availableMap,
    exception,
    hasReplacements,
    isRefetching,
    disabled,
    simplified,
  } = control as TemplateControl & {
    name: string
    userData?: string[]
    availableMap?: Record<string, string>
    hasReplacements?: boolean
    isRefetching?: boolean
  }
  const { isLoading } = control
  let {
    active,
    available = [],
    placeholder = '',
  } = control as {
    active?: string
    available?: string[]
    placeholder?: string
  }
  if (!placeholder) {
    placeholder = i18n('creation.enter.value', [name.toLowerCase()])
  }
  available = uniq([...userData, ...available])

  const commented = availableMap && !hasReplacements
  if (commented && availableMap) {
    const map = invert(availableMap) as Record<string, string>
    active = map[active as string] || active
  }

  let currentAvailable = available
  if (!isLoading && searchText && searchText.length) {
    const findText = searchText.toLowerCase()
    currentAvailable = available.filter((item) => {
      return item.toLowerCase().includes(findText)
    })
  } else if (sortToTop) {
    currentAvailable = [...currentAvailable]
    currentAvailable.sort((a, b) => {
      if (a.includes(sortToTop) && !b.includes(sortToTop)) {
        return -1
      } else if (!a.includes(sortToTop) && b.includes(sortToTop)) {
        return 1
      }
      return 0
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
  const toggleStyles = { height: isOpen ? '10%' : '100%' }
  const inputClasses = classNames({
    'pf-v6-c-form-control': true,
    input: true,
    disabled: disabled,
  })
  const aria = isOpen ? i18n('Close menu') : i18n('Open menu')
  const validated = exception ? 'error' : undefined
  let value = typeof searchText === 'string' ? searchText : active || ''
  const isCustom = userData.includes(value)
  value = (!isOpen && !searchText && !isCustom && simplified && simplified(value, control)) || value
  const cancelToggle = simplified && !(!isOpen && !searchText && !isCustom)

  const clickClear = useCallback(() => {
    setState((s) => ({ ...s, searchText: null }))
    control.active = ''
    control.lastActive = ''
    handleControlChange()
  }, [control, handleControlChange])

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

  const clickSelect = useCallback((label: string) => {
    setState((s) => ({ ...s, currentSelection: label, isOpen: false }))
  }, [])

  const pressSelect = useCallback(
    (label: string, e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        clickSelect(label)
      }
    },
    [clickSelect]
  )

  const clickToggle = useCallback(
    (e?: React.MouseEvent | null) => {
      if (e) {
        e.stopPropagation()
      }
      const clickedWithinClear =
        e && clearRef.current && clearRef.current.contains && clearRef.current.contains(e.target as Node)
      const clickedWithinToggle =
        e && toggleRef.current && toggleRef.current.contains && toggleRef.current.contains(e.target as Node)
      if (!(viewState.searchText || clickedWithinClear) || clickedWithinToggle) {
        const { simplified: simp } = control as { simplified?: (v: string, c: TemplateControl) => string | undefined }
        setState((preState) => {
          let { currentAvailable: ca, currentSelection, sortToTop: stt, searchText: st, isOpen: io } = preState
          io = !io
          if (!io) {
            ca = []
            currentSelection = undefined
            st = null
          } else if (inputRef.current?.value && !simp) {
            stt = inputRef.current.value
          }
          return {
            ...preState,
            currentAvailable: ca,
            currentSelection,
            sortToTop: stt,
            searchText: st,
            isOpen: io,
          }
        })
      }
    },
    [control, viewState.searchText]
  )

  const pressToggle = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        clickToggle(e as unknown as React.MouseEvent)
      } else if (e.key === 'Escape') {
        clickClear()
      }
    },
    [clickToggle, clickClear]
  )

  return (
    <React.Fragment>
      <div className="creation-view-controls-combobox">
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          {isLoading || isRefetching ? (
            <div className="creation-view-controls-singleselect-loading  pf-v6-c-form-control">
              <Spinner size="md" />
              <div>{active}</div>
            </div>
          ) : (
            <div id={`${controlId}-group`}>
              <div role="listbox" aria-label={i18n('Choose an item')} tabIndex={0} className="tf--list-box">
                <div
                  role="button"
                  className=""
                  tabIndex={0}
                  aria-label={aria}
                  aria-expanded={isOpen}
                  aria-haspopup="true"
                  data-toggle="true"
                  onClick={cancelToggle ? noop : () => clickToggle()}
                  onKeyPress={cancelToggle ? noop : pressToggle}
                >
                  <div className={inputClasses}>
                    <input
                      className="pf-v6-c-form-control"
                      aria-label={name || i18n('Options menu')}
                      spellCheck="false"
                      role="combobox"
                      disabled={disabled}
                      aria-controls={key}
                      aria-expanded="true"
                      autoComplete="off"
                      id={controlId}
                      placeholder={placeholder}
                      ref={inputRef}
                      style={validated === 'error' ? { borderBottomColor: 'red' } : undefined}
                      value={value}
                      onBlur={blur}
                      onKeyUp={pressUp}
                      onKeyDown={pressDown}
                      onFocus={(e) => {
                        if (!simplified) {
                          e.target.select()
                        }
                      }}
                      onClick={(evt) => {
                        if (commented && !searchText) {
                          setTimeout(() => {
                            const target = evt.target as HTMLInputElement
                            const { selectionStart: inx } = target
                            if (inx !== null && inx !== 0 && inx === target.selectionEnd) {
                              setState((s) => ({
                                ...s,
                                searchText: (availableMap && (availableMap[active as string] || active)) as string,
                              }))
                              target.setSelectionRange(inx, inx)
                            }
                          }, 0)
                        }
                      }}
                      onChange={(evt) => {
                        setState((s) => ({
                          ...s,
                          searchText: evt.currentTarget.value,
                          typedText: evt.currentTarget.value,
                        }))
                      }}
                      data-testid={`combo-${controlId}`}
                    />
                  </div>

                  {!disabled && (searchText || active) && (
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
                      style={toggleStyles}
                    >
                      <svg fillRule="evenodd" height="5" role="img" viewBox="0 0 10 5" width="10" aria-label={aria}>
                        <title>{i18n('Close menu')}</title>
                        <path d="M0 0l5 4.998L10 0z" />
                      </svg>
                    </div>
                  )}
                </div>
                {!disabled && isOpen && (
                  <div
                    className="pf-v6-c-menu pf-m-scrollable"
                    key={key}
                    id={key}
                    ref={menuRef}
                    role="presentation"
                    onMouseDown={() => {
                      menuClickRef.current = true
                    }}
                    onMouseUp={() => {
                      menuClickRef.current = false
                    }}
                  >
                    <div className="pf-v6-c-menu__content">
                      <ul role="listbox" aria-multiselectable="false" className="pf-v6-c-menu__list">
                        {items.map(({ label, id }) => (
                          <li key={label} className="pf-v6-c-menu__list-item" role="none">
                            <button
                              id={`${controlId}-item-${id}`}
                              type="button"
                              tabIndex={id === 0 ? 0 : -1}
                              className="pf-v6-c-menu__item"
                              role="option"
                              aria-selected={label === active}
                              onMouseDown={() => setState((s) => ({ ...s, preselect: true }))}
                              onClick={() => clickSelect(label)}
                              onKeyPress={(e) => pressSelect(label, e)}
                            >
                              <span className="pf-v6-c-menu__item-main">
                                <span className="pf-v6-c-menu__item-text">
                                  {renderComboLabel(label, searchText, String(active ?? ''), control, simplified)}
                                </span>
                              </span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
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
