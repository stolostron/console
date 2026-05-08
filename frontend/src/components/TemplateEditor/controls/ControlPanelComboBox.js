/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { useCallback, useMemo } from 'react'
import { Spinner, SelectOption } from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '../../AcmSelectBase'
import ControlPanelFormGroup from './ControlPanelFormGroup'
import get from 'lodash/get'
import uniq from 'lodash/uniq'

const ControlPanelComboBox = (props) => {
  const { controlId, i18n, control, controlData, handleControlChange } = props

  const setControlRef = useCallback(
    (ref) => {
      control.ref = ref
    },
    [control]
  )

  const {
    name,
    active = '',
    available = [],
    userData = [],
    exception,
    disabled,
    isRefetching,
    isLoading,
    isFailed,
    availableMap = {},
    availableInfo = {},
    simplified,
    creatable = true,
  } = control

  const onChange = useCallback(
    (value) => {
      if (control.disabled) return

      const typedValue = (value || '').trim()
      const userData = control.userData ?? []
      const isCustomValue = typedValue.length > 0 && !userData.includes(typedValue) && !available.includes(typedValue)

      if (isCustomValue) {
        control.active = typedValue
        control.userData = uniq([...userData, typedValue])
        get(control, 'fetchAvailable.setAvailableMap')?.(control)
      }

      const mappedValue =
        typedValue && typeof control.availableMap?.[typedValue] === 'string'
          ? control.availableMap[typedValue]
          : typedValue

      if (control.lastActive !== mappedValue) {
        control.active = mappedValue
        control.lastActive = mappedValue
        handleControlChange()
      }
    },
    [available, control, handleControlChange]
  )

  const uniqueAvailable = useMemo(() => uniq([...userData, ...available]), [available, userData])

  // Convert short active value to full display string for AcmSelectBase
  const activeDisplay = useMemo(() => {
    if (!active || Object.keys(availableMap).length === 0) return active
    return Object.keys(availableMap).find((key) => availableMap[key] === active) || active
  }, [active, availableMap])

  let { placeholder = '' } = control
  if (!placeholder) {
    if (isLoading) {
      placeholder = get(control, 'fetchAvailable.loadingDesc', i18n('resource.loading'))
    } else if (isFailed) {
      placeholder = i18n('resource.error')
    } else if (uniqueAvailable.length === 0) {
      placeholder = get(control, 'fetchAvailable.emptyDesc', i18n('resource.none'))
    } else {
      placeholder = i18n('creation.enter.value', [name.toLowerCase()])
    }
  }

  const validated = exception ? 'error' : undefined
  const key = `${controlId}-${name}`

  return (
    <React.Fragment>
      <div className="creation-view-controls-combobox" ref={setControlRef}>
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          {isLoading || isRefetching ? (
            <div className="creation-view-controls-combobox-loading  pf-v6-c-form-control">
              <Spinner size="md" />
              <div>{activeDisplay}</div>
            </div>
          ) : (
            <AcmSelectBase
              id={controlId}
              key={key}
              aria-labelledby={`${controlId}-label`}
              spellCheck={false}
              variant={SelectVariant.typeahead}
              onSelect={(value) => {
                onChange(value)
              }}
              selections={activeDisplay}
              onClear={() => {
                onChange(undefined)
              }}
              placeholder={placeholder}
              isDisabled={disabled}
              isScrollable
              maxHeight="200px"
              isCreatable={creatable}
              onTypeaheadInputCommit={onChange}
              inputProps={{ 'data-testid': controlId }}
            >
              {uniqueAvailable.map((item, inx) => {
                const customValue = userData.includes(item)
                const simplifiedLabel = !customValue ? simplified?.(item, control) : undefined
                const description = availableInfo[item] || (simplifiedLabel ? item : undefined)
                const optionLabel = availableInfo[item] ? item : simplifiedLabel || item
                return (
                  <SelectOption key={inx} value={item} description={description}>
                    {optionLabel}
                  </SelectOption>
                )
              })}
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

export default ControlPanelComboBox
