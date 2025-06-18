import {
    DescriptionListDescription,
    FormGroup,
    FormHelperText,
    HelperText,
    HelperTextItem,
    Split,
    TimePicker,
} from '@patternfly/react-core'
import { CheckIcon } from '@patternfly/react-icons'
import get from 'get-value'
import { Fragment, useContext } from 'react'
import set from 'set-value'
import { useData } from '../contexts/DataContext'
import { ItemContext } from '../contexts/ItemContext'
import { DisplayMode, useDisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, useID } from './Input'

export function WizTimeRange(props: InputCommonProps<string>) {
    const id = useID(props)
    const path = props.path ?? id

    const { update } = useData()
    const mode = useDisplayMode()
    const item = useContext(ItemContext)

    const value = get(item, path)

    const showValidation = false
    let error: string | undefined = undefined
    let validated: 'error' | undefined = undefined
    if (showValidation) {
        if (props.validation) {
            error = props.validation(value)
        }
        validated = error ? 'error' : undefined
    }

    if (props.hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        return (
            <Split hasGutter>
                <CheckIcon />
                <DescriptionListDescription>{props.label}</DescriptionListDescription>
            </Split>
        )
    }

    const showHelperText = (validated === 'error' && error) || (validated !== 'error' && props.helperText)
    const helperText = validated === 'error' ? error : props.helperText

    return (
        <Fragment>
            <FormGroup id={`${id}-form-group`} fieldId={id} isInline label={props.label} isRequired={props.required}>
                <TimePicker
                    id={`${id}-time-picker`}
                    key={id}
                    onChange={(value) => {
                        set(item, path, value)
                        update()
                    }}
                    label={props.label}
                    value={value}
                />
                {showHelperText && (
                    <FormHelperText>
                        <HelperText>
                            <HelperTextItem variant={validated}>{helperText}</HelperTextItem>
                        </HelperText>
                    </FormHelperText>
                )}
            </FormGroup>
        </Fragment>
    )
}
