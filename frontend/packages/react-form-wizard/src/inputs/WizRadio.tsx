/* Copyright Contributors to the Open Cluster Management project */
import { Radio as PfRadio } from '@patternfly/react-core'
import { createContext, Fragment, ReactNode, useContext } from 'react'
import { Indented } from '../components/Indented'
import { WizHelperText } from '../components/WizHelperText'
import { useRandomID } from '../contexts/useRandomID'
import { InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'

export interface IRadioGroupContextState {
  value?: any
  setValue?: (value: any) => void
  readonly?: boolean
  disabled?: boolean
  radioGroup?: string
}

export const RadioGroupContext = createContext<IRadioGroupContextState>({})
RadioGroupContext.displayName = 'RadioGroupContext'

export type WizRadioGroupProps = InputCommonProps & { children?: ReactNode }

export function WizRadioGroup(props: WizRadioGroupProps) {
  const { value, setValue, hidden, id } = useInput(props)

  const radioGroup = useRandomID()
  const state: IRadioGroupContextState = {
    value,
    setValue,
    readonly: props.readonly,
    disabled: props.disabled,
    radioGroup,
  }

  if (hidden) return <Fragment />

  return (
    <RadioGroupContext.Provider value={state}>
      <div id={id}>
        <WizFormGroup {...props} id={id} noHelperText>
          <WizHelperText {...props} />
          <div style={{ display: 'flex', flexDirection: 'column', rowGap: 12, paddingTop: 8, paddingBottom: 4 }}>
            {props.children}
          </div>
        </WizFormGroup>
      </div>
    </RadioGroupContext.Provider>
  )
}

export function Radio(props: {
  id: string
  label: string
  value: string | number | boolean | undefined
  description?: string
  children?: ReactNode
}) {
  const radioGroupContext = useContext(RadioGroupContext)
  return (
    <Fragment>
      <PfRadio
        id={radioGroupContext.radioGroup ? props.id + '-' + radioGroupContext.radioGroup : props.id}
        label={props.label}
        description={props.description}
        isChecked={radioGroupContext.value === props.value || (props.value === undefined && !radioGroupContext.value)}
        onChange={() => radioGroupContext.setValue?.(props.value)}
        isDisabled={radioGroupContext.disabled}
        readOnly={radioGroupContext.readonly}
        name={radioGroupContext.radioGroup ?? ''}
      />
      {radioGroupContext.value === props.value && <Indented paddingBottom={16}>{props.children}</Indented>}
    </Fragment>
  )
}
