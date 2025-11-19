/* Copyright Contributors to the Open Cluster Management project */
import {
  Card,
  CardBody,
  CardHeader,
  CardTitle,
  DescriptionListDescription,
  DescriptionListGroup,
  DescriptionListTerm,
  Gallery,
  Icon,
} from '@patternfly/react-core'
import { Children, Fragment, isValidElement, ReactNode, useContext } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
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
  const { displayMode: mode, value, setValue, hidden, id } = useInput(props)

  const state: IRadioGroupContextState = {
    value: value,
    setValue: setValue,
    readonly: props.readonly,
    disabled: props.disabled,
  }

  if (hidden) return <Fragment />

  if (mode === DisplayMode.Details) {
    let label: string | undefined
    Children.forEach(props.children, (child) => {
      if (!isValidElement(child)) return
      if (child.type !== Tile) return
      if (child.props.value === value) {
        label = child.props.label
      }
    })
    if (label)
      return (
        <DescriptionListGroup>
          <DescriptionListTerm>{props.label}</DescriptionListTerm>
          <DescriptionListDescription id={id}>{label}</DescriptionListDescription>
        </DescriptionListGroup>
      )
    return <Fragment />
  }

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

  if (!props) return <Fragment />

  return (
    <Card id={`tile-${props.id}`} isSelectable isSelected={isSelected}>
      <CardHeader
        selectableActions={{
          selectableActionId: props.id,
          selectableActionAriaLabelledby: `tile-${props.id}`,
          name: props.id,
          variant: 'single',
          onChange: () => context.setValue?.(props.value),
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
