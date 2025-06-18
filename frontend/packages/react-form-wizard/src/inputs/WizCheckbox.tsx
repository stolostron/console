import { CheckboxProps, Checkbox as PFCheckbox, Split, Stack } from '@patternfly/react-core'
import { CheckIcon } from '@patternfly/react-icons'
import { Fragment, ReactNode, useCallback } from 'react'
import { WizHelperText } from '../components/WizHelperText'
import { Indented } from '../components/Indented'
import { LabelHelp } from '../components/LabelHelp'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export type WizCheckboxProps = InputCommonProps & {
    children?: ReactNode
    title?: string
}

// isChecked prop needs to be a boolean. If value is a string need to get the boolean
function getIsChecked(value: any) {
    if (value === 'true') {
        return true
    } else if (value === 'false') {
        return false
    }
    return value
}

export function WizCheckbox(props: WizCheckboxProps) {
    const { displayMode: mode, value, setValue, hidden, id } = useInput(props)
    const onChange = useCallback<NonNullable<CheckboxProps['onChange']>>((_event, checked) => setValue(checked), [setValue])

    if (hidden) return <Fragment />

    if (mode === DisplayMode.Details) {
        if (!value) return <Fragment />
        return (
            <Fragment>
                <Split id={id}>
                    <CheckIcon style={{ paddingRight: 5 }} />
                    <div className="pf-v5-c-description-list__term" style={{ paddingLeft: 2 }}>
                        {props.label}
                    </div>
                </Split>
                {value && props.children}
            </Fragment>
        )
    }

    return (
        <Stack hasGutter>
            <Stack>
                <WizFormGroup {...props} id={id} label={props.title} noHelperText>
                    <PFCheckbox
                        id={id}
                        isChecked={getIsChecked(value)}
                        onChange={onChange}
                        label={
                            <>
                                {props.label} <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />
                            </>
                        }
                        value={value}
                        body={<WizHelperText {...props} />}
                    />
                </WizFormGroup>
            </Stack>
            {value && <Indented paddingBottom={8}>{props.children}</Indented>}
        </Stack>
    )
}
