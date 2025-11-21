/* Copyright Contributors to the Open Cluster Management project */
import { FormGroup } from '@patternfly/react-core'
import { PropsWithChildren } from 'react'
import { LabelHelp } from '../components/LabelHelp'
import { WizHelperText } from '../components/WizHelperText'
import { convertId, InputCommonProps } from './Input'

type WizFormGroupProps = InputCommonProps & {
  noHelperText?: boolean
}

export function WizFormGroup(props: PropsWithChildren<WizFormGroupProps>) {
  const { noHelperText } = props
  const id = convertId(props)

  return (
    <FormGroup
      id={`${id}-form-group`}
      key={`${id}-form-group`}
      fieldId={id}
      label={props.label}
      labelHelp={<LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />}
      isRequired={props.required}
    >
      {props.children}
      {!noHelperText && <WizHelperText {...props} />}
    </FormGroup>
  )
}
