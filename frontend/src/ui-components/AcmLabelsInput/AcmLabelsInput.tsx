/* Copyright Contributors to the Open Cluster Management project */

import { FormGroup, Label, TextInput } from '@patternfly/react-core'
import { Fragment, useState, useRef, SetStateAction } from 'react'
import { useValidationContext } from '../AcmForm/AcmForm'

export interface AcmLabelInputProps<T> {
  id: string
  label: string
  value: T | undefined
  addLabel: (key: string, value: T) => T
  removeLabel: (key: string, value: T | undefined) => T | undefined
  getLabelString: (value: T) => string[]
  onChange: (labels: T | undefined) => void
  buttonLabel: string
  hidden?: boolean
  placeholder?: string
  isDisabled?: boolean
}

export function AcmLabelsInput<T = unknown>(props: AcmLabelInputProps<T>) {
  const [inputValue, setInputValue] = useState<string>()
  const ValidationContext = useValidationContext()
  const inputRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null)

  const { value, removeLabel, addLabel, getLabelString, onChange } = props
  const escapeRef = useRef<HTMLInputElement>()

  return (
    <Fragment>
      <FormGroup id={`${props.id}-label`} label={props.label} fieldId={props.id} hidden={props.hidden}>
        {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
        <div
          id="label-input-button"
          className="pf-c-form-control"
          style={{
            padding: 0,
            paddingTop: '1px',
            display: 'flex',
            alignItems: 'start',
            flexWrap: 'wrap',
            height: 'unset',
            minHeight: '36px',
            borderBottom: 'none',
          }}
          onClick={() => {
            setInputValue(undefined)
            /* istanbul ignore next */
            inputRef.current?.focus()
          }}
        >
          {value &&
            getLabelString(value).map((key, index, { length }) => {
              return (
                <Label
                  className="label-pill"
                  key={key}
                  style={{ margin: 2 }}
                  onClose={(e) => {
                    onChange(removeLabel(key, value))
                    /* istanbul ignore next */
                    e.detail === 0 && inputRef.current?.focus() // only refocus on keyboard event, detail is 0 on key event
                  }}
                  closeBtnProps={{ id: `remove-${key}`, ref: index + 1 === length ? escapeRef : null }}
                >
                  {key}
                </Label>
              )
            })}

          <TextInput
            ref={inputRef}
            style={{
              marginTop: '1px',
              borderTop: 'none',
              borderLeft: 'none',
              marginLeft: 0,
            }}
            id={props.id}
            placeholder={props.placeholder}
            isDisabled={/* istanbul ignore next */ props.isDisabled || ValidationContext.isReadOnly}
            onChange={(value) => {
              setInputValue(value)
            }}
            onKeyDown={(e) => {
              switch (e.key) {
                case ' ':
                case ',':
                case 'Enter':
                  {
                    e.preventDefault()
                    e.stopPropagation()
                    // istanbul ignore else
                    if (inputValue) {
                      onChange(addLabel(inputValue, value!))
                    }
                    clearInput(e.target, setInputValue)
                  }
                  break
                case 'Backspace':
                  /* istanbul ignore else */
                  if (!inputValue) {
                    const labels = document.querySelectorAll('.label-pill button') as unknown as HTMLButtonElement[]

                    /* istanbul ignore else */
                    if (labels && labels.length > 0 && escapeRef.current != undefined) {
                      // labels[labels.length - 1].focus()
                      escapeRef.current.focus()
                    }
                  }
                  break
              }
            }}
            onBlur={
              /* istanbul ignore next */
              (e) => {
                onChange(addLabel(e.target.value, value!))
                clearInput(e.target, setInputValue)
              }
            }
          />
        </div>
      </FormGroup>
    </Fragment>
  )
}

export function addLabelRecord(input: string, value: Record<string, string>) {
  /* istanbul ignore next */
  const newlabels = input
    .split(',')
    .join(' ')
    .split(' ')
    .map((label) => label.trim())
    .filter((label) => label !== '')
    .reduce(
      (value, label) => {
        const parts = label.split('=')
        if (parts.length === 1) {
          value[parts[0]] = ''
        } else {
          value[parts[0]] = parts.slice(1).join('=')
        }
        return value as Record<string, string>
      },
      { ...value }
    )
  return newlabels as Record<string, string>
}

function clearInput(e: EventTarget | null, setInputValue: (value: SetStateAction<string | undefined>) => void) {
  const inputElement = e as HTMLInputElement
  setInputValue('')
  inputElement.value = ''
  setTimeout(() => (inputElement.value = ''), 0)
}

export function addLabelString(input: string, value: string) {
  const filteredInput = input
    .split(',')
    .map((tag) => tag.trim())
    .filter((tag) => tag != '')
  /* istanbul ignore next */
  const newLabels = value?.split(',') || []
  filteredInput.forEach((finput) => {
    if (!newLabels.includes(finput)) {
      newLabels.push(finput)
    }
  })
  return newLabels?.join(',')
}

export function removeLabelRecord(tag: string, value: Record<string, string> | undefined) {
  /* istanbul ignore next */
  const keyArray = tag.split('=')
  const key = keyArray[0]
  const newLabels: Record<string, string> = { ...value }
  delete newLabels[key]
  return newLabels
}

export function removeLabelString(key: string, value: string | undefined) {
  /* istanbul ignore next */
  let newLabels = value?.split(',').filter((label) => label != key && label != '')
  if (newLabels && newLabels.length == 0) return undefined
  return newLabels?.join(',')
}

export function getLabelStringFromRecord(value: Record<string, string>) {
  return Object.keys(value).map((key) => {
    let resultString = key
    if (typeof value[key] === 'string' && value[key].trim() !== '') {
      resultString += `=${value[key]}`
    }
    return resultString
  })
}
