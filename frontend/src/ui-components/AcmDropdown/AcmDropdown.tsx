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
  Divider,
  PopperProps,
} from '@patternfly/react-core'
import { TooltipWrapper } from '../utils'
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { EllipsisVIcon } from '@patternfly/react-icons'
import { t } from 'i18next'

type Props = Omit<MenuProps, 'children' | 'onSelect'>

export type AcmDropdownProps = Props & {
  dropdownItems: AcmDropdownItems[]
  text?: string
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
  dropdownPosition?: PopperProps['placement']
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
  flyoutMenu?: AcmDropdownItems[]
  component?: React.ReactNode
}

type MenuItemProps = {
  menuItems: AcmDropdownItems[]
  onSelect: MenuProps['onSelect']
} & MenuProps

const MenuItems = forwardRef<HTMLDivElement, MenuItemProps>((props, ref) => {
  const { menuItems, onSelect, ...menuProps } = props

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
                isAriaDisabled={item.isDisabled || item.isAriaDisabled}
                isSelected={item.isSelected}
                flyoutMenu={
                  item.flyoutMenu?.length ? (
                    <MenuItems id={`${item.id}-submenu`} menuItems={item.flyoutMenu} onSelect={onSelect} />
                  ) : undefined
                }
                description={item.description}
              >
                {item.text}
                {item.label && item.labelColor && <Label color={item.labelColor}>{item.label}</Label>}
              </MenuItem>
            )
            const wrappedMenuItem = item.tooltip ? (
              <Tooltip key={item.id} position={item.tooltipPosition} content={item.tooltip}>
                <div>{menuItem}</div>
              </Tooltip>
            ) : (
              menuItem
            )
            return (
              <>
                {item.separator && <Divider key={item.id} />}
                {wrappedMenuItem}
              </>
            )
          })}
        </MenuList>
      </MenuContent>
    </Menu>
  )
})

/**
 * A base dropdown component that provides customizable menu functionality with support
 * for nested items, tooltips, and various styling options.
 *
 * @component
 * @example
 * ```tsx
 * <AcmDropdown
 *   id="my-dropdown"
 *   text="Actions"
 *   dropdownItems={[
 *     {
 *       id: 'edit',
 *       text: 'Edit',
 *       tooltip: 'Edit this item'
 *     },
 *     {
 *       id: 'delete',
 *       text: 'Delete',
 *       isDisabled: true
 *     }
 *   ]}
 *   onSelect={(id) => handleAction(id)}
 * />
 * ```
 *
 * @param props - Component props
 * @param props.dropdownItems - Array of items to display in the dropdown menu
 * @param props.text - Text to display on the dropdown button
 * @param props.onSelect - Callback function called when an item is selected
 * @param props.id - Unique identifier for the dropdown
 * @param props.isDisabled - Whether the entire dropdown is disabled
 * @param props.isKebab - Whether to render as a kebab (three dots) menu
 * @param props.isPlain - Whether to use plain styling
 * @param props.isPrimary - Whether to use primary button styling
 * @param props.tooltip - Tooltip text for the dropdown button
 * @param props.dropdownPosition - Position of the dropdown menu
 *
 * @returns A dropdown menu component
 */

