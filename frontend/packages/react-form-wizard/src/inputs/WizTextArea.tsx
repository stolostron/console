import { InputGroup, TextArea as PFTextArea, TextAreaProps, TextInput } from '@patternfly/react-core'
import { Fragment, useCallback, useRef, useState } from 'react'
import { WizTextDetail } from '..'
import { ClearInputButton } from '../components/ClearInputButton'
import { PasteInputButton } from '../components/PasteInputButton'
import { ShowSecretsButton } from '../components/ShowSecretsButton'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { getEnterPlaceholder, InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'
import useResizeObserver from '@react-hook/resize-observer'

export type WizTextAreaProps = InputCommonProps<string> & {
    label: string
    placeholder?: string
    secret?: boolean
    canPaste?: boolean
}

export function WizTextArea(props: WizTextAreaProps) {
    const { displayMode: mode, value, disabled, setValue, validated, hidden, id } = useInput(props)

    // Hide initially if a value is set
    const [showSecrets, setShowSecrets] = useState(!value)

    // Workaround for problem with PatternFly TextArea autoResize feature
    // scrollHeight is still 0 when this code runs in PatternFly
    const textAreaRef = useRef<HTMLTextAreaElement>(null)
    const [initialHeightSet, setInitialHeightSet] = useState(false)
    const setInitialHeight = useCallback(() => {
        const field = textAreaRef.current
        if (!initialHeightSet && field) {
            const parent = field.parentElement
            if (parent) {
                parent.style.setProperty('height', 'inherit')
                const computed = window.getComputedStyle(field)
                // Calculate the height
                const height =
                    parseInt(computed.getPropertyValue('border-top-width')) +
                    parseInt(computed.getPropertyValue('padding-top')) +
                    field.scrollHeight +
                    parseInt(computed.getPropertyValue('padding-bottom')) +
                    parseInt(computed.getPropertyValue('border-bottom-width'))
                parent.style.setProperty('height', `${height}px`)
                setInitialHeightSet(true)
            }
        }
    }, [initialHeightSet])
    useResizeObserver(textAreaRef, setInitialHeight)

    const onChange = useCallback<NonNullable<TextAreaProps['onChange']>>((_event, value) => setValue(value), [setValue])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        return <WizTextDetail id={id} path={props.path} label={props.label} secret={props.secret} />
    }

    const placeholder = getEnterPlaceholder(props)
    const canPaste = props.canPaste !== undefined ? props.canPaste : props.secret === true

    return (
        <WizFormGroup {...props} id={id} key={id}>
            <InputGroup>
                {value && !showSecrets && props.secret ? (
                    <TextInput id={id} value={value} validated={validated} type="password" readOnlyVariant="default" />
                ) : (
                    <PFTextArea
                        id={id}
                        placeholder={placeholder}
                        validated={validated}
                        value={value}
                        onChange={onChange}
                        type={!props.secret || showSecrets ? 'text' : 'password'}
                        spellCheck="false"
                        resizeOrientation="vertical"
                        autoResize
                        readOnlyVariant={props.readonly ? 'default' : undefined}
                        ref={textAreaRef}
                    />
                )}
                {!disabled && value !== '' && props.secret && (
                    <ShowSecretsButton showSecrets={showSecrets} setShowSecrets={setShowSecrets} />
                )}
                {canPaste && !disabled && value === '' && <PasteInputButton setValue={setValue} setShowSecrets={setShowSecrets} />}
                {canPaste && !disabled && value !== '' && !props.readonly && !props.disabled && (
                    <ClearInputButton
                        onClick={() => {
                            setValue('')
                            setShowSecrets(true)
                        }}
                    />
                )}
            </InputGroup>
        </WizFormGroup>
    )
}
