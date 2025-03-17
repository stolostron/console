/* Copyright Contributors to the Open Cluster Management project */

import { Fragment, useState } from 'react'
import {
  Label,
  LabelProps,
  TooltipPosition,
  Dropdown,
  DropdownItem,
  Divider,
  MenuToggle,
  MenuToggleElement,
  DropdownProps,
} from '@patternfly/react-core'
import { css } from '@emotion/css'
import { TooltipWrapper } from '../utils'
import { EllipsisVIcon } from '@patternfly/react-icons'

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
      backgroundColor = 'var(--pf-v5-global--disabled-color--200)'
    } else if (!props.isDisabled && props.isPrimary) {
      backgroundColor = 'var(--pf-v5-c-dropdown__toggle--BackgroundColor)'
    } else {
      backgroundColor = 'transparent'
    }
  }
  let color: string | undefined = 'var(--pf-v5-global--primary-color--100)'
  if (props.isDisabled) {
    color = 'var(--pf-v5-global--Color--100)'
  } else if (props.isPrimary) {
    color = 'var(--pf-v5-global--Color--light-100)'
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
            color: props.isKebab ? undefined : 'var(--pf-v5-global--primary-color--100)',
          },
          '& span.pf-v5-c-dropdown__toggle-text': {
            color: props.isPrimary ? 'var(--pf-v5-global--Color--light-100)' : undefined,
          },
          '& span.pf-v5-c-dropdown__toggle-icon': {
            color: props.isPrimary ? 'var(--pf-v5-global--Color--light-100)' : undefined,
          },
        },
        '& span.pf-v5-c-dropdown__toggle-text': {
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
        onSelect={() => setOpen(!isOpen)}
        toggle={(toggleRef: React.Ref<MenuToggleElement>) =>
          props.isKebab ? (
            <MenuToggle
              id={props.id}
              isDisabled={props.isDisabled}
              onClick={() => {
                /* istanbul ignore next */
                if (props.onToggle) {
                  props.onToggle(!isOpen)
                }
                setOpen(!isOpen)
              }}
              ref={toggleRef}
              icon={<EllipsisVIcon />}
            ></MenuToggle>
          ) : (
            <MenuToggle
              variant={props.isPrimary ? 'primary' : undefined}
              id={props.id}
              isDisabled={props.isDisabled}
              onClick={() => {
                if (props.onToggle) {
                  props.onToggle(!isOpen)
                }
                setOpen(!isOpen)
              }}
            >
              {props.text}
            </MenuToggle>
          )
        }
        isOpen={isOpen}
        isPlain={props.isPlain}
      >
        {props.dropdownItems.map((item) => {
          return (
            <Fragment key={item.id}>
              {item.separator && <Divider key="separator" />}
              <DropdownItem
                key={item.id}
                tooltipProps={{ content: item.tooltip, position: item.tooltipPosition }}
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
      </Dropdown>
    </TooltipWrapper>
  )
}
