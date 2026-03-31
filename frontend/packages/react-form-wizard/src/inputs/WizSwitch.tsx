/* Copyright Contributors to the Open Cluster Management project */
import { Stack, Switch as PFSwitch, SwitchProps } from '@patternfly/react-core'
import { Fragment, ReactNode, useCallback } from 'react'
import { WizHelperText } from '../components/WizHelperText'
import { Indented } from '../components/Indented'
import { LabelHelp } from '../components/LabelHelp'
import { InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export type WizSwitchProps = InputCommonProps & {
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

export function WizSwitch(props: WizSwitchProps) {
  const { value, setValue, hidden, id } = useInput(props)
  const onChange = useCallback<NonNullable<SwitchProps['onChange']>>((_event, value) => setValue(value), [setValue])

  if (hidden) return <Fragment />

  return (
    <Stack hasGutter>
      <Stack>
        <WizFormGroup {...props} id={id} label={props.title} noHelperText>
          <PFSwitch
            id={id}
            isChecked={getIsChecked(value)}
            onChange={onChange}
            label={
              <>
                {props.label} <LabelHelp id={id} labelHelp={props.labelHelp} labelHelpTitle={props.labelHelpTitle} />
              </>
            }
            value={value}
          />
        </WizFormGroup>
        <WizHelperText {...props} />
      </Stack>
      {value && <Indented paddingBottom={8}>{props.children}</Indented>}
    </Stack>
  )
}
