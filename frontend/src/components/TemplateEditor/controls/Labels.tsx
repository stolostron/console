/* Copyright Contributors to the Open Cluster Management project */
'use strict'

import React, { useState } from 'react'
import { TextInput, Label } from '@patternfly/react-core'
import ControlPanelFormGroup from './FormGroup'
import keyBy from 'lodash/keyBy'
import { ControlPanelBaseProps, TemplateControl } from '../types'

export const DNS_LABEL = '[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?'
export const PREFIX = `${DNS_LABEL}(?:\\.${DNS_LABEL})*/`
export const NAME_OR_VALUE = '[a-z0-9A-Z](?:[a-z0-9A-Z_.-]{0,61}[a-z0-9A-Z])?'
export const regex = new RegExp(`^((?:${PREFIX})?${NAME_OR_VALUE})=(${NAME_OR_VALUE})?$`)
export const KEY_CAPTURE_GROUP_INDEX = 1
export const VALUE_CAPTURE_GROUP_INDEX = 2

type Props = ControlPanelBaseProps & {
  handleChange: (control: TemplateControl) => void
}

export default function ControlPanelLabels({ controlId, i18n, control, controlData, handleChange }: Props) {
  const [value, setValue] = useState('')
  const [invalid, setInvalid] = useState<boolean | undefined>(undefined)

  const { active = [], exception } = control as { active?: { key: string; value: string }[]; exception?: string }
  const formatted = active.map(({ key, value: v }) => `${key}=${v}`)
  const validated = exception ? 'error' : undefined

  const cancelLabel = () => {
    control.exception = ''
    setValue('')
    setInvalid(false)
  }

  const handleDelete = (inx: number) => {
    const { active: a = [] } = control as { active?: { key: string; value: string }[] }
    a.splice(inx, 1)
    handleChange(control)
  }

  const createLabel = () => {
    const { active: a = [] } = control as { active?: { key: string; value: string }[] }
    if (value && !invalid) {
      const match = regex.exec(value)
      if (match) {
        a.push({
          key: match[KEY_CAPTURE_GROUP_INDEX] as string,
          value: (match[VALUE_CAPTURE_GROUP_INDEX] as string) || '',
        })
        control.active = a
        handleChange(control)
      }
    }
    cancelLabel()
  }

  const onTextChange = (_event: unknown, nextValue = '') => {
    const { active: a = [] } = control as { active?: { key: string; value: string }[] }
    if (nextValue.endsWith(',')) {
      const toAdd = nextValue.slice(0, -1)
      let nextInvalid = !regex.test(toAdd)
      let invalidText = ''
      if (nextInvalid) {
        invalidText = i18n('enter.add.label')
      } else {
        const match = regex.exec(toAdd)
        const map = keyBy(a, 'key')
        if (match && map[match[KEY_CAPTURE_GROUP_INDEX] as string]) {
          nextInvalid = true
          invalidText = i18n('enter.duplicate.key', [match[KEY_CAPTURE_GROUP_INDEX]])
        }
      }
      control.exception = invalidText
      if (!nextInvalid && toAdd) {
        const match = regex.exec(toAdd)
        if (match) {
          a.push({
            key: match[KEY_CAPTURE_GROUP_INDEX] as string,
            value: (match[VALUE_CAPTURE_GROUP_INDEX] as string) || '',
          })
          control.active = a
          handleChange(control)
        }
      }
      cancelLabel()
    } else {
      let nextInvalid = !regex.test(nextValue)
      let invalidText = ''
      if (nextInvalid) {
        invalidText = i18n('enter.add.label')
      } else {
        const match = regex.exec(nextValue)
        const map = keyBy(a, 'key')
        if (match && map[match[KEY_CAPTURE_GROUP_INDEX] as string]) {
          nextInvalid = true
          invalidText = i18n('enter.duplicate.key', [match[KEY_CAPTURE_GROUP_INDEX]])
        }
      }
      control.exception = invalidText
      setValue(nextValue)
      setInvalid(nextInvalid)
    }
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    switch (event.key) {
      case 'Enter':
        createLabel()
        break

      case 'Backspace':
        if (!value) {
          const { active: a = [] } = control as { active?: { key: string; value: string }[] }
          const inx = a.length - 1
          if (inx >= 0) {
            a.splice(inx, 1)
            handleChange(control)
          }
        }
        break

      case 'Escape':
        cancelLabel()
        break
    }
  }

  const handleBlur = () => {
    createLabel()
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
                placeholder={i18n('enter.add.label')}
                validated={validated}
                value={value}
                onBlur={handleBlur}
                onKeyDown={handleKeyDown}
                onChange={onTextChange}
                data-testid={`label-${controlId}`}
              />
            </div>
          </div>
        </ControlPanelFormGroup>
      </div>
    </React.Fragment>
  )
}
