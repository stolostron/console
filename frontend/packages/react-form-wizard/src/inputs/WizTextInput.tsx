/* Copyright Contributors to the Open Cluster Management project */
import { InputGroup, InputGroupItem, TextInput as PFTextInput, TextInputProps } from '@patternfly/react-core'
import { Fragment, useCallback, useRef, useState } from 'react'
import { ClearInputButton } from '../components/ClearInputButton'
import { PasteInputButton } from '../components/PasteInputButton'
import { ShowSecretsButton } from '../components/ShowSecretsButton'
import { useReviewStepOutlineId } from '../ReviewStep'
import { InputCommonProps, getEnterPlaceholder, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export type WizTextInputProps = InputCommonProps<string> & {
  placeholder?: string
  secret?: boolean
  canPaste?: boolean
}

export function WizTextInput(props: WizTextInputProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const outlineId = useReviewStepOutlineId()
  const { value, setValue, disabled, validated, hidden, id } = useInput(props, containerRef)
  const [showSecrets, setShowSecrets] = useState(false)

  const onChange = useCallback<NonNullable<TextInputProps['onChange']>>((_event, value) => setValue(value), [setValue])

  if (hidden) return <Fragment />

  const placeholder = getEnterPlaceholder(props)
  const canPaste = props.canPaste !== undefined ? props.canPaste : props.secret === true

  const inputGroup = (
    <InputGroup>
      <InputGroupItem isFill>
        <PFTextInput
          id={id}
          placeholder={placeholder}
          validated={validated}
          value={value}
          onChange={onChange}
          type={!props.secret || showSecrets ? 'text' : 'password'}
          isDisabled={disabled}
          spellCheck="false"
          readOnlyVariant={props.readonly ? 'default' : undefined}
        />
      </InputGroupItem>
      {!disabled && value !== '' && props.secret && (
        <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />
      )}
      {canPaste && !disabled && value === '' && (
        <PasteInputButton setValue={setValue} setShowSecrets={setShowSecrets} />
      )}
      {canPaste && !disabled && value !== '' && !props.readonly && !props.disabled && (
        <ClearInputButton onClick={() => setValue('')} />
      )}
    </InputGroup>
  )

  const content = props.label ? (
    <WizFormGroup {...props} id={id}>
      {inputGroup}
    </WizFormGroup>
  ) : (
    inputGroup
  )

  return (
    <div ref={containerRef} data-is-review-outline-target={id === outlineId || undefined}>
      {content}
    </div>
  )
}
