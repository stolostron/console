/* Copyright Contributors to the Open Cluster Management project */

import {
  Button,
  FormGroup,
  MenuToggle,
  MenuToggleElement,
  Popover,
  Select,
  SelectProps,
  SelectList,
  TextInputGroup,
  TextInputGroupMain,
  TextInputGroupUtilities,
  SelectOptionProps,
  SelectOption,
} from '@patternfly/react-core'
import HelpIcon from '@patternfly/react-icons/dist/js/icons/help-icon'
import { Children, Fragment, isValidElement, ReactNode, useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from '../../lib/acm-i18next'
import { useValidationContext } from '../AcmForm/AcmForm'
import { AcmHelperText } from '../AcmHelperText/AcmHelperText'
import TimesIcon from '@patternfly/react-icons/dist/esm/icons/times-icon'

export enum SelectVariant {
  single = 'single',
  checkbox = 'checkbox',
  typeahead = 'typeahead',
  typeaheadMulti = 'typeaheadmulti',
}
export interface SelectOptionObject {
  /** Function returns a string to represent the select option object */
  toString(): string
  /** Function returns a true if the passed in select option is equal to this select option object, false otherwise */
  compareTo?(selectOption: any): boolean
}
let currentId = 0

type AcmSelectProps = Pick<
  SelectProps,
  Exclude<keyof SelectProps, 'toggle' | 'onToggle' | 'onChange' | 'selections' | 'onSelect'>
> & {
  id: string
  label: string
  value: string | undefined
  onChange: (value: string | undefined) => void
  validation?: (value: string | undefined) => string | undefined
  placeholder?: string
  labelHelp?: string
  labelHelpTitle?: ReactNode
  helperText?: ReactNode
  isRequired?: boolean
  isDisabled?: boolean
  variant?: SelectVariant | string
  toggleId?: string
  maxHeight?: string
  menuAppendTo?: string

  footer?: React.ReactNode
}
const NO_RESULTS = 'no results'

export function AcmSelect(props: AcmSelectProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selected, setSelected] = useState<string>(props.value || '')
  const [inputValue, setInputValue] = useState<string>('')
  const [filterValue, setFilterValue] = useState<string>('')
  const initialSelectOptions = Children.toArray(props.children).map((child) => {
    const value = (child as React.ReactElement).props.value
    return {
      value,
      children: value,
    }
  })
  const [selectOptions, setSelectOptions] = useState<SelectOptionProps[]>(initialSelectOptions)
  const [focusedItemIndex, setFocusedItemIndex] = useState<number | null>(null)
  const [activeItemId, setActiveItemId] = useState<string | null>(null)
  const ValidationContext = useValidationContext()
  const [validated, setValidated] = useState<'default' | 'success' | 'error' | 'warning'>('default')
  const [error, setError] = useState<string>('')
  const textInputRef = useRef<HTMLInputElement>()
  const { t } = useTranslation()
  const {
    validation,
    labelHelp,
    labelHelpTitle,
    helperText,
    isRequired,
    isDisabled,
    onChange,
    value,
    placeholder,
    toggleId,
    maxHeight,
    menuAppendTo,
    variant,
    children,
    ...selectProps
  } = props

  useLayoutEffect(() => {
    let error: string | undefined = undefined
    /* istanbul ignore else */
    if (props.hidden !== true) {
      if (isRequired) {
        if (props.value === undefined) {
          error = t('Required')
        } else if (props.value.trim() === '') {
          error = t('Required')
        }
      }
      if (!error && validation) {
        error = validation(props.value)
      }
    }
    setError(error ?? '')
    /* istanbul ignore next */
    if (ValidationContext.validate) {
      setValidated(error ? 'error' : 'default')
    }
    ValidationContext.setError(props.id, error)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.value, props.hidden])

  useLayoutEffect(() => {
    setValidated(error ? 'error' : 'default')
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ValidationContext.validate])

  const createItemId = (value: any) => `select-typeahead-${value.replace(' ', '-')}`

  const closeMenu = () => {
    setIsOpen(false)
    resetActiveAndFocusedItem()
  }

  const onTextInputChange = (_event: React.FormEvent<HTMLInputElement>, value: string) => {
    setInputValue(value)
    setFilterValue(value)

    resetActiveAndFocusedItem()

    if (value !== selected) {
      setSelected('')
    }
  }

  const handleMenuArrowKeys = (key: string) => {
    let indexToFocus = 0

    if (!isOpen) {
      setIsOpen(true)
    }

    if (selectOptions.every((option) => option.isDisabled)) {
      return
    }

    if (key === 'ArrowUp') {
      // When no index is set or at the first index, focus to the last, otherwise decrement focus index
      if (focusedItemIndex === null || focusedItemIndex === 0) {
        indexToFocus = selectOptions.length - 1
      } else {
        indexToFocus = focusedItemIndex - 1
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus--
        if (indexToFocus === -1) {
          indexToFocus = selectOptions.length - 1
        }
      }
    }

    if (key === 'ArrowDown') {
      // When no index is set or at the last index, focus to the first, otherwise increment focus index
      if (focusedItemIndex === null || focusedItemIndex === selectOptions.length - 1) {
        indexToFocus = 0
      } else {
        indexToFocus = focusedItemIndex + 1
      }

      // Skip disabled options
      while (selectOptions[indexToFocus].isDisabled) {
        indexToFocus++
        if (indexToFocus === selectOptions.length) {
          indexToFocus = 0
        }
      }
    }

    setActiveAndFocusedItem(indexToFocus)
  }

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const focusedItem = focusedItemIndex !== null ? selectOptions[focusedItemIndex] : null

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
    } else if (!inputValue) {
      closeMenu()
    }
  }

  const selectOption = (value: string | number, content: string | number) => {
    // eslint-disable-next-line no-console
    console.log('selected', content)

    setInputValue(String(content))
    setFilterValue('')
    setSelected(String(value))

    closeMenu()
  }

  useEffect(() => {
    let newSelectOptions: SelectOptionProps[] = initialSelectOptions

    // Filter menu items based on the text input value when one exists
    if (filterValue) {
      newSelectOptions = initialSelectOptions.filter((menuItem) =>
        String(menuItem.children).toLowerCase().includes(filterValue.toLowerCase())
      )

      // When no options are found after filtering, display 'No results found'
      if (!newSelectOptions.length) {
        newSelectOptions = [{ isAriaDisabled: true, children: t('No results found'), value: NO_RESULTS }]
      }

      // Open the menu when the input value changes and the new value is not empty
      if (!isOpen) {
        setIsOpen(true)
      }
    }

    setSelectOptions(newSelectOptions)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterValue])

  const setActiveAndFocusedItem = (itemIndex: number) => {
    setFocusedItemIndex(itemIndex)
    const focusedItem = selectOptions[itemIndex]
    setActiveItemId(createItemId(focusedItem.value))
  }

  const resetActiveAndFocusedItem = () => {
    setFocusedItemIndex(null)
    setActiveItemId(null)
  }

  const onToggleClick = () => {
    setIsOpen(!isOpen)
  }

  const onClearButtonClick = () => {
    setSelected('')
    setInputValue('')
    setFilterValue('')
    resetActiveAndFocusedItem()
    textInputRef?.current?.focus()
  }

  const selectToggleId = toggleId || `pf-select-toggle-id-${currentId++}`

  const onSelect = (_event: React.MouseEvent<Element, MouseEvent> | undefined, value: string | number | undefined) => {
    switch (variant) {
      default:
      case SelectVariant.single:
        setSelected(value as string)
        setIsOpen(false)
        break
      case SelectVariant.typeahead:
        if (value && value !== NO_RESULTS) {
          const optionText = selectOptions.find((option) => option.value === value)?.children
          onChange(value as string)
          selectOption(value, optionText as string)
        }
        break
    }
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
                width: '100%',
              } as React.CSSProperties
            }
          >
            {getDisplay(selected, props)}
          </MenuToggle>
        )
      case SelectVariant.typeahead:
        return (
          <MenuToggle
            ref={toggleRef}
            variant="typeahead"
            aria-label="Typeahead menu toggle"
            onClick={onToggleClick}
            isExpanded={isOpen}
            isFullWidth
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
                placeholder={placeholder}
                {...(activeItemId && { 'aria-activedescendant': activeItemId })}
                role="combobox"
                isExpanded={isOpen}
                aria-controls="select-typeahead-listbox"
              />

              <TextInputGroupUtilities {...(!inputValue ? { style: { display: 'none' } } : {})}>
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
  }

  const renderSelectList = () => {
    switch (variant) {
      default:
      case SelectVariant.single:
        return <SelectList style={{ maxHeight: maxHeight, overflowY: 'auto' }}>{children}</SelectList>
      case SelectVariant.typeahead:
        return (
          <SelectList id="select-typeahead-listbox" style={{ maxHeight: maxHeight, overflowY: 'auto' }}>
            {selectOptions.map((option, index) => (
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

  return (
    <FormGroup
      id={`${props.id}-label`}
      label={props.label}
      isRequired={isRequired}
      fieldId={props.id}
      hidden={props.hidden}
      onKeyDown={(event) => {
        if (event.key === 'Enter') {
          event.preventDefault()
        }
      }}
      labelIcon={
        /* istanbul ignore next */
        props.labelHelp ? (
          <Popover id={`${props.id}-label-help-popover`} headerContent={labelHelpTitle} bodyContent={labelHelp}>
            <Button
              variant="plain"
              id={`${props.id}-label-help-button`}
              aria-label={t('More info')}
              onClick={(e) => e.preventDefault()}
              className="pf-v5-c-form__group-label-help"
              style={{ ['--pf-v5-c-form__group-label-help--TranslateY' as any]: 0 }}
              icon={<HelpIcon />}
            />
          </Popover>
        ) : (
          <Fragment />
        )
      }
    >
      <Select
        style={{ width: 'auto' }}
        aria-labelledby={`${props.id}-label`}
        {...selectProps}
        isOpen={isOpen}
        toggle={renderMenuToggle}
        onSelect={onSelect}
      >
        {renderSelectList()}
      </Select>
      {validated === 'error' ? (
        <div style={{ borderTop: '1.75px solid red', paddingBottom: '6px' }}></div>
      ) : (
        <Fragment />
      )}
      <AcmHelperText controlId={props.id} helperText={helperText} validated={validated} error={error} />
    </FormGroup>
  )
}

// getting selected displayable value from options (from old patternfly)
function getDisplay(value: string | undefined, props: AcmSelectProps, type: 'node' | 'text' = 'node') {
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
  return props.variant == SelectVariant.typeahead || props.variant == SelectVariant.typeaheadMulti ? (
    props.placeholder
  ) : (
    <span style={{ color: '#666' }}>{props.placeholder}</span>
  )
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
