/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  MenuToggle,
  MenuToggleElement,
  Select as SelectCore,
  SelectProps as SelectPropsCore,
  SelectList,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  SelectOptionProps,
  SelectOption,
  Badge,
  Skeleton,
  ChipGroup,
  Chip,
  Icon,
} from '@patternfly/react-core'
import {
  Children,
  cloneElement,
  Fragment,
  isValidElement,
  ReactElement,
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react'
import { useTranslation } from '../lib/acm-i18next'
import FilterIcon from '@patternfly/react-icons/dist/esm/icons/filter-icon'
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
  typeaheadMulti = 'typeaheadmulti',
}

type SelectProps = Pick<
  SelectPropsCore,
  Exclude<keyof SelectPropsCore, 'toggle' | 'onToggle' | 'onChange' | 'selections' | 'onSelect' | 'variant' | 'width'>
> & {
  id?: string
  label?: string
  value?: string
  selections?: string | SelectOptionObject | (string | SelectOptionObject)[]
  variant: SelectVariant
  onChange?: (value: string | string[] | undefined) => void
  validation?: (value: string | undefined) => string | undefined
  placeholder?: string
  placeholderText?: string
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
  isRequired?: boolean
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

export function Select(props: SelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [inputValue, setInputValue] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const initialFilteredOptions = Children.toArray(props.children).map((child) => {
    const value = (child as React.ReactElement).props.value
    return {
      value,
      children: value,
    }
  })
  // for typeahead-- filtered options
  const [filteredOptions, setFilteredOptions] = useState<SelectOptionProps[]>(initialFilteredOptions)
  const getMultiTypeaheadChildren = (value: string) =>
    initialFilteredOptions.find((option) => option.value === value)?.children
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const textInputRef = useRef<HTMLInputElement>()
  const { t } = useTranslation()
  const {
    value,
    validation,
    labelHelp,
    labelHelpTitle,
    helperText,
    isRequired,
    isDisabled,
    onChange,
    selections: selectionProps,
    toggleId,
    maxHeight,
    width,
    menuAppendTo,
    placeholder,
    placeholderText,
    isLoading,
    isPlain,
    variant,
    children,
    ...selectProps
  } = props
  const selections = value ?? selectionProps
  const selected = !Array.isArray(selections) ? (selections as string) : ''
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
  const selectToggleId = toggleId || `pf-select-toggle-id-${currentId++}`

  const closeMenu = () => {
    setIsOpen(false)
    resetActiveAndFocusedItem()
  }

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value)
    setFilterValue(value)

    resetActiveAndFocusedItem()

    if (value !== selected) {
      onChange?.('')
    }
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

  const selectOption = (value: string | number, content: string | number) => {
    setInputValue(String(content))
    setFilterValue('')
    onChange?.(String(value))
    closeMenu()

    if (props.width === 'auto') {
      if (textInputRef?.current) textInputRef.current.size = String(content).length
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

  const onClearSelection = useCallback(
    (focus: boolean = true) => {
      onChange?.('')
      setInputValue('')
      setFilterValue('')
      resetActiveAndFocusedItem()
      if (focus) textInputRef?.current?.focus()
      if (props.width === 'auto') {
        if (textInputRef?.current) textInputRef.current.size = 20
        if (textInputRef?.current) textInputRef.current.style.width = 'auto'
      }
    },
    [onChange, props.width]
  )

  const onSelect = (
    _event: React.MouseEvent<Element, MouseEvent> | undefined,
    value: string | string[] | number | undefined
  ) => {
    switch (variant) {
      default:
      case SelectVariant.single:
        onChange?.(value?.toString())
        setIsOpen(false)
        break
      case SelectVariant.typeahead:
        if (value && value !== NO_RESULTS) {
          const optionText = filteredOptions.find((option) => option.value === value)?.children
          selectOption(value.toString(), optionText as string)
        }
        break
      case SelectVariant.checkbox:
      case SelectVariant.typeaheadMulti:
        if (!Array.isArray(value)) {
          selectOption(String(value), String(value))
        }
        // if (selectedItems.includes(value as string)) {
        //   onChange?.(selectedItems.filter((id) => id !== value))
        // } else {
        //   onChange?.([...selectedItems, value as string])
        // }
        break
    }
  }

  const onDelete = (value: string | number | undefined) => {
    if (value && typeof value === 'string' && value !== NO_RESULTS) {
      onChange?.(
        selectedItems.includes(value)
          ? selectedItems.filter((selection) => selection !== value)
          : [...selectedItems, value]
      )
    }
    textInputRef.current?.focus()
  }

  const renderMenuToggle = (toggleRef: React.Ref<MenuToggleElement>) => {
    switch (variant) {
      default:
      case SelectVariant.single:
        return (
          <MenuToggle
            id={selectToggleId}
            ref={toggleRef}
            onClick={onToggleClick}
            isExpanded={isOpen}
            isDisabled={isDisabled}
            style={
              {
                width: width || '100%',
              } as React.CSSProperties
            }
          >
            {renderSingleSelection(selected, props)}
          </MenuToggle>
        )
      case SelectVariant.checkbox:
        return (
          <MenuToggle
            id={selectToggleId}
            ref={toggleRef}
            onClick={onToggleClick}
            isExpanded={isOpen}
            isDisabled={isDisabled}
            style={
              {
                width: width || '100%',
                maxHeight: '36px',
              } as React.CSSProperties
            }
          >
            {(() => {
              switch (true) {
                case selectedItems.length === 0:
                  return placeholder ?? placeholderText
                case isPlain:
                  return (
                    <>
                      {placeholder ?? placeholderText}
                      {selectedItems.length > 0 && <Badge isRead>{selectedItems.length}</Badge>}
                    </>
                  )
                default:
                  return (
                    <div style={{ display: 'flex', alignItems: 'center', padding: '0px' }}>
                      {selectedItems
                        .filter((item) => item !== undefined)
                        .map((node: ReactNode, index) => {
                          if (index === 0) {
                            return <Fragment key={`${index}`}>{node}</Fragment>
                          } else {
                            return (
                              <Fragment key={`${index}`}>
                                <span>, </span>
                                {node}
                              </Fragment>
                            )
                          }
                        })}
                      <Badge style={{ marginLeft: '14px' }} isRead>
                        {selectedItems.length}
                      </Badge>
                      <Button
                        variant="plain"
                        onClick={() => onClearSelection(true)}
                        aria-label="Clear input value"
                        icon={<TimesIcon aria-hidden />}
                      />
                    </div>
                  )
              }
            })()}
          </MenuToggle>
        )
      case SelectVariant.typeahead:
        return (
          <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            aria-label="Typeahead menu toggle"
            onClick={onToggleClick}
            icon={
              <Icon className={filterIconClass}>
                <FilterIcon />
              </Icon>
            }
            isExpanded={isOpen}
            style={
              {
                width: width || '100%',
              } as React.CSSProperties
            }
          >
            <TextInputGroup isPlain>
              <TextInputGroupMain
                value={inputValue}
                onClick={onInputClick}
                onChange={onTextInputChange}
                onKeyDown={onInputKeyDown}
                id="typeahead-select-input"
                autoComplete="off"
                innerRef={textInputRef}
                placeholder={placeholder ?? placeholderText}
                {...(activeItemId && { 'aria-activedescendant': activeItemId })}
                role="combobox"
                isExpanded={isOpen}
                aria-controls="select-typeahead-listbox"
              />
              <TextInputGroupUtilities {...(!inputValue ? { style: { display: 'none' } } : {})}>
                <Button
                  variant="plain"
                  onClick={() => onClearSelection()}
                  aria-label="Clear input value"
                  icon={<TimesIcon aria-hidden />}
                />
              </TextInputGroupUtilities>
            </TextInputGroup>
          </MenuToggle>
        )
      case SelectVariant.typeaheadMulti:
        return (
          <MenuToggle
            variant="typeahead"
            aria-label="Multi typeahead menu toggle"
            onClick={onToggleClick}
            innerRef={toggleRef}
            icon={
              <Icon className={filterIconClass}>
                <FilterIcon />
              </Icon>
            }
            isExpanded={isOpen}
            style={
              {
                width: width || '100%',
              } as React.CSSProperties
            }
          >
            <TextInputGroup isPlain>
              <TextInputGroupMain
                value={inputValue}
                onClick={onInputClick}
                onChange={onTextInputChange}
                onKeyDown={onInputKeyDown}
                id="multi-typeahead-select-input"
                autoComplete="off"
                innerRef={textInputRef}
                placeholder={placeholder ?? placeholderText}
                {...(activeItemId && { 'aria-activedescendant': activeItemId })}
                role="combobox"
                isExpanded={isOpen}
                aria-controls="select-multi-typeahead-listbox"
              >
                <ChipGroup aria-label="Current selections">
                  {selectedItems.map((selection, index) => (
                    <Chip
                      key={index}
                      onClick={(ev) => {
                        ev.stopPropagation()
                        onDelete(selection)
                      }}
                    >
                      {getMultiTypeaheadChildren(selection)}
                    </Chip>
                  ))}
                </ChipGroup>
              </TextInputGroupMain>
              <TextInputGroupUtilities {...(selected.length === 0 ? { style: { display: 'none' } } : {})}>
                <Button variant="plain" onClick={() => onClearSelection()} aria-label="Clear input value">
                  <TimesIcon aria-hidden />
                </Button>
              </TextInputGroupUtilities>
            </TextInputGroup>
          </MenuToggle>
        )
    }
  }

  const renderSelectList = () => {
    switch (variant) {
      default:
      case SelectVariant.single:
        return <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>{children}</SelectList>
      case SelectVariant.checkbox:
        return (
          <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {Children.map(children, (child) => {
              if (isValidElement(child)) {
                return cloneElement(
                  child as ReactElement<any>,
                  {
                    hasCheckbox: true,
                    isSelected: selectedItems.includes(child.props.value),
                  },
                  child.props.children ? child.props.children : child.props.value
                )
              }
              return child
            })}
          </SelectList>
        )
      case SelectVariant.typeahead:
        return (
          <SelectList id="select-typeahead-listbox" style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {filteredOptions.map((option, index) => (
              <SelectOption
                key={option.value || option.children}
                isFocused={focusedItemIndex === index}
                className={option.className}
                id={createItemId(option.value)}
                {...option}
                ref={null}
              />
            ))}
          </SelectList>
        )
      case SelectVariant.typeaheadMulti:
        return (
          <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {filteredOptions.map((option, index) => (
              <SelectOption
                key={option.value || option.children}
                isFocused={focusedItemIndex === index}
                className={option.className}
                id={createItemId(option.value)}
                {...option}
                ref={null}
              />
            ))}
          </SelectList>
        )
    }
  }

  return isLoading ? (
    <Skeleton height="36px" screenreaderText={t('Loading')} />
  ) : (
    <SelectCore
      style={{ width: 'auto' }}
      aria-labelledby={`${props.id}-label`}
      {...selectProps}
      isOpen={isOpen}
      toggle={renderMenuToggle}
      onOpenChange={(isOpen) => setIsOpen(isOpen)}
      selected={selected}
      onSelect={onSelect}
    >
      {renderSelectList()}
    </SelectCore>
  )
}

// getting selected displayable value from options (from old patternfly)
function renderSingleSelection(value: string | undefined, props: SelectProps, type: 'node' | 'text' = 'node') {
  if (value) {
    const item = Children.toArray(props.children).find(
      (child) =>
        (child as React.ReactElement).props.value &&
        (child as React.ReactElement).props.value.toString() === value.toString()
    ) as any
    if (item) {
      if (item && item.props.children) {
        if (type === 'node') {
          return item.props.children
        }
        return findText(item)
      }
      return item.props.value.toString()
    }
  }
  return props.placeholder ?? props.placeholderText
}

function findText(item: React.ReactNode) {
  if (typeof item === 'string') {
    return item
  } else if (!isValidElement(item)) {
    return ''
  } else {
    const multi: string[] = []
    Children.toArray(item.props.children).forEach((child) => multi.push(findText(child)))
    return multi.join('')
  }
}
