/* Copyright Contributors to the Open Cluster Management project */

import { useState } from 'react'
import {
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  Label,
  LabelProps,
  DropdownProps,
  TooltipPosition,
} from '@patternfly/react-core'
import { makeStyles } from '@mui/styles'
import { TooltipWrapper } from '../utils'

type Props = Omit<DropdownProps, 'toggle' | 'onSelect' | 'dropdownItems'>

export type AcmDropdownProps = Props & {
  dropdownItems: AcmDropdownItems[]
  text: string
  isDisabled?: boolean
  onSelect: (id: string) => void
  id: string
  toggle?: React.ReactNode
  tooltip?: string | React.ReactNode
  isKebab?: boolean
  onHover?: () => void
  isPlain?: boolean
  isPrimary?: boolean
  onToggle?: (isOpen?: boolean) => void
  tooltipPosition?: TooltipPosition
  label?: string | React.ReactNode
  labelColor?: LabelProps['color']
  dropdownPosition?: DropdownPosition
}

export type AcmDropdownItems = {
  id: string
  component?: string | React.ReactNode
  isAriaDisabled?: boolean
  tooltip?: string | React.ReactNode
  text: string | React.ReactNode
  href?: string
  icon?: React.ReactNode
  tooltipPosition?: TooltipPosition
  label?: string
  labelColor?: LabelProps['color']
}

const useStyles = makeStyles({
  button: {
    '& button': {
      backgroundColor: (props: AcmDropdownProps) => {
        if (!props.isKebab) {
          if (props.isDisabled) {
            return 'var(--pf-global--disabled-color--200)'
          } else if (!props.isDisabled && props.isPrimary) {
            return 'var(--pf-c-dropdown__toggle--BackgroundColor)'
          } else {
            return 'transparent'
          }
        }
        return undefined
      },
      '& span': {
        color: (props: AcmDropdownProps) => {
          if (props.isDisabled) {
            return 'var(--pf-global--Color--100)'
          } else if (props.isPrimary) {
            return 'var(--pf-global--Color--light-100)'
          } else if (props.isKebab) {
            return undefined
          }
          return 'var(--pf-global--primary-color--100)'
        },
      },
      '&:hover, &:focus': {
        '& span': {
          color: (props: AcmDropdownProps) => (props.isKebab ? undefined : 'var(--pf-global--primary-color--100)'),
        },
        '& span.pf-c-dropdown__toggle-text': {
          color: (props: AcmDropdownProps) => props.isPrimary && 'var(--pf-global--Color--light-100)',
        },
        '& span.pf-c-dropdown__toggle-icon': {
          color: (props: AcmDropdownProps) => props.isPrimary && 'var(--pf-global--Color--light-100)',
        },
      },
      '& span.pf-c-dropdown__toggle-text': {
        // centers dropdown text in plain dropdown button
        paddingLeft: (props: AcmDropdownProps) => {
          if (props.isPlain) {
            return '8px'
          }
          return undefined
        },
      },
    },
  },
  label: {
    marginLeft: '8px',
  },
})

export function AcmDropdown(props: AcmDropdownProps) {
  const [isOpen, setOpen] = useState<boolean>(false)
  const classes = useStyles(props)

  const onSelect = (id: string) => {
    props.onSelect(id)
    setOpen(false)
    const element = document.getElementById(props.id)
    /* istanbul ignore else */
    if (element) element.focus()
  }

  return (
    <TooltipWrapper showTooltip={!!props.tooltip} tooltip={props.tooltip} tooltipPosition={props.tooltipPosition}>
      <Dropdown
        className={classes.button}
        onMouseOver={props.onHover}
        position={props.dropdownPosition || DropdownPosition.right}
        dropdownItems={props.dropdownItems.map((item) => {
          return (
            <DropdownItem
              key={item.id}
              tooltip={item.tooltip}
              tooltipProps={{ position: item.tooltipPosition }}
              href={item.href}
              id={item.id}
              isAriaDisabled={item.isAriaDisabled}
              icon={item.icon}
              onClick={() => onSelect(item.id)}
            >
              {item.text}
              {item.label && item.labelColor && (
                <Label className={classes.label} color={item.labelColor}>
                  {item.label}
                </Label>
              )}
            </DropdownItem>
          )
        })}
        toggle={
          props.isKebab ? (
            <KebabToggle
              id={props.id}
              isDisabled={props.isDisabled}
              onToggle={() => {
                /* istanbul ignore next */
                if (props.onToggle) {
                  props.onToggle(!isOpen)
                }
                setOpen(!isOpen)
              }}
            />
          ) : (
            <DropdownToggle
              isPrimary={props.isPrimary}
              id={props.id}
              isDisabled={props.isDisabled}
              onToggle={() => {
                if (props.onToggle) {
                  props.onToggle(!isOpen)
                }
                setOpen(!isOpen)
              }}
            >
              {props.text}
            </DropdownToggle>
          )
        }
        isOpen={isOpen}
        isPlain={props.isPlain}
      />
    </TooltipWrapper>
  )
}
