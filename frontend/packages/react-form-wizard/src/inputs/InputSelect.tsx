/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  Label,
  LabelGroup,
  MenuFooter,
  MenuToggle,
  MenuToggleElement,
  SelectList,
  SelectOption,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
} from '@patternfly/react-core'
import { TimesIcon } from '@patternfly/react-icons'
import { ReactNode, useEffect, useRef, useState } from 'react'
import { useStringContext } from '../contexts/StringContext'
import { OptionType } from './WizSelect'

type InputSelectProps = {
  disabled?: boolean
  validated?: 'error'
  options: string[]
  setOptions: (options: string[]) => void
  placeholder: string
  value: string
  filterValue: string
  setFilterValue: React.Dispatch<React.SetStateAction<string>>
  onSelect: (value: string | undefined) => void
  toggleRef: React.Ref<MenuToggleElement>
  open: boolean
  setOpen: (open: boolean) => void
  required?: boolean
}

export const InputSelect = ({
  required,
  disabled,
  validated,
  options,
  setOptions,
  placeholder,
  value,
  filterValue,
  setFilterValue,
  onSelect,
  toggleRef,
  open,
  setOpen,
}: InputSelectProps) => {
  const { createOption } = useStringContext()
  const [inputValue, setInputValue] = useState<string>(value || '')
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const textInputRef = useRef<HTMLInputElement>(undefined)

  useEffect(() => {
    let newSelectOptions: string[] = options
    // Filter menu items based on the text input value when one exists
    if (filterValue !== '') {
      newSelectOptions = newSelectOptions.filter((menuItem) =>
        menuItem.toLowerCase().includes(String(filterValue).toLowerCase())
      )
      newSelectOptions.push(filterValue)
    }
    setOptions([...new Set([...newSelectOptions])])
  }, [filterValue, createOption, options, setOptions, value])

  useEffect(() => {
    setInputValue(value)
  }, [value])

  const createItemId = (value: string) => `select-typeahead-${value.replace(' ', '-')}`

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex)
    const focusedItem = options[itemIndex]
    setActiveItemId(createItemId(focusedItem))
  }

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null)
    setActiveItemId(null)
  }

  const closeMenu = () => {
    setOpen(false)
    resetActiveAndFocusedItem()
  }

  const onInputClick = () => {
    if (!open) {
      setOpen(true)
    } else if (!inputValue) {
      closeMenu()
    }
  }

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, v: string) => {
    setInputValue(v)
    setFilterValue(v)

    resetActiveAndFocusedItem()

    // refine this
    // if (v !== value) {
    //   setSelected('')
    // }
  }

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0

    if (!open) {
      setOpen(true)
    }

    if (options.every((option) => option)) {
      return
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = options.length - 1
      } else {
        indexToFocus = focusedItemIndex - 1
      }

      // Skip disabled options
      while (options[indexToFocus]) {
        indexToFocus--
        if (indexToFocus === -1) {
          indexToFocus = options.length - 1
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === options.length - 1) {
        indexToFocus = 0
      } else {
        indexToFocus = focusedItemIndex + 1
      }

      // Skip disabled options
      while (options[indexToFocus]) {
        indexToFocus++
        if (indexToFocus === options.length) {
          indexToFocus = 0
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus)
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? options[focusedItemIndex] : null

    switch (event.key) {
      case 'Enter':
        if (open && focusedItem && !focusedItem) {
          onSelect(focusedItem)
        }

        if (!open) {
          setOpen(true)
        }

        break
      case 'ArrowUp':
      case 'ArrowDown':
        event.preventDefault()
        handleMenuArrowKeys(event.key)
        break
    }
  }

  const onToggleClick = () => {
    setOpen(!open)
    textInputRef?.current?.focus()
  }

  const onClearButtonClick = () => {
    onSelect(undefined)
    setInputValue('')
    setFilterValue('')
    resetActiveAndFocusedItem()
    textInputRef?.current?.focus()
  }

  return (
    <MenuToggle
      ref={toggleRef}
      variant="typeahead"
      aria-label="Typeahead creatable menu toggle"
      onClick={onToggleClick}
      isExpanded={open}
      isFullWidth
      isDisabled={disabled}
      status={validated === 'error' ? 'danger' : undefined}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          // value={!Array.isArray(value) ? value || inputValue : inputValue}
          value={inputValue}
          // value={value}
          onClick={onInputClick}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          id="create-typeahead-select-input"
          autoComplete="off"
          innerRef={textInputRef}
          placeholder={placeholder}
          {...(activeItemId && { 'aria-activedescendant': activeItemId })}
          role="combobox"
          isExpanded={open}
          aria-controls={placeholder}
        >
          {Array.isArray(value) && (
            <LabelGroup style={{ marginTop: -8, marginBottom: -8 }} numLabels={9999}>
              {value.map((selection) => (
                <Label variant="outline" key={selection}>
                  {selection}
                </Label>
              ))}
            </LabelGroup>
          )}
        </TextInputGroupMain>
        <TextInputGroupUtilities {...((!inputValue && !value) || required ? { style: { display: 'none' } } : {})}>
          <Button
            variant="plain"
            onClick={onClearButtonClick}
            aria-label="Clear input value"
            icon={<TimesIcon aria-hidden />}
          />
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  )
}

