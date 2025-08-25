/* Copyright Contributors to the Open Cluster Management project */
import {
  Button,
  Chip,
  ChipGroup,
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
import { FormEvent, ReactNode, useCallback, useEffect, useRef, useState } from 'react'
import { useStringContext } from '../contexts/StringContext'
import { OptionType } from './WizSelect'

type InputSelectProps = {
  disabled?: boolean
  validated?: 'error'
  options: string[]
  setOptions: (options: string[]) => void
  placeholder: string
  value: string
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
  onSelect,
  toggleRef,
  open,
  setOpen,
}: InputSelectProps) => {
  const [inputValue, setInputValue] = useState('')
  const textInputRef = useRef<HTMLInputElement>(null)
  const onInputClick = useCallback(() => setOpen(!open), [open, setOpen])

  useEffect(
    () =>
      setOptions([...options.filter((option) => option.toLowerCase().includes(inputValue.toLowerCase())), inputValue]),
    [inputValue, options, setOptions]
  )

  const onClear = useCallback(() => {
    onSelect(undefined)
    setInputValue('')
    textInputRef?.current?.focus()
  }, [onSelect])

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!Array.isArray(value)) {
        onSelect('')
      }
      setOpen(true)
      switch (event.key) {
        case 'Backspace':
          !Array.isArray(value) && onSelect('')
          break
      }
    },
    [onSelect, open, setOpen, value]
  )

  const onTextInputChange = useCallback((_event: FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value)
  }, [])

  return (
    <MenuToggle
      variant="typeahead"
      ref={toggleRef}
      onClick={() => setOpen(!open)}
      isExpanded={open}
      isDisabled={disabled}
      isFullWidth
      status={validated === 'error' ? 'danger' : undefined}
    >
      <TextInputGroup isPlain>
        <TextInputGroupMain
          value={!Array.isArray(value) ? value || inputValue : inputValue}
          onClick={onInputClick}
          onChange={onTextInputChange}
          onKeyDown={onInputKeyDown}
          innerRef={textInputRef}
          placeholder={placeholder}
          isExpanded={open}
          autoComplete="off"
          aria-label={placeholder}
          role="combobox"
          aria-controls="select-typeahead-listbox"
        >
          {Array.isArray(value) && (
            <ChipGroup style={{ marginTop: -8, marginBottom: -8 }} numChips={9999}>
              {value.map((selection) => (
                <Chip isReadOnly key={selection}>
                  {selection}
                </Chip>
              ))}
            </ChipGroup>
          )}
        </TextInputGroupMain>

        <TextInputGroupUtilities {...((!inputValue && !value) || required ? { style: { display: 'none' } } : {})}>
          <Button variant="plain" onClick={onClear}>
            <TimesIcon aria-hidden />
          </Button>
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  )
}

type SelectListOptionsProps<T = any> = {
  value: string
  options: string[] | OptionType<T>[]
  footer?: ReactNode
  isCreatable?: boolean
  onCreate?: (value: string) => void
  isMultiSelect?: boolean
}

export const SelectListOptions = ({
  value,
  options,
  isCreatable,
  onCreate,
  footer,
  isMultiSelect,
}: SelectListOptionsProps) => {
  const { noResults, createOption } = useStringContext()
  return (
    <SelectList isAriaMultiselectable={isMultiSelect}>
      {options.map((option, index) => {
        const isLastItem = index === options.length - 1
        const isSingleItem = options.length === 1
        const isSimpleOption = typeof option === 'string'
        const valueString = String(isSimpleOption ? option : option.value)
        const isCreateOption = isSingleItem && isCreatable && value !== valueString
        const shouldSkipLastItem = isLastItem && (!isSingleItem || (isCreatable && value === valueString))

        if (shouldSkipLastItem) {
          return null
        }

        let displayText: string
        if (isCreateOption) {
          displayText = `${createOption} "${valueString}"`
        } else if (isSingleItem) {
          displayText = noResults
        } else if (isSimpleOption) {
          displayText = option
        } else {
          displayText = option.label
        }

        const isDisabled = displayText === noResults || (!isSimpleOption && option.disabled)
        const optionValue = !isSimpleOption ? option.id : option

        return (
          <SelectOption
            id={isSimpleOption ? option : option.id || `option-${index}`}
            key={isSimpleOption ? option : option.id || `option-${index}`}
            value={optionValue}
            description={!isSimpleOption ? option.description : undefined}
            isDisabled={isDisabled}
            onClick={isCreateOption ? () => onCreate?.(!isSimpleOption ? option.value : option) : undefined}
            isSelected={!isDisabled && !isCreateOption && optionValue === value.toString()}
          >
            {displayText}
          </SelectOption>
        )
      })}
      {footer && <MenuFooter>{footer}</MenuFooter>}
    </SelectList>
  )
}
