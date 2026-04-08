/* Copyright Contributors to the Open Cluster Management project */
import { FormGroup } from '@patternfly/react-core'
import { PropsWithChildren, useContext } from 'react'
import { LabelHelp } from '../components/LabelHelp'
import { WizHelperText } from '../components/WizHelperText'
import { ReviewPathPrefixSegmentsContext } from '../review/ReviewStepContexts'
import { ItemContext } from '../contexts/ItemContext'
import { buildReviewInputRegistrationPath, convertId, InputCommonProps } from './Input'

type WizFormGroupProps = InputCommonProps & {
  noHelperText?: boolean
}

export function WizFormGroup(props: PropsWithChildren<WizFormGroupProps>) {
  const { noHelperText } = props
  const reviewPathPrefixSegments = useContext(ReviewPathPrefixSegmentsContext)
  const item = useContext(ItemContext)
  const registrationPath = buildReviewInputRegistrationPath(reviewPathPrefixSegments, props.path, item)
  const id = process.env.NODE_ENV === 'test' || (window as any).Cypress ? convertId(props) : registrationPath

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