type SelectListOptionsProps<T = any> = {
  value: string
  allOptions: string[] | OptionType<T>[]
  filteredOptions: string[] | OptionType<T>[]
  footer?: ReactNode
  isCreatable?: boolean
  onCreate?: (value: string) => void
  isMultiSelect?: boolean
}

export const SelectListOptions = ({
  value,
  allOptions,
  filteredOptions,
  isCreatable,
  onCreate,
  footer,
  isMultiSelect,
}: SelectListOptionsProps) => {
  const { noResults, createOption } = useStringContext()
  // Create a new Set from the array to remove any duplicates
  const uniqueOptions = [...new Set([...filteredOptions])]
  if (uniqueOptions.length === 0) {
    return (
      <SelectList isAriaMultiselectable={isMultiSelect}>
        <SelectOption
          id={'option-no-results'}
          key={'option-no-results'}
          value={undefined}
          isDisabled={true}
          onClick={undefined}
          isSelected={true}
        >
          {noResults}
        </SelectOption>
        {footer && <MenuFooter>{footer}</MenuFooter>}
      </SelectList>
    )
  }
  return (
    <SelectList isAriaMultiselectable={isMultiSelect}>
      {uniqueOptions.map((option, index) => {
        const isLastItem = index === uniqueOptions.length - 1
        const isSimpleOption = typeof option === 'string'
        const isInputOption = typeof option !== 'string' && option.id === 'input'
        const valueString = String(isSimpleOption ? option : option.value)
        const labelString = String(isSimpleOption ? option : option.label)
        const isCustomOption =
          typeof allOptions[0] === 'string'
            ? (allOptions as string[]).filter((op) => op === valueString).length === 0
            : (allOptions as OptionType<any>[]).filter((op) => op.value === valueString).length === 0
        const isCreateOption = isInputOption || (isLastItem && isCreatable && isCustomOption)

        const shouldSkipEmptyItem = valueString === ''
        const shouldSkipLastItem = isLastItem && isInputOption && (valueString === '' || !isCreatable)
        if (shouldSkipEmptyItem || shouldSkipLastItem) {
          return null
        }

        let displayText: string
        if (isCreateOption) {
          displayText = `${createOption} "${valueString}"`
        } else {
          displayText = labelString
        }

        const isDisabled = labelString === noResults || (!isSimpleOption && option.disabled)
        let optionValue = !isSimpleOption ? option.value : option // this might need to be option.id?
        if (!isSimpleOption && typeof optionValue === 'object') {
          // value can sometimes be passed a kube resource object - in this case we grab the label to determine current selection.
          optionValue = option.label
        }

        return (
          <SelectOption
            id={isSimpleOption ? option : option.id || `option-${index}`}
            key={isSimpleOption ? option : option.id || `option-${index}`}
            value={optionValue}
            description={!isSimpleOption ? option.description : undefined}
            isDisabled={isDisabled}
            onClick={isCreateOption ? () => onCreate?.(!isSimpleOption ? option.value : option) : undefined}
            isSelected={
              !isDisabled && !isCreateOption && Array.isArray(value)
                ? value.includes(optionValue)
                : optionValue === value
            }
          >
            {displayText}
          </SelectOption>
        )
      })}
      {footer && <MenuFooter>{footer}</MenuFooter>}
    </SelectList>
  )
}
