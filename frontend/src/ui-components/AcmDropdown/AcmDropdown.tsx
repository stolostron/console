/* Copyright Contributors to the Open Cluster Management project */

import {
  Label,
  LabelProps,
  TooltipPosition,
  Menu,
  MenuContent,
  MenuList,
  MenuItem,
  MenuToggle,
  Tooltip,
  Popper,
  MenuProps,
} from '@patternfly/react-core'
import { css } from '@emotion/css'
import { TooltipWrapper } from '../utils'
import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import { EllipsisVIcon } from '@patternfly/react-icons'
import { ClassNameMap } from '@mui/material'

type Props = Omit<MenuProps, 'children' | 'onSelect'>

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
  dropdownPosition?:
    | 'top'
    | 'top-start'
    | 'top-end'
    | 'bottom'
    | 'bottom-start'
    | 'bottom-end'
    | 'left'
    | 'left-start'
    | 'left-end'
    | 'right'
    | 'right-start'
    | 'right-end'
}

export type AcmDropdownItems = {
  id: string
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
  isSelected?: boolean
  click?: (event?: React.MouseEvent) => void
  flyoutMenu?: AcmDropdownItems[]
}

const useStyles = (props: AcmDropdownProps) => ({
  button: css({
    '& button': {
      backgroundColor: props.isDisabled
        ? 'var(--pf-v5-global--disabled-color--200)'
        : props.isPrimary
          ? 'var(--pf-v5-global--primary-color--100)'
          : 'transparent',
      '&:hover': {
        backgroundColor: props.isPrimary
          ? 'var(--pf-v5-global--primary-color--200)'
          : 'var(--pf-v5-global--BackgroundColor--200)',
      },
    },
    // styles for the menu container
    '& .pf-v5-c-menu': {
      backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)',
    },
    // menu items styles
    '& .pf-v5-c-menu__item': {
      backgroundColor: 'transparent',
      '&:hover': {
        backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)',
      },
      '&.pf-m-selected': {
        backgroundColor: 'var(--pf-v5-global--BackgroundColor--200)',
      },
    },
    // expanded state styles
    '& .pf-v5-c-menu__item.pf-m-expanded': {
      backgroundColor: 'var(--pf-v5-global--BackgroundColor--100)',
    },
  }),
  label: css({
    marginLeft: 'var(--pf-v5-global--spacer--sm)',
  }),
})

type MenuItemProps = {
  menuItems: AcmDropdownItems[]
  onSelect: MenuProps['onSelect']
  classes: ClassNameMap<'label'>
} & MenuProps

const MenuItems = forwardRef<HTMLDivElement, MenuItemProps>((props, ref) => {
  const { menuItems, onSelect, classes, ...menuProps } = props

  // executes item's click handler if present
  const handleItemClick = (event: React.MouseEvent, itemId: string, item: AcmDropdownItems) => {
    if (item?.click) {
      item.click(event)
    }

    // calls onSelectn only if flyoutMenu is not present
    if (!item?.flyoutMenu) {
      onSelect?.(event, itemId)
    }
  }
  return (
    <Menu ref={ref} onSelect={onSelect} containsFlyout={true} {...menuProps}>
      <MenuContent>
        <MenuList>
          {menuItems.map((item) => {
            const menuItem = (
              <MenuItem
                id={item.id}
                key={item.id}
                itemId={item.id}
                isDisabled={item.isAriaDisabled}
                isSelected={item.isSelected}
                onClick={(e) => (item.click ? handleItemClick(e, item.id, item) : undefined)}
                flyoutMenu={
                  item.flyoutMenu?.length ? (
                    <MenuItems menuItems={item.flyoutMenu} classes={classes} onSelect={onSelect} />
                  ) : undefined
                }
              >
                {item.text}
                {item.label && item.labelColor && (
                  <Label className={classes.label} color={item.labelColor}>
                    {item.label}
                  </Label>
                )}
              </MenuItem>
            )
            return item.tooltip ? (
              <Tooltip key={item.id} position={item.tooltipPosition} content={item.tooltip}>
                <div>{menuItem}</div>
              </Tooltip>
            ) : (
              menuItem
            )
          })}
        </MenuList>
      </MenuContent>
    </Menu>
  )
})

