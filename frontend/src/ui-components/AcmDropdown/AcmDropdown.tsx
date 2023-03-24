/* Copyright Contributors to the Open Cluster Management project */

import { forwardRef, useCallback, useEffect, useRef, useState } from 'react'
import {
  DropdownPosition,
  Label,
  LabelProps,
  DropdownProps,
  TooltipPosition,
  Menu,
  MenuContent,
  MenuItem,
  Tooltip,
  MenuProps,
  MenuList,
  Popper,
  MenuToggle,
} from '@patternfly/react-core'
import { ClassNameMap, makeStyles } from '@mui/styles'
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
  isSelected?: boolean
  flyoutMenu?: AcmDropdownItems[]
}

const useStyles = makeStyles({
  button: {
    '& button': {
      '--pf-c-menu-toggle--PaddingRight': (props: AcmDropdownProps) => {
        return props.isPlain ? '0' : 'var(--pf-global--spacer--sm)'
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
    },
  },
  label: {
    marginLeft: '8px',
  },
})

type MenuItemProps = {
  menuItems: AcmDropdownItems[]
  onSelect: MenuProps['onSelect']
  classes: ClassNameMap<'label'>
} & MenuProps

const MenuItems = forwardRef<HTMLDivElement, MenuItemProps>((props, ref) => {
  const { menuItems, onSelect, classes, ...menuProps } = props
  return (
    <Menu ref={ref} onSelect={onSelect} containsFlyout={menuItems.some((mi) => mi.flyoutMenu)} {...menuProps}>
      <MenuContent>
        <MenuList>
          {menuItems.map((item) => {
            const menuItem = (
              <MenuItem
                id={item.id}
                key={item.id}
                itemId={item.id}
                component="a"
                isDisabled={item.isAriaDisabled}
                isSelected={item.isSelected}
                flyoutMenu={
                  item.flyoutMenu && item.flyoutMenu.length ? (
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

  return (
    <TooltipWrapper showTooltip={!!tooltip} tooltip={tooltip} tooltipPosition={tooltipPosition}>
      <div ref={popperContainer} className={classes.button}>
        <Popper
          trigger={
            <MenuToggle
              ref={toggleRef}
              variant={isKebab ? 'plain' : isPlain ? 'plainText' : isPrimary ? 'primary' : 'default'}
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
          popperMatchesTriggerWidth={false}
          isVisible={isOpen}
          position={dropdownPosition || (isKebab ? DropdownPosition.right : DropdownPosition.left)}
          popper={<MenuItems ref={menuRef} menuItems={dropdownItems} onSelect={handleSelect} classes={classes} />}
        />
      </div>
    </TooltipWrapper>
  )
}
