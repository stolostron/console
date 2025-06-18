import {
    Button,
    DescriptionListDescription,
    DescriptionListGroup,
    DescriptionListTerm,
    Divider,
    InputGroup,
    TextInput as PFTextInput,
    InputGroupItem,
} from '@patternfly/react-core'
import { PlusCircleIcon, TrashIcon } from '@patternfly/react-icons'
import { Fragment } from 'react'
import { WizTextInput } from '..'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useStringContext } from '../contexts/StringContext'
import { getAddPlaceholder, InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export type WizStringsInputProps = InputCommonProps & {
    placeholder?: string
}

export function WizStringsInput(props: WizStringsInputProps) {
    const { displayMode: mode, value, setValue, id, hidden, required } = useInput(props)

    const values: string[] = Array.isArray(value) ? value : []

    const onNewKey = () => {
        values.push('')
        setValue(values)
    }

    const onDeleteKey = (index: number) => {
        values.splice(index, 1)
        setValue(values)
    }

    const { removeItemAriaLabel, actionAriaLabel } = useStringContext()

    if (hidden) {
        return <Fragment />
    }

    if (mode === DisplayMode.Details) {
        if (!values.length) return <Fragment />
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>
                    <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
                        {values.map((value, index) => {
                            if (!value) return <Fragment key={index} />
                            return <div key={index}>{value}</div>
                        })}
                    </div>
                </DescriptionListDescription>
            </DescriptionListGroup>
        )
    }

    return (
        <WizFormGroup {...props} id={id}>
            <div id={id} style={{ display: 'flex', flexDirection: 'column', rowGap: values.length ? 8 : 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
                    {values.map((_, index) => {
                        return (
                            <InputGroup key={index}>
                                <InputGroupItem>
                                    <WizTextInput
                                        id={`${id}-${index + 1}`}
                                        path={props.path + '.' + index.toString()}
                                        // onChange={(e) => onKeyChange(index, e)}
                                        required={required}
                                    />
                                </InputGroupItem>
                                <InputGroupItem>
                                    <Button
                                        variant="plain"
                                        isDisabled={props.required === true && values.length === 1}
                                        aria-label={removeItemAriaLabel}
                                        onClick={() => onDeleteKey(index)}
                                        style={{ alignSelf: 'start' }}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </InputGroupItem>
                            </InputGroup>
                        )
                    })}
                </div>
                {!values.length && <Divider />}
                <div>
                    <Button
                        id="add-button"
                        variant="link"
                        size="sm"
                        aria-label={actionAriaLabel}
                        onClick={onNewKey}
                        icon={<PlusCircleIcon />}
                    >
                        {getAddPlaceholder(props)}
                    </Button>
                </div>
            </div>
        </WizFormGroup>
    )
}

type StringsMapInputProps = WizStringsInputProps & {
    map?: (value: any) => string[]
    unmap?: (values: string[]) => any
}

export function StringsMapInput(props: StringsMapInputProps) {
    const { displayMode: mode, value, setValue, id, hidden } = useInput(props)

    let values: string[] = value
    if (props.map) values = props.map(values)
    else if (!values) values = []

    const onKeyChange = (index: number, newKey: string) => {
        values[index] = newKey
        let newValue = values
        if (props.unmap) newValue = props.unmap(values)
        setValue(newValue)
    }

    const onNewKey = () => {
        values.push('')
        let newValue = values
        if (props.unmap) newValue = props.unmap(values)
        setValue(newValue)
    }

    const onDeleteKey = (index: number) => {
        values.splice(index, 1)
        let newValue = values
        if (props.unmap) newValue = props.unmap(values)
        setValue(newValue)
    }

    const { removeItemAriaLabel, actionAriaLabel } = useStringContext()

    if (hidden) {
        return <Fragment />
    }

    if (mode === DisplayMode.Details) {
        if (!values.length) return <Fragment />
        return (
            <DescriptionListGroup>
                <DescriptionListTerm>{props.label}</DescriptionListTerm>
                <DescriptionListDescription id={id}>
                    <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
                        {values.map((value, index) => {
                            if (!value) return <Fragment key={index} />
                            return <div key={index}>{value}</div>
                        })}
                    </div>
                </DescriptionListDescription>
            </DescriptionListGroup>
        )
    }

    return (
        <WizFormGroup {...props} id={id}>
            <div id={id} style={{ display: 'flex', flexDirection: 'column', rowGap: values.length ? 8 : 4 }}>
                <div style={{ display: 'flex', flexDirection: 'column', rowGap: 8 }}>
                    {values.map((pair, index) => {
                        return (
                            <InputGroup key={index}>
                                <InputGroupItem isFill>
                                    <PFTextInput
                                        id={`${id}-${index + 1}`}
                                        value={pair}
                                        spellCheck="false"
                                        onChange={(_event, value) => onKeyChange(index, value)}
                                        required
                                    />
                                </InputGroupItem>
                                <InputGroupItem>
                                    <Button
                                        variant="plain"
                                        isDisabled={props.required === true && values.length === 1}
                                        aria-label={removeItemAriaLabel}
                                        onClick={() => onDeleteKey(index)}
                                        style={{ alignSelf: 'start' }}
                                    >
                                        <TrashIcon />
                                    </Button>
                                </InputGroupItem>
                            </InputGroup>
                        )
                    })}
                </div>
                {!values.length && <Divider />}
                <div>
                    <Button
                        id="add-button"
                        variant="link"
                        size="sm"
                        aria-label={actionAriaLabel}
                        onClick={onNewKey}
                        icon={<PlusCircleIcon />}
                    >
                        {getAddPlaceholder(props)}
                    </Button>
                </div>
            </div>
        </WizFormGroup>
    )
}
