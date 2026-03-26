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
import { Children, Fragment, isValidElement, ReactNode, useContext, useRef } from 'react'
import { DisplayMode } from '../contexts/DisplayModeContext'
import { useReviewStepOutlineId } from '../ReviewStep'
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
  const containerRef = useRef<HTMLDivElement>(null)
  const outlineId = useReviewStepOutlineId()
  const { displayMode: mode, value, setValue, hidden, id } = useInput(props, containerRef)

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
        <div ref={containerRef} data-is-review-outline-target={id === outlineId || undefined}>
          <DescriptionListGroup>
            <DescriptionListTerm>{props.label}</DescriptionListTerm>
            <DescriptionListDescription id={id}>{label}</DescriptionListDescription>
          </DescriptionListGroup>
        </div>
      )
    return <Fragment />
  }

  return (
    <div ref={containerRef} data-is-review-outline-target={id === outlineId || undefined}>
      <RadioGroupContext.Provider value={state}>
        <WizFormGroup {...props} id={id}>
          <Gallery hasGutter>{props.children}</Gallery>
        </WizFormGroup>
      </RadioGroupContext.Provider>
    </div>
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
    <Card
      id={`tile-${props.id}`}
      isSelectable
      isSelected={isSelected}
      onClick={() => {
        context.setValue?.(props.value)
      }}
    >
      <CardHeader
        selectableActions={{
          selectableActionId: props.id,
          selectableActionAriaLabelledby: `tile-${props.id}`,
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
