/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { useState } from 'react'
import { TextInput, Label } from '@patternfly/react-core'
import ControlPanelFormGroup from './FormGroup'
import { ControlPanelBaseProps, TemplateControl } from '../types'

type Props = ControlPanelBaseProps & {
  handleChange: (control: TemplateControl) => void
}

export default function ControlPanelValues({ controlId, control, controlData, i18n, handleChange }: Props) {
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState<boolean | undefined>(undefined)

  const {
    active = [],
    exception,
    placeholder,
    disabled,
  } = control as {
    active?: string[]
    exception?: string
    placeholder?: string
    disabled?: boolean
  }
  const formatted = active.filter((v) => v.length > 0)
  const validated = exception ? 'error' : undefined

  const handleDelete = (inx: number) => {
    const { active: a = [] } = control as { active?: string[] }
    a.splice(inx, 1)
    handleChange(control)
  }

  const cancelValue = () => {
    control.exception = ''
    setValue('')
    setInvalid(false)
  }

  const createValue = () => {
    if (value && !invalid) {
      if (!Array.isArray(control.active)) {
        control.active = []
      }
      ;(control.active as string[]).push(value)
      handleChange(control)
    }
    cancelValue()
  }

  const onTextChange = (_event: unknown, nextValue = '') => {
    const { validation } = control as { validation?: { tester: RegExp; notification: string } }
    if (nextValue.endsWith(',')) {
      const toAdd = nextValue.slice(0, -1)
      let nextInvalid = false
      if (validation && toAdd) {
        nextInvalid = !validation.tester.test(toAdd)
        control.exception = nextInvalid ? validation.notification : ''
      } else {
        control.exception = ''
      }
      if (toAdd && !nextInvalid) {
        if (!Array.isArray(control.active)) {
          control.active = []
        }
        ;(control.active as string[]).push(toAdd)
        handleChange(control)
      }
      cancelValue()
    } else {
      let nextInvalid = false
      if (validation) {
        nextInvalid = !validation.tester.test(nextValue)
        let invalidText = ''
        if (nextInvalid) {
          invalidText = validation.notification
        }
        control.exception = invalidText
      }
      setValue(nextValue)
      setInvalid(nextInvalid)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        createValue()
        break

      case 'Backspace':
        if (!value) {
          const { active: a = [] } = control as { active?: string[] }
          const inx = a.length - 1
          if (inx >= 0) {
            a.splice(inx, 1)
            handleChange(control)
          }
        }
        break

      case 'Escape':
        cancelValue()
        break
    }
  }

  const handleBlur = () => {
    createValue()
  }

  return (
    <React.Fragment>
      <div className="creation-view-controls-labels">
        <ControlPanelFormGroup i18n={i18n} controlId={controlId} control={control} controlData={controlData}>
          <div className="creation-view-controls-labels-container">
            {formatted.length !== 0 && (
              <div className="creation-view-controls-labels-tag-container">
                {formatted.map((label, inx) => {
                  return (
                    <Label key={label} onClose={() => handleDelete(inx)}>
                      {label}
                    </Label>
                  )
                })}
              </div>
            )}
            <div className="creation-view-controls-labels-edit-container">
              <TextInput
                id={controlId}
                placeholder={placeholder || i18n('Enter value')}
                validated={validated}
                value={value}
                isDisabled={disabled}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onChange={onTextChange}
                data-testid={`value-${controlId}`}
              />
            </div>
          </div>
        </ControlPanelFormGroup>
      </div>
    </React.Fragment>
  )
}
