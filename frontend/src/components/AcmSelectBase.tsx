/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  MenuToggle,
  MenuToggleElement,
  Select,
  SelectProps,
  SelectList,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  SelectOptionProps,
  SelectOption,
  Skeleton,
  ChipGroup,
  Chip,
  Icon,
  SelectGroup,
  Badge,
  KeyTypes,
} from '@patternfly/react-core'
import {
  Children,
  cloneElement,
  isValidElement,
  ReactElement,
  ReactNode,
  Ref,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from '../lib/acm-i18next'
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon'
import { css } from '@emotion/css'

export interface SelectOptionObject {
  /** Function returns a string to represent the select option object */
  toString(): string
  /** Function returns a true if the passed in select option is equal to this select option object, false otherwise */
  compareTo?(selectOption: any): boolean
}
let currentId = 0

export enum SelectVariant {
  single = 'single',
  typeahead = 'typeahead',
  checkbox = 'checkbox',
  typeaheadCheckbox = 'typeaheadCheckbox',
  typeaheadMulti = 'typeaheadmulti',
}

export type AcmSelectBaseProps = Pick<
  SelectProps,
  Exclude<
    keyof SelectProps,
    'toggle' | 'onToggle' | 'isOpen' | 'onChange' | 'selections' | 'onSelect' | 'variant' | 'width'
  >
> & {
  id?: string
  label?: string
  value?: string | string[]
  selections?: string | SelectOptionObject | (string | SelectOptionObject)[]
  variant?: SelectVariant
  onSelect?: (value: string | string[]) => void
  onClear?: () => void
  placeholder?: string
  placeholderText?: string
  toggleIcon?: React.ReactNode
  isDisabled?: boolean
  toggleId?: string
  width?: string | number
  maxHeight?: string
  menuAppendTo?: string
  isLoading?: boolean
  footer?: React.ReactNode
}

const NO_RESULTS = 'no results'

const filterIconClass = css({
  padding: '0 8px 0 16px',
})

const placeholderClass = css({
  display: 'flex',
  alignItems: 'center',
  paddingRight: '20px',
  width: '100%',
})

const menuToggleClass = css`
  span.pf-v5-c-menu-toggle__text {
    width: 100%;
  }
  span.pf-v5-c-menu-toggle__controls {
    padding-inline-start: 0;
  }
`

interface ICheckboxChildren {
  hasCheckbox?: boolean
  isSelected?: boolean
  onKeyDown?: (event: React.KeyboardEvent) => void
  children?: React.ReactNode
}

export function AcmSelectBase(props: AcmSelectBaseProps) {
  const { t } = useTranslation()
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState<string>('')

  // for typeahead-- filtered options
  const useFilter =
    props.variant === SelectVariant.typeahead ||
    props.variant === SelectVariant.typeaheadMulti ||
    props.variant === SelectVariant.typeaheadCheckbox
  const [filterValue, setFilterValue] = useState<string>('')
  let initialFilteredOptions:
    | {
        value: any
        children: any
      }[]
    | {
        value: string
        children?: any
        disabled: boolean
      }[] = []
  if (useFilter) {
    const children = Children.toArray(props.children)
    if (children.length > 0) {
      initialFilteredOptions = children.map((child) => {
        const props = (child as React.ReactElement).props
        const { value, children } = props
        return {
          value: value ?? '',
          children: children ?? value,
        }
      })
    } else {
      initialFilteredOptions = [
        {
          value: NO_RESULTS,
          children: t('No results found'),
          disabled: true,
        },
      ]
    }
  }

  const [filteredOptions, setFilteredOptions] = useState<SelectOptionProps[]>(initialFilteredOptions)

  const getMultiTypeaheadChildren = (value: string) =>
    initialFilteredOptions.find((option) => option.value === value)?.children
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const menuRef = useRef<HTMLDivElement>()
  const textInputRef = useRef<HTMLInputElement>()
  const {
    value,
    isDisabled,
    onSelect,
    onClear,
    selections: selectionProps,
    toggleId,
    toggleIcon,
    maxHeight,
    width,
    menuAppendTo,
    isLoading,
    variant = SelectVariant.single,
    children,
    footer,
    ...selectProps
  } = props
  const selections = value ?? selectionProps
  const isMulti = Array.isArray(selections)
  const isSingle = typeof selections === 'string' && selections?.length !== 0
  let badge: React.ReactNode = null
  let placeholder = props.placeholderText
  if (!placeholder) {
    if (isMulti && selections.length > 0) {
      placeholder = selections.join(', ')
      badge = selections.length > 0 && (
        <Badge key={selections.length} isRead>
          {selections.length}
        </Badge>
      )
    } else if (isSingle) {
      placeholder = selections
    } else {
      placeholder = props.placeholder ?? ''
    }
  }
  const selectedItem = !Array.isArray(selections) ? (selections as string) : undefined
  const selectedItems = Array.isArray(selections) ? (selections as string[]) : []

  useEffect(() => {
    if (!selections) {
      setInputValue('')
      setFilterValue('')
      if (props.width === 'auto') {
        if (textInputRef?.current) textInputRef.current.size = 20
        if (textInputRef?.current) textInputRef.current.style.width = 'auto'
      }
    }
  }, [props.width, selections])

  const createItemId = (value: any) => `select-typeahead-${value.replace(' ', '-')}`
  const selectToggleId = toggleId ?? `pf-select-toggle-id-${currentId++}`

  const closeMenu = () => {
    setIsOpen(false)
    if (
      variant === SelectVariant.checkbox ||
      variant == SelectVariant.typeaheadCheckbox ||
      variant == SelectVariant.typeaheadMulti
    ) {
      setInputValue('')
      setFilterValue('')
    }
    resetActiveAndFocusedItem()
  }

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value)
    setFilterValue(value)

    resetActiveAndFocusedItem()

    // if (value !== selections) {
    //   onSelect?.('')
    // }
  }

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0

    if (!isOpen) {
      setIsOpen(true)
    }

    if (filteredOptions.every((option) => option.isDisabled)) {
      return
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = filteredOptions.length - 1
      } else {
        indexToFocus = focusedItemIndex - 1
      }

      // Skip disabled options
      while (filteredOptions[indexToFocus].isDisabled) {
        indexToFocus--
        if (indexToFocus === -1) {
          indexToFocus = filteredOptions.length - 1
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === filteredOptions.length - 1) {
        indexToFocus = 0
      } else {
        indexToFocus = focusedItemIndex + 1
      }

      // Skip disabled options
      while (filteredOptions[indexToFocus].isDisabled) {
        indexToFocus++
        if (indexToFocus === filteredOptions.length) {
          indexToFocus = 0
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus)
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? filteredOptions[focusedItemIndex] : null

    switch (event.key) {
      case 'Enter':
        if (isOpen && focusedItem && focusedItem.value !== NO_RESULTS && !focusedItem.isAriaDisabled) {
          selectOption(focusedItem.value, focusedItem.children as string)
        }

        if (!isOpen) {
          setIsOpen(true)
        }

        break
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault()
        handleMenuArrowKeys(event.key)
        break
    }
  }

  const onInputClick = () => {
    if (!isOpen) {
      setIsOpen(true)
      if (textInputRef?.current) textInputRef.current.select()
    } else if (!inputValue) {
      closeMenu()
    }
  }

  useEffect(() => {
    let newFilteredOptions: SelectOptionProps[] = initialFilteredOptions

    // Filter menu items based on the text input value when one exists
    if (filterValue) {
      newFilteredOptions = initialFilteredOptions.filter((menuItem) =>
        String(menuItem.children).toLowerCase().includes(filterValue.toLowerCase())
      )

      // When no options are found after filtering, display 'No results found'
      if (!newFilteredOptions.length) {
        newFilteredOptions = [
          {
            isAriaDisabled: true,
            hasCheckbox: false,
            children: t(`No results found for {{filterValue}}`, { filterValue }),
            value: NO_RESULTS,
          },
        ]
      }

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true)
      }
    }

    setFilteredOptions(newFilteredOptions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValue])

  const initialOptionsStr = JSON.stringify(initialFilteredOptions)
  useEffect(() => {
    setFilteredOptions(JSON.parse(initialOptionsStr))
  }, [initialOptionsStr])

  useEffect(() => {
    if (variant === SelectVariant.typeahead && selections) {
      setInputValue(String(selections))
    }
  }, [selections, variant])

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex)
    const focusedItem = filteredOptions[itemIndex]
    setActiveItemId(createItemId(focusedItem.value))
  }

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null)
    setActiveItemId(null)
  }

  const onToggleClick = () => {
    setIsOpen(!isOpen)
  }

  const _onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | string[] | number | undefined
  ) => {
    switch (variant) {
      case SelectVariant.typeahead:
        if (value && value !== NO_RESULTS) {
          const optionText = filteredOptions.find((option) => option.value === value)?.children
          selectOption(value.toString(), optionText as string)
        }
        break
      case SelectVariant.checkbox:
      case SelectVariant.typeaheadCheckbox:
      case SelectVariant.typeaheadMulti:
        if (!Array.isArray(value)) {
          selectOption(String(value), String(placeholder))
        }
        break
      default:
      case SelectVariant.single:
        onSelect?.(String(value))
        setIsOpen(false)
        break
    }
  }

  const selectOption = (value: string | number, content: string | number) => {
    if (variant === SelectVariant.typeahead) {
      setInputValue(String(content))
    }
    setFilterValue('')
    onSelect?.(String(value))
    if (
      variant !== SelectVariant.checkbox &&
      variant !== SelectVariant.typeaheadCheckbox &&
      variant !== SelectVariant.typeaheadMulti
    ) {
      closeMenu()
    }

    if (props.width === 'auto') {
      if (textInputRef?.current) textInputRef.current.size = String(content).length
    }
  }

  const onClearSelection = useCallback(
    (focus: boolean = true) => {
      if (filterValue.length === 0) {
        if (onClear) {
          onClear()
        } else if (variant === SelectVariant.typeahead) {
          onSelect?.('')
        }
      }
      setInputValue('')
      setFilterValue('')
      resetActiveAndFocusedItem()
      if (focus) textInputRef?.current?.focus()
      if (props.width === 'auto') {
        if (textInputRef?.current) textInputRef.current.size = 20
        if (textInputRef?.current) textInputRef.current.style.width = 'auto'
      }
    },
    [filterValue.length, onClear, onSelect, props.width, variant]
  )

  const renderCheckboxes = (children: ReactNode, selectedItems: string | any[]): any => {
    return Children.map(children, (child, index) => {
      if (!isValidElement<ICheckboxChildren>(child)) {
        return child
      }
      if (child.type === SelectGroup) {
        return cloneElement<ICheckboxChildren>(child, {
          children: renderCheckboxes(child.props.children, selectedItems),
        })
      } else if (child.type === SelectOption) {
        return cloneElement(child, {
          hasCheckbox: true,
          isSelected: selectedItems.includes((child as ReactElement<any>).props.value),
          onKeyDown: (event: React.KeyboardEvent) => {
            if (event.key === KeyTypes.Enter) {
              event.preventDefault()
              const checkboxes = menuRef?.current?.querySelectorAll(
                'input[type=checkbox]'
              ) as NodeListOf<HTMLDivElement>
              checkboxes[index].click()
            }
          },
        })
      } else {
        return child
      }
    })
  }

  const renderSelectList = () => {
    switch (true) {
      case variant === SelectVariant.single:
        return <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>{children}</SelectList>
      case variant === SelectVariant.checkbox:
        return (
          <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {renderCheckboxes(children, selectedItems)}
          </SelectList>
        )
      default:
        return (
          <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {filteredOptions.map((option, index) => (
              <SelectOption
                key={option.value ?? option.children}
                isFocused={focusedItemIndex === index}
                className={option.className}
                hasCheckbox={variant === SelectVariant.typeaheadCheckbox}
                isSelected={
                  variant === SelectVariant.typeaheadCheckbox ? selectedItems.includes(option.value) : undefined
                }
                id={createItemId(option.value)}
                {...option}
                ref={null}
              />
            ))}
          </SelectList>
        )
    }
  }

  // getting selected displayable value from options
  const renderSinglePlaceholder = () => {
    if (selections) {
      const item = Children.toArray(props.children).find(
        (child) =>
          (child as React.ReactElement).props.value &&
          (child as React.ReactElement).props.value.toString() === selections.toString()
      ) as any
      if (item) {
        if (item?.props.children) {
          return item.props.children
        }
        return item.props.value.toString()
      }
    }
    return placeholder
  }

  const hasClearButton = () => {
    if (onClear) {
      return isMulti || isSingle
    }
    return !!inputValue
  }
  const ariaLabelledBy = props['aria-labelledby'] ?? undefined
  let ariaLabel = props['aria-labelledby'] ? undefined : props['aria-label']
  if (!ariaLabel && !ariaLabelledBy) {
    ariaLabel = props.placeholder ?? props.label ?? t('Options menu')
  }

  function renderMenuToggle(toggleRef: Ref<MenuToggleElement> | undefined): ReactNode {
    return (
      <MenuToggle
        id={selectToggleId}
        ref={toggleRef}
        variant={variant === SelectVariant.single || variant === SelectVariant.checkbox ? 'default' : 'typeahead'}
        onKeyDown={(event: React.KeyboardEvent) => {
          if (SelectVariant.single || variant === SelectVariant.checkbox) {
            event.preventDefault()
            if (
              (event.key === KeyTypes.Tab || event.key === KeyTypes.Enter || event.key === KeyTypes.Space) &&
              isOpen
            ) {
              setIsOpen(false)
            } else if ((event.key === KeyTypes.Enter || event.key === KeyTypes.Space) && !isOpen) {
              setIsOpen(true)
              setTimeout(() => {
                const firstElement = menuRef?.current?.querySelector('li button:not(:disabled),li input:not(:disabled)')
                // eslint-disable-next-line @typescript-eslint/no-unused-expressions
                firstElement && (firstElement as HTMLElement).focus({ preventScroll: true })
              }, 0)
            }
          }
        }}
        role="combobox"
        aria-labelledby={ariaLabelledBy}
        aria-label={ariaLabel}
        badge={badge}
        isDisabled={isDisabled}
        onClick={onToggleClick}
        icon={toggleIcon && <Icon className={filterIconClass}>{toggleIcon}</Icon>}
        isExpanded={isOpen}
        className={menuToggleClass}
        style={
          {
            width: width ?? '100%',
            maxHeight: '36px',
          } as React.CSSProperties
        }
      >
        {variant === SelectVariant.single || variant === SelectVariant.checkbox ? (
          <TextInputGroup style={{ width: '100%' }} isPlain>
            <div className={placeholderClass} style={{ width: '100%' }}>
              {variant === SelectVariant.single ? renderSinglePlaceholder() : <span>{placeholder}</span>}
            </div>
            <TextInputGroupUtilities {...(!hasClearButton() ? { style: { display: 'none' } } : {})}>
              <Button
                variant="plain"
                onClick={(e) => {
                  onClearSelection()
                  e.stopPropagation()
                }}
                aria-label="Clear input value"
                style={{ paddingInlineStart: 0 }}
              >
                <TimesIcon aria-hidden />
              </Button>
            </TextInputGroupUtilities>
          </TextInputGroup>
        ) : (
          <TextInputGroup isPlain>
            <TextInputGroupMain
              value={inputValue || selectedItem}
              onClick={onInputClick}
              onChange={onTextInputChange}
              onKeyDown={onInputKeyDown}
              id="multi-typeahead-select-input"
              autoComplete="off"
              innerRef={textInputRef}
              placeholder={placeholder}
              {...(activeItemId && { 'aria-activedescendant': activeItemId })}
              role="combobox"
              aria-label={ariaLabel}
              aria-labelledby={ariaLabelledBy}
              isExpanded={isOpen}
              aria-controls="select-multi-typeahead-listbox"
            >
              {variant === SelectVariant.typeaheadMulti && (
                <ChipGroup aria-label="Current selections">
                  {selectedItems.map((selection, index) => (
                    <Chip
                      key={index}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        _onSelect(ev, selection)
                      }}
                    >
                      {getMultiTypeaheadChildren(selection)}
                    </Chip>
                  ))}
                </ChipGroup>
              )}
            </TextInputGroupMain>
            <TextInputGroupUtilities {...(!hasClearButton() ? { style: { display: 'none' } } : {})}>
              <Button variant="plain" onClick={() => onClearSelection()} aria-label="Clear input value">
                <TimesIcon aria-hidden />
              </Button>
            </TextInputGroupUtilities>
          </TextInputGroup>
        )}
      </MenuToggle>
    )
  }

  return isLoading ? (
    <Skeleton height="36px" screenreaderText={t('Loading')} />
  ) : (
    <Select
      {...selectProps}
      style={{ width: 'auto' }}
      spellCheck={false}
      isOpen={isOpen}
      toggle={(toggleRef: React.Ref<MenuToggleElement>) => {
        return renderMenuToggle(toggleRef)
      }}
      onOpenChange={() => closeMenu()}
      selected={selections}
      onSelect={_onSelect}
      innerRef={menuRef as React.MutableRefObject<any>}
    >
      {renderSelectList()}
      {footer}
    </Select>
  )
}
