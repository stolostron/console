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
      if (!disabled) {
        if (!Array.isArray(value)) {
          onSelect('')
        }
        setOpen(true)
        switch (event.key) {
          case 'Backspace':
            !Array.isArray(value) && onSelect('')
            break
        }
      }
    },
    [disabled, onSelect, setOpen, value]
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
          <Button icon={<TimesIcon aria-hidden />} variant="plain" onClick={onClear} />
        </TextInputGroupUtilities>
      </TextInputGroup>
    </MenuToggle>
  )
}

type SelectListOptionsProps<T = any> = {
  value: string
  allOptions: string[] | OptionType<T>[]
  options: string[] | OptionType<T>[]
  footer?: ReactNode
  isCreatable?: boolean
  onCreate?: (value: string) => void
  isMultiSelect?: boolean
}

export const SelectListOptions = ({
  value,
  allOptions,
  options,
  isCreatable,
  onCreate,
  footer,
  isMultiSelect,
}: SelectListOptionsProps) => {
  const { noResults, createOption } = useStringContext()

  // Create a new Set from the array to remove any duplicates
  const uniqueOptions = [...new Set([...options])]
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
        const isSingleItem = uniqueOptions.length === 1
        const isSimpleOption = typeof option === 'string'
        const isEmptyOption = isSimpleOption
          ? option === ''
          : option.id === '' && option.label === '' && option.value === ''
        const isInputOption = typeof option !== 'string' && option.id === 'input'
        const valueString = String(isSimpleOption ? option : option.value)
        const labelString = String(isSimpleOption ? option : option.label)
        const isCustomOption =
          typeof allOptions[0] === 'string'
            ? (allOptions as string[]).filter((op) => op === valueString).length === 0
            : (allOptions as OptionType<any>[]).filter((op) => op.value === valueString).length === 0
        const isCreateOption =
          isLastItem &&
          isCreatable &&
          // checks if the user typed string is already selected
          (Array.isArray(value) ? !value.includes(valueString) : value !== valueString) &&
          // check if valueString exists in all options
          isCustomOption

        const shouldSkipLastItem =
          isLastItem &&
          ((!isCreatable && !isSingleItem) || (isCreatable && !isSingleItem && (isInputOption || valueString === '')))

        if (shouldSkipLastItem) {
          return null
        }

        let displayText: string
        if (isCreateOption) {
          displayText = `${createOption} "${valueString}"`
        } else if (isSingleItem && ((!isCreatable && !isInputOption && isCustomOption) || isEmptyOption)) {
          displayText = noResults
        } else {
          displayText = labelString
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
