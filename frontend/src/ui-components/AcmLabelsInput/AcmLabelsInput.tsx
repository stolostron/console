/* Copyright Contributors to the Open Cluster Management project */

import { FormGroup, Label, TextInput } from '@patternfly/react-core'
import { Fragment, useState, useRef, SetStateAction, ReactNode, useCallback, useMemo } from 'react'
import { useValidationContext } from '../AcmForm/AcmForm'

export type AcmLabelsInputProps<T> = {
  id: string
  label: string
  values: T[]
  addLabel: (input: string) => void
  removeLabel: (key: string) => void
  getLabelKey: (value: T) => string
  getLabelContent: (value: T) => ReactNode
  hidden?: boolean
  placeholder?: string
  isDisabled?: boolean
  allowSpaces?: boolean
}

function clearInput(e: EventTarget | null, setInputValue: (value: SetStateAction<string | undefined>) => void) {
  const inputElement = e as HTMLInputElement
  setInputValue('')
  inputElement.value = ''
  setTimeout(() => (inputElement.value = ''), 0)
}

export function AcmLabelsInput<T = unknown>(props: AcmLabelsInputProps<T>) {
  const [inputValue, setInputValue] = useState<string>()
  const ValidationContext = useValidationContext()
  const inputRef: React.MutableRefObject<HTMLInputElement | null> = useRef(null)

  const { values, addLabel, removeLabel, getLabelKey, getLabelContent, allowSpaces } = props
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
          {values.map((value, index, { length }) => {
            const key = getLabelKey(value)
            return (
              <Label
                className="label-pill"
                key={key}
                style={{ margin: 2 }}
                onClose={(e) => {
                  removeLabel(key)
                  /* istanbul ignore next */
                  e.detail === 0 && inputRef.current?.focus() // only refocus on keyboard event, detail is 0 on key event
                }}
                closeBtnProps={{ id: `remove-${key}`, ref: index + 1 === length ? escapeRef : null }}
              >
                {getLabelContent(value)}
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
                    if (e.key === ' ' && allowSpaces) break

                    e.preventDefault()
                    e.stopPropagation()
                    // istanbul ignore else
                    if (inputValue) {
                      addLabel(inputValue)
                    }
                    clearInput(e.target, setInputValue)
                  }
                  break
                case 'Backspace':
                  /* istanbul ignore else */
                  if (!inputValue) {
                    /* istanbul ignore else */
                    if (escapeRef.current != undefined) {
                      escapeRef.current.focus()
                    }
                  }
                  break
              }
            }}
            onBlur={
              /* istanbul ignore next */
              (e) => {
                addLabel(e.target.value)
                clearInput(e.target, setInputValue)
              }
            }
          />
        </div>
      </FormGroup>
    </Fragment>
  )
}

export type AcmKubernetesLabelsInputProps = {
  value: Record<string, string> | undefined
  onChange: (labels: Record<string, string> | undefined) => void
} & Omit<AcmLabelsInputProps<string>, 'values' | 'addLabel' | 'removeLabel' | 'getLabelKey' | 'getLabelContent'>

function getKubernetesLabelKey(value: [string, string]) {
  return value[0]
}

function getKubernetesLabelContent(value: [string, string]) {
  let content = value[0]
  if (value[1]) {
    content += `=${value[1]}`
  }
  return content
}

export function AcmKubernetesLabelsInput(props: AcmKubernetesLabelsInputProps) {
  const { value, onChange, ...acmLabelInputProps } = props
  const values: [string, string][] = value ? Object.entries(value) : []

  const addKubernetesLabel = useCallback(
    (input: string) => {
      onChange(
        input
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
      )
    },
    [value, onChange]
  )

  const removeKubernetesLabel = useCallback(
    (key: string) => {
      const newLabels: Record<string, string> = { ...value }
      delete newLabels[key]
      onChange(newLabels)
    },
    [value, onChange]
  )

  return (
    <AcmLabelsInput<[string, string]>
      values={values}
      addLabel={addKubernetesLabel}
      removeLabel={removeKubernetesLabel}
      getLabelKey={getKubernetesLabelKey}
      getLabelContent={getKubernetesLabelContent}
      {...acmLabelInputProps}
    />
  )
}

export type AcmAnsibleTagsInputProps = {
  value: string | undefined
  onChange: (value: string) => void
} & Omit<AcmLabelsInputProps<string>, 'values' | 'addLabel' | 'removeLabel' | 'getLabelKey' | 'getLabelContent'>

function getAnsibleTag(value: string) {
  return value
}

export function AcmAnsibleTagsInput(props: AcmAnsibleTagsInputProps) {
  const { value, onChange, ...acmLabelInputProps } = props
  const values = useMemo(() => (value ? value.split(',') : []), [value])
  const updateValues = useCallback((values: string[]) => onChange(values.join(',')), [onChange])

  const addAnsibleTag = useCallback(
    (input: string) => {
      updateValues(
        input
          .split(',')
          .map((tag) => tag.trim())
          .filter((tag) => tag != '')
          .reduce(
            (values, label) => {
              return values.includes(label) ? values : [...values, label]
            },
            [...values]
          )
      )
    },
    [values, updateValues]
  )

  const removeAnsibleTag = useCallback(
    (key: string) => {
      updateValues(values.filter((v) => v !== key))
    },
    [values, updateValues]
  )

  return (
    <AcmLabelsInput<string>
      values={values}
      addLabel={addAnsibleTag}
      removeLabel={removeAnsibleTag}
      getLabelKey={getAnsibleTag}
      getLabelContent={getAnsibleTag}
      allowSpaces
      {...acmLabelInputProps}
    />
  )
}