export function AcmDropdown(props: AcmDropdownProps) {
  const {
    dropdownItems,
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

  const toggleMenu = useCallback(() => {
    if (onToggle) {
      onToggle(!isOpen)
    }
    setOpen(!isOpen)
  }, [isOpen, onToggle])

  const findItemById = useCallback((items: AcmDropdownItems[], targetId: string): AcmDropdownItems | undefined => {
    for (const item of items) {
      if (item.id === targetId) return item
      if (item.flyoutMenu?.length) {
        const found = findItemById(item.flyoutMenu, targetId)
        if (found) return found
      }
    }
    return undefined
  }, [])

  const handleSelect = useCallback(
    (_event?: React.MouseEvent, itemId?: string | number) => {
      const selectedItem = findItemById(dropdownItems, String(itemId))

      if (!itemId) return // prevents triggering if no itemId

      // prevent triggering if it's a flyout parent
      if (selectedItem?.flyoutMenu?.length) return

      onSelect((itemId || '').toString())
      setOpen(false)
    },
    [dropdownItems, findItemById, onSelect]
  )

  const handleToggleClick = useCallback(() => {
    setTimeout(() => {
      if (menuRef.current) {
        const firstElement = menuRef.current.querySelector('li > button:not(:disabled), li > a:not(:disabled)')
        if (firstElement) {
          ;(firstElement as HTMLElement).focus()
        }
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

  // handle Enter key globally
  const handleEnterKey = useCallback(
    (event: KeyboardEvent) => {
      // when dropdown is open only -- process Enter key
      if (event.key !== 'Enter' || !isOpen) return

      // gets the active element
      const activeElement = document.activeElement as HTMLElement
      if (!activeElement || activeElement.tagName !== 'BUTTON') {
        return
      }

      // checks if it's a menu item
      const isMenuItem =
        activeElement.classList.contains('pf-v5-c-menu__item') || activeElement.closest('.pf-v5-c-menu__item')

      if (isMenuItem) {
        // gets the item ID
        const itemId = activeElement.id
        if (!itemId) {
          return
        }

        // checking if it has a toggle icon to determine if an item has its own submenu(parent item with submenu)
        const hasToggleIcon = activeElement.querySelector('.pf-v5-c-menu__item-toggle-icon')

        // handle only non-parent items (items without their own submenus)
        if (!hasToggleIcon) {
          event.preventDefault()
          event.stopPropagation()
          onSelect(itemId)
          setOpen(false)
          toggleRef.current?.focus()
        }
      }
    },
    [isOpen, onSelect]
  )

  // useEffect for just the Enter key event
  useEffect(() => {
    // key handler for global Enter key
    document.addEventListener('keydown', handleEnterKey, true) // using `true` = capture phase

    return () => {
      document.removeEventListener('keydown', handleEnterKey, true)
    }
  }, [handleEnterKey])

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

  const containsFlyout = useMemo(() => dropdownItems.some((item) => item.flyoutMenu), [dropdownItems])

  const handleWindowFocus = useCallback(() => {
    // Workaround for PF bug: https://github.com/patternfly/patternfly-react/issues/11802
    // For flyout menus, when focus leaves the window, close the dropdown to avoid bug if user clicks flyout
    if (containsFlyout && isOpen) {
      setOpen(false)
    }
  }, [containsFlyout, isOpen])

  useEffect(() => {
    window.addEventListener('keydown', handleMenuKeys)
    window.addEventListener('click', handleClickOutside)
    window.addEventListener('focus', handleWindowFocus)
    return () => {
      window.removeEventListener('keydown', handleMenuKeys)
      window.removeEventListener('click', handleClickOutside)
      window.removeEventListener('focus', handleWindowFocus)
    }
  }, [handleMenuKeys, handleClickOutside, handleWindowFocus])

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

  const ariaLabel = isKebab && !text ? t('Actions') : text

  return (
    <TooltipWrapper showTooltip={!!tooltip} tooltip={tooltip} tooltipPosition={tooltipPosition}>
      <div ref={popperContainer}>
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
              aria-label={ariaLabel}
            >
              {isKebab ? <EllipsisVIcon /> : text}
            </MenuToggle>
          }
          isVisible={isOpen}
          appendTo={popperContainer.current || document.body}
          distance={0}
          enableFlip={true}
          minWidth="fit-content"
          placement={props.dropdownPosition ?? (isKebab ? 'bottom-end' : 'bottom-start')}
          popper={<MenuItems ref={menuRef} menuItems={dropdownItems} onSelect={handleSelect} />}
        />
      </div>
    </TooltipWrapper>
  )
}
