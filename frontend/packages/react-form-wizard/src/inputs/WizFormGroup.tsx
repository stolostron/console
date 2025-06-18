import { PropsWithChildren } from 'react'
import { LabelHelp } from '../components/LabelHelp'
import { InputCommonProps, useID } from './Input'
import { FormGroup } from '@patternfly/react-core'
import { WizHelperText } from '../components/WizHelperText'

type WizFormGroupProps = InputCommonProps & {
    noHelperText?: boolean
}

export function WizFormGroup(props: PropsWithChildren<WizFormGroupProps>) {
    const { noHelperText } = props
    const id = useID(props)
    return (
        <FormGroup
            id={`${id}-form-group`}
            key={`${id}-form-group`}
            fieldId={id}
            label={props.label}
            isRequired={props.required}
            labelIcon={<LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />}
        >
            {props.children}
            {!noHelperText && <WizHelperText {...props} />}
        </FormGroup>
    )
}
