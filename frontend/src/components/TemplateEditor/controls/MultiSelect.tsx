/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React from 'react'
import { Spinner, SelectOption } from '@patternfly/react-core'
import { AcmSelectBase, SelectVariant } from '~/components/AcmSelectBase'
import type { ComponentType } from 'react'
import ControlPanelFormGroup from './FormGroup'
import get from 'lodash/get'
import { ControlPanelBaseProps, TemplateControl } from '../types'

const AcmSelectBaseAny = AcmSelectBase as ComponentType<Record<string, unknown>>

type Props = ControlPanelBaseProps & {
  handleChange: () => void
}

export default function ControlPanelMultiSelect({ controlId, i18n, control, controlData, handleChange }: Props) {
  const {
    available = [],
    availableMap,
    exception,
    disabled,
    isLoading,
    isFailed,
  } = control as {
    available?: string[]
    availableMap?: Record<string, { name?: string }>
    exception?: string
    disabled?: boolean
    isLoading?: boolean
    isFailed?: boolean
  }
  let { active, placeholder = '' } = control as { active?: string[] | string; placeholder?: string }
  if (!active) {
    if (isLoading) {
      active = get(control, 'fetchAvailable.loadingDesc', i18n('resource.loading')) as string
    } else if (isFailed) {
      active = i18n('resource.error')
    } else if (available.length === 0) {
      active = get(control, 'fetchAvailable.emptyDesc', i18n('resource.none')) as string
    } else {
      active = []
    }
  } else if (Array.isArray(active) && active.length > 0) {
    const activeKeys: string[] = []
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

  let selectionList: string[]
  let placeholderText = placeholder
  if (Array.isArray(active)) {
    selectionList = active
  } else if (typeof active === 'string') {
    placeholderText = placeholder || active
    selectionList = []
  } else {
    selectionList = []
  }

  const onChange = (value: string | undefined) => {
    let next: string[]
    if (Array.isArray(control.active)) {
      next = [...(control.active as string[])]
    } else {
      next = []
    }
    if (value) {
      if (next.includes(value)) {
        next = next.filter((item) => item !== value)
      } else {
        next = [...next, value]
      }
    } else {
      next = []
    }
    control.active = next
    handleChange()
  }

  const options = (available || []).map((item, inx) => {
    return <SelectOption key={inx} value={item} />
  })

  const validated = exception ? 'error' : undefined
  const selections = selectionList

  const setControlRef = (c: TemplateControl, ref: HTMLDivElement | null) => {
    c.ref = ref
  }

  return (
    <React.Fragment>
      <div className="creation-view-controls-singleselect" ref={(ref) => setControlRef(control, ref)}>
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          {isLoading ? (
            <div className="creation-view-controls-singleselect-loading">
              <Spinner size="md" />
              <div>{active as React.ReactNode}</div>
            </div>
          ) : (
            <AcmSelectBaseAny
              ariaLabelledBy={`${controlId}-label`}
              variant={SelectVariant.typeaheadCheckbox}
              onSelect={(value: string | string[]) => {
                const v = Array.isArray(value) ? value[0] : value
                onChange(v as string | undefined)
              }}
              selections={selections}
              onClear={() => {
                onChange(undefined)
              }}
              placeholderText={placeholderText}
              isDisabled={disabled}
              data-testid={`multi-${controlId}`}
            >
              {options}
            </AcmSelectBaseAny>
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
