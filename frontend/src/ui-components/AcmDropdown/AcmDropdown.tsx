/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useState } from 'react'
import { Label, LabelProps, TooltipPosition } from '@patternfly/react-core'
import {
  Dropdown,
  DropdownToggle,
  DropdownItem,
  DropdownPosition,
  KebabToggle,
  DropdownProps,
  DropdownSeparator,
} from '@patternfly/react-core/deprecated'
import { css } from '@emotion/css'
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
  separator?: boolean
  isDisabled?: boolean
  description?: string
}

const getStyles = (props: AcmDropdownProps) => {
  let backgroundColor: string | undefined = undefined
  if (!props.isKebab) {
    if (props.isDisabled) {
      backgroundColor = 'var(--pf-global--disabled-color--200)'
    } else if (!props.isDisabled && props.isPrimary) {
      backgroundColor = 'var(--pf-c-dropdown__toggle--BackgroundColor)'
    } else {
      backgroundColor = 'transparent'
    }
  }
  let color: string | undefined = 'var(--pf-global--primary-color--100)'
  if (props.isDisabled) {
    color = 'var(--pf-global--Color--100)'
  } else if (props.isPrimary) {
    color = 'var(--pf-global--Color--light-100)'
  } else if (props.isKebab) {
    color = undefined
  }
  return {
    button: css({
      '& button': {
        backgroundColor,
        '& span': {
          color,
        },
        '&:hover, &:focus': {
          '& span': {
            color: props.isKebab ? undefined : 'var(--pf-global--primary-color--100)',
          },
          '& span.pf-c-dropdown__toggle-text': {
            color: props.isPrimary ? 'var(--pf-global--Color--light-100)' : undefined,
          },
          '& span.pf-c-dropdown__toggle-icon': {
            color: props.isPrimary ? 'var(--pf-global--Color--light-100)' : undefined,
          },
        },
        '& span.pf-c-dropdown__toggle-text': {
          // centers dropdown text in plain dropdown button
          paddingLeft: props.isPlain ? '8px' : undefined,
        },
      },
    }),
    label: css({
      marginLeft: '8px',
    }),
  }
}

export function AcmDropdown(props: AcmDropdownProps) {
  const [isOpen, setOpen] = useState<boolean>(false)
  const classes = getStyles(props)

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
            <Fragment key={item.id}>
              {item.separator && <DropdownSeparator key="separator" />}
              <DropdownItem
                key={item.id}
                tooltip={item.tooltip}
                tooltipProps={{ position: item.tooltipPosition }}
                href={item.href}
                id={item.id}
                isAriaDisabled={item.isAriaDisabled}
                icon={item.icon}
                onClick={() => onSelect(item.id)}
                isDisabled={item.isDisabled}
                description={item.description}
              >
                {item.text}
                {item.label && item.labelColor && (
                  <Label className={classes.label} color={item.labelColor}>
                    {item.label}
                  </Label>
                )}
              </DropdownItem>
            </Fragment>
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