export function AcmDropdown(props: AcmDropdownProps) {
  const {
    dropdownItems,
    dropdownPosition,
    id,
    isDisabled,
    isKebab,
    isPlain,
    isPrimary,
    onHover,
    onSelect,
    onToggle,
    text,
    tooltip,
    tooltipPosition,
  } = props
  const [isOpen, setOpen] = useState<boolean>(false)
  const popperContainer = useRef<HTMLDivElement>(null)
  const toggleRef = useRef<HTMLButtonElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const classes = useStyles(props)

  const toggleMenu = useCallback(() => {
    if (onToggle) {
      onToggle(!isOpen)
    }
    setOpen(!isOpen)
  }, [isOpen, onToggle])

  const handleSelect = useCallback(
    (_event?: React.MouseEvent, itemId?: string | number) => {
      onSelect((itemId || '').toString())
      setOpen(false)
      const element = document.getElementById(id)
      /* istanbul ignore else */
      if (element) element.focus()
    },
    [id, onSelect]
  )

  const handleToggleClick = useCallback(() => {
    setTimeout(() => {
      if (menuRef.current) {
        const firstElement = menuRef.current.querySelector('li > button:not(:disabled), li > a:not(:disabled)')
        firstElement && (firstElement as HTMLElement).focus()
      }
    }, 0)
    toggleMenu()
  }, [toggleMenu])

  const handleMenuKeys = useCallback(
    (event: KeyboardEvent) => {
      if (!isOpen) {
        return
      }
      if (menuRef.current?.contains(event.target as Node) || toggleRef.current?.contains(event.target as Node)) {
        if (event.key === 'Escape' || event.key === 'Tab') {
          toggleMenu()
          toggleRef.current?.focus()
        }
      }
    },
    [isOpen, toggleMenu]
  )

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (
        isOpen &&
        !toggleRef.current?.contains(event.target as Node) &&
        !menuRef.current?.contains(event.target as Node)
      ) {
        toggleMenu()
      }
    },
    [isOpen, toggleMenu]
  )

  useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys)
    window.addEventListener('click', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleMenuKeys)
      window.removeEventListener('click', handleClickOutside)
    }
  }, [handleMenuKeys, handleClickOutside])

  let variant: 'default' | 'plain' | 'primary' | 'plainText' | 'secondary' | 'typeahead'
  if (isKebab) {
    variant = 'plain'
  } else if (isPlain) {
    variant = 'plainText'
  } else if (isPrimary) {
    variant = 'primary'
  } else {
    variant = 'default'
  }

  return (
    <TooltipWrapper showTooltip={!!tooltip} tooltip={tooltip} tooltipPosition={tooltipPosition}>
      <div ref={popperContainer} className={classes.button}>
        <Popper
          trigger={
            <MenuToggle
              ref={toggleRef}
              variant={variant}
              id={id}
              isDisabled={isDisabled}
              onClick={handleToggleClick}
              onMouseOver={onHover}
              isExpanded={isOpen}
              aria-label={text}
            >
              {isKebab ? <EllipsisVIcon /> : text}
            </MenuToggle>
          }
          isVisible={isOpen}
          appendTo={popperContainer.current || document.body}
          distance={0}
          enableFlip={true}
          minWidth="fit-content"
          placement={dropdownPosition ?? (isKebab ? 'left-start' : 'right-start')}
          popper={<MenuItems ref={menuRef} menuItems={dropdownItems} onSelect={handleSelect} classes={classes} />}
        />
      </div>
    </TooltipWrapper>
  )
}
