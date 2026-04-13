/* Copyright Contributors to the Open Cluster Management project */
import { Card, CardBody, CardHeader, CardTitle, Gallery, Icon } from '@patternfly/react-core'
import { Fragment, ReactNode, useContext } from 'react'
import { useRandomID } from '../contexts/useRandomID'
import { InputCommonProps, useInput } from './Input'
import { WizFormGroup } from './WizFormGroup'
import { IRadioGroupContextState, RadioGroupContext } from './WizRadio'

type WizTilesProps = InputCommonProps & { children?: ReactNode }

// id: string
// label?: string
// path?: string
// readonly?: boolean
// disabled?: boolean
// required?: boolean
// hidden?: boolean
// labelHelp?: string
// labelHelpTitle?: string
// helperText?: string
// children?: ReactNode
export function WizTiles(props: WizTilesProps) {
  const { value, setValue, hidden, id } = useInput(props)

  const state: IRadioGroupContextState = {
    value: value,
    setValue: setValue,
    readonly: props.readonly,
    disabled: props.disabled,
  }

  if (hidden) return <Fragment />

  return (
    <RadioGroupContext.Provider value={state}>
      <WizFormGroup {...props} id={id}>
        <Gallery hasGutter>{props.children}</Gallery>
      </WizFormGroup>
    </RadioGroupContext.Provider>
  )
}

export function Tile(props: {
  id: string
  label: string
  value: string | number | boolean
  description?: string
  icon?: ReactNode
  children?: ReactNode
}) {
  const context = useContext(RadioGroupContext) || {}
  const isSelected = context.value === props.value
  const instanceId = useRandomID()
  const id = process.env.NODE_ENV === 'test' || (window as any).Cypress ? `tile-${props.id}` : `wiz-tile-${instanceId}`
  if (!props) return <Fragment />
  return (
    <Card
      id={id}
      isSelectable
      isSelected={isSelected}
      onClick={() => {
        context.setValue?.(props.value)
      }}
    >
      <CardHeader
        selectableActions={{
          selectableActionId: id,
          selectableActionAriaLabelledby: id,
          name: props.id,
          variant: 'single',
          isHidden: true,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <Icon size={'xl'}>{props.icon}</Icon>
          <CardTitle>{props.label}</CardTitle>
        </div>
      </CardHeader>
      {props.description && <CardBody>{props.description}</CardBody>}
    </Card>
  )
}
