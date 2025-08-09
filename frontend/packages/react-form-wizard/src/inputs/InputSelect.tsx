/* Copyright Contributors to the Open Cluster Management project */
import {
  MenuToggleElement,
  MenuToggle,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  Button,
  SelectList,
  SelectOption,
  MenuFooter,
  ChipGroup,
  Chip,
} from '@patternfly/react-core'
import { TimesIcon } from '@patternfly/react-icons'
import { useState, useRef, useCallback, useEffect, FormEvent, ReactNode } from 'react'
import { OptionType } from './WizSelect'

export const NoResults = 'No results found'
export const CreateOption = 'Create new option'

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
}

export const InputSelect = ({
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
    [inputValue, options]
  )

  const onClear = useCallback(() => {
    onSelect(undefined)
    setInputValue('')
    textInputRef?.current?.focus()
  }, [onSelect])

  const onInputKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (!open) {
        setOpen(true)
      }

      switch (event.key) {
        case 'Backspace':
          !Array.isArray(value) && onSelect('')
          break
      }
    },
    [onSelect, open, setOpen]
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

        <TextInputGroupUtilities {...(!inputValue && !value ? { style: { display: 'none' } } : {})}>
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
}: SelectListOptionsProps) => (
  <SelectList isAriaMultiselectable={isMultiSelect}>
    {options.map((option, index) => {
      const isLastItem = index === options.length - 1
      const isSingleItem = options.length === 1
      const shouldSkipLastItem = isLastItem && !isSingleItem
      const isCreateOption = isSingleItem && isCreatable && value !== option
      const isSimpleOption = typeof option === 'string'

      if (shouldSkipLastItem) {
        return null
      }

      let displayText: string
      if (isCreateOption) {
        displayText = `${CreateOption} ${isSimpleOption ? option : option.value}`
      } else if (isSingleItem) {
        displayText = NoResults
      } else if (isSimpleOption) {
        displayText = option
      } else {
        displayText = option.label
      }

      return (
        <SelectOption
          id={isSimpleOption ? option : option.id || `option-${index}`}
          key={isSimpleOption ? option : option.id || `option-${index}`}
          value={!isSimpleOption ? option.id : option}
          description={!isSimpleOption ? option.description : undefined}
          isDisabled={displayText === NoResults || (!isSimpleOption && option.disabled)}
          onClick={isCreateOption ? () => onCreate?.(!isSimpleOption ? option.value : option) : undefined}
        >
          {displayText}
        </SelectOption>
      )
    })}
    {footer && <MenuFooter>{footer}</MenuFooter>}
  </SelectList>
)
