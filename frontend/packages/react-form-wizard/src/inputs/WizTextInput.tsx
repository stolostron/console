import { InputGroup, InputGroupItem, TextInput as PFTextInput, TextInputProps } from '@patternfly/react-core'
import { Fragment, useCallback, useState } from 'react'
import { WizTextDetail } from '..'
import { ClearInputButton } from '../components/ClearInputButton'
import { PasteInputButton } from '../components/PasteInputButton'
import { ShowSecretsButton } from '../components/ShowSecretsButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, getEnterPlaceholder, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export type WizTextInputProps = InputCommonProps<string> & {
    placeholder?: string
    secret?: boolean
    canPaste?: boolean
}

export function WizTextInput(props: WizTextInputProps) {
    const { displayMode: mode, value, setValue, disabled, validated, hidden, id } = useInput(props)
    const [showSecrets, setShowSecrets] = useState(false)

    const onChange = useCallback<NonNullable<TextInputProps['onChange']>>((_event, value) => setValue(value), [setValue])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        return <WizTextDetail id={id} path={props.path} label={props.label} secret={props.secret} />
    }

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
            {!disabled && value !== '' && props.secret && <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />}
            {canPaste && !disabled && value === '' && <PasteInputButton setValue={setValue} setShowSecrets={setShowSecrets} />}
            {canPaste && !disabled && value !== '' && !props.readonly && !props.disabled && (
                <ClearInputButton onClick={() => setValue('')} />
            )}
        </InputGroup>
    )

    return props.label ? (
        <WizFormGroup {...props} id={id}>
            {inputGroup}
        </WizFormGroup>
    ) : (
        inputGroup
    )
}
