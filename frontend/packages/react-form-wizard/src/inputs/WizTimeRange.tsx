/* Copyright Contributors to the Open Cluster Management project */
import { FormGroup, FormHelperText, HelperText, HelperTextItem, TimePicker } from '@patternfly/react-core'
import get from 'get-value'
import { Fragment, useContext } from 'react'
import set from 'set-value'
import { useData } from '../contexts/DataContext'
import { ItemContext } from '../contexts/ItemContext'
import { useRandomID } from '../contexts/useRandomID'
import { convertId, InputCommonProps } from './Input'

export function WizTimeRange(props: InputCommonProps<string>) {
  const instanceId = useRandomID()
  const id =
    process.env.NODE_ENV === 'test' || (window as any).Cypress ? convertId(props) : `wiz-time-range-${instanceId}`
  const path = props.path ?? id

  const { update } = useData()
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
